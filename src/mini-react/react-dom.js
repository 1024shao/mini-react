function render(element, container) {
  const dom = renderDom(element)
  container.appendChild(dom)
}

function renderDom(element) {
  let dom = null
  // 1.节点为空，直接返回
  if (element === null || element === false) {
    return dom
  }
  // 2.节点为 number 类型
  if (typeof element === 'number') {
    dom = document.createTextNode(String(element))
    return dom
  }
  // 3.节点为 string 类型
  if (typeof element === 'string') {
    dom = document.createTextNode(element)
    return dom
  }
  // 4.节点为 数组 类型 -> 递归渲染
  if (Array.isArray(element)) {
    // 创建空节点
    dom = document.createDocumentFragment()
    for (const child of element) {
      const childDom = renderDom(child)

      if (childDom) {
        dom.appendChild(childDom)
      }
    }
    return dom
  }
  // 节点为一个 标签/组件 类型
  const {
    type,
    props: { children, ...attributes },
  } = element;

  if (typeof type === 'string') {
    dom = document.createElement(type)
  } else if (typeof type === 'function') {
    // 函数组件
    if (type.prototype.isReactComponent) {
      const { props, type: Comp } = element
      const component = new Comp(props)

      const jsx = component.render()

      dom = renderDom(jsx)
    } else {
      const { props, type: Fn } = element

      const jsx = Fn(props)

      dom = renderDom(jsx)
    }
  } else {
    return null
  }
  if (children) {

    const childrenDom = renderDom(children)

    if (childrenDom) {
      dom.appendChild(childrenDom)
    }

  }
  updateAttributes(dom, attributes)
  return dom
}

// 更新节点的属性值
function updateAttributes(dom, attributes) {
  Object.keys(attributes).forEach(key => {
    if (key.startsWith('on')) {
      const eventName = key.substring(2).toLowerCase()
      dom.addEventListener(eventName, attributes[key])
    } else if (key === 'className') {
      const classnames = attributes[key].split(' ')
      for (const classname of classnames) {
        dom.classList.add(classname)
      }
    } else if (key === 'style') {
      Object.keys(attributes[key]).forEach(item => {
        dom.style[item] = attributes[key][item]
      })
    } else {
      dom[key] = attributes[key]
    }
  })
}


const ReactDOM = {
  render
}

export default ReactDOM