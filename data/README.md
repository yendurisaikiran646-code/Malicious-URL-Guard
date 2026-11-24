# Dataset Provenance & Schema Documentation

## Overview
This dataset contains labelled URLs intended for training and evaluating lexical URL classifiers for academic and prototype demonstration purposes.

## Schema
The CSV file `sample_urls.csv` contains two columns:
- `url` (string): The uniform resource locator.
- `label` (integer):
  - `0`: Benign URL
  - `1`: Malicious / Phishing / Suspicious URL

## Provenance & Composition
- **Benign URLs (label 0)**: Sampled from trusted domain registries, top web services, open-source repositories, university domains (.edu), government portals (.gov), and documentation sites.
- **Malicious URLs (label 1)**: Curated examples exhibiting known attack patterns:
  - IP-based host addressing (e.g., `http://192.168.1.100/login`)
  - Domain impersonation and brand squatting (e.g., `paypal-verification-center.info`)
  - Deep subdomain chains (e.g., `secure.login.account.update.fakebank.com`)
  - High Shannon entropy algorithmic domains (DGA)
  - Credential harvesting keywords (`login`, `verify`, `update`, `banking`, `token`, `recover`)
  - Non-standard administrative ports (`:8080`, `:8888`, `:8443`)

## Academic Disclaimer
This dataset is provided for demonstration, testing, and research prototyping. Machine learning models trained on lexical features alone cannot detect all zero-day threats or newly registered benign domains.
