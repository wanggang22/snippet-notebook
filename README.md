# Snippet Notebook

一款快捷复制工具，帮助你管理和快速复制常用的代码片段、命令、URL、提示词等内容。

## 功能特性

- **分类管理** - 内置 9 种分类：Skills、Prompts、MCP Tools、SDK、API、Models、Commands、URLs、Text
- **自定义分类** - 支持添加、编辑、删除自定义分类
- **一键复制** - 点击即可复制片段内容到剪贴板
- **绑定网址** - 为片段绑定 URL，一键在浏览器中打开
- **绑定文件** - 为片段绑定文件，一键用默认程序打开
- **绑定文件夹** - 为片段绑定文件夹，一键在资源管理器中打开
- **绑定程序** - 为片段绑定可执行文件，一键运行
- **搜索过滤** - 支持按名称、内容、描述搜索片段
- **数据导入导出** - 支持 JSON 格式的数据备份和恢复
- **系统托盘** - 支持最小化到系统托盘，后台运行
- **全局快捷键** - `Ctrl+Shift+S` 快速唤起窗口

## 安装方式

### 方式 1：下载安装包（推荐）

前往 [Releases](../../releases) 页面下载对应系统的安装包：

| 系统 | 文件 |
|------|------|
| Windows | `Snippet Notebook Setup x.x.x.exe` (安装版) 或 `Snippet Notebook x.x.x.exe` (便携版) |
| macOS | `Snippet Notebook-x.x.x.dmg` |
| Linux | `Snippet Notebook-x.x.x.AppImage` 或 `.deb` |

### 方式 2：从源码运行

```bash
# 克隆仓库
git clone https://github.com/你的用户名/snippet-notebook.git
cd snippet-notebook

# 安装依赖
npm install

# 运行
npm start
```

## 使用说明

### 添加片段

1. 点击右上角 **+ 添加片段** 按钮
2. 填写片段信息：
   - **名称** - 片段的标识名称
   - **内容** - 要复制的文本内容
   - **分类** - 选择所属分类
   - **描述** - 可选，简短描述
   - **绑定网址** - 可选，关联的 URL
   - **绑定文件** - 可选，关联的文件路径
   - **绑定文件夹** - 可选，关联的文件夹路径
   - **绑定程序** - 可选，关联的可执行文件路径
3. 点击 **保存**

### 复制片段

- 点击片段卡片上的 **复制** 按钮，内容会自动复制到剪贴板

### 快捷操作

| 按钮 | 功能 |
|------|------|
| 🔗 网址 | 在默认浏览器中打开绑定的网址 |
| 📄 文件 | 用默认程序打开绑定的文件 |
| 📁 文件夹 | 在资源管理器中打开绑定的文件夹 |
| ▶ 运行 | 运行绑定的可执行程序 |
| ✎ | 编辑片段 |
| × | 删除片段 |

### 分类管理

1. 点击侧边栏的 **⚙** 按钮
2. 可以修改现有分类的图标和名称
3. 在底部添加新分类（需要填写 ID、名称、图标）
4. 点击 **完成** 保存

### 数据备份

- **导出** - 点击侧边栏底部的 **📤 导出** 按钮，保存为 JSON 文件
- **导入** - 点击 **📥 导入** 按钮，选择之前导出的 JSON 文件

### 系统托盘

- 点击窗口关闭按钮时，可选择 **最小化到托盘** 或 **退出程序**
- 托盘图标右键菜单可 **显示窗口** 或 **退出**
- 单击托盘图标可快速显示窗口

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+S` | 全局唤起/聚焦窗口 |
| `Esc` | 关闭当前弹窗 |

## 数据存储

用户数据存储在系统应用数据目录，不会随程序删除而丢失：

| 系统 | 路径 |
|------|------|
| Windows | `%APPDATA%\snippet-notebook\snippets.json` |
| macOS | `~/Library/Application Support/snippet-notebook/snippets.json` |
| Linux | `~/.config/snippet-notebook/snippets.json` |

## 开发

```bash
# 安装依赖
npm install

# 开发运行
npm start

# 打包 Windows 版本
npm run build:win

# 打包 macOS 版本
npm run build:mac

# 打包 Linux 版本
npm run build:linux

# 打包所有平台
npm run build:all
```

## 技术栈

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [electron-builder](https://www.electron.build/) - 应用打包工具
- 原生 HTML/CSS/JavaScript - 前端界面

## 许可证

MIT License
