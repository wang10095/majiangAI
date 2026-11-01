import { _decorator, AudioSource, CircleCollider2D, Collider2D, Component, Contact2DType, DistanceJoint2D, ECollider2DType, Enum, ERigidBody2DType, instantiate, IPhysics2DContact, isValid, Node, PhysicsGroup, Prefab, RigidBody2D, size, Sprite, SpriteFrame, Texture2D, Tween, UITransform } from 'cc';
import { SuperComponent } from '../frame/center/components/super-component';

import { Label } from 'cc';
import { CircleKindType, CircleSizeType, CircleState, UI_EVENT_NAME } from '../game/constant/common-define';
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

//锁住的气泡 不会单独使用 当锁链使用
@ccclass('ModelLockCircle')
export class ModelLockCircle extends SuperComponent {
    // @property({
    //     type: CircleCollider2D
    // })
    // collider: CircleCollider2D = null;

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
        tooltip: '设置进度数值'
    })
    fullNum: number = 0;

    @property({
        type: Node,
    })
    nodeLock: Node = null;

    @property({
        type: Node,
    })
    lockSpine: Node = null;

    // @property({
    //     type: Boolean
    // })
    circleUse: Boolean = false;

    // @property({
    //     type: Enum(CircleSizeType),
    //     visible: function () {
    //         return this.circleUse === true;
    //     }
    // })
    // circleType: number = CircleSizeType.Max;

    _unlockNum: number = null;
    _parentClass: Node = null;
    private countDownTween: Tween<{ a: number }>;
    private remaincount: number;


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


        //暂时关掉进度条
        this.progress.node.parent.active = false;

        // const width = DataManager.dataBattle.circleSize[this.circleType];
        // const scale = width / this.node.getComponent(UITransform).width;
        // this.node.setScale(scale, scale, scale);
    }

    //初始化解锁数值
    setLockNum(unlockNum: number) {
        this._unlockNum = unlockNum;
        this.remaincount = this.fullNum;
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
        nodeLizi.parent = this.labRemainNum.node;

        const pos = convertToNodeSpaceAR(worldPos, this.progress.node.parent);
        nodeLizi.setPosition(pos.x, pos.y);
        tween(nodeLizi).to(0.8, { position: v3(0, 0, 0) }).call(() => {
            nodeLizi.destroy();
            this.setProgress(this._unlockNum / this.fullNum);

            if (this.countDownTween != null) {
                this.countDownTween.stop();
            }
            this.countDownTween = tween({ a: this.remaincount });
            let desnum = this.fullNum - this._unlockNum;
            if (desnum < 0) {
                desnum = 0;
            }
            this.countDownTween.to(0.4, { a: desnum }, {
                onUpdate: (target?: { a: number }, ratio?: number) => {
                    if (!isValid(this.node) || !isValid(this.labRemainNum.node)) {
                        return;
                    }
                    this.remaincount = target.a;
                    this.labRemainNum.string = this.remaincount.toFixed(0) + '';
                    // console.log("======================================", target.a);
                }
            }).call(() => {
                if (!isValid(this.node) || !isValid(this.labRemainNum.node)) {
                    return;
                }
                if (this._unlockNum >= this.fullNum) {
                    this.progress.node.parent.active = false;
                    // this.node.getChildByName('circle').getComponent(RigidBody2D).type = ERigidBody2DType.Kinematic;
                    Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_Unlock');
                    this.lockSpine.getComponent(SuperSpine).playSpine('open', false, () => {
                        this.nodeLock.active = false;

                        if (this.circleUse) {
                            (this._parentClass as any).setLockDestory()
                            eventAfterPhysics(() => {
                                this.node.destroy();
                            })
                        } else {
                            tween(this.node.getChildByName('circle')).to(0.2, { scale: v3(0.1, 0.1) }).call(() => {
                                eventAfterPhysics(() => {
                                    this.node.destroy();
                                })
                            }).start()
                        }
                    })
                }
            }).start();

            // if (this._unlockNum >= this.fullNum) {
            //     this.progress.node.parent.active = false;
            //     // this.node.getChildByName('circle').getComponent(RigidBody2D).type = ERigidBody2DType.Kinematic;
            //     this.lockSpine.getComponent(SuperSpine).playSpine('open', false, () => {
            //         this.nodeLock.active = false;

            //         if (this.circleUse) {
            //             (this._parentClass as any).setLockDestory()
            //             eventAfterPhysics(() => {
            //                 this.node.destroy();
            //             })
            //         } else {
            //             tween(this.node.getChildByName('circle')).to(0.2, { scale: v3(0.1, 0.1) }).call(() => {
            //                 eventAfterPhysics(() => {
            //                     this.node.destroy();
            //                 })
            //             }).start()
            //         }
            //     })
            // }

        }).start();

    }


    setCircleUse(flag: boolean) {
        this.circleUse = flag;
    }

    //设置锁住的父节点父类
    setParentNode(parent: any) {
        this._parentClass = parent;
    }


    // onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
    //     if (otherCollider.sensor) { //碰到了传感器  （传感器一般是警戒线或者炸弹 这个由对方去判断）

    //         return;
    //     }
    // }

    // onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {

    // }

    update(deltaTime: number) {

    }

}


