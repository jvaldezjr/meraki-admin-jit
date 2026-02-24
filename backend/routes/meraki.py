"""
Meraki API proxy routes.

Uses two API keys when set:
- MERAKI_USER_API_KEY: used for My Access page (getOrganizations / my-organizations).
- MERAKI_SERVICE_API_KEY: used for Request Access page (organizations dropdown).
Falls back to MERAKI_DASHBOARD_API_KEY for either if the specific key is not set.
Organizations response is cached in-memory per key to avoid slow/repeated Meraki API calls.
"""

import os
import logging
import time
import hashlib
from flask import Blueprint, jsonify

logger = logging.getLogger(__name__)
meraki_bp = Blueprint('meraki', __name__, url_prefix='/api/meraki')

# Base URL for organization dashboard links
MERAKI_DASHBOARD_ORG_BASE = 'https://dashboard.meraki.com/o'

# In-memory cache for getOrganizations: { cache_key: (result_list, expiry_timestamp) }
_organizations_cache = {}
ORGANIZATIONS_CACHE_TTL_SECONDS = 3600  # 1 hour
# Request timeout for Meraki SDK (seconds)
MERAKI_REQUEST_TIMEOUT = 30


def _get_user_api_key():
    """API key for My Access page (user view). Prefer MERAKI_USER_API_KEY, else MERAKI_DASHBOARD_API_KEY."""
    return os.getenv('MERAKI_USER_API_KEY') or os.getenv('MERAKI_DASHBOARD_API_KEY')


def _get_service_api_key():
    """API key for Request Access page (organizations dropdown). Prefer MERAKI_SERVICE_API_KEY, else MERAKI_DASHBOARD_API_KEY."""
    return os.getenv('MERAKI_SERVICE_API_KEY') or os.getenv('MERAKI_DASHBOARD_API_KEY')


def _user_from_request():
    """Require auth; returns (user_data, error_response)."""
    from routes.auth import _user_from_request as auth_user
    return auth_user()


def _cache_key(api_key: str) -> str:
    """Stable cache key for the given API key (no key stored in plain text)."""
    return hashlib.sha256(api_key.encode()).hexdigest()[:32]


def _fetch_organizations_from_meraki(api_key: str):
    """Call Meraki API and return list of org dicts. No caching."""
    from meraki import DashboardAPI
    dashboard = DashboardAPI(
        api_key=api_key,
        suppress_logging=True,
        single_request_timeout=MERAKI_REQUEST_TIMEOUT,
        maximum_retries=2,
    )
    raw = dashboard.organizations.getOrganizations()
    return list(raw) if raw is not None else []


def _build_organizations_response(orgs: list) -> list:
    """Map raw Meraki org list to { id, name, link }."""
    result = []
    for org in orgs:
        org_id = org.get('id') or ''
        name = org.get('name') or ''
        link = (org.get('url') or '').strip() or (
            f"{MERAKI_DASHBOARD_ORG_BASE}/{org_id}/overview" if org_id else ''
        )
        result.append({'id': org_id, 'name': name, 'link': link})
    return result


def _get_organizations_impl(api_key: str):
    """
    Shared implementation: resolve cache or fetch from Meraki, return list of { id, name, link }.
    Caller must ensure api_key is non-empty.
    """
    cache_key = _cache_key(api_key)
    now = time.monotonic()
    if cache_key in _organizations_cache:
        cached_result, expiry = _organizations_cache[cache_key]
        if now < expiry:
            return cached_result
    orgs = _fetch_organizations_from_meraki(api_key)
    result = _build_organizations_response(orgs)
    _organizations_cache[cache_key] = (result, now + ORGANIZATIONS_CACHE_TTL_SECONDS)
    return result


@meraki_bp.route('/organizations')
def get_organizations():
    """
    List organizations for the Request Access page (organizations dropdown).
    Uses MERAKI_SERVICE_API_KEY (fallback: MERAKI_DASHBOARD_API_KEY).
    Returns list of { id, name, link }. Cached per key for 1 hour.
    """
    user_data, err = _user_from_request()
    if err:
        return err
    if not user_data:
        return jsonify({"error": "Not authenticated"}), 401

    api_key = _get_service_api_key()
    if not api_key:
        logger.warning("MERAKI_SERVICE_API_KEY / MERAKI_DASHBOARD_API_KEY not set")
        return jsonify({"error": "Meraki API not configured"}), 503

    try:
        result = _get_organizations_impl(api_key)
        return jsonify(result)
    except Exception as e:
        logger.exception("Meraki getOrganizations (service) failed")
        return jsonify({"error": "Failed to fetch organizations", "detail": str(e)}), 502


@meraki_bp.route('/my-organizations')
def get_my_organizations():
    """
    List organizations for the My Access page (user view).
    Uses MERAKI_USER_API_KEY (fallback: MERAKI_DASHBOARD_API_KEY).
    Returns list of { id, name, link }. Cached per key for 1 hour.
    """
    user_data, err = _user_from_request()
    if err:
        return err
    if not user_data:
        return jsonify({"error": "Not authenticated"}), 401

    api_key = _get_user_api_key()
    if not api_key:
        logger.warning("MERAKI_USER_API_KEY / MERAKI_DASHBOARD_API_KEY not set")
        return jsonify({"error": "Meraki API not configured"}), 503

    try:
        result = _get_organizations_impl(api_key)
        return jsonify(result)
    except Exception as e:
        logger.exception("Meraki getOrganizations (user) failed")
        return jsonify({"error": "Failed to fetch organizations", "detail": str(e)}), 502
