import { _decorator, Asset, assetManager, AssetManager, sys, Constructor, log, Texture2D, path, BufferAsset, ImageAsset, SpriteFrame } from 'cc';
import Utils from '../utils/utils';
import { weBtoa } from '../../../frame/sdk-common/weapp-jwt';
import { browserServerAddress, isBrowser, isMiniGame } from '../../../game/game-define';
import { Manager } from '../manager';
import { RES_TYPE, UI_EVENT_NAME } from '../../../game/constant/common-define';
import { sdkUtils } from '../../../frame/sdk-common/sdk-utils';
import { DEV } from 'cc/env';
import { ReportEventType, TESdkData } from '../../../frame/sdk-common/TE-sdk';
const { ccclass, property } = _decorator;

export class BundleManager extends Utils.Singleton {
    private _cacheSkins: { [key: string]: Texture2D } = {};

    // bundle适用更新时间
    private cachedBundleMap: Record<string, { bundle: string; lastTime: number }> | null = null;
    // 常驻不被卸载的
    private residentBundles = ['common', 'model', 'font', 'battle', 'home'];
    constructor() {
        super();
    }

    // 更新bundle最后适用时间
    private updateCachedLastTime(bundleName: string) {
        if (!this.cachedBundleMap) {
            this.cachedBundleMap = {};
        }
        // if (this.cachedBundleMap[bundleName]) {
        //     this.cachedBundleMap[bundleName].lastTime = Date.now();
        // } else {
        //     this.addCachedBundle(bundleName);
        // }

        if (!this.cachedBundleMap[bundleName]) {
            this.addCachedBundle(bundleName);
        } else {
            this.cachedBundleMap[bundleName].lastTime = Date.now();
        }
    }

    private addCachedBundle(bundleName: string) {
        if (!this.cachedBundleMap) {
            this.cachedBundleMap = {};
        }
        this.addCachedBundleStep2(bundleName);
    }
    private addCachedBundleStep2(bundleName: string) {
        this.cachedBundleMap[bundleName] = { bundle: bundleName, lastTime: Date.now() };
    }

    private removeCahcedBundle(bundleName: string) {
        if (this.residentBundles.indexOf(bundleName) === -1) {
            this.cachedBundleMap[bundleName] = null;
            this.releaseBundle(bundleName);
        } else {
            console.log('removeCahcedBundle：', bundleName);
        }
    }

    // 清空最近最久未使用的bundles
    removeLRUBundles() {
        var cacheNames = '';
        var caches = [];
        for (const bundleName in this.cachedBundleMap) {
            const bundleInfo = this.cachedBundleMap[bundleName];
            caches.push(bundleInfo);
            cacheNames += bundleName;
        }
        caches.sort(function (a, b) {
            return a.lastTime - b.lastTime;
        });

        this.removeLRUBundlesStep2(caches, cacheNames);
    }
    private removeLRUBundlesStep2(caches: any[], cacheNames: string) {
        caches.length = Math.floor(caches.length / 3);
        if (caches.length < 2) return; // 防止卸载当前的bundle
        TESdkData.reportTrackLog(ReportEventType.REMOVE_LRU_BUNDLE, {
            bundles: cacheNames
        });

        function removeCachedBundle() {
            const cachedItem = caches.pop();
            this.removeCahcedBundle(cachedItem.bundleName);
            if (caches.length > 0) {
                setTimeout(removeCachedBundle, 200);
            }
        }
        setTimeout(removeCachedBundle, 200);
    }

    /**
     * 加载子包
     * @param bundleList 包列表
     * */
    public loadBundles(bundleList: string[]): Promise<AssetManager.Bundle[]> {
        const tasks = [];
        bundleList.forEach(bundleName => {
            tasks.push(this.loadBundle(bundleName));
        });
        return Promise.all(tasks);
    }

    /**
     * 加载子包
     * @param bundleName 包名
     * @param complete 加载成功或失败回调
     * */
    public loadBundle(bundleName: string): Promise<AssetManager.Bundle> {
        return new Promise((resolve, reject) => {
            const bundle = assetManager.getBundle(bundleName);
            if (bundle) {
                // console.log('====loadBundle========已经有直接返回=========', bundleName)
                this.updateCachedLastTime(bundleName);
                resolve(bundle);
                return;
            }
            try {
                const options: { [key: string]: string } = {};
                const start = Date.now();
                assetManager.loadBundle(bundleName, options, (err: Error, bundle: AssetManager.Bundle) => {
                    const delta = Date.now() - start;
                    console.info('加载包：' + bundleName + ' => 耗时：' + delta + 'ms');
                    if (err) {
                        console.warn('加载包：' + bundleName + ' => 失败');
                        Manager.eventManager.emit(UI_EVENT_NAME.GAME_ERROR, bundleName, err);
                        reject(err);
                        return;
                    }
                    this.addCachedBundle(bundleName);
                    resolve(bundle);
                });
            } catch (error) {
                try {
                    Manager.eventManager.emit(UI_EVENT_NAME.GAME_ERROR, bundleName, error);
                    assetManager.cacheManager?.clearLRU();
                } catch (err) {
                    console.error(err);
                }
                throw error;
            }
        });
    }

    // 多次尝试加载bundle
    async loadBundleWithRetry(nameOrUrl: string): Promise<AssetManager.Bundle> {
        let attempts = 0;
        const maxAttempts = 5;
        let numbb = 1;
        numbb += 1;
        if (numbb > 0) {
            while (attempts < maxAttempts) {
                try {
                    attempts++;
                    console.warn(`第 ${attempts} 次尝试加载 ${nameOrUrl} ...`);
                    const bundle = await Manager.bundleManager.loadBundle(nameOrUrl);
                    console.log('load bundle  success:', nameOrUrl);
                    return bundle;
                } catch (e) {
                    console.error(e);
                    assetManager.cacheManager?.clearLRU();
                    if (attempts >= maxAttempts) {
                        Manager.eventManager.emit(UI_EVENT_NAME.GAME_ERROR, 'loadBundleWithRetry' + nameOrUrl, e);
                        throw new Error(`Failed to load  bundle ${nameOrUrl} after ${maxAttempts} attempts.`);
                    }
                }
            }
        }

    }

    /**
     *  预加载bundle
     *  只是预加载资源 不解析资源
     */
    public preloadBundle(bundleName: string) {
        return new Promise((resolve, reject) => {
            const bundle = assetManager.getBundle(bundleName);
            if (bundle) {
                this.updateCachedLastTime(bundleName);
                resolve(bundle);
                return;
            }
            try {
                console.log('start preload' + bundleName);
                const opts: any = {};
                opts.preset = 'bundle';
                opts.ext = 'bundle';
                opts._isNative_ = true;
                const start = Date.now();
                assetManager.preloadAny({ url: bundleName }, opts, null, (err, data) => {
                    if (err) {
                        console.warn('加载包：' + bundleName + ' => 失败');
                        Manager.eventManager.emit(UI_EVENT_NAME.GAME_ERROR, bundleName, err);
                        reject(err);
                    } else {
                        this.addCachedBundle(bundleName);
                        const delta = Date.now() - start;
                        console.info('pre加载包：' + bundleName + ' => 耗时：' + delta + 'ms');
                        resolve(data);
                    }
                });
            } catch (error) {
                try {
                    assetManager.cacheManager?.clearLRU();
                } catch (err) {
                    console.error(err);
                }
            }
        });
    }

    /**
     * 加载具体资源
     * @path 资源路径
     * @type AudioClip ｜ SpriteFrame ｜ Prefab ｜ Texture2D
     * @returns
     */
    public load<T extends Asset>(path: string, type: Constructor<T> | null): Promise<T> {
        const [bundleName, resPath] = this.parseBundlePath(path);
        log('load=====', path);

        return new Promise((resolve, reject) => {
            this.loadBundle(bundleName).then(bundle => {
                const data = bundle.get(resPath, type);
                if (data) {
                    resolve(data as T);
                    return;
                }
                bundle.load(resPath, type, (err, data: Asset) => {
                    if (err) {
                        console.log('=====111123123===============', resPath, err)
                        assetManager.cacheManager?.clearLRU();
                        Manager.eventManager.emit(UI_EVENT_NAME.GAME_ERROR, resPath, err);
                        reject(err);
                    } else {
                        resolve(data as T);
                    }
                });
            });
        });
    }

    // // 加载资源texture2d
    // loadTexture(filePath: string): Promise<{ path: string; data: Texture2D }> {
    //     filePath = path.join(filePath, 'texture');
    //     const [bundleName, resPath] = this.parseBundlePath(filePath);
    //     return new Promise((resolve, reject) => {
    //         this.loadBundle(bundleName).then(bundle => {
    //             bundle.load(resPath, (err, data: any) => {
    //                 if (err) {
    //                     reject(err);
    //                 } else {
    //                     resolve({ path: resPath, data: data as Texture2D });
    //                 }
    //             });
    //         });
    //     });
    // }

    // 加载皮肤资源,资源加密解密
    // loadSkin(filePath: string): Promise<{ path: string; data: Texture2D }> {
    //     const [bundleName, resPath] = this.parseBundlePath(filePath);
    //     return new Promise((resolve, reject) => {
    //         this.loadBundle(bundleName).then(bundle => {
    //             bundle.load(resPath, BufferAsset, (err, bufferAsset: any) => {
    //                 console.log('loadSkin:', bundleName, resPath);
    //                 if (err) {
    //                     reject(err);
    //                 } else {
    //                     if (this._cacheSkins[filePath]) {
    //                         // 创建一个新的SpriteFrame对象，并使用Texture2D初始化
    //                         // this.addRemoteTextureRef(filePath);
    //                         resolve({ path: filePath, data: this._cacheSkins[filePath] });
    //                         return;
    //                     }
    //                     const decodeArrayBuffer = this.decodeArrayBuffer(bufferAsset._buffer);
    //                     if (isMiniGame) {
    //                         // 创建一个新的ImageAsset对象
    //                         const imageAsset = new ImageAsset();
    //                         // 创建一个HTMLImageElement对象
    //                         const image = new Image();
    //                         image.onload = () => {
    //                             // 使用HTMLImageElement初始化ImageAsset
    //                             imageAsset._nativeAsset = image;
    //                             // 创建一个新的Texture2D对象，并使用ImageAsset初始化
    //                             const texture = new Texture2D();
    //                             texture.image = imageAsset;

    //                             this._cacheSkins[filePath] = texture;
    //                             // this.addRemoteTextureRef(filePath);
    //                             // 创建一个新的SpriteFrame对象，并使用Texture2D初始化
    //                             resolve({ path: filePath, data: texture as Texture2D });
    //                         };
    //                         function arrayBufferToBase64(buffer) {
    //                             var binary = '';
    //                             var bytes = new Uint8Array(buffer);
    //                             var len = bytes.byteLength;
    //                             for (var i = 0; i < len; i++) {
    //                                 binary += String.fromCharCode(bytes[i]);
    //                             }
    //                             return weBtoa(binary);
    //                         }
    //                         image.src = 'data:image/png;base64,' + arrayBufferToBase64(decodeArrayBuffer);
    //                         // image.src = 'data:image/png;base64,' + window.btoa(String.fromCharCode.apply(null, decodeArrayBuffer)); // //weBtoa(String.fromCharCode.apply(null, decodeArrayBuffer));
    //                     } else {
    //                         // 明确指定资源类型
    //                         const blob = new Blob([decodeArrayBuffer], { type: 'image/png' }); // 请根据实际图像格式设置正确的 MIME 类型
    //                         const image = new Image();
    //                         image.onload = () => {
    //                             const imageAsset = new ImageAsset();
    //                             imageAsset._nativeAsset = image;
    //                             const texture = new Texture2D();
    //                             texture.image = imageAsset; // 设置 ImageAsset

    //                             this._cacheSkins[filePath] = texture;
    //                             // this.addRemoteTextureRef(filePath); 放弃释放 否则会导致大量的创建texture2d
    //                             resolve({ path: filePath, data: texture as Texture2D });
    //                         };
    //                         image.onerror = function (err) { };
    //                         image.src = URL.createObjectURL(blob);
    //                     }
    //                 }
    //             });
    //         });
    //     });
    // }

    // 增加加密资源的引用计数
    addRemoteTextureRef(filePath: string) {
        this._cacheSkins[filePath].addRef();
    }

    // 减少加密资源的引用计数
    decRemoteTextureRef(filePath: string) {
        if (!this._cacheSkins[filePath]) {
            console.log('dec texture :', filePath);
            return;
        }
        this.decRemoteTextureRefStep2(filePath);
    }
    private decRemoteTextureRefStep2(filePath: string) {
        this._cacheSkins[filePath].decRef();
        const refCount = this._cacheSkins[filePath].refCount;
        if (refCount === 0) {
            this._cacheSkins[filePath] = null;
        }
        console.log('dec texture refCount:', filePath, refCount);
    }

    /**
     *  解析资源路径
     *  @path bundleName:respath
     */
    private parseBundlePath(path: string) {
        return path.split('://');
    }

    /**
     * 加载远程资源
     * @param remoteUrl
     * @returns
     */

    public async loadRemote(remoteUrl: string) {
        return new Promise((resolve, reject) => {
            // 服务器地址
            let resUrl = `${assetManager.downloader.remoteServerAddress}${remoteUrl}`;
            if (remoteUrl.startsWith('http')) {
                resUrl = `${remoteUrl}`;
            } else {
                if (isBrowser) {
                    resUrl = `${assetManager.downloader.remoteServerAddress}${remoteUrl}`;
                    if (DEV) {
                        resUrl = `${browserServerAddress}${remoteUrl}`;
                    }
                } else {
                    resUrl = `${assetManager.downloader.remoteServerAddress}${remoteUrl}`;
                }
            }
            assetManager.loadRemote(resUrl, (error, resource) => {
                if (!error) {
                    resolve(resource);
                } else {
                    reject(error);
                }
            });
        });
    }

    /**
     * 获取bundle
     * @param bundleName
     * @returns
     */
    getBundle(bundleName: string) {
        return assetManager.getBundle(bundleName);
    }

    /**
     * 获取已加载资源
     * @param path
     * @param type
     * @param bundleName
     * @returns
     */
    public get<T extends Asset>(path: string, bundleName: string = 'resources'): T | null {
        const bundle: AssetManager.Bundle | null = assetManager.getBundle(bundleName);
        return bundle!.get(path);
    }

    /**
     *  释放bundle
     */
    releaseBundle(bundleName: string) {
        console.log('=========releaseBundle===========', bundleName);
        this.getBundle(bundleName)?.releaseAll();
        // TESdkData.reportTrackLog(ReportEventType.GAME_RELEASE_BUNDLE, { bundleName: bundleName });
    }

    _PNGSIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    _PNGIEND = [0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82];

    //  START_RES_SIGN = [101, 110, 99, 114, 121, 112, 116, 112, 110, 103]; 10
    decodeArrayBuffer(arrbuf) {

        let tempnuma = 1;
        tempnuma += 1;
        if (tempnuma > 0) {
            const buffer = new Uint8Array(arrbuf);
            const signBufLen = 10; // new Uint8Array(START_RES_SIGN).length; //new Uint8Array(Utils.utils.strToBytes(this.sign));
            const keyBytes = Utils.utils.strToAscII(this.getCovertKey());
            const size = buffer.length - signBufLen;
            const _outArrBuf = new ArrayBuffer(size + this._PNGSIG.length + this._PNGIEND.length);
            const outBuffer = new Uint8Array(_outArrBuf);
            let tempnum = 1;
            tempnum += 1;
            if (tempnum > 0) {
                for (let i = 0; i < this._PNGSIG.length; i++) {
                    outBuffer[i] = this._PNGSIG[i];
                }

                let idx = 0;
                let deIdx = 0;
                for (let i = 0; i < size; i++) {
                    const b = buffer[signBufLen + i];
                    if (deIdx < 3000) {
                        outBuffer[this._PNGSIG.length + i] = b ^ keyBytes[idx];
                    } else {
                        outBuffer[this._PNGSIG.length + i] = b;
                    }
                    if (++idx >= keyBytes.length) {
                        idx = 0;
                    }
                    deIdx += 1;
                }

                for (let i = 0; i < this._PNGIEND.length; i++) {
                    outBuffer[this._PNGSIG.length + size + i] = this._PNGIEND[i];
                }
                return outBuffer;
            }
        }

    }

    // 转化下 防止直接明文看出
    getCovertKey() {
        // const keys = RES_TYPE.SIGN_KEY.split('_');
        // return keys[0] + '_' + keys[2] + '_' + keys[1];
        const keys = getGameGlobal()?.sign2?.split('_');
        if (keys && keys.length == 3) {
            return keys[0] + '_' + keys[1] + '_' + keys[2];
        }
        return '';
    }
}
