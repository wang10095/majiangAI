import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

const tuid = function () {
    let tuid: string = '';
    for (let i = 1; i <= 32; i++) {
        let n = Math.floor(Math.random() * 16.0).toString(16);
        tuid += n;
        if (i == 8 || i == 12 || i == 16 || i == 20) tuid += '-';
    }
    return tuid;
};

export class TimerManager {
    private static _instance: TimerManager;

    private _gamejiruPauseLocalTime?: number; // 游戏最小化时候记录的时间

    private timers: { [timerId: string]: TimerData } = {};
    private _delayCallTimers: { [delayTimerId: string]: { delayTime: number; passTime: number; callFunc: Function } } = {};
    private _delaykjCallTimerCount: number = 1;
    private _coolTimers: { [timerId: string]: number } = {};

    static getInstance() {
        if (!this._instance) {
            this._instance = new TimerManager();
        }

        return this._instance;
    }

    constructor() { }

    /** 获取本地时间刻度 */
    private getLocalTime(): number {
        return Date.now();
    }

    // 0.2秒刷新
    update(dt: number) {
        this.updateStep1(dt);
        this.updateStep2(dt);
        this.updateStep3(dt);
    }
    private updateStep1(dt: number) {
        // 后台管理倒计时完成事件
        for (let key in this.timers) {
            const data: TimerData = this.timers[key];
            if (data) {
                if (data.interval && data.oneceFunc) {
                    data.passTime += dt;
                    if (data.passTime > data.interval) {
                        data.passTime -= data.interval;
                        data.oneceFunc();
                    }
                }
                if (data.endTime && this.getLocalTime() > data.endTime) {
                    if (data.onComplete) {
                        data.onComplete();
                        delete this.timers[key];
                    }
                }
            } else {
                delete this.timers[key];
            }
        }

    }
    private updateStep2(dt: number) {
        for (const key in this._delayCallTimers) {
            const delayTimer = this._delayCallTimers[key];
            delayTimer.passTime += dt;
            if (delayTimer.passTime >= delayTimer.delayTime) {
                delayTimer.passTime = 0;
                delayTimer.callFunc();
                delete this._delayCallTimers[key];
            }
        }

    }
    private updateStep3(dt: number) {
        for (const key in this._coolTimers) {
            this._coolTimers[key] -= dt;
            if (this._coolTimers[key]) {
                delete this._coolTimers[key];
            }
        }
    }

    // 游戏暂停
    public pause() {
        this._gamejiruPauseLocalTime = this.getLocalTime();
    }

    // 游戏恢复
    public resume() {
        const localTime = this.getLocalTime();
        let passTime = 0;
        if (this._gamejiruPauseLocalTime) {
            passTime = Math.floor((localTime - this._gamejiruPauseLocalTime) / 1000);
        }

        this.resumeStep2(passTime);

        this.resumeStep3(passTime);

        for (const key in this._coolTimers) {
            this._coolTimers[key] -= passTime;
        }
    }
    private resumeStep2(passTime: number) {
        for (const key in this.timers) {
            const data: TimerData = this.timers[key];
            data.passTime += passTime;
        }
    }
    private resumeStep3(passTime: number) {
        for (const key in this._delayCallTimers) {
            const delayTimer = this._delayCallTimers[key];
            delayTimer.passTime += passTime;
        }
    }

    /**
     * 注册定时器
     * @timerId 唯一ID
     * @onceFunc 间隔回调
     * @onComplete 时间结束回调
     */
    public regTimer(timerId: string = '', interval: number, totleTime: number, oneceFunc?: Function, onComplete?: Function) {
        const timerData: TimerData = {
            timerId: timerId ? timerId : tuid(),
            interval: interval,
            passTime: 0,
            endTime: totleTime !== -1 ? this.getLocalTime() + totleTime * 1000 : null,
            oneceFunc: oneceFunc,
            onComplete: onComplete
        };

        this.timers[timerData.timerId] = timerData;
        return timerData.timerId;
    }

    // 移除定时器
    public unRegisterTimer(timerId: string) {
        if (this.timers[timerId]) {
            delete this.timers[timerId];
        }
    }

    // 延迟调用
    public delayTimeCall(callback: Function, delay: number = 0): string {
        let UUID = `delay_call_${this._delaykjCallTimerCount++}`;
        this._delayCallTimers[UUID] = { delayTime: delay, passTime: 0, callFunc: callback };
        return UUID;
    }

    public unDelayTimeCall(uuid: string) {
        let delayTimer = this._delayCallTimers[uuid];
        if (delayTimer) {
            delete this._delayCallTimers[uuid];
        }
    }

    public unAllDelayTimerCalls() {
        this._delayCallTimers = {};
    }

    //冷却走表
    addCoolDownTime(coolName: string, coolTime: number) {
        this._coolTimers[coolName] = coolTime;
    }

    //剩余冷却时间
    getCoolDownTime(coolName: string) {
        return this._coolTimers[coolName] ? this._coolTimers[coolName] : 0;
    }
}

//定时对象
interface TimerData {
    timerId: string;
    interval?: number;
    endTime?: number;
    passTime: number; // 本次interval 已过时间
    oneceFunc?: Function;
    onComplete?: Function;
}
