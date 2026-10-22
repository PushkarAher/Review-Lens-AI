"""Baseline model definition and inference module for ReviewLens AI.

Constructs an end-to-end Scikit-learn Pipeline (TfidfVectorizer + LogisticRegression)
and provides inference functions returning sentiment labels and calibrated probabilities.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from src.config import BASELINE_MAX_FEATURES, BASELINE_MODEL_PATH, LABEL_NAMES, RANDOM_SEED
from src.preprocessing import clean_text


def build_baseline_pipeline(
    max_features: int = BASELINE_MAX_FEATURES,
    ngram_range: Tuple[int, int] = (1, 2),
    min_df: int = 3,
    C: float = 1.0,
    random_seed: int = RANDOM_SEED,
) -> Pipeline:
    """Construct an unfitted Scikit-learn Pipeline with preprocessing, TF-IDF, and Logistic Regression.

    Args:
        max_features: Maximum vocabulary size to constrain memory footprint.
        ngram_range: Lower and upper boundary of range of n-values for n-grams.
        min_df: Minimum document frequency threshold.
        C: Inverse regularization strength.
        random_seed: Seed for solver reproducibility.

    Returns:
        Pipeline: Scikit-learn Pipeline instance.
    """
    pipeline = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    preprocessor=clean_text,
                    ngram_range=ngram_range,
                    min_df=min_df,
                    max_features=max_features,
                    sublinear_tf=True,
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    C=C,
                    max_iter=1000,
                    random_state=random_seed,
                    solver="liblinear",
                ),
            ),
        ]
    )
    return pipeline


def load_baseline_pipeline(model_path: Union[str, Path] = BASELINE_MODEL_PATH) -> Pipeline:
    """Load the persisted Scikit-learn baseline pipeline from disk.

    Args:
        model_path: Path to the .joblib file.

    Returns:
        Pipeline: Loaded Scikit-learn pipeline ready for inference.

    Raises:
        FileNotFoundError: If the model file does not exist.
    """
    path = Path(model_path)
    if not path.exists():
        raise FileNotFoundError(
            f"Baseline model not found at {path}. Please train it first by running: "
            "python -m src.train_baseline"
        )
    pipeline = joblib.load(path)
    return pipeline


def predict_sentiment_baseline(
    pipeline: Pipeline, text: str
) -> Dict[str, Union[str, float, int]]:
    """Predict binary sentiment for a single review string using the baseline pipeline.

    Args:
        pipeline: Fitted Scikit-learn pipeline.
        text: Raw user review.

    Returns:
        Dict containing:
            - 'model': 'TF-IDF + Logistic Regression'
            - 'label': 'Positive' or 'Negative'
            - 'class_id': 1 or 0
            - 'confidence': Probability of the predicted class (0.5 to 1.0)
            - 'pos_probability': Probability of positive class (0.0 to 1.0)
            - 'neg_probability': Probability of negative class (0.0 to 1.0)
    """
    probs = pipeline.predict_proba([text])[0]
    neg_prob = float(probs[0])
    pos_prob = float(probs[1])

    class_id = int(pos_prob >= 0.5)
    label = LABEL_NAMES[class_id]
    confidence = pos_prob if class_id == 1 else neg_prob

    return {
        "model": "TF-IDF + Logistic Regression",
        "label": label,
        "class_id": class_id,
        "confidence": round(confidence, 4),
        "pos_probability": round(pos_prob, 4),
        "neg_probability": round(neg_prob, 4),
    }


def predict_batch_baseline(
    pipeline: Pipeline, texts: List[str]
) -> Tuple[List[int], List[float]]:
    """Run batch prediction on multiple reviews.

    Args:
        pipeline: Fitted Scikit-learn pipeline.
        texts: List of review strings.

    Returns:
        Tuple of (predicted_class_ids, confidence_scores)
    """
    probs = pipeline.predict_proba(texts)
    class_ids = (probs[:, 1] >= 0.5).astype(int).tolist()
    confidences = [
        float(p[cid]) for p, cid in zip(probs, class_ids)
    ]
    return class_ids, confidences
