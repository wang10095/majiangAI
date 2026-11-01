import { _decorator } from "cc";
import { SuperPanel } from "../../frame/center/components/super-panel";
import { Node } from "cc";
import { Label } from "cc";
import { DataManager } from "../data/data-manager";
import { BATTLE_STAGE_TYPE } from "../data/data-battle";

const { ccclass, property } = _decorator

@ccclass('GameChallengeHelp')
export class GameChallengeHelp extends SuperPanel {
    @property({
        type: Label
    })
    labTitle: Label = null;

    @property({
        type: [Node],
        tooltip: ''
    })
    nodeContent: Node[] = [];

    protected onLoad(): void {
        super.onLoad();

    }

    _type: BATTLE_STAGE_TYPE = null;
    show(battleType: BATTLE_STAGE_TYPE) {
        this._type = battleType;
    }

    start(): void {
        super.start();

        this.initUI();
    }

    initUI() {
        if (this._type === BATTLE_STAGE_TYPE.CatchFish) {
            this.labTitle.string = '深海捕鱼规则'
        } else if (this._type === BATTLE_STAGE_TYPE.Caocao) {
            this.labTitle.string = '曹贼休走规则'
        }

        this.nodeContent.forEach((node) => {
            node.active = false;
        })
        this.nodeContent[this._type - 1].active = true;

    }





}