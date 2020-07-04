import {pushTarget , popTarget} from "./dep"
import {util} from "./utils";

// id用来去重：依赖收集时去重、渲染函数中nexttick去重
let id = 0

// 渲染染Watcher：一个vue实例只有一个
// exprOrFn就是渲染Watcher中的更新函数、cb没传、opts没传

// 监听Watcher：watch每个监听器都会创建一个
// exprOrFn就是监听Watcher中的方法名字、cb为具体的方法函数、opts为{user:true}
// Watcher中的方法名字其实就是data中的属性名字

// 计算属性Watcher：每个计算出现都会创建一个
// exprOrFn是计算属性Watcher的方法函数，cb没传、opts为{lazy:true}

class Watcher {

    constructor(vm,exprOrFn,cb = ()=>{},opts = {}){

        this.vm = vm
        this.exprOrFn = exprOrFn
        this.cb = cb
        this.id = id++
        this.deps = []
        this.depsId = new Set()

        // opts.lazy表明是计算属性Watcher，初始值为true.表示应该要进行计算
        this.lazy = opts.lazy 
        // this.dirty用来控制是否重新计算
        this.dirty = this.lazy

        // 当是计算属性watcher和渲染watcher时
        if (typeof exprOrFn === 'function'){

            this.getter = exprOrFn

        }else{

            // 当是监听watcher时，重新定义了getter，这里只是定义，没有执行
            this.getter = function () {

                // 获取旧的值
                return util.getValue(vm,exprOrFn)
            }
            
        }

        // 当是监听Watcher和渲染watcher时，执行。渲染watcher进行渲染，监听Watcher获取旧值
        // 计算属性watcher不执行
        this.value = this.lazy? undefined : this.get() //获得老值oldValue
        // this.value就是旧值
    }


    get(){

        // Dep.target = watcher，然后将watcher入栈
        pushTarget(this)
 
        let value = this.getter.call(this.vm)

        // 出栈，然后 Dep.target = stack[stack.length - 1]， Dep.target为出栈后的最顶层
        popTarget()

        return value

    }
    update(){

        // 批量更新， 防止重复渲染
        if (this.lazy){ //来到update这一步，说明数据重新赋值了，因此要把  this.dirty = true，表示计算属性应该重新计算了
            this.dirty = true
        }else{
            queueWacther(this)
        }

    }

    // 第一次渲染时，没有使用run方法，但是以后的更新，最终都是通过run方法实现的
    // run方法才是真正的更新方法
    // update调用queueWacther将watcher加入队列queue，然后再执行nextTick(flushQueue)
    // nextTick中，将flushQueue加入callback执行函数队列，进行异步执行
    // flushQueue执行时又把queue遍历，执行各个watcher的run函数
    // nextTick是暴露给全局的
    run(){

        // 获得新值
        let value = this.get()

        if (this.value !== value){
            this.cb(value,this.value)
        }

    }


    addDep(dep){
        let id = dep.id
        if(this.depsId.has(id)){
            this.depsId.add(id)
            this.deps.push(dep)
        }
        dep.addSub(this)
    }

    // 计算属性watcher会用到的方法，获得计算属性值
    evalValue(){
        this.value = this.get()
        this.dirty = false
    }

    // 计算属性用的，为计算属性中的数据收集渲染watcher
    // 计算属性中的使用过的data数据如果在视图的其他地方没有单独用过的话，其虽然在new vue后设置了get，收集依赖。
    // 但是由于其没有在视图中用过，所以导致执行渲染函数时，并不会读取这个属性，所以没有收集过渲染watcher。
    // 所以这个data数据中的这个属性只收集了computed watcher。
    depend(){
        let i = this.deps.length
        // 为计算属性中用到的每个data数据的dep增加渲染watcher
        // depend()收集的是Dep.target这个依赖，所以这里收集了渲染watcher
        while(i--){
            this.deps[i].depend()
        }
    }

}

let has = {}
let queue = []


function queueWacther(watcher) {

    // 在渲染时、更新时防止同一个watcher重复加入
    // queue中放的就是watcher
    let id = watcher.id
    if(has[id] == null){
        has[id] = true
        queue.push(watcher)
    }
    // 异步更新
    nextTick(flushQueue)
}

function flushQueue() {
    // console.log("执行了flushQueue");
    queue.forEach(watcher=>{
        watcher.run()
    })
    has = []
    queue = []
}


let callbacks = []

function nextTick(flushQueue) {

    callbacks.push(flushQueue)
   

    let aysncFn = () => {
        flushCallbacks();
    }

    // 使用异步的各种方法  执行顺序
    // 微任务:promise mutationObserver  宏任务: setImmediate setTimeout
    if (Promise) {

        Promise.resolve().then(aysncFn)

    }else if (MutationObserver) {

        let observe = new MutationObserver(aysncFn)
        let textNode = document.createTextNode(1)
        observe.observe(textNode, {
            characterData: true
        })
        textNode.textContent = 2
        return
        
    }else if (setImmediate) {

        setImmediate(aysncFn)

    }else {
        setTimeout(aysncFn, 0)
    }
    
}

function flushCallbacks() {
    // console.log("我来执行callbacks");
    // console.log(callbacks);
    callbacks.forEach(cb=>cb())
    callbacks = []
}

export default Watcher
