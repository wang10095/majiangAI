import { _decorator, AudioSource, CircleCollider2D, Collider2D, Component, Contact2DType, DistanceJoint2D, ECollider2DType, Enum, ERigidBody2DType, instantiate, IPhysics2DContact, Node, PhysicsGroup, Prefab, RigidBody2D, size, Sprite, SpriteFrame, Texture2D, UITransform } from 'cc';
import { SuperComponent } from '../frame/center/components/super-component';

import { Label } from 'cc';
import { CircleKindType, CircleSizeType, UI_EVENT_NAME } from '../game/constant/common-define';
import { convertToNodeSpaceAR, convertToWorldSpaceAR, createLizi } from '../game/ui-commonset';
import { DataManager } from '../game/data/data-manager';
import { eventAfterPhysics } from '../game/common';
import { Manager } from '../frame/center/manager';
import { v3 } from 'cc';
import { tween } from 'cc';
import { Vec3 } from 'cc';
import { PerticleType } from '../game/battle/collect-face';
import { SuperSpine } from '../frame/center/components/super-spine';
import { ModelCircle } from './model-circle';
const { ccclass, property } = _decorator;

//锁住的气泡 只占地方
@ccclass('ModelLockCircleUse')
export class ModelLockCircleUse extends SuperComponent {
    @property({
        type: Label
    })
    labRemainNum: Label = null;

    @property({
        type: Sprite,
        tooltip: '累积进度'
    })
    progress: Sprite = null;

    @property({
        type: Node,
    })
    nodeLock: Node = null;

    @property({
        type: Node,
    })
    lockSpine: Node = null;

    @property({
        tooltip: '设置进度数值'
    })
    fullNum: number = 0;


    @property({
        displayName: '',
        readonly: true,
    })
    todo: string = '=========以下由策划配置========';

    @property({
        type: Enum(CircleSizeType),
        displayName: '气泡类型'
    })
    circleType: number = CircleSizeType.Max;


    @property({
        type: Enum(CircleKindType)
    })
    circleColor: number = CircleKindType.Null;

    @property({
        displayName: '颜色大类_1',
        tooltip: '1',
        visible: function () {
            return this.circleColor > CircleKindType.Null;
        }
    })
    faceType_1: number = 1;

    @property({
        displayName: 'faceId_1',
        visible: function () {
            return this.circleColor > CircleKindType.Null;
        }
    })
    faceId_1: String = '';

    @property({
        displayName: 'count_1',
        visible: function () {
            return this.circleColor > CircleKindType.Null;
        }
    })
    faceCount_1: String = '';

    @property({
        displayName: '颜色大类_2',
        tooltip: '1',
        visible: function () {
            return this.circleColor > CircleKindType.OneColor;
        }
    })
    faceType_2: number = 1;

    @property({
        displayName: 'faceId_2',
        visible: function () {
            return this.circleColor > CircleKindType.OneColor;
        }
    })
    faceId_2: String = '';


    @property({
        displayName: 'count_2',
        visible: function () {
            return this.circleColor > CircleKindType.OneColor;
        }
    })
    faceCount_2: String = '';


    _unlockNum: number = null;

    onLoad(): void {
        super.onLoad();

        this.registerEmit([
            UI_EVENT_NAME.CIRCLE_FULL_BOOM,
        ], [
            (num: number, wordPos) => {
                this.addLockNum(num, wordPos);
            }
        ], this)
    }

    start() {
        super.start();

        // this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        // this.collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
        this.setLockNum(0);
        this.labRemainNum.string = this.fullNum + '';
        this.lockSpine.getComponent(SuperSpine).playSpine('idle', true);


        const width = DataManager.dataBattle.circleSize[this.circleType];
        const scale = width / this.node.getComponent(UITransform).width;
        this.node.setScale(scale, scale, scale);

    }

    //初始化解锁数值
    setLockNum(unlockNum: number) {
        this._unlockNum = unlockNum;
        // let remain = this.fullNum - this._unlockNum;
        // remain = remain < 0 ? 0 : remain
        // this.labRemainNum.string = remain + '';

        this.setProgress(this._unlockNum / this.fullNum);
    }

    setProgress(percent) {
        if (percent < 0) {
            percent = 0;
        }
        if (percent > 1) {
            percent = 1
        }
        const width = 60;
        const height = this.progress.getComponent(UITransform).height;
        this.progress.getComponent(UITransform).setContentSize(size(width * percent, height));
    }

    async addLockNum(delNum: number, worldPos: Vec3) {
        //低于基座下不加进度
        const wordPos = convertToWorldSpaceAR(this.node);
        if (wordPos.y < DataManager.dataBattle.underPinLocY - 50) {
            return;
        }

        if (this._unlockNum >= this.fullNum) {
            return;
        }

        this._unlockNum += delNum;

        const nodeLizi = await createLizi(PerticleType.ChainLockFly)
        nodeLizi.parent = this.progress.node.parent;

        const pos = convertToNodeSpaceAR(worldPos, this.progress.node.parent);
        nodeLizi.setPosition(pos.x, pos.y);
        tween(nodeLizi).to(0.4, { position: v3(0, 0, 0) }).call(() => {
            nodeLizi.destroy();

            this.setProgress(this._unlockNum / this.fullNum);
            if (this._unlockNum >= this.fullNum) {
                this.progress.node.parent.active = false;
                this.node.getChildByName('circle').getComponent(RigidBody2D).type = ERigidBody2DType.Kinematic;
                Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_Unlock');
                this.lockSpine.getComponent(SuperSpine).playSpine('open', false, () => {
                    this.nodeLock.active = false;
                    if (this.circleColor !== CircleKindType.Null) {
                        eventAfterPhysics(() => {
                            // this.createCircle(this.circleType, DataManager.dataBattle.boxNode);
                            this.node.destroy();
                        })
                    } else {
                        tween(this.node.getChildByName('circle')).to(0.3, { scale: v3(0.1, 0.1) }).call(() => {
                            eventAfterPhysics(() => {
                                this.node.destroy();
                            })
                        }).start()
                    }

                })
            }

        }).start();
    }


    async createCircle(idx: number, parentNode: Node) {
        const nodePrefab = await Manager.bundleManager.load<Prefab>("model://circle", Prefab);
        if (!nodePrefab) {
            console.error("create new circle error");
            return;
        }
        const node = instantiate(nodePrefab);
        node.parent = parentNode;
        const circleSize = DataManager.dataBattle.circleSize[idx]; //气泡大小
        node.name = 'circle_' + circleSize;
        node.getComponent(ModelCircle).setCircleData(idx, {}); //设置气泡类型 以及表情的类型和数量
        node.getComponent(ModelCircle).setRadius(circleSize / 2); //设置气泡和刚体半径
        node.getComponent(ModelCircle).setRigidBodyType(ERigidBody2DType.Dynamic); //刚创建设置static类型

        const wordPos = convertToWorldSpaceAR(this.node.getChildByName('circle'));
        const pos = convertToNodeSpaceAR(wordPos, parentNode);
        node.setPosition(pos.x, pos.y, pos.z);

        for (let i = 1; i <= this.circleColor; i++) {

            const faceType: number = this['faceType_' + i];

            const faceIds: string = this['faceId_' + i];
            const faceCounts: string = this['faceCount_' + i];
            console.log('====crerate aaaa=================', faceIds)
            const faceIdArray: Array<string> = faceIds.split(',');
            const faceCountArray: Array<string> = faceCounts.split(',');
            faceIdArray.forEach((faceId, idx) => {
                const faceIdN = Number(faceId);
                const count = Number(faceCountArray[idx]);
                node.getComponent(ModelCircle).createFace(faceType, { [faceIdN]: count });
            })
        }
        return node;
    }


    update(deltaTime: number) {

    }

}


