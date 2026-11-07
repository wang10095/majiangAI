import {
    assetManager,
    sys,
    Texture2D,
    BufferAsset,
    ImageAsset,
    isValid,
    Node,
    Sprite,
    director,
    gfx
} from 'cc';
import Utils from '../utils/utils';
import { isMiniGame, isNative } from '../../../game/game-define';
import { weBtoa } from '../../sdk-common/weapp-jwt';
import { FileManager } from './file-manager';
import { UI_EVENT_NAME } from '../../../game/constant/common-define';
import { Manager } from '../manager';


export type RemoteImageOptions = {
    reload?: boolean;
    dontUseCache?: boolean; //目前的用法，don't use cache 必须为false
    priority: number;
};
const defaultOptions: RemoteImageOptions = { priority: 1 };
function getFileExtension(filename) {
    // 查找最后一个点的位置
    const lastIndex = filename.lastIndexOf('.');
    // 确保点不是文件名的第一个字符，并且之后还有字符
    if (lastIndex !== -1 && lastIndex !== 0) {
        // 获取并返回文件扩展名
        return filename.slice(lastIndex + 1);
    } else {
        // 没有找到点或点是第一个字符，返回空字符串
        return '';
    }
}

// 转化下 防止直接明文看出
function getCovertKey() {
    // const keys = RES_TYPE.SIGN_KEY.split('_');
    // return keys[0] + '_' + keys[2] + '_' + keys[1];
    // // return 'hxjs_hanxc_3022'; //
    // return '1h2231xdwt_804t4edb8f_ap543t';
    const keys = getGameGlobal()?.sign2?.split('_');
    if (keys && keys.length == 3) {
        return keys[0] + '_' + keys[1] + '_' + keys[2];
    }
    return '';
}

export class RemoteImageManager extends Utils.Singleton {
    private _cachedTextures: { [key: string]: Texture2D } = {};
    private _cachedMap: { [key: string]: (Node | Sprite)[] } = {};
    private _nextCheckTime: number = 0;
    private _checkInterval: number = 30 * 1000;
    constructor() {
        super();
        setInterval(this.clearUnusedTexture.bind(this), 1000);
        if (isMiniGame) {
            const miniGameApi = (globalThis as any).wx ?? (globalThis as any).tt;
            miniGameApi?.onMemoryWarning?.(() => {
                this.clearUnusedTexture(true);
            });
        }
    }
    private _highResMode = false;

    get HighResMode(): boolean {
        return this._highResMode;
    }
    set HighResMode(mode: boolean) {
        this._highResMode = mode;
        this._astcAvailable = null;
        this.checkAstcAvailable();
    }

    private _astcAvailable: boolean = null;

    checkAstcAvailable() {
        if (this._astcAvailable !== null) {
            return this._astcAvailable;
        }
        if (this.HighResMode) {
            this._astcAvailable = false;
            return this._astcAvailable;
        }
        this._astcAvailable = false;
        if (isMiniGame || isNative) {
            // if (!macro.SUPPORT_TEXTURE_FORMATS.some(s => s == '.astc')) {
            if (!((director?.root?.device?.getFormatFeatures(gfx.Format.ASTC_RGBA_4X4) ?? 0) & gfx.FormatFeatureBit.SAMPLED_TEXTURE)) {
                this._astcAvailable = false;
                return this._astcAvailable;
            }
            if (![sys.OS.IOS, sys.OS.ANDROID].some(s => s == sys.os)) {
                this._astcAvailable = false;
                return this._astcAvailable;
            }
            this._astcAvailable = true;
        }
        return this._astcAvailable;
    }

    clearUnusedTexture(emergency: boolean = false) {
        const now = Date.now();
        if (!emergency && now < this._nextCheckTime) {
            // setTimeout(this.clearUnusedTexture.bind(this), this._nextCheckTime - now);
            return;
        } else {
            this._nextCheckTime = now + this._checkInterval;
            // setTimeout(this.clearUnusedTexture.bind(this), this._nextCheckTime - now);
        }
        let clearCount = 0;
        for (let k in this._cachedTextures) {
            const tex = this._cachedTextures[k];
            const map = this._cachedMap[k];
            if ((tex && tex.refCount > 1) || map.some((target: Node | Sprite) => isValid(target))) {
                continue;
            }
            delete this._cachedMap[k];
            if (this._cachedTextures[k]) {
                clearCount++;
                this._cachedTextures[k].destroy();
                // assetManager.releaseAsset(this._cachedTextures[k].image._nativeAsset);
                delete this._cachedTextures[k];
            }
        }
        // console.log('clearUnusedTexture',clearCount);

        if (emergency && clearCount == 0) {
            // TODO 干点紧急的事情
        }
        return clearCount;
    }

    private cacheTexture(fileUrl: string, texture: Texture2D, target: Node | Sprite, options: RemoteImageOptions) {
        if (!options?.dontUseCache) {
            texture.addRef();
            this._cachedTextures[fileUrl] = texture as Texture2D;
            this._cachedMap[fileUrl] = target ? [target] : [];
            this.delayCheck(5000);
        }
    }

    private delayCheck(delay = 10000) {
        const nextCheckTime = Date.now() + delay;
        if (nextCheckTime > this._nextCheckTime) {
            this._nextCheckTime = nextCheckTime;
        }
    }

    private checkCachedTexture(fileUrl: string, target: Node | Sprite, options: RemoteImageOptions) {
        if (!options?.dontUseCache && this._cachedTextures[fileUrl] && this._cachedTextures[fileUrl].validate()) {
            this._cachedMap[fileUrl].push(target);
            this.delayCheck();
            return { path: fileUrl, data: this._cachedTextures[fileUrl] };
        }
        return null;
    }

    async loadimage(
        fileUrl,
        extType: string,
        target: Node | Sprite = null,
        options: RemoteImageOptions = defaultOptions
    ): Promise<{ path: string; data: Texture2D }> {
        return new Promise((resolve, reject) => {
            const result = this.checkCachedTexture(fileUrl, target, options);
            if (result != null) {
                resolve(result);
                return;
            }
            FileManager.getInstance().downloadAndParse(fileUrl, extType, options, (err, img: ImageAsset) => {
                if (err) {
                    assetManager.cacheManager?.clearLRU();
                    Manager.eventManager.emit(UI_EVENT_NAME.GAME_ERROR, fileUrl, err);
                    reject(err);
                } else {
                    const img1 = img;
                    const texture = new Texture2D();
                    texture.image = img1;
                    this.cacheTexture(fileUrl, texture, target, options);
                    resolve({ path: fileUrl, data: texture as Texture2D });
                }
            });
        });
    }

    // 加载webp与png，jpg一模一样,后期可能遇到平台问题再修改
    async loadwebp(fileUrl, target: Node | Sprite = null, options: RemoteImageOptions = defaultOptions): Promise<{ path: string; data: Texture2D }> {
        return new Promise((resolve, reject) => {
            const result = this.checkCachedTexture(fileUrl, target, options);
            if (result != null) {
                resolve(result);
                return;
            }
            FileManager.getInstance().downloadAndParse(fileUrl, '.webp', options, (err, img: ImageAsset) => {
                if (err) {
                    assetManager.cacheManager?.clearLRU();
                    Manager.eventManager.emit(UI_EVENT_NAME.GAME_ERROR, fileUrl, err);
                    reject(err);
                } else {
                    const img1 = img;
                    const texture = new Texture2D();
                    texture.image = img1;
                    this.cacheTexture(fileUrl, texture, target, options);
                    resolve({ path: fileUrl, data: texture as Texture2D });
                }
            });
        });
    }

    async loadastc(fileUrl, target: Node | Sprite = null, options: RemoteImageOptions = defaultOptions): Promise<{ path: string; data: Texture2D }> {
        if (!this.checkAstcAvailable()) {
            return this.loadimage(fileUrl.replace('.astc', '.png'), '.png', target, options);
        }
        return new Promise((resolve, reject) => {
            const result = this.checkCachedTexture(fileUrl, target, options);
            if (result != null) {
                resolve(result);
                return;
            }
            FileManager.getInstance().downloadAndParse(fileUrl, '.astc', options, (err, img: ImageAsset) => {
                if (err) {
                    assetManager.cacheManager?.clearLRU();
                    Manager.eventManager.emit(UI_EVENT_NAME.GAME_ERROR, fileUrl, err);
                    reject(err);
                } else {
                    const img1 = img;
                    const texture = new Texture2D();
                    texture.image = img1;
                    this.cacheTexture(fileUrl, texture, target, options);
                    resolve({ path: fileUrl, data: texture as Texture2D });
                }
            });
        });
    }

    loadpbin(
        fileUrl: string,
        target: Node | Sprite = null,
        options: RemoteImageOptions = defaultOptions
    ): Promise<{ path: string; data: Texture2D }> {
        return new Promise((resolve, reject) => {
            const result = this.checkCachedTexture(fileUrl, target, options);
            if (result != null) {
                resolve(result);
                return;
            }
            FileManager.getInstance().downloadAndParse(fileUrl, '.bin', options, (err, buffer: BufferAsset) => {
                // console.log('loadpbin: ' + fileUrl + ' => success');
                if (err) {
                    assetManager.cacheManager?.clearLRU();
                    Manager.eventManager.emit(UI_EVENT_NAME.GAME_ERROR, fileUrl, err);
                    reject(err);
                } else {
                    const decodedArrayBuffer = decodeArrayBuffer(buffer.buffer, BinType.PNG);
                    if (isMiniGame) {
                        // 创建一个新的ImageAsset对象
                        const imageAsset = new ImageAsset();
                        // 创建一个HTMLImageElement对象
                        const image = new (globalThis as any).Image();
                        image.onload = () => {
                            // 使用HTMLImageElement初始化ImageAsset
                            imageAsset._nativeAsset = image;
                            // 创建一个新的Texture2D对象，并使用ImageAsset初始化
                            const texture = new Texture2D();
                            texture.image = imageAsset;

                            this.cacheTexture(fileUrl, texture, target, options);
                            // 创建一个新的SpriteFrame对象，并使用Texture2D初始化
                            resolve({ path: fileUrl, data: texture as Texture2D });
                        };
                        function arrayBufferToBase64(buffer) {
                            var binary = '';
                            var bytes = new Uint8Array(buffer);
                            var len = bytes.byteLength;
                            for (var i = 0; i < len; i++) {
                                binary += String.fromCharCode(bytes[i]);
                            }
                            return weBtoa(binary);
                        }
                        image.src = 'data:image/png;base64,' + arrayBufferToBase64(decodedArrayBuffer);
                        // image.src = 'data:image/png;base64,' + window.btoa(String.fromCharCode.apply(null, decodedArrayBuffer)); // //weBtoa(String.fromCharCode.apply(null, decodedArrayBuffer));
                    } else {
                        FileManager.getInstance().parse(fileUrl, decodedArrayBuffer, '.png', {}, (parseError, imageAsset: ImageAsset) => {
                            if (parseError) {
                                reject(parseError);
                                return;
                            }
                            const texture = new Texture2D();
                            texture.image = imageAsset;
                            this.cacheTexture(fileUrl, texture, target, options);
                            resolve({ path: fileUrl, data: texture });
                        });
                    }
                }
            });
        });
    }

    /**
     * Load an abin file from the specified URL with optional remote image options.
     *
     * @param {string} fileUrl - the URL of the file to load
     * @param {RemoteImageOptions} options - optional remote image options (default is empty)
     * @return {Promise<{ path: string; data: Texture2D }>} a promise that resolves to an object containing the file path and Texture2D data
     */
    async loadabin(fileUrl, target: Node | Sprite = null, options: RemoteImageOptions = defaultOptions): Promise<{ path: string; data: Texture2D }> {
        if (!this.checkAstcAvailable()) {
            return this.loadpbin(fileUrl.replace('.abin', '.bin'), target, options);
        }
        return new Promise((resolve, reject) => {
            const result = this.checkCachedTexture(fileUrl, target, options);
            if (result != null) {
                resolve(result);
                return;
            }
            FileManager.getInstance().downloadAndParse(fileUrl, '.bin', options, (err, buffer: BufferAsset) => {
                // console.log('loadabin: ' + fileUrl + ' => success');
                if (err) {
                    assetManager.cacheManager?.clearLRU();
                    Manager.eventManager.emit(UI_EVENT_NAME.GAME_ERROR, fileUrl, err);
                    reject(err);
                } else {
                    const decodedArrayBuffer = decodeArrayBuffer(buffer.buffer, BinType.ASTC);
                    const imageSource = {
                        _data: new Uint8Array(0),
                        _compressed: true,
                        width: 0,
                        height: 0,
                        format: 0,
                        mipmapLevelDataSize: []
                    };
                    (ImageAsset as any).parseASTCTexture(decodedArrayBuffer, 0, 0, decodedArrayBuffer.byteLength, imageSource);
                    const imageAsset = new ImageAsset(imageSource);
                    const texture = new Texture2D();
                    texture.image = imageAsset; // 设置 ImageAsset

                    this.cacheTexture(fileUrl, texture, target, options);

                    resolve({ path: fileUrl, data: texture as Texture2D });
                }
            });
        });
    }

    /**
     * 加载远程图片
     * @param fileUrl 资源路径
     * @param target 资源关联的节点，当检查到资源关联的所有结点都被销毁时，资源会被销毁，如果不传入节点，则需要自己通过引用计数管理资源，切记，decRef要传false
     * @param options 远程图片选项
     */
    async loadRemoteImage(
        fileUrl,
        target: Node | Sprite = null,
        options: RemoteImageOptions = defaultOptions
    ): Promise<{ path: string; data: Texture2D }> {
        let ext = getFileExtension(fileUrl);
        switch (ext) {
            case 'webp':
                return this.loadwebp(fileUrl, target, options);
            case 'bin':
                return this.loadpbin(fileUrl, target, options);
            case 'abin':
                if (!this.checkAstcAvailable()) {
                    return this.loadpbin(fileUrl.replace('.abin', '.bin'), target, options);
                }
                return this.loadabin(fileUrl, target, options);
            case 'astc':
                if (!this.checkAstcAvailable()) {
                    return this.loadimage(fileUrl.replace('.astc', '.png'), '.png', target, options);
                }
                return this.loadastc(fileUrl, target, options);
            default:
                if (ext.length > 5 || ext.length < 3) { //非图片后缀 比如微信头像
                    ext = 'png';
                }
                return this.loadimage(fileUrl, '.' + ext, target, options);
        }
    }
}

export enum BinType {
    PNG,
    ASTC
}

const _PNGSIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const _PNGIEND = [0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82];
const _ASCTSIG = [0x13, 0xab, 0xa1, 0x5c];

//  START_RES_SIGN = [101, 110, 99, 114, 121, 112, 116, 112, 110, 103]; 10
function decodeArrayBuffer(arrbuf, binType: BinType = BinType.PNG) {
    const buffer = new Uint8Array(arrbuf);
    const keyBytes = Utils.utils.strToAscII(getCovertKey());
    if (binType == BinType.PNG) {
        const signBufLen = 10; // new Uint8Array(START_RES_SIGN).length; //new Uint8Array(faster.utils.strToBytes(this.sign));
        const size = buffer.length - signBufLen;
        const _outArrBuf = new ArrayBuffer(size + _PNGSIG.length + _PNGIEND.length);
        const outBuffer = new Uint8Array(_outArrBuf);
        for (let i = 0; i < _PNGSIG.length; i++) {
            outBuffer[i] = _PNGSIG[i];
        }

        let idx = 0;
        let deIdx = 0;
        for (let i = 0; i < size; i++) {
            const b = buffer[signBufLen + i];
            if (deIdx < 3000) {
                outBuffer[_PNGSIG.length + i] = b ^ keyBytes[idx];
            } else {
                outBuffer[_PNGSIG.length + i] = b;
            }
            if (++idx >= keyBytes.length) {
                idx = 0;
            }
            deIdx += 1;
        }

        for (let i = 0; i < _PNGIEND.length; i++) {
            outBuffer[_PNGSIG.length + size + i] = _PNGIEND[i];
        }

        return outBuffer;
    } else if (binType == BinType.ASTC) {
        const signBufLen = 4;
        const size = buffer.length - signBufLen;
        const _outArrBuf = new ArrayBuffer(size + _ASCTSIG.length);
        const outBuffer = new Uint8Array(_outArrBuf);
        for (let i = 0; i < _ASCTSIG.length; i++) {
            outBuffer[i] = _ASCTSIG[i];
        }

        let idx = 0;
        let deIdx = 0;
        for (let i = 0; i < size; i++) {
            const b = buffer[signBufLen + i];
            if (deIdx < 3000) {
                outBuffer[_ASCTSIG.length + i] = b ^ keyBytes[idx];
            } else {
                outBuffer[_ASCTSIG.length + i] = b;
            }
            if (++idx >= keyBytes.length) {
                idx = 0;
            }
            deIdx += 1;
        }

        return outBuffer;
    }
}
