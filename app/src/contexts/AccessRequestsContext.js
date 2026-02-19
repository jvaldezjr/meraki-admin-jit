import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * One organization + permission within a request (item-level status for withdraw/approve).
 * @typedef {{ orgId: string, orgName: string, permission: 'read'|'write', status: string, approvedAt: string|null }} AccessRequestItem
 */

/**
 * A single access request (queued for approval).
 * @typedef {{
 *   id: string,
 *   items: AccessRequestItem[],
 *   requestedAt: string
 * }} AccessRequest
 */

const AccessRequestsContext = createContext(null);

let requestIdCounter = 10000;
const generateShortId = () => `req-${++requestIdCounter}`;

/**
 * Parse rowId (e.g. 'req-10001' or 'req-10001.2') into requestId and item index.
 */
export function parseRequestRowId(rowId) {
  if (!rowId || typeof rowId !== 'string') return { requestId: null, itemIndex: 0 };
  const dot = rowId.indexOf('.');
  if (dot === -1) return { requestId: rowId, itemIndex: 0 };
  const requestId = rowId.slice(0, dot);
  const itemIndex = parseInt(rowId.slice(dot + 1), 10) - 1;
  return { requestId, itemIndex: Number.isNaN(itemIndex) ? 0 : itemIndex };
}

export const useAccessRequests = () => {
  const ctx = useContext(AccessRequestsContext);
  if (!ctx) throw new Error('useAccessRequests must be used within AccessRequestsProvider');
  return ctx;
};

export const AccessRequestsProvider = ({ children }) => {
  const [requests, setRequests] = useState([]);

  const addRequest = useCallback((items) => {
    if (!items || !items.length) return null;
    const request = {
      id: generateShortId(),
      requestedAt: new Date().toISOString(),
      items: items.map(({ orgId, orgName, permission }) => ({
        orgId,
        orgName,
        permission: permission === 'write' ? 'write' : 'read',
        status: 'pending',
        approvedAt: null,
      })),
    };
    setRequests((prev) => [request, ...prev]);
    return request.id;
  }, []);

  const updateRequestStatus = useCallback((id, status, approvedAt = null) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              items: r.items.map((item) => ({
                ...item,
                status,
                approvedAt: approvedAt ?? item.approvedAt,
              })),
            }
          : r
      )
    );
  }, []);

  const updateItemStatus = useCallback((rowId, status, approvedAt = null) => {
    const { requestId, itemIndex } = parseRequestRowId(rowId);
    if (!requestId) return;
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId) return r;
        const next = [...r.items];
        if (itemIndex >= 0 && itemIndex < next.length) {
          next[itemIndex] = {
            ...next[itemIndex],
            status,
            approvedAt: approvedAt ?? next[itemIndex].approvedAt,
          };
        }
        return { ...r, items: next };
      })
    );
  }, []);

  const value = {
    requests,
    addRequest,
    updateRequestStatus,
    updateItemStatus,
  };

  return (
    <AccessRequestsContext.Provider value={value}>
      {children}
    </AccessRequestsContext.Provider>
  );
};
