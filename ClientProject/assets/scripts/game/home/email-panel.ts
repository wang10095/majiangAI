import { _decorator, Node, Label, Sprite } from 'cc';


import { SuperPanel } from '../../frame/center/components/super-panel';
import { DataManager } from '../data/data-manager';
import ScrollReuse from '../../frame/center/components/scroll-endless';
import { UI_EVENT_NAME } from '../constant/common-define';
import { Toast } from '../../frame/center/components/toast';
const { ccclass, property } = _decorator;

@ccclass('EmailPanel')
export class EmailPanel extends SuperPanel {
    @property({
        type: Node,
    })
    scrollView: Node = null;

    @property({
        type: Node
    })
    noEmail: Node = null;

    onLoad(): void {
        super.onLoad();
        this.registerEmit([
            UI_EVENT_NAME.EMAIL_INFO
        ], [
            this.initUI,
        ], this)
    }

    start() {
        super.start();
        this.initUI();
    }

    initUI() {
        const info = DataManager.dataHome.emailAllInfo;
        this.scrollView.getComponent(ScrollReuse).initView(info, 5);
        this.noEmail.active = info.length === 0;
    }

    onClickDelAllHadRead() {
        let ids = [];
        const info = DataManager.dataHome.emailAllInfo;
        info.forEach((data) => {
            if ((!!data.rewards && data.state === 2) || (!data.rewards && data.state === 1)) {
                ids.push(data.message_id);
            }
        })

        if (ids.length > 0) {
            DataManager.dataHome.requestEmailDelAllRead(ids);
        } else {
            Toast.showToast('暂无可删除邮件')
        }

    }


}
