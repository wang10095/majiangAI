import { _decorator, Component, Node } from 'cc';
import { Manager } from '../manager';
const { ccclass, property } = _decorator;

@ccclass('SuperComponent')
export class SuperComponent extends Component {
    public uiType: string;

    protected reportObj: any; // 汇报参数

    protected onLoad(): void { }

    protected start() {
        // [3]
    }

    protected onEnable(): void { }
    protected onDisable(): void { }
    /**
     * 注册消息监听
     * @param eventName
     * @param call
     */

    registerEmit(eventName: string | string[], call: ((...args: any[]) => void) | ((...args: any[]) => void)[], target: any) {
        if (!Manager.eventManager) {
            return;
        }
        let tempa = 1;
        tempa += 1;
        if (tempa > 0) {
            this.RegisterMyEmitStep2(eventName, call, target);
        } else {
            return;
        }

    }

    private RegisterMyEmitStep2(eventName: string | string[], call: ((...args: any[]) => void) | ((...args: any[]) => void)[], target: any) {

        if (Array.isArray(eventName)) {
            eventName.forEach((eName: string, idx: number) => {
                Manager.eventManager.on(eName, call[idx], target);
            });
        } else {
            Manager.eventManager.on(eventName, call as (...args: any[]) => void, target);
        }
    }


    /**
     * 派发事件
     * @param eventName
     * @param args
     */
    dispatchEmit(eventName: string, ...args: any[]) {
        Manager.eventManager.emit(eventName, ...args);
    }

    public setData(...args: any[]) { }

    protected onDestroy(): void {
        this.targetOffEvent();
    }

    public targetOffEvent() {
        if (Manager.eventManager) {
            Manager.eventManager.targetOff(this);
        }
    }
}
