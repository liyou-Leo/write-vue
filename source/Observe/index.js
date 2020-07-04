import Observe from "./observe";
import Watcher from "./Watcher";
import Dep from "./dep";

export function initState(vm) {

    let opt = vm.$options

    if (opt.data){
        // 初始化数据，进行响应式
        initData(vm);
    }
    if (opt.watch){
        initWathch(vm);
    }
    if (opt.computed){
        initComputed(vm,opt.computed)
    }
}

function createComputedGetter(vm,key) {

    // vm._watcherComputed[key]拿到计算属性watcher，然后赋值watcher
    let watcher = vm._watcherComputed[key]

    // 此时的watcher为计算属性watcher
    return function () {
        if (watcher) {
            if (watcher.dirty){
                
                // 页面取值的时候，dirty如果为true，就会调用get方法计算
                // evalValue中调用了this.get方法，将当前的计算属性watcher入栈
                // 在计算属性的方法读取data各个数据的时候，会将计算属性watcher进行依赖收集，计算属性watcher也会将各个属性dep收集
                // this.get执行完后，当前的计算属性watcher出栈，dep.target又成为了渲染watcher
                watcher.evalValue()
            }

            // watcher.evalValue()执行完后，计算属性watcher出栈，dep.target又成为了渲染watcher
            if (Dep.target){
                // 为计算属性收集渲染watcher
                watcher.depend()
            }
            // watcher.evalValue()执行完后，把计算出的结果挂载到了watcher的value属性上
            return watcher.value
        }
    }
}
function initComputed(vm,computed) {

    // watchers = vm._watcherComputed是个空对象
    let watchers = vm._watcherComputed = Object.create(null)

    for(let key in computed){

        // userDef是个函数
        let userDef = computed[key]

        // watchers = vm._watcherComputed，因此现在里面放的都是一个一个的计算属性watcher,名字就是对应的计算属性名
        watchers[key] = new Watcher(vm,userDef,()=>{},{lazy:true})


        // 当用户取值的时候，我们将计算属性key定义到vm上
        Object.defineProperty(vm,key,{
            // 当渲染watcher执行渲染函数，在HTML中读取计算属性值的时候，就出发了createComputedGetter
            get:createComputedGetter(vm,key)

        })

    }
}

function initWathch(vm) {

    let watch = vm.$options.watch
    // watch中如果要监听多个数据就使用数组

    // 如果是数组就要遍历
    for (let key in watch){

        // handler就是监听器watch中的一个函数
        let handler = watch[key]

        // 为每个方法都创建new watcher
        createWatch(vm,key,handler)

    }
}
function createWatch(vm,key,handler) {

    // $watch里面进行了了new watcher 
    return vm.$watch(key,handler)

}

function initData(vm) {

    // 获取用户传入的data
    let data = vm.$options.data
    // 判断是不是函数，我们知道vue，使用data的时候可以data：{}这种形式，也可以data(){return{}}这种形式
    // 然后把把用户传入的打他数据赋值给vm._data
    data = vm._data = typeof data === 'function' ? data.call(vm) : data || {}

    // data中的数据代理到vue实例上
    for (let key in data) {

        proxy(vm,"_data",key)

    }

    // 将数据变成响应式的
    // 先判断是不是对象,不是对象是普通值的话不做处理
    // 是数组或者对象的话, return new Observe(data)进行进一步的处理
    // new Observe(data)中判断是数组还是对象，数组与对象的处理方式不同
    observe(data)
    // 如果对observe(value)进行接收，当observe(data)的参数data是对象或者数组时，会得到的将是new Observe(data)创建的那个实例
}

// 代理函数,第二个参数为数据所在的实际位置
function proxy(vm,source,key) {

    // 给data中的每一项数据做代理
    Object.defineProperty(vm,key,{

        get(){
            return vm[source][key]
        },
        set(newValue){
            return vm[source][key] = newValue
        }

    })
}

export function observe(data) {

    if (typeof data !== 'object' || data == null){
        return
    }

    // new Observe(data)中给每个对象和数组都添加了__ob__属性
    //  data.__ob__的值是observe实例，这里也是返回了observe实例
    if (data.__ob__){

        return data.__ob__

    }

    return new Observe(data)
}
