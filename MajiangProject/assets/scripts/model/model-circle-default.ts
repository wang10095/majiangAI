import { _decorator, CircleCollider2D, Collider2D, Component, Contact2DType, DistanceJoint2D, ECollider2DType, Enum, ERigidBody2DType, instantiate, IPhysics2DContact, Node, PhysicsGroup, Prefab, RigidBody2D, size, Sprite, SpriteFrame, Texture2D, UITransform } from 'cc';
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

//锁住的气泡 只占地方
@ccclass('ModelCircleDefault')
export class ModelCircleDefault extends SuperComponent {

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
    }

    start() {
        super.start();
        this.initCircle();
    }

    async initCircle() {
        let parentNode = this.node.parent;

        //第一小关直接加在boxNode上
        // if (DataManager.dataBattle.curLittleStage === 1) {
        //     parentNode = DataManager.dataBattle.boxNode; // ???????
        // }
        await this.createCircle(this.circleType, parentNode);
        this.node.destroy();
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
        node.getComponent(ModelCircle).setState(CircleState.Pool); //进入池子
        node.getComponent(ModelCircle).setDefault(); //设置为初始创建气泡
        node.getComponent(RigidBody2D).allowSleep = false;

        console.log('===wakeUpBody===1==========')

        const wordPos = convertToWorldSpaceAR(this.node);
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
                let faceIdN = Number(faceId);
                if (faceIdN < 2000) { //氛围表情
                    faceIdN = Config.FaceType[faceType].simplefaceIdArray[0];
                }
                const count = Number(faceCountArray[idx]);
                node.getComponent(ModelCircle).createFace(faceType, { [faceIdN]: count });
            })
        }
        return node;
    }

    update(deltaTime: number) {

    }

}


