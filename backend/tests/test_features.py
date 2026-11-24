import pytest
import sys
import os

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.feature_extraction import (
    extract_features,
    extract_features_vector,
    calculate_shannon_entropy,
    FEATURE_NAMES,
)


def test_feature_names_list_complete():
    """Ensure canonical feature names list is defined and non-empty."""
    assert len(FEATURE_NAMES) == 22
    assert "url_length" in FEATURE_NAMES
    assert "entropy" in FEATURE_NAMES
    assert "is_ip_address" in FEATURE_NAMES


def test_standard_https_url():
    """Test feature extraction on a standard HTTPS domain."""
    url = "https://www.wikipedia.org/wiki/Random_forest"
    feats = extract_features(url)
    vector = extract_features_vector(url)

    assert len(vector) == len(FEATURE_NAMES)
    assert feats["is_https"] == 1
    assert feats["is_ip_address"] == 0
    assert feats["has_non_standard_port"] == 0
    assert feats["path_depth"] == 2
    assert feats["is_punycode"] == 0
    assert feats["url_length"] == len(url)


def test_ip_address_host_detection():
    """Test detection of raw IPv4 host with port."""
    url = "http://192.168.1.100:8080/admin/login.php"
    feats = extract_features(url)

    assert feats["is_ip_address"] == 1
    assert feats["has_non_standard_port"] == 1
    assert feats["is_https"] == 0
    assert feats["suspicious_token_count"] >= 2  # 'admin', 'login'


def test_punycode_detection():
    """Test detection of IDN / Punycode domain."""
    url = "http://xn--gogle-pua.com/auth/verify"
    feats = extract_features(url)

    assert feats["is_punycode"] == 1
    assert feats["suspicious_token_count"] >= 2  # 'auth', 'verify'


def test_subdomain_counting():
    """Test accurate count of subdomains."""
    url = "https://secure.login.portal.bank.example.com/account"
    feats = extract_features(url)

    # hostname: secure.login.portal.bank.example.com -> parts: 6 -> subdomains: 4
    assert feats["num_subdomains"] >= 3
    assert feats["suspicious_token_count"] >= 3  # 'secure', 'login', 'account'


def test_shannon_entropy():
    """Test entropy calculation."""
    assert calculate_shannon_entropy("") == 0.0
    assert calculate_shannon_entropy("aaaaaa") == 0.0
    # Random-like strings should have higher entropy
    low_ent = calculate_shannon_entropy("abcdef")
    high_ent = calculate_shannon_entropy("098234yisdufh98234yhsdf98234")
    assert high_ent > 3.0


def test_empty_and_malformed_url():
    """Ensure malformed or empty URLs don't raise exceptions."""
    empty_feats = extract_features("")
    assert empty_feats["url_length"] == 0
    assert empty_feats["is_ip_address"] == 0

    weird_url = ":::invalid//??&&"
    weird_feats = extract_features(weird_url)
    assert isinstance(weird_feats, dict)
    assert len(extract_features_vector(weird_url)) == len(FEATURE_NAMES)
