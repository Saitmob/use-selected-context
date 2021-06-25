<!--
 * @Description: 避免使用context导致所有子组件在context更新时都强制re-render的性能问题
 * @Author: qxp
 * @Date: 2021-06-25 11:25:38
 * @LastEditors: qxp
 * @LastEditTime: 2021-06-25 11:43:39
-->

每次`context`更新，所有使用了`context`的子组件都会强制`re-render`，为了避免这种性能问题而编写了此库。  

当`context`更新后，只是某个属性值变化，不依赖该属性的组件依旧会`re-render`，此库可根据依赖项属性来更新对应使用`context`的组件


##### 父组件使用

```jsx
import Context from './context';
import { ShareState } from 'use-selected-context';

export default () => {
    const [value] = useState(new ShareState({a: 0, b: 0}))
    
    // 修改调用 value.setValue()
    const onClick = () => {
        let o = value.getValue()
        let nd = {a: o.a, b: o.b + 1};
        value.setValue(nd);
    }
    
    return (
        <div>
            <Context.Provider value={value}>
                <Child />
                <Child2 />
                <Button onClick={onClick}>b+1</Button>
            </Context.Provider>
        </div>
    )
}

```

##### 子组件调用
```jsx
import context from './context';
import useModel from 'use-selected-context'

export default () => {
    const contextValue = useContext(context)
    // 传入依赖项属性数组，只有 a 变才会 re-render 该组件
    // 不传入依赖项时，其他属性更新，该组件也会刷新
    const [v, setV] = useModel(contextValue, ['a']); 

    return (
        <div>a值为：{v.a}</div>
    )
}
```