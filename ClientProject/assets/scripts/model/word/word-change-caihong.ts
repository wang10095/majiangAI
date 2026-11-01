
import { Node, _decorator, Animation } from 'cc';
import { Vec2 } from 'cc';
import { SkillBase, SkillSet } from '../skill/skill-base';
import { G_isTest, UI_EVENT_NAME } from '../../game/constant/common-define';
import { Manager } from '../../frame/center/manager';
import SkillDefine from '../../game/constant/skill-define';

const { ccclass, property } = _decorator;

//把准备发射的气泡face变为彩虹 10002 city|不|city
@ccclass("WordChangeCaiHong")
export class WordChangeCaiHong extends SkillBase implements SkillSet {
    skillName: string;
    createPos: Vec2;

    // @property({
    //     type: BoxCollider2D
    // })
    // collider: BoxCollider2D = null;

    _curAnimCount: number = 0;
    _wordId: number = 0;

    protected onLoad(): void {
        super.onLoad();

        this.skillName = 'WordChangeCaiHong';
        console.log("========Skill Create=========", this.skillName);

        this.registerEmit([

        ], [

        ], this);

        // this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        // this.collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
    }

    start(): void {
        super.start();

        this.randomBoom();
    }

    setCreatePos(pos: Vec2, wordId) {
        this.createPos = pos;
        this.node.setPosition(pos.x, pos.y); //设置世界坐标
        this._wordId = wordId;
    }

    randomBoom() {
        this.dispatchEmit(UI_EVENT_NAME.READY_CIRCLE_CHANGE_CAIHONG);
    }



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

        console.log('====word========onDestroy====释放bunlde====', this._wordId);
        const wordDefine = SkillDefine.wordDefine[this._wordId];
        Manager.bundleManager.releaseBundle(wordDefine.prefab);

    }










}