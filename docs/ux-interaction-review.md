# 用户视角交互问题梳理

> 基于当前代码运行态进行操作验证：Bookings、Booking Drawer、Messages 列表、消息深链。目标不是替代 `DECISIONS.md`，而是从真实用户使用路径补充后续可优化项。

## 验证范围

- 入口：Bookings 首页、Messages 页面、消息深链。
- 操作：打开首页、查看未读数、点击 booking 打开详情抽屉、进入 Messages、点击未读消息、访问无效 `ticketId` 深链。
- 说明：执行环境中直接访问 Vercel 域名一度超时，因此实际交互验证使用当前仓库启动的 `http://localhost:3002`。该环境运行的是同一套当前代码。

## 已确认表现

- Bookings 首页能展示 30 天日期轴、30 个房间和 booking 条。
- 跨出当前可见日期左侧的 booking 已能在可见区域显示客人名，例如 Alice Chen。
- 同房间重叠 booking 已分 lane 展示，并通过标题标注 overlapping booking。
- 点击 booking 后右侧抽屉能显示 Guest、Room、Dates、Status、Amount 和 Additional Details。
- Messages 入口能在 Sidebar 展示未读数。
- 点击未读消息后 URL 会更新到 `ticketId/houseId`，且未读数会从 3 变为 2。
- 无效 `ticketId` 深链会显示 `Message not found` 和链接失效说明。

## Bookings 页面问题

### 1. Booking 条是可点击区域，但语义仍是普通 `div`

用户可以鼠标点击，但从 DOM 语义看 booking bar 是 `generic` 节点，不是 button/link。键盘用户无法自然 Tab 到 booking，也缺少 Enter/Space 激活、焦点态和可读的控件角色。

后续方向：将 booking bar 改成 `button` 或增加等价的 role、tabIndex、键盘事件和 focus 样式。优先推荐真实 `button`，因为语义和键盘行为更完整。

### 2. Booking Drawer 缺少完整对话框交互

抽屉打开后能看到详情，但当前更像浮层面板，缺少典型 dialog 行为：关闭按钮只有 `×`，没有明确 `aria-label`；没有确认 ESC 关闭；没有焦点 trap；打开后焦点也没有明显落到抽屉内。

后续方向：补 `role="dialog"`、`aria-modal`、关闭按钮 label、ESC 关闭、打开/关闭后的焦点管理。这个优化对功能影响小，但能明显提升可访问性和真实产品质量。

### 3. 大量房间和日期下缺少查找与定位能力

当前网格只有滚动能力，没有房间搜索、客人搜索、状态过滤、快速回到今天、跳转日期等入口。30 条数据还能接受，但一旦到数百/数千房间，用户会很难定位目标 booking。

后续方向：先做低成本筛选和定位：房间/客人搜索、状态筛选、Today 按钮、日期跳转。再根据数据规模决定纵向虚拟列表或服务端分页。

### 4. 重叠 booking 目前只解决“看得出来”，还没有业务处理能力

当前 lane 分层能避免视觉覆盖，但如果某个房间同一天有很多冲突，行高会继续被撑大，用户也没有“只看冲突”“折叠更多”“处理冲突”的入口。

后续方向：增加冲突汇总和折叠策略，例如同一房间超过 N 条重叠时显示 `+N more`，点击后进入冲突详情；或者提供 conflict filter。

### 5. 横向滚动仍缺少方向感

日期轴和行内容已经在同一滚动坐标系，但用户横向滚动到中后段时，只能依赖表头日期判断当前位置。没有 today marker、当前可见范围提示、月份分隔或滚动定位控件。

后续方向：增加 today marker、月份分隔线、当前范围提示，必要时增加左右快捷滚动按钮。当前不建议做横向虚拟滚动，因为 30 天列数很小。

### 6. 空白区域没有解释

滚动到没有 booking 的房间或日期时，页面只呈现空白网格。对用户来说，不清楚是没有数据、数据加载失败，还是日期范围不对。

后续方向：保留网格是合理的，但可以在筛选/搜索后补 empty state；在大范围空白时增加轻量提示或可回到有 booking 的快捷操作。

### 7. 窄屏和移动端体验风险较高

Bookings 使用 Sidebar + 固定房间列 + 横向日期网格，天然偏桌面。窄屏下用户会同时面对页面级横向空间不足和网格内部横向滚动，操作成本较高。

后续方向：移动端改为按房间或日期的列表视图，不强行复用桌面网格；至少要保证 Sidebar、表头和抽屉不会互相挤压。

## Messages 页面问题

### 1. Ticket 行同样缺少控件语义

消息列表中的 ticket 可以点击，但 DOM 语义是普通 `generic` 区域，不是 button/listbox option/link。用户无法通过键盘自然选择消息，也没有 `aria-selected` 告诉屏幕阅读器当前选中项。

后续方向：将 ticket row 改为 button 或 link。因为点击会改变 URL，语义上也可以使用 link，并用 `aria-current` 或 `aria-selected` 表达选中态。

### 2. 无效深链有提示，但缺少恢复动作

访问 `messages?ticketId=missing&houseId=h1` 时会显示链接无效，这是正确方向。但用户下一步只能自己再点击左侧消息，没有明确的“清除选择”“返回列表”“打开第一条消息”等操作。

后续方向：在 invalid state 中增加恢复按钮，例如“Back to message list”清掉 query，或“Open latest message”。这样对分享链接失效、刷新旧链接的场景更友好。

### 3. 未读状态目前是本地体验，不是持久化状态

点击未读消息后未读数会立即下降，体验正确。但刷新页面或重新进入应用后会回到 mock 初始状态，因为没有标记已读 API，也没有轮询/推送。

后续方向：真实系统应提供 mark-as-read API，并让 Sidebar 未读数来自服务端状态；实时性要求高时再引入轮询、SSE 或 WebSocket。当前 take-home 中记录取舍即可。

### 4. 消息列表缺少排序、搜索和优先级信息

列表展示了客人、主题、摘要和房源，但没有明显的更新时间、优先级、状态筛选或搜索。数据少时问题不明显，数据多时用户很难判断先处理哪条。

后续方向：补更新时间、未读/待处理筛选、搜索、按更新时间排序。比复杂架构改造更贴近用户价值。

### 5. 右侧详情更像摘要，不是完整会话

点击 ticket 后右侧只展示主题、客人/房源和最后一条消息。真实消息系统通常需要展示完整 conversation、回复入口、历史记录、附件或内部备注。

后续方向：如果题目范围允许，可以只记录不实现；如果继续完善，先加 conversation mock 数据和只读历史，再考虑回复功能。

### 6. Messages 窄屏布局需要单独设计

Messages 是 Sidebar + ticket list + detail pane 的三栏结构。桌面上可用，窄屏下容易拥挤，尤其是详情区和列表同时展示时。

后续方向：移动端采用列表/详情二级页面：默认显示 ticket list，点击后进入 detail，提供返回列表按钮。

## 全局与工程体验问题

### 1. 交互控件的 hover/focus 样式体系不完整

当前大量样式写在 inline style 中，视觉上能跑，但不利于统一 hover、focus、selected、disabled、responsive 等状态。后续继续加交互时会更难维护。

后续方向：先把高频交互组件迁移到 CSS Module 或稳定 style 常量，再补完整 focus-visible 样式。

### 2. 错误态有了基础提示，但缺少 retry

Bookings 和 Drawer 已有 error state，Messages 也有 loading/error/empty。但用户看到错误后缺少直接 retry 操作。

后续方向：在 SWR error state 中提供 retry 按钮，调用 `mutate()` 重新请求。

### 3. Mock 数据随机字段会影响用户感知一致性

Booking detail 中电话、来源等字段如果由 mock 随机生成，同一个 booking 多次打开可能出现不同信息。这对真实用户会像数据不稳定。

后续方向：mock 数据保持 deterministic；即使是模拟，也尽量让同一个 id 返回稳定详情。

## 建议优先级

1. 高优先级：Booking bar 和 ticket row 的键盘可达性；Drawer dialog 语义和关闭体验；无效消息深链恢复动作。
2. 中优先级：Bookings 搜索/跳转；Messages 搜索/排序；错误 retry；today marker。
3. 低优先级：移动端专用布局；大量重叠 booking 的折叠/冲突工作流；完整消息会话模型。
