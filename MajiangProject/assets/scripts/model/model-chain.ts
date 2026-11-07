import { _decorator, AudioSource, ERigidBody2DType, instantiate, IPhysics2DContact, isValid, Node, PhysicsGroup, Prefab, RigidBody2D, size, Sprite, SpriteFrame, Texture2D, Tween, UITransform } from 'cc';
import { SuperComponent } from '../frame/center/components/super-component';

import { UI_EVENT_NAME } from '../game/constant/common-define';
import { Label } from 'cc';
import { convertToNodeSpaceAR, convertToWorldSpaceAR, createLizi } from '../game/ui-commonset';
import { DataManager } from '../game/data/data-manager';
import { Vec3 } from 'cc';
import { eventAfterPhysics } from '../game/common';
import { Manager } from '../frame/center/manager';
import { tween } from 'cc';
import { v3 } from 'cc';
import { SuperSpine } from '../frame/center/components/super-spine';
import { PerticleType } from '../game/battle/collect-face';
import { PropType } from '../game/constant/skill-define';
import { TESdkData } from '../frame/sdk-common/TE-sdk';
const { ccclass, property } = _decorator;

@ccclass('ModelChain')
export class ModelChain extends SuperComponent {
    // @property({
    //     type: CircleCollider2D
    // })
    // collider: CircleCollider2D = null;

    @property({
        type: Boolean,
        displayName: '是否是托底底座'
    })
    isUnderPin: Boolean = false;

    @property({
        type: Label,
    })
    labRemainNum: Label = null;

    @property({
        type: Sprite,
        tooltip: '累积进度'
    })
    progress: Sprite = null;

    @property({
        tooltip: '锁链耐久度'
    })
    fullNum: number = 0;

    @property({
        type: Node
    })
    nodeProgress: Node = null;

    @property({
        type: Node,
        tooltip: "spine"
    })
    spine: Node = null;

    @property({
        type: Node,
        tooltip: "lock_spine"
    })
    lockSpine: Node = null;


    @property({
        type: [String]
    })
    aniNames: String[] = [];

    //========================================================
    _unlockNum: number = 0;
    _isValid: boolean = true;

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

        this._isValid = true;
    }

    start() {
        super.start();
        //暂时关掉进度条
        this.progress.node.parent.active = false;
        // this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        // this.collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
        this.setLockNum(0);
        this.labRemainNum.string = this.fullNum + '';


        console.log('=-======12312===============', this.node.name)

        this.spine.getComponent(SuperSpine).playSpine('idle', true);
        this.lockSpine.getComponent(SuperSpine).playSpine('idle', true);
    }

    //设置刚体类型 默认是Dynamic
    setRigidBodyType(type = ERigidBody2DType.Dynamic) {
        this.node.getComponent(RigidBody2D).type = type;
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
        const selfWordPos = convertToWorldSpaceAR(this.node);
        if (selfWordPos.y < DataManager.dataBattle.underPinLocY - 50) {
            return;
        }

        //进度已经满了 不保险因为 气泡可能在同一帧爆炸 同一帧发过来
        if (this._unlockNum >= this.fullNum) {
            console.log('====full================', this._unlockNum)
            return;
        }
        this._unlockNum += delNum;

        let count = -1;
        for (let i = 0; i < this.aniNames.length; i++) {
            console.log(this._unlockNum, '===========12312312312====+++========', this.fullNum / (this.aniNames.length + 1) * (i + 1))
            if (this._unlockNum >= this.fullNum / (this.aniNames.length + 1) * (i + 1)) {
                count = i;
            }
        }


        const nodeLizi = await createLizi(PerticleType.ChainLockFly)
        nodeLizi.parent = this.labRemainNum.node;

        const pos = convertToNodeSpaceAR(worldPos, this.labRemainNum.node);
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

                if (count >= 0 && count < this.aniNames.length && this._unlockNum < this.fullNum) {
                    this.spine.getComponent(SuperSpine).playSpine(this.aniNames[count] + '', true);
                }
                if (this._unlockNum >= this.fullNum) {
                    console.log('=============chain==满了=裂开===================');
                    //打点
                    const stageId = DataManager.dataBattle.curStage + '-' + DataManager.dataBattle.curLittleStage;
                    TESdkData.reportStage(stageId, '成功');

                    this.nodeProgress.active = false
                    this.labRemainNum.node.active = false;
                    Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_Unlock');
                    this.lockSpine.getComponent(SuperSpine).playSpine('open', false);

                    if (this.isUnderPin && this._isValid) {
                        this._isValid = false
                        console.log('=============底座======裂开 加入队列================');
                        DataManager.dataSkill.addSkillQueue([PropType.EVENT_CALLBACK, () => {
                            Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_IceGroundBreak');
                            this.spine.getComponent(SuperSpine).playSpine('boom', false, () => {
                                this.dispatchEmit(UI_EVENT_NAME.UNDERPIN_DESTORY_BROADCAST);
                                eventAfterPhysics(() => {
                                    this.node.destroy();
                                })
                            });
                        }]);
                    } else {

                        if (this._isValid) {
                            this._isValid = false;
                            console.log('=============不是底座======================');
                            this.spine.getComponent(SuperSpine).playSpine('boom', false, () => {
                                eventAfterPhysics(() => {
                                    this.node.destroy();
                                })
                            });
                        }


                    }

                }

            }).start();

        }).start();

    }

    //初次碰撞就进行消除判断，各自判断各自的
    // //只往出跑的  因为碰撞时双方相互的
    // onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {


    // }

    // onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {

    // }

    update(deltaTime: number) {

    }

}


