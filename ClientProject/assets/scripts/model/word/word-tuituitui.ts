
import { Node, _decorator, Animation } from 'cc';
import { Vec2 } from 'cc';
import { SkillBase, SkillSet } from '../skill/skill-base';
import { ModelCircle } from '../model-circle';
import { CircleState, G_isTest, UI_EVENT_NAME } from '../../game/constant/common-define';
import { DataManager } from '../../game/data/data-manager';
import { BoxCollider2D } from 'cc';
import { getRandomInt } from '../../game/common';
import { Manager } from '../../frame/center/manager';
import SkillDefine from '../../game/constant/skill-define';

const { ccclass, property } = _decorator;

//强到爆炸
@ccclass("WordTuiTuiTui")
export class WordTuiTuiTui extends SkillBase implements SkillSet {
    skillName: string;
    createPos: Vec2;

    @property({
        type: BoxCollider2D
    })
    collider: BoxCollider2D = null;

    @property({
        type: Node,
    })
    tip: Node = null;

    _curAnimCount: number = 0;
    _wordId: number = 0;

    protected onLoad(): void {
        super.onLoad();

        this.skillName = 'WordTuiTuiTui';
        console.log("========Skill Create=========", this.skillName);

        this.registerEmit([
            'random_boom',
            UI_EVENT_NAME.CIRCLE_TOUCH_DESTORY,
        ], [
            () => {
                this.nodeAnim[0].node.active = false;
                this.tip.active = true;
                this.dispatchEmit(UI_EVENT_NAME.TOUCH_ONE_DESTORY);
            },
            (flag: boolean) => {
                if (!flag) {
                    this.dispatchEmit('event_animation_end', 0)
                }
            },
        ], this)
        // this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        // this.collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
    }

    start(): void {
        super.start();

        this.tip.active = false;
    }

    setCreatePos(pos: Vec2, wordId) {
        this.createPos = pos;
        this.node.setPosition(pos.x, pos.y); //设置世界坐标
        this._wordId = wordId;
    }

    // randomBoom() { //随机爆一个
    //     let nodes = [];
    //     for (let i = 0; i < DataManager.dataBattle.boxNode.children.length; i++) {
    //         const nodeCircle = DataManager.dataBattle.boxNode.children[i];
    //         if (nodeCircle.getComponent(ModelCircle).stillExist() && nodeCircle.getComponent(ModelCircle).getState() === CircleState.Pool) {
    //             nodes.push(nodeCircle);
    //         }
    //     }
    //     console.log('=========randomBoom====================', nodes.length)
    //     if (DataManager.dataBattle.boxNode && nodes.length > 0) {
    //         const idx = getRandomInt(0, nodes.length - 1);
    //         const nodeCircle = nodes[idx];
    //         nodeCircle.getComponent(ModelCircle).destorySelf(true);

    //     } else {
    //         console.log('========没有找到box节点======');
    //     }
    // }



    // //爆炸碰撞
    // onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
    //     if (otherCollider.TYPE === ECollider2DType.CIRCLE && otherCollider.group === GroupType.Circle) {
    //         console.log('==============booom====onBeginContact===============')
    //         //让爆照范围内的气泡都炸掉 

    //         const otherCircle = otherCollider.getComponent(ModelCircle);
    //         if (otherCircle.getState() === CircleState.Pool) { //炸掉池子里的气泡
    //             otherCircle.destorySelf(true);
    //         }
    //     }
    // }

    // onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {

    // }



    protected onDestroy(): void {
        super.onDestroy();

        console.log('======word======onDestroy====释放bunlde====', this._wordId);
        const wordDefine = SkillDefine.wordDefine[this._wordId];
        Manager.bundleManager.releaseBundle(wordDefine.prefab);


    }











}