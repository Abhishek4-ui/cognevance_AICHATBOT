import pytest
from ml.predict_ai import evaluate_bank_marketing, evaluate_student_performance, evaluate_online_retail_clustering


def test_bank_marketing():
    res = evaluate_bank_marketing()
    assert "accuracy" in res
    assert res["accuracy"] > 0.80


def test_student_performance():
    res = evaluate_student_performance()
    assert "r2_score" in res
    assert res["r2_score"] > 0.70


def test_retail_clustering():
    res = evaluate_online_retail_clustering()
    assert "silhouette_score" in res
    assert res["num_clusters"] == 4
