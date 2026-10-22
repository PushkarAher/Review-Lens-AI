"""Configuration module for ReviewLens AI.

Defines reproducible seeds, file paths, evaluation parameters, and model identifiers.
"""

from pathlib import Path

# Project Root
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Reproducibility Seed
RANDOM_SEED = 42

# Evaluation Sample Settings
EVAL_SAMPLE_SIZE = 5000
CLASS_SAMPLE_SIZE = 2500  # 2,500 positive, 2,500 negative

# Transformer Settings
TRANSFORMER_MODEL_ID = "distilbert/distilbert-base-uncased-finetuned-sst-2-english"
TRANSFORMER_MAX_LENGTH = 512
TRANSFORMER_BATCH_SIZE = 64

# Baseline Hyperparameters & Constraints
BASELINE_MAX_FEATURES = 15000  # Caps vocabulary to keep serialized joblib model lightweight (< 20MB)

# Directory Paths
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = PROJECT_ROOT / "models"
REPORTS_DIR = PROJECT_ROOT / "reports"
FIGURES_DIR = REPORTS_DIR / "figures"
NOTEBOOKS_DIR = PROJECT_ROOT / "notebooks"
SCREENSHOTS_DIR = PROJECT_ROOT / "screenshots"

# File Paths
EVAL_SAMPLE_PATH = DATA_DIR / "eval_sample_indices.json"
BASELINE_MODEL_PATH = MODELS_DIR / "baseline_pipeline.joblib"
MODEL_COMPARISON_CSV = REPORTS_DIR / "model_comparison.csv"
DISAGREEMENTS_CSV = REPORTS_DIR / "disagreements.csv"
EDGE_CASES_CSV = REPORTS_DIR / "edge_cases.csv"

# Label Mappings (IMDb convention: 0 = Negative, 1 = Positive)
LABEL_NAMES = {0: "Negative", 1: "Positive"}
