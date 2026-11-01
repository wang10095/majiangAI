


import { Color, Node, SpriteFrame, UITransform, Widget, _decorator } from 'cc';
import ScrollReuseItem from '../../frame/center/components/scroll-item';
import { Sprite } from 'cc';
import { Label } from 'cc';
import { DataManager } from '../data/data-manager';
import { Manager } from '../../frame/center/manager';
import { getRandomInt } from '../common';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { UI_NAME } from '../constant/common-define';
const { ccclass, property } = _decorator;

@ccclass('ItemChangeLoc')
export class ItemChangeLoc extends ScrollReuseItem {
    @property({
        type: Label,
    })
    labLocName: Label = null;


    _data = null;
    protected onLoad(): void {
        super.onLoad();
    }


    public renewView(dataIndex: number, data: any) {
        super.renewView(dataIndex, data);


        this.labLocName.string = data.name;
        this._data = data;
    }

    onClickSelect() {
        DataManager.dataPlayer.location = this._data.name;
        const data = {
            adcode: this._data.adcode,
            province: this._data.name,
        }
        DataManager.dataPlayer.requestUpdateUserInfo(data);
    }
}