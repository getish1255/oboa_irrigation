/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type ToastType = 'cloud_sync' | 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  details?: string;
  timestamp: number;
  duration?: number; // ms, 0 means do not auto-dismiss
  sourceDevice?: string;
  version?: number;
  updateType?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface RemoteSyncNoticeOptions {
  version: number;
  updatedDeviceLabel?: string;
  updateType?: string;
  updateSummary?: string;
  countSummary?: string;
  lang?: 'en' | 'om';
  onNavigate?: () => void;
  actionLabel?: string;
}

interface ToastContextValue {
  toasts: ToastItem[];
  history: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id' | 'timestamp'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  notifyRemoteFirebaseSync: (options: RemoteSyncNoticeOptions) => string;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  clearHistory: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [history, setHistory] = useState<ToastItem[]>(() => {
    try {
      const saved = sessionStorage.getItem('oromia_boa_toast_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastItem, 'id' | 'timestamp'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastItem = {
      ...toast,
      id,
      timestamp: Date.now(),
      duration: toast.duration ?? 6500,
    };

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep max 5 visible at once
    setHistory((prev) => {
      const nextHistory = [newToast, ...prev].slice(0, 30);
      try {
        sessionStorage.setItem('oromia_boa_toast_history', JSON.stringify(nextHistory));
      } catch {
        // ignore
      }
      return nextHistory;
    });

    return id;
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      sessionStorage.removeItem('oromia_boa_toast_history');
    } catch {
      // ignore
    }
  }, []);

  /**
   * Dedicated helper for Firebase real-time data pushed from another device
   */
  const notifyRemoteFirebaseSync = useCallback(
    ({
      version,
      updatedDeviceLabel,
      updateType,
      updateSummary,
      countSummary,
      lang = 'en',
      onNavigate,
      actionLabel,
    }: RemoteSyncNoticeOptions): string => {
      const isOm = lang === 'om';
      const deviceName = updatedDeviceLabel || (isOm ? 'Meeshaa Biraa' : 'Another Device');

      const title = isOm
        ? `Odeeffannoo Haaraa: ${deviceName} irraa dhufe`
        : `New Data Synced from ${deviceName}`;

      const defaultMsg = isOm
        ? `Ragaan haarawaa (Vershinii #${version}) Firebase irratti fe\'amee kallattiin wal-simatee jira.`
        : `Updated campaign data (Version #${version}) was successfully pushed to Firebase by another device and synced live.`;

      const message = updateSummary || defaultMsg;

      const resolvedActionLabel =
        actionLabel ||
        (updateType === 'schemes'
          ? isOm ? 'Kaartaa GIS Ilaali' : 'View GIS Map'
          : isOm ? 'Cuunfaa Ilaali' : 'View Executive Report');

      return addToast({
        type: 'cloud_sync',
        title,
        message,
        details: countSummary,
        sourceDevice: deviceName,
        version,
        updateType,
        duration: 8000, // 8 seconds visibility for multi-device alerts
        actionLabel: onNavigate ? resolvedActionLabel : undefined,
        onAction: onNavigate,
      });
    },
    [addToast]
  );

  const value = useMemo(
    () => ({
      toasts,
      history,
      addToast,
      removeToast,
      clearToasts,
      notifyRemoteFirebaseSync,
      isHistoryOpen,
      setIsHistoryOpen,
      clearHistory,
    }),
    [
      toasts,
      history,
      addToast,
      removeToast,
      clearToasts,
      notifyRemoteFirebaseSync,
      isHistoryOpen,
      setIsHistoryOpen,
      clearHistory,
    ]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
