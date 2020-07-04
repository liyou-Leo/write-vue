// 获取数组原型上的方法
// import {observe} from "../../../02-重写数组方法/source/Observe";
import {observe} from "./index";


let oldArrayPrototypeMethods = Array.prototype
// 复制一份 然后改成新的
export let arrayMethods = Object.create(oldArrayPrototypeMethods)

// 修改的方法
let methods = ['push','shift','unshift','pop','reverse','sort','splice']

methods.forEach(method=>{

    arrayMethods[method] = function (...arg) {

        // 返回值（处理方法）仍然是Array.prototype方法上的返回值（处理方法）
        let res = oldArrayPrototypeMethods[method].apply(this,arg)

        // 但是对数组中新增的数据进行了监听
        console.log("我是{}对象中的push,我在这里实现监听");

        // 实现新增数据的监听
        let inserted

        switch (method) {
            case 'push':
            case 'unshift':
                inserted = arg
                break
            case 'splice':
                inserted = arg.slice(2)
                break
            default:
                break
        }
        // 实现新增属性的监听
        if (inserted){

            observerArray(inserted)

        }
        
        // this表示这个数组，数组和对象都定义了__ob__属性，值为observer实例，observer实例又定义了dep属性，值为Dep实例
        // 当使用这七个方法时，会派发更新。使用上面三个新增数据的方法，还会对新增数据进行响应式处理
        this.__ob__.dep.notify()

        return res
    }

})

// 定义了一个监听函数，仅仅是定义，没有执行
// inserted是个数组，里面放着新增的数据。
// 这样通过数组的arr[i].name = "陈凯"   这种方式赋值，就是响应式的了
// 但数组的索引本事arr[i]="陈凯"不是响应式
export function observerArray(inserted){

    // 循环监听每一个新增的数据
    for(let i =0 ; i < inserted.length ; i++){
        
        // 传入的是数组的每一项元素,而不是数组本身。因此数组本身的索引不是响应式的
        observe(inserted[i])

    }

}

// 递归收集依赖
export function dependArray(value){

    for(let i = 0; i <value.length; i++){

        // currentItem就是数组中的一个个元素
        let currentItem = value[i]

        // currentItem.__ob__存在就进行依赖收集
        currentItem.__ob__ && currentItem.__ob__.dep.depend()

        if (Array.isArray(currentItem)) {

            dependArray(currentItem)

        }
    }
}



