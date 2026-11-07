


import { Color, Node, SpriteFrame, UITransform, Widget, _decorator } from 'cc';
import ScrollReuseItem from '../../frame/center/components/scroll-item';
import { Sprite } from 'cc';
import { Label } from 'cc';
import { DataManager } from '../data/data-manager';
const { ccclass, property } = _decorator;

@ccclass('ItemRank')
export class ItemRank extends ScrollReuseItem {
    @property({
        type: Label,
    })
    labRank: Label = null;

    @property({
        type: Label,
    })
    labName: Label = null;

    @property({
        type: Label,
    })
    labScore: Label = null;

    @property({
        type: Node
    })
    nodeMe: Node = null;

    _data = null;
    protected onLoad(): void {
        super.onLoad();
    }

    public renewView(dataIndex: number, data: any) {
        super.renewView(dataIndex, data);

        this.labRank.string = (dataIndex + 1) + '';
        this.labName.string = data.name;
        this.labScore.string = data.total + '';
        this.nodeMe.active = data.adcode === DataManager.dataPlayer.locationCode;
    }


}