
export const G_isTest = false;

export const isQQEmoji = true;
export const G_serverUrl = isQQEmoji ? 'https://kkbqb-wx-test.galsanggame.com/' : 'https://ddhjz-wx.galsanggame.com/';
export const G_cdnUrl = 'https://kkbqb-cdn.galsanggame.com/';
export const G_shareTitle = isQQEmoji ? '《扣扣表情包》99%的人过不了第二关' : ' 《多多很机智》99%的人过不了第二关';
export const G_shareImg = 'https://kkbqb-cdn.galsanggame.com/qqemoji/image/shareImage.png';
export const G_adId = isQQEmoji ? 'adunit-bc5414b9b5b76404' : 'adunit-3430dc8a240d25bd';  //广告id

export function G_defaultIconUrl() {
    return G_cdnUrl + 'qqemoji/image/headicon/default_head.png';
}

export function G_headIconUrl(iconName) {
    return G_cdnUrl + 'qqemoji/image/headicon/' + iconName + '.png';
}

export function G_WordIconUrl(iconName) {
    return G_cdnUrl + 'qqemoji/image/word_icon/' + iconName + '.png';
}

export function G_WordBigImageUrl(iconName) {
    return G_cdnUrl + 'qqemoji/image/word_big_image/' + iconName + '.png';
}

export function G_PropIconUrl(iconName) {
    return G_cdnUrl + 'qqemoji/image/prop_icon/' + iconName + '.png';
}

export function G_PoseImageUrl(iconName) {
    return G_cdnUrl + 'qqemoji/image/pose_icon/' + iconName + '.png';
}

export function G_PoseIconUrl(iconName) {
    return G_cdnUrl + 'qqemoji/image/pose_icon2/' + iconName + '.png';
}

// export function G_PoseShowImageUrl(iconName) {
//     return G_cdnUrl + 'qqemoji/image/pose_show_image/' + iconName + '.png';
// }

export function G_emptyImageUrl() {
    return G_cdnUrl + 'qqemoji/image/empty.png';
}


// 广告相关日志埋点事件
export enum AdsEventType {
    AD_ENTRY_APP = 'ad_entry_app', //每次启动小程序且获取到unionid(微小)/openid(抖小)后上报
    AD_TOUCH = 'ad_touch', // 点击广告按钮
    AD_SLOT = 'ad_slot', // 容量
    AD_REAL_SLOT = 'ad_real_slot', // 请求数
    AD_ERROR = 'ad_error', // 返回广告错误
    AD_FILL = 'ad_fill', // 填充
    AD_SHOW = 'ad_show', // 展示
    AD_IMPRESS = 'ad_impress', // 有效展示
    AD_CLICK = 'ad_click', // 点击
    AD_EXPOSURE = 'ad_exposure', // 曝光时长
    AD_REWARD = 'ad_reward', // 激励奖励
    AD_COMPLETE = 'ad_complete', // 激励完播
    AD_CLOSE = 'ad_close', // 激励关闭
    AD_SKIP = 'ad_skip' // 跳过
}

// // 服务器基础状态
// export enum ServeBaseState {
//     Normal = 0, // 正常
//     Maintaining = 1, // 维护
//     HighLoad = 2 // 高负载，不允许新建账号了
// }

// 预制路径
export const UI_NAME = {
    // --common--
    //Alert: 'common://alert', //通用确认弹窗
    //AlertTip: 'common://alert_tip', //通用确认弹窗
    // NoticePanel: 'common://notice_panel', //公告
    HelpPanel: 'battle://help_panel', //帮助页面
    Alert: 'common://alert',

    GameSuccessPanel: 'battle://battle_success_panel',//游戏胜利
    GameFailPanel: 'battle://battle_fail_panel', //游戏失败
    GameFailPanelFish: 'battle://battle_fail_panel_fish', //捕鱼游戏失败
    GameEndCaoCao: 'battle://battle_caocao_end', //曹贼休走结算
    GameRevivePanel: 'battle://battle_revive_panel', //复活界面
    BattleUseProp: 'battle://battle_use_prop',
    AdsShowPanel: 'battle://ads_show_panel',
    SetPanel: 'home://set_panel',//设置
    GuildPanel: 'battle://guild_panel',
    CollectNewPanel: 'collection://collection_new_panel',//词条收集
    CollectionPanel: 'collection://collection_panel',//词条收集2
    CollectionTip: 'collection://collection_tip',
    GuidePanel: 'guide://guide_panel',
    RankPanel: 'rank://rank_panel',
    UserPanel: 'user://user_panel',
    ChangeLocPanel: 'user://change_loc_panel',
    CollectWordDetail: 'collection://collect_word_detail', //收集册词条详细信息
    CollectPoseDetail: 'collection://collect_pose_detail', //收集册形象详细信息
    InviteFriendPanel: 'invite://invite_friend_panel',//邀请有礼
    CommonRewardPanel: 'common://common_reward_panel',
    GameClubPanel: 'gameclub://game_club_panel',//游戏圈
    GameClubHelp: 'gameclub://game_club_help',//游戏圈权限打开 
    EmailPanel: 'email://email_panel',//邮件
    EmailDetailPanel: 'email://email_detail_panel',
    NoticePanel: 'notice://notice_panel',//公告
    AnswerPanel: 'answer://answer_panel',//每日问答
    GameChallengePanel: 'gameChallenge://game_challenge_panel',
    GameChallengeHelp: 'gameChallenge://game_challenge_help',
};


export const RES_TYPE = {

}

// // 常用道具
export enum ITEM_ID {

}


export const ITEM_TYPE = {
    Pose: "pose",
    Prop: 'prop',
}


// 远程bundle方式加载资源
export const RES_URL = {
    //     BATTLE_NPC: '{0}://{1}', // 怪物形象
    //     ELF_SPINE: '{0}://{1}', // 精灵形象
    //     SKILL_ID: '{0}://skill', // 战斗技能
    //     SKILL_START_EFFECT: '{0}://start_effect' // 发起攻击的单位特效

    //     //   // ------- 加密资源 ---------
    //     //  ROLE_SKIN: '{0}://{1}', // 角色皮肤 skin/part/name
};

export enum REMIND_KEY {
    Config_Change // 配置修改
}

// remote方式加载的远程资源
// export const REMOTE_RES_URL = {
//     //     // ------- 加密资源 ---------
//     //     ROLE_SKIN: 'res/skin/{0}/{1}.bin', // 角色皮肤 skin/part/name
//     //     ICON_SUIT: 'res/suits/{0}.abin', // 套装 suits/name
//     //     // ------- 非加密资源 ---------
//     //     BG_ITEM: 'res/items/{0}_bg_{1}.png', //item://equip_skin_bg_0,或 item_bg_0
//     //     ICON_ITEM: 'res/items/{0}.png',
//     //     //  ------- 远程plist 资源加载 ----------
//     //     REMOTE_ATLAS: 'res/atlas/{0}', // atlas 图集文件加载
// };

// 倒计时时间ID
export const TIMER_ID = {
    GAME_SERVER_TIME: 'game_server_time',
};

// UI层事件名称
export const UI_EVENT_NAME = {
    GAME_ERROR: 'game_error', //游戏异常
    GAME_WIN_CLOSE: 'game_win_close', //弹窗关闭通知
    GAME_WIN_SHOW: 'game_win_show', //弹窗显示
    GAME_EXIT: 'game_exit', // 游戏中途踢出
    GAME_ENTER_FINISH: 'game_enter_finish', //作为获取游戏数据结束标志
    GAME_SWITCH_SCENE_PRE: 'game_switch_scene_pre', // 切换场景前
    GAME_SWITCH_SCENE: 'game_switch_scene', // 切花游戏场景后
    // GAME_REFRESH_NEXT_DAY: 'game_refresh_next_day', // 跨天刷新
    //UPDATE_SERVER_LIST: 'update_server_list', // 服务器列表
    //SWITCH_SERVER: 'switch_server', // 切换当前服务器
    //LOAD_PLIST_SKIN_OVER: 'load_plist_skin_over', // 远程加载皮肤准备完毕
    SHOW_LOG_VIEW: 'SHOW_LOG_VIEW',
    LOADING_SHOW: 'LOADING_SHOW',
    COLLECTION_HEID_ITEM_TIPS: 'COLLECTION_HEID_ITEM_TIPS',

    //game
    CIRCLE_FIRST_CONTACT: 'circle_first_contact',//气泡首次碰撞
    CIRCLE_FULL_BOOM: 'circle_full_boom', //气泡满了爆开,
    UNDERPIN_DESTORY_BROADCAST: 'underin_destory_broadacst',//底座销毁广播
    SKILL_TRIGGER: 'skill_trigger',//技能触发
    COLLECTION_WORD: 'colltion_word', //收集词条
    COLLECTION_WORD_UPDATE: 'colltion_word_updatee',//词条飞到收集栏数量更新
    COLLECTION_FACE: 'collection_face',
    WORD_TRIGGER: 'word_trigger',//词条触发
    GAME_NEXT: 'game_next', //重新开始游戏
    CIRCLE_TOUCH_DESTORY: 'circle_touch_destory', //气泡点击销毁
    READY_CIRCLE_CHANGE_CAIHONG: 'ready_circle_change_caihong',//准备气泡face都变成彩虹
    USE_BATTLE_PROP: 'use_battle_prop',
    FIRST_BOOM_GUIDE: 'first_boom_guide',
    Popup_Show: 'game_battle_pause',
    Popup_Close: 'game_battle_resume',
    TOUCH_ONE_DESTORY: 'touch_one_destory',
    COMBO_TOAST_MOVEUP: 'combo_toast_moveup',
    CIRCLE_SHOOT: 'circle_shoot',
    EMAIL_STATE_CHANGE: 'email_state_change',
    EMAIL_INFO: 'email_info',
    STAGE_MOVE: 'stage_move',
    EVENT_FISH_RANK: 'event_fish_rank', //捕鱼排行榜
    EVENT_CAOCAO_RANK: 'event_caocao_rank', //曹操排行榜
};

// export const ANIMATION_EVENT = {
//     ANIMATION_END_CALLBACK: 'animation_end_callback',
//     ANIMATiON_STET_CALLBACK: 'animation_start_callback',
// }

// Data 数据层事件
export const DATA_EVENT_NAME = {
    UPDATE_PLAYER_Loaction: 'update_player_location',
    UPDATE_PLAYER_INFO: 'update_player_info',
    RANK_AREA: 'rank_area', //地区排行
    GAME_INFO: 'game_info',//游戏数据
    GAME_CLUB_INFO: 'game_club_info',//游戏圈信息
    GET_NEW_WORD: 'get_new_word',//获得新的词条
    GET_INVITE_INFO: 'get_invite_info',//获取摇人信息  邀请好友
    GAME_INFO_UPDATE: 'game_info.update',//game信息更新
};

// 数据类名称
export const DATA_NAME = {
    //ABTEST_DATA: 'abtest_data',
    BATTLE_DATA: 'battle_data',
    COMMON_DATA: 'common_data',
    FEATURE_STATUS_DATA: 'feature_status_data',
    GUIDE_DATA: 'guide_data',
    ITEM_DATA: 'item_data',
    PLAYER_DATA: 'player_data',
    //RECHARGE_DATA: 'recharge_data',
    //SHOP_DATA: 'show_data',
    SKILL_DATA: 'skill_data',
    STORY_DATA: 'story_data',
    TASK_DATA: 'TASK_DATA',
    WORD_DATA: 'WORD_DATA',
    HOME_DATA: 'HOME_DATA',
};

// NET层事件名称
// export const NET_EVENT_NAME = {
//     NET_UPDATE_ITEMS: 'net_update_items',
//     NET_UPDATE_SKINS: 'net_update_skins'
// };

// Storage 本地存储key
// export const STORAGE_KEY = {
//     USER_NAME: 'niudan_user',
//     PASS_WORD: 'niudan_pwd',
// };

// 展示方式
export enum ItemShowType {
    OWNER = 0, // 自身拥有
    ONLY_SHOW = 1, // 数量展示
    COST_SHOW = 2, // 花费展示
    COST_OWNER = 3 // 花费和自身展示
}

// 领奖状态
export enum REWARD_STATUS {
    INVALID = 0,
    CLAIMABLE,
    CLAIMED
}



//功能ID  Key和按钮名称保持对应 比如：Arena 按钮对应 btn_arena
// export enum FeatureId {
//     Arena = 1, //竞技场
//     //扭蛋升级
//     Gacha_Upgrade = 2,
//     //主线关卡
// }

export enum CountdownTypeBy {
    'ss' = 1,
    'MM:ss' = 2,
    'HH:MM:ss' = 3,
    'HH:MM' = 4,
    'dd天' = 5,
    'dd天HH时' = 6,
    'dd天HH时MM分' = 7,
    'dd天HH:MM:ss' = 8,
    'ss秒' = 9,
    'MM分ss秒' = 10,
    'HH时MM分ss秒' = 11,
    'dd天HH时MM分ss秒' = 12,
    'MM分' = 13,
    'HH时' = 14,
    'HH时MM分' = 15
}

// 按钮提示类型
export enum REMIND_TYPE {
    None = 0,
    DAILY_COST_TIP, //今日花费提示
    CURRENT_LOGIN_TIP // 本次登录不再提示
}


//========================================================
export enum CircleSizeType { //气泡大小类型  暂时不用
    Small = 0,
    Medium = 1,
    Big = 2,
    Max = 3,
}

export enum CircleState {
    Wait = 0, //在右上角等待
    Ready = 1, //准备发射
    Move = 2, //玩家移动中
    Shoot = 3, //下落
    Pool = 4,//在池子中
    Delete = 5, //自爆销毁
    Lock = 6,
}

export enum CircleKindType {
    Null = 0,
    OneColor = 1,
    TwoColor = 2,
}

export enum GroupType {
    None = 0,
    Default = 1,
    Circle = 2,
    Face = 4,
    Skil = 16,
    Ground = 32,
}

export const anyCircleType: number = 8;


//材质类型
export enum MaterialType {
    None = '',
    SpriteDefault = 'ui-sprite-material',
    GraySprite = 'ui-sprite-gray-material',
    FlashLight = 'flash-light',
    Ripple = 'ui-sprite-ripple', //水波纹
}

export enum GameBattleStatus {
    None = 0,
    Playing = 1,
    Pause = 2,
    End = 3,
}


export interface Long {
    low: number;
    high: number;
    unsigned: boolean;
}

export const PushType = {
    Post: 'POST',
    Get: 'GET',
}

export enum GuideType {
    None = 0,
    Tip_Hand = 1,
    Help_Tip_1 = 2,
    Help_Tip_2 = 3,
    Help_Tip_3 = 4,
    Tip_Collecting = 5,
}

export enum ShareOrAds {
    None = 0,
    Share = 1,
    Ads = 2,
}

export enum RankType {
    None = 0,
    Game = 1,
    CatchFish = 2,
}

