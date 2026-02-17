"""
Meraki API proxy routes.

Uses the dashboard-api-python library server-side; API key stays in env (MERAKI_DASHBOARD_API_KEY).
"""

import os
import logging
from flask import Blueprint, jsonify

logger = logging.getLogger(__name__)
meraki_bp = Blueprint('meraki', __name__, url_prefix='/api/meraki')

# Base URL for organization dashboard links
MERAKI_DASHBOARD_ORG_BASE = 'https://dashboard.meraki.com/o'


def _user_from_request():
    """Require auth; returns (user_data, error_response)."""
    from flask import request
    from routes.auth import _user_from_request as auth_user
    return auth_user()


@meraki_bp.route('/organizations')
def get_organizations():
    """
    List organizations the configured API key can access.
    Returns list of { id, name, link } for the My Access table.
    """
    user_data, err = _user_from_request()
    if err:
        return err
    if not user_data:
        return jsonify({"error": "Not authenticated"}), 401

    api_key = os.getenv('MERAKI_DASHBOARD_API_KEY')
    if not api_key:
        logger.warning("MERAKI_DASHBOARD_API_KEY not set")
        return jsonify({"error": "Meraki API not configured"}), 503

    try:
        from meraki import DashboardAPI
        dashboard = DashboardAPI(api_key=api_key, suppress_logging=True)
        raw = dashboard.organizations.getOrganizations()
        orgs = list(raw) if raw is not None else []
    except Exception as e:
        logger.exception("Meraki getOrganizations failed")
        return jsonify({"error": "Failed to fetch organizations", "detail": str(e)}), 502

    result = []
    for org in orgs:
        org_id = org.get('id') or ''
        name = org.get('name') or ''
        link = f"{MERAKI_DASHBOARD_ORG_BASE}/{org_id}/overview" if org_id else ''
        result.append({
            'id': org_id,
            'name': name,
            'link': link,
        })
    return jsonify(result)
