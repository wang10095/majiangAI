
import { Node, _decorator, Animation } from 'cc';

import { SuperComponent } from '../../frame/center/components/super-component';
import { Vec2 } from 'cc';
import { DataManager } from '../../game/data/data-manager';
import { SkillStatus } from '../../game/data/data-skill';
import { SuperAnimation } from '../../frame/center/components/super-animation';

const { ccclass, property } = _decorator;


export interface SkillSet {
    skillName: string;
    createPos: Vec2;
    setCreatePos(pos: Vec2, id?: number); //设置技能坐标  id 技能或者词条的id

}

@ccclass("SkillBase")
export abstract class SkillBase extends SuperComponent {
    @property({
        type: [Animation],
        tooltip: '动画队列'
    })
    nodeAnim: Animation[] = [];

    _curAnimCount: number = 0;
    protected onLoad(): void {
        super.onLoad();

        this._curAnimCount = 0;

        this.registerEmit([
            'event_animation_end',
        ], [
            () => {
                if (this._curAnimCount >= this.nodeAnim.length - 1) {
                    this.node.destroy();
                    DataManager.dataSkill.setStatus(SkillStatus.None);
                    DataManager.dataSkill.nextSkillTrigger();
                } else {
                    this._curAnimCount++;
                    this.nodeAnim[this._curAnimCount].getComponent(SuperAnimation).play();
                }
            },
        ], this);
    }

    protected start(): void {
        super.start();
    }
}


export class SkillAction {
    action() {

    }
}

export class SkillBoom1 extends SkillAction {
    action(): void {
        console.log('boom1');

    }
}

export class SkillBoom2 extends SkillAction {
    action(): void {
        console.log('boom2');
    }

}

export class SkillBoom3 extends SkillAction {
    action(): void {
        console.log('boom3');
    }

}