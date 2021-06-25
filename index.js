/*
 * @Description: 根据依赖，选择性更新组件，主要用于 context更新后，所有被注入的子组件都强制re-render的性能问题
 * @Author: qxp
 * @Date: 2021-06-23 16:03:51
 * @LastEditors: qxp
 * @LastEditTime: 2021-06-25 17:19:13
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import isEqual from 'lodash.isequal';

// example
// const Context = React.createContext(new ShareState({}));

/**
 * 子组件使用 useModel 来读取context 数据
 * @param {ShareState} context 
 * @param {Array<String>} deps 
 * @returns 
 */
export default function useModel(context, deps = []) {
    const [state, setState] = useState(context.getValue());
    const stateRef = useRef(state);
    stateRef.current = state;
    
    const listener = useCallback((curr, pre) => {
        // 如果存在依赖，则只判断依赖部分
        let [current, previous] = getDepsData(curr, pre);

        if (isChange(current, previous)) {
            setState(current);
        }

    }, []);

    // 如果state在组件添加 listener 之前就被其他组件修改了，那么需要调用 此处以更新 state值
    // 比如 A 组件 在useEffect 中修改了 state，B组件和A为兄弟组件，但B组件后渲染，两者都使用 useModel 获取 state，此时两者都拿到最初的state
    // 然后 A 组件 的 listener 被添加，先执行了 useListener 中的添加操作，之后执行A组件中useEffect修改state的操作
    // 此时 state 被修改，但是 B 组件之前已经拿到了state，是旧的值，所以需要更新
    const onListen = useCallback(() => {
        let [current, previous] = getDepsData(context.getValue(), stateRef.current);
        if (isChange(current, previous)) {
            listener(current, previous);
        }
    }, [context, listener]);

    useListener(context, listener, onListen);

    // 根据依赖项获取前后值
    const getDepsData = useCallback((current, previous) => {
        if (deps.length) {
            let currentTmp = {};
            let previousTmp = {};

            deps.map(k => {
                currentTmp[k] = current[k];
                previousTmp[k] = previous[k];
            });

            current = currentTmp;
            previous = previousTmp;
        }

        return [current, previous];
    }, []);

    // 对比变化
    const isChange = useCallback((current, previous) => {
        if (current instanceof Object) {
            return !isEqual(current, previous);
        }

        return false;
    }, []);
    
    const setContextValue = useCallback((v) => {
        context.setValue(v);
    }, [context]);

    return [context.getValue(), setContextValue];
}

class Listenable {
    constructor(state) {
        this._listeners = [];
        this.value = state;
    }

    getValue() {
        return this.value;
    }

    setValue(value) {
        const previous = this.value;
        this.value = value;
        this.notifyListeners(this.value, previous);
    }

    addListener(listener) {
        this._listeners.push(listener);
    }

    removeListener(listener) {
        const index = this._listeners.indexOf(listener);
        if (index > -1) {
            this._listeners.splice(index, 1);
        }
    }

    hasListener() {
        return this._listeners.length > 0;
    }

    notifyListeners(current, previous) {
        if (!this.hasListener()) {
            return;
        }
        for (const listener of this._listeners) {
            listener(current, previous);
        }
    }
}

function useListener(listenable, listener, onListen) {
    useEffect(() => {
        listenable.addListener(listener);
        // 立即执行 获取最新值
        if (onListen) {
            onListen();
        }
        return () => {
            listenable.removeListener(listener);
        };
    }, [listenable, listener, onListen]);
}   

export class ShareState extends Listenable {}