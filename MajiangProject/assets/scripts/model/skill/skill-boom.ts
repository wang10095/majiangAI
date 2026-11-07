
import { Node, _decorator, Animation, Collider2D, IPhysics2DContact, ECollider2DType, AudioSource } from 'cc';
import { Vec2 } from 'cc';
import { SkillBase, SkillSet } from './skill-base';

import { ModelCircle } from '../model-circle';
import { CircleState, GroupType } from '../../game/constant/common-define';
import { DataManager } from '../../game/data/data-manager';
import { sp } from 'cc';
import { SuperSpine } from '../../frame/center/components/super-spine';
import { convertToWorldSpaceAR } from '../../game/ui-commonset';
import { v2 } from 'cc';
import { ModelIce } from '../model-ice';
import { Manager } from '../../frame/center/manager';
import SkillDefine from '../../game/constant/skill-define';

const { ccclass, property } = _decorator;


@ccclass("SkillBoom")
export class SkillBoom extends SkillBase implements SkillSet {
    skillName: string;
    createPos: Vec2;

    // @property({
    //     type: CircleCollider2D
    // })
    // collider: CircleCollider2D = null;

    @property({
        type: sp.Skeleton,
    })
    spine: sp.Skeleton = null;

    _curAnimCount: number = 0;
    _skillId: number = 0;

    protected onLoad(): void {
        super.onLoad();

        this.skillName = 'SkillBoom';
        console.log("========Skill Create=========", this.skillName);

        this.registerEmit([

        ], [

        ], this);

        // this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        // this.collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
    }

    start(): void {
        super.start();
        this.playAniSpine();
    }

    setCreatePos(pos: Vec2, skillId: number) {
        this.createPos = pos;
        this.node.setPosition(pos.x, pos.y); //设置世界坐标
        this._skillId = skillId;
    }

    playAniSpine() {
        let boomDis = 240;
        let maxBoomCount = 2;


        this.spine.getComponent(SuperSpine).playSpine('boom', false, () => {
            this.dispatchEmit('event_animation_end');
        });
        this.scheduleOnce(() => {
            Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_Boom');
        }, 1.33);

        const selfWordPos = convertToWorldSpaceAR(this.node);
        const nodes = [];
        for (let i = 0; i < DataManager.dataBattle.boxNode.children.length; i++) {
            const circleNode = DataManager.dataBattle.boxNode.children[i];
            if (circleNode.getComponent(ModelCircle).stillExist() && circleNode.getComponent(ModelCircle).getState() === CircleState.Pool) {
                const otherWordPos = convertToWorldSpaceAR(circleNode);
                const distance = Vec2.len(v2(selfWordPos.x - otherWordPos.x, selfWordPos.y - otherWordPos.y));

                if (distance <= boomDis) {
                    nodes.push([distance, circleNode.getComponent(ModelCircle)])
                }
            }
        }

        nodes.sort((a, b) => {
            return a[0] - b[0];
        })

        for (let i = 0; i < nodes.length; i++) {
            if (i < maxBoomCount) {
                (nodes[i][1] as ModelCircle).destorySelf(true);
            }
        }
    }

    // //爆炸碰撞
    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if (selfCollider.TYPE === ECollider2DType.CIRCLE && selfCollider.group === GroupType.Skil) { //自己是圆形 group是skill
            //对方是气泡
            // if (otherCollider.TYPE === ECollider2DType.CIRCLE && otherCollider.group === GroupType.Circle) {
            //     // console.log('==============booom====onBeginContact===============')
            //     //让爆照范围内的气泡都炸掉 
            //     const otherCircle = otherCollider.getComponent(ModelCircle);
            //     if (otherCircle.getState() === CircleState.Pool) { //炸掉池子里的气泡
            //         otherCircle.destorySelf(true);
            //     }
            // }

            //对方是冰块
            if (otherCollider.getComponent(ModelIce)) {
                otherCollider.getComponent(ModelIce).delBoomNum(1);
            }
        }

    }

    onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {

    }


    protected onDestroy(): void {
        super.onDestroy();
        console.log('=======skill=====onDestroy====释放bunlde====', this._skillId);
        // const skillDefine = SkillDefine.skillConfig[this._skillId];   //加载当前的word bundle
        // Manager.bundleManager.releaseBundle(skillDefine.prefab);
    }




}