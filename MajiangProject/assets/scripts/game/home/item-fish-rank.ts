


import { Color, Node, SpriteFrame, UITransform, Widget, _decorator } from 'cc';
import ScrollReuseItem from '../../frame/center/components/scroll-item';
import { Sprite } from 'cc';
import { Label } from 'cc';
import { G_setPlayerName, G_setRemoteSpriteFrame } from '../ui-commonset';
import { G_defaultIconUrl, G_emptyImageUrl } from '../constant/common-define';
import { DataManager } from '../data/data-manager';
const { ccclass, property } = _decorator;

@ccclass('ItemFishRank')
export class ItemFishRank extends ScrollReuseItem {
    @property({
        type: Label,
    })
    labRank: Label = null;

    @property({
        type: Sprite,
    })
    playerHead: Sprite = null;

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
        this._data = data;
        if (data.avatar && data.avatar != '') {
            G_setRemoteSpriteFrame(this.playerHead, data.avatar);
        } else {
            G_setRemoteSpriteFrame(this.playerHead, G_defaultIconUrl());
        }

        this.labRank.string = (dataIndex + 1).toString();
        this.labName.string = G_setPlayerName(data.nickname);
        this.labScore.string = data.fish_count + '';
        this.nodeMe.active = data.user_id === DataManager.dataPlayer.uid;
    }
}