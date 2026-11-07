import { _decorator, Component, Event, Label, Node, RichText } from 'cc';
import { SuperPanel } from './super-panel';
import { UI_TYPE_BY } from '../managers/ui-manager';
import { i18n } from '../managers/language-manager';

const { ccclass, property } = _decorator;

export interface IDialogInfo {
    tipContent: string; // 提示内容
    title?: string; // 标题
    confirmStr: string; // 确定按钮描述
    cancelStr?: string; // 取消按钮描述
    close?: boolean; //关闭按钮
}

// 对话框参数声明
export interface IDialogData {
    info: IDialogInfo; // 对话框信息
    confirm?: Function; // 确定回调
    cancel?: Function; // 取消回调
    // remindInfo?: number[]; // 提醒信息：本日登录提示等
    close?: Function;//关闭按钮
}

@ccclass('BaseAlert')
export class BaseAlert extends SuperPanel {
    public uiType: UI_TYPE_BY = UI_TYPE_BY.UI_ALERT;
    @property({
        type: Node,
        // tooltip: '标题'
    })
    private titleNode: Node;

    @property({
        type: Node,
        // tooltip: '描述'
    })
    private descNode: Node;

    @property({
        type: Node,
        //tooltip: '确认按钮'
    })
    private btnOk: Node;

    @property({
        type: Node,
        // tooltip: '取消按钮'
    })
    private btnCancel: Node;

    @property({
        type: Node,
        //tooltip: '关闭按钮'
    })
    private btnClose: Node;

    @property({
        type: Node,
        //tooltip: '提醒节点'
    })
    protected remindNode: Node;

    private curDlgData: IDialogData;
    start() {
        super.start();
    }

    show(dlgData: IDialogData) {
        super.show(dlgData);
        this.curDlgData = dlgData;

        const { tipContent, title, confirmStr, cancelStr, close } = dlgData.info;

        if (i18n.f(title)) {
            this.titleNode.getComponent(Label).string = i18n.f(title);
        } else {
            this.titleNode.getComponent(Label).string = i18n.f('common_alert_title');
        }

        // if(this.descNode ){
        //     if (this.descNode.getComponent(Label)) {
        //         this.descNode.getComponent(Label).string = i18n.f(tipContent) || tipContent || '';
        //     } else if (this.descNode.getComponent(RichText)) {
        //         this.descNode.getComponent(RichText).string = i18n.f(tipContent) || tipContent || '';
        //     }
        // }
        if (this.descNode && this.descNode.getComponent(Label)) {
            this.descNode.getComponent(Label).string = i18n.f(tipContent) || tipContent || '';
        }
        if (this.descNode && this.descNode.getComponent(RichText)) {
            this.descNode.getComponent(RichText).string = i18n.f(tipContent) || tipContent || '';
        }

        if (this.btnOk) {
            this.btnOk.active = confirmStr !== undefined;
        }


        if (confirmStr) {
            this.btnOk.getChildByName('name').getComponent(Label).string = i18n.f(confirmStr);
        }
        this.btnCancel.active = cancelStr !== undefined;
        if (cancelStr) {
            this.btnCancel.getChildByName('name').getComponent(Label).string = i18n.f(cancelStr);
        }
        if (this.btnClose) {
            this.btnClose.active = close !== undefined;
        }

        // if (this.remindNode) {
        //     if (data.remindInfo) {
        //         this.remindNode.active = true;
        //         this.remindNode.getComponent(StorageRemindButton).setData(data.remindInfo);
        //     } else {
        //         this.remindNode.active = false;
        //     }
        // }
    }

    private ConfirmBtnClick(event: Event) {
        this.curDlgData?.confirm && this.curDlgData?.confirm();
        this.close();
    }

    private CancelBtnClick(event: Event) {
        this.curDlgData?.cancel && this.curDlgData.cancel();
        this.close();
    }

    close() {
        super.close();
        this.curDlgData?.close && this.curDlgData.close();
    }
}
