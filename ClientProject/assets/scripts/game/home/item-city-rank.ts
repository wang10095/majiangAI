


import { Node, SpriteFrame, _decorator } from 'cc';
import ScrollReuseItem from '../../frame/center/components/scroll-item';
import { Sprite } from 'cc';
import { Label } from 'cc';
import { Manager } from '../../frame/center/manager';
import { getRandomInt } from '../common';
import { FaceKindType } from '../../model/model-face';
import { DATA_EVENT_NAME, G_defaultIconUrl, G_headIconUrl, G_isTest, G_PoseIconUrl, G_PoseImageUrl, UI_NAME } from '../constant/common-define';
import { convertToNodeSpaceAR, convertToWorldSpaceAR, G_setRemoteSpriteFrame, G_setSpriteFrame } from '../ui-commonset';
import Utils from '../../frame/center/utils/utils';
import { UITransform } from 'cc';
import { ClickDelegate } from '../common/click-delegate';
import { DataManager } from '../data/data-manager';
import { Toast } from '../../frame/center/components/toast';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { SuperSpine } from '../../frame/center/components/super-spine';
import { size } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ItemCityRank')
export class ItemCityRank extends ScrollReuseItem {
    @property({
        type: Label,
        tooltip: "排名"
    })
    labRank: Label = null;

    @property({
        type: Label,
        tooltip: "排名"
    })
    labCityName: Label = null;

    @property({
        type: Label,
        tooltip: "排名"
    })
    labPassNumber: Label = null;

    @property({
        type: Node
    })
    nodeUserShow: Node = null;

    @property({
        type: Node
    })
    selfPose: Node = null;

    @property({
        type: Node
    })
    spine: Node = null;

    @property({
        type: Node
    })
    selfTip: Node = null;

    @property({
        type: Node
    })
    touchNode: Node = null;

    // @property({ type: Node, tooltip: "跳舞小人" })
    // UI_Dances: Node = null;


    protected onLoad(): void {
        super.onLoad();
        this.registerEmit(
            [
                DATA_EVENT_NAME.GAME_INFO_UPDATE
            ],
            [
                this.showSelfPose,
            ],
            this
        );
    }

    protected start(): void {
        super.start();

        this.nodeUserShow.active = false;

        const faceAll: Array<number> = [];
        for (const key in Config.Face) {
            if (Config.Face[key].faceKind === FaceKindType.CommonFace) {
                faceAll.push(Config.Face[key].faceId);
            }
        }





        // for (let index = 0; index < this.UI_Dances.children.length; index++) {
        //     const element = this.UI_Dances.children[index];
        //     const face: Sprite = element.getChildByName("Face").getComponent(Sprite);
        //     let idx = getRandomInt(0, faceAll.length - 1);
        //     this.setSpriteFrame(face, faceAll[idx]);

        //     const falseUser = Utils.utils.deepClone(Config.FalseUser);
        //     const info = Object.values(falseUser);
        //     const idx2 = getRandomInt(0, info.length - 1)
        //     const curInfo = info[idx2];
        //     const userIcon = curInfo.userIcon;
        //     G_setRemoteSpriteFrame(element.getChildByName("icon"), G_headIconUrl(userIcon));

        //     element.getComponent(ClickDelegate).init(this, () => {
        //         this.nodeUserShow.active = true;
        //         G_setRemoteSpriteFrame(this.nodeUserShow.getChildByName("head"), G_headIconUrl(userIcon));

        //         let name = curInfo.userName;
        //         if (name.length > 5) {
        //             name = name.slice(0, 3) + "..." + name.slice(-2);
        //         }

        //         this.nodeUserShow.getChildByName('name').getComponent(Label).string = name;

        //         const wordPos = convertToWorldSpaceAR(element);
        //         const pos = convertToNodeSpaceAR(wordPos, this.node);
        //         this.nodeUserShow.setPosition(pos.x + 30, pos.y + 100, pos.z);
        //     });
        // }
    }

    _data = null;
    public renewView(dataIndex: number, data: any) {
        super.renewView(dataIndex, data);
        this._data = data;

        let randId = dataIndex + 1;
        let cityName = data.name;
        let passCount = data?.total;
        if (G_isTest) {
            randId = data.rankId;
            cityName = data.name;
            passCount = data.passNumber;
        }
        this.labRank.string = `第${randId}名`;
        this.labCityName.string = cityName;
        this.labPassNumber.string = passCount + '';

        this.showSelfPose();
        this.initPlayerHead();
    }


    initPlayerHead() {
        this.spine.children.forEach((sprite: Node, idx) => {
            // let idx = getRandomInt(0, faceAll.length - 1);
            // this.setSpriteFrame(sprite, faceAll[idx]);

            if (sprite.name.indexOf('icon') > -1) {
                const falseUser = Utils.utils.deepClone(Config.FalseUser);
                const info = Object.values(falseUser);
                const idx2 = getRandomInt(0, info.length - 1)
                const curInfo = info[idx2];
                const userIcon = curInfo.userIcon;


                if (idx == 2 && DataManager.dataPlayer.locationCode == this._data.adcode) {
                    if (DataManager.dataPlayer.playerAvatar != '') {
                        G_setRemoteSpriteFrame(sprite, DataManager.dataPlayer.playerAvatar);
                    } else {
                        G_setRemoteSpriteFrame(sprite, G_defaultIconUrl());
                    }
                } else {
                    G_setRemoteSpriteFrame(sprite, G_headIconUrl(userIcon));
                }

                this.touchNode.children[idx].getComponent(ClickDelegate).init(this, () => {
                    if (idx == 2 && DataManager.dataPlayer.locationCode === this._data.adcode) {
                        this.onClickPoseColelct();
                    } else {
                        this.nodeUserShow.active = true;
                        G_setRemoteSpriteFrame(this.nodeUserShow.getChildByName("head"), G_headIconUrl(userIcon));

                        let name = curInfo.userName;
                        if (name.length > 5) {
                            name = name.slice(0, 3) + "..." + name.slice(-2);
                        }

                        this.nodeUserShow.getChildByName('name').getComponent(Label).string = name;

                        const wordPos = convertToWorldSpaceAR(this.touchNode.children[idx]);
                        console.log('=======wordPos========1===', wordPos);
                        const pos = convertToNodeSpaceAR(wordPos, this.node);
                        console.log('=======wordPos======2===', pos);
                        this.nodeUserShow.setPosition(pos.x + 30, pos.y + 200, pos.z);
                    }

                });

            }

        })
    }

    showSelfPose() {


        this.selfTip.active = DataManager.dataPlayer.locationCode === this._data.adcode;
        this.selfPose.active = DataManager.dataPlayer.locationCode === this._data.adcode;
        if (DataManager.dataPlayer.locationCode === this._data.adcode) {
            this.spine.getComponent(SuperSpine).playSpine('idle', true);
            if (DataManager.dataPlayer.pose_id != '') {
                const poseConfig = Config.Pose[DataManager.dataPlayer.pose_id];
                G_setRemoteSpriteFrame(this.selfPose, G_PoseIconUrl(poseConfig.icon));
            }
        } else {
            this.spine.getComponent(SuperSpine).playSpine('idle2', true);
        }

    }

    onClickPoseColelct() {
        uiManager.show(UI_NAME.CollectNewPanel, 1)
    }

    async setSpriteFrame(face: Sprite, faceId: number) {
        const faceConfig = Config.Face[faceId];
        const faceName = faceConfig.image;
        G_setSpriteFrame(face, `model://image/${faceName}`);
    }
}