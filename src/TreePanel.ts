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
    protected listenerMap: Map<keyof ElementEventMap, (path:Array<String>, item: any, element: HTMLElement, event: Event)=>void> 
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
    updateTree(path: Array<String>) {
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
    updateNode(path: Array<String>) {
        let nodeElement = this.getNodeElement(path)
        if(nodeElement) {
            this._updateNode(path, nodeElement)
        }
    }

    insertNode(path: Array<String>) {
        if(path.length > 0) {
            let parentPath = path.slice(0, path.length-1)
            if(!this.adapter.isGroup(parentPath, this.adapter.getItem(parentPath))){
                throw `路径错误`
            }
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
        } 
    }

    remove(path: Array<String>) {
        if(path.length > 0) {
            let parentPath = path.slice(0, path.length-1)
            if(!this.adapter.isGroup(parentPath, this.adapter.getItem(parentPath))){
                throw `路径错误`
            }
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
        } else { //root
            let rootElement = this.treeContainer.querySelector(`.${NODE_CLASS}`)
            if(rootElement) {
                this.treeContainer.removeChild(rootElement)
            }
        }
    }

    addNodeEventListener(
        eventType: keyof ElementEventMap, 
        listener: (path:Array<String>, item: any, element: HTMLElement, event: Event)=>void 
        ) {
            this.listenerMap.set(eventType, listener)
    }

    removeNodeEventListener(eventType: keyof ElementEventMap) {
        this.listenerMap.delete(eventType)
    }

    unfold(path: Array<String>) {
        let nodeElement = this.getNodeElement(path)
        if(nodeElement) {
            this._unfold(path, nodeElement)
        }
    }

    fold(path: Array<String>) {
        let nodeElement = this.getNodeElement(path)
        if(nodeElement) {
            this._fold(path, nodeElement)
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
        let item = this.adapter.getItem(path)
        if(this.adapter.isGroup(path, item)) {
            this.unfold(path);
        }
    }

    protected _updateNode(path: Array<String>, nodeElement: HTMLElement) {
        let item = this.adapter.getItem(path)
        let contentElement = this.adapter.getContentElement(path, item);
        if(contentElement instanceof HTMLElement) {
            let contentContainer = nodeElement.querySelector(`.${NODE_ITEM_CONTENT_CONTAINER_CLASS}`);
            if(contentContainer){
                contentContainer.replaceChildren(contentElement)
            }
        }
    }

    protected _updateTree(path: Array<String>, nodeElement: HTMLElement){
        this._updateNode(path, nodeElement)
        let childrenView = nodeElement.querySelector(`.${NODE_CHILDREN_CLASS}`)
        let tmpMap : Map<String, HTMLElement> = new Map()
        if(childrenView) {
            let child: any
            for(child in childrenView.children){
                if(child instanceof HTMLElement && child.classList.contains(NODE_CLASS)) {
                    tmpMap.set(child._treeNodeName, child)
                }
                childrenView.removeChild(child)
            }
            this.adapter.getChildrenName(path).forEach( (childName: String) => {
                let childElement = tmpMap.get(childName)
                if(childElement) {
                    this._updateTree(path.concat([childName]), childElement)
                } else {
                    childElement = this.createNodeElement(path.concat([childName]));
                }
                childrenView!.appendChild(childElement);
            });
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

    protected _unfold(path: Array<String>, nodeElement: HTMLElement) {
        let childrenView = document.createElement("div");
        childrenView.className = NODE_CHILDREN_CLASS;
        nodeElement.appendChild(childrenView);
        this.adapter.getChildrenName(path).forEach( (childName: String) => {
            let childElement = this.createNodeElement(path.concat([childName]));
            childrenView.appendChild(childElement);
        });
        nodeElement._treeIsUnfold = true;
        let iconClasses = nodeElement.querySelector(`.${FOLD_ICON_CLASS}`)!.classList;
        iconClasses.toggle(`${FOLD_ICON_FONT}`, false);
        iconClasses.toggle(`${UNFOLD_ICON_FONT}`, true);
    }

    protected _fold(path: Array<String>, nodeElement: HTMLElement) {
        let childrenView = nodeElement.querySelector(`.${NODE_CHILDREN_CLASS}`);
        if(childrenView){
            nodeElement.removeChild(childrenView);
        }
        nodeElement._treeIsUnfold = false;
        let iconClasses = nodeElement.querySelector(`.${FOLD_ICON_CLASS}`)!.classList;
        iconClasses.toggle(`${UNFOLD_ICON_FONT}`, false);
        iconClasses.toggle(`${FOLD_ICON_FONT}`, true);
    }

    protected createNodeElement(path: Array<String>, item?: any): HTMLElement {
        if(!item){
            item = this.adapter.getItem(path)
        }
        if(this.adapter.isGroup(path, item)) {
            return this.createGroupNodeElement(path, item)
        } else {
            return this.createLeafNodeElement(path, item)
        }
    }

    protected createGroupNodeElement(path: Array<String>, item: any): HTMLElement {
        let element = document.createElement("div");
        if(path.length > 0) {
            element._treeNodeName = path[path.length-1]
        } else {
            element._treeNodeName = ""
        }
        element.className = `${NODE_CLASS} ${GROUP_NODE_CLASS}`;
        element.innerHTML = `
            <div class='${NODE_ITEM_CLASS}'> 
                <div class="${NODE_ITEM_WHOLE_ROW_CLASS}"> </div>
                <i class="${FOLD_ICON_CLASS} ${FOLD_ICON_FONT}" ></i>
                <div class="${NODE_ITEM_CONTENT_CONTAINER_CLASS}">
                </div>
            </div>
        `;
        let contentElement = this.adapter.getContentElement(path, item);
        if(contentElement instanceof HTMLElement) {
            let contentContainer = element.querySelector(`.${NODE_ITEM_CONTENT_CONTAINER_CLASS}`);
            contentContainer?.appendChild(contentElement);
        }
        let itemElement = element.querySelector(`.${NODE_ITEM_CLASS}`);
        if(itemElement) {
            for(let type of this.listenerMap.keys()) {
                itemElement.addEventListener(type, ( (event)=>{
                    let listener = this.listenerMap.get(type);
                    if(typeof listener === "function") {
                        let contentElement = element.querySelector(`.${NODE_ITEM_CONTENT_CONTAINER_CLASS}`)?.lastElementChild
                        if(contentElement) {
                            listener(path, item, contentElement as HTMLElement , event);
                        }
                    }
                }) );
            }
            let foldIcon = itemElement.querySelector(`.${FOLD_ICON_CLASS}`)
            if(foldIcon) {
                (foldIcon as HTMLElement).onclick = ( () => {
                    this._foldOrUnfold(element);
                });
            }

        }
        return element;
    }


    protected createLeafNodeElement(path: Array<String>, item: any): HTMLElement {
        let element = document.createElement("div");
        if(path.length > 0) {
            element._treeNodeName = path[path.length-1]
        } else {
            element._treeNodeName = ""
        }
        element.className = `${NODE_CLASS} ${LEAF_NODE_CLASS}`;
        element.innerHTML = `
            <div class='${NODE_ITEM_CLASS}'> 
                <div class="${NODE_ITEM_WHOLE_ROW_CLASS}"> </div>
                <i class="${FOLD_ICON_HIDDEN_CLASS}  ${PLACEHOLDER_ICON_FONT}"></i>
                <div class="${NODE_ITEM_CONTENT_CONTAINER_CLASS}">
                </div>
            </div>
        `;
        let contentElement = this.adapter.getContentElement(path, item);
        if(contentElement instanceof HTMLElement) {
            let contentContainer = element.querySelector(`.${NODE_ITEM_CONTENT_CONTAINER_CLASS}`);
            contentContainer?.appendChild(contentElement);
        }
        let itemElement = element.querySelector(`.${NODE_ITEM_CLASS}`);
        if(itemElement) {
            for(let type of this.listenerMap.keys()) {
                itemElement.addEventListener(type, ( (event)=>{
                    let listener = this.listenerMap.get(type);
                    if(typeof listener === "function") {
                        let contentElement = element.querySelector(`.${NODE_ITEM_CONTENT_CONTAINER_CLASS}`)?.lastElementChild
                        if(contentElement) {
                            listener(path, item, contentElement as HTMLElement , event);
                        }
                    }
                }) );
            }
        }
        return element;
        
    }

    protected getTreePath(anchor: HTMLElement): Array<String> {
        let path: Array<String> = new Array()
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
        return path
    }

    protected getNodeElement(path: Array<String>): HTMLElement | null  {
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

    abstract getItem(path: Array<String>): any

    abstract getChildrenName(path: Array<String>): Array<String>

    abstract isGroup(path: Array<String>, item: any): boolean

    abstract getContentElement(path: Array<String>, item: any): HTMLElement



    // _setTreePanel(treePanel: TreePanel){
    //     this.treePanel = treePanel
    // }

}




