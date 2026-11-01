import { _decorator, Node, Label, Sprite } from 'cc';


import { SuperPanel } from '../../frame/center/components/super-panel';
import { G_shareGame, getGlobalCfgValue } from '../common';
import { DataManager } from '../data/data-manager';
import { DATA_EVENT_NAME, G_PoseImageUrl } from '../constant/common-define';
import { G_setRemoteSpriteFrame, G_setSpriteFrame } from '../ui-commonset';
const { ccclass, property } = _decorator;

@ccclass('InviteFriendPanel')
export class InviteFriendPanel extends SuperPanel {

    @property({
        type: Sprite
    })
    progress: Sprite = null;

    @property({
        type: Label
    })
    labProgress: Label = null;

    @property({
        type: Label
    })
    labInviteCount: Label = null;

    @property({
        type: Node
    })
    btnInvite: Node = null;

    @property({
        type: Node
    })
    btnGetReward: Node = null;

    @property({
        type: Sprite
    })
    poseSprite: Sprite = null;

    @property({
        type: Label
    })
    poseName: Label = null;

    onLoad(): void {
        super.onLoad();
    }

    start() {
        super.start();
        this.registerEmit(
            [
                DATA_EVENT_NAME.GET_INVITE_INFO,
            ],
            [
                this.updateInviteFriendInfo,
            ],
            this
        );

        this.updateInviteFriendInfo();
    }

    onClickInvite() {
        G_shareGame('/sharebeforelogin/?fromType=invite_friend&uid=' +
            DataManager.dataPlayer.uid +
            '&platform=' +
            getGameGlobal().platform +
            '&version=' +
            getGameGlobal().gameVersion +
            '&timestamp=' +
            new Date().getTime());
    }

    onClickRefresh() {
        //获取已邀请人数
        DataManager.dataHome.requestInviteFriendInfo();
    }

    updateInviteFriendInfo() {
        const data = DataManager.dataHome.inviteFriendInfo;
        const count = data.count;


        for (const key in data.reward) {
            const value = data.reward[key];
            if (count >= value.invite_user && DataManager.dataPlayer.invite_stage < Number(key)) {
                //领取奖励
                this.btnInvite.active = false;
                this.btnGetReward.active = true;
                this.labProgress.string = `${count}/${value.invite_user}`
                this.labInviteCount.string = ''
                this.progress.fillRange = 1.0


                const poseConfig = Config.Pose[value.pose_items.id];
                this.poseName.string = poseConfig.name;
                G_setRemoteSpriteFrame(this.poseSprite, G_PoseImageUrl(poseConfig.image))

                break;
            }

            if (count < value.invite_user) {
                this.btnInvite.active = true;
                this.btnGetReward.active = false;

                this.labProgress.string = `${count}/${value.invite_user}`
                this.labInviteCount.string = (value.invite_user - count) + ''
                let progress = count / value.invite_user;
                if (progress > 1.0) {
                    progress = 1.0;
                }
                this.progress.fillRange = progress

                const poseConfig = Config.Pose[value.pose_items.id];
                this.poseName.string = poseConfig.name;
                G_setRemoteSpriteFrame(this.poseSprite, G_PoseImageUrl(poseConfig.image))
                break;
            }
        }
    }

    //领取邀请好友奖励
    onClickGetReward() {
        DataManager.dataHome.requestInviteFriendReward();
    }

}
