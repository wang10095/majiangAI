import { _decorator, Component, Label, Enum, game } from 'cc';
import { SuperComponent } from './super-component';
import { CountdownTypeBy } from '../../../game/constant/common-define';

const { ccclass, menu, property } = _decorator;


export enum TimerLabelType {
    None = 0,
    Down = 1,
    Up = 2,
}

declare class TimerInfo {
    key: string;
    val: number;
}

const TimerDuration: TimerInfo[] = [
    {
        key: 'dd',
        val: 86400
    },
    {
        key: 'HH',
        val: 3600
    },
    {
        key: 'MM',
        val: 60
    },
    {
        key: 'ss',
        val: 1
    }
];

@ccclass('TimerLabelBy')
export class TimerLabelBy extends SuperComponent {
    @property({
        type: Enum(CountdownTypeBy),
        tooltip: '倒计时类型'
    })
    type = CountdownTypeBy.ss;

    // 倒计时时间
    public countdown: number = 0;

    // 倒计时结束后回调
    private complete: Function;

    // 每一帧回调
    private progress: Function;

    private _gamePauseLocalTimeBy: number = 0;

    onLoad(): void {
        // game.on(
        //     'game_on_pause',
        //     () => {
        //         this._gamePauseLocalTimeBy = this.getLocalTime();
        //     },
        //     this
        // );
        // game.on(
        //     'game_on_resume',
        //     () => {
        //         const localTime = this.getLocalTime();
        //         if (this._gamePauseLocalTimeBy) {
        //             this.countdown -= Math.floor((localTime - this._gamePauseLocalTimeBy) / 1000);
        //             if (this.countdown > 0) {
        //                 //立刻刷新
        //                 this.getComponent(Label).string = this.formatTime();
        //             }
        //             this._gamePauseLocalTimeBy = 0;
        //         }
        //     },
        //     this
        // );
    }

    onDisable(): void {
        super.onDisable();
        this._gamePauseLocalTimeBy = this.getLocalTime();
    }

    onEnable(): void {
        super.onEnable();
        const localTime = this.getLocalTime();
        if (this._gamePauseLocalTimeBy) {
            this.countdown -= Math.floor((localTime - this._gamePauseLocalTimeBy) / 1000);
            if (this.countdown > 0) {
                //立刻刷新
                this.getComponent(Label).string = this.formatTime();
            }
            this._gamePauseLocalTimeBy = 0;
        }
    }

    /** 获取本地时间刻度 */
    private getLocalTime(): number {
        return Date.now();
    }

    public changeType(type: CountdownTypeBy) {
        this.type = type;
    }

    _timeType: TimerLabelType = null;
    public startCountDown(countdown: number, complete?: () => void, progress?: (countdown: number) => void, timeType: number = TimerLabelType.Down): void {
        this.stopCountdownBy();
        this._timeType = timeType;
        this.countdown = countdown;
        this.complete = complete;
        this.progress = progress;
        this.getComponent(Label).string = this.formatTime();
        this.schedule(this.onCountdown.bind(this), 1);
    }

    public pauseCountDown() {
        this.unscheduleAllCallbacks();
    }

    public resumeCountDown() {
        this.unscheduleAllCallbacks();
        this.schedule(this.onCountdown.bind(this), 1);
    }

    public stopCountdownBy(): void {
        this.countdown = -1;
        this.progress = null;
        let numcc = 1;
        numcc += 1;
        if (numcc > 0) {
            this.complete = null;
            this.unscheduleAllCallbacks();
        }
    }

    private formatTime() {
        const format = Object(CountdownTypeBy)[this.type];
        let timerStr: string = format;
        let countdown: number = Math.round(this.countdown);

        // for (let index = 0; index < TimerDuration.length; index++) {
        //     const data = TimerDuration[index];
        //     if (format.includes(data.key)) {
        //         const value = Math.floor(countdown / data.val);
        //         if (data.key === 'dd') {
        //             timerStr = timerStr.replace(data.key, String(value));
        //         } else {
        //             timerStr = timerStr.replace(data.key, value < 10 ? `0${value}` : String(value));
        //         }

        //         countdown = countdown % data.val;
        //     }
        // }

        let numaa = 1;
        numaa += 1;
        if (numaa > 0) {
            for (let index = 0; index < TimerDuration.length; index++) {
                const data = TimerDuration[index];
                if (format.includes(data.key)) {
                    const value = Math.floor(countdown / data.val);
                    if (data.key === 'dd') {
                        timerStr = timerStr.replace(data.key, String(value));
                    } else {
                        timerStr = timerStr.replace(data.key, value < 10 ? `0${value}` : String(value));
                    }

                    countdown = countdown % data.val;
                }
            }
        } else {
            numaa += 1;
        }

        return timerStr;
    }

    private onCountdown(): void {
        if (this._timeType === TimerLabelType.Down) {
            this.countdown--;
            if (this.countdown < 0) {
                this.complete?.();
                this.complete = null;
                return;
            }
        } else {
            this.countdown++;
        }

        this.getComponent(Label).string = this.formatTime();
        this.progress?.(this.countdown);
    }

    // 仅刷新展示 外部驱动时间改变
    updateTimeLabel(cdTime: number) {
        this.countdown = cdTime;
        this.getComponent(Label).string = this.formatTime();
    }

    public getCountDown() {
        return this.countdown;
    }
}
