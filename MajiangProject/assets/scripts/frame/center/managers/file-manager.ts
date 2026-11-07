import { assetManager, Texture2D } from 'cc';
import Utils from '../utils/utils';

export class FileManager extends Utils.Singleton {
    private _cachedTextures: { [key: string]: Texture2D } = {};
    constructor() {
        super();
    }

    download(url: string, ext: string, options: Record<string, any>, onComplete: ((err: Error | null, data?: any | null) => void)) {
        assetManager.downloader.download(url, url, ext ? ext : options?.ext, options, onComplete);
    }

    parse(id: string, file: any, ext: string, options: Record<string, any>, onComplete: ((err: Error | null, data?: any | null) => void)) {
        assetManager.parser.parse(id, file, ext, options, (err, data) => {
            if (err) {
                onComplete(err, null);
            } else {
                assetManager.factory.create(id, data, ext, options, onComplete);
            }
        });
    }

    downloadAndParse(url: string, ext: string, options: Record<string, any>, onComplete: ((err: Error | null, data?: any | null) => void)) {
        assetManager.loadRemote(url, {
            ext,
            reloadAsset: options?.reloadAsset ?? false,
            reload: options?.reload ?? false,
        }, onComplete);
    }

}