import { _decorator, Acceleration, Animation, CircleCollider2D, Collider2D, Contact2DType, ERigidBody2DType, instantiate, IPhysics2DContact, macro, Material, Node, PhysicsGroup, Prefab, RigidBody2D, size, sp, Sprite, SpriteFrame, Texture2D, UITransform, Vec2 } from 'cc';
import { SuperComponent } from '../frame/center/components/super-component';

import { DataManager } from '../game/data/data-manager';
import { Manager } from '../frame/center/manager';
import { PerticleType } from '../game/battle/collect-face';
import { getGlobalCfgValue } from '../game/common';
import { createLizi, loadMaterial } from '../game/ui-commonset';
import { SuperSpine } from '../frame/center/components/super-spine';
import { SuperAnimation } from '../frame/center/components/super-animation';
import { MaterialType, UI_EVENT_NAME } from '../game/constant/common-define';
const { ccclass, property } = _decorator;


export enum FaceKindType {
    None = 0,
    CommonFace = 1, //氛围表情
    SkillFace = 2, //技能表情
    WordFace = 3,//词条表情
    AnyFace = 4, //彩虹表情
}

export enum FaceAnimType {
    None = 0,
    Anim = 1,
    Spine = 2,
    Shader = 3,
}


@ccclass('ModelFace')
export class ModelFace extends SuperComponent {
    @property({
        type: CircleCollider2D
    })
    collider: CircleCollider2D = null;

    @property({
        type: Sprite,
        tooltip: 'face背景'
    })
    bg: Sprite = null;

    // @property({
    //     type: Sprite,
    //     tooltip: 'face图片'
    // })
    // sprite: Sprite = null;
    @property({
        type: Sprite,
        tooltip: 'face图片'
    })
    spriteShader: Sprite = null;

    @property({
        type: Node,
        tooltip: 'face_Spine'
    })
    spine: Node = null;

    private _faceType: number = null;
    private _faceId: number = null;  //唯一编号
    private _faceKind: FaceKindType = null;
    private _func = null; //当前只支持扫光的动画

    private _scanInterver = 1.0;
    time = 0;
    dttime = 0;
    startPos = 0;
    moveLength = 0;
    Speed = 0;
    lightWidth = 0.2;
    LoopTime = 1;
    private material: Material = null;

    onLoad(): void {
        super.onLoad();
        this.registerEmit([
            UI_EVENT_NAME.CIRCLE_FIRST_CONTACT, //气泡落下首次碰撞 警戒线以下
        ], [
            this.changeAnimation,
        ], this);

        this.material = null;
    }

    start() {
        super.start();
        // this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        // this.collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
    }


    changeAnimation() {
        const faceId = this._faceId;
        const faceConfig = Config.Face[faceId];
        if (faceConfig.faceKind === FaceKindType.SkillFace) {
            // 技能扫光更改间隔
            this._scanInterver = 4.0;
        }
    }

    //radius 半径 
    setRadius(radius: number) {
        this.spriteShader.getComponent(UITransform).setContentSize(size(radius * 2, radius * 2));

        this.collider.radius = radius;
        this.collider.apply();
    }

    //设置刚体类型 默认是Dynamic
    setRigidBodyType(type = ERigidBody2DType.Dynamic) {
        this.node.getComponent(RigidBody2D).type = type;
    }

    setFaceType(faceType: number) {
        this._faceType = faceType;
    }

    setFaceId(faceId: number) {
        this._faceId = faceId;
    }

    setFaceKind(faceKind: number) {
        this._faceKind = faceKind
    }

    getFaceKind() {
        return this._faceKind;
    }

    getFaceId() {
        return this._faceId;
    }

    getFaceType() {
        return this._faceType;
    }

    async setFaceImage() {
        const faceConfig = DataManager.dataBattle.faceConfig[this._faceId];

        const faceImage = faceConfig.image;
        const path = `model://image/${faceImage}/spriteFrame`;
        const spriteFrame: SpriteFrame = await Manager.bundleManager.load<SpriteFrame>(path, SpriteFrame);
        if (this.node && this.node.isValid) {
            this.spriteShader.spriteFrame = spriteFrame;

            if (faceConfig.faceKind === FaceKindType.SkillFace) {
                const material = await loadMaterial(MaterialType.FlashLight);
                this.spriteShader.customMaterial = material;
                this.setFaceAnim(FaceAnimType.Shader, 1); //播放扫光
            } else {
                const material = await loadMaterial(MaterialType.SpriteDefault);
                this.spriteShader.customMaterial = material

                if (faceConfig.faceKind === FaceKindType.WordFace) {
                    this.setFaceAnim(FaceAnimType.Spine, 2); //词条播放转圈spine
                }
            }

            if (faceConfig.faceKind === 3) {
                const path = `model://image/${this._faceType}/spriteFrame`;
                console.log('=======pathpathpath=========', path);
                const spriteFrame: SpriteFrame = await Manager.bundleManager.load<SpriteFrame>(path, SpriteFrame);
                if (this.node && this.node.isValid) {
                    this.bg.spriteFrame = spriteFrame;
                    const transform = this.bg.getComponent(UITransform);
                    transform.width = Number(getGlobalCfgValue('faceSize'));
                    transform.height = Number(getGlobalCfgValue('faceSize'));
                }
            }
        }

    }

    setFaceAnim(_type: FaceAnimType, interver: number = 0) {
        if (_type === FaceAnimType.Anim) {
            this.setAnimation('scan', interver);
        } else if (_type === FaceAnimType.Spine) {
            this.setSpine('ui_Aperture', interver);
        } else if (_type === FaceAnimType.Shader) {
            this._scanInterver = interver;
            this.setFlashLight(); //扫光
        }
    }

    //设置face上的spine
    private async setSpine(name: string, interver: number) {
        const path = `model://spine/${name}`;
        console.log('=====setSpine=====spine========', path);
        const skeletonData: sp.SkeletonData = await Manager.bundleManager.load<sp.SkeletonData>(path, sp.SkeletonData);
        if (this.node && this.node.isValid) {
            this.spine.active = true;
            this.spine.getComponent(sp.Skeleton).skeletonData = skeletonData;
            this.spine.getComponent(SuperSpine).playSpine('idle', true, () => {

            });
        }
    }

    //设置动画  interver 间隔多久播一次 单位 秒
    private async setAnimation(name: string, interver: number = 0) {
        const path = `model://animation/${name}`;
        console.log('=====setAnimation===========', path);
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

    setFlashLight() {
        this.time = 0;
        this.dttime = 0;
        this.material = this.spriteShader.customMaterial;

        this.startPos = -this.lightWidth / 2;
        this.moveLength = this.lightWidth + 1;
        this.Speed = this.moveLength / this.LoopTime;
        this.time = this.startPos;
    }

    update(dt: number) {
        if (this.material) {
            // console.log('===========afsdfsd==============', this._faceId)
            this.time += dt * this.Speed;
            this.dttime += dt;
            this.material.setProperty("lightCenterPoint", new Vec2(this.time, this.time));

            if (this.dttime > this.LoopTime + this._scanInterver) {
                this.time = this.startPos;
                this.dttime = 0;
            }
        }
    }

    async addLizi(_type: PerticleType, zOrder: number = -1) {
        const nodeLizi = await createLizi(_type, this._faceType)
        nodeLizi.parent = this.node;
        nodeLizi.setSiblingIndex(zOrder);
    }

}


