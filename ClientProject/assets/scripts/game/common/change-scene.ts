import { _decorator, Animation, director, Node, Skeleton, sp } from 'cc';
import { DataManager } from '../data/data-manager';
import { SuperComponent } from '../../frame/center/components/super-component';
import { SuperSpine } from '../../frame/center/components/super-spine';
import { UI_EVENT_NAME } from '../constant/common-define';
import { uiManager } from '../../frame/center/managers/ui-manager';
import { Manager } from '../../frame/center/manager';
import { getRandomInt } from '../common';
const { ccclass, property } = _decorator;


@ccclass('ChangeScene')
export class ChangeScene extends SuperComponent {
    @property({
        type: Node,
    })
    content: Node;

    @property({
        type: SuperSpine,
    })
    spine: SuperSpine = null;

    @property({
        type: [sp.SkeletonData],
        tooltip: '菜单对应内容'
    })
    spineData: sp.SkeletonData[] = [];

    protected onLoad(): void {
        director.addPersistRootNode(this.node);
        this.content.active = false;
        this.registerEmit(
            UI_EVENT_NAME.GAME_SWITCH_SCENE_PRE,
            (sceneName, showAnim, opt?: Array<string>) => {

                if (showAnim) {
                    this.changeSceneByAnim(sceneName, opt);
                } else {
                    this.changeSceneFast(sceneName, opt);
                }
            },
            this
        );

    }

    private changeSceneByAnim(sceneName: string, opt: Array<string> = []) {
        this.content.active = true;

        this.spine.getComponent(sp.Skeleton).skeletonData = this.spineData[getRandomInt(0, this.spineData.length - 1)];
        this.spine.getComponent(SuperSpine).playSpine("start", false, async () => {
            const homeBundle = await Manager.bundleManager.loadBundle(sceneName);

            const task = opt;
            const allPromise = [];
            task.forEach((bundleName) => {
                allPromise.push(Manager.bundleManager.preloadBundle(bundleName));
            })
            await Promise.all(allPromise);

            homeBundle.loadScene(sceneName, async () => {
                director.loadScene(sceneName)
                this.spine.getComponent(SuperSpine).playSpine('end', false, () => {
                    this.content.active = false;
                    Manager.eventManager.emit(UI_EVENT_NAME.GAME_SWITCH_SCENE, sceneName);
                });
            });
        });
    }

    private async changeSceneFast(sceneName: string, opt: Array<string> = []) {
        uiManager.clear();
        const homeBundle = await Manager.bundleManager.loadBundle(sceneName);

        const task = opt;
        const allPromise = [];
        task.forEach((bundleName) => {
            allPromise.push(Manager.bundleManager.preloadBundle(bundleName));
        })
        await Promise.all(allPromise);

        homeBundle.loadScene(sceneName, async () => {
            director.loadScene(sceneName, () => {
                Manager.eventManager.emit(UI_EVENT_NAME.GAME_SWITCH_SCENE, sceneName);
            });
        });
    }

    protected onDestroy(): void {
        super.onDestroy();
    }
}
