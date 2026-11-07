import { _decorator, assetManager } from 'cc';
import { Manager } from '../../frame/center/manager';
import Utils from '../center/utils/utils';
import { SuperSdk } from './super-sdk';

const { ccclass, property } = _decorator;

export class WechatSdk extends SuperSdk {
    protected optionsSync: any;
    protected gameSystemInfo: any;
    protected useInfoData: any;

    constructor() {
        super();
        wx.onMemoryWarning(res => {
            console.log('onMemoryWarning:', res);
            this.requestTriggerGC();
            Manager.eventManager.emit('MemoryWarning', res);
        });
    }

    // 新版本检测 其实仅仅是监听 微信小游戏的机制是每次玩家启动（热启动和冷启动）都会主动触发检查
    checkHaveNewVersion() {
        const updateManager = wx.getUpdateManager();
        updateManager.onCheckForUpdate(function (res) {
            // 请求完新版本信息的回调
            console.log('load new version success!');
            console.log(res.hasUpdate);
            if (res.hasUpdate) {
            }
        });
        this.checkHaveNewVersionStep2();
    }

    private checkHaveNewVersionStep2() {
        const updateManager = wx.getUpdateManager();
        updateManager.onUpdateReady(function () {
            wx.showModal({
                title: '更新提示',
                content: '新版本已经准备好，是否重启应用？',
                success(res) {
                    if (res.confirm) {
                        // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                        updateManager.applyUpdate();
                    }
                }
            });
        });

        updateManager.onUpdateFailed(function () {
            // 新版本下载失败
            console.log('load new version faild!');
        });
    }

    // 游戏包信息
    getGamePackageInfo() {
        const packageInfo = {};
        //小程序类型
        packageInfo['app_type'] = 'wechat';
        //小程序包名
        packageInfo['package_name'] = 'com.qqemoji.game' + 'wx';
        //游戏版本号
        packageInfo['game_version'] = getGameGlobal().gameVersion;
        //策划配置版本号
        packageInfo['config_version'] = getGameGlobal().configVersion;
        //oss对于的channel名称
        packageInfo['channel_name'] = 'wechatgame';
        return packageInfo;
    }

    showToast(des: string) {
        wx.showToast({
            title: des,
            icon: 'none'
        });
    }

    // 登录接口
    login(call: (code: any) => void) {
        wx.login({
            success(res) {
                call && call(res);
            }
        });
    }

    // 用户隐私
    requireUserPrivacy() {
        // 调用wx.requirePrivacyAuthorize拉起弹窗组件
        // 若用户已同意且隐私政策无变更则直接跳过用户确认阶段进入success回调，否则需要拉起隐私弹窗，请求用户确认，用户同意后才进入success回调
        wx.requirePrivacyAuthorize({
            success: res => {
                // 非标准API的方式处理用户个人信息
            },
            fail: () => { },
            complete: () => { }
        });
    }

    // 获取用户信息
    getUserInfo(callBack: (res: any) => void) {
        if (!this.useInfoData) {
            const self = this;
            // 开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
            if (wx.getUserProfile) {
                wx.getUserProfile({
                    desc: '用于完善会员资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
                    success: res => {
                        self.useInfoData = res.userInfo;
                        callBack && callBack(res.userInfo);
                    },
                    fail: res => {
                        callBack && callBack(null);
                    }
                });
            }
        } else {
            callBack && callBack(this.useInfoData);
        }
    }

    getUserInfoSync() {
        return this.useInfoData;
    }

    copyText(txt: string) {
        console.log('copyText====', txt);
        wx.setClipboardData({
            data: txt,
            success(res) {
                console.log('copy res:', txt);
            }
        });
    }

    // 上报数据
    reportScene(sceneId: number, costTime: number) {
        wx.reportScene({
            sceneId: sceneId, //「必填」sceneId 为「新建场景」后，由系统生成的场景 Id 值，用于区分当前是哪个启动场景的数据
            costTime: costTime, //「非必填」costTime 为当前场景的耗时(ms)，非必填，默认为 0
            dimension: {
                d1: 'test' //「非必填」value仅支持传入String类型。若value表示Boolean，请将值处理为0、1进行上报；若value为Number，请转换为String进行上报
            },
            success(res) {
                // 上报接口执行完成后的回调，用于检查上报数据是否符合预期，也可通过启动调试能力进行验证
                // console.log(res);
            },
            fail(res) {
                // 上报报错时的回调，用于查看上报错误的原因：如参数类型错误等
                // console.log(res);
            }
        });
    }

    // 获取归因
    getOptionsSync() {
        if (!this.optionsSync) {
            if (wx.getLaunchOptionsSync) {
                this.optionsSync = wx.getLaunchOptionsSync();
            } else if (wx.getEnterOptionsSync) {
                this.optionsSync = wx.getEnterOptionsSync();
            }
        }
        console.log('==========getOptionsSync==========', this.optionsSync);
        return this.optionsSync;
    }

    // 设备信息
    getSystemInfoSync() {
        if (!this.gameSystemInfo) {
            this.gameSystemInfo = wx.getSystemInfoSync();
        }
        return this.gameSystemInfo;
    }

    getDeviceInfo() {
        return wx.getDeviceInfo();
    }

    // 联系GM
    connectGM() {
        // Toast.showToast('暂未开启，敬请期待');
        wx.openCustomerServiceConversation({
            success(res) {
                console.log('打开客服成功');
            },
            fail(res) {
                console.log('打开客服失败');
            }
        });
        console.log('联系wechat客服');
    }

    // ---------- 文件处理 ---------------

    // 判断是否存在文件
    isExistFile(filePath: string): boolean {
        try {
            wx.getFileSystemManager().accessSync(filePath);
            return true;
        } catch (e) {
            return false;
        }
    }

    // 用户目录
    writeFile(fileName: string, content: string): boolean {
        // 在本地用户文件目录下创建一个文件 hello.txt，写入内容 "hello, world"
        try {
            const fs = wx.getFileSystemManager();
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
            wx.getFileSystemManager().copyFileSync(srcPath, distPath);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    // 创建文件路径
    mkDir(dirPath: string): boolean {
        try {
            wx.getFileSystemManager().mkdirSync(dirPath, true);
            return true;
        } catch (e) {
            return false;
        }
    }

    rmDir(dirPath: string): boolean {
        try {
            wx.getFileSystemManager().rmdirSync(dirPath, true);
            return true;
        } catch (e) {
            return false;
        }
    }

    // 读取文件
    readFile(filePath: string): string | ArrayBuffer {
        try {
            const res = wx.getFileSystemManager().readFileSync(filePath, 'utf8', 0);
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
            wx.getFileSystemManager().unzip({
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
            const res: any = wx.getFileSystemManager().unlinkSync(filePath);
            if (res) {
                console.log(res);
            }
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    onShareAppMessage(call: (res: any) => void) {
        wx.onShareAppMessage(call);
    }

    showShareMenu() {
        wx.showShareMenu({
            withShareTicket: false, //如果需要转发到的群的信息时开启，true时转发的卡片不可再次转发
            menus: ['shareAppMessage'] //shareTimeline
        });
    }

    private Test() {
        let num = 0;
        num += 1;
        num += 2;
        return num;
    }

    //获取好友的用户数据
    getFriendCloudStorage() {
        wx.getFriendCloudStorage({
            keyList: ['score'],
            success: (data) => {
                console.log('====getFriendCloudStorage======success=======', data);
            },
            fail: (data) => {
                console.log('====getFriendCloudStorage======fail=======', data);
            }
        });
    }

    // 充值功能
    // 0 成功 1 取消 2 ios成功 3 ios取消
    // payRecharge(
    //     orderId: string,
    //     rmbNum: number,
    //     shopItemId: string,
    //     shopItemName: string,
    //     callBack: (statusCode: 0 | 1 | 2 | 3, errorMsg?: string) => void
    // ) {
    //     if (this.getSystemInfoSync()?.platform === 'ios') {
    //         // wx.showModal({
    //         //     title: '购买提示',
    //         //     content: '即将打开客服聊天界面，输入"cz"或者"充值"即可获得充值链接，如果未返回充值链接请重新进入客服聊天界面',
    //         //     showCancel: false,
    //         //     confirmText: '我知道了',
    //         //     success: res => {
    //         //         if (res.confirm) {
    //         //             // this.connectGM();

    //         //         } else {
    //         //             callBack && callBack(3);
    //         //         }
    //         //     }
    //         // });
    //         wx.openCustomerServiceConversation({
    //             showMessageCard: true,
    //             sendMessageTitle: '我想购买' + shopItemName,
    //             sendMessagePath: JSON.stringify({
    //                 messageType: 'IosOrder',
    //                 shopItemName: shopItemName
    //             }),
    //             sendMessageImg: '',
    //             sessionFrom: JSON.stringify({
    //                 messageType: 'IosOrder',
    //                 orderId: orderId,
    //                 amount: rmbNum,
    //                 shopItemId: shopItemId,
    //                 shopItemName: shopItemName
    //             })
    //         });
    //         console.log('用户点击支付提示，进入客服界面');
    //         callBack && callBack(2);
    //     } else {
    //         console.log('recharge:', orderId, rmbNum, shopItemId);
    //         const payObj: any = {
    //             mode: 'game', //	支付的类型，不同的支付类型有各自额外要传的附加参数。
    //             env: getGameGlobal().inView ? 1 : 0, // 0米大师正式环境 1米大师沙箱环境
    //             offerId: '1450172862', // 在米大师侧申请的应用 id
    //             currencyType: 'CNY', // 币种
    //             platform: 'android', // 申请接入时的平台，platform 与应用id有关。
    //             buyQuantity: rmbNum, // 购买数量。mode=game 时必填。购买数量。详见 buyQuantity 限制说明。
    //             zoneId: 1, // 分区 ID
    //             outTradeNo: orderId, //业务订单号
    //             success: () => {
    //                 // 接口调用成功的回调函数
    //                 callBack && callBack(0);
    //                 wx.showModal({
    //                     title: i18n.f('recharge_success_title'),
    //                     content: i18n.f('recharge_success_des'),
    //                     showCancel: false,
    //                     success(res) { }
    //                 });
    //             },
    //             fail: res => {
    //                 //	接口调用失败的回调函数
    //                 console.log('支付失败', res);
    //                 callBack && callBack(1, JSON.stringify(res));
    //                 let errorMsg = i18n.f('recharge_faild_des');
    //                 if (res.errCode === -2) {
    //                     errorMsg = i18n.f('recharge_faild_cancel');
    //                 }
    //                 wx.showModal({
    //                     title: i18n.f('recharge_faild_title'),
    //                     content: errorMsg,
    //                     showCancel: false,
    //                     success(res) { }
    //                 });
    //             },
    //             complete(res) {
    //                 console.log('支付调用完成', res);
    //             }
    //         };
    //         wx.requestMidasPayment(payObj);
    //     }
    // }

    /**
     * 重启小游戏
     */
    resetartMiniGame() {
        this.Test();
        wx.restartMiniProgram({});
    }

    //手机震动
    vibrateShort() {
        this.Test();
        wx.vibrateShort(null);
    }

    // 保持屏幕常亮
    keepGameScreenOn() {
        this.Test();
        wx.setKeepScreenOn({
            keepScreenOn: true
        });
    }

    // 创建激励视频广告实例，提前初始化
    createRewardedVideoAd(adId: string) {
        console.log('createRewardedVideoAd:', adId, this.getSystemInfoSync().SDKVersion);
        if (wx.createRewardedVideoAd && !this.rewardedVideoAds[adId]) {
            this.Test();
            console.log('createRewardedVideoAd: enter');
            const videoAd = wx.createRewardedVideoAd({
                adUnitId: adId, // 'adunit-078ae165ea641b5b'
                multiton: true // 是否启用多例模式，默认为false，该参数仅在基础库2.8.0或以上的版本支
            });
            videoAd.onError(res => {
                console.warn('createRewardedVideoAd: onError', res);
            });
            console.log('createRewardedVideoAd: videoAd', videoAd);
            this.rewardedVideoAds[adId] = videoAd;
            this.adWithUUID[adId] = this.generateUUID();

            return videoAd;
        }
    }

    // 播放广告
    showRewardedVideoAd(adId: string, call: (res: any, detail?: string) => void, branchId: string) {
        console.log('=========adId================', adId, branchId)
        let videoAd = this.rewardedVideoAds[adId];
        if (!videoAd) {
            videoAd = this.createRewardedVideoAd(adId);
            call && call('inited');
        }
        if (!videoAd) {
            return;
        }


        this.Test();
        videoAd.offClose();
        videoAd.offError();
        videoAd.offLoad();
        videoAd.onClose(res => {
            // 用户点击了【关闭广告】按钮
            // 小于 2.1.0 的基础库版本，res 是一个 undefined
            if ((res && res.isEnded) || res === undefined) {
                // 正常播放结束，可以下发游戏奖励
                call && call('success');
            } else {
                // 播放中途退出，不下发游戏奖励
                call && call('cancel');
            }
            this.adWithUUID[adId] = null;
            call && call('inited');
        });
        videoAd.onLoad(res => {
            this.adWithUUID[adId] = this.generateUUID();
            call && call('loaded');
        });
        videoAd.onError(res => {
            call && call('error', res.errCode + ':' + res.errMsg);
        });
        // 用户触发广告后，显示激励视频广告
        call && call('show');
        videoAd
            .show({
                branchId: branchId,
                branchDim: "", // 自定义维度(可选)：类型String，取值[1,100]，必须为整数，当上传类型不符时不统计
            })
            .then(() => {
                call && call('showed');
            })
            .catch(() => {
                // 失败重试
                call && call('load');
                videoAd
                    .load()
                    .then(() => {
                        call && call('show');
                        videoAd.show().then(() => {
                            call && call('showed');
                        });
                    })
                    .catch(err => {
                        call && call('loadOrShowFaild', JSON.stringify(err));
                        console.error('激励视频 广告显示失败', err);
                    });
            });
    }

    // 销毁实例
    destroyRewardedVideoAdBy(adId: string) {
        const videoAd = this.rewardedVideoAds[adId];
        if (!videoAd) {
            this.Test();
            return;
        }
        if (videoAd.destroy) {
            this.Test();
            videoAd.destroy();
        }
    }

    // 小游戏进入前台或后天展示
    addListenerBackOrFront(call: (tag: string) => void) {
        wx.onShow(() => {
            call('front');
        });
        wx.onHide(() => {
            call('back');
        });
    }

    requestDownload(url: string, option: { method: 'GET' | 'POST'; data?: any }, call: (err, data) => void) {
        wx.request({
            url: url, //仅为示例，并非真实的接口地址
            method: option.method,
            data: option.data,
            header: {
                'content-type': 'application/json' // 默认值
            },
            responseType: 'arraybuffer',
            success(res) {
                console.log(res.data);
                call && call(res.errMsg, res.data);
            }
        });
    }

    private handleDownloadError(url: string, filePath: string, downCount: number, resolve: any, reject: any) {
        this.Test();
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
            wx.downloadFile({
                url: url, //仅为示例，并非真实的资源
                filePath: saveFilePath,
                success: async res => {
                    // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
                    if (res.statusCode === 200) {
                        console.log('downloadFile over:', res.tempFilePath);
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
        wx.getNetworkType({
            success(res) {
                call && call(res.networkType);
            }
        });
    }

    requestTriggerGC() {
        wx.triggerGC();
    }

    //设置托管数据
    setUserCloudStorage(data) {
        console.log('======setUserCloudStorage====1=======')
        wx.setUserCloudStorage({
            KVDataList: data,
            success: () => {
                console.log('======setUserCloudStorage====success=======')
            },
            fail: () => {
                console.log('======setUserCloudStorage====fail=======')
            },
            complete: () => {

            }
        })
    }

    //获取开放数据域data
    postMessage(data) {
        const openData = wx.getOpenDataContext()
        openData.postMessage(data);
    }

    getFuzzyLocation(call) {
        wx.getFuzzyLocation({
            type: 'wgs84',
            success(res) {
                const latitude = res.latitude
                const longitude = res.longitude
                if (call) {
                    call(latitude, longitude);
                }
            }, fail: () => {
                if (call) {
                    call(null, null);
                }
            }
        })
    }

    shareAppMessage(data) {
        wx.shareAppMessage(data);
    }

}

//===============================================================================================


class DataNexu extends Utils.Singleton {
    private sdk: SDK;

    constructor() {
        super();
    }

    init() {
        try {
            this.sdk = new SDK({
                user_action_set_id: 1209058718,
                secret_key: 'b0fc97a98c8dddab032f63134a424294',  //13370e4bc6b6435c356e64c0dc40afa6
                appid: 'wxc8277f5bacf16faf', // wx121fab7bca0a24c2
            })
        } catch (error) {
            console.error(error);
        }
    }

    setOpenId(openid: string) {
        this.sdk.setOpenId(openid);
    }

    onRegister() {
        this.sdk.onRegister();
    }

    track(eventName: string, data) {
        this.sdk.track(eventName, data)
    }


    callbackAD(openid) {
        //游戏名称：多多很机智
        // 数据源 ID：1209058718
        // App ID：wx121fab7bca0a24c2
        // secret_key   13370e4bc6b6435c356e64c0dc40afa6

        // 参数 详细见 https://datanexus.qq.com/doc/develop/guider/interface/action/dmp_actions_add

        const curTime = Math.floor(Date.now() / 1000);
        const access_token = '13370e4bc6b6435c356e64c0dc40afa6';  //密匙
        const nonce = '' //随机字串标识，不超过 32 个字符，由调用方自行生成，需保证全局唯一性
        const open_id = ''
        const app_version = '1.0.0';
        let options = {
            method: 'POST',
            url: `https://api.e.qq.com/v1.3/user_actions/add?access_token=${access_token}&timestamp=${curTime}&nonce=${nonce}`,
            headers: { 'content-type': 'application/json' },
            body: {
                "account_id": 45903631, //示例账户id
                "user_action_set_id": 1209058718, // 在DATANEXUS平台创建数据源ID
                "actions": [
                    // 腾讯流量（"channel": "TENCENT"）带来的购买（PURCHASE）行为。1次请求最多上报50个行为，格式以此类推。
                    {
                        "outer_action_id": "示例唯一行为 id_请指定",
                        "action_time": curTime,
                        "user_id": {
                            "wechat_app_id": 'wx121fab7bca0a24c2',
                            "wechat_openid": open_id,
                        },
                        "action_type": "CREATE_ROLE",
                        "action_param": {
                            "claim_type": 3,   //归因类型  1 关注归因、3 注册、4 激活、7回流
                            "brand_name": "my_brand",
                        },
                        "product_inform": {
                            "content_type": "EC",
                            "category_path": [
                                "game",
                            ]
                        },
                        "channel": "TENCENT",
                        "ext_info": {
                            "app_version": app_version,

                        }
                    }
                ]
            },
            json: true
        };
        const request = require("request");
        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            console.log(body);
        });
    }

    //这里不是WechatSdk
}

export const DataNexus = DataNexu.getInstance();



