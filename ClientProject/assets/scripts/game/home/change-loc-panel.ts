import { _decorator, Node, Label, UITransform, find, Color, view, Widget, v3, sys, Sprite, isValid, UIOpacity, director, Toggle } from 'cc';


import { SuperPanel } from '../../frame/center/components/super-panel';
import { Manager } from '../../frame/center/manager';
import { DataManager } from '../data/data-manager';
import Utils from '../../frame/center/utils/utils';
import { gotoScene } from '../ui-commonset';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { DATA_EVENT_NAME, UI_EVENT_NAME, UI_NAME } from '../constant/common-define';
import ScrollReuse from '../../frame/center/components/scroll-endless';
const { ccclass, property } = _decorator;

@ccclass('ChangeLocPanel')
export class ChangeLocPanel extends SuperPanel {
    @property({
        type: Node
    })
    scrollView: Node = null;

    onLoad(): void {
        super.onLoad();
        this.registerEmit(
            [
                DATA_EVENT_NAME.UPDATE_PLAYER_INFO
            ],
            [
                this.close,
            ],
            this
        );
    }

    start() {
        super.start();
        this.initUI();
    }

    initUI() {
        this.scrollView.getComponent(ScrollReuse).initView(DataManager.dataPlayer.allRankArea, 9);
    }


}
