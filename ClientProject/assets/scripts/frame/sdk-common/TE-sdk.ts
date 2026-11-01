
import Utils from "../../frame/center/utils/utils";
import { DataManager } from "../../game/data/data-manager";

export const optDefineData = {
    host: '',
    project: 'qqemoji',

}

export enum ReportEventType {
    Login = 'login',
    GAME_MEMORY_WARNING = 'game_memory_warning',
    GAME_ERROR = 'game_error',
    GAME_CLEAR_CACHE = 'game_clear_cache',
    // START_APPLETS = 'start_applets', //每次启动小程序且获取到unionid(微小)/openid(抖小)后上报
    // B_LOGION_SUCCESS = 'b_login_success', //登录成功上报
    // B_ENTRY_PAGE = 'b_entry_page', //打开页面时上报，平台意思是游戏界面
    // B_ENTRY_GAME_PAGE = 'b_entry_game_page', //打开游戏上报 ，统计游戏时长，相当于玩具游戏时间的标记
    // B_LEAVE_GAME_PAGE = 'b_leave_game_page', //离开游戏上报，统计游戏时长，相当于玩具游戏时间的标记
    REMOVE_LRU_BUNDLE = 'remove_lru_bundle',
}

export enum TEReportEventType {
    Load = 'loading',//加载
    Register = 'reg', //用户注册
    Login = 'login',//用户登录时
    Logout = 'logout',//用户登出时
    Chapter = 'chapter',//章节结束时
    Stage = 'stage',//关卡结束时
    Guide = 'guide',//新手引导结束时
    Adview = 'adview', //玩家观看广告视频状态变化时
    Privacy = 'privacy', //隐私保护提示
    PlayGame = 'playGame',//开始游戏
}

class TESdk extends Utils.Singleton {
    _tesdk = null;
    constructor() {
        super();
    }

    init() {
        console.log('===TESdk===init==')
        const config = {
            appId: 'dc6893177e0e409b956fb0f759687011',
            serverUrl: 'https://td-log-collect.galsanggame.com',
            autoTrack: {
                appShow: true,
                appHide: true,
            }

        }
        TDAnalytics.init(config);

        var superProperties = {
            channel: "wx", //字符串
            isSuccess: true,//布尔
            time: Utils.time.dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),//上传时间
            game: "QQEmoji",
        };
        //设置公共事件属性
        TDAnalytics.setSuperProperties(superProperties);

        //设置用户属性
        TDAnalytics.userSet({
            properties: {
                username: "TE"
            }
        });

    }

    reportTrackingLog(_eventName: TEReportEventType | string, data: any) {
        TDAnalytics.track({
            eventName: _eventName,
            properties: data,
        })
    }


}

//export const TESd1k = TESdk.getInstance();

class TESdkDataManager extends Utils.Singleton {
    _tESdkData = null;
    constructor() {
        super();
    }

    //login out 属性
    private login_time = 0;
    //chapter 属性
    private chapter_start_timer = 0;
    //chapter_id = "";
    //chapter_result = "";//成功/失败/退出
    //chapter_time = 0;//章节时长
    private chapter_prop_use = [];//章节道具使用 prop_id prop_times使用次数
    chapter_is_revive = {};//0否 1是
    private chapter_steps = 0;//章节操作次数
    //remain_targets=[];//剩余目标数量 face_id ；count剩余个数
    //stage 属性
    private stage_start_timer = 0;
    //stage_id = "";
    //stage_result = "";//成功/失败/退出
    //stage_time = 0;
    private stage_prop_use = [];//关卡道具使用 prop_id prop_times使用次数
    stage_is_revive = {};//0否 1是
    //guide 属性
    guide_id = "";
    //adview 属性  
    ad_id = "";
    ad_scene = "";//广告触发场景 如获取道具、使用复活、增加挑战次数
    status = "";//0打开1观看完成2未完成
    fail_reason = "";


    reportTrackLog(_eventName: TEReportEventType | string, data: any) {
        TESdk.getInstance().reportTrackingLog(_eventName, data);
    }

    clearData() {
        //login out 属性
        this.login_time = 0;
        //chapter 属性
        this.chapter_start_timer = 0;
        //this.chapter_id = "";
        //this.chapter_result = "";//成功/失败/退出
        //this.chapter_time = 0;//章节时长
        this.chapter_prop_use = [];//章节道具使用 prop_id prop_times使用次数
        this.chapter_is_revive = {};//0否 1是
        this.chapter_steps = 0;//章节操作次数
        //this.remain_targets=[];//剩余目标数量 face_id ；count剩余个数
        //stage 属性
        this.stage_start_timer = 0;
        //this.stage_id = "";
        //this.stage_result = "";//成功/失败/退出
        //this.stage_time = 0;
        this.stage_prop_use = [];//关卡道具使用 prop_id prop_times使用次数
        this.stage_is_revive = {};//0否 1是
        //guide 属性
        this.guide_id = "";
        //adview 属性  
        this.ad_id = "";
        this.ad_scene = "";//广告触发场景 如获取道具、使用复活、增加挑战次数
        this.status = "";//0打开1观看完成2未完成
        this.fail_reason = "";
    }


    addABtestProperty(isAB: string, isRegister: boolean) {
        var superProperties = {
            channel: "wx", //字符串
            isSuccess: true,//布尔
            time: Utils.time.dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),//上传时间
            ABtest: isAB,
            isRegister: isRegister
        };
        //设置公共事件属性
        TDAnalytics.setSuperProperties(superProperties);
    }


    /**
     * 开始大关时调用
     */
    public startChapter(curStage) {
        this.chapter_start_timer = Date.now();
        this.chapter_prop_use = [];//章节道具使用 prop_id prop_times使用次数
        this.chapter_is_revive = {};//0否 1是
        this.chapter_steps = 0;//章节操作次数

        TDAnalytics.track({
            eventName: TEReportEventType.Chapter,
            properties: {
                chapter_id: curStage,
                chapter_enter: curStage,
                chapter_start_time: this.stage_start_timer,
                gameType: DataManager.dataBattle.battleType + 1
            }
        })
    }

    public clearStageDate() {
        //stage 属性
        this.stage_start_timer = 0;
        //this.stage_id = "";
        //this.stage_result = "";//成功/失败/退出
        //this.stage_time = 0;
        this.stage_prop_use = [];//关卡道具使用 prop_id prop_times使用次数
        this.stage_is_revive = {};  //0否 1是
    }

    /**
     * 开始小关时调用
     */
    public startStage(stage_id) {
        this.clearStageDate();
        this.stage_start_timer = Date.now();

        TDAnalytics.track({
            eventName: TEReportEventType.Stage,
            properties: {
                stage_id: stage_id,
                stage_enter: 1,
                stage_start_time: this.stage_start_timer,
                gameType: DataManager.dataBattle.battleType + 1
            }
        })
    }
    /**
     * 复活时使用
     */
    public setRevive(reviveType: string) {
        if (!this.chapter_is_revive[reviveType]) {
            this.chapter_is_revive[reviveType] = 0
        }
        if (!this.stage_is_revive[reviveType]) {
            this.stage_is_revive[reviveType] = 0
        }
        this.chapter_is_revive[reviveType] += 1
        this.stage_is_revive[reviveType] += 1;
        // this.chapter_is_revive = reviveType;
        // this.stage_is_revive = reviveType;
    }

    public init() {
        TESdk.getInstance().init();
        this.clearData();
    }

    public addStep() {
        this.chapter_steps += 1;
    }
    public changPropUse(prop_id: string) {
        // if(this.chapter_prop_use.length == 0){
        //     this.chapter_prop_use.push([ { prop_id : "prop_id" ,prop_times:1} ]);
        // }
        let tempcp = this.chapter_prop_use.find((info) => {
            return info.prop_id == prop_id;
        })
        if (tempcp) {
            tempcp.prop_times += 1;
        } else {
            this.chapter_prop_use.push([{ prop_id: "prop_id", prop_times: 1 }]);
        }

        let tempsp = this.stage_prop_use.find((info) => {
            return info.prop_id == prop_id;
        })
        if (tempsp) {
            tempsp.prop_times += 1;
        } else {
            this.stage_prop_use.push([{ prop_id: "prop_id", prop_times: 1 }]);
        }
    }

    public reportLoad(_type: string) {
        TDAnalytics.track({
            eventName: TEReportEventType.Load,
            properties: {
                type: _type,
                time: Date.now()
            }
        })
    }


    public reportPlayGame() {
        TDAnalytics.track({
            eventName: TEReportEventType.PlayGame,
            properties: {
                gameType: DataManager.dataBattle.battleType + 1,
                time: Date.now()
            }
        })
    }

    public reportPrivacy(_type: string) {
        TDAnalytics.track({
            eventName: TEReportEventType.Privacy,
            properties: {
                type: _type,
                time: Date.now()
            }
        })
    }

    public reportRegister() {
        TDAnalytics.track({
            eventName: TEReportEventType.Register,
            properties: {
                time: Date.now()
            }
        })
    }

    public reportLogin(id: string, isRegister: boolean = false) {
        // TDAnalytics.login(id);

        this.login_time = Date.now();
        TDAnalytics.track({
            eventName: TEReportEventType.Login,
            properties: {
                time: this.login_time,
                id: id,
                isRegister: isRegister,
            }

        })
    }

    public getChapterPlayTime() {
        return Math.floor((Date.now() - this.chapter_start_timer) / 1000);
    }

    public reportChapter(chapter_id: string, chapter_result: string, remain_targets: string) {
        TDAnalytics.track({
            eventName: TEReportEventType.Chapter,
            properties: {
                chapter_id: chapter_id,
                chapter_result: chapter_result,
                chapter_time: Math.floor((Date.now() - this.chapter_start_timer) / 1000),
                chapter_prop_use: this.chapter_prop_use,
                chapter_is_revive: JSON.stringify(this.chapter_is_revive),
                chapter_steps: this.chapter_steps,
                remain_targets: remain_targets,
                game_type: '0',  //游戏类型 0 普通 1 捕鱼
                gameType: DataManager.dataBattle.battleType + 1
            }
        })
    }

    public reportStage(stage_id: string, stage_result: string) {
        TDAnalytics.track({
            eventName: TEReportEventType.Stage,
            properties: {
                stage_id: stage_id,
                stage_result: stage_result,
                stage_time: Math.floor((Date.now() - this.stage_start_timer) / 1000),
                stage_prop_use: this.stage_prop_use,
                stage_is_revive: JSON.stringify(this.stage_is_revive),
                gameType: DataManager.dataBattle.battleType + 1
            }

        })
    }

    public reportGuide(guide_id) {
        TDAnalytics.track({
            eventName: TEReportEventType.Guide,
            properties: {
                guide_id: guide_id,
            }
        })
    }

    public createAds(ad_id: string, ad_scene: string) {
        this.ad_id = ad_id;
        this.ad_scene = ad_scene

        TDAnalytics.track({
            eventName: TEReportEventType.Adview,
            properties: {
                ad_id: this.ad_id,
                ad_scene: this.ad_scene,
                status: "0",
                fail_reason: '',
            }
        })
    }

    public reportAds(adKey: string, status: string, fail_reason: string, propId: number) {
        TDAnalytics.track({
            eventName: TEReportEventType.Adview,
            properties: {
                ad_id: adKey,
                ad_scene: this.ad_scene,
                status: status,
                fail_reason: fail_reason,
                prop_id: propId || '-1',
            }
        })
    }

}

export const TESdkData = TESdkDataManager.getInstance();
