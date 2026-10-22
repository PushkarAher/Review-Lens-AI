"""Unit tests for text preprocessing in ReviewLens AI."""

import pytest
from src.preprocessing import clean_text, clean_texts


def test_clean_text_lowercase():
    """Verify that uppercase letters are converted to lowercase."""
    raw = "AN EXCELLENT FILM WITH BRILLIANT PERFORMANCES!"
    expected = "an excellent film with brilliant performances!"
    assert clean_text(raw) == expected


def test_clean_text_strips_html_breaks():
    """Verify that <br />, <br>, and <br/> tags are stripped and replaced with spaces."""
    raw = "First line.<br /><br />Second line.<br>Third line.<br/>Done."
    cleaned = clean_text(raw)
    assert "<br" not in cleaned
    assert "/" not in cleaned
    assert "first line. second line. third line. done." == cleaned


def test_clean_text_whitespace_normalization():
    """Verify that multiple tabs, spaces, and newlines collapse into single spaces."""
    raw = "   Too    much   \t\n   whitespace!   "
    cleaned = clean_text(raw)
    assert cleaned == "too much whitespace!"


def test_clean_text_empty_input():
    """Verify that empty, None, and whitespace-only strings return empty strings."""
    assert clean_text("") == ""
    assert clean_text("   ") == ""
    assert clean_text(None) == ""


def test_clean_text_only_html_tags():
    """Verify that a string with only HTML break tags becomes empty."""
    raw = "<br /><br><br/>"
    assert clean_text(raw) == ""


def test_clean_texts_batch():
    """Verify that batch cleaning processes lists of texts correctly."""
    batch = ["Great movie!<br />", "BAD FILM!"]
    results = clean_texts(batch)
    assert len(results) == 2
    assert results[0] == "great movie!"
    assert results[1] == "bad film!"
