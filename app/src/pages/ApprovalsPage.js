import React from 'react';
import { Container } from '@magnetic/container';
import { Flex } from '@magnetic/flex';
import { Text } from '@magnetic/text';
import { useAccessRequests } from '../contexts/AccessRequestsContext';

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const statusLabel = (status) => {
  const map = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled' };
  return map[status] || status;
};

const ApprovalsPage = () => {
  const { requests } = useAccessRequests();

  return (
    <Container>
      <Flex direction="vertical" gap="lg" style={{ width: '100%' }}>
        <Text variant="h2">Approvals</Text>
        <Text variant="body" color="subdued">
          Access requests submitted from the Request Access page. Approval logic will be added later; once approved, access will be granted via the Meraki API.
        </Text>

        {requests.length === 0 ? (
          <Text variant="body" color="subdued">No requests yet. Submit a request from the Request Access page.</Text>
        ) : (
          <Flex direction="vertical" gap="md" style={{ width: '100%' }}>
            {requests.map((req) => (
              <Flex
                key={req.id}
                direction="vertical"
                gap="xs"
                style={{
                  padding: 16,
                  border: '1px solid var(--base-border-default, #d7dfe9)',
                  borderRadius: 8,
                  width: '100%',
                  maxWidth: 720,
                }}
              >
                <Flex justify="space-between" align="center">
                  <Text variant="body" weight="semi-bold">{req.id}</Text>
                  <Text variant="body" color="subdued">{statusLabel(req.status)}</Text>
                </Flex>
                <Text variant="body" color="subdued" size="p3">
                  Requested: {formatDate(req.requestedAt)}
                  {req.approvedAt && ` · Resolved: ${formatDate(req.approvedAt)}`}
                </Text>
                <Flex direction="vertical" gap="xxs" style={{ marginTop: 4 }}>
                  {req.items.map((item, i) => (
                    <Text key={i} variant="body" size="p3">
                      {item.orgName} ({item.orgId}) — {item.permission}
                    </Text>
                  ))}
                </Flex>
              </Flex>
            ))}
          </Flex>
        )}
      </Flex>
    </Container>
  );
};

export default ApprovalsPage;
