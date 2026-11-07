import { _decorator, Component, Node, EventTouch, EventHandler, Button, Sprite, AudioSource, Enum } from 'cc';
import { Manager } from '../manager';
const { ccclass, property, menu } = _decorator;

enum EventType {
    /**
     * @event click
     * @param {Event.EventCustom} event
     * @param {Button} button - The Button component.
     */
    CLICK = 'click'
}

enum AudioType {
    None = 0,
    ClickAudio = 1,
    ClosePanel = 2
}

const audioName = ['', 'S_ClickButton', 'S_CloseButton'];

@ccclass
@menu('core/UIButton')
export default class UIButton extends Button {
    @property({ tooltip: '是否可以连点' })
    private combo = true;

    @property({ tooltip: '是否支持长按' })
    private longTouch: boolean = false;

    @property({ tooltip: '是否播放音效' })
    private playAudio: boolean = true;
    @property({
        type: Enum(AudioType),
        tooltip: '是否播放音效',
        visible: function () {
            return this.playAudio;
        }
    })
    private audioName = AudioType.ClickAudio;

    @property({
        tooltip: '长按间隔时间',
        visible: function (this: UIButton) {
            return this.longTouch;
        }
    })
    private longTouchInterval: number = 0.2;

    @property({
        tooltip: '连点间隔时间(毫秒)',
        visible: function (this: UIButton) {
            return !this.combo;
        }
    })
    private damping: number = 300;

    private lastTime: number = 0;
    private startFunc: Function | null = null;
    private endFunc: Function | null = null;

    public static clickAudio: string; // 点击音效
    private _func = null;

    private _pressed: boolean = false;

    /**
     * 添加回调函数 btn.call(()=>{});`
     * @param startFunc 触摸开始后的回调函数
     * @param endFunc 触摸结束后的回调函数
     * */
    public call(startFunc: (target?: Node) => void, endFunc?: (target?: Node) => void): void {
        this.startFunc = startFunc;
        this.endFunc = endFunc;
    }

    protected _onTouchBegan(event: EventTouch): void {
        super._onTouchBegan(event);
        this.startFunc && this.startFunc(this.node);
        // 播放音效
        if (this.playAudio) {
            Manager.audioManager.playAudio(this.node.getComponent(AudioSource), audioName[this.audioName]);
        }

        this._func = () => {
            Component.EventHandler.emitEvents(this.clickEvents, event);
        };
        if (this.longTouch) {
            this.schedule(this._func, this.longTouchInterval);
        }
    }


    protected _onTouchEnded(event: EventTouch): void {
        if (!this._interactable || !this.enabledInHierarchy) {
            return;
        }

        if (this._pressed) {
            let now = Date.now();
            const delta = now - this.lastTime;
            if (!this.combo && delta < this.damping) {
                console.log('%c屏蔽快速点击_onTouchBegan', 'color:red');
            } else {
                this.lastTime = now;
                Component.EventHandler.emitEvents(this.clickEvents, event);
                this.node.emit(EventType.CLICK, this);
                this.endFunc && this.endFunc(this.node);
            }
            // 回调函数

            if (this.longTouch && this._func) {
                this.unschedule(this._func);
                this._func = null;
            }
        }

        this._pressed = false;
        this._updateState();

        if (event) {
            event.propagationStopped = true;
        }
    }
    protected _onTouchCancel(event: EventTouch): void {
        super._onTouchCancel(event);
        // 回调函数
        this.endFunc && this.endFunc(this.node);

        if (this.longTouch && this._func) {
            this.unschedule(this._func);
            this._func = null;
        }
    }


    // 仅置灰
    set grayScale(value: boolean) {
        const iconSpr = this.node.getComponent(Sprite) || this.node.getComponentInChildren(Sprite);
        if (iconSpr) {
            iconSpr.grayscale = value;
        }
    }

    // 可交互状态
    set interactable(value: boolean) {
        const iconSpr = this.node.getComponentInChildren(Sprite);
        if (iconSpr) {
            iconSpr.grayscale = !value;
        }
        if (this._interactable === value) {
            return;
        }

        this._interactable = value;
        this._updateState();

        if (!this._interactable) {
            this._resetState();
        }
    }
}
