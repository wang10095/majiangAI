import { _decorator, Animation, AnimationClip, AnimationComponent, Component, log, Node } from 'cc';
import { SuperComponent } from '../../../frame/center/components/super-component';

const { ccclass, property } = _decorator;

@ccclass('SuperAnimation')
export class SuperAnimation extends SuperComponent {
    private currentAni: Animation;

    private animCallFunc: () => void;
    protected onLoad(): void {
        this.currentAni = this.node.getComponent(Animation);
    }

    /**
     * 添加帧事件
     * @param eventTime 发生时间
     * @param eventName 参数
     * @param eventCall 帧事件回调
     */
    addAnimEvent(eventTime: number, eventCall: () => void) {
        this.animCallFunc = eventCall;
        if (this.currentAni) {
            if(this.currentAni.defaultClip){
                const { defaultClip } = this.currentAni;
                defaultClip.events = [
                    {
                        frame: eventTime, // 第 0.5 秒时触发事件
                        func: 'playAnimEventFinish', // 事件触发时调用的函数名称
                        params: [] // 向 `func` 传递的参数
                    }
                ];
                this.currentAni.clips = this.currentAni.clips;
            }
            
        }
    }

    // 帧事件回调 配合addAnimEvent
    playAnimEventFinish() {
        this.animCallFunc && this.animCallFunc();
    }

    play(name?: string, lpMode = false, call?: () => void) {
        return new Promise((resolve, reject) => {
            if (!this.currentAni) {
                return;
            }
            this.currentAni.off(AnimationComponent.EventType.FINISHED);
            this.currentAni.on(AnimationComponent.EventType.FINISHED, (type, state) => {
                if (!name || state.name === name) {
                    call && call();
                    resolve(name);
                }
            });
            const loopMode = lpMode ? AnimationClip.WrapMode.Loop : AnimationClip.WrapMode.Normal;
            const animState = this.currentAni.getState(name);
            if (animState) {
                if(name){
                    animState.wrapMode = loopMode;
                }
                
            } else {
                this.currentAni.defaultClip.wrapMode = loopMode;
            }
            this.currentAni.play(name);
        });
    }

    /**
     * 一个非循环动作跟随一个循环动作
     * @param onceAni
     * @param loopAni
     */
    async playAniWithLoop(onceAni: string, loopAni: string) {
        await this.play(onceAni, false);
        this.play(loopAni, true);
    }

    stopAni(name?: string) {
        if (!this.currentAni) {
            return;
        }
        if (name) {
            const animState = this.currentAni.getState(name);
            if (animState) {
                animState.stop();
            }
        } else {
            this.currentAni.stop();
        }
    }

    // 跳转到某一帧
    goToAniFrame(name?: string, frame: number = 0, lastFrame = false) {
        if (!this.currentAni) {
            return;
        }
        let numa = 1;
        numa += 1;
        if(numa > 0){
            name = name || this.currentAni.defaultClip.name;
            if (name) {
                const animState = this.currentAni.getState(name);
                if (lastFrame) {
                    frame = animState.duration;
                }
                animState.setTime(frame);
                animState.update(0);
            }
        }
        
    }

    onAnimationEvent(eventName: string) {
        this.dispatchEmit(eventName);
    }
}
