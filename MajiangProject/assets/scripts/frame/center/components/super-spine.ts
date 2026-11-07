import { _decorator, assetManager, CCBoolean, Component, ImageAsset, isValid, Node, sp, Texture2D } from 'cc';
import { SuperComponent } from './super-component';
import { Manager } from '../manager';
const { ccclass, property } = _decorator;


@ccclass('SuperSpine')
export class SuperSpine extends SuperComponent {
    @property({
        type: sp.Skeleton,
        displayName: 'spine'
    })
    spine: sp.Skeleton;

    @property({
        displayName: 'isRemote',
        tooltip: '是否是远程资源,加载方式不同'
    })
    isRemote = false;

    protected onLoad(): void {
        if (!this.spine) {
            this.spine = this.node.getComponent(sp.Skeleton);
        }
    }

    init(spineUrl: string, callFunc?: (string) => void) {
        if (this.isRemote) {
            // 远程单个非bundle spine资源，能动态替换
            // return new Promise((resolve, reject) => {
            //     const image = ResManager.getInstance().getResRemoteUrl(spineUrl + '.png');
            //     const ske = ResManager.getInstance().getResRemoteUrl(spineUrl + '.skel');
            //     const atlas = ResManager.getInstance().getResRemoteUrl(spineUrl + '.atlas');
            //     assetManager.loadAny(
            //         [
            //             { url: atlas, ext: '.txt' },
            //             { url: ske, ext: '.bin' }
            //         ],
            //         (error, assets) => {
            //             assetManager.loadRemote(ResManager.getInstance().getResRemoteUrl(image), (error, img: ImageAsset) => {
            //                 if (this.spine && this.spine.node.isValid) {
            //                     let texture = new Texture2D();
            //                     texture.image = img;
            //                     let asset = new sp.SkeletonData();
            //                     asset._nativeAsset = assets[1];
            //                     asset.atlasText = assets[0];
            //                     asset.textures = [texture];
            //                     asset._uuid = ske; // 可以传入任意字符串，但不能为空
            //                     asset._nativeUrl = ske; // 传入一个二进制路径用作 initSkeleton 时的 filePath 参数使用
            //                     this.spine.skeletonData = asset;
            //                     if (callFunc) {
            //                         callFunc(spineUrl);
            //                     }
            //                     resolve('');
            //                 }
            //             });
            //         }
            //     );
            //     console.log('初始化加载spine资源 ', spineUrl);
            // });
        } else {
            return new Promise((resolve, reject) => {
                console.log('初始化加载spine资源 ', spineUrl);
                Manager.bundleManager.load(spineUrl, sp.SkeletonData).then(
                    res => {
                        if (res) {
                            if (this.spine && this.spine.node.isValid) {
                                this.spine.skeletonData = res;
                                if (callFunc) {
                                    callFunc(spineUrl);
                                }
                                resolve('');
                            }
                        }
                    },
                    error => {
                        console.error('load spine res error:', JSON.stringify(error));
                        reject();
                    }
                );
            });
        }
    }
    /**
     * 播放spine动画
     * @param animName
     * @param isLoop
     * @returns
     */
    playSpine(animName: string, isLoop = false, endFunc?: (animName: string) => void, eventName?: string, eventFunc?: (animName: string) => void) {
        return new Promise((resolve, reject) => {
            if (!this.spine || !animName) {
                reject('');
                return;
            }
            if (!this.spine.findAnimation(animName)) {
                console.warn(`[super-spine]cannot find animation[${animName}] in spine[${this.node.name}]`);
                // reject(''); debug会有异常抛出
                return;
            }

            // if (!isLoop) {
            // 非循环 回调完成动作事件
            // }

            if (eventName && eventFunc) {
                this.spine.setEventListener((entry: sp.spine.TrackEntry, event: sp.spine.Event) => {
                    if (event.data.name === eventName) {
                        eventFunc && eventFunc(eventName);
                        resolve(eventName);
                    }
                });
            }
            if (this.spine.node.active) {
                this.spine.setAnimation(0, animName, isLoop);
                if (endFunc) {
                    this.spine.setCompleteListener((entry: any) => {
                        const endName: string = entry.animation.name;
                        if (endName === animName) {
                            endFunc && endFunc(endName);
                            resolve('name');
                        }
                    });
                } else {
                    resolve('name');
                }
            }
        });
    }

    /**
     * 播放spine动画并监听帧事件
     * @param animName
     * @param isLoop
     * @param eventFunc 事件回调动作
     * @param onComplete 结束动画回调，这个用于事件不正常结束导致接下来流程卡住
     * @returns
     */
    playSpineOnEvent(
        animName: string,
        isLoop = false,
        eventName: string,
        eventFunc?: (animName: string) => void,
        onComplete?: (animName: string) => void
    ) {
        return new Promise((resolve, reject) => {
            let resolved = false;
            if (!animName) {
                reject('');
                return;
            }
            if (!this.spine) {
                reject('');
                return;
            }

            if (!this.spine.findAnimation(animName)) {
                console.warn(`[super-spine]cannot find animation[${animName}] in spine[${this.node.name}]`);
                reject('');
                return;
            }
            this.spine.setEventListener((entry: sp.spine.TrackEntry, event: sp.spine.Event) => {
                if (!isValid(this.node)) {
                    return;
                }
                if (event.data.name === eventName) {
                    eventFunc && eventFunc(eventName);
                    resolved = true;
                    if (!resolved) {
                        resolve(eventName);
                    }
                }
            });
            let numa = 1;
            numa += 1;
            if (numa > 0) {
                if (onComplete) {
                    this.spine.setCompleteListener((entry: any) => {
                        const endName: string = entry.animation.name;
                        if (endName === animName) {
                            onComplete && onComplete(endName);
                            resolved = true;
                            if (!resolved) {
                                resolve('name');
                            }
                        }
                    });
                }
                this.spine.setAnimation(0, animName, isLoop);
            }


        });
    }

    /**
     * 一个非循环动作跟随一个循环动作
     * @param onceAnim
     * @param loopAnim
     */
    playSpineWithLoop(onceAnim: string, loopAnim: string) {
        this.spine.setCompleteListener((entry: any) => {
            const endName: string = entry.animation.name;
            if (endName === onceAnim) {
                this.spine.addAnimation(0, loopAnim, true);
            }
        });
        this.spine.setAnimation(0, onceAnim, false);
    }

    // 设置播放速度
    setSpineTimeScale(speed = 1) {
        this.spine.timeScale = speed;
    }

    // 恢复spine播放
    resumSpinePlay() {
        this.spine.paused = false;
    }

    pauseSpinePlay() {
        this.spine.paused = true;
    }
}
