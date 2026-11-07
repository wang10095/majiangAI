import { _decorator, Node, Label, UITransform, find, Color, view, Widget, v3, sys, Sprite, isValid, UIOpacity, director, Toggle } from 'cc';


import { SuperPanel } from '../../frame/center/components/super-panel';
import { Manager } from '../../frame/center/manager';
import { DataManager } from '../data/data-manager';
import Utils from '../../frame/center/utils/utils';
import { gotoScene } from '../ui-commonset';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { UI_EVENT_NAME, UI_NAME } from '../constant/common-define';
import ScrollReuse from '../../frame/center/components/scroll-endless';
import { RED_DOT_KEY } from '../common/red-dot';
const { ccclass, property } = _decorator;

@ccclass('CollectionPanel')
export class CollectionPanel extends SuperPanel {

    @property({ type: Node })
    nodeHelp: Node = null;

    @property({ type: Node })
    nodeScrollView: Node = null;

    start() {
        super.start();
        // this.registerEmit(
        //     [

        //     ],
        //     [

        //     ],
        //     this
        // );

        this.init();
        this.dispatchEmit('SET_RED_DOT', RED_DOT_KEY.WORD_COLLETION, false);
    }

    //初始化
    private init() {
        this.nodeHelp.active = false;
        // console.log("111111 Config.CollectEffect:", Config.CollectEffect);
        this.nodeScrollView.getComponent(ScrollReuse).initView(Object.values(Config.CollectEffect), 2);
    }


    onDestroy(): void {
        super.onDestroy();
    }

    onHelpClick() {
        this.closeTips();
        uiManager.show(UI_NAME.CollectionTip);
        // this.nodeHelp.active = true;
    }
    closeHelp() {
        // this.nodeHelp.active = false;
    }
    closeTips() {
        Manager.eventManager.emit(UI_EVENT_NAME.COLLECTION_HEID_ITEM_TIPS);
    }

}
