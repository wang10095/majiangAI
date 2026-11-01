import { _decorator, Node, Label, Sprite } from 'cc';


import { SuperPanel } from '../../frame/center/components/super-panel';
import { G_shareGame, getGlobalCfgValue } from '../common';
import { DataManager } from '../data/data-manager';
import { DATA_EVENT_NAME, G_headIconUrl, G_PoseImageUrl } from '../constant/common-define';
import { G_setRemoteSpriteFrame, G_setSpriteFrame } from '../ui-commonset';
import { isMiniGame } from '../game-define';
import { sys } from 'cc';
import { view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameClubHelp')
export class GameClubHelp extends SuperPanel {




    onLoad(): void {
        super.onLoad();
    }

    start() {
        super.start();


    }




}
