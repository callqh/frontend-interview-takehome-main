## 发现的问题

1. 启动时会触发 `ReferenceError: Cannot access 'getBookingStatus' before initialization`，因为 `const` 函数表达式在初始化前被 `useMemo` 使用。
2. Booking 网格把 hover 状态放在全局 `AppContext`，鼠标经过任意单元格都会更新 Provider value，导致无关组件和所有房间行重渲染。现有 `console.log('render', rowId)` 可以直接观察到这个问题。
3. Booking 网格每次渲染都对每个房间执行 `bookings.filter`，并在每个 Row 内重复解析同一批日期；日期表头还用 `new Date()`，而 Row 使用 `config.dateRangeStart`，存在数据来源不一致。
4. Messages 页面把 URL 中的 `ticketId/houseId` 再同步到全局 Context，形成重复状态源；点击工单会更新全局 Provider，使只关心未读数的 Sidebar 也跟着刷新。
5. `pages/api` 使用 `setTimeout` 后立即返回 handler，Next.js 会警告 API 在发送响应前已 resolved，虽然最后能返回数据，但这不是正确的异步边界。
6. 同一房间、同一状态的重叠预订会画在同一层，颜色一致时看起来像一条预订被错误延长。
7. Booking 网格横向滚动时房间名列会滚走；初步 sticky 后又因表头和行内容不在同一个横向滚动坐标系，导致日期轴与行内容短暂错位。
8. 跨出当前日期范围左侧的预订会从负坐标开始渲染，导致可见条存在但客人姓名被裁掉。
9. 项目缺少 ESLint 配置。
10. Booking 网格横向滚动仍通过 `useVisibleRange` 更新 React state，并把可见范围传给每个 `RoomRow`；滚动时会触发所有行重新渲染和重复 booking 布局计算。
11. Messages 页面点击未读工单后只更新 URL 选中态，未读点和 Sidebar 未读数不会变化，和“打开即已读”的用户预期不一致。

## 应用的修复

1. 将 `getBookingStatus` 放到使用前定义，修复启动错误，并保留类型约束。
2. 将 Booking hover 状态下沉到单个 `RoomRow`，并用 `React.memo` 包住 Row；AppContext 只保留稳定配置，避免 hover 扩散到整棵应用。
3. 在 `BookingGrid` 中用 `useMemo` 按 `roomId` 预分组 bookings，Row 内只计算一次日期偏移并复用 `config.dateRangeStart` 生成表头，减少重复计算并统一日期来源。
4. Messages 选中工单以 URL query 作为唯一状态源；MessagesContext 只保留 Sidebar 需要的 unread count，减少跨页面耦合。
5. 将 mock API handler 改为 `async/await delay`，保留模拟网络延迟，同时让 Next.js 正确等待响应完成。
6. 在 `RoomRow` 中为重叠预订分配 lane，按垂直分层展示，并为冲突条增加轻量描边提示；保留 `checkOut` 作为占用日的现有语义。
7. 将日期表头放入同一个横向滚动容器并用 sticky 固定顶部；房间名列按整行高度 sticky，避免滚动时遮盖不完整和列错位。
8. 为 booking bar 封装可视范围裁剪定位，保留原始日期用于详情和冲突判断，但将渲染 left/width 限制在当前日期网格内。
9. 初始化 `.eslintrc.json`配置文件。
10. 移除横向滚动 state，同步删除 `useVisibleRange`；`RoomRow` 改为一次性计算当前 30 天内的 positioned bookings，横向滚动交给浏览器原生裁剪。
11. 点击未读工单时通过 SWR `mutate` 将当前 tickets 缓存中的该工单标记为已读，原有 unread count effect 会随缓存变化同步 Sidebar 数字。

## 权衡取舍

- 没有引入横向虚拟滚动；当前日期固定为 30 天，直接全量渲染列并用原生横向滚动裁剪，复杂度和错位风险都更低。
- 如果房间数量继续增长，优先考虑纵向虚拟列表或 room 分页；横向仍不需要优先虚拟化。
- Messages 已读状态先用 SWR `mutate` 做本地乐观更新，因为当前题目只有 `/api/tickets` mock 列表接口，没有持久化“标记已读”接口；复用 SWR 缓存可以避免新增状态源，并让列表和 Sidebar 使用同一份数据派生结果。
- 保留 `reactStrictMode` 和 `RoomRow` 的 render 日志；开发环境会出现成对 render log，这是 React 18 Strict Mode 的诊断行为，不代表生产环境重复渲染。

## 如果有更多时间

- 完善bookings页面用户使用体验：增加房间搜索/用户搜索框、底部增加房间分页、详情框增加Esc按键监听关闭等
- 增加测试case，保障关键方法和页面的稳定性
- 如果数据规模扩大到数百/数千房间，需要引入纵向虚拟滚动，并把 bookings 按日期范围/房间范围分页加载；当前实现仍会一次渲染所有房间行，横向滚动也会触发所有行重算。
