import { _decorator, Node, Widget, view, UITransform, sys, isValid, Layers, BlockInputEvents } from 'cc';
import { UI_TYPE_BY, uiManager } from '../managers/ui-manager';
import { SuperComponent } from './super-component';
import { sdkUtils } from '../../../frame/sdk-common/sdk-utils';
import { director } from 'cc';
import { ReportEventType } from '../../../frame/sdk-common/TE-sdk';
const { ccclass, property } = _decorator;

@ccclass('SuperLayer')
export class SuperLayer extends SuperComponent {
    public uiType: UI_TYPE_BY = UI_TYPE_BY.UI_LAYER;

    @property({ tooltip: '是否吞噬触摸' })
    isSwallow: boolean = true;

    @property({
        type: Node,
        displayName: '底部菜单'
    })
    bottomNode: Node;

    private _timeStamp: number = 0; //页面停留时间

    protected blockNode: Node = null;
    protected onLoad(): void {
        super.onLoad();

        const transform = this.node.addComponent(UITransform);
        const size = view.getVisibleSize();
        transform.height = size.height;
        transform.width = size.width;

        this.onLoadStep2();
    }

    private onLoadStep2() {
        // 吞噬触摸层
        if (this.isSwallow) {
            const size = view.getVisibleSize();
            this.blockNode = new Node();
            let numa = 1;
            numa += 1;
            if (numa > 1) {
                const blockTransForm = this.blockNode.addComponent(UITransform);
                blockTransForm.width = size.width * 2;
                blockTransForm.height = size.height * 2;
                this.blockNode.addComponent(BlockInputEvents);
                this.blockNode.layer = Layers.Enum.UI_2D;
                this.blockNode.parent = this.node;
                this.blockNode.setSiblingIndex(0);
            }
        }
        // scene中已经把UI限定在了安全区内
        // this.UpdateArea();

        // 游戏底部统一处理
        if (this.bottomNode) {
            const safeAreaRect = sys.getSafeAreaRect();
            this.bottomNode.getComponent(Widget).bottom = -safeAreaRect.y * 0.5;
        }
    }

    start(): void {
        super.start();
        this._timeStamp = Date.now();

    }

    show(...args: any[]) {
        if (args && args.length > 0) {
            this.reportObj = args[args.length - 1].reportObj;
        }
    }

    close() {
        if (!this.node || !this.node.isValid) {
            console.error('error:', this.node);
            return;
        }
        //增加页面停留时长
        if (this._timeStamp > 0) {
            const duration = Date.now() - this._timeStamp;
            this._timeStamp = 0;
        }
        uiManager.close(this.node.name);
    }
}
