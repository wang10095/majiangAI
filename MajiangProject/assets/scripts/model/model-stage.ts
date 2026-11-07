import { _decorator, instantiate, Node, Prefab, RigidBody2D, Sprite, SpriteFrame, tween, v3 } from 'cc';
import { SuperComponent } from '../frame/center/components/super-component';
import { DataManager } from '../game/data/data-manager';
import Random from '../frame/center/utils/tool';
import { Manager } from '../frame/center/manager';
import { changeParent, G_setSpriteFrame, gotoScene, loadMaterial } from '../game/ui-commonset';
import { MaterialType, UI_EVENT_NAME } from '../game/constant/common-define';
import Utils from '../frame/center/utils/utils';
import { ModelCircle } from './model-circle';
import { Toast } from '../frame/center/components/toast';
import { BATTLE_STAGE_TYPE } from '../game/data/data-battle';
import { UITransform } from 'cc';
import { getRandomInt } from '../game/common';
const { ccclass, property } = _decorator;

@ccclass('ModelStage')
export class ModelStage extends SuperComponent {
    @property({
        type: Node,
    })
    content: Node = null;

    @property({
        type: [Node],
        tooltip: '每一关位置线',
    })
    nodeLevels: Node[] = [];

    @property({
        type: Node,
    })
    boxNode: Node = null; //气泡的父节点


    @property({
        type: [Sprite],
        tooltip: '每一关背景',
    })
    bgs: Sprite[] = [];

    @property({
        type: [SpriteFrame],
        tooltip: '每一关背景',
    })
    bgSpf: SpriteFrame[] = [];


    nodeUnderpinBody: Node[] = [];
    nodeBarrier: Node[] = [];
    nodeFallBarrier: Node[] = [];
    stageBundles: Array<string> = [];


    onLoad(): void {
        super.onLoad();
    }

    _load = false;
    start() {
        super.start();
        this.boxNode.setSiblingIndex(20);
        this.content.setSiblingIndex(30);
        this.initStageInfo();

        const curBg = Utils.storage.getItem('battle_bg');
        if (curBg) {
            const idx = Number(curBg) - 1;
            this.bgs.forEach((sprite) => {
                sprite.spriteFrame = this.bgSpf[idx];
            })
        }

        if (DataManager.dataBattle.curStage > 1) {
            this._load = false;
            this.scheduleOnce(() => {
                if (!this._load) {
                    Toast.showToast('资源加载失败，请重新进入游戏')
                    // gotoScene('home');
                }
            }, 8)
        }

    }

    setStageBottom() {
        const startPos = this.nodeLevels[0].position;
        const endPos = this.nodeLevels[this.nodeLevels.length - 1].position;
        const distance = Math.abs(endPos.y - startPos.y);
        tween(this.node).delay(0.2).by(0, { position: v3(0, distance, 0) }).start();
    }

    async initStageInfo() {
        const stageConfig = Config.StageRandom;
        let weightArray = [];
        this.nodeUnderpinBody = [];

        for (const id in stageConfig) {
            const value = stageConfig[id];
            if (!weightArray[value.stageLevel]) {
                weightArray[value.stageLevel] = [];
            }
            weightArray[value.stageLevel].push(value);
        }

        console.log('=========weightArray==============', weightArray.length)


        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.CatchFish) {
            const bg = this.bgs[0];
            G_setSpriteFrame(bg, 'stage_parent://fish_bg');
            bg.getComponent(Sprite).sizeMode = Sprite.SizeMode.TRIMMED;
            bg.getComponent(Sprite).type = Sprite.Type.SIMPLE;
            const material = await loadMaterial(MaterialType.Ripple);  //水波纹
            bg.getComponent(Sprite).customMaterial = material;

            await this.setStageUI('fish_stage', 0);
            this.scheduleOnce(() => {
                this.moveBarriarCircleToBoxNode(0);
            }, 2.0);

            return;
        }

        if (DataManager.dataBattle.battleType === BATTLE_STAGE_TYPE.Caocao) {
            const bg = this.bgs[0];
            G_setSpriteFrame(bg, 'stage_parent://caocao_bg');
            bg.getComponent(Sprite).sizeMode = Sprite.SizeMode.TRIMMED;
            bg.getComponent(Sprite).type = Sprite.Type.SIMPLE;

            await this.setStageUI('caocao_stage', 0);
            this.scheduleOnce(() => {
                this.moveBarriarCircleToBoxNode(0);
            }, 2.0);

            return;
        }

        if (DataManager.dataBattle.curStage === 1) {
            const game_had_teach = Utils.storage.getItem('game_had_teach');
            if (!game_had_teach) {
                await this.setStageUI('stage0_0', 0);
            } else {
                await this.setStageUI('stage0_1', 0);
            }
            this.scheduleOnce(() => {
                this.moveBarriarCircleToBoxNode(0);
            }, 2.0);

            //提前加载第二大关 最后一小关
            const stageName = 'stage10_' + DataManager.dataBattle.curTao;
            Manager.bundleManager.load<Prefab>(stageName + "://" + stageName, Prefab);

            return;
        }

        const allArray = [];
        const tao = DataManager.dataBattle.curTao; //选哪一套

        for (let i = 10; i >= 1; i--) {
            const stageRandom = `stage${i}_${tao}`;
            if (i === 10) {
                await this.setStageUI(stageRandom, i - 1);
            } else {
                allArray.push(this.setStageUI(stageRandom, i - 1))
            }
        }

        // for (let i = weightArray.length - 1; i >= 1; i--) {
        //     const value: Array<StageRandom> = weightArray[i];

        //     let weight = [];
        //     value.forEach((stageRandom, idx) => {
        //         weight.push({ id: idx, weight: stageRandom.stageWeight })
        //     })
        //     const idx = Random.randByWeight(weight);
        //     const stageRandom = value[idx];

        //     if (i === weightArray.length - 1) {
        //         await this.setStageUI(stageRandom, stageRandom.stageLevel - 1);
        //     } else {
        //         allArray.push(this.setStageUI(stageRandom, stageRandom.stageLevel - 1))
        //     }
        // }

        await Promise.all(allArray);
        this._load = true;
        this.moveShowStage();
    }

    async setStageUI(stageName, idx) {
        const stagePath = stageName + '://' + stageName;
        const nodePrefab = await Manager.bundleManager.load<Prefab>(stagePath, Prefab);
        if (nodePrefab) {
            this.stageBundles[idx] = stageName;
            console.log('========加载stage success===========', stageName)
            const curNodeStage = instantiate(nodePrefab);
            curNodeStage.parent = this.nodeLevels[idx];

            this.nodeUnderpinBody[idx] = curNodeStage.getChildByPath('content/ground');
            this.nodeBarrier[idx] = curNodeStage.getChildByPath('content/node_barrier');
            this.nodeFallBarrier[idx] = curNodeStage.getChildByPath('content/node_fall_barrier');

        } else {
            console.error('========加载stage error===========', stageName)
        }
    }

    //移动的底部 然后再移动上来
    moveShowStage() {
        this.dispatchEmit(UI_EVENT_NAME.STAGE_MOVE, true); //stage move 不可点击 发射气泡

        const startPos = this.nodeLevels[0].position;
        const endPos = this.nodeLevels[this.nodeLevels.length - 1].position;

        const distance = Math.abs(endPos.y - startPos.y);
        console.log('===============initstage==================11===1======', distance)
        tween(this.node).delay(0.3).by(4, { position: v3(0, -distance, 0) }, { easing: 'sineInOut' }).call(() => {
            this.nodeLevels.forEach((nodeLevel) => {
                nodeLevel.active = false;
            })
            this.nodeLevels[0].active = true;
        }).delay(0.5).call(() => {
            this.dispatchEmit(UI_EVENT_NAME.GAME_SWITCH_SCENE) //飘出目标板
            this.moveBarriarCircleToBoxNode(0);
        }).delay(1.0).call(() => {
            this.dispatchEmit(UI_EVENT_NAME.STAGE_MOVE, false); //stage move 
        }).start();
    }

    getBoxNode(): Node {
        return this.boxNode;
    }

    getLevelByIdx(idx) {
        return this.nodeLevels[idx];
    }

    moveBarriarCircleToBoxNode(idx: number) {
        for (let i = this.nodeFallBarrier[idx].children.length - 1; i >= 0; i--) {
            const node = this.nodeFallBarrier[idx].children[i];
            if (node.getComponent(ModelCircle) && node.getComponent(ModelCircle).getIsDefault()) {
                console.log('============wakeUpBody=========2============')
                changeParent(node, DataManager.dataBattle.boxNode);
            }
        }
    }

    //唤醒地板刚体
    wakeUpBody(idx) {
        if (idx > 0) {
            this.nodeLevels[idx].active = true;
            this.nodeUnderpinBody[idx].getComponent(RigidBody2D).wakeUp();
            console.log('============wakeUpBody=========1============', this.nodeFallBarrier[idx].children.length)

            this.moveBarriarCircleToBoxNode(idx);


            //受重力的障碍物转变父节点
            const lastFallBarrier = this.nodeFallBarrier[idx - 1];
            for (let i = lastFallBarrier.children.length - 1; i >= 0; i--) {
                const node = lastFallBarrier.children[i];
                changeParent(node, this.nodeFallBarrier[idx]);
            }

            const nodeBarrier = this.nodeBarrier[idx - 1]; //固定障碍物 缩小消失
            nodeBarrier.children.forEach((node) => {
                tween(node).to(0.2, { scale: v3(0, 0, 1) }).start();
            })

            tween(this.node).delay(0.3).call(() => {
                this.nodeLevels[idx - 1].active = false;
                // BundleManager.getInstance().releaseBundle(bundleName);
            }).start();
        }

        // if (idx > 1) {
        //     const bundleName = this.stageBundles[idx - 2];
        //     BundleManager.getInstance().releaseBundle(bundleName);
        // }

    }

    update(deltaTime: number) {

    }

    createDefaultCircle() {

    }

}


