

// 获取浏览器窗口的可视区域的宽度
function getViewPortWidth(): number {
    return document.documentElement.clientWidth || document.body.clientWidth;
}

// 获取浏览器窗口的可视区域的高度
function getViewPortHeight(): number {
    return document.documentElement.clientHeight || document.body.clientHeight;
}


export class Dialog  {
    rootView: HTMLElement;
    container: HTMLElement;
    resizeListener = ()=>{
        this.onResize();
    };
    constructor(){
        const rootView = document.createElement("div");
        rootView.className = `DialogRootView`;
        const container = document.createElement("div");
        container.className = `DialogContainer`;
        rootView.appendChild(container)
        this.rootView = rootView;
        this.container = container;
    }

    show() {
        document.body.appendChild(this.rootView);
        this.onResize();
        window.addEventListener("resize", this.resizeListener);
        
    }

    onResize() {
        const totalW = getViewPortWidth();
        const totalH = getViewPortHeight();
        this.rootView.style.left = 0 +'px';
        this.rootView.style.top = 0 +'px';
        this.rootView.style.width = totalW +'px';
        this.rootView.style.height = totalH +'px';
        this.container.style.left = ((totalW - this.container.offsetWidth ) / 2) +'px';
        this.container.style.top = ((totalH - this.container.offsetHeight ) / 2) +'px';
    }

    dismiss() {
        document.body.removeChild(this.rootView);
        window.removeEventListener("resize", this.resizeListener);
    }
    
    static create(view: HTMLElement): Dialog {
        let dialog = new Dialog();
        dialog.container.appendChild(view);
        return dialog;
    }

    static alert(msg: String, title: String="", confirmListener?: (()=>void)): Dialog {
        let contentView: HTMLElement = document.createElement("div");
        contentView.className = "DialogDefaultContent";
        contentView.innerHTML = `
            <div class="DialogDefaultTitle DialogConfirmTitle">
                <h3>${title}</h3>
            </div>
            <div class="DialogDefaultMsg DialogConfirmMsg">${msg}</div>
            <div class="DialogDefaultButtonRow DialogConfirmButtonRow">
                <button class="DialogDefaultButton DialogButtonConfirm">确定</button>
            </div>
        `;
        let dialog = Dialog.create(contentView);
        (contentView.querySelector(".DialogButtonConfirm") as HTMLElement).onclick = () => {
            dialog.dismiss();
            if(confirmListener) {
                confirmListener();
            }
        };
        dialog.show();
        return dialog;
    }

    static confirm(msg: String, title: String="", confirmListener?: (()=>void), cancelListener?: (()=>void)): Dialog {
        let contentView = document.createElement("div");
        contentView.className = "DialogDefaultContent";
        contentView.innerHTML = `
            <div class="DialogDefaultTitle DialogConfirmTitle">
                <h3>${title}</h3>
            </div>
            <div class="DialogDefaultMsg DialogConfirmMsg">${msg}</div>
            <div class="DialogDefaultButtonRow DialogConfirmButtonRow">
                <button class="DialogDefaultButton DialogButtonConfirm">确定</button>
                <button class="DialogDefaultButton DialogButtonCancel">取消</button>
            </div>
        `;
        let dialog = Dialog.create(contentView);
        (contentView.querySelector(".DialogButtonConfirm") as HTMLElement).onclick = () => {
            dialog.dismiss();
            if(confirmListener) {
                confirmListener();
            }
        };
        (contentView.querySelector(".DialogButtonCancel") as HTMLElement).onclick = () => {
            dialog.dismiss();
            if(cancelListener) {
                cancelListener();
            }
        };
        dialog.show();
        return dialog;
    }

    
    static prompt(msg: String, title: String="", confirmListener?: ((String)=>void), cancelListener?: (()=>void)): Dialog {
        let contentView = document.createElement("div");
        contentView.className = "DialogDefaultContent";
        contentView.innerHTML = `
            <div class="DialogDefaultTitle DialogPromptTitle">
                <h3>${title}</h3>
            </div>
            <div class="DialogDefaultMsg DialogPromptMsg">${msg}</div>
            <div class="DialogDefaultInputRow DialogPromptInputRow">
                <input class="DialogDefaultInput" type="text" name="input01">
            </div>
            <div class="DialogDefaultButtonRow DialogPromptButtonRow">
                <button class="DialogDefaultButton DialogButtonConfirm">确定</button>
                <button class="DialogDefaultButton DialogButtonCancel">取消</button>
            </div>
        `;
        let dialog = Dialog.create(contentView);
        (contentView.querySelector(".DialogButtonConfirm") as HTMLElement).onclick = () => {
            let input01 = contentView.querySelector(".DialogDefaultInput")
            let val01 = input01 instanceof HTMLInputElement ? input01.value : ""
            dialog.dismiss();
            if(confirmListener) {
                confirmListener(val01);
            }
        };
        (contentView.querySelector(".DialogButtonCancel") as HTMLElement).onclick = () => {
            dialog.dismiss();
            if(cancelListener) {
                cancelListener();
            }
        };
        dialog.show();
        return dialog;
    }



}