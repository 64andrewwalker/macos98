# 04 - Kernel Layer 规范

## 模块概述

Kernel Layer 模拟操作系统内核的核心功能，包括任务管理、虚拟文件系统、事件总线和权限系统。

---

## TaskManager（任务管理器）

### 职责

管理「任务」的生命周期。任务是 App 运行实例的抽象。

### 数据结构

```tsx
interface Task {
  id: string;           // 唯一标识
  appId: string;        // 关联的应用 ID
  state: TaskState;     // 当前状态
  createdAt: number;    // 创建时间戳
  context: AppContext;  // 关联的 App Context
}

type TaskState = 
  | 'ready'       // 已创建，等待运行
  | 'running'     // 正在运行
  | 'suspended'   // 已挂起
  | 'terminated'; // 已终止
```

### 接口定义

```tsx
interface TaskManager {
  // 任务生命周期
  spawn(appId: string): Task;
  suspend(taskId: string): void;
  resume(taskId: string): void;
  kill(taskId: string): void;
  
  // 查询
  getTask(taskId: string): Task | undefined;
  getTasksByApp(appId: string): Task[];
  getAllTasks(): Task[];
  getRunningTasks(): Task[];
  
  // 事件
  onTaskStateChange(callback: (task: Task, prevState: TaskState) => void): Unsubscribe;
}
```

### 测试用例

```tsx
describe('TaskManager', () => {
  it('should spawn a new task', () => {
    const task = taskManager.spawn('finder');
    expect([task.id](http://task.id)).toBeDefined();
    expect(task.appId).toBe('finder');
    expect(task.state).toBe('ready');
  });

  it('should kill a task and clean up resources', () => {
    const task = taskManager.spawn('finder');
    taskManager.kill([task.id](http://task.id));
    expect(task.state).toBe('terminated');
    expect(taskManager.getTask([task.id](http://task.id))).toBeUndefined();
  });

  it('should emit state change events', () => {
    const spy = vi.fn();
    taskManager.onTaskStateChange(spy);
    const task = taskManager.spawn('finder');
    taskManager.suspend([task.id](http://task.id));
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'suspended' }),
      'running'
    );
  });
});
```

---

## VFS（虚拟文件系统）

### 职责

提供类 Unix 的文件系统抽象，底层使用 IndexedDB 持久化。

### 数据结构

```tsx
interface VfsNode {
  id: string;              // 唯一标识
  type: 'file' | 'directory';
  name: string;            // 文件/目录名
  parentId: string | null; // 父目录 ID（null 表示根目录）
  path: string;            // 完整路径（缓存）
  createdAt: number;
  updatedAt: number;
  
  // 仅文件有效
  mimeType?: string;
  size?: number;
  contentId?: string;      // 指向 contents 表
}

interface VfsStat {
  type: 'file' | 'directory';
  name: string;
  path: string;
  size: number;
  mimeType?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 接口定义

```tsx
interface VirtualFileSystem {
  // 目录操作
  mkdir(path: string): Promise<void>;
  readdir(path: string): Promise<string[]>;  // 返回子项名称列表
  rmdir(path: string): Promise<void>;        // 仅删除空目录
  
  // 文件操作
  readFile(path: string): Promise<ArrayBuffer | string>;
  readTextFile(path: string): Promise<string>;
  writeFile(path: string, data: ArrayBuffer | string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  
  // 通用操作
  stat(path: string): Promise<VfsStat>;
  exists(path: string): Promise<boolean>;
  rename(oldPath: string, newPath: string): Promise<void>;
  copy(srcPath: string, destPath: string): Promise<void>;
  
  // 监听
  watch(path: string, callback: (event: VfsEvent) => void): Unsubscribe;
}

interface VfsEvent {
  type: 'create' | 'update' | 'delete' | 'rename';
  path: string;
  oldPath?: string;  // 仅 rename 事件
}
```

### 初始目录结构

```
/
├── System/
│   ├── Settings/
│   └── Library/
├── Applications/
│   ├── [Finder.app/](http://Finder.app/)
│   ├── [TextEdit.app/](http://TextEdit.app/)
│   └── [Settings.app/](http://Settings.app/)
└── Users/
    └── default/
        ├── Desktop/
        └── Documents/
```

### 测试用例

```tsx
describe('VFS', () => {
  beforeEach(async () => {
    await vfs.mkdir('/test');
  });

  it('should create and read a directory', async () => {
    await vfs.mkdir('/test/subdir');
    const entries = await vfs.readdir('/test');
    expect(entries).toContain('subdir');
  });

  it('should write and read a text file', async () => {
    await vfs.writeFile('/test/hello.txt', 'Hello, World!');
    const content = await vfs.readTextFile('/test/hello.txt');
    expect(content).toBe('Hello, World!');
  });

  it('should return correct stat', async () => {
    await vfs.writeFile('/test/file.txt', 'content');
    const stat = await vfs.stat('/test/file.txt');
    expect(stat.type).toBe('file');
    expect(stat.size).toBe(7);
  });

  it('should emit watch events', async () => {
    const spy = vi.fn();
    [vfs.watch](http://vfs.watch)('/test', spy);
    await vfs.writeFile('/test/new.txt', 'data');
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'create', path: '/test/new.txt' })
    );
  });

  it('should throw on non-existent path', async () => {
    await expect(vfs.readFile('/nonexistent')).rejects.toThrow('ENOENT');
  });
});
```

---

## EventBus（事件总线）

### 职责

提供全局的发布/订阅机制，用于系统事件和 App 间通信。

### 接口定义

```tsx
interface EventBus {
  // 发布订阅
  publish<T>(event: string, payload?: T): void;
  subscribe<T>(event: string, callback: (payload: T) => void): Unsubscribe;
  subscribeOnce<T>(event: string, callback: (payload: T) => void): Unsubscribe;
  
  // 带命名空间的订阅（用于 App 隔离）
  createChannel(namespace: string): EventChannel;
}

interface EventChannel {
  publish<T>(event: string, payload?: T): void;
  subscribe<T>(event: string, callback: (payload: T) => void): Unsubscribe;
  destroy(): void;  // 取消该 channel 的所有订阅
}
```

### 系统事件清单

| 事件名 | Payload | 触发时机 |
| --- | --- | --- |
| `system.boot` | `{}` | 系统启动完成 |
| `system.shutdown` | `{}` | 系统关闭前 |
| `app.launched` | `{ appId, taskId }` | App 启动 |
| `app.terminated` | `{ appId, taskId }` | App 终止 |
| `window.opened` | `{ windowId, appId }` | 窗口打开 |
| `window.closed` | `{ windowId }` | 窗口关闭 |
| `window.focused` | `{ windowId }` | 窗口获得焦点 |
| `fs.changed` | `VfsEvent` | 文件系统变更 |
| `settings.changed` | `{ key, value }` | 设置变更 |

### 测试用例

```tsx
describe('EventBus', () => {
  it('should publish and subscribe', () => {
    const spy = vi.fn();
    bus.subscribe('test', spy);
    bus.publish('test', { data: 123 });
    expect(spy).toHaveBeenCalledWith({ data: 123 });
  });

  it('should unsubscribe', () => {
    const spy = vi.fn();
    const unsub = bus.subscribe('test', spy);
    unsub();
    bus.publish('test', {});
    expect(spy).not.toHaveBeenCalled();
  });

  it('should isolate channels', () => {
    const ch1 = bus.createChannel('app1');
    const ch2 = bus.createChannel('app2');
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    ch1.subscribe('msg', spy1);
    ch2.subscribe('msg', spy2);
    ch1.publish('msg', {});
    expect(spy1).toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
  });
});
```

---

## Permissions（权限系统）

### 职责

基于 Manifest 声明，检查 App 对资源的访问权限。

### 接口定义

```tsx
interface PermissionManager {
  // 权限检查
  canAccessPath(appId: string, path: string, mode: 'read' | 'write'): boolean;
  canUseService(appId: string, service: string): boolean;
  
  // 权限注册（App 启动时调用）
  registerApp(appId: string, manifest: AppManifest): void;
  unregisterApp(appId: string): void;
  
  // 查询
  getAppPermissions(appId: string): AppPermissions;
}

interface AppPermissions {
  fs: PathPermission[];   // 文件系统权限
  services: string[];      // 允许使用的系统服务
}

interface PathPermission {
  path: string;            // 允许访问的路径前缀
  mode: 'read' | 'write' | 'readwrite';
}
```

### 测试用例

```tsx
describe('Permissions', () => {
  beforeEach(() => {
    permissions.registerApp('text-editor', {
      id: 'text-editor',
      permissions: {
        fs: [{ path: '/Users/default/Documents', mode: 'readwrite' }],
        services: ['clipboard']
      }
    });
  });

  it('should allow access to permitted path', () => {
    expect(
      permissions.canAccessPath('text-editor', '/Users/default/Documents/file.txt', 'read')
    ).toBe(true);
  });

  it('should deny access to non-permitted path', () => {
    expect(
      permissions.canAccessPath('text-editor', '/System/Settings', 'read')
    ).toBe(false);
  });

  it('should check service permissions', () => {
    expect(permissions.canUseService('text-editor', 'clipboard')).toBe(true);
    expect(permissions.canUseService('text-editor', 'network')).toBe(false);
  });
});
```