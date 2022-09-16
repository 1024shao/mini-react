import { renderDom } from './react-dom'
import { commitRoot } from './commit'
import { reconcileChildren } from './reconciler'

let nextUnitWork = null // 下一个执行单元
let currentRoot = null // 上一次 fiber 树的根节点（注： currentRoot 有”最近的“意思）
let workInProgressRoot = null // 当前 fiber 树


function createRoot(element, container) {
  workInProgressRoot = {
    stateNode: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  }
  nextUnitWork = workInProgressRoot
}

// 执行当前工作单元并设置下一个要执行的工作单元
function performUnitOfWork(workInProgress) {
  if (!workInProgress.stateNode) {
    // 若当前 fiber 没有 stateNode，则根据 fiber 挂载的 element 的属性创建
    workInProgress.stateNode = renderDom(workInProgress.element);
  }
  // if (workInProgress.return && workInProgress.stateNode) {
  //   // 如果 fiber 有父 fiber且有 dom
  //   // 向上寻找能挂载 dom 的节点进行 dom 挂载
  //   let parentFiber = workInProgress.return;
  //   while (!parentFiber.stateNode) {
  //     parentFiber = parentFiber.return;
  //   }
  //   parentFiber.stateNode.appendChild(workInProgress.stateNode);
  // }

  //2. 根据 fiber 构建其 dom，并且把所有 fiber 链接起来
  let children = workInProgress?.element?.props?.children
  let type = workInProgress?.element?.type

  if (children) {
    let elements = Array.isArray(children) ? children : [children]
    elements = elements.flat()

    reconcileChildren(workInProgress, elements)
  }

  // 3. 设置下一个执行单元
  if (workInProgress.child) {
    nextUnitWork = workInProgress.child
  } else {
    let nextFiber = workInProgress
    while (nextFiber) {
      if (nextFiber.sibling) {
        nextUnitWork = nextFiber.sibling
        return
      } else {
        // 没有子节点以及兄弟节点，往上寻找
        nextUnitWork = workInProgress.return
      }
    }
    if (!nextFiber) {
      // 若返回最顶层，表示迭代结束，将 nextUnitOfWork 置空
      nextUnitWork = null;
    }
  }

}


// 在浏览器空闲的时候执行的工作流
function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitWork && !shouldYield) {
    // 从当前 fiber 去构建 dom 同时返回下一需要处理的 fiber
    nextUnitWork = performUnitOfWork(nextUnitWork)
    // 浏览器当前帧 时间小于 1ms 当时候打断后续的 fiber
    shouldYield = deadline.timeRemaining() < 1
  }
  if (!nextUnitWork && workInProgressRoot) {
    commitRoot(workInProgressRoot)
    workInProgressRoot = null
  }
  requestIdleCallback(workLoop)
}


requestIdleCallback(workLoop)


export {
  createRoot
}