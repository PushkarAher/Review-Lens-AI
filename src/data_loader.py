"""Data loading and evaluation sample generation for ReviewLens AI.

Loads the IMDb dataset using Hugging Face datasets, provides stratified sampling
for the held-out test evaluation set, and verifies data integrity.
"""

import json
from typing import Dict, List, Tuple
import numpy as np
from datasets import Dataset, DatasetDict, load_dataset

from src.config import (
    CLASS_SAMPLE_SIZE,
    EVAL_SAMPLE_PATH,
    EVAL_SAMPLE_SIZE,
    RANDOM_SEED,
)


def load_imdb_dataset() -> Tuple[Dataset, Dataset]:
    """Load the official IMDb train and test splits.

    Returns:
        Tuple[Dataset, Dataset]: (train_dataset, test_dataset)
    """
    dataset: DatasetDict = load_dataset("stanfordnlp/imdb")
    train_dataset = dataset["train"]
    test_dataset = dataset["test"]
    return train_dataset, test_dataset


def generate_or_load_eval_indices(
    test_labels: List[int],
    save_path=EVAL_SAMPLE_PATH,
    seed: int = RANDOM_SEED,
    sample_size_per_class: int = CLASS_SAMPLE_SIZE,
) -> List[int]:
    """Generate or retrieve seeded stratified sample indices for test evaluation.

    Args:
        test_labels: List of integer labels from the test split.
        save_path: Path to save/load JSON index file.
        seed: Random seed for reproducibility.
        sample_size_per_class: Number of samples per class (default 2,500).

    Returns:
        List[int]: Sorted list of selected test split indices.
    """
    if save_path.exists():
        with open(save_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            indices = data.get("indices", [])
            if len(indices) == sample_size_per_class * 2:
                return indices

    # Stratified sampling by label
    labels_arr = np.array(test_labels)
    neg_indices = np.where(labels_arr == 0)[0]
    pos_indices = np.where(labels_arr == 1)[0]

    rng = np.random.default_rng(seed)
    selected_neg = rng.choice(neg_indices, size=sample_size_per_class, replace=False)
    selected_pos = rng.choice(pos_indices, size=sample_size_per_class, replace=False)

    sampled_indices = sorted(list(selected_neg) + list(selected_pos))

    # Persist indices with metadata
    payload = {
        "dataset": "stanfordnlp/imdb",
        "split": "test",
        "seed": seed,
        "sample_size": len(sampled_indices),
        "class_counts": {
            "negative": sample_size_per_class,
            "positive": sample_size_per_class,
        },
        "indices": [int(idx) for idx in sampled_indices],
    }
    save_path.parent.mkdir(parents=True, exist_ok=True)
    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    return sampled_indices


def load_eval_sample() -> Tuple[List[str], List[int], List[int]]:
    """Load the held-out evaluation sample texts, true labels, and sample indices.

    Returns:
        Tuple[List[str], List[int], List[int]]: (texts, labels, indices)
    """
    _, test_dataset = load_imdb_dataset()
    test_labels = list(test_dataset["label"])
    indices = generate_or_load_eval_indices(test_labels)

    sampled_texts = [test_dataset["text"][i] for i in indices]
    sampled_labels = [test_labels[i] for i in indices]

    return sampled_texts, sampled_labels, indices


def verify_no_train_test_overlap(
    train_texts: List[str], eval_texts: List[str]
) -> Dict[str, int]:
    """Verify that no identical review text leaks from train into the evaluation sample.

    Args:
        train_texts: List of raw reviews from the training split.
        eval_texts: List of raw reviews in the evaluation sample.

    Returns:
        Dict with overlap stats.
    """
    train_set = set(t.strip() for t in train_texts)
    eval_set = set(t.strip() for t in eval_texts)
    overlap = train_set.intersection(eval_set)

    return {
        "train_unique_count": len(train_set),
        "eval_unique_count": len(eval_set),
        "exact_text_overlap_count": len(overlap),
    }


if __name__ == "__main__":
    print("Loading IMDb dataset...")
    train_ds, test_ds = load_imdb_dataset()
    print(f"Train split size: {len(train_ds)}, Test split size: {len(test_ds)}")

    print(f"Generating seeded evaluation sample (N={EVAL_SAMPLE_SIZE}, seed={RANDOM_SEED})...")
    indices = generate_or_load_eval_indices(list(test_ds["label"]))
    print(f"Saved {len(indices)} indices to {EVAL_SAMPLE_PATH}")

    print("Verifying data integrity...")
    eval_texts, eval_labels, _ = load_eval_sample()
    overlap_info = verify_no_train_test_overlap(train_ds["text"], eval_texts)
    print(f"Train/Eval Overlap Check: {overlap_info}")
    print("Data loader verification complete.")
