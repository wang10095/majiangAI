import { _decorator, Node, Label, UITransform, find, Color, view, v3, sys, Sprite, isValid, Prefab, instantiate, EventTouch, RigidBody2D, CircleCollider2D, SpriteFrame, v2, ERigidBody2DType, tween, sp, JsonAsset, UIOpacity, AudioSource } from 'cc';
import { SuperScene } from '../../frame/center/components/super-scene';
import { Manager } from '../../frame/center/manager';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { DataManager } from '../data/data-manager';
import { bezierCurveTo2, changeParent, convertToNodeSpaceAR, convertToWorldSpaceAR, createCommonSpine, createLizi, G_setRemoteSpriteFrame, G_setSpriteFrame, gotoScene, loadMaterial } from '../ui-commonset';
import { CircleAnimType, ModelCircle } from '../../model/model-circle';
import { anyCircleType, CircleKindType, CircleState, CountdownTypeBy, DATA_EVENT_NAME, G_isTest, G_WordIconUrl, GameBattleStatus, GuideType, MaterialType, UI_EVENT_NAME, UI_NAME } from '../constant/common-define';
import { Toast } from '../../frame/center/components/toast';
import { macro } from 'cc';
import { ModelStage } from '../../model/model-stage';
import { CollectFace, PerticleType } from './collect-face';
import SkillDefine, { PropType, SkillPosType } from '../constant/skill-define';
import { ModelLine } from '../../model/model-line';
import { TimerLabelBy, TimerLabelType } from '../../frame/center/components/timer-label';
import Utils from '../../frame/center/utils/utils';
import { SkillStatus } from '../data/data-skill';
import { eventAfterPhysics, G_setSpriteGray, getGlobalCfgValue, getRandomInt } from '../common';
import { SuperSpine } from '../../frame/center/components/super-spine';
import { FaceKindType, ModelFace } from '../../model/model-face';
import { Tween } from 'cc';
import { sdkUtils } from '../../frame/sdk-common/sdk-utils';
import { BATTLE_END_NEXT_OPERATION, BATTLE_STAGE_TYPE } from '../data/data-battle';
import { systemEvent } from 'cc';
import { SystemEvent } from 'cc';
import { KeyCode } from 'cc';
import { EventKeyboard } from 'cc';
import ScrollReuse from '../../frame/center/components/scroll-endless';
import UIButton from '../../frame/center/components/ui-button';
import { RED_DOT_KEY } from '../common/red-dot';
import { TESdkData } from '../../frame/sdk-common/TE-sdk';
import { isMiniGame } from '../game-define';
import { ComboToast } from './combo-toast';

export enum FailType {
    None = 0,
    DeadLine = 1, //超时
    WarnLine = 2,//警戒线失败
}

export enum BattleSkillType {
    None = 0,
    RandomBoom = 1,
    ReadyCaihong = 2,
}

enum PropRemindType {
    TimeRemind = 0,
    WarnLine = 1,
}

const nodeSkillPos = [v3(315, -55, 0), v3(-315, -180, 0), v3(-315, -180, 0)];

const { ccclass, property } = _decorator;
@ccclass('battle')
export class battle extends SuperScene {
    @property({
        type: Node,
        displayName: '顶部的区域'
    })
    topNode: Node;

    @property({
        type: Node,
        displayName: '背景的节点'
    })
    bgNode: Node;

    @property({
        type: Node,
        displayName: '中间的区域'
    })
    centerNode: Node;

    @property({
        type: Node,
        tooltip: 'touch'
    })
    nodeTouch: Node;

    @property({
        type: Node,
        tooltip: '技能节点'
    })
    nodeSkill: Node = null;

    @property({
        type: Node,
        tooltip: '关卡节点'
    })
    nodeStage: Node = null; //关卡节点

    @property({
        type: Node,
        tooltip: '新气泡的父节点'
    })
    nodeReadyCircle: Node = null; //准备下落气泡的父节点

    @property({
        type: Node,
        tooltip: '等待气泡的父节点'
    })
    nodeWaitCircle: Node = null; //等待气泡的父节点

    @property({
        type: Label,
        tooltip: '剩余步数',
    })
    labRemainTime: Label = null;

    @property({
        type: Node,
        displayName: '收集栏',
    })
    layoutCollect: Node = null;

    @property({
        type: Node,
        displayName: '收集栏Fish',
    })
    layoutFishCollect: Node = null;

    @property({
        type: [Node]
    })
    collectSpines: Node[] = [];

    @property({
        type: Node,
        tooltip: '警戒线',
    })
    warnLine: Node = null;

    @property({
        type: Node,
        displayName: '底座对准节点',
    })
    underPinLine: Node = null;

    @property({
        type: Node,
        tooltip: '词条收集区'
    })
    scrollView: Node = null;

    @property({
        type: [Node],
        tooltip: '展示区域（上中下）',
    })
    nodeLocation: Node[] = [];

    @property({
        type: Prefab
    })
    prefabCollectFace: Prefab = null;

    @property({
        type: Node,
        tooltip: '全屏屏蔽触摸'
    })
    stopTouch: Node = null; //全屏屏蔽触摸

    @property({
        type: Node,
        tooltip: '全部黑遮罩'
    })
    maskAll: Node = null; //全屏黑

    @property({
        type: [Node],
        tooltip: '底部三个道具'
    })
    battlProps: Node[] = [];

    @property({
        type: SpriteFrame,
        tooltip: '第二关收集底板'
    })
    bgColelctSpriteFrame: SpriteFrame = null;

    @property({
        type: Node,
        tooltip: 'scroll'
    })
    bg_scroll: Node = null;

    @property({
        type: Node,
        tooltip: '底部技能板'
    })
    nodeSkillPanel: Node = null;

    @property({
        type: Node,
        tooltip: '交换按钮(等待和发射气泡)'
    })
    btnExchange: Node = null;

    @property({
        type: Node,
        tooltip: '收集按钮'
    })
    btnCollection: Node = null;

    @property({
        type: Label,
        tooltip: '当前第几小关'
    })
    labLittleStage: Label = null;

    @property({
        type: Node,
        tooltip: '帮助按钮'
    })
    btnHelp: Node = null;

    @property({
        type: Node,
        tooltip: '引导显示的节点'
    })
    nodeGuide: Node = null;

    @property({
        type: [Node],
        tooltip: '收集板节点'
    })
    nodeCollectPanels: Node[] = [];

    @property({
        type: [Node],
        tooltip: '下方底板'
    })
    bgBottoms: Node[] = [];

    @property({
        type: Node,
        tooltip: '额外技能节点'
    })
    nodeSkillPos: Node = null;

    @property({
        type: Sprite,
        displayName: '深海捕鱼光线'
    })
    spriteLight: Sprite = null;

    @property({
        type: Node,
        displayName: '曹操node'
    })
    nodeCaocao: Node = null;

    //========================================变量声明===============================
    nodeBox: Node = null; //所有气泡的父节点 
    _curCircle: Node = null; //当前准备下落的气泡
    _waitCircle: Node = null; //在右上角等待的气泡
    _loseCount: number = 0;
    _shootCount: number = -1
    _exchangeCount: number = 0; //右下角交换按钮使用次数
    gameStatus: GameBattleStatus = GameBattleStatus.None;

    failType: FailType = FailType.None; //失败的类型 
    battlePropCount: Array<number> = [0, 0, 0];  //道具使用类型   0没看广告  1一次使用 -1 用完次数
    propCanUseCount: Array<number> = [1, 1, 1];  //道具可以使用的次数
    touchHash: {} = {};
    _propRemind = [false, false];

    _comboCount: number = 0; // 1 秒计数
    _comboNum: number = 0; //累计的消除次数

    _caocaoProgress: Sprite = null;
    _caocaoSpine: Node = null;
    _caocalLabProgress: Label = null;
    _gameProgress: Sprite = null;
    _labGameProgress: Label = null;


    checkCanTouch() {
        for (const key in this.touchHash) {
            if (this.touchHash[key]) { //有屏蔽的
                return false;
            }
        }
        return true;
    }

    setTouchShield(key: string, flag: boolean) {
        //true 是屏蔽 false是取消屏蔽
        console.log('======setTouchShield===========', key, flag);
        this.touchHash[key] = flag;
    }

    onLoad(): void {

        super.onLoad();
        DataManager.currentSceneName = 'battle';
        this.registerEmit(
            [
                UI_EVENT_NAME.CIRCLE_FIRST_CONTACT, //气泡落下首次碰撞 警戒线以下
                UI_EVENT_NAME.UNDERPIN_DESTORY_BROADCAST, //下一小关
                UI_EVENT_NAME.SKILL_TRIGGER,  //技能触发 
                UI_EVENT_NAME.COLLECTION_WORD, //收集词条
                UI_EVENT_NAME.COLLECTION_FACE, //收集face
                UI_EVENT_NAME.WORD_TRIGGER,
                UI_EVENT_NAME.GAME_NEXT,
                UI_EVENT_NAME.CIRCLE_TOUCH_DESTORY,
                UI_EVENT_NAME.READY_CIRCLE_CHANGE_CAIHONG,
                UI_EVENT_NAME.GAME_SWITCH_SCENE,
                UI_EVENT_NAME.USE_BATTLE_PROP,
                UI_EVENT_NAME.FIRST_BOOM_GUIDE,
                UI_EVENT_NAME.Popup_Show,
                UI_EVENT_NAME.Popup_Close,
                UI_EVENT_NAME.TOUCH_ONE_DESTORY,
                DATA_EVENT_NAME.GET_NEW_WORD,
                UI_EVENT_NAME.STAGE_MOVE,
            ],
            [
                this.newCircleReady, //前一个气泡下落碰撞后 通知下一个气泡准备
                this.nextLittleStagePull,
                this.triggerSkill,
                this.collectionWord,
                this.collectionFace,
                () => {
                    this.scheduleOnce(() => {  //涉及到资源的释放
                        this.triggerWord();
                    })
                },
                this.gameEndNext,
                (flag) => {
                    if (!flag) {
                        changeParent(this.nodeBox, this.nodeStage.getChildByName('stage'))
                        this.setZorderBoxContent();
                        this.maskAll.active = false;
                        this.setTouchShield('touch_one_destory', false);
                        this.labRemainTime.getComponent(TimerLabelBy).resumeCountDown();
                    }
                },
                this.changeFaceToCaihong,
                this.collectFaceAnim,
                this.getBattleProp,
                this.firstBoomGuide,
                this.pauseGame,
                this.resumeGame,
                this.touchOneDestory,
                this.initSkillInfo,
                (flag) => { //第二关 过场动画 不可点击
                    this.setTouchShield('show_stage_move', flag)
                }
            ],
            this
        );

        this.resetGameConfig();

        //只有普通模式才能触发引导
        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main) {
            let hadGuild = Utils.storage.getItem('game_data_guild');
            if (!hadGuild) {
                hadGuild = [];
            } else {
                hadGuild = JSON.parse(hadGuild);
            }

            if (!hadGuild.includes(GuideType.Help_Tip_1)) {
                this.firstBoomGuide(GuideType.Help_Tip_1)
            }
        }

    }

    resetGameConfig() {
        DataManager.dataBattle.skillUseLimit = [1, 1, 1, 1, 1, 1, 1, 1]; //右下角 技能使用次数
        DataManager.dataBattle.reviveLimit = [1, 1]; //两种复活可以使用的次数
        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish) {
            DataManager.dataBattle.reviveLimit = [2, 2];
        } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
            DataManager.dataBattle.reviveLimit = [0, 2]; //只有警戒线失败
        }
    }

    async firstBoomGuide(_type) {
        if (DataManager.dataBattle.battleType !== BATTLE_STAGE_TYPE.Main) {
            return;
        }
        if (_type === GuideType.Tip_Collecting) {
            this.pauseGame(false);
            const path = `battle://image/btn_guide/spriteFrame`;
            console.log('===firstBoomGuide====pathpathpath======1===', path);
            const spriteFrame: SpriteFrame = await Manager.bundleManager.load<SpriteFrame>(path, SpriteFrame);
            if (isValid(this.node)) {
                const node = new Node();
                node.addComponent(UITransform);
                node.angle = 180;
                const sprite = node.addComponent(Sprite);
                sprite.spriteFrame = spriteFrame;
                node.parent = this.nodeSkill;
                node.name = 'guide_collection';
                const pos = convertToWorldSpaceAR(this.btnCollection);
                const newPos = convertToNodeSpaceAR(pos, this.nodeSkill);
                node.setPosition(newPos.x - 30, newPos.y + 150, newPos.z);
                tween(node).by(0.5, { position: v3(0, 50, 0) }).by(0.5, { position: v3(0, -50, 0) }).union().repeatForever().start();

                this.maskAll.active = true;
                changeParent(this.btnCollection, this.maskAll);
            }
        } else if (_type === GuideType.Help_Tip_3) {
            this.nodeGuide.active = false;
            uiManager.show(UI_NAME.GuidePanel, _type);
        } else {
            let path = 'guide://image/tip_2';
            if (_type === GuideType.Help_Tip_2) {
                path = 'guide://image/tip_3';
            }
            tween(this.nodeGuide.getComponent(UIOpacity)).to(0.3, { opacity: 0 }).call(() => {
                G_setSpriteFrame(this.nodeGuide, path);
            }).delay(0.3).to(0.3, { opacity: 210 }).call(() => {

            }).start();
        }

        let hadGuild = Utils.storage.getItem('game_data_guild');
        if (!hadGuild) {
            hadGuild = [];
        } else {
            hadGuild = JSON.parse(hadGuild);
        }
        if (!hadGuild.includes(_type)) {
            hadGuild.push(_type);
            Utils.storage.setItem('game_data_guild', JSON.stringify(hadGuild));
        }
    }

    setZorderBoxContent() {
        this.nodeBox.setSiblingIndex(20);
        this.nodeStage.getChildByName('stage').getChildByName('content').setSiblingIndex(30);
    }

    start() {
        console.log('=========battle start==========')
        super.start();
        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main) {
            Manager.audioManager.playMusic('S_BGmusic');
        } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish) {
            Manager.audioManager.playMusic('S_FishBGM');
        } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
            Manager.audioManager.playMusic('S_CCBGM');
        }


        //=============不同战斗类型 设置============================================================================================
        this.nodeCollectPanels.forEach((node) => { //收集板
            node.active = false;
        })
        this.nodeCollectPanels[DataManager.dataBattle.battleType].active = true;
        this.bgBottoms.forEach((node) => { //下方背景板
            node.active = false;
        })
        this.bgBottoms[DataManager.dataBattle.battleType].active = true;

        this.nodeSkillPos.setPosition(nodeSkillPos[DataManager.dataBattle.battleType]);

        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish || DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) { //捕鱼没有收集册
            this.btnCollection.active = false;
            this.scrollView.parent.active = false;

            const node = this.bgBottoms[DataManager.dataBattle.battleType];
            const wordPos = convertToWorldSpaceAR(node);
            const pos = convertToNodeSpaceAR(wordPos, this.node);
            this.underPinLine.setPosition(pos);  //底座基准线和底部面板平齐

            if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish) {
                G_setSpriteFrame(this.spriteLight, 'battle://light'); //光线
            } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {  //曹操的时钟 在左边
                changeParent(this.labRemainTime.node.parent, this.topNode)
                this.labRemainTime.node.parent.setPosition(-250, 100)
            }

        }



        //==========================初始化================================================================
        const viewSize = view.getVisibleSize();
        // 远超设计分辨率的长屏幕，将多余的长度分： 顶 底和中间娃娃机 均分，防止上下区域过大
        const safeArea = sys.getSafeAreaRect();
        console.log('safearena:', safeArea, safeArea.y, safeArea.height);
        console.log('height:', viewSize.height - safeArea.y);
        viewSize.height -= safeArea.y;
        //记录底座线高度
        DataManager.dataBattle.underPinLocY = convertToWorldSpaceAR(this.underPinLine).y;

        this.addTouchEventListeners();
        this.initStage();

        this.maskAll.active = DataManager.dataBattle.battleType !== BATTLE_STAGE_TYPE.Caocao; //全屏黑遮罩显示  要出现收集板动画

        //引导
        let hadGuild = Utils.storage.getItem('game_data_guild');
        if (!hadGuild) {
            hadGuild = [];
        } else {
            hadGuild = JSON.parse(hadGuild);
        }
        if (!hadGuild.includes(GuideType.Tip_Hand)) {
            hadGuild.push(1);
            uiManager.show(UI_NAME.GuildPanel)
            Utils.storage.setItem('game_data_guild', JSON.stringify(hadGuild));
        }

        //=-----全关卡-----
        this.initSkillInfo()//右侧两个技能信息 是否收集全触发一次词条
        this.nodeSkillPanel.active = false;
        this.initExchangeCount(); //有5次免费交换次数
    }

    initExchangeCount() {
        const freeCount: number = Number(getGlobalCfgValue('freeExchangeCount'));
        this._exchangeCount = freeCount;
        this.btnExchange.getChildByName('name').getComponent(Label).string = `剩余${this._exchangeCount}次`;
        this.btnExchange.getChildByName('ads').active = false;
    }

    async initSkillInfo() {
        const btnNode = this.nodeSkillPanel.children[0];
        for (let i = 1; i < this.nodeSkillPanel.children.length; i++) {
            if (isValid(this.nodeSkillPanel.children[i])) {
                this.nodeSkillPanel.children[i].destroy();
            }
        }
        btnNode.active = false;

        let info = [];
        if (G_isTest) {
            const wordCollect = Utils.storage.getItem('word_colelction');
            if (wordCollect && wordCollect !== '') {
                info = JSON.parse(wordCollect);
            }
        } else {
            info = DataManager.dataHome.wordCollection;
        }

        for (const collectId in Config.CollectEffect) {
            const value = Config.CollectEffect[collectId];
            if (!value.isUse) {
                continue;
            }

            let hadFull = true;

            for (let i = 0; i < value.wordID.length; i++) {
                const wordID = value.wordID[i];
                if (!info.includes(wordID)) {
                    hadFull = false;
                    break;
                }
            }

            const nodeBtn = instantiate(btnNode);
            nodeBtn.parent = this.nodeSkillPanel;
            nodeBtn.active = true;
            if (hadFull) { //收集全了 激活
                nodeBtn.getComponent(UIButton).clickEvents[0].customEventData = value.collectID + '';
                const path = `battle://image/${value.skillIcon}/spriteFrame`
                const spriteFrame: SpriteFrame = await Manager.bundleManager.load<SpriteFrame>(path, SpriteFrame);
                nodeBtn.getChildByName('icon').getComponent(Sprite).spriteFrame = spriteFrame;

                const word_collect_id = Utils.storage.getItem('word_collect_id');
                let newCollect = false;
                if (word_collect_id) {
                    const info = JSON.parse(word_collect_id);
                    if (!info.includes(value.collectID)) {
                        info.push(value.collectID);
                        Utils.storage.setItem('word_collect_id', JSON.stringify(info));
                        this.dispatchEmit('SET_RED_DOT', RED_DOT_KEY.WORD_COLLETION, true);  //红点逻辑
                        newCollect = true;
                    }
                } else {
                    Utils.storage.setItem('word_collect_id', JSON.stringify([value.collectID]));
                    this.dispatchEmit('SET_RED_DOT', RED_DOT_KEY.WORD_COLLETION, true);  //红点逻辑
                    newCollect = true;
                }

            }
        }

    }

    //进入关卡后 收集板动画
    collectFaceAnim() {
        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
            this.setDeadTime();
            return;
        }

        const isDifficulty = DataManager.dataBattle.curStage > 1;
        const nodeCollection = this.topNode.getChildByName('node_collection')
        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main && DataManager.dataBattle.curStage > 1) {
            nodeCollection.getChildByPath('bg/bg_collect').getComponent(Sprite).spriteFrame = this.bgColelctSpriteFrame;
        }

        this.maskAll.active = true;

        nodeCollection.active = true;
        const wordPos = convertToWorldSpaceAR(nodeCollection);
        const newPos = convertToNodeSpaceAR(wordPos, this.maskAll);
        changeParent(nodeCollection, this.maskAll);

        nodeCollection.setPosition(-500, 0, 0);

        tween(nodeCollection).to(0.5, { position: v3(newPos.x, 0, 0) }).delay(0.5).to(0.5, { position: v3(newPos.x, newPos.y, 0) }).delay(0.3).call(() => {
            changeParent(nodeCollection, this.topNode);
            this.maskAll.active = false;

            if (!isDifficulty) {
                this.setDeadTime();
            }

        }).start();

        if (isDifficulty) {
            // this._canTouch = false; //屏蔽触摸
            this.setTouchShield('diffcultyIcon', true);

            const nodeDifficulty = this.ui.getChildByName('difficulty');
            nodeDifficulty.active = true;
            nodeDifficulty.setPosition(800, 0, 0);

            tween(nodeDifficulty).delay(1.8 + 0.5).call(() => {
                this.maskAll.active = true;
            }).to(0.5, { position: v3(0, 0, 0) }).delay(0.8).to(0.5, { position: v3(-800, 0, 0) }).call(() => {
                nodeDifficulty.active = false;
                this.maskAll.active = false;
                // this._canTouch = true;
                this.setTouchShield('diffcultyIcon', false);
                this.previewUIHideOrShow(true);

                this.setDeadTime();
            }).start();

        }
    }

    //收集face 飞到收集栏或者四散开来
    async collectionFace(nodes: Array<Node>, warnBoom: boolean = false, addFace: boolean = false) {
        console.log('======collectionFace=======', this._comboNum);
        if (this.gameStatus != GameBattleStatus.End && !warnBoom && !addFace) {
            this._comboNum++;
            if (this._comboNum === 1) {
                this._comboCount = 0; //从第一个开始
            }
            if (this._comboNum > 1) {
                this.showCombom(this._comboNum);
            }
        }

        const curStageConfig: Stage = DataManager.dataBattle.stageConfig;
        let checkNeedCollect = (checkFaceId: number) => {

            for (let i = 0; i < DataManager.dataBattle.collectFaceIds.length; i++) {
                const faceId = DataManager.dataBattle.collectFaceIds[i];
                if (faceId == checkFaceId) {
                    return [i, curStageConfig.collectFaceId[i]];
                }
            }

            return [-1, 0];
        }

        console.log('===========collectionFace================', nodes.length, warnBoom)
        //一定要逆序遍历
        for (let i = nodes.length - 1; i >= 0; i--) {
            const faceNode = nodes[i];
            const faceModel = faceNode.getComponent(ModelFace)
            changeParent(faceNode, this.nodeSkill);

            faceNode.getComponent(RigidBody2D).type = ERigidBody2DType.Kinematic; //不再受重力

            faceNode.getComponent(CircleCollider2D).sensor = true; //设置传感器 飞行时候不会和其他face碰撞
            const faceId = faceNode.getComponent(ModelFace).getFaceId();
            const faceConfig = Config.Face[faceId];


            const collectInfo = checkNeedCollect(faceId);
            let collectIdx = collectInfo[0];
            let needCollectNum = collectInfo[1];
            if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
                collectIdx = 0;
            }


            const pos = faceNode.getPosition(); //起始点坐标

            if (faceModel.getFaceKind() === FaceKindType.SkillFace) {
                //技能表情不飞走留在原地
                // faceNode.getComponent(RigidBody2D).type === ERigidBody2DType.Kinematic;
                const skillConfig: Skill = Config.Skill[faceConfig.skillId];
                if (skillConfig.skillPosType === SkillPosType.ScreenPos) { //飞到指定位置
                    const location = skillConfig.location;
                    const nodeLoc = this.nodeLocation[location - 1];
                    const offSet: Array<number> = skillConfig.offSet;

                    const wordPos = convertToWorldSpaceAR(nodeLoc);
                    const curPos = convertToNodeSpaceAR(v3(wordPos.x, wordPos.y, 0), this.nodeSkill);
                    const pos = v3(curPos.x + offSet[0], curPos.y + offSet[1], 0);
                    tween(faceNode).to(0.3, { position: v3(pos.x, pos.y, 0) }).destroySelf().start();
                } else { //原地放大缩小
                    tween(faceNode).to(0.3, { scale: v3(2, 2, 1) }).to(0.3, { scale: v3(1, 1, 1) }).destroySelf().start();
                }
                continue;
            } else if (faceModel.getFaceKind() === FaceKindType.WordFace) {
                // faceNode.getComponent(RigidBody2D).type === ERigidBody2DType.Kinematic;
                tween(faceNode).to(0.3, { scale: v3(0, 0, 0) }).destroySelf().start();
                continue
            }

            let checkCanCollect = () => { //检查是否收集满
                if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main) {
                    return DataManager.dataBattle.hadCollectFull[collectIdx] < needCollectNum
                } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish) {
                    return true;
                } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
                    if (DataManager.dataBattle.caocaoBlood <= 0) {
                        return false;
                    } else {
                        return true;
                    }
                }
            }

            let hadLizi = false;
            //游戏没结束 不是警戒线消除  没有收集满
            if (this.gameStatus != GameBattleStatus.End && !warnBoom && collectIdx >= 0 && checkCanCollect()) { //飞到收集区

                // console.log('======collectionFace=======飞到收集区===================')
                //先更新数据


                let collectFaceNode = null;//找到第几个收集的目标节点
                if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main) {
                    DataManager.dataBattle.hadCollectFull[collectIdx] += 1;
                    collectFaceNode = this.layoutCollect.children[collectIdx];

                    let sum = 0;
                    DataManager.dataBattle.hadCollectFull.forEach((count) => {
                        sum += count;
                    })
                    let needSum = 0;
                    DataManager.dataBattle.stageConfig.collectFaceId.forEach((count) => {
                        needSum += count;
                    })
                    this._gameProgress.fillRange = sum / needSum;
                    this._labGameProgress.string = Math.floor(sum / needSum * 100) + '%'
                    if (sum >= needSum) {
                        this._gameProgress.fillRange = 1.0;
                        this._gameProgress.node.parent.getChildByName('gou').active = true;

                        this._labGameProgress.string = '100%'
                    }

                } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish) {
                    DataManager.dataBattle.hadCollectFull[collectIdx] += 1;
                    collectFaceNode = this.layoutFishCollect.children[collectIdx];
                } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
                    DataManager.dataBattle.caocaoBlood--;
                    collectFaceNode = this._caocaoSpine;
                }

                const targetWorldPos = convertToWorldSpaceAR(collectFaceNode);
                let targetPos = convertToNodeSpaceAR(targetWorldPos, this.nodeSkill); //终点坐标
                if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
                    targetPos.y -= 186 / 2;
                }

                // console.log('======collectionFace=======飞到收集区===================', faceConfig)
                faceNode.getComponent(ModelFace).addLizi(PerticleType.FaceFly, faceConfig.faceType);

                let xx = 0
                let yy = getRandomInt(pos.y + 200, targetPos.y - 200)
                if (i % 2 === 1) { //向左
                    xx = pos.x - Math.random() * 400
                } else {
                    xx = pos.x + Math.random() * 400
                }
                const mediumPos = v3(xx, yy, 0);
                const flyTime = Math.random() * 0.2 + 1.0;

                faceNode.setRotation(0, 0, 0, 0);
                bezierCurveTo2(true, faceNode, flyTime, 1 / 30 * i, v3(pos.x, pos.y, 0), mediumPos, targetPos, { easing: 'sineIn' }, async () => {
                    if (!isValid(faceNode)) {
                        return;
                    }
                    if (!isValid(collectFaceNode)) {
                        return;
                    }
                    Manager.audioManager.playShock(); //手机震动
                    faceNode.setRotation(0, 0, 0, 0);
                    faceNode.destroy();

                    if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main || DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish) {
                        collectFaceNode.getComponent(CollectFace).collectNum(1); //收集数+1
                    } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
                        const targetNum = Number(getGlobalCfgValue('caocaoBlood'));
                        this._caocaoProgress.fillRange = DataManager.dataBattle.caocaoBlood / targetNum;
                        this._caocaoSpine.getComponent(SuperSpine).playSpineWithLoop('shouji', 'idle');

                        //小于四分之一血量变为红色进度
                        if (DataManager.dataBattle.caocaoBlood / targetNum < 0.25) {

                            if ((this._caocaoProgress.node as any).color == 1) {
                                this._caocaoProgress.node.attr({ color: 2 });
                                G_setSpriteFrame(this._caocaoProgress, 'battle://image_sanguo/sg_progress_2')
                            }
                        }

                        this._caocalLabProgress.string = Math.floor(DataManager.dataBattle.caocaoBlood / targetNum * 100) + '%';
                        Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_HitCC');
                    }

                    if (DataManager.dataBattle.checkCollectFull()) {
                        console.log('=========过关了=============s===')
                        this.gameSuccess();
                    }

                    // Tween.stopAllByTarget(this.layoutCollect.children[collectIdx]);
                    // this.layoutCollect.children[collectIdx].setScale(1, 1, 0);
                    // tween(this.layoutCollect.children[collectIdx]).to(0.15, { scale: v3(1.8, 1.8, 0) }).to(0.2, { scale: v3(1, 1, 0) }).start();

                    Tween.stopAllByTarget(collectFaceNode);
                    collectFaceNode.setScale(1, 1, 0);
                    tween(collectFaceNode).to(0.15, { scale: v3(1.8, 1.8, 0) }).to(0.2, { scale: v3(1, 1, 0) }).start();
                });

                if (!hadLizi) {
                    hadLizi = true;
                    this.scheduleOnce(async () => {
                        if (!isValid(this.node)) {
                            return;
                        }
                        const nodeLizi = await createLizi(PerticleType.CollectFace)
                        nodeLizi.parent = collectFaceNode //this.layoutCollect.children[collectIdx];
                        nodeLizi.setSiblingIndex(-1);
                        nodeLizi.setScale(0.5, 0.5, 1)
                        tween(nodeLizi).delay(1.5).destroySelf().start();

                        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
                            nodeLizi.setPosition(0, -186 / 2);
                        }

                    }, flyTime)
                }
            } else { //不用收集 就四散飞走
                // console.log('=============collectionFace====四散飞走=============', faceId);
                const viewSize = view.getVisibleSize();
                let xx = i % 2 === 1 ? -viewSize.width / 2 - 300 : viewSize.width / 2 + 300;
                let yy = getRandomInt(-600, 600);
                faceNode.getComponent(ModelFace).addLizi(PerticleType.FaceFly);
                tween(faceNode).to(0.8, { position: v3(xx, yy, 0) }, { easing: 'quadOut' }).call(() => {
                    faceNode.destroy();
                }).start()
            }
        }
    }

    collectionWord(collectFaceIds) {
        // DataManager.dataSkill.setStatus(SkillStatus.Stop); //暂停播放技能 先收集词条

        let hadGuild = Utils.storage.getItem('game_data_guild');
        if (!hadGuild) {
            hadGuild = [];
        } else {
            hadGuild = JSON.parse(hadGuild);
        }
        if (!hadGuild.includes(GuideType.Help_Tip_3)) {
            DataManager.dataSkill.addSkillQueue([PropType.EVENT_CALLBACK, () => {
                this.dispatchEmit(UI_EVENT_NAME.FIRST_BOOM_GUIDE, GuideType.Help_Tip_3);
                DataManager.dataSkill.setStatus(SkillStatus.None);
                DataManager.dataSkill.nextSkillTrigger();
            }], true);
        }

        console.log("===========collectFaceIds===1111=======", collectFaceIds);
        const scrollWorldPos = convertToWorldSpaceAR(this.scrollView);
        const scrllPos = convertToNodeSpaceAR(scrollWorldPos, this.nodeSkill); //收集栏相对于skill节点的坐标

        let startX = scrllPos.x - 500 / 2;
        let targetX = [startX + 46, startX + 128, startX + 209, startX + 290, startX + 372, startX + 454, startX + 500];
        let faceIds = [];
        const curScrollData = this.scrollView.getComponent(ScrollReuse).getData();
        for (let i = 0; i < collectFaceIds.length; i++) {
            let canFind = false;
            for (let k = 0; k < curScrollData.length; k++) {
                if (curScrollData[k][0] == collectFaceIds[i][0]) {
                    faceIds.push(k);
                    canFind = true;
                }
            }
            if (!canFind) {
                faceIds.push(-1);
            }
        }

        console.log('======collectFaceIds======faceIds=====', faceIds);

        for (let i = 0; i < collectFaceIds.length; i++) {
            const value = collectFaceIds[i];
            const faceId = value[0];
            const worldPos = value[1];

            const nodeFace = instantiate(this.prefabCollectFace);
            nodeFace.parent = this.nodeSkill;
            const pos = convertToNodeSpaceAR(v3(worldPos.x, worldPos.y, 0), this.nodeSkill);
            nodeFace.setPosition(pos.x, pos.y);

            nodeFace.getComponent(CollectFace).setFaceInfo([faceId, 0]);
            nodeFace.getComponent(CollectFace).addLizi(PerticleType.FaceFly);

            tween(nodeFace).delay(1.2).call(() => {
                if (i === 0) {
                    //来个词条栏曝光特效
                    this.collectSpines[0].active = true;
                    this.collectSpines[0].getComponent(SuperSpine).playSpine('idle', false, () => {
                        this.collectSpines[0].active = false;
                    });
                }
            }).start();


            let idx = faceIds[i] || 0;
            if (idx === -1) {
                idx = curScrollData.length;
            }
            idx = idx > 6 ? 6 : idx;
            const tartXX = targetX[idx];
            console.log('=============12312312======', tartXX, scrllPos.y);
            //所有词条同时飞到词条栏
            tween(nodeFace).to(0.3, { scale: v3(1.5, 1.5, 1) }).delay(0.5).to(0.5, { position: v3(tartXX, scrllPos.y, 0), scale: v3(1, 1, 1) }, { easing: 'sineIn' }).call(() => {
                const curScrollData = this.scrollView.getComponent(ScrollReuse).getData();
                console.log('================curScrollData======1111==========', JSON.stringify(curScrollData));

                DataManager.dataSkill.addWordZi(faceId, 1);  //这个时候再添加词条数据
                //词条栏收集
                if (curScrollData.find((info) => {
                    return info[0] == faceId;
                })) {
                    //curScrollData 里有这个faceId 但是cell没有了 已经被删了 那么就会出现undefine
                    console.log('================curScrollData========已经有的更新数量==========', faceId);
                    this.dispatchEmit(UI_EVENT_NAME.COLLECTION_WORD_UPDATE, faceId); //已经有的更新数量
                } else {
                    console.log('=============curScrollData==========add=============', faceId);
                    this.scrollView.getComponent(ScrollReuse).addData(curScrollData.length, [faceId, DataManager.dataSkill.getWordZi(faceId), true]);

                    this.bg_scroll.active = this.scrollView.getComponent(ScrollReuse).getData().length <= 6;
                }

                if (i === collectFaceIds.length - 1) {
                    Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_CollectWord');
                    //检测词条是否收集全
                    DataManager.dataSkill.checkFullCollectWord();
                }
                nodeFace.active = false;

                nodeFace.destroy();
            }).start();

        }
    }

    //触发下一个技能
    async triggerSkill() {
        this.nodeGuide.active = false; //引导常驻的可以隐藏

        const curSkill = DataManager.dataSkill.curSkill; //当前触发的技能配置
        const propType = curSkill[0];
        const faceId = curSkill[1];
        const data = curSkill[2];
        const prefabName = data.prefab;
        const faceConfig: Face = DataManager.dataBattle.faceConfig[faceId];
        const skillId = faceConfig.skillId;
        const skillConfig: Skill = Config.Skill[skillId];

        // const skillDefine = SkillDefine.skillConfig[skillId];   //加载当前的word bundle
        // await Manager.bundleManager.loadBundle(skillDefine.prefab);

        const nodePrefab = await Manager.bundleManager.load<Prefab>(prefabName + '://' + prefabName, Prefab);
        if (!nodePrefab) {
            console.error("create new skill prefab error");
            return;
        }
        const node = instantiate(nodePrefab);
        node.parent = this.nodeSkill;
        node.name = 'skill_' + prefabName;

        let pos = null;

        if (skillConfig.skillPosType === SkillPosType.Circle || skillConfig.skillPosType === SkillPosType.Face) {
            pos = convertToNodeSpaceAR(v3(data.position.x, data.position.y, 0), this.nodeSkill);
        } else if (skillConfig.skillPosType === SkillPosType.ScreenPos) { //区域位置  location 1-5 offset 偏移量
            const location = skillConfig.location;
            const nodeLoc = this.nodeLocation[location - 1];
            const offSet: Array<number> = skillConfig.offSet;

            const wordPos = convertToWorldSpaceAR(nodeLoc);
            const curPos = convertToNodeSpaceAR(v3(wordPos.x, wordPos.y, 0), this.nodeSkill);
            pos = v3(curPos.x + offSet[0], curPos.y + offSet[1], 0);
        }
        node.getComponent<any>((data.SkillClass)).setCreatePos(v2(pos.x, pos.y), skillId);

        let hadGuild = Utils.storage.getItem('game_data_guild');
        if (!hadGuild) {
            hadGuild = [];
        } else {
            hadGuild = JSON.parse(hadGuild);
        }
        if (!hadGuild.includes(GuideType.Help_Tip_2)) {
            DataManager.dataSkill.addSkillQueue([PropType.EVENT_CALLBACK, () => {
                this.dispatchEmit(UI_EVENT_NAME.FIRST_BOOM_GUIDE, GuideType.Help_Tip_2);
                DataManager.dataSkill.setStatus(SkillStatus.None);
                DataManager.dataSkill.nextSkillTrigger();
            }], true);
        }
    }

    async triggerWord() {
        const curWord = DataManager.dataSkill.curSkill;
        const propType = curWord[0];
        const curWordId: number = Number(curWord[1]);//当前触发的词条id
        const curOwnZi = curWord[2]; //触发这个词条后还剩的word字 并不是最新的数据 之后可能还有要触发的

        const wordDefine = SkillDefine.wordDefine[curWordId];   //加载当前的word bundle
        await Manager.bundleManager.loadBundle(wordDefine.prefab);

        //保存
        let hadNew = false;
        if (G_isTest) {
            const wordCollect = Utils.storage.getItem("word_colelction");
            if (wordCollect && wordCollect !== '') {
                let info = JSON.parse(wordCollect);
                if (!info.includes(curWordId)) {
                    info.push(curWordId)
                    Utils.storage.setItem("word_colelction", JSON.stringify(info));
                    this.initSkillInfo()
                    hadNew = true;
                }
            } else {
                hadNew = true;
                Utils.storage.setItem("word_colelction", JSON.stringify([curWordId]));
                this.initSkillInfo();
            }
        } else {
            if (!DataManager.dataHome.wordCollection.includes(curWordId + '')) {
                hadNew = true;
                DataManager.dataHome.requestUpdateWord(curWordId);
            }
        }

        if (hadNew) {
            console.log('=====dataSkill 添加=======引导 收集册点击======000===========')
            DataManager.dataSkill.addSkillQueue([PropType.EVENT_CALLBACK, () => {
                console.log('============引导 收集册点击=======111==========')
                const wordPos = convertToWorldSpaceAR(this.btnCollection);
                const targetPos = convertToNodeSpaceAR(wordPos, this.nodeSkill);

                const node = new Node();
                node.addComponent(UITransform);
                const sprite = node.addComponent(Sprite);
                node.parent = this.nodeSkill;

                this.scheduleOnce(() => {
                    console.log('============引导 收集册点击====2222======')
                    DataManager.dataSkill.setStatus(SkillStatus.None);
                    DataManager.dataSkill.nextSkillTrigger();
                }, 1.5);

                const imageName = Config.Word[curWordId].wordIcon;
                G_setRemoteSpriteFrame(sprite, G_WordIconUrl(imageName));


                tween(node).delay(0.8).to(0.5, { position: targetPos, scale: v3(0.3, 0.3, 1) }, { easing: 'sineInOut' }).call(() => {
                    node.active = false;
                }).delay(0.5).call(() => {

                    //新手引导
                    let hadGuild = Utils.storage.getItem('game_data_guild');
                    if (!hadGuild) {
                        hadGuild = [];
                    } else {
                        hadGuild = JSON.parse(hadGuild);
                    }
                    if (!hadGuild.includes(GuideType.Tip_Collecting)) {
                        this.dispatchEmit(UI_EVENT_NAME.FIRST_BOOM_GUIDE, GuideType.Tip_Collecting);
                    }
                }).destroySelf().start();

            }]);
        }


        const nodeLoc = this.nodeLocation[1];
        const wordPos = convertToWorldSpaceAR(nodeLoc);
        const pos = convertToNodeSpaceAR(v3(wordPos.x, wordPos.y, 0), this.nodeSkill); //飞行目标 坐标

        //词条栏 飞到 警戒线下方 展示 然后播放技能

        const wordConfig = DataManager.dataBattle.wordConfig[curWordId];
        const faceArray = wordConfig.faceArray;
        const chinese = wordConfig.chinese;

        const scrollWorldPos = convertToWorldSpaceAR(this.scrollView);
        const scrollPos = convertToNodeSpaceAR(scrollWorldPos, this.nodeSkill);//飞行起始坐标

        const startX = scrollPos.x - (faceArray.length / 2 - 0.5) * 100;
        const startY = scrollPos.y;

        const targetX = pos.x - (faceArray.length / 2 - 0.5) * 100;
        const targetY = pos.y;

        //这里来一个曝光 动画同时刷新词条栏

        console.log('======================scrollView===============2=============', curOwnZi);
        this.scrollView.getComponent(ScrollReuse).initView(curOwnZi, 5); //刷新最新词条栏
        this.bg_scroll.active = this.scrollView.getComponent(ScrollReuse).getData().length <= 6;

        //收集的词条可以凑出一个词条效果时自动触发灵光一闪的特效，同时屏幕逐渐变黑盖上黑幕，
        // 只有收集栏在黑幕上层(聚焦收集栏)。然后本次凑齐的几个词条icon按顺序依次飞到屏幕中间，
        // 依次变成文字，变的过程需要有特效，一个icon可能对应多个文字，全部变成文字后停留1秒，
        // 之后文字缩小消失，黑幕逐渐透明，再之后播凑齐的词条的具体动画
        this.maskAll.active = true;
        changeParent(this.scrollView, this.maskAll);


        const spine = await createCommonSpine('battle://spine/UI_SaoGuang', this.nodeSkill);
        spine.getComponent(SuperSpine).playSpine('idle', false, () => {
            spine.destroy();
        });

        //生成临时collect-face 飞到目标
        for (let i = 0; i < faceArray.length; i++) {
            const faceId = faceArray[i];
            const xx = startX + i * 100;
            const targetXX = targetX + i * 100;

            const nodeFace = instantiate(this.prefabCollectFace);
            nodeFace.parent = this.nodeSkill;
            nodeFace.setPosition(xx, startY);
            nodeFace.getComponent(CollectFace).setFaceInfo([faceId, 0]);
            // nodeFace.getComponent(CollectFace).addLizi(PerticleType.FaceFly);

            //飞上去展示
            const zi = chinese[i];
            tween(nodeFace).delay(0.8 + 0.3 * i).to(0.5, { position: v3(targetXX, targetY, 0) }).call(() => {
                nodeFace.getComponent(CollectFace).showSpine(() => {
                    //变化成汉字
                    nodeFace.getComponent(CollectFace).showWordZi(zi);
                });
            }).delay(3.0 - 0.3 * i).to(0.3, { scale: v3(0, 0, 0) }).call(async () => {
                nodeFace.destroy(); //展示1秒 删除

                if (i === faceArray.length - 1) {
                    changeParent(this.scrollView, this.bottomNode.getChildByName('scroll'));
                    this.maskAll.active = false;

                    //展示词条对应的动作
                    const prefabName = wordDefine.prefab;
                    const nodePrefab = await Manager.bundleManager.load<Prefab>(prefabName + '://' + prefabName, Prefab);
                    if (!nodePrefab) {
                        console.error("create new skill prefab error");
                        return;
                    }
                    const node = instantiate(nodePrefab);
                    node.parent = this.nodeSkill;
                    node.name = 'word_' + prefabName;

                    let pos = null;
                    if (wordConfig.skillPosType === SkillPosType.Circle || wordConfig.skillPosType === SkillPosType.Face) {
                        // pos = convertToNodeSpaceAR(v3(data.position.x, data.position.y, 0), this.nodeSkill);
                    } else if (wordConfig.skillPosType === SkillPosType.ScreenPos) { //区域位置  location 1-5 offset 偏移量
                        const location = wordConfig.location;
                        const nodeLoc = this.nodeLocation[location - 1];
                        const offSet: Array<number> = wordConfig.offSet;

                        const wordPos = convertToWorldSpaceAR(nodeLoc);
                        const curPos = convertToNodeSpaceAR(v3(wordPos.x, wordPos.y, 0), this.nodeSkill);
                        pos = v3(curPos.x + offSet[0], curPos.y + offSet[1], 0);
                    }

                    node.getComponent<any>((wordDefine.SkillClass)).setCreatePos(v2(pos.x, pos.y), curWordId);

                }

            }).start()
        }
    }

    startCheckLose() {
        this.unschedule(this.checkLose);
        this.schedule(this.checkLose, 0.05, macro.REPEAT_FOREVER);
    }

    //准备发射的气泡变为彩虹
    changeFaceToAny(_type: number) {
        if (!this._curCircle) {
            return;
        }

        if (_type === 1) { //单色
            this._curCircle.getComponent(ModelCircle).clearFace();
            this._curCircle.getComponent(ModelCircle).createFace(anyCircleType, { [4001]: 3 });
        } else if (_type === 2 && this._curCircle.getComponent(ModelCircle).getCircleType() > 0) { //彩虹双色
            this._curCircle.getComponent(ModelCircle).clearFace();
            this._curCircle.getComponent(ModelCircle).createFace(anyCircleType, { [4001]: 3 });
            this._curCircle.getComponent(ModelCircle).createFace(1, { [1001]: 3 });
        }
    }

    //============================触摸事件==================================
    private addTouchEventListeners() {
        this.nodeTouch.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.nodeTouch.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.nodeTouch.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.nodeTouch.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);

        //test
        const testKeyBoard = !isMiniGame;
        if (testKeyBoard) {
            systemEvent.on(SystemEvent.EventType.KEY_DOWN, (event: EventKeyboard) => {
                // DataManager.dataSkill.addSkillQueue([PropType.Word, 10001, []]);
                switch (event.keyCode) {
                    case KeyCode.KEY_A:
                        DataManager.dataSkill.addSkillQueue([PropType.Word, 10004, []]);
                        break;

                    case KeyCode.KEY_S:
                        let count = Utils.storage.getItem('game_lose_count');
                        Toast.showToast(DataManager.dataBattle.stageConfig.difficultLv + '--' + count)
                        break;
                    case KeyCode.KEY_D:
                        this.randomBoom(1)
                        break;
                    default:
                        break;
                }
            }, this);
        }
    }

    _startX = 0;
    _touchTime = 0;

    wid = 0;
    onTouchStart(event: EventTouch) {
        // console.log("===onTouchStart===", event.getLocation().x);
        this._startX = event.getUILocation().x;
        this._touchTime = Date.now();

        if (this._curCircle && isValid(this._curCircle) && this._curCircle?.isValid) {
            this.wid = this._curCircle.getComponent(ModelCircle).getRadius() + 5; //+n 防止撞到两侧墙壁
        } else {

        }

        if (uiManager.isShow(UI_NAME.GuildPanel)) {
            uiManager.close(UI_NAME.GuildPanel);
        }

    }

    onTouchMove(event: EventTouch) {
        // console.log("===onTouchMove===", event.getLocation().x, event.getUILocation().x, event.getLocationInView().x);
        let xx = event.getUILocation().x;
        if (xx < this.wid) {
            xx = this.wid;
        }
        if (xx > view.getVisibleSize().width - this.wid) {
            xx = view.getVisibleSize().width - this.wid;
        }

        //在 技能和词条效果结束后才可以拖动气泡   在上方wait移动到ready位置时候不可点击
        if (this.checkCanTouch() && isValid(this._curCircle) && DataManager.dataSkill.status !== SkillStatus.Playing) {
            const posL = convertToNodeSpaceAR(v3(xx, 0, 0), this.nodeReadyCircle.parent);
            this.nodeReadyCircle.setPosition(posL.x, this.nodeReadyCircle.getPosition().y);
            this._curCircle.getComponent(ModelCircle).setState(CircleState.Move);
        }
    }

    onTouchEnd(event: EventTouch) {
        // console.log("===onTouchEnd===", event.getLocation().x)
        let xx = event.getUILocation().x;
        if (xx < this.wid) {
            xx = this.wid;
        }
        if (xx > view.getVisibleSize().width - this.wid) {
            xx = view.getVisibleSize().width - this.wid;
        }

        if (this.checkCanTouch() && isValid(this._curCircle) && DataManager.dataSkill.status !== SkillStatus.Playing) {
            const posL = convertToNodeSpaceAR(v3(xx, 0, 0), this.nodeReadyCircle.parent);
            this.nodeReadyCircle.setPosition(posL.x, this.nodeReadyCircle.getPosition().y);
            const pos = convertToWorldSpaceAR(this._curCircle);
            const newPos = convertToNodeSpaceAR(pos, this.nodeBox);
            this._curCircle.parent = this.nodeBox;
            this._curCircle.setPosition(newPos.x, newPos.y);
            this._curCircle.getComponent(RigidBody2D).type = ERigidBody2DType.Dynamic;
            this.nodeReadyCircle.active = false;
            this._curCircle.getComponent(ModelCircle).shoot();
            this._curCircle.getComponent(ModelCircle).setState(CircleState.Shoot);
            this._curCircle.getComponent(CircleCollider2D).sensor = false;
            this._curCircle = null;

            this._shootCount = 0;

            this.nodeReadyCircle.children.forEach((node) => { //容错处理 防止出现多个 发射气泡
                if (node.name.indexOf('circle') >= 0) {
                    node.destroy();
                }
            })

            TESdkData.addStep();



        }
    }

    onTouchCancel(event: EventTouch) {
        // console.log("===onTouchCancel===", event.getLocation().x)
        let xx = event.getUILocation().x;
        if (xx < this.wid) {
            xx = this.wid;
        }
        if (xx > view.getVisibleSize().width - this.wid) {
            xx = view.getVisibleSize().width - this.wid;
        }
        if (this.checkCanTouch() && isValid(this._curCircle) && DataManager.dataSkill.status !== SkillStatus.Playing) {
            const posL = convertToNodeSpaceAR(v3(xx, 0, 0), this.nodeReadyCircle.parent);
            this.nodeReadyCircle.setPosition(posL.x, this.nodeReadyCircle.getPosition().y);
            const pos = convertToWorldSpaceAR(this._curCircle);
            const newPos = convertToNodeSpaceAR(pos, this.nodeBox);
            this._curCircle.parent = this.nodeBox;
            this._curCircle.setPosition(newPos.x, newPos.y);
            this._curCircle.getComponent(RigidBody2D).type = ERigidBody2DType.Dynamic;
            this.nodeReadyCircle.active = false;
            this._curCircle.getComponent(ModelCircle).shoot();
            this._curCircle.getComponent(ModelCircle).setState(CircleState.Shoot);
            this._curCircle.getComponent(CircleCollider2D).sensor = false;
            this._curCircle = null;
            this._shootCount = 0;

            this.nodeReadyCircle.children.forEach((node) => {
                if (node.name.indexOf('circle') >= 0) {
                    node.destroy();
                }
            })

            TESdkData.addStep();

        }

    }

    //=====================================初始化界面===========================================

    //初始化界面 先从上到下 再到上走一遍 然后 在生成小球
    async initStage() {
        const curStage = DataManager.dataBattle.curStage;

        this.labLittleStage.node.active = DataManager.dataBattle.curStage > 1;
        const nodeCollection = this.topNode.getChildByName('node_collection')
        nodeCollection.active = DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao;

        this.gameStatus = GameBattleStatus.Playing;
        TESdkData.startChapter(curStage);

        this.stopTouch.active = true;
        this.setTouchShield('wait_stage_init', true);


        DataManager.dataBattle.initConfig();
        DataManager.dataBattle.setCollectFaceIds();
        DataManager.dataBattle.readyCircleFaceData = {};

        this.collectSpines.forEach((node) => {
            node.active = false;
        })

        this.nodeStage.removeAllChildren();
        this.nodeSkill.removeAllChildren(); //清空正在播放的技能

        const stageName = 'stage_parent://stage_' + curStage;
        const nodePrefab = await Manager.bundleManager.load<Prefab>(stageName, Prefab);
        if (nodePrefab) {
            const curNodeStage = instantiate(nodePrefab);
            curNodeStage.parent = this.nodeStage;
            curNodeStage.name = 'stage'
            //有一个从上到下 再到上的预览
            // tween(curNodeStage).start();

            if (this.nodeBox) {
                this.nodeBox.removeAllChildren();
                this.nodeBox = null;
            }
            this.nodeBox = curNodeStage.getComponent(ModelStage).getBoxNode();
            DataManager.dataBattle.boxNode = this.nodeBox;

            changeParent(this.nodeGuide, curNodeStage.getChildByName('node_bg'));
        }

        this.nodeReadyCircle.children.forEach((node) => {
            if (node.name.indexOf('circle') >= 0) {
                node.destroy();
            }
        })
        this.nodeWaitCircle.children.forEach((node) => {
            if (node.name.indexOf('circle') >= 0) {
                node.destroy();
            }
        })

        //当前关卡配置
        const curStageConfig = DataManager.dataBattle.stageConfig;
        DataManager.dataBattle.remainTime = curStageConfig.time;
        //关卡时间
        this.labRemainTime.string = Utils.time.formatTime(DataManager.dataBattle.remainTime, CountdownTypeBy['MM:ss']);

        //layout
        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main) {
            this.layoutCollect.removeAllChildren();
            for (let i = 0; i < DataManager.dataBattle.collectFaceIds.length; i++) {
                const faceId = DataManager.dataBattle.collectFaceIds[i];
                const collectFace = instantiate(this.prefabCollectFace);
                collectFace.getComponent(CollectFace).setFaceInfo([faceId, curStageConfig.collectFaceId[i]])
                collectFace.parent = this.layoutCollect;
            }

            this._gameProgress = this.nodeCollectPanels[BATTLE_STAGE_TYPE.Main].getChildByName('battle_progress').getComponent(Sprite);
            this._gameProgress.fillRange = 0;
            this._labGameProgress = this.nodeCollectPanels[BATTLE_STAGE_TYPE.Main].getChildByName('percent').getComponent(Label);
            this._labGameProgress.string = '0%'

            this.nodeCollectPanels[BATTLE_STAGE_TYPE.Main].getChildByName('gou').active = false;
        } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish) {
            let posArray = [];
            this.layoutFishCollect.children.forEach((node, i) => {
                posArray.push(node.position);
            })
            this.layoutFishCollect.removeAllChildren();
            posArray.forEach((pos, i) => {
                const faceId = DataManager.dataBattle.collectFaceIds[i];
                const collectFace = instantiate(this.prefabCollectFace);
                collectFace.getComponent(CollectFace).setFaceInfo([faceId, 0])
                collectFace.parent = this.layoutFishCollect;
                collectFace.setPosition(pos);
            })
        } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
            this.layoutFishCollect.removeAllChildren();
            this.layoutFishCollect.active = false;

            DataManager.dataBattle.caocaoBlood = Number(getGlobalCfgValue('caocaoBlood')); //曹操血量

            // DataManager.dataBattle.caocaoBlood = 20   //test


            const nodePrefab = await Manager.bundleManager.load<Prefab>("battle://node_caocao", Prefab);
            const nodeCaocao = instantiate(nodePrefab);
            nodeCaocao.parent = this.nodeCaocao;
            this._caocaoProgress = nodeCaocao.getChildByName('sg_progress').getComponent(Sprite);
            this._caocaoSpine = nodeCaocao.getChildByPath('spine/attacked_pow')
            this._caocalLabProgress = nodeCaocao.getChildByName('blood').getComponent(Label)
            this._caocaoProgress.fillRange = 1.0;
            this._caocalLabProgress.string = '100%'

            // this._caocaoProgress.color = new Color("#55d51c");
            G_setSpriteFrame(this._caocaoProgress, 'battle://image_sanguo/sg_progress_1')

            this._caocaoProgress.node.attr({ color: 1 });

            //曹操的动画

        }

        console.log('===============initstage=====================22============')
        DataManager.dataBattle.curLittleStage = 0;
        this.stopTouch.active = false;
        this.nextLittleStagePull();
        this.scheduleOnce(() => {
            this.setTouchShield('wait_stage_init', false);
        }, 1.0);

        this.scrollView.getComponent(ScrollReuse).initView([], 5); //清空词条收集栏
        this.warnLine.getComponent(ModelLine).setNormalColor(); //警戒线设置正常颜色

        this.startCheckLose(); //开始检查气泡和警戒线交叉
        DataManager.dataBattle.warnLineY = convertToWorldSpaceAR(this.warnLine).y; //警戒线的世界坐标

        this.createWaitCircle(false); //创建新气泡
        this.createWaitCircle(true); //创建等待气泡

        //初始数据设置
        // this._canTouch = true;
        DataManager.dataSkill.init(); //技能初始化
        DataManager.dataSkill.setStatus(SkillStatus.None);

        this.battlePropCount = [0, 0, 0];
        this.propCanUseCount = [1, 1, 1];
        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish || DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
            this.propCanUseCount = [2, 2, 2];
        }
        this.battlProps.forEach((node, idx) => { //0 2  4
            const icon = node.getChildByName('icon');
            G_setSpriteGray(icon, false);

            node.getChildByName('num').active = true;
            node.getChildByName('add').active = true;
            node.getChildByName('spine').active = false;

            node.getChildByName('spine').setSiblingIndex(-10);
        })

        this._propRemind = [false, false];
    }

    //设置倒计时
    setDeadTime() {
        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
            this.labRemainTime.string = Utils.time.formatTime(0, CountdownTypeBy['MM:ss']);
            //时间是增加
            this.labRemainTime.getComponent(TimerLabelBy).startCountDown(0, () => { }, () => { }, TimerLabelType.Up);
            return;
        }

        //初始化剩余时间
        this.labRemainTime.string = Utils.time.formatTime(DataManager.dataBattle.remainTime, CountdownTypeBy['MM:ss']);
        this.labRemainTime.getComponent(TimerLabelBy).startCountDown(DataManager.dataBattle.remainTime, () => {
            this.failType = FailType.DeadLine;
            this.gameOver();
        }, async (countdown: number) => {
            const timeA = [180, 60];

            if (timeA.includes(countdown)) {
                if (countdown == 180) {
                    this.propRemind(PropRemindType.TimeRemind); //游戏倒计时进入最后3min内时
                }

                const clockNode = this.labRemainTime.node.parent.getChildByName('clock');
                // Toast.showToast(`剩余${countdown / 60}分钟`);
                //闹钟抖动
                clockNode.getComponent(SuperSpine).playSpineWithLoop('rock', 'idle');

                const node = new Node();
                node.addComponent(UITransform);
                node.parent = this.nodeSkill
                node.setPosition(0, 0, 0);
                const sprite = node.addComponent(Sprite);

                const path = `battle://image/remain_${countdown / 60}_minite/spriteFrame`;
                const spriteFrame: SpriteFrame = await Manager.bundleManager.load<SpriteFrame>(path, SpriteFrame);
                if (sprite?.node && sprite?.node.isValid) {
                    sprite.spriteFrame = spriteFrame;

                    node.setScale(0, 0, 1);
                    tween(node).to(0.4, { scale: v3(2, 2, 1) }).delay(1.0).to(0.4, { scale: v3(0, 0, 1) }).destroySelf().start();

                } else {
                    console.warn('=======闹钟node不在了==============')
                }
                Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_ClockRing');

            }
        })
    }

    //根据配置创建默认的气泡 具体到小关卡
    async createDefaultCircle() {
        // const curStage = DataManager.dataBattle.curStage;
        // const curLittleStage = DataManager.dataBattle.curLittleStage;
        // const initCircle = DataManager.dataBattle.stageConfig.initCircle;

        // console.log("======createDefaultCircle====curLittleStage=========", curLittleStage)

        // if (initCircle.length === 0 || initCircle[curLittleStage - 1].length === 0) {
        //     return;
        // }

        // initCircle[curLittleStage - 1].forEach(async (circleId: number) => {
        //     const circleConfig = DataManager.dataBattle.getStageCircle(circleId);

        //     const circle: Node = await this.createCircle(circleConfig.circleType - 1, this.nodeBox);
        //     console.log("======createDefaultCircle====position==2=======", circleConfig.position[1])
        //     circle.setPosition(circleConfig.position[0], circleConfig.position[1]);
        //     circle.getComponent(ModelCircle).setState(CircleState.Pool);
        //     //创建表情 初期是配置 后期是随机
        //     for (let i = 0; i < circleConfig.faceArray.length; i++) {
        //         const value = circleConfig.faceArray[i];
        //         const faceId = value[0];
        //         const faceCount = value[1];

        //         const faceType = Number(Config.Face[faceId].faceType);
        //         const faceInfo = { [faceId]: faceCount };
        //         circle.getComponent(ModelCircle).createFace(faceType, faceInfo);
        //     }
        // })
    }

    //根据气泡类型创建气泡刚体
    async createCircle(idx: number, parentNode: Node) {
        const nodePrefab = await Manager.bundleManager.load<Prefab>("model://circle", Prefab);
        if (!nodePrefab) {
            console.error("create new circle error");
            return;
        }
        const node = instantiate(nodePrefab);
        node.parent = parentNode;
        const circleSize = DataManager.dataBattle.circleSize[idx]; //气泡大小
        node.name = 'circle_' + circleSize;
        node.getComponent(ModelCircle).setCircleData(idx, {}); //设置气泡类型 以及表情的类型和数量
        node.getComponent(ModelCircle).setRadius(circleSize / 2); //设置气泡和刚体半径
        node.getComponent(ModelCircle).setRigidBodyType(ERigidBody2DType.Dynamic); //刚创建设置static类型

        return node;
    }

    async createWaitCircle(isWait: Boolean) {
        let parentNode = this.nodeWaitCircle;
        if (!isWait) {
            parentNode = this.nodeReadyCircle;
        }
        this.nodeReadyCircle.active = true;
        this.nodeWaitCircle.active = true;


        // let info = null
        // if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main) {
        //     if (DataManager.dataBattle.curStage === 1) {
        //         const game_had_teach = Utils.storage.getItem('game_had_teach');
        //         if (game_had_teach) {
        //             info = DataManager.dataBattle.getNewCircleData2();
        //         } else {
        //             info = DataManager.dataBattle.getNewCircleData();
        //         }
        //     } else {
        //         info = DataManager.dataBattle.getNewCircleData2(); //随机获取一个新的data
        //     }
        // } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish) {
        //     info = DataManager.dataBattle.getNewCircleData2(); //难度设置
        // }

        const info = DataManager.dataBattle.getNewCircle();
        console.log('=========newcircle====info==============', info)

        const circleType: number = info[0];
        const data: any = info[1];
        const circle: Node = await this.createCircle(circleType, parentNode);
        circle.getComponent(ModelCircle).setRigidBodyType(ERigidBody2DType.Static); //刚创建设置static类型
        //faceType 是 属于哪个表情大类
        for (const faceType in data) {
            const faceInfo = data[faceType];
            circle.getComponent(ModelCircle).createFace(Number(faceType), faceInfo);
        }
        circle.getComponent(ModelCircle).setState(CircleState.Wait);
        circle.getComponent(CircleCollider2D).sensor = true; //刚创建的气泡设置为传感器

        if (isWait) {
            this._waitCircle = circle;
        } else {
            this._curCircle = circle;
        }

        return circle;
    }

    //等待状态移动到发射位置
    waitMoveReadyPos(callback) {
        //容错处理防止有2个准备发射的球
        this.nodeReadyCircle.children.forEach((node) => {
            if (node.name.indexOf('circle') >= 0) {
                console.warn('==========nodeReadyCircle=======had error=======')
                node.destroy();
            }
        })
        // this._canFall = false;
        this.setTouchShield('wait_move_ready_pos', true);

        console.log('==========waitMoveReadyPos==============', this._waitCircle)
        if (!isValid(this._waitCircle)) {
            console.warn('======wait 等待气泡为空============')  //有可能出现bug 或者过关后出现
            this.setTouchShield('wait_move_ready_pos', false);
            return;
        }

        const pos = convertToWorldSpaceAR(this._waitCircle);
        const newPos = convertToNodeSpaceAR(pos, this.nodeReadyCircle);

        this.nodeReadyCircle.active = true;
        this._waitCircle.parent = this.nodeReadyCircle;

        this._waitCircle.setPosition(newPos.x, newPos.y);

        this._curCircle = this._waitCircle;
        this._waitCircle = null;
        tween(this._curCircle).to(0.06, { position: v3(0, 0, 0) }).delay(0.04).call(() => {
            if (callback) {
                callback();
                callback = null;
            }
            // this._canFall = true;
            this.setTouchShield('wait_move_ready_pos', false);
        }).start();

        this.nodeReadyCircle.setPosition(0, 410)
        this._curCircle.getComponent(ModelCircle).setState(CircleState.Ready);

        DataManager.dataBattle.readyCircleFaceData = this._curCircle.getComponent(ModelCircle).getFaceTypeData();
    }

    //发射位和等待位互换
    async onClickWaitReadyLocChange() {
        if (this._exchangeCount <= 0) {
            uiManager.show(UI_NAME.AdsShowPanel, 'exchange_count', async () => {
                this._exchangeCount = 5;
                this.btnExchange.getChildByName('ads').active = false;
                const material = await loadMaterial(MaterialType.SpriteDefault);
                this.btnExchange.getChildByName('icon').getComponent(Sprite).customMaterial = material;
                this.btnExchange.getChildByName('name').getComponent(Label).string = `剩余${this._exchangeCount}次`
                this.btnExchange.getChildByName('name').getComponent(Label).color = new Color(0x24, 0x4f, 0x19, 255);
                this.btnExchange.getChildByName('name').getComponent(Label).outlineColor = new Color(0xd8, 0xff, 0x82, 255);
            });
            return;
        }

        if (!this._curCircle || !this._waitCircle) {
            return;
        }

        Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_ChangeBubble');

        this._exchangeCount--;
        this.btnExchange.getChildByName('name').getComponent(Label).string = `剩余${this._exchangeCount}次`
        if (this._exchangeCount === 0) {
            this.btnExchange.getChildByName('ads').active = true;
            const material = await loadMaterial(MaterialType.GraySprite);
            this.btnExchange.getChildByName('icon').getComponent(Sprite).customMaterial = material;
            this.btnExchange.getChildByName('name').getComponent(Label).color = new Color(255, 255, 255, 255);
            this.btnExchange.getChildByName('name').getComponent(Label).outlineColor = new Color(0x57, 0x57, 0x57, 255);
        }

        // console.log('==========change==============')
        this.nodeReadyCircle.active = true;
        this.nodeWaitCircle.active = true;

        const pos1 = convertToWorldSpaceAR(this._curCircle);
        const newPos1 = convertToNodeSpaceAR(pos1, this.nodeReadyCircle);

        const pos2 = convertToWorldSpaceAR(this._waitCircle);
        const newPos2 = convertToNodeSpaceAR(pos1, this.nodeWaitCircle);

        this._curCircle.parent = this.nodeWaitCircle;
        this._waitCircle.parent = this.nodeReadyCircle;

        this._curCircle.setPosition(newPos2.x, newPos2.y);
        this._waitCircle.setPosition(newPos1.x, newPos1.y);

        tween(this._curCircle).to(0.05, { position: v3(0, 0, 0) }).start();
        tween(this._waitCircle).to(0.05, { position: v3(0, 0, 0) }).start();

        this._curCircle.getComponent(ModelCircle).setState(CircleState.Wait);
        this._waitCircle.getComponent(ModelCircle).setState(CircleState.Ready);

        let temp = this._curCircle;
        this._curCircle = this._waitCircle;
        this._waitCircle = temp;
    }

    step() {
        console.log('=====fasdfasdf=')
    }

    //判断警戒线 以及 combo
    checkLose() {
        if (this.nodeBox && this.warnLine.active) {
            let hadContact = null;
            let hadRemind = false;
            for (let i = 0; i < this.nodeBox.children.length; i++) {
                const node = this.nodeBox.children[i];
                const pos = convertToWorldSpaceAR(node);

                const radius = node.getComponent(UITransform).contentSize.height / 2;
                const maxY = pos.y + radius;
                const linePos = convertToWorldSpaceAR(this.warnLine);

                const distance = Number(getGlobalCfgValue('warnLineDistance'));

                if (this._loseCount == 0 && maxY + distance > linePos.y && node.getComponent(ModelCircle).stillExist() && node.getComponent(ModelCircle).getState() == CircleState.Pool) {
                    if (!this._propRemind[PropRemindType.WarnLine]) {
                        this.propRemind(PropRemindType.WarnLine); //场上的气泡和警戒线的距离小于100像素或者气泡已经越过警戒线时
                    }
                    hadRemind = true;
                }

                if (maxY > linePos.y) {
                    hadContact = node;
                    if (node.getComponent(ModelCircle).stillExist() && node.getComponent(ModelCircle).getState() == CircleState.Pool) {
                        if (!this._propRemind[PropRemindType.WarnLine]) {
                            this.propRemind(PropRemindType.WarnLine); //场上的气泡和警戒线的距离小于100像素或者气泡已经越过警戒线时
                        }
                        hadRemind = true;
                    }

                    break;
                }
            }

            if (!hadRemind) {
                if (this._propRemind[PropRemindType.WarnLine]) {
                    this.cancelPropRemind(PropRemindType.WarnLine);
                }
            }

            if (!this.stopTouch.active && hadContact && hadContact.getComponent(ModelCircle).getState() === CircleState.Pool) {
                this._loseCount++;
                if (this._loseCount > 2) { //防止误触 累计计数2次再算碰到
                    this.warnLine.getComponent(ModelLine).setContactColor();
                    this.warnLine.getComponent(ModelLine).setLabTime(Math.ceil(DataManager.dataBattle.warnLineTime - this._loseCount / 20));
                }
                // console.log('===hadContact===', this._loseCount);
                if (this._loseCount >= DataManager.dataBattle.warnLineTime * 20) {
                    this.failType = FailType.WarnLine;
                    this.gameOver();
                    this.unschedule(this.checkLose);
                }
            } else {
                if (this._loseCount > 0) {
                    this.warnLine.getComponent(ModelLine).setNormalColor();
                    this._loseCount = 0;
                }
            }
        }

        this._comboCount++;
        if (this._comboCount > 60) {
            this._comboCount = 0;
            this._comboNum = 0;
        }


    }

    //道具提醒
    propRemind(_type) {
        this._propRemind[_type] = true;
        // ①场上的气泡和警戒线的距离小于100像素或者气泡已经越过警戒线时
        // ②游戏倒计时进入最后3min内时
        this.battlePropCount.forEach((count, idx) => {
            if (count > -1) { //每看广告 或者没有使用的道具 显示光效
                const spine = this.battlProps[idx].getChildByName('spine');
                spine.active = true;
                spine.getComponent(SuperSpine).playSpine('idle', true);
            }
        })
    }

    cancelPropRemind(_type) {
        this._propRemind[_type] = false;

        for (let i = 0; i < this._propRemind.length; i++) {
            if (this._propRemind[i]) {
                return;
            }
        }
        this.battlePropCount.forEach((count, idx) => {
            const spine = this.battlProps[idx].getChildByName('spine');
            spine.active = false;
        })
    }

    //=======================下一关推进===========================
    async nextLittleStagePull() {
        DataManager.dataSkill.setStatus(SkillStatus.Stop); //技能暂停播放
        DataManager.dataBattle.curLittleStage++;
        this.labLittleStage.string = `${DataManager.dataBattle.curLittleStage}/${DataManager.dataBattle.stageConfig.stageNumber}层`
        console.log('=================nextLittleStagePull==========0=============', DataManager.dataBattle.curLittleStage);
        const curLittleStage = DataManager.dataBattle.curLittleStage;

        const nodeStage = this.nodeStage.getChildByName('stage');
        const nodeChain = nodeStage.getComponent(ModelStage).getLevelByIdx(curLittleStage - 1);
        nodeStage.getComponent(ModelStage).wakeUpBody(curLittleStage - 1);

        const warnLinePos = convertToWorldSpaceAR(this.warnLine); //警戒线的世界坐标
        const chainPos = convertToWorldSpaceAR(nodeChain); //下一个底座的世界坐标
        const underPinPos = convertToWorldSpaceAR(this.underPinLine); //底座对准节点的世界坐标

        const moveHeight = underPinPos.y - chainPos.y;
        let delayTime = 0.3;
        let moveTime = 1.0;
        if (DataManager.dataBattle.curLittleStage === 1) {
            delayTime = 0;
            moveTime = 0; //第一小关直接设置坐标
        }

        if (DataManager.dataBattle.curLittleStage > 1) {
            this.stopTouch.active = true;
            this.warnLine.active = false;
            //播放过小关的粒子
            this.playPassLittleStageLizi();

        }
        if (DataManager.dataBattle.curStage > 1 && DataManager.dataBattle.curLittleStage === 1) {
            this.previewUIHideOrShow(false);
            //过场动画 不可点击
            this.stopTouch.active = true;
            this.scheduleOnce(() => {
                this.stopTouch.active = false;
                console.log('=====6秒过了===========')
            }, 6);
        }

        // let spineSuduxian = null;
        if (DataManager.dataBattle.curLittleStage > 1) {
            // spineSuduxian = await createCommonSpine("battle://spine/UI_SuDuXian", this.nodeSkill);
            // spineSuduxian.getComponent(SuperSpine).playSpine('idle', true);
            this.nodeReadyCircle.getChildByName('aim').active = false;
        }

        tween(nodeStage).delay(delayTime).by(moveTime, { position: v3(0, moveHeight, 0) }, { easing: 'sineOut' }).call(() => {
            if (DataManager.dataBattle.curLittleStage > 1) {
                // spineSuduxian.destroy();
            }
            if (DataManager.dataBattle.curStage > 1 && DataManager.dataBattle.curLittleStage === 1) {
                nodeStage.getComponent(ModelStage).setStageBottom(); //stage直接到底部 准备预览
            }
        }).delay(1.4).call(() => {
            // 第二关开始 超过警戒线内200像素的 销毁 (词条收集  收集的face和技能不触发)
            if (DataManager.dataBattle.curLittleStage > 1) {
                this.checkWarnCircleBoom();
                this.stopTouch.active = false;
                this.nodeReadyCircle.getChildByName('aim').active = true;
                this.warnLine.active = true;
            }
            DataManager.dataSkill.setStatus(SkillStatus.None);
            DataManager.dataSkill.nextSkillTrigger();

            const stageId = DataManager.dataBattle.curStage + '-' + DataManager.dataBattle.curLittleStage;
            TESdkData.startStage(stageId);
        }).start();

        if (DataManager.dataBattle.curStage === 1) {
            DataManager.dataBattle.updateFaceTypeClone();
        } else {
            DataManager.dataBattle.updateFaceTypeClone_new();
        }
    }

    async playPassLittleStageLizi() {

        const nodeLizi = await createLizi(PerticleType.LittleStagePass);
        nodeLizi.parent = this.nodeSkill;
        nodeLizi.setSiblingIndex(999);
        nodeLizi.setPosition(-view.getVisibleSize().width / 2, 0, 0)
        this.scheduleOnce(() => {
            console.log('======nodeLizi=====destroy===')
            nodeLizi.destroy();
        }, 3.0);

        const nodeLizi2 = await createLizi(PerticleType.LittleStagePass);
        nodeLizi2.parent = this.nodeSkill;
        nodeLizi2.setSiblingIndex(999);
        nodeLizi2.angle = 90;
        nodeLizi2.setPosition(view.getVisibleSize().width / 2, 0, 0)
        this.scheduleOnce(() => {
            console.log('======nodeLizi=====destroy2===')
            nodeLizi2.destroy();
        }, 3.0);
    }

    previewUIHideOrShow(flag: boolean) {
        this.warnLine.active = flag;
        this.nodeReadyCircle.parent.active = flag;
        this.nodeWaitCircle.parent.active = flag;
    }

    checkWarnCircleBoom() {
        let hadCircleBoom = false;
        const warnLinePosY = convertToWorldSpaceAR(this.warnLine).y;
        for (let i = 0; i < this.nodeBox.children.length; i++) {
            const circleNode = this.nodeBox.children[i];
            if (circleNode.getComponent(ModelCircle).stillExist() && circleNode.getComponent(ModelCircle).getState() === CircleState.Pool) {
                const wordPos = convertToWorldSpaceAR(circleNode);
                if (warnLinePosY - wordPos.y < DataManager.dataBattle.warnLineDistance) {
                    circleNode.getComponent(ModelCircle).destorySelf(true, true);
                    hadCircleBoom = true;
                }
            }
        }

        if (hadCircleBoom) {
            // this._canTouch = false; //屏蔽触摸
            this.setTouchShield('warn_line_boom', true);
            this.scheduleOnce(() => {
                // this._canTouch = true;
                this.setTouchShield('warn_line_boom', false);
            }, 1.0);
        }
    }

    // 1随机触发一种词条表情效果
    // 2 将所有泡泡内颜色打乱
    // 3 消除一个指定泡泡
    onClickProp(event, data: string) {
        console.log('========onClickProp====1======', DataManager.dataSkill.status)
        if (DataManager.dataSkill.status !== SkillStatus.None) {
            return;
        }

        const idx = Number(data);
        console.log('========onClickProp====22======', data, this.battlePropCount[idx])
        if (this.battlePropCount[idx] === 0) { //未拥有 先看广告
            uiManager.show(UI_NAME.BattleUseProp, Number(data))
        } else if (this.battlePropCount[idx] === 1) { //使用
            this.battlProps[idx].getChildByName('spine').active = false;
            this.useBattleProp(idx);
        } else if (this.battlePropCount[idx] === -1) {
            console.log('========onClickProp====道具使用次数已用完======')
            Toast.showToast('道具使用次数已用完')
        }
    }

    //使用道具
    async useBattleProp(idx) {
        idx = Number(idx);
        let count = 0;
        for (let i = 0; i < this.nodeBox.children.length; i++) {
            if (this.nodeBox.children[i].getComponent(ModelCircle).stillExist()) {
                count++;
                break;
            }
        }

        if (count === 0 && idx <= 1) {
            Toast.showToast('暂无气泡可使用道具');
            return;
        }

        switch (idx) {
            case 0:
                this.randomBoom(3);
                break;
            case 1:
                this.randomDelOneCorlor();
                break;
            case 2:
                // this.derangeCircle();
                this.addCollectFace(); //补齐15个收集表情
                break;
            default:
                break;
        }

        TESdkData.changPropUse((idx + 1) + "");


        this.propCanUseCount[idx]--;
        if (this.propCanUseCount[idx] <= 0) {
            this.battlePropCount[idx] = -1;

            const material = await loadMaterial(MaterialType.GraySprite);
            this.battlProps[idx].getChildByName('icon').getComponent(Sprite).customMaterial = material
            this.battlProps[idx].getChildByName('add').active = false;
            this.battlProps[idx].getChildByName('num').active = false;
            this.battlProps[idx].getChildByName('spine').active = false;
        } else {
            this.battlePropCount[idx] = 0; //还有使用次数
            this.battlProps[idx].getChildByName('add').active = true;
            this.battlProps[idx].getChildByName('num').active = false;
        }

    }

    //获得道具
    getBattleProp(idx) {
        this.battlePropCount[idx] = 1;

        this.battlProps[idx].getChildByName('add').active = false;
        this.battlProps[idx].getChildByName('num').active = true;
    }

    //随机消除一种颜色  优先选择数量最多的颜色 
    randomDelOneCorlor() {
        // let hadColor = [];
        // for (let i = 0; i < DataManager.dataBattle.boxNode.children.length; i++) {
        //     const nodeCircle = DataManager.dataBattle.boxNode.children[i];
        //     const modelCircle = nodeCircle.getComponent(ModelCircle);
        //     if (modelCircle.stillExist() && modelCircle.getState() === CircleState.Pool) {
        //         const faceTypeData = modelCircle.getFaceTypeData();
        //         for (const faceType in faceTypeData) {
        //             if (!hadColor.includes(Number(faceType))) {
        //                 hadColor.push(Number(faceType));
        //             }
        //         }
        //     }
        // }

        // const idx = getRandomInt(0, hadColor.length - 1);
        // const selectFaceType = hadColor[idx]; //选中这个类型

        let hadCorlor = {};
        for (let i = 0; i < DataManager.dataBattle.boxNode.children.length; i++) {
            const nodeCircle = DataManager.dataBattle.boxNode.children[i];
            const modelCircle = nodeCircle.getComponent(ModelCircle);
            if (modelCircle.stillExist() && modelCircle.getState() === CircleState.Pool) {
                const faceTypeData = modelCircle.getFaceTypeData();
                for (const faceType in faceTypeData) {
                    if (Number(faceType) !== anyCircleType) {
                        if (!hadCorlor[faceType + '']) {
                            hadCorlor[faceType + ''] = 0;
                        }
                        for (const faceId in faceTypeData[faceType]) {
                            hadCorlor[faceType + ''] += Number(faceTypeData[faceType][faceId]);
                        }
                    }

                }
            }
        }

        let maxCount = 0;
        let selectFaceType = null;
        for (const faceType in hadCorlor) {
            if (Number(hadCorlor[faceType]) > maxCount) {
                maxCount = Number(hadCorlor[faceType]);
                selectFaceType = Number(faceType);
            }
        }

        console.log('==========randomDelOneCorlor========facetype=======', selectFaceType)



        for (let i = 0; i < DataManager.dataBattle.boxNode.children.length; i++) {
            const nodeCircle = DataManager.dataBattle.boxNode.children[i];
            const modelCircle = nodeCircle.getComponent(ModelCircle);
            if (modelCircle.stillExist() && modelCircle.getState() === CircleState.Pool) {

                const faceTypeData = Utils.utils.deepClone(modelCircle.getFaceTypeData());
                for (const faceType in faceTypeData) {
                    if (Number(faceType) === selectFaceType) {
                        if (modelCircle.getCircleKindType() === CircleKindType.OneColor) {
                            modelCircle.destorySelf(true);
                        } else if (modelCircle.getCircleKindType() === CircleKindType.TwoColor) {
                            modelCircle.destoryFaceType(selectFaceType);
                        }
                    }
                }
            }
        }
    }

    //添加15个要收集的face
    async addCollectFace() {
        if (this.gameStatus === GameBattleStatus.End) {
            console.log('addCollectFace  game had over');
            return;
        }



        let remainCount = 15;
        const hadCollectFull = DataManager.dataBattle.hadCollectFull;
        const faceIdNeedCount = DataManager.dataBattle.stageConfig.collectFaceId;

        let remain_targets = [];
        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main) {
            DataManager.dataBattle.collectFaceIds.forEach((faceId, idx) => {
                const remainCount = faceIdNeedCount[idx] - hadCollectFull[idx];
                remain_targets.push([faceId, remainCount])
            })

            remain_targets.sort((a, b) => {
                return b[1] - a[1];
            });

        } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish) {
            remain_targets = [[DataManager.dataBattle.collectFaceIds[0], 100]];
        } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
            remain_targets = [[1104, 100]];
        }

        const nodePrefab = await Manager.bundleManager.load<Prefab>("model://face", Prefab);

        for (let i = 0; i < remain_targets.length; i++) {
            const faceId = remain_targets[i][0];
            const count = remain_targets[i][1]; //还需要收集多少个完成
            let addCount = 0;
            if (remainCount > count) {
                remainCount -= count;
                addCount = count;
            } else {
                addCount = remainCount;
                remainCount = 0;
            }

            let nodes = [];
            for (let k = 0; k < addCount; k++) {
                const nodeFace = instantiate(nodePrefab);
                nodeFace.parent = this.nodeSkill;
                nodeFace.name = 'face';
                nodeFace.setPosition(0, 0);
                nodes.push(nodeFace);

                const faceConfig = Config.Face[faceId];
                nodeFace.getComponent(ModelFace).setFaceType(faceConfig.faceType);
                nodeFace.getComponent(ModelFace).setFaceId(Number(faceId));

                nodeFace.getComponent(ModelFace).setFaceKind(faceConfig.faceKind);
                nodeFace.getComponent(ModelFace).setRadius(DataManager.dataBattle.faceSize / 2);
                nodeFace.getComponent(ModelFace).setFaceImage();
            }

            this.dispatchEmit(UI_EVENT_NAME.COLLECTION_FACE, nodes, false, true) //通知battle的收集栏收集face
        }
    }

    randomBoom(count: number) { //随机爆x个 优先选择最大的
        let nodes = [];
        for (let i = 0; i < DataManager.dataBattle.boxNode.children.length; i++) {
            const nodeCircle = DataManager.dataBattle.boxNode.children[i];
            if (nodeCircle.getComponent(ModelCircle).stillExist() && nodeCircle.getComponent(ModelCircle).getState() === CircleState.Pool) {
                nodes.push(nodeCircle);
            }
        }
        if (nodes.length === 0) {
            Toast.showToast('场上暂无可消除气泡');
            return;
        }

        nodes.sort((a, b) => {
            return b.getComponent(ModelCircle).getCircleType() - a.getComponent(ModelCircle).getCircleType();
        })

        console.log('=========randomBoom====================', nodes.length)
        if (DataManager.dataBattle.boxNode && nodes.length > 0) {
            for (let i = 0; i < count; i++) {
                if (nodes.length > 0) {
                    // const idx = getRandomInt(0, nodes.length - 1);
                    const nodeCircle = nodes[0];
                    nodeCircle.getComponent(ModelCircle).destorySelf(true);
                    nodes.splice(0, 1);
                }
            }
        } else {
            console.log('========没有找到box节点======');
        }
    }


    //选中一个气泡消除
    touchOneDestory() {
        this.dispatchEmit(UI_EVENT_NAME.CIRCLE_TOUCH_DESTORY, true);
        this.labRemainTime.getComponent(TimerLabelBy).pauseCountDown();
        this.setTouchShield('touch_one_destory', true);
        this.maskAll.active = true;
        changeParent(this.nodeBox, this.maskAll);
    }

    //打乱泡泡内颜色
    derangeCircle() {
        DataManager.dataBattle.distorbCircle();
    }

    async onClickBack() {
        gotoScene('home', false);
    }

    //下一个准备发射
    newCircleReady() {
        this._shootCount = -1;
        //等待的气泡移动到发射位

        let delayTime = 0;
        if (this._loseCount > 2) {
            console.log('====气泡触碰到警戒线=======', this._loseCount)
            delayTime = Number(getGlobalCfgValue('warnLineShootCD'))
        }

        this.scheduleOnce(() => {
            eventAfterPhysics(() => {
                this.waitMoveReadyPos(() => {
                    this.createWaitCircle(true); //创建一个新的等待位的气泡
                });
            })
        }, delayTime)

        if (this.touchHash['touch_one_destory']) {
            this.dispatchEmit(UI_EVENT_NAME.CIRCLE_TOUCH_DESTORY, true);
        }
    }
    update(deltaTime: number) {
        if (this._shootCount >= 0) {
            this._shootCount += deltaTime;
            // console.log('======_shootCount=========', this._shootCount)
            if (this._shootCount >= 3) { //N秒还没有落地则重置
                this.dispatchEmit(UI_EVENT_NAME.CIRCLE_FIRST_CONTACT);
            }
        }
    }

    onDestroy(): void {
        super.onDestroy();
        DataManager.dataBattle.boxNode = null;
        DataManager.dataSkill.clear();

        Tween.stopAll(); //销毁场景 停止所有缓动
    }

    gameOver() {
        if (this.gameStatus === GameBattleStatus.End) {
            console.warn('======game had  end  fail======')
            return;
        }
        this.gameStatus = GameBattleStatus.End;
        this.pauseGame();
        if (DataManager.dataBattle.reviveLimit[this.failType - 1] > 0) {
            DataManager.dataBattle.reviveLimit[this.failType - 1]--
            uiManager.show(UI_NAME.GameRevivePanel, this.failType);
        } else {
            if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main) {
                uiManager.show(UI_NAME.GameFailPanel);
            } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish) {
                uiManager.show(UI_NAME.GameFailPanelFish)
            } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
                const time = this.labRemainTime.getComponent(TimerLabelBy).getCountDown();
                uiManager.show(UI_NAME.GameEndCaoCao, false, time);
            }

        }
    }


    storageScore() {
        // let pass_count = Utils.storage.getItem('game_pass_count');
        // if (!pass_count) {
        //     pass_count = '0';
        // }
        // const newScore = Number(pass_count) + 1;
        // Utils.storage.setItem('game_pass_count', newScore + '');
        // sdkUtils.setUserCloudStorage([{ key: "score", value: newScore + '' }]); 

        if (isMiniGame) {
            const count = DataManager.dataPlayer.game_pass_count + 1;
            sdkUtils.setUserCloudStorage([{ key: "score", value: count + '' }]);
        }
        //通关了告知后端
        DataManager.dataPlayer.requestUpdateGameInfo({
            level: 1
        })

    }


    gameSuccess() {
        if (this.gameStatus === GameBattleStatus.End) {
            console.warn('======game had  end  success======')
            return;
        }
        Utils.storage.setItem('game_had_teach', "1");

        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main && DataManager.dataBattle.curStage > 1) {
            this.storageScore();
        } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish) {

        } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {

        }

        this.gameStatus = GameBattleStatus.End;
        this.pauseGame();
        // 技能清空
        DataManager.dataSkill.curSkill = null;
        DataManager.dataSkill.skillQueue = [];
        DataManager.dataSkill.ownWordZi.clear();
        this.nodeSkill.removeAllChildren();

        console.log('======gameSuccess======0======')
        let func = async () => {
            console.log('======gameSuccess======5=======')
            const nodeLizi = await createLizi(PerticleType.GameSuccess);
            nodeLizi.parent = this.node;
            nodeLizi.setSiblingIndex(999);
            this.scheduleOnce(() => {
                console.log('======gameSuccess======6======')

                if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main) {
                    uiManager.show(UI_NAME.GameSuccessPanel);
                } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
                    const time = this.labRemainTime.getComponent(TimerLabelBy).getCountDown();
                    uiManager.show(UI_NAME.GameEndCaoCao, true, time);
                }


            }, 1.5)
        }

        if (DataManager.dataBattle.curStage === 1) {
            func();
            return;
        }

        //气泡按照从高到低排序
        const circles = [];
        this.nodeBox.children.forEach((circleNode) => {
            if (circleNode.getComponent(ModelCircle).stillExist() && circleNode.getComponent(ModelCircle).getState() === CircleState.Shoot) {
                if (isValid(circleNode) && circleNode.getComponent(ModelCircle)) {
                    circleNode.getComponent(ModelCircle).destorySelf(true);
                }
            } else if (circleNode.getComponent(ModelCircle).stillExist() && circleNode.getComponent(ModelCircle).getState() === CircleState.Pool) {
                circles.push(circleNode);
            }
        })
        circles.sort((a, b) => {
            return convertToWorldSpaceAR(b).y - convertToWorldSpaceAR(a).y
        })

        if (circles.length === 0) {
            console.log('======gameSuccess======3=======')
            func();
        } else {
            console.log('======gameSuccess====4===1===')
            for (let i = 0; i < circles.length; i++) {
                const circleNode = circles[i];
                tween(circleNode).delay(1 + 0.3 * i).call(() => {
                    if (isValid(circleNode) && circleNode.getComponent(ModelCircle)) {
                        circleNode.getComponent(ModelCircle).destorySelf(true);
                    }
                }).delay(1.0).call(() => {
                    // if (i === circles.length - 1) {
                    //     console.log('======gameSuccess======4====2===')
                    //     func();
                    // }
                }).start();
            }
            this.scheduleOnce(() => {
                func();
            }, 1 + 1 + 0.3 * circles.length)
        }

    }

    pauseGame(isStopTouch: boolean = true) {
        console.log('=====123==============pauseGame======')
        this.unschedule(this.checkLose);
        this.labRemainTime.getComponent(TimerLabelBy).pauseCountDown();
        this.stopTouch.active = isStopTouch;
    }

    resumeGame() {
        console.log('=====123==============resumeGame======')
        this.labRemainTime.getComponent(TimerLabelBy).resumeCountDown();
        this.stopTouch.active = false;
        this.startCheckLose();
    }

    //游戏结束要设置的量
    setGameClear() {
        this.unschedule(this.checkLose); //停止警戒线计算
        DataManager.dataSkill.curSkill = null; //技能列表清空
        DataManager.dataSkill.skillQueue = [];
        DataManager.dataSkill.setStatus(SkillStatus.Stop);
        // this._canFall = false;

        this.touchHash = {};

        DataManager.dataSkill.ownWordZi.clear();
        this.scrollView.getComponent(ScrollReuse).initView([], 5);
        this.nodeSkill.removeAllChildren();

        this.nodeBox.children.forEach((node) => {
            Tween.stopAllByTarget(node);
        })
        eventAfterPhysics(() => {
            this.nodeBox.removeAllChildren();
        })

        // this.nodeGrayLayer.active = false;
        // this.nodeGrayLayer2.active = false;

        this.labRemainTime.getComponent(TimerLabelBy).stopCountdownBy();
    }

    gameEndNext(nextStage) {
        if (nextStage === BATTLE_END_NEXT_OPERATION.BACKHOME) {
            this.setGameClear();
            this.onClickBack();
        } else if (nextStage === BATTLE_END_NEXT_OPERATION.REVIVE) {
            this.gameStatus = GameBattleStatus.Playing;


            //两种复活 一种是时间到（加时间） 一种是警戒线 （200以内泡泡消除）
            this.resumeGame(); //继续游戏

            if (this.failType === FailType.DeadLine) {
                const reviveGiveTime = Number(getGlobalCfgValue('reviveGiveTime'));
                DataManager.dataBattle.remainTime = reviveGiveTime;
                this.setDeadTime();
                this.cancelPropRemind(PropRemindType.TimeRemind);
            } else if (this.failType === FailType.WarnLine) {
                this._loseCount = 0;
                this.warnLine.getComponent(ModelLine).setNormalColor();
                this.checkWarnCircleBoom();
            }
            this.scheduleOnce(() => {
                this.startCheckLose(); //下一帧 开始检查警戒线  
            })
            this.failType = FailType.None;

        } else if (nextStage === BATTLE_END_NEXT_OPERATION.NEXTSTAGE) {
            this.setGameClear();
            if (nextStage) {
                DataManager.dataBattle.curStage++;
                DataManager.dataBattle.curLittleStage = 1;

                if (DataManager.dataBattle.curStage > 2) {
                    // Toast.showToast('恭喜你 已通关');
                    this.onClickBack();
                    return;
                }
            }
            this.initStage();
        } else if (nextStage === BATTLE_END_NEXT_OPERATION.RESTART) {
            this.setGameClear();
            DataManager.dataBattle.curStage = 1;
            DataManager.dataBattle.curLittleStage = 1;
            this.resetGameConfig(); //重置次数
            this.initStage();
            this.collectFaceAnim();

            this.initSkillInfo()//右侧两个技能信息 是否收集全触发一次词条
            this.nodeSkillPanel.active = false;
            this.initExchangeCount(); //有5次免费交换次数
        }
    }

    //把准备发射的气泡 变彩虹
    changeFaceToCaihong() {
        if (!isValid(this._curCircle)) {
            return;
        }
        Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_ChangeColor');

        const modelCircle = this._curCircle.getComponent(ModelCircle);
        const faceTypeData = Utils.utils.deepClone(modelCircle.getFaceTypeData());
        modelCircle.setCircleAnim(CircleAnimType.Spine);

        tween(this._curCircle).delay(1.0).call(() => {

            for (const faceType in faceTypeData) {
                if (Number(faceType) !== anyCircleType) {
                    modelCircle.delFace(Number(faceType), null, false);
                } else {
                    continue;
                }

                const faceInfo = faceTypeData[faceType];
                for (const faceId in faceInfo) {
                    const count = faceInfo[faceId];
                    const faceConfig: Face = Config.Face[faceId];
                    if (faceConfig.faceKind === FaceKindType.CommonFace) {
                        modelCircle.createFace(anyCircleType, { [DataManager.dataBattle.anyCircleFaceId]: count });
                    } else if (faceConfig.faceKind === FaceKindType.SkillFace) {

                        const faceIds = Config.Skill[faceConfig.skillId].faceIds;
                        const newFaceId = faceIds[faceIds.length - 1];
                        modelCircle.createFace(anyCircleType, { [newFaceId]: count })
                    } else if (faceConfig.faceKind === FaceKindType.WordFace) {
                        modelCircle.createFace(anyCircleType, { [faceId]: count })
                    }
                }
            }
        }).start()

    }


    onClickHelp() {
        uiManager.show(UI_NAME.HelpPanel, this.nodeSkill.getChildByName('guide_help'));

        // if (this.nodeSkill.getChildByName('guide_help')) {
        //     const node = this.nodeSkill.getChildByName('guide_help');
        //     Tween.stopAllByTarget(node);
        //     node.destroy();
        // }
    }

    onClickSet() {
        const time = this.labRemainTime.getComponent(TimerLabelBy).getCountDown();
        uiManager.show(UI_NAME.SetPanel, time);
    }

    //打开词条收集册
    onClick_Collection() {
        if (G_isTest) {
            uiManager.show(UI_NAME.CollectionPanel, false);
        } else {
            uiManager.show(UI_NAME.CollectNewPanel, 0);
        }

        if (this.nodeSkill.getChildByName('guide_collection')) {
            this.nodeSkill.getChildByName('guide_collection').destroy();

            changeParent(this.btnCollection, this.bottomNode);
            this.maskAll.active = false;

            this.resumeGame();
        }
    }

    //点击技能图标
    onClick_Skill() {
        this.nodeSkillPanel.active = !this.nodeSkillPanel.active;
    }

    //触发技能 右下角两个技能
    onClick_TriggerSkill(touch, data: string) {
        const collectID = Number(data);
        if (collectID === 0) {
            Toast.showToast('前往收集册收集表情包可激活技能')
            return;
        }

        const value = Config.CollectEffect[collectID];

        switch (value.collectID) {
            case 1:
                TESdkData.changPropUse("4");
                this.onClickSKill_RandomBoom();
                break;
            case 2:
                TESdkData.changPropUse("5");
                this.onClickSKill_ChangeCaihong();
                break;
            default:
                break;
        }
    }

    //随机爆炸一个气泡
    async onClickSKill_RandomBoom() {
        const nodes = [];
        for (let i = 0; i < DataManager.dataBattle.boxNode.children.length; i++) {
            const circleNode = DataManager.dataBattle.boxNode.children[i];
            if (circleNode.getComponent(ModelCircle).stillExist() && circleNode.getComponent(ModelCircle).getState() === CircleState.Pool) {
                nodes.push(circleNode);
            }
        }

        if (DataManager.dataBattle.skillUseLimit[BattleSkillType.RandomBoom - 1] <= 0) {
            return;
        }

        if (nodes.length === 0) {
            Toast.showToast('场上暂无气泡')
            return;
        }

        const idx = getRandomInt(0, nodes.length - 1);
        console.log('===onClickSKill_RandomBoom===getRandomInt============', idx, nodes.length);
        const circleNode = nodes[idx];
        circleNode.getComponent(ModelCircle).destorySelf(true);

        //置灰
        DataManager.dataBattle.skillUseLimit[BattleSkillType.RandomBoom - 1]--;
        if (DataManager.dataBattle.skillUseLimit[BattleSkillType.RandomBoom - 1] <= 0) {
            const icon = this.nodeSkillPanel.children[BattleSkillType.RandomBoom].getChildByName('icon');

            const material = await loadMaterial(MaterialType.GraySprite);
            icon.getComponent(Sprite).customMaterial = material;
        }
    }

    //准备发射的变彩虹
    async onClickSKill_ChangeCaihong() {
        if (DataManager.dataBattle.skillUseLimit[1] <= 0) {
            return;
        }

        if (!isValid(this._curCircle) || this._curCircle.getComponent(ModelCircle).getState() !== CircleState.Ready) {
            Toast.showToast('等待发射位气泡')
            return;
        }

        this.changeFaceToCaihong();

        DataManager.dataBattle.skillUseLimit[BattleSkillType.ReadyCaihong - 1]--;
        if (DataManager.dataBattle.skillUseLimit[BattleSkillType.ReadyCaihong - 1] <= 0) {
            const icon = this.nodeSkillPanel.children[BattleSkillType.ReadyCaihong].getChildByName('icon');

            const material = await loadMaterial(MaterialType.GraySprite);
            icon.getComponent(Sprite).customMaterial = material;
        }
    }


    showOpacity(node: Node) {
        tween({ a: 255 }).to(0.5, { a: 0 }, {
            onUpdate: (target?: { a: number }, ratio?: number) => {
                node.getComponent(UIOpacity).opacity = target.a;
            }
        }).start();
    }


    async showCombom(num: number) {
        const path = 'battle://combo_toast';
        const prefab: Prefab = await Manager.bundleManager.load<Prefab>(path, Prefab);
        if (prefab) {
            const node = instantiate(prefab);
            node.getComponent(ComboToast).setData(num);
            node.parent = this.nodeSkill;
            node.setPosition(0, 0, 0);
            this.dispatchEmit(UI_EVENT_NAME.COMBO_TOAST_MOVEUP);
        }
    }
}

