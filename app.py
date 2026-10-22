"""ReviewLens AI: Streamlit Web Application.

Provides an interactive side-by-side sentiment analysis interface comparing:
1. Traditional ML Baseline (TF-IDF + Logistic Regression)
2. Contextual Transformer (DistilBERT SST-2 Pretrained)

Includes live inference, disagreement detection, and benchmark metric visualization.
"""

from pathlib import Path
import pandas as pd
from PIL import Image
import streamlit as st

from src.baseline_model import load_baseline_pipeline, predict_sentiment_baseline
from src.config import (
    DISAGREEMENTS_CSV,
    FIGURES_DIR,
    MODEL_COMPARISON_CSV,
    TRANSFORMER_MAX_LENGTH,
    TRANSFORMER_MODEL_ID,
)
from src.transformer_model import (
    get_transformer_components,
    predict_sentiment_transformer,
)

# Page configuration
st.set_page_config(
    page_title="ReviewLens AI | Sentiment Benchmark",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded",
)


# Model caching to ensure models are loaded strictly once into memory
@st.cache_resource(show_spinner="Loading Traditional ML baseline (TF-IDF + Logistic Regression)...")
def get_cached_baseline():
    """Load and cache the trained Scikit-learn baseline pipeline."""
    return load_baseline_pipeline()


@st.cache_resource(show_spinner=f"Loading Pretrained Transformer ({TRANSFORMER_MODEL_ID})...")
def get_cached_transformer():
    """Load and cache the Hugging Face DistilBERT model and tokenizer."""
    return get_transformer_components()


# Custom UI Styling
st.markdown(
    """
    <style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        color: #1E293B;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #475569;
        margin-bottom: 1.5rem;
    }
    .model-card {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        padding: 1.2rem;
        margin-bottom: 1rem;
    }
    .badge-pos {
        background-color: #DCFCE7;
        color: #166534;
        padding: 4px 12px;
        border-radius: 9999px;
        font-weight: 600;
        font-size: 0.95rem;
    }
    .badge-neg {
        background-color: #FEE2E2;
        color: #991B1B;
        padding: 4px 12px;
        border-radius: 9999px;
        font-weight: 600;
        font-size: 0.95rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# Header
st.markdown('<div class="main-header">🔍 ReviewLens AI</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="sub-header">Comparative Review Sentiment Analysis: Traditional Machine Learning vs Pretrained Transformer</div>',
    unsafe_allow_html=True,
)

# Navigation tabs
tab_analyze, tab_benchmark, tab_methodology = st.tabs(
    ["🧪 Live Sentiment Analyzer", "📊 Benchmark & Evaluation Report", "ℹ️ Methodology & Architecture"]
)

# ==========================================
# TAB 1: LIVE SENTIMENT ANALYZER
# ==========================================
with tab_analyze:
    st.markdown("### Test Any Review")
    st.write(
        "Enter any custom or online review below to observe real-time predictions, class probabilities, and model agreement."
    )

    # Preset sample options for convenience
    preset_samples = {
        "Custom": "",
        "Positive Masterpiece": "An absolute cinematic triumph! The emotional depth, breathtaking score, and stellar performances made this an unforgettable masterpiece.",
        "Negative Critique": "A completely uninspired, incoherent disaster. Terrible pacing, wooden dialogue, and lazy directing completely ruined whatever potential the story had.",
        "Subtle Sarcasm / Disagreement Case": "I was looking forward to a thrilling mystery, but instead received a two-hour cure for insomnia. Wonderful photography of people doing absolutely nothing.",
        "Mixed Sentiments": "The visual effects and action choreography were undeniably stunning, but the paper-thin characters and convoluted third act left me somewhat cold.",
    }

    selected_sample = st.selectbox("Select a quick preset sample or choose 'Custom':", list(preset_samples.keys()))
    default_text = preset_samples[selected_sample]

    review_input = st.text_area(
        "Review Text:",
        value=default_text,
        height=140,
        placeholder="Type or paste your review here...",
        help="Input review text in English. Reviews are evaluated side-by-side.",
    )

    col_btn, col_clear = st.columns([1, 5])
    with col_btn:
        analyze_clicked = st.button("🚀 Analyze Sentiment", type="primary", use_container_width=True)

    if analyze_clicked:
        cleaned_input = review_input.strip()

        # Input Validation
        if not cleaned_input:
            st.error("⚠️ Review cannot be empty. Please enter non-empty text to analyze.")
        else:
            word_count = len(cleaned_input.split())
            if word_count > TRANSFORMER_MAX_LENGTH:
                st.warning(
                    f"⚠️ Long Review Notice: Input contains {word_count} words. DistilBERT will truncate "
                    f"to the initial {TRANSFORMER_MAX_LENGTH} tokens, whereas the TF-IDF baseline processes the full document."
                )

            # Load models
            baseline_pipe = get_cached_baseline()
            # Ensure transformer is cached
            _ = get_cached_transformer()

            # Execute predictions
            base_res = predict_sentiment_baseline(baseline_pipe, cleaned_input)
            trans_res = predict_sentiment_transformer(cleaned_input)

            # Disagreement Banner
            models_disagree = base_res["label"] != trans_res["label"]
            st.markdown("---")

            if models_disagree:
                st.warning(
                    "⚡ **Model Disagreement Detected!** The traditional n-gram baseline and the deep contextual transformer "
                    f"produced conflicting predictions (`{base_res['label']}` vs `{trans_res['label']}`)."
                )
            else:
                st.success(
                    f"🤝 **Consensus Reached:** Both models unanimously predict **{base_res['label'].upper()}** sentiment."
                )

            # Side-by-Side Model Comparison Cards
            col_left, col_right = st.columns(2)

            with col_left:
                st.markdown("#### 1️⃣ Traditional Baseline")
                st.caption("TF-IDF (1-2 Grams, 15k Features) + Logistic Regression")

                badge_class = "badge-pos" if base_res["label"] == "Positive" else "badge-neg"
                icon = "🟢" if base_res["label"] == "Positive" else "🔴"

                st.markdown(
                    f"**Predicted Sentiment:** {icon} <span class='{badge_class}'>{base_res['label']}</span>",
                    unsafe_allow_html=True,
                )
                st.metric("Model Confidence", f"{base_res['confidence'] * 100:.1f}%")
                st.progress(float(base_res["confidence"]))

                st.markdown("**Probability Distribution:**")
                st.write(f"- Positive: `{base_res['pos_probability'] * 100:.2f}%`")
                st.write(f"- Negative: `{base_res['neg_probability'] * 100:.2f}%`")
                st.caption("⚡ Latency: **~0.45 ms** | Trained directly on IMDb Train split")

            with col_right:
                st.markdown("#### 2️⃣ Contextual Transformer")
                st.caption(f"DistilBERT ({TRANSFORMER_MODEL_ID.split('/')[-1]})")

                badge_class_t = "badge-pos" if trans_res["label"] == "Positive" else "badge-neg"
                icon_t = "🟢" if trans_res["label"] == "Positive" else "🔴"

                st.markdown(
                    f"**Predicted Sentiment:** {icon_t} <span class='{badge_class_t}'>{trans_res['label']}</span>",
                    unsafe_allow_html=True,
                )
                st.metric("Model Confidence", f"{trans_res['confidence'] * 100:.1f}%")
                st.progress(float(trans_res["confidence"]))

                st.markdown("**Softmax Score Distribution:**")
                st.write(f"- Positive: `{trans_res['pos_probability'] * 100:.2f}%`")
                st.write(f"- Negative: `{trans_res['neg_probability'] * 100:.2f}%`")
                st.caption("⚡ Latency: **~250.7 ms** | Pretrained on SST-2 English")

            # Methodological disclaimer on confidence scores
            st.info(
                "💡 **Score Calibration Note:** Confidence scores represent the probability outputs of each respective model "
                "(sigmoid/logistic probability for the baseline vs softmax temperature output for DistilBERT). They are **not directly comparable** "
                "in absolute magnitude across model architectures."
            )

# ==========================================
# TAB 2: BENCHMARK & EVALUATION REPORT
# ==========================================
with tab_benchmark:
    st.markdown("### Quantitative Evaluation on Held-Out Test Sample")
    st.write(
        "Both models were rigorously benchmarked on an identical, seeded (`seed=42`), stratified 1,000-review sample "
        "from the IMDb held-out test split (500 positive, 500 negative). Accuracy and metrics are derived strictly from ground truth."
    )

    if MODEL_COMPARISON_CSV.exists():
        comp_df = pd.read_csv(MODEL_COMPARISON_CSV)

        # Highlight metric cards
        card_cols = st.columns(4)
        with card_cols[0]:
            st.metric("Baseline Accuracy", f"{comp_df.iloc[0]['accuracy'] * 100:.2f}%")
        with card_cols[1]:
            st.metric("Transformer Accuracy", f"{comp_df.iloc[1]['accuracy'] * 100:.2f}%")
        with card_cols[2]:
            st.metric("Baseline F1-Score", f"{comp_df.iloc[0]['f1_score']:.4f}")
        with card_cols[3]:
            st.metric("Transformer F1-Score", f"{comp_df.iloc[1]['f1_score']:.4f}")

        st.markdown("#### Detailed Benchmark Comparison")
        display_df = comp_df[
            [
                "model_name",
                "model_type",
                "accuracy",
                "precision",
                "recall",
                "f1_score",
                "avg_latency_ms",
                "sample_size",
                "seed",
            ]
        ].copy()
        display_df["accuracy"] = display_df["accuracy"].map(lambda x: f"{x*100:.2f}%")
        display_df["precision"] = display_df["precision"].map(lambda x: f"{x:.4f}")
        display_df["recall"] = display_df["recall"].map(lambda x: f"{x:.4f}")
        display_df["f1_score"] = display_df["f1_score"].map(lambda x: f"{x:.4f}")
        display_df["avg_latency_ms"] = display_df["avg_latency_ms"].map(lambda x: f"{x:.2f} ms")

        st.dataframe(display_df, use_container_width=True, hide_index=True)
    else:
        st.warning("Benchmark CSV not found. Run `python -m src.comparison` to generate.")

    st.markdown("---")
    st.markdown("#### Side-by-Side Confusion Matrices")
    cm_img_path = FIGURES_DIR / "confusion_matrix_side_by_side.png"
    if cm_img_path.exists():
        img = Image.open(cm_img_path)
        st.image(img, caption="Confusion Matrices evaluated on identical seeded held-out test split (N=1,000)", use_container_width=True)
    else:
        st.info("Side-by-side confusion matrix figure will appear here after running comparison.")

    st.markdown("---")
    st.markdown("#### Disagreement Analysis")
    if DISAGREEMENTS_CSV.exists():
        dis_df = pd.read_csv(DISAGREEMENTS_CSV)
        st.write(
            f"Out of 1,000 held-out evaluations, the two models disagreed on **{len(dis_df)} reviews ({len(dis_df)/10:.1f}%)**."
        )

        outcome_counts = dis_df["outcome"].value_counts().reset_index()
        outcome_counts.columns = ["Outcome Category", "Count"]
        st.dataframe(outcome_counts, use_container_width=True, hide_index=True)

        st.markdown("**Explore Disagreement Samples:**")
        filter_outcome = st.selectbox("Filter by outcome:", ["All"] + list(dis_df["outcome"].unique()))
        filtered_df = dis_df if filter_outcome == "All" else dis_df[dis_df["outcome"] == filter_outcome]

        st.dataframe(
            filtered_df[
                [
                    "eval_index",
                    "true_label",
                    "baseline_prediction",
                    "baseline_confidence",
                    "transformer_prediction",
                    "transformer_confidence",
                    "outcome",
                    "review_text",
                ]
            ].head(25),
            use_container_width=True,
            hide_index=True,
        )

# ==========================================
# TAB 3: METHODOLOGY & ARCHITECTURE
# ==========================================
with tab_methodology:
    st.markdown("### System Architecture & Experimental Integrity")
    st.markdown(
        """
        ReviewLens AI is designed to test how traditional, feature-engineered linear models compare against deep bidirectional Transformers
        for document-level sentiment classification under strict reproducibility constraints.

        #### 1. Data Integrity & Leakage Prevention
        - **Training Set Quarantine**: Hyperparameter tuning (`C`, n-gram range, max features) was conducted via 3-fold cross-validation strictly on the 25,000-review training set.
        - **Zero Test Contamination**: Neither TF-IDF vocabulary extraction nor IDF weighting ever saw test review texts during training.
        - **Seeded Evaluation Sample**: Exactly 1,000 reviews (500 positive, 500 negative) were sampled with `seed=42` (`data/eval_sample_indices.json`).

        #### 2. Model Paradigms
        - **Traditional Baseline**:
          - Pipeline: HTML entity stripping + Lowercasing -> `TfidfVectorizer(ngram_range=(1,2), max_features=15,000)` -> `LogisticRegression(C=2.0)`.
          - Serialized with `joblib` into a lightweight 0.28 MB model artifact.
          - Extremely fast inference: ~0.45 ms per review.
        - **Contextual Transformer**:
          - Hugging Face `distilbert/distilbert-base-uncased-finetuned-sst-2-english`.
          - Input truncation capped at 512 tokens.
          - Inference mode execution with batched PyTorch tensors.

        #### 3. Key Observations & Trade-offs
        - **In-Domain vs Out-of-Domain**: The TF-IDF + Logistic Regression model was trained directly on IMDb movie reviews, achieving **91.30% accuracy** on the held-out IMDb test sample. In contrast, DistilBERT was fine-tuned on Stanford Sentiment Treebank (SST-2, sentence-length reviews), achieving **89.00% accuracy** when transferred zero-shot to long-form IMDb movie reviews.
        - **Latency vs Context**: The traditional pipeline is over **500x faster** on CPU while retaining competitive accuracy for long documents.
        """
    )
