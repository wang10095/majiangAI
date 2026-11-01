


import { Color, Event, Node, SpriteFrame, UITransform, _decorator, v3 } from 'cc';
import ScrollReuseItem from '../../frame/center/components/scroll-item';
import { Sprite } from 'cc';
import { Label } from 'cc';
import { DataManager } from '../data/data-manager';
import { DATA_EVENT_NAME, G_PoseImageUrl, G_WordIconUrl, UI_EVENT_NAME, UI_NAME } from '../constant/common-define';
import { G_setRemoteSpriteFrame } from '../ui-commonset';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { ClickDelegate } from '../common/click-delegate';
const { ccclass, property } = _decorator;

@ccclass('ItemCollectNew')
export class ItemCollectNew extends ScrollReuseItem {
    @property({ type: Sprite })
    spriteNo: Sprite = null;

    @property({ type: Sprite })
    spriteWord: Sprite = null;

    @property({ type: Sprite })
    spritePose: Sprite = null;

    @property({
        type: Label
    })
    labName: Label = null;

    @property({
        type: Node
    })
    nodeShowing: Node = null;

    protected onLoad(): void {
        super.onLoad();

        this.registerEmit(
            [
                DATA_EVENT_NAME.GAME_INFO_UPDATE
            ],
            [
                () => {
                    this.nodeShowing.active = this._poseId == DataManager.dataPlayer.pose_id;
                }
            ],
            this
        );

    }

    _poseId = null;

    //词条收集和形象收集共用
    public renewView(dataIndex: number, data: any) {
        super.renewView(dataIndex, data);

        this.spriteNo.node.active = true;
        this.spritePose.node.active = false;
        this.spriteWord.node.active = false;
        this.nodeShowing.active = false;

        if (data.wordId) {

            if (DataManager.dataHome.wordCollection.includes(data.wordId + '')) {
                this.spriteNo.node.active = false;
                this.spriteWord.node.active = true;

                G_setRemoteSpriteFrame(this.spriteWord, G_WordIconUrl(data.wordIcon));
                this.spriteWord.getComponent(ClickDelegate).init(this, () => {
                    uiManager.show(UI_NAME.CollectWordDetail, data.wordId);
                });

                this.labName.string = data.wordName;
            } else {
                this.labName.string = '待收集';
            }

        } else {
            this._poseId = data.pose_id;

            if (DataManager.dataHome.poseCollection.includes(data.pose_id + '')) {
                this.spriteNo.node.active = false;
                this.spritePose.node.active = true;
                console.log('===========poseCollection==============', data.pose_id, data)
                G_setRemoteSpriteFrame(this.spritePose, G_PoseImageUrl(data.image));
                this.spritePose.getComponent(ClickDelegate).init(this, () => {
                    uiManager.show(UI_NAME.CollectPoseDetail, data.pose_id);
                });
                this.labName.string = '';
                this.nodeShowing.active = data.pose_id == DataManager.dataPlayer.pose_id;
            } else {
                this.labName.string = '待收集';
            }
        }


    }



}