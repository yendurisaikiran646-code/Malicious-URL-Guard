"""
Pure Lexical URL Feature Extractor
Extracts lexical features strictly from the URL string without network calls or DNS resolution.
"""

import math
import re
from urllib.parse import urlparse
from typing import Dict, List, Any

# Canonical list of feature names in strict order
FEATURE_NAMES: List[str] = [
    "url_length",
    "hostname_length",
    "path_length",
    "query_length",
    "count_dots",
    "count_hyphens",
    "count_digits",
    "count_slashes",
    "count_question_marks",
    "count_equal_signs",
    "count_at_signs",
    "count_percent_signs",
    "count_underscores",
    "is_https",
    "num_subdomains",
    "is_ip_address",
    "has_non_standard_port",
    "suspicious_token_count",
    "is_punycode",
    "is_long_hostname",
    "path_depth",
    "entropy",
]

# Regex for IPv4 address host
IPV4_REGEX = re.compile(
    r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
)

# Common sensitive or phishing-associated keywords
SUSPICIOUS_TOKENS = [
    "login",
    "verify",
    "update",
    "account",
    "banking",
    "secure",
    "signin",
    "sign-in",
    "paypal",
    "confirm",
    "password",
    "auth",
    "recovery",
    "alert",
    "token",
    "wallet",
    "claim",
    "security",
    "support",
    "billing",
    "admin",
]


def calculate_shannon_entropy(text: str) -> float:
    """Calculate Shannon entropy of a string."""
    if not text:
        return 0.0
    freq: Dict[str, int] = {}
    for char in text:
        freq[char] = freq.get(char, 0) + 1
    length = len(text)
    entropy = 0.0
    for count in freq.values():
        p = count / length
        entropy -= p * math.log2(p)
    return round(entropy, 4)


def normalize_url_for_parsing(url: str) -> str:
    """Ensure URL has a scheme for correct urllib.parse decomposition."""
    url = url.strip()
    if not url:
        return ""
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", url):
        return f"http://{url}"
    return url


def extract_features(raw_url: str) -> Dict[str, Any]:
    """
    Extract lexical features from a URL string.
    GUARANTEE: No network requests, DNS lookups, or external connections.
    """
    cleaned_url = raw_url.strip() if raw_url else ""
    norm_url = normalize_url_for_parsing(cleaned_url)

    try:
        parsed = urlparse(norm_url)
        scheme = parsed.scheme.lower()
        netloc = parsed.netloc.lower()
        path = parsed.path
        query = parsed.query
    except Exception:
        scheme = ""
        netloc = ""
        path = ""
        query = ""

    # Separate hostname from port if present
    hostname = netloc.split(":")[0] if netloc else ""
    port = None
    if ":" in netloc:
        parts = netloc.split(":")
        if len(parts) > 1 and parts[-1].isdigit():
            port = int(parts[-1])

    # 1. Length features
    url_length = len(cleaned_url)
    hostname_length = len(hostname)
    path_length = len(path)
    query_length = len(query)

    # 2. Character counts
    count_dots = cleaned_url.count(".")
    count_hyphens = cleaned_url.count("-")
    count_digits = sum(c.isdigit() for c in cleaned_url)
    count_slashes = cleaned_url.count("/")
    count_question_marks = cleaned_url.count("?")
    count_equal_signs = cleaned_url.count("=")
    count_at_signs = cleaned_url.count("@")
    count_percent_signs = cleaned_url.count("%")
    count_underscores = cleaned_url.count("_")

    # 3. Protocol and host patterns
    is_https = 1 if scheme == "https" else 0

    # Subdomains count (e.g., sub.example.com -> 1, a.b.example.com -> 2)
    host_parts = [p for p in hostname.split(".") if p]
    if len(host_parts) > 2:
        num_subdomains = len(host_parts) - 2
    else:
        num_subdomains = 0

    # IP address host indicator
    is_ip_address = 1 if IPV4_REGEX.match(hostname) else 0

    # Non-standard port
    if port is not None and port not in (80, 443):
        has_non_standard_port = 1
    else:
        has_non_standard_port = 0

    # Suspicious keywords in hostname and path
    url_lower = cleaned_url.lower()
    suspicious_token_count = sum(1 for token in SUSPICIOUS_TOKENS if token in url_lower)

    # Punycode / IDN
    is_punycode = 1 if "xn--" in hostname else 0

    # Long hostname
    is_long_hostname = 1 if hostname_length > 30 else 0

    # Path depth (number of directory components)
    path_depth = len([segment for segment in path.split("/") if segment])

    # Shannon entropy
    entropy = calculate_shannon_entropy(cleaned_url)

    features: Dict[str, Any] = {
        "url_length": url_length,
        "hostname_length": hostname_length,
        "path_length": path_length,
        "query_length": query_length,
        "count_dots": count_dots,
        "count_hyphens": count_hyphens,
        "count_digits": count_digits,
        "count_slashes": count_slashes,
        "count_question_marks": count_question_marks,
        "count_equal_signs": count_equal_signs,
        "count_at_signs": count_at_signs,
        "count_percent_signs": count_percent_signs,
        "count_underscores": count_underscores,
        "is_https": is_https,
        "num_subdomains": num_subdomains,
        "is_ip_address": is_ip_address,
        "has_non_standard_port": has_non_standard_port,
        "suspicious_token_count": suspicious_token_count,
        "is_punycode": is_punycode,
        "is_long_hostname": is_long_hostname,
        "path_depth": path_depth,
        "entropy": entropy,
    }

    return features


def extract_features_vector(raw_url: str) -> List[float]:
    """Return features as a numerical list strictly aligned with FEATURE_NAMES."""
    feats = extract_features(raw_url)
    return [float(feats[name]) for name in FEATURE_NAMES]
