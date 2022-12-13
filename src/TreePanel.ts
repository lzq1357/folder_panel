const TREE_CONTAINER_CLASS = "TreeContainer";
const NODE_CLASS = `TreeNode`;
const GROUP_NODE_CLASS = `TreeGroupNode`;
const LEAF_NODE_CLASS = `TreeLeafNode`;
const NODE_ITEM_CLASS = `TreeNodeItem`;
const NODE_ITEM_WHOLE_ROW_CLASS = "NodeItemWholeRow";
const NODE_ITEM_CONTENT_CONTAINER_CLASS = `TreeNodeItemContentContainer`;
const NODE_CHILDREN_CLASS = `TreeNodeChildrenContainer`;
const FOLD_ICON_CLASS = `FoldIcon`;
const FOLD_ICON_HIDDEN_CLASS = `HiddenFoldIcon`;

const FOLD_ICON_FONT = `icon-fold`;
const UNFOLD_ICON_FONT = `icon-unfold`;
const PLACEHOLDER_ICON_FONT = `icon-placeholder`;


export class TreePanel{
    protected panelElement: HTMLElement;
    protected treeContainer: HTMLElement;
    protected adapter: TreeAdapter;
    protected listenerMap: Map<keyof HTMLElementEventMap, (path:string[], element: HTMLElement, event: Event)=>void> 
            = new Map()

    constructor(element: HTMLElement) {
        this.panelElement = element;

        this.treeContainer = document.createElement("div")
        this.treeContainer.className = TREE_CONTAINER_CLASS;
        this.panelElement.appendChild(this.treeContainer);
    }

    setAdapter(adapter: TreeAdapter) {
        this.adapter = adapter
        // adapter._setTreePanel(this)
    }

    /**
     * 更新指定节点，及子树
     */
    updateTree(path: string[]) {
        console.log(this) //todo
        console.log(path) //todo
        if(!this.adapter) {
            return
        }
        let nodeElement = this.getNodeElement(path)
        if(nodeElement) {
            this._updateTree(path, nodeElement)
        }
    }

    /**
     * 更新指定节点
     */
    updateNode(path: string[]) {
        let nodeElement = this.getNodeElement(path)
        if(nodeElement) {
            this._updateNode(path, nodeElement)
        }
    }

    insertNode(path: string[]) {
        if(path.length > 0) {
            let parentPath = path.slice(0, path.length-1)
            this.adapter.isGroupP(parentPath).then((isGroup: boolean) => {
                if(isGroup) {
                    let parentNodeElement = this.getNodeElement(parentPath)
                    if(parentNodeElement) {
                        let childrenView = parentNodeElement.querySelector(`.${NODE_CHILDREN_CLASS}`)
                        if(childrenView ) {
                            let childElement = this.getChildNodeElement(parentNodeElement, path[path.length-1])
                            if(childElement) {
                                throw `节点已存在`
                            } else {
                                childElement = this.createNodeElement(path);
                                childrenView.appendChild(childElement)
                            }
                        }
                    } 
                } else {
                    throw `路径错误`
                }
            })
        } 
    }

    remove(path: string[]) {
        if(path.length > 0) {
            let parentPath = path.slice(0, path.length-1)
            this.adapter.isGroupP(parentPath).then((isGroup: boolean) => {
                if(isGroup) {
                    let parentNodeElement = this.getNodeElement(parentPath)
                    if(parentNodeElement) {
                        let childrenView = parentNodeElement.querySelector(`.${NODE_CHILDREN_CLASS}`)
                        if(childrenView ) {
                            let childElement = this.getChildNodeElement(parentNodeElement, path[path.length-1])
                            if(childElement) {
                                childrenView!.removeChild(childElement)
                            } else {
                                throw `节点不存在`
                            }
                        }
                    } 
                } else {
                    throw `路径错误`
                }
            })
        } else { //root
            let rootElement = this.treeContainer.querySelector(`.${NODE_CLASS}`)
            if(rootElement) {
                this.treeContainer.removeChild(rootElement)
            }
        }
    }

    addNodeEventListener(
        eventType: keyof HTMLElementEventMap, 
        listener: (path:string[], element: HTMLElement, event: Event)=>void 
        ) {
            this.listenerMap.set(eventType, listener)
    }

    removeNodeEventListener(eventType: keyof HTMLElementEventMap) {
        this.listenerMap.delete(eventType)
    }

    unfold(path: string[]) {
        let nodeElement = this.getNodeElement(path)
        if(nodeElement) {
            this._unfold(path, nodeElement)
        }
    }

    fold(path: string[]) {
        let nodeElement = this.getNodeElement(path)
        if(nodeElement) {
            this._fold(path, nodeElement)
        }
    }

    toggleFoldState(path: string[]) {
        let nodeElement = this.getNodeElement(path)
        if(nodeElement) {
            this._foldOrUnfold(nodeElement)
        }
    }

    showTree() {
        let rootElement = this.treeContainer.querySelector(`.${NODE_CLASS}`)
        if(rootElement) {
            this.treeContainer.removeChild(rootElement)
        }
        let path = new Array();
        let nodeElement = this.createNodeElement(path);
        this.treeContainer.appendChild(nodeElement);
        this.adapter.isGroupP(path).then((isGroup: boolean) => {
            if(isGroup) {
                this.unfold(path);
            }
        })
    }

    protected _updateNode(path: string[], nodeElement: HTMLElement) {
        this.adapter.getContentElementP(path).then((contentElement: HTMLElement) => {
            if(contentElement instanceof HTMLElement) {
                let contentContainer = nodeElement.querySelector(`.${NODE_ITEM_CONTENT_CONTAINER_CLASS}`);
                if(contentContainer){
                    contentContainer.replaceChildren(contentElement)
                }
            }
        })
    }

    protected _updateTree(path: string[], nodeElement: HTMLElement){
        this._updateNode(path, nodeElement)
        let childrenView = nodeElement.querySelector(`.${NODE_CHILDREN_CLASS}`)
        let tmpMap : Map<string, HTMLElement> = new Map()
        if(childrenView) {
            let child: any
            for(child in childrenView.children){
                if(child instanceof HTMLElement && child.classList.contains(NODE_CLASS)) {
                    tmpMap.set(child._treeNodeName, child)
                }
                childrenView.removeChild(child)
            }
            this.adapter.getChildrenNameP(path).then((childrenName) => {
                childrenName.forEach( (childName: string) => {
                    let childElement = tmpMap.get(childName)
                    if(childElement) {
                        this._updateTree(path.concat([childName]), childElement)
                    } else {
                        childElement = this.createNodeElement(path.concat([childName]));
                    }
                    if(childrenView && childElement) {
                        childrenView.appendChild(childElement);
                    }
                })
            })
        }
    }

    protected _foldOrUnfold(nodeElement: HTMLElement) {
        let path = this.getTreePath(nodeElement)
        if(nodeElement._treeIsUnfold) {
            this._fold(path, nodeElement)
        } else {
            this._unfold(path, nodeElement)
        }
    }

    protected _unfold(path: string[], nodeElement: HTMLElement) {
        let childrenView = document.createElement("div");
        childrenView.className = NODE_CHILDREN_CLASS;
        nodeElement.appendChild(childrenView);
        this.adapter.getChildrenNameP(path).then((childrenName) => {
            childrenName.forEach( (childName: string) => {
                let childElement = this.createNodeElement(path.concat([childName]));
                childrenView.appendChild(childElement);
            });
        })
        nodeElement._treeIsUnfold = true;
        let iconClasses = nodeElement.querySelector(`.${FOLD_ICON_CLASS}`)!.classList;
        iconClasses.toggle(FOLD_ICON_FONT, false);
        iconClasses.toggle(UNFOLD_ICON_FONT, true);
    }

    protected _fold(path: string[], nodeElement: HTMLElement) {
        let childrenView = nodeElement.querySelector(`.${NODE_CHILDREN_CLASS}`);
        if(childrenView){
            nodeElement.removeChild(childrenView);
        }
        nodeElement._treeIsUnfold = false;
        let iconClasses = nodeElement.querySelector(`.${FOLD_ICON_CLASS}`)!.classList;
        iconClasses.toggle(`${UNFOLD_ICON_FONT}`, false);
        iconClasses.toggle(`${FOLD_ICON_FONT}`, true);
    }

    protected createNodeElement(path: string[]): HTMLElement {
        let element = document.createElement("div");
        if(path.length > 0) {
            element._treeNodeName = path[path.length-1]
        } else {
            element._treeNodeName = ""
        }
        element.classList.add(NODE_CLASS);
        this.adapter.isGroupP(path).then((isGroup: boolean) => {
            if(isGroup) {
                element.classList.add(GROUP_NODE_CLASS)
                this.fillGroupNodeElement(element, path)
            } else {
                element.classList.add(LEAF_NODE_CLASS)
                this.fillLeafNodeElement(element, path)
            }
        })
        return element;
    }

    protected fillGroupNodeElement(element: HTMLElement, path: string[]) {
        element.innerHTML = `
            <div class='${NODE_ITEM_CLASS}'> 
                <div class="${NODE_ITEM_WHOLE_ROW_CLASS}"> </div>
                <i class="${FOLD_ICON_CLASS} ${FOLD_ICON_FONT}" ></i>
                <div class="${NODE_ITEM_CONTENT_CONTAINER_CLASS}">
                </div>
            </div>
        `;
        this.adapter.getContentElementP(path).then((contentElement: HTMLElement) => {
            let contentContainer = element.querySelector(`.${NODE_ITEM_CONTENT_CONTAINER_CLASS}`);
            contentContainer?.appendChild(contentElement);
        })
        let itemElement = element.querySelector(`.${NODE_ITEM_CLASS}`);
        if(itemElement) {
            for(let type of this.listenerMap.keys()) {
                itemElement.addEventListener(type, ( (event)=>{
                    let listener = this.listenerMap.get(type);
                    if(typeof listener === "function") {
                        let contentElement = element.querySelector(`.${NODE_ITEM_CONTENT_CONTAINER_CLASS}`)?.lastElementChild
                        if(contentElement instanceof HTMLElement) {
                            listener(path, contentElement, event);
                        }
                    }
                }) );
            }
            let foldIcon = itemElement.querySelector(`.${FOLD_ICON_CLASS}`)
            if(foldIcon instanceof HTMLElement) {
                foldIcon.onclick = ( () => {
                    this._foldOrUnfold(element);
                });
            }
        }
    }

    protected fillLeafNodeElement(element: HTMLElement, path: string[]) {
        element.innerHTML = `
            <div class='${NODE_ITEM_CLASS}'> 
                <div class="${NODE_ITEM_WHOLE_ROW_CLASS}"> </div>
                <i class="${FOLD_ICON_HIDDEN_CLASS}  ${PLACEHOLDER_ICON_FONT}"></i>
                <div class="${NODE_ITEM_CONTENT_CONTAINER_CLASS}">
                </div>
            </div>
        `;
        this.adapter.getContentElementP(path).then((contentElement: HTMLElement) => {
            let contentContainer = element.querySelector(`.${NODE_ITEM_CONTENT_CONTAINER_CLASS}`);
            contentContainer?.appendChild(contentElement);
        })
        let itemElement = element.querySelector(`.${NODE_ITEM_CLASS}`);
        if(itemElement) {
            for(let type of this.listenerMap.keys()) {
                itemElement.addEventListener(type, ( (event)=>{
                    let listener = this.listenerMap.get(type);
                    if(typeof listener === "function") {
                        let contentElement = element.querySelector(`.${NODE_ITEM_CONTENT_CONTAINER_CLASS}`)?.lastElementChild
                        if(contentElement instanceof HTMLElement) {
                            listener(path, contentElement, event);
                        }
                    }
                }) );
            }
        }
    }

    protected getTreePath(anchor: HTMLElement): string[] {
        let path: string[] = new Array()
        let element: any = anchor
        while(element instanceof HTMLElement) {
            if(element.classList.contains(NODE_CLASS)){
                path.unshift(element._treeNodeName)
            }
            if(element.classList.contains(TREE_CONTAINER_CLASS)){
                break;
            }
            element = element.parentElement
        }
        if(path.length >  0) {
            path.shift()    //删除根节点对应元素
        }
        return path
    }

    protected getNodeElement(path: string[]): HTMLElement | null  {
        let element = this.treeContainer.querySelector(`.${NODE_CLASS}`)
        let nodeName:String
        for(nodeName in path) {
            if(element instanceof HTMLElement) {
                element = this.getChildNodeElement(element, nodeName)
            } else {
                break;
            }
        }
        if(element instanceof HTMLElement) {
            return element
        } else {
            return null
        }
    }

    protected getChildNodeElement(parentNodeElement: HTMLElement, name: String): HTMLElement | null {
        let childrenView = parentNodeElement.querySelector(`.${NODE_CHILDREN_CLASS}`)
        if(childrenView){
            let child: any
            for(child in childrenView.children){
                if(child instanceof HTMLElement 
                    && child.classList.contains(NODE_CLASS)
                    && child._treeNodeName == name) {
                    return child
                }
            }
        }
        return null
    }

    protected getParentNodeElement(nodeElement: HTMLElement): HTMLElement | null {
        let element: any = nodeElement
        let curNodeElement: HTMLElement
        while(element instanceof HTMLElement) {
            if(element.classList.contains(NODE_CLASS)){
                curNodeElement = element
                break;
            }
        }
        let parentNodeElement: HTMLElement | null = null
        while(element instanceof HTMLElement) {
            if(element.classList.contains(NODE_CLASS)){
                parentNodeElement = element
                break;
            }
        }
        return parentNodeElement
    }

}


/**
 * 树状图适配器
 * 1. 根节点路径为 空数组
 */
export abstract class TreeAdapter {
    // protected treePanel: TreePanel

    abstract getItemP(path: string[]): Promise<any>

    abstract getChildrenNameP(path: string[]): Promise<string[]>

    abstract isGroupP(path: string[]): Promise<boolean>

    abstract getContentElementP(path: string[]): Promise<HTMLElement>

    // _setTreePanel(treePanel: TreePanel){
    //     this.treePanel = treePanel
    // }

}

export abstract class SyncTreeAdapter extends TreeAdapter{

    getItemP(path: string[]): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve(this.getItem(path))
        })
    }

    getChildrenNameP(path: string[]): Promise<string[]> {
        return new Promise((resolve, reject) => {
            resolve(this.getChildrenName(path))
        })
    }

    isGroupP(path: string[]): Promise<boolean> {
        return new Promise((resolve, reject) => {
            resolve(this.isGroup(path))
        })
    }

    getContentElementP(path: string[]): Promise<HTMLElement> {
        return new Promise((resolve, reject) => {
            resolve(this.getContentElement(path))
        })
    }
    
    abstract getItem(path: string[]): any

    abstract getChildrenName(path: string[]): string[]

    abstract isGroup(path: string[]): boolean

    abstract getContentElement(path: string[]): HTMLElement
}




