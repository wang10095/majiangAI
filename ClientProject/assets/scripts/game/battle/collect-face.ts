
import { Node, _decorator, sp } from 'cc'
import { SuperComponent } from '../../frame/center/components/super-component';
import { Label } from 'cc';
import { DataManager } from '../data/data-manager';
import { SpriteFrame } from 'cc';
import { Manager } from '../../frame/center/manager';
import { Sprite } from 'cc';
import { Prefab } from 'cc';
import { instantiate } from 'cc';
import { createLizi, G_setSpriteFrame } from '../ui-commonset';
import { SuperSpine } from '../../frame/center/components/super-spine';
import { BATTLE_STAGE_TYPE } from '../data/data-battle';

const { ccclass, property } = _decorator;

export enum PerticleType {
    None = 0,
    FaceFly = 1,
    WordFly = 2,
    CollectFace = 3, //收集face
    ChainLockFly = 4, //飞锁链
    GameSuccess = 5, //游戏胜利
    LittleStagePass = 6, //小关通过
}

@ccclass('CollectFace')
export class CollectFace extends SuperComponent {

    @property({
        type: Label,
        tooltip: '剩余需要收集数量'
    })
    labCollectNum: Label = null;

    @property({
        type: Node,
        tooltip: '对钩'
    })
    nodeGou: Node = null;

    @property({
        type: Label,
        tooltip: '词条汉字'
    })
    labWord: Label = null;

    @property({
        type: Node
    })
    spine: Node = null;

    _reminNum: number = null;
    _faceId: number = 0;

    protected onLoad(): void {
        super.onLoad();
        this.labCollectNum.node.active = true;
        this.nodeGou.active = false;
        this.spine.active = false;
    }

    async addLizi(_type: PerticleType, zOrder: number = -1) {
        const nodeLizi = await createLizi(_type, 1);
        nodeLizi.parent = this.node;
        nodeLizi.setSiblingIndex(zOrder);
    }

    //设置剩余收集数量
    async setFaceInfo(faceInfo: Array<number>) {
        this._reminNum = faceInfo[1];
        this.labCollectNum.string = '' + this._reminNum;
        if (this._reminNum === 0 && DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main) {
            this.labCollectNum.node.active = false;
        }

        const faceConfig = DataManager.dataBattle.faceConfig[faceInfo[0]];
        const faceName = faceConfig.image;
        // const path = `model://image/${faceName}/spriteFrame`;
        // const spriteFrame: SpriteFrame = await Manager.bundleManager.load<SpriteFrame>(path, SpriteFrame);
        // if (this.node && this.node.isValid) {
        //     this.node.getComponent(Sprite).spriteFrame = spriteFrame;
        // }
        G_setSpriteFrame(this.node, `model://image/${faceName}`);
    }

    //收集
    collectNum(count: number) {
        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main) {
            this._reminNum -= count;
            this.labCollectNum.string = '' + this._reminNum;
            if (this._reminNum <= 0) {
                this._reminNum = 0;

                this.labCollectNum.node.active = false;
                this.nodeGou.active = true;
            }
        } else {
            this._reminNum += count;
            this.labCollectNum.string = '' + this._reminNum;
        }
    }

    async showSpine(callback) {
        const path = `model://spine/UI_Vortex`;
        console.log('=====collectFace=====showSpine========', path);
        const skeletonData: sp.SkeletonData = await Manager.bundleManager.load<sp.SkeletonData>(path, sp.SkeletonData);
        if (this.node && this.node.isValid) {
            this.spine.active = true;
            this.spine.getComponent(sp.Skeleton).skeletonData = skeletonData;
            this.spine.getComponent(SuperSpine).playSpine('idle', false, () => {
                this.spine.getComponent(sp.Skeleton).skeletonData = null;
                this.spine.active = false;

                if (callback) {
                    callback()
                    callback = null;
                }
            });
        }
    }

    getReminNum() {
        return this._reminNum;
    }

    showWordZi(zi: string) {
        this.node.getComponent(Sprite).enabled = false;
        this.labWord.node.active = true;
        this.labWord.string = zi;
    }

}