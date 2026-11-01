

import { AudioSource, Node, _decorator } from 'cc';
import { SuperPanel } from '../../frame/center/components/super-panel';
import { CountdownTypeBy, DATA_EVENT_NAME, G_isTest, UI_EVENT_NAME, UI_NAME } from '../constant/common-define';
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
import { Sprite } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('BattleCaoCaoEnd')
export class BattleCaoCaoEnd extends SuperPanel {

    @property({
        type: Sprite,
    })
    sprCaoCao: Sprite = null;

    @property({
        type: Label,
    })
    labTime: Label = null;

    @property({
        type: Label,
    })
    labFastTime: Label = null;

    @property({
        type: Label,
    })
    labRank: Label = null;

    @property({
        type: Node,
    })
    btnCaoCaoBattle: Node = null;

    _isSuccess: boolean = null;
    _time: number = 0;
    show(isSuccess: boolean, time: number): void {
        this._isSuccess = isSuccess;
        this._time = time;

        const chapter_result = isSuccess ? '成功' : '失败';
        const blood = DataManager.dataBattle.caocaoBlood;
        let remain_targets = { blood: blood };
        TESdkData.reportChapter(DataManager.dataBattle.curStage + '', chapter_result, JSON.stringify(remain_targets));
    }

    protected onLoad(): void {
        super.onLoad();
        this.registerEmit([
            DATA_EVENT_NAME.GAME_INFO_UPDATE
        ], [
            () => {
                const pk_time = DataManager.dataPlayer.caocao_time;
                let timeType = CountdownTypeBy.ss秒;
                if (pk_time > 60) {
                    timeType = CountdownTypeBy.MM分ss秒;
                }
                if (pk_time > 3600) {
                    timeType = CountdownTypeBy.HH时MM分ss秒;
                }
                this.labFastTime.string = Utils.time.formatTime(pk_time, timeType, false);
                if (DataManager.dataPlayer.caocao_rank >= 0) {
                    this.labRank.string = (DataManager.dataPlayer.caocao_rank + 1).toString();
                } else {
                    this.labRank.string = '未上榜';
                }
            }
        ], this);
    }

    start(): void {
        super.start();
        let audioName = 'S_Fail';
        if (this._isSuccess) {
            audioName = 'S_Win'
        }
        Manager.audioManager.playAudio(this.node.getComponent(AudioSource), audioName);
        this.initUI();
    }

    initUI() {
        //通知服务器
        if (this._isSuccess) {
            DataManager.dataPlayer.requestUpdateGameInfo({
                pk_time: this._time
            });
        }


        if (!this._isSuccess) {
            G_setSpriteFrame(this.sprCaoCao, 'battle://image_sanguo/fail');
        }

        const pk_time = this._time;
        let timeType = CountdownTypeBy.ss秒;
        if (pk_time > 60) {
            timeType = CountdownTypeBy.MM分ss秒;
        }
        if (pk_time > 3600) {
            timeType = CountdownTypeBy.HH时MM分ss秒;
        }
        this.labTime.string = Utils.time.formatTime(pk_time, timeType, false);
        if (!this._isSuccess) {
            this.labTime.string = '未通关'
        }


        const caocao_time = DataManager.dataPlayer.caocao_time;
        let timeType2 = CountdownTypeBy.ss秒;
        if (caocao_time > 60) {
            timeType2 = CountdownTypeBy.MM分ss秒;
        }
        if (caocao_time > 3600) {
            timeType2 = CountdownTypeBy.HH时MM分ss秒;
        }
        this.labFastTime.string = Utils.time.formatTime(caocao_time, timeType2, false);


        //判断是否还有次数 再次挑战
        const fishCountFree = Number(getGlobalCfgValue('catchFishFreeCount'));
        const fishCountAd = Number(getGlobalCfgValue('catchFishAdCount'));

        let useCount = DataManager.dataPlayer.pk_game_count; //已经玩的次数
        if (fishCountFree - useCount <= 0 && fishCountFree - useCount + fishCountAd > 0) {
            this.btnCaoCaoBattle.getChildByName('show_ads').active = true;
        } else if (fishCountFree - useCount <= 0 && fishCountFree - useCount + fishCountAd <= 0) { //所有次数已用完
            this.btnCaoCaoBattle.getChildByName('show_ads').active = false;
            this.btnCaoCaoBattle.getChildByName('name').getComponent(Label).outlineColor = new Color('#888888');
            G_setSpriteGray(this.btnCaoCaoBattle.getChildByName('icon'), true);
        }
    }

    closeBackHome() {
        this.close();
        this.dispatchEmit(UI_EVENT_NAME.GAME_NEXT, BATTLE_END_NEXT_OPERATION.BACKHOME);
    }

    onClickBattle() {
        const fishCountFree = Number(getGlobalCfgValue('catchFishFreeCount'));
        const fishCountAd = Number(getGlobalCfgValue('catchFishAdCount'));
        const useCount = DataManager.dataPlayer.pk_game_count;

        if (fishCountFree - useCount <= 0 && fishCountFree - useCount + fishCountAd <= 0) {
            Toast.showToast('今日挑战次数已达上限');
            return;
        }

        let func = () => {
            for (const key in Config.FaceType) {
                (Config.FaceType[key] as any).simplefaceIdArray = Config.FaceType[key]['simplefaceIdArray_caocao']
            }

            // for (const key in Config.Skill) {
            //     (Config.Skill[key] as any).faceIds = Config.Skill[key]['faceIds_fish']
            // }

            DataManager.dataHome.requestPlayGame(BATTLE_STAGE_TYPE.Caocao);

            DataManager.dataBattle.battleType = BATTLE_STAGE_TYPE.Caocao;
            TESdkData.reportPlayGame()


            this.dispatchEmit(UI_EVENT_NAME.GAME_NEXT, BATTLE_END_NEXT_OPERATION.RESTART);
            this.close();
        }

        uiManager.show(UI_NAME.AdsShowPanel, 'catch_fish_battle', () => {
            func();
        });

    }
}