import { _decorator, CircleCollider2D, Collider2D, Component, Contact2DType, DistanceJoint2D, ECollider2DType, Enum, ERigidBody2DType, instantiate, IPhysics2DContact, Node, PhysicsGroup, Prefab, RigidBody2D, size, Sprite, SpriteFrame, Texture2D, UITransform } from 'cc';
import { SuperComponent } from '../frame/center/components/super-component';
import { CircleState, UI_EVENT_NAME } from '../game/constant/common-define';
import { changeParent, convertToWorldSpaceAR } from '../game/ui-commonset';
import { tween } from 'cc';
import { v3 } from 'cc';
import { v2 } from 'cc';
import { eventAfterPhysics } from '../game/common';

const { ccclass, property } = _decorator;

//锁住的气泡 只占地方
@ccclass('ModelCloud')
export class ModelCloud extends SuperComponent {
    @property({
        type: Prefab,
    })
    prefabIce: Prefab = null;

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
        displayName: '',
        readonly: true,
    })
    todo: string = '=========以下由策划配置========';

    @property({
        type: Number,
    })
    shootCount: number = 7;

    @property({
        type: Number,
    })
    iceCount: number = 5;

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
    }

    addShootCount() {
        console.log('=======addShootCount=========1===============', convertToWorldSpaceAR(this.node).y)
        if (convertToWorldSpaceAR(this.node).y < 0) {
            return;
        }

        this._addCount++;

        if (this._addCount >= this.shootCount) {

            const xx = this.node.position.x;
            const yy = this.node.position.y;
            tween(this.node).to(0.5, { position: v3(0, yy, 0) }).delay(0.5).call(() => {
                this.createNewIce(() => {
                    tween(this.node).to(0.5, { position: v3(-xx, yy, 0) }).call(() => {
                        this.node.destroy();
                    }).start();
                });
            }).start();
            // this._addCount = 0;
        }
    }

    async createNewIce(callBack) {
        for (let i = 0; i < this.iceCount; i++) {
            const nodeIce = instantiate(this.prefabIce);
            nodeIce.parent = this.nodeCirclePos;
            nodeIce.setPosition(-150 + Math.random() * 300, 0, 0);
            nodeIce.active = false;

            nodeIce.getComponent(RigidBody2D).type = ERigidBody2DType.Static;
            tween(nodeIce).delay(i * 1).call(() => {
                nodeIce.active = true;
                nodeIce.getComponent(RigidBody2D).type = ERigidBody2DType.Dynamic;
            }).delay(1.5).call(() => {
                eventAfterPhysics(() => {
                    changeParent(nodeIce, this.node.parent.parent.getChildByName('node_fall_barrier'));
                })

                if (i === this.iceCount - 1) {
                    if (callBack) {
                        callBack();
                        callBack = null;
                    }
                }
            }).start();
        }
    }



    update(deltaTime: number) {

    }

}


