"""Transformer model implementation and inference module for ReviewLens AI.

Integrates distilbert/distilbert-base-uncased-finetuned-sst-2-english with Hugging Face
Transformers and PyTorch (CPU). Implements explicit id2label mapping, cached singletons,
truncation to 512 tokens, and optimized batched inference.
"""

from datetime import datetime
import json
from pathlib import Path
import time
from typing import Any, Dict, List, Optional, Tuple, Union
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from src.config import (
    FIGURES_DIR,
    LABEL_NAMES,
    RANDOM_SEED,
    REPORTS_DIR,
    TRANSFORMER_BATCH_SIZE,
    TRANSFORMER_MAX_LENGTH,
    TRANSFORMER_MODEL_ID,
)
from src.data_loader import load_eval_sample
from src.evaluation import compute_metrics, plot_and_save_confusion_matrix

# In-memory singleton caches
_CACHED_TOKENIZER = None
_CACHED_MODEL = None


def get_transformer_components(
    model_id: str = TRANSFORMER_MODEL_ID,
) -> Tuple[AutoTokenizer, AutoModelForSequenceClassification]:
    """Retrieve and cache the Hugging Face tokenizer and sequence classification model.

    Args:
        model_id: Pretrained model identifier.

    Returns:
        Tuple[AutoTokenizer, AutoModelForSequenceClassification]: Cached instances.
    """
    global _CACHED_TOKENIZER, _CACHED_MODEL
    if _CACHED_TOKENIZER is None or _CACHED_MODEL is None:
        _CACHED_TOKENIZER = AutoTokenizer.from_pretrained(model_id)
        _CACHED_MODEL = AutoModelForSequenceClassification.from_pretrained(model_id)
        _CACHED_MODEL.eval()  # Put in evaluation / inference mode

    return _CACHED_TOKENIZER, _CACHED_MODEL


def verify_label_mapping(model: AutoModelForSequenceClassification) -> Dict[str, Any]:
    """Verify and enforce explicit mapping from model config id2label to binary labels.

    Args:
        model: Hugging Face SequenceClassification model.

    Returns:
        Dict detailing the verified label mapping.

    Raises:
        ValueError: If config label mapping does not match expected sentiment classes.
    """
    id2label = model.config.id2label
    # Standard SST-2 DistilBERT: {0: 'NEGATIVE', 1: 'POSITIVE'}
    label_0 = id2label[0].upper()
    label_1 = id2label[1].upper()

    if "NEG" not in label_0 or "POS" not in label_1:
        raise ValueError(
            f"Unexpected id2label configuration: {id2label}. Expected index 0 -> NEGATIVE, 1 -> POSITIVE."
        )

    return {
        "raw_id2label": id2label,
        0: "Negative",
        1: "Positive",
        "verified": True,
    }


def predict_sentiment_transformer(
    text: str,
    model_id: str = TRANSFORMER_MODEL_ID,
    max_length: int = TRANSFORMER_MAX_LENGTH,
) -> Dict[str, Union[str, float, int]]:
    """Predict binary sentiment for a single review string using DistilBERT.

    Args:
        text: Raw user review.
        model_id: Model identifier.
        max_length: Max token length (512 for DistilBERT).

    Returns:
        Dict containing:
            - 'model': 'DistilBERT (distilbert-base-uncased-finetuned-sst-2-english)'
            - 'label': 'Positive' or 'Negative'
            - 'class_id': 1 or 0
            - 'confidence': Softmax probability of predicted class (0.5 to 1.0)
            - 'pos_probability': Probability of positive class (0.0 to 1.0)
            - 'neg_probability': Probability of negative class (0.0 to 1.0)
    """
    tokenizer, model = get_transformer_components(model_id)
    verify_label_mapping(model)

    inputs = tokenizer(
        text,
        truncation=True,
        max_length=max_length,
        padding=False,
        return_tensors="pt",
    )

    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1).squeeze(0).tolist()

    neg_prob = float(probs[0])
    pos_prob = float(probs[1])

    class_id = 1 if pos_prob >= 0.5 else 0
    label = LABEL_NAMES[class_id]
    confidence = pos_prob if class_id == 1 else neg_prob

    return {
        "model": f"DistilBERT ({TRANSFORMER_MODEL_ID.split('/')[-1]})",
        "label": label,
        "class_id": class_id,
        "confidence": round(confidence, 4),
        "pos_probability": round(pos_prob, 4),
        "neg_probability": round(neg_prob, 4),
    }


def predict_batch_transformer(
    texts: List[str],
    batch_size: int = 32,
    model_id: str = TRANSFORMER_MODEL_ID,
    max_length: int = TRANSFORMER_MAX_LENGTH,
) -> Tuple[List[int], List[float]]:
    """Run batched inference on multiple reviews for maximum CPU throughput.

    Args:
        texts: List of review strings.
        batch_size: Mini-batch size.
        model_id: Model identifier.
        max_length: Max token sequence length.

    Returns:
        Tuple of (predicted_class_ids, confidence_scores)
    """
    tokenizer, model = get_transformer_components(model_id)
    verify_label_mapping(model)

    all_class_ids: List[int] = []
    all_confidences: List[float] = []

    total_samples = len(texts)
    for start_idx in range(0, total_samples, batch_size):
        batch_texts = texts[start_idx : start_idx + batch_size]
        inputs = tokenizer(
            batch_texts,
            truncation=True,
            padding=True,
            max_length=max_length,
            return_tensors="pt",
        )

        with torch.no_grad():
            outputs = model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1).numpy()

        batch_class_ids = (probs[:, 1] >= 0.5).astype(int).tolist()
        batch_conf = [
            float(probs[i, cid]) for i, cid in enumerate(batch_class_ids)
        ]

        all_class_ids.extend(batch_class_ids)
        all_confidences.extend(batch_conf)

    return all_class_ids, all_confidences


def evaluate_transformer_on_sample() -> Tuple[Dict[str, Any], List[int], List[float]]:
    """Execute full evaluation of DistilBERT on the held-out evaluation sample."""
    print("=" * 70)
    print("PHASE 5: EVALUATING PRETRAINED DISTILBERT ON HELD-OUT TEST SAMPLE")
    print("=" * 70)

    # 1. Load held-out sample
    eval_texts, eval_labels, eval_indices = load_eval_sample()
    print(f"Loaded held-out evaluation sample: {len(eval_texts)} reviews (Seed: {RANDOM_SEED})")

    # 2. Initialize model and verify labels
    tokenizer, model = get_transformer_components()
    mapping_info = verify_label_mapping(model)
    print(f"Verified label mapping from config: {mapping_info}")

    # 3. Batch inference
    print(f"Running DistilBERT batch inference on {len(eval_texts)} reviews (batch_size=32)...")
    start_time = time.time()
    y_pred, confidences = predict_batch_transformer(eval_texts, batch_size=32)
    elapsed_time = time.time() - start_time
    avg_latency_ms = (elapsed_time / len(eval_texts)) * 1000

    print(f"Inference completed in {elapsed_time:.2f} seconds ({len(eval_texts)/elapsed_time:.2f} reviews/s, {avg_latency_ms:.1f} ms/review).")

    # 4. Metrics calculation
    metrics = compute_metrics(eval_labels, y_pred)
    print("\n--- DISTILBERT EVALUATION METRICS ---")
    print(f"Accuracy:  {metrics['accuracy']:.4f} ({metrics['accuracy'] * 100:.2f}%)")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall:    {metrics['recall']:.4f}")
    print(f"F1-Score:  {metrics['f1']:.4f}")
    print("Confusion Matrix:")
    print(f"  TN: {metrics['true_negative']} | FP: {metrics['false_positive']}")
    print(f"  FN: {metrics['false_negative']} | TP: {metrics['true_positive']}")

    # 5. Save figure
    FIGURES_DIR.mkdir(parents=True, exist_ok=True)
    fig_path = FIGURES_DIR / "confusion_matrix_transformer.png"
    plot_and_save_confusion_matrix(
        metrics["confusion_matrix"],
        model_name="DistilBERT (SST-2 Pretrained)",
        save_path=fig_path,
    )
    print(f"\nSaved confusion matrix plot to: {fig_path}")

    # 6. Save transformer metrics JSON
    metrics_record = {
        "model": f"DistilBERT ({TRANSFORMER_MODEL_ID})",
        "evaluation_date": datetime.now().isoformat(),
        "sample_size": len(eval_texts),
        "seed": RANDOM_SEED,
        "elapsed_seconds": round(elapsed_time, 2),
        "avg_latency_ms": round(avg_latency_ms, 2),
        **metrics,
    }
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    out_json = REPORTS_DIR / "transformer_metrics.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(metrics_record, f, indent=2)
    print(f"Saved transformer metrics JSON to: {out_json}")

    return metrics, y_pred, confidences


if __name__ == "__main__":
    evaluate_transformer_on_sample()
