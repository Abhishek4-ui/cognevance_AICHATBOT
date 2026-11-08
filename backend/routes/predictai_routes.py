"""
NeuroChat AI — PredictAI Benchmark Evaluation Routes
Exposes real Machine Learning evaluations for Bank Marketing, Student Performance, and Online Retail.
"""

from flask import Blueprint, jsonify
from ml.predict_ai import evaluate_bank_marketing, evaluate_student_performance, evaluate_online_retail_clustering

predictai_bp = Blueprint("predictai", __name__)


@predictai_bp.route("/all", methods=["GET"])
def get_all_predictai_metrics():
    bank = evaluate_bank_marketing()
    student = evaluate_student_performance()
    retail = evaluate_online_retail_clustering()

    return jsonify({
        "status": "success",
        "benchmarks": {
            "classification": bank,
            "regression": student,
            "clustering": retail
        }
    })


@predictai_bp.route("/bank", methods=["GET"])
def get_bank():
    return jsonify({"status": "success", "data": evaluate_bank_marketing()})


@predictai_bp.route("/student", methods=["GET"])
def get_student():
    return jsonify({"status": "success", "data": evaluate_student_performance()})


@predictai_bp.route("/retail", methods=["GET"])
def get_retail():
    return jsonify({"status": "success", "data": evaluate_online_retail_clustering()})
