抽空在掘金上看了很多篇关于 React 原理的文章，外星人的《React 进阶》还是不如自己实现一个简易版本的 React 收获来的多。本项目是作者的一次源码探索经历，分析 React 一些主要流程，希望这些实践也能帮助到你

## 一步一个脚印实现 React

### JSX 转换揭秘

这里可以参考我的这篇文章：https://juejin.cn/post/7137525368855986212
做个简单的总结：
16 版本
- 我们书写的 JSX 都会被 Babel 进行转换
- 通过不断的调用 React.createElement 将 JSX 转化为一个 **利于操作的** 对象
- 在这个对象的基础上我们可以实现例如 fiber 架构，diff 算法达到性能优化的目的。最后再把其内容插入到浏览器当中去。本质上还是调用 `appendChild`
17 版本
- React 17 中不再依赖于 Babel-loader,React 从 `react/jsx-runtime` 中导入 `_jsx`对象，在大包的过程中自动将 import 语句插入到 JS 文件中。
这样有两个好处：
- 无需引入整个 React 文件减小包的体积
- 采用 React 去开发一套 npm 包的时候也不需要将 React 设置为 package.json 中的 dependency 依赖，以免使用这个包的用户在工程中安装了两个不同版本的 React

### 首次加载

无论是创建一个普通的 JSX 对象还是通过函数/类组件返回，都需要通过 ReactDOM.render 方法进行挂载。

```JS
// react-dom.js
function render(element, container) {
  createRoot(element, container);
}
// fiber.js
let nextUnitOfWork = null; // 当前执行单元
let workInProgressRoot = null; // 当前工作的 fiber 树
let currentRoot = null; // 上一次渲染的 fiber 树

// 创建 rootFiber 作为首个 nextUnitOfWork
export function createRoot(element, container) {
  workInProgressRoot = {
    stateNode: container, // 记录对应的真实 dom 节点
    element: {
      // 挂载 element
      props: { children: [element] },
    },
    alternate: currentRoot,
  };
  nextUnitOfWork = workInProgressRoot;
}

```

在 render 函数中只调用了 createRoot 函数，而这个函数就是将当前 fiberRoot 指向了一个元素，这样就能达到更新的效果。

#### 1.1 为什么当 nextUnitOfWork 指针不为空的时候 React 就知道发生了更新呢 ？

我们看看 workLoop 这个函数

```js
// 处理循环和中断逻辑
function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    // 循环执行工作单元任务
    performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }
  if (!nextUnitOfWork && workInProgressRoot) {
    // 表示进入 commit 阶段
    commitRoot(workInProgressRoot)
    currentRoot = workInProgressRoot
    workInProgressRoot = null
    deletions = []
  }
  requestIdleCallback(workLoop)
}
requestIdleCallback(workLoop)
```

requestIdleCallback 在浏览器每一帧还有空闲时间的时候进行调用，抛开 workLoop 其内部的实现，从你导入 ReactDom 的那一刻，浏览器就会不断的执行 workLoop。那当 nextUnitOfWork 指针不为空的时候，自然就进入到了处理机制当中。

#### 思考一下 为什么 react fiber 能实现中断呢 ？

想想哪个数据结构能达到如此效果。链表 ！
比如我们现在有三个更新

- a -> 1（fiber1）
- b -> 2（fiber2）
- c -> 3（fiber3）
  执行 fiber1 的时候消耗的时间过长，导致当前时间片没有剩余时间了，那我们就把当前指针指向到 fiber2 节点。等待下一个 workLoop
  都更新完毕之后，将指针指向空即可
