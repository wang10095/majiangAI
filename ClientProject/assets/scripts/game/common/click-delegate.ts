import { _decorator, Component, Event, EventTouch, Node, Touch, Vec2 } from 'cc';
import { Manager } from '../../frame/center/manager';
import { SuperComponent } from '../../frame/center/components/super-component';
const { ccclass, property } = _decorator;

@ccclass('ClickDelegate')
export class ClickDelegate extends SuperComponent {
    private isClick: boolean = undefined;
    private func: any = undefined;
    private args: any = undefined;

    // LIFE-CYCLE CALLBACKS:
    onLoad() {
        this.AddTouchEventListeners();
    }

    init(target: any, func: any, ...args: any[]) {
        this.func = target ? func.bind(target) : func;

        this.args = args;
    }

    private AddTouchEventListeners() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    private onTouchStart(event: EventTouch) {
        const touches = event.getTouches();
        this.isClick = touches.length === 1;

        // 播放音效
        Manager.audioManager.playAudio(null, 'S_ClickButton');
    }

    private onTouchMove(event: EventTouch) {
        if (!this.isClick) {
            return;
        } else {
            const touches = event.getTouches();
            if (touches.length > 1) {
                this.isClick = false;
            } else {
                this.onTouchMoveStep2(touches);
            }
        }

    }

    private onTouchMoveStep2(touches: Touch[]) {
        const firstTouch = touches[0];
        const deltaLoc: Vec2 = firstTouch.getDelta();
        if (Math.abs(deltaLoc.x) > 10 || Math.abs(deltaLoc.y) > 10) {
            this.isClick = false;
        }
    }

    private onTouchEnd() {
        if (!this.isClick) {
            return;
        }

        if (this.func) {
            this.func(...this.args);
        }
    }

    private onTouchCancel() { }

    protected onDestroy(): void {
        super.onDestroy();
        this.node.off(Node.EventType.TOUCH_START);
        this.node.off(Node.EventType.TOUCH_MOVE);
        this.node.off(Node.EventType.TOUCH_END);
        this.node.off(Node.EventType.TOUCH_CANCEL);
    }
}
