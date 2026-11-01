import { director, instantiate, NodePool, Prefab, _decorator, Node, Animation, Asset, Label, Vec3, Color, isValid, UITransform, v3 } from 'cc';
import { Manager } from '../manager';
import { uiManager, UI_TYPE_BY } from '../managers/ui-manager';
import { i18n } from '../managers/language-manager';
import { setSecuretNodeString, } from '../../../game/ui-commonset';

export class Toast {
    private static toastPool: NodePool = new NodePool();
    private static currencyPool: NodePool = new NodePool();

    static async showToast(tipContent: string, posY: number = 0, delayTime?: number) {
        let uiToastNode = Toast.toastPool.get();
        const toastParentNode: Node = uiManager.getLayer(UI_TYPE_BY.UI_TOAST);
        if (!uiToastNode) {
            const toastPrefab: Prefab = await Manager.bundleManager.load<Prefab>('common://toast', Prefab);
            if (toastPrefab) {
                uiToastNode = instantiate(toastPrefab);
            } else {
                console.error('loadtoasterror!');
                return;
            }
        }
        uiToastNode.parent = toastParentNode;
        uiToastNode.setPosition(0, posY);
        uiToastNode.active = false;

        setSecuretNodeString(uiToastNode.getChildByPath('content/lab_content'), i18n.f(tipContent));

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
        Toast.showToastStep2(uiToastNode, delayTime);
    }

    static showToastStep2(uiToastNode: Node, delayTime?: number) {
        const anim = uiToastNode.getChildByName('content')!.getComponent(Animation)!;
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
