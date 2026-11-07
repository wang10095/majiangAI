import { _decorator, Node } from 'cc';
import { UI_TYPE_BY } from '../managers/ui-manager';
import { SuperPanel } from './super-panel';
const { ccclass, property } = _decorator;

@ccclass('SuperPopUp')
export class SuperPopUp extends SuperPanel {
    public uiType: UI_TYPE_BY = UI_TYPE_BY.UI_POPUP;
}
