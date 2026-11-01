
import { SuperData } from './super-data';
import { DATA_EVENT_NAME, DATA_NAME, PushType } from '../constant/common-define';
import Utils from '../../frame/center/utils/utils';
import { DataManager } from './data-manager';
import { MessageID } from '../constant/message-define';
import { RED_DOT_KEY } from '../common/red-dot';

export class DataPlayer extends SuperData {
    name = DATA_NAME.PLAYER_DATA;
    /**
     * 玩家信息
     */
    playerId: string; //用户uid
    playerName: string; //用户名字
    playerAvatar: string = '';//用户头像
    playerFrame: number; //用户头像框
    // playerLevel: number; //用户等级
    // playerExp: number; // 经验   
    loginTime: number; // 本次登录服务器时间(秒)
    regiserTime: number; //注册时间 时间戳(秒)
    location: string; // 玩家所在地 省份
    locationCode: number = 980000;

    // platformAvatar: string;
    open_id: string;
    uid: string;
    club_ts: number; //是否加入游戏圈
    invite_stage: number = 0;
    pose_id: string = '';

    edit_adcode_count: number; //修改地区次数
    game_count: number; //今日挑战次数
    game_total_count: number;//总挑战次数
    game_pass_count: number = 0;//通关次数

    //深海捕鱼信息
    fish_count: number;
    fish_game_count: number;
    fish_game_total_count: number;
    fish_rank: number;

    caocao_rank: number; //曹贼休走排名
    caocao_time: number = 0; //曹贼休走最快通关时间
    pk_game_count: number = 0;

    user_code: string;

    session_code: string;
    //=====================================================
    guideId = 1; // 当前引导组
    guideStepId = 101; // 当前引导步骤
    playerInitPlatform = 'ios'; // 玩家新注册平台
    ttGameEnterRewardStatus = false; // 是否领取了头条入口奖励
    //=========================================================================================
    allRankArea = [];
    isFirstEnter = true;
    currentLoginRemind: { [id: number]: 'on' | 'off' } = {}; //本次登陆不再提醒

    isNewRegister: boolean = false;

    netMessageHanders = {
        [MessageID.UpdateUserInfo]: (sendData: any, data: any) => {
            console.log('====UpdateUserInfo================', sendData, data)
            if (data.user.nickname) {
                this.playerName = data.user.nickname;
            }
            if (data.user.avatar) {
                this.playerAvatar = data.user.avatar;
            }
            if (data.user.adcode) {
                this.locationCode = data.user.adcode;
            }
            if (data.user.province) {
                this.location = data.user.province;
            }
            if (data.user.edit_adcode_count) {
                this.edit_adcode_count = data.user.edit_adcode_count;
            }

            this.dispatchUIEmit(DATA_EVENT_NAME.UPDATE_PLAYER_INFO)
        },
        [MessageID.PushLocation]: (sendData: any, data: any) => {
            console.log('====PushLocation================', sendData, data)
            this.location = data.user?.province;
            this.locationCode = data.user?.adcode;

            this.dispatchUIEmit(DATA_EVENT_NAME.UPDATE_PLAYER_Loaction)
        },
        [MessageID.RankArea]: (sendData: any, data: any) => {
            console.log('====RankArea==================', data)

            this.allRankArea = data.cityList;
            this.allRankArea.sort((a, b) => { //排序 从多到少
                return b.total - a.total;
            })
            this.dispatchUIEmit(DATA_EVENT_NAME.RANK_AREA, data);
        },
        [MessageID.GameInfo]: (sendData: any, data: any) => {
            console.log('=========GameInfo=========', data);
            this.game_count = data.game_count;
            this.game_total_count = data.game_total_count;
            DataManager.dataPlayer.invite_stage = data.invite_stage; //邀请阶段
            DataManager.dataPlayer.pose_id = data.pose_id;
            this.fish_count = data.fish_count;
            this.fish_game_count = data.fish_game_count;
            this.fish_game_total_count = data.fish_game_total_count;
            this.fish_rank = data.fish_rank;
            this.game_pass_count = data.level; //通关次数

            this.caocao_rank = data.pk_rank;
            this.caocao_time = data.pk_time;
            this.pk_game_count = data.pk_game_count;



            this.dispatchUIEmit(DATA_EVENT_NAME.GAME_INFO, data);
            this.dispatchUIEmit('SET_RED_DOT', RED_DOT_KEY.DAILY_CHALLENGE, this.fish_game_count == 0 || this.pk_game_count == 0);  //红点逻辑
        },
        [MessageID.GameInfoUpdate]: (sendData: any, data: any) => { //game info 更新
            if (data.pose_id) {
                this.pose_id = data.pose_id;
            }

            if (data.self_rank != null && data.self_rank != undefined) {

                if (sendData.fish_count) {
                    this.fish_count = data.fish_count;
                    this.fish_rank = data.self_rank;
                } else if (sendData.pk_time) {
                    this.caocao_time = data.pk_time;
                    this.caocao_rank = data.self_rank;
                }
            }
            if (data.level) {
                this.game_pass_count = data.level;
                console.log('======GameInfoUpdate============game_pass_count======', this.game_pass_count)
            }
            this.dispatchUIEmit(DATA_EVENT_NAME.GAME_INFO_UPDATE)
        }

    };

    public init(): void {
        super.init();
    }

    public setData(userInfo: any) {
        const regiserTime = new Date(userInfo?.created_at).getTime();
        this.open_id = userInfo?.openid;
        this.uid = userInfo?.id;
        this.regiserTime = regiserTime;
        this.playerAvatar = userInfo?.avatar || '';
        this.playerName = userInfo?.nickname;
        this.loginTime = DataManager.getServerTime();
        this.location = userInfo.province;
        this.locationCode = userInfo.adcode || 980000;
        this.session_code = userInfo.session_code;
        this.club_ts = userInfo.club_ts;
        this.user_code = userInfo.user_code;
    }


    // // 设置玩家当前服务器
    // setCurrentServer(serverId: number, serverName: string) {
    //     getGameGlobal().currentServerId = serverId;
    //     getGameGlobal().currentServerName = serverName;
    // }

    // // 获取玩家当前服务器
    // getCurrentServer() {
    //     return { serverId: getGameGlobal().currentServerId, serverName: getGameGlobal().currentServerName };
    // }

    // --------- 消息发送和接收 ------------------
    //更新个人信息
    requestUpdateUserInfo(data) {
        this.sendMessage(MessageID.UpdateUserInfo, data, PushType.Post)
    }

    //更新游戏数据信息
    requestUpdateGameInfo(data) {
        this.sendMessage(MessageID.GameInfoUpdate, data, PushType.Post)
    }

    requestGetLocation(latitude: number, longitude: number) {
        const data = {
            latitude: latitude,
            longitude: longitude,
        }
        this.sendMessage(MessageID.PushLocation, data, PushType.Post);
    }

    requestRankArea() {
        const data = {

        }
        this.sendMessage(MessageID.RankArea, data, PushType.Get)
    }

    requestGameInfo() {
        const data = {

        }
        this.sendMessage(MessageID.GameInfo, data, PushType.Get)
    }

    public clear(): void {
        super.clear();

        this.playerId = null;
        this.playerName = null;
        this.playerAvatar = null;
        // this.platformAvatar = null;
        this.playerFrame = null;
        // this.playerLevel = 1;
        // this.playerExp = 0; // 经验
        this.location = null;
        this.locationCode = null;

        this.open_id = null;
        this.uid = null;
        this.guideStepId = 101; // 当前引导步骤
        this.playerInitPlatform = 'ios'; // 玩家新注册平台
        this.ttGameEnterRewardStatus = false; // 是否领取了头条入口奖励
        this.regiserTime = 0;
        this.isFirstEnter = true;
        this.currentLoginRemind = {}; //本次登陆不再提醒
        Utils.storage.setGlobalStorageKey('');
    }
}
