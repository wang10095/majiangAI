


import { Color, Node, SpriteFrame, UITransform, Widget, _decorator } from 'cc';
import ScrollReuseItem from '../../frame/center/components/scroll-item';
import { Sprite } from 'cc';
import { Label } from 'cc';
import { DataManager } from '../data/data-manager';
import { Manager } from '../../frame/center/manager';
import { getRandomInt } from '../common';
const { ccclass, property } = _decorator;

@ccclass('ItemTalk')
export class ItemTalk extends ScrollReuseItem {
    @property({ type: [Node] })
    talks: Node[] = [];

    _faceId: number = 0;
    _init: boolean = false;
    protected onLoad(): void {
        super.onLoad();
        // this.registerEmit([

        // ], [

        // ], this);
        console.log("item_talk ------ onLoad")

    }


    public renewView(dataIndex: number, data: any) {
        super.renewView(dataIndex, data);
        // console.log("ItemTalk  dataIndex:",dataIndex, "data:",data ,"_init:",this._init)
        if (!this._init) {
            // this._init = true;
            this.talks[0].active = false;
            this.talks[1].active = false;

            this._faceId = data.faceId;
            let talk: Node = null;
            let face: Node = null;
            let label: Node = null;
            // 聊天方向
            const r: number = data.dir;
            // console.log("rrrrr:",r);
            if (r < 6) {//左
                talk = this.talks[0];
            } else {//右
                talk = this.talks[1];
            }
            if (talk) {
                talk.active = true;

                face = talk.getChildByName("Face");
                label = talk.getChildByName("Talk");
                if (label) {
                    // console.log("logContent :",data.msg);
                    label.getComponent(Label).string = "" + data.msg;
                }
                if (face) {
                    this.setSpriteFrame(face.getComponent(Sprite));
                }
            }
        }

    }

    async setSpriteFrame(face: Sprite) {

        const faceConfig = Config.Face[this._faceId];
        // console.log("ItemTalk faceConfig: ", faceConfig);
        const faceName = faceConfig.image;
        const path = `model://image/${faceName}/spriteFrame`;
        face.spriteFrame = await Manager.bundleManager.load<SpriteFrame>(path, SpriteFrame);
        // if (this.node && this.node.isValid && this.face && this.face.isValid) {
        // console.log("ItemTalk  face spriteFrame ok")

        // }
    }


}