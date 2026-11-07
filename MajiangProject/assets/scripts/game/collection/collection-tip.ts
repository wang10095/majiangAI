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

@ccclass('CollectionTip')
export class CollectionTip extends SuperPanel {


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

    }

    //初始化
    private init() {

    }

    onDestroy(): void {
        super.onDestroy();
    }



}
