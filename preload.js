const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 数据操作
  getData: () => ipcRenderer.invoke('get-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),

  // 导入导出
  exportData: () => ipcRenderer.invoke('export-data'),
  importData: () => ipcRenderer.invoke('import-data'),

  // EXE 相关
  browseExe: () => ipcRenderer.invoke('browse-exe'),
  runExe: (exePath) => ipcRenderer.invoke('run-exe', exePath),

  // 文件和网址
  browseFile: () => ipcRenderer.invoke('browse-file'),
  openUrl: (url) => ipcRenderer.invoke('open-url', url),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),

  // 文件夹
  browseFolder: () => ipcRenderer.invoke('browse-folder'),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),

  // 窗口控制
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // 托盘相关
  minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
  quitApp: () => ipcRenderer.send('quit-app'),

  // 监听关闭请求
  onCloseRequested: (callback) => ipcRenderer.on('close-requested', callback)
});
