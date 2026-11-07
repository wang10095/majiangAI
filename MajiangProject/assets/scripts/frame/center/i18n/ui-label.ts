import { _decorator, Component, Label, Node, RichText } from 'cc';
import { i18n } from '../managers/language-manager';
import { SuperComponent } from '../components/super-component';
const { ccclass, property, requireComponent } = _decorator;


@ccclass('FontLabel')
export class FontLabel extends SuperComponent {
    protected onLoad(): void {
        this.registerEmit('font_loaded', this.updateLabFont, this);
        this.updateLabFont();
    }

    private getLabelCom() {
        let labelCom: Label | RichText = this.node?.getComponent(Label);
        if (!labelCom) {
            labelCom = this.node?.getComponent(RichText);
        }
        return labelCom;
    }

    private updateLabFont() {
        const labelCom: Label | RichText = this.getLabelCom();
        if (labelCom && labelCom.useSystemFont && i18n.globalFont) {
            // 默认使用系统字体，统一替换为指定字体
            labelCom.useSystemFont = false;
            labelCom.font = i18n.globalFont;
        } else {
            labelCom.useSystemFont = true;
        }
    }
}
