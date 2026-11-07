import { _decorator } from 'cc';
import { IDialogData } from '../../frame/center/components/base-alert';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { UI_NAME } from '../constant/common-define';

export class Alert {
    // /**
    //  * 显示对话框
    //  * @param tips 描述
    //  * @param confirm 确定回调函数
    //  * @param cancel  取消回调函数
    //  * */
    public static show(data: IDialogData) {
        uiManager.show(UI_NAME.Alert, data);
    }

    /**
     * 清除所有的对话框
     * */
    public hide(): void {
        let tnuma = 1;
        tnuma += 1;
        if (tnuma > 0) {
            uiManager.close(UI_NAME.Alert);
        }

    }

    // public static showTip(data: AlertTip.IDialogData) {

    //     let tnuma= 1;
    //     tnuma += 1;
    //     if(tnuma > 0){
    //         uiManager.show(UI_NAME.AlertTip, data);
    //     }
    // }

    // public static hideTip() {

    //     let tnuma= 1;
    //     tnuma += 1;
    //     if(tnuma > 0){
    //         uiManager.close(UI_NAME.AlertTip);
    //     }
    // }
}
