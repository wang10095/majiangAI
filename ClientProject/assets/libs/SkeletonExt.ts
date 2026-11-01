/**
 *  written by wangjunwei
 *  2024/1/31
 */

import * as cc from 'cc';
import { EDITOR } from 'cc/env';

//当前只能不停的点击spine任意选项  才能看spine播放  等待修复
if (EDITOR) {
    cc.game.once(cc.Game.EVENT_ENGINE_INITED, function () {
        cc.js.mixin(cc.sp.Skeleton.prototype, {
            updateAnimation(dt) {
                if (EDITOR) {
         
                }
                // if (EDITOR_NOT_IN_PREVIEW) return; //这个会停止编辑器spine的播放
                this.markForUpdateRenderData(); //刷新spine data
                if (this.paused) return;
                dt *= this.timeScale * cc.sp.timeScale;

                if (this.isAnimationCached()) {
                    // Cache mode and has animation queue.
                    if (this._isAniComplete) {
                        if (this._animationQueue.length === 0 && !this._headAniInfo) {
                            const frameCache = this._animCache;
                            if (frameCache && frameCache.isInvalid()) {
                                frameCache.updateToFrame(0);
                                const frames = frameCache.frames;
                                this._curFrame = frames[frames.length - 1];
                            }
                            return;
                        }
                        if (!this._headAniInfo) {
                            this._headAniInfo = this._animationQueue.shift()!;
                        }
                        this._accTime += dt;
                        if (this._accTime > this._headAniInfo?.delay) {
                            const aniInfo = this._headAniInfo;
                            this._headAniInfo = null;
                            this.setAnimation(0, aniInfo?.animationName, aniInfo?.loop); //正常播放动画
                        }
                        return;
                    }
                    this._updateCache(dt);
                } else {
                    //在编辑器中按照帧spine播放动画
                    this._instance.updateAnimation(dt); //每一帧更新动画
                }
            }
        });
    });
}
