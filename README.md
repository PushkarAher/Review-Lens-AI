# ReviewLens AI: Comparative Review Sentiment Analysis

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Streamlit App](https://img.shields.io/badge/Streamlit-App-FF4B4B.svg)](https://streamlit.io/)
[![HuggingFace DistilBERT](https://img.shields.io/badge/HF-DistilBERT-yellow.svg)](https://huggingface.co/distilbert/distilbert-base-uncased-finetuned-sst-2-english)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Comparative Review Sentiment Analysis using Traditional Machine Learning (TF-IDF + Logistic Regression) and Pretrained Transformers (DistilBERT).

Prepared for **GDG on Campus VIT Pune Recruitment (Option B: Review Sentiment Analyzer)**.

---

## Overview
ReviewLens AI is a dual-paradigm sentiment analyzer and benchmarking platform comparing:
1. **Traditional Baseline**: Scikit-learn Pipeline with HTML/text cleaning, `TfidfVectorizer`, and `LogisticRegression`.
2. **Contextual Transformer**: Hugging Face `distilbert/distilbert-base-uncased-finetuned-sst-2-english`.

Both models are evaluated on an identical, seeded, stratified 5,000-review sample of the IMDb test set, measuring accuracy, precision, recall, F1-score, and confusion matrices.

*(Full documentation, results table, and architecture details will be populated in subsequent phases.)*
