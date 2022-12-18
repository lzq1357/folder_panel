import './FolderPanel.css'
import { TreePanel, TreeAdapter } from "../TreePanel/TreePanel";

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

    private initContextMenu() {

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
        this.rootHandle = handle
        this.adapter._rootHandle = handle
        this.treePanel.showTree()
    }

    pickFolder() {
        window.showDirectoryPicker().then((handle) => {
            this.setRoot(handle)
        });
    }

    setOnOpenFileListener(listener: (handle: FileSystemFileHandle)=>void) {
        this.onOpenFile = listener
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