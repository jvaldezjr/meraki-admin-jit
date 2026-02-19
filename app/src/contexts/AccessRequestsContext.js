import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * One organization + permission within a request.
 * @typedef {{ orgId: string, orgName: string, permission: 'read'|'write' }} AccessRequestItem
 */

/**
 * A single access request (queued for approval).
 * @typedef {{
 *   id: string,
 *   items: AccessRequestItem[],
 *   requestedAt: string,
 *   approvedAt: string|null,
 *   status: 'pending'|'approved'|'rejected'|'cancelled'
 * }} AccessRequest
 */

const AccessRequestsContext = createContext(null);

const generateId = () => `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

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
      id: generateId(),
      items: items.map(({ orgId, orgName, permission }) => ({
        orgId,
        orgName,
        permission: permission === 'write' ? 'write' : 'read',
      })),
      requestedAt: new Date().toISOString(),
      approvedAt: null,
      status: 'pending',
    };
    setRequests((prev) => [request, ...prev]);
    return request.id;
  }, []);

  const updateRequestStatus = useCallback((id, status, approvedAt = null) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status, approvedAt: approvedAt ?? r.approvedAt }
          : r
      )
    );
  }, []);

  const value = {
    requests,
    addRequest,
    updateRequestStatus,
  };

  return (
    <AccessRequestsContext.Provider value={value}>
      {children}
    </AccessRequestsContext.Provider>
  );
};
