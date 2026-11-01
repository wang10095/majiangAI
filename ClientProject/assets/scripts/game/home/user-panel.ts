import { _decorator, Node, Label, Sprite } from 'cc';


import { SuperPanel } from '../../frame/center/components/super-panel';
import { DataManager } from '../data/data-manager';
import { G_loadRemoteUrlImg } from '../ui-commonset';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { DATA_EVENT_NAME, UI_NAME } from '../constant/common-define';
import { isMiniGame } from '../game-define';
import { sdkUtils } from '../../frame/sdk-common/sdk-utils';
import { Toast } from '../../frame/center/components/toast';
const { ccclass, property } = _decorator;

@ccclass('UserPanel')
export class UserPanel extends SuperPanel {
    @property({
        type: Sprite
    })
    head: Sprite = null;

    @property({
        type: Label
    })
    labName: Label = null;

    @property({
        type: Label
    })
    labJoin: Label = null;

    @property({
        type: Label
    })
    labUid: Label = null;


    @property({
        type: Label
    })
    challengeCountAll: Label = null;

    @property({
        type: Label
    })
    labLoc: Label = null;


    @property({
        type: Label
    })
    challengeCountToday: Label = null;

    onLoad(): void {
        super.onLoad();
    }

    start() {
        super.start();
        this.registerEmit(
            [
                // DATA_EVENT_NAME.UPDATE_PLAYER_Loaction,
                DATA_EVENT_NAME.UPDATE_PLAYER_INFO,
            ],
            [
                // this.updateUserLoaction,
                this.updateUserInfo,
            ],
            this
        );

        this.getUserInfo();

        const timestamp = DataManager.dataPlayer.regiserTime;
        const dateObj = new Date(timestamp);
        const dateStr = dateObj.toISOString().split('T')[0];
        const [year, month, day] = dateStr.split('-');

        this.labName.string = DataManager.dataPlayer.playerName;
        this.labJoin.string = `${year}年${month}月${day}日加入`;
        this.labUid.string = DataManager.dataPlayer.uid + '';
        this.challengeCountAll.string = DataManager.dataPlayer.game_total_count + '';
        this.challengeCountToday.string = DataManager.dataPlayer.game_count + '';

        this.labLoc.string = DataManager.dataPlayer.location;

        const avatar = DataManager.dataPlayer.playerAvatar;
        if (avatar && avatar != '') {
            G_loadRemoteUrlImg(avatar, this.head);
        }
    }

    getUserInfo() {
        if (isMiniGame) {
            if (DataManager.dataPlayer.playerAvatar != '') {
                //已经有头像 直接加载
                G_loadRemoteUrlImg(DataManager.dataPlayer.playerAvatar, this.head);
                return;
            }
            this.onClickUpdateHead();
        }
    }

    onClickChangeLoc() {
        if (DataManager.dataPlayer.edit_adcode_count <= 0) {
            Toast.showToast('修改次数已用完');
            return;
        }
        uiManager.show(UI_NAME.ChangeLocPanel);
    }

    onClickUpdateHead() {
        sdkUtils.getUserInfo((userInfo: any) => {
            console.log('=====getUserInfo==================', userInfo)
            if (!userInfo) {
                return;
            }
            //向服务器更新个人信息
            const data = {
                nickname: userInfo.nickName,
                avatar: userInfo.avatarUrl,
            }

            //设置玩家名字
            DataManager.dataPlayer.playerName = userInfo.nickName;
            this.labName.string = userInfo.nickName;

            DataManager.dataPlayer.requestUpdateUserInfo(data);
        })
    }

    updateUserInfo() {
        this.labName.string = DataManager.dataPlayer.playerName;
        this.labLoc.string = DataManager.dataPlayer.location;

        console.log('=======获取玩家信息==========', DataManager.dataPlayer.playerAvatar)
        const avatar = DataManager.dataPlayer.playerAvatar;
        if (avatar && avatar != '') {
            G_loadRemoteUrlImg(avatar, this.head);
        }

    }

}
