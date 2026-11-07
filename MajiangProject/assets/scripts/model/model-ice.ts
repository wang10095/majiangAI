import { _decorator, AudioSource, CircleCollider2D, Collider2D, Component, Contact2DType, DistanceJoint2D, ECollider2DType, ERigidBody2DType, HeightField, instantiate, Intersection2D, IPhysics2DContact, Node, PhysicsGroup, PolygonCollider2D, Prefab, Rect, RigidBody2D, size, Sprite, SpriteFrame, Texture2D, UITransform, v2, Vec2 } from 'cc';
import { SuperComponent } from '../frame/center/components/super-component';

import { ModelCircle } from './model-circle';
import { CircleState, GroupType, UI_EVENT_NAME } from '../game/constant/common-define';
import { BoxCollider2D } from 'cc';
import { Label } from 'cc';
import { sp } from 'cc';
import { SuperSpine } from '../frame/center/components/super-spine';
import { eventAfterPhysics } from '../game/common';
import { convertToWorldSpaceAR } from '../game/ui-commonset';
import { DataManager } from '../game/data/data-manager';
import Utils from '../frame/center/utils/utils';
import { Manager } from '../frame/center/manager';
const { ccclass, property } = _decorator;

//冰块 
@ccclass('ModelIce')
export class ModelIce extends SuperComponent {
    @property({
        type: PolygonCollider2D
    })
    collider: PolygonCollider2D = null;

    @property({
        type: sp.Skeleton
    })
    spine: sp.Skeleton = null;

    @property({
        tooltip: '被爆几次后消失'
    })
    boomNumber: number = 0;

    _boomNum: number = 0;

    onLoad(): void {
        super.onLoad();

        this.registerEmit([
            UI_EVENT_NAME.CIRCLE_FULL_BOOM,
        ], [
            (num: number, wordPos, curCircleType: number) => {
                const size = DataManager.dataBattle.circleSize[curCircleType];
                let transform = this.node.getComponent(UITransform);
                const selfWordPos = convertToWorldSpaceAR(this.node);

                let rect = new Rect();
                rect.x = selfWordPos.x
                rect.y = selfWordPos.y;
                rect.width = transform.width;
                rect.height = transform.height;
                const had = Utils.intersect.rectCircle(rect, wordPos, size / 2 + 20);
                if (had) {
                    this.delBoomNum(1);
                }
            }
        ], this)

        this.initBoomNum(this.boomNumber);
    }



    // boom boom1 idle idle1
    start() {
        super.start();

        // this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        // this.collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);

        this.spine.getComponent(SuperSpine).playSpine('idle', false);
    }

    initBoomNum(num: number) {
        this._boomNum = num;
        this.node.getChildByName('count').getComponent(Label).string = this._boomNum + '';
    }

    delBoomNum(num: number = 1) {
        this._boomNum -= num;
        this.node.getChildByName('count').getComponent(Label).string = this._boomNum + '';

        if (this._boomNum === 1) {
            this.spine.getComponent(SuperSpine).playSpine('boom', false, () => {
                this.spine.getComponent(SuperSpine).playSpine('idle1', false);
            });
        }

        if (this._boomNum == 0) {
            Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_IceCubeBreak');
            this.spine.getComponent(SuperSpine).playSpine('boom1', false, () => {
                eventAfterPhysics(() => {
                    this.node.destroy();
                })
            });
        }
    }

    //radius 半径 
    setSize(width: number, height: number) {
        this.node.getComponent(UITransform).setContentSize(size(width, height));

        // this.collider.size = size(width, height);
        // this.collider.apply();
    }

    //初次碰撞就进行消除判断，各自判断各自的
    //只往出跑的  因为碰撞时双方相互的
    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // if (otherCollider.sensor) { //碰到了传感器  （传感器一般是警戒线或者炸弹 这个由对方去判断） 

        if (otherCollider.TYPE === ECollider2DType.CIRCLE && otherCollider.group === GroupType.Circle) {
            const modelCircle = otherCollider.getComponent(ModelCircle);
            if (modelCircle.getState() === CircleState.Delete && !(modelCircle.node as any).iceBoom) {
                modelCircle.node.attr({ iceBoom: 1 });
                this.delBoomNum(1);
            }
        }


        return;
        // }
    }

    onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {

    }

    update(deltaTime: number) {

    }


}


