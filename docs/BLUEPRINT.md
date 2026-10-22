# REVIEWLENS AI
## Project Blueprint & Antigravity Execution Plan
### Comparative Review Sentiment Analysis Using Traditional Machine Learning and Transformers
**Prepared for:** GDG on Campus VIT Pune Recruitment (Option B: Review Sentiment Analyzer)  
**Version 1.1 | October 2026 | Written to be executed by AI coding agents in Antigravity**

---

## HOW TO USE THIS DOCUMENT
Sections 1-8 define WHAT to build. Section 9 sets up Antigravity. Section 10 says WHICH model to use for each job. Section 11 gives a ready-to-paste prompt for every phase. Give the agent this whole file as context once, then run one phase per agent task.

---

## 1. Executive Summary
ReviewLens AI is a web application that compares two approaches to binary sentiment analysis: a traditional pipeline (TF-IDF + Logistic Regression) and a pretrained Transformer (DistilBERT). A user enters a review and sees each model's predicted sentiment and confidence side by side. A separate evaluation workflow measures both models on the same held-out labeled test sample and reports accuracy, precision, recall, F1 and confusion matrices.

The project answers the GDG "Option B: Review Sentiment Analyzer" task. The final submission is a GitHub repository with a README and a working demo, preferably hosted on Hugging Face Spaces, with a local run as the fallback.

---

## 2. Problem Statement
Online platforms receive large volumes of reviews, and reading them manually to judge overall sentiment does not scale. This project compares a lightweight text-classification pipeline against a contextual Transformer and shows both their live predictions and their measured performance in one interface.

---

## 3. Objectives, Scope and Task Traceability
1. Classify English movie reviews (IMDb) as positive or negative.
2. Train a tuned TF-IDF + Logistic Regression baseline.
3. Integrate a pretrained DistilBERT sentiment classifier for inference.
4. Evaluate both models on identical, seeded, held-out test examples.
5. Report accuracy, precision, recall, F1-score and confusion matrices.
6. Build a Streamlit app showing sentiment and confidence from both models, with a disagreement indicator.
7. Deliver an organized GitHub repo, a README with a results table, and a working demo.

### Requirement traceability
| GDG requirement | Where it is covered |
|---|---|
| 1. TF-IDF + Logistic Regression baseline | Section 5.1, Phase 3 |
| 2. Compare with a pretrained Hugging Face transformer | Section 5.2, Phase 5 |
| 3. Accuracy, precision, recall, F1, confusion matrix | Section 6, Phases 4 and 6 |
| 4. Web app: any review, sentiment + confidence from both models | Phase 7 |
| Deliverable 1: GitHub repo with data, notebooks, app, requirements.txt | Section 8 (includes data/ folder), Phase 1 |
| Deliverable 2: README with setup, screenshots, results table | Phase 9 |
| Deliverable 3: working demo, local or Streamlit Cloud / HF Spaces | Phase 9 (HF Spaces target, local fallback) |

---

## 4. System Architecture
```
User enters review
        |
        v
Streamlit UI -> Input validation (empty / too long)
        |
   +----+-----------------------+
   |                            |
   v                            v
TF-IDF + Logistic Regression   DistilBERT tokenizer
   |                            |
   |                            v
   |                         Transformer model
   |                            |
   +-------------+--------------+
                 v
       Result comparison layer
                 |
                 v
  Label + confidence per model, disagreement flag
```

Separate evaluation workflow (scripts, not the UI):
```
Labeled test sample -> both models -> metrics / confusion matrices / disagreement report
```

> **Important:** accuracy can only be computed from known labels on a held-out dataset. For arbitrary user-entered reviews the app shows predictions and confidence only. Never display "accuracy" for a single typed review.

---

## 5. Model Design

### 5.1 Traditional ML baseline
- Clean text before vectorizing: lowercase and strip the HTML line-break tags (`<br />`) that appear in IMDb reviews. Keep this in `src/preprocessing.py`.
- Use Scikit-learn `TfidfVectorizer` + `LogisticRegression` inside one `Pipeline`, so inference reuses the exact fitted transformation.
- Tune a small grid (for example `ngram_range` `(1,1)` vs `(1,2)`, `min_df`, `max_features`, `C`) with cross-validation on the TRAINING split only. Never tune on the test set.
- Fit all learned preprocessing on training data only.
- Cap `max_features` so the saved pipeline stays small enough to commit or host (see Section 15).
- Save the fitted pipeline with Joblib. Only load model files you created yourself.

### 5.2 Transformer model
- Use `distilbert/distilbert-base-uncased-finetuned-sst-2-english` with its matching tokenizer via Hugging Face Transformers. Run it in inference mode, load and cache it once, and never train a Transformer from scratch.
- Truncate to the model's maximum length (512 tokens) and document this policy. Many IMDb reviews are longer than that.
- Verify the output label mapping explicitly (check the model config `id2label`) instead of assuming index 0/1.
- The Transformer and the TF-IDF pipeline use different text representations, so keep their preprocessing separate.
- A softmax score and a Logistic Regression probability are not calibrated the same way. Label each score by model and never claim they are directly comparable.
- Document that this checkpoint was fine-tuned on SST-2, not IMDb. It is a pretrained sentiment model evaluated on a different dataset, which is a limitation to state in the README.

---

## 6. Dataset and Evaluation Protocol
- Dataset: IMDb (`stanfordnlp/imdb` on Hugging Face) with binary labels. Keep the official train and test splits separate.
- Inspect label balance, missing values, duplicates and review length distribution.
- Create a fixed evaluation sample: a seeded (seed 42), stratified sample of the IMDb test split, default 5,000 reviews (2,500 per class), set in `src/config.py`.
- Both models are evaluated on exactly this same sample, with consistent label definitions (0 = negative, 1 = positive).
- Optionally also report the baseline on the full test split, clearly labeled as a separate row.
- Record dataset version, split, sample size, seed, model identifier, configuration and evaluation date in the report.
- Do not invent performance numbers. Every number in the README must come from `reports/model_comparison.csv` produced by the evaluation script.

| Metric | What it measures |
|---|---|
| Accuracy | Fraction of all predictions that are correct. |
| Precision | Of predicted positives, the fraction that are truly positive. |
| Recall | Of actual positives, the fraction correctly identified. |
| F1-score | Harmonic mean of precision and recall. |
| Confusion matrix | Counts of correct and incorrect predictions by class. |
| Disagreement analysis (core) | Reviews where the two models predict different labels, with a short explanation of the pattern. |
| Inference time (optional) | Measured latency per review under documented conditions (CPU, batch size). |

---

## 7. Technology Stack
- Python 3.10+
- Pandas / NumPy
- Scikit-learn
- Hugging Face Transformers
- PyTorch (CPU)
- Hugging Face Datasets
- Streamlit
- Matplotlib
- Joblib
- Git / GitHub
- Hugging Face Spaces
- pytest

---

## 8. Repository Structure
```
ReviewLens-AI/
|-- app.py                    # Streamlit UI only (no training here)
|-- requirements.txt          # pinned, tested versions
|-- README.md
|-- LICENSE
|-- .gitignore
|-- data/
|   `-- README.md             # how the dataset is loaded; no raw data committed
|-- src/
|   |-- config.py             # seed, sample size, paths, model ids, max length
|   |-- data_loader.py
|   |-- preprocessing.py
|   |-- train_baseline.py
|   |-- baseline_model.py
|   |-- transformer_model.py
|   |-- evaluation.py
|   `-- comparison.py
|-- notebooks/
|   `-- exploratory_analysis.ipynb
|-- models/
|   `-- README.md             # baseline .joblib lives here if small enough
|-- reports/
|   |-- model_comparison.csv
|   |-- disagreements.csv
|   `-- figures/
|-- tests/
|   |-- test_preprocessing.py
|   `-- test_predictions.py
`-- screenshots/
    `-- app_preview.png
```

---

## 9. Antigravity Setup and Operating Rules

### 9.2 Project rules
1. Follow `docs/BLUEPRINT.md`. Do not add features outside the current phase.
2. NEVER invent, estimate or hard-code metrics. All numbers come from scripts that write `reports/*.csv`.
3. Fit TF-IDF and any learned preprocessing on the training split only. Tune with cross-validation on train, never on test.
4. Use seed 42. Put seed, sample size, paths, model ids and max length in `src/config.py`.
5. Keep modules separate: training, inference, evaluation and UI. `app.py` must not train anything.
6. Both models are evaluated on the identical sample defined in `src/config.py`.
7. Commands target Windows PowerShell with a `.venv` virtual environment.
8. Before any run expected to take more than a few minutes, show the estimate and wait for approval.
9. After installing, record the exact tested versions in `requirements.txt`.
10. Do not commit datasets, `.venv`, caches or files larger than the limit in Section 15.
11. At the end of each phase, output: what changed, how to verify it, and any assumption made.
