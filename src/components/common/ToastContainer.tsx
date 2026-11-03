/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useToast, ToastItem } from './ToastContext';
import { simulateRemoteDevicePush } from '../../services/firebaseService';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X,
  ExternalLink,
  Laptop,
  Smartphone,
  History,
  Trash2,
  Radio,
  Sparkles,
} from 'lucide-react';

interface ToastItemProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const SingleToastCard: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;

    const intervalMs = 50;
    const step = (intervalMs / toast.duration) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev <= step) {
            clearInterval(timer);
            onDismiss(toast.id);
            return 0;
          }
          return prev - step;
        });
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [toast.id, toast.duration, isPaused, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'cloud_sync':
        return (
          <div className="relative flex items-center justify-center shrink-0">
            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-40"></span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md relative z-10">
              <Cloud className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      case 'error':
        return (
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
        );
    }
  };

  const isCloudSync = toast.type === 'cloud_sync';

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
      className={`relative overflow-hidden rounded-xl shadow-xl transition-all duration-300 pointer-events-auto border ${
        isCloudSync
          ? 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-emerald-500/10'
          : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-800'
      } backdrop-blur-md p-4 w-88 sm:w-96 text-left group`}
    >
      {/* Visual Live Push Indicator Pill for Multi-Device sync */}
      {isCloudSync && (
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-100 dark:border-emerald-950/60">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
              Firebase Live Push Sync
            </span>
          </div>
          {toast.sourceDevice && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <Laptop className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[130px]" title={toast.sourceDevice}>
                {toast.sourceDevice}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {toast.title}
            </h4>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 -mt-1 -mr-1 cursor-pointer"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            {toast.message}
          </p>

          {toast.details && (
            <div className="mt-2 text-[11px] bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded border border-slate-200/60 dark:border-slate-700/60 inline-block font-mono">
              {toast.details}
            </div>
          )}

          {toast.actionLabel && toast.onAction && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  toast.onAction?.();
                  onDismiss(toast.id);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer"
              >
                <span>{toast.actionLabel}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => onDismiss(toast.id)}
                className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Auto-dismiss progress countdown bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full transition-all duration-75 ${
              isCloudSync ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const {
    toasts,
    history,
    removeToast,
    clearToasts,
    isHistoryOpen,
    setIsHistoryOpen,
    clearHistory,
  } = useToast();

  return (
    <>
      {/* Floating Toast Notification Stack in Top-Right */}
      <div
        aria-live="polite"
        className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-full"
      >
        {toasts.map((toast) => (
          <SingleToastCard key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>

      {/* Sync History Modal Drawer */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    Firebase Cloud Sync History
                  </h3>
                  <p className="text-xs text-slate-500">
                    Seenaa haaromsa ragaa meeshaalee biroo irraa dhufe
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <Cloud className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
                  No remote push notifications received yet in this session.
                  <p className="mt-1 text-slate-500">
                    When another device updates the data, alerts will appear here in real time.
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Radio className="w-3 h-3 text-emerald-500" />
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      {item.message}
                    </p>
                    {item.sourceDevice && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                        <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          From: {item.sourceDevice}
                        </span>
                        {item.version && (
                          <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                            v{item.version}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={clearHistory}
                  disabled={history.length === 0}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-rose-600 disabled:opacity-40 disabled:hover:text-slate-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Log</span>
                </button>
                <button
                  onClick={async () => {
                    await simulateRemoteDevicePush();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/70 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-semibold transition-colors cursor-pointer"
                  title="Simulate push from another PC/tablet to verify toast notification"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Simulate Remote Push</span>
                </button>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="px-3.5 py-1.5 font-medium rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Cufi / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
