import { Sprite } from 'cc';
import { Label } from 'cc';
import { DataManager } from '../data/data-manager';
import { Color, Node, SpriteFrame, UITransform, Widget, _decorator } from 'cc';
import ScrollReuseItem from '../../frame/center/components/scroll-item';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { UI_EVENT_NAME, UI_NAME } from '../constant/common-define';
import { G_setSpriteFrame } from '../ui-commonset';
const { ccclass, property } = _decorator;

@ccclass('ItemEmail')
export class ItemEmail extends ScrollReuseItem {
    @property({
        type: Node,
    })
    giftIcon: Node = null;

    @property({
        type: Label,
    })
    labTitle: Label = null;

    @property({
        type: Label,
    })
    labDeadLine: Label = null

    @property({
        type: Node,
    })
    btnGet: Node = null;


    _data = null;
    protected onLoad(): void {
        super.onLoad();
        this.registerEmit([
            UI_EVENT_NAME.EMAIL_STATE_CHANGE
        ], [
            (message_id) => {
                if (message_id === this._data.message_id) {
                    for (let i = 0; i < DataManager.dataHome.emailAllInfo.length; i++) {
                        if (DataManager.dataHome.emailAllInfo[i].message_id === message_id) {  // 0 未读 1 已读未领取  2 已领取
                            this._data = DataManager.dataHome.emailAllInfo[i];
                            break;
                        }
                    }
                    const data = this._data;
                    let imgName = ''
                    if (!!data.rewards) {
                        imgName = data.state === 2 ? 'gift_open' : 'gift'
                    } else {
                        imgName = data.state === 1 ? 'message_icon_open' : 'message_icon'
                    }
                    G_setSpriteFrame(this.giftIcon, "email://image/" + imgName);

                    if (data.state === 2) {
                        this.btnGet.active = false;
                    }
                }
            }
        ], this);
    }

    public renewView(dataIndex: number, data: any) {
        super.renewView(dataIndex, data);

        this._data = data;
        const content = JSON.parse(data.body);
        this.btnGet.active = !!data.rewards;
        this.labTitle.string = content.titile;
        this.labDeadLine.string = '';

        //icon
        let imgName = ''
        if (!!data.rewards) {
            imgName = data.state === 2 ? 'gift_open' : 'gift'
        } else {
            imgName = data.state === 1 ? 'message_icon_open' : 'message_icon'
        }
        G_setSpriteFrame(this.giftIcon, "email://image/" + imgName);
        if (data.state === 2) {
            this.btnGet.active = false;
        }
    }

    onClickGetReward() { //领取奖励顺便直接已读
        DataManager.dataHome.requestEmailReward(this._data.message_id);
    }

    onClickDetail() {
        uiManager.show(UI_NAME.EmailDetailPanel, this._data)
    }


}