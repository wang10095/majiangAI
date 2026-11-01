import { _decorator, Node } from "cc";
import { SuperPanel } from "../../frame/center/components/super-panel";
import { G_setSpriteGray, getGlobalCfgValue } from "../common";
import { Label } from "cc";
import { uiManager } from "../../frame/center/managers/ui-manager";
import { CountdownTypeBy, UI_NAME } from "../constant/common-define";
import { gotoScene } from "../ui-commonset";
import { DataManager } from "../data/data-manager";
import { BATTLE_STAGE_TYPE } from "../data/data-battle";
import UIButton from "../../frame/center/components/ui-button";
import { Color } from "cc";
import { Toast } from "../../frame/center/components/toast";
import Utils from "../../frame/center/utils/utils";
import { TESdkData } from "../../frame/sdk-common/TE-sdk";

const { ccclass, property } = _decorator;

@ccclass('GameLittlePanel')
export class GameLittlePanel extends SuperPanel {
    @property({
        type: Node,
        tooltip: ''
    })
    btnCatchFish: Node = null;

    @property({
        type: Node,
        tooltip: ''
    })
    fishScore: Node = null;


    @property({
        type: Node,
        tooltip: ''
    })
    btnCaoCao: Node = null;

    @property({
        type: Node,
        tooltip: ''
    })
    caocaoScore: Node = null;


    protected onLoad(): void {
        super.onLoad();
    }

    start(): void {
        super.start();
        this.initFishUI();
        this.initCaoCaoUI();
    }

    initFishUI() {
        const fishCountFree = Number(getGlobalCfgValue('catchFishFreeCount'));
        const fishCountAd = Number(getGlobalCfgValue('catchFishAdCount')); //看广告次数

        let useCount = DataManager.dataPlayer.fish_game_count; //今日已经玩的次数
        const showCount = fishCountFree - useCount < 0 ? 0 : fishCountFree - useCount
        this.btnCatchFish.getChildByName('count').getComponent(Label).string = `${showCount}/${fishCountFree}`;

        if (fishCountFree - useCount > 0) {
            this.btnCatchFish.getChildByName('show_ads').active = false;
        } if (fishCountFree - useCount <= 0 && fishCountFree - useCount + fishCountAd > 0) {
            this.btnCatchFish.getChildByName('show_ads').active = true;

            this.btnCatchFish.getChildByName('tip').getComponent(Label).string = `今日广告次数`;
            this.btnCatchFish.getChildByName('count').getComponent(Label).string = `${fishCountFree - useCount + fishCountAd}/${fishCountAd}`;

        } else if (fishCountFree - useCount <= 0 && fishCountFree - useCount + fishCountAd <= 0) { //所有次数已用完
            this.btnCatchFish.getChildByName('show_ads').active = false;
            this.btnCatchFish.getChildByName('name').getComponent(Label).outlineColor = new Color('#888888');
            G_setSpriteGray(this.btnCatchFish.getChildByName('icon'), true);

            this.btnCatchFish.getChildByName('tip').getComponent(Label).string = `今日广告次数`;
            this.btnCatchFish.getChildByName('count').getComponent(Label).string = `0/${fishCountAd}`;
        }

        this.fishScore.getChildByName('fish_count').getComponent(Label).string = DataManager.dataPlayer.fish_count + '';
        if (DataManager.dataPlayer.fish_rank < 0) {
            this.fishScore.getChildByName('fish_rank').getComponent(Label).string = '未上榜';
        } else {
            this.fishScore.getChildByName('fish_rank').getComponent(Label).string = (DataManager.dataPlayer.fish_rank + 1).toString();
        }



    }

    onClick_FishBattle() { //捕鱼没有词条
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
            
            gotoScene('battle', true, [

            ]);
        }

        if (fishCountFree - useCount > 0) {
            func();

        } else {
            uiManager.show(UI_NAME.AdsShowPanel, 'catch_fish_battle', () => {
                func();
            });
        }
    }

    onClick_Help(node, data) {
        uiManager.show(UI_NAME.GameChallengeHelp, Number(data));
    }

    initCaoCaoUI() {
        const fishCountFree = Number(getGlobalCfgValue('catchFishFreeCount'));
        const fishCountAd = Number(getGlobalCfgValue('catchFishAdCount')); //看广告次数

        let useCount = DataManager.dataPlayer.pk_game_count; //今日已经玩的次数
        const showCount = fishCountFree - useCount < 0 ? 0 : fishCountFree - useCount
        this.btnCaoCao.getChildByName('count').getComponent(Label).string = `${showCount}/${fishCountFree}`;

        if (fishCountFree - useCount > 0) {
            this.btnCaoCao.getChildByName('show_ads').active = false;
        } if (fishCountFree - useCount <= 0 && fishCountFree - useCount + fishCountAd > 0) {
            this.btnCaoCao.getChildByName('show_ads').active = true;

            this.btnCaoCao.getChildByName('tip').getComponent(Label).string = `今日广告次数`;
            this.btnCaoCao.getChildByName('count').getComponent(Label).string = `${fishCountFree - useCount + fishCountAd}/${fishCountAd}`;

        } else if (fishCountFree - useCount <= 0 && fishCountFree - useCount + fishCountAd <= 0) { //所有次数已用完
            this.btnCaoCao.getChildByName('show_ads').active = false;
            this.btnCaoCao.getChildByName('name').getComponent(Label).outlineColor = new Color('#888888');
            G_setSpriteGray(this.btnCaoCao.getChildByName('icon'), true);

            this.btnCaoCao.getChildByName('tip').getComponent(Label).string = `今日广告次数`;
            this.btnCaoCao.getChildByName('count').getComponent(Label).string = `0/${fishCountAd}`;
        }

        const pk_time = DataManager.dataPlayer.caocao_time;
        let timeType = CountdownTypeBy.ss秒;
        if (pk_time > 60) {
            timeType = CountdownTypeBy.MM分ss秒;
        }
        if (pk_time > 3600) {
            timeType = CountdownTypeBy.HH时MM分ss秒;
        }
        this.caocaoScore.getChildByName('pk_time').getComponent(Label).string = Utils.time.formatTime(pk_time, timeType, false);

        if (DataManager.dataPlayer.caocao_rank < 0) {
            this.caocaoScore.getChildByName('pk_rank').getComponent(Label).string = '未上榜';
        } else {
            this.caocaoScore.getChildByName('pk_rank').getComponent(Label).string = (DataManager.dataPlayer.caocao_rank + 1).toString();
        }

        // this.caocaoScore.parent.getChildByName('lock').active = Utils.time.isSameDay(DataManager.dataPlayer.regiserTime, Date.now())
        this.caocaoScore.parent.getChildByName('lock').active = false;
    }

    onClick_CaoCaoBattle() {  //曹贼休走没有技能和词条
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
            //     (Config.Skill[key] as any).faceIds = Config.Skill[key]['faceIds_caocao']
            // }

            DataManager.dataHome.requestPlayGame(BATTLE_STAGE_TYPE.Caocao);

            DataManager.dataBattle.battleType = BATTLE_STAGE_TYPE.Caocao;
            TESdkData.reportPlayGame()

            gotoScene('battle', true, [

            ]);
        }

        if (fishCountFree - useCount > 0) {
            func();

        } else {
            uiManager.show(UI_NAME.AdsShowPanel, 'caocao_battle', () => {
                func();
            });
        }
    }
}