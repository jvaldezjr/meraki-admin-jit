import React, { useState, useEffect, useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Button } from '@magnetic/button';
import { Container } from '@magnetic/container';
import { Flex } from '@magnetic/flex';
import { Search } from '@magnetic/search';
import { Text } from '@magnetic/text';
import {
  Table,
  useMagneticTable,
  useTableSearch,
  getPaginationRowModel,
  getRowIndexColumn,
} from '@magnetic/table';
import { useAuth } from '../contexts/AuthContext';

const getApiBaseUrl = () =>
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

const columnHelper = createColumnHelper();

const orgColumnDefs = [
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

/** Global filter that only matches Organization ID and Name (not index or link). */
const orgIdAndNameFilterFn = (row, _columnIds, filterValue) => {
  if (!filterValue || typeof filterValue !== 'string') return true;
  const q = filterValue.trim().toLowerCase();
  if (!q) return true;
  const id = String(row.original?.id ?? '').toLowerCase();
  const name = String(row.original?.name ?? '').toLowerCase();
  return id.includes(q) || name.includes(q);
};

const MyAccessPage = () => {
  const { authHeaders, apiBaseUrl } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const { filter, handleSearchChange, setFilter } = useTableSearch();

  const columns = useMemo(
    () => [getRowIndexColumn(), ...orgColumnDefs],
    []
  );

  useEffect(() => {
    let cancelled = false;
    const base = apiBaseUrl || getApiBaseUrl();
    fetch(`${base}/api/meraki/my-organizations`, { headers: authHeaders() })
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
    columns,
    data: organizations,
    state: { globalFilter: filter },
    onGlobalFilterChange: setFilter,
    globalFilterFn: orgIdAndNameFilterFn,
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const handleSearchInputChange = (e) => {
    setSearchValue(e.target.value);
    handleSearchChange(e);
  };
  const handleSearchClear = () => {
    setSearchValue('');
    setFilter('');
  };
  const resultCount = table.getFilteredRowModel().rows.length;
  const showReset = Boolean(filter && filter.trim().length > 0);

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
        <Flex align="center" gap="md" style={{ flexWrap: 'wrap' }}>
          <Search
            fixedWidth
            label="org-search"
            onChange={handleSearchInputChange}
            onClear={handleSearchClear}
            placeholder="Search by Organization ID or name…"
            value={searchValue}
          />
          <Text color="light" style={{ whiteSpace: 'nowrap' }}>
            {resultCount.toLocaleString()} result{resultCount !== 1 ? 's' : ''}
          </Text>
          {showReset && (
            <Button kind="tertiary" onClick={handleSearchClear}>
              Reset all
            </Button>
          )}
        </Flex>
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
