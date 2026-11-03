/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Generates and manages device identification for distinguishing local writes vs remote writes

const DEVICE_ID_KEY = 'oromia_boa_device_id';
const DEVICE_LABEL_KEY = 'oromia_boa_device_label';
let lastLocalWriteTimestamp = 0;

/**
 * Returns a persistent device/session ID unique to this browser instance/tab.
 * Uses sessionStorage so two tabs on the same computer act as two separate devices for testing,
 * while maintaining a stable identity across refreshes within the same tab.
 */
export function getDeviceId(): string {
  try {
    let id = sessionStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      // Generate a short readable device ID
      const rand = Math.random().toString(36).substring(2, 7);
      const timePart = Date.now().toString(36).slice(-4);
      id = `dev-${rand}-${timePart}`;
      sessionStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'dev-browser-session';
  }
}

/**
 * Returns a human-friendly label for this device (e.g., "Desktop Workstation #4e92" or "Field Tablet #2a1b")
 */
export function getDeviceLabel(): string {
  try {
    let label = sessionStorage.getItem(DEVICE_LABEL_KEY);
    if (!label) {
      const devId = getDeviceId();
      const shortCode = devId.split('-')[1] || devId.slice(-4);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      const platform = isMobile ? 'Mobile Field Device' : 'Desktop Workstation';
      label = `${platform} (${shortCode})`;
      sessionStorage.setItem(DEVICE_LABEL_KEY, label);
    }
    return label;
  } catch {
    return 'Web Client';
  }
}

/**
 * Set a customized device name (e.g. "Adama Head Office", "Jimma Zone Field Lead")
 */
export function setDeviceLabel(newLabel: string): void {
  try {
    sessionStorage.setItem(DEVICE_LABEL_KEY, newLabel);
  } catch {
    // Ignore
  }
}

/**
 * Record a local write timestamp to prevent self-echo false positives
 */
export function recordLocalWrite(): void {
  lastLocalWriteTimestamp = Date.now();
}

/**
 * Returns whether a write occurred locally in the last 3.5 seconds
 */
export function isRecentLocalWrite(): boolean {
  return Date.now() - lastLocalWriteTimestamp < 3500;
}
