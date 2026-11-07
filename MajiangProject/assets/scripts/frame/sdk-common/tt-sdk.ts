import { _decorator, assetManager } from 'cc';
import { SuperSdk } from './super-sdk';
import { Manager } from '../center/manager';
import { Toast } from '../center/components/toast';
// import Logger from '../core/utils/logger';
// import { Toast } from '../core/component/toast';
// import { Engine } from '../core/engine';

const { ccclass, property } = _decorator;

export class ByteDanceSdk extends SuperSdk {
    private optionsSync: any; // 归因参数 对于平台信息：pages/diandian/index

    private gameRecorderManager: any;

    private gameSystemInfo: any;
    private useInfoData: any;
    private gameLaunchOptions: any;

    constructor() {
        super();
        tt.onMemoryWarning(function () {
            console.log('onMemoryWarning');
            this.requestTriggerGC();
            Manager.eventManager.emit('MemoryWarning');
        });
    }

    // 新版本检测
    checkNewVersion() {
        const updateManager = tt.getUpdateManager();
        updateManager.onUpdateReady(res => {
            tt.showModal({
                title: '更新提示',
                content: '新版本已经准备好，是否重启小游戏？',
                success: res => {
                    if (res.confirm) {
                        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                        updateManager.applyUpdate();
                    }
                }
            });
        });

        updateManager.onUpdateFailed(err => {
            // 新的版本下载失败
            console.log('版本下载失败原因', err);
            tt.showToast({
                title: '新版本下载失败，请稍后再试',
                icon: 'none'
            });
        });
    }

    showToast(des: string) {
        tt.showToast({
            title: des,
            icon: 'none'
        });
    }

    // 游戏包信息
    getGamePackageInfo() {
        const packageInfo = {};
        //小程序类型
        packageInfo['app_type'] = 'douyin';
        //小程序包名
        packageInfo['package_name'] = 'qqemoji' + 'dy';
        //游戏版本号
        packageInfo['game_version'] = getGameGlobal().gameVersion;
        //策划配置版本号
        packageInfo['config_version'] = getGameGlobal().configVersion;
        //oss对于的channel名称
        packageInfo['channel_name'] = 'ttgame';
        return packageInfo;
    }

    // 登录接口
    login(call: (code: any) => void) {
        tt.login({
            force: true,
            success(res) {
                console.log(`login 调用成功${res.code} ${res.anonymousCode}`);
                call && call(res);
            },
            fail(res) {
                console.log(`login 调用失败`);
            }
        });

        this.gameLaunchOptions = getGameGlobal().launchOptions;
        console.log('gameLaunchOptions', this.gameLaunchOptions);
    }

    // 用户隐私
    requireUserPrivacy() {
        console.log(`requireUserPrivacy`);
    }

    // 获取用户信息
    getUserInfo(call: (res: any) => void) {
        if (!this.useInfoData) {
            // 获取用户信息
            const self = this;
            tt.getUserInfo({
                // withCredentials: true,
                // withRealNameAuthenticationInfo: true,
                success(res) {
                    self.useInfoData = res.userInfo;
                    call && call(res.userInfo);
                },
                fail(res) {
                    console.log(`getUserInfo 调用失败`, res.errMsg);
                    call && call(null);
                }
            });
        }
        call && call(this.useInfoData);
        return this.useInfoData;
    }

    getUserInfoSync() {
        return this.useInfoData;
    }

    // 获取归因
    getOptionsSync() {
        if (!this.optionsSync) {
            if (tt.getLaunchOptionsSync) {
                this.optionsSync = tt.getLaunchOptionsSync();
            } else if (tt.getEnterOptionsSync) {
                this.optionsSync = tt.getEnterOptionsSync();
            }
        }
        // console.log(`getOptionsSync 调用失败`, this.optionsSync);
        return this.optionsSync;
    }

    // 获取系统信息
    getSystemInfoSync() {
        if (!this.gameSystemInfo) {
            this.gameSystemInfo = wx.getSystemInfoSync();
        }
        return this.gameSystemInfo;
    }

    // 屏幕录制
    initGameRecorderManager() {
        if (!this.gameRecorderManager) {
            this.gameRecorderManager = tt.getGameRecorderManager();
            this.gameRecorderManager.onStart(res => {
                console.log('record start:', res);
                // do something;
            });

            this.gameRecorderManager.onStop(res => {
                console.log('record stop:', res.videoPath);
                // Alert.show({
                //     info: {
                //         tips: '录制好了，快和其他小伙伴分享精彩时刻',
                //         title: '',
                //         confirmStr: '立即分享',
                //         cancelStr: '取消分享'
                //     },
                //     confirm: () => {
                //         this.shareGame('video', res.videoPath);
                //     },
                //     cancel: () => {}
                // });
            });
            this.gameRecorderManager.onError(res => {
                console.log('record error:', res);
                // do something;
            });
        }
    }

    // 开始录屏
    startRecoder() {
        if (!this.gameRecorderManager) {
            this.initGameRecorderManager();
        }
        if (this.gameRecorderManager) {
            this.gameRecorderManager.start({
                duration: 60
            });
        }
    }

    // 停止录屏
    stopRecoder() {
        if (this.gameRecorderManager) {
            this.gameRecorderManager.stop();
        }
    }

    // 检测侧边栏可用状态
    checkSideBarEnable(call: (res: boolean) => void) {
        console.log('check checkSideBarEnable');
        tt.checkScene({
            scene: 'sidebar',
            success: res => {
                console.log('check scene success:', res.isExist);
                call(true);
            },
            fail: res => {
                console.log('check scene fail:', res);
                call(false);
            }
        });
    }

    // 启动场景
    getGameLaunchFrom() {
        return this.gameLaunchOptions;
    }

    // 切换到侧边栏入口
    nativeToScene() {
        tt.navigateToScene({
            scene: 'sidebar',
            success: res => {
                console.log('navigate to scene success');
                // 跳转成功回调逻辑
            },
            fail: res => {
                console.log('navigate to scene fail: ', res);
                // 跳转失败回调逻辑
            }
        });
    }

    /**
     * 视频分享
     * @param type
     * @param filePath 资源地址或者模版id
     */
    shareGame(type: 'video' | 'link' | 'article' | 'token', filePathOrTempId: string) {
        if (type === 'link') {
            // 以默认链接分享方式为例
            tt.shareAppMessage({
                templateId: filePathOrTempId, // 替换成通过审核的分享ID
                query: '',
                success() {
                    Toast.showToast('分享成功');
                },
                fail(e) {
                    Toast.showToast('分享失败');
                }
            });
        } else if (type === 'article') {
            // 以图文分享为例
            tt.shareAppMessage({
                channel: 'article',
                templateId: '', // 替换成通过审核的分享ID
                query: '',
                title: '来扭蛋吧！',
                desc: '在这里爱上画画',
                imageUrl: '',
                success() {
                    Toast.showToast('分享成功');
                },
                fail(e) {
                    Toast.showToast('分享失败');
                }
            });
        } else if (type === 'video') {
            tt.shareAppMessage({
                channel: 'video',
                query: '',
                templateId: '', // 替换成通过审核的分享ID
                title: '来扭蛋吧！',
                desc: '快来一起扭蛋换装吧',
                extra: {
                    videoPath: filePathOrTempId, // 可用录屏得到的本地文件路径
                    videoTopics: ['快来一起扭蛋换装吧']
                },
                success() {
                    Toast.showToast('分享成功');
                },
                fail(e) {
                    Toast.showToast('分享失败');
                }
            });
        } else if (type === 'token') {
            tt.shareAppMessage({
                channel: 'token', // 口令分享
                templateId: '', // 替换成通过审核的分享ID
                title: '来扭蛋吧！',
                desc: '快来一起扭蛋换装吧',
                query: '',
                success() {
                    Toast.showToast('分享成功');
                },
                fail(e) {
                    Toast.showToast('分享失败');
                }
            });
        }
    }

    // 联系GM
    connectGM() {
        tt.openCustomerServiceConversation({
            type: 2, // im 客服
            success(res) {
                console.log(res);
            },
            fail(res) {
                console.log(res);
            }
        });
    }

    // 充值功能
    // 0 成功 1 取消 2 ios成功 3 ios取消
    payRecharge(orderId: string, rmbNum: number, shopItemId: string, shopItemName: string, callBack: (statusCode: 0 | 1 | 2 | 3) => void) {
        if (this.getSystemInfoSync()?.platform === 'ios') {
            Toast.showToast('暂未开放!');
            // wx.showModal({
            //     title: '购买提示',
            //     content: '即将打开客服聊天界面，输入"cz"或者"充值"即可获得充值链接',
            //     showCancel: false,
            //     confirmText: '我知道了',
            //     success(res) {
            //         if (res.confirm) {
            //             this.connectGM();
            //             tt.openCustomerServiceConversation({
            //                 showMessageCard: true,
            //                 sendMessageTitle: '我想购买' + shopItemName,
            //                 // sendMessagePath: JSON.stringify({
            //                 //     messageType: 'JsApiOrder',
            //                 //     shopItemName: shopItemName,
            //                 //     oauthUrl: (orderData.extraData['wechat-game'] as WechatGameJsApiPaymentOption).jsapiOAuthUrl
            //                 // }),
            //                 sendMessageImg: 'https://mzxk-okv.cognizepower.com/wechatgame/recharge.png'
            //             });
            //             console.log('用户点击支付提示，进入客服界面');
            //         } else if (res.cancel) {
            //             console.log('用户取消了支付提示');
            //         }
            //     }
            // });
        } else {
            const payObj: any = {
                mode: 'game', // 支付类型
                env: getGameGlobal().inView ? 1 : 0, // 0米大师正式环境 1米大师沙箱环境
                currencyType: 'CNY', // 币种：目前仅为 "CNY"
                platform: 'android', // 申请接入时的平台：目前仅为"android"
                buyQuantity: 1, // 购买数量，必须满足：金币数量*金币单价 = 限定价格等级（详见金币限定等级）
                zoneId: '1',
                customId: orderId, //开发者自定义唯一订单号。如不填，支付结果回调将不包含此字段，将导致游戏开发者无法发放游戏道具, 基础库版本低于1.55.0没有此字段
                extraInfo: '', // JSON.stringify({ userId: '12xxx6', version: 'v0.0.0', price: '30' }), //extraInfo要转成字符串
                success(res) {
                    console.log('支付调用函数成功');
                    callBack && callBack(0);
                },
                fail(res) {
                    console.log('支付调用函数失败');
                    callBack && callBack(1);
                },
                complete(res) {
                    console.log('支付调用完成');
                }
            };

            tt.requestGamePayment(payObj);
        }
    }

    /**
     * 重启小游戏
     */
    resetartMiniGame() {
        try {
            tt.restartMiniProgramSync();
        } catch (error) {
            console.log(`tt restartMiniProgramSync调用失败`, error);
        }
    }

    // 保持屏幕常亮
    keepGameScreenOn() {
        tt.setKeepScreenOn({
            keepScreenOn: true
        });
    }

    // 创建激励视频广告实例，提前初始化
    createRewardedVideoAd(adId: string) {
        // if (wx.createRewardedVideoAd) {
        //     const videoAd = wx.createRewardedVideoAd({
        //         adUnitId: adId, // 'adunit-078ae165ea641b5b'
        //         multiton: true // 是否启用多例模式，默认为false，该参数仅在基础库2.8.0或以上的版本支
        //     });
        //     this.rewardedVideoAds[adId] = videoAd;
        // }
    }

    // 播放广告
    showRewardedVideoAd(adId: string, call: (res: any) => void, branchId?: string) {
        // videoAd.onClose(res => {
        //     // 用户点击了【关闭广告】按钮
        //     // 小于 2.1.0 的基础库版本，res 是一个 undefined
        //     if ((res && res.isEnded) || res === undefined) {
        //         // 正常播放结束，可以下发游戏奖励
        //         call && call(0);
        //     } else {
        //         // 播放中途退出，不下发游戏奖励
        //         call && call(1);
        //     }
        // });
        // // 用户触发广告后，显示激励视频广告
        // videoAd.show().catch(() => {
        //     // 失败重试
        //     videoAd
        //         .load()
        //         .then(() => videoAd.show())
        //         .catch(err => {
        //             console.error('激励视频 广告显示失败', err);
        //         });
        // });
    }

    // 销毁实例
    destroyRewardedVideoAdBy(adId: string) {
        // if (videoAd.destroy) {
        //     videoAd.destroy();
        // }
    }

    // 小游戏进入前台或后天展示
    addListenerBackOrFront(call: (tag: string) => void) {
        tt.onShow(() => {
            call('front');
        });
        tt.onHide(() => {
            call('back');
        });
    }

    // 复制文本
    copyText(txt: string) {
        tt.setClipboardData({
            data: txt,
            success(res) {
                Toast.showToast('复制成功');
            }
        });
    }

    requestTriggerGC() {
        tt.triggerGC();
    }

    private handleDownloadError(url: string, filePath: string, downCount: number, resolve: any, reject: any) {
        downCount++;
        if (downCount >= 3) {
            reject(new Error('Download failed after 3 attempts: ' + url));
            return;
        }
        setTimeout(() => {
            this.downloadFile(url, filePath, downCount).then(resolve).catch(reject);
        }, 1000 * downCount); // Exponential backoff
    }
    //  对于平台下载文件
    async downloadFile(url: string, saveFilePath: string, downCount = 0) {
        return new Promise<string>((resolve, reject) => {
            console.log('downloadFile start:', url, saveFilePath);
            tt.downloadFile({
                url: url, //仅为示例，并非真实的资源
                filePath: saveFilePath,
                success: async res => {
                    // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
                    if (res.statusCode === 200) {
                        resolve(res.tempFilePath);
                    } else {
                        this.handleDownloadError(url, saveFilePath, downCount, resolve, reject);
                    }
                },
                fail(err) {
                    console.error(err);
                    this.handleDownloadError(url, saveFilePath, downCount, resolve, reject);
                    assetManager.cacheManager?.clearLRU();
                }
            });
        });
    }

    checkNetType(call: (type: string) => void) {
        tt.getNetworkType({
            success(res) {
                call && call(res.networkType);
            }
        });
    }

    // ---------- 文件处理 ---------------

    // 判断是否存在文件
    isExistFile(filePath: string): boolean {
        try {
            tt.getFileSystemManager().accessSync(filePath);
            return true;
        } catch (e) {
            return false;
        }
    }

    // 用户目录
    writeFile(fileName: string, content: string): boolean {
        // 在本地用户文件目录下创建一个文件 hello.txt，写入内容 "hello, world"
        try {
            const fs = tt.getFileSystemManager();
            fs.writeFileSync(fileName, content, 'utf8');
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    // 复制文件
    copyFile(srcPath: string, distPath: string): boolean {
        try {
            tt.getFileSystemManager().copyFileSync(srcPath, distPath);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    // 创建文件路径
    mkDir(dirPath: string): boolean {
        try {
            tt.getFileSystemManager().mkdirSync(dirPath, true);
            return true;
        } catch (e) {
            return false;
        }
    }

    rmDir(dirPath: string): boolean {
        try {
            tt.getFileSystemManager().rmdirSync(dirPath, true);
            return true;
        } catch (e) {
            return false;
        }
    }

    // 读取文件
    readFile(filePath: string): string | ArrayBuffer {
        try {
            const res = tt.getFileSystemManager().readFileSync(filePath, 'utf8', 0);
            console.log(res);
            return res;
        } catch (e) {
            console.error(e);
        }
        return '';
    }
    // 解压文件
    async unzipFile(zipPath: string, targetPath: string) {
        console.debug('正在解压文件', zipPath, targetPath);
        return new Promise<void>((resolve, reject) => {
            tt.getFileSystemManager().unzip({
                zipFilePath: zipPath,
                targetPath: targetPath,
                success: res => {
                    console.debug('文件解压成功', zipPath, targetPath, res);
                    resolve();
                },
                fail: res => {
                    console.error('文件解压失败', zipPath, targetPath, res);
                    reject(res);
                }
            });
        });
    }

    // 删除文件
    deleteFile(filePath: string): boolean {
        try {
            const res = tt.getFileSystemManager().unlinkSync(filePath);
            if (res) {
                console.log(res);
            }
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    getFriendCloudStorage() {
        tt.getFriendCloudStorage();
    }

    setUserCloudStorage(data) {

    }

    //获取开放数据域data
    postMessage(data) { }

    getFuzzyLocation(call) {

    }

    //分享
    shareAppMessage() {

    }
}
