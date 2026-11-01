import { _decorator, Animation, director, Node, Skeleton, sp } from 'cc';
import { SuperPanel } from '../../frame/center/components/super-panel';
import { Sprite } from 'cc';
import ScrollReuse from '../../frame/center/components/scroll-endless';
import { G_setRemoteSpriteFrame } from '../ui-commonset';
import { G_PoseImageUrl, ITEM_TYPE } from '../constant/common-define';
import { Label } from 'cc';

const { ccclass, property } = _decorator;
@ccclass('CommonRewardPanel')
export class CommonRewardPanel extends SuperPanel {
    @property({
        type: Node,
    })
    nodePose: Node = null;

    @property({
        type: Sprite,
    })
    poseSprite: Sprite = null;

    @property({
        type: Label,
    })
    poseName: Label = null;

    @property({
        type: Node,
    })
    propScroll: Node = null;

    _data = null;
    show(data: any): void {
        this._data = data;
    }

    protected onLoad(): void {
        super.onLoad();
    }

    start(): void {
        super.start();

        this.initUI();
    }

    initUI() {
        let poseArray = [];
        let propArray = [];
        this._data.forEach((value) => {
            if (value.type == ITEM_TYPE.Pose) {
                poseArray.push(value);
            } else {
                propArray.push(value)
            }
        })

        this.nodePose.active = poseArray.length > 0;
        this.propScroll.active = propArray.length > 0;
        if (poseArray.length > 0) {
            const poseConfig = Config.Pose[poseArray[0].id];
            this.poseName.string = poseConfig.name;
            G_setRemoteSpriteFrame(this.poseSprite, G_PoseImageUrl(poseConfig.image));
        }
        if (propArray.length > 0) {
            this.propScroll.getComponent(ScrollReuse).initView(propArray, 3);
        }

    }

    onClickScrollView(node, data2) {

        // console.log(data, data2);
        if (Number(data2) == 10) {
            this.close();
        }

    }

    //  "data": {
    //     "rewards": [
    //       {
    //         "type": "prop_clear_color_count",
    //         "id": "prop2",
    //         "count": 1
    //       },
    //       {
    //         "type": "items",
    //         "id": "pose1",
    //         "count": 1
    //       }
    //     ],
    //     "userGame": {
    //       "id": 1,
    //       "invite_stage": 1,
    //       "prop_move_out_count": 0,
    //       "prop_clear_color_count": 1,
    //       "prop_break_count": 0,
    //       "prop_change_count": 5
    //     }
    //   }


}