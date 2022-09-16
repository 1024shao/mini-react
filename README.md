抽空在掘金上看了很多篇关于 React 原理的文章，外星人的《React 进阶》还是不如自己实现一个简易版本的 React 收获来的多。本项目是作者的一次源码探索经历，分析 React 一些主要流程，希望这些实践也能帮助到你

## 一步一个脚印实现 React

### JSX 转换揭秘

这里可以参考我的这篇文章：https://juejin.cn/post/7137525368855986212
做个简单的总结：

- 我们书写的 JSX 都会被 Babel 进行转换
- 通过不断的调用 React.createElement 将 JSX 转化为一颗 **利于操作的** 对象
- 在这个对象的基础上我们可以实现例如 fiber 架构，diff 算法达到性能优化的目的。最后再把其内容插入到浏览器当中去。本质上还是调用 `appendChild`

### 首次加载

无论是创建一个普通的 JSX 对象还是通过函数/类组件返回，都需要通过 ReactDOM.render 方法进行挂载。

```JS
function render(element, container) {
  createRoot(element, container);
}
```
