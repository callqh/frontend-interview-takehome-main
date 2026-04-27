## 发现的问题

1. 启动时会触发 `ReferenceError: Cannot access 'getBookingStatus' before initialization`，因为 `const` 函数表达式在初始化前被 `useMemo` 使用。
2. Booking 网格把 hover 状态放在全局 `AppContext`，鼠标经过任意单元格都会更新 Provider value，导致无关组件和所有房间行重渲染。现有 `console.log('render', rowId)` 可以直接观察到这个问题。
3. Booking 网格每次渲染都对每个房间执行 `bookings.filter`，并在每个 Row 内重复解析同一批日期；日期表头还用 `new Date()`，而 Row 使用 `config.dateRangeStart`，存在数据来源不一致。
4. Messages 页面把 URL 中的 `ticketId/houseId` 再同步到全局 Context，形成重复状态源；点击工单会更新全局 Provider，使只关心未读数的 Sidebar 也跟着刷新。
5. 项目缺少 ESLint 配置，`npm run lint` 会进入交互式初始化，不适合作为可重复的交付验证命令。

## 应用的修复

1. 将 `getBookingStatus` 放到使用前定义，修复启动错误，并保留类型约束。
2. 将 Booking hover 状态下沉到单个 `RoomRow`，并用 `React.memo` 包住 Row；AppContext 只保留稳定配置，避免 hover 扩散到整棵应用。
3. 在 `BookingGrid` 中用 `useMemo` 按 `roomId` 预分组 bookings，Row 内只计算一次日期偏移并复用 `config.dateRangeStart` 生成表头，减少重复计算并统一日期来源。
4. Messages 选中工单以 URL query 作为唯一状态源；MessagesContext 只保留 Sidebar 需要的 unread count，减少跨页面耦合。
5. 添加最小 `.eslintrc.json`，让 `npm run lint -- --max-warnings=0` 可以非交互式运行。

## 权衡取舍

- 没有引入虚拟列表、状态库或数据请求库，符合题目“不安装额外主要依赖、继续使用 SWR”的限制。
- 保留 `RoomRow` 的 render 日志，因为它是观察重渲染问题和验证修复效果的有用线索。
- 没有重做视觉样式或 API mock；本次聚焦性能边界、状态来源和工程化可验证性。

## 如果有更多时间

- 用 React Profiler 量化 hover/scroll 前后的提交次数和耗时。
- 为 Booking 网格补充真正的横向/纵向窗口化和固定房间列。
- 增加页面级交互测试，覆盖 drawer 打开、消息 URL 刷新恢复和 lint/build CI。
