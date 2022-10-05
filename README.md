抽空在掘金上看了很多篇关于 React 原理的文章，外星人的《React 进阶》还是不如自己实现一个简易版本的 React 收获来的多。本项目是作者的一次源码探索经历，分析 React 一些主要流程，希望这些实践也能帮助到你

## 揭秘 React

### 一、JSX 转换揭秘

这里可以参考我的这篇文章：https://juejin.cn/post/7137525368855986212
做个简单的总结：
16 版本

- 我们书写的 JSX 都会被 Babel 进行转换
- 通过不断的调用 React.createElement 将 JSX 转化为一个 **利于操作的** 对象
- 在这个对象的基础上我们可以实现例如 fiber 架构，diff 算法达到性能优化的目的。最后再把其内容插入到浏览器当中去。本质上还是调用 `appendChild`

17 版本

- React 17 中不再依赖于 Babel-loader,React 从 `react/jsx-runtime` 中导入 `_jsx`对象，在打包的过程中自动将 import 语句插入到 JS 文件中。
  这样有两个好处：
- 无需引入整个 React 文件减小包的体积
- 采用 React 去开发一套 npm 包的时候也不需要将 React 设置为 package.json 中的 dependency 依赖，以免使用这个包的用户在工程中安装了两个不同版本的 React

### 二、首次加载流程

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

`performUnitOfWork` 函数,主要做的事情有两点。

- 执行当前的工作单元（这是官话），其实就是判断 fiber 对应的类型，生成对应的节点
  - 如果是一个函数组件或者类组件或者基本标签类型的，那都会有嵌套的可能性都会执行 reconcileChildren 函数
  - reconcileChildren 首次执行并没有 diff 比较的作用，就是将创建 fiber 对应每一个标签，同时通过 return sibling child 将所有的节点连接起来（一开始只是一颗小树）
- 返回下一个节点，上一步我们成功的构建一颗通过 fiber 连接的小树，然后返回下一个节点。递归的在浏览器空闲时间执行 performUnitOfWork 直到所有的节点都被构建到整个 fiber 数当中
  - 返回的规则：
  1. 如果当前的 fiber 节点有其 child 节点则直接返回
  2. 不满足 1 则判断当前的 fiber 是否有兄弟 sibling 节点，有则直接返回
  3. 不满足 1 2 获取当前的 fiber 节点的父亲节点，父亲节点重复 23 过程，直到返回到根节点，如果返回到根节点，将 nextUnitOfWork 设置为空，performUnitOfWork 停止执行,等待 performUnitOfWork 指针被重新赋值。

最后经过 performUnitOfWork 的不断努力我们构建了一颗非常庞大的 fiber 树，再通过 commitRoot 将其 fiber 映射到我们最终的 dom 上。关于 commit 阶段所做的事情，这里先按下不表。

### 三、更新的过程

上文提到，React 借助 `requestIdleCallback` 在浏览器的每一帧，不断的去轮询执行 workLoop 函数。我们只需要修改 nextUnitOfWork 指针的值就可以让其进入工作状态，重新从根节点生成一个 fiber 树。

对，React 设计者正式借助了这一点来实现的更新，我们来看看 commitRender 函数，这个函数的实现非常简单，复用上一棵 fiber 树的根节点，同时将 nextUnitOfWork 设置为当前的 fiber 树。

```js
export function commitRender() {
  workInProgressRoot = {
    stateNode: currentRoot.stateNode, // 记录对应的真实 dom 节点
    element: currentRoot.element,
    alternate: currentRoot,
  }
  nextUnitOfWork = workInProgressRoot
}
```

### 四、Diff 的过程

上一个过程我们知道，通过 commitRender 我们会重新生成一个 fiber 树，此时如果做到尽可能少去修改 Dom 呢 ？ 答案就是复用
没有发生改变的 fiber 节点对应的标签就无需重新创建。

TODO

### 三、常见问题

#### 3.1 为什么 React function component hook 只能写在顶层，不能写在条件判断里面

我们先来看看 在 mini-react 中的 `updateFunctionComponent`

```js
let currentFunctionFiber = null; // 当前正在执行的函数组件对应 fiber
let hookIndex = 0; //  当前正在执行的函数组件 hook 的下标

....

function updateFunctionComponent(fiber) {
  currentFunctionFiber = fiber;
  currentFunctionFiber.hooks = [];
  hookIndex = 0;
  const { props, type: Fn } = fiber.element;
  const jsx = Fn(props);
  reconcileChildren(fiber, [jsx]);
}

```

首先确定一点，hook 本质上就是一个函数。在执行 `Fn(props)` 的时候函数内部的 hook 也被执行了。这里我们用 `useState` 来举例子。

记住一点，useState 是在函数初始化或者手动调用 stateState 触发的。函数执行在 reconcileChildren 之前，也就是节点尚未更新。

##### 首次渲染：

执行 updateFunctionComponent 确定当前的 currentFunctionFiber 指向当前 fiber（也就是这个函数组件对应的 fiber ），执行 useState 初始化，获取当前的 fiber, 返回 useState 传入的 initial 参数以及 setState 。

##### 调用 hook 手动更新

和类组件一样，函数式组件也是通过 commitRender 函数，从根节点重新执行一遍整个 fiber work ，当调用 setState 的时候并不会马上更新 state 的值，而是将其推入到改 fiber 中的任务队列中。commitRender 会将所有 fiber 树重新遍历一遍，函数式组件也会重新执行 updateFunctionComponent 这个时候 useState 其实是被第二次调用了的，只不过在函数通过 alternate 找到旧的 fiber 使用其值，这也是为什么 useState 初始值只会被使用一次。同时执行当前 oldFiber 身上的任务队列，修改 state 的值。最后重新返回新的 state。

```js
function useState(initial) {
  const currentFunctionFiber = getCurrentFunctionFiber()
  const hookIndex = getHookIndex()
  // 取当前执行的函数组件之前的 hook
  const oldHook = currentFunctionFiber?.alternate?.hooks?.[hookIndex]

  // oldHook存在，取之前的值，否则取现在的值
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [], // 一次函数执行过程中可能调用多次 setState，将其放进队列一并执行
  }

  const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = action(hook.state)
  })

  const setState = action => {
    if (typeof action === 'function') {
      hook.queue.push(action)
    } else {
      hook.queue.push(() => {
        return action
      })
    }
    commitRender()
  }
  currentFunctionFiber.hooks.push(hook)
  return [hook.state, setState]
}
```

### Todo(等待秋招结束咯)
- 加入 schedule 调度流程
- 合成事件
- 将 RequestIdleCallback 替换为 MessageChannel

### Other

#### 思考一下 为什么 react fiber 能实现中断呢 ？

想想哪个数据结构能达到如此效果。链表 ！
比如我们现在有三个更新

- a -> 1（fiber1）
- b -> 2（fiber2）
- c -> 3（fiber3）
  执行 fiber1 的时候消耗的时间过长，导致当前时间片没有剩余时间了，那我们就把当前指针指向到 fiber2 节点。等待下一个 workLoop
  都更新完毕之后，将指针指向空即可
