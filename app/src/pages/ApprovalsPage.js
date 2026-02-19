import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Button } from '@magnetic/button';
import { Checkbox } from '@magnetic/checkbox';
import { Container } from '@magnetic/container';
import { Flex } from '@magnetic/flex';
import { Text } from '@magnetic/text';
import { Table, useMagneticTable, getSelectionColumn } from '@magnetic/table';
import { useAccessRequests } from '../contexts/AccessRequestsContext';

const columnHelper = createColumnHelper();

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const statusLabel = (status) => {
  const map = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    withdrawn: 'Withdrawn',
  };
  return map[status] || status;
};

/** If all items have the same value for key, return it; otherwise return '(multiple)'. */
function uniformOrMultiple(items, getValue) {
  if (!items.length) return '';
  const first = getValue(items[0]);
  const allSame = items.every((item) => getValue(item) === first);
  return allSame ? first : '(multiple)';
}

/**
 * Build table rows from requests: single-item requests = one row; multi-item = parent row + children.
 * Parent row shows child value when all match, otherwise '(multiple)'.
 * Row shape: { rowId, requestedAt, scope, permission, approvalAt, status, children? }
 */
function buildTableRows(requests) {
  const rows = [];
  for (const req of requests) {
    if (req.items.length === 0) continue;
    if (req.items.length === 1) {
      const item = req.items[0];
      rows.push({
        rowId: req.id,
        requestedAt: req.requestedAt,
        scope: item.orgName,
        permission: item.permission,
        approvalAt: item.approvedAt,
        status: item.status,
      });
    } else {
      const children = req.items.map((item, i) => ({
        rowId: `${req.id}.${i + 1}`,
        requestedAt: req.requestedAt,
        scope: item.orgName,
        permission: item.permission,
        approvalAt: item.approvedAt,
        status: item.status,
      }));
      rows.push({
        rowId: req.id,
        requestedAt: req.requestedAt,
        scope: uniformOrMultiple(req.items, (i) => i.orgName),
        permission: uniformOrMultiple(req.items, (i) => i.permission),
        approvalAt: uniformOrMultiple(req.items, (i) => i.approvedAt),
        status: uniformOrMultiple(req.items, (i) => i.status),
        children,
      });
    }
  }
  return rows;
}

/** Count leaf row IDs in selected rows (parent selection counts as all its children). */
function countSelectedLeaves(rows) {
  let n = 0;
  const visit = (row) => {
    if (row.original?.children && row.subRows?.length) {
      row.subRows.forEach(visit);
    } else {
      n += 1;
    }
  };
  rows.forEach(visit);
  return n;
}

/** Button for BulkActionBar: receives selectedRows via cloned onClick(selectedRows). */
function BulkWithdrawButton({ onWithdraw, table }) {
  const selectedRows = table.getSelectedRowModel().rows;
  const leafCount = countSelectedLeaves(selectedRows);
  return (
    <Button kind="secondary" destructive onClick={(rows) => onWithdraw(rows)}>
      Withdraw ({leafCount})
    </Button>
  );
}

const ApprovalsPage = () => {
  const { requests, updateItemStatus } = useAccessRequests();
  const [rowSelection, setRowSelection] = useState({});
  const [tableMounted, setTableMounted] = useState(false);

  const tableData = useMemo(() => buildTableRows(requests), [requests]);

  // Defer table mount by one frame to avoid ResizeObserver loop error from table layout.
  useEffect(() => {
    if (tableData.length === 0) return;
    const id = requestAnimationFrame(() => {
      setTableMounted(true);
    });
    return () => cancelAnimationFrame(id);
  }, [tableData.length]);

  const columns = useMemo(
    () => [
      {
        ...getSelectionColumn(),
        size: 48,
        header: ({ table }) => {
          const allSelected = table.getIsAllRowsSelected?.() ?? false;
          const someSelected =
            (table.getSelectedRowModel().rows.length > 0) && !allSelected;
          return (
            <Checkbox
              checked={allSelected}
              className="mds-rebuild-table-select-all-checkbox"
              data-testid="table-select-all-checkbox"
              indeterminate={someSelected}
              onClick={table.getToggleAllRowsSelectedHandler?.() ?? (() => {})}
              size={table.getState().density === 'condensed' ? 'sm' : 'md'}
            />
          );
        },
      },
      columnHelper.accessor('rowId', {
        id: 'rowId',
        header: 'Request ID',
        meta: { align: 'left', expandFrom: true },
        cell: (info) => <Text variant="body">{info.getValue()}</Text>,
        size: 100,
      }),
      columnHelper.accessor('requestedAt', {
        id: 'requestedAt',
        header: 'Request timestamp',
        meta: { align: 'left' },
        cell: (info) => <Text variant="body">{formatDate(info.getValue())}</Text>,
        size: 160,
      }),
      columnHelper.accessor('scope', {
        id: 'scope',
        header: 'Organization',
        meta: { align: 'left' },
        cell: (info) => <Text variant="body">{info.getValue() || '—'}</Text>,
        size: 180,
      }),
      columnHelper.accessor('permission', {
        id: 'permission',
        header: 'Permission',
        meta: { align: 'left' },
        cell: (info) => (
          <Text variant="body" style={{ textTransform: 'capitalize' }}>
            {info.getValue() || '—'}
          </Text>
        ),
        size: 90,
      }),
      columnHelper.accessor('approvalAt', {
        id: 'approvalAt',
        header: 'Approval timestamp',
        meta: { align: 'left' },
        cell: (info) => {
          const v = info.getValue();
          return <Text variant="body">{v === '(multiple)' ? v : formatDate(v)}</Text>;
        },
        size: 160,
      }),
      columnHelper.accessor('status', {
        id: 'status',
        header: 'Status',
        meta: { align: 'left' },
        cell: (info) => (
          <Text variant="body">{statusLabel(info.getValue())}</Text>
        ),
        size: 100,
      }),
    ],
    []
  );

  // Selectable: pending leaf rows, or parent rows only when at least one child is pending.
  const canSelectRow = (row) => {
    const original = row.original;
    if (original.children) {
      return original.children.some((child) => child.status === 'pending');
    }
    return original.status === 'pending';
  };

  const { table } = useMagneticTable({
    columns,
    data: tableData,
    getRowId: (row) => row.rowId,
    enableRowSelection: canSelectRow,
    enableSubRowSelection: true,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  });

  const handleWithdraw = useCallback(
    (selectedRowsFromBar) => {
      // Bar may pass selectedRows; Button may pass event as first arg – use table state when not an array.
      const rows = Array.isArray(selectedRowsFromBar)
        ? selectedRowsFromBar
        : table.getSelectedRowModel().rows;
      const ids = [];
      const visit = (row) => {
        if (row.original?.children) {
          (row.subRows || []).forEach(visit);
        } else {
          ids.push(row.id);
        }
      };
      rows.forEach(visit);
      const at = new Date().toISOString();
      ids.forEach((rowId) => updateItemStatus(rowId, 'withdrawn', at));
      setRowSelection({});
    },
    [table, updateItemStatus]
  );

  return (
    <Container>
      <Flex direction="vertical" gap="lg" style={{ width: '100%' }}>
        <Text variant="h2">Approvals</Text>
        <Text variant="body" color="subdued">
          Access requests submitted from the Request Access page. Select pending
          rows and use Withdraw to cancel them. Approval logic will be added
          later.
        </Text>

        {tableData.length === 0 ? (
          <Text variant="body" color="subdued">
            No requests yet. Submit a request from the Request Access page.
          </Text>
        ) : !tableMounted ? (
          <Flex grow style={{ minHeight: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="body" color="subdued">Loading table…</Text>
          </Flex>
        ) : (
          <Flex grow style={{ minHeight: 0 }}>
            <Table table={table} distributedColumns>
              <Table.BulkActionBar>
                <BulkWithdrawButton onWithdraw={handleWithdraw} table={table} />
              </Table.BulkActionBar>
            </Table>
          </Flex>
        )}
      </Flex>
    </Container>
  );
};

export default ApprovalsPage;
