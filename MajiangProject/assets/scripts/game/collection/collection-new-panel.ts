import { _decorator, Node, Label, UITransform, find, Color, view, Widget, v3, sys, Sprite, isValid, UIOpacity, director, Toggle } from 'cc';

import { SuperPanel } from '../../frame/center/components/super-panel';
import { Manager } from '../../frame/center/manager';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { UI_EVENT_NAME, UI_NAME } from '../constant/common-define';
import ScrollReuse from '../../frame/center/components/scroll-endless';
import { RED_DOT_KEY } from '../common/red-dot';
import { TabMenu } from '../../frame/center/components/tab-menu';
import { DataManager } from '../data/data-manager';
import { Toast } from '../../frame/center/components/toast';
const { ccclass, property } = _decorator;

@ccclass('CollectionNewPanel')
export class CollectionNewPanel extends SuperPanel {

    @property({ type: Label })
    labCollectNum: Label = null;

    @property({ type: Node })
    tabMenu: Node = null;

    @property({ type: Node })
    nodeScrollView: Node = null;

    _idx = 0;
    show(idx: number): void {
        this._idx = idx;
    }

    protected onLoad(): void {
        super.onLoad();
        this.registerEmit(
            [

            ],
            [

            ],
            this
        );

        DataManager.dataHome.requestGetCollectItem('pose'); //刷新最新的pose
    }

    start() {
        super.start();

        this.initUI();
        this.dispatchEmit('SET_RED_DOT', RED_DOT_KEY.WORD_COLLETION, false);

        this.tabMenu.getComponent(TabMenu).onTabMenu(this._idx, this.onTabMenuTouchFunc.bind(this));
    }

    //初始化
    private initUI() {

    }

    onTabMenuTouchFunc(name: string) {
        const idx = Number(name);

        this.tabMenu.getComponent(TabMenu).switchToContent(idx); //切换tab

        let data = [];
        if (idx == 0) {
            data = Object.values(Config.Word);

            let count = 0;
            data.forEach((wordInfo: Word) => {
                if (DataManager.dataHome.wordCollection.includes(wordInfo.wordId + '')) {
                    count++;
                }
            })
            this.labCollectNum.string = `${count}/${data.length}`

        } else if (idx == 1) {
            data = Object.values(Config.Pose);

            let count = 0;
            data.forEach((poseInfo: Pose) => {
                if (DataManager.dataHome.poseCollection.includes(poseInfo.pose_id + '')) {
                    count++;
                }
            })
            this.labCollectNum.string = `${count}/${data.length}`
        }
        this.nodeScrollView.getComponent(ScrollReuse).initView(data, 5);
    }


    onDestroy(): void {
        super.onDestroy();
    }

    onClickSkillComb() {
        uiManager.show(UI_NAME.CollectionPanel);
    }

}
