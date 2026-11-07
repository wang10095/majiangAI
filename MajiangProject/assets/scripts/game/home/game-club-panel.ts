import { _decorator, Node, Label, Sprite } from 'cc';


import { SuperPanel } from '../../frame/center/components/super-panel';
import { G_shareGame, getGlobalCfgValue } from '../common';
import { DataManager } from '../data/data-manager';
import { DATA_EVENT_NAME, G_emptyImageUrl, G_headIconUrl, G_PoseImageUrl, UI_EVENT_NAME, UI_NAME } from '../constant/common-define';
import { convertToWorldSpaceAR, G_setRemoteSpriteFrame, G_setSpriteFrame } from '../ui-commonset';
import { isMiniGame } from '../game-define';
import { sys } from 'cc';
import { view } from 'cc';
import { uiManager } from '../../frame/center/managers/ui-manager';
const { ccclass, property } = _decorator;

@ccclass('GameClubPanel')
export class GameClubPanel extends SuperPanel {
    @property({
        type: Node
    })
    tip: Node = null;

    @property({
        type: Sprite
    })
    poseImage: Sprite = null;

    @property({
        type: Node
    })
    btnGameClub: Node = null;

    @property({
        type: Label
    })
    labPoseName: Label = null;

    _button = null;
    onLoad(): void {
        super.onLoad();

        this.checkGameCircle();
    }

    checkGameCircle() {
        if (isMiniGame) {
            console.log('===panel===checkGameCircle====000======');
            wx.getGameClubData({
                dataTypeList: [{ type: 1 }],
                success: (res) => {
                    console.log('======checkGameCircle====success======', res);
                }, fail: (res) => {
                    console.log('======checkGameCircle====fail======', res);
                }, complete: (res) => {
                    console.log('======checkGameCircle====complete======', res);
                }
            })
        }
    }


    start() {
        super.start();
        this.registerEmit(
            [
                UI_EVENT_NAME.Popup_Show,
                UI_EVENT_NAME.Popup_Close,
            ],
            [
                () => {
                    if (this._button) {
                        this._button.hide();
                    }

                },
                () => {
                    if (this._button) {
                        this._button.show();
                    }
                },
            ],
            this
        );


        const poseConfig = Config.Pose['pose1'];
        G_setRemoteSpriteFrame(this.poseImage, G_PoseImageUrl(poseConfig.image));

        this.labPoseName.string = poseConfig.name;



        this.createGameCircle();
        this.tip.active = false;
        //判断权限是否打开
        if (isMiniGame) {
            wx.getSetting({
                // withSubscriptions: false, //是否同时获取用户订阅消息的订阅状态，默认不获取。注意：withSubscriptions 只返回用户勾选过订阅面板中的“总是保持以上选择，不再询问”的订阅消息。
                success: (res) => {
                    if (!res.authSetting['scope.gameClubData']) {
                        console.log('========gameClubData======还没权限=====')
                        wx.authorize({
                            scope: 'scope.gameClubData',
                            success: () => {
                                console.log('========gameClubData======权限打开成功=====')
                                this.tip.active = false;
                            },
                            fail: () => {
                                console.log('========gameClubData======权限打开失败=====') //手动拒绝授权  
                                this.tip.active = true;
                            }
                        })
                    } else {
                        console.log('========gameClubData=====有权限=====')
                        this.tip.active = false;

                    }
                }

            })
        }

    }

    onClickQuanxian() {
        uiManager.show(UI_NAME.GameClubHelp);
    }

    createGameCircle() {
        if (isMiniGame) {
            const viewSize = view.getVisibleSize()
            // const wordPos = convertToWorldSpaceAR(this.btnGameClub);
            // const topD = (viewSize.height - wordPos.y) / 2

            const frameSize = view.getFrameSize();
            const wordPos = convertToWorldSpaceAR(this.btnGameClub);
            console.log('====createGameCircle=======2222=========', wordPos.y)
            const topD = frameSize.height - wordPos.y * frameSize.height / 1334;
            console.log('====createGameCircle=======4444=========', topD)

            if (!DataManager.dataPlayer.club_ts) {
                // const safeSize = view.getVisibleSize();
                // const topD = 900 * safeSize.height / 1334 / 2;
                const button = wx.createGameClubButton({
                    icon: 'green',
                    style: {
                        left: frameSize.width / 2 - 50,
                        top: topD + 30,
                        width: 100,
                        height: 50,
                        backgroundColor: '',
                        borderColor: '',
                        borderRadius: 0,
                        borderWidth: 0,
                        color: '',
                        fontSize: 0,
                        lineHeight: 0,
                        textAlign: 'left'
                    },

                    hasRedDot: false,
                    type: 'image',
                    image: G_emptyImageUrl()
                    // image: G_headIconUrl("chat_head_01")
                })

                button.show();
                this._button = button;
            }
        }
    }

    protected onDestroy(): void {
        super.onDestroy();
        if (this._button) {
            this._button.destroy();
        }
    }


}
