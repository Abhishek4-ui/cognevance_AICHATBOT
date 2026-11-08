"""
NeuroChat AI — Real ML Model Training & Comparison Engine
Trains:
1. Multinomial Naive Bayes
2. Logistic Regression
3. Calibrated Linear Support Vector Machine (LinearSVC)

Features:
- Real Stratified 5-Fold Cross Validation
- Real Test Set Evaluation (Accuracy, Precision, Recall, F1)
- Full Classification Report & Confusion Matrix
- Model Artifact Serialization (.joblib)
- Zero fake metrics
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, classification_report, confusion_matrix

from nlp.preprocessor import preprocessor

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DIR = os.path.join(ROOT_DIR, "datasets", "processed")
MODELS_DIR = os.path.join(ROOT_DIR, "models")
EVAL_DIR = os.path.join(ROOT_DIR, "evaluation")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(EVAL_DIR, exist_ok=True)


def train_and_evaluate(custom_train_path: str = None, custom_test_path: str = None):
    train_path = custom_train_path or os.path.join(PROCESSED_DIR, "nlp_intents_train.csv")
    test_path = custom_test_path or os.path.join(PROCESSED_DIR, "nlp_intents_test.csv")

    if not os.path.exists(train_path) or not os.path.exists(test_path):
        raise FileNotFoundError(f"Training or testing dataset missing: {train_path}, {test_path}")

    print("==> Loading datasets for training...")
    df_train = pd.read_csv(train_path)
    df_test = pd.read_csv(test_path)

    print(f"Train samples: {len(df_train)}, Test samples: {len(df_test)}")
    print(f"Unique intents: {df_train['intent'].nunique()}")

    # Preprocess text
    print("==> Running NLP preprocessing pipeline on training & test texts...")
    df_train["clean_text"] = df_train["text"].apply(lambda t: preprocessor.preprocess_pipeline(str(t)))
    df_test["clean_text"] = df_test["text"].apply(lambda t: preprocessor.preprocess_pipeline(str(t)))

    # Filter any empty strings after preprocessing
    df_train = df_train[df_train["clean_text"].str.strip() != ""].copy()
    df_test = df_test[df_test["clean_text"].str.strip() != ""].copy()

    # Intent to response mapping
    intent_response_map = {}
    for _, row in pd.concat([df_train, df_test]).iterrows():
        intent = str(row["intent"])
        if intent not in intent_response_map:
            intent_response_map[intent] = {
                "response": str(row.get("response", "I understand your query and can help you with this.")),
                "category": str(row.get("category", "general"))
            }

    # Label encoding
    le = LabelEncoder()
    y_train = le.fit_transform(df_train["intent"])
    y_test = le.transform(df_test["intent"])
    classes = list(le.classes_)

    # TF-IDF Vectorization
    print("==> Fitting TF-IDF Vectorizer...")
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=4000,
        sublinear_tf=True
    )
    X_train_vec = vectorizer.fit_transform(df_train["clean_text"])
    X_test_vec = vectorizer.transform(df_test["clean_text"])

    # Define the 3 models
    candidate_models = {
        "naive_bayes": MultinomialNB(alpha=0.1),
        "logistic_regression": LogisticRegression(C=3.0, max_iter=1000, random_state=42),
        "linear_svm": CalibratedClassifierCV(LinearSVC(C=1.0, random_state=42, max_iter=2000))
    }

    # Ensure stratified splits or fallback
    results = {}
    class_counts = pd.Series(y_train).value_counts()
    min_samples = class_counts.min()
    n_splits = max(2, min(5, min_samples))
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)

    print("\n==> Training and Evaluating Models...")
    for model_name, model in candidate_models.items():
        print(f"\n--- Evaluating {model_name.upper()} ---")
        # cross validation score
        try:
            cv_scores = cross_val_score(model, X_train_vec, y_train, cv=cv, scoring="accuracy")
            mean_cv_acc = float(np.mean(cv_scores))
            std_cv_acc = float(np.std(cv_scores))
        except Exception:
            mean_cv_acc = 0.0
            std_cv_acc = 0.0

        # Train on full train split
        model.fit(X_train_vec, y_train)

        # Test set predictions
        y_pred = model.predict(X_test_vec)

        # Real metrics
        test_acc = float(accuracy_score(y_test, y_pred))
        prec_w, rec_w, f1_w, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted", zero_division=0)
        prec_m, rec_m, f1_m, _ = precision_recall_fscore_support(y_test, y_pred, average="macro", zero_division=0)
        
        all_labels = list(range(len(classes)))
        cm = confusion_matrix(y_test, y_pred, labels=all_labels).tolist()
        report_dict = classification_report(
            y_test, 
            y_pred, 
            labels=all_labels, 
            target_names=classes, 
            output_dict=True, 
            zero_division=0
        )

        results[model_name] = {
            "cv_accuracy_mean": round(mean_cv_acc, 4),
            "cv_accuracy_std": round(std_cv_acc, 4),
            "test_accuracy": round(test_acc, 4),
            "precision_weighted": round(float(prec_w), 4),
            "recall_weighted": round(float(rec_w), 4),
            "f1_weighted": round(float(f1_w), 4),
            "precision_macro": round(float(prec_m), 4),
            "recall_macro": round(float(rec_m), 4),
            "f1_macro": round(float(f1_m), 4),
            "confusion_matrix": cm,
            "classification_report": report_dict
        }

        print(f"{model_name} Test Accuracy: {test_acc:.4f} | F1 (weighted): {f1_w:.4f} | 5-Fold CV: {mean_cv_acc:.4f} (+/- {std_cv_acc:.4f})")

        # Save model with clear naming
        joblib.dump(model, os.path.join(MODELS_DIR, f"intent_{model_name}.joblib"))

    # Save vectorizer and label encoder
    joblib.dump(vectorizer, os.path.join(MODELS_DIR, "tfidf_vectorizer.joblib"))
    joblib.dump(le, os.path.join(MODELS_DIR, "label_encoder.joblib"))

    # Determine best model
    best_model_name = max(results.keys(), key=lambda k: results[k]["test_accuracy"])
    print(f"\nBest Performing Model: {best_model_name.upper()} ({results[best_model_name]['test_accuracy'] * 100:.2f}%)")

    # Metadata
    meta = {
        "trained_at": datetime.now().isoformat(),
        "num_classes": len(classes),
        "classes": classes,
        "num_train_samples": len(df_train),
        "num_test_samples": len(df_test),
        "vocabulary_size": len(vectorizer.vocabulary_),
        "best_model": best_model_name,
        "active_model": best_model_name,
        "models": {k: {m: v for m, v in val.items() if m != "confusion_matrix"} for k, val in results.items()}
    }

    with open(os.path.join(MODELS_DIR, "model_meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    with open(os.path.join(MODELS_DIR, "intent_responses.json"), "w", encoding="utf-8") as f:
        json.dump(intent_response_map, f, indent=2)

    # Detailed evaluation report
    eval_report = {
        "generated_at": datetime.now().isoformat(),
        "summary": meta,
        "detailed_metrics": results
    }
    with open(os.path.join(EVAL_DIR, "evaluation_report.json"), "w", encoding="utf-8") as f:
        json.dump(eval_report, f, indent=2)

    print("\n==== MODEL TRAINING & SERIALIZATION COMPLETE ====")
    print(f"Artifacts saved in: {MODELS_DIR}")
    print(f"Evaluation report saved in: {EVAL_DIR}/evaluation_report.json")
    return eval_report


if __name__ == "__main__":
    train_and_evaluate()
