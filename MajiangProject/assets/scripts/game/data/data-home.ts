import { SuperData } from './super-data';
import { DATA_EVENT_NAME, DATA_NAME, PushType, UI_EVENT_NAME, UI_NAME } from '../constant/common-define';
import { MessageID } from '../constant/message-define';
import { DataPlayer } from './data-player';
import { DataManager } from './data-manager';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { RED_DOT_KEY } from '../common/red-dot';


export class DataHome extends SuperData {
    name = DATA_NAME.HOME_DATA;
    // ---------  数据逻辑处理   ------------------
    netMessageHanders = {
        [MessageID.gameClubInfo]: (sendData: any, data: any) => {
            console.log('=====gameClubInfo============', sendData, data);
            if (!DataManager.dataPlayer.club_ts && data.club_ts) {
                DataManager.dataPlayer.club_ts = data.club_ts;
                this.dispatchUIEmit(DATA_EVENT_NAME.GAME_CLUB_INFO, data);
            }
        },
        [MessageID.getUserItemsList]: (sendData: any, data: any) => {
            if (sendData.type == 'word') {
                this.wordCollection = [];
            }
            if (sendData.type == 'pose') {
                this.poseCollection = [];
            } else {
                this.wordCollection = [];
                this.poseCollection = [];
            }

            console.log('===========getUserItemsList============', sendData, data);
            if (data?.list) {
                data.list.forEach((info) => {
                    if (info.type == 'word') {
                        this.wordCollection.push(info.item_id);
                    } else if (info.type == 'pose') {
                        this.poseCollection.push(info.item_id);
                    }
                })
            }

        },

        [MessageID.UpdateNewWord]: (sendData: any, data: any) => {
            console.log('===========UpdateNewWord============', sendData, data);
            if (sendData.item_id) {
                this.wordCollection.push(sendData.item_id);
                this.dispatchUIEmit(DATA_EVENT_NAME.GET_NEW_WORD);
            }
        },
        [MessageID.GetInviteFriendInfo]: (sendData: any, data: any) => {
            this.inviteFriendInfo = data;
            this.dispatchUIEmit(DATA_EVENT_NAME.GET_INVITE_INFO, data);
        },
        [MessageID.GetInviteFriendReward]: (sendData: any, data: any) => {
            DataManager.dataPlayer.invite_stage = data.userGame.invite_stage; //下一阶段  todo

            uiManager.show(UI_NAME.CommonRewardPanel, data.rewards); //恭喜获得
            this.requestInviteFriendInfo(); //更新邀请好友信息
        },

        [MessageID.PlayGame]: (sendData: any, data: any) => {
            if (data.game_count) {
                DataManager.dataPlayer.game_count = data.game_count;
            }
            if (data.game_total_count) {
                DataManager.dataPlayer.game_total_count = data.game_total_count;
            }
            if (data.fish_game_count) {
                DataManager.dataPlayer.fish_game_count = data.fish_game_count;
            }
            if (data.fish_game_total_count) {
                DataManager.dataPlayer.fish_game_total_count = data.fish_game_total_count;
            }
        },
        [MessageID.EmailMessage]: (sendData: any, data: any) => {
            this.emailAllInfo = data.list;
            this.checkEmailReddot(); //检查邮件的红点
            this.dispatchUIEmit(UI_EVENT_NAME.EMAIL_INFO)
        },
        [MessageID.EmailRead]: (sendData: any, data: any) => {
            for (let i = 0; i < this.emailAllInfo.length; i++) {
                if (this.emailAllInfo[i].message_id === sendData.message_id) {  // 0 未读 1 已读未领取  2 已领取
                    this.emailAllInfo[i].state = 1;
                    break;
                }
            }
            this.checkEmailReddot();//检查邮件的红点
            this.dispatchUIEmit(UI_EVENT_NAME.EMAIL_STATE_CHANGE, sendData.message_id);
        },
        [MessageID.EmailGetReward]: (sendData: any, data: any) => {
            for (let i = 0; i < this.emailAllInfo.length; i++) {
                if (this.emailAllInfo[i].message_id === sendData.message_id) {  // 0 未读 1 已读未领取  2 已领取
                    this.emailAllInfo[i].state = 2;
                    break;
                }
            }
            uiManager.show(UI_NAME.CommonRewardPanel, data.rewards);
            this.checkEmailReddot();//检查邮件的红点
            this.dispatchUIEmit(UI_EVENT_NAME.EMAIL_STATE_CHANGE, sendData.message_id);
        },
        [MessageID.EmailDelAllHadRead]: (sendData: any, data: any) => {
            this.requestEmailInfo();
        },
        [MessageID.NoticeMessage]: (sendData: any, data: any) => {
            this.noticeInfo = data;
        },
        [MessageID.FishRank]: (sendData: any, data: any) => {
            this.fishRankInfo = data.list;
            this.dispatchUIEmit(UI_EVENT_NAME.EVENT_FISH_RANK);
        },
        [MessageID.CaoCaoRank]: (sendData: any, data: any) => {
            this.caocaoRankInfo = data.list;
            this.dispatchUIEmit(UI_EVENT_NAME.EVENT_CAOCAO_RANK);
        }
    };


    wordCollection: Array<string> = [];
    poseCollection: Array<string> = []; // 形象收集
    inviteFriendInfo = null;
    emailAllInfo: Array<any> = [];
    noticeInfo = [];
    fishRankInfo: Array<any> = [];
    caocaoRankInfo: Array<any> = [];

    public init(): void {
        super.init();
    }

    checkEmailReddot() {
        let hadNew = false;
        for (let i = 0; i < this.emailAllInfo.length; i++) {
            if (this.emailAllInfo[i].state === 0) {  // 0 未读 1 已读未领取  2 已领取
                hadNew = true;
                break;
            }
        }
        this.dispatchUIEmit('SET_RED_DOT', RED_DOT_KEY.EMAIL_BUTTON, hadNew);  //红点逻辑
    }

    // ---------  消息发送和接收end   ------------------

    requestGetEnterGameCircle(encryptedData: string, iv: string) {
        const data = {
            encryptedData: encryptedData,
            iv: iv
        }
        this.sendMessage(MessageID.gameClubInfo, data, PushType.Post)
    }

    requestGetCollectItem(_type) {
        const data = {
            page_size: 100,
            page: 1,
            type: _type,
        }
        this.sendMessage(MessageID.getUserItemsList, data, PushType.Post)
    }

    requestUpdateWord(wordId) {
        const data = {
            item_id: wordId + ''
        }
        this.sendMessage(MessageID.UpdateNewWord, data, PushType.Post);
    }

    //获取邀请好友信息  摇人
    requestInviteFriendInfo() {
        const data = {

        }
        this.sendMessage(MessageID.GetInviteFriendInfo, data, PushType.Get);
    }

    //领取邀请好友奖励
    requestInviteFriendReward() {
        const data = {};
        this.sendMessage(MessageID.GetInviteFriendReward, data, PushType.Get);
    }

    //进行游戏
    requestPlayGame(_type) {
        const data = {
            type: _type
        };
        this.sendMessage(MessageID.PlayGame, data, PushType.Post);
    }
    //邮件全部信息
    requestEmailInfo() {
        const data = {
            page_size: 10,
            page: 1,
            // type: 1, //不传 全部返  0 默认，1系统
        }
        this.sendMessage(MessageID.EmailMessage, data, PushType.Post);
    }
    requestEmailRead(message_id: number) {
        const data = {
            message_id: message_id
        }
        this.sendMessage(MessageID.EmailRead, data, PushType.Post);
    }
    requestEmailReward(message_id: number) {
        const data = {
            message_id: message_id
        }
        this.sendMessage(MessageID.EmailGetReward, data, PushType.Post);
    }

    //删除所有已读 已领取的邮件
    requestEmailDelAllRead(messageIds: Array<number>) {
        const data = {
            ids: messageIds
        }
        this.sendMessage(MessageID.EmailDelAllHadRead, data, PushType.Post);
    }

    //获取公告
    requestNoticeMessage() {
        const data = {
        }
        this.sendMessage(MessageID.NoticeMessage, data, PushType.Get);
    }

    //捕鱼排行榜
    requestFishRank() {
        const data = {
            page_size: 100,
            page: 1
        }
        this.sendMessage(MessageID.FishRank, data, PushType.Post);
    }


    //曹贼休走排行榜
    requestCaoCaoRank() {
        const data = {
            page_size: 100,
            page: 1
        }
        this.sendMessage(MessageID.CaoCaoRank, data, PushType.Post);
    }

    public clear(): void {
        super.clear();
        this.wordCollection = [];
        this.poseCollection = []; // 形象收集
        this.inviteFriendInfo = {};
    }
}
