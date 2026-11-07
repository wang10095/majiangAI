import { director, instantiate, NodePool, Prefab, _decorator, Node, Animation, Asset, Label, Vec3, Color, isValid, UITransform, v3 } from 'cc';
import { Manager } from '../manager';
import { i18n } from '../managers/language-manager';
import { setSecuretNodeString, } from '../../../game/ui-commonset';

export class Toast {
    private static toastPool: NodePool = new NodePool();
    private static currencyPool: NodePool = new NodePool();

    static async showToast(tipContent: string, posY: number = 0, delayTime?: number) {
        const canvas = director.getScene()?.getChildByName('Canvas');
        if (!canvas || !isValid(canvas)) {
            console.error('[Toast] Canvas is unavailable');
            return;
        }

        let toastParentNode = canvas.getChildByName('UI_TOAST');
        if (!toastParentNode || !isValid(toastParentNode)) {
            toastParentNode = new Node('UI_TOAST');
            toastParentNode.parent = canvas;
        }

        let uiToastNode = Toast.toastPool.get();
        if (!uiToastNode || !isValid(uiToastNode)) {
            let toastPrefab: Prefab | null = null;
            try {
                toastPrefab = await Manager.bundleManager.load<Prefab>('common://toast', Prefab);
            } catch (error) {
                console.error('[Toast] prefab loading failed, using fallback:', error);
                Toast.showFallbackToast(canvas, tipContent, posY);
                return;
            }
            if (toastPrefab) {
                uiToastNode = instantiate(toastPrefab);
            } else {
                console.error('loadtoasterror!');
                return;
            }
        }
        if (!isValid(toastParentNode)) {
            console.error('[Toast] UI_TOAST layer is unavailable');
            return;
        }
        try {
            uiToastNode.parent = toastParentNode;
        } catch (error) {
            console.error('[Toast] prefab parent failed, using fallback:', error);
            Toast.showFallbackToast(canvas, tipContent, posY);
            return;
        }
        uiToastNode.setPosition(0, posY);
        uiToastNode.active = false;

        let displayContent = tipContent;
        try {
            displayContent = i18n.f(tipContent) || tipContent;
        } catch (error) {
            console.warn('[Toast] translation unavailable, using raw text:', tipContent, error);
        }

        const contentLabel = uiToastNode.getChildByPath('content/lab_content');
        if (contentLabel) {
            if (!contentLabel.getComponent(Label)) contentLabel.addComponent(Label);
            setSecuretNodeString(contentLabel, displayContent);
        }

        // const anim = uiToastNode.getChildByName('content')!.getComponent(Animation)!;
        // anim.targetOff(this);
        // anim.on(Animation.EventType.FINISHED, () => {
        //     // 动画结束
        //     this.toastPool.put(uiToastNode!);
        //     // anim.stop();
        // });
        // if (delayTime && delayTime > 0) {
        //     Manager.timeManager.unRegisterTimer('toast_show_delay_time');
        //     Manager.timeManager.registerTimer('toast_show_delay_time', delayTime, delayTime, null, () => {
        //         uiToastNode.active = true;
        //         anim.play();
        //     });
        // } else {
        //     uiToastNode.active = true;
        //     anim.play();
        // }
        try {
            Toast.showToastStep2(uiToastNode, delayTime);
        } catch (error) {
            console.error('[Toast] prefab animation failed, using fallback:', error);
            uiToastNode.removeFromParent();
            Toast.showFallbackToast(canvas, displayContent, posY);
        }
    }

    private static showFallbackToast(canvas: Node, content: string, posY: number): void {
        const node = new Node('ToastFallback');
        const transform = node.addComponent(UITransform);
        transform.setContentSize(600, 80);
        const label = node.addComponent(Label);
        label.string = content;
        label.fontSize = 32;
        label.lineHeight = 40;
        label.color = Color.WHITE;
        node.setPosition(0, posY);
        node.parent = canvas;
        setTimeout(() => {
            if (isValid(node)) node.destroy();
        }, 1500);
    }

    static showToastStep2(uiToastNode: Node, delayTime?: number) {
        const anim = uiToastNode.getChildByName('content')?.getComponent(Animation);
        if (!anim) {
            uiToastNode.active = true;
            console.warn('[Toast] animation component is unavailable');
            return;
        }
        anim.targetOff(this);
        anim.on(Animation.EventType.FINISHED, () => {
            // 动画结束
            this.toastPool.put(uiToastNode!);
            // anim.stop();
        });
        if (delayTime && delayTime > 0) {
            Manager.timeManager.unRegisterTimer('toast_show_delay_time');
            Manager.timeManager.regTimer('toast_show_delay_time', delayTime, delayTime, null, () => {
                uiToastNode.active = true;
                anim.play();
            });
        } else {
            uiToastNode.active = true;
            anim.play();
        }
    }


}
