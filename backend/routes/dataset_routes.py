"""
NeuroChat AI — Dataset Management & Manifest Inspection Routes
"""

import os
import json
import pandas as pd
from flask import Blueprint, request, jsonify
from backend.middleware.auth import token_required, admin_required

dataset_bp = Blueprint("datasets", __name__)

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MANIFEST_PATH = os.path.join(ROOT_DIR, "datasets", "manifest.json")
RESPONSES_PATH = os.path.join(ROOT_DIR, "models", "intent_responses.json")
TRAIN_CSV = os.path.join(ROOT_DIR, "datasets", "processed", "nlp_intents_train.csv")


@dataset_bp.route("/manifest", methods=["GET"])
def get_manifest():
    if not os.path.exists(MANIFEST_PATH):
        return jsonify({"status": "error", "message": "Manifest not found"}), 404
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return jsonify({"status": "success", "manifest": data})


@dataset_bp.route("/intents", methods=["GET"])
def get_intents_list():
    if not os.path.exists(RESPONSES_PATH):
        return jsonify({"status": "error", "message": "Responses not found"}), 404

    with open(RESPONSES_PATH, "r", encoding="utf-8") as f:
        responses = json.load(f)

    counts = {}
    if os.path.exists(TRAIN_CSV):
        df = pd.read_csv(TRAIN_CSV)
        counts = df["intent"].value_counts().to_dict()

    intent_list = []
    for intent_name, info in responses.items():
        intent_list.append({
            "intent": intent_name,
            "category": info.get("category", "general"),
            "response": info.get("response", ""),
            "train_examples_count": int(counts.get(intent_name, 0))
        })

    return jsonify({"status": "success", "intents": intent_list})


@dataset_bp.route("/intents", methods=["POST"])
@token_required
@admin_required
def add_or_update_intent():
    data = request.get_json() or {}
    intent = data.get("intent", "").strip()
    response = data.get("response", "").strip()
    category = data.get("category", "general").strip()
    examples = data.get("examples", [])

    if not intent or not response:
        return jsonify({"status": "error", "message": "Intent name and response are required"}), 400

    # Update intent_responses.json
    with open(RESPONSES_PATH, "r", encoding="utf-8") as f:
        responses = json.load(f)

    responses[intent] = {
        "response": response,
        "category": category
    }

    with open(RESPONSES_PATH, "w", encoding="utf-8") as f:
        json.dump(responses, f, indent=2)

    # Append examples to train CSV if provided
    if examples and os.path.exists(TRAIN_CSV):
        new_rows = []
        for ex in examples:
            if ex.strip():
                new_rows.append({
                    "text": ex.strip(),
                    "intent": intent,
                    "category": category,
                    "response": response
                })
        if new_rows:
            df_new = pd.DataFrame(new_rows)
            df_new.to_csv(TRAIN_CSV, mode="a", header=False, index=False)

    return jsonify({
        "status": "success",
        "message": f"Intent '{intent}' registered/updated. Trigger Retrain to update model weights."
    })
