// import { _decorator, Component, Label, RichText } from 'cc';
// import { i18n } from '../managers/language-manager';
// import Utils from '../utils/utils';
// const { ccclass, property } = _decorator;

// type TextComponent = RichText | Label | null;
// @ccclass('LanguageLabel')
// export class LanguageLabel extends Component {
//     @property({ displayName: 'key' })
//     key: string = '';

//     txt_label: TextComponent = null;

//     private cacheObject: object; // 激活之前赋值了
//     onLoad() {
//         // Manager.eventManager.on(LanguageEvent.CHANGE, this.updateLabel, this);
//         let txt_label: TextComponent = this.getComponent(Label);
//         if (!txt_label) {
//             txt_label = this.getComponent(RichText) as RichText;
//         }
//         if (!this.enabled) {
//             return;
//         }
//         this.txt_label = txt_label;
//         if (this.key) {
//             this.updateTxtLabel();
//             if (this.cacheObject) {
//                 this.setString(this.cacheObject);
//                 this.cacheObject = null;
//             }
//         }
//     }

//     onDestroy() {
//         // Manager.eventManager.off(LanguageEvent.CHANGE, this);
//     }

//     /**
//      * 动态修改key
//      * @param args
//      */
//     initKey(...args: any[]) {
//         this.key = Utils.utils.stringFormat(this.key, args);
//         this.updateTxtLabel();
//     }

//     /**
//      * 格式化字串
//      * @param obj
//      */
//     setString(obj: object) {
//         let info: string = Utils.utils.stringFormat(i18n.f(this.key), obj);
//         info = info.replace('\\n', '\n');
//         info = info.replace('\\t', '\t');
//         if (!this.txt_label) {
//             this.cacheObject = obj;
//         } else {
//             this.txt_label.string = info;
//         }
//     }

//     updateTxtLabel() {
//         let str_info: string = i18n.f(this.key);
//         str_info = str_info.replace('\\n', '\n');
//         str_info = str_info.replace('\\t', '\t');
//         if(this.txt_label){
//             this.txt_label.string = str_info;
//         }
//     }
// }
