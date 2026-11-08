import pytest
from nlp.preprocessor import preprocessor
from ml.intent_classifier import intent_classifier


def test_nlp_cleaning_and_tokenization():
    text = "Hello! Can you please explain Tokenization in NLP? https://example.com"
    clean = preprocessor.clean_text(text)
    assert "https" not in clean
    assert "tokenization" in clean

    tokens = preprocessor.tokenize(text)
    assert len(tokens) > 3


def test_language_detection():
    en_res = preprocessor.detect_language("How do neural networks work?")
    assert en_res["language"] == "en"

    hi_en_res = preprocessor.detect_language("namaste bhai mujhe help chahiye kaise kare")
    assert hi_en_res["language"] == "hi-en"


def test_intent_prediction():
    res = intent_classifier.predict("what is tf-idf in nlp?")
    assert "intent" in res
    assert res["intent"] == "nlp_tfidf"
    assert res["confidence"] > 0.3
    assert res["is_unknown"] is False


def test_entity_recognition():
    text = "Google acquired DeepMind in London."
    entities = preprocessor.extract_entities(text)
    entity_labels = [e["label"] for e in entities]
    assert any(label in ["ORG", "GPE"] for label in entity_labels)
