# 07 - 测试策略

## TDD 开发流程

<aside>
🔄

**Red → Green → Refactor**

1. **Red**：先写失败的测试，定义期望行为
2. **Green**：写最少的代码让测试通过
3. **Refactor**：重构代码，保持测试通过
</aside>

---

## 测试分层

```
┌───────────────────────────────────────────┐
│           E2E Tests (少量)                 │
│     验证完整用户流程，如「启动 → 编辑 → 保存」   │
├───────────────────────────────────────────┤
│         Integration Tests (适量)           │
│     验证模块间协作，如「VFS + TaskManager」    │
├───────────────────────────────────────────┤
│           Unit Tests (大量)                │
│     验证单个函数/类的行为，快速且隔离          │
└───────────────────────────────────────────┘
```

| 层级 | 覆盖目标 | 运行速度 | 数量 |
| --- | --- | --- | --- |
| **Unit** | 函数、类、模块 | 毫秒级 | 多 |
| **Integration** | 模块协作、状态流转 | 秒级 | 中 |
| **E2E** | 用户场景 | 10秒+ | 少 |

---

## 各层测试要点

### Platform Layer

| 模块 | 测试重点 |
| --- | --- |
| `storage` | CRUD 操作、事务、错误处理 |
| `timer` | 回调执行、取消、批量清理 |
| `system` | 能力检测返回值 |

**Mock 策略**：使用 `fake-indexeddb` 替代真实 IndexedDB

```tsx
import 'fake-indexeddb/auto';

describe('storage', () => {
  // 测试代码会使用内存中的 IndexedDB 实现
});
```

### Kernel Layer

| 模块 | 测试重点 |
| --- | --- |
| `TaskManager` | 状态转换、事件触发、并发任务 |
| `VFS` | 路径解析、CRUD、watch 事件、错误码 |
| `EventBus` | 发布订阅、取消订阅、Channel 隔离 |
| `Permissions` | 路径匹配、权限拒绝 |

**关键测试用例：VFS**

```tsx
describe('VFS', () => {
  describe('路径解析', () => {
    it('should normalize paths with trailing slashes');
    it('should resolve relative paths');
    it('should reject paths with ..');
  });
  
  describe('目录操作', () => {
    it('should create nested directories with mkdir -p');
    it('should list directory contents');
    it('should fail to delete non-empty directory');
  });
  
  describe('文件操作', () => {
    it('should write and read text files');
    it('should write and read binary files');
    it('should update file metadata on write');
    it('should throw ENOENT for non-existent file');
  });
  
  describe('监听', () => {
    it('should emit create event on new file');
    it('should emit update event on file change');
    it('should emit delete event on file removal');
    it('should emit rename event');
  });
});
```

### UI Shell Layer

| 模块 | 测试重点 |
| --- | --- |
| `WindowManager` | 窗口增删、焦点切换、Z 序 |
| `Desktop` | 图标交互、选择状态 |
| `MenuBar` | 菜单渲染、命令派发 |

**组件测试示例**

```tsx
import { render, fireEvent } from '@testing-library/react';

describe('Window', () => {
  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn();
    const { getByRole } = render(
      <Window title="Test" onClose={onClose} />
    );
    [fireEvent.click](http://fireEvent.click)(getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });
  
  it('should be draggable by title bar', () => {
    const onMove = vi.fn();
    const { getByTestId } = render(
      <Window title="Test" onMove={onMove} />
    );
    const titleBar = getByTestId('title-bar');
    fireEvent.mouseDown(titleBar, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 150, clientY: 120 });
    fireEvent.mouseUp(document);
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({
      x: expect.any(Number),
      y: expect.any(Number)
    }));
  });
});
```

### App Framework Layer

| 模块 | 测试重点 |
| --- | --- |
| `AppContext` | 资源托管、dispose 清理 |
| `AppRuntime` | 启动流程、文件关联 |

**关键测试用例：资源回收**

```tsx
describe('AppContext', () => {
  it('should clear all timers on dispose', () => {
    const ctx = createAppContext('test-app');
    const spy = vi.fn();
    ctx.setTimeout(spy, 100);
    ctx.setInterval(spy, 50);
    ctx.dispose();
    vi.advanceTimersByTime(200);
    expect(spy).not.toHaveBeenCalled();
  });
  
  it('should remove all event listeners on dispose', () => {
    const ctx = createAppContext('test-app');
    const spy = vi.fn();
    ctx.addEventListener('test-event', spy);
    ctx.dispose();
    eventBus.publish('test-event', {});
    expect(spy).not.toHaveBeenCalled();
  });
});
```

---

## E2E 测试场景

### 场景 1：基本启动流程

```tsx
describe('E2E: 系统启动', () => {
  it('should boot and show desktop', async () => {
    await bootSystem();
    expect(screen.getByTestId('desktop')).toBeVisible();
    expect(screen.getByTestId('menu-bar')).toBeVisible();
    expect(screen.getByTestId('dock')).toBeVisible();
  });
});
```

### 场景 2：创建并保存文件

```tsx
describe('E2E: 文件操作', () => {
  it('should create, edit and save a text file', async () => {
    // 1. 启动 TextEdit
    await launchApp('text-editor');
    
    // 2. 输入内容
    const editor = await screen.findByRole('textbox');
    await userEvent.type(editor, 'Hello, World!');
    
    // 3. 保存文件
    await userEvent.keyboard('{Meta>}s{/Meta}');
    const saveDialog = await screen.findByRole('dialog');
    await userEvent.type(saveDialog.querySelector('input'), 'test.txt');
    await [userEvent.click](http://userEvent.click)(screen.getByText('Save'));
    
    // 4. 验证文件存在
    const content = await vfs.readTextFile('/Users/default/Documents/test.txt');
    expect(content).toBe('Hello, World!');
  });
});
```

### 场景 3：刷新后数据持久化

```tsx
describe('E2E: 持久化', () => {
  it('should persist files after page refresh', async () => {
    // 1. 创建文件
    await vfs.writeFile('/Users/default/Documents/persist.txt', 'Persist me');
    
    // 2. 模拟页面刷新
    await simulatePageReload();
    
    // 3. 验证文件仍然存在
    const exists = await vfs.exists('/Users/default/Documents/persist.txt');
    expect(exists).toBe(true);
    const content = await vfs.readTextFile('/Users/default/Documents/persist.txt');
    expect(content).toBe('Persist me');
  });
});
```

---

## 测试工具配置

### Vitest 配置

```tsx
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/node_modules/**', '**/test/**']
    }
  }
});
```

### 测试 Setup

```tsx
// test/setup.ts
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
});
```