
// import { DATA_NAME } from '../constant/common-define';
// import { SuperData } from './super-data';
// import { DataManager } from './data-manager';
// export enum AB_TEST {
//     AB_bundle_show = 'AB_bundle_show',
// }

// export enum AB_GROUP {
//     s0 = 's0',
//     s1 = 's1',
// }

// export class DataABTest extends SuperData {
//     name = DATA_NAME.ABTEST_DATA;
//     ab_info?: { [key: string]: AB_GROUP };
//     setData(ab_info?: { [key: string]: string }) {
//         this.ab_info = {};
//         if (ab_info) {
//             for (const key in ab_info) {
//                 this.ab_info[key] = AB_GROUP[ab_info[key]] || AB_GROUP.s0;
//             }
//         }
//     }

//     getGroup(groupName: AB_TEST): AB_GROUP {
//         return this.ab_info?.[groupName] || AB_GROUP.s0;
//     }

//     resetConfigDataByAbTest() {
//         if (DataManager.abTest.getGroup(AB_TEST.sell_ab) == AB_GROUP.s1) {
//             // REMOTE_RES_URL.LIMIT_GIFT_TITLE = 'res/limit_gift_new/limit_gift_title/{0}.png';
//             // REMOTE_RES_URL.LIMIT_GIFT_ICON = 'res/limit_gift_new/limit_gift_icon/{0}.png';
//             // REMOTE_RES_URL.LIMIT_GIFT_BG = 'res/limit_gift_new/limit_gift_bg/{0}.png';
//         }
//     }

//     // 清空数据
//     public clear(): void {
//         super.clear();
//         this.ab_info = null;
//     }
// }
