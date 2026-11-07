import { _decorator, Node, Prefab, profiler, sys, UITransform, view, Widget } from 'cc';
import { UI_TYPE_BY, uiManager } from '../managers/ui-manager';
import { SuperComponent } from './super-component';
const { ccclass, property } = _decorator;

/**
 *  场景基类
 */
@ccclass('SuperScene')
export class SuperScene extends SuperComponent {
    @property({
        type: Node,
        tooltip: '游戏层'
    })
    public game: Node | null = null;

    @property({
        type: Node,
        tooltip: '主要内容层-全屏界面展开的时候会隐藏'
    })
    public content: Node | null = null;

    @property({
        type: Node,
        tooltip: 'ui层'
    })
    public ui: Node | null = null;

    @property({
        type: [Prefab],
        displayName: '挂载预制'
    })
    perLoadPrefabs: Prefab[] = [];

    @property({
        type: Node,
        displayName: '底部菜单'
    })
    bottomNode: Node;

    protected _timeStamp = 0;
    onLoad() {
        this.initUi();
        // 安全区域 ui适配
        this.UpdateArea();

        this.setBottom();
    }
    protected initUi() {
        if (!this.ui) {
            this.ui = this.node.getChildByName('ui_container');
        }
        if (this.ui) {
            uiManager.init(this.ui, this.perLoadPrefabs);
        } else {
            console.error('this scene no   ui container:', this.node.name);
        }
        
    }
    protected setBottom() {
        // 游戏底部统一处理
        if (this.bottomNode) {
            const safeArea = sys.getSafeAreaRect();
            this.bottomNode.getComponent(Widget).bottom = -safeArea.y * 0.5;
        }
        
    }
    protected UpdateArea() {
        const widget = this.node.getComponent(Widget) as Widget;
        const uiTransComp = this.node.getComponent(UITransform) as UITransform;
        if (!widget || !uiTransComp) {
            return;
        }else{
            this.UpdateAreaStep2(widget);
        }
        
    }
    protected UpdateAreaStep2(pwidget:Widget) {
        let tnuma = 1;
        tnuma+=1;
        if(tnuma>0){
            const visibleSize = view.getVisibleSize();
            const screenWidth = visibleSize.width;
            const screenHeight = visibleSize.height; // 屏幕的总尺寸大小
            const safeArea = sys.getSafeAreaRect(); // 安全区域 即中间部分
            // 仅处理顶部，底部设计时候预留小边框
            pwidget.top = screenHeight - safeArea.y - safeArea.height;
            pwidget.bottom = safeArea.y;
            pwidget.left = safeArea.x;
            pwidget.right = screenWidth - safeArea.x - safeArea.width;

            pwidget.updateAlignment(); // 游戏所有内容限制在安全区内，界面中有特殊的需要外延到安全区外的自己去特殊设置
            if (this.ui) {
                this.ui.getComponent(Widget)?.updateAlignment();
            }
        }else{
            return;
        }
        
    }

    // 根据当前界面的展开情况隐藏主城的部分展示起到优化的目的
    protected checkUIForOptimize() {
        if (uiManager.checkHasShowUIType([UI_TYPE_BY.UI_LAYER])) {
            this.content.active = false;
            return;
        }
        this.content.active = true;
    }

    start() {
        super.start();
    }

    onDestroy() {
        super.onDestroy();
        uiManager.clear();
        //增加页面停留时长
        if (this._timeStamp > 0) {
            const duration = Date.now() - this._timeStamp;
 
        }
        this.unscheduleAllCallbacks();
    }
}
