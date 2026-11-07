import { _decorator } from 'cc';
import Utils from '../../frame/center/utils/utils';
import { isBrowser, isByteDance, isWeChat } from '../../game/game-define';
import { SuperSdk } from './super-sdk';
import { ByteDanceSdk } from './tt-sdk';
import { WechatSdk } from './wechat-sdk';
import { ReportEventType } from './TE-sdk';

const { ccclass, property } = _decorator;

// 整合小游戏sdk，统一化接口
export class SdkUtils extends Utils.Singleton {
    private miniPlatformSdk: SuperSdk;

    private gameFrontTime = Date.now();
    // public minisdkLoginCode: string; // 第三方登录的code标记
    constructor() {
        super();
        this.init();
    }

    init() {
        if (isWeChat) {
            this.miniPlatformSdk = new WechatSdk();
        } else if (isByteDance) {
            this.miniPlatformSdk = new ByteDanceSdk();
        }
        if (!this.miniPlatformSdk) {
            return;
        }
        this.addListenerBackOrFront((tag: string) => {
            console.log('WebTrackingSdk tag:', tag);
            if (tag === 'front') {  //切入前台
                // this.gameFrontTime = Date.now();
                // this.miniPlatformSdk.reportTracking(ReportEventType.B_ENTRY_PAGE, {
                //     act_page: 'game' //页面名称
                // });
            } else if (tag === 'back') { //切入后台 切出游戏
                // this.miniPlatformSdk.reportTracking(ReportEventType.B_LEAVE_PAGE, {
                //     act_page: 'game', //页面名称
                //     duration: Date.now() - this.gameFrontTime //毫秒
                // });
            }
        });
    }

    // 游戏包信息
    getGamePackageInfo() {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.getGamePackageInfo();
    }

    // 新版本检测
    checkHaveNewVersion() {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.checkHaveNewVersion();
    }

    showToast(des: string) {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.showToast(des);
    }

    // 登录
    async login(call?: (code: any) => void) {
        if (!this.miniPlatformSdk) {
            return;
        }

        return new Promise((resolve, reject) => {
            this.miniPlatformSdk.login(res => {
                if (res && res.code) {
                    call && call(res);
                    resolve(res);
                } else {
                    call && call(null);
                    reject();
                }
            });
        });
    }

    // 用户信息
    getUserInfo(call: (res: any) => void) {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.getUserInfo(call);
    }

    getUserInfoSync() {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.getUserInfoSync();
    }

    // 获取归因
    getOptionsSync() {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.getOptionsSync();
    }

    // 获取系统信息
    getSystemInfoSync() {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.getSystemInfoSync();
    }

    // 获取设备信息
    getDeviceInfo() {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.getDeviceInfo();
    }

    // 用户隐私
    requireUserPrivacy() {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.requireUserPrivacy();
    }



    // /**
    //  *  充值接口
    //  * @param orderId 业务段订单号
    //  * @param gameDiamondNum 对应游戏中的钻石数量
    //  * @param shopItemId 商品唯一标识
    //  * @param shopItemName 商品名称
    //  * @param callBack 充值返回
    //  * @returns
    //  */
    // payRecharge(orderId: string, gameDiamondNum: number, shopItemId: string, shopItemName: string, callBack: (statusCode: 0 | 1 | 2 | 3) => void) {
    //     if (!this.miniPlatformSdk) {
    //         return;
    //     }
    //     this.miniPlatformSdk.payRecharge(orderId, gameDiamondNum, shopItemId, shopItemName, callBack);
    // }

    // 侧边栏是否可用
    checkSideBarEnable(call: (res: boolean) => void) {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.checkSideBarEnable(call);
    }

    // 游戏启动场景
    getGameLaunchFrom() {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.getGameLaunchFrom();
    }

    /**
     * 重启小游戏
     */
    resetartMiniGame() {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.resetartMiniGame();
    }

    //手机短暂震动
    vibrateShort() {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.vibrateShort();
    }

    /**
     *  屏幕保持唤醒
     */
    keepGameScreenOn() {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.keepGameScreenOn();
    }

    // 创建广告
    createRewardedVideoAd(adId: string) {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.createRewardedVideoAd(adId);
    }

    // 播放广告
    showRewardedVideoAd(adId: string, call: (res: any) => void, branchId: string) {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.showRewardedVideoAd(adId, call, branchId);
    }

    // 填充广告的唯一标识
    getAdFillUUID(adId: string): string {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.adWithUUID[adId];
    }

    // 销毁实例
    destroyRewardedVideoAdBy(videoAd: any) {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.destroyRewardedVideoAdBy(videoAd);
    }
    // 切换到侧边栏入口
    nativeToByScene() {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.nativeToByScene();
    }
    /**
     *  上报日志
     *  @type common 平台统一 game 游戏自己的数据统计
     */
    // reportTracking(eventType: ReportEventType | string, data: Record<string, any>, immediate = false) {
    //     if (!this.miniPlatformSdk && !isBrowser) {
    //         return;
    //     }
    //     // if (isBrowser) {
    //     //     console.log('=======reportTracking========', eventType, data);
    //     //     webtrackingSdk.reportTrackingLog(eventType, data);
    //     // } else {
    //     //     this.miniPlatformSdk.reportTracking(eventType, data);
    //     // }
    // }

    // 开始录屏
    startRecoder() {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.startRecoder();
    }

    // 停止录屏
    stopRecoder() {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.stopRecoder();
    }

    /**
     * 视频分享
     * @param type
     * @param filePath 资源地址或者模版id
     */
    shareGame(type: 'video' | 'link' | 'article' | 'token', filePathOrTempId: string) {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.shareGame(type, filePathOrTempId);
    }
    // 联系GM
    connectGM() {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.connectGM();
    }


    // reportTrackingAd(eventType: ReportEventType, data: Record<string, any>) {
    //     // if (!this.miniPlatformSdk) {
    //     //     return;
    //     // }
    //     // const adUUID = this.getAdFillUUID(data.unit_id);
    //     // data['uuid'] = adUUID;
    //     // this.miniPlatformSdk.reportTrackingAd(eventType, data);
    // }


    // 小游戏进入前台或后天展示
    addListenerBackOrFront(call: (tag: string) => void) {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.addListenerBackOrFront(call);
    }

    // 复制文本
    copyText(txt: string) {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.copyText(txt);
    }

    // 请求文件下载
    requestDownload(url: string, option: { method: 'GET' | 'POST'; data?: any }, call: (err, data) => void) {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.requestDownload(url, option, call);
    }

    async downloadFile(url: string, saveFilePath: string, downCount = 0) {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.downloadFile(url, saveFilePath, downCount);
    }

    requestTriggerGC() {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.requestTriggerGC();
    }

    checkNetType(call: (type: string) => void) {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.checkNetType(call);
    }
    // ---------- 文件处理 ---------------
    // 判断是否存在文件
    isExistFile(filePath: string): boolean {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.isExistFile(filePath);
    }

    // 用户目录
    writeFile(fileName: string, content: string): boolean {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.writeFile(fileName, content);
    }

    // 复制文件
    copyFile(srcPath: string, distPath: string): boolean {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.copyFile(srcPath, distPath);
    }

    // 创建文件路径
    mkDir(dirPath: string): boolean {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.mkDir(dirPath);
    }

    // 移除文件夹
    rmDir(dirPath: string): boolean {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.rmDir(dirPath);
    }

    // 读取文件
    readFile(filePath: string): string | ArrayBuffer {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.readFile(filePath);
    }
    // 解压文件
    async unzipFile(zipPath: string, targetPath: string) {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.unzipFile(zipPath, targetPath);
    }

    // 删除文件
    deleteFile(filePath: string): boolean {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.deleteFile(filePath);
    }

    onShareAppMessage(call: (res: any) => void) {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.onShareAppMessage(call);
    }

    showShareMenu() {
        if (!this.miniPlatformSdk) {
            return;
        }
        this.miniPlatformSdk.showShareMenu();
    }

    getFriendCloudStorage() {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.getFriendCloudStorage();
    }

    setUserCloudStorage(data) {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.setUserCloudStorage(data);
    }

    postMessage(data) {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.postMessage(data);
    }

    getFuzzyLocation(call) {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.shareAppMessage(call);
    }

    shareAppMessage(data) {
        if (!this.miniPlatformSdk) {
            return;
        }
        return this.miniPlatformSdk.shareAppMessage(data);
    }
}
export const sdkUtils = SdkUtils.getInstance();
