import { isMiniGame, isWeChat } from "../../game/game-define";
import Utils from "../center/utils/utils";


export enum WechatReportType {
    None = 0,
    Show = 1,
    Touch = 2,
}

export const WechatReportBranchId = {
    failShare: 'BCBgAAoXHx5d0PF6njwB3b',
    failUnShare: 'BCBgAAoXHx5d0PF6njwB3c',
    reviveByTime: 'BCBgAAoXHx5d0PF6njwB3B',
    reviveByLine: 'BCBgAAoXHx5d0PF6njwB3P',
    PropAds_3: 'BCBgAAoXHx5d0PF6njwB3N',
    PropAds_2: 'BCBgAAoXHx5d0PF6njwB3L',
    PropAds_1: 'BCBgAAoXHx5d0PF6njwB3J',
}

class WeReport extends Utils.Singleton {

    failSceneShare(_type) {
        if (_type === WechatReportType.Show) {
            this.reportInfo(WechatReportBranchId.failShare, '', 1);
        } else if (_type === WechatReportType.Touch) {
            this.reportInfo(WechatReportBranchId.failShare, '', 2);
        }
    }

    failSceneUnShare(_type) {
        if (_type === WechatReportType.Show) {
            this.reportInfo(WechatReportBranchId.failUnShare, '', 1);
        } else if (_type === WechatReportType.Touch) {
            this.reportInfo(WechatReportBranchId.failUnShare, '', 2);
        }
    }

    reviveSceneTime(_type) {
        if (_type === WechatReportType.Show) {
            this.reportInfo(WechatReportBranchId.reviveByTime, '', 1);
        } else if (_type === WechatReportType.Touch) {
            this.reportInfo(WechatReportBranchId.reviveByTime, '', 2);
        }
    }

    reviveSceneLine(_type) {
        if (_type === WechatReportType.Show) {
            this.reportInfo(WechatReportBranchId.reviveByLine, '', 1);
        } else if (_type === WechatReportType.Touch) {
            this.reportInfo(WechatReportBranchId.reviveByLine, '', 2);
        }
    }


    propScene_3(_type) {
        if (_type === WechatReportType.Show) {
            this.reportInfo(WechatReportBranchId.PropAds_3, '', 1);
        } else if (_type === WechatReportType.Touch) {
            this.reportInfo(WechatReportBranchId.PropAds_3, '', 2);
        }
    }


    propScene_2(_type) {
        if (_type === WechatReportType.Show) {
            this.reportInfo(WechatReportBranchId.PropAds_2, '', 1);
        } else if (_type === WechatReportType.Touch) {
            this.reportInfo(WechatReportBranchId.PropAds_2, '', 2);
        }
    }


    propScene_1(_type) {
        if (_type === WechatReportType.Show) {
            this.reportInfo(WechatReportBranchId.PropAds_1, '', 1);
        } else if (_type === WechatReportType.Touch) {
            this.reportInfo(WechatReportBranchId.PropAds_1, '', 2);
        }
    }

    reportInfo(branchId: string, branchDim: string = '', eventType: number) {
        if (!isWeChat) {
            return;
        }
        // step1. 广告前场景-曝光上报
        // 将以下代码片段埋入如观看广告按钮的曝光
        wx.reportUserBehaviorBranchAnalytics({
            branchId: branchId,
            branchDim: branchDim, // 自定义维度(可选)：类型String，取值[1,100]，必须为整数，当上传类型不符时不统计
            eventType: eventType // 1：曝光； 2：点击
        });


    }


}


export const WechatReport = WeReport.getInstance();