
import { Vec2 } from "cc";
import { SkillBoom } from "../../model/skill/skill-boom";
import { v2 } from "cc";
import { SkillBoomRandom } from "../../model/skill/skill-boom-random";
import { Vec3 } from "cc";
import { v3 } from "cc";
import { WordZaDi } from "../../model/word/word-zadi";
import { WordTuiTuiTui } from "../../model/word/word-tuituitui";
import { SkillTransformRandom } from "../../model/skill/skill-transform-random";
import { WordRandomCaiHong } from "../../model/word/word-random-caihong";
import { WordChangeCaiHong } from "../../model/word/word-change-caihong";

//道具类型
export enum PropType {
    Null = 0,
    Skill = 1, //技能
    Word = 2, //词条
    EVENT_CALLBACK = 3, //下一关
}

//技能位置坐标
export enum SkillPosType {
    Null = 0, //不设置
    Circle = 1, //气泡位置
    Face = 2,  //表情位置
    ScreenPos = 3,//指定屏幕的位置
}

export interface SkillConfig {
    id: number,
    prefab: string,
    SkillClass: any,
    position?: Vec3;
}


export default class SkillDefine {
    public static skillConfig: { [id: number]: SkillConfig } = {
        1: { id: 1, prefab: 'skill_boom', SkillClass: SkillBoom, position: v3(0, 0, 0) },
        3: { id: 3, prefab: 'skill_transform_random', SkillClass: SkillTransformRandom, position: v3(0, 0, 0) },
    }

    public static wordDefine: { [id: number]: SkillConfig } = {
        10001: { id: 10001, prefab: 'word_random_caihong', SkillClass: WordRandomCaiHong, position: v3(0, 0, 0) },
        10002: { id: 10002, prefab: 'word_change_caihong', SkillClass: WordChangeCaiHong, position: v3(0, 0, 0) },
        10003: { id: 10003, prefab: 'word_zadi', SkillClass: WordZaDi, position: v3(0, 0, 0) },
        10004: { id: 10004, prefab: 'word_tuituitui', SkillClass: WordTuiTuiTui, position: v3(0, 0, 0) },
        10005: { id: 10005, prefab: 'word_zundujiadu', SkillClass: WordRandomCaiHong, position: v3(0, 0, 0) },
        10006: { id: 10006, prefab: 'word_bushigemen', SkillClass: WordChangeCaiHong, position: v3(0, 0, 0) },
    }

}