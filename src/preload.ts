// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getInterval: () => ipcRenderer.invoke("get-interval"),
  setInterval: (minutes: number) => ipcRenderer.invoke("set-interval", minutes),
});
