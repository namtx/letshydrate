import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs";
import started from "electron-squirrel-startup";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let reminderInterval: NodeJS.Timeout | null = null;

const CONFIG_PATH = path.join(app.getPath("userData"), "config.json");

interface Config {
  intervalMinutes: number;
}

const DEFAULT_CONFIG: Config = {
  intervalMinutes: 30,
};

function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, "utf-8");
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch {
    // Ignore errors, use default
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config: Config): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function startReminderInterval(): void {
  if (reminderInterval) {
    clearInterval(reminderInterval);
  }
  const config = loadConfig();
  const intervalMs = config.intervalMinutes * 60 * 1000;
  reminderInterval = setInterval(showReminder, intervalMs);
}

// IPC handlers
ipcMain.handle("get-interval", () => {
  const config = loadConfig();
  return config.intervalMinutes;
});

ipcMain.handle("set-interval", (_event, minutes: number) => {
  const config = loadConfig();
  config.intervalMinutes = minutes;
  saveConfig(config);
  startReminderInterval();
  return true;
});

const createWindow = () => {
  // If window already exists, just show it
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  // Create a small reminder window
  mainWindow = new BrowserWindow({
    width: 700,
    height: 600,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Center the window on screen
  mainWindow.center();

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Bring window to front and focus when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

const showReminder = () => {
  createWindow();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  // Show initial reminder
  createWindow();

  // Set up recurring reminder based on config
  startReminderInterval();
});

// Keep app running in background on macOS
app.on("window-all-closed", () => {
  // Don't quit - keep running for reminders
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
