interface HTMLElement {
    /** 节点名 */
    _treeNodeName : string
    
    /** 是否展开 */
    _treeIsUnfold: boolean
}

interface FileSystemDirectoryHandle {
    values(): Promise<FileSystemHandle>[]
}

interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>
}

interface FileSystemWritableFileStream {
    write(data)
    close()
}

interface Window {
    showDirectoryPicker(): Promise<FileSystemHandle>
}

interface DataTransferItem {
    getAsFileSystemHandle(): FileSystemHandle
}