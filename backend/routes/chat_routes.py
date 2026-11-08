"""
NeuroChat AI — Chat & Conversation Engine Routes
Provides:
- Multi-session chat conversations
- Hybrid ML Intent Classification + Groq Generative AI routing
- Active learning (recording unanswered/low confidence questions)
- Message ratings & feedback
- Conversation renaming, clearing, and deletion
"""

from flask import Blueprint, request, jsonify, g
from datetime import datetime
from bson import ObjectId
from database.db import db_manager
from backend.middleware.auth import token_required
from ml.intent_classifier import intent_classifier
from backend.services.genai_service import genai_service

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/conversations", methods=["GET"])
@token_required
def get_conversations():
    user_id = g.user["sub"]
    if not db_manager.is_connected:
        return jsonify({"status": "error", "message": "Database unavailable"}), 503

    convs = list(db_manager.db.conversations.find(
        {"user_id": user_id, "is_deleted": {"$ne": True}}
    ).sort("updated_at", -1))

    for c in convs:
        c["id"] = str(c.pop("_id"))
        c["created_at"] = c["created_at"].isoformat() if isinstance(c.get("created_at"), datetime) else c.get("created_at")
        c["updated_at"] = c["updated_at"].isoformat() if isinstance(c.get("updated_at"), datetime) else c.get("updated_at")

    return jsonify({"status": "success", "conversations": convs})


@chat_bp.route("/conversations", methods=["POST"])
@token_required
def create_conversation():
    user_id = g.user["sub"]
    data = request.get_json() or {}
    title = data.get("title", "New Conversation").strip()

    now = datetime.utcnow()
    new_conv = {
        "user_id": user_id,
        "title": title,
        "created_at": now,
        "updated_at": now,
        "is_deleted": False
    }
    res = db_manager.db.conversations.insert_one(new_conv)
    conv_id = str(res.inserted_id)

    return jsonify({
        "status": "success",
        "conversation": {
            "id": conv_id,
            "title": title,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
    }), 201


@chat_bp.route("/conversations/<conv_id>/messages", methods=["GET"])
@token_required
def get_messages(conv_id):
    user_id = g.user["sub"]
    try:
        # Verify ownership
        conv = db_manager.db.conversations.find_one({"_id": ObjectId(conv_id), "user_id": user_id})
        if not conv:
            return jsonify({"status": "error", "message": "Conversation not found"}), 404

        msgs = list(db_manager.db.messages.find({"conversation_id": conv_id}).sort("timestamp", 1))
        for m in msgs:
            m["id"] = str(m.pop("_id"))
            m["timestamp"] = m["timestamp"].isoformat() if isinstance(m.get("timestamp"), datetime) else m.get("timestamp")

        return jsonify({"status": "success", "messages": msgs})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


@chat_bp.route("/conversations/<conv_id>", methods=["PUT"])
@token_required
def update_conversation(conv_id):
    user_id = g.user["sub"]
    data = request.get_json() or {}
    new_title = data.get("title", "").strip()
    if not new_title:
        return jsonify({"status": "error", "message": "Title cannot be empty"}), 400

    try:
        res = db_manager.db.conversations.update_one(
            {"_id": ObjectId(conv_id), "user_id": user_id},
            {"$set": {"title": new_title, "updated_at": datetime.utcnow()}}
        )
        if res.matched_count == 0:
            return jsonify({"status": "error", "message": "Conversation not found"}), 404
        return jsonify({"status": "success", "message": "Conversation renamed successfully"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


@chat_bp.route("/conversations/<conv_id>", methods=["DELETE"])
@token_required
def delete_conversation(conv_id):
    user_id = g.user["sub"]
    try:
        db_manager.db.conversations.update_one(
            {"_id": ObjectId(conv_id), "user_id": user_id},
            {"$set": {"is_deleted": True, "updated_at": datetime.utcnow()}}
        )
        # Delete associated messages
        db_manager.db.messages.delete_many({"conversation_id": conv_id})
        return jsonify({"status": "success", "message": "Conversation deleted"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


@chat_bp.route("/conversations/<conv_id>/clear", methods=["DELETE"])
@token_required
def clear_conversation(conv_id):
    user_id = g.user["sub"]
    try:
        conv = db_manager.db.conversations.find_one({"_id": ObjectId(conv_id), "user_id": user_id})
        if not conv:
            return jsonify({"status": "error", "message": "Conversation not found"}), 404
        db_manager.db.messages.delete_many({"conversation_id": conv_id})
        return jsonify({"status": "success", "message": "Chat history cleared"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


@chat_bp.route("/message", methods=["POST"])
@token_required
def send_message():
    user_id = g.user["sub"]
    data = request.get_json() or {}
    content = data.get("content", "").strip()
    conv_id = data.get("conversation_id")
    mode = data.get("mode", "auto")  # 'auto', 'ml_only', 'genai_only'
    model_override = data.get("model_override")

    if not content:
        return jsonify({"status": "error", "message": "Message content cannot be empty"}), 400

    # Ensure valid or newly created conversation
    if not conv_id:
        new_title = genai_service.summarize_title(content)
        new_conv = {
            "user_id": user_id,
            "title": new_title,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_deleted": False
        }
        res_conv = db_manager.db.conversations.insert_one(new_conv)
        conv_id = str(res_conv.inserted_id)
    else:
        # Check if this is the first message in the conversation, rename dynamically
        msg_count = db_manager.db.messages.count_documents({"conversation_id": conv_id})
        if msg_count == 0:
            new_title = genai_service.summarize_title(content)
            db_manager.db.conversations.update_one(
                {"_id": ObjectId(conv_id)},
                {"$set": {"title": new_title}}
            )

    now = datetime.utcnow()

    # Step 1: Save User Message
    user_msg_doc = {
        "conversation_id": conv_id,
        "user_id": user_id,
        "sender": "user",
        "content": content,
        "timestamp": now
    }
    user_msg_res = db_manager.db.messages.insert_one(user_msg_doc)
    user_msg_id = str(user_msg_res.inserted_id)

    # Step 2: NLP & ML Intent Classification
    nlp_result = intent_classifier.predict(content, model_name=model_override)

    # Step 3: Determine Bot Response Strategy
    use_gen_ai = False
    bot_response_text = ""
    provider_name = ""
    tokens_used = 0
    latency_ms = 0.0
    follow_up_questions = []

    pure_greeting_intents = {"greeting_hello", "greeting_goodbye", "greeting_thanks"}

    if mode == "genai_only":
        use_gen_ai = True
    elif mode == "ml_only":
        use_gen_ai = False
    else:
        # Auto mode:
        # High confidence pure greetings get instant greeting responses;
        # ALL other questions, explanations, and queries route to GenAI for deep, organized answers.
        if (nlp_result.get("intent") in pure_greeting_intents 
            and nlp_result.get("confidence", 0) >= 0.70 
            and nlp_result.get("suggested_response")):
            use_gen_ai = False
        else:
            use_gen_ai = genai_service.is_available

    if use_gen_ai:
        # Fetch recent messages for multi-turn conversational context
        recent_history = list(db_manager.db.messages.find(
            {"conversation_id": conv_id}
        ).sort("timestamp", -1).limit(6))
        recent_history.reverse()

        gen_res = genai_service.generate_chat_response(content, conversation_history=recent_history)
        bot_response_text = gen_res["content"]
        provider_name = gen_res["provider"]
        tokens_used = gen_res["tokens_used"]
        latency_ms = gen_res["latency_ms"]
        follow_up_questions = gen_res.get("follow_up_questions", [])
    else:
        # Pure Machine Learning Intent Response
        bot_response_text = nlp_result.get("suggested_response") or "I identified your query intent but have no canonical response registered. An admin will update this response."
        provider_name = f"ML Intent Classifier ({nlp_result['model_used']})"
        latency_ms = 4.2
        follow_up_questions = [
            "Can you explain more details about this topic?",
            "What related machine learning concepts are available?"
        ]

    # Active Learning: Save to unanswered questions if low confidence or unknown intent
    if nlp_result["is_unknown"]:
        db_manager.db.unanswered_questions.insert_one({
            "query_text": content,
            "confidence": nlp_result["confidence"],
            "predicted_intent": nlp_result.get("raw_predicted_intent"),
            "user_id": user_id,
            "timestamp": now,
            "status": "pending"
        })

    # Step 4: Save Bot Message
    bot_msg_doc = {
        "conversation_id": conv_id,
        "user_id": user_id,
        "sender": "bot",
        "content": bot_response_text,
        "intent": nlp_result["intent"],
        "confidence": nlp_result["confidence"],
        "model_used": nlp_result["model_used"],
        "is_gen_ai": use_gen_ai,
        "provider": provider_name,
        "tokens_used": tokens_used,
        "latency_ms": latency_ms,
        "language": nlp_result["language"],
        "entities": nlp_result["entities"],
        "follow_up_questions": follow_up_questions,
        "feedback": None,
        "timestamp": datetime.utcnow()
    }
    bot_msg_res = db_manager.db.messages.insert_one(bot_msg_doc)
    bot_msg_id = str(bot_msg_res.inserted_id)

    # Update conversation's updated_at
    db_manager.db.conversations.update_one(
        {"_id": ObjectId(conv_id)},
        {"$set": {"updated_at": datetime.utcnow()}}
    )

    return jsonify({
        "status": "success",
        "conversation_id": conv_id,
        "user_message": {
            "id": user_msg_id,
            "sender": "user",
            "content": content,
            "timestamp": now.isoformat()
        },
        "bot_message": {
            "id": bot_msg_id,
            "sender": "bot",
            "content": bot_response_text,
            "intent": nlp_result["intent"],
            "confidence": nlp_result["confidence"],
            "model_used": nlp_result["model_used"],
            "is_gen_ai": use_gen_ai,
            "provider": provider_name,
            "tokens_used": tokens_used,
            "latency_ms": latency_ms,
            "language": nlp_result["language"],
            "entities": nlp_result["entities"],
            "follow_up_questions": follow_up_questions,
            "timestamp": bot_msg_doc["timestamp"].isoformat()
        },
        "nlp_analysis": nlp_result
    })


@chat_bp.route("/messages/<msg_id>/feedback", methods=["POST"])
@token_required
def submit_feedback(msg_id):
    user_id = g.user["sub"]
    data = request.get_json() or {}
    rating = data.get("rating")  # 'like' or 'dislike'
    comment = data.get("comment", "").strip()

    if rating not in ["like", "dislike"]:
        return jsonify({"status": "error", "message": "Rating must be 'like' or 'dislike'"}), 400

    try:
        # Update message document
        db_manager.db.messages.update_one(
            {"_id": ObjectId(msg_id)},
            {"$set": {"feedback": rating}}
        )

        # Record feedback document
        db_manager.db.user_feedback.insert_one({
            "message_id": msg_id,
            "user_id": user_id,
            "rating": rating,
            "comment": comment,
            "created_at": datetime.utcnow()
        })
        return jsonify({"status": "success", "message": "Feedback submitted successfully"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400
