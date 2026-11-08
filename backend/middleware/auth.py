"""
NeuroChat AI — JWT Authentication & Role-Based Access Control (RBAC)
Provides:
- JWT token generation & verification
- bcrypt password hashing & verification
- @token_required decorator
- @admin_required decorator
"""

import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g
from dotenv import load_dotenv

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.dirname(BACKEND_DIR)
load_dotenv(os.path.join(BACKEND_DIR, ".env"))
load_dotenv(os.path.join(ROOT_DIR, ".env"))

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "neurochat_fallback_jwt_secret_key_123456789")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_DAYS = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_DAYS", "7"))


def hash_password(password: str) -> str:
    """Hashes password with bcrypt and salt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_password(password: str, hashed: str) -> bool:
    """Verifies plain password against bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def generate_token(user_id: str, email: str, role: str = "user", username: str = "") -> str:
    """Generates signed JWT token with expiry."""
    payload = {
        "sub": str(user_id),
        "email": email,
        "username": username,
        "role": role,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(days=JWT_EXPIRES_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decodes and validates JWT token."""
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        return {"error": "Token has expired"}
    except jwt.InvalidTokenError:
        return {"error": "Invalid token"}


def token_required(f):
    """Decorator ensuring valid JWT token is provided in Authorization header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"status": "error", "message": "Authorization header missing"}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"status": "error", "message": "Invalid token format. Use 'Bearer <token>'"}), 401

        token = parts[1]
        decoded = decode_token(token)
        if "error" in decoded:
            return jsonify({"status": "error", "message": decoded["error"]}), 401

        g.user = decoded
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Decorator ensuring authenticated user has role 'admin'."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(g, "user") or g.user.get("role") != "admin":
            return jsonify({"status": "error", "message": "Administrator privileges required"}), 403
        return f(*args, **kwargs)
    return decorated
