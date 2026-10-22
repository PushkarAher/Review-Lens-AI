# ReviewLens AI Models Directory

This directory stores the trained traditional ML model artifacts:
- `baseline_pipeline.joblib`: Scikit-learn Pipeline combining `TfidfVectorizer` and `LogisticRegression`, fitted exclusively on the IMDb training set.

## Transformer Weights
The Transformer model (`distilbert/distilbert-base-uncased-finetuned-sst-2-english`) is downloaded and cached at runtime via Hugging Face Transformers to avoid storing large binary weights in source control.
