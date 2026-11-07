import { _decorator, Node, Widget, Prefab, instantiate, view, log, path } from 'cc';
import { Manager } from '../manager';
import Utils from '../utils/utils';
import { SuperPanel } from '../components/super-panel';
import { UI_EVENT_NAME } from '../../../game/constant/common-define';
import { SuperLayer } from '../components/super-layer';
// 界面所处层级
export enum UI_TYPE_BY {
    UI_LAYER = 'UI_LAYER',
    UI_PANEL = 'UI_PANEL',
    UI_POPUP = 'UI_POPUP',
    UI_GUIDE = 'UI_GUIDE',
    UI_ALERT = 'UI_ALERT',
    UI_TOAST = 'UI_TOAST'
}

/**
 * 界面弹出管理
 * 根据面板的不同类型设置显示层级
 */
class UIManager extends Utils.Singleton {
    private _uiContainer!: Node;
    private _layerMap: { [uiType: string]: Node } = {}; // 层级

    private preloadPrefabs: Prefab[];
    private _currentShowPanelBy: { [uiName: string]: { uiNode: Node; uiType: string } | undefined } = {}; // 当前处于打开状态的界面

    public isLoadingPrefabBy = false; // 正在加载界面
    init(rootContainer: Node, prefabs: Prefab[]) {
        this._uiContainer = rootContainer;
        this.preloadPrefabs = prefabs;
        // for (const type in UI_TYPE_BY) {
        //     console.info(type);
        //     const layerNode = new Node(type);
        //     var widget: Widget = layerNode.addComponent(Widget);
        //     widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true;
        //     widget.left = widget.right = widget.top = widget.bottom = 0;
        //     widget.enabled = true;
        //     layerNode.parent = this._uiContainer;
        //     this._layerMap[type] = layerNode;
        // }
        this.initStep2();
    }
    private initStep2() {
        let numcc = 1;
        numcc += 1;
        if (numcc > 0) {
            for (const type in UI_TYPE_BY) {
                console.info(type);
                const layerNode = new Node(type);
                var widget: Widget = layerNode.addComponent(Widget);
                widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true;
                widget.left = widget.right = widget.top = widget.bottom = 0;
                widget.enabled = true;
                layerNode.parent = this._uiContainer;
                this._layerMap[type] = layerNode;
            }
        }

    }

    private waitingShowPanel: { uiPath: string; args: any[] }[] = []; //
    async show(uiPath: string, ...args: any[]) {
        try {
            const uiName = this.getUINameByPath(uiPath);
            if (this.isLoadingPrefabBy) {
                this.waitingShowPanel.push({ uiPath, args });
                console.warn('UIManageris loading prefab', uiPath, args);
                return;
            }
            this.isLoadingPrefabBy = true;
            let uiNode: Node | undefined = this._currentShowPanelBy[uiName]?.uiNode;
            if (!uiNode) {
                // BusyLayer.show();
                this._currentShowPanelBy[uiName] = { uiNode: null, uiType: UI_TYPE_BY.UI_PANEL };
                let nodePrefab = this.isPerLoadPrefabBy(uiName);
                if (!nodePrefab) {
                    nodePrefab = await Manager.bundleManager.load<Prefab>(uiPath, Prefab);
                    if (!nodePrefab) {
                        console.error('loadlprefab error:', uiPath);
                        this._currentShowPanelBy[uiName] = undefined;
                        delete this._currentShowPanelBy[uiName];
                        this.isLoadingPrefabBy = false;
                        return;
                    }
                }
                uiNode = instantiate(nodePrefab);
                let uiClass: SuperPanel | SuperLayer = uiNode.getComponent(SuperPanel);
                if (!uiClass) {
                    uiClass = uiNode.getComponent(SuperLayer);
                }
                if (!this._currentShowPanelBy[uiName]) {
                    // 被提前关闭或者是clear了
                    return;
                }
                uiNode.parent = this._layerMap[uiClass.uiType];
                uiNode.active = true;
                this._currentShowPanelBy[uiName] = { uiNode: uiNode, uiType: uiClass.uiType };
                this.isLoadingPrefabBy = false;
                //console.log('show:', uiPath);
                uiClass.show(...args);
                // BusyLayer.hide();
            } else {
                uiNode.active = true;
                let uiClass: SuperPanel | SuperLayer = uiNode.getComponent(SuperPanel);
                if (!uiClass) {
                    uiClass = uiNode.getComponent(SuperLayer);
                }
                if (!this._currentShowPanelBy[uiName]) {
                    // 被提前关闭或者是clear了
                    return;
                }
                this._currentShowPanelBy[uiName] = { uiNode: uiNode, uiType: uiClass.uiType };
                this.isLoadingPrefabBy = false;
                //console.log('show exsit:', uiPath);
                uiClass.show(...args);
                uiNode.setSiblingIndex(1000); // 最上层
            }
            if (this.waitingShowPanel.length > 0) {
                const { uiPath, args } = this.waitingShowPanel.shift();
                this.show(uiPath, ...args);
            }
            Manager.eventManager.emit(UI_EVENT_NAME.Popup_Show, uiName);
        } catch (error) {
            this.isLoadingPrefabBy = false;
            console.error('UIManagershow error:', uiPath, args, error);
            Manager.eventManager.emit(UI_EVENT_NAME.GAME_ERROR, uiPath, error, args);
        }
    }

    close(uiName: string) {
        if (!this._currentShowPanelBy[uiName]) {
            uiName = this.getUINameByPath(uiName);
            if (!this._currentShowPanelBy[uiName]) {
                //console.warn('UIManager %s is not open state。', uiName);
                return;
            }
        }

        const uiNode: Node = this._currentShowPanelBy[uiName]!.uiNode;
        if (uiNode) {
            if (this.isPerLoadPrefabBy(uiName)) {
                // 提前挂载的界面执行显隐操作
                uiNode.active = false;
                Manager.eventManager.emit(UI_EVENT_NAME.Popup_Close, uiName);
                return;
            }
            uiNode.destroy();
        }
        this._currentShowPanelBy[uiName] = undefined;
        delete this._currentShowPanelBy[uiName];
        Manager.eventManager.emit(UI_EVENT_NAME.Popup_Close, uiName);

        this.checkShowPopPanel();

        // if (uiName != 'item_receive_auto') {
        //     //所有临时弱提醒都不要发
        //     Manager.eventManager.emit(UI_EVENT_NAME.GAME_WIN_CLOSE, uiName);
        // }
    }

    /**
     * 链式弹出面板
     * ignorePanel true 直接弹出不关心是否有其他panel界面展示，false等其它panel关闭后展示
     */
    private popShowPanel: { uiPath: string; args: any; ignorePanel?: boolean }[] = []; //  展示队列，关闭=>弹出
    pop(uiPanels: { uiPath: string; args: any; ignorePanel?: boolean }[]) {
        this.popShowPanel = this.popShowPanel.concat(uiPanels);
        this.checkShowPopPanel();
    }

    // 检测是否有缓存的弹出队列
    private checkShowPopPanel() {
        if (this.popShowPanel.length > 0) {
            const willShowPanel = this.popShowPanel[0];
            const hasShowPanel = this.checkHasShowUIType([UI_TYPE_BY.UI_PANEL, UI_TYPE_BY.UI_POPUP, UI_TYPE_BY.UI_GUIDE, UI_TYPE_BY.UI_ALERT]);
            if (willShowPanel.ignorePanel || (!willShowPanel.ignorePanel && !hasShowPanel)) {
                const { uiPath, args } = this.popShowPanel.shift();
                if (!args) {
                    this.show(uiPath);
                } else if (Utils.utils.isObject(args)) {
                    this.show(uiPath, args);
                } else {
                    this.show(uiPath, ...args);
                }
            }
        }
    }

    isShow(uiPath: string) {
        const uiName = this.getUINameByPath(uiPath);
        return !!(this._currentShowPanelBy[uiName] && this._currentShowPanelBy[uiName].uiNode?.active);
    }

    getPanelNode(uiPath: string) {
        const uiName = this.getUINameByPath(uiPath);
        return this._currentShowPanelBy[uiName]?.uiNode;
    }

    getLayer(uiType: UI_TYPE_BY) {
        return this._layerMap[uiType];
    }

    // 提前load的界面 在show和close的时候执行显隐操作 非回收创建，一般用于极度复用的弹出
    private isPerLoadPrefabBy(prefabName: string): Prefab {
        for (const prefab of this.preloadPrefabs) {
            if (prefab && prefab.name === prefabName) {
                return prefab;
            }
        }

        return null;
    }

    /**
     *  是否有再展示的面板
     */
    checkHasShowUIType(types: UI_TYPE_BY[], excludePanels?: string[]) {
        for (const uiName in this._currentShowPanelBy) {
            const uiInfo = this._currentShowPanelBy[uiName];
            if (excludePanels && excludePanels.indexOf(uiName) > -1) {
                continue;
            }
            if (types.indexOf(uiInfo.uiType as UI_TYPE_BY) !== -1 && uiInfo.uiNode?.active) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param uiPath 预制完整路径
     *
     */
    getUINameByPath(uiPath: string): string {
        if (!uiPath) {
            return;
        }
        return path.basename(uiPath);
    }

    clear(type?: UI_TYPE_BY, excludePanels?: string[]) {
        for (const uiName in this._currentShowPanelBy) {
            const uiInfo = this._currentShowPanelBy[uiName];
            if (!type || uiInfo.uiType === type) {
                if (excludePanels && excludePanels.indexOf(uiName) > -1) {
                    continue;
                }
                this.close(uiName);
                if (this.isPerLoadPrefabBy(uiName)) {
                    this._currentShowPanelBy[uiName] = undefined;
                    delete this._currentShowPanelBy[uiName];
                }
            }
        }
        this.isLoadingPrefabBy = false;
        this.popShowPanel = [];
    }
}

export const uiManager = UIManager.getInstance();
