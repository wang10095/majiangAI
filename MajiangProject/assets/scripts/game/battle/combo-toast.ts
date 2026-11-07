import { tween, Node } from "cc";
import { v3 } from "cc";
import { UIOpacity } from "cc";
import { Label } from "cc";
import { _decorator } from "cc";
import { SuperComponent } from "../../frame/center/components/super-component";
import { UI_EVENT_NAME } from "../constant/common-define";
import { BitmapFont } from "cc";
import { Manager } from "../../frame/center/manager";
import { isValid } from "cc";

const { ccclass, property } = _decorator;

@ccclass('ComboToast')
export class ComboToast extends SuperComponent {
    @property({
        type: Node
    })
    content: Node = null;

    @property({
        type: Label
    })
    labContent: Label = null;

    protected onLoad(): void {
        super.onLoad();
        this.registerEmit([
            UI_EVENT_NAME.COMBO_TOAST_MOVEUP,
        ], [
            this.moveUp,
        ], this);
    }

    setData(count: number) {
        this.loadFont(count);
        this.labContent.string = 'COMBOx' + count;
        this.labContent.node.setScale(0, 0, 1);

        tween(this.labContent.node).to(0.2, { scale: v3(1.2, 1.2, 1) }).to(0.2, { scale: v3(1.0, 1.0, 1.0) }).to(0.8, { position: v3(0, 300, 0) }).destroySelf().start();
        // tween(this.labContent.getComponent(UIOpacity)).delay(0.8).to(0.4, { opacity: 0 }).call(() => {
        //     this.node.destroy();
        // }).start();
    }


    async loadFont(count: number) {
        let path = 'fonts://combo_font1.txt'
        if (count >= 5 && count <= 10) {
            path = 'fonts://combo_font2.txt'
        } else if (count > 10) {
            path = 'fonts://combo_font3.txt'
        }
        const bmfont: BitmapFont = await Manager.bundleManager.load<BitmapFont>(path, BitmapFont);
        if (bmfont && isValid(this.node)) {
            this.labContent.useSystemFont = false;
            this.labContent.font = bmfont;
        }
    }

    moveUp() {
        const yy = this.content.position.y;
        if (isValid(this.node)) {
            this.content.setPosition(this.content.position.x, yy + 100);
        }
    }

}