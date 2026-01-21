// 状态
let data = { snippets: [], categories: [] };
let currentFilter = 'all';
let searchQuery = '';
let editingId = null;
let draggedCard = null;
let draggedId = null;

// 默认分类（不可删除）
const defaultCategories = [
  { id: 'skills', name: 'Skills', icon: '⚡' },
  { id: 'prompts', name: 'Prompts', icon: '💬' },
  { id: 'mcp-tools', name: 'MCP Tools', icon: '🔧' },
  { id: 'sdk', name: 'SDK', icon: '📦' },
  { id: 'api', name: 'API', icon: '🔌' },
  { id: 'models', name: 'Models', icon: '🤖' },
  { id: 'commands', name: 'Commands', icon: '⌨️' },
  { id: 'urls', name: 'URLs', icon: '🔗' },
  { id: 'text', name: 'Text', icon: '📝' }
];

// 默认分类的 ID 列表（用于判断是否可删除）
const defaultCategoryIds = defaultCategories.map(c => c.id);

// DOM 元素
const snippetsGrid = document.getElementById('snippetsGrid');
const searchBox = document.getElementById('searchBox');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const snippetForm = document.getElementById('snippetForm');
const categoryNav = document.getElementById('categoryNav');
const categoryModal = document.getElementById('categoryModal');
const categoryList = document.getElementById('categoryList');
const closeDialogModal = document.getElementById('closeModal');

// 初始化
async function init() {
  try {
    data = await window.electronAPI.getData();
  } catch (e) {
    console.error('Failed to load data:', e);
    data = { snippets: [], categories: [] };
  }

  // 如果没有分类数据，或者分类数据格式不对（旧格式是字符串数组），使用默认分类
  if (!data.categories || data.categories.length === 0 || typeof data.categories[0] === 'string') {
    data.categories = JSON.parse(JSON.stringify(defaultCategories));
    await window.electronAPI.saveData(data);
  }

  renderCategories();
  renderSnippets();
  updateCategorySelect();
  bindEvents();
  bindCloseEvents();
}

// 渲染侧边栏分类
function renderCategories() {
  const allBtn = `
    <button class="category-btn ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
      <span class="icon">📋</span> 全部
    </button>
  `;

  const categoryBtns = data.categories.map(cat => `
    <button class="category-btn ${currentFilter === cat.id ? 'active' : ''}" data-filter="${cat.id}">
      <span class="icon">${cat.icon}</span> ${cat.name}
    </button>
  `).join('');

  categoryNav.innerHTML = allBtn + categoryBtns;

  // 重新绑定分类点击事件
  categoryNav.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      categoryNav.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderSnippets();
    });
  });
}

// 更新分类下拉选择框
function updateCategorySelect() {
  const select = document.getElementById('snippetCategory');
  select.innerHTML = data.categories.map(cat =>
    `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`
  ).join('');
}

// 渲染分类管理列表
function renderCategoryList() {
  categoryList.innerHTML = data.categories.map((cat, index) => {
    const isDefault = defaultCategoryIds.includes(cat.id);
    return `
      <div class="category-item ${isDefault ? 'default-category' : ''}" data-id="${cat.id}">
        <input type="text" class="cat-icon-edit" value="${cat.icon}" maxlength="2" data-field="icon">
        <input type="text" class="cat-id-edit" value="${cat.id}" data-field="id" readonly>
        <input type="text" class="cat-name-edit" value="${cat.name}" data-field="name">
        ${isDefault
          ? '<span class="cat-default-badge">默认</span>'
          : `<button class="cat-delete-btn" data-id="${cat.id}" title="删除">×</button>`
        }
      </div>
    `;
  }).join('');
}

// 绑定事件
function bindEvents() {
  // 窗口控制
  document.getElementById('minBtn').addEventListener('click', () => window.electronAPI.minimize());
  document.getElementById('maxBtn').addEventListener('click', () => window.electronAPI.maximize());
  document.getElementById('closeBtn').addEventListener('click', () => window.electronAPI.close());

  // 搜索
  searchBox.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderSnippets();
  });

  // 添加按钮
  document.getElementById('addBtn').addEventListener('click', () => openModal());

  // 模态框
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  snippetForm.addEventListener('submit', handleSubmit);

  // 不再点击模态框外部关闭，只能通过按钮关闭
  // modal.addEventListener('click', (e) => {
  //   if (e.target === modal) closeModal();
  // });

  // ESC 关闭模态框
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (categoryModal.classList.contains('show')) {
        closeCategoryModal();
      } else if (modal.classList.contains('show')) {
        closeModal();
      }
    }
  });

  // 导入导出
  document.getElementById('importBtn').addEventListener('click', handleImport);
  document.getElementById('exportBtn').addEventListener('click', handleExport);

  // 浏览 EXE 文件
  document.getElementById('browseExeBtn').addEventListener('click', async () => {
    const exePath = await window.electronAPI.browseExe();
    if (exePath) {
      document.getElementById('snippetExe').value = exePath;
    }
  });

  // 浏览文件
  document.getElementById('browseFileBtn').addEventListener('click', async () => {
    const filePath = await window.electronAPI.browseFile();
    if (filePath) {
      document.getElementById('snippetFile').value = filePath;
    }
  });

  // 浏览文件夹
  document.getElementById('browseFolderBtn').addEventListener('click', async () => {
    const folderPath = await window.electronAPI.browseFolder();
    if (folderPath) {
      document.getElementById('snippetFolder').value = folderPath;
    }
  });

  // 事件委托：处理卡片上的按钮点击
  snippetsGrid.addEventListener('click', (e) => {
    const target = e.target;
    const card = target.closest('.snippet-card');
    if (!card) return;

    const id = card.dataset.id;

    if (target.classList.contains('copy-btn')) {
      copySnippet(id, target);
    } else if (target.classList.contains('edit-btn')) {
      editSnippet(id);
    } else if (target.classList.contains('delete-btn')) {
      deleteSnippet(id);
    } else if (target.classList.contains('run-btn')) {
      runSnippetExe(id, target);
    } else if (target.classList.contains('url-btn')) {
      openSnippetUrl(id, target);
    } else if (target.classList.contains('file-btn')) {
      openSnippetFile(id, target);
    } else if (target.classList.contains('folder-btn')) {
      openSnippetFolder(id, target);
    }
  });

  // 事件委托：处理优先级选择
  snippetsGrid.addEventListener('change', async (e) => {
    if (e.target.classList.contains('priority-select')) {
      const id = e.target.dataset.id;
      const newPriority = e.target.value;
      const snippet = data.snippets.find(s => s.id === id);
      if (snippet) {
        snippet.priority = newPriority;
        // 重新整理顺序
        reorderSnippets();
        await window.electronAPI.saveData(data);
        renderSnippets();
        showToast('优先级已更新!');
      }
    }
  });

  // 分类管理按钮
  document.getElementById('manageCatBtn').addEventListener('click', openCategoryModal);
  document.getElementById('categoryModalClose').addEventListener('click', closeCategoryModal);
  document.getElementById('saveCatBtn').addEventListener('click', saveCategoryChanges);
  document.getElementById('addCatBtn').addEventListener('click', addNewCategory);

  // 点击分类模态框外部关闭
  categoryModal.addEventListener('click', (e) => {
    if (e.target === categoryModal) closeCategoryModal();
  });

  // 分类列表事件委托
  categoryList.addEventListener('click', (e) => {
    if (e.target.classList.contains('cat-delete-btn')) {
      const catId = e.target.dataset.id;
      deleteCategory(catId);
    }
  });

  // 分类列表输入事件
  categoryList.addEventListener('input', (e) => {
    const item = e.target.closest('.category-item');
    if (!item) return;

    const catId = item.dataset.id;
    const field = e.target.dataset.field;
    const value = e.target.value;

    const cat = data.categories.find(c => c.id === catId);
    if (cat && field) {
      cat[field] = value;
    }
  });
}

// 打开分类管理模态框
function openCategoryModal() {
  renderCategoryList();
  categoryModal.classList.add('show');
}

// 关闭分类管理模态框
function closeCategoryModal() {
  categoryModal.classList.remove('show');
}

// 保存分类更改
async function saveCategoryChanges() {
  await window.electronAPI.saveData(data);
  renderCategories();
  updateCategorySelect();
  closeCategoryModal();
  showToast('分类已保存!');
}

// 添加新分类
function addNewCategory() {
  const icon = document.getElementById('newCatIcon').value.trim() || '📁';
  const id = document.getElementById('newCatId').value.trim().toLowerCase().replace(/\s+/g, '-');
  const name = document.getElementById('newCatName').value.trim();

  if (!id || !name) {
    showToast('请填写 ID 和名称');
    return;
  }

  if (data.categories.some(c => c.id === id)) {
    showToast('该 ID 已存在');
    return;
  }

  data.categories.push({ id, name, icon });
  renderCategoryList();

  // 清空输入框
  document.getElementById('newCatIcon').value = '';
  document.getElementById('newCatId').value = '';
  document.getElementById('newCatName').value = '';

  showToast('分类已添加!');
}

// 删除分类
function deleteCategory(catId) {
  // 检查是否有片段使用该分类
  const snippetsUsingCat = data.snippets.filter(s => s.category === catId);
  if (snippetsUsingCat.length > 0) {
    if (!confirm(`该分类下有 ${snippetsUsingCat.length} 个片段，删除后这些片段将变为未分类。确定删除吗?`)) {
      return;
    }
    // 将使用该分类的片段改为第一个分类
    const firstCat = data.categories.find(c => c.id !== catId);
    if (firstCat) {
      snippetsUsingCat.forEach(s => s.category = firstCat.id);
    }
  }

  data.categories = data.categories.filter(c => c.id !== catId);
  renderCategoryList();
  showToast('分类已删除!');
}

// 优先级排序权重
const priorityWeight = { high: 0, medium: 1, low: 2 };

// 获取排序后的片段
function getSortedSnippets(snippets) {
  return [...snippets].sort((a, b) => {
    const priorityA = priorityWeight[a.priority || 'medium'];
    const priorityB = priorityWeight[b.priority || 'medium'];
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    // 同优先级按 order 排序
    return (a.order || 0) - (b.order || 0);
  });
}

// 渲染片段
function renderSnippets() {
  let filtered = data.snippets.filter(s => {
    const matchesFilter = currentFilter === 'all' || s.category === currentFilter;
    const matchesSearch = searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // 按优先级排序
  filtered = getSortedSnippets(filtered);

  if (filtered.length === 0) {
    snippetsGrid.innerHTML = `
      <div class="empty-state">
        <h3>没有找到片段</h3>
        <p>点击右上角 "+ 添加片段" 创建新的片段</p>
      </div>
    `;
    return;
  }

  snippetsGrid.innerHTML = filtered.map(s => {
    const cat = data.categories.find(c => c.id === s.category);
    const catName = cat ? cat.name : s.category;
    const hasExe = s.exePath && s.exePath.trim();
    const hasUrl = s.url && s.url.trim();
    const hasFile = s.filePath && s.filePath.trim();
    const hasFolder = s.folderPath && s.folderPath.trim();
    const priority = s.priority || 'medium';
    const priorityLabels = { high: '高', medium: '中', low: '低' };
    return `
      <div class="snippet-card" data-id="${s.id}" draggable="true">
        <div class="snippet-header">
          <span class="snippet-name">${escapeHtml(s.name)}</span>
          <div class="snippet-header-right">
            <select class="priority-select priority-${priority}" data-id="${s.id}" title="优先级">
              <option value="high" ${priority === 'high' ? 'selected' : ''}>🔴 高</option>
              <option value="medium" ${priority === 'medium' ? 'selected' : ''}>🟡 中</option>
              <option value="low" ${priority === 'low' ? 'selected' : ''}>🟢 低</option>
            </select>
            <span class="snippet-category">${catName}</span>
          </div>
        </div>
        <div class="snippet-content">${escapeHtml(s.content)}</div>
        ${s.description ? `<div class="snippet-desc">${escapeHtml(s.description)}</div>` : ''}
        <div class="snippet-actions">
          ${hasUrl ? `<button class="url-btn" title="打开网址">🔗 网址</button>` : ''}
          ${hasFile ? `<button class="file-btn" title="打开文件">📄 文件</button>` : ''}
          ${hasFolder ? `<button class="folder-btn" title="打开文件夹">📁 文件夹</button>` : ''}
          ${hasExe ? `<button class="run-btn" title="运行程序">▶ 运行</button>` : ''}
          <button class="copy-btn">复制</button>
          <button class="edit-btn" title="编辑">✎</button>
          <button class="delete-btn" title="删除">×</button>
        </div>
      </div>
    `;
  }).join('');

  // 绑定拖拽事件
  bindDragEvents();
}

// 绑定拖拽事件
function bindDragEvents() {
  const cards = snippetsGrid.querySelectorAll('.snippet-card');

  cards.forEach(card => {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('dragenter', handleDragEnter);
    card.addEventListener('dragleave', handleDragLeave);
    card.addEventListener('drop', handleDrop);
  });
}

// 拖拽开始
function handleDragStart(e) {
  draggedCard = this;
  draggedId = this.dataset.id;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedId);
}

// 拖拽结束
function handleDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.snippet-card').forEach(card => {
    card.classList.remove('drag-over');
  });
  draggedCard = null;
  draggedId = null;
}

// 拖拽经过
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

// 拖拽进入
function handleDragEnter(e) {
  e.preventDefault();
  if (this !== draggedCard) {
    this.classList.add('drag-over');
  }
}

// 拖拽离开
function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

// 放置
async function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');

  if (this === draggedCard || !draggedId) return;

  const targetId = this.dataset.id;
  const draggedSnippet = data.snippets.find(s => s.id === draggedId);
  const targetSnippet = data.snippets.find(s => s.id === targetId);

  if (!draggedSnippet || !targetSnippet) return;

  // 如果优先级相同，交换 order
  if ((draggedSnippet.priority || 'medium') === (targetSnippet.priority || 'medium')) {
    const tempOrder = draggedSnippet.order || 0;
    draggedSnippet.order = targetSnippet.order || 0;
    targetSnippet.order = tempOrder;
  } else {
    // 如果优先级不同，将拖拽的片段改为目标的优先级
    draggedSnippet.priority = targetSnippet.priority || 'medium';
    draggedSnippet.order = (targetSnippet.order || 0) + 0.5;
    // 重新整理 order
    reorderSnippets();
  }

  await window.electronAPI.saveData(data);
  renderSnippets();
  showToast('顺序已更新!');
}

// 重新整理片段顺序
function reorderSnippets() {
  const sorted = getSortedSnippets(data.snippets);
  sorted.forEach((s, index) => {
    s.order = index;
  });
}

// HTML 转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 复制片段
async function copySnippet(id, btn) {
  const snippet = data.snippets.find(s => s.id === id);
  if (snippet) {
    await window.electronAPI.copyToClipboard(snippet.content);
    btn.textContent = '已复制!';
    btn.classList.add('copied');
    showToast('已复制到剪贴板!');
    setTimeout(() => {
      btn.textContent = '复制';
      btn.classList.remove('copied');
    }, 2000);
  }
}

// 打开模态框
function openModal(snippet = null) {
  editingId = snippet ? snippet.id : null;
  modalTitle.textContent = snippet ? '编辑片段' : '添加新片段';

  document.getElementById('snippetName').value = snippet ? snippet.name : '';
  document.getElementById('snippetContent').value = snippet ? snippet.content : '';
  document.getElementById('snippetCategory').value = snippet ? snippet.category : (data.categories[0]?.id || 'skills');
  document.getElementById('snippetDesc').value = snippet ? (snippet.description || '') : '';
  document.getElementById('snippetUrl').value = snippet ? (snippet.url || '') : '';
  document.getElementById('snippetFile').value = snippet ? (snippet.filePath || '') : '';
  document.getElementById('snippetFolder').value = snippet ? (snippet.folderPath || '') : '';
  document.getElementById('snippetExe').value = snippet ? (snippet.exePath || '') : '';

  modal.classList.add('show');
  document.getElementById('snippetName').focus();
}

// 关闭模态框
function closeModal() {
  modal.classList.remove('show');
  snippetForm.reset();
  editingId = null;
}

// 处理表单提交
async function handleSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('snippetName').value.trim();
  const content = document.getElementById('snippetContent').value.trim();
  const category = document.getElementById('snippetCategory').value;
  const description = document.getElementById('snippetDesc').value.trim();
  const url = document.getElementById('snippetUrl').value.trim();
  const filePath = document.getElementById('snippetFile').value.trim();
  const folderPath = document.getElementById('snippetFolder').value.trim();
  const exePath = document.getElementById('snippetExe').value.trim();

  if (!name || !content) {
    showToast('请填写名称和内容');
    return;
  }

  if (editingId) {
    // 编辑现有片段
    const index = data.snippets.findIndex(s => s.id === editingId);
    if (index !== -1) {
      data.snippets[index] = {
        ...data.snippets[index],
        name,
        content,
        category,
        description,
        url,
        filePath,
        folderPath,
        exePath,
        updatedAt: new Date().toISOString()
      };
    }
    showToast('片段已更新!');
  } else {
    // 添加新片段
    const newSnippet = {
      id: Date.now().toString(),
      name,
      content,
      category,
      description,
      url,
      filePath,
      folderPath,
      exePath,
      createdAt: new Date().toISOString()
    };
    data.snippets.unshift(newSnippet);
    showToast('片段已添加!');
  }

  await window.electronAPI.saveData(data);
  closeModal();
  renderSnippets();
}

// 运行片段绑定的 EXE
async function runSnippetExe(id, btn) {
  const snippet = data.snippets.find(s => s.id === id);
  if (snippet && snippet.exePath) {
    btn.textContent = '运行中...';
    btn.disabled = true;

    const result = await window.electronAPI.runExe(snippet.exePath);
    if (result.success) {
      showToast('程序已启动!');
    } else {
      showToast('启动失败: ' + result.error);
    }

    setTimeout(() => {
      btn.textContent = '▶ 运行';
      btn.disabled = false;
    }, 1000);
  }
}

// 打开片段绑定的网址
async function openSnippetUrl(id, btn) {
  const snippet = data.snippets.find(s => s.id === id);
  if (snippet && snippet.url) {
    btn.textContent = '打开中...';
    btn.disabled = true;

    const result = await window.electronAPI.openUrl(snippet.url);
    if (result.success) {
      showToast('已在浏览器中打开!');
    } else {
      showToast('打开失败: ' + result.error);
    }

    setTimeout(() => {
      btn.textContent = '🔗 网址';
      btn.disabled = false;
    }, 1000);
  }
}

// 打开片段绑定的文件
async function openSnippetFile(id, btn) {
  const snippet = data.snippets.find(s => s.id === id);
  if (snippet && snippet.filePath) {
    btn.textContent = '打开中...';
    btn.disabled = true;

    const result = await window.electronAPI.openFile(snippet.filePath);
    if (result.success) {
      showToast('文件已打开!');
    } else {
      showToast('打开失败: ' + result.error);
    }

    setTimeout(() => {
      btn.textContent = '📄 文件';
      btn.disabled = false;
    }, 1000);
  }
}

// 打开片段绑定的文件夹
async function openSnippetFolder(id, btn) {
  const snippet = data.snippets.find(s => s.id === id);
  if (snippet && snippet.folderPath) {
    btn.textContent = '打开中...';
    btn.disabled = true;

    const result = await window.electronAPI.openFolder(snippet.folderPath);
    if (result.success) {
      showToast('文件夹已打开!');
    } else {
      showToast('打开失败: ' + result.error);
    }

    setTimeout(() => {
      btn.textContent = '📁 文件夹';
      btn.disabled = false;
    }, 1000);
  }
}

// 编辑片段
function editSnippet(id) {
  const snippet = data.snippets.find(s => s.id === id);
  if (snippet) {
    openModal(snippet);
  }
}

// 删除片段
async function deleteSnippet(id) {
  if (!confirm('确定要删除这个片段吗?')) return;

  data.snippets = data.snippets.filter(s => s.id !== id);
  await window.electronAPI.saveData(data);
  renderSnippets();
  showToast('片段已删除!');
}

// 导入
async function handleImport() {
  const imported = await window.electronAPI.importData();
  if (imported) {
    data = imported;
    // 确保有分类数据
    if (!data.categories || data.categories.length === 0) {
      data.categories = defaultCategories;
    }
    renderCategories();
    renderSnippets();
    updateCategorySelect();
    showToast('数据已导入!');
  }
}

// 导出
async function handleExport() {
  const success = await window.electronAPI.exportData();
  if (success) {
    showToast('数据已导出!');
  }
}

// 显示 Toast
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// 绑定关闭事件
function bindCloseEvents() {
  // 监听主进程发来的关闭请求
  window.electronAPI.onCloseRequested(() => {
    closeDialogModal.classList.add('show');
  });

  // 最小化到托盘按钮
  document.getElementById('minimizeToTrayBtn').addEventListener('click', () => {
    closeDialogModal.classList.remove('show');
    window.electronAPI.minimizeToTray();
  });

  // 退出程序按钮
  document.getElementById('quitAppBtn').addEventListener('click', () => {
    closeDialogModal.classList.remove('show');
    window.electronAPI.quitApp();
  });

  // 点击模态框外部关闭
  closeDialogModal.addEventListener('click', (e) => {
    if (e.target === closeDialogModal) {
      closeDialogModal.classList.remove('show');
    }
  });
}

// 启动
init();
