"""Evaluation module for ReviewLens AI.

Calculates standard classification metrics (accuracy, precision, recall, F1-score)
and generates visual confusion matrix representations.
"""

from datetime import datetime
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)

from src.baseline_model import load_baseline_pipeline, predict_batch_baseline
from src.config import (
    FIGURES_DIR,
    RANDOM_SEED,
    REPORTS_DIR,
)
from src.data_loader import load_eval_sample


def compute_metrics(
    y_true: Union[List[int], np.ndarray],
    y_pred: Union[List[int], np.ndarray],
) -> Dict[str, Any]:
    """Compute standard classification metrics and confusion matrix.

    Args:
        y_true: True binary ground-truth labels (0 = Negative, 1 = Positive).
        y_pred: Predicted binary labels (0 or 1).

    Returns:
        Dict containing accuracy, precision, recall, f1, and confusion_matrix.
    """
    y_true_arr = np.array(y_true)
    y_pred_arr = np.array(y_pred)

    acc = accuracy_score(y_true_arr, y_pred_arr)
    prec = precision_score(y_true_arr, y_pred_arr, pos_label=1, zero_division=0)
    rec = recall_score(y_true_arr, y_pred_arr, pos_label=1, zero_division=0)
    f1 = f1_score(y_true_arr, y_pred_arr, pos_label=1, zero_division=0)
    cm = confusion_matrix(y_true_arr, y_pred_arr, labels=[0, 1])

    tn, fp, fn, tp = cm.ravel()

    return {
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1": round(float(f1), 4),
        "confusion_matrix": cm.tolist(),
        "true_negative": int(tn),
        "false_positive": int(fp),
        "false_negative": int(fn),
        "true_positive": int(tp),
        "total_samples": len(y_true),
    }


def plot_and_save_confusion_matrix(
    cm: Union[List[List[int]], np.ndarray],
    model_name: str,
    save_path: Union[str, Path],
) -> Path:
    """Plot and save a stylized confusion matrix heatmap.

    Args:
        cm: 2x2 confusion matrix array or list of lists.
        model_name: Display name for title.
        save_path: Output PNG file path.

    Returns:
        Path: Absolute path to the saved figure.
    """
    cm_arr = np.array(cm)
    save_path = Path(save_path)
    save_path.parent.mkdir(parents=True, exist_ok=True)

    fig, ax = plt.subplots(figsize=(6, 5))
    cax = ax.matshow(cm_arr, cmap=plt.cm.Blues, alpha=0.85)

    for i in range(cm_arr.shape[0]):
        for j in range(cm_arr.shape[1]):
            val = cm_arr[i, j]
            color = "white" if val > cm_arr.max() / 2 else "black"
            ax.text(
                x=j,
                y=i,
                s=f"{val:,}",
                va="center",
                ha="center",
                size="xx-large",
                fontweight="bold",
                color=color,
            )

    fig.colorbar(cax)
    classes = ["Negative (0)", "Positive (1)"]
    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(classes, fontsize=11)
    ax.set_yticklabels(classes, fontsize=11)
    ax.set_xlabel("Predicted Label", fontsize=12, labelpad=10)
    ax.set_ylabel("True Ground Truth Label", fontsize=12, labelpad=10)
    ax.set_title(f"Confusion Matrix: {model_name}", fontsize=13, fontweight="bold", pad=15)

    plt.tight_layout()
    plt.savefig(save_path, dpi=300)
    plt.close(fig)
    return save_path


def evaluate_baseline_on_sample():
    """Run full evaluation of the baseline pipeline on the held-out sample."""
    print("=" * 70)
    print("PHASE 4: EVALUATING BASELINE MODEL ON HELD-OUT TEST SAMPLE")
    print("=" * 70)

    # 1. Load sample
    eval_texts, eval_labels, eval_indices = load_eval_sample()
    print(f"Loaded held-out evaluation sample: {len(eval_texts)} reviews (Seed: {RANDOM_SEED})")

    # 2. Load model
    pipeline = load_baseline_pipeline()
    print("Loaded baseline pipeline from models/baseline_pipeline.joblib")

    # 3. Predict
    print("Running batch inference...")
    y_pred, confidences = predict_batch_baseline(pipeline, eval_texts)

    # 4. Compute metrics
    metrics = compute_metrics(eval_labels, y_pred)
    print("\n--- BASELINE EVALUATION METRICS ---")
    print(f"Accuracy:  {metrics['accuracy']:.4f} ({metrics['accuracy'] * 100:.2f}%)")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall:    {metrics['recall']:.4f}")
    print(f"F1-Score:  {metrics['f1']:.4f}")
    print("Confusion Matrix:")
    print(f"  TN: {metrics['true_negative']} | FP: {metrics['false_positive']}")
    print(f"  FN: {metrics['false_negative']} | TP: {metrics['true_positive']}")

    # 5. Save figure
    FIGURES_DIR.mkdir(parents=True, exist_ok=True)
    fig_path = FIGURES_DIR / "confusion_matrix_baseline.png"
    plot_and_save_confusion_matrix(
        metrics["confusion_matrix"],
        model_name="TF-IDF + Logistic Regression",
        save_path=fig_path,
    )
    print(f"\nSaved confusion matrix plot to: {fig_path}")

    # 6. Save baseline metrics JSON
    metrics_record = {
        "model": "TF-IDF + Logistic Regression",
        "evaluation_date": datetime.now().isoformat(),
        "sample_size": len(eval_texts),
        "seed": RANDOM_SEED,
        **metrics,
    }
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    out_json = REPORTS_DIR / "baseline_metrics.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(metrics_record, f, indent=2)
    print(f"Saved baseline metrics JSON to: {out_json}")

    return metrics, y_pred, confidences


if __name__ == "__main__":
    evaluate_baseline_on_sample()
