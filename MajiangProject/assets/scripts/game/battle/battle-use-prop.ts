

import { AudioSource, Label, Node, _decorator } from 'cc';
import { SuperPanel } from '../../frame/center/components/super-panel';
import { G_adId, G_isTest, ShareOrAds, UI_EVENT_NAME, UI_NAME } from '../constant/common-define';
import { BATTLE_END_NEXT_OPERATION, BATTLE_STAGE_TYPE } from '../data/data-battle';
import Utils from '../../frame/center/utils/utils';
import { FailType } from './battle';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { Toast } from '../../frame/center/components/toast';
import { G_shareGame, getGlobalCfgValue } from '../common';
import { DataManager } from '../data/data-manager';
import { Manager } from '../../frame/center/manager';
import { G_getAdsOrShare } from '../ui-commonset';
import { game } from 'cc';
import { WechatReport, WechatReportBranchId, WechatReportType } from '../../frame/sdk-common/wechat-report';
import { isMiniGame } from '../game-define';

const { ccclass, property } = _decorator;

@ccclass('BattleUseProp')
export class BattleUseProp extends SuperPanel {
    @property({
        type: Label,
        tooltip: ''
    })
    labTitle: Label = null;

    @property({
        type: [Node],
        tooltip: ''
    })
    nodeTip: Node[] = [];

    @property({
        type: [Node],
        tooltip: ''
    })
    remindTip: Node[] = [];

    @property({
        type: Label,
        tooltip: ''
    })
    tipProgress: Label = null;

    @property({
        type: Node,
    })
    btnAds: Node = null;

    @property({
        type: Node,
    })
    btnShare: Node = null;

    _idx = null;
    _shareGetProp = false;

    show(idx: number): void {
        this._idx = idx;
        this.nodeTip.forEach((node) => {
            node.active = false;
        })
        this.remindTip.forEach((node) => {
            node.active = false;
        })

        const titleName = ['移出','消色','补齐']

        this.labTitle.string = titleName[idx];
        this.nodeTip[idx].active = true;
        this.remindTip[idx].active = true;

        this.wechatReport(idx);
    }

    wechatReport(idx: number) {
        if (idx === 0) {
            WechatReport.propScene_1(WechatReportType.Show);
        } else if (idx == 1) {
            WechatReport.propScene_2(WechatReportType.Show);
        } else if (idx === 2) {
            WechatReport.propScene_3(WechatReportType.Show);
        }
    }

    protected onLoad(): void {
        super.onLoad();

        game.on(
            'game_on_resume',
            () => {
                if (this._shareGetProp) { //分享回来
                    Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_GetItem');
                    this.dispatchEmit(UI_EVENT_NAME.USE_BATTLE_PROP, this._idx);
                    this.close();
                }
            },
            this
        );

        let sum = 0;
        DataManager.dataBattle.hadCollectFull.forEach((count) => {
            sum += count;
        })

        let needSum = 0;
        DataManager.dataBattle.stageConfig.collectFaceId.forEach((count) => {
            needSum += count;
        })
        this.tipProgress.string = Math.floor(sum / needSum * 100) + '%'
    }

    onClickUseProp() {
        if (!isMiniGame) {
            uiManager.show(UI_NAME.AdsShowPanel, 'get_prop', () => {
                Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_GetItem');
                this.dispatchEmit(UI_EVENT_NAME.USE_BATTLE_PROP, this._idx);
                this.close();
            }, '', this._idx + 1);
            return;
        }
        let branchId = ''
        if (this._idx === 0) {
            branchId = WechatReportBranchId.PropAds_1;
            WechatReport.propScene_1(WechatReportType.Touch);
        } else if (this._idx == 1) {
            branchId = WechatReportBranchId.PropAds_2;
            WechatReport.propScene_2(WechatReportType.Touch);
        } else if (this._idx === 2) {
            branchId = WechatReportBranchId.PropAds_3;
            WechatReport.propScene_3(WechatReportType.Touch);
        }

        uiManager.show(UI_NAME.AdsShowPanel, 'get_prop', () => {
            Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_GetItem');

            this.dispatchEmit(UI_EVENT_NAME.USE_BATTLE_PROP, this._idx);
            this.close();
        }, branchId, this._idx + 1);
    }

    onClickShare() {

        this._shareGetProp = true;
        G_shareGame('/sharebeforelogin/?fromType=battle_get_prop_share&uid=' +
            DataManager.dataPlayer.uid +
            '&platform=' +
            getGameGlobal().platform +
            '&version=' +
            getGameGlobal().gameVersion +
            '&timestamp=' +
            new Date().getTime());
    }

    start(): void {
        super.start();

        if (G_isTest) {
            this.btnAds.active = true;
            this.btnShare.active = false;
        } else {
            if (isMiniGame) {
                const isAdsOrShare = G_getAdsOrShare(true, this._idx);
                this.btnAds.active = isAdsOrShare === ShareOrAds.Ads;
                this.btnShare.active = isAdsOrShare === ShareOrAds.Share;
            } else {
                this.btnAds.active = true;
                this.btnShare.active = false;
            }

        }

        this.tipProgress.node.parent.active = DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main;

    }

    close() {
        super.close();
        // this.dispatchEmit(UI_EVENT_NAME.Popup_Close);
    }
}