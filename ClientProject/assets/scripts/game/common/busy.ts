import { _decorator, Component, Node, game, director, Prefab, instantiate, Animation, log, isValid } from 'cc';
import { Manager } from '../../frame/center/manager';
import { UI_TYPE_BY, uiManager } from '../../frame/center/managers/ui-manager';


export class BusyLayer {
    private static busyNode: Node;
    private static isBusy = false;
    private static timeOutID: any;
    private static timeOverTimeID: any;
    static async show() {
        BusyLayer.isBusy = true;
        if (!BusyLayer.busyNode || !isValid(BusyLayer.busyNode)) {
            const uiPrefab: Prefab = await Manager.bundleManager.load<Prefab>('common://busy', Prefab);
            if (uiPrefab) {
                BusyLayer.busyNode = instantiate(uiPrefab);
                BusyLayer.busyNode.parent = uiManager.getLayer(UI_TYPE_BY.UI_ALERT);
                BusyLayer.busyNode!.active = false;
            } else {
                console.error('loas busy error!');
                return;
            }
        }
        BusyLayer.timeOutID = setTimeout(() => {
            if (!BusyLayer.isBusy || !isValid(BusyLayer.busyNode)) {
                return;
            }

            BusyLayer.busyNode!.active = true;
            const rotatetAnim = BusyLayer.busyNode!.getComponent(Animation)!;
            rotatetAnim?.play();
        }, 800);

        BusyLayer.timeOverTimeID = setTimeout(() => {
            BusyLayer.hide();
        }, 5000);
    }

    static hide() {
        BusyLayer.isBusy = false;
        if (BusyLayer.busyNode && !BusyLayer.isBusy) {
            clearTimeout(BusyLayer.timeOutID);
            clearTimeout(BusyLayer.timeOverTimeID);
            BusyLayer.isBusy = false;
            BusyLayer.busyNode.active = false;
        }
    }
}
