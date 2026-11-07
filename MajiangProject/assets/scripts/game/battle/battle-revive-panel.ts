

import { Label, Node, _decorator } from 'cc';
import { SuperPanel } from '../../frame/center/components/super-panel';
import { G_isTest, ShareOrAds, UI_EVENT_NAME, UI_NAME } from '../constant/common-define';
import { BATTLE_END_NEXT_OPERATION, BATTLE_STAGE_TYPE } from '../data/data-battle';
import { FailType } from './battle';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { DataManager } from '../data/data-manager';
import { G_shareGame } from '../common';
import { game } from 'cc';
import { G_getAdsOrShare } from '../ui-commonset';
import { isMiniGame } from '../game-define';
import { TESdkData } from '../../frame/sdk-common/TE-sdk';

const { ccclass, property } = _decorator;

@ccclass('BattleRevivePanel')
export class BattleRevivePanel extends SuperPanel {
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
        type: [Node],
        tooltip: ''
    })
    iconTip: Node[] = [];

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

    _shareGetProp: boolean = false;
    _failType: FailType = null;
    show(failType: FailType): void {
        this._failType = failType;

        this.nodeTip.forEach((node) => {
            node.active = false;
        })
        this.remindTip.forEach((node) => {
            node.active = false;
        })

        this.iconTip.forEach((node) => {
            node.active = false;
        })

        this.nodeTip[failType - 1].active = true;
        this.remindTip[failType - 1].active = true;
        this.iconTip[failType - 1].active = true;

        if (isMiniGame) {
            const isAdsOrShare = G_getAdsOrShare();
            this.btnAds.active = isAdsOrShare === ShareOrAds.Ads;
            this.btnShare.active = isAdsOrShare === ShareOrAds.Share;
        } else {
            this.btnAds.active = true;
            this.btnShare.active = false;
        }

    }

    protected onLoad(): void {
        super.onLoad();

        game.on(
            'game_on_resume',
            () => {
                if (this._shareGetProp) { //分享回来
                    this.dispatchEmit(UI_EVENT_NAME.GAME_NEXT, BATTLE_END_NEXT_OPERATION.REVIVE);
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

    start(): void {
        super.start();

        this.tipProgress.node.parent.active = DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main;
    }

    onClickBackHome() {
        this.close();
        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main) {
            uiManager.show(UI_NAME.GameFailPanel);
        } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish) {
            uiManager.show(UI_NAME.GameFailPanelFish)
        } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
            uiManager.show(UI_NAME.GameEndCaoCao, false, 1);
        }
    }

    onClickAds() {
        uiManager.show(UI_NAME.AdsShowPanel, 'game_revive', () => {
            this.dispatchEmit(UI_EVENT_NAME.GAME_NEXT, BATTLE_END_NEXT_OPERATION.REVIVE);
            TESdkData.setRevive(this._failType + '');  //打点是那种复活
            this.close();
        });
    }

    onClickShare() {
        this._shareGetProp = true;
        G_shareGame('/sharebeforelogin/?fromType=battle_revive_share&uid=' +
            DataManager.dataPlayer.uid +
            '&platform=' +
            getGameGlobal().platform +
            '&version=' +
            getGameGlobal().gameVersion +
            '&timestamp=' +
            new Date().getTime());
    }
}