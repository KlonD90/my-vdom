// STEP 1 - DOM VDOM
import {cloneDeep} from 'lodash'
/*
type VNode = {
    type: 'ELEMENT' | 'TEXT' | 'ROOT'
    tagName: ?string
    content: ?string
    children: VNode[]
    parent: VNode | null
    attrs: ?{[string]: string}
    DOMNode: null
    key?: string
}

dictionary = {} // hash table 2000 -> node  hash table
'parent_key'
dictionary.get('parent_key')

'parent_key'

HEAP

-> HEAP
 */

function createVNode({
    type,
    tagName,
    content,
    children,
    attrs,
    key,
    parent = null
}) {
    return {
        type,
        tagName,
        content,
        children,
        attrs,
        DOMNode: null,
        key,
        parent,
    }
}

function createElement(tagName, attrs={}, children, key, parent) {
    const vNode = createVNode({
        type: 'ELEMENT',
        tagName,
        attrs,
        content: null,
        key,
        parent
    })

    vNode.children = children.map(({...params}) => ({...params, parent: vNode}))
    return vNode
}

function createText(text, key, parent) {
    return createVNode({
        type: 'TEXT',
        content: text,
        children: [],
        attrs: null,
        key,
        parent
    })
}
// type HTMLElement = {tagName, attrs, children, key} | string
function createHTML(HTMLNode, position = 0, prefix='') {
    if (typeof HTMLNode === 'string') {
        return createText(HTMLNode, `${prefix}text-${position}`)
    } else {
        const {tagName, attrs, children, key} = HTMLNode
        const refinedKey = key || `${prefix}${tagName}-${position}`
        return createElement(
            tagName,
            attrs,
            children.map((el, index) => createHTML(el, index, `${refinedKey}-`)),
            refinedKey
        )
    }
}

const createDOMNode = vNode => {
    switch(vNode.type) {
        case 'ELEMENT': {
            return document.createElement(vNode.tagName)
        }
        case 'TEXT': {
            return document.createTextNode(vNode.content)
        }
    }
}

const rootVNode = (elementRef, vNode) => {
    const root = {
        type: 'ROOT',
        children: [vNode],
        DOMNode: elementRef,
        parent: {
            DOMNode: elementRef,
            children: [],
            key: 'html'
        },
        key:'root'
    }
    vNode.parent = root
    return root
}

const renderToElement = (elementRef, vNode) => {
    const state = rootVNode(elementRef, vNode)

    const fragment = document.createDocumentFragment()
    // [ [vNode] ]
    const queue = [ state ]
    let cur = 0

    while (cur < queue.length) {
        const el = queue[cur]
        console.log(el)
        if (!el.DOMNode) {
            const domElement = createDOMNode(el)
            const refinedParent = (el.parent && el.parent.DOMNode) || fragment
            refinedParent.appendChild(domElement)
            el.DOMNode = domElement
        }
        for (const child of el.children) {
            queue.push(child)
        }
        cur++
    }

    elementRef.appendChild(fragment)

    state.parent = {DOMNode: elementRef, children: [], key: 'root'}

    return state
}

const updateElement = (previousState, newState) => {
    switch(previousState.type) {
        case 'ELEMENT': {
            const isAttrsEqual =
                JSON.stringify(previousState.attrs) === JSON.stringify(newState.attrs)
            if (!isAttrsEqual) {

            }
            break;
        }
        case 'TEXT': {
            console.log(previousState, newState)
            if (previousState.content !== newState.content) {
                previousState.contet = newState.content
                previousState.DOMNode.textContent = newState.content
            }
            break;
        }
    }
}

const updateHTMLState = (previousState, newState) => {

    // state update text node | element 'hello world' -> 'breaking update'
    // delete element p -> null
    // insert element ul -> 'li'

    console.log('previous', previousState)
    console.log('next', newState)

    const state = cloneDeep(previousState)

    const nextState = rootVNode(null, newState)

    // step 1: check old state to deleted elements

    const newDictionaryKey = {}
    const stateDictionaryKey = {}

    const newStateQueue = [nextState]
    let cur = 0
    while (cur < newStateQueue.length) {
        const el = newStateQueue[cur]
        newDictionaryKey[el.key] = el
        for (const child of el.children) {
            newStateQueue.push(child)
        }
        cur++
    }


    const stateQueue = [state]
    cur = 0
    const toDelete = []
    while (cur < stateQueue.length) {

        const el = stateQueue[cur]
        console.log('state queue loop', cur, el)
        stateDictionaryKey[el.key] = el
        if (!newDictionaryKey[el.key]) {
            toDelete.push(el)
        } else {
            console.log('update element', stateDictionaryKey[el.key], newDictionaryKey[el.key])
            updateElement(stateDictionaryKey[el.key], newDictionaryKey[el.key])
        }
        for (const child of el.children) {
            stateQueue.push(child)
        }
        cur++
    }
    const toAdd = []
    for (const el of newStateQueue) {
        if (!stateDictionaryKey[el.key]) {
            toAdd.push(el)
        }
    }

    console.log('to delete', toDelete)
    console.log('to add', toAdd)

    for (const toDeleteElement of toDelete) {
        toDeleteElement.parent.DOMNode.removeChild(toDeleteElement.DOMNode)
        toDeleteElement.parent.children =
            toDeleteElement.parent.children.filter(el => el !== toDeleteElement)
    }

    for (const toAddElement of toAdd) {
        let refinedParent = toAddElement.parent && stateDictionaryKey[toAddElement.parent.key]
        if (!refinedParent) {
            refinedParent = state.parent
        }

        const addElement = {
            ...toAddElement,
            children: [],
            parent: refinedParent
        }
        const domNode = createDOMNode(addElement)
        addElement.DOMNode = domNode
        addElement.parent.DOMNode.appendChild(domNode)
        addElement.parent.children.push(addElement)
        stateDictionaryKey[addElement.key] = addElement
    }

    console.log('after all', state)



    return state
}

const vTree = createHTML({
    tagName: 'p',
    children: ['Hello World']
})

const dTree = createHTML({
    tagName: 'p',

    children: ['Hello World']
})

const updatedTree = createHTML({
    tagName: 'p',
    children: ['Break Update']
})

const newTree = createHTML({
    tagName: 'ul',
    children: [
        {tagName: 'li', children: ['first item']},
        {tagName: 'li', children: ['second item']}
    ]
})



const renderedState = renderToElement(document.getElementById('root'), vTree)

// console.log(vTree)
// console.log(renderedState)
const updatedRenderedState = updateHTMLState(renderedState, updatedTree)

let savedState = updateHTMLState(updatedRenderedState, newTree)
let isHidden = true
setInterval(() => {
    isHidden = !isHidden
    const vNode = createHTML({
        tagName: 'div',
        children: [
            {
                tagName: 'ul',
                key: '0',
                children: [
                    {tagName: 'li', children: ['first item']},
                    {tagName: 'li', children: [Date.now().toString()]}
                ]
            },
            {
                tagName: 'ul',
                key: '2',
                children: [
                    {tagName: 'li', children: ['second item']},
                    {tagName: 'li', children: [Date.now().toString()]}
                ]
            }
        ].slice(isHidden ? 1: 0)
    })
    savedState = updateHTMLState(savedState, vNode)
}, 1000)