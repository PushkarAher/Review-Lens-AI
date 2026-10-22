"""Baseline model training script for ReviewLens AI.

Tunes hyperparameters using GridSearchCV on the IMDb TRAINING split only,
refits the optimal pipeline, verifies model artifact size, and tests loading and inference.
"""

import os
import sys
import time
from pathlib import Path
import joblib
from sklearn.model_selection import GridSearchCV

from src.baseline_model import (
    build_baseline_pipeline,
    load_baseline_pipeline,
    predict_sentiment_baseline,
)
from src.config import (
    BASELINE_MAX_FEATURES,
    BASELINE_MODEL_PATH,
    MODELS_DIR,
    RANDOM_SEED,
)
from src.data_loader import load_imdb_dataset


def train_and_tune_baseline():
    """Execute hyperparameter tuning and model training on the training split only."""
    print("=" * 70)
    print("PHASE 3: TRAINING TRADITIONAL ML BASELINE (TRAIN SPLIT ONLY)")
    print("=" * 70)

    # 1. Load training data ONLY (DO NOT TOUCH TEST DATA)
    print("Loading IMDb dataset (extracting training split only)...")
    train_ds, _ = load_imdb_dataset()
    X_train = list(train_ds["text"])
    y_train = list(train_ds["label"])
    print(f"Loaded {len(X_train)} training reviews (Positive: {sum(y_train)}, Negative: {len(y_train) - sum(y_train)})")

    # 2. Define hyperparameter tuning grid
    param_grid = {
        "tfidf__ngram_range": [(1, 1), (1, 2)],
        "tfidf__max_features": [10000, 15000],
        "clf__C": [0.5, 1.0, 2.0],
    }

    base_pipe = build_baseline_pipeline(
        max_features=BASELINE_MAX_FEATURES,
        random_seed=RANDOM_SEED,
    )

    print(f"Initiating 3-fold cross-validation on {len(X_train)} training examples...")
    grid_search = GridSearchCV(
        estimator=base_pipe,
        param_grid=param_grid,
        cv=3,
        scoring="accuracy",
        verbose=1,
        n_jobs=-1,
        refit=True,
    )

    start_time = time.time()
    grid_search.fit(X_train, y_train)
    elapsed = time.time() - start_time

    print(f"\nGridSearchCV completed in {elapsed:.2f} seconds.")
    print("Search results:")
    for mean_score, params in zip(
        grid_search.cv_results_["mean_test_score"],
        grid_search.cv_results_["params"],
    ):
        print(f"  Accuracy: {mean_score:.4f} | Params: {params}")

    print("\n" + "-" * 50)
    print(f"Optimal Parameters: {grid_search.best_params_}")
    print(f"Best CV Training Accuracy: {grid_search.best_score_:.4f}")
    print("-" * 50)

    # 3. Save the best pipeline
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    best_pipeline = grid_search.best_estimator_

    print(f"\nPersisting fitted pipeline to {BASELINE_MODEL_PATH}...")
    joblib.dump(best_pipeline, BASELINE_MODEL_PATH, compress=3)

    # 4. Check file size
    file_size_mb = os.path.getsize(BASELINE_MODEL_PATH) / (1024 * 1024)
    print(f"Model saved successfully. File size: {file_size_mb:.2f} MB")
    if file_size_mb > 20.0:
        print(f"WARNING: Model file size exceeds 20MB limit ({file_size_mb:.2f}MB).")
    else:
        print("Model file size is well within the 20MB Git / deployment limit.")

    # 5. Verification: Reload model and test inference
    print("\nVerifying model artifact reload and inference...")
    reloaded_pipeline = load_baseline_pipeline(BASELINE_MODEL_PATH)

    test_samples = [
        "This film was an absolute masterpiece! Exceptional performances and stunning cinematography.",
        "Terrible waste of time. The plot was completely incoherent and acting was atrocious.",
    ]
    for sample in test_samples:
        result = predict_sentiment_baseline(reloaded_pipeline, sample)
        print(f"Review: \"{sample[:60]}...\"")
        print(f"  -> Predicted: {result['label']} (Confidence: {result['confidence']:.2%}, Class ID: {result['class_id']})")

    print("\nBaseline model training and verification complete!")
    return grid_search.best_score_, grid_search.best_params_


if __name__ == "__main__":
    train_and_tune_baseline()
