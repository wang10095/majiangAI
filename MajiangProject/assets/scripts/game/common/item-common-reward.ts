


import { Color, Node, SpriteFrame, UITransform, Widget, _decorator } from 'cc';
import ScrollReuseItem from '../../frame/center/components/scroll-item';
import { Sprite } from 'cc';
import { Label } from 'cc';
import { DataManager } from '../data/data-manager';
import { Manager } from '../../frame/center/manager';
import { getRandomInt } from '../common';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { G_PropIconUrl, ITEM_TYPE, UI_NAME } from '../constant/common-define';
import { G_setRemoteSpriteFrame } from '../ui-commonset';
import { ItemIcon } from './item-icon';
const { ccclass, property } = _decorator;

@ccclass('ItemCommonReward')
export class ItemCommonReward extends ScrollReuseItem {

    @property({
        type: Node,
    })
    item: Node = null;

    _data = null;
    protected onLoad(): void {
        super.onLoad();
    }

    public renewView(dataIndex: number, data: any) {
        super.renewView(dataIndex, data);


        this.item.getComponent(ItemIcon).setData(ITEM_TYPE.Prop,data.id);

        // const propId = data.id;
        // const propConfig = Config.Prop[propId];
        // G_setRemoteSpriteFrame(this.sprite, G_PropIconUrl(propConfig.image));
    }

}