# Privacy & Threat Model Safeguards

## 1. Zero URL Fetching Guarantee
The feature extraction pipeline operates **strictly in-memory** on the provided string. At no point does the backend or extension:
- Issue HTTP/HTTPS GET, POST, or HEAD requests to the submitted URL.
- Initiate DNS resolution queries to unverified hosts.
- Download web pages, execute client JavaScript, or parse DOM trees.

**Threat Mitigated**: Drive-by exploits, browser zero-days, and attacker tracking pixels triggered merely by inspecting a link.

## 2. Query Parameter & Credential Stripping
Query strings frequently contain sensitive authentication tokens (e.g. `?token=...`, `?auth_key=...`, `?session=...`, or password resets).

Before persisting any scan event to the SQLite database (`scans.db`), the sanitization function (`sanitize_url_for_storage`) strips:
- User authentication fragments (`user:pass@`)
- All query parameters (`?key=val`)
- Fragment identifiers (`#section`)

Only the protocol, domain, port, and sanitized directory path are recorded.

## 3. Extension Least-Privilege Architecture
The browser extension follows strict Manifest V3 security principles:
- **No Broad Host Permissions**: The extension only communicates with the designated backend API (`http://127.0.0.1:8000/*`). It does NOT request `<all_urls>` permission.
- **Active Tab Only**: URL evaluation occurs only for the active tab upon explicit user invocation or navigation.
- **No Keystroke, Password, or DOM Inspection**: The extension does not read form inputs, cookies, local storage, or webpage text.
