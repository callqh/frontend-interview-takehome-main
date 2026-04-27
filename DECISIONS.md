## 发现的问题

### Bookings 页面

1. 启动时，`RoomRow` 在 `getBookingStatus` 初始化前使用它，导致 `ReferenceError`。
2. 同一房间的重叠预订会叠在同一层，颜色一致时看起来像一条预订被错误延长。
3. 跨出当前可见日期范围左侧的预订从负坐标开始渲染，导致 booking bar 可见但客人姓名被裁掉。
4. 横向滚动时房间列会滚走，或日期轴与行内容出现错位。
5. hover 状态原本放在全局 Context，鼠标经过单元格会导致无关组件和所有房间行重渲染。
6. 每行重复 filter bookings，并重复计算日期偏移，数据量变大时会放大渲染成本。
7. 横向滚动原本通过 React state 驱动 `visibleRange`，滚动时会触发大量行重算。
8. booking 定位、重叠判断、lane 分配和裁剪逻辑都放在 `RoomRow.tsx` 中，组件同时承担算法和渲染职责，后续测试和维护不方便。
9. 没有预订的房间行使用 `bookingsByRoomId.get(room.id) ?? []` 作为 fallback，每次 `BookingGrid` 重渲染都会创建新的空数组引用，导致 `React.memo(RoomRow)` 浅比较失效；打开预订详情时即使点击的不是 room-28/29/30，这些空房间行也会重新 render。

### Messages 页面

1. 选中工单同时存在 URL 和 Context 两套状态源，容易造成状态同步和无关刷新问题。
2. 点击未读工单后，未读点和 Sidebar 未读数不会变化，不符合“打开即已读”的用户预期。
3. 首次进入 Bookings 页面时，Sidebar 不显示消息未读数，只有进入 Messages 后才更新。
4. tickets 请求期间左侧列表曾出现空白，用户无法区分加载中和没有消息。
5. 深链刷新或 URL 带无效 `ticketId` 时，右侧详情区状态不准确。

### API 与工程

1. mock API 使用 `setTimeout` 后 handler 立即结束，异步边界不正确。
2. 项目缺少 ESLint 配置，`npm run lint` 会进入交互式初始化。
3. 多处 SWR fetcher 重复定义，且非 2xx 错误处理不一致。
4. Bookings 和 BookingDrawer 请求失败时容易被误判为空数据。
5. 大量样式直接写在 JSX inline `style` 对象里，网格行和单元格 render 时会重复创建样式对象；这不是当前最大性能瓶颈，但会增加维护成本，也不利于复用响应式、hover/focus 和可访问性样式。

## 应用的修复

### Bookings 页面

1. 将 `getBookingStatus` 移到使用前定义，避免 `const` 函数表达式在初始化前被调用，最小改动即可恢复页面可运行。Commit: [da91351](https://github.com/callqh/frontend-interview-takehome-main/commit/da91351)。
2. 将 hover 状态从全局 Context 下沉到单个 `RoomRow`。hover 只影响当前行，不应触发整棵应用和所有房间行更新。Commit: [17dd2a6](https://github.com/callqh/frontend-interview-takehome-main/commit/17dd2a6)。
3. 使用 `React.memo` 包装 `RoomRow`。配合稳定 props，减少父组件更新时无关房间行重渲染。Commit: [17dd2a6](https://github.com/callqh/frontend-interview-takehome-main/commit/17dd2a6)。
4. 在 `BookingGrid` 中按 `roomId` 预分组 bookings。避免每个房间行重复执行 `bookings.filter`。Commit: [17dd2a6](https://github.com/callqh/frontend-interview-takehome-main/commit/17dd2a6)。
5. 统一使用 `config.dateRangeStart` 生成日期表头和行内日期偏移。避免表头和 booking 定位使用不同日期来源导致不一致。Commit: [17dd2a6](https://github.com/callqh/frontend-interview-takehome-main/commit/17dd2a6)。
6. 为同房间重叠 booking 分配 lane，并给重叠条增加轻量描边。避免颜色一致时用户误以为是一条被错误延长的预订。Commit: [a987bd1](https://github.com/callqh/frontend-interview-takehome-main/commit/a987bd1)。
7. 将日期表头和行内容放入同一个横向滚动容器，并 sticky 房间列和表头。保持横向滚动时日期轴和房间行在同一坐标系里。Commit: [0df3643](https://github.com/callqh/frontend-interview-takehome-main/commit/0df3643)。
8. 对跨出可见日期范围的 booking bar 做 `left/width` 裁剪。保证可见区域内能看到客人名。Commit: [4cfb36f](https://github.com/callqh/frontend-interview-takehome-main/commit/4cfb36f)。
9. 删除横向滚动 state 和 `useVisibleRange`，横向滚动交给浏览器原生处理。当前只有 30 天，虚拟化收益低，React state 驱动滚动反而会带来大量重算。Commit: [75f86bb](https://github.com/callqh/frontend-interview-takehome-main/commit/75f86bb)。
10. 抽离一些公共方法和常量到单独文件中方便后续维护。Commit: [ee71b5a](https://github.com/callqh/frontend-interview-takehome-main/commit/ee71b5a)。
11. 为 Bookings 页面和 BookingDrawer 增加请求失败状态。Commit: [ee71b5a](https://github.com/callqh/frontend-interview-takehome-main/commit/ee71b5a)。
12. 将 booking 定位、重叠 lane 分配和可视范围裁剪抽到 `bookingLayout.ts`，`RoomRow` 只保留渲染和 hover 状态。这样可以让布局算法独立测试，也避免继续扩大组件职责。Commit: [3f7498e](https://github.com/callqh/frontend-interview-takehome-main/commit/3f7498e)。
13. 将无预订房间的 fallback 从 inline `[]` 改为模块级稳定常量 `EMPTY_BOOKINGS`。这样父组件打开 drawer 重渲染时，空房间行收到的 `bookings` prop 引用保持不变，`React.memo` 可以正确跳过无关行渲染。Commit: [f9032cd](https://github.com/callqh/frontend-interview-takehome-main/commit/f9032cd)。

### Messages 页面

1. 让选中工单只以 URL query 为状态源，移除 Context 中的选中态同步。URL 本身可刷新、可分享，保留两套状态会增加风险。Commit: [61eb70e](https://github.com/callqh/frontend-interview-takehome-main/commit/61eb70e)。
2. MessagesContext 只保留 Sidebar 需要的 `unreadCount`。缩小全局 Context 内容，避免 Messages 页面内部状态影响无关区域。Commit: [61eb70e](https://github.com/callqh/frontend-interview-takehome-main/commit/61eb70e)。
3. 点击未读工单时使用 SWR `mutate` 将当前缓存中的该工单标记为已读。当前 mock 没有持久化接口，复用 SWR 缓存可以让列表和 Sidebar 从同一数据源派生。Commit: [65ac6e0](https://github.com/callqh/frontend-interview-takehome-main/commit/65ac6e0)。
4. 将 `/api/tickets` 的 SWR 请求上移到 `MessagesProvider`。Sidebar 未读数属于全局导航信息，不应该依赖 Messages 页面是否挂载。Commit: [ff243cf](https://github.com/callqh/frontend-interview-takehome-main/commit/ff243cf)。
5. 为 Messages 左侧列表增加 loading、error、empty 状态。避免请求期间白屏，让用户知道当前是加载中、失败还是没有数据。Commit: [e282658](https://github.com/callqh/frontend-interview-takehome-main/commit/e282658)。
6. 将右侧详情区拆分为选中消息加载中、请求失败、无效 `ticketId` 和未选择消息。深链加载、链接失效和未选择消息是不同状态，不全部使用“Select a message”文案，增加多种语义更明显的文案，提升用户体验。Commit: [6a7c6fb](https://github.com/callqh/frontend-interview-takehome-main/commit/6a7c6fb)。

### API 与工程

1. 将 mock API 的延迟改为 `async/await delay`。让 Next.js 正确等待响应完成避免，API resolved without sending a response for /api/bookings/b38, this may result in stalled requests.的警告。Commit: [907d39d](https://github.com/callqh/frontend-interview-takehome-main/commit/907d39d)。
2. 增加 ESLint 配置。让 `npm run lint` 非交互化，作为提交前验证命令可稳定运行。Commit: [6bf4ab0](https://github.com/callqh/frontend-interview-takehome-main/commit/6bf4ab0)。

## 权衡取舍

- 没有做横向虚拟滚动；当前固定 30 天，全量渲染列的复杂度更低，也更不容易破坏表头/行对齐。若时间维度显著拉长，再考虑横向虚拟化。
- 大量重叠预订目前只做 lane 分层，未做折叠/冲突工作流
- 已读状态只做 SWR 本地乐观更新；当前 mock API 没有“标记已读”接口，所以刷新后仍会回到初始未读数。真实系统应调用 API 持久化，并通过轮询、SSE/WebSocket 或服务端推送同步未读数。
- 保留 `reactStrictMode` 和 `RoomRow` render 日志；开发环境成对 render log 是 React 18 Strict Mode 的诊断行为，不代表生产环境重复渲染。
- `MessagesContext` 中旧的 `HOUSES/House` 映射未直接删除，而是按要求注释保留；当前页面直接从 ticket 读取 `houseName`。
- 暂未系统性迁移 inline style。当前主要瓶颈是状态范围、重复计算和滚动触发重渲染；样式迁移会触及大量 JSX，收益更多在维护性和长期性能稳定性，适合单独处理。
- 暂未引入 Prettier。项目原本没有 format 规范，新增格式化依赖会带来大面积格式化 diff；当前只手动保持本次改动文件和既有代码风格一致。

## 如果有更多时间

- Bookings：增加房间/客人搜索、快速回到今天、房间分页；数据规模到数百/数千房间时优先做纵向虚拟列表或服务端分页。
- BookingDrawer：增加 ESC 关闭、关闭按钮 `aria-label`、详情错误重试。
- Messages：为 ticket row 增加键盘可达性、选中态 ARIA、无效链接恢复操作。
- 工程：为日期裁剪、lane 分配、SWR mutate 已读状态增加测试；统一日期解析，避免 `YYYY-MM-DD` 在时区解析上的潜在 off-by-one。
- 样式：将高频渲染区域的 inline style 迁移到 CSS Module 或提取稳定 style 常量，补齐 hover/focus、响应式和可访问性样式。
- 响应式：当前 Sidebar + booking grid / message list + detail pane 在窄屏会拥挤，需要单独适配。
- 用户视角交互问题清单已整理到 `docs/ux-interaction-review.md`，作为后续 UX、可访问性和产品化优化索引。
