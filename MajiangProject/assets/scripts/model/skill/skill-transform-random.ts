
import { AudioSource, Node, _decorator, isValid } from 'cc';
import { Vec2 } from 'cc';
import { SkillBase, SkillSet } from './skill-base';
import { CircleAnimType, ModelCircle } from '../model-circle';
import { anyCircleType, CircleKindType, CircleState, GroupType } from '../../game/constant/common-define';
import { DataManager } from '../../game/data/data-manager';
import { sp } from 'cc';
import { convertToWorldSpaceAR } from '../../game/ui-commonset';
import { v2 } from 'cc';
import { getRandomInt } from '../../game/common';
import Utils from '../../frame/center/utils/utils';
import { FaceKindType } from '../model-face';
import { SuperSpine } from '../../frame/center/components/super-spine';
import { Manager } from '../../frame/center/manager';
import SkillDefine from '../../game/constant/skill-define';

const { ccclass, property } = _decorator;

//随机一个气泡内变成同一种颜色
@ccclass("SkillTransformRandom")
export class SkillTransformRandom extends SkillBase implements SkillSet {
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

        this.skillName = 'SkillTransformRandom';
        console.log("========Skill Create=========", this.skillName);

        this.registerEmit([

        ], [

        ], this);
    }

    start(): void {
        super.start();

        this.spine.getComponent(SuperSpine).playSpine('idle', false, () => {
            Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_ChangeColor');
            this.playAniSpine();
        })

    }

    setCreatePos(pos: Vec2, skillId: number) {
        this.createPos = pos;
        this.node.setPosition(pos.x, pos.y); //设置世界坐标
        this._skillId = skillId;
    }

    playAniSpine() {
        this.scheduleOnce(() => {
            this.dispatchEmit('event_animation_end'); //通知skill技能结束
        }, 1.5);

        const nodesTwo = [];
        const nodesOne = [];
        for (let i = 0; i < DataManager.dataBattle.boxNode.children.length; i++) {
            const circleNode = DataManager.dataBattle.boxNode.children[i];
            const modelCircle: ModelCircle = circleNode.getComponent(ModelCircle);
            if (modelCircle.stillExist() && modelCircle.getState() === CircleState.Pool) {
                const faceTypeData = modelCircle.getFaceTypeData();
                console.log('======nodesTwo=====11===========', JSON.stringify(faceTypeData))
                if (!faceTypeData[anyCircleType + '']) { //包含彩虹色的除外
                    if (circleNode.getComponent(ModelCircle).getCircleKindType() === CircleKindType.OneColor) {
                        console.log('==============nodesTwo====11======OneColor========', nodesTwo.length, nodesOne.length);
                        nodesOne.push(circleNode);
                    } else {
                        console.log('==============nodesTwo====11======TwoColor========', nodesTwo.length, nodesOne.length);
                        nodesTwo.push(circleNode);
                    }
                }
            }
        }

        console.log('==============nodesTwo====22==============', nodesTwo.length, nodesOne.length);

        if (nodesTwo.length > 0) {
            const idx = getRandomInt(0, nodesTwo.length - 1);
            const circleNode = nodesTwo[idx];
            const circleModel: ModelCircle = circleNode.getComponent(ModelCircle);
            const faceTypeData = Utils.utils.deepClone(circleModel.getFaceTypeData());

            circleModel.setCircleAnim(CircleAnimType.Spine); //播放转换动画

            this.scheduleOnce(() => {
                if (!isValid(this.node)) {
                    return;
                }
                if (!isValid(circleNode)) {
                    return;
                }

                let count = 0;
                let newFaceType = 0;
                for (const faceType in faceTypeData) {
                    if (count === 0) {
                        newFaceType = Number(faceType);
                    } else if (count === 1) {
                        circleModel.delFace(Number(faceType), null, false); //先删除再创建
                        //要更改的face 
                        const faceInfo = faceTypeData[faceType + ''];

                        for (const faceId in faceInfo) {
                            const count = faceInfo[faceId];
                            const faceKind = Config.Face[faceId].faceKind;

                            if (faceKind === FaceKindType.SkillFace) { //技能
                                const skillId = Config.Face[faceId].skillId;
                                const newFaceId = Config.Skill[skillId].faceIds[newFaceType - 1];
                                circleModel.createFace(newFaceType, { [newFaceId]: count });
                            } else if (faceKind === FaceKindType.WordFace) {
                                circleModel.createFace(newFaceType, { [faceId]: count });
                            } else if (faceKind === FaceKindType.CommonFace) {
                                const simplefaceIdArray = Config.FaceType[newFaceType].simplefaceIdArray;
                                const idx = getRandomInt(0, simplefaceIdArray.length - 1);
                                const newFaceId = simplefaceIdArray[idx];
                                circleModel.createFace(newFaceType, { [newFaceId]: count });
                            }
                        }
                    }
                    count++;
                }
                circleModel.transfromColorOperation(1); //转换色接触检测
            }, 1.0)


        } else if (nodesOne.length > 0) {
            const idx = getRandomInt(0, nodesOne.length - 1);
            const circleNode = nodesOne[idx];
            const circleModel: ModelCircle = circleNode.getComponent(ModelCircle);
            const faceTypeData = Utils.utils.deepClone(circleModel.getFaceTypeData());
            const faceType = Number(Object.keys(faceTypeData)[0]);

            circleModel.setCircleAnim(CircleAnimType.Spine);
            //有延迟处理 则要判断是否游戏结束 清理了气泡
            this.scheduleOnce(() => {
                if (!isValid(this.node)) {
                    return;
                }
                if (!isValid(circleNode)) {
                    return;
                }
                circleModel.delFace(Number(faceType), null, false); //先删除再创建

                let newFaceType = 0;
                if (nodesOne.length === 1) { //随机转换一种
                    let faceTypeArray = Utils.utils.deepClone(DataManager.dataBattle.faceTypeArray);
                    for (let i = faceTypeArray.length - 1; i >= 0; i--) {
                        if (faceTypeArray[i] == faceType) {
                            faceTypeArray.splice(i, 1)
                            break;
                        }
                    }
                    const idx = getRandomInt(0, faceTypeArray.length - 1);
                    newFaceType = faceTypeArray[idx]; //新的faceType
                } else {
                    const minDisCircleNode = this.getMinDisCircle(circleNode);

                    const minCircleModel: ModelCircle = minDisCircleNode.getComponent(ModelCircle);
                    const minfaceTypeData = minCircleModel.getFaceTypeData();
                    const idx = getRandomInt(0, Object.keys(minfaceTypeData).length - 1)
                    newFaceType = Number(Object.keys(minfaceTypeData)[idx]);
                }

                const faceInfo = faceTypeData[faceType + ''];
                for (const faceId in faceInfo) {
                    const count = Number(faceInfo[faceId])
                    const faceKind = Config.Face[faceId].faceKind;
                    if (faceKind === FaceKindType.SkillFace) { //技能
                        const skillId = Config.Face[faceId].skillId;
                        const newFaceId = Config.Skill[skillId].faceIds[newFaceType - 1];
                        circleModel.createFace(newFaceType, { [newFaceId]: count });
                    } else if (faceKind === FaceKindType.WordFace) {
                        circleModel.createFace(newFaceType, { [faceId]: count });
                    } else if (faceKind === FaceKindType.CommonFace) {
                        const simplefaceIdArray = Config.FaceType[newFaceType].simplefaceIdArray;
                        const idx = getRandomInt(0, simplefaceIdArray.length - 1);
                        const newFaceId = simplefaceIdArray[idx];
                        circleModel.createFace(newFaceType, { [newFaceId]: count });
                    }

                }

                circleModel.transfromColorOperation(1); //转换色接触检测
            }, 1.0);

        }
    }


    getMinDisCircle(node: Node) {
        const selfWordPos = convertToWorldSpaceAR(node);
        let nodes = [];
        for (let i = 0; i < DataManager.dataBattle.boxNode.children.length; i++) {
            const circleNode = DataManager.dataBattle.boxNode.children[i];
            if (circleNode.getComponent(ModelCircle).stillExist() && circleNode.getComponent(ModelCircle).getState() === CircleState.Pool) {
                const otherWordPos = convertToWorldSpaceAR(circleNode);
                const distance = Vec2.len(v2(selfWordPos.x - otherWordPos.x, selfWordPos.y - otherWordPos.y));
                nodes.push([distance, circleNode.getComponent(ModelCircle)])

            }
        }
        nodes.sort((a, b) => {
            return a[0] - b[0];
        })
        return nodes[0][1];
    }

    protected onDestroy(): void {
        super.onDestroy();
        console.log('=======skill=====onDestroy====释放bunlde====', this._skillId);
        // const skillDefine = SkillDefine.skillConfig[this._skillId];   //加载当前的word bundle
        // Manager.bundleManager.releaseBundle(skillDefine.prefab);
    }


}