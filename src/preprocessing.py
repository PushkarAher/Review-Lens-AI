"""Text preprocessing module for traditional ML baseline in ReviewLens AI.

Provides cleaning routines for raw movie reviews, specifically handling:
- Stripping HTML line break tags (<br />, <br>, <br/>)
- Lowercasing
- Collapsing multiple whitespace characters
"""

import re
from typing import List, Union

# Regex pattern matching HTML line breaks and common tags in IMDb reviews
HTML_TAG_PATTERN = re.compile(r"<br\s*/?>|<\s*br\s*>", flags=re.IGNORECASE)
WHITESPACE_PATTERN = re.compile(r"\s+")


def clean_text(text: str) -> str:
    """Clean a single raw review text.

    Args:
        text: Raw input review string.

    Returns:
        Cleaned, lowercased string with HTML breaks removed.
    """
    if not isinstance(text, str):
        text = str(text) if text is not None else ""

    # Replace HTML break tags with whitespace
    cleaned = HTML_TAG_PATTERN.sub(" ", text)

    # Lowercase
    cleaned = cleaned.lower()

    # Normalize multiple whitespace characters
    cleaned = WHITESPACE_PATTERN.sub(" ", cleaned).strip()

    return cleaned


def clean_texts(texts: Union[List[str], "pd.Series"]) -> List[str]:
    """Clean a collection of raw review texts.

    Args:
        texts: Iterable of raw strings.

    Returns:
        List of cleaned review strings.
    """
    return [clean_text(t) for t in texts]
