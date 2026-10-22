# ReviewLens AI Data Directory

This directory contains evaluation index mappings and information about the datasets used in ReviewLens AI.

## Dataset
- **Dataset Name**: IMDb Movie Reviews (`stanfordnlp/imdb` on Hugging Face Datasets)
- **Task**: Binary sentiment classification (0 = Negative, 1 = Positive)
- **Splits**:
  - Training split: 25,000 reviews (12,500 positive, 12,500 negative)
  - Test split: 25,000 reviews (12,500 positive, 12,500 negative)
- **Evaluation Sample**:
  - Seeded stratified subsample of 5,000 reviews from the IMDb test set (2,500 positive, 2,500 negative), generated with `seed=42`.
  - Indices are stored in `data/eval_sample_indices.json`.

Raw datasets and downloads are automatically cached outside git tracking in accordance with project reproducibility rules.
