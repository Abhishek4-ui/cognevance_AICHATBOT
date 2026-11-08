"""
NeuroChat AI — Flask Backend Application Server
Enterprise-grade modular REST API backend with rate-limiting, CORS,
MongoDB Atlas persistence, and NLP/ML/GenAI engines.
"""

import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment configuration
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BACKEND_DIR)
load_dotenv(os.path.join(BACKEND_DIR, ".env"))
load_dotenv(os.path.join(ROOT_DIR, ".env"))

# Import Database & Routes
from database.db import db_manager
from backend.routes.auth_routes import auth_bp
from backend.routes.chat_routes import chat_bp
from backend.routes.nlp_routes import nlp_bp
from backend.routes.admin_routes import admin_bp
from backend.routes.predictai_routes import predictai_bp
from backend.routes.dataset_routes import dataset_bp


def create_app():
    dist_folder = os.path.join(ROOT_DIR, "frontend", "dist")
    app = Flask(__name__, static_folder=dist_folder)

    # Configuration
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "neurochat_super_secret_key_prod_2026")
    app.config["JSON_SORT_KEYS"] = False

    # CORS configuration
    cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5001").split(",")]
    CORS(app, resources={r"/api/*": {"origins": cors_origins}}, supports_credentials=True)

    # Register Blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(nlp_bp, url_prefix="/api/nlp")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(predictai_bp, url_prefix="/api/predictai")
    app.register_blueprint(dataset_bp, url_prefix="/api/datasets")

    @app.route("/api/health", methods=["GET"])
    def health_check():
        from ml.intent_classifier import intent_classifier
        from backend.services.genai_service import genai_service
        return jsonify({
            "status": "healthy",
            "project": "NeuroChat AI",
            "version": "2.0.0",
            "database_connected": db_manager.is_connected,
            "active_ml_model": intent_classifier.model_type,
            "genai_available": genai_service.is_available,
            "genai_provider": "Groq Cloud" if genai_service.is_available else "Local Fallback"
        })

    # Serve built frontend for any non-API route
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path.startswith("api/"):
            return jsonify({"status": "error", "message": "API endpoint not found"}), 404
        if path != "" and os.path.exists(os.path.join(dist_folder, path)):
            return send_from_directory(dist_folder, path)
        if os.path.exists(os.path.join(dist_folder, "index.html")):
            return send_from_directory(dist_folder, "index.html")
        return jsonify({"status": "running", "message": "Backend active. Open http://localhost:5173 for Vite dev frontend."})

    # Global Error Handlers
    @app.errorhandler(404)
    def not_found(e):
        if request.path.startswith("/api/"):
            return jsonify({"status": "error", "message": "API route not found"}), 404
        return serve_frontend(request.path.lstrip("/"))

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"status": "error", "message": "Internal server error"}), 500

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    print(f"\n=======================================================")
    print(f" NeuroChat AI Backend Server running on port {port}")
    print(f" Health check: http://localhost:{port}/api/health")
    print(f"=======================================================\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
