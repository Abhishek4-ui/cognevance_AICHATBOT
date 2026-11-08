# NeuroChat AI — REST API Endpoints Specification

All API endpoints are prefixed with `/api`. Protected routes require header:  
`Authorization: Bearer <jwt_token>`

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Auth | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | None | `{ email, username, password }` | Creates new user account |
| `POST` | `/api/auth/login` | None | `{ email, password }` | Authenticates and returns JWT token & user object |
| `GET` | `/api/auth/profile` | User | None | Returns active user profile |
| `PUT` | `/api/auth/profile` | User | `{ username?, current_password?, new_password? }` | Updates profile details |
| `POST` | `/api/auth/forgot-password`| None | `{ email }` | Generates reset token |
| `POST` | `/api/auth/reset-password` | None | `{ token, new_password }` | Sets new password via token |

---

## 2. Chat & Conversations (`/api/chat`)

| Method | Endpoint | Auth | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/chat/conversations` | User | None | Lists all user conversations |
| `POST` | `/api/chat/conversations` | User | `{ title? }` | Creates a new conversation session |
| `GET` | `/api/chat/conversations/<id>/messages` | User | None | Fetches all messages in conversation |
| `PUT` | `/api/chat/conversations/<id>` | User | `{ title }` | Renames conversation |
| `DELETE` | `/api/chat/conversations/<id>` | User | None | Deletes conversation and messages |
| `DELETE` | `/api/chat/conversations/<id>/clear` | User | None | Clears messages in conversation |
| `POST` | `/api/chat/message` | User | `{ conversation_id?, content, mode?, model_override? }` | Hybrid message inference |
| `POST` | `/api/chat/messages/<id>/feedback` | User | `{ rating: 'like'\|'dislike', comment? }` | Submits rating |

---

## 3. NLP & Model Operations (`/api/nlp`)

| Method | Endpoint | Auth | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/nlp/preprocess` | None | `{ text }` | Returns tokenization, lemmas, stems, NER, language |
| `POST` | `/api/nlp/classify` | None | `{ text, model? }` | Test intent classification without saving |
| `GET` | `/api/nlp/models` | None | None | Lists trained models, descriptions, metrics |
| `POST` | `/api/nlp/set-active-model` | Admin | `{ model }` | Switches active model in memory |
| `POST` | `/api/nlp/set-threshold` | Admin | `{ threshold }` | Sets confidence threshold (0.05 - 0.95) |
| `GET` | `/api/nlp/metrics` | None | None | Returns full evaluation report & confusion matrix |
| `POST` | `/api/nlp/similarity` | None | `{ text1, text2 }` | Computes cosine semantic similarity |

---

## 4. Admin Management (`/api/admin`)

| Method | Endpoint | Auth | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Admin | None | Returns live MongoDB telemetry & statistics |
| `GET` | `/api/admin/users` | Admin | None | Returns user accounts list |
| `PUT` | `/api/admin/users/<id>/toggle-status` | Admin | None | Activates/deactivates user |
| `GET` | `/api/admin/unanswered` | Admin | None | Lists low confidence queries queue |
| `POST` | `/api/admin/unanswered/<id>/resolve` | Admin | `{ status }` | Resolves query |
| `GET` | `/api/admin/feedback` | Admin | None | Lists all user ratings and feedback |
| `GET` | `/api/admin/logs` | Admin | None | Audit and security log stream |
| `POST` | `/api/admin/retrain` | Admin | None | Triggers real model retraining & reload |

---

## 5. PredictAI & Datasets (`/api/predictai`, `/api/datasets`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/predictai/all` | None | Returns Bank, Student, and Retail evaluations |
| `GET` | `/api/datasets/manifest` | None | Returns verified dataset manifest |
| `GET` | `/api/datasets/intents` | None | Returns trained intents directory |
| `POST` | `/api/datasets/intents` | Admin | Registers new custom domain intent |
| `GET` | `/api/health` | None | System infrastructure health check |
