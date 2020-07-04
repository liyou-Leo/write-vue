import {observe} from "./index";
import {arrayMethods, observerArray,dependArray} from "./array";
import Dep from "./dep";

// vue实例中没递归一次observe函数，就new Observe一次
class Observe {

    constructor(data){ // data就是我们定义的data vm._data实例

        // 将用户的数据使用defineProperty定义

        // 不能将代码 this.dep = new Dep()、Object.defineProperty(data,'__ob__',{ } 放到数组的判断条件里面去做(确定是数组后才执行这两个代码)
        // 因为 let childOb = observe(value)只要value是数组或者对象，childOb就存在
        // 当value为对象时，if (childOb){childOb.dep.depend()；dependArray(value) }就会执行
        // 这时因为this.dep = new Dep()是放在数组判断条件里面去做的(确定是数组后才执行这个代码)，childOb.dep.depend()不存在，所以会报错
        
        // 创建数组专用 的dep, this.dep中的this代表当前的observer实例
        // 因此这里是给当前的observer实例增加了一个dep属性，值是一个new Dep()实例
        this.dep = new Dep()

        // 给我们的对象包括我们的数组添加一个属性__ob__ (读取这个属性的值获得的是当前的observe实例)
        // 所以通过给数组__ob__.dep就相当于observe.dep
        Object.defineProperty(data,'__ob__',{

            // 现在是在class Observe的constructor函数中，因此this指的是observe实例
            get:() => this
        })

        if (Array.isArray(data)){

            // 如果是数组，先修改数组的原型为arrayMethods
            // arrayMethods对象又指向Array.prototype
            data.__proto__ = arrayMethods

            // data是个数组，observerArray中对data中的每一个元素，进行了 observe(data[i])
            // 因此 data这个数组本身的索引不是响应式的，但是它其中的对象是响应式的
            // arr[i]="陈凯"不是响应式，arr[i].name = "陈凯"是响应式
            observerArray(data)

        }else {
            // 第一次传进来的是data, 因此会遍历data，对data中的每个属性添加响应式
            // 如果是对象，则通过walk函数，遍历每一个属性，给每一个属性添加响应式
            this.walk(data)

        }
    }

    walk(data){

        let keys = Object.keys(data)

        for (let i = 0;i< keys.length;i++ ){

            let key  = keys[i]; // 所有的属性key

            let value = data[key] //每个属性的值value

            defineReactive(data,key,value)

        }
    }
}

// defineReactive(data,key,value)的参数问题：
// 数组都做了另外的处理，因此能运行到defineReactive这一个函数的，参数data都是对象，或者是数组中的对象
// value则没有限制，可以是任何类型，基本类型\对象\数组
// 数组本身不会走这一步，不会给数组的索引进行响应式
export function defineReactive(data,key,value) {

    // 观察value是不是对象或者数组，是的话需要把它的所有属性先进行监听。如果是基本类型的话，直接返回不做处理
    // 因此如果是基本类型的话，childOb是undefined
    // 当observe(data)的参数data是对象或者数组时，childOb会得到的将是new Observe(data)创建的那个实例。
    let childOb = observe(value)

    // 接下来是对属性本身进行监听
    // 所以如果值是对象的话，会先对其各个属性进行响应式，其属性监听完了，才会回来，继续对这个属性本身进行响应式

    // 为对象的每个属性创建dep依赖收集器
    let dep = new Dep()


    Object.defineProperty(data,key,{

        get(){
            if (Dep.target){

                dep.depend() //让dep保存watcher，也让watcher保存这个dep
                
                // value的值是数组或者对象的时候，childOb就存在。给value上增加了__ob__属性
                if (childOb){

                    // childOb.dep是在对象本身增删属性或者数组变化的时候被触发的dep。

                    // 对于对象来说，childOb也会导致在这里收集一遍依赖，只不过永远没有派发更新这个操作

                    // 数组收集当前渲染的watcher。当通过vm.arr.push等操作时，可以更新
                    childOb.dep.depend()
                    
                    dependArray(value) //收集儿子的依赖
                }

            }

            return value
        },
        set(newValue){

            if (newValue === value) return

            value = newValue

            // 对赋值的新数据也要进行响应式处理
            observe(value)

            // 当设置属性的时候，实现更新
            dep.notify()

        }
    })
}


export default Observe
