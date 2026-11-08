"""
NeuroChat AI — ML Intent Classifier Engine
Manages:
- Vectorization (TF-IDF with n-grams)
- Model inference: Multinomial Naive Bayes, Logistic Regression, Linear SVM
- Probability calibration & confidence scoring
- Unknown intent detection based on threshold
- Model serialization and dynamic reloading
"""

import os
import json
import joblib
import numpy as np
from nlp.preprocessor import preprocessor

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")


class IntentClassifier:
    def __init__(self, model_type: str = None, confidence_threshold: float = 0.25):
        self.vectorizer = None
        self.models = {}  # Holds 'naive_bayes', 'logistic_regression', 'linear_svm'
        self.label_encoder = None
        self.meta = {}
        self.intent_responses = {}
        self.load_artifacts()
        self.model_type = model_type or self.meta.get("active_model", "linear_svm")
        self.confidence_threshold = confidence_threshold

    def get_artifact_paths(self):
        return {
            "vectorizer": os.path.join(MODELS_DIR, "tfidf_vectorizer.joblib"),
            "naive_bayes": os.path.join(MODELS_DIR, "intent_naive_bayes.joblib"),
            "logistic_regression": os.path.join(MODELS_DIR, "intent_logistic_regression.joblib"),
            "linear_svm": os.path.join(MODELS_DIR, "intent_linear_svm.joblib"),
            "label_encoder": os.path.join(MODELS_DIR, "label_encoder.joblib"),
            "meta": os.path.join(MODELS_DIR, "model_meta.json"),
            "responses": os.path.join(MODELS_DIR, "intent_responses.json")
        }

    def load_artifacts(self) -> bool:
        """Loads all serialized models, vectorizers, and metadata."""
        paths = self.get_artifact_paths()
        try:
            if os.path.exists(paths["vectorizer"]):
                self.vectorizer = joblib.load(paths["vectorizer"])
            if os.path.exists(paths["label_encoder"]):
                self.label_encoder = joblib.load(paths["label_encoder"])

            for m in ["naive_bayes", "logistic_regression", "linear_svm"]:
                if os.path.exists(paths[m]):
                    self.models[m] = joblib.load(paths[m])

            if os.path.exists(paths["meta"]):
                with open(paths["meta"], "r", encoding="utf-8") as f:
                    self.meta = json.load(f)

            if os.path.exists(paths["responses"]):
                with open(paths["responses"], "r", encoding="utf-8") as f:
                    self.intent_responses = json.load(f)

            return bool(self.models and self.vectorizer and self.label_encoder)
        except Exception as e:
            print(f"Warning: Could not load trained models: {e}")
            return False

    def predict(self, text: str, model_name: str = None) -> dict:
        """
        Classifies input text intent.
        Returns:
            {
                "intent": str,
                "confidence": float,
                "is_unknown": bool,
                "model_used": str,
                "category": str,
                "preprocessed_text": str,
                "all_probabilities": dict (top 5),
                "entities": list,
                "language": dict
            }
        """
        # Step 1: Language detection & NLP Preprocessing
        lang_info = preprocessor.detect_language(text)
        entities = preprocessor.extract_entities(text)
        clean_text = preprocessor.preprocess_pipeline(text)

        # Fallback if models are not yet trained
        active_model_name = model_name or self.model_type
        if not self.models or active_model_name not in self.models or self.vectorizer is None:
            return {
                "intent": "unknown",
                "confidence": 0.0,
                "is_unknown": True,
                "model_used": "none",
                "category": "unknown",
                "preprocessed_text": clean_text,
                "all_probabilities": {},
                "entities": entities,
                "language": lang_info,
                "suggested_response": "Model is not yet initialized. Please trigger training."
            }

        # Handle empty preprocessed text
        if not clean_text:
            return {
                "intent": "unknown",
                "confidence": 0.0,
                "is_unknown": True,
                "model_used": active_model_name,
                "category": "unknown",
                "preprocessed_text": "",
                "all_probabilities": {},
                "entities": entities,
                "language": lang_info,
                "suggested_response": "Could you please rephrase that or provide more details?"
            }

        # Vectorize text
        X_vec = self.vectorizer.transform([clean_text])
        model = self.models[active_model_name]

        # Calculate vocabulary overlap (in-vocabulary token ratio)
        query_tokens = clean_text.split()
        in_vocab_count = sum(1 for tok in query_tokens if tok in self.vectorizer.vocabulary_)
        in_vocab_ratio = (in_vocab_count / len(query_tokens)) if query_tokens else 0.0

        # Get probabilities
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X_vec)[0]
        else:
            # Calibrated or decision function fallback
            df = model.decision_function(X_vec)
            # Softmax
            exp_df = np.exp(df - np.max(df))
            probs = (exp_df / exp_df.sum())[0]

        top_indices = np.argsort(probs)[::-1]
        top_idx = top_indices[0]
        confidence = float(probs[top_idx])
        predicted_label = self.label_encoder.inverse_transform([top_idx])[0]

        # Top 5 alternatives
        top_5_probs = {}
        for idx in top_indices[:5]:
            lbl = self.label_encoder.inverse_transform([idx])[0]
            top_5_probs[lbl] = round(float(probs[idx]), 4)

        # Check confidence threshold and vocabulary coverage for unknown intent
        # An intent is unknown if confidence is below threshold OR if less than 40% of key tokens are recognized in vocabulary
        is_unknown = (confidence < self.confidence_threshold) or (in_vocab_ratio < 0.40)
        final_intent = "unknown" if is_unknown else predicted_label

        # Fetch canned response if matched
        response_info = self.intent_responses.get(predicted_label, {})
        suggested_response = response_info.get("response", "") if not is_unknown else None
        category = response_info.get("category", "general")

        return {
            "intent": final_intent,
            "raw_predicted_intent": predicted_label,
            "confidence": round(confidence, 4),
            "is_unknown": is_unknown,
            "threshold": self.confidence_threshold,
            "model_used": active_model_name,
            "category": category,
            "preprocessed_text": clean_text,
            "all_probabilities": top_5_probs,
            "entities": entities,
            "language": lang_info,
            "suggested_response": suggested_response
        }


# Module instance
intent_classifier = IntentClassifier()
