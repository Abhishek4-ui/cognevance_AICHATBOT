"""
NeuroChat AI — NLP Pipeline & Model Inspection Routes
"""

import os
import json
from flask import Blueprint, request, jsonify
from nlp.preprocessor import preprocessor
from ml.intent_classifier import intent_classifier
from backend.middleware.auth import token_required, admin_required

nlp_bp = Blueprint("nlp", __name__)

EVAL_REPORT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "evaluation", "evaluation_report.json"
)


@nlp_bp.route("/preprocess", methods=["POST"])
def inspect_preprocess():
    data = request.get_json() or {}
    text = data.get("text", "")

    if not text:
        return jsonify({"status": "error", "message": "Text is required"}), 400

    clean = preprocessor.clean_text(text)
    tokens = preprocessor.tokenize(text)
    lemmatized = preprocessor.preprocess_pipeline(text, use_lemmatization=True)
    stems = preprocessor.stem_tokens(tokens)
    entities = preprocessor.extract_entities(text)
    lang = preprocessor.detect_language(text)

    return jsonify({
        "status": "success",
        "original_text": text,
        "language_detection": lang,
        "cleaned_text": clean,
        "tokens": tokens,
        "token_count": len(tokens),
        "lemmatized_pipeline": lemmatized,
        "porter_stems": stems,
        "named_entities": entities
    })


@nlp_bp.route("/classify", methods=["POST"])
def classify_intent():
    data = request.get_json() or {}
    text = data.get("text", "")
    model_override = data.get("model")

    if not text:
        return jsonify({"status": "error", "message": "Text is required"}), 400

    result = intent_classifier.predict(text, model_name=model_override)
    return jsonify({
        "status": "success",
        "result": result
    })


@nlp_bp.route("/models", methods=["GET"])
def get_models():
    meta = intent_classifier.meta
    models_info = [
        {
            "id": "naive_bayes",
            "name": "Multinomial Naive Bayes",
            "type": "Probabilistic Classifier",
            "description": "Fast baseline using Bayes theorem with TF-IDF features and Laplace smoothing.",
            "metrics": meta.get("models", {}).get("naive_bayes", {})
        },
        {
            "id": "logistic_regression",
            "name": "Logistic Regression (L2 Regularized)",
            "type": "Linear Generalized Model",
            "description": "Optimized multinomial logistic regression with cross-entropy loss.",
            "metrics": meta.get("models", {}).get("logistic_regression", {})
        },
        {
            "id": "linear_svm",
            "name": "Calibrated Linear SVM (Support Vector Machine)",
            "type": "Maximum Margin Classifier",
            "description": "High-dimensional hyperplane separator with Platt probability calibration.",
            "metrics": meta.get("models", {}).get("linear_svm", {})
        }
    ]

    return jsonify({
        "status": "success",
        "active_model": intent_classifier.model_type,
        "best_model": meta.get("best_model", "linear_svm"),
        "confidence_threshold": intent_classifier.confidence_threshold,
        "num_classes": meta.get("num_classes", 0),
        "trained_at": meta.get("trained_at"),
        "models": models_info
    })


@nlp_bp.route("/set-active-model", methods=["POST"])
@token_required
@admin_required
def set_active_model():
    data = request.get_json() or {}
    model_name = data.get("model")
    valid_models = ["naive_bayes", "logistic_regression", "linear_svm"]

    if model_name not in valid_models:
        return jsonify({"status": "error", "message": f"Invalid model. Choose from: {valid_models}"}), 400

    intent_classifier.model_type = model_name

    # Update metadata file
    meta_path = intent_classifier.get_artifact_paths()["meta"]
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        meta["active_model"] = model_name
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)

    return jsonify({
        "status": "success",
        "message": f"Active model switched to {model_name}",
        "active_model": model_name
    })


@nlp_bp.route("/set-threshold", methods=["POST"])
@token_required
@admin_required
def set_threshold():
    data = request.get_json() or {}
    threshold = float(data.get("threshold", 0.25))
    if not (0.05 <= threshold <= 0.95):
        return jsonify({"status": "error", "message": "Threshold must be between 0.05 and 0.95"}), 400

    intent_classifier.confidence_threshold = threshold
    return jsonify({
        "status": "success",
        "message": f"Confidence threshold set to {threshold}",
        "threshold": threshold
    })


@nlp_bp.route("/metrics", methods=["GET"])
def get_metrics():
    if not os.path.exists(EVAL_REPORT_PATH):
        return jsonify({"status": "error", "message": "Evaluation report not found"}), 404

    with open(EVAL_REPORT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    return jsonify({
        "status": "success",
        "evaluation": data
    })


@nlp_bp.route("/similarity", methods=["POST"])
def check_similarity():
    data = request.get_json() or {}
    text1 = data.get("text1", "")
    text2 = data.get("text2", "")

    if not text1 or not text2:
        return jsonify({"status": "error", "message": "Both text1 and text2 are required"}), 400

    score = preprocessor.compute_similarity(text1, text2)
    return jsonify({
        "status": "success",
        "text1": text1,
        "text2": text2,
        "similarity_score": round(score, 4)
    })
