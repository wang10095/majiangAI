import { _decorator, Node, Label, UITransform, find, Color, view, Widget, v3, sys, Sprite, isValid, UIOpacity, director, Toggle } from 'cc';

import { SuperPanel } from '../../frame/center/components/super-panel';
import { SpriteFrame } from 'cc';
import { Manager } from '../../frame/center/manager';
import { instantiate } from 'cc';
import { G_shareGame } from '../common';
import { DataManager } from '../data/data-manager';
import { G_setRemoteSpriteFrame } from '../ui-commonset';
import { DATA_EVENT_NAME, G_PoseImageUrl, G_WordIconUrl } from '../constant/common-define';
import { Toast } from '../../frame/center/components/toast';
const { ccclass, property } = _decorator;

@ccclass('CollectPoseDetail')
export class CollectPoseDetail extends SuperPanel {
    @property({
        type: Label
    })
    labTitle: Label = null;

    @property({
        type: Sprite
    })
    poseImg: Sprite = null;

    @property({
        type: Label
    })
    labDesc: Label = null;

    @property({
        type: Node
    })
    nodeUsing: Node = null;

    @property({
        type: Node
    })
    nodeUsing2: Node = null;

    @property({
        type: Node
    })
    btnUse: Node = null;

    _poseId = null;
    show(poseId): void {
        this._poseId = poseId;
    }

    protected onLoad(): void {
        super.onLoad();
        this.registerEmit(
            [
                DATA_EVENT_NAME.GAME_INFO_UPDATE
            ],
            [
                () => {
                    this.nodeUsing.active = this._poseId == DataManager.dataPlayer.pose_id;
                    this.nodeUsing2.active = this._poseId == DataManager.dataPlayer.pose_id;
                    this.btnUse.active = this._poseId != DataManager.dataPlayer.pose_id;
                }
            ],
            this
        );
    }

    start() {
        super.start();
        this.initUI();
    }

    //初始化
    private async initUI() {
        const data: Pose = Config.Pose[this._poseId];
        this.labTitle.string = data.name;

        this.labDesc.string = data.desc;
        G_setRemoteSpriteFrame(this.poseImg, G_PoseImageUrl(data.image));
        this.nodeUsing.active = this._poseId == DataManager.dataPlayer.pose_id;
        this.nodeUsing2.active = this._poseId == DataManager.dataPlayer.pose_id;
        this.btnUse.active = this._poseId != DataManager.dataPlayer.pose_id;

    }

    //使用
    onClickUse() {
        DataManager.dataPlayer.requestUpdateGameInfo({
            pose_id: this._poseId
        })
    }


}
