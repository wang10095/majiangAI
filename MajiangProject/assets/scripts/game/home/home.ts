import { _decorator, Node, Label, UITransform, find, Color, view, Widget, v3, sys, Sprite, isValid, UIOpacity, director, tween, Button } from 'cc';
import { SuperScene } from '../../frame/center/components/super-scene';
import { Manager } from '../../frame/center/manager';
import { UI_TYPE_BY, uiManager } from '../../frame/center/managers/ui-manager';
import { DataManager } from '../data/data-manager';
import { DATA_EVENT_NAME, G_emptyImageUrl, G_headIconUrl, G_isTest, ShareOrAds, UI_EVENT_NAME, UI_NAME } from '../constant/common-define';
import { Toast } from '../../frame/center/components/toast';
import { G_shareGame, getGlobalCfgValue, getRandomInt } from '../common';
import Utils from '../../frame/center/utils/utils';
import ScrollReuse from '../../frame/center/components/scroll-endless';
import { convertToWorldSpaceAR, G_getAdsOrShare, gotoScene } from '../ui-commonset';
import { isDebugTest, isMiniGame } from '../game-define';
import { redDotManager } from '../../frame/center/managers/red-dot-manager';
import { RED_DOT_KEY } from '../common/red-dot';
import { sdkUtils } from '../../frame/sdk-common/sdk-utils';
import { game } from 'cc';
import { v2 } from 'cc';
import { BATTLE_STAGE_TYPE } from '../data/data-battle';
import { TESdkData } from '../../frame/sdk-common/TE-sdk';
const { ccclass, property } = _decorator;

@ccclass('home')
export class home extends SuperScene {
    @property({
        type: Node,
        tooltip: '顶部区域'
    })
    topNode: Node;

    @property({
        type: Node,
        tooltip: '背景节点'
    })
    bgNode: Node;

    @property({
        type: Node,
        tooltip: '中间区域'
    })
    centerNode: Node;

    @property({
        type: Label
    })
    labFreeCount: Label = null;

    @property({
        type: Node
    })
    btnStart: Node = null;

    @property({
        type: Node
    })
    btnAds: Node = null;

    @property({
        type: Label,
        tooltip: '挑战的总人数'
    })
    labAllCount: Label = null;


    @property({
        type: Label,
        tooltip: '通关的总人数'
    })
    labPassCount: Label = null;


    @property({
        type: Node,
        tooltip: '',
    })
    nodeScrollView: Node = null;

    @property({ type: Node, tooltip: '顶部滚动聊天' })
    nodeScrollTalkView: Node = null;

    @property({
        type: Node,
        tooltip: '微信的游戏圈'
    })
    nodeGameCircle: Node = null;

    @property({
        type: Label,
        tooltip: '摇人数量'
    })
    inviteFriend: Label = null;

    @property({
        type: Node,
        tooltip: '设置面板'
    })
    nodeSetPanel: Node = null;

    @property({
        type: Node,
        tooltip: '游戏圈'
    })
    btnGameClub: Node = null;


    @property({
        type: Label,
        tooltip: '本地区排名'
    })
    labMyAreaRank: Label = null;


    _hadFreeCount: number = 0;
    _shareGetProp: boolean = false;
    gameCircleNode = null;

    onLoad(): void {

        super.onLoad();

        game.on(
            'game_on_resume',
            () => {
                console.log('==1231312=')
                if (this._shareGetProp) { //分享回来
                    this.getCountEnterBattle();
                } else {
                    this.checkGameCircle();
                }
            },
            this
        );

        this.registerEmit(
            [
                DATA_EVENT_NAME.RANK_AREA,
                DATA_EVENT_NAME.GAME_INFO,
                UI_EVENT_NAME.Popup_Show,
                UI_EVENT_NAME.Popup_Close,
                DATA_EVENT_NAME.GAME_CLUB_INFO,
                DATA_EVENT_NAME.GET_INVITE_INFO,
            ],
            [
                this.updateRankArea,
                this.updateGameInfo,
                () => {
                    if (this.gameCircleNode) {
                        this.gameCircleNode.hide();
                    }

                },
                () => {
                    if (this.gameCircleNode) {
                        this.gameCircleNode.show();
                    }
                },
                this.getGameClubReward,
                this.updateInviteFriendInfo,
            ],
            this
        );
        DataManager.currentSceneName = 'home';
        DataManager.dataBattle.curStage = 1;
        DataManager.dataBattle.curLittleStage = 1;
        DataManager.dataBattle.curTao = getRandomInt(1, 2);

        this.registerRedDot();
        this.nodeSetPanel.active = false;

        const singleButton = find('Canvas/btn_single') ?? this.node.getChildByPath('btn_single');
        singleButton?.getComponent(Button)?.node.on(Button.EventType.CLICK, this.onClickBattle, this);

        // this.scheduleOnce(() => {
        //     const data = {
        //         "rewards": [
        //             {
        //                 "type": "prop",
        //                 "id": "prop1",
        //                 "count": 1
        //             },
        //             {
        //                 "type": "pose",
        //                 "id": "pose1",
        //                 "count": 1
        //             }
        //         ]
        //     }
        //     uiManager.show(UI_NAME.CommonRewardPanel, data.rewards)
        // }, 1.0);


    }
    start() {
        super.start();
        // const viewSize = view.getVisibleSize();
        // // 远超设计分辨率的长屏幕，将多余的长度分： 顶 底和中间娃娃机 均分，防止上下区域过大
        // const safeArea = sys.getSafeAreaRect();
        // console.log('safearena:', safeArea, safeArea.y, safeArea.height);
        // console.log('height:', viewSize.height - safeArea.y);
        // viewSize.height -= safeArea.y;

        //引导
        this.registerGuideButtonEven();
        const startTime = Date.now();
        console.log('home start', startTime);
        // 加载battle模块
        if (DataManager.dataPlayer.isFirstEnter) {  //首次进入预加载battle
            DataManager.dataPlayer.isFirstEnter = false;
        } else {
            this.initGameData(false);
        }

        Manager.audioManager.playMusic('S_MainHallBGM');
        this.initUI();

        this.initBattleBg();
        this.initFaceUse();
        this.getLocation(); //获取位置
        this.createGameCircle(); //游戏圈

        //获取必须的后端数据
        this.getRequestData();
        //预加载一些bundle
        this.preloadBundle();
    }

    private getRequestData() {

        DataManager.dataPlayer.requestGameInfo(); //获取挑战次数等 游戏数据
        this.scheduleOnce(() => {
            DataManager.dataHome.requestInviteFriendInfo(); //获取邀请好友的人数
        }, 0.05)
        this.scheduleOnce(() => {
            DataManager.dataHome.requestGetCollectItem('word'); //获取词条收集数据
        }, 0.1)
        this.scheduleOnce(() => {
            DataManager.dataHome.requestGetCollectItem('pose'); //获取pose收集数据
        }, 0.15)

        this.scheduleOnce(() => {
            DataManager.dataHome.requestEmailInfo();
            DataManager.dataHome.requestNoticeMessage();
        }, 0.2);

    }

    //提前预加载游戏内用到的bundle
    async preloadBundle() {
        this.btnStart.active = false;
        const bundleName = [ //预先加载技能
            'skill_boom',
            'skill_transform_random',
        ];

        const allPromise = [];
        bundleName.forEach((name: string) => {
            allPromise.push(Manager.bundleManager.preloadBundle(name));
        })
        await Promise.all(allPromise);
        this.btnStart.active = true;

        if (DataManager.dataPlayer.isNewRegister) { //新注册的用户 首次进入游戏直接进入battle
            DataManager.dataPlayer.isNewRegister = false;
            this.onClickBattle();
        }
    }

    //领取加入好友圈奖励
    getGameClubReward(data) {
        uiManager.close(UI_NAME.GameClubPanel);
        uiManager.show(UI_NAME.CommonRewardPanel, data.rewards);
        this.createGameCircle();
    }


    checkGameCircle() {
        if (isMiniGame) {
            console.log('======getGameClubData====000======');
            wx.getGameClubData({
                dataTypeList: [{ type: 1 }],
                success: (res) => {
                    console.log('======getGameClubData====success======', res);
                    DataManager.dataHome.requestGetEnterGameCircle(res.encryptedData, res.iv);

                }, fail: (res) => {
                    console.log('======getGameClubData====fail======', res);
                }, complete: (res) => {
                    console.log('======getGameClubData====complete======', res);
                }
            })
        }
    }

    createGameCircle() {
        console.log(view.getVisibleSize(), '====createGameCircle===', sys.getSafeAreaRect(), view.getFrameSize())

        // const viewSize = view.getVisibleSize()
        // const wordPos = convertToWorldSpaceAR(this.btnGameClub);
        // const topD = (viewSize.height - wordPos.y) / 2

        const frameSize = view.getFrameSize();
        const wordPos = convertToWorldSpaceAR(this.btnGameClub);
        console.log('====createGameCircle=======0000=========', wordPos.y)
        const topD = frameSize.height - wordPos.y * frameSize.height / 1334;
        console.log('====createGameCircle=======11111=========', topD)

        if (isMiniGame) {
            if (DataManager.dataPlayer.club_ts) {
                const button = wx.createGameClubButton({
                    icon: 'green',
                    style: {
                        left: 15,
                        top: topD + 40,
                        width: 50,
                        height: 50,
                        backgroundColor: '',
                        borderColor: '',
                        borderRadius: 0,
                        borderWidth: 0,
                        color: '',
                        fontSize: 0,
                        lineHeight: 0,
                        textAlign: 'left'
                    },
                    hasRedDot: false,
                    type: 'image',
                    image: G_emptyImageUrl()
                    // image: G_headIconUrl("chat_head_01")

                })
                this.gameCircleNode = button;
                button.show();

            }
        }
    }

    updateGameInfo(data) {
        this.checkFreeCount();
    }

    updateRankArea(data) {
        this.labAllCount.string = data.total_user + '';
        this.labPassCount.string = data.pass_user + '';
        this.nodeScrollView.getComponent(ScrollReuse).initView(DataManager.dataPlayer.allRankArea, 4);
        //自己地区的排名
        for (let i = 0; i < DataManager.dataPlayer.allRankArea.length; i++) {
            if (DataManager.dataPlayer.allRankArea[i].adcode == (DataManager.dataPlayer.locationCode || 980000)) {
                this.labMyAreaRank.string = (i + 1) + '';
                break;
            }
        }
    }

    getLocation() {
        DataManager.dataPlayer.requestRankArea(); //获取所有信息

        if (DataManager.dataPlayer.location == null || DataManager.dataPlayer.location == '') {
            //获取本地位置坐标
            sdkUtils.getFuzzyLocation((latitude, longitude) => {
                console.log('=====getFuzzyLocation==========', latitude, longitude);
                DataManager.dataPlayer.requestGetLocation(latitude, longitude);
            });
        }

    }

    initBattleBg() {
        const storageBg = Utils.storage.getItem('battle_bg');
        if (storageBg) {
            const lastBg = Number(storageBg);
            let newBg = lastBg + 1;
            if (newBg > 3) {
                newBg = 1;
            }
            Utils.storage.setItem('battle_bg', newBg + '');
        } else {
            Utils.storage.setItem('battle_bg', "1");
        }
    }

    initFaceUse() {
        let _type = 0;
        const storageBg = Utils.storage.getItem('face_use_type');
        if (storageBg) {
            const lastUse = Number(storageBg);
            let newUse = lastUse + 1;
            if (newUse > 2) {
                newUse = 1;
            }
            Utils.storage.setItem('face_use_type', newUse + '');
            _type = newUse;
        } else {
            Utils.storage.setItem('face_use_type', "1");
            _type = 1;
        }

        const ABtest = Utils.storage.getItem('AB_bundle_show'); //AB 测试  A 单色 B 双色
        if (ABtest && ABtest == 'A') {
            Utils.storage.setItem('face_use_type', "2"); //A包用小鸡
            _type = 2;
        }
        if (ABtest && ABtest == 'B') {
            Utils.storage.setItem('face_use_type', "1");  //B包用表情
            _type = 1;
        }

        for (const key in Config.FaceType) {
            (Config.FaceType[key] as any).simplefaceIdArray = Config.FaceType[key]['simplefaceIdArray_' + _type]
        }
        for (const key in Config.Skill) {
            (Config.Skill[key] as any).faceIds = Config.Skill[key]['faceIds_common']
        }

        console.log(Config.Skill, '============', Config.FaceType);

        DataManager.dataBattle.anyCircleFaceId = 1701;
        if (_type === 2) {
            DataManager.dataBattle.anyCircleFaceId = 1702;
        }
    }

    //红点注册
    registerRedDot() {
        redDotManager.registerRedDotAllTree({
            key: RED_DOT_KEY.WORD_COLLETION,
            keyParent: null,
            keyChilds: []
        });

        redDotManager.registerRedDotAllTree({
            key: RED_DOT_KEY.SET_ENTER,
            keyParent: null,
            keyChilds: [
                {
                    key: RED_DOT_KEY.EMAIL_BUTTON,
                    keyParent: RED_DOT_KEY.SET_ENTER,
                    keyChilds: [],
                }
            ]
        });
    }

    initUI() {
        if (G_isTest) {
            const gamePassAllCount = this.getAllPassCount();
            this.labPassCount.string = gamePassAllCount + '';
            this.nodeScrollView.getComponent(ScrollReuse).initView(Object.values(Config.City), 4);
        }
        // this.checkFreeCount();

        // 聊天
        let talkData = [];
        for (let i = 0; i < 4; i++) {
            const data = this.getTalkData();
            talkData.push(data);
        }
        this.nodeScrollTalkView.getComponent(ScrollReuse).initView(talkData, 4);

    }

    taskIdx: number = 4;
    addRandomTalk() {
        this.taskIdx++;
        this.nodeScrollTalkView.getComponent(ScrollReuse).addData(this.taskIdx, this.getTalkData());
        // this.nodeScrollTalkView.getComponent(ScrollReuse).addDatas(this.talkData);
        this.nodeScrollTalkView.getComponent(ScrollReuse).scrollView.scrollToBottom(0.3);
    }
    getTalkData() {
        const chatLen: number = Object.keys(Config.Chatlog).length - 1;
        let idx = getRandomInt(0, chatLen);
        const r: number = Math.floor(Math.random() * 10) + 1;
        const chatData: Chatlog = Object.values(Config.Chatlog)[idx];
        return { dir: r, faceId: chatData.faceID, msg: chatData.logContent };
    }

    //检查免费次数
    _showAdsOrShare = null;
    checkFreeCount() {
        const freeCount: number = Number(getGlobalCfgValue('gameFreeCount')); //每日免费次数


        if (DataManager.dataPlayer.game_count >= freeCount) { //免费次数用完
            this._showAdsOrShare = G_getAdsOrShare();
            this.btnAds.getChildByName('ads').active = this._showAdsOrShare === ShareOrAds.Ads;
            this.btnAds.getChildByName('share').active = this._showAdsOrShare === ShareOrAds.Share;
            this._hadFreeCount = 0;
        } else {
            this.btnAds.getChildByName('ads').active = false;
            this.btnAds.getChildByName('share').active = false;
            this._hadFreeCount = freeCount - DataManager.dataPlayer.game_count;
        }
        this.setFreeCount();

        // const lastPlayTime = Utils.storage.getItem('game_play_time');
        // const playCount = Utils.storage.getItem('game_play_count');
        // this._hadFreeCount = 0;
        // if (playCount && lastPlayTime) {
        //     const date = Date.now();
        //     const isSameDay = Utils.time.isSameDay(date, Number(lastPlayTime));
        //     if (!isSameDay) {
        //         Utils.storage.setItem('game_play_count', freeCount + '');
        //         this._hadFreeCount = 3;
        //     } else {
        //         this._hadFreeCount = Number(playCount);
        //     }
        // } else {
        //     Utils.storage.setItem('game_play_count', freeCount + '');
        //     Utils.storage.setItem('game_play_time', Date.now() + '');
        //     this._hadFreeCount = 3;
        // }

        // this.btnAds.active = this._hadFreeCount === 0;
        // if (this._hadFreeCount === 0) {
        //     this._showAdsOrShare = G_getAdsOrShare();
        //     this.btnAds.getChildByName('ads').active = this._showAdsOrShare === ShareOrAds.Ads;
        //     this.btnAds.getChildByName('share').active = this._showAdsOrShare === ShareOrAds.Share;
        // }
        // this.setFreeCount();
    }

    goShowAds() {
        uiManager.show(UI_NAME.AdsShowPanel, 'get_play_count', () => {
            this.getCountEnterBattle();
        });
    }

    goShowShare() {
        this._shareGetProp = true;
        G_shareGame('/sharebeforelogin/?fromType=get_game_count&uid=' +
            DataManager.dataPlayer.uid +
            '&platform=' +
            getGameGlobal().platform +
            '&version=' +
            getGameGlobal().gameVersion +
            '&timestamp=' +
            new Date().getTime());
    }

    //通过分享或者看广告获得次数直接进入游戏
    getCountEnterBattle() {
        this._hadFreeCount++;
        this.setFreeCount();
        Utils.storage.setItem('game_play_count', this._hadFreeCount + '');
        Utils.storage.setItem('game_play_time', Date.now() + '');
        this.btnAds.active = false;
        this.onClickBattle();
    }

    getGameOneCount() {
        if (this._showAdsOrShare === ShareOrAds.Ads) {
            this.goShowAds();
        } else if (this._showAdsOrShare === ShareOrAds.Share) {
            this.goShowShare();
        }
    }

    async onClickBattle() {

        // 暂时跳过次数和广告限制，无后端时点击开始直接进入游戏。
        // if (this._hadFreeCount <= 0) {
        //     if (G_isTest) {
        //         this.goShowAds();
        //     } else {
        //         if (isMiniGame) {
        //             this.getGameOneCount();
        //         } else {
        //             this.goShowAds();
        //         }
        //     }
        //     return;
        // }

        // this._hadFreeCount--;
        // Utils.storage.setItem('game_play_count', this._hadFreeCount + '');
        // Utils.storage.setItem('game_play_time', Date.now() + '');

        // 暂时关闭开始游戏的后端请求。
        // if (!G_isTest) {
        //     DataManager.dataHome.requestPlayGame(BATTLE_STAGE_TYPE.Main);
        // }

        DataManager.dataBattle.battleType = BATTLE_STAGE_TYPE.Main;
        TESdkData.reportPlayGame()

        gotoScene('battle', true, [
            'word_bushigemen',
            'word_change_caihong',
            'word_random_caihong',
            'word_tuituitui',
            'word_zadi',
            'word_zundujiadu',
        ]);

    }

    private showTipGuide() {
        // 间隔 N s 无操作则显示提示点击小手
        const hasShowPanels = uiManager.checkHasShowUIType([UI_TYPE_BY.UI_LAYER, UI_TYPE_BY.UI_PANEL, UI_TYPE_BY.UI_POPUP, UI_TYPE_BY.UI_ALERT]);
    }

    // 点击主城隐藏新手引导
    private hideTipGuide() {

    }

    // 新手引导节点注册监听事件
    private registerGuideButtonEven() {
        // if (DataManager.dataGuide.guideIsOver()) {
        //     return;
        // }
        // const taskButtonNode = find('Canvas/bottom/task_item/shanguang/item_icon');
        // taskButtonNode.off(UI_EVENT_NAME.GUIDE_CLICK_EVENT);
        // taskButtonNode.on(UI_EVENT_NAME.GUIDE_CLICK_EVENT, () => {
        //     taskButtonNode.parent.parent.getComponent(TaskItem).onBtnClicTask();
        // })
    }

    // 初始化游戏数据，在start中可能由于消息下发慢 不初始化
    initGameData(isFrirstEnter: boolean = true) {
        // this.refreshCoinNum(this.labDiamond, ITEM_ID.DIAMOND);
    }

    // 进入游戏后的请求  //家园 探索 宠物 精灵  有解锁判定
    private startGameRequest() {
        // ------ 刷新属性,所有属性刷新 --------- 保持我在最后 作为从后端获取数据完成的标志
        // DataManager.dataEquip.requestCollectionStatus();
    }

    private dt: number = 0;
    update(deltaTime: number) {
        // console.log("update:",deltaTime);
        this.dt = this.dt + deltaTime;
        if (this.dt > 3) {
            this.dt = 0;
            this.addRandomTalk();
        }
    }

    onDestroy(): void {
        super.onDestroy();
        if (this.gameCircleNode) {
            this.gameCircleNode.destroy();
        }

    }

    setFreeCount() {
        const freeCount: number = Number(getGlobalCfgValue('gameFreeCount'));
        this.labFreeCount.string = `今日免费${this._hadFreeCount}/${freeCount}`;
    }

    onClickInvite() {
        if (G_isTest) {
            Toast.showToast('敬请期待');
        } else {
            uiManager.show(UI_NAME.InviteFriendPanel)
        }
    }
    onClickCollection() {
        if (G_isTest) {
            uiManager.show(UI_NAME.CollectionPanel, false);
        } else {
            uiManager.show(UI_NAME.CollectNewPanel, 0);
        }
    }

    onClickLocation() {
        if (G_isTest) {
            Toast.showToast('敬请期待');
        } else {
            //跳转到自己所在的省份
            const scroll = this.nodeScrollView.getComponent(ScrollReuse);
            const data = scroll.getData();
            for (let i = 0; i < data.length; i++) {
                if (data[i].adcode == (DataManager.dataPlayer.locationCode || 980000)) {
                    const yy = (375 + 80) * i
                    this.nodeScrollView.getComponent(ScrollReuse).scrollView.getScrollOffset();
                    scroll.scrollView.scrollToOffset(v2(0, yy), 0.5)
                    break;
                }
            }
        }
    }

    onClickRank() {
        if (G_isTest) {
            Toast.showToast('敬请期待');
        } else {
            uiManager.show(UI_NAME.RankPanel)
        }
    }

    getAllPassCount() {
        let count = 0;
        for (const rankId in Config.City) {
            const value = Config.City[rankId];
            count += value.passNumber;
        }
        return count;
    }

    onClickUser() {
        if (G_isTest) {
            Toast.showToast('敬请期待');
        } else {
            uiManager.show(UI_NAME.UserPanel)
        }
    }

    updateInviteFriendInfo(data) {
        const count = data.count;

        for (const key in data.reward) {
            const value = data.reward[key];
            if (count >= value.invite_user && DataManager.dataPlayer.invite_stage < Number(key)) {
                this.inviteFriend.string = '领取奖励'
                break;
            }

            if (count < value.invite_user) {
                const needCount = value.invite_user - count;
                this.inviteFriend.string = `还差${needCount}人`
                break;
            }
        }
    }

    onClickGameClub() {
        if (G_isTest) {
            Toast.showToast('敬请期待');
        } else {
            if (isMiniGame && !DataManager.dataPlayer.club_ts) {
                uiManager.show(UI_NAME.GameClubPanel)
            }
        }
    }

    onClickSetShow() {
        if (G_isTest) {
            uiManager.show(UI_NAME.SetPanel);
        } else {
            this.nodeSetPanel.active = !this.nodeSetPanel.active;
        }
    }

    onClickSet() {
        uiManager.show(UI_NAME.SetPanel);
        this.nodeSetPanel.active = false;
    }

    onClickEmail() {
        uiManager.show(UI_NAME.EmailPanel);
        this.nodeSetPanel.active = false;
    }

    onClicNotice() {
        uiManager.show(UI_NAME.NoticePanel);
        this.nodeSetPanel.active = false;
    }

    onClick_Anwer() {
        Toast.showToast('敬请期待')
        // uiManager.show(UI_NAME.AnswerPanel);
    }

    onClick_DailyChallenge() {
        uiManager.show(UI_NAME.GameChallengePanel);
    }

}
