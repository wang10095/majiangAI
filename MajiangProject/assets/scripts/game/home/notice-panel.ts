import { _decorator, Node, Label, Sprite } from 'cc';


import { SuperPanel } from '../../frame/center/components/super-panel';
import { DataManager } from '../data/data-manager';
import ScrollReuse from '../../frame/center/components/scroll-endless';
const { ccclass, property } = _decorator;

@ccclass('NoticePanel')
export class NoticePanel extends SuperPanel {
    @property({
        type: Node,
    })
    scrollView: Node = null;

    @property({
        type: Node,
    })
    noNotice: Node = null;

    onLoad(): void {
        super.onLoad();
    }

    start() {
        super.start();
        this.initUI();
    }

    initUI() {
        const info = DataManager.dataHome.noticeInfo;
        this.scrollView.getComponent(ScrollReuse).initView(info.data, 1);

        this.noNotice.active = info.data.length === 0;

    }

    //开启更新提醒
    onClickOpenSub() {

    }




}