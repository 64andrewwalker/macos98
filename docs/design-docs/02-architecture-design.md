# 02 - 架构设计文档

## 分层架构总览

```
┌─────────────────────────────────────────────────────────┐
│                      Apps Layer                         │
│         Finder │ TextEdit │ Settings │ About            │
├─────────────────────────────────────────────────────────┤
│                  App Framework Layer                    │
│      App Lifecycle │ Manifest │ App Context │ SDK       │
├─────────────────────────────────────────────────────────┤
│                    UI Shell Layer                       │
│   WindowManager │ Desktop │ MenuBar │ Dock │ Overlay    │
├─────────────────────────────────────────────────────────┤
│                     Kernel Layer                        │
│  TaskManager │ VFS │ EventBus │ Permissions │ Scheduler │
├─────────────────────────────────────────────────────────┤
│                    Platform Layer                       │
│       Storage │ Timer │ System │ DOM Abstraction        │
└─────────────────────────────────────────────────────────┘
```

---

## 层级职责

### Platform Layer（平台抽象层）

**职责**：封装浏览器原生 API，提供稳定、可测试的接口

| 模块 | 封装内容 |
| --- | --- |
| `platform/storage` | IndexedDB / OPFS |
| `platform/timer` | setTimeout, rAF, rIC |
| `platform/system` | 浏览器能力检测 |

### Kernel Layer（内核模拟层）

**职责**：提供操作系统核心抽象

| 模块 | 功能 |
| --- | --- |
| `TaskManager` | 任务生命周期管理 |
| `VFS` | 虚拟文件系统 |
| `EventBus` | 系统事件与 IPC |
| `Permissions` | 能力权限检查 |
| `Scheduler` | 协作式任务调度 |

### UI Shell Layer（用户界面层）

**职责**：桌面环境与窗口管理

| 模块 | 功能 |
| --- | --- |
| `WindowManager` | 窗口创建、Z 序、焦点 |
| `Desktop` | 桌面图标、壁纸、右键菜单 |
| `MenuBar` | 全局菜单栏 |
| `Dock` | 应用启动器 |
| `SystemOverlay` | 模态弹窗、通知的顶层容器 |

### App Framework Layer（应用框架层）

**职责**：统一的应用开发模型

| 模块 | 功能 |
| --- | --- |
| `AppRuntime` | 应用启动/终止 |
| `AppContext` | 依赖注入容器（托管资源） |
| `Manifest` | 应用声明与权限 |

### Apps Layer（应用层）

系统自带应用：

- **Finder** - 文件管理器
- **TextEdit** - 文本编辑器
- **Settings** - 系统设置
- **About** - 系统信息

---

## 关键设计决策

### Decision 1: 协作式多任务

> System 7 使用协作式多任务，我们沿用这一模型。
> 
- 任务必须主动 yield（通过 `await` 或 Generator）
- 不依赖 Web Worker 做真并行（除非必要）
- 代价：一个写得烂的 App 可以卡死整个系统

### Decision 2: App Context 托管资源

> App 不允许直接操作全局 API，必须通过 Context 申请。
> 

```tsx
// ✅ 正确
ctx.setInterval(() => {}, 1000);
ctx.addEventListener('event', handler);

// ❌ 禁止
window.setInterval(...);
window.addEventListener(...);
```

**收益**：App 关闭时，Context 统一回收所有资源，防止内存泄漏。

### Decision 3: Shadow DOM 样式隔离

> 每个窗口的内容区域包裹在 ShadowRoot 中。
> 
- App 的 CSS 不会污染系统 UI
- 系统主题变更不会破坏 App 样式

### Decision 4: DOM 顺序即 Z 序

> 激活的窗口移动到 DOM 末尾，而非调整 z-index。
> 
- 浏览器天然规则：后渲染的元素在上层
- 避免 z-index 数字管理的噩梦

### Decision 5: Portals 处理弹出层

> 菜单、对话框、工具提示渲染到 `<body>` 顶层的 `#system-overlay`。
> 
- 不会被 `overflow: hidden` 裁切
- 不会被其他窗口遮挡