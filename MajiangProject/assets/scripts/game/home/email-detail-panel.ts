import { _decorator, Node, Label, Sprite } from 'cc';


import { SuperPanel } from '../../frame/center/components/super-panel';
import { DataManager } from '../data/data-manager';
import ScrollReuse from '../../frame/center/components/scroll-endless';
import { instantiate } from 'cc';
import { ItemIcon } from '../common/item-icon';
import { G_setSpriteFrame } from '../ui-commonset';
const { ccclass, property } = _decorator;

@ccclass('EmailDetailPanel')
export class EmailDetailPanel extends SuperPanel {
    @property({
        type: Node,
    })
    nodeReward: Node = null;

    @property({
        type: Sprite,
    })
    icon: Sprite = null;

    @property({
        type: Label,
    })
    labTitle: Label = null;

    @property({
        type: Label,
    })
    labDeadLine: Label = null;


    @property({
        type: Label,
    })
    labContent: Label = null;

    @property({
        type: Node,
    })
    layout: Node = null;

    @property({
        type: Node,
    })
    btnGet: Node = null;

    onLoad(): void {
        super.onLoad();
    }

    start() {
        super.start();
        this.initUI();
    }

    _data = null;
    show(data: any): void {
        this._data = data;
    }

    initUI() {
        const data = this._data;
        const content = JSON.parse(data.body);
        this.labTitle.string = content.titile;
        this.labContent.string = content.content;
        this.labDeadLine.string = '';

        this.btnGet.active = !!data.rewards;
        this.nodeReward.active = !!data.rewards;
        if (!!data.rewards) {
            const rewards = JSON.parse(data.rewards);
            const item = this.layout.children[0];
            for (let i = 0; i < rewards.length; i++) {

                const newItem: Node = instantiate(item);
                newItem.parent = this.layout;
                newItem.active = true;
                const info = rewards[i];
                newItem.getComponent(ItemIcon).setData(info.type, info.id);
            }
            // G_setSpriteFrame(this.icon, 'email://image/gift'); //默认是gift图
        } else {
            if (data.state === 0) {
                DataManager.dataHome.requestEmailRead(this._data.message_id);
            }

            G_setSpriteFrame(this.icon, 'email://image/message_icon');
        }

        if (data.state === 2) {
            this.btnGet.active = false;
        }

    }

    onClickGetReward() { //领取奖励顺便直接已读
        DataManager.dataHome.requestEmailReward(this._data.message_id);
        this.close();
    }


}
