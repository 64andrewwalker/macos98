# 06 - App Framework Layer 规范

## 模块概述

App Framework Layer 提供统一的应用开发模型，包括应用生命周期管理、依赖注入和资源托管。

---

## AppManifest（应用清单）

### 职责

声明应用的元信息和权限需求。

### 数据结构

```tsx
interface AppManifest {
  // 基本信息
  id: string;              // 唯一标识，如 'finder'
  name: string;            // 显示名称，如 'Finder'
  version: string;         // 版本号，如 '1.0.0'
  icon: string;            // 图标路径
  
  // 入口
  entry: string;           // 入口模块路径
  
  // 权限声明
  permissions: {
    fs?: PathPermission[];  // 文件系统权限
    services?: string[];     // 系统服务权限
  };
  
  // 菜单配置
  menus?: Menu[];
  
  // 文件关联
  fileAssociations?: FileAssociation[];
}

interface FileAssociation {
  mimeTypes: string[];      // 支持的 MIME 类型
  extensions: string[];      // 支持的扩展名
  role: 'viewer' | 'editor'; // 打开角色
}
```

### 示例

```json
{
  "id": "text-editor",
  "name": "TextEdit",
  "version": "1.0.0",
  "icon": "/System/Library/Icons/TextEdit.png",
  "entry": "apps/text-editor",
  "permissions": {
    "fs": [
      { "path": "/Users/default/Documents", "mode": "readwrite" }
    ],
    "services": ["clipboard"]
  },
  "menus": [
    {
      "id": "file",
      "label": "File",
      "items": [
        { "type": "action", "label": "New", "shortcut": "⌘N", "action": "[file.new](http://file.new)" },
        { "type": "action", "label": "Open...", "shortcut": "⌘O", "action": "[file.open](http://file.open)" },
        { "type": "separator" },
        { "type": "action", "label": "Save", "shortcut": "⌘S", "action": "[file.save](http://file.save)" }
      ]
    }
  ],
  "fileAssociations": [
    { "mimeTypes": ["text/plain"], "extensions": [".txt"], "role": "editor" }
  ]
}
```

---

## AppContext（应用上下文）

### 职责

**核心设计**：App 不允许直接操作全局 API，必须通过 Context 申请资源。Context 负责跟踪和回收所有资源。

### 接口定义

```tsx
interface AppContext {
  // 元信息
  readonly appId: string;
  readonly taskId: string;
  readonly manifest: AppManifest;
  
  // 托管的定时器
  setTimeout(callback: () => void, ms: number): number;
  setInterval(callback: () => void, ms: number): number;
  clearTimeout(id: number): void;
  clearInterval(id: number): void;
  
  // 托管的事件监听
  addEventListener(event: string, handler: EventHandler): void;
  removeEventListener(event: string, handler: EventHandler): void;
  
  // 文件系统（权限受限）
  readonly fs: ScopedFileSystem;
  
  // 系统服务
  getService<T>(serviceName: string): T | undefined;
  
  // 窗口操作
  openWindow(options: Omit<OpenWindowOptions, 'appId' | 'taskId'>): Window;
  closeWindow(windowId: string): void;
  
  // 生命周期
  onTerminate(callback: () => void): void;
  
  // 销毁（由系统调用）
  dispose(): void;
}
```

### ScopedFileSystem（权限受限的文件系统）

```tsx
interface ScopedFileSystem {
  // 与 VFS 相同的接口，但所有操作都会检查权限
  readFile(path: string): Promise<ArrayBuffer | string>;
  writeFile(path: string, data: ArrayBuffer | string): Promise<void>;
  // ...
}
```

### 资源回收机制

```tsx
class AppContextImpl implements AppContext {
  private timers = new Set<number>();
  private listeners = new Map<string, Set<EventHandler>>();
  private terminateCallbacks: Array<() => void> = [];
  
  setTimeout(callback: () => void, ms: number): number {
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, ms);
    this.timers.add(id);
    return id;
  }
  
  dispose(): void {
    // 1. 执行 App 的清理回调
    this.terminateCallbacks.forEach(cb => cb());
    
    // 2. 清除所有定时器
    this.timers.forEach(id => window.clearTimeout(id));
    this.timers.clear();
    
    // 3. 移除所有事件监听
    this.listeners.forEach((handlers, event) => {
      handlers.forEach(handler => {
        eventBus.unsubscribe(event, handler);
      });
    });
    this.listeners.clear();
    
    // 4. 关闭所有窗口
    windowManager.closeAllWindows(this.appId);
  }
}
```

---

## AppRuntime（应用运行时）

### 职责

管理应用的启动、运行和终止。

### 接口定义

```tsx
interface AppRuntime {
  // 应用注册
  registerApp(manifest: AppManifest, factory: AppFactory): void;
  unregisterApp(appId: string): void;
  
  // 启动与终止
  launchApp(appId: string, options?: LaunchOptions): Task;
  terminateApp(taskId: string): void;
  
  // 查询
  getInstalledApps(): AppManifest[];
  getRunningApps(): Array<{ manifest: AppManifest; task: Task }>;
  isAppRunning(appId: string): boolean;
  
  // 文件关联
  getAppForFile(path: string): AppManifest | undefined;
  openFile(path: string): Task;  // 启动关联 App 并打开文件
}

interface LaunchOptions {
  file?: string;           // 要打开的文件路径
  args?: Record<string, unknown>;  // 启动参数
}

type AppFactory = (ctx: AppContext) => AppInstance;

interface AppInstance {
  onLaunch?(): void | Promise<void>;
  onActivate?(): void;     // 变成前台
  onDeactivate?(): void;   // 转入后台
  onTerminate?(): void | Promise<void>;
  
  // 菜单命令处理
  onMenuAction?(action: string): void;
  
  // 打开文件
  openFile?(path: string): void;
}
```

### 启动流程

```tsx
async function launchApp(appId: string, options?: LaunchOptions): Task {
  // 1. 获取 Manifest
  const manifest = getManifest(appId);
  
  // 2. 创建任务
  const task = taskManager.spawn(appId);
  
  // 3. 注册权限
  permissions.registerApp(appId, manifest);
  
  // 4. 创建 Context
  const ctx = new AppContextImpl(appId, [task.id](http://task.id), manifest);
  
  // 5. 创建 App 实例
  const factory = getFactory(appId);
  const instance = factory(ctx);
  
  // 6. 调用生命周期
  await instance.onLaunch?.();
  
  // 7. 打开文件（如果有）
  if (options?.file) {
    instance.openFile?.(options.file);
  }
  
  // 8. 发布事件
  eventBus.publish('app.launched', { appId, taskId: [task.id](http://task.id) });
  
  return task;
}
```

---

## App 开发示例

### TextEdit 应用

```tsx
// apps/text-editor/manifest.json
const manifest: AppManifest = {
  id: 'text-editor',
  name: 'TextEdit',
  version: '1.0.0',
  icon: '/System/Library/Icons/TextEdit.png',
  entry: 'apps/text-editor',
  permissions: {
    fs: [{ path: '/Users/default/Documents', mode: 'readwrite' }],
    services: ['clipboard']
  },
  fileAssociations: [
    { mimeTypes: ['text/plain'], extensions: ['.txt'], role: 'editor' }
  ]
};

// apps/text-editor/index.ts
function createTextEditor(ctx: AppContext): AppInstance {
  let currentWindow: Window | null = null;
  let currentFilePath: string | null = null;
  let isDirty = false;
  
  return {
    onLaunch() {
      // 打开一个空白文档窗口
      currentWindow = ctx.openWindow({
        title: 'Untitled',
        component: () => <TextEditorView ctx={ctx} />,
        initialBounds: { width: 600, height: 400 }
      });
    },
    
    onMenuAction(action: string) {
      switch (action) {
        case '[file.new](http://file.new)':
          // 新建文档
          break;
        case '[file.save](http://file.save)':
          // 保存文件
          if (currentFilePath) {
            ctx.fs.writeFile(currentFilePath, getContent());
            isDirty = false;
          }
          break;
      }
    },
    
    openFile(path: string) {
      currentFilePath = path;
      ctx.fs.readTextFile(path).then(content => {
        setContent(content);
        currentWindow!.title = getFileName(path);
      });
    },
    
    onTerminate() {
      if (isDirty) {
        // 提示保存
      }
    }
  };
}

appRuntime.registerApp(manifest, createTextEditor);
```