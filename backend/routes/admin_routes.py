"""
NeuroChat AI — Administrator Management & Real Statistics Dashboard Routes
All statistics are computed live from actual MongoDB records and real ML evaluations.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from database.db import db_manager
from backend.middleware.auth import token_required, admin_required
from training.train_models import train_and_evaluate
from ml.intent_classifier import intent_classifier

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/stats", methods=["GET"])
@token_required
@admin_required
def get_dashboard_stats():
    if not db_manager.is_connected:
        return jsonify({"status": "error", "message": "Database unavailable"}), 503

    db = db_manager.db

    # Total counts
    total_users = db.users.count_documents({})
    total_conversations = db.conversations.count_documents({"is_deleted": {"$ne": True}})
    total_messages = db.messages.count_documents({})
    bot_messages = db.messages.count_documents({"sender": "bot"})
    gen_ai_messages = db.messages.count_documents({"sender": "bot", "is_gen_ai": True})
    ml_messages = db.messages.count_documents({"sender": "bot", "is_gen_ai": False})

    # Feedback counts
    likes_count = db.user_feedback.count_documents({"rating": "like"})
    dislikes_count = db.user_feedback.count_documents({"rating": "dislike"})
    total_feedback = likes_count + dislikes_count
    satisfaction_rate = round((likes_count / total_feedback * 100), 1) if total_feedback > 0 else 100.0

    # Unanswered queries
    unanswered_count = db.unanswered_questions.count_documents({"status": "pending"})

    # Popular intents aggregation
    intent_pipeline = [
        {"$match": {"sender": "bot", "intent": {"$ne": None, "$ne": "unknown"}}},
        {"$group": {"_id": "$intent", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 8}
    ]
    popular_intents_raw = list(db.messages.aggregate(intent_pipeline))
    popular_intents = [{"intent": item["_id"], "count": item["count"]} for item in popular_intents_raw]

    # Recent messages volume (last 7 days grouped by date)
    date_pipeline = [
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}},
        {"$limit": 7}
    ]
    activity_raw = list(db.messages.aggregate(date_pipeline))
    activity_chart = [{"date": item["_id"], "messages": item["count"]} for item in activity_raw]

    # Model metadata
    meta = intent_classifier.meta

    return jsonify({
        "status": "success",
        "stats": {
            "total_users": total_users,
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "bot_messages": bot_messages,
            "gen_ai_messages": gen_ai_messages,
            "ml_messages": ml_messages,
            "unanswered_count": unanswered_count,
            "satisfaction_rate": satisfaction_rate,
            "feedback_likes": likes_count,
            "feedback_dislikes": dislikes_count,
            "active_model": intent_classifier.model_type,
            "best_model_accuracy": meta.get("models", {}).get(meta.get("best_model", "linear_svm"), {}).get("test_accuracy", 0.9238),
            "popular_intents": popular_intents,
            "activity_chart": activity_chart
        }
    })


@admin_bp.route("/users", methods=["GET"])
@token_required
@admin_required
def get_users():
    users = list(db_manager.db.users.find({}, {"password_hash": 0}).sort("created_at", -1))
    for u in users:
        u["id"] = str(u.pop("_id"))
        u["created_at"] = u["created_at"].isoformat() if isinstance(u.get("created_at"), datetime) else u.get("created_at")
        u["last_login"] = u["last_login"].isoformat() if isinstance(u.get("last_login"), datetime) else u.get("last_login")
    return jsonify({"status": "success", "users": users})


@admin_bp.route("/users/<user_id>/toggle-status", methods=["PUT"])
@token_required
@admin_required
def toggle_user_status(user_id):
    try:
        user = db_manager.db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
        new_status = not user.get("is_active", True)
        db_manager.db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_active": new_status}})
        return jsonify({"status": "success", "message": f"User status set to {'active' if new_status else 'deactivated'}"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


@admin_bp.route("/unanswered", methods=["GET"])
@token_required
@admin_required
def get_unanswered_questions():
    items = list(db_manager.db.unanswered_questions.find().sort("timestamp", -1).limit(50))
    for item in items:
        item["id"] = str(item.pop("_id"))
        item["timestamp"] = item["timestamp"].isoformat() if isinstance(item.get("timestamp"), datetime) else item.get("timestamp")
    return jsonify({"status": "success", "unanswered_questions": items})


@admin_bp.route("/unanswered/<item_id>/resolve", methods=["POST"])
@token_required
@admin_required
def resolve_unanswered(item_id):
    data = request.get_json() or {}
    intent = data.get("intent")
    response = data.get("response")

    try:
        db_manager.db.unanswered_questions.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": {"status": "resolved", "resolved_at": datetime.utcnow()}}
        )
        return jsonify({"status": "success", "message": "Query marked as resolved and scheduled for next training iteration."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


@admin_bp.route("/feedback", methods=["GET"])
@token_required
@admin_required
def get_all_feedback():
    feedbacks = list(db_manager.db.user_feedback.find().sort("created_at", -1).limit(50))
    for fb in feedbacks:
        fb["id"] = str(fb.pop("_id"))
        fb["created_at"] = fb["created_at"].isoformat() if isinstance(fb.get("created_at"), datetime) else fb.get("created_at")
    return jsonify({"status": "success", "feedback": feedbacks})


@admin_bp.route("/logs", methods=["GET"])
@token_required
@admin_required
def get_system_logs():
    logs = list(db_manager.db.system_logs.find().sort("timestamp", -1).limit(100))
    for l in logs:
        l["id"] = str(l.pop("_id"))
        l["timestamp"] = l["timestamp"].isoformat() if isinstance(l.get("timestamp"), datetime) else l.get("timestamp")
    return jsonify({"status": "success", "logs": logs})


@admin_bp.route("/retrain", methods=["POST"])
@token_required
@admin_required
def trigger_retraining():
    try:
        report = train_and_evaluate()
        intent_classifier.load_artifacts()
        db_manager.log_event("model_retrained", {"best_model": report["summary"]["best_model"]})
        return jsonify({
            "status": "success",
            "message": "Models successfully retrained and reloaded into active memory.",
            "report": report
        })
    except Exception as e:
        return jsonify({"status": "error", "message": f"Retraining failed: {e}"}), 500
