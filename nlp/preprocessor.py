"""
NeuroChat AI — NLP Preprocessing Engine
Handles:
- Text normalization & cleaning
- Tokenization (NLTK & spaCy)
- Lowercasing
- Stopword removal (English, Hindi transliteration)
- Lemmatization (spaCy & WordNet)
- Stemming (PorterStemmer)
- Named Entity Recognition (spaCy NER)
- Language Detection (English, Hindi, Hinglish)
- Semantic Text Similarity
"""

import re
import string
import unicodedata
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer, WordNetLemmatizer
import spacy

# Load spaCy model
try:
    nlp_spacy = spacy.load("en_core_web_sm")
except Exception:
    nlp_spacy = None

# Initialize NLTK utilities
try:
    english_stopwords = set(stopwords.words("english"))
except Exception:
    english_stopwords = set()

# Common Hinglish stopwords & markers
HINGLISH_STOPWORDS = {
    "kya", "hai", "hain", "kaise", "batao", "mujhe", "mera", "meri", "yeh", "woh",
    "karna", "kar", "sakte", "sakta", "hoti", "hota", "aur", "ki", "ko", "se",
    "mein", "par", "bhi", "tha", "thi", "the", "aap", "tum", "hum", "nahi", "mat"
}

porter_stemmer = PorterStemmer()
wordnet_lemmatizer = WordNetLemmatizer()


# Whitelist important query words that spaCy or NLTK might overly filter
CRITICAL_QUERY_TOKENS = {"name", "who", "what", "where", "when", "why", "how", "help", "can", "ai", "ml", "nlp"}

class NLPPreprocessor:
    def __init__(self):
        self.spacy_model = nlp_spacy
        self.stop_words = set(english_stopwords) - CRITICAL_QUERY_TOKENS
        self.hinglish_stopwords = HINGLISH_STOPWORDS
        self.stemmer = porter_stemmer
        self.lemmatizer = wordnet_lemmatizer

    def detect_language(self, text: str) -> dict:
        """
        Detects language of input: English ('en'), Devanagari Hindi ('hi'), or Hinglish ('hi-en').
        """
        if not text or not text.strip():
            return {"language": "en", "confidence": 1.0, "type": "empty"}

        # Check for Devanagari Unicode block (\u0900-\u097F)
        devanagari_chars = len(re.findall(r"[\u0900-\u097F]", text))
        total_alpha = len(re.findall(r"[a-zA-Z\u0900-\u097F]", text))

        if total_alpha > 0 and (devanagari_chars / total_alpha) > 0.3:
            return {"language": "hi", "confidence": round(devanagari_chars / total_alpha, 2), "type": "devanagari"}

        # Check for Hinglish markers in Latin text
        tokens = [w.lower() for w in re.findall(r"\b[a-zA-Z]+\b", text)]
        hinglish_hits = sum(1 for t in tokens if t in self.hinglish_stopwords)
        if tokens and (hinglish_hits / len(tokens)) >= 0.2:
            return {"language": "hi-en", "confidence": round(hinglish_hits / len(tokens), 2), "type": "hinglish"}

        return {"language": "en", "confidence": 0.95, "type": "latin_english"}

    def normalize(self, text: str) -> str:
        """
        Standardizes text: unicode normal form, removes extraneous whitespace and non-standard chars.
        """
        if not text:
            return ""
        # Unicode normalization
        text = unicodedata.normalize("NFKD", str(text))
        # Remove URLs
        text = re.sub(r"https?://\S+|www\.\S+", "", text)
        # Remove emails
        text = re.sub(r"\S+@\S+", "", text)
        # Replace multiple spaces/newlines
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def clean_text(self, text: str, remove_punct: bool = True) -> str:
        """
        Full text cleaning pipeline: lowercased, normalized, punctuation stripped.
        """
        text = self.normalize(text).lower()
        if remove_punct:
            text = text.translate(str.maketrans("", "", string.punctuation))
        return text.strip()

    def tokenize(self, text: str, method: str = "spacy") -> list:
        """
        Tokenizes string using spaCy (preferred) or regex fallback.
        """
        clean = self.normalize(text)
        if method == "spacy" and self.spacy_model:
            doc = self.spacy_model(clean)
            return [token.text for token in doc if not token.is_space]
        return re.findall(r"\b\w+\b", clean)

    def preprocess_pipeline(self, text: str, use_lemmatization: bool = True, remove_stops: bool = True) -> str:
        """
        Complete end-to-end NLP preprocessing:
        1. Normalization & lowercasing
        2. Tokenization
        3. Stopword removal (language aware)
        4. Lemmatization (spaCy POS-aware or WordNet)
        Returns clean string suitable for TF-IDF vectorization.
        """
        cleaned = self.clean_text(text)
        if not cleaned:
            return ""

        lang_info = self.detect_language(text)

        if self.spacy_model and lang_info["language"] == "en":
            doc = self.spacy_model(cleaned)
            processed_tokens = []
            all_lemmas = []
            for token in doc:
                if token.is_punct or token.is_space:
                    continue
                lemma = token.lemma_.strip() if use_lemmatization else token.text.strip()
                if not lemma or lemma == "-PRON-":
                    lemma = token.text.strip()
                all_lemmas.append(lemma)
                
                # Check stop words (respect critical tokens)
                if remove_stops and (token.is_stop or token.text in self.stop_words):
                    if token.text.lower() not in CRITICAL_QUERY_TOKENS and lemma.lower() not in CRITICAL_QUERY_TOKENS:
                        continue
                processed_tokens.append(lemma)

            # If overly filtered, retain all lemmas
            if not processed_tokens and all_lemmas:
                processed_tokens = all_lemmas
            return " ".join(processed_tokens)
        else:
            # Fallback NLTK tokenization + WordNet lemmatizer
            tokens = re.findall(r"\b\w+\b", cleaned)
            processed_tokens = []
            for t in tokens:
                lemma = self.lemmatizer.lemmatize(t) if use_lemmatization else t
                if remove_stops:
                    if (t in self.stop_words or t in self.hinglish_stopwords) and t not in CRITICAL_QUERY_TOKENS:
                        continue
                processed_tokens.append(lemma)
            if not processed_tokens and tokens:
                processed_tokens = [self.lemmatizer.lemmatize(t) for t in tokens]
            return " ".join(processed_tokens)

    def stem_tokens(self, tokens: list) -> list:
        """
        Applies Porter Stemmer to a list of tokens.
        """
        return [self.stemmer.stem(t) for t in tokens]

    def extract_entities(self, text: str) -> list:
        """
        Performs Named Entity Recognition (NER) via spaCy.
        Returns list of dicts: [{'text': 'Google', 'label': 'ORG', 'start': 0, 'end': 6}]
        """
        if not self.spacy_model or not text:
            return []
        doc = self.spacy_model(text)
        entities = []
        for ent in doc.ents:
            entities.append({
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char
            })
        return entities

    def compute_similarity(self, text1: str, text2: str) -> float:
        """
        Computes cosine semantic similarity between two texts using spaCy vectors.
        """
        if not self.spacy_model:
            # Jaccard similarity fallback
            set1 = set(self.tokenize(text1))
            set2 = set(self.tokenize(text2))
            if not set1 or not set2:
                return 0.0
            return len(set1 & set2) / len(set1 | set2)

        doc1 = self.spacy_model(text1)
        doc2 = self.spacy_model(text2)
        if doc1.has_vector and doc2.has_vector and doc1.vector_norm and doc2.vector_norm:
            return float(doc1.similarity(doc2))
        else:
            # Jaccard fallback
            tokens1 = set([t.lower_ for t in doc1 if not t.is_stop and not t.is_punct])
            tokens2 = set([t.lower_ for t in doc2 if not t.is_stop and not t.is_punct])
            if not tokens1 or not tokens2:
                return 0.0
            return float(len(tokens1 & tokens2) / len(tokens1 | tokens2))


# Module singleton instance
preprocessor = NLPPreprocessor()
