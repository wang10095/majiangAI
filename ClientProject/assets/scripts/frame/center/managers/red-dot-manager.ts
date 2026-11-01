import Utils from "../utils/utils";
import { EventManager } from "./event-manager";
/**
 * 红点管理
 * 1、单独红点  只关心自己
 * 2、列表红点  关心列表中的所有
 * 3、树形结构红点 关心自己的下属
 */

interface TreeNodeInfo {
    key: string;
    keyParent: string;
    keyChilds: (string | TreeNodeInfo)[];
}

class RedDotManager {
    private static _instance: RedDotManager;

    static getInstance() {
        if (!this._instance) {
            this._instance = new RedDotManager();
        }

        return this._instance;
    }

    private allRedDotStatus: { [key: string]: number | boolean } = {}; // 红点状态
    private redDotList: { [key: string]: string[] } = {}; // 红点列表
    private redDotTree: { [key: string]: { keyParent: string; keyChilds: string[] } } = {}; // 树形红点 {a:{b:{c,d}}}

    constructor() {
        EventManager.getInstance().on('SET_RED_DOT', this.setRedDot, this);
    }

    // 注册红点集合
    public registerRedDotList(parentKey: string, listKey: string[]) {
        this.redDotList[parentKey] = listKey;
    }

    // 树形红点结构
    public registerRedDotTree(key: string, parentKey: string, childKeys: string[]) {
        this.redDotTree[key] = { keyParent: parentKey, keyChilds: childKeys };
    }

    // 一次注册树形红点
    public registerRedDotAllTree(dotTree: TreeNodeInfo) {
        this.redDotTree[dotTree.key] = {
            keyParent: this.redDotTree[dotTree.key]?.keyParent || dotTree.keyParent,
            keyChilds: (dotTree.keyChilds || []).map(keyChild => {
                if (Utils.utils.isString(keyChild)) {
                    return String(keyChild);
                } else {
                    return (keyChild as TreeNodeInfo).key;
                }
            })
        };

        this.registerRedDotAllTree2(dotTree);
    }

    private registerRedDotAllTree2(dotTree: TreeNodeInfo) {
        if (dotTree.keyParent) {
            //中途加入  让父红点的keyChilds 添加上该子红点
            if (!this.redDotTree[dotTree.keyParent]) {
                this.redDotTree[dotTree.keyParent] = { keyParent: null, keyChilds: [] };
            }
            if (!this.redDotTree[dotTree.keyParent].keyChilds) {
                this.redDotTree[dotTree.keyParent].keyChilds = [];
            }
            if (!this.redDotTree[dotTree.keyParent].keyChilds.includes(dotTree.key)) {
                this.redDotTree[dotTree.keyParent].keyChilds.push(dotTree.key);
            }
        }
        (dotTree.keyChilds || []).forEach(keyChild => {
            if (Utils.utils.isString(keyChild)) {
                this.redDotTree[String(keyChild)] = { keyParent: dotTree.key, keyChilds: null };
            } else {
                this.registerRedDotAllTree(keyChild as TreeNodeInfo);
            }
        });
    }

    private setRedDot(key: string, num: number | boolean) {
        this.allRedDotStatus[key] = num;

        // -------- tree key ----------
        // 需要更新所有父亲
        if (this.redDotTree[key]?.keyParent) {
            this.traverseRedDotTree(num, key, this.redDotTree[key]?.keyParent);
        } else {
            // ------- list key -------
            let beloneMainKey, mainKeyStatus;
            for (const mainKey in this.redDotList) {
                const listKeys = this.redDotList[mainKey];
                const keyIdx = listKeys.indexOf(key);
                if (keyIdx !== -1) {
                    beloneMainKey = mainKey;
                    listKeys.map(listKey => {
                        if (!mainKeyStatus && this.allRedDotStatus[listKey]) {
                            mainKeyStatus = this.allRedDotStatus[listKey];
                        }
                    });
                }
            }

            // 父节点红点刷新
            if (beloneMainKey) {
                this.allRedDotStatus[beloneMainKey] = !!mainKeyStatus;
                EventManager.getInstance().emit('RedDot_' + beloneMainKey, !!mainKeyStatus);
            }
        }

        EventManager.getInstance().emit('RedDot_' + key, num);
    }

    // 深度遍历
    traverseRedDotTree(num: number | boolean, key: string, parentKey: string): void {
        let parentKeyVal = false;
        // console.log('===parentKey==', parentKey);
        for (let index = 0; index < this.redDotTree[parentKey]?.keyChilds?.length; index++) {
            const childKey = this.redDotTree[parentKey]?.keyChilds[index];
            // childKey
            if (this.allRedDotStatus[childKey]) {
                parentKeyVal = true;
                break;
            }
        }
        this.allRedDotStatus[parentKey] = !!parentKeyVal;
        EventManager.getInstance().emit('RedDot_' + parentKey, !!parentKeyVal);

        if (this.redDotTree[parentKey].keyParent) {
            this.traverseRedDotTree(parentKeyVal, parentKey, this.redDotTree[parentKey].keyParent);
        }
    }

    public getRedDotStatus(key: string) {
        return this.allRedDotStatus[key];
    }

    // 清空数据
    clear() {
        this.allRedDotStatus = {}; // 红点状态
        this.redDotList = {}; // 红点列表
        this.redDotTree = {};
    }
}
export const redDotManager = RedDotManager.getInstance();
