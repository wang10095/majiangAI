import { _decorator, CircleCollider2D, Collider2D, Component, Contact2DType, DistanceJoint2D, ECollider2DType, Enum, ERigidBody2DType, instantiate, IPhysics2DContact, Node, PhysicsGroup, Prefab, RigidBody2D, size, Sprite, SpriteFrame, Texture2D, UITransform } from 'cc';
import { SuperComponent } from '../frame/center/components/super-component';
import { CircleState, UI_EVENT_NAME } from '../game/constant/common-define';
import { Label } from 'cc';
import { DataManager } from '../game/data/data-manager';
import Utils from '../frame/center/utils/utils';
import { ModelCircle } from './model-circle';
import { Manager } from '../frame/center/manager';
import { changeParent, convertToNodeSpaceAR, convertToWorldSpaceAR } from '../game/ui-commonset';
import { tween } from 'cc';
import { v3 } from 'cc';
import { v2 } from 'cc';
import { eventAfterPhysics } from '../game/common';

const { ccclass, property } = _decorator;

//锁住的气泡 只占地方
@ccclass('ModelPipeLine')
export class ModelPipeLine extends SuperComponent {
    @property({
        type: Node,
    })
    content: Node = null;

    @property({
        type: Node,
        tooltip: '发射的位置'
    })
    nodeCirclePos: Node = null;

    @property({
        type: Label,
        tooltip: '每发射几次管道弹出一个气泡'
    })
    labCount: Label = null;

    @property({
        displayName: '',
        readonly: true,
    })
    todo: string = '=========以下由策划配置========';

    @property({
        type: Number,
    })
    shootCount: number = 7;

    _addCount: number = 0;
    onLoad(): void {
        super.onLoad();

        this.registerEmit([
            UI_EVENT_NAME.CIRCLE_SHOOT,
        ], [
            this.addShootCount,
        ], this);
    }

    start() {
        super.start();

        this.labCount.string = this.shootCount + '';
    }

    addShootCount() {
        console.log('=======addShootCount=========1===============', convertToWorldSpaceAR(this.node).y)
        if (convertToWorldSpaceAR(this.node).y < 0) {
            return;
        }

        this._addCount++;
        this.labCount.string = this.shootCount - this._addCount + '';

        if (this._addCount >= this.shootCount) {
            let info = null
            if (DataManager.dataBattle.curStage === 1) {
                const game_had_teach = Utils.storage.getItem('game_had_teach');
                if (game_had_teach) {
                    info = DataManager.dataBattle.getNewCircleData2();
                } else {
                    info = DataManager.dataBattle.getNewCircleData();
                }
            } else {
                info = DataManager.dataBattle.getNewCircleData2(); //随机获取一个新的data
            }


            this.createNewCircle(info);
            this._addCount = 0;
        }

    }

    async createNewCircle(info) {
        const circleType: number = info[0];
        const data: any = info[1];
        const circle: Node = await this.createCircle(circleType, this.nodeCirclePos);
        circle.getComponent(ModelCircle).setRigidBodyType(ERigidBody2DType.Kinematic); //刚创建设置static类型
        //faceType 是 属于哪个表情大类
        for (const faceType in data) {
            const faceInfo = data[faceType];
            circle.getComponent(ModelCircle).createFace(Number(faceType), faceInfo);
        }

        circle.getComponent(ModelCircle).setState(CircleState.Lock);
        circle.getComponent(CircleCollider2D).sensor = true; //刚创建的气泡设置为传感器


        let moveX = 0;
        const pipeLineWidth = 134; //管道横截面宽度
        if (DataManager.dataBattle.circleSize[circleType] > 134) {
            const radius = DataManager.dataBattle.circleSize[circleType] / 2;
            moveX = Math.sqrt(radius * radius - (pipeLineWidth / 2) * (pipeLineWidth / 2))
        }

        circle.active = false;
        eventAfterPhysics(() => {
            tween(circle).call(() => {
                circle.active = true;
            }).set({ scale: v3(0.2, 0.2, 1) }).to(0.3, { scale: v3(1, 1, 1), position: v3(-moveX, 0, 0) }).call(() => {
                eventAfterPhysics(() => {
                    changeParent(circle, DataManager.dataBattle.boxNode);
                    //发射出去
                    const yy = 30;
                    const angle = this.content.angle; //角度

                    console.log('======angle========', angle)

                    const hudu = angle * (Math.PI / 180);
                    const xx = yy / Math.tan(hudu);
                    circle.getComponent(RigidBody2D).linearVelocity = v2(-xx, -yy);

                    circle.getComponent(ModelCircle).setRigidBodyType(ERigidBody2DType.Dynamic);
                    circle.getComponent(ModelCircle).setState(CircleState.Pool);
                    circle.getComponent(CircleCollider2D).sensor = false; //刚创建的气泡设置为传感器
                })


                this.labCount.string = this.shootCount + '';
            }).start();
        })


    }

    //根据气泡类型创建气泡刚体
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

        return node;
    }

    update(deltaTime: number) {

    }

}


