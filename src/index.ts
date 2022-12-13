import { FolderPanel } from "./FolderPanel";

let folderPanel = new FolderPanel("FolderPanel")
folderPanel.setOnOpenFileListener( (handle: FileSystemFileHandle)=> {
    
})
let btnPick = document.getElementById("btnPick")
if(btnPick instanceof HTMLElement) {
    btnPick.onclick = () => {
        folderPanel.pickFolder()
    }
}

