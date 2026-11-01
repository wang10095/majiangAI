
import { Asset, Node, Sprite, assetManager, path } from 'cc';
import { SpriteAtlas } from 'cc';
import { Texture2D } from 'cc';
import { Size } from 'cc';
import { Rect } from 'cc';
import { SpriteFrame } from 'cc';
import { v2 } from 'cc';
import { DEV } from 'cc/env';
import Utils from '../utils/utils';
import { isBrowser, isWeChat, isByteDance } from '../../../game/game-define';
import { RemoteImageManager } from './remote-image-manager';
import { ExcelConfigParser } from '../../../game/excel-config-parser';
import { G_cdnUrl } from '../../../game/constant/common-define';

export class ResManager extends Utils.Singleton {
    // 缓存资源
    // cacheRes: { [name: string]: { localUrl: string; lastTime: number } } = {};
    private remotePatchResList: { [name: string]: number } = {};
    private localPatchResList: { [name: string]: number } = {};

    private waitRecordLocalPathResNames = [];
    constructor() {
        super();
    }

    /**
     * @param remoteResList 远程发生资源变动的列表
     * @param localResList 本地已更新的列表
     */
    initPatchResList(remoteResList: { [name: string]: number }, localResList: { [name: string]: number }) {
        this.remotePatchResList = remoteResList;
        this.localPatchResList = localResList;
    }

    // 是否是更新目录资源
    private isPatchRes(name: string) {
        return this.remotePatchResList[name];
    }

    // 检测是否需要重新获取资源
    private preLoadRemoteCheck(resPath: string) {
        if (this.isPatchRes(resPath)) {
            // 远程发生了资源更新
            if (!this.localPatchResList[resPath] || this.localPatchResList[resPath] < this.remotePatchResList[resPath]) {
                // 未获取过更新，或者更新的资源又过期了
                return true;
            }
        }
        return false;
    }

    // // 记录本地资源更新列表
    private setRecordLocalPatch() {
        if (!this.waitRecordLocalPathResNames || this.waitRecordLocalPathResNames.length <= 0) {
            return;
        }
        const configSavePath = `${this.getUserDataFolder()}/${ExcelConfigParser.getInstance().getConfigPath()}/`;
        const localPatchResPath = `${configSavePath}/patch.json`;
        this.waitRecordLocalPathResNames.forEach(resData => {
            this.localPatchResList[resData.name] = resData.time;
        });

        this.writeFile(localPatchResPath, JSON.stringify(this.localPatchResList));
        this.waitRecordLocalPathResNames = [];
    }

    // 资源的远程地址
    getResRemoteUrl(resPath: string) {
        let resUrl = '';
        const needUpdateRes = isBrowser ? false : this.preLoadRemoteCheck(resPath);
        if (resPath.startsWith('http')) {
            resUrl = `${resPath}`;
        } else {
            if (isBrowser) {
                resUrl = `${assetManager.downloader.remoteServerAddress}${resPath}`;
                if (DEV) {
                    resUrl = `${G_cdnUrl}${resPath}`;
                }
            } else {
                // 服务器地址
                if (needUpdateRes) {
                    const extName = path.extname(resPath);
                    const oldBaseName = path.basename(resPath, extName);
                    const newBaseName = oldBaseName + '@' + this.remotePatchResList[resPath] + extName;
                    resPath = path.join(path.dirname(resPath), newBaseName);
                    resUrl = `${assetManager.downloader.remoteServerAddress}patch_res/${resPath}`;
                } else {
                    // const [baseResUrl, _] = assetManager.downloader.remoteServerAddress.split(getGameGlobal().gameVersion);
                    // resUrl = `${baseResUrl}${resPath}`;
                    resUrl = `${assetManager.downloader.remoteServerAddress}${resPath}`;
                }
            }
        }
        return resUrl;
    }
    /**
     * 加载远程资源
     * @param resPath 资源路径
     * @param target 资源关联的节点，当检查到资源关联的所有结点都被销毁时，资源会被销毁，如果不传入节点，则需要自己通过引用计数管理资源，切记，decRef要传false
     */

    public async loadRemote<Texture2D>(resPath: string, target: Node | Sprite): Promise<Texture2D> {
        return new Promise((resolve, reject) => {
            // 是否需要更新资源
            const needUpdateRes = isBrowser ? false : this.preLoadRemoteCheck(resPath);
            const resUrl = this.getResRemoteUrl(resPath);

            RemoteImageManager.getInstance()
                .loadRemoteImage(resUrl, target)
                .then(({ path, data }) => {
                    resolve(data as Texture2D);
                    if (needUpdateRes) {
                        this.waitRecordLocalPathResNames.push({ name: resUrl, time: this.remotePatchResList[resPath] });
                        setTimeout(() => {
                            this.setRecordLocalPatch();
                        }, 2000);
                    }
                });
        });
    }

    private _cacheSpriteAtlas: { [key: string]: SpriteAtlas } = {};

    /**
     * 当节点销毁时候，主动调用销毁缓存
     * @param atlasName 资源路径
     */
    destroySpriteAtlas(atlasName: string) {
        if (this._cacheSpriteAtlas[atlasName]) {
            this._cacheSpriteAtlas[atlasName].destroy();
            delete this._cacheSpriteAtlas[atlasName];
        }
    }
    getSpriteAtlas(atlasName: string) {
        return this._cacheSpriteAtlas[atlasName];
    }

    // 加载远程plist文件
    async loadRemoteAtlas(target: Node | Sprite, atlasUrl: string, cache = false) {
        try {
            const atlasName = path.basename(atlasUrl);
            const remoteUrl = this.getResRemoteUrl(atlasUrl);
            // 加载png文件
            const texturePromise: Promise<Texture2D> = this.loadRemote(remoteUrl + '.png', target);
            // 加载plist文件
            const atlasDataPromise = this.loadRemoteCustomJson(remoteUrl + '.json'); // loadRemotePlist
            const atlasPromises = [texturePromise, atlasDataPromise];
            // 使用 await 等待所有 Promise 完成
            const [atlasTexture, atlasData] = await Promise.all(atlasPromises);
            const atlasAssets = this.applyTextureAndAtlasData(atlasName, atlasTexture, atlasData);
            console.log('所有资源加载完成', atlasAssets);
            if (cache) {
                this._cacheSpriteAtlas[atlasName] = atlasAssets;
            }
            // 使用加载的资源
            return atlasAssets;
        } catch (error) {
            console.error('Failed to load remote assets:', error);
        }
    }
    // 加载自定义格式
    private loadRemoteCustomJson(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
            assetManager.loadRemote(url, { ext: '.json' }, (err, plistAsset) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(plistAsset);
                }
            });
        });
    }

    // 解析数据
    private applyTextureAndAtlasData(atlasName: string, texture: Texture2D, atlasData: any) {
        const spriteAtlas = new SpriteAtlas();
        const asset = atlasData.json;
        const frames = asset[atlasName];
        const _frames = spriteAtlas.spriteFrames;
        // 132, 104, 122, 85, 2, 25, 128, 128 => x,y,w,h ,offsetX,offsetY,originW,originH
        for (const key in frames) {
            const sf = new SpriteFrame();
            const frame = frames[key];
            sf.texture = texture;
            sf.rect = new Rect(frame[0], frame[1], frame[2], frame[3]);
            sf.offset = v2(sf.rect.x, sf.rect.y);
            sf.originalSize = new Size(frame[6], frame[7]);
            sf.rotated = false;
            _frames[key] = sf; //key需要去掉后缀.png
        }
        return spriteAtlas;
    }

    private getFs() {
        if (isWeChat) {
            return wx.getFileSystemManager();
        } else if (isByteDance) {
            return tt.getFileSystemManager();
        }
    }

    // 用户可操作文件夹
    private getUserDataFolder() {
        if (isWeChat) {
            return wx.env.USER_DATA_PATH;
        } else if (isByteDance) {
            return tt.env.USER_DATA_PATH;
        }
    }

    // 写入文件
    private writeFile(filePath: string, data: string) {
        // 同步接口
        try {
            const res = this.getFs().writeFileSync(filePath, data, 'utf8');
            console.log(res);
        } catch (e) {
            console.error(e);
        }
    }
}
