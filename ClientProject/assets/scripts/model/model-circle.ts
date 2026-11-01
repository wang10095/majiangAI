import { _decorator, AudioSource, CircleCollider2D, Collider2D, Component, Contact2DType, director, DistanceJoint2D, ECollider2DType, Enum, ERigidBody2DType, instantiate, IPhysics2DContact, isValid, KeyCode, macro, Node, PhysicsGroup, Prefab, RigidBody2D, size, Sprite, SpriteFrame, Texture2D, Tween, tween, UIOpacity, UITransform, v3, Vec2, Vec3 } from 'cc';
import { SuperComponent } from '../frame/center/components/super-component';
import { anyCircleType, CircleKindType, CircleSizeType, CircleState, GroupType, GuideType, UI_EVENT_NAME, UI_NAME } from '../game/constant/common-define';
import { Manager } from '../frame/center/manager';
import { DataManager } from '../game/data/data-manager';
import { changeParent, convertToNodeSpaceAR, convertToWorldSpaceAR, createLizi } from '../game/ui-commonset';
import { FaceAnimType, FaceKindType, ModelFace } from './model-face';
import { sdkUtils } from '../frame/sdk-common/sdk-utils';
import { v2 } from 'cc';
import SkillDefine, { PropType, SkillPosType } from '../game/constant/skill-define';
import Utils from '../frame/center/utils/utils';
import { sp } from 'cc';
import { SuperSpine } from '../frame/center/components/super-spine';
import { eventAfterPhysics, G_getSpineFps, getRandomInt } from '../game/common';
import { ClickDelegate } from '../game/common/click-delegate';
import { PerticleType } from '../game/battle/collect-face';
import { SuperAnimation } from '../frame/center/components/super-animation';
import { ModelLockCircle } from './model-lock-circle';
const { ccclass, property } = _decorator;


export enum CircleAnimType {
    None = 0,
    Anim = 1,
    Spine = 2,
}

export function destroyFaceJoint(faceNode: Node): void {
    const joint = (faceNode as any).compoent as DistanceJoint2D | null;
    (faceNode as any).compoent = null;
    if (joint && isValid(faceNode) && isValid(joint) && isValid(joint.node)) {
        joint.destroy();
    }
}

@ccclass('ModelCircle')
export class ModelCircle extends SuperComponent {

    @property({
        type: CircleCollider2D
    })
    collider: CircleCollider2D = null;

    @property({
        type: Node,
        tooltip: 'face父节点'
    })
    faceParent: Node = null;

    @property({
        type: sp.Skeleton
    })
    spine: sp.Skeleton = null;

    @property({
        type: Node
    })
    spine2: Node = null;


    @property({
        type: Node,
        displayName: '锁链'
    })
    lockNode: Node = null;

    @property({
        displayName: '',
        readonly: true,
        visible: function () {
            return isValid(this.lockNode)
        }
    })
    todo: string = '=========以下由策划配置========';

    @property({
        type: Enum(CircleSizeType),
        displayName: '气泡类型',
        visible: function () {
            return isValid(this.lockNode)
        }
    })
    circleType: number = CircleSizeType.Max;


    @property({
        type: Enum(CircleKindType),
        visible: function () {
            return isValid(this.lockNode)
        }
    })
    circleColor: number = CircleKindType.Null;

    @property({
        displayName: '颜色大类_1',
        tooltip: '1',
        visible: function () {
            return isValid(this.lockNode) && this.circleColor > CircleKindType.Null;
        }
    })
    faceType_1: number = 1;

    @property({
        displayName: 'faceId_1',
        visible: function () {
            return isValid(this.lockNode) && this.circleColor > CircleKindType.Null;
        }
    })
    faceId_1: String = '';

    @property({
        displayName: 'count_1',
        visible: function () {
            return isValid(this.lockNode) && this.circleColor > CircleKindType.Null;
        }
    })
    faceCount_1: String = '';

    @property({
        displayName: '颜色大类_2',
        tooltip: '1',
        visible: function () {
            return isValid(this.lockNode) && this.circleColor > CircleKindType.OneColor;
        }
    })
    faceType_2: number = 1;

    @property({
        displayName: 'faceId_2',
        visible: function () {
            return isValid(this.lockNode) && this.circleColor > CircleKindType.OneColor;
        }
    })
    faceId_2: String = '';


    @property({
        displayName: 'count_2',
        visible: function () {
            return isValid(this.lockNode) && this.circleColor > CircleKindType.OneColor;
        }
    })
    faceCount_2: String = '';

    //==============================变量声明========================================

    curState: CircleState = CircleState.Wait; //当前的状态  等待 准备  下落  落到池子里
    curCircleType = 0; //气泡类型 0-3  大 中大  中 小 //暂时没用

    faceTypeData: { [faceType: string]: { [faceId: string]: number } } = {}; // 详细大类对应的faceId:count   {faceType:{faceId:count},...}
    // curFaceTypeInfo = {}; // 只记录faceType颜色大类的总数量
    // faceIdCountInfo = {} // {faceId:count} 
    circleKindType: CircleKindType = CircleKindType.OneColor;//单色气泡还是双色气泡 

    fristContact = false;
    canContactWithGround = true;

    transforColor = 0; //是否进行了转换色技能  1 给一个气泡转换 2是全场转换
    _func = null;

    onLoad(): void {
        super.onLoad();
        this.registerEmit([
            UI_EVENT_NAME.CIRCLE_TOUCH_DESTORY,

        ], [
            (flag: boolean) => {
                this.touchClick(flag);
            },
        ], this)
    }

    start() {
        super.start();

        this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        this.collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
        this.collider.on(Contact2DType.PRE_SOLVE, this.onPreSolve, this);
        this.collider.on(Contact2DType.POST_SOLVE, this.onPostSolve, this);

        //锁住的气泡 直接生成 没有通过外部创建 要自己初始化所有信息
        if (isValid(this.lockNode)) {
            this.lockNode.getComponent(ModelLockCircle).setCircleUse(true);
            this.lockNode.getComponent(ModelLockCircle).setParentNode(this.node.getComponent(ModelCircle));

            const width = DataManager.dataBattle.circleSize[this.circleType];
            const scale = width / this.lockNode.getComponent(UITransform).width;
            this.lockNode.setScale(scale, scale, scale);

            this.setState(CircleState.Lock);
            this.setCircleData(this.circleType, {}); //设置气泡类型 以及表情的类型和数量
            this.setRadius(width / 2); //设置气泡和刚体半径    
            //创建表情
            this.resetFaceInfo(); //重置数据
            for (let i = 1; i <= this.circleColor; i++) {
                const faceType: number = this['faceType_' + i];
                const faceIds: string = this['faceId_' + i];
                const faceCounts: string = this['faceCount_' + i];
                console.log('====crerate aaaa=================', faceIds)
                const faceIdArray: Array<string> = faceIds.split(',');
                const faceCountArray: Array<string> = faceCounts.split(',');
                if (faceType == null || faceType == undefined) {
                    console.error('===error====创建锁住的气泡 faceType是空的=============', this.circleColor)
                }
                faceIdArray.forEach((faceId, idx) => {
                    let faceIdN = Number(faceId);
                    if (faceIdN < 2000) { //氛围表情
                        faceIdN = Config.FaceType[faceType].simplefaceIdArray[0];
                    }
                    const count = Number(faceCountArray[idx]);
                    this.node.getComponent(ModelCircle).createFace(faceType, { [faceIdN]: count });
                })
            }
        }
    }


    resetFaceInfo() {
        // this.curFaceTypeInfo = {}; //气泡中表情包的face大类型和数量
        // this.faceIdCountInfo = {} // {faceId:count}
        this.faceTypeData = {};
    }

    clearFace() {
        this.resetFaceInfo();
        this.faceParent.children.forEach((faceNode) => {
            destroyFaceJoint(faceNode);
        })
        this.faceParent.removeAllChildren();
    }

    touchClick(flag: boolean) {
        if (this.curState !== CircleState.Pool) {
            return;
        }
        if (flag) {
            if (!this.node.getComponent(ClickDelegate)) {
                this.node.addComponent(ClickDelegate)
            }

            console.log('=================touchClick=============')
            this.node.getComponent(ClickDelegate).init(this, () => {
                this.destorySelf(true);
                this.dispatchEmit(UI_EVENT_NAME.CIRCLE_TOUCH_DESTORY, false);
            });
        } else {
            if (this.node.getComponent(ClickDelegate)) {
                this.node.getComponent(ClickDelegate).destroy();
            }
        }
    }


    onPreSolve(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // if (this.transforColor) {
        //     if (this.transforColor === 1) {
        //         this.onBeginContact(selfCollider, otherCollider, contact);
        //         this.onBeginContact(otherCollider, selfCollider, contact);
        //     } else if (this.transforColor === 2) {
        //         this.onBeginContact(selfCollider, otherCollider, contact);
        //     }
        //     console.log('=============11111===3333==')
        // }
    }

    onPostSolve(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {

    }


    setCircleData(idx: number, data: any) {
        this.curCircleType = idx;
        // this.curFaceTypeInfo = data;
        // this.circleKindType = Object.keys(data).length; //是单色还是双色
    }

    getCircleType() {
        return this.curCircleType;
    }

    // getCircleData() {
    //     return this.curFaceTypeInfo;
    // }

    getFaceTypeData(): { [faceType: string]: { [faceId: string]: number } } {
        return this.faceTypeData;
    }

    getCircleKindType() {
        return this.circleKindType;
    }

    //判断是否存在
    stillExist() {
        return this.circleKindType > CircleKindType.Null && this.node.active && convertToWorldSpaceAR(this.node).y > 0;
    }


    //标记马上销毁  当destorySelf 延迟调用时 先标记一下
    markDestory() {
        this.circleKindType = CircleKindType.Null;
    }

    //radius 半径 
    setRadius(radius: number) {
        this.node.getComponent(UITransform).setContentSize(size(radius * 2, radius * 2));

        this.collider.radius = radius;
        this.collider.apply();

        const spineWidth = 256;
        const scale = radius * 2 / spineWidth;
        this.spine.node.setScale(scale, scale);
    }

    getRadius() {
        return this.collider.radius;
    }

    //设置刚体类型 默认是Dynamic
    setRigidBodyType(type = ERigidBody2DType.Dynamic) {
        this.node.getComponent(RigidBody2D).type = type;
    }

    //设置气泡当前状态
    setState(state: CircleState) {
        this.curState = state;
    }

    getState() {
        return this.curState;
    }

    shoot() {
        this.fristContact = true;
        this.dispatchEmit(UI_EVENT_NAME.CIRCLE_SHOOT)
    }

    //设置气泡是初始创建
    _isDefault = false;
    setDefault() {
        this._isDefault = true;
    }

    getIsDefault() {
        return this._isDefault;
    }

    setLockDestory() {
        this.lockNode = null;
        if (this.circleColor === CircleKindType.Null) {
            console.log(convertToWorldSpaceAR(this.node), '=====setLockDestory====Null=====destory===========')
            this.setState(CircleState.Delete); //设置气泡状态 销毁
            tween(this.node).to(0.2, { scale: v3(0.1, 0.1) }).call(() => {
                eventAfterPhysics(() => {
                    this.node.destroy();
                })
            }).start()

            return;
        }

        console.log(convertToWorldSpaceAR(this.node), '=====setLockDestory========Pool========', JSON.stringify(this.faceTypeData));
        this.setState(CircleState.Pool); //设置气泡状态
        changeParent(this.node, DataManager.dataBattle.boxNode); //更改父节点
        this.checkContact(); //检查接触的气泡 是否可以消融
    }

    //初次碰撞就进行消除判断，各自判断各自的
    //只往出跑的  因为碰撞时双方相互的  碰撞原则 数据先行 动画紧接着执行
    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // console.log('=============onBeginContact======', selfCollider, otherCollider, contact)
        if (otherCollider.sensor) { //碰到了传感器  （传感器一般是警戒线或者炸弹 这个由对方去判断）
            return;
        }

        if (isValid(this.lockNode)) {
            return;
        }

        if (this.getState() < CircleState.Shoot) {
            return;
        }

        if (this.fristContact) {  //在警戒线以下 有碰撞 
            this.fristContact = false;
            console.log('===========fristContact======首次下落碰撞通知新气泡做好准备===========');
            this.scheduleOnce(() => {//当前帧还要计算 下一帧改状态  
                this.setState(CircleState.Pool); //碰撞一次后就算入池了
                this.dispatchEmit(UI_EVENT_NAME.CIRCLE_FIRST_CONTACT); //气泡首次碰撞---------------
            })
        }

        //接触地面障碍物给一个 类似弹力的 反向线性速度
        if (contact && selfCollider.TYPE === ECollider2DType.CIRCLE && selfCollider.group === GroupType.Circle && otherCollider.group === GroupType.Ground && this.canContactWithGround == true) {
            //Manager.audioManager.playShock(); //手机震动

            const normal = contact.getWorldManifold().normal;

            const curLiner = selfCollider.getComponent(RigidBody2D).linearVelocity;
            let colliderForce = normal.multiplyScalar(v2(curLiner.x * 1.2, curLiner.y * 1.2).length());
            selfCollider.getComponent(RigidBody2D).linearVelocity = selfCollider.getComponent(RigidBody2D).linearVelocity.add(colliderForce)
            this.canContactWithGround = false;
            eventAfterPhysics(() => {
                this.canContactWithGround = true;
            })

            if (this.getState() === CircleState.Shoot) { //接触地面只播放一次
                Manager.audioManager.playBubbleHitAudio();  //气泡撞击音效
            }
            if (selfCollider.getComponent(RigidBody2D).linearVelocity.length() > 5) { //谁位置高谁播放音效
                Manager.audioManager.playShock(); //手机震动
            }
            this.setState(CircleState.Pool);
        }

        //两个都是气泡    group都是circle
        if (selfCollider.TYPE === ECollider2DType.CIRCLE && otherCollider.TYPE === ECollider2DType.CIRCLE &&
            selfCollider.group === GroupType.Circle && otherCollider.group === GroupType.Circle
        ) {
            const selfCircle = selfCollider.getComponent(ModelCircle);
            const otherCircle = otherCollider.getComponent(ModelCircle);
            const selfPos = convertToWorldSpaceAR(this.node); //转成世界坐标
            const otherPos = convertToWorldSpaceAR(otherCircle.node);


            if (selfCircle.getState() < CircleState.Shoot || otherCircle.getState() < CircleState.Shoot) {
                //防止过小关 下落时候 碰到下落的气泡
                return;
            }

            if (selfCollider.getComponent(RigidBody2D).linearVelocity.length() > 15) { //谁位置高谁播放音效
                Manager.audioManager.playShock(); //手机震动
                Manager.audioManager.playBubbleHitAudio();  //气泡撞击音效
            }

            if (selfPos.y > otherPos.y && !(selfCircle.node as any).impulsion && otherCircle.getState() == CircleState.Pool) { //上面的气泡给下面的气泡一个冲量
                if (selfCircle.getState() === CircleState.Shoot) {
                    const xx = -selfPos.x + otherPos.x;
                    const yy = -selfPos.y + otherPos.y;
                    otherCircle.getComponent(RigidBody2D).applyLinearImpulse(v2(xx, yy).normalize().multiplyScalar(500), v2(otherPos.x, otherPos.y), true);
                    selfCircle.node.attr({ impulsion: 1 })
                }
                //this.setState(CircleState.Pool);
            }
            this.setState(CircleState.Pool);
            //自己或对方不在 shoot和pool状态则不能进行检测
            if (selfCircle.getState() !== CircleState.Shoot && selfCircle.getState() !== CircleState.Pool) {
                return;
            }
            if (otherCircle.getState() !== CircleState.Shoot && otherCircle.getState() !== CircleState.Pool) {
                return;
            }

            const selfCircleType = selfCircle.getCircleType();
            const selfFaceData = Utils.utils.deepClone(selfCircle.getFaceTypeData());
            const otherCircleType = otherCircle.getCircleType();
            const otherFaceData = Utils.utils.deepClone(otherCircle.getFaceTypeData());

            if (Object.keys(selfFaceData).length <= 0 || Object.keys(otherFaceData).length <= 0) {
                console.warn('======== 有空气炮撞击 =========');
                return;
            }

            if (!this.checkHaveSameFace(selfCircle, otherCircle)) { //没有相同的face类型 
                return;
            }

            console.log(selfFaceData, "===碰撞===", otherFaceData);
            if (selfCircle.circleKindType === CircleKindType.OneColor && otherCircle.getCircleKindType() === CircleKindType.OneColor) {
                //单色气泡和单色气泡碰撞  
                console.log(selfFaceData, "===单色气泡和单色气泡碰撞===", otherFaceData);
                let func = () => {

                    console.log(selfFaceData, "===单色气泡和单色气泡碰撞=222==", otherFaceData);
                    const selfFaceType = Number(Object.keys(selfFaceData)[0]);
                    const otherFaceType = Number(Object.keys(otherFaceData)[0]);
                    //把自己face的给对方 也就是给对方添加face 自己销毁
                    const faceInfo = selfFaceData[selfFaceType];
                    selfCircle.delFace(selfFaceType, otherCircle); //卸载对应的face 然后去对方气泡
                    otherCircle.addFaceInfo(selfFaceType, faceInfo);
                }
                // const faceType = Number(Object.keys(otherFaceData)[0]); //两个气泡都有的face类型

                // ①表情颜色相同，则进行融合，较小气泡内的表情移动到较大气泡内，两个气泡大小相同则上面气泡的表情移动到下面气泡内
                if (selfCircleType === otherCircleType) { //气泡类型一样 位置高的往低处跑
                    const selfPos = convertToWorldSpaceAR(selfCircle.node); //转成世界坐标
                    const otherPos = convertToWorldSpaceAR(otherCircle.node);
                    if (selfPos.y > otherPos.y) {
                        func();
                    }
                } else {
                    if (selfCircleType < otherCircleType) {
                        func();
                    }
                }
            } else if (selfCircle.circleKindType === CircleKindType.TwoColor && otherCircle.getCircleKindType() === CircleKindType.TwoColor) {
                //双色气泡和双色气泡碰撞
                console.log('==双色气泡和双色气泡碰撞====')
                if (!selfFaceData[anyCircleType + ''] && !otherFaceData[anyCircleType + '']) {
                    const [sameCount, sameFaceData] = this.checkAllSameFace(selfCircle, otherCircle);
                    if (sameCount === 2) { //两种表情都相同 互相交换 形成两个单色气泡
                        console.log('==双色气泡和双色气泡碰撞==2个颜色相同==')

                        const lockFaceType = selfCircle.getLockFaceType();
                        if (lockFaceType !== null && lockFaceType !== undefined) {
                            let changeFaceType = null;
                            for (const faceType in selfFaceData) {
                                if (faceType !== lockFaceType) {
                                    changeFaceType = faceType;
                                    break;
                                }
                            }
                            const faceInfo = selfFaceData[changeFaceType + ''];
                            selfCircle.delFace(changeFaceType, otherCircle); //卸载对应的face 然后去
                            otherCircle.addFaceInfo(changeFaceType, faceInfo);
                        } else {
                            const changeFaceType = Number(Object.keys(selfFaceData)[0]);
                            otherCircle.setLockFaceType(changeFaceType); //让对方锁定此face类型

                            const faceInfo = selfFaceData[changeFaceType + '']
                            selfCircle.delFace(changeFaceType, otherCircle); //卸载对应的face 然后去
                            otherCircle.addFaceInfo(changeFaceType, faceInfo);
                        }
                    } else if (sameCount === 1) {
                        console.log('==双色气泡和双色气泡碰撞==1个颜色相同==')
                        const selfPos = convertToWorldSpaceAR(selfCircle.node); //转成世界坐标
                        const otherPos = convertToWorldSpaceAR(otherCircle.node);

                        const saveFaceType = sameFaceData[0];
                        if (selfPos.y < otherPos.y) { //低向高移动
                            const faceInfo = selfFaceData[saveFaceType + ''];
                            selfCircle.delFace(saveFaceType, otherCircle); //卸载对应的face 然后去
                            otherCircle.addFaceInfo(saveFaceType, faceInfo);
                        }
                    }

                } else if (selfFaceData[anyCircleType + ''] && !otherFaceData[anyCircleType + '']) {
                    // 彩虹双色和其它颜色双色
                    const selfFaceType = this.getOtherFaceType(selfFaceData);
                    for (const faceType in otherFaceData) {
                        //彩虹双色气泡除了彩虹外的颜色和另一个双色里有颜色相同，则该种颜色的表情移动到彩虹双色气泡里
                        if (selfFaceType === Number(faceType)) {
                            const faceInfo = otherFaceData[faceType + ''];
                            otherCircle.delFace(Number(faceType), selfCircle); //卸载对应的face 然后去
                            selfCircle.addFaceInfo(Number(faceType), faceInfo);
                            break;
                        }
                    }
                    //彩虹双色气泡除了彩虹外的颜色和另一一个双色里有颜色均不同，不反应

                } else if (selfFaceData[anyCircleType + ''] && otherFaceData[anyCircleType + '']) {
                    //彩虹双色和彩虹双色
                    const selfFaceType = this.getOtherFaceType(selfFaceData); //彩虹外另一个表情的颜色类型
                    const otherFaceType = this.getOtherFaceType(otherFaceData);
                    if (selfFaceType === otherFaceType) {   //除彩虹外的两种颜色相同,两个气泡融合
                        if (selfCircleType === otherCircleType) {
                            if (selfPos.y > otherPos.y) {
                                for (const faceType in selfFaceData) {
                                    const faceInfo = selfFaceData[faceType];
                                    selfCircle.delFace(Number(faceType), otherCircle);
                                    otherCircle.addFaceInfo(Number(faceType), faceInfo);
                                }
                            }
                        } else {
                            if (selfCircleType < otherCircleType) {
                                for (const faceType in selfFaceData) {
                                    const faceInfo = selfFaceData[faceType];
                                    selfCircle.delFace(Number(faceType), otherCircle);
                                    otherCircle.addFaceInfo(Number(faceType), faceInfo);
                                }
                            }
                        }
                    } else {    //除彩虹外的两种颜色不同，彩虹表情移动到表情数量较多的气泡中，一样多则移动到上面的气泡
                        const selfCount = this.getCountByFaceType(selfFaceType, selfFaceData);
                        const otherCount = this.getCountByFaceType(otherFaceType, otherFaceData);

                        if (otherCount > selfCount) { //跑对方那
                            const faceInfo = selfFaceData[anyCircleType + '']
                            selfCircle.delFace(anyCircleType, otherCircle);
                            otherCircle.addFaceInfo(anyCircleType, faceInfo);

                        } else if (selfCount === otherCount) { //一样多则移动到上面的气泡
                            if (selfPos.y < otherPos.y) { //我往对方飞
                                const faceInfo = selfFaceData[anyCircleType + '']
                                selfCircle.delFace(anyCircleType, otherCircle);
                                otherCircle.addFaceInfo(anyCircleType, faceInfo);
                            }
                        }

                    }
                }

            } else {
                //双色和单色碰撞 双色往单色跑  自己双色 对方单色
                if (selfCircle.getCircleKindType() === CircleKindType.TwoColor && otherCircle.getCircleKindType() === CircleKindType.OneColor) {
                    console.log('==双色和单色碰撞====');
                    if (!selfFaceData[anyCircleType + ''] && !otherFaceData[anyCircleType + '']) {
                        const faceType = Number(Object.keys(otherFaceData)[0]);
                        const faceInfo = selfFaceData[faceType + ''];
                        selfCircle.delFace(faceType, otherCircle); //卸载对应的face 然后去
                        otherCircle.addFaceInfo(faceType, faceInfo);
                    } else if (!selfFaceData[anyCircleType + ''] && otherFaceData[anyCircleType + '']) {
                        //彩虹单色和其它颜色双色 双色里较多的颜色进入单色泡泡，相同则随机
                        const maxFaceType: number = this.getMaxCountFaceType(selfFaceData);
                        const faceInfo = selfFaceData[maxFaceType + '']
                        selfCircle.delFace(maxFaceType, otherCircle);
                        otherCircle.addFaceInfo(maxFaceType, faceInfo);
                    } else if (selfFaceData[anyCircleType + ''] && otherFaceData[anyCircleType + '']) {
                        //彩虹单色和带彩虹的双色  两个气泡融合
                        if (selfCircleType === otherCircleType) { //气泡类型一样 位置高的往低处跑
                            if (selfPos.y > otherPos.y) { //我(双色)往对方飞（单色）
                                for (const faceType in selfFaceData) {
                                    const faceInfo = selfFaceData[faceType];
                                    selfCircle.delFace(Number(faceType), otherCircle);
                                    otherCircle.addFaceInfo(Number(faceType), faceInfo);
                                }
                            } else { //对方（单色）往我这飞
                                const faceType = anyCircleType;
                                const faceInfo = otherFaceData[faceType + ''];
                                otherCircle.delFace(faceType, selfCircle);
                                selfCircle.addFaceInfo(faceType, faceInfo);
                            }
                        } else {
                            if (selfCircleType < otherCircleType) {
                                for (const faceType in selfFaceData) {
                                    const faceInfo = selfFaceData[faceType];
                                    selfCircle.delFace(Number(faceType), otherCircle);
                                    otherCircle.addFaceInfo(Number(faceType), faceInfo);
                                }
                            } else {
                                const faceType = anyCircleType;
                                const faceInfo = otherFaceData[faceType + ''];
                                otherCircle.delFace(faceType, selfCircle);
                                selfCircle.addFaceInfo(faceType, faceInfo);
                            }
                        }

                    } else if (selfFaceData[anyCircleType + ''] && !otherFaceData[anyCircleType + '']) {
                        //一种单色和带彩虹的双色
                        const selfFaceType = this.getOtherFaceType(selfFaceData);
                        const otherFaceType = Number(Object.keys(otherFaceData)[0]);  //8
                        if (selfFaceType === otherFaceType) {
                            // 单色和双色里除彩虹的另一种颜色相同则两个气泡融合
                            if (selfCircleType === otherCircleType) { //气泡类型一样 位置高的往低处跑
                                if (selfPos.y > otherPos.y) { //我（双色）去对方（单色）
                                    for (const faceType in selfFaceData) {
                                        const faceInfo = selfFaceData[faceType];
                                        selfCircle.delFace(Number(faceType), otherCircle);
                                        otherCircle.addFaceInfo(Number(faceType), faceInfo);
                                    }
                                } else { //对方往我这飞
                                    const faceType = Number(Object.keys(otherFaceData)[0]); //两个气泡都有的face类型
                                    const faceInfo = selfFaceData[faceType + ''];
                                    otherCircle.delFace(faceType, selfCircle); //卸载对应的face 然后去
                                    selfCircle.addFaceInfo(faceType, faceInfo);
                                }
                            } else {
                                if (selfCircleType < otherCircleType) {
                                    for (const faceType in selfFaceData) {
                                        const faceInfo = selfFaceData[faceType];
                                        selfCircle.delFace(Number(faceType), otherCircle);
                                        otherCircle.addFaceInfo(Number(faceType), faceInfo);
                                    }
                                } else {
                                    const faceType = Number(Object.keys(otherFaceData)[0]); //两个气泡都有的face类型
                                    const faceInfo = selfFaceData[faceType + ''];
                                    otherCircle.delFace(faceType, selfCircle); //卸载对应的face 然后去
                                    selfCircle.addFaceInfo(faceType, faceInfo);
                                }
                            }

                        } else {  //单色和双色里除彩虹的另一种颜色不同，彩虹移动到表情数量更多的气泡中，一样多则移动到上面的气泡
                            const selfCount = this.getCountByFaceType(selfFaceType, selfFaceData);
                            const otherCount = this.getCountByFaceType(otherFaceType, otherFaceData);

                            if (otherCount > selfCount) { //对方face比自己非彩虹face多跑对方那
                                const faceInfo = selfFaceData[anyCircleType + ''];
                                selfCircle.delFace(anyCircleType, otherCircle);
                                otherCircle.addFaceInfo(anyCircleType, faceInfo);

                            } else if (selfCount === otherCount) { //一样多则移动到上面的气泡  如果双色在上则不动
                                if (selfPos.y < otherPos.y) { //我(双色)往对方飞（单色）
                                    const faceInfo = selfFaceData[anyCircleType + ''];
                                    selfCircle.delFace(anyCircleType, otherCircle);
                                    otherCircle.addFaceInfo(anyCircleType, faceInfo);
                                }
                            }

                        }

                    }


                }
            }
        }
    }

    onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {

    }


    //彩虹双色表情 非彩虹的face颜色大类
    getOtherFaceType(selfFaceData) {
        for (const faceType in selfFaceData) {
            if (Number(faceType) !== anyCircleType) {
                return Number(faceType);
            }
        }
    }

    getMaxCountFaceType(faceTypeData) {
        let maxCount = 0;
        let type = null;
        for (const faceType in faceTypeData) {
            const count = this.getCountByFaceType(Number(faceType), faceTypeData);
            if (count > maxCount) {
                maxCount = count;
                type = Number(faceType);
            }
        }

        return type;
    }

    //双色气泡和双色气泡交换 同色交换 锁定
    _lockFaceType = null;
    setLockFaceType(faceType: number) {
        this._lockFaceType = faceType;
    }

    getLockFaceType() {
        return this._lockFaceType;
    }

    checkHaveSameFace(selfCircle: ModelCircle, otherCircle: ModelCircle) {
        const selfFaceData = selfCircle.getFaceTypeData();
        const otherFaceData = otherCircle.getFaceTypeData();
        for (const faceType in selfFaceData) {
            if (otherFaceData[faceType]) {
                return true;
            }

            if (Number(faceType) === anyCircleType) { //只要有彩虹表情就有相同
                return true;
            }

        }

        for (const faceType in otherFaceData) {
            if (Number(faceType) === anyCircleType) { ////只要有彩虹表情就有相同
                return true;
            }
        }

        return false;
    }

    //双色气泡有几个相同表情
    checkAllSameFace(selfCircle: ModelCircle, otherCircle: ModelCircle) {
        const faceData = selfCircle.getFaceTypeData();
        const otherFaceData = otherCircle.getFaceTypeData();

        let count = 0;
        let data = [];
        for (const faceType in (otherFaceData as any)) {
            if (faceData[faceType]) {
                data.push(faceType);
                count++;
            }
        }
        return [count, data];
    }

    //判断是否可以自爆
    checkMaxBoom() {
        console.log('=========checkMaxBoom======ok===000=========', this.circleKindType, this.faceTypeData);
        if (this.circleKindType === CircleKindType.OneColor) { //单色并且数量达到上线 就会自爆
            const faceType = Number(Object.keys(this.faceTypeData)[0])
            const count = this.getCountByFaceType(faceType, this.faceTypeData);
            console.log('=========checkMaxBoom======ok====1111========', count, DataManager.dataBattle.circleMaxFaceCount[this.curCircleType]);

            if (count > DataManager.dataBattle.circleMaxFaceCount[this.curCircleType]) {
                this.destorySelf(true);
            }
        } else if (this.circleKindType === CircleKindType.TwoColor && this.faceTypeData[anyCircleType + '']) {
            // let count = this.getCountByFaceType(anyCircleType, this.faceTypeData);
            // let count = 0;
            // for (const faceType in this.faceTypeData) {
            //     if (Number(faceType) != anyCircleType) {
            //         count += this.getCountByFaceType(Number(faceType), this.faceTypeData);
            //         console.log('===12312312===getCountByFaceType=2=', this.getCountByFaceType(Number(faceType), this.faceTypeData))
            //         break;
            //     }
            // }

            const selfFaceType = this.getOtherFaceType(this.faceTypeData); //彩虹外另一个表情的颜色类型
            const count = this.getCountByFaceType(Number(selfFaceType), this.faceTypeData)

            console.log('=========checkMaxBoom======ok====2222========', count, DataManager.dataBattle.circleMaxFaceCount[this.curCircleType]);
            if (count > DataManager.dataBattle.circleMaxFaceCount[this.curCircleType]) {
                this.destorySelf(true);
            }
        }
    }


    //创建小球 type小球的类型   faceType大类 faceInfo :{faceId:count}
    async createFace(faceType: number, faceInfo: { [faceId: number]: number }) {
        console.log('===createFace===faceType===========', faceType, faceInfo);
        //更新数据
        this.addFaceInfo(faceType, faceInfo);

        const nodePrefab = await Manager.bundleManager.load<Prefab>("model://face", Prefab);
        if (!nodePrefab) {
            console.error("create new face error");
            return;
        }


        let addCount = 0;
        for (const faceId in faceInfo) {
            const count = faceInfo[faceId];
            addCount += Number(count);
            for (let i = 0; i < count; i++) {
                const distanceJoint2D = this.node.addComponent(DistanceJoint2D);

                const maxLength = this.node.getComponent(UITransform).width / 2 - DataManager.dataBattle.faceSize / 2 - 5; //气泡半径 - 小球半径 - N 

                const node = instantiate(nodePrefab);
                node.parent = this.faceParent;
                node.name = 'face';
                node.getComponent(ModelFace).setFaceType(faceType);
                node.getComponent(ModelFace).setFaceId(Number(faceId));
                const faceConfig = Config.Face[faceId];
                node.getComponent(ModelFace).setFaceKind(faceConfig.faceKind);
                node.getComponent(ModelFace).setRadius(DataManager.dataBattle.faceSize / 2);
                node.getComponent(ModelFace).setFaceImage();

                node.attr({ compoent: distanceJoint2D, faceType: faceType });
                node.setPosition(getRandomInt(-maxLength, maxLength), getRandomInt(-maxLength, maxLength));
                distanceJoint2D.connectedBody = node.getComponent(RigidBody2D);
                distanceJoint2D.autoCalcDistance = false;  //不自动计算两个刚体距离
                distanceJoint2D.maxLength = maxLength; //设置最长距离
                distanceJoint2D.collideConnected = false;
                distanceJoint2D.name = 'distanceJoint2D';
                distanceJoint2D.apply();
            }
        }


        console.log('======createface ok========', faceType, faceInfo);
        //判断是否可以自爆 刚创建的是否有必要判断 待定
        this.checkMaxBoom();
    }

    addFaceInfo(faceType: number, faceInfo: { [faceId: string]: number }) {
        if (!this.faceTypeData[faceType + '']) {
            this.faceTypeData[faceType + ''] = {};
        }

        for (const faceId in faceInfo) {
            if (!this.faceTypeData[faceType + ''][faceId + '']) {
                this.faceTypeData[faceType + ''][faceId + ''] = 0;
            }
            this.faceTypeData[faceType + ''][faceId + ''] += Number(faceInfo[faceId]);
        }

        this.circleKindType = Object.keys(this.faceTypeData).length; //重新设置颜色类型
        console.log(convertToWorldSpaceAR(this.node), "==========addFaceInfo======", JSON.stringify(this.faceTypeData));
    }

    //添加表情数据
    // addFaceInfo2(type: number, addCount: number, faceInfo: { [faceId: number]: number }) {
    //     console.log('=============addFaceInfo=====start===1=======', this.curFaceTypeInfo)
    //     console.log('=============addFaceInfo=====start===2=======', type, addCount)
    //     if (!this.curFaceTypeInfo[type + '']) {
    //         this.curFaceTypeInfo[type + ''] = addCount;
    //     } else {
    //         const count = Number(this.curFaceTypeInfo[type + '']);
    //         this.curFaceTypeInfo[type + ''] = count + addCount;
    //     }
    //     this.circleKindType = Object.keys(this.curFaceTypeInfo).length; //重新设置颜色类型
    //     console.log('=============addFaceInfo====eeeee===========', this.curFaceTypeInfo)
    //     for (const faceId in faceInfo) {
    //         if (!this.faceIdCountInfo[faceId]) {
    //             this.faceIdCountInfo[faceId] = 0;
    //         }
    //         this.faceIdCountInfo[faceId] += faceInfo[faceId];
    //     }
    //     //=================================={faceType:{faceId:count},...}====================================
    //     if (!this.faceTypeData[type + '']) {
    //         this.faceTypeData[type + ''] = {};
    //     }
    //     for (const faceId in faceInfo) {
    //         if (!this.faceTypeData[type + ''][faceId + '']) {
    //             this.faceTypeData[type + ''][faceId + ''] = 0;
    //         }
    //         this.faceTypeData[type + ''][faceId + ''] += Number(faceInfo[faceId]);
    //     }
    //     console.log(convertToWorldSpaceAR(this.node), "============121212=======11=======", JSON.stringify(this.curFaceTypeInfo));
    //     console.log(convertToWorldSpaceAR(this.node), "============121212=======22=======", JSON.stringify(this.faceIdCountInfo));
    //     console.log(convertToWorldSpaceAR(this.node), "============121212=======33=======", JSON.stringify(this.faceTypeData));
    // }

    //只是添加表情
    addFaceOnly(nodeFace: Node, isEnd: boolean = false) {
        console.log('=======addFaceOnly===============', isValid(this.node))
        if (!isValid(this.node)) {
            return;
        }
        const distanceJoint2D = this.node.addComponent(DistanceJoint2D);
        const maxLength = this.node.getComponent(UITransform).width / 2 - DataManager.dataBattle.faceSize / 2 - 4; //气泡半径 - 小球半径 - 4
        const modelFace = nodeFace.getComponent(ModelFace);
        nodeFace.attr({ compoent: distanceJoint2D, faceType: modelFace.getFaceType(), createTime: Date.now() });
        nodeFace.setPosition(getRandomInt(-maxLength, maxLength), getRandomInt(-maxLength, maxLength));

        distanceJoint2D.connectedBody = nodeFace.getComponent(RigidBody2D);
        distanceJoint2D.autoCalcDistance = false;  //不自动计算两个刚体距离
        distanceJoint2D.maxLength = maxLength; //设置最长距离
        distanceJoint2D.collideConnected = false;
        distanceJoint2D.name = 'distanceJoint2D';
        distanceJoint2D.apply();

        nodeFace.getComponent(CircleCollider2D).sensor = false;
        const maxCount = DataManager.dataBattle.circleMaxFaceCount[this.curCircleType];

        let count = 0;
        this.node.components.forEach((component) => {
            if (component.name === 'distanceJoint2D') {
                count++;
            }
        })
        if (count > maxCount) {
            nodeFace.getComponent(CircleCollider2D).sensor = true;
        }
        nodeFace.getComponent(CircleCollider2D).apply();

        if (isEnd) {
            console.log("===============isEnd=======checkmaxboom===========", this.curCircleType)
            this.checkMaxBoom();
        }
    }

    //删除指定类型的表情 targetCircle 移动到目标气泡
    delFace(faceType: number, targetCircle?: ModelCircle, checkBoom: boolean = true) {
        if (!this.faceTypeData[faceType + '']) {
            return;
        }
        console.log('==========delFace========', faceType)
        //必须下一帧删除 或者更改父节点
        eventAfterPhysics(() => {
            let nodes = [];

            for (let i = 0; i < this.faceParent.children.length; i++) {
                const nodeFace: Node = this.faceParent.children[i];
                if ((nodeFace as any).faceType == faceType) {
                    nodes.push(this.faceParent.children[i]);
                } else {
                    //如果双色超过上限 然后其中一个颜色被吸走 留下的不超过上限了，会有几个是传感器 把他们全部激活
                    nodeFace.getComponent(CircleCollider2D).sensor = false; //留下来的全部打开碰撞
                    nodeFace.getComponent(CircleCollider2D).apply();
                }
            }

            for (let i = nodes.length - 1; i >= 0; i--) {
                const nodeFace: Node = nodes[i];
                destroyFaceJoint(nodeFace); //先删除DistanceJoint2D组件
                if (targetCircle) { //有目标气泡 则飞过去
                    // console.log('==========nodeFace==========', nodeFace.parent)
                    const pos = convertToWorldSpaceAR(nodeFace);

                    const newPos = convertToNodeSpaceAR(pos, targetCircle.node);
                    nodeFace.parent = targetCircle.node.getChildByName('faceParent'); //一定要把face节点放到 对方的faceParent节点下
                    nodeFace.setPosition(newPos.x, newPos.y);
                    nodeFace.getComponent(CircleCollider2D).sensor = true;
                    nodeFace.getComponent(CircleCollider2D).apply();

                    Tween.stopAllByTarget(nodeFace);
                    tween(nodeFace).to(0.3, { position: v3(0, 0, 0) }).call(() => {
                        targetCircle.addFaceOnly(nodeFace, i === 0); //加到对方气泡上（数据已经先加了）
                    }).start();

                    const func = async () => {
                        //技能face加粒子
                        if (nodeFace.getComponent(ModelFace).getFaceKind() === FaceKindType.SkillFace) {
                            const faceType = nodeFace.getComponent(ModelFace).getFaceType();
                            const nodeLizi = await createLizi(PerticleType.FaceFly, faceType);
                            nodeLizi.parent = this.node;
                            nodeLizi.setSiblingIndex(-1);
                            tween(nodeLizi).delay(0.3).destroySelf().start();
                        }
                    }
                    func();

                } else {
                    nodeFace.destroy();
                }

            }
        })

        // console.log('==delface ==1==', this.curFaceTypeInfo)
        // delete this.curFaceTypeInfo[faceType + ''];
        // console.log('==delface ==2==', this.curFaceTypeInfo)
        // this.circleKindType = Object.keys(this.curFaceTypeInfo).length; //重新设置颜色类型

        // for (const faceId in this.faceIdCountInfo) {
        //     const faceConfig: Face = DataManager.dataBattle.faceConfig[faceId];
        //     if (faceConfig.faceType === faceType) {
        //         delete this.faceIdCountInfo[faceId];
        //     }
        // }
        delete this.faceTypeData[faceType + '']; //删除 faceType对应的详细信息
        this.circleKindType = Object.keys(this.faceTypeData).length; //重新设置颜色类型

        console.log(this.node.name, '=======delFace==========', this.circleKindType);
        if (checkBoom) {
            if (this.circleKindType === CircleKindType.Null) { //被吸走没有表情了 销毁
                console.log(convertToWorldSpaceAR(this.node), '========delFace=====没有表情了=========', this.node.name)
                this.destorySelf(false);
            } else { //双色被吸走还剩一个 也要检查是否可以自爆
                this.checkMaxBoom();
            }
        }



    }

    //获取某一个颜色大类的数量  _faceType 不能是 彩虹色类型 会重复计算
    getCountByFaceType(_faceType: number, faceTypeData: {}) {
        let count = 0

        let func = (object) => {
            let number = 0;
            for (const faceId in object) {
                number += Number(object[faceId]);
            }
            return number;
        }

        if (faceTypeData[_faceType + '']) {
            count += func(faceTypeData[_faceType + '']);
        }

        if (_faceType !== anyCircleType) {
            if (this.faceTypeData[anyCircleType + '']) {
                count += func(faceTypeData[anyCircleType + '']);
            }
        }

        return count;
    }

    //气泡自爆  isFull 自爆 要收集的或散开   warnBoom 是否是警戒线200以内爆炸
    destorySelf(isFull: boolean = false, warnBoom: boolean = false) {
        if (!this.node || !isValid(this.node)) {
            console.error('=destorySelf====isNotValid======')
            return;
        }
        
        if (convertToWorldSpaceAR(this.node).y < 0) {
            console.warn('============气泡在屏幕外消除============', convertToWorldSpaceAR(this.node))
        }

        if (this.curState === CircleState.Delete) {
            console.warn('=======已经销毁了=======');
            return;
        }
        console.log('==============destorySelf===========================')
        //播放自爆动画 然后销毁 必须下一帧销毁
        this.circleKindType = CircleKindType.Null; //这个可以作为销毁标记 
        // this.curFaceTypeInfo = {}; 
        this.faceTypeData = {};//清空数据
        this.setState(CircleState.Delete); //自爆状态

        eventAfterPhysics(() => {
            // this.setRigidBodyType(ERigidBody2DType.Static);

            for (let i = 0; i < this.faceParent.children.length; i++) {
                const faceNode = this.faceParent.children[i];
                faceNode.getComponent(CircleCollider2D).sensor = false;
                faceNode.getComponent(CircleCollider2D).apply();
            }

            if (isFull) {
                this.node.getChildByName('circle').active = false;
                this.spine.node.active = true;
                this.spine.getComponent(SuperSpine).playSpine('boom', false);
                //播放自爆动画 然后消失

                tween(this.faceParent)
                    .to(G_getSpineFps() * 4, { scale: v3(1.3, 1.3, 1) })
                    .to(G_getSpineFps() * 3, { scale: v3(1.0, 1.0, 1) })
                    .to(G_getSpineFps() * 4, { scale: v3(1.4, 1.4, 1) })
                    .to(G_getSpineFps() * 2, { scale: v3(1.1046, 1.1046, 1) })
                    .to(G_getSpineFps() * 4, { scale: v3(1.35, 1.35, 1) })
                    .to(G_getSpineFps() * 3, { scale: v3(1.2, 1.2, 1) })
                    .to(G_getSpineFps() * 5, { scale: v3(1.7, 1.7, 1) })
                    .to(G_getSpineFps() * 10, { scale: v3(1.375, 1.375, 1) })
                    .delay(G_getSpineFps() * 1)
                    .start();

                tween(this.node)
                    .delay(G_getSpineFps() * 29)
                    .call(() => {
                        if (!this.node || !isValid(this.node) || !this.node.parent) {
                            console.error('=destorySelf====isNotValid======')
                            return;
                        }

                        // this.setRigidBodyType(ERigidBody2DType.Kinematic);  //不设置静止不动了 会挡住上面的球下落
                        // this.node.getComponent(CircleCollider2D).apply();

                        //爆炸一瞬间  小球飞到收集区或者四散开来 有词条字的飞到词条收集区
                        let collectWord = [];
                        let posArray = [];
                        let nodes = [];
                        for (let i = 0; i < this.faceParent.children.length; i++) {
                            const faceNode = this.faceParent.children[i];
                            nodes.push(faceNode);

                            if ((faceNode as any).compoent) {
                                destroyFaceJoint(faceNode); //删除DistanceJoint2D组件
                            }

                            const faceId = faceNode.getComponent(ModelFace).getFaceId();
                            console.log('=============boom ===faceId========================', faceId)
                            const circleWorldPos = convertToWorldSpaceAR(this.node);
                            const faceWorldPos = convertToWorldSpaceAR(faceNode);
                            const faceWordPos = convertToWorldSpaceAR(faceNode);
                            posArray.push([faceId, faceWordPos]);
                            const faceConfig: Face = DataManager.dataBattle.faceConfig[faceId];
                            if (!warnBoom && faceConfig.skillId) { //含有技能id
                                const skillId = faceConfig.skillId;
                                const skillConfig: Skill = Config.Skill[skillId];
                                const skillPosType = skillConfig.skillPosType;

                                let skillconfig = Utils.utils.deepClone(SkillDefine.skillConfig[skillId]);
                                if (skillPosType === SkillPosType.Circle) {  //如果是实际位置 就指定一个坐标
                                    skillconfig.position = v3(circleWorldPos.x, circleWorldPos.y, 0); //注意有的技能中心点是气泡中心点 有的是表情位置 有的是屏幕的位置
                                } else if (skillPosType === SkillPosType.Face) {
                                    skillconfig.position = v3(faceWorldPos.x, faceWorldPos.y, 0);
                                }
                                DataManager.dataSkill.addSkillQueue([PropType.Skill, faceId, skillconfig]);
                            }
                            //有词条字体需要收集
                            const wordId = DataManager.dataSkill.checkWordByFaceId(faceId);
                            if (wordId) {
                                collectWord.push([faceId, faceWorldPos]);
                                // DataManager.dataSkill.addWordZi(faceId, 1); //收集区数据加入 改为飞到了再加数据
                            }

                            faceNode.getComponent(CircleCollider2D).sensor = true;
                            faceNode.getComponent(CircleCollider2D).apply();
                        }

                        if (!warnBoom) {
                            this.dispatchEmit(UI_EVENT_NAME.CIRCLE_FULL_BOOM, this.faceParent.children.length, convertToWorldSpaceAR(this.node), this.curCircleType); //向加锁的障碍物广播自爆
                        }
                        //warnBoom时 不收集
                        this.dispatchEmit(UI_EVENT_NAME.COLLECTION_FACE, nodes, warnBoom) //通知battle的收集栏收集face

                        if (collectWord.length > 0) { //有词条字要收集
                            this.dispatchEmit(UI_EVENT_NAME.COLLECTION_WORD, collectWord);
                        }

                        //所有face 飞向收集区或者区域外
                        this.faceParent.removeAllChildren(); //删除所有face
                        Manager.audioManager.playShock(); //手机震动

                        eventAfterPhysics(() => {
                            if (isValid(this.node)) {
                                this.node.destroy();
                            }
                            DataManager.dataBattle.checkGuide(GuideType.Help_Tip_2);
                        })

                        Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_BubbleBreak');  //气泡碎裂音效
                    })
                    .start()
            } else {
                this.faceParent.removeAllChildren(); //删除所有face
                tween(this.node).to(0.2, { scale: v3(0.1, 0.1) }).call(() => {
                    eventAfterPhysics(() => {
                        if (isValid(this.node)) {
                            this.node.destroy();
                        }
                    })
                }).start()

            }
        })
    }

    //双色爆炸一个类型的表情 技能正常播放
    destoryFaceType(faceType: number) {
        if (!this.node || !this.node.isValid) {
            return;
        }

        if (this.circleKindType !== CircleKindType.TwoColor) {
            console.error('=======destoryFaceType======error===============', this.circleKindType)
            return;
        }

        //播放自爆动画 然后销毁 必须下一帧销毁
        this.circleKindType = CircleKindType.OneColor; //这个可以作为销毁标记 
        delete this.faceTypeData[faceType + ''];//清数据
        eventAfterPhysics(() => {
            for (let i = 0; i < this.faceParent.children.length; i++) {
                const faceNode = this.faceParent.children[i];
                faceNode.getComponent(CircleCollider2D).sensor = false;
                faceNode.getComponent(CircleCollider2D).apply();
            }

            //爆炸一瞬间  小球飞到收集区或者四散开来 有词条字的飞到词条收集区
            let collectWord = [];
            // let posArray = [];
            let nodes = [];
            for (let i = 0; i < this.faceParent.children.length; i++) {
                const faceNode = this.faceParent.children[i];
                const faceId = faceNode.getComponent(ModelFace).getFaceId();

                const faceConfig: Face = Config.Face[faceId];
                if (faceConfig.faceType === faceType) {
                    nodes.push(faceNode);

                    if ((faceNode as any).compoent) {
                        destroyFaceJoint(faceNode); //删除DistanceJoint2D组件
                    }

                    console.log('=============boom ===faceId========================', faceId)
                    const circleWorldPos = convertToWorldSpaceAR(this.node);
                    const faceWorldPos = convertToWorldSpaceAR(faceNode);
                    const faceWordPos = convertToWorldSpaceAR(faceNode);
                    // posArray.push([faceId, faceWordPos]);

                    if (faceConfig.skillId) { //含有技能id
                        const skillId = faceConfig.skillId;
                        const skillConfig: Skill = Config.Skill[skillId];
                        const skillPosType = skillConfig.skillPosType;

                        let skillconfig = Utils.utils.deepClone(SkillDefine.skillConfig[skillId]);
                        if (skillPosType === SkillPosType.Circle) {  //如果是实际位置 就指定一个坐标
                            skillconfig.position = v3(circleWorldPos.x, circleWorldPos.y, 0); //注意有的技能中心点是气泡中心点 有的是表情位置 有的是屏幕的位置
                        } else if (skillPosType === SkillPosType.Face) {
                            skillconfig.position = v3(faceWorldPos.x, faceWorldPos.y, 0);
                        }
                        DataManager.dataSkill.addSkillQueue([PropType.Skill, faceId, skillconfig]);
                    }
                    //有词条字体需要收集
                    const wordId = DataManager.dataSkill.checkWordByFaceId(faceId);
                    if (wordId) {
                        collectWord.push([faceId, faceWorldPos]);
                        DataManager.dataSkill.addWordZi(faceId, 1); //收集区数据加入
                    }

                    faceNode.getComponent(CircleCollider2D).sensor = true;
                    faceNode.getComponent(CircleCollider2D).apply();
                }
            }

            this.dispatchEmit(UI_EVENT_NAME.CIRCLE_FULL_BOOM, nodes.length, convertToWorldSpaceAR(this.node), this.curCircleType); //向加锁的障碍物广播自爆
            this.dispatchEmit(UI_EVENT_NAME.COLLECTION_FACE, nodes, false) //通知battle的收集栏收集face

            if (collectWord.length > 0) { //有词条字要收集
                this.dispatchEmit(UI_EVENT_NAME.COLLECTION_WORD, collectWord);
            }

            Manager.audioManager.playShock(); //手机震动
        })
    }

    update(deltaTime: number) {
        // if (this.getState() === CircleState.Pool) {
        //     const linearVelocity = this.node.getComponent(RigidBody2D).linearVelocity;
        //     console.log('==============fasdf======', linearVelocity.x, linearVelocity.y);
        // }
    }


    getAllFaceId() {
        let info = {};
        for (const faceType in this.faceTypeData) {
            const faceInfo = this.faceTypeData[faceType];
            for (const faceId in faceInfo) {
                info[faceId] === faceInfo[faceId];
            }
        }
        return info;
    }


    getAllFaceCount() {
        let count = 0;
        for (const faceType in this.faceTypeData) {
            const faceInfo = this.faceTypeData[faceType];
            for (const faceId in faceInfo) {
                count += Number(faceInfo[faceId])
            }
        }
        return count;
    }

    getFaceParent() {
        return this.faceParent;
    }

    setCircleAnim(_type: CircleAnimType, interver: number = 0) {
        if (_type === CircleAnimType.Anim) {
            this.setAnimation('scan', interver);
        } else if (_type === CircleAnimType.Spine) {
            this.setSpine('UI_Vortex');
        }
    }

    //设置circle上的spine
    private async setSpine(name: string) {
        const path = `model://spine/${name}`;
        console.log('=====setSpine=====spine========', path);
        const skeletonData: sp.SkeletonData = await Manager.bundleManager.load<sp.SkeletonData>(path, sp.SkeletonData);
        if (this.node && this.node.isValid) {
            this.spine2.active = true;
            this.spine2.getComponent(sp.Skeleton).skeletonData = skeletonData;

            if (name === 'UI_Vortex') { //特殊 颜色转换spine 0.8
                this.spine2.getComponent(SuperSpine).setSpineTimeScale(0.8);
            }

            this.spine2.getComponent(SuperSpine).playSpine('idle', false, () => {
                this.spine2.getComponent(sp.Skeleton).skeletonData = null;
            });

        }
    }

    //设置动画  interver 间隔多久播一次 单位 秒
    private async setAnimation(name: string, interver: number = 0) {
        const path = `model://animation/${name}`;
        console.log('=====setSpine=====spine========', path);

        const aniName = 'animation_' + name;

        if (!this.node.getChildByName(aniName)) {
            const prefab: Prefab = await Manager.bundleManager.load<Prefab>(path, Prefab);
            if (this.node && this.node.isValid) {
                const scan = instantiate(prefab);
                scan.parent = this.node;
                scan.name = 'animation_' + name;
                scan.active = true;

                const faceSize = DataManager.dataBattle.faceSize;
                const scale = 64 / faceSize;
                console.log('==========setAnimation========scaale====', scale)
                scan.setScale(scale, scale, 1);
            }
        }

        this.unschedule(this._func);
        this._func = () => {
            const animNode = this.node.getChildByName(aniName);
            animNode.getComponent(SuperAnimation).play();
        }
        if (interver > 0) {
            this.schedule(this._func, interver + 1, macro.REPEAT_FOREVER);
        }
    }

    //转换色技能
    transfromColorOperation(_type: number) {
        this.scheduleOnce(() => {
            console.log('==========transfromColorOperation=======', _type);
            // this.transforColor = _type;
            // this.scheduleOnce(() => {
            //     this.transforColor = 0;
            // }, 0.2);
            this.checkContact();
        }, 0.3);
    }

    checkContact() {
        console.log('==========checkContact====0====')

        const selfWordPos = convertToWorldSpaceAR(this.node);
        const selfCircleType = this.getCircleType();
        const parentNode = DataManager.dataBattle.boxNode;

        const selfData = this.getFaceTypeData();

        for (let i = 0; i < parentNode.children.length; i++) {
            const circleNode = parentNode.children[i];
            const modelCircle = circleNode.getComponent(ModelCircle);
            const otherWordPos = convertToWorldSpaceAR(circleNode);
            const nowDistance = Vec2.len(v2(selfWordPos.x - otherWordPos.x, selfWordPos.y - otherWordPos.y));
            if (modelCircle.stillExist() && modelCircle.getState() === CircleState.Pool && nowDistance > 5) {

                console.log('==========checkContact===检测====', convertToWorldSpaceAR(circleNode));

                const circleType = circleNode.getComponent(ModelCircle).getCircleType();
                const otherCircleData = modelCircle.getFaceTypeData();
                const maxDistance = DataManager.dataBattle.circleSize[selfCircleType] / 2 + DataManager.dataBattle.circleSize[circleType] / 2;


                if (nowDistance <= maxDistance + 1) { //给1像素富裕
                    console.log('==========checkContact===1====', nowDistance, maxDistance)
                    console.log('===========checkContact======2===============', JSON.stringify(selfData));
                    console.log('===========checkContact=====3===============', JSON.stringify(otherCircleData));
                    this.onBeginContact(this.collider, circleNode.getComponent(CircleCollider2D), null);
                    this.onBeginContact(circleNode.getComponent(CircleCollider2D), this.collider, null);
                }
            }


        }
    }

}


