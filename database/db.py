"""
NeuroChat AI — MongoDB Database Connection & Index Management
Connects to MongoDB Atlas (with local fallback if offline), initializes collections,
indexes, and default super admin user.
"""

import os
import certifi
import bcrypt
from datetime import datetime
from pymongo import MongoClient, ASCENDING, DESCENDING
from dotenv import load_dotenv

# Load backend environment variables
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BACKEND_DIR, "backend", ".env"))
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/neurochat_db")
MONGO_LOCAL_URI = os.getenv("MONGO_LOCAL_URI", "mongodb://localhost:27017/neurochat_db")
DB_NAME = "neurochat_db"


class Database:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_connected = False
        self.connect()

    def connect(self):
        # Attempt Atlas connection first
        try:
            print(f"Connecting to MongoDB Atlas...")
            self.client = MongoClient(
                MONGO_URI,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000
            )
            # Test connection
            self.client.admin.command("ping")
            self.db = self.client[DB_NAME]
            self.is_connected = True
            print("MongoDB Atlas connected successfully.")
        except Exception as e:
            print(f"MongoDB Atlas connection failed ({e}). Falling back to local MongoDB...")
            try:
                self.client = MongoClient(MONGO_LOCAL_URI, serverSelectionTimeoutMS=3000)
                self.client.admin.command("ping")
                self.db = self.client[DB_NAME]
                self.is_connected = True
                print("Connected to Local MongoDB.")
            except Exception as e2:
                print(f"FATAL: Could not connect to either Atlas or Local MongoDB: {e2}")
                self.is_connected = False
                return

        self.setup_indexes()
        self.seed_admin_if_needed()

    def setup_indexes(self):
        """Ensures optimized indexes for auth, chat queries, and admin metrics."""
        if not self.is_connected or self.db is None:
            return
        try:
            # Users
            self.db.users.create_index([("email", ASCENDING)], unique=True)
            self.db.users.create_index([("username", ASCENDING)])

            # Conversations
            self.db.conversations.create_index([("user_id", ASCENDING), ("updated_at", DESCENDING)])

            # Messages
            self.db.messages.create_index([("conversation_id", ASCENDING), ("timestamp", ASCENDING)])
            self.db.messages.create_index([("intent", ASCENDING)])

            # Feedback
            self.db.user_feedback.create_index([("created_at", DESCENDING)])

            # Unanswered Questions
            self.db.unanswered_questions.create_index([("timestamp", DESCENDING)])
            self.db.unanswered_questions.create_index([("status", ASCENDING)])

            # System logs
            self.db.system_logs.create_index([("timestamp", DESCENDING)])
        except Exception as e:
            print(f"Index creation note: {e}")

    def seed_admin_if_needed(self):
        """Seeds initial admin account from environment config."""
        if not self.is_connected or self.db is None:
            return
        admin_email = os.getenv("ADMIN_EMAIL", "admin@neurochat.ai").strip().lower()
        admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
        admin_name = os.getenv("ADMIN_NAME", "Super Admin")

        existing = self.db.users.find_one({"email": admin_email})
        if not existing:
            hashed_pw = bcrypt.hashpw(admin_pass.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            self.db.users.insert_one({
                "email": admin_email,
                "username": admin_name,
                "password_hash": hashed_pw,
                "role": "admin",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "last_login": None
            })
            print(f"Default Super Admin seeded: {admin_email}")

    def log_event(self, event_type: str, details: dict, level: str = "info", ip: str = None):
        """Records an audit/system event."""
        if not self.is_connected or self.db is None:
            return
        try:
            self.db.system_logs.insert_one({
                "event_type": event_type,
                "details": details,
                "level": level,
                "ip_address": ip or "127.0.0.1",
                "timestamp": datetime.utcnow()
            })
        except Exception as e:
            print(f"Log event error: {e}")


db_manager = Database()
