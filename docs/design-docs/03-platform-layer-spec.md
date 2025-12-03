# 03 - Platform Layer 规范

## 模块概述

Platform Layer 是整个系统的最底层，负责封装浏览器原生 API，为上层提供稳定、可测试、可替换的接口。

---

## platform/storage

### 职责

封装 IndexedDB，提供简洁的异步存储接口。

### 接口定义

```tsx
interface StorageAdapter {
  // 数据库管理
  open(dbName: string, version: number, upgrade: UpgradeFn): Promise<Database>;
  close(db: Database): void;
  delete(dbName: string): Promise<void>;
}

interface Database {
  // 基础 CRUD
  get<T>(store: string, key: IDBValidKey): Promise<T | undefined>;
  put<T>(store: string, key: IDBValidKey, value: T): Promise<void>;
  delete(store: string, key: IDBValidKey): Promise<void>;
  clear(store: string): Promise<void>;
  
  // 批量操作
  getAll<T>(store: string): Promise<T[]>;
  getAllKeys(store: string): Promise<IDBValidKey[]>;
  
  // 事务
  transaction<T>(
    stores: string[],
    mode: 'readonly' | 'readwrite',
    fn: (tx: Transaction) => Promise<T>
  ): Promise<T>;
}

type UpgradeFn = (db: IDBDatabase, oldVersion: number, newVersion: number) => void;
```

### 测试用例

```tsx
describe('platform/storage', () => {
  it('should open a new database', async () => {
    const db = await [storage.open](http://storage.open)('test', 1, (db) => {
      db.createObjectStore('items');
    });
    expect(db).toBeDefined();
  });

  it('should put and get a value', async () => {
    await db.put('items', 'key1', { name: 'test' });
    const result = await db.get('items', 'key1');
    expect(result).toEqual({ name: 'test' });
  });

  it('should delete a value', async () => {
    await db.put('items', 'key1', { name: 'test' });
    await db.delete('items', 'key1');
    const result = await db.get('items', 'key1');
    expect(result).toBeUndefined();
  });
});
```

---

## platform/timer

### 职责

封装定时器 API，支持统一管理和清理。

### 接口定义

```tsx
interface TimerManager {
  setTimeout(callback: () => void, ms: number): TimerId;
  setInterval(callback: () => void, ms: number): TimerId;
  clearTimeout(id: TimerId): void;
  clearInterval(id: TimerId): void;
  
  // 帧调度
  requestAnimationFrame(callback: FrameRequestCallback): TimerId;
  cancelAnimationFrame(id: TimerId): void;
  
  // 空闲调度
  requestIdleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions): TimerId;
  cancelIdleCallback(id: TimerId): void;
  
  // 批量清理（用于 App 销毁）
  clearAll(): void;
}

type TimerId = number;
```

### 测试用例

```tsx
describe('platform/timer', () => {
  it('should execute setTimeout callback', async () => {
    const spy = vi.fn();
    timer.setTimeout(spy, 10);
    await sleep(20);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should cancel timeout', async () => {
    const spy = vi.fn();
    const id = timer.setTimeout(spy, 10);
    timer.clearTimeout(id);
    await sleep(20);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should clearAll timers', async () => {
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    timer.setTimeout(spy1, 10);
    timer.setInterval(spy2, 10);
    timer.clearAll();
    await sleep(30);
    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
  });
});
```

---

## platform/system

### 职责

检测浏览器能力，提供系统级信息。

### 接口定义

```tsx
interface SystemInfo {
  // 能力检测
  supportsIndexedDB: boolean;
  supportsOPFS: boolean;
  supportsWebWorker: boolean;
  supportsShadowDOM: boolean;
  
  // 存储配额
  getStorageEstimate(): Promise<StorageEstimate>;
  
  // 用户代理
  userAgent: string;
  platform: string;
  
  // 视口
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
}

interface StorageEstimate {
  quota: number;  // 总配额（字节）
  usage: number;  // 已使用（字节）
}
```

### 测试用例

```tsx
describe('platform/system', () => {
  it('should detect IndexedDB support', () => {
    expect(system.supportsIndexedDB).toBe(true);
  });

  it('should return storage estimate', async () => {
    const estimate = await system.getStorageEstimate();
    expect(estimate.quota).toBeGreaterThan(0);
    expect(estimate.usage).toBeGreaterThanOrEqual(0);
  });

  it('should return viewport dimensions', () => {
    expect(system.viewportWidth).toBeGreaterThan(0);
    expect(system.viewportHeight).toBeGreaterThan(0);
  });
});
```