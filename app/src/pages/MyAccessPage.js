import React, { useState, useEffect } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Container } from '@magnetic/container';
import { Flex } from '@magnetic/flex';
import { Text } from '@magnetic/text';
import { Table, useMagneticTable, getPaginationRowModel } from '@magnetic/table';
import { useAuth } from '../contexts/AuthContext';

const getApiBaseUrl = () =>
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

const columnHelper = createColumnHelper();

const orgColumns = [
  columnHelper.accessor('id', {
    id: 'id',
    header: 'Organization ID',
    meta: { align: 'left' },
    cell: (info) => <Text variant="body">{info.getValue()}</Text>,
  }),
  columnHelper.accessor('name', {
    id: 'name',
    header: 'Name',
    meta: { align: 'left' },
    cell: (info) => <Text variant="body">{info.getValue()}</Text>,
  }),
  columnHelper.accessor('link', {
    id: 'link',
    header: 'Dashboard Link',
    meta: { align: 'left' },
    cell: (info) => {
      const link = info.getValue();
      if (!link) return <Text variant="body" color="subdued">—</Text>;
      return (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--magnetic-color-blue-600, #2563eb)', textDecoration: 'none' }}
        >
          Link
        </a>
      );
    },
  }),
];

const MyAccessPage = () => {
  const { authHeaders, apiBaseUrl } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  }, [apiBaseUrl]);

  const { table } = useMagneticTable({
    columns: orgColumns,
    data: organizations,
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  if (loading) {
    return (
      <Container>
        <Text variant="body" color="subdued">Loading organizations…</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Text variant="body" color="subdued">{error}</Text>
      </Container>
    );
  }

  return (
    <Container>
      <Flex direction="vertical" gap="lg" style={{ width: '100%' }}>
        <Text variant="h2">My Access</Text>
        <Text variant="body" color="subdued">
          Organizations your Meraki API key can access.
        </Text>
        <Flex grow style={{ minHeight: 0 }}>
          <Table
            table={table}
            paginationControls={{
              showTotal: true,
              showOptions: true,
              showNavigation: 'all',
            }}
          />
        </Flex>
      </Flex>
    </Container>
  );
};

export default MyAccessPage;
