/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import "./index.css";

const STORAGE_KEY = "hydrate_water_log";

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function getTodayTotal(): number {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return 0;
  const log = JSON.parse(data);
  return log[getTodayKey()] || 0;
}

function addWater(amount: number): void {
  const data = localStorage.getItem(STORAGE_KEY);
  const log = data ? JSON.parse(data) : {};
  const todayKey = getTodayKey();
  log[todayKey] = (log[todayKey] || 0) + amount;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  updateDisplay();
}

function updateDisplay(): void {
  const totalEl = document.getElementById("total-water");
  if (totalEl) {
    totalEl.textContent = getTodayTotal().toString();
  }
}

// Initialize display
updateDisplay();

// Log buttons
document.querySelectorAll(".log-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const amount = parseInt((btn as HTMLElement).dataset.amount || "0", 10);
    addWater(amount);
  });
});

// Reset button
const resetBtn = document.getElementById("reset-btn");
resetBtn?.addEventListener("click", () => {
  const data = localStorage.getItem(STORAGE_KEY);
  const log = data ? JSON.parse(data) : {};
  log[getTodayKey()] = 0;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  updateDisplay();
});

// Interval selector
const intervalSelect = document.getElementById(
  "interval-select",
) as HTMLSelectElement;

// Load current interval setting
declare global {
  interface Window {
    electronAPI: {
      getInterval: () => Promise<number>;
      setInterval: (minutes: number) => Promise<boolean>;
    };
  }
}

window.electronAPI.getInterval().then((minutes) => {
  intervalSelect.value = minutes.toString();
});

intervalSelect?.addEventListener("change", () => {
  const minutes = parseInt(intervalSelect.value, 10);
  window.electronAPI.setInterval(minutes);
});

// Dismiss button
const dismissBtn = document.getElementById("dismiss-btn");
dismissBtn?.addEventListener("click", () => {
  window.close();
});
