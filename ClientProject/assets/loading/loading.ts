// ----------- 1.60 上线
import { _decorator, assetManager, director, DynamicAtlasManager, EditBox, EPhysics2DDrawFlags, game, JsonAsset, Label, log, macro, Node, PhysicsMaterial, PhysicsSystem2D, profiler, Sprite, sys, UITransform, v2, view } from 'cc';
import { sdkUtils } from '../scripts/frame/sdk-common/sdk-utils';
import { gameModel, isBrowser, isMiniGame } from '../scripts/game/game-define';
import Utils from '../scripts/frame/center/utils/utils';
import { G_isTest, G_shareImg, G_shareTitle, PushType, UI_EVENT_NAME, UI_NAME } from '../scripts/game/constant/common-define';
import { Toast } from '../scripts/frame/center/components/toast';
import { SuperScene } from '../scripts/frame/center/components/super-scene';
import { Manager } from '../scripts/frame/center/manager';
import { DataManager } from '../scripts/game/data/data-manager';
import { redDotManager } from '../scripts/frame/center/managers/red-dot-manager';
import { Widget } from 'cc';
import { ExcelConfigParser } from '../scripts/game/excel-config-parser';
import { prePareCreateRewardVideoAds } from '../scripts/game/ui-commonset';
import { ReportEventType, TESdkData } from '../scripts/frame/sdk-common/TE-sdk';
import { DataNexus } from '../scripts/frame/sdk-common/wechat-sdk';
import { uiManager } from '../scripts/frame/center/managers/ui-manager';
import { MINIGAME } from 'cc/env';
import { AxiosManager } from '../scripts/frame/center/net/axios-manager';
import { MessageID } from '../scripts/game/constant/message-define';
const { ccclass, property } = _decorator;

@ccclass('loading')
export class loading extends SuperScene {
    @property({
        type: Node,
        // //displayName: '登陆节点'
    })
    loginNode: Node;

    @property({
        type: Node,
        //displayName: '加载节点'
    })
    loadingNode: Node;

    // @property({
    //     type: Node,
    //     //displayName: '选择服务器节点'
    // })
    // serverNode: Node;

    @property({
        type: Label,
        //displayName: '加载进度'
    })
    progressLabel: Label;

    @property({
        type: Label,
        //displayName: '加载描述'
    })
    progressTip: Label;

    @property({
        type: Label,
        //displayName: '游戏版本'
    })
    gameVersionLab: Label;

    @property({
        type: Sprite,
        //displayName: '加载进度'
    })
    progressBar: Sprite;

    @property({
        type: Sprite,
        //displayName: '进度tab图标'
    })
    progressIcon: Sprite;


    @property({
        type: Label,
        //displayName: '玩家id'
    })
    playerUID: Label;

    @property({
        type: Node,
        //displayName: '错误弹出'
    })
    errorNode: Node;

    @property({
        type: Label,
        //displayName: '错误输出'
    })
    errorMsg: Label;

    @property({
        type: Node,
        //dissName: '公告按钮'
    })
    noticeNode: Node;

    @property({
        type: Node,
        tooltip: '清除缓存按钮'
    })
    btnClear: Node;

    //是否是微信平台
    private isWechat = sys.platform === sys.Platform.WECHAT_GAME || sys.platform === sys.Platform.WECHAT_MINI_PROGRAM;
    //是否是抖音平台
    private isByDance = sys.platform === sys.Platform.BYTEDANCE_MINI_GAME;

    private isNative = sys.platform === sys.Platform.ANDROID || sys.platform === sys.Platform.IOS;

    private alertCall: () => void;
    onLoad(): void {
        super.onLoad();

        console.log('=====sys.platform=====1====', sys.platform)
        game.frameRate = 60;  //设置帧率
        assetManager.downloader.maxConcurrency = 40; //下载的最大并发连接数

        macro.CLEANUP_IMAGE_CACHE = true;
        DynamicAtlasManager.instance.enabled = false; //关闭动态合图 

        // macro.ENABLE_MULTI_TOUCH = false;//多点触摸
        this.UpdateArea();
        this.setBgScale();
        this.configPhy(); //设置box2d

        const safeArea = sys.getSafeAreaRect();
        this.node.getChildByName('bottom').getComponent(Widget).bottom = -safeArea.y;


        if (MINIGAME) { //右上角被动
            sdkUtils.onShareAppMessage(res => {
                return {
                    query:
                        '/sharebeforelogin/?fromType=share&uid=' +
                        DataManager.dataPlayer.uid +
                        '&platform=' +
                        getGameGlobal().platform +
                        '&version=' +
                        getGameGlobal().gameVersion +
                        '&timestamp=' +
                        new Date().getTime() + '&user_code=' + DataManager.dataPlayer.user_code,
                    title: G_shareTitle,
                    imageUrl: G_shareImg,
                };
            });
            sdkUtils.showShareMenu();
        }
    }

    configPhy() {
        macro.ENABLE_MULTI_TOUCH = true; //多点触摸
        PhysicsSystem2D.instance.enable = true;

        //物理调试信息
        PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.Aabb |
            EPhysics2DDrawFlags.Pair |
            EPhysics2DDrawFlags.CenterOfMass |
            EPhysics2DDrawFlags.Joint |
            EPhysics2DDrawFlags.Shape;

        PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.None; //关闭绘制调试信息

        // 默认的重力加速度是 (0, -10) 米/秒2，按照上面描述的转换规则，即 (0, -320) 世界单位/秒2。
        PhysicsSystem2D.instance.gravity = v2(0, -320);

        const system = PhysicsSystem2D.instance;
        system.fixedTimeStep = 1 / 60; //物理步长 默认1/60
        system.velocityIterations = 10; //每次更新物理系统的迭代次数 默认为10
        system.positionIterations = 10; //每次更新物理系统处理的迭代次数 默认为10
        system.maxSubSteps = 1; //每步模拟的最大子步数
    }

    private setBgScale() {
        const bgNode = this.node.getChildByName('bg');
        const bgSize = bgNode.getComponent(UITransform).contentSize;
        const wScale = view.getVisibleSize().width / (bgSize.width || 750);
        const hScale = view.getVisibleSize().height / (bgSize.height || 1624);
        const maxScale = Math.max(wScale, hScale);
        bgNode.setScale(maxScale, maxScale, 0);
    }
    private perStart() {
        // profiler.showStats();
        this.targetOffEvent();
        this.registerEmit(
            [UI_EVENT_NAME.GAME_WIN_CLOSE],
            [
                (uiName: string) => {
                    if (uiName === 'notice_panel') {
                        // TODO
                        // LoginService.getInstance().gameNoticeStatus = 'closed';
                        this.goHomeScene();
                    }
                },
            ],
            this
        );

        Utils.storage.setGlobalStorageKey(''); //清空id的key前缀
        sdkUtils.checkHaveNewVersion();

        this._timeStamp = Date.now();
        // 本地缓存版本
        let localConfigVersion = sys.localStorage.getItem('_config_version');
        if (!localConfigVersion) {
            localConfigVersion = '0';
        }
        getGameGlobal().configVersion = localConfigVersion;

        this.gameVersionLab.string = '游戏版本：v' + getGameGlobal().gameVersion;

        if (isMiniGame) { //小游戏登录按钮
            this.loginNode.getChildByName('wechat').active = false;
            this.loginNode.getChildByName('normal').active = false;
            sdkUtils.keepGameScreenOn();
        } else {
            this.loginNode.getChildByName('wechat').active = false;
            this.loginNode.getChildByName('normal').active = false;
        }

        this.progressIcon.node.setPosition(0, 0);
        this.progressBar.fillRange = 0;
    }
    async start() {
        this.perStart();

        if (isMiniGame) {
            this.btnClear.active = false;
        }

        TESdkData.init(); //打点

        TESdkData.reportLoad('1');

        const commonBundle = await Manager.bundleManager.loadBundle('common');
        this.setPercentProgress(0.3);
        const model = await Manager.bundleManager.loadBundle('model');
        this.setPercentProgress(0.5);
        const modelBunndle = await Manager.bundleManager.loadBundle('config');
        this.setPercentProgress(0.7);
        const homeBundle = await Manager.bundleManager.loadBundle('home');
        const shader = await Manager.bundleManager.loadBundle('shaders');
        this.setPercentProgress(1.0);
        this.progressTip.string = '加载完成';

        TESdkData.reportLoad('2');

        ExcelConfigParser.getInstance().initConfig();
        DataManager.create();
        redDotManager.clear();

        this.goHomeScene();
        return;


        // DataNexus.init();  //腾讯广告


        if (isMiniGame) {
            const res: any = await sdkUtils.login();
            if (!res) {
                // this.showServerError('请求微信用户信息失败，请检查当前网络状态', this.start);
                console.error('res null');
                return;
            }
            if (res.code) {
                console.log('=========微信登录成功============', res.code);
                console.log('=========微信登录成功====2========', res);

                let func = () => {
                    const inviteUserCode = this.getOptionsSync();
                    let sendData = {};
                    if (inviteUserCode) {
                        sendData = {
                            code: res.code,
                            invite_user_code: inviteUserCode
                        }
                    } else {
                        sendData = {
                            code: res.code,
                        }
                    }

                    AxiosManager.sendHttpMessage(MessageID.Login, PushType.Post, sendData, (info: any, time) => {
                        console.log('=====wechat==========info====', info);
                        // AxiosManager.token = info.access_token;
                        const userInfo = info.user;
                        if (userInfo) {
                            DataManager.dataPlayer.setData(userInfo); //更新用户信息



                            const regiserTime = new Date(userInfo?.created_at).getTime();
                            let isRegister = false;
                            if (Math.abs(time - regiserTime) < 2000) { //注册
                                DataManager.dataPlayer.isNewRegister = true;
                                isRegister = true;
                                console.log('===================注册账号========================')
                                // DataNexus.onRegister();
                                // DataNexus.callbackAD(res.data.openid)
                                TESdkData.reportRegister();
                                TESdkData.reportLogin(userInfo?.openid, true);
                                sdkUtils.setUserCloudStorage([{ key: "score", value: '0' }]);

                                Utils.storage.setItem('battle_prop_get', JSON.stringify([0, 0, 0])); //道具获取是广告还是分享
                            } else {
                                console.log('===================老账号登录========================', time, regiserTime)
                                TESdkData.reportLogin(userInfo?.openid);

                                const last_login_date = new Date(userInfo?.last_login_date).getTime();
                                if (!Utils.time.isSameDay(last_login_date, time)) {
                                    Utils.storage.setItem('battle_prop_get', JSON.stringify([0, 0, 0]));
                                }
                            }

                            // this.loginNode.getChildByName('wechat').active = true;
                            Utils.storage.setGlobalStorageKey(DataManager.dataPlayer.uid + '#');

                            const adtestA = Utils.storage.getItem('AB_bundle_show');
                            if (!adtestA) {
                                let abkey = 'A'
                                if (Date.now() % 2 === 0) {
                                    abkey = 'B'
                                }
                                console.log('=============abtest============', abkey);
                                Utils.storage.setItem('AB_bundle_show', abkey);
                            }
                            TESdkData.addABtestProperty(Utils.storage.getItem('AB_bundle_show'), isRegister);


                            this.requestGameLogin();

                        }
                    });

                }

                // wx.getUserInfo({
                //     success: (res) => {
                //         console.log('getUserInfo success', res);
                //         func();
                //     },
                //     fail: (res) => {
                //         console.log('getUserInfo res==', res);
                //         func();
                //     }
                // })

                wx.getSetting({
                    success: (res) => {
                        if (!res.authSetting['scope.userInfo']) {
                            TESdkData.reportPrivacy('1');
                            console.log('========onClickDownLoad======还没权限=====')
                            wx.authorize({
                                scope: 'scope.userInfo',
                                success: () => {
                                    console.log('=====userInfo========手动授权=====')
                                    func();
                                    TESdkData.reportPrivacy('2');
                                },
                                fail: () => {  //手动拒绝了授权
                                    console.log('=====userInfo========手动 拒绝授权=====')
                                    func();
                                    TESdkData.reportPrivacy('2');
                                }
                            })
                        } else {
                            console.log('=====userInfo========有权限=====')
                            func();
                        }
                    }
                })

            } else {
                console.error('未获取到usercode：', res.code);
            }
        } else {
            Utils.storage.setGlobalStorageKey('12345678#');
            this.webRequestUserInfo();
        }

        prePareCreateRewardVideoAds(); //预加载广告
    }

    //确定下服务器获取还是前端
    getOptionsSync() {
        //   https://developers.weixin.qq.com/minigame/dev/api/base/app/life-cycle/wx.getLaunchOptionsSync.html
        // * | 场景值 | 场景   scene                          | appId含义  |
        // * | ------ | ------------------------------- | ---------- |
        // * | 1020   | 公众号 profile 页相关小程序列表 | 来源公众号 |
        // * | 1035   | 公众号自定义菜单                | 来源公众号 |
        // * | 1036   | App 分享消息卡片                | 来源App    |
        // * | 1037   | 小程序打开小程序                | 来源小程序 |
        // * | 1038   | 从另一个小程序返回              | 来源小程序 |
        // * | 1043   | 公众号模板消息                  | 来源公众号 |
        //query
        //shareTicket 

        const option = sdkUtils.getOptionsSync();
        const query: Record<string, string> = option.query;
        console.log('===========getOptionsSync===============================', query)
        if (query['user_code']) { //通过邀请好友进入游戏
            const userCode = query['user_code']; //邀请我的uid
            return userCode;
        }

        return null;
    }

    setPercentProgress(percent: number) {
        if (percent > 1.0) {
            percent = 1.0;
        }
        this.progressIcon.node.setPosition(469 * percent, 0);
        this.progressBar.fillRange = percent;
    }

    // web 点击登录按钮
    private async webRequestUserInfo() {
        if (G_isTest) {
            this.goHomeScene();
        } else {
            AxiosManager.sendHttpMessage(MessageID.TestLogin, PushType.Post, {
                user_id: "100",
                password: 'qqserver@2025.+',
            }, (info: any) => {
                console.log('====web======info====', info);
                // AxiosManager.token = info.access_token;
                const userInfo = info.user;
                if (userInfo) {
                    TESdkData.reportLogin(userInfo?.openid);
                    DataManager.dataPlayer.setData(userInfo);
                    this.goHomeScene();
                }
            });
        }

        return;
    }

    // 服务器接口暂未开放
    private showServerError(msg: string, call: () => void) {
        this.errorNode.active = true;
        this.errorMsg.string = msg;
        this.alertCall = call;
    }

    // private hideServerError() {
    //     this.errorNode.active = false;
    //     if (this.alertCall) {
    //         this.alertCall();
    //     }
    // }

    // 登陆
    private async requestGameLogin() {
        this.goHomeScene();
        return;
    }

    update(deltaTime: number) {

    }

    onDestroy() {
        super.onDestroy();
        this.unscheduleAllCallbacks();
        this.alertCall = null;
    }

    // 清除缓存资源
    private clearCache() {
        assetManager.cacheManager?.clearCache();

        // 移除配置信息
        // const configSavePath = `${this.getUserDataFolder()}/${ExcelConfigParser.getInstance().getConfigPath()}/`;
        // if (sdkUtils.isExistFile(configSavePath)) {
        //     sdkUtils.rmDir(configSavePath);
        // }
        sdkUtils.resetartMiniGame(); //重起游戏
        Utils.storage.clear();
        TESdkData.reportTrackLog(ReportEventType.GAME_CLEAR_CACHE, {
            error: 'clear Cache!!'
        });
    }

    // 用户可操作文件夹
    private getUserDataFolder() {
        if (this.isWechat) {
            return wx.env.USER_DATA_PATH;
        } else if (this.isByDance) {
            return tt.env.USER_DATA_PATH;
        }
    }

    //进入home界面
    private async goHomeScene() {
        // if (LoginService.getInstance().gameNoticeStatus === 'closed' && this.requestLoginSucces) {
        if (this.progressBar.fillRange >= 1.0) {
            director.loadScene('home', () => {

            });
        } else {
            Toast.showToast('资源加载中...');
        }

        // }
    }

}
