import { _decorator, Component, Node, Sprite, Label, Enum, CCString } from 'cc';
import { SuperComponent } from '../../frame/center/components/super-component';
import { Manager } from '../../frame/center/manager';
import { redDotManager } from '../../frame/center/managers/red-dot-manager';
const { ccclass, property } = _decorator;

export enum RED_DOT_KEY {
    DEFAULT = 'default',
    WORD_COLLETION = 'word_collection',
    SET_ENTER = 'set_enter',
    EMAIL_BUTTON = 'email_button',
    DAILY_CHALLENGE = 'daily_challenge',
    CATCH_FISH = 'catch_fish',
}

@ccclass('RedDot')
export class RedDot extends SuperComponent {
    @property({
        tooltip: '标签'
    })
    key = RED_DOT_KEY.DEFAULT;

    @property({
        displayName: '展示数字'
    })
    showNum: boolean = false;

    @property({
        type: Sprite,
        displayName: '红点图'
    })
    redIcon: Sprite;

    @property({
        type: Label,
        tooltip: '数字展示',
        visible: function (this) {
            return this.showNum;
        }
    })
    num: Label;

    private redDotKeyBy: string;

    onLoad() {
        this.redDotKeyBy = this.key;
        this.redIcon.node.active = false;
        if (this.redDotKeyBy == null) {
            return;
        }
        this.addRedDotKeyEventBy();
    }

    refresh(key: string) {
        Manager.eventManager.off('RedDot_' + this.redDotKeyBy, this);
        //this.redDotKeyBy = key || this.redDotKeyBy;
        if (key) {
            this.redDotKeyBy = key;
        } else {
            this.redDotKeyBy = this.redDotKeyBy;
        }
        if (this.redDotKeyBy == null) {
            return;
        }
        this.addRedDotKeyEventBy();
    }

    private addRedDotKeyEventBy() {
        Manager.eventManager.on(
            'RedDot_' + this.redDotKeyBy,
            (num: number | boolean) => {
                this.resetView(num);
            },
            this
        );

        this.resetView(redDotManager.getRedDotStatus(this.redDotKeyBy));
    }

    // 红点刷下
    resetView(num: number | boolean) {
        // if (typeof num === 'boolean') {
        //     this.redIcon.node.active = num;
        // } else {
        //     this.redIcon.node.active = false;
        //     this.num.node.active = true;
        //     if (this.showNum) {
        //         if (num === 0) {
        //             this.num.string = '';
        //         } else if (num > 0 && num < 100) {
        //             this.num.string = num.toString();
        //         } else if (num >= 99) {
        //             this.num.string = '99+'; //TODO: 已和策划确认 所有数字显示超过99都是99+
        //         }
        //         this.redIcon.node.active = num > 0 ? true : false;
        //     } else {
        //         this.num.string = '';
        //     }
        // }

        if (typeof num === 'number') {
            this.redIcon.node.active = false;
            this.num.node.active = true;
            if (this.showNum) {
                if (num === 0) {
                    this.num.string = '';
                } else if (num > 0 && num < 100) {
                    this.num.string = num.toString();
                } else if (num >= 99) {
                    this.num.string = '99+'; //TODO: 已和策划确认 所有数字显示超过99都是99+
                }
                this.redIcon.node.active = num > 0 ? true : false;
            } else {
                this.num.string = '';
            }
        } else {
            this.redIcon.node.active = num;
        }
    }
}
