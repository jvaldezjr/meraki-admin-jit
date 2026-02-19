import React, { useState, useEffect } from 'react';
import { Button } from '@magnetic/button';
import { Container } from '@magnetic/container';
import { Flex } from '@magnetic/flex';
import { Select, useMultiSelectValue } from '@magnetic/select';
import { Text } from '@magnetic/text';
import { useAuth } from '../contexts/AuthContext';
import { useAccessRequests } from '../contexts/AccessRequestsContext';
import './RequestAccessPage.css';

/**
 * Label only (no input-style box). Uses @magnetic/input label classes so the label
 * matches Input; children (e.g. Select) render without an extra outer box.
 */
function LabeledField({ label, size = 'md', children, className }) {
  const labelClasses = [
    'mds-rebuild-input-frame',
    `mds-rebuild-input-label-size-${size}`,
    className,
  ].filter(Boolean).join(' ');
  return (
    <label className={labelClasses} style={{ display: 'block', textAlign: 'left' }}>
      <span>{label}</span>
      <div style={{ marginTop: 'var(--magnetic-spacing-xs, 4px)' }}>{children}</div>
    </label>
  );
}

const getApiBaseUrl = () =>
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

const PERMISSION_OPTIONS = [
  { value: 'read', label: 'Read' },
  { value: 'write', label: 'Write' },
];

const RequestAccessPage = () => {
  const { authHeaders, apiBaseUrl } = useAuth();
  const { addRequest } = useAccessRequests();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('read');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { onChange: onOrgsChange, onClear: onOrgsClear, value: selectedOrgIds } = useMultiSelectValue([]);

  const handleOrgsChange = (value, option, action) => {
    setSubmitted(false);
    onOrgsChange(value, option, action);
  };
  const handleOrgsClear = () => {
    setSubmitted(false);
    onOrgsClear();
  };

  useEffect(() => {
    let cancelled = false;
    const base = apiBaseUrl || getApiBaseUrl();
    fetch(`${base}/api/meraki/organizations`, { headers: authHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 503 ? 'Meraki API not configured' : res.statusText);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setOrganizations(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load organizations');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [apiBaseUrl, authHeaders]);

  const orgOptions = organizations.map((org) => ({
    value: org.id,
    label: org.name || org.id,
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedOrgIds.length) return;
    setSubmitting(true);
    const idToOrg = Object.fromEntries(organizations.map((o) => [o.id, o]));
    const items = selectedOrgIds.map((orgId) => ({
      orgId,
      orgName: (idToOrg[orgId] && idToOrg[orgId].name) || orgId,
      permission,
    }));
    addRequest(items);
    setSubmitted(true);
    setSubmitting(false);
    onOrgsClear();
  };

  return (
    <Container>
      <Flex direction="vertical" gap="lg" style={{ width: '100%', maxWidth: 720 }}>
        <Text variant="h2">Request Access</Text>
        <Text variant="body" color="subdued">
          Use this form to request access to one or more Meraki organizations with read or write permission.
          Depending on your role, your request may require approval or may be auto-approved.
        </Text>

        {error && (
          <Text variant="body" style={{ color: 'var(--magnetic-color-red-600, #dc2626)' }}>
            {error}
          </Text>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction="vertical" gap="md">
            <Flex align="flex-end" gap="md" style={{ flexWrap: 'wrap' }} className="request-access-selects">
              <LabeledField label="Scope">
                <Select.MultiSelect
                  disabled={loading}
                  fixedWidth
                  isLoading={loading}
                  label={loading ? 'Loading…' : 'Organizations'}
                  onChange={handleOrgsChange}
                  onClear={handleOrgsClear}
                  options={orgOptions}
                  searchable
                  value={selectedOrgIds}
                />
              </LabeledField>
              <LabeledField label="Permission">
                <Select
                  fixedWidth
                  onChange={(value) => value !== undefined && setPermission(value)}
                  options={PERMISSION_OPTIONS}
                  placeholder="Select role"
                  value={permission}
                />
              </LabeledField>
            </Flex>
            <Flex gap="md">
              <Button
                kind="primary"
                type="submit"
                disabled={loading || !selectedOrgIds.length || submitting}
              >
                Submit request
              </Button>
            </Flex>
          </Flex>
        </form>

        {submitted && (
          <Text variant="body" color="subdued">
            Request submitted. You can view its status on the Approvals page.
          </Text>
        )}
      </Flex>
    </Container>
  );
};

export default RequestAccessPage;
