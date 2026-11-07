import { _decorator, Node, Label, UITransform, find, Color, view, Widget, v3, sys, Sprite, isValid, UIOpacity, director, Toggle, tween } from 'cc';


import { SuperPanel } from '../../frame/center/components/super-panel';
import { Manager } from '../../frame/center/manager';
import { DataManager } from '../data/data-manager';
import Utils from '../../frame/center/utils/utils';
import { G_setPlayerName, G_setRemoteSpriteFrame, gotoScene } from '../ui-commonset';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { CountdownTypeBy, UI_EVENT_NAME, UI_NAME } from '../constant/common-define';
import ScrollReuse from '../../frame/center/components/scroll-endless';
import { isMiniGame, isWeChat } from '../game-define';
import { sdkUtils } from '../../frame/sdk-common/sdk-utils';
import { TabMenu } from '../../frame/center/components/tab-menu';
const { ccclass, property } = _decorator;

@ccclass('RankPanel')
export class RankPanel extends SuperPanel {
    @property({
        type: Node
    })
    nodeRank: Node = null;

    @property({
        type: Node
    })
    areaScroll: Node = null;

    @property({
        type: Label
    })
    selfAreaRank: Label = null;

    @property({
        type: Label
    })
    selfAreaName: Label = null;

    @property({
        type: Label
    })
    selfAreaScore: Label = null;

    @property({
        type: Node
    })
    fishScroll: Node = null;

    @property({
        type: Node
    })
    myFishRank: Node = null;

    @property({
        type: Node
    })
    caocaoScroll: Node = null;

    @property({
        type: Node
    })
    myCaoCaoRank: Node = null;

    @property({ type: Node })
    tabMenu: Node = null;


    _openContext = null;

    protected onLoad(): void {
        super.onLoad();
        this.registerEmit(
            [
                UI_EVENT_NAME.EVENT_FISH_RANK,
                UI_EVENT_NAME.EVENT_CAOCAO_RANK,
            ],
            [
                this.updateFishRank,
                this.updateCaoCaoRank,
            ],
            this
        );

    }

    start() {
        super.start();
        DataManager.dataHome.requestFishRank();
        DataManager.dataHome.requestCaoCaoRank();

        if (isWeChat) { //判断微信环境
            console.log('=========微信好友排行榜===============')
            this.initRankView();
        }
        this.initProvinceRank();

        this.onUpdateHead(); //获取自己头像权限

        this.tabMenu.getComponent(TabMenu).onTabMenu(0, this.onTabMenuTouchFunc.bind(this));
    }

    onTabMenuTouchFunc(name: string) {
        const idx = Number(name);
        this.tabMenu.getComponent(TabMenu).switchToContent(idx); //切换tab

        if (idx === 2) {
            this.updateFishRank();
        } else if (idx === 3) {
            this.updateCaoCaoRank();
        }

    }

    initProvinceRank() {
        const allRankArea = Utils.utils.deepClone(DataManager.dataPlayer.allRankArea);
        allRankArea.sort((a, b) => {
            return b.total - a.total;
        })
        this.areaScroll.getComponent(ScrollReuse).initView(allRankArea, 8);
        this.areaScroll.getComponent(ScrollReuse).scrollView.scrollToTop();
        for (let i = 0; i < allRankArea.length; i++) {
            if (DataManager.dataPlayer.locationCode == allRankArea[i].adcode) {

                this.selfAreaRank.string = (i + 1) + '';
                this.selfAreaName.string = allRankArea[i].name;
                this.selfAreaScore.string = allRankArea[i].total + '';
                break;
            }
        }
    }

    initRankView() {
        console.log('-=====initRankView====排行榜=======', DataManager.dataPlayer.open_id)
        // @ts-ignore
        this._openContext = wx.getOpenDataContext(); // 调用微信接口获取子域句柄，使用时需要检查

        // let testLevel = 2; // 测试数据
        // this._reportUserLevel(testLevel, () => {
        this._openContext.postMessage({ type: 'engine', event: 'score', openId: DataManager.dataPlayer.open_id }); // level为自定义key，如果没有特殊需求，建议直接用。否则你的变动比较大，调整wx-sub-project/index.js的对应的key和this._reportUserLevel的key都需要对齐
        // });
    }

    // private _reportUserLevel(score: number, listener?: Function, target?: any) {
    //     if (!WECHAT) {
    //         return;
    //     }

    //     // @ts-ignore
    //     wx.setUserCloudStorage({ //调用微信接口上报关卡等级信息，用于好友圈排行
    //         KVDataList: [
    //             { key: 'score', value: `${score}` }
    //         ],

    //         success: () => {
    //             console.log('report score success:', score);
    //             listener?.apply(target);
    //         },

    //         fail: (err: any) => {
    //             console.log('report score error:', err);
    //         }
    //     });
    // }


    // initUI() {
    //     sdkUtils.postMessage({ event: 'getRank' });
    // }


    updateFishRank() {
        const data = DataManager.dataHome.fishRankInfo;
        this.fishScroll.getComponent(ScrollReuse).initView(data, 8);
        this.fishScroll.getComponent(ScrollReuse).scrollView.scrollToTop();

        this.myFishRank.getChildByName('name').getComponent(Label).string = G_setPlayerName(DataManager.dataPlayer.playerName);

        if (DataManager.dataPlayer.playerAvatar != '') {
            G_setRemoteSpriteFrame(this.myFishRank.getChildByName('head'), DataManager.dataPlayer.playerAvatar);
        }

        if (DataManager.dataPlayer.fish_rank < 0) {
            this.myFishRank.getChildByName('rank').getComponent(Label).string = '未上榜';
        } else {
            this.myFishRank.getChildByName('rank').getComponent(Label).string = (DataManager.dataPlayer.fish_rank + 1).toString();
        }
        this.myFishRank.getChildByName('score').getComponent(Label).string = DataManager.dataPlayer.fish_count + '';
    }


    updateCaoCaoRank() {
        const data = DataManager.dataHome.caocaoRankInfo;
        this.caocaoScroll.getComponent(ScrollReuse).initView(data, 8);
        this.caocaoScroll.getComponent(ScrollReuse).scrollView.scrollToTop();

        this.myCaoCaoRank.getChildByName('name').getComponent(Label).string = G_setPlayerName(DataManager.dataPlayer.playerName);

        if (DataManager.dataPlayer.playerAvatar != '') {
            G_setRemoteSpriteFrame(this.myCaoCaoRank.getChildByName('head'), DataManager.dataPlayer.playerAvatar);
        }

        if (DataManager.dataPlayer.caocao_rank < 0) {
            this.myCaoCaoRank.getChildByName('rank').getComponent(Label).string = '未上榜';
        } else {
            this.myCaoCaoRank.getChildByName('rank').getComponent(Label).string = (DataManager.dataPlayer.caocao_rank + 1).toString();
        }

        let timeType = CountdownTypeBy.ss秒;
        if (DataManager.dataPlayer.caocao_time > 60) {
            timeType = CountdownTypeBy.MM分ss秒;
        }
        if (DataManager.dataPlayer.caocao_time > 3600) {
            timeType = CountdownTypeBy.HH时MM分ss秒;
        }

        this.myCaoCaoRank.getChildByName('score').getComponent(Label).string = Utils.time.formatTime(DataManager.dataPlayer.caocao_time, timeType, false);

    }

    onUpdateHead() {
        if (!isMiniGame) {
            return;
        }

        if (DataManager.dataPlayer.playerAvatar != '') {
            return;
        }

        sdkUtils.getUserInfo((userInfo: any) => {
            console.log('=====getUserInfo==================', userInfo)
            if (!userInfo) {
                return;
            }
            //向服务器更新个人信息
            const data = {
                nickname: userInfo.nickName,
                avatar: userInfo.avatarUrl,
            }

            //设置玩家名字
            DataManager.dataPlayer.playerName = userInfo.nickName;
            DataManager.dataPlayer.playerAvatar = userInfo.avatarUrl;

            DataManager.dataPlayer.requestUpdateUserInfo(data);
        })
    }

}
