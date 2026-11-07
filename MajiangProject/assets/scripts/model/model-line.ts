import { _decorator, CircleCollider2D, Collider2D, Component, Contact2DType, DistanceJoint2D, ECollider2DType, ERigidBody2DType, instantiate, IPhysics2DContact, Node, PhysicsGroup, Prefab, RigidBody2D, size, Sprite, SpriteFrame, Texture2D, tween, UIOpacity, UITransform } from 'cc';
import { SuperComponent } from '../frame/center/components/super-component';
import { ModelCircle } from './model-circle';
import { CircleState, UI_EVENT_NAME } from '../game/constant/common-define';
import { BoxCollider2D } from 'cc';
import { Label } from 'cc';
import { Color } from 'cc';
const { ccclass, property } = _decorator;

//线 越过此线 累计3秒 失败
@ccclass('ModelLine')
export class ModelLine extends SuperComponent {
    // @property({
    //     type: BoxCollider2D
    // })
    // collider: BoxCollider2D = null;

    @property({
        type: Node
    })
    nodeTime: Node = null;

    @property({
        type: Label
    })
    labTime: Label = null;

    onLoad(): void {
        super.onLoad();

        this.registerEmit([

        ], [

        ], this)
    }

    start() {
        super.start();

        // this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        // this.collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
        // this.collider.on(Contact2DType.POST_SOLVE, this.onPostSolve, this);
        // this.collider.on(Contact2DType.PRE_SOLVE, this.onPreSolve, this);

        this.nodeTime.active = false;
    }

    //初次碰撞就进行消除判断，各自判断各自的
    //只往出跑的  因为碰撞时双方相互的
    // onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
    //     if (otherCollider.sensor) { //碰到了传感器  （传感器一般是警戒线或者炸弹 这个由对方去判断） 
    //     }
    // }

    // onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {

    // }

    // onPostSolve(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
    //     console.log('=============hfaskdhfjkasdfhkj===3333==')
    // }

    // onPreSolve() {
    //     console.log('=============hfaskdhfjkasdfhkj===4444==')
    // }

    update(deltaTime: number) {


    }

    _isContact = false;
    setContactColor() {
        if (this._isContact) {
            return;
        }
        this._isContact = true;

        const line = this.node.getChildByName('line')
        line.children.forEach((node) => {
            node.getComponent(Sprite).color = new Color("#f27760");
        })

        this.nodeTime.active = true;

        line.getComponent(UIOpacity).opacity = 255;
        //闪烁一下
        tween(line.getComponent(UIOpacity))
            .to(0.25, { opacity: 0 })
            .delay(0.1)
            .to(0.25, { opacity: 255 })
            .union()
            .repeat(2)
            .start();



    }

    setLabTime(count: number) {
        this.labTime.string = count + ''
        // if (count === 0) {
        //     this.nodeTime.active = false;
        // }
    }

    setNormalColor() {

        if (!this._isContact) {
            return
        }
        this._isContact = false;
        const line = this.node.getChildByName('line')
        line.children.forEach((node) => {
            node.getComponent(Sprite).color = new Color('#FFFFFF');
        })
        this.nodeTime.active = false;

    }

}


