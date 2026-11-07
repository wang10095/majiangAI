


import { Node, _decorator, tween, v3 } from 'cc';
import ScrollReuseItem from '../../frame/center/components/scroll-item';
import { DataManager } from '../data/data-manager';
import { SpriteFrame } from 'cc';
import { Sprite } from 'cc';
import { Manager } from '../../frame/center/manager';
import { Label } from 'cc';
import { UI_EVENT_NAME } from '../constant/common-define';
const { ccclass, property } = _decorator;

@ccclass('ItemWord')
export class ItemWord extends ScrollReuseItem {
    @property({
        type: Node,
    })
    content: Node = null;
    @property({
        type: Sprite,
    })
    sprite: Sprite = null;
    @property({
        type: Label,
        tooltip: "数量"
    })
    labCount: Label = null;

    _init: boolean = false;

    protected onLoad(): void {
        super.onLoad();
        this.registerEmit([
            UI_EVENT_NAME.COLLECTION_WORD_UPDATE,
        ], [
            (faceId: number) => {
                if (faceId === this._faceId) { //到了词条栏了 更新数量

                    this.setAnim();
                    const curCount = DataManager.dataSkill.getWordZi(this._faceId);
                    this.labCount.string = '' + curCount;
                }
            }
        ], this);

        this._init = true;
    }

    _faceId: number = 0;

    public renewView(dataIndex: number, data: Array<number>) {
        super.renewView(dataIndex, data);
        this._faceId = data[0];
        this.setSpriteFrame();

        // const curCount = data[1] 
        const curCount = DataManager.dataSkill.getWordZi(this._faceId); //数据实时了
        console.log('=================renewView===================', this._faceId, curCount);
        this.labCount.string = '' + curCount;

        if (this._init && data[2]) { //新添加
            this.setAnim();
        }
        this._init = false;
    }

    setAnim() {
        tween(this.content).to(0.3, { scale: v3(1.5, 1.5, 1) }).delay(0.2).to(0.3, { scale: v3(1, 1, 1) }).start();
    }

    async setSpriteFrame() {
        const faceConfig = DataManager.dataBattle.faceConfig[this._faceId];
        const faceName = faceConfig.image;
        const path = `model://image/${faceName}/spriteFrame`;
        const spriteFrame: SpriteFrame = await Manager.bundleManager.load<SpriteFrame>(path, SpriteFrame);
        if (this.node && this.node.isValid && this.sprite && this.sprite.isValid) {
            this.sprite.spriteFrame = spriteFrame;
        }
    }

}