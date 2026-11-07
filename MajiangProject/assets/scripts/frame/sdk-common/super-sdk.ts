import { _decorator, log } from 'cc';

import { ReportEventType } from './TE-sdk';


const { ccclass, property } = _decorator;

export class SuperSdk {
    public adWithUUID: Record<string, any> = {};
    protected rewardedVideoAds: Record<string, any> = {};
    // 新版本检测
    checkHaveNewVersion() {
        console.log('checkHaveNewVersion');
    }

    showToast(des: string) { }

    // 游戏包信息
    getGamePackageInfo() {
        console.log('getGamePackageInfo');
        return null;
    }

    // 登录接口
    login(call?: (code: any) => void) {
        console.log('login');
    }

    // 用户信息接口
    getUserInfo(call: (res: any) => void) {
        console.log('getUserInfo');
    }
    getUserInfoSync() {
        return null;
    }

    requireUserPrivacy() {
        console.log('requireUserPrivacy');
    }

    // 获取归因
    getOptionsSync() {
        console.log('getOptionsSync');
        return null;
    }

    // 获取系统信息
    getSystemInfoSync() {
        console.log('getSystemInfoSync');
        return null;
    }

    getDeviceInfo() {
        console.log('getDeviceInfo');
        return null;
    }

    // 开始录屏
    startRecoder() {
        console.log('startRecoder');
    }

    // 结束录屏
    stopRecoder() {
        console.log('stopRecoder');
    }

    // 分享
    shareGame(type: 'video' | 'link' | 'article' | 'token', filePathOrTempId: string) { }

    // 联系GM
    connectGM() { }

    // 充值接口
    //payRecharge(orderId: string, rmbNum: number, shopItemId: string, shopItemName: string, callBack: (statusCode: 0 | 1 | 2 | 3) => void) { }

    checkSideBarEnable(call: (res: boolean) => void) {
        console.log('checkSideBarEnable');
    }

    getGameLaunchFrom() {
        console.log('getGameLaunchFrom');
        return null;
    }

    // 切换到侧边栏入口
    nativeToByScene() {
        console.log('nativeToByScene');
    }

    /**
     *  上报日志
     *  @type common 平台统一 game 游戏自己的数据统计
     */
    // reportTracking(eventType: ReportEventType | string, data: Record<string, any>, immediate = false) {
    //     return;
    //     // TESdk.getInstance().reportTrackingLog(eventType, data);
    // }

    // // 广告日志
    // reportTrackingAd(eventType: ReportEventType, data: Record<string, any>) {
    //     return;
    //     // TESdk.getInstance().reportTrackingAdLog(eventType, data);
    // }
    /**
     * 重启小游戏
     */
    resetartMiniGame() { }

    vibrateShort() { }

    keepGameScreenOn() { }

    // 唯一值
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (Math.random() * 16) | 0,
                v = c == 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    // 提前创建广告
    createRewardedVideoAd(adId: string) { }
    // 播放广告
    showRewardedVideoAd(adId: string, call: (res: any) => void, branchId) { }

    // 销毁实例
    destroyRewardedVideoAdBy(adId: string) { }

    // 小游戏进入前台或后天展示
    addListenerBackOrFront(call: (tag: string) => void) { }

    // 复制文本
    copyText(txt: string) { }

    requestDownload(url: string, option: { method: 'GET' | 'POST'; data?: any }, call: (err, data) => void) { }

    async downloadFile(url: string, saveFilePath: string, downCount = 0): Promise<string> {
        return null;
    }
    // 加快触发 JS 引擎 Garbage Collection（垃圾回收），GC 时机是 JS 引擎控制的，并不能保证调用后马上触发 GC。
    requestTriggerGC() { }

    checkNetType(call: (type: string) => void) { }

    // ---------- 文件处理 ---------------
    // 判断是否存在文件
    isExistFile(filePath: string): boolean {
        return false;
    }

    // 用户目录
    writeFile(fileName: string, content: string): boolean {
        return false;
    }

    // 复制文件
    copyFile(srcPath: string, distPath: string): boolean {
        return false;
    }

    // 创建文件路径
    mkDir(dirPath: string): boolean {
        return false;
    }

    rmDir(dirPath: string): boolean {
        return false;
    }

    // 读取文件
    readFile(filePath: string): string | ArrayBuffer {
        return '';
    }
    // 解压文件
    async unzipFile(zipPath: string, targetPath: string) { }

    // 删除文件
    deleteFile(filePath: string): boolean {
        return false;
    }

    onShareAppMessage(call: (res: any) => void) { }
    showShareMenu() { }
    getFriendCloudStorage() { }

    setUserCloudStorage(data) {

    }

    postMessage(data) { }

    getFuzzyLocation(call) { }

    shareAppMessage(data) { }
}
