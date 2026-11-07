import { Manager } from '../frame/center/manager';
import Utils from '../frame/center/utils/utils';
import { JsonAsset, assetManager } from 'cc';
import { isByteDance, isMiniGame, isWeChat } from './game-define';

export class ExcelConfigParser extends Utils.Singleton {
    // 重新读取sheet 若未加载解析 先解析
    async initConfig() {
        const allPromise = [];
        for (const bundleName in AllExcelSheets) {
            allPromise.push(this.loadExcel(bundleName));
        }
        await Promise.all(allPromise);
        console.log('解析配置完成');
    }

    // 获取配置路径
    getConfigPath() {
        return '71182B013CD81D36'.replace(/(.{4})/g, '$1/'); //'config'; //
    }

    // 每个excel一个bundle
    // 1、判断是缓存中是否有更新的配置文件
    // 2、如果有更新，则读取缓存版本
    // 3、如果没有更新，bundle中读取
    loadExcel(excelBundleName: string) {
        return new Promise(async (resolve, reject) => {
            const configFileName = excelBundleName.replace('_cfg', '');
            // if (isMiniGame) {
            //     const configSavePath = `${this.getUserDataFolder()}/${ExcelConfigParser.getInstance().getConfigPath()}/`;
            //     const enConfigName = AllExcelSheets[excelBundleName];
            //     let configFilePath = configSavePath + enConfigName + '.bin';
            //     let skipParse = false;
            //     if (!this.isExistFile(configFilePath)) {
            //         configFilePath = configSavePath + enConfigName + '.json';
            //         skipParse = true;
            //     }
            //     if (this.isExistFile(configFilePath)) {
            //         let fileContent = this.readFile(configFilePath, skipParse);
            //         console.log('读取缓存中的配置:', configFilePath);
            //         if (fileContent) {
            //             if (!skipParse) {
            //                 fileContent = this.parseConfig(fileContent);
            //             }
            //             try {
            //                 const sheetDatas = JSON.parse(fileContent as string) || {};
            //                 this.initConfigData(sheetDatas);
            //             } catch (error) {
            //                 console.log('解析配置异常:', configFilePath);
            //             }
            //         }
            //         resolve('');
            //         return;
            //     } else {
            //         console.log('检测服务器配表版本，没找到配置文件', configFileName);
            //     }
            //     return;
            // }
            // let bundleData = Manager.bundleManager.getBundle(excelBundleName);
            let bundleData = Manager.bundleManager.getBundle('config');
            if (!bundleData) {
                bundleData = await Manager.bundleManager.loadBundle('config');
            }
            if (!bundleData) {
                console.error('错误的bundle，未能加载成功，请检查:', excelBundleName);
                reject('');
                return;
            }
            // excelBundleName + '/' +
            bundleData.load(configFileName, (err, jsonAsset: JsonAsset) => {
                if (err) {
                    console.error('加载策划配置表失败:', excelBundleName);
                    reject();
                    return;
                }
                const sheetDatas = jsonAsset.json;
                this.initConfigData(sheetDatas);
                // 释放assetmanager中的缓存
                bundleData.release(configFileName);
                resolve('');
            });
        });
    }

    // 解析加密配置
    parseConfig(fildData) {
        const keyBytes = new TextEncoder().encode(this.getCovertKey());
        const buffData = new ArrayBuffer(fildData.length);
        const dataView = new DataView(buffData);
        for (let i = 0; i < fildData.length; i++) {
            dataView.setUint8(i, fildData.charCodeAt(i) & 0xff);
        }

        const length = buffData.byteLength; //Math.min(buffData.byteLength, 1000); // 只对前1000个字节进行解密
        for (let i = 0; i < length; i++) {
            const encryptedByte = dataView.getUint8(i);
            const keyByte = keyBytes[i % keyBytes.length];
            const decryptedByte = encryptedByte ^ keyByte;
            dataView.setUint8(i, decryptedByte);
        }
        const textDecoder = new TextDecoder('utf-8');
        const jsonStr = textDecoder.decode(buffData);
        return jsonStr;
    }

    // 转化下 防止直接明文看出
    getCovertKey() {
        const keys = getGameGlobal()?.sign1?.split('_');
        if (keys && keys.length == 3) {
            return keys[0] + '_' + keys[1] + '_' + keys[2];
        }
        return '';
    }
    // 初始化配置数据
    private initConfigData(sheetDatas) {
        const sheetNames = Object.keys(sheetDatas);
        for (const sheetName of sheetNames) {
            // if (!Config[sheetName]) {
            Config[sheetName] = {};
            for (const id in sheetDatas[sheetName]['data']) {
                const excelData = sheetDatas[sheetName]['data'][id];
                Config[sheetName][id] = ExcelConfigParser.getInstance().parseJsonDataToObject(sheetDatas[sheetName]['keys'], excelData);
            }
            // console.log('initConfigData:', sheetName, Config[sheetName]);
            // }
        }
        console.log('initConfigData:', sheetNames);
    }

    // 全局信息
    public getGlobalCfgValue(key: string) {
        const globalItemData = Config.Globals[key];
        // if (globalItemData.value_type === 'int') {
        //     return Number(globalItemData.value);
        // } else if (globalItemData.value_type === 'intArray') {
        //     return globalItemData.value.split('|').map(val => Number(val));
        // } else if (globalItemData.value_type === 'stringArray') {
        //     return globalItemData.value.split('|');
        // } else if (globalItemData.value_type === 'floatArray') {
        //     return globalItemData.value.split('|');
        // } else if (globalItemData.value_type === 'map') {
        //     // 100004#20 ,100002#100
        //     const mapValue = {};
        //     const mapArray = globalItemData.value.split(',');
        //     mapArray.forEach((mapItem, index) => {
        //         const mapItemArray = mapItem.split('#');
        //         const key = mapItemArray[0].trim();
        //         const value = mapItemArray[1].trim();
        //         mapValue[key] = value;
        //     });
        //     return mapValue;
        // } else if (globalItemData.value_type === 'mapArray') {
        //     const mapArray = [];
        //     const array = globalItemData.value.split('|');
        //     array.forEach((mapItem, index) => {
        //         const mapItemArray = mapItem.split('#');
        //         mapArray.push({ [mapItemArray[0].trim()]: mapItemArray[1].trim() });
        //     });
        //     return mapArray;
        // }
        // return globalItemData.value;

        switch (globalItemData.value_type) {
            case "int":
                return Number(globalItemData.value);
                break;
            case "intArray":
                return globalItemData.value.split('|').map(val => Number(val));
                break;
            case "stringArray":
                return globalItemData.value.split('|');
                break;
            case "floatArray":
                return globalItemData.value.split('|');
                break;
            case "map":
                const mapValue = {};
                const mapArray = globalItemData.value.split(',');
                mapArray.forEach((mapItem, index) => {
                    const mapItemArray = mapItem.split('#');
                    const key = mapItemArray[0].trim();
                    const value = mapItemArray[1].trim();
                    mapValue[key] = value;
                });
                return mapValue;
                break;
            case "mapArray":
                const mapArray2 = [];
                const array = globalItemData.value.split('|');
                array.forEach((mapItem, index) => {
                    const mapItemArray = mapItem.split('#');
                    mapArray2.push({ [mapItemArray[0].trim()]: mapItemArray[1].trim() });
                });
                return mapArray2;
                break;

            default:
                return globalItemData.value;
                break;
        }
    }

    private getFs() {
        if (isWeChat) {
            return wx.getFileSystemManager();
        } else if (isByteDance) {
            return tt.getFileSystemManager();
        }
    }
    // 判断是否存在文件
    private isExistFile(filePath: string) {
        try {
            this.getFs().accessSync(filePath);
            return true;
        } catch (e) {
            return false;
        }
    }
    // 读取文件
    private readFile(filePath: string, skip = false) {
        try {
            const res = this.getFs().readFileSync(filePath, skip ? 'utf8' : 'binary', skip ? 0 : 11);
            // console.log(res);
            return res;
        } catch (e) {
            console.error(e);
        }
        return;
    }

    // 用户可操作文件夹
    private getUserDataFolder() {
        if (isWeChat) {
            return wx.env.USER_DATA_PATH;
        } else if (isByteDance) {
            return tt.env.USER_DATA_PATH;
        }
    }

    parseJsonDataToObject(keys: string[], excelData: any) {
        const dataObject = {};
        for (let index = 0; index < keys.length; index++) {
            const keyName = keys[index];
            dataObject[keyName] = excelData[index];
        }
        return dataObject;
    }

    /**
     * 该id对应的数据
     * @param id
     * @param datas
     */
    find<T>(datas: { [id: number]: T }, key: string, val: any): T[] {
        let results: T[] = [];
        for (const id in datas) {
            const cfgItemData = datas[id];
            if (cfgItemData[key] === val) {
                results.push(cfgItemData);
            }
        }
        return results;
    }
}
