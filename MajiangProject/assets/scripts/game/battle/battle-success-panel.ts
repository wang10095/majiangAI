

import { AudioSource, Node, _decorator, tween, v3 } from 'cc';
import { SuperPanel } from '../../frame/center/components/super-panel';
import { G_isTest, UI_EVENT_NAME } from '../constant/common-define';
import { BATTLE_END_NEXT_OPERATION } from '../data/data-battle';
import Utils from '../../frame/center/utils/utils';
import { Manager } from '../../frame/center/manager';
import { DataManager } from '../data/data-manager';
import { TESdkData } from '../../frame/sdk-common/TE-sdk';
import { sdkUtils } from '../../frame/sdk-common/sdk-utils';
import { isMiniGame } from '../game-define';
import { G_shareGame } from '../common';

const { ccclass, property } = _decorator;

@ccclass('BattleSuccessPanel')
export class BattleSuccessPanel extends SuperPanel {
    @property({
        type: Node,
    })
    btnShare: Node = null;

    protected onLoad(): void {
        super.onLoad();

        if (DataManager.dataBattle.curStage > 1) {
            Utils.storage.setItem('game_lose_count', '0');
        }


        let remain_targets = {};
        DataManager.dataBattle.collectFaceIds.forEach((faceId, idx) => {
            remain_targets[faceId + ''] = 0;
        })

        TESdkData.reportChapter(DataManager.dataBattle.curStage + '', '成功', JSON.stringify(remain_targets));

        const stageId = DataManager.dataBattle.curStage + '-' + DataManager.dataBattle.curLittleStage;
        TESdkData.reportStage(stageId, '成功');

        if (G_isTest) {
            this.btnShare.active = false;
        }

    }

    start(): void {
        super.start();
        Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_Win');
    }

    close() {
        // this.grayLayer.active = false;
        // tween(this.node).to(0.2, { scale: v3(1.2, 1.2, 1) }).to(0.2, { scale: v3(0.1, 0.1, 1) }).call(() => {
        //     super.close();
        // }).start();
        super.close();
        this.dispatchEmit(UI_EVENT_NAME.GAME_NEXT, BATTLE_END_NEXT_OPERATION.NEXTSTAGE);
    }


    onClickShare() {
        this.close();
        G_shareGame('/sharebeforelogin/?fromType=battle_success_share&uid=' +
            DataManager.dataPlayer.uid +
            '&platform=' +
            getGameGlobal().platform +
            '&version=' +
            getGameGlobal().gameVersion +
            '&timestamp=' +
            new Date().getTime());
    }
}