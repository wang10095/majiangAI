import { _decorator, Node, Label, UITransform, find, Color, view, Widget, v3, sys, Sprite, isValid, UIOpacity, director, Toggle } from 'cc';


import { SuperPanel } from '../../frame/center/components/super-panel';
import { SpriteFrame } from 'cc';
import { Manager } from '../../frame/center/manager';
import { instantiate } from 'cc';
import { G_shareGame } from '../common';
import { DataManager } from '../data/data-manager';
import { G_setRemoteSpriteFrame } from '../ui-commonset';
import { G_PoseImageUrl, G_WordIconUrl } from '../constant/common-define';
import { Toast } from '../../frame/center/components/toast';
import { isMiniGame } from '../game-define';
const { ccclass, property } = _decorator;

@ccclass('CollectWordDetail')
export class CollectWordDetail extends SuperPanel {
    @property({
        type: Label
    })
    labTitle: Label = null;

    @property({
        type: Sprite
    })
    wordImg: Sprite = null;

    @property({
        type: Label
    })
    labDesc: Label = null;

    @property({
        type: Node
    })
    layout: Node = null;

    @property({
        type: Node
    })
    spriteAdd: Node = null;

    _wordId = null;
    show(wordId): void {
        this._wordId = wordId;
    }

    protected onLoad(): void {
        super.onLoad();
        this.registerEmit(
            [

            ],
            [

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
        const data: Word = Config.Word[this._wordId];
        this.labTitle.string = data.wordName;

        this.labDesc.string = data.wordDes;

        G_setRemoteSpriteFrame(this.wordImg, G_WordIconUrl(data.wordIcon));

        for (let i = 0; i < data.faceArray.length; i++) {
            const faceId = data.faceArray[i];
            const image = Config.Face[faceId].image;
            const path = `model://image/${image}/spriteFrame`;
            const spf: SpriteFrame = await Manager.bundleManager.load<SpriteFrame>(path, SpriteFrame);

            const node = new Node();
            node.addComponent(UITransform);
            const sprite = node.addComponent(Sprite);
            sprite.spriteFrame = spf;
            node.parent = this.layout;

            if (i < data.faceArray.length - 1) {
                const nodeAdd = instantiate(this.spriteAdd);
                nodeAdd.parent = this.layout;
                nodeAdd.active = true;
            }
        }
    }

    //保存本地相册
    onClickDownLoad() {
        if (!isMiniGame) {
            return
        }

        wx.getSetting({
            success: (res) => {
                if (!res.authSetting['scope.writePhotosAlbum']) {
                    console.log('========onClickDownLoad======还没权限=====')
                    wx.authorize({
                        scope: 'scope.writePhotosAlbum',
                        success: () => {
                            this.saveImageToPhone();
                        },
                        fail: () => {  //手动拒绝了授权
                            Toast.showToast('相册权限未打开，请在右上角设置中开启');
                        }
                    })
                } else {
                    console.log('========onClickDownLoad=====有权限=====')
                    this.saveImageToPhone();
                }
            }

        })
    }

    saveImageToPhone() {
        const wordIcon = Config.Word[this._wordId].wordIcon;
        wx.downloadFile({
            url: G_WordIconUrl(wordIcon),
            success(res) {
                wx.saveImageToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success() {
                        console.log('====onClickDownLoad======save success=====1=======', res.tempFilePath)
                        Toast.showToast('保存图片成功')
                    }
                })
            }
        })
    }

    //创作
    onClickCreate() {
        Toast.showToast('敬请期待');
    }
    //分享
    onClickShare() {
        G_shareGame('/sharebeforelogin/?fromType=word_collect_share&uid=' +
            DataManager.dataPlayer.uid +
            '&platform=' +
            getGameGlobal().platform +
            '&version=' +
            getGameGlobal().gameVersion +
            '&timestamp=' +
            new Date().getTime());
    }

}
