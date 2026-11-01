import { SuperData } from './super-data';
import { anyCircleType, CircleKindType, CircleState, DATA_NAME, GuideType, REWARD_STATUS, UI_EVENT_NAME } from '../constant/common-define';
import Utils from '../../frame/center/utils/utils';
import { Node } from 'cc';
import { v3 } from 'cc';
import Random, { WeightMsg } from '../../frame/center/utils/tool';
import { getGlobalCfgValue, getRandomArbitrary, getRandomInt } from '../common';
import { DataManager } from './data-manager';
import { destroyFaceJoint, ModelCircle } from '../../model/model-circle';
import { convertToNodeSpaceAR, convertToWorldSpaceAR } from '../ui-commonset';
import { FaceKindType, ModelFace } from '../../model/model-face';
import { tween } from 'cc';
import { CircleCollider2D } from 'cc';
import { Rect } from 'cc';
import { v2 } from 'cc';
import { UITransform } from 'cc';

export enum BATTLE_END_NEXT_OPERATION {
    None = 0,
    NEXTSTAGE = 1,
    BACKHOME = 2,
    REVIVE = 3, //复活
    RESTART = 4,//重新开始游戏
}

// 战斗类型
export enum BATTLE_STAGE_TYPE {
    Main = 0,
    CatchFish = 1,
    Caocao = 2,
}

export class DataBattle extends SuperData {
    name = DATA_NAME.BATTLE_DATA;
    // ---------  数据逻辑处理   ------------------
    netMessageHanders = {

    };

    boxNode: Node = null; //存放所有气泡的父节点
    //关卡数据
    curStage: number = 1;
    curLittleStage: number = 1;
    curTao: number = 1; //用第几套
    remainTime: number = 0; //剩余倒计时

    createFaceType = [];
    collectFaceIds = []; //要收集的faceId
    hadCollectFull = [0, 0, 0, 0];  //已经收集的表情具体数量
    collectFaceType = []; //收集face的颜色大类 
    skillUseLimit = [1, 1]; //右下角两个技能可以用的次数
    reviveLimit = [1, 1]; //两种复活弹出次数

    underPinLocY = 0; //底座位置Y
    warnLineY = 0; //警戒线的世界坐标Y
    allCircleData = {}; //本关所有气泡信息
    faceTypeClone = {};
    //基础配置
    circleMaxFaceCount = null; //气泡容纳数量 超过此数量爆炸
    circleSize = null; //气泡大小 直径
    faceSize = null; //表情大小 直径
    faceTypeArray: Array<number> = [];  //当前关卡表情大类 
    faceTypeConfig = null; //表情大类配置
    faceConfig: { [id: number]: Face } = null; //face配置
    wordConfig: { [id: number]: Word } = null;//词条配置
    stageConfig: Stage = null; //所有关卡配置
    warnlineUnderPinDistance = null;//警戒线距离底高度
    warnLineDistance = null; //距离警戒线的高度
    allWordFaceIdArray: Array<number> = [];
    warnLineTime: number = 0;

    readyCircleFaceData = {}; //准备气泡的face数据

    anyCircleFaceId: number = 1701;
    teachId: number = 0;
    battleType: BATTLE_STAGE_TYPE = BATTLE_STAGE_TYPE.Main;
    caocaoBlood: number = 0;

    initConfig() {

        this.circleMaxFaceCount = getGlobalCfgValue('circleMaxFaceCount');
        this.circleSize = getGlobalCfgValue('circleSize');
        this.faceSize = getGlobalCfgValue('faceSize');
        this.warnlineUnderPinDistance = getGlobalCfgValue('warnlineUnderPinDistance');  //680
        this.warnLineDistance = getGlobalCfgValue('warnLineDistance');  //200
        this.warnLineTime = Number(getGlobalCfgValue('warnLineTime'))

        this.faceTypeConfig = Config.FaceType;
        this.faceConfig = Config.Face;
        this.wordConfig = Config.Word;

        this.teachId = Number(Object.keys(Config.StageTeach)[0]) - 1;

        if (this.battleType === BATTLE_STAGE_TYPE.CatchFish) {
            for (const key in Config.Stage) {
                const value = Config.Stage[key]
                if (value.stageType === BATTLE_STAGE_TYPE.CatchFish) {
                    this.stageConfig = value;
                    break;
                }
            }
            return;
        }
        if (this.battleType === BATTLE_STAGE_TYPE.Caocao) {
            for (const key in Config.Stage) {
                const value = Config.Stage[key]
                if (value.stageType === BATTLE_STAGE_TYPE.Caocao) {
                    this.stageConfig = value;
                    break;
                }
            }
            return;
        }

        if (this.curStage === 1 && this.battleType === BATTLE_STAGE_TYPE.Main) {
            this.stageConfig = Config.Stage[1];

            let game_had_teach = Utils.storage.getItem('game_had_teach');
            if (!game_had_teach) {
                (this.stageConfig as any).collectFaceId = [10, 15];
            }
            return;
        }

        const stageIds = Config.StageCount[this.curStage].stageIds;

        let loseCount = Utils.storage.getItem('game_lose_count');
        if (loseCount) {
            loseCount = Number(loseCount);
        } else {
            loseCount = 0;
        }

        const stageDifficulty = Config.StageDifficulty[loseCount];

        let arr1: Array<WeightMsg> = [];
        stageDifficulty.weight.forEach((weight, idx) => {
            arr1.push({ id: idx, weight: weight })
        })
        const idx: number = Random.randByWeight(arr1); //困难 正常 简单

        for (const key in Config.Stage) {
            const stageInfo = Config.Stage[key];
            if (stageIds.includes(stageInfo.id) && stageInfo.difficultLv === idx + 1) {
                this.stageConfig = stageInfo;
                break;
            }
        }
        console.log('=======this.stageConfig============', this.stageConfig);
    }

    checkCollectFull() {
        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish) { //捕鱼没有胜利
            return false;
        } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
            if (this.caocaoBlood <= 0) {
                return true
            } else {
                return false
            }
        }

        const curStageConfig: Stage = DataManager.dataBattle.stageConfig;
        for (let i = 0; i < this.hadCollectFull.length; i++) {
            if (this.hadCollectFull[i] < curStageConfig.collectFaceId[i]) {
                return false;
            }
        }
        return true;
    }

    getStageCircle(id: number) {
        const config = Config.StageCircle[id];
        if (!config) {
            console.error('error  getStageCircle:', id);
        }
        return config;
    }



    //打乱气泡内表情
    distorbCircle() {
        const circles = [];
        DataManager.dataBattle.boxNode.children.forEach((circleNode) => {
            if (circleNode.getComponent(ModelCircle).stillExist() && circleNode.getComponent(ModelCircle).getState() === CircleState.Pool) {
                circles.push(circleNode);
            }
        })
        // //气泡按照从大到小排序
        // circles.sort((a, b) => {
        //     return b.getComponent(ModelCircle).getRadius() - a.getComponent(ModelCircle).getRadius();
        //     // return convertToWorldSpaceAR(a).x - convertToWorldSpaceAR(b).x
        // })

        // let faceAll = {};
        let allFaceNode = [];
        let circleTypeArray = [];
        let circleColors = [];

        let faceAllArray = [];
        console.log('=====================distorbCircle==========start=========11111111======================')
        for (let i = 0; i < circles.length; i++) {
            const circleNode = circles[i];
            const modelCircle: ModelCircle = circleNode.getComponent(ModelCircle);

            modelCircle.faceParent.children.forEach((faceNode) => {
                allFaceNode.push(faceNode);
            })

            const faceInfo = modelCircle.getFaceTypeData();
            // console.log(convertToWorldSpaceAR(circleNode).x, '======distorbCircle======000=====', JSON.stringify(faceInfo))

            for (const faceType in faceInfo) {
                faceAllArray.push([Number(faceType), faceInfo[faceType]]);
            }

            circleTypeArray.push(modelCircle.getCircleType());
            circleColors.push(modelCircle.getCircleKindType())
        }

        console.log('======distorbCircle===========乱序前的color=========', circleColors);

        //把颜色种类乱序  
        circleColors = Utils.array.shuffle(circleColors);
        circleColors = Utils.array.shuffle(circleColors);
        circleColors = Utils.array.shuffle(circleColors);
        for (let i = 0; i < circleTypeArray.length; i++) {
            const circleType = circleTypeArray[i];
            const circleMaxCount = DataManager.dataBattle.circleMaxFaceCount[circleType];
            if (circleMaxCount === 1 && circleColors[i] === 2) { //遇到了最小气泡 但是颜色有2种
                circleColors[i] = 1;

                for (let k = 0; k < circleColors.length; k++) {
                    const circleType = circleTypeArray[k];
                    const circleMaxCount = DataManager.dataBattle.circleMaxFaceCount[circleType];
                    if (circleColors[k] === 1 && circleMaxCount > 1) {
                        circleColors[k] = 2;
                        break;
                    }
                }
            }
        }

        console.log("======distorbCircle====乱序后的color===============", circleColors, JSON.stringify(faceAllArray));

        //移动表情
        for (let i = 0; i < circles.length; i++) {
            const circleNode = circles[i];
            console.log(convertToWorldSpaceAR(circleNode).x, "======distorbCircle===开始获得新face=====1======");

            const modelCircle: ModelCircle = circleNode.getComponent(ModelCircle);
            modelCircle.resetFaceInfo();

            let aaaaa = [];
            for (let k = 0; k < circleColors[i]; k++) {
                const idx = getRandomInt(0, faceAllArray.length - 1);
                const faceArrayNew = faceAllArray[idx];  //{"1201":3,"1202":3},
                faceAllArray.splice(idx, 1); //当前颜色大类包含的 faceId和数量 Array

                aaaaa.push(faceArrayNew);
                const faceType = faceArrayNew[0];
                const faceArray = faceArrayNew[1]
                for (const key in faceArray) {
                    const faceId = Number(key);
                    const needCount = Number(faceArray[key]);
                    // const faceConfig = DataManager.dataBattle.faceConfig[faceId];
                    modelCircle.addFaceInfo(faceType, { [faceId]: needCount });
                    //开始移动
                    let count = 0;
                    for (let j = allFaceNode.length - 1; j >= 0; j--) {
                        const faceNode = allFaceNode[j];
                        if (faceNode.getComponent(ModelFace).getFaceId() === Number(faceId)) {
                            allFaceNode.splice(j, 1);

                            destroyFaceJoint(faceNode); //先删除DistanceJoint2D组件
                            const pos = convertToWorldSpaceAR(faceNode);
                            const newPos = convertToNodeSpaceAR(pos, circleNode);
                            faceNode.parent = circleNode.getChildByName('faceParent'); //一定要把face节点放到 对方的faceParent节点下
                            faceNode.setPosition(newPos.x, newPos.y);

                            faceNode.getComponent(CircleCollider2D).sensor = true;
                            faceNode.getComponent(CircleCollider2D).apply();

                            tween(faceNode).to(0.3, { position: v3(0, 0, 0) }).call(() => {
                                modelCircle.addFaceOnly(faceNode, count === needCount); //加到对方气泡上（数据已经先加了）
                            }).start();
                            count++;
                            if (count === needCount) {
                                break;
                            }
                        }
                    }
                }
            }
            console.log(convertToWorldSpaceAR(circleNode).x, '==distorbCircle==获得新表情====2=======', JSON.stringify(aaaaa));
        }
        if (faceAllArray.length > 0) {
            console.error('=====distorbCircle=====没有分配干净======');
        }

        DataManager.dataBattle.boxNode.children.forEach((circleNode) => {
            if (circleNode.getComponent(ModelCircle).stillExist() && circleNode.getComponent(ModelCircle).getState() === CircleState.Pool) {
                circleNode.getComponent(ModelCircle).transfromColorOperation(2);
            }
        })

        console.log('==========distorbCircle======================end================', JSON.stringify(faceAllArray));
    }
    //创建新气泡的数据 遍历data 判定  以后这里会非常复杂 要遍历整个气泡
    //[气泡类型,{大类id : {faceId:count,faceId:count}}]
    // getNewCircleData() {
    //     let collectFaceId = [];
    //     this.stageConfig.collectFaceId.forEach((collectFace) => {
    //         collectFaceId.push(collectFace[0]);
    //     })
    //     //创建气泡中表情的类型和数量
    //     let createData: { [id: string]: {} } = {};

    //     let faceTypeCount = getRandomInt(1, 2); //随机出一个或两个表情

    //     let idx = getRandomInt(0, this.circleSize.length - 1) //第几个气泡

    //     let maxSize = this.circleMaxFaceCount[idx]; //最多几个数量
    //     if (maxSize === 1) { //只能容纳一个表情
    //         faceTypeCount = 1;
    //     }

    //     let faceTypeArray = Utils.utils.deepClone(this.faceTypeArray); //深拷贝一份 防止篡改

    //     for (let i = 0; i < faceTypeCount; i++) { //每一个随机出数量
    //         let faceTypeIdx = getRandomInt(0, faceTypeArray.length - 1);
    //         const curFaceType = faceTypeArray[faceTypeIdx]; //选中一个表情大类
    //         faceTypeArray.slice(faceTypeIdx, 1);

    //         const randomCount = Math.floor(maxSize / faceTypeCount);
    //         let count = getRandomInt(1, randomCount);

    //         const faceIdArray = this.faceTypeConfig[curFaceType].simplefaceIdArray;

    //         const idx = getRandomInt(0, faceIdArray.length - 1);
    //         const faceId = faceIdArray[idx];
    //         createData[curFaceType + ''] = { [faceId]: count }; //第一关 一个颜色大类只生成一种faceId
    //         // const wightArray = this.faceTypeConfig[curFaceType].weight;
    //         // let arr: Array<WeightMsg> = [];
    //         // faceIdArray.forEach((faceId, idx) => {
    //         //     arr.push({ id: faceId, weight: wightArray[idx] })
    //         // })

    //         // let faceInfo = {}; //随机出的face 
    //         // for (let i = 0; i < count; i++) {
    //         //     const idx = Random.randByWeight(arr);
    //         //     if (faceInfo[arr[idx].id]) {
    //         //         faceInfo[arr[idx].id]++;
    //         //     } else {
    //         //         faceInfo[arr[idx].id] = 1;
    //         //     }
    //         // }
    //         // createData[curFaceType + ''] = faceInfo;
    //     }
    //     return [idx, createData];
    // }

    getNewCircleData() {
        this.teachId++;
        const data = Config.StageTeach[this.teachId];
        const circleType = data.circleType;

        let createData = {};
        for (let i = 1; i <= data.circleColor; i++) {
            const faceType: number = data['faceType_' + i]; //颜色大类
            createData[faceType + ''] = {};
            const faceIdArray: Array<number> = data['faceId_' + i]; //faceId
            const faceCountArray: Array<number> = data['faceCount_' + i];
            faceIdArray.forEach((faceId, idx) => {
                let faceIdN = Number(faceId);
                if (faceIdN < 2000) { //氛围表情
                    faceIdN = Config.FaceType[faceType].simplefaceIdArray[0];
                }
                const count = Number(faceCountArray[idx]);
                createData[faceType + ''][faceIdN] = count;
            })
        }
        console.log(circleType, '===teach====getNewCircleData=================', createData)

        return [circleType, createData];
    }


    //第一小关和>=5小关更新 
    updateFaceTypeClone() {
        if (this.curLittleStage !== 1 && this.curLittleStage < Number(getGlobalCfgValue('littleStageCreateMoreColor'))) {
            return;
        }

        if (this.battleType === BATTLE_STAGE_TYPE.CatchFish) { //捕鱼  1-8
            this.faceTypeClone = Utils.utils.deepClone(Config.FaceType);
            console.log('======updateFaceTypeClone======捕鱼===========', this.faceTypeClone);
            return;
        }
        if (this.battleType === BATTLE_STAGE_TYPE.Caocao) { //曹操  没有彩虹  1-7
            this.faceTypeClone = {}
            this.stageConfig.circleType.forEach((faceType) => {
                this.faceTypeClone[faceType + ''] = Utils.utils.deepClone(Config.FaceType[faceType + '']);
            })

            console.log('======updateFaceTypeClone======曹操===========', this.faceTypeClone);
            return;
        }

        this.faceTypeArray = this.stageConfig.circleType;
        let collectFaceId = this.collectFaceIds;

        //确定是哪两种颜色
        const collectFaceArray = this.stageConfig.collectFaceId; //收集的face的数量
        let collectFace = collectFaceId;                        //要收集的faceId

        //根据上面的每个收集的face 踢出不能出现的颜色
        // let collectConfig = [1, 3, 5, 8]; //从第几关开始出现第几个收集的id

        let collectConfig = getGlobalCfgValue('targetFacesShowUp');

        const lastNeedCollect = collectFaceArray[collectFaceArray.length - 1] //最后一个face需要收集的数量
        const lastHadCollect = this.hadCollectFull[this.hadCollectFull.length - 1] //最后一个face已经收集的数量
        if (this.curLittleStage >= 8 && this.curLittleStage <= 9 && lastHadCollect >= lastNeedCollect * Number(getGlobalCfgValue('mainFaceCollectLImit')) / 100) {
            collectConfig[3] = 999;
        }

        if (this.curStage === 1) { //第一关不限制收集face的出现关卡
            collectConfig = [1, 1, 1, 1];
        }

        let faceTypeClone: { [id: number]: any } = {}
        for (const id in Config.FaceType) {
            if (this.faceTypeArray.includes(Number(id))) {
                faceTypeClone[id] = Utils.utils.deepClone(Config.FaceType[id]);
            }
        }

        for (const id in faceTypeClone) {
            const value: FaceType = faceTypeClone[id];
            const simplefaceIdArray = value.simplefaceIdArray; //本颜色大类的只有纯颜色表情（除去技能 词条的faceid）

            for (let i = simplefaceIdArray.length - 1; i >= 0; i--) {
                const faceId = simplefaceIdArray[i];
                if (collectFace.includes(faceId)) {
                    const collectIdx = collectFace.indexOf(faceId); //收集栏第几个
                    if (this.curLittleStage < collectConfig[collectIdx]) { //当前小关卡比
                        simplefaceIdArray.splice(i, 1); //踢出收集的faceId
                        console.log('====updateFaceTypeClone=====踢出收集的faceId==', faceId);
                        if (simplefaceIdArray.length === 0) {
                            console.log('====updateFaceTypeClone=====踢出收集的faceType==', id);
                            delete faceTypeClone[id];
                        }
                    }
                }
            }
        }
        console.log('====updateFaceTypeClone=====踢出本小关不出现的faceId后==', JSON.stringify(faceTypeClone));

        if (this.curLittleStage < Number(getGlobalCfgValue('littleStageCreateMoreColor'))) {
            for (const id in faceTypeClone) {
                const curSimpleIdArray = Utils.utils.deepClone(faceTypeClone[id].simplefaceIdArray);

                let contain = false;
                for (let i = 0; i < collectFaceId.length; i++) {
                    if (curSimpleIdArray.includes(collectFaceId[i])) {
                        contain = true;
                        break;
                    }
                }
                if (this.faceTypeArray.includes(Number(id)) && contain) {
                    const idx = this.collectFaceType.indexOf(Number(id));
                    faceTypeClone[id].simplefaceIdArray = [collectFaceId[idx]];
                } else {
                    const idx = getRandomInt(0, curSimpleIdArray.length - 1);
                    const faceId = curSimpleIdArray[idx];
                    faceTypeClone[id].simplefaceIdArray = [faceId];
                }
            }
        }
        console.log(this.curLittleStage, '====updateFaceTypeClone====小于5小关的强制展示的==', JSON.stringify(faceTypeClone));


        this.faceTypeClone = faceTypeClone;

        //第九关 加入分别加入一组 10005 10006 词条
        if (this.curLittleStage === 9) {
            this.pushWordId();
        }
    }

    private _createNumber: Map<number, number> = new Map(); //123  456 789
    updateFaceTypeClone_new() {
        this.faceTypeArray = this.stageConfig.circleType;
        let collectFaceIds = this.collectFaceIds;

        let faceTypeClone: { [id: number]: any } = {}
        for (const id in Config.FaceType) {
            if (this.faceTypeArray.includes(Number(id))) {
                faceTypeClone[id] = Utils.utils.deepClone(Config.FaceType[id]);
            }
        }

        //第 1  4 7 关重新设置
        if (this.curLittleStage % 3 === 1) {
            this._createNumber.clear();

            for (let i = 1; i < this.stageConfig.collectFaceId.length; i++) {
                const idx = i - 1;

                const allCount = this.stageConfig.collectFaceId[i];
                const min = this.stageConfig.targetFacePollMinRateByLittleStage[idx];
                const max = this.stageConfig.targetFacePollMaxRateByLittleStage[idx];
                const random = getRandomArbitrary(min, max);

                const count = allCount * random;
                console.log(random, '=====_createNumber=================', collectFaceIds[i], count)
                if (this.curLittleStage < 10) {
                    this._createNumber.set(collectFaceIds[i], Math.floor(count));
                } else {
                    this._createNumber.set(collectFaceIds[i], 999999999);
                }
            }
            console.log('============_createNumber=========ok===========', Array.from(this._createNumber))
        }


        //小于5关的时候 出现的颜色一定是收集的faceId
        if (this.curLittleStage < Number(getGlobalCfgValue('littleStageCreateMoreColor'))) {
            for (const id in faceTypeClone) {
                const curSimpleIdArray = Utils.utils.deepClone(faceTypeClone[id].simplefaceIdArray);

                let contain = false;
                for (let i = 0; i < collectFaceIds.length; i++) {
                    if (curSimpleIdArray.includes(collectFaceIds[i])) {
                        contain = true;
                        break;
                    }
                }
                if (this.faceTypeArray.includes(Number(id)) && contain) {
                    const idx = this.collectFaceType.indexOf(Number(id));
                    faceTypeClone[id].simplefaceIdArray = [collectFaceIds[idx]];
                } else {
                    const idx = getRandomInt(0, curSimpleIdArray.length - 1);
                    const faceId = curSimpleIdArray[idx];
                    faceTypeClone[id].simplefaceIdArray = [faceId];
                }
            }
        }
        console.log(this.curLittleStage, '====getNewCircleData2====小于5小关的强制展示的==', JSON.stringify(faceTypeClone));

        this.faceTypeClone = faceTypeClone;

        //第九关 加入分别加入一组 10005 10006 词条
        if (this.curLittleStage === 9) {
            this.pushWordId();
        }
    }

    //第二关 生成新气泡
    getNewCircleData2() {
        console.log('====getNewCircleData2=====获取新气泡================');

        const faceTypeClone = Utils.utils.deepClone(this.faceTypeClone);
        //哪个收集faceId用完额度了就踢出
        if (this.curStage > 1) {
            let collectFaceIds = this.collectFaceIds;
            for (const id in faceTypeClone) {
                const value: FaceType = faceTypeClone[id];
                const simplefaceIdArray = value.simplefaceIdArray; //本颜色大类的只有纯颜色表情（除去技能 词条的faceid）

                for (let i = simplefaceIdArray.length - 1; i >= 0; i--) {
                    const faceId = simplefaceIdArray[i];
                    if (collectFaceIds.includes(faceId)) {
                        // const collectIdx = collectFaceIds.indexOf(faceId); //收集栏第几个
                        if (this._createNumber.get(faceId) <= 0) { //可以收集的出现数量用完 (3小关内)
                            simplefaceIdArray.splice(i, 1); //踢出收集的faceId
                            console.log('====getNewCircleData2=====踢出收集的faceId==', faceId);
                            if (simplefaceIdArray.length === 0) {
                                console.log('====getNewCircleData2=====踢出收集的faceType==', id);
                                delete faceTypeClone[id];
                            }
                        }

                    }
                }
            }
            console.log('====getNewCircleData2=====踢出本小关不出现的faceId后==', JSON.stringify(faceTypeClone));
        }


        let collectFaceId = this.collectFaceIds;
        this.faceTypeArray = this.stageConfig.circleType;

        const curDifficultId = this.stageConfig.difficultId;
        console.log('====getNewCircleData2=======curDifficultId===', this.curLittleStage, curDifficultId);
        const difficultConfig = Utils.utils.deepClone(Config.Difficult[curDifficultId[this.curLittleStage - 1]]);
        const circleSizeWeight = difficultConfig.circleSizeWeight; //"气泡大小权重 小|中|大|超大"

        let arr1: Array<WeightMsg> = [];
        circleSizeWeight.forEach((weight, idx) => {
            arr1.push({ id: idx, weight: weight })
        })
        const circleType: number = Random.randByWeight(arr1); //得到气泡类型 0 1 2 3

        console.log('====getNewCircleData2=======circleType===', circleType);

        // const circleColorProbability = difficultConfig.circleColorProbability[circleType] //"气泡双色概率小|中|大|超大"
        // let colorCount = 1; //这个气泡有几种(1/2)颜色 默认1个
        // const random = Math.random();
        // if (circleColorProbability > 0 && random < circleColorProbability) {
        //     colorCount = 2; //2种颜色
        // }
        const circleColorProbability = difficultConfig['circleColorProbability' + (circleType + 1)];
        let arr: Array<WeightMsg> = [];
        circleColorProbability.forEach((weight, idx) => {
            arr.push({ id: idx, weight: Math.round(weight) }) //weight 四舍五入
        })
        let colorType = Random.randByWeight(arr); //0 1 2 单色|双色|彩虹  (彩虹只出单色)
        const hadCaihong = colorType === 2; //有彩虹

        let colorCount = colorType + 1;
        if (colorType === 2) { //彩虹色
            colorCount = 1;
        }

        if (this.circleMaxFaceCount[circleType] === 1) { //最小气泡只能有一个表情
            colorCount = 1;
        }
        console.log('====getNewCircleData2=======colorCount===', colorCount, hadCaihong);
        let createData: { [id: string]: {} } = {}; //颜色大类对应的 faceId:count

        const faceKindKey = "circleFaceKindWeightByCircleType" + (circleType + 1);
        const weightArray = difficultConfig[faceKindKey];

        // console.log('=======getNewCircleData2======weight======', weightArray);

        let skillCount = this.getSkillWordCount(FaceKindType.SkillFace);
        if (skillCount > difficultConfig.curInBattleItemFaceModify.length - 1) {
            skillCount = difficultConfig.curInBattleItemFaceModify.length - 1;
        }

        const skillWeight = weightArray[1] * difficultConfig.curInBattleItemFaceModify[skillCount];
        weightArray[0] += weightArray[1] - skillWeight;
        weightArray[1] = skillWeight;

        let wordCount = this.getSkillWordCount(FaceKindType.WordFace);
        if (wordCount > difficultConfig.curInBattleWordFaceModify.length - 1) {
            wordCount = difficultConfig.curInBattleWordFaceModify.length - 1;
        }
        const wordWeight = weightArray[2] * difficultConfig.curInBattleWordFaceModify[wordCount];
        weightArray[0] += weightArray[2] - wordWeight;
        weightArray[2] = wordWeight;

        // console.log('=======getNewCircleData2=======curWeight======', weightArray);

        let arr2: Array<WeightMsg> = [];
        weightArray.forEach((weight, idx) => {
            arr2.push({ id: idx, weight: Math.round(weight) }) //weight 四舍五入
        })
        let circleKind = Random.randByWeight(arr2); //0 1 2 氛围表情|道具表情|词条表情
        console.log('====getNewCircleData2=======circleKind=氛围表情|道具表情|词条表情==', collectFaceId, circleKind);

        if (this.curStage === 1 && circleKind === 2) { //第一大关
            circleKind = 0;
        }

        // if (this.curStage > 1) {
        // circleKind = 1;  //test
        // }

        let selectFaceType = null;
        if (circleKind === 0) { //普通face
            const faceTypeIdx = getRandomInt(0, Object.keys(faceTypeClone).length - 1);
            const value: any = Object.values(faceTypeClone)[faceTypeIdx];
            selectFaceType = value.id; //颜色大类确

            const simplefaceIdArray = value.simplefaceIdArray; //纯氛围表情 无道具无词条
            const idx = getRandomInt(0, simplefaceIdArray.length - 1);
            let faceId = simplefaceIdArray[idx];
            if (hadCaihong) {
                selectFaceType = anyCircleType;
                // faceId = this.anyCircleFaceId;
                faceId = Config.FaceType[anyCircleType].simplefaceIdArray[0];

            }
            createData[selectFaceType] = { [faceId]: 1 };
            console.log('====getNewCircleData2=====氛围表情首选==', selectFaceType, faceId);

            if (this.curStage > 1 && this._createNumber.has(faceId)) {
                let count = this._createNumber.get(faceId);
                count--;
                this._createNumber.set(faceId, count);
            }

        } if (circleKind === 1) { //道具 
            let idx = getRandomInt(0, Object.keys(Config.Skill).length - 1);
            const value: Skill = Object.values(Config.Skill)[idx];

            const idx2 = getRandomInt(0, Object.keys(faceTypeClone).length - 1);
            selectFaceType = Number(Object.keys(faceTypeClone)[idx2])
            let faceId = value.faceIds[selectFaceType - 1];
            if (hadCaihong) {
                selectFaceType = anyCircleType;
                faceId = value.faceIds[value.faceIds.length - 1];  //彩虹道具
            }
            createData[selectFaceType] = { [faceId]: 1 };
            console.log('====getNewCircleData2=====道具表情首选==', selectFaceType, faceId);

        } else if (circleKind === 2) {  //词条
            const faceTypeIdx = getRandomInt(0, Object.keys(faceTypeClone).length - 1);
            const value: any = Object.values(faceTypeClone)[faceTypeIdx];
            selectFaceType = value.id; //颜色大类确定

            if (this.allWordFaceIdArray.length === 0) {
                this.initStageWords();
            }
            const idx = getRandomInt(0, this.allWordFaceIdArray.length - 1);
            const faceId = this.allWordFaceIdArray[idx];
            this.allWordFaceIdArray.splice(idx, 1); //用了的faceId 删除

            if (hadCaihong) {
                selectFaceType = anyCircleType;
            }
            createData[selectFaceType] = { [faceId]: 1 };
            console.log('====getNewCircleData2=====词条表情首选==', selectFaceType, faceId);
        }

        // A 1,2,3,4,5,6,7,8,9,10
        // B 3,4,5,6,7,8,9,10
        // C 5,6,7,8,9,10
        // D 8,9,10 其中D需要特殊处理，8和9只能收集最多40%，剩下的只有在最后一关才出

        const circleFaceNum = difficultConfig['circleFaceNum' + (circleType + 1)]
        const circleFaceWeight = difficultConfig['circleFaceWeight' + (circleType + 1)]
        let arr3: Array<WeightMsg> = [];
        circleFaceWeight.forEach((weight, idx) => {
            arr3.push({ id: idx, weight: weight })
        })
        const idx = Random.randByWeight(arr3); //得到face数量的idx
        const faceCount = circleFaceNum[idx]; //这个颜色的数量
        console.log('====getNewCircleData2==表情总数确定======', faceCount, '====还需要创建的表情数量=====', faceCount - 1);

        const needCreateCount = faceCount - 1; //还需要创建的表情数量
        //容错处理
        if (needCreateCount == 0) { //如果表情数量只有1个 则一定是单色 上面随机出双色也改为单色 
            colorCount = 1;
        }

        let firstCount = 0; //第一个颜色创建的数量
        for (let i = 0; i < colorCount; i++) {
            let faceType = selectFaceType;
            if (i > 0) {
                delete faceTypeClone[faceType]; //去除已经随到的颜色大类

                const faceTypeIdx = getRandomInt(0, Object.keys(faceTypeClone).length - 1);
                const value: any = Object.values(faceTypeClone)[faceTypeIdx];
                faceType = value.id; //颜色大类确定
                createData[faceType] = {};
            }

            console.log('=====getNewCircleData2=====2222==========', i, faceType)

            let curFaceTypeCount = 0; //本颜色大类需要创建的数量
            if (colorCount === 1) {
                curFaceTypeCount = needCreateCount;
            } else {
                if (i === 0) {
                    curFaceTypeCount = Math.floor(needCreateCount / 2);
                    firstCount = curFaceTypeCount;
                } else {
                    curFaceTypeCount = needCreateCount - firstCount;
                }
            }
            console.log(i, '====getNewCircleData2==本颜色还需要创建数量==1===', curFaceTypeCount);


            for (let k = 0; k < curFaceTypeCount; k++) {
                let faceTypeConfig: FaceType = faceTypeClone[faceType];
                if (faceType === anyCircleType) {
                    faceTypeConfig = Config.FaceType[anyCircleType];
                }
                // console.log(i, '====getNewCircleData2==本颜色还需要创建数量==222===', faceType, JSON.stringify(faceTypeClone), faceTypeConfig);
                const simplefaceIdArray = faceTypeConfig.simplefaceIdArray;

                const faceIdIdx = getRandomInt(0, Object.keys(simplefaceIdArray).length - 1);
                let faceId = simplefaceIdArray[faceIdIdx];
                console.log('====getNewCircleData2==add===faceId==', faceId);

                if (this.curStage > 1 && this._createNumber.has(faceId)) {
                    if (this._createNumber.get(faceId) <= 0) {
                        continue;
                    }
                    let count = this._createNumber.get(faceId);
                    count--;
                    this._createNumber.set(faceId, count);
                }

                if (!createData[faceType][faceId]) {
                    createData[faceType][faceId] = 0;
                }
                createData[faceType][faceId] += 1;
            }
        }
        console.log(circleType, '======getNewCircleData2=======createData===success=========', createData);

        return [circleType, createData];

        // if (Date.now() % 2 == 1) {
        //     return [3, { [1]: { 1003: 6 }, [8]: { 1703: 1 } }]  //test
        // } else {
        //     return [3, { [8]: { 1703: 3 } }]  //test
        // }
        // return [1, { [1]: { 1003: 1 }, [8]: { 1703: 2 } }]  //test
    }


    getSkillWordCount(_type: FaceKindType) {
        let count = 0;
        for (let i = 0; i < this.boxNode.children.length; i++) {
            const circleNode = this.boxNode.children[i];
            const modelCircle: ModelCircle = circleNode.getComponent(ModelCircle);
            if (modelCircle.stillExist() && (modelCircle.getState() === CircleState.Pool || modelCircle.getState() === CircleState.Shoot)) {

                const faceTypeData = modelCircle.getFaceTypeData();
                for (const faceType in faceTypeData) {
                    const faceInfo = faceTypeData[faceType]
                    for (const faceId in faceInfo) {
                        const faceKind = Config.Face[faceId].faceKind;
                        if (faceKind === _type) {
                            count += Number(faceInfo[faceId]);
                        }
                    }
                }
            }
        }

        const faceTypeData = this.readyCircleFaceData;
        for (const faceType in faceTypeData) {
            const faceInfo = faceTypeData[faceType]
            for (const faceId in faceInfo) {
                const faceKind = Config.Face[faceId].faceKind;
                if (faceKind === _type) {
                    count += Number(faceInfo[faceId]);
                }
            }
        }

        console.log('========getSkillWordCount=======', _type, count)
        return count;
    }


    pushWordId() {
        Config.Word[10005].faceArray.forEach((faceId) => {
            this.allWordFaceIdArray.push(faceId)
        })
        Config.Word[10006].faceArray.forEach((faceId) => {
            this.allWordFaceIdArray.push(faceId)
        })
    }

    initStageWords() {
        if (this.curStage < 2) {
            return;
        }
        const wordNumberSecondStage: any = getGlobalCfgValue('wordNumberSecondStage'); //本关有多少个词条 
        let allWordFaceIdArray = [];
        for (let i = 0; i < wordNumberSecondStage; i++) {
            let count = 0;
            let arr1 = [];
            for (const wordId in Config.Word) {
                if (this.curLittleStage < 9 && (Number(wordId) === 10005 || Number(wordId) === 10006)) {
                    continue;
                }
                const value = Config.Word[wordId];
                arr1.push({ id: count, weight: value.wordWeight })
                count++;

            }
            const idx = Random.randByWeight(arr1); //得到气泡类型 0 1 2 3
            const faceArray = Object.values(Config.Word)[idx].faceArray;
            allWordFaceIdArray.push(...faceArray);
        }

        this.allWordFaceIdArray = allWordFaceIdArray;
        console.log('=========geCurStageWord========', this.allWordFaceIdArray)
    }

    setCollectFaceIds() {
        if (this.battleType === BATTLE_STAGE_TYPE.CatchFish) {
            this.collectFaceIds = [];
            this.collectFaceType = [];
            this.hadCollectFull = [];
            for (const key in Config.FaceType) {
                if (Number(key) != anyCircleType) {
                    this.collectFaceIds.push(Config.FaceType[key].simplefaceIdArray_fish[0]);
                    this.collectFaceType.push(Config.FaceType[key].id);
                    this.hadCollectFull.push(0);
                }
            }
            return;
        } else if (this.battleType === BATTLE_STAGE_TYPE.Caocao) {
            this.collectFaceIds = [];
            this.collectFaceType = [];
            this.hadCollectFull = [];
            return;
        }


        if (this.curStage === 1) {
            const faceTypes = Utils.utils.deepClone(this.stageConfig.circleType);

            let newCircleType = [];
            for (let i = 0; i < 3; i++) {
                const idx = getRandomInt(0, faceTypes.length - 1)
                newCircleType.push(Number(faceTypes[idx]));
                faceTypes.splice(idx, 1);
            }

            (this.stageConfig as any).circleType = newCircleType;
        }


        this.collectFaceIds = [];
        this.collectFaceType = [];
        this.hadCollectFull = [];

        let count = this.stageConfig.collectFaceId.length;

        const faceTypes = Utils.utils.deepClone(this.stageConfig.circleType);
        for (let i = 0; i < count; i++) {
            const idx = getRandomInt(0, faceTypes.length - 1)
            const selectFaceType = faceTypes[idx];
            this.collectFaceType.push(Number(selectFaceType));
            this.hadCollectFull.push(0);
            faceTypes.splice(idx, 1);

            const simplefaceIdArray = Config.FaceType[selectFaceType].simplefaceIdArray
            const idx2 = getRandomInt(0, simplefaceIdArray.length - 1)
            const collectFaceId = simplefaceIdArray[idx2];
            this.collectFaceIds.push(Number(collectFaceId));
        }

        let game_had_teach = Utils.storage.getItem('game_had_teach');
        if (!game_had_teach && this.curStage === 1) {
            //教学关卡用黄色（1）和黑色 （7）
            this.collectFaceIds = [Config.FaceType[1].simplefaceIdArray[0], Config.FaceType[7].simplefaceIdArray[0]];
            this.collectFaceType = [1, 7];
            this.hadCollectFull = [0, 0];
        }

        console.log("========setCollectFaceIds==========", this.collectFaceIds, this.collectFaceType, this.hadCollectFull);
    }


    getFaceUseType() {
        const storageBg = Utils.storage.getItem('battle_bg');
        return Number(storageBg);
    }

    checkGuide(flag: GuideType) {
        let hadGuild = Utils.storage.getItem('game_data_guild');
        if (!hadGuild) {
            hadGuild = [];
        } else {
            hadGuild = JSON.parse(hadGuild);
        }
        if (!hadGuild.includes(flag)) {
            this.dispatchUIEmit(UI_EVENT_NAME.FIRST_BOOM_GUIDE, flag);
        }

    }

    //找到最上一层的气泡
    checkTopLayerCircle() {
        const circles = [];
        DataManager.dataBattle.boxNode.children.forEach((circleNode) => {
            if (circleNode.getComponent(ModelCircle).stillExist() && circleNode.getComponent(ModelCircle).getState() === CircleState.Pool) {
                circles.push(circleNode);
            }
        })

        if (circles.length === 0) {
            console.log('====checkTopLayerCircle=====empty===');
            return [];
        }

        //气泡按照从大到小排序
        circles.sort((a, b) => {
            return convertToWorldSpaceAR(b).y - convertToWorldSpaceAR(a).y;
        })

        let topArray = [circles[0]];
        for (let i = 1; i < circles.length; i++) {
            const circleNode = circles[i];
            const curPos = convertToWorldSpaceAR(circleNode); //当前气泡的世界坐标

            let hadTop = false; //头上还有没有气泡
            for (let j = 0; j < i; j++) {
                const checkCirclePos = convertToWorldSpaceAR(circles[j]);
                const circleType = circles[j].getComponent(ModelCircle).getCircleType();
                const circleSize = this.circleSize[circleType]; //直径

                let rect = new Rect();
                rect.x = curPos.x - 10;
                rect.y = curPos.y;
                rect.width = 20;
                rect.height = 700;
                const hadRinterSect = Utils.intersect.rectCircle(rect, v2(checkCirclePos.x, checkCirclePos.y), circleSize / 2);
                if (hadRinterSect) { //头上有气泡 中止
                    hadTop = true;
                    break;
                }
            }
            if (!hadTop) {
                // const modelCircle: ModelCircle = circles[i].getComponent(ModelCircle);
                // topArray.push(modelCircle.getFaceTypeData());
                topArray.push(circles[i]);
            }
        }

        console.log('=========checkTopLayerCircle==========', topArray.length)

        return topArray;
    }

    //检查是否触发 人为干预 (距离警戒线100)
    checkTriggerInterveneCircle() {
        if (!this.boxNode) {
            return;
        }
        const distance = Number(getGlobalCfgValue('warnLineDistance'));
        for (let i = 0; i < this.boxNode.children.length; i++) {
            const node = this.boxNode.children[i];
            const pos = convertToWorldSpaceAR(node);

            const radius = node.getComponent(UITransform).contentSize.height / 2;
            const maxY = pos.y + radius;
            if (maxY + distance > this.warnLineY && node.getComponent(ModelCircle).stillExist() && node.getComponent(ModelCircle).getState() == CircleState.Pool) {
                console.log('=====checkTriggerInterveneCircle========警戒线100==============')
                return true;
            }
        }

        return false;
    }


    getNewCircleInfo() {
        let info = null
        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main) {
            if (DataManager.dataBattle.curStage === 1) {
                const game_had_teach = Utils.storage.getItem('game_had_teach');
                if (game_had_teach) {
                    info = DataManager.dataBattle.getNewCircleData2();
                } else {
                    info = DataManager.dataBattle.getNewCircleData();
                }
            } else {
                info = DataManager.dataBattle.getNewCircleData2(); //随机获取一个新的data
            }
        } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish) {
            info = DataManager.dataBattle.getNewCircleData2(); //难度设置
        } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
            info = DataManager.dataBattle.getNewCircleData2(); //难度设置
        }
        return info;
    }

    getNewCircle() {
        //触发警戒线

        //捕鱼没有人工干预
        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish || DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
            return this.getNewCircleInfo();
        }
        if (this.checkTriggerInterveneCircle()) {
            console.log('==getNewCircle======触发警戒线==')
            return this.getInterveneCircle();
        } else {
            console.log('=getNewCircle========没有==触发警戒线=======')
            return this.getNewCircleInfo();
        }
    }

    _missCount = 0;
    _triggerCount = 0;
    _curTriggerId = null;
    getInterveneCircle() {
        console.log('======getInterveneCircle======1===')
        let collectNum = 0;
        this.hadCollectFull.forEach((count) => {
            collectNum += count;
        })

        let sum = 0
        this.stageConfig.collectFaceId.forEach((count) => {
            sum += count;
        })

        const remainProgress = (sum - collectNum) / sum;
        console.log('====getInterveneCircle====2===剩余百分比====', remainProgress)

        const interveneGroupId = this.stageConfig.interventionGroupID;
        for (const id in Config.Intervention) {
            const value = Config.Intervention[id];
            if (value.interventionID === interveneGroupId && remainProgress > value.destPerMin && remainProgress <= value.destPerMax) {
                console.log('====getInterveneCircle====2===按照这个id====', id);
                if (value.id != this._curTriggerId) { //下一个阶段了 重置
                    this._missCount = 0;
                    this._triggerCount = 0;
                    this._curTriggerId = value.id;
                }

                ////如果在最大发生次数内且保底次数已到上限，直接产生救命气泡。
                if (this._missCount >= value.saveLifeMinimumGuarantee) {
                    this._missCount = 0;
                    this._triggerCount++;
                    return this.createInterveneCircle(value); // //创建人工干预的气泡
                }

                const random = Math.random();
                console.log('=======getInterveneCircle=======random==========', random)
                if (random > value.saveLifeRate) { //还是走普通创建气泡
                    console.log('=======getInterveneCircle=========是走普通创建气泡===========')
                    this._missCount++;
                    return this.getNewCircleInfo();
                }
                if (this._triggerCount >= value.saveLifeMaxCount) { //次数够了 还是创建普通气泡
                    console.log('=======getInterveneCircle=========次数够了 还是创建普通气泡===========', this._triggerCount, value.saveLifeMaxCount)
                    return this.getNewCircleInfo();
                }

                //创建人工干预的气泡
                this._missCount = 0;
                this._triggerCount++;
                return this.createInterveneCircle(value);

            }

        }
    }

    // 普通：创建一个和此气泡相同大小的气泡，往此气泡中填充满第一步随机出气泡中的颜色（如果时双色就随机一个颜色）。
    // 彩虹：创建一个和此气泡相同大小的气泡，往此气泡中填充满彩虹表情。
    // 道具：创建一个和此气泡相同大小的气泡，往此气泡中填充满第一步随机出气泡中的颜色（如果时双色就随机一个颜色）+ 1随机道具。
    // 彩虹+道具：创建一个和此气泡相同大小的气泡，往此气泡中填充满彩虹表情 + 1道具。
    createInterveneCircle(value) {
        console.log('====createInterveneCircle==0==');
        const topCircleArray = this.checkTopLayerCircle(); //最上面一层的气泡
        const cIdx = getRandomInt(0, topCircleArray.length - 1);
        const circleNode = topCircleArray[cIdx] //选中一个对应消除的气泡
        const modelCircle: ModelCircle = circleNode.getComponent(ModelCircle);
        const circleSizeType = modelCircle.getCircleType();  //气泡类型 0-3 
        const faceTypeData = modelCircle.getFaceTypeData();  // {faceType:{faceId:count},...}

        const colorNum = modelCircle.getCircleKindType() //单色还是双色
        console.log(circleSizeType, '====createInterveneCircle==select==1=====', faceTypeData);

        let selectFaceType = Number(Object.keys(faceTypeData)[0]) //选中的颜色大类
        if (colorNum === CircleKindType.TwoColor) { //双色就二选一
            const idx = getRandomInt(0, 1);
            selectFaceType = Number(Object.keys(faceTypeData)[idx])
        }

        let hadCount = 0; //当前有多少
        for (const faceId in faceTypeData[selectFaceType + '']) {
            const faceCount = faceTypeData[selectFaceType + ''][faceId];
            hadCount += Number(faceCount)
        }

        let maxCount = this.circleMaxFaceCount[circleSizeType] + 1 - hadCount; //最大容纳的数量
        if (maxCount <= 0) { //双色球里 会出现超过最大值的球
            maxCount = 1
        }
        console.log('====createInterveneCircle==selectFaceType==2=====', selectFaceType, maxCount);

        let arr1: Array<WeightMsg> = [];
        value.saveLifeCircleTypeWeight.forEach((weight, idx) => {
            arr1.push({ id: idx, weight: weight })
        })
        let idx: number = Random.randByWeight(arr1); //普通,彩虹,道具,彩虹道具
        console.log('====createInterveneCircle====idx=====', selectFaceType, idx);

        if (circleSizeType == 0) { //最小的球只能有1个
            idx = getRandomInt(0, 1);
            maxCount = this.circleMaxFaceCount[circleSizeType];
        }
        if (maxCount > this.circleMaxFaceCount[circleSizeType]) {
            maxCount = this.circleMaxFaceCount[circleSizeType];
        }

        switch (idx) {
            case 0:
                const faceId_0 = Config.FaceType[selectFaceType].simplefaceIdArray[0]
                return [circleSizeType, { [selectFaceType]: { [faceId_0]: maxCount } }]
            case 1:
                const faceId_1 = Config.FaceType[anyCircleType].simplefaceIdArray[0]
                return [circleSizeType, { [anyCircleType]: { [faceId_1]: maxCount } }]
            case 2:
                const faceId_2 = Config.FaceType[selectFaceType].simplefaceIdArray[0]
                //随机道具
                const skillValues = Object.values(Config.Skill);
                const idx = getRandomInt(0, skillValues.length - 1);
                const valueSkill = skillValues[idx];
                const skillFaceId = valueSkill.faceIds[selectFaceType - 1];


                let needCount = maxCount - 1;
                if (needCount <= 0) {
                    needCount = 1;
                }
                return [circleSizeType, { [selectFaceType]: { [faceId_2]: needCount, [skillFaceId]: 1 } }]
            case 3:
                const faceId_3 = Config.FaceType[anyCircleType].simplefaceIdArray[0];
                //随机道具
                const skillValues_1 = Object.values(Config.Skill);
                const idx_1 = getRandomInt(0, skillValues_1.length - 1);
                const valueSkill_1 = skillValues_1[idx_1];
                const skillFaceId_1 = valueSkill_1.faceIds[anyCircleType - 1];
                let needCount_1 = maxCount - 1;
                if (needCount_1 <= 0) {
                    needCount_1 = 1;
                }
                return [circleSizeType, { [anyCircleType]: { [faceId_3]: needCount_1, [skillFaceId_1]: 1 } }]

            default:
                break;
        }

    }



    // 清空数据
    public clear(): void {
        super.clear();
        this.readyCircleFaceData = {};
    }
}


