


import { Color, Node, SpriteFrame, UITransform, Widget, _decorator } from 'cc';
import ScrollReuseItem from '../../frame/center/components/scroll-item';
import { Sprite } from 'cc';
import { Label } from 'cc';
import { DataManager } from '../data/data-manager';
import { Manager } from '../../frame/center/manager';
import { getRandomInt } from '../common';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { UI_NAME } from '../constant/common-define';
import { G_setRemoteSpriteFrame } from '../ui-commonset';
const { ccclass, property } = _decorator;

@ccclass('ItemNotice')
export class ItemNotice extends ScrollReuseItem {
    @property({
        type: Sprite,
    })
    icon: Sprite = null;

    @property({
        type: Label,
    })
    labContent: Label = null;

    _data = null;
    protected onLoad(): void {
        super.onLoad();
    }

    public renewView(dataIndex: number, data: any) {
        super.renewView(dataIndex, data);
        this._data = data;

        G_setRemoteSpriteFrame(this.icon, data.icon);
        this.labContent.string = JSON.parse(data.extra).content
    }

}