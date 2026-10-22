"""CLI helper for single-review inference across both models.
Outputs JSON for consumption by web/API layers.
"""

import json
import sys
import time
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.baseline_model import load_baseline_pipeline, predict_sentiment_baseline
from src.transformer_model import predict_sentiment_transformer


def analyze_review(text: str) -> dict:
    if not text or not text.strip():
        return {"error": "Empty review text provided"}

    # Measure Baseline Latency
    t0 = time.perf_counter()
    baseline_pipe = load_baseline_pipeline()
    b_res = predict_sentiment_baseline(baseline_pipe, text)
    b_lat = (time.perf_counter() - t0) * 1000

    # Measure Transformer Latency
    t1 = time.perf_counter()
    t_res = predict_sentiment_transformer(text)
    t_lat = (time.perf_counter() - t1) * 1000

    words = text.split()
    word_count = len(words)
    agree = b_res["label"] == t_res["label"]

    return {
        "text": text,
        "word_count": word_count,
        "char_count": len(text),
        "is_truncated": word_count > 450,
        "agree": agree,
        "baseline": {
            "model": b_res["model"],
            "label": b_res["label"],
            "confidence": b_res["confidence"],
            "pos_prob": b_res["pos_probability"],
            "neg_prob": b_res["neg_probability"],
            "latency_ms": round(b_lat, 2),
        },
        "transformer": {
            "model": t_res["model"],
            "label": t_res["label"],
            "confidence": t_res["confidence"],
            "pos_prob": t_res["pos_probability"],
            "neg_prob": t_res["neg_probability"],
            "latency_ms": round(t_lat, 2),
        },
    }


if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_text = " ".join(sys.argv[1:])
    else:
        input_text = sys.stdin.read()

    res = analyze_review(input_text)
    print(json.dumps(res, indent=2))
