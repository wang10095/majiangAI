import { Node, UIOpacity, UITransform, _decorator, builtinResMgr, tween, v2, v3 } from 'cc';
import { SuperPanel } from '../../frame/center/components/super-panel';
import { UI_EVENT_NAME } from '../constant/common-define';
import { BATTLE_END_NEXT_OPERATION } from '../data/data-battle';
import Utils from '../../frame/center/utils/utils';

const { ccclass, property } = _decorator;

@ccclass('HelpPanel')
export class HelpPanel extends SuperPanel {
    @property({
        type: Node,
    })
    nodeRedBox: Node = null;

    show(node) {
        // if (node) {
        //     this.nodeRedBox.active = false;
        //     tween(this.nodeRedBox).delay(0.2).set({ active: true }).delay(0.2).set({ active: false }).union().repeat(5).call(() => {
        //         this.nodeRedBox.active = false;
        //     }).start()
        // }
    }

    protected onLoad(): void {
        super.onLoad();

        // Utils.storage.setItem('game_lose_count', '0'); ???????
    }
    onClickBackHome() {
        this.dispatchEmit(UI_EVENT_NAME.GAME_NEXT, BATTLE_END_NEXT_OPERATION.NEXTSTAGE);
        this.close();
    }

}