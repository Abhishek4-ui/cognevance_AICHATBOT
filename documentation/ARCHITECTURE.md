# NeuroChat AI — System Architecture & Data Engineering Design
**Project Name**: NeuroChat AI  
**Academic Level**: BTech CSE – Artificial Intelligence & Machine Learning (Level 2)

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    User([End User / Web Browser]) -->|HTTP / JSON & WebSocket| Frontend[React 18 + Vite + Tailwind CSS UI]
    
    subgraph Frontend_Layer ["Client Presentation Layer (Port 5173)"]
        Frontend --> AuthState[AuthContext & JWT Session]
        AuthState --> Router[View Router: 12 Protected / Public Views]
        Router --> RechartsEngine[Recharts Performance Analytics]
        Router --> AxiosClient[Axios REST Client]
    end

    AxiosClient -->|REST API over Port 5000| FlaskServer[Flask Application Server]

    subgraph Backend_Layer ["Application & NLP Processing Core (Port 5000)"]
        FlaskServer --> JWTMiddleware[JWT & bcrypt RBAC Guard]
        JWTMiddleware --> RouteControllers[Blueprints: Auth, Chat, NLP, Admin, Datasets, PredictAI]
        
        RouteControllers --> Preprocessor[NLP Pipeline: spaCy, NLTK, Tokenizer, Lemmatizer]
        Preprocessor --> FeatureVec[TF-IDF N-Gram Vectorizer (4000 Features)]
        FeatureVec --> MLClassifier[Active ML Classifier: Linear SVM / Logistic Regression / Naive Bayes]
        
        MLClassifier --> DecisionRouter{Confidence >= Threshold?}
        DecisionRouter -->|Yes| CanonicalStore[Predefined Intent Knowledge Base]
        DecisionRouter -->|No / Open-Ended| GroqRouter[Groq Cloud LLM: Qwen 3.8 27B]
        DecisionRouter -->|No / Low Conf| UnansweredQueue[MongoDB Active Learning Queue]
    end

    subgraph Data_Layer ["Persistence & External Services"]
        FlaskServer --> AtlasDB[(MongoDB Atlas / Local MongoDB)]
        GroqRouter --> GroqAPI[Groq Inference Engine]
        FeatureVec --> DiskModels[Serialized Artifacts: .joblib & model_meta.json]
    end

    CanonicalStore --> ResponseBuilder[Unified Response Formatter]
    GroqRouter --> ResponseBuilder
    ResponseBuilder --> FlaskServer
```

---

## 2. Machine Learning Pipeline Specification

1. **Text Normalization**:
   - Unicode NFKD normalization, URL/email stripping, regex whitespace standardizer.
2. **Tokenization & Stopword Filtering**:
   - POS-aware token extraction via spaCy `en_core_web_sm` and NLTK fallback.
   - Whitelist protection for conversational interrogation words (`who`, `what`, `where`, `when`, `why`, `how`, `help`, `can`, `name`).
3. **Feature Extraction**:
   - `TfidfVectorizer(ngram_range=(1, 2), max_features=4000, sublinear_tf=True)`.
4. **Model Architecture**:
   - **Linear SVM**: Linear Support Vector Classifier with L2 penalty, dual optimization, and Platt probability calibration via `CalibratedClassifierCV`.
   - **Logistic Regression**: Multinomial cross-entropy with L-BFGS solver ($C=3.0$).
   - **Multinomial Naive Bayes**: Laplace smoothed count estimator ($\alpha=0.1$).
5. **Stratified 5-Fold Cross Validation**:
   - Evaluated without data leakage across 1,310 train samples and 328 test samples.

---

## 3. Database Schema Design (MongoDB Atlas)

| Collection | Key Fields | Indexes | Description |
| :--- | :--- | :--- | :--- |
| `users` | `_id`, `email`, `username`, `password_hash`, `role`, `is_active`, `created_at`, `last_login` | `email` (Unique), `username` | User credentials and role management |
| `conversations` | `_id`, `user_id`, `title`, `created_at`, `updated_at`, `is_deleted` | `user_id` + `updated_at` | Multi-session chat conversations |
| `messages` | `_id`, `conversation_id`, `user_id`, `sender`, `content`, `intent`, `confidence`, `model_used`, `is_gen_ai`, `latency_ms`, `tokens_used`, `feedback`, `timestamp` | `conversation_id` + `timestamp`, `intent` | Message history with real NLP telemetry |
| `unanswered_questions` | `_id`, `query_text`, `confidence`, `predicted_intent`, `user_id`, `timestamp`, `status` | `timestamp`, `status` | Active learning queue for human review |
| `user_feedback` | `_id`, `message_id`, `user_id`, `rating`, `comment`, `created_at` | `created_at` | User satisfaction tracking |
| `system_logs` | `_id`, `event_type`, `details`, `ip_address`, `timestamp`, `level` | `timestamp` | Audit and security logs |
