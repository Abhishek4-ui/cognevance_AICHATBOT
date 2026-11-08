"""
NeuroChat AI — Authentication & User Profile Routes
"""

from flask import Blueprint, request, jsonify, g
from datetime import datetime
from bson import ObjectId
from database.db import db_manager
from backend.middleware.auth import hash_password, check_password, generate_token, token_required

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not email or "@" not in email:
        return jsonify({"status": "error", "message": "Valid email address is required"}), 400
    if not username or len(username) < 2:
        return jsonify({"status": "error", "message": "Username must be at least 2 characters"}), 400
    if not password or len(password) < 6:
        return jsonify({"status": "error", "message": "Password must be at least 6 characters"}), 400

    if not db_manager.is_connected or db_manager.db is None:
        return jsonify({"status": "error", "message": "Database service unavailable"}), 503

    existing = db_manager.db.users.find_one({"email": email})
    if existing:
        return jsonify({"status": "error", "message": "An account with this email already exists"}), 409

    hashed_pw = hash_password(password)
    new_user = {
        "email": email,
        "username": username,
        "password_hash": hashed_pw,
        "role": "user",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "last_login": datetime.utcnow()
    }
    result = db_manager.db.users.insert_one(new_user)
    user_id = str(result.inserted_id)

    token = generate_token(user_id=user_id, email=email, role="user", username=username)
    db_manager.log_event("user_registered", {"email": email, "user_id": user_id}, ip=request.remote_addr)

    return jsonify({
        "status": "success",
        "message": "Account created successfully",
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "username": username,
            "role": "user"
        }
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password are required"}), 400

    if not db_manager.is_connected or db_manager.db is None:
        return jsonify({"status": "error", "message": "Database service unavailable"}), 503

    user = db_manager.db.users.find_one({"email": email})
    if not user or not check_password(password, user.get("password_hash", "")):
        return jsonify({"status": "error", "message": "Invalid email or password"}), 401

    if not user.get("is_active", True):
        return jsonify({"status": "error", "message": "This account has been deactivated. Please contact an admin."}), 403

    user_id = str(user["_id"])
    role = user.get("role", "user")
    username = user.get("username", email.split("@")[0])

    # Update last login
    db_manager.db.users.update_one({"_id": user["_id"]}, {"$set": {"last_login": datetime.utcnow()}})
    token = generate_token(user_id=user_id, email=email, role=role, username=username)
    db_manager.log_event("user_login", {"email": email, "user_id": user_id}, ip=request.remote_addr)

    return jsonify({
        "status": "success",
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "username": username,
            "role": role
        }
    })


@auth_bp.route("/profile", methods=["GET"])
@token_required
def get_profile():
    user_id = g.user["sub"]
    try:
        user = db_manager.db.users.find_one({"_id": ObjectId(user_id)}, {"password_hash": 0})
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
        user["id"] = str(user.pop("_id"))
        return jsonify({"status": "success", "user": user})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@auth_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile():
    user_id = g.user["sub"]
    data = request.get_json() or {}
    updates = {}

    if "username" in data and len(data["username"].strip()) >= 2:
        updates["username"] = data["username"].strip()

    if "new_password" in data and len(data["new_password"]) >= 6:
        current_password = data.get("current_password")
        if not current_password:
            return jsonify({"status": "error", "message": "Current password required to update password"}), 400
        user = db_manager.db.users.find_one({"_id": ObjectId(user_id)})
        if not user or not check_password(current_password, user.get("password_hash", "")):
            return jsonify({"status": "error", "message": "Incorrect current password"}), 401
        updates["password_hash"] = hash_password(data["new_password"])

    if not updates:
        return jsonify({"status": "error", "message": "No valid fields provided to update"}), 400

    db_manager.db.users.update_one({"_id": ObjectId(user_id)}, {"$set": updates})
    return jsonify({"status": "success", "message": "Profile updated successfully"})


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    if not email:
        return jsonify({"status": "error", "message": "Email is required"}), 400

    user = db_manager.db.users.find_one({"email": email})
    # Secure token generation
    reset_token = generate_token(user_id=str(user["_id"]) if user else "guest", email=email, role="reset")
    print(f"\n[PASSWORD RESET TOKEN for {email}]: {reset_token}\n")

    return jsonify({
        "status": "success",
        "message": "If an account exists with this email, a password reset link has been dispatched.",
        "debug_reset_token": reset_token  # Provided for local evaluation
    })


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    reset_token = data.get("token")
    new_password = data.get("new_password")

    if not reset_token or not new_password or len(new_password) < 6:
        return jsonify({"status": "error", "message": "Valid reset token and new password (min 6 chars) required"}), 400

    from backend.middleware.auth import decode_token
    decoded = decode_token(reset_token)
    if "error" in decoded or decoded.get("role") != "reset":
        return jsonify({"status": "error", "message": "Invalid or expired reset token"}), 400

    email = decoded.get("email")
    db_manager.db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(new_password)}})
    return jsonify({"status": "success", "message": "Password successfully reset. You may now log in."})
