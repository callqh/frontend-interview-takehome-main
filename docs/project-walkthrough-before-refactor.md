# 项目功能脉络导览

## 1. 全局应用结构

### 页面用途

这是一个 Pages Router 结构的 Next.js 应用，模拟一个简化 PMS（物业管理系统）后台。用户从左侧 Sidebar 在两个页面之间切换：

- `/`：预订日历页，展示房间和预订占用情况。
- `/messages`：消息工单页，展示客人支持工单和选中工单详情。

### 组件调用链

```text
pages/_app.tsx
└─ AppProvider
   └─ MessagesProvider
      └─ Layout div
         ├─ Sidebar
         └─ main
            └─ 当前页面 Component
```

### 状态放在哪里

- `AppProvider` 提供全局配置 `config`，以及 Booking 网格 hover 状态 `hoveredCell`。
- `MessagesProvider` 提供消息模块状态：`currentHouse`、`activeTicketId`、`unreadCount`。
- 每个页面仍有自己的局部状态，例如 Bookings 页的 `selectedBooking`。

### 关键函数/组件说明

- `App`（`pages/_app.tsx`）：Next.js 全局入口，给所有页面套上 Provider、Sidebar 和主内容区域。
- `Sidebar`：读取当前路由判断导航高亮；读取 `unreadCount` 显示 Messages 未读角标。
- `AppProvider`：创建并提供 Booking 页会用到的应用配置和 hover 状态。
- `useAppContext`：读取 `AppContext`，如果组件不在 Provider 内使用会抛错。
- `MessagesProvider`：监听 URL query，同步 `ticketId` 和 `houseId` 到 Context，同时保存 unread count。
- `useMessagesContext`：读取 `MessagesContext`，如果组件不在 Provider 内使用会抛错。

### 容易混淆的点

- `MessagesProvider` 是全局包裹的，所以即使当前不在 `/messages` 页面，Sidebar 也可以读取 `unreadCount`。
- `AppContext` 在旧代码里同时放配置和 hover 状态。hover 是高频交互状态，放全局后会影响更大范围的渲染。

## 2. Bookings 页面 `/`

### 页面用途

`BookingsPage` 是预订日历入口。它展示 30 个房间在 30 天范围内的预订条，点击预订条会打开右侧详情抽屉。

### 用户可见交互

- 页面首次加载时显示 `Loading...` 或 `Loading bookings...`。
- 加载完成后显示房间/日期网格。
- 横向滚动网格时，表头和行内容根据可见日期范围更新。
- 鼠标移入某个日期单元格时，对应行和单元格出现 hover 背景。
- 点击彩色预订条后，页面出现半透明遮罩和右侧 Booking Detail 抽屉。
- 点击遮罩或抽屉右上角 `×` 关闭详情。

### 数据从哪里来

- 页面用 SWR 请求 `/api/bookings`，拿到 `Booking[]`。
- 房间列表不通过 API 请求，而是直接从 `lib/mockData.ts` 导入 `ROOM_UNITS`。
- 点击某个 booking 后，抽屉再用 SWR 请求 `/api/bookings/{booking.id}` 获取 `BookingDetail`。

### 状态放在哪里

- `BookingsPage`：`selectedBooking` 控制当前是否打开抽屉，以及抽屉展示哪条预订。
- `useVisibleRange`：保存横向滚动位置 `scrollLeft`，计算当前可见日期列范围。
- `AppContext`：保存 `hoveredCell`，记录当前 hover 的 `rowId` 和 `dayIndex`。

### 组件调用链

```text
pages/index.tsx / BookingsPage
├─ useSWR('/api/bookings')
├─ BookingGrid
│  ├─ useVisibleRange
│  ├─ useAppContext
│  └─ RoomRow x 30
└─ BookingDrawer（仅 selectedBooking 存在时渲染）
   └─ useSWR('/api/bookings/{id}')
```

### 关键函数/组件说明

- `fetcher`（`pages/index.tsx`）：SWR 通用 fetch 函数，接收 URL，执行 `fetch(url).then(r => r.json())`。
- `BookingsPage`：负责拉取 booking 列表、保存选中 booking、决定展示 loading、网格或详情抽屉。
- `BookingGrid`：负责日历网格整体结构，包括日期表头、可滚动主体、按房间生成 `RoomRow`。
- `getDayLabels(startDate, totalDays)`：从起始日期开始生成日期表头文本，例如 `4/27`。旧代码中调用时传入的是 `new Date()` 得到的当天日期。
- `useVisibleRange`：根据横向滚动距离计算 `startIndex`、`endIndex` 和 `offsetPx`。旧代码每次 scroll 都更新 `scrollLeft`。
- `RoomRow`：负责单个房间行的渲染，包括日期单元格背景和该房间内可见的 booking 条。
- `getBookingStatus(status)`：把 booking 状态映射成颜色，例如 `confirmed` 是绿色、`pending` 是橙色。
- `visibleBookings useMemo`：在每个 `RoomRow` 内筛选当前可见日期范围内的 bookings，并计算每条 booking 的 `startDay`、`endDay`、颜色。
- `BookingDrawer`：展示已选 booking 的基础信息，并按 booking id 拉取额外详情。
- `Row`：抽屉内部的小型键值行组件，用来展示 Email、Phone、Source、Payment、Requests。

### 容易混淆的点

- `BookingGrid` 里每个房间行都会执行 `bookings.filter(...)`，用来找出属于该房间的预订。
- `RoomRow` 里会先 `filter` 再 `map`，两处都重复计算 `checkIn/checkOut` 相对起始日期的天数偏移。
- 日期表头的起始日期来自 `new Date()`，而 `RoomRow` 内偏移计算使用 `config.dateRangeStart`。两者通常相同，但属于两个来源。
- `totalDays` 被传入 `RoomRow`，但旧代码中没有实际使用。
- `console.log('render', rowId)` 是观察行重渲染的线索，不是普通调试垃圾。

## 3. Messages 页面 `/messages`

### 页面用途

`MessagesPage` 展示客户支持工单列表。点击左侧工单后，URL 更新为选中工单的 `ticketId` 和 `houseId`，右侧显示该工单详情。

### 用户可见交互

- 页面左侧显示工单列表。
- 未读工单的客人名更粗，并显示紫色小圆点。
- 点击工单后：
  - URL 变成 `/messages?ticketId={id}&houseId={houseId}`。
  - 被点击的工单有高亮背景和左侧高亮边框。
  - 右侧展示主题、客人、房源和最后一条消息。
- 如果没有选中工单，右侧显示 `Select a message to view`。
- Sidebar 的 Messages 导航项展示未读数角标。

### 数据从哪里来

- 页面用 SWR 请求 `/api/tickets`，拿到 `Ticket[]`。
- `getServerSideProps` 从服务端读取 URL query 中的 `ticketId`，作为 `initialTicketId` 传给页面。
- `MessagesProvider` 也从 `router.query` 中读取 `ticketId` 和 `houseId`，同步到 Context。

### 状态放在哪里

- `MessagesPage`：通过 SWR 保存 tickets 请求结果。
- `MessagesProvider`：保存 `activeTicketId`、`currentHouse`、`unreadCount`。
- URL query：保存当前选中的 `ticketId` 和 `houseId`。

### 组件调用链

```text
pages/messages/index.tsx / MessagesPage
├─ getServerSideProps -> initialTicketId
├─ useSWR('/api/tickets')
├─ useMessagesContext()
├─ 左侧 ticket list
│  └─ handleTicketClick(ticket)
└─ 右侧 activeTicket detail
```

### 关键函数/组件说明

- `fetcher`（`pages/messages/index.tsx`）：SWR 通用 fetch 函数，负责把 `/api/tickets` 响应转成 JSON。
- `MessagesPage`：负责拉取 tickets、同步 unread count、根据 URL/Context 找到当前 active ticket，并渲染列表和详情。
- `useEffect` 同步 unread count：当 tickets 加载完成后，统计 `ticket.unread === true` 的数量，并写入 `MessagesContext`，供 Sidebar 使用。
- `currentTicketId`：按优先级选择当前工单 id：`router.query.ticketId` 优先，其次 `initialTicketId`，最后 `activeTicketId`。
- `handleTicketClick(ticket)`：点击工单时调用 `router.push('/messages?ticketId=...&houseId=...')`，把选择状态写入 URL。
- `activeTicket`：从 tickets 中查找 `id === currentTicketId` 的工单，右侧详情依赖它渲染。
- `getServerSideProps`：服务端读取 query 中的 `ticketId`，让页面初始渲染时知道 URL 指向哪个工单。
- `MessagesProvider`：监听 `router.query`，把 `ticketId` 写入 `activeTicketId`，把 `houseId` 映射为 `currentHouse`。
- `useMessagesContext`：给页面和 Sidebar 读取/写入消息相关全局状态。

### 容易混淆的点

- 旧代码同时用 URL query、`initialTicketId`、Context 里的 `activeTicketId` 表示当前选中工单，属于多个状态来源。
- `currentHouse` 在 Provider 中会根据 `houseId` 更新，但页面展示实际使用的是 ticket 自带的 `houseName`。
- 未读数不是 API 直接给的汇总值，而是前端从 tickets 列表里统计出来再写入 Context。

## 4. API 路由

### `/api/bookings`

- 文件：`pages/api/bookings/index.ts`
- 输入：无必需 query。
- 输出：`Booking[]`。
- 逻辑：从 `lib/mockData.ts` 读取 `BOOKINGS`，用 `setTimeout(..., 300)` 模拟 300ms 网络延迟后返回 JSON。
- `handler` 职责：处理请求并返回 booking 列表。

### `/api/bookings/[id]`

- 文件：`pages/api/bookings/[id].ts`
- 输入：动态路由参数 `id`。
- 输出：找到时返回 `BookingDetail`，找不到时返回 `{ error: 'Booking not found' }` 和 404。
- 逻辑：从 `BOOKING_DETAILS[id]` 查详情；存在则延迟 300ms 返回。
- `handler` 职责：按 booking id 查询详情，并处理不存在的 id。

### `/api/tickets`

- 文件：`pages/api/tickets/index.ts`
- 输入：无必需 query。
- 输出：`Ticket[]`。
- 逻辑：从 `lib/mockData.ts` 读取 `TICKETS`，用 `setTimeout(..., 200)` 模拟 200ms 网络延迟后返回 JSON。
- `handler` 职责：处理请求并返回工单列表。

### 容易混淆的点

- 旧代码的 API handler 自身不是 `async`，而是在内部用 `setTimeout` 延迟发送响应。
- 这些 API 都是 mock 数据，不连接数据库，也没有真实鉴权。

## 5. Mock 数据和类型

### 类型关系

- `RoomUnit`：房间基础信息，包括房间 id、名称、房型 id、房型名称。
- `Booking`：预订基础信息，包括 booking id、房间、客人、入住/退房日期、状态、金额、备注。
- `BookingDetail`：继承 `Booking`，增加邮箱、电话、来源、特殊需求、支付状态、创建时间。
- `Ticket`：消息工单，包括主题、客人、房源、未读状态、最后消息和更新时间。
- `AppConfig`：Booking 网格配置，包括日期范围、列宽、buffer 和表头背景色。

### 数据来源

- `ROOM_UNITS`：生成 30 个房间，前 10 个是 Deluxe，中间 10 个是 Standard，后 10 个是 Suite。
- `BOOKINGS`：先手写 10 条预订，再批量生成 40 条，总计 50 条。
- `BOOKING_DETAILS`：从 `BOOKINGS` 派生，每条 booking 增加邮箱、电话、渠道、支付状态等详情字段。
- `TICKETS`：手写 6 条支持工单，用于 Messages 页面。

### 工具函数说明

- `dateStr(daysFromNow)`：基于当前日期加减天数，输出 `YYYY-MM-DD` 字符串。Booking 日期和 detail 的 `createdAt` 都依赖它。

### 容易混淆的点

- `BOOKING_DETAILS` 中的 `guestPhone` 和 `source` 使用 `Math.random()` 生成，所以每次服务启动或模块重新加载可能不同。
- booking 日期是相对当前日期动态生成的，不是固定历史日期。
- ticket 的 `updatedAt` 是固定的 ISO 字符串。

## 6. 后续改动对照提示

当前工作区已经在 `da91351` 之后做过优化。对照阅读时可以记住几个方向：

- Booking hover 状态后来从全局 Context 下沉，避免高频 hover 影响整棵应用。
- Booking 列表后来按房间预分组，减少每行重复过滤。
- Messages 当前选中工单后来改成主要以 URL query 为状态来源，减少重复状态。
- Mock API 后来改成 `async/await delay`，让 Next.js 正确等待响应完成。
- 项目后来补了 ESLint 配置，让 lint 命令可重复运行。
