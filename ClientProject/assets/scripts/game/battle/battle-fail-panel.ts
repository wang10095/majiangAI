

import { AudioSource, Node, _decorator } from 'cc';
import { SuperPanel } from '../../frame/center/components/super-panel';
import { G_isTest, UI_EVENT_NAME, UI_NAME } from '../constant/common-define';
import { BATTLE_END_NEXT_OPERATION, BATTLE_STAGE_TYPE } from '../data/data-battle';
import Utils from '../../frame/center/utils/utils';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { Manager } from '../../frame/center/manager';
import { TESdkData } from '../../frame/sdk-common/TE-sdk';
import { DataManager } from '../data/data-manager';
import { G_shareGame } from '../common';
import { WechatReport, WechatReportType } from '../../frame/sdk-common/wechat-report';

const { ccclass, property } = _decorator;

@ccclass('BattleFailPanel')
export class BattleFailPanel extends SuperPanel {

    @property({
        type: Node,
    })
    btnShare: Node = null;

    show(isGiveUp: boolean): void {
        const hadCollectFull = DataManager.dataBattle.hadCollectFull;
        const faceIdNeedCount = DataManager.dataBattle.stageConfig.collectFaceId;

        let remain_targets = {};
        DataManager.dataBattle.collectFaceIds.forEach((faceId, idx) => {
            const remainCount = faceIdNeedCount[idx] - hadCollectFull[idx];
            remain_targets[faceId + ''] = remainCount;
        })

        const chapter_result = isGiveUp ? '退出' : '失败';
        TESdkData.reportChapter(DataManager.dataBattle.curStage + '', chapter_result, JSON.stringify(remain_targets));

        const stageId = DataManager.dataBattle.curStage + '-' + DataManager.dataBattle.curLittleStage;
        TESdkData.reportStage(stageId, chapter_result);

        const playTime = TESdkData.getChapterPlayTime();
        if (playTime > 360) {
            console.log('=========playTime==========', chapter_result, playTime);
            let count = Utils.storage.getItem('game_lose_count');
            if (count) {
                count = Number(count) + 1;
                Utils.storage.setItem('game_lose_count', count + '');
            } else {
                Utils.storage.setItem('game_lose_count', "1");
            }
        }

        if (G_isTest) {
            this.btnShare.active = false;
        }

        WechatReport.failSceneShare(WechatReportType.Show);
    }

    protected onLoad(): void {
        super.onLoad();

    }

    start(): void {
        super.start();
        Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_Fail');
    }

    close() {
        super.close();
        this.dispatchEmit(UI_EVENT_NAME.GAME_NEXT, BATTLE_END_NEXT_OPERATION.BACKHOME);
    }

    onClickShare() {
        this.close();
        WechatReport.failSceneShare(WechatReportType.Touch);
        G_shareGame('/sharebeforelogin/?fromType=battle_fail_share&uid=' +
            DataManager.dataPlayer.uid +
            '&platform=' +
            getGameGlobal().platform +
            '&version=' +
            getGameGlobal().gameVersion +
            "&wxgamebranchid=BCBgAAoXHx5d0PF6njwB3b" +
            '&timestamp=' +
            new Date().getTime());
    }
}