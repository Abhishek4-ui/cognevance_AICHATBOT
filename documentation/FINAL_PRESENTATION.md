# NeuroChat AI — Project Presentation Slide Deck Outline
**Project**: NeuroChat AI (BTech CSE AI/ML Level 2 Major Project)

---

### Slide 1: Title & Overview
- **Title**: NeuroChat AI: Full-Stack Conversational Intelligence with Real NLP & Machine Learning
- **Author**: Abhishek Kumar (BTech CSE AI/ML)
- **Tech Stack**: Python 3.11+, Flask REST API, spaCy, NLTK, Scikit-learn, React 18, Tailwind CSS, MongoDB Atlas, Groq Cloud LLM

### Slide 2: Motivation & Problem Statement
- Limitations of pure rule-based bots (rigid, brittle, no semantic understanding).
- Limitations of pure LLM wrappers (slow latency, recurring token costs, non-deterministic hallucinations, offline inability).
- Solution: Hybrid architecture combining local fast ML intent classification with contextual generative AI fallback.

### Slide 3: Linguistic NLP Pipeline
- Normalization, tokenization, stopword filtering with query token whitelisting.
- Morphological lemmatization via spaCy POS tagger + WordNet fallback.
- Named Entity Recognition (NER) for entities (Organizations, Geopolitical Entities, Persons, Dates).
- Automatic language detection (English, Devanagari Hindi, Hinglish phonetics).

### Slide 4: Real Machine Learning Models & Training
- Trained on CLINC150, Bitext Customer Support, and AIML domain data (1,638 total samples, 36 classes).
- Model 1: Multinomial Naive Bayes (Laplace smoothing).
- Model 2: Logistic Regression (Multinomial cross-entropy with L2 regularization).
- Model 3: Calibrated Linear SVM (Maximum margin separation with Platt probability scaling).

### Slide 5: Empirical Results & Confusion Matrix
- **Linear SVM Best Test Accuracy**: 92.38% (5-Fold CV: 90.23%, F1: 91.46%).
- **Logistic Regression**: 89.33% (5-Fold CV: 87.48%, F1: 87.10%).
- **Multinomial Naive Bayes**: 88.72% (5-Fold CV: 86.56%, F1: 86.42%).
- Fully interactive Confusion Matrix and Classification Report in UI.

### Slide 6: PredictAI — Classification, Regression & Clustering
- **UCI Bank Marketing**: 89.06% accuracy in predicting term deposit subscription.
- **UCI Student Performance**: Regression $R^2 = 0.824$, RMSE $= 1.90$ for final grade prediction.
- **UCI Online Retail**: RFM K-Means customer segmentation ($K=4$, Silhouette Score $= 0.850$).

### Slide 7: Database Architecture & Security
- MongoDB Atlas cloud cluster with automatic failover to local MongoDB.
- Collections: Users, Conversations, Messages, Unanswered Questions, Feedback, System Logs.
- Security: bcrypt password hashing (12 rounds salt), signed JWT tokens, RBAC (Admin/User).

### Slide 8: Live System Demonstration
- Walkthrough of Chat Dashboard: model switcher, confidence meter, follow-up chips, feedback ratings.
- NLP Analytics Page: live token and NER visualizer.
- Model Performance Page: Recharts bar chart comparisons.
- Admin Hub: live user metrics, unanswered questions active learning resolution, one-click retrain.

### Slide 9: DevOps & Deployment
- Docker containerization for both backend and frontend.
- Render & Vercel deployment configuration.
- Health checks at `/api/health`.

### Slide 10: Conclusion & Future Scope
- Summary of Level 2 deliverables: zero fabricated data, 100% automated test pass rate.
- Future work: Speech-to-text integration, vector embeddings with ChromaDB/Milvus, agentic tool invocation.
