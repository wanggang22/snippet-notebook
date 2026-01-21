const { app, BrowserWindow, ipcMain, clipboard, globalShortcut, dialog, shell, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let tray = null;
let isQuitting = false;

// 数据文件路径
const dataPath = path.join(app.getPath('userData'), 'snippets.json');

// 默认数据
const defaultData = {
  snippets: [
    { id: "1", name: "claude-opus-4.5", content: "claude-opus-4-5-20251101", category: "models", description: "Claude Opus 4.5 模型ID", createdAt: new Date().toISOString() },
    { id: "2", name: "claude-sonnet-4", content: "claude-sonnet-4-20250514", category: "models", description: "Claude Sonnet 4 模型ID", createdAt: new Date().toISOString() },
    { id: "3", name: "claude-haiku", content: "claude-haiku-4-20250514", category: "models", description: "Claude Haiku 模型ID", createdAt: new Date().toISOString() },
    { id: "4", name: "command-notebook", content: "/command-notebook", category: "skills", description: "命令笔记本 skill", createdAt: new Date().toISOString() },
    { id: "5", name: "anthropic-docs", content: "https://docs.anthropic.com", category: "urls", description: "Anthropic 官方文档", createdAt: new Date().toISOString() },
    { id: "6", name: "claude-code-guide", content: "https://docs.anthropic.com/en/docs/claude-code", category: "urls", description: "Claude Code 官方指南", createdAt: new Date().toISOString() }
  ],
  categories: [
    { id: 'skills', name: 'Skills', icon: '⚡' },
    { id: 'prompts', name: 'Prompts', icon: '💬' },
    { id: 'mcp-tools', name: 'MCP Tools', icon: '🔧' },
    { id: 'sdk', name: 'SDK', icon: '📦' },
    { id: 'api', name: 'API', icon: '🔌' },
    { id: 'models', name: 'Models', icon: '🤖' },
    { id: 'commands', name: 'Commands', icon: '⌨️' },
    { id: 'urls', name: 'URLs', icon: '🔗' },
    { id: 'text', name: 'Text', icon: '📝' }
  ]
};

function loadData() {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading data:', e);
  }
  return defaultData;
}

function saveData(data) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error saving data:', e);
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // 开发时打开开发者工具
  // mainWindow.webContents.openDevTools();

  // 阻止窗口直接关闭，交给渲染进程处理
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.webContents.send('close-requested');
    }
  });
}

// 创建系统托盘
function createTray() {
  // 创建 16x16 托盘图标 - 简洁的笔记本图标
  const size = 16;
  const buffer = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // 绘制笔记本形状（圆角矩形 + 横线）
      const inBook = x >= 2 && x <= 13 && y >= 1 && y <= 14;
      const isBinding = x >= 2 && x <= 4 && y >= 1 && y <= 14; // 左侧装订区
      const isLine = inBook && !isBinding && (y === 4 || y === 7 || y === 10) && x >= 6 && x <= 12; // 文字行
      const isBorder = inBook && (x === 2 || x === 13 || y === 1 || y === 14); // 边框

      if (isBinding) {
        // 装订区域 - 深青色
        buffer[idx] = 0;       // R
        buffer[idx + 1] = 150; // G
        buffer[idx + 2] = 180; // B
        buffer[idx + 3] = 255; // A
      } else if (isLine) {
        // 文字线条 - 青色
        buffer[idx] = 0;       // R
        buffer[idx + 1] = 212; // G
        buffer[idx + 2] = 255; // B
        buffer[idx + 3] = 255; // A
      } else if (isBorder) {
        // 边框 - 青色
        buffer[idx] = 0;       // R
        buffer[idx + 1] = 212; // G
        buffer[idx + 2] = 255; // B
        buffer[idx + 3] = 255; // A
      } else if (inBook) {
        // 书页内部 - 深色背景
        buffer[idx] = 30;      // R
        buffer[idx + 1] = 30;  // G
        buffer[idx + 2] = 50;  // B
        buffer[idx + 3] = 255; // A
      } else {
        // 透明背景
        buffer[idx] = 0;
        buffer[idx + 1] = 0;
        buffer[idx + 2] = 0;
        buffer[idx + 3] = 0;
      }
    }
  }

  const icon = nativeImage.createFromBuffer(buffer, { width: size, height: size });

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Snippet Notebook');
  tray.setContextMenu(contextMenu);

  // 点击托盘图标显示窗口
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  // 注册全局快捷键 Ctrl+Shift+S 打开/聚焦窗口
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // 不在这里退出，让托盘保持运行
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// IPC 处理
ipcMain.handle('get-data', () => loadData());
ipcMain.handle('save-data', (event, data) => saveData(data));
ipcMain.handle('copy-to-clipboard', (event, text) => {
  clipboard.writeText(text);
  return true;
});

// 窗口控制
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});
ipcMain.on('window-close', () => mainWindow.close());

// 最小化到托盘
ipcMain.on('minimize-to-tray', () => {
  mainWindow.hide();
});

// 真正退出应用
ipcMain.on('quit-app', () => {
  isQuitting = true;
  app.quit();
});

// 导出数据
ipcMain.handle('export-data', async () => {
  const data = loadData();
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '导出数据',
    defaultPath: 'snippets-backup.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  }
  return false;
});

// 导入数据
ipcMain.handle('import-data', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '导入数据',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const importedData = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf-8'));
      if (importedData.snippets && Array.isArray(importedData.snippets)) {
        saveData(importedData);
        return importedData;
      }
    } catch (e) {
      console.error('Import error:', e);
    }
  }
  return null;
});

// 选择 EXE 文件
ipcMain.handle('browse-exe', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择程序',
    filters: [
      { name: '可执行文件', extensions: ['exe', 'bat', 'cmd', 'ps1'] },
      { name: '所有文件', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// 运行 EXE 文件
ipcMain.handle('run-exe', async (event, exePath) => {
  try {
    if (!fs.existsSync(exePath)) {
      return { success: false, error: '文件不存在' };
    }

    // 使用 shell.openPath 打开文件（更安全的方式）
    const error = await shell.openPath(exePath);
    if (error) {
      return { success: false, error };
    }
    return { success: true };
  } catch (e) {
    console.error('Run exe error:', e);
    return { success: false, error: e.message };
  }
});

// 选择文件（任意类型）
ipcMain.handle('browse-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择文件',
    properties: ['openFile']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// 打开网址
ipcMain.handle('open-url', async (event, url) => {
  try {
    // 确保 URL 有协议前缀
    let fullUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      fullUrl = 'https://' + url;
    }
    await shell.openExternal(fullUrl);
    return { success: true };
  } catch (e) {
    console.error('Open URL error:', e);
    return { success: false, error: e.message };
  }
});

// 打开文件
ipcMain.handle('open-file', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: '文件不存在' };
    }
    const error = await shell.openPath(filePath);
    if (error) {
      return { success: false, error };
    }
    return { success: true };
  } catch (e) {
    console.error('Open file error:', e);
    return { success: false, error: e.message };
  }
});

// 选择文件夹
ipcMain.handle('browse-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择文件夹',
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// 打开文件夹
ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) {
      return { success: false, error: '文件夹不存在' };
    }
    const error = await shell.openPath(folderPath);
    if (error) {
      return { success: false, error };
    }
    return { success: true };
  } catch (e) {
    console.error('Open folder error:', e);
    return { success: false, error: e.message };
  }
});
