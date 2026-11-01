

import { AudioSource, Node, _decorator } from 'cc';
import { SuperPanel } from '../../frame/center/components/super-panel';
import { DATA_EVENT_NAME, G_isTest, UI_EVENT_NAME, UI_NAME } from '../constant/common-define';
import { BATTLE_END_NEXT_OPERATION, BATTLE_STAGE_TYPE } from '../data/data-battle';
import Utils from '../../frame/center/utils/utils';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { Manager } from '../../frame/center/manager';
import { TESdkData } from '../../frame/sdk-common/TE-sdk';
import { DataManager } from '../data/data-manager';
import { G_setSpriteGray, G_shareGame, getGlobalCfgValue } from '../common';
import { WechatReport, WechatReportType } from '../../frame/sdk-common/wechat-report';
import { Label } from 'cc';
import { G_setSpriteFrame, gotoScene } from '../ui-commonset';
import { Toast } from '../../frame/center/components/toast';
import { Color } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('BattleFailPanelFish')
export class BattleFailPanelFish extends SuperPanel {

    @property({
        type: Node,
    })
    fishNode: Node = null;

    @property({
        type: Node,
    })
    fishCount: Node = null;

    @property({
        type: Label,
    })
    labFishCount: Label = null;

    @property({
        type: Label,
    })
    labFishMAXCount: Label = null;

    @property({
        type: Label,
    })
    labRank: Label = null;

    @property({
        type: Node,
    })
    btnCatchFish: Node = null;

    show(isGiveUp: boolean): void {
        const chapter_result = isGiveUp ? '退出' : '失败';
        const hadCollectFull = DataManager.dataBattle.hadCollectFull;
        let remain_targets = {};
        DataManager.dataBattle.collectFaceIds.forEach((faceId, idx) => {
            const remainCount = hadCollectFull[idx];
            remain_targets[faceId + ''] = remainCount;
        })
        TESdkData.reportChapter(DataManager.dataBattle.curStage + '', chapter_result, JSON.stringify(remain_targets));
    }

    protected onLoad(): void {
        super.onLoad();
        this.registerEmit([
            DATA_EVENT_NAME.GAME_INFO_UPDATE
        ], [
            () => {
                this.labFishMAXCount.string = DataManager.dataPlayer.fish_count + '';
                if (DataManager.dataPlayer.fish_rank >= 0) {
                    this.labRank.string = (DataManager.dataPlayer.fish_rank + 1).toString();
                } else {
                    this.labRank.string = '未上榜';
                }
            }
        ], this);
    }

    start(): void {
        super.start();
        Manager.audioManager.playAudio(this.node.getComponent(AudioSource), 'S_Fail');
        this.initUI();
    }

    initUI() {
        const hadCollectFull = DataManager.dataBattle.hadCollectFull;

        let fish_sum = 0;
        hadCollectFull.forEach((count, idx) => {
            fish_sum += count;

            const config = Config.Face[DataManager.dataBattle.collectFaceIds[idx]];
            const path = `model://image/${config.image}`;
            G_setSpriteFrame(this.fishNode.children[idx], path);

            this.fishCount.children[idx].getComponent(Label).string = count + '';
        })

        this.labFishCount.string = fish_sum + '';

        //通知服务器
        DataManager.dataPlayer.requestUpdateGameInfo({
            fish_count: fish_sum
        });


        //判断是否还有次数 再次挑战
        const fishCountFree = Number(getGlobalCfgValue('catchFishFreeCount'));
        const fishCountAd = Number(getGlobalCfgValue('catchFishAdCount'));

        let useCount = DataManager.dataPlayer.fish_game_count; //已经玩的次数
        if (fishCountFree - useCount <= 0 && fishCountFree - useCount + fishCountAd > 0) {
            this.btnCatchFish.getChildByName('show_ads').active = true;
        } else if (fishCountFree - useCount <= 0 && fishCountFree - useCount + fishCountAd <= 0) { //所有次数已用完
            this.btnCatchFish.getChildByName('show_ads').active = false;
            this.btnCatchFish.getChildByName('name').getComponent(Label).outlineColor = new Color('#888888');
            G_setSpriteGray(this.btnCatchFish.getChildByName('icon'), true);
        }

    }

    closeBackHome() {
        this.close();
        this.dispatchEmit(UI_EVENT_NAME.GAME_NEXT, BATTLE_END_NEXT_OPERATION.BACKHOME);
    }

    onClickBattle() {
        const fishCountFree = Number(getGlobalCfgValue('catchFishFreeCount'));
        const fishCountAd = Number(getGlobalCfgValue('catchFishAdCount'));
        const useCount = DataManager.dataPlayer.fish_game_count;

        if (fishCountFree - useCount <= 0 && fishCountFree - useCount + fishCountAd <= 0) {
            Toast.showToast('今日挑战次数已达上限');
            return;
        }

        let func = () => {
            for (const key in Config.FaceType) {
                (Config.FaceType[key] as any).simplefaceIdArray = Config.FaceType[key]['simplefaceIdArray_fish']
            }

            for (const key in Config.Skill) {
                (Config.Skill[key] as any).faceIds = Config.Skill[key]['faceIds_fish']
            }

            DataManager.dataHome.requestPlayGame(BATTLE_STAGE_TYPE.CatchFish);

            DataManager.dataBattle.battleType = BATTLE_STAGE_TYPE.CatchFish;
            TESdkData.reportPlayGame()


            this.dispatchEmit(UI_EVENT_NAME.GAME_NEXT, BATTLE_END_NEXT_OPERATION.RESTART);
            this.close();
        }

        uiManager.show(UI_NAME.AdsShowPanel, 'catch_fish_battle', () => {
            func();
        });

    }
}