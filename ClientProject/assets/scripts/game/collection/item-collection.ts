


import { Color, Event, Node, SpriteFrame, UITransform, _decorator, v3 } from 'cc';
import ScrollReuseItem from '../../frame/center/components/scroll-item';
import { Sprite } from 'cc';
import { Label } from 'cc';
import { DataManager } from '../data/data-manager';
import { Manager } from '../../frame/center/manager';
import Utils from '../../frame/center/utils/utils';
import { G_setSpriteGray } from '../common';
import { G_isTest, G_WordIconUrl, UI_EVENT_NAME } from '../constant/common-define';
import { G_setRemoteSpriteFrame } from '../ui-commonset';
const { ccclass, property } = _decorator;

@ccclass('ItemCollection')
export class ItemCollection extends ScrollReuseItem {
    @property({ type: [Node] })
    items: Node[] = [];

    @property({ type: Node })
    skillNode: Node = null;

    @property({ type: Node })
    tipNode: Node = null;

    @property({ type: Label, tooltip: "技能描述" })
    desc: Label = null;


    _faceId: number = 0;
    _lastIdx: number = -1;
    protected onLoad(): void {
        super.onLoad();
        this.registerEmit([
            UI_EVENT_NAME.COLLECTION_HEID_ITEM_TIPS,
        ], [
            this.hideDescTip,
        ], this);
    }


    public renewView(dataIndex: number, data: any) {
        super.renewView(dataIndex, data);
        // 判断有没有收集到
        let info = [];
        if (G_isTest) {
            const wordCollect = Utils.storage.getItem('word_colelction');
            if (wordCollect && wordCollect !== '') {
                info = JSON.parse(wordCollect); // '[10001,10002]'
            }
        } else {
            info = DataManager.dataHome.wordCollection;
        }

        // 技能
        const skillIcon = this.skillNode.getChildByName("Face").getComponent(Sprite);
        if (skillIcon && data.skillIcon && data.skillIcon != "") {
            this.setSkillSpriteFrame(skillIcon, data.skillIcon);
        }
        // this.setSkillSpriteFrame(skillIcon, "btn_random_boom1");//test

        let unLockCount: number = 0;
        for (let index = 0; index < data.wordID.length; index++) {
            let wordId = data.wordID[index];
            wordId = G_isTest ? wordId : wordId + '';
            if (info.length > 0 && info.indexOf(wordId) > -1) {
                unLockCount++;
                // console.log("collection Config.Word: ", Config.Word);
                const wordData = Config.Word[wordId];
                let entry: Node = this.items[index];
                entry.getChildByName("Label").getComponent(Label).string = "" + wordData.wordName;
                const face = entry.getChildByName("Mask").getChildByName("Face").getComponent(Sprite);
                if (face) {
                    if (wordData.wordIcon != "") {
                        // this.setWordSpriteFrame(face, wordData.wordIcon);
                        G_setRemoteSpriteFrame(face, G_WordIconUrl(wordData.wordIcon));
                    }

                }
            }
        }

        this.desc.string = "" + data.skillDes;
        if (unLockCount >= 3) {
            G_setSpriteGray(this.skillNode, false);
            //技能解锁
            this.skillNode.getChildByName("Label").getComponent(Label).string = "已激活";//"已解锁";// 已激活
        } else {
            G_setSpriteGray(this.skillNode, true);
        }
    }

    showDesTip(event: Event, custom: string) {
        Manager.eventManager.emit(UI_EVENT_NAME.COLLECTION_HEID_ITEM_TIPS);

        if (custom != "") {
            let idx: number = parseInt(custom);
            // console.log("idx: ",idx, " _data:", this.data );
            if (this.isActivate(idx)) {
                this.tipNode.scale = v3(1, 1, 1);
                this.tipNode.getChildByName("desc").scale = v3(1, 1, 1);
                if (idx < 2) {
                    this.tipNode.scale = v3(-1, 1, 1);
                    this.tipNode.getChildByName("desc").scale = v3(-1, 1, 1);
                }
                this.tipNode.active = !this.tipNode.active;
                this.tipNode.position = v3(event.target.position.x, event.target.position.y + 80, 1);
            }
        }

    }

    hideDescTip() {
        this.tipNode.active = false;
    }

    isActivate(idx: number) {
        if (idx == 3) {
            this.desc.string = "" + this.data.skillDes;
            return true;
        }
        // 判断有没有收集到
        let info = [];
        if (G_isTest) {
            const wordCollect = Utils.storage.getItem('word_colelction');
            if (wordCollect && wordCollect !== '') {
                info = JSON.parse(wordCollect); // '[10001,10002]'
            }
        } else {
            info = DataManager.dataHome.wordCollection;
        }

        if (this.data) {
            let wordId = this.data.wordID[idx];
            wordId = G_isTest ? wordId : wordId + '';
            if (info.length > 0 && info.indexOf(wordId) > -1) {
                const wordData = Config.Word[wordId];
                if (wordData) {
                    this.desc.string = "" + wordData.wordDes;
                    return true;
                }
            }
        }

        return false;
    }

    async setSpriteFrame(face: Sprite, faceId: number) {
        const faceConfig = Config.Face[faceId];
        const faceName = faceConfig.image;
        const path = `model://image/${faceName}/spriteFrame`;
        face.spriteFrame = await Manager.bundleManager.load<SpriteFrame>(path, SpriteFrame);
    }

    async setSkillSpriteFrame(face: Sprite, skillName: String) {
        const path = `battle://image/${skillName}/spriteFrame`;
        face.spriteFrame = await Manager.bundleManager.load<SpriteFrame>(path, SpriteFrame);
    }

    // async setWordSpriteFrame(face: Sprite, pathName: string) {
    //     const path = `collection://image2/${pathName}/spriteFrame`;
    //     face.spriteFrame = await Manager.bundleManager.load<SpriteFrame>(path, SpriteFrame);
    // }


}