import { _decorator, Node } from "cc";
import { SuperComponent } from "../../frame/center/components/super-component";
import { Sprite } from "cc";
import { Label } from "cc";
import { G_PoseImageUrl, G_PropIconUrl, ITEM_TYPE } from "../constant/common-define";
import { G_setRemoteSpriteFrame } from "../ui-commonset";


const { ccclass, property } = _decorator

@ccclass('ItemIcon')
export class ItemIcon extends SuperComponent {
    @property({
        type: Sprite,
        tooltip: '背景'
    })
    bg: Sprite = null;

    @property({
        type: Sprite,
        tooltip: '道具icon'
    })
    icon: Sprite = null;

    @property({
        type: Label,
        tooltip: '名称'
    })
    labName: Label = null;



    protected onLoad(): void {
        super.onLoad();
    }

    protected start(): void {
        super.start();


    }


    public setData(type: string, id: string | number) {

        let iconPath: string = ''
        let name: string = ''
        if (type === ITEM_TYPE.Pose) {
            const config = Config.Pose[id]
            iconPath = G_PoseImageUrl(config.image);
            this.icon.node.setScale(0.85, 1, 1)
            name = config.name;
        } else if (type === ITEM_TYPE.Prop) {
            const config = Config.Prop[id]
            iconPath = G_PropIconUrl(config.image);
            name = config.name;
        }

        G_setRemoteSpriteFrame(this.icon, iconPath, () => {

        });
        this.labName.string = name;

    }

}