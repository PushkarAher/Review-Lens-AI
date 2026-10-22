"""Unit tests for baseline save/load, transformer label mapping, and edge case handling."""

import pytest
from src.baseline_model import (
    load_baseline_pipeline,
    predict_sentiment_baseline,
)
from src.config import BASELINE_MODEL_PATH, TRANSFORMER_MAX_LENGTH
from src.transformer_model import (
    get_transformer_components,
    predict_sentiment_transformer,
    verify_label_mapping,
)


def test_baseline_save_and_reload():
    """Verify that the baseline pipeline loads from disk and predicts accurately."""
    assert BASELINE_MODEL_PATH.exists(), "Baseline joblib model file must exist on disk."
    pipeline = load_baseline_pipeline()

    sample = "This movie was absolutely spectacular, brilliant acting and writing."
    result = predict_sentiment_baseline(pipeline, sample)

    assert result["label"] == "Positive"
    assert result["class_id"] == 1
    assert 0.5 <= result["confidence"] <= 1.0
    assert abs((result["pos_probability"] + result["neg_probability"]) - 1.0) < 1e-3


def test_transformer_label_mapping():
    """Verify that DistilBERT config id2label maps explicitly: 0 -> Negative, 1 -> Positive."""
    _, model = get_transformer_components()
    mapping_info = verify_label_mapping(model)

    assert mapping_info["verified"] is True
    assert mapping_info[0] == "Negative"
    assert mapping_info[1] == "Positive"
    assert "NEG" in model.config.id2label[0].upper()
    assert "POS" in model.config.id2label[1].upper()


def test_transformer_prediction_format():
    """Verify transformer prediction dictionary keys and value ranges."""
    sample = "An unwatchable nightmare. Terrible directing."
    result = predict_sentiment_transformer(sample)

    assert result["label"] == "Negative"
    assert result["class_id"] == 0
    assert 0.5 <= result["confidence"] <= 1.0
    assert abs((result["pos_probability"] + result["neg_probability"]) - 1.0) < 1e-3


def test_empty_string_handling():
    """Verify behavior on empty string or whitespace inputs."""
    pipeline = load_baseline_pipeline()

    # Empty string should not crash models
    res_base = predict_sentiment_baseline(pipeline, "")
    assert res_base["label"] in ["Positive", "Negative"]

    res_trans = predict_sentiment_transformer("")
    assert res_trans["label"] in ["Positive", "Negative"]


def test_very_long_input_handling():
    """Verify that a review exceeding 512 tokens is truncated gracefully by DistilBERT."""
    long_review = ("This was a very long film with many scenes. " * 80) + "In the end, it was great."
    assert len(long_review.split()) > TRANSFORMER_MAX_LENGTH

    # Should run and return valid prediction without exceeding token limits
    res_trans = predict_sentiment_transformer(long_review)
    assert res_trans["label"] in ["Positive", "Negative"]
    assert 0.5 <= res_trans["confidence"] <= 1.0
