# 08 - 开发路线图

## 里程碑总览

```
P0 ──▶ P1 ──▶ P2 ──▶ P3 ──▶ P4 ──▶ P5 ──▶ P6
收缩   基础   窗口   应用   Finder  完善  重构
目标   内核   系统   框架   MVP    体验  优化
```

---

## P0：收缩目标，明确边界

**目标**：定义清晰的项目范围，防止需求蔓延

### 交付物

- [ ]  [README.md](http://README.md) 包含项目定位说明
- [ ]  「这个项目不是什么」清单
- [ ]  技术选型决策记录

### 验收标准

- 团队（或自己）对项目边界有共识
- 不会在开发中途追加「多用户」「云同步」等需求

---

## P1：Platform + Kernel 雏形

**目标**：搭建最底层基础设施

### 交付物

- [ ]  `platform/storage` 封装 IndexedDB
- [ ]  `platform/timer` 封装定时器
- [ ]  `platform/system` 能力检测
- [ ]  `kernel/vfs` 基础虚拟文件系统
    - `mkdir`, `writeFile`, `readFile`, `readdir`, `stat`
    - 初始目录结构
- [ ]  `kernel/task-manager` 极简任务管理
    - `spawn`, `kill`, `getTask`
- [ ]  `kernel/event-bus` 发布订阅

### 测试覆盖

```tsx
describe('P1 验收', () => {
  it('VFS: 创建目录并写入文件', async () => {
    await vfs.mkdir('/test');
    await vfs.writeFile('/test/hello.txt', 'Hello');
    const content = await vfs.readTextFile('/test/hello.txt');
    expect(content).toBe('Hello');
  });
  
  it('VFS: 刷新后文件仍存在', async () => {
    await vfs.writeFile('/persist.txt', 'data');
    await reopenDatabase();  // 模拟刷新
    const exists = await vfs.exists('/persist.txt');
    expect(exists).toBe(true);
  });
});
```

---

## P2：WindowManager + Desktop MVP

**目标**：实现基本的桌面和窗口系统

### 交付物

- [ ]  `ui/desktop` 桌面组件
    - 壁纸渲染
    - 基础图标显示
- [ ]  `ui/window-manager` 窗口管理
    - 创建/关闭窗口
    - 拖拽移动
    - Z 序管理（DOM 顺序）
- [ ]  `ui/window` 窗口组件
    - 标题栏
    - 关闭按钮
    - 拖拽 handle

### 测试覆盖

```tsx
describe('P2 验收', () => {
  it('能打开一个窗口', () => {
    const win = windowManager.openWindow({ title: 'Test', ... });
    expect(document.getElementById([win.id](http://win.id))).toBeInTheDocument();
  });
  
  it('拖拽窗口', () => {
    const win = windowManager.openWindow({ ... });
    dragWindow([win.id](http://win.id), { dx: 50, dy: 30 });
    const bounds = windowManager.getWindow([win.id](http://win.id)).bounds;
    expect(bounds.x).toBeGreaterThan(0);
  });
  
  it('点击窗口使其置顶', () => {
    const win1 = windowManager.openWindow({ ... });
    const win2 = windowManager.openWindow({ ... });
    windowManager.focusWindow([win1.id](http://win1.id));
    expect(windowManager.getFocusedWindow().id).toBe([win1.id](http://win1.id));
  });
});
```

---

## P3：App Framework + TextEdit

**目标**：建立应用开发模型，实现第一个真正的应用

### 交付物

- [ ]  `app/manifest` 清单解析
- [ ]  `app/context` 应用上下文（资源托管）
- [ ]  `app/runtime` 应用运行时
    - `launchApp`, `terminateApp`
- [ ]  **TextEdit 应用**
    - 打开窗口
    - 文本输入
    - 保存到 VFS

### 端到端验收

```
1. 启动系统
2. 从 Dock 点击启动 TextEdit
3. 输入 "Hello, Mac OS 7!"
4. Cmd+S 保存到 /Users/default/Documents/test.txt
5. 关闭 TextEdit
6. 刷新页面
7. 用 VFS API 读取文件，验证内容正确
```

---

## P4：Finder MVP

**目标**：实现文件管理器

### 交付物

- [ ]  **Finder 应用**
    - 目录树/面包屑导航
    - 文件列表显示
    - 双击文件夹进入
    - 双击 `.txt` 文件用 TextEdit 打开
    - 新建文件夹
    - 删除文件/文件夹
    - 重命名

### 端到端验收

```
1. 启动 Finder
2. 导航到 /Users/default/Documents
3. 看到之前保存的 test.txt
4. 双击 test.txt
5. TextEdit 打开并显示内容
```

---

## P5：MenuBar、Dock、Settings

**目标**：完善桌面体验

### 交付物

- [ ]  `ui/menu-bar` 全局菜单栏
    - Apple 菜单
    - 应用菜单联动
- [ ]  `ui/dock` 应用启动器
    - 显示已安装应用
    - 显示运行状态
- [ ]  **Settings 应用**
    - 更换壁纸
    - 查看存储使用量
- [ ]  **About 应用**
    - 显示系统版本
    - 显示运行中的任务

---

## P6：重构与权限系统

**目标**：加固架构，为未来扩展做准备

### 交付物

- [ ]  `kernel/permissions` 完整权限检查
- [ ]  Manifest 权限验证
- [ ]  Shadow DOM 样式隔离
- [ ]  Proxy 软沙箱（可选）
- [ ]  代码重构与文档完善

### 技术债清理

- [ ]  统一错误处理
- [ ]  日志系统
- [ ]  性能监控
- [ ]  测试覆盖率 > 80%

---

## 时间估算

| 里程碑 | 预估工时 | 依赖 |
| --- | --- | --- |
| P0 | 0.5 天 | 无 |
| P1 | 3-5 天 | P0 |
| P2 | 2-3 天 | P1 |
| P3 | 3-5 天 | P2 |
| P4 | 3-5 天 | P3 |
| P5 | 2-3 天 | P4 |
| P6 | 3-5 天 | P5 |

**总计**：约 3-4 周（全职投入）

---

## 下一步行动

<aside>
🎯

**立即可做**

1. 初始化项目仓库，配置 TypeScript + Vitest
2. 实现 `platform/storage` 并通过测试
3. 实现 `kernel/vfs` 的 `mkdir` 和 `writeFile`
4. 写第一个端到端测试：创建文件 → 刷新 → 文件存在
</aside>