// 获得差值及其内容的正则
const defaultRGE = /\{\{((?:.|\r?\n)+?)\}\}/g

export const util = {

    // 获取差值中数据的具体值。首先要把"name.age"这种字符串用.分隔开，成为一个数组
    getValue(vm,exp){

        // 得到了一个数组
        let keys = exp.split('.')

        // 初始值设置为vm，即vue实例，因为这些属性在_init初始化时都挂载到了实例上
        return keys.reduce((memo,current)=>{

            memo = memo[current]

            // 将拿到的值作为返回值，进行下一次循环
            return memo

        }, vm )

    },
    compilerText(node,vm){

        if(!node.expr){

            node.expr = node.textContent
        }

        // node.textContent是带差值的文本。replace中匹配到的内容会作为参数传入replace的第二个处理函数
        // replace中匹配到的每一项内容都是个数组，["{{name.msg}}", "name.msg" , 0, ....],第二项是我们需要的
        node.textContent = node.expr.replace(defaultRGE, function (...arg) {
            // console.log(arg);
            // 对第二项获取具体的数据
            return util.getValue(vm,arg[1])
        })
    }

}

export function compiler(node,vm) {

    //  取出子节点
    let childNodes = node.childNodes

    // childNodes[] 是子节点列表数组，Array.from(childNodes)将类数组转化为数组
    childNodes = Array.from(childNodes)

    childNodes.forEach(child =>{

        // nodeType为1代表是HTML元素节点
        if (child.nodeType === 1 ){

            // 递归
            compiler(child,vm)
        
        // nodeType为3代表是文本节点
        }else if (child.nodeType ===3) {

            util.compilerText(child,vm)

        }
    })
}
