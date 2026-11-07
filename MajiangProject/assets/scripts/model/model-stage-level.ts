import { _decorator, CircleCollider2D, Collider2D, Component, Contact2DType, DistanceJoint2D, ECollider2DType, ERigidBody2DType, instantiate, IPhysics2DContact, Node, PhysicsGroup, Prefab, RigidBody2D, size, Sprite, SpriteFrame, Texture2D, UITransform } from 'cc';
import { SuperComponent } from '../frame/center/components/super-component';
const { ccclass, property } = _decorator;

@ccclass('ModelStageLevel')
export class ModelStage extends SuperComponent {
    @property({
        type: Node,
        tooltip: '受重力的障碍物父节点'
    })
    fallBarriar: Node = null; //每一关的父节点

    onLoad(): void {
        super.onLoad();
    }

    start() {
        super.start();

        
    }

    getFallBarriar(){
        return this.fallBarriar;
    }

    update(deltaTime: number) {

    }

}


