## 发现的问题

1. 启动时最明显的问题：`ReferenceError: Cannot access 'getBookingStatus' before initialization`
<!-- 列出你识别出的每个问题 -->

## 应用的修复

<!-- 对于每个修复：你改变了什么，为什么，以及你选择了什么方法 -->

1. getBookingStatus是const定义的方法，不存在变量提升的问题，所以需要在使用前定义，需要将函数定义移动到visibleBookings函数调用前即可

## 权衡取舍

<!-- 你有意识地没有做什么，为什么？ -->

## 如果有更多时间

<!-- 你会进一步改进或调查什么？ -->
