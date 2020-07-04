import {initState} from "./Observe/index";
import {compiler} from "./Observe/utils";
import Watcher from './Observe/Watcher'


function MyVue(options) {

    // 初始化实例
    this._init(options)

}
// 挂载到实例上的内容：$代表可以读取，_代表不希望读取
// vm.$options
// vm.$el = vm.$options.el
// vm._data = vm.$options.data
// 将data中的数据代理到vue实例上

MyVue.prototype._init = function (options) {
    
    // vm就代表vue实例
    let vm = this;

    // this.$options表示是Vue中的参数,如若我们细心的话我们发现vue框架的可读属性都是$开头的
    vm.$options = options;

    // MVVM原理 重新初始化数据  data
    initState(vm)

    // 初始化渲染页面：vue实例上有了渲染方法$mount。在这里进行了渲染，initState没有进行渲染
    // 但是initState中初始化了监听器watcher和计算属性watcher
    // $mount()，里面定义了渲染函数updateComponent，同时又创建了渲染watcher，将渲染函数updateComponent给了渲染watcher.
    // 而渲染watcher被创建，将立即执行传递过来的渲染函数updateComponent。
    if (vm.$options.el){
        vm.$mount()
    }

}

function query(el) {

    // el就是字符串"#app"或者HTML元素
    console.log(el);

    if (typeof el === 'string'){

        // 选择器选择元素
        return document.querySelector(el)
    }

    // 最终返回的都是HTML元素
    return el
}


MyVue.prototype.$mount = function () {

    let vm = this

    let el = vm.$options.el

    el = vm.$el = query(el) //获取当前节点，拿到HTML元素

    // 定义渲染函数，并不会执行，只是定义
    let updateComponent = () =>{

        console.log("更新和渲染的实现");

        // 创建文档片段对象，将el的所有子节点都放入空白文档片段，清空el
        // 遍历识别子节点中文本节点中的差值内容
        // 获取差值的数据，放入差值所在的地方
        // 再将处理好的子节点返回给el
        vm._update()

    }

    // 生成了一个渲染watcher，传递渲染函数，并执行渲染函数
    new Watcher(vm,updateComponent)

}


// 拿到数据更新视图
MyVue.prototype._update = function () {

    let vm = this

    let el = vm.$el

    //接下来把el所有元素，差值部分替换为数据

    // 创建文档片段对象
    // createdocumentfragment()方法创建了一虚拟的节点对象，节点对象包含所有属性和方法。
    let node = document.createDocumentFragment()

    let firstChild

    while (firstChild = el.firstChild){

        //appendChild() 方法可向节点的  子节点列表   的末尾添加新的子节点。
        // 如果文档树中已经存在了 newchild，它将从文档树中删除，然后重新插入它的新位置。你可以使用 appendChild() 方法移除元素到另外一个元素
        // 如果 newchild 是 DocumentFragment 节点，则不会直接插入它，而是把它的子节点按序插入当前节点的 childNodes[] 数组的末尾。
        // el最后就没有子节点了，是个内容为空的元素
        // vue源码中实际上是对ast进行了缓存，这里自己实现的没有用ast，没有缓存
        node.appendChild(firstChild)

    }

    // 文本替换
    compiler(node,vm)

    el.appendChild(node) //替换完再放进去
}

// 定义了$watch方法
MyVue.prototype.$watch = function (key,handler) {

    let vm = this

    // handler是watch中的函数，key是函数名
    new Watcher(vm,key,handler,{user:true})

}

export default MyVue

