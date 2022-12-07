import { TreePanel, TreeAdapter } from "./TreePanel";

const FILE_ITEM_CONTENT_CLASS = "FileItemContentView";
const FILE_ITEM_ICON_CLASS = "FileItemIcon";

const FILE_CONTEXT_MENU_CLASS = "FileContextMenu";
const FILE_CONTEXT_MENU_ITEM_CLASS = "FileContextMenuItem";
const FILE_CONTEXT_MENU_ITEM_ICON_CLASS = "FileContextMenuItemIcon";

const DRAG_CONTAINER_CLASS = "DragContainer";
const DRAG_ICON_CLASS = "DragIcon";


export class FolderPanel {




}

class FileTreeAdapter extends TreeAdapter {
    private rootHandle: FileSystemHandle
    constructor(rootHandle: FileSystemHandle) {
        super()
        this.rootHandle = rootHandle
    }

    async getItemP(path: string[]): Promise<any> {
        let handle: FileSystemHandle | null = this.rootHandle
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