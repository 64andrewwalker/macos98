# 复杂单页应用（SPA）开发规范

在浏览器里做不了「真正的」macOS / System 7 操作系统，你能做的是：

> 一个运行在浏览器里的「伪桌面 OS」，本质还是单页前端应用。
> 

这没问题，但你要按「受限平台」来设计，而不是照搬操作系统教科书。否则一定失控。

## 1. 把一个桌面 OS 拆开看，它有哪些核心组件？

用 System 7 / macOS 的抽象来类比就行：

1. **内核 / 任务系统**
    - 进程 / 任务管理（System 7 是协作式多任务）
    - 内存管理
    - 中断 / 定时器
2. **文件系统**
    - 目录树（卷、文件夹、文件）
    - 文件元数据（创建时间、修改时间、类型、大小、权限）
    - 打开/关闭/读写文件 API
3. **图形子系统 + 窗口系统**
    - 屏幕 / 桌面
    - 窗口（位置、大小、Z 顺序、焦点）
    - 菜单栏、Dock、图标、对话框
    - 绘图 API（QuickDraw 之类）
4. **事件系统 / IPC**
    - 键盘 / 鼠标事件分发
    - 系统事件（关机、睡眠、挂载卷）
    - 应用间消息（System 7 是 AppleEvent）
5. **应用框架**
    - App 生命周期（启动、前台、后台、退出）
    - 标准控件（按钮、列表、输入框）
    - 菜单模型、命令模型
    - 资源管理（图标、菜单、字符串资源）
6. **系统服务**
    - Finder（桌面 + 文件管理）
    - 控制面板（设置）
    - 剪贴板
    - 字体、声音、网络、打印等服务

## 2. 在浏览器里，各部分的「对应物」是什么？

不要想着「移植内核」，你只能在 JS/DOM 之上模拟。

我给你一个对照表，方便你脑子里有框架：

| OS 概念 | 浏览器可做的对应物 |
| --- | --- |
| 进程 / 任务 | JS 对象 +（可选）Web Worker，统一由你的「调度器」管理 |
| 虚拟内存 | 普通 JS 内存，必要时自己做状态快照、序列化 |
| 文件系统 | IndexedDB / OPFS 上自己实现一套虚拟 FS（路径 + 元数据 + 内容指针） |
| 窗口系统 | React/Vue 之类管理的一组 Window 组件 + Z 序、焦点管理 |
| 图形 API | DOM + Canvas/WebGL 封装成统一绘图接口 |
| 事件 / IPC | 全局事件总线（pub/sub）+ 针对 app 的频道 |
| 应用 / Finder | 一套应用运行时 + App manifest + 系统应用（文件管理、设置等） |
| 权限 / 安全 | 你自己定义的「能力」系统（app 声明要访问哪些目录、系统服务），在前端强制执行 |

你所有「系统组件」，最终都只是 JS 模块 + UI 组件，没有真正的隔离和内核权威。要诚实面对这个事实，架构就会设计得更清醒。

## 3. 纯前端 + 全部数据在浏览器：几个你可能在逃避的现实

你说「所有数据都存浏览器」「纯前端」，听起来很干净，但代价不小：

1. **数据随时可能被浏览器清掉**
    - 用户清缓存 / 更换浏览器 / 换设备，全没了。
    - 你得接受「这是个玩具 OS / 实验 OS」，而不是生产级工作环境。
2. **没有多设备同步、没有备份**
    - 除非你以后打脸自己，再加后端或同步服务。
    - 如果你心里其实想要「稍微靠谱一点的 OS」，那现在这个前提就是在给自己挖坑。
3. **存储配额有限且不可控**
    - 浏览器对每个 origin 有大概配额（实现不同）。
    - 做大文件、海量数据时，可能直接失败。

如果你真的铁了心要全在浏览器里，那就接受它的产品定位：

> 离线玩具 / 个人实验系统 / 教学 Demo
> 
> 
> 而不是「能替代真桌面 OS」的东西。
> 

## 4. 推荐的整体组件架构（从下往上）

先给你一个分层图，再展开：

- **Platform 层**：浏览器原生 API 封装
- **Kernel 层**：调度、虚拟文件系统、事件总线、权限系统
- **UI Shell 层**：桌面、窗口管理、菜单栏、Dock、通知
- **App Framework 层**：App 生命周期、状态管理、资源加载
- **Apps 层**：Finder、设置、文本编辑器等具体应用

### 4.1 Platform 层（最底下的一层）

职责：把杂乱的 Web API 封装成一套稳定接口，避免上层直接撸 Web API。

模块可以是：

- `platform/storage`
    - 包一层 IndexedDB / OPFS API，提供：
        - `openDb(name, version)`
        - `getItem(store, key)`
        - `putItem(store, key, value)`
        - `deleteItem(store, key)`
    - 不要上来就设计完美 FS，先做一个简单 key-value 层，方便以后换实现。
- `platform/timer`
    - 封装 `setTimeout`, `requestAnimationFrame`, `requestIdleCallback`
- `platform/system`
    - App 版本、浏览器能力检测（支持不支持 OPFS、Worker 等）

这一层你现在大概率完全没想过，但没有这层，你上面所有系统组件以后都难以维护。

### 4.2 Kernel 层（在 JS 里模拟的「内核」）

重点模块：

1. **任务管理器（TaskManager）**
    - 概念上对应 OS 里的进程/线程，不过只是 JS 对象：
        
        ```tsx
        interface Task {
          id: string;
          appId: string;
          state: 'ready' | 'running' | 'suspended' | 'terminated';
          run: () => Promise<void> | void;
        }
        
        ```
        
    - 你做的是**协作式调度器**：
        - 任务需要自己在合适时机 `yield`（比如用 `await`、`setTimeout` 把大任务拆小块）。
        - 提供 API：`spawn(appId, entryFn)`,`suspend(taskId)`,`resume(taskId)`,`kill(taskId)`。
2. **虚拟文件系统（VFS）**
    - 上层看到的是类 Unix 路径，比如：
        - `/System`
        - `/Applications`
        - `/Users/default/Documents`
    - 设计一个简单的元数据结构：
        
        ```tsx
        interface VfsNode {
          id: string;
          type: 'file' | 'directory';
          name: string;
          parentId: string | null;
          createdAt: number;
          updatedAt: number;
          mimeType?: string;
          size?: number;
          contentId?: string; // 指向内容表
        }
        
        ```
        
    - 底层用 IndexedDB 两张表：
        - `nodes`：存目录树和元数据
        - `contents`：`{ id, blobOrText }`
    - 提供统一 API：
        - `readFile(path): Promise<ArrayBuffer|string>`
        - `writeFile(path, data)`
        - `mkdir(path)`
        - `readdir(path)`
        - `stat(path)`
    - 一开始别做权限、锁、挂载卷，那是后面版本的事。
3. **事件总线 / IPC**
    - 全局的 pub/sub：
        
        ```tsx
        bus.publish('app.opened', { appId, windowId });
        bus.subscribe('fs.changed', callback);
        bus.publish('ipc', { from: appId, to: appId2, payload });
        
        ```
        
    - 所有「系统事件」都是在这上面跑：
        - 窗口前后景变化
        - 文件变更
        - 设置变更
        - 通知
4. **权限系统（Capabilities）——如果你不做，就等着后面打自己脸**
    - 每个 App 配一个 manifest：
        
        ```json
        {
          "id": "text-editor",
          "name": "Text Editor",
          "permissions": {
            "fs": ["/Users/default/Documents"],
            "services": ["clipboard"]
          }
        }
        
        ```
        
    - Kernel 层对每次访问 VFS 或系统服务时检查权限。
    - 现在你可能觉得「都前端，有什么权限可言」，问题是：
        - 将来你要做第三方 App 插件的时候，没有权限边界就搞不清谁能动什么数据。

### 4.3 UI Shell 层（桌面 & 窗口管理）

这块不要写成一堆散组件，建议明确划分几个核心系统：

1. **WindowManager**
    - 负责：
        - 窗口创建 / 关闭
        - Z 顺序管理（bringToFront, sendToBack）
        - 活动窗口 / 活动应用状态
        - 窗口拖拽 / 缩放
    - 对上层暴露一个干净 API：
        
        ```tsx
        openWindow({ appId, initialBounds, component });
        closeWindow(windowId);
        focusWindow(windowId);
        moveWindow(windowId, bounds);
        
        ```
        
2. **Desktop**
    - 显示壁纸 + 桌面图标（其实就是指向 VFS 中某些路径的快捷方式）。
    - 右键菜单 -> 新建文件、刷新、显示信息等。
3. **MenuBar**
    - 左上角系统菜单 + 当前 app 菜单。
    - 与 WindowManager 和 App runtime 关联：
        - 活动 app 变更 -> 菜单项变更
        - 菜单项 -> 派发命令到对应 app 或系统服务。
4. **Dock / App Switcher**
    - 维护「已安装 app」+「正在运行 app」的状态。
    - 点击图标：
        - 若未运行 -> 通过 App runtime 启动
        - 若已运行 -> 切到第一个窗口或弹出窗口列表

UI 建议由一个全局 Store（比如 Zustand/MobX/Redux 类）管理，不要让每个组件自己随便管 global state，否则后期维护灾难。

### 4.4 App Framework 层（应用运行时）

你必须有一个统一的 app 模型，否则后面每加一个 app 都像写新系统。

1. **应用描述（manifest）**
    
    ```json
    {
      "id": "finder",
      "name": "Finder",
      "icon": "finder.png",
      "entry": "finder.entry",
      "permissions": { "fs": ["/"] }
    }
    
    ```
    
2. **应用生命周期**
    - 类似：
        
        ```tsx
        interface AppInstance {
          id: string;
          manifest: AppManifest;
          onLaunch(ctx): void;
          onActivate(ctx): void; // 变成前台
          onDeactivate(ctx): void; // 转入后台
          onTerminate(ctx): void;
        }
        
        ```
        
    - App runtime 管理：
        - `launchApp(id)`
        - `terminateApp(id)`
        - `getRunningApps()`
3. **UI 集成**
    - App 的 UI 不是直接渲染到 DOM，而是：
        - App 返回一个根组件 / 渲染函数
        - WindowManager 把它挂进窗口里渲染
    - 比如：
        
        ```tsx
        const finderApp: AppDefinition = {
          id: 'finder',
          createWindow(ctx) {
            return {
              title: 'Finder',
              component: <FinderView fs={ctx.fs} />
            };
          }
        };
        
        ```
        

### 4.5 Apps 层（系统应用）

最低限度，你需要这些系统 app 来证明整个「OS」是通的：

1. **Finder**
    - 浏览 VFS
    - 新建 / 删除 / 重命名 / 拖拽文件和文件夹
    - 打开文件 -> 根据文件类型选择应用
2. **TextEdit / 简单记事本**
    - 打开 / 保存文本文件
    - 自动保存到 VFS
    - 打开多个文档 -> 多窗口
3. **Settings**
    - 改主题、壁纸、默认路径等
    - 设置持久化到 VFS 的某个路径（如 `/System/Settings/...`）
4. **About / System Info**
    - 纯展示，用来调试内核运行情况（正在运行的任务、占用的空间等）

## 5. 存储设计：所有数据在浏览器，怎么落地？

不要把「数据都存在浏览器里」只理解为「全丢 localStorage」。

**建议：**

1. **统一走 IndexedDB（或 OPFS）**
    - localStorage 只放很少的引导信息（比如当前 DB 版本）。
    - 真正的文件、设置、应用数据全走 IndexedDB。
2. **划分几类数据**
    - 「文件系统」本身（VFS meta + contents）
    - OS 级设置（主题、壁纸、已安装应用列表）
    - App 级数据（比如编辑器的最近文档列表）
3. **持久化策略**
    - 内存里维护一份 VFS 和系统状态。
    - 关键变更（创建/删除/重命名/写文件）时：
        - 立即写入 IndexedDB（保证不丢）
    - 非关键 UI 状态（窗口位置、Dock 排序）：
        - 节流后写，避免频繁 IO。
4. **版本 & 迁移**
    - 给你的虚拟 OS 一个版本号，例如 `osVersion = 1`。
    - 每次结构变化，要有简单迁移逻辑，否则用户数据直接废掉。

## 6. 一个务实的优先级计划（你应该先做什么）

别又开十个分支，最后一个都做不完。我按「打通最小链路」的顺序给你排：

### P0：收缩目标，写明「不做什么」

- 明确这不是：
    - 多用户系统
    - 安全隔离严肃的 OS
    - 适合长期生产工作的数据存储方案
- 先写在 README 或设计文档里给自己看，防止你后面乱加需求。

### P1：Platform + Kernel 雏形

- 写好 `platform/storage` 封装 IndexedDB。
- 实现一个极简 VFS：
    - 固定根目录 `/`, `/Users/default`, `/Applications`
    - `mkdir`, `writeFile`, `readFile`, `readdir` 跑通
- 写一个极小 TaskManager：
    - 能创建 / 终止任务，记录状态即可。

### P2：WindowManager + Desktop MVP

- 只做：
    - 桌面背景
    - 能打开一个「测试窗口」：
        - 标题栏可拖动
        - 支持关闭
- WindowManager 有基本 API，状态集中管理。

### P3：App Framework 最小版 + Text Editor

- 定义 manifest 和 `launchApp`。
- 写一个系统 app：Text Editor
    - 从菜单或 Dock 启动
    - 打开一个窗口
    - 输入文字
    - 点击保存 -> 调用 VFS `writeFile` 保存到 `/Users/default/Documents/xxx.txt`
- 页面刷新后仍能：
    - 通过 Finder（下一步）或简单列表看到之前的文件，并再次打开。

### P4：Finder MVP

- 实现最基础功能：
    - 左边树 / 面包屑显示目录
    - 右边列表 / 图标显示文件
    - 双击文本文件 -> 使用 Text Editor 打开
- 都跑在 VFS 上，保证路径和操作一致。

### P5：Settings、菜单栏、Dock 优化

- 做一个 Settings app，改：
    - 壁纸
    - 默认打开路径
- MenuBar 与当前 app 联动，Dock 显示运行状态。

### P6：重构 & 权限系统

- 这时候你已经有不少 app 和系统服务了，再不加权限就会一团乱。
- 把 manifest 权限检查补上。
- 清理事件总线、Storage 封装，避免各 app 乱碰底层。

---

如果你真的要做这个项目，下一步不是继续想「还能仿什么 macOS 细节」，而是：

> 把上面每一层写进一个简单的架构文档，然后按 P1–P3 做出一个最小可运行的「启动 -> 打开编辑器 -> 保存文件 -> 刷新页面 -> 重新打开」流程。
> 

等你把第一条链路打通，我可以帮你拆更细：比如具体的模块目录结构、TypeScript 接口设计、甚至某些核心模块的代码骨架。