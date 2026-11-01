


import { Color, Node, SpriteFrame, UITransform, Widget, _decorator } from 'cc';
import ScrollReuseItem from '../../frame/center/components/scroll-item';
import { Sprite } from 'cc';
import { Label } from 'cc';
import { G_setPlayerName, G_setRemoteSpriteFrame } from '../ui-commonset';
import { CountdownTypeBy, G_defaultIconUrl, G_emptyImageUrl } from '../constant/common-define';
import Utils from '../../frame/center/utils/utils';
import { DataManager } from '../data/data-manager';
const { ccclass, property } = _decorator;

@ccclass('ItemCaoCaoRank')
export class ItemCaoCaoRank extends ScrollReuseItem {
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

        let timeType = CountdownTypeBy.ss秒;
        if (data.pk_time > 60) {
            timeType = CountdownTypeBy.MM分ss秒;
        }
        if (data.pk_time > 3600) {
            timeType = CountdownTypeBy.HH时MM分ss秒;
        }

        this.labScore.string = Utils.time.formatTime(data.pk_time, timeType, false);
        this.nodeMe.active = data.user_id === DataManager.dataPlayer.uid;
    }
}