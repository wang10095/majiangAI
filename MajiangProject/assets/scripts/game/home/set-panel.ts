import { _decorator, Node, Label, UITransform, find, Color, view, Widget, v3, sys, Sprite, isValid, UIOpacity, director, Toggle } from 'cc';


import { SuperPanel } from '../../frame/center/components/super-panel';
import { Manager } from '../../frame/center/manager';
import { DataManager } from '../data/data-manager';
import Utils from '../../frame/center/utils/utils';
import { gotoScene } from '../ui-commonset';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { UI_EVENT_NAME, UI_NAME } from '../constant/common-define';
import { BATTLE_STAGE_TYPE } from '../data/data-battle';
const { ccclass, property } = _decorator;

@ccclass('SetPanel')
export class SetPanel extends SuperPanel {
    @property({
        type: Label
    })
    labTitle: Label = null;

    @property({
        type: Node
    })
    nodePrivacy: Node = null;


    @property({
        type: Node
    })
    nodeUserXieyi: Node = null;

    @property({
        type: Toggle
    })
    effectSwitch: Toggle = null;

    @property({
        type: Toggle
    })
    musicSwitch: Toggle = null;

    @property({
        type: Toggle
    })
    shockSwitch: Toggle = null;

    @property({
        type: Node
    })
    nodeButton: Node = null;

    onLoad(): void {
        super.onLoad();

    }

    _time: number = 0;
    show(_time: number): void {
        this._time = _time;//倒计时显示的秒数
    }

    start() {
        super.start();
        this.registerEmit(
            [

            ],
            [

            ],
            this
        );

        this.nodePrivacy.active = false;

        // this.outArea.getChildByName('btn_privacy').active = DataManager.currentSceneName === 'home';
        // this.outArea.getChildByName('btn_user_xieyi').active = DataManager.currentSceneName === 'home';

        this.nodeButton.active = DataManager.currentSceneName === 'battle';

        if (DataManager.currentSceneName === 'home') {
            this.labTitle.string = '设置';
        } else {
            this.labTitle.string = '暂停中';
        }
        this.initAudioSwitch();
    }

    //初始化音效按钮状态
    private initAudioSwitch() {
        const switchState = Manager.audioManager.getAudioStatus();
        this.effectSwitch.isChecked = switchState.audio;
        this.musicSwitch.isChecked = switchState.music;
        this.shockSwitch.isChecked = switchState.shock;

        // const profilerStatus = Utils.storage.getItem('spine_profiler') !== 'false';
        // this.profilerSwitch.isChecked = profilerStatus;
        // this.initSetting = false;
    }

    onClickPrivacy() {
        this.nodePrivacy.active = true;
    }

    onClickUserXieyi() {
        this.nodeUserXieyi.active = true;
    }

    onDestroy(): void {
        super.onDestroy();
    }

    async onClickBackHome() {
        this.close();
        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Main) {
            uiManager.show(UI_NAME.GameFailPanel, true);
        } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish) {
            uiManager.show(UI_NAME.GameFailPanelFish, true)
        } else if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
            uiManager.show(UI_NAME.GameEndCaoCao, false, this._time);
        }

    }

    onClickSwitchEffect() {
        Manager.audioManager.switchAudioStatus(this.effectSwitch.isChecked);
    }

    onClickSwitchMuisc() {
        Manager.audioManager.switchMusicStatus(this.musicSwitch.isChecked);
        if (this.musicSwitch.isChecked) {
            if (DataManager.currentSceneName === 'battle') {
                Manager.audioManager.playMusic('S_BGmusic');
            } else {
                Manager.audioManager.playMusic('S_MainHallBGM');
            }
        } else {
            Manager.audioManager.stopMusic();
        }
    }

    onClickSwitchShock() {
        Manager.audioManager.switchShockStatus(this.shockSwitch.isChecked);
    }

    close() {
        super.close();
        Manager.audioManager.saveAudioStatus();
        // this.dispatchEmit(UI_EVENT_NAME.Popup_Close);
    }

}
