# 05 - UI Shell Layer 规范

## 模块概述

UI Shell Layer 负责桌面环境的视觉呈现与窗口管理，是用户与系统交互的主要界面。

---

## WindowManager（窗口管理器）

### 职责

管理窗口的创建、销毁、层级和焦点。

### 数据结构

```tsx
interface Window {
  id: string;
  appId: string;
  taskId: string;
  title: string;
  bounds: WindowBounds;
  state: WindowState;
  component: React.ComponentType;  // 窗口内容组件
  shadowRoot: ShadowRoot;          // 样式隔离容器
}

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

type WindowState = 
  | 'normal'
  | 'minimized'
  | 'maximized';
```

### 接口定义

```tsx
interface WindowManager {
  // 窗口生命周期
  openWindow(options: OpenWindowOptions): Window;
  closeWindow(windowId: string): void;
  closeAllWindows(appId: string): void;
  
  // 窗口操作
  focusWindow(windowId: string): void;
  minimizeWindow(windowId: string): void;
  maximizeWindow(windowId: string): void;
  restoreWindow(windowId: string): void;
  
  // 位置与大小
  moveWindow(windowId: string, x: number, y: number): void;
  resizeWindow(windowId: string, width: number, height: number): void;
  setBounds(windowId: string, bounds: Partial<WindowBounds>): void;
  
  // 查询
  getWindow(windowId: string): Window | undefined;
  getWindowsByApp(appId: string): Window[];
  getAllWindows(): Window[];
  getFocusedWindow(): Window | undefined;
  
  // 事件
  onWindowChange(callback: (event: WindowEvent) => void): Unsubscribe;
}

interface OpenWindowOptions {
  appId: string;
  taskId: string;
  title: string;
  component: React.ComponentType;
  initialBounds?: Partial<WindowBounds>;
  minSize?: { width: number; height: number };
  resizable?: boolean;
}
```

### Z 序管理策略

<aside>
💡

**DOM 顺序即 Z 序**

不使用 `z-index` 数值管理窗口层级。当窗口获得焦点时，将其 DOM 节点移动到容器的最后一个子节点位置。

浏览器天然规则：后渲染的元素在视觉上位于上层。

</aside>

```tsx
// 伪代码实现
function focusWindow(windowId: string) {
  const windowEl = document.getElementById(windowId);
  const container = windowEl.parentElement;
  container.appendChild(windowEl);  // 移到末尾 = 最顶层
  updateFocusState(windowId);
}
```

### 测试用例

```tsx
describe('WindowManager', () => {
  it('should open a new window', () => {
    const win = windowManager.openWindow({
      appId: 'finder',
      taskId: 'task-1',
      title: 'Finder',
      component: FinderView
    });
    expect([win.id](http://win.id)).toBeDefined();
    expect(windowManager.getWindow([win.id](http://win.id))).toBe(win);
  });

  it('should bring window to front on focus', () => {
    const win1 = windowManager.openWindow({ ... });
    const win2 = windowManager.openWindow({ ... });
    windowManager.focusWindow([win1.id](http://win1.id));
    expect(windowManager.getFocusedWindow()).toBe(win1);
  });

  it('should close all windows of an app', () => {
    windowManager.openWindow({ appId: 'finder', ... });
    windowManager.openWindow({ appId: 'finder', ... });
    windowManager.closeAllWindows('finder');
    expect(windowManager.getWindowsByApp('finder')).toHaveLength(0);
  });
});
```

---

## Desktop（桌面）

### 职责

渲染桌面背景、图标和右键菜单。

### 数据结构

```tsx
interface DesktopIcon {
  id: string;
  name: string;
  icon: string;           // 图标 URL 或内置图标名
  position: { x: number; y: number };
  target: DesktopIconTarget;
}

type DesktopIconTarget = 
  | { type: 'app'; appId: string }
  | { type: 'file'; path: string }
  | { type: 'folder'; path: string };

interface DesktopState {
  wallpaper: string;      // 壁纸 URL
  icons: DesktopIcon[];
  selectedIconIds: string[];
}
```

### 接口定义

```tsx
interface Desktop {
  // 壁纸
  setWallpaper(url: string): void;
  getWallpaper(): string;
  
  // 图标管理
  addIcon(icon: Omit<DesktopIcon, 'id'>): DesktopIcon;
  removeIcon(iconId: string): void;
  moveIcon(iconId: string, position: { x: number; y: number }): void;
  
  // 选择
  selectIcon(iconId: string, multi?: boolean): void;
  clearSelection(): void;
  getSelectedIcons(): DesktopIcon[];
  
  // 交互
  onIconDoubleClick(callback: (icon: DesktopIcon) => void): Unsubscribe;
  onContextMenu(callback: (event: ContextMenuEvent) => void): Unsubscribe;
}
```

---

## MenuBar（菜单栏）

### 职责

渲染全局菜单栏，响应当前活动 App 的菜单配置。

### 数据结构

```tsx
interface MenuBarState {
  systemMenus: Menu[];     // 系统菜单（Apple 菜单等）
  appMenus: Menu[];        // 当前 App 的菜单
  activeMenuId: string | null;
}

interface Menu {
  id: string;
  label: string;
  items: MenuItem[];
}

type MenuItem = 
  | { type: 'action'; label: string; shortcut?: string; action: string; disabled?: boolean }
  | { type: 'separator' }
  | { type: 'submenu'; label: string; items: MenuItem[] };
```

### 接口定义

```tsx
interface MenuBar {
  // 菜单配置
  setAppMenus(appId: string, menus: Menu[]): void;
  clearAppMenus(): void;
  
  // 系统菜单
  setSystemMenus(menus: Menu[]): void;
  
  // 状态
  getActiveMenuId(): string | null;
  
  // 事件
  onMenuAction(callback: (action: string, appId: string) => void): Unsubscribe;
}
```

### 与 App 的联动

```tsx
// 当活动窗口变化时，更新菜单栏
eventBus.subscribe('window.focused', ({ windowId }) => {
  const window = windowManager.getWindow(windowId);
  if (window) {
    const appMenus = appRuntime.getAppMenus(window.appId);
    menuBar.setAppMenus(window.appId, appMenus);
  }
});
```

---

## SystemOverlay（系统弹出层）

### 职责

作为模态对话框、下拉菜单、工具提示的顶层容器，确保这些元素不被窗口遮挡。

### DOM 结构

```html
<body>
  <div id="desktop">...</div>
  <div id="windows-container">...</div>
  <div id="system-overlay">
    <!-- 所有弹出层内容通过 Portal 渲染到这里 -->
    <div class="dropdown-menu">...</div>
    <div class="modal-dialog">...</div>
    <div class="tooltip">...</div>
  </div>
</body>
```

### 接口定义

```tsx
interface SystemOverlay {
  // 模态对话框
  showModal(options: ModalOptions): Promise<ModalResult>;
  closeModal(modalId: string): void;
  
  // 下拉菜单
  showDropdown(options: DropdownOptions): string;
  closeDropdown(dropdownId: string): void;
  closeAllDropdowns(): void;
  
  // 工具提示
  showTooltip(options: TooltipOptions): string;
  hideTooltip(tooltipId: string): void;
  
  // 通知
  showNotification(options: NotificationOptions): string;
  dismissNotification(notificationId: string): void;
}
```

### React Portal 使用示例

```tsx
function DropdownMenu({ items, position }) {
  return ReactDOM.createPortal(
    <div 
      className="dropdown-menu"
      style= left: position.x, top: position.y 
    >
      {[items.map](http://items.map)(item => (
        <DropdownItem key={[item.id](http://item.id)} {...item} />
      ))}
    </div>,
    document.getElementById('system-overlay')
  );
}
```