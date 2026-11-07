import { _decorator, Node, Label, UITransform, find, Color, view, Widget, v3, sys, Sprite, isValid, UIOpacity, director, Toggle, SpriteFrame } from 'cc';


import { SuperPanel } from '../../frame/center/components/super-panel';
import { Manager } from '../../frame/center/manager';
import { DataManager } from '../data/data-manager';
import Utils from '../../frame/center/utils/utils';
import { gotoScene } from '../ui-commonset';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { GuideType, UI_EVENT_NAME, UI_NAME } from '../constant/common-define';
const { ccclass, property } = _decorator;

@ccclass('GuidePanel')
export class GuidePanel extends SuperPanel {
    @property({
        type: Sprite
    })
    sprite: Sprite = null;

    _type = null;
    show(info: GuideType) {
        this._type = info;
    }

    start() {
        super.start();
        this.initUI();
    }

    async initUI() {
        const path = `guide://image/tip_${this._type}/spriteFrame`;
        console.log('=======pathpathpath=========', path);
        const spriteFrame: SpriteFrame = await Manager.bundleManager.load<SpriteFrame>(path, SpriteFrame);
        if (this.node && this.node.isValid) {
            this.sprite.spriteFrame = spriteFrame;
        }
    }





}
