import { FolderPanel } from "./FolderPanel/FolderPanel";

let btnPick = document.getElementById("btnPick")
let btnSave = document.getElementById("btnSave")
let btnClose = document.getElementById("btnClose")
let editArea = document.getElementById("EditArea")
let fileHandle: FileSystemFileHandle | null = null

let folderPanel = new FolderPanel("FolderPanel")
folderPanel.setOnOpenFileListener( async (handle: FileSystemFileHandle)=> {
    fileHandle = handle;
    let file = await fileHandle.getFile();
    if(editArea instanceof HTMLTextAreaElement && file){
        editArea.value = await file.text()
    }
})
if(btnPick instanceof HTMLElement) {
    btnPick.onclick = () => {
        folderPanel.pickFolder()
    }
}
if(btnSave instanceof HTMLElement) {
    btnSave.onclick = async () => {
        if(editArea instanceof HTMLTextAreaElement && fileHandle){
            let content= editArea.value
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
        }
    }
}
if(btnClose instanceof HTMLElement) {
    btnClose.onclick = async () => {
        if(editArea instanceof HTMLTextAreaElement && fileHandle){
            fileHandle = null;
            editArea.value = ""
        }
    }
}

