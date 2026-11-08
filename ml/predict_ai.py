"""
PredictAI Module
Trains and provides real predictive analytics across the 3 benchmark datasets:
1. Bank Marketing: Classification (predicts if client will subscribe term deposit)
2. Student Performance: Regression (predicts final student grade G3)
3. Online Retail: Clustering (RFM Customer Segmentation with K-Means)
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, f1_score, r2_score, mean_squared_error, silhouette_score

PROCESSED_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "datasets", "processed")


def evaluate_bank_marketing():
    path = os.path.join(PROCESSED_DIR, "predictai_bank_marketing.csv")
    if not os.path.exists(path):
        return {"error": "Bank Marketing dataset missing"}
    
    df = pd.read_csv(path)
    X = df.drop(columns=["y"])
    y = df["y"].apply(lambda v: 1 if v == "yes" else 0)

    cat_cols = X.select_dtypes(include=["object"]).columns.tolist()
    num_cols = X.select_dtypes(include=[np.number]).columns.tolist()

    preprocessor = ColumnTransformer([
        ("num", StandardScaler(), num_cols),
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_cols)
    ])

    clf = Pipeline([
        ("preprocessor", preprocessor),
        ("rf", RandomForestClassifier(n_estimators=50, random_state=42, max_depth=10))
    ])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)

    return {
        "dataset": "Bank Marketing (UCI)",
        "task": "Binary Classification (Subscription Prediction)",
        "records": len(df),
        "test_samples": len(X_test),
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "f1_score": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
        "target_distribution": {
            "no": int((y == 0).sum()),
            "yes": int((y == 1).sum())
        }
    }


def evaluate_student_performance():
    path = os.path.join(PROCESSED_DIR, "predictai_student_performance.csv")
    if not os.path.exists(path):
        return {"error": "Student Performance dataset missing"}

    df = pd.read_csv(path)
    X = df.drop(columns=["G3"])
    y = df["G3"]

    cat_cols = X.select_dtypes(include=["object"]).columns.tolist()
    num_cols = X.select_dtypes(include=[np.number]).columns.tolist()

    preprocessor = ColumnTransformer([
        ("num", StandardScaler(), num_cols),
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_cols)
    ])

    reg = Pipeline([
        ("preprocessor", preprocessor),
        ("rf", RandomForestRegressor(n_estimators=50, random_state=42, max_depth=8))
    ])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    reg.fit(X_train, y_train)
    y_pred = reg.predict(X_test)

    r2 = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    return {
        "dataset": "Student Performance (UCI)",
        "task": "Regression (Final Grade G3 Prediction [0-20])",
        "records": len(df),
        "test_samples": len(X_test),
        "r2_score": round(float(r2), 4),
        "rmse": round(float(rmse), 4),
        "mean_target_grade": round(float(y.mean()), 2)
    }


def evaluate_online_retail_clustering():
    path = os.path.join(PROCESSED_DIR, "predictai_online_retail_sample.csv")
    if not os.path.exists(path):
        return {"error": "Online Retail dataset missing"}

    df = pd.read_csv(path)
    df["TotalSpend"] = df["Quantity"] * df["UnitPrice"]
    
    # Aggregate customer RFM metrics
    rfm = df.groupby("CustomerID").agg({
        "InvoiceNo": "nunique",
        "Quantity": "sum",
        "TotalSpend": "sum"
    }).rename(columns={
        "InvoiceNo": "Frequency",
        "Quantity": "TotalItems",
        "TotalSpend": "Monetary"
    }).reset_index()

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(rfm[["Frequency", "TotalItems", "Monetary"]])

    kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X_scaled)
    rfm["Cluster"] = clusters

    cluster_summary = rfm.groupby("Cluster").agg({
        "CustomerID": "count",
        "Frequency": "mean",
        "Monetary": "mean"
    }).rename(columns={"CustomerID": "Count"}).round(2).to_dict(orient="index")

    sil = float(silhouette_score(X_scaled, clusters)) if len(rfm) > 10 else 0.0

    return {
        "dataset": "Online Retail Customer Segmentation (UCI)",
        "task": "K-Means Clustering (RFM Analysis)",
        "unique_customers": len(rfm),
        "num_clusters": 4,
        "silhouette_score": round(sil, 4),
        "cluster_profiles": cluster_summary
    }
