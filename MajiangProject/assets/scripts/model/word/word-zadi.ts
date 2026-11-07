
import { Node, _decorator, Animation } from 'cc';
import { Vec2 } from 'cc';
import { SkillBase, SkillSet } from '../skill/skill-base';
import { Contact2DType } from 'cc';
import { Collider2D } from 'cc';
import { IPhysics2DContact } from 'cc';
import { ECollider2DType } from 'cc';
import { ModelCircle } from '../model-circle';
import { CircleState, G_isTest, GroupType } from '../../game/constant/common-define';
import { BoxCollider2D } from 'cc';
import { sp } from 'cc';
import { SuperSpine } from '../../frame/center/components/super-spine';
import { ModelIce } from '../model-ice';
import { Manager } from '../../frame/center/manager';
import SkillDefine from '../../game/constant/skill-define';

const { ccclass, property } = _decorator;

//强到爆炸
@ccclass("WordZaDi")
export class WordZaDi extends SkillBase implements SkillSet {
    skillName: string;
    createPos: Vec2;

    @property({
        type: BoxCollider2D
    })
    collider: BoxCollider2D = null;

    // @property({
    //     type: [Animation],
    //     tooltip: '菜单对应内容'
    // })
    // nodeAnim: Animation[] = [];

    @property({
        type: sp.Skeleton,
        tooltip: 'spine'
    })
    spine: sp.Skeleton = null;

    _curAnimCount: number = 0;
    _wordId: number = 0;

    protected onLoad(): void {
        super.onLoad();

        this.skillName = 'WordZaDi';
        console.log("========Skill Create=========", this.skillName);

        this.registerEmit([
            'event_animation_zadi_boom',
        ], [
            this.animationZaDiBoom,
        ], this);

        this.collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        this.collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
    }

    start(): void {
        super.start();

        this.collider.enabled = false;
        this.spine.node.active = false;
    }

    setCreatePos(pos: Vec2, wordId) {
        this.createPos = pos;
        this.node.setPosition(pos.x, pos.y); //设置世界坐标
        this._wordId = wordId;
    }

    //爆炸碰撞
    _count = 0;
    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {

        if (selfCollider.TYPE === ECollider2DType.BOX && selfCollider.group === GroupType.Skil) { //自己是圆形 group是skill
            if (otherCollider.TYPE === ECollider2DType.CIRCLE && otherCollider.group === GroupType.Circle) {
                //让爆照范围内的气泡都炸掉 
                const otherCircle = otherCollider.getComponent(ModelCircle);
                if (otherCircle.getState() === CircleState.Pool) { //炸掉池子里的气泡
                    if (this._count >= 3) {
                        return;
                    }
                    this._count++;
                    otherCircle.destorySelf(true);
                }
            }

            //对方是冰块
            if (otherCollider.getComponent(ModelIce)) {
                otherCollider.getComponent(ModelIce).delBoomNum(1);
            }
        }
    }

    onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {

    }

    animationZaDiBoom() {
        this._count = 0;
        this.collider.enabled = true;

        this.spine.node.active = true;
        this.spine.getComponent(SuperSpine).playSpine('boom', false);
    }


    protected onDestroy(): void {
        super.onDestroy();

        console.log('====word========onDestroy====释放bunlde====', this._wordId);
        const wordDefine = SkillDefine.wordDefine[this._wordId];
        Manager.bundleManager.releaseBundle(wordDefine.prefab);


    }










}