import { _decorator, Node } from 'cc';
// import { SuperPanel } from '../../frame/center/components/super-panel';
// import { Label } from 'cc';
// import { RichText } from 'cc';

// const { ccclass, property } = _decorator;


// 对话框参数声明
// export interface IDialogData {
//     confirm?: Function; // 确定回调
//     desc?: string; // 文本内容信息
//     remark?: string; // 备注提示信息
//     needCheck?: boolean; // 是否需要检查提示
// }


// @ccclass('AlertTip')
// export class AlertTip extends SuperPanel {
//     @property({
//         type: Node,
//         displayName: '描述'
//     })
//     labDescNode: Node;

//     @property({
//         type: Node,
//         displayName: '备注'
//     })
//     labRemarkNode: Node;

//     @property({
//         type: Node,
//         displayName: '是否不在提示节点'
//     })
//     nodeCheck: Node;

//     private _mData: IDialogData = null;

//     start() {
//         super.start()
//     }

//     show(data: IDialogData) {
//         this._mData = data;
//         this.labDescNode.getComponent(RichText).string = data.desc || '';
//         this.labRemarkNode.getComponent(Label).string = data.remark || '';
//         this.showStep2(data);
//     }
//     protected showStep2(data: IDialogData){
//         if (!data.remark) {
//             this.labRemarkNode.active = false;
//         }
//         if (data.needCheck) {
//             this.nodeCheck.active = true;
//         }
//     }

//     onBtnClickConfirm() {
//         if (this._mData?.confirm) {
//             this._mData.confirm?.();
//         }
//         this.close();
//     }
// } 