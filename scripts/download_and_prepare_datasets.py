"""
Automated Real Training Dataset Ingestion & Preprocessing Pipeline
Collects real datasets:
1. CLINC150 Intent Classification (Official GitHub repo)
2. Bitext Customer Support Dataset (HuggingFace)
3. UCI Bank Marketing (Classification)
4. UCI Student Performance (Regression)
5. UCI Online Retail (Clustering)
6. BTech CSE AI/ML Domain Intents (NLP, ML, Deep Learning, Python, FAQs)

Verifies data quality, removes duplicates, handles missing values,
generates train/val/test splits, and outputs a certified dataset manifest.
"""

import os
import io
import json
import zipfile
import certifi
import requests
import pandas as pd
import numpy as np
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(ROOT_DIR, "datasets", "raw")
PROCESSED_DIR = os.path.join(ROOT_DIR, "datasets", "processed")
MANIFEST_PATH = os.path.join(ROOT_DIR, "datasets", "manifest.json")

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

manifest = {
    "generated_at": datetime.utcnow().isoformat() + "Z",
    "project": "NeuroChat AI",
    "datasets": {}
}

# -------------------------------------------------------------
# 1. CLINC150 Dataset
# -------------------------------------------------------------
print("==> Processing CLINC150 Intent Dataset...")
clinc_url = "https://raw.githubusercontent.com/clinc/oos-eval/master/data/data_small.json"
try:
    r = requests.get(clinc_url, verify=certifi.where(), timeout=30)
    if r.status_code == 200:
        clinc_data = r.json()
        raw_clinc_path = os.path.join(RAW_DIR, "clinc150_small.json")
        with open(raw_clinc_path, "w", encoding="utf-8") as f:
            json.dump(clinc_data, f, indent=2)

        # Build train/val/test frames
        clinc_records = []
        for split in ["train", "val", "test"]:
            for item in clinc_data[split]:
                text, intent = item[0], item[1]
                clinc_records.append({
                    "text": text,
                    "intent": intent,
                    "split": split,
                    "source": "CLINC150",
                    "category": intent.split("_")[0] if "_" in intent else "general"
                })
        df_clinc = pd.DataFrame(clinc_records)
        df_clinc.drop_duplicates(subset=["text"], inplace=True)
        df_clinc.dropna(subset=["text", "intent"], inplace=True)
        
        manifest["datasets"]["CLINC150"] = {
            "source_url": clinc_url,
            "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
            "total_records": len(df_clinc),
            "num_intents": int(df_clinc["intent"].nunique()),
            "missing_values": int(df_clinc.isnull().sum().sum()),
            "duplicates_removed": len(clinc_records) - len(df_clinc),
            "splits": df_clinc["split"].value_counts().to_dict(),
            "status": "verified_and_processed"
        }
        df_clinc.to_csv(os.path.join(PROCESSED_DIR, "clinc150_clean.csv"), index=False)
        print(f"CLINC150 successfully processed: {len(df_clinc)} clean records across {df_clinc['intent'].nunique()} intents.")
except Exception as e:
    print(f"Error processing CLINC150: {e}")

# -------------------------------------------------------------
# 2. Bitext Customer Support Dataset
# -------------------------------------------------------------
print("==> Processing Bitext Customer Support Dataset...")
bitext_url = "https://huggingface.co/datasets/bitext/Bitext-customer-support-llm-chatbot-training-dataset/resolve/main/Bitext_Sample_Customer_Support_Training_Dataset_27K_responses-v11.csv"
try:
    r = requests.get(bitext_url, verify=certifi.where(), timeout=60)
    if r.status_code == 200:
        raw_bitext_path = os.path.join(RAW_DIR, "bitext_raw.csv")
        with open(raw_bitext_path, "wb") as f:
            f.write(r.content)
            
        df_bitext_raw = pd.read_csv(raw_bitext_path)
        initial_count = len(df_bitext_raw)
        df_bitext = df_bitext_raw.rename(columns={"instruction": "text"})
        df_bitext = df_bitext[["text", "category", "intent", "response"]].dropna().drop_duplicates(subset=["text"])
        df_bitext["source"] = "Bitext"
        
        manifest["datasets"]["Bitext_Customer_Support"] = {
            "source_url": bitext_url,
            "license": "Apache 2.0 / Open Data Commons",
            "total_records": len(df_bitext),
            "initial_raw_records": initial_count,
            "num_intents": int(df_bitext["intent"].nunique()),
            "categories": df_bitext["category"].unique().tolist(),
            "missing_values": int(df_bitext.isnull().sum().sum()),
            "duplicates_removed": initial_count - len(df_bitext),
            "status": "verified_and_processed"
        }
        df_bitext.to_csv(os.path.join(PROCESSED_DIR, "bitext_clean.csv"), index=False)
        print(f"Bitext successfully processed: {len(df_bitext)} clean records across {df_bitext['intent'].nunique()} intents.")
except Exception as e:
    print(f"Error processing Bitext: {e}")

# -------------------------------------------------------------
# 3. Curated BTech CSE AIML Intent Knowledge Base
# -------------------------------------------------------------
print("==> Creating BTech CSE AI/ML Domain Intents...")
aiml_intents = [
    # NLP Questions
    {"text": "what is natural language processing", "intent": "nlp_definition", "category": "nlp", "response": "Natural Language Processing (NLP) is a subfield of AI focused on enabling computers to understand, interpret, and generate human language using statistical, ML, and deep learning techniques."},
    {"text": "explain tokenization in nlp", "intent": "nlp_tokenization", "category": "nlp", "response": "Tokenization is the process of breaking down raw text into smaller semantic units called tokens, such as words, subwords, or punctuation."},
    {"text": "what is tf-idf and how does it work", "intent": "nlp_tfidf", "category": "nlp", "response": "TF-IDF (Term Frequency - Inverse Document Frequency) measures how important a word is to a document relative to a corpus by weighting high frequency in a document against its frequency across all documents."},
    {"text": "difference between stemming and lemmatization", "intent": "nlp_lemmatization", "category": "nlp", "response": "Stemming applies heuristic rules to chop off word affixes (often producing non-words), whereas lemmatization uses vocabulary and morphological analysis to return valid dictionary root words (lemmas)."},
    {"text": "what is named entity recognition", "intent": "nlp_ner", "category": "nlp", "response": "Named Entity Recognition (NER) identifies and categorizes key entities in text into predefined classes such as person names, organizations, locations, dates, and quantities."},
    {"text": "how do word embeddings like word2vec work", "intent": "nlp_embeddings", "category": "nlp", "response": "Word embeddings map discrete words into continuous dense vector spaces where semantically similar words have close geometric proximity based on distributional context."},
    
    # ML Questions
    {"text": "explain supervised vs unsupervised learning", "intent": "ml_paradigms", "category": "ml", "response": "Supervised learning trains models on labeled input-output pairs to predict outcomes, while unsupervised learning discovers inherent patterns, clusters, and structures in unlabeled data."},
    {"text": "what is overfitting and how to prevent it", "intent": "ml_overfitting", "category": "ml", "response": "Overfitting occurs when a model learns noise and specific details of training data rather than general patterns. It is prevented using regularization (L1/L2), cross-validation, dropout, data augmentation, and pruning."},
    {"text": "how does logistic regression work", "intent": "ml_logistic_regression", "category": "ml", "response": "Logistic Regression applies the sigmoid function to a linear combination of input features to predict the probability of a binary categorical outcome."},
    {"text": "what is support vector machine", "intent": "ml_svm", "category": "ml", "response": "Support Vector Machine (SVM) finds the optimal hyperplane that maximizes the margin of separation between distinct classes in high-dimensional feature space."},
    {"text": "difference between precision recall and f1 score", "intent": "ml_metrics", "category": "ml", "response": "Precision is TP / (TP + FP) (correct positive predictions), Recall is TP / (TP + FN) (actual positives caught), and F1-score is the harmonic mean balancing precision and recall."},
    {"text": "what is confusion matrix", "intent": "ml_confusion_matrix", "category": "ml", "response": "A Confusion Matrix is a performance table comparing actual ground truth labels against model predictions across True Positives, True Negatives, False Positives, and False Negatives."},
    {"text": "explain cross validation in machine learning", "intent": "ml_cross_validation", "category": "ml", "response": "K-Fold Cross-Validation partitions data into K subsets, iteratively training on K-1 folds and validating on the remaining fold to assess model generalization without data leakage."},

    # Deep Learning & AI
    {"text": "what is a neural network", "intent": "dl_neural_network", "category": "deep_learning", "response": "An Artificial Neural Network is a computational architecture inspired by biological neural circuits, composed of layers of interconnected nodes (neurons) that learn non-linear representations via forward propagation and backpropagation."},
    {"text": "what is backpropagation", "intent": "dl_backprop", "category": "deep_learning", "response": "Backpropagation calculates the gradient of the loss function with respect to each model weight using the chain rule of calculus to update weights via gradient descent."},
    {"text": "what are transformers in ai", "intent": "dl_transformers", "category": "deep_learning", "response": "The Transformer is a deep learning architecture that relies entirely on self-attention mechanisms to model global dependencies between input tokens in parallel without sequential recurrence."},

    # System & Assistant Intents
    {"text": "hello", "intent": "greeting", "category": "general", "response": "Hello! I am NeuroChat AI, your intelligent assistant powered by real NLP and Machine Learning. How can I assist you today?"},
    {"text": "hi there", "intent": "greeting", "category": "general", "response": "Hi! Welcome to NeuroChat AI. Ask me anything about Machine Learning, NLP, or use our analytics and training tools."},
    {"text": "who are you", "intent": "bot_identity", "category": "general", "response": "I am NeuroChat AI, an enterprise-grade AI chatbot system built with Python Flask, React, spaCy, NLTK, and Scikit-learn."},
    {"text": "what can you do", "intent": "bot_capabilities", "category": "general", "response": "I can classify intents using trained ML models (Naive Bayes, SVM, Logistic Regression), extract NLP entities, track chat history, analyze datasets, and fallback to generative AI (Groq Qwen/Llama) for open-ended queries."},
    {"text": "goodbye", "intent": "farewell", "category": "general", "response": "Goodbye! Have a productive day ahead. Feel free to return if you have more questions."},
    {"text": "thank you", "intent": "gratitude", "category": "general", "response": "You are very welcome! Let me know if you need anything else."}
]

# Expand intent examples for robust model training
expanded_aiml = []
variations = {
    "nlp_definition": ["what does nlp mean", "define nlp", "tell me about natural language processing", "can you explain nlp"],
    "nlp_tokenization": ["how does word tokenization work", "what are tokens in text", "tokenization meaning", "explain breaking sentences into words"],
    "nlp_tfidf": ["define tf-idf", "what is term frequency inverse document frequency", "explain tfidf weighting", "how does tf-idf vectorize text"],
    "nlp_lemmatization": ["lemmatization vs stemming", "stemming and lemmatization differences", "what is a lemma in nlp", "why use lemmatization"],
    "nlp_ner": ["define named entity recognition", "what does ner do", "how does entity extraction work in spacy", "named entities in text"],
    "nlp_embeddings": ["what are word vectors", "explain word embeddings", "how does word2vec represent words", "vector representations of text"],
    "ml_paradigms": ["what is the difference between supervised and unsupervised learning", "explain supervised vs unsupervised", "supervised learning vs unsupervised learning"],
    "ml_overfitting": ["how do i fix overfitting in my model", "what is model overfitting", "techniques to prevent overfitting", "high variance in machine learning"],
    "ml_logistic_regression": ["how does logistic regression classify", "explain logistic regression algorithm", "what is sigmoid activation in logistic regression"],
    "ml_svm": ["how does support vector classifier work", "explain support vector machines", "what is the kernel trick in svm", "svm hyperplane explanation"],
    "ml_metrics": ["difference between precision and recall", "how to calculate f1 score", "when to use precision vs recall", "evaluation metrics in ml"],
    "ml_confusion_matrix": ["what is a confusion matrix in machine learning", "explain false positive and false negative", "how to interpret confusion matrix"],
    "ml_cross_validation": ["what is k fold cross validation", "how does cross validation work", "why do we use cross validation"],
    "dl_neural_network": ["how do artificial neural networks work", "explain deep neural networks", "what are hidden layers in a neural network"],
    "dl_backprop": ["how does backpropagation calculate gradients", "explain the backpropagation algorithm", "chain rule in neural networks"],
    "dl_transformers": ["what is attention mechanism in transformers", "explain self-attention architecture", "how do transformer models work"],
    "greeting": [
        "hey", "hey there", "good morning", "good evening", "greetings", "namaste", "halo",
        "hello bot", "hi friend", "hello there", "good day", "howdy", "sup", "what's up",
        "hi", "hello", "hiya", "welcome", "glad to be here", "yo", "morning", "evening"
    ],
    "bot_identity": [
        "what is your name", "tell me about yourself", "who made you", "what system is this",
        "who are you", "what are you called", "introduce yourself", "identity", "your name please",
        "who created neurochat", "what chatbot is this"
    ],
    "bot_capabilities": [
        "help me", "what are your features", "what tasks can you perform", "how do i use neurochat",
        "what can you do", "show features", "what can you help with", "list capabilities",
        "guide me", "how to use this app"
    ],
    "farewell": [
        "bye", "see you later", "catch you soon", "talk to you later", "exit", "quit",
        "goodbye", "have a nice day", "farewell", "cya", "signing off", "bye bye"
    ],
    "gratitude": [
        "thanks a lot", "thanks", "appreciate your help", "much obliged", "awesome thanks",
        "thank you so much", "many thanks", "helpful", "thanks buddy", "great thanks"
    ]
}

for base in aiml_intents:
    expanded_aiml.append(base)
    for var_text in variations.get(base["intent"], []):
        expanded_aiml.append({
            "text": var_text,
            "intent": base["intent"],
            "category": base["category"],
            "response": base["response"]
        })

df_aiml = pd.DataFrame(expanded_aiml)
df_aiml.to_csv(os.path.join(PROCESSED_DIR, "aiml_domain_intents.csv"), index=False)
print(f"BTech AIML Intents processed: {len(df_aiml)} samples across {df_aiml['intent'].nunique()} intents.")

# -------------------------------------------------------------
# 4. Master Consolidated Chatbot Intent Training Set
# -------------------------------------------------------------
print("==> Building Master Training Dataset for Chatbot...")
# Combine AIML domain intents with top high-quality intents from CLINC and Bitext
master_records = []
for _, row in df_aiml.iterrows():
    master_records.append({
        "text": row["text"],
        "intent": row["intent"],
        "category": row["category"],
        "response": row["response"]
    })

# Select 15 top common conversational and utility intents from CLINC150
if "CLINC150" in manifest["datasets"]:
    df_clinc_clean = pd.read_csv(os.path.join(PROCESSED_DIR, "clinc150_clean.csv"))
    selected_clinc_intents = [
        "what_can_i_ask_you", "user_name", "timezone", "time", "date", 
        "weather", "reminder", "calculator", "definition", "order_status",
        "pin_change", "account_blocked", "transfer", "bill_balance", "transactions"
    ]
    df_clinc_sub = df_clinc_clean[df_clinc_clean["intent"].isin(selected_clinc_intents)].copy()
    
    # Standard responses for CLINC intents
    clinc_response_map = {
        "what_can_i_ask_you": "You can ask me questions about NLP, Machine Learning, Deep Learning algorithms, or check system analytics.",
        "user_name": "I can identify your user profile from your secure session.",
        "timezone": "The server system runs on standard UTC time and adapts to your client time.",
        "time": "You can check current conversation timestamps on every message bubble.",
        "date": "Today's date is managed through the system clock and conversation logs.",
        "weather": "Weather queries can be augmented with real-time API integrations or generative fallback.",
        "reminder": "Reminders and tasks can be logged to your session memory.",
        "calculator": "I can evaluate mathematical expressions and machine learning equations.",
        "definition": "Provide any computer science term, and I will define its mathematical and practical meaning.",
        "order_status": "Your recent order status is logged in the database records.",
        "pin_change": "Security PIN changes require authenticated multi-factor verification.",
        "account_blocked": "If your account is locked, an administrator can unlock it via the Admin Dashboard.",
        "transfer": "Funds transfer requires elevated user verification and ledger confirmation.",
        "bill_balance": "Your current ledger balance is available in your account overview.",
        "transactions": "All transactions and interaction histories are recorded securely in MongoDB."
    }
    for _, row in df_clinc_sub.iterrows():
        master_records.append({
            "text": row["text"],
            "intent": row["intent"],
            "category": "service",
            "response": clinc_response_map.get(row["intent"], "Request processed by NeuroChat service handler.")
        })

df_master = pd.DataFrame(master_records)
df_master.drop_duplicates(subset=["text"], inplace=True)
df_master.dropna(subset=["text", "intent"], inplace=True)

# Train / Test split (80% / 20%) stratified by intent
from sklearn.model_selection import train_test_split
train_df, test_df = train_test_split(df_master, test_size=0.20, random_state=42, stratify=df_master["intent"])

train_df.to_csv(os.path.join(PROCESSED_DIR, "nlp_intents_train.csv"), index=False)
test_df.to_csv(os.path.join(PROCESSED_DIR, "nlp_intents_test.csv"), index=False)
df_master.to_csv(os.path.join(PROCESSED_DIR, "nlp_intents_full.csv"), index=False)

manifest["datasets"]["Master_NLP_Intent_Dataset"] = {
    "total_records": len(df_master),
    "train_records": len(train_df),
    "test_records": len(test_df),
    "num_intents": int(df_master["intent"].nunique()),
    "features": ["text", "intent", "category", "response"],
    "missing_values": int(df_master.isnull().sum().sum()),
    "train_path": "datasets/processed/nlp_intents_train.csv",
    "test_path": "datasets/processed/nlp_intents_test.csv",
    "status": "ready_for_training"
}
print(f"Master Intent Dataset ready: {len(train_df)} train, {len(test_df)} test across {df_master['intent'].nunique()} intents.")

# -------------------------------------------------------------
# 5. PredictAI - Bank Marketing (Classification)
# -------------------------------------------------------------
print("==> Processing PredictAI: UCI Bank Marketing...")
try:
    url_bank = "https://archive.ics.uci.edu/static/public/222/bank+marketing.zip"
    r_bank = requests.get(url_bank, verify=certifi.where(), timeout=30)
    if r_bank.status_code == 200:
        z_outer = zipfile.ZipFile(io.BytesIO(r_bank.content))
        bank_zip_bytes = z_outer.read("bank.zip")
        z_inner = zipfile.ZipFile(io.BytesIO(bank_zip_bytes))
        df_bank = pd.read_csv(z_inner.open("bank.csv"), sep=";")
        
        # Data validation & clean
        df_bank.dropna(inplace=True)
        df_bank.drop_duplicates(inplace=True)
        bank_path = os.path.join(PROCESSED_DIR, "predictai_bank_marketing.csv")
        df_bank.to_csv(bank_path, index=False)
        
        manifest["datasets"]["PredictAI_Bank_Marketing"] = {
            "source_url": url_bank,
            "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
            "task_type": "binary_classification",
            "target_variable": "y",
            "total_records": len(df_bank),
            "num_features": len(df_bank.columns) - 1,
            "columns": df_bank.columns.tolist(),
            "missing_values": int(df_bank.isnull().sum().sum()),
            "status": "verified_and_processed"
        }
        print(f"PredictAI Bank Marketing processed: {len(df_bank)} records.")
except Exception as e:
    print(f"Error processing Bank Marketing: {e}")

# -------------------------------------------------------------
# 6. PredictAI - Student Performance (Regression)
# -------------------------------------------------------------
print("==> Processing PredictAI: UCI Student Performance...")
try:
    url_student = "https://archive.ics.uci.edu/static/public/320/student+performance.zip"
    r_student = requests.get(url_student, verify=certifi.where(), timeout=30)
    if r_student.status_code == 200:
        z_outer = zipfile.ZipFile(io.BytesIO(r_student.content))
        student_zip_bytes = z_outer.read("student.zip")
        z_inner = zipfile.ZipFile(io.BytesIO(student_zip_bytes))
        df_student = pd.read_csv(z_inner.open("student-mat.csv"), sep=";")
        
        df_student.dropna(inplace=True)
        df_student.drop_duplicates(inplace=True)
        student_path = os.path.join(PROCESSED_DIR, "predictai_student_performance.csv")
        df_student.to_csv(student_path, index=False)
        
        manifest["datasets"]["PredictAI_Student_Performance"] = {
            "source_url": url_student,
            "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
            "task_type": "regression_and_classification",
            "target_variable": "G3",
            "total_records": len(df_student),
            "num_features": len(df_student.columns) - 1,
            "columns": df_student.columns.tolist(),
            "missing_values": int(df_student.isnull().sum().sum()),
            "status": "verified_and_processed"
        }
        print(f"PredictAI Student Performance processed: {len(df_student)} records.")
except Exception as e:
    print(f"Error processing Student Performance: {e}")

# -------------------------------------------------------------
# 7. PredictAI - Online Retail (Clustering / Segmentation)
# -------------------------------------------------------------
print("==> Processing PredictAI: UCI Online Retail...")
try:
    url_retail = "https://archive.ics.uci.edu/static/public/352/online+retail.zip"
    r_retail = requests.get(url_retail, verify=certifi.where(), timeout=60)
    if r_retail.status_code == 200:
        z = zipfile.ZipFile(io.BytesIO(r_retail.content))
        # Read excel using openpyxl, take representative clean sample for speed & compactness
        excel_bytes = z.read("Online Retail.xlsx")
        df_retail_raw = pd.read_excel(io.BytesIO(excel_bytes), engine="openpyxl")
        df_retail_clean = df_retail_raw.dropna(subset=["CustomerID", "Description"]).copy()
        df_retail_clean = df_retail_clean[df_retail_clean["Quantity"] > 0]
        df_retail_clean = df_retail_clean[df_retail_clean["UnitPrice"] > 0]
        df_retail_clean.drop_duplicates(inplace=True)
        
        # Save sample of 15,000 records for fast training & clustering
        df_retail_sample = df_retail_clean.head(15000)
        retail_path = os.path.join(PROCESSED_DIR, "predictai_online_retail_sample.csv")
        df_retail_sample.to_csv(retail_path, index=False)
        
        manifest["datasets"]["PredictAI_Online_Retail"] = {
            "source_url": url_retail,
            "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
            "task_type": "customer_segmentation_clustering",
            "total_records": len(df_retail_sample),
            "initial_records": len(df_retail_raw),
            "features": df_retail_sample.columns.tolist(),
            "missing_values": int(df_retail_sample.isnull().sum().sum()),
            "status": "verified_and_processed"
        }
        print(f"PredictAI Online Retail processed: {len(df_retail_sample)} sample records.")
except Exception as e:
    print(f"Error processing Online Retail: {e}")

# Save Manifest
with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print("\n==== DATASET INGESTION & VERIFICATION COMPLETE ====")
print(f"Manifest written to: {MANIFEST_PATH}")
