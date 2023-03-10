import './FolderPanel.css'
import { TreePanel, TreeAdapter } from "../TreePanel/TreePanel";
import {Dialog} from "../Dialog/Dialog"

const FILE_ITEM_CONTENT_CLASS = "FileItemContentView";
const FILE_ITEM_ICON_CLASS = "FileItemIcon";

const FILE_CONTEXT_MENU_CLASS = "FileContextMenu";
const FILE_CONTEXT_MENU_ITEM_CLASS = "FileContextMenuItem";
const FILE_CONTEXT_MENU_ITEM_ICON_CLASS = "FileContextMenuItemIcon";

const DRAG_CONTAINER_CLASS = "DragContainer";
const DRAG_ICON_CLASS = "DragIcon";


export class FolderPanel {
    
    private panelElement: HTMLElement
    private treePanel: TreePanel
    private adapter: FileTreeAdapter
    private rootHandle: FileSystemHandle | null = null
    private onOpenFile: ((handle: FileSystemFileHandle)=>void) | null = null
    // private onOpenFolder: null,
    private onRootChanged:((oldRoot: FileSystemHandle | null, newRoot: FileSystemHandle| null)=>void) | null = null

    constructor(panel: string | HTMLElement = 'FolderPanel'){
        if(panel instanceof HTMLElement) {
            this.panelElement = panel
        } else {
            this.panelElement = document.getElementById(panel)!!    //throw
        }
        this.treePanel = new TreePanel(this.panelElement)
        this.adapter = new FileTreeAdapter()
        this.treePanel.setAdapter(this.adapter)

        this.initNodeEventListener()
        this.initContextMenu()
        this.initDragListener()

    }

    private initNodeEventListener() {
        this.treePanel.addNodeEventListener("dblclick", (path:string[], element: HTMLElement, event: Event) => {
            console.log("demo listener")  //todo
            this.adapter.isGroupP(path).then((isGroup) => {
                console.log(isGroup) //todo
                if(isGroup) {
                    this.treePanel.toggleFoldState(path)
                } else {
                    if(this.onOpenFile) {
                        this.adapter.getItemP(path).then((handle)=> {
                            if(handle instanceof FileSystemFileHandle && this.onOpenFile){
                                this.onOpenFile(handle)
                            }
                        })
                    }
                }
            })
        })
    }

    private menuUl: HTMLUListElement
    private groupMenuMap = new Map()
    private fileMenuMap = new Map()
    private initContextMenu() {
        this.menuUl = document.createElement("ul");
        this.menuUl.className = FILE_CONTEXT_MENU_CLASS;
        this.treePanel.addNodeEventListener('contextmenu', ( (path: string[], element: HTMLElement, event:Event) => {
            event.preventDefault();//preventDefault()???????????????????????????????????????????????????
            this.showContextMenu(path, element, event as MouseEvent);
        }));
       
        this.addGroupMenuItem("????????????", "icon-createfile",  async (path: string[], element: HTMLElement)=>{
            this.adapter.getItemP(path).then((handle) => {
                if(!(handle instanceof  FileSystemDirectoryHandle)) {
                    throw "?????????????????????";
                }
                Dialog.prompt("", "????????????",  async (result)=> {
                    let newName = result;
                    if(newName == "") {
                        throw "??????????????????";
                    }
                    try{
                        let existed = await handle.getFileHandle(newName, {create: false});
                        if(existed != null) {
                            alert("???????????????????????????");
                        }
                    } catch(err) {
                        if(err.name == "TypeMismatchError"){
                            alert("???????????????????????????");
                        } else if(err.name != "NotFoundError") {
                            throw err;
                        } 
                    }
                    let subH = await handle.getFileHandle(newName, {create: true});
                    if(subH instanceof FileSystemHandle) {
                        this.treePanel.insertNode(path.concat([newName]))
                        // if(this.onOpenFile != null) {
                        //     this.onOpenFile(subH);
                        // }
                    }
                });
            })
        });
        this.addGroupMenuItem("???????????????", "icon-createfolder", async (path: string[], element: HTMLElement)=>{
            this.adapter.getItemP(path).then((handle) => {
                if(!(handle instanceof  FileSystemDirectoryHandle)) {
                    throw "?????????????????????";
                }
                Dialog.prompt("", "???????????????",  async (result)=> {
                    let dirName = result;
                    if(dirName == "") {
                        throw "??????????????????";
                    }
                    try{
                        let existed = await handle.getFileHandle(dirName, {create: false});
                        if(existed != null) {
                            alert("???????????????????????????");
                        }
                    } catch(err) {
                        if(err.name == "TypeMismatchError"){
                            alert("???????????????????????????");
                        } else if(err.name != "NotFoundError") {
                            throw err;
                        } 
                    }
                    let subH = await handle.getDirectoryHandle(dirName, {create: true});
                    if(subH instanceof FileSystemHandle) {
                        this.treePanel.insertNode(path.concat([dirName]))
                    }
                });
            })
        });
        this.addGroupMenuItem("??????", "icon-refresh", (path: string[], element: HTMLElement)=>{
            this.treePanel.updateTree(path);
        });
        this.addGroupMenuItem("??????", "icon-remove", (path: string[], element: HTMLElement)=>{
            if(path.length == 0) {
                alert("???????????????");
            } else {
                Dialog.confirm(
                    `????????????????????????"${path[path.length-1]}"????????????????????????\r\n????????????????????????`,
                    `??????`,
                     async ()=>{
                        let pPath = path.slice(0, path.length-1)
                        let pHandle = await this.adapter.getItemP(pPath)
                        pHandle.removeEntry(path[path.length-1], {recursive: true}).then( () => {
                            this.treePanel.remove(path);
                        })
                    }
                );
            }
        });
        this.addFileMenuItem("??????", "icon-open", (path: string[], element: HTMLElement)=>{
            this.adapter.getItemP(path).then( (handle) => {
                if(handle instanceof FileSystemFileHandle && this.onOpenFile) {
                    this.onOpenFile(handle)
                }
            })
        });
        this.addFileMenuItem("??????", "icon-remove", (path: string[], element: HTMLElement)=>{
            if(path.length == 0) {
                alert("???????????????");
            } else {
                Dialog.confirm(
                    `?????????????????????"${path[path.length-1]}"??????\r\n????????????????????????`,
                    `??????`,
                     async ()=>{
                        let pPath = path.slice(0, path.length-1)
                        let pHandle = await this.adapter.getItemP(pPath)
                        pHandle.removeEntry(path[path.length-1], {recursive: true}).then( () => {
                            this.treePanel.remove(path);
                        })
                    }
                );
            }
        });
    }
    
    private async showContextMenu(path: string[], element: HTMLElement, event:MouseEvent) {
        let handle = await this.adapter.getItemP(path)
        let menuUl = this.menuUl;
        menuUl.innerHTML = "";
        let itemMap ;
        if(handle.kind === "directory"){
            itemMap = this.groupMenuMap;
        } else {
            itemMap = this.fileMenuMap;
        }
        for (let item of itemMap.values()) {
            let itemView = document.createElement("li");
            itemView.className = FILE_CONTEXT_MENU_ITEM_CLASS;
            itemView.innerHTML = `
                <i class="${FILE_CONTEXT_MENU_ITEM_ICON_CLASS} ${item.icon}"></i>
                ${item.name}
            `;
            itemView.onclick = ( () => { item.listener(path, element) } );
            menuUl.appendChild(itemView);
        }
        let X = event.clientX;
        if(X+menuUl.offsetWidth > document.body.clientWidth - 30) { //-30????????????
            X = X - menuUl.offsetWidth;
        }
        let Y = event.clientY;
        if(Y+menuUl.offsetHeight > document.body.clientHeight - 30){
            Y = Y - menuUl.offsetHeight;
        }
        menuUl.style.left=X+'px';
        menuUl.style.top=Y+'px';
        menuUl.style.display = "block";
        this.panelElement.appendChild(menuUl);
        let clickToHide = ( () => {
            this.hideContextMenu();
            window.removeEventListener("click", clickToHide)
        })
        window.addEventListener("click", clickToHide)
    }
    private addGroupMenuItem(name, icon, listener) {
        this.groupMenuMap.set(name, new MenuItem(name, icon, listener));
    }
    private addFileMenuItem(name, icon, listener) {
        this.fileMenuMap.set(name, new MenuItem(name, icon, listener));
    }
    private hideContextMenu() {
        let menuUl = this.panelElement.querySelector(`.${FILE_CONTEXT_MENU_CLASS}`);
        if(menuUl instanceof HTMLElement) {
            this.panelElement.removeChild(menuUl);
        }
    }

    private initDragListener() {
        this.panelElement.addEventListener('dragenter', (e) => {
            e.preventDefault();
            let dragContainer = this.panelElement.querySelector(`.${DRAG_CONTAINER_CLASS}`);
            if(dragContainer instanceof HTMLElement) {
                return;
            }
            dragContainer = document.createElement("div");
            dragContainer.className = DRAG_CONTAINER_CLASS;
            dragContainer.innerHTML = `<i class="${DRAG_ICON_CLASS} "></i>`;
            dragContainer.addEventListener('dragleave', (e) => {
                e.preventDefault();
                this._hideDragContainer();
            });
            this.panelElement.appendChild(dragContainer);
            let clickToHide = ( () => {
                this._hideDragContainer();
                window.removeEventListener("click", clickToHide)
            })
            window.addEventListener("click", clickToHide)
        });
        this.panelElement.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        this.panelElement.addEventListener('drop', async (e) => {
            e.preventDefault();
            this._hideDragContainer();
            let dataTransfer = e.dataTransfer
            if(dataTransfer) {
                for (const item of dataTransfer.items) {
                    // kind will be 'file' for file/directory entries.
                    if (item.kind == 'file') {
                        const handle = await item.getAsFileSystemHandle();
                        this.setRoot(handle);
                        break;
                    }
                }
            }
        });
    }

    private _hideDragContainer() {
        let dragContainer = this.panelElement.querySelector(`.${DRAG_CONTAINER_CLASS}`);
        if(dragContainer instanceof HTMLElement) {
            this.panelElement.removeChild(dragContainer);
        }
    }

    setRoot(handle: FileSystemHandle) {
        let oldRoot = this.rootHandle
        this.rootHandle = handle
        this.adapter._rootHandle = handle
        this.treePanel.showTree()
        if(this.onRootChanged) {
            this.onRootChanged(oldRoot, handle)
        }
    }

    pickFolder() {
        window.showDirectoryPicker().then((handle) => {
            this.setRoot(handle)
        });
    }

    setOnOpenFileListener(listener: (handle: FileSystemFileHandle)=>void) {
        this.onOpenFile = listener
    }

    setOnRootChangedListener(listener: (oldRoot: FileSystemHandle | null, newRoot: FileSystemHandle| null) => void) {
        this.onRootChanged = listener;
    }

}

class FileTreeAdapter extends TreeAdapter {
    _rootHandle: FileSystemHandle | null = null
    // constructor(rootHandle: FileSystemHandle) {
    //     super()
    //     this.rootHandle = rootHandle
    // }

    async getItemP(path: string[]): Promise<any> {
        let handle: FileSystemHandle | null = this._rootHandle
        for(let i = 0;i<path.length;i++) { 
            try{
                handle = await (handle as FileSystemDirectoryHandle).getDirectoryHandle(path[i])
            } catch(error) {
                if(error.name == "TypeMismatchError" && i==path.length-1){
                    handle = await (handle as FileSystemDirectoryHandle).getFileHandle(path[i])
                } else {
                    handle = null
                }
            }
        }
        return handle
    }

    async getChildrenNameP(path: string[]): Promise<string[]> {
        let dirNames = new Array<string>();
        let fileNames = new Array<string>();
        let groupHandle = (await this.getItemP(path)) as FileSystemDirectoryHandle
        for await (const childHandle of groupHandle.values()) {
            if(childHandle.kind == 'directory') {
                dirNames.push(childHandle.name)
            } else {
                fileNames.push(childHandle.name)
            }
        }
        return dirNames.concat(fileNames)
    }

    async isGroupP(path: string[]): Promise<boolean> {
        let item = await this.getItemP(path)
        if(item instanceof FileSystemHandle) {
            return item.kind == 'directory';
        }
        return false;
    }

    async getContentElementP(path: string[]): Promise<HTMLElement> {
        let handle = await this.getItemP(path) as FileSystemHandle

        let contentView: HTMLElement = document.createElement("div");
        contentView.className = FILE_ITEM_CONTENT_CLASS;
        if(handle.kind == 'directory') {
            contentView.innerHTML = `
                <i class="${FILE_ITEM_ICON_CLASS} icon-folder"></i>
                <span>${handle.name}</span>
            `;
        } else {
            contentView.innerHTML = `
                <i class="${FILE_ITEM_ICON_CLASS} icon-unknown"></i>
                <span >${handle.name}</span>
            `;
        }
        return contentView;
    }

}

class MenuItem {
    name = null;
    icon = null;
    listener = null;

    constructor(name, icon, listener) {
        this.name = name;
        this.icon = icon;
        this.listener = listener;
    }
}