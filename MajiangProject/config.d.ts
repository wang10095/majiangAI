
    
    declare type CollectEffect = 
        {
        /**
        *  收集ID
        */
        readonly collectID: number;

        /**
        *  词条ID
        */
        readonly wordID: number[];

        /**
        *  是否使用
        */
        readonly isUse: number;

        /**
        *  技能未解锁图片
        */
        readonly skillLockIcon: string;

        /**
        *  技能图片
        */
        readonly skillIcon: string;

        /**
        *  技能描述
        */
        readonly skillDes: string;
};
    
    declare type Difficult = 
        {
        /**
        *  难度配置ID
        */
        readonly difficultyID: number;

        /**
        *  气泡大小权重
小|中|大|超大
        */
        readonly circleSizeWeight: number[];

        /**
        *  气泡颜色权重1
单色|双色|彩虹
        */
        readonly circleColorProbability1: number[];

        /**
        *  气泡颜色权重2
单色|双色|彩虹
        */
        readonly circleColorProbability2: number[];

        /**
        *  气泡颜色权重3
单色|双色|彩虹
        */
        readonly circleColorProbability3: number[];

        /**
        *  气泡颜色权重4
单色|双色|彩虹
        */
        readonly circleColorProbability4: number[];

        /**
        *  气泡表情种类权重
氛围表情|道具表情|词条表情
        */
        readonly circleFaceKindWeight: number[];

        /**
        *  气泡表情数量1
        */
        readonly circleFaceNum1: number[];

        /**
        *  气泡表情数量权重1
        */
        readonly circleFaceWeight1: number[];

        /**
        *  气泡表情数量2
        */
        readonly circleFaceNum2: number[];

        /**
        *  气泡表情数量权重2
        */
        readonly circleFaceWeight2: number[];

        /**
        *  气泡表情数量3
        */
        readonly circleFaceNum3: number[];

        /**
        *  气泡表情数量权重3
        */
        readonly circleFaceWeight3: number[];

        /**
        *  气泡表情数量4
        */
        readonly circleFaceNum4: number[];

        /**
        *  气泡表情数量权重4
        */
        readonly circleFaceWeight4: number[];

        /**
        *  1号气泡（最多1个表情）
对应其中表情种类权重
氛围表情|道具表情|词条表情
        */
        readonly circleFaceKindWeightByCircleType1: number[];

        /**
        *  2号气泡（最多4个表情）
对应其中表情种类权重
氛围表情|道具表情|词条表情
        */
        readonly circleFaceKindWeightByCircleType2: number[];

        /**
        *  3号气泡（最多6个表情）
对应其中表情种类权重
氛围表情|道具表情|词条表情
        */
        readonly circleFaceKindWeightByCircleType3: number[];

        /**
        *  4号气泡（最多9个表情）
对应其中表情种类权重
氛围表情|道具表情|词条表情
        */
        readonly circleFaceKindWeightByCircleType4: number[];

        /**
        *  当前场上已经存在的道具表情数量对circleFaceKindWeightByCircleType的修正
减去权重百分比 如果填写-1 权重就是0  减去的权重加入氛围表情权重中
        */
        readonly curInBattleItemFaceModify: number[];

        /**
        *  当前场上已经存在的词条表情数量对circleFaceKindWeightByCircleType的修正
减去权重百分比 如果填写-1 权重就是0  减去的权重加入氛围表情权重中
        */
        readonly curInBattleWordFaceModify: number[];
};
    
    declare type Intervention = 
        {
        /**
        *  
        */
        readonly id: number;

        /**
        *  人为干涉组ID
        */
        readonly interventionID: number;

        /**
        *  目标剩余百分比min
        */
        readonly destPerMin: number;

        /**
        *  目标剩余百分比max
        */
        readonly destPerMax: number;

        /**
        *  救命气泡(当气泡到达危险线时出现可消除气泡)的概率
        */
        readonly saveLifeRate: number;

        /**
        *  救命气泡的保底次数
        */
        readonly saveLifeMinimumGuarantee: number;

        /**
        *  救命气泡的最大发生次数
        */
        readonly saveLifeMaxCount: number;

        /**
        *  救命气泡类型权重组(普通,彩虹,道具,彩虹+道具)
        */
        readonly saveLifeCircleTypeWeight: number[];
};
    
    declare type Globals = 
        {
        /**
        *  全局配置key
        */
        readonly key: string;

        /**
        *  value
        */
        readonly value: string;

        /**
        *  类型
        */
        readonly value_type: string;

        /**
        *  描述
        */
        readonly desc: string;
};
    
    declare type Chatlog = 
        {
        /**
        *  对话ID
        */
        readonly logID: number;

        /**
        *  表情ID
        */
        readonly faceID: number;

        /**
        *  对话内容
        */
        readonly logContent: string;
};
    
    declare type City = 
        {
        /**
        *  排名
        */
        readonly rankId: number;

        /**
        *  省份
        */
        readonly name: string;

        /**
        *  人数
        */
        readonly passNumber: number;
};
    
    declare type FalseUser = 
        {
        /**
        *  ID
        */
        readonly ID: number;

        /**
        *  用户昵称
        */
        readonly userName: string;

        /**
        *  用户头像
        */
        readonly userIcon: string;
};
    
    declare type AdsKey = 
        {
        /**
        *  id
        */
        readonly id: string;

        /**
        *  广告id
        */
        readonly adId: string;

        /**
        *  广告id
        */
        readonly adId_qq: string;
};
    
    declare type FaceType = 
        {
        /**
        *  表情大类id
        */
        readonly id: number;

        /**
        *  包含的表情id
        */
        readonly allFaceIdArray: number[];

        /**
        *  权重(第一关使用)
        */
        readonly weight: number[];

        /**
        *  包含的表情id
        */
        readonly simplefaceIdArray: number[];

        /**
        *  包含的表情id
        */
        readonly simplefaceIdArray_1: number[];

        /**
        *  包含的表情id
        */
        readonly simplefaceIdArray_2: number[];

        /**
        *  包含的表情id
        */
        readonly simplefaceIdArray_fish: number[];

        /**
        *  包含的表情id
        */
        readonly simplefaceIdArray_caocao: number[];

        /**
        *  道具的faceId
        */
        readonly skillFaceId: number[];

        /**
        *  描述
        */
        readonly desc: string;
};
    
    declare type Face = 
        {
        /**
        *  face的id
        */
        readonly faceId: number;

        /**
        *  名称
        */
        readonly name: string;

        /**
        *  图片名称
        */
        readonly image: string;

        /**
        *  哪个大类
        */
        readonly faceType: number;

        /**
        *  表情种类（氛围表情|道具表情|词条表情|彩虹）
        */
        readonly faceKind: number;

        /**
        *  技能id
        */
        readonly skillId: number;
};
    
    declare type Skill = 
        {
        /**
        *  技能id
        */
        readonly id: number;

        /**
        *  名称
        */
        readonly name: string;

        /**
        *  技能效果
        */
        readonly skillEffect: number;

        /**
        *  位置类型
(1 气泡 2表情 3屏幕位置)
        */
        readonly skillPosType: number;

        /**
        *  位置（1-5）
        */
        readonly location: number;

        /**
        *  坐标偏移量
        */
        readonly offSet: number[];

        /**
        *  道具权重
        */
        readonly skillWeight: number;

        /**
        *  对应的各颜色faceId
        */
        readonly faceIds: number[];

        /**
        *  对应程序的配置id
        */
        readonly configId: number;

        /**
        *  对应的各颜色faceId
        */
        readonly faceIds_common: number[];

        /**
        *  深海捕鱼调换的faceId
        */
        readonly faceIds_fish: number[];
};
    
    declare type Word = 
        {
        /**
        *  词条id
        */
        readonly wordId: number;

        /**
        *  表情id
        */
        readonly faceArray: number[];

        /**
        *  中文汉字
        */
        readonly chinese: string[];

        /**
        *  词条名称
        */
        readonly wordName: string;

        /**
        *  词条图片
        */
        readonly wordIcon: string;

        /**
        *  词条描述
        */
        readonly wordDes: string;

        /**
        *  位置类型(1 气泡 2表情 3屏幕位置)
        */
        readonly skillPosType: number;

        /**
        *  位置（1-5）
        */
        readonly location: number;

        /**
        *  坐标偏移量
        */
        readonly offSet: number[];

        /**
        *  词条权重
        */
        readonly wordWeight: number;
};
    
    declare type Pose = 
        {
        /**
        *  形象id
        */
        readonly pose_id: string;

        /**
        *  形象图片
        */
        readonly image: string;

        /**
        *  形象名字
        */
        readonly name: string;

        /**
        *  详情图片
        */
        readonly icon: string;

        /**
        *  形象描述
        */
        readonly desc: string;
};
    
    declare type Prop = 
        {
        /**
        *  道具id
        */
        readonly id: string;

        /**
        *  道具图片
        */
        readonly image: string;

        /**
        *  名字
        */
        readonly name: string;

        /**
        *  道具描述
        */
        readonly desc: string;
};
    
    declare type Tips = 
        {
        /**
        *  全局配置key
        */
        readonly key: string;

        /**
        *  中文
        */
        readonly zh: string;
};
    
    declare type L18n = 
        {
        /**
        *  全局配置key
        */
        readonly key: string;

        /**
        *  中文
        */
        readonly zh: string;
};
    
    declare type StageCount = 
        {
        /**
        *  第几关
        */
        readonly id: number;

        /**
        *  关卡对应的stage编号
        */
        readonly stageIds: number[];
};
    
    declare type StageDifficulty = 
        {
        /**
        *  失败次数
        */
        readonly loseCount: number;

        /**
        *  对应stage表格的困难id （简单、正常、困难）
        */
        readonly weight: number[];
};
    
    declare type Stage = 
        {
        /**
        *  关卡编号
        */
        readonly id: number;

        /**
        *  关卡类型(0 普通1 捕鱼2曹操)
        */
        readonly stageType: number;

        /**
        *  目标收集数量
        */
        readonly collectFaceId: number[];

        /**
        *  有几个小关卡
        */
        readonly stageNumber: number;

        /**
        *  关卡限时（秒）
        */
        readonly time: number;

        /**
        *  颜色大类
        */
        readonly circleType: number[];

        /**
        *  难度id （对应difficult表）
        */
        readonly difficultId: number[];

        /**
        *  难度等级
        */
        readonly difficultLv: number;

        /**
        *  初始化的气泡编号 
到stageCircle对应
        */
        readonly initCircle: number[];

        /**
        *  对应的stage编号
        */
        readonly stage: number;

        /**
        *  前9小关，每3小关为一节点能最少随机出的目标表情数量比例
        */
        readonly targetFacePollMinRateByLittleStage: number[];

        /**
        *  前9小关，每3小关为一节点能最多随机出的目标表情数量比例
        */
        readonly targetFacePollMaxRateByLittleStage: number[];

        /**
        *  人为干涉组id
        */
        readonly interventionGroupID: number;
};
    
    declare type StageRandom = 
        {
        /**
        *  小关编号
        */
        readonly id: number;

        /**
        *  预设名
        */
        readonly stageName: string;

        /**
        *  用于第几小关
约定0为第一大关
        */
        readonly stageLevel: number;

        /**
        *  权重
        */
        readonly stageWeight: number;
};
    
    declare type StageCircle = 
        {
        /**
        *  气泡编号
        */
        readonly id: number;

        /**
        *  气泡大小类型1-4
        */
        readonly circleType: number;

        /**
        *  气泡类型 faceId,数量
        */
        readonly faceArray: any[];

        /**
        *  坐标
        */
        readonly position: number[];
};
    
    declare type StageTeach = 
        {
        /**
        *  气泡编号
        */
        readonly id: number;

        /**
        *  气泡大小类型（0-3）
        */
        readonly circleType: number;

        /**
        *  单色/双色(1/2)
        */
        readonly circleColor: number;

        /**
        *  颜色大类
        */
        readonly faceType_1: number;

        /**
        *  faceId
        */
        readonly faceId_1: number[];

        /**
        *  数量
        */
        readonly faceCount_1: number[];

        /**
        *  颜色大类
        */
        readonly faceType_2: number;

        /**
        *  faceId
        */
        readonly faceId_2: number[];

        /**
        *  数量
        */
        readonly faceCount_2: number[];

        /**
        *  触发的引导id
        */
        readonly guideId: number;
};
    
    declare const Config: {
        readonly CollectEffect: { readonly [id: number]: CollectEffect };
readonly Difficult: { readonly [id: number]: Difficult };
readonly Intervention: { readonly [id: number]: Intervention };
readonly Globals: { readonly [id: string]: Globals };
readonly Chatlog: { readonly [id: number]: Chatlog };
readonly City: { readonly [id: number]: City };
readonly FalseUser: { readonly [id: number]: FalseUser };
readonly AdsKey: { readonly [id: string]: AdsKey };
readonly FaceType: { readonly [id: number]: FaceType };
readonly Face: { readonly [id: number]: Face };
readonly Skill: { readonly [id: number]: Skill };
readonly Word: { readonly [id: number]: Word };
readonly Pose: { readonly [id: string]: Pose };
readonly Prop: { readonly [id: string]: Prop };
readonly Tips: { readonly [id: string]: Tips };
readonly L18n: { readonly [id: string]: L18n };
readonly StageCount: { readonly [id: number]: StageCount };
readonly StageDifficulty: { readonly [id: number]: StageDifficulty };
readonly Stage: { readonly [id: number]: Stage };
readonly StageRandom: { readonly [id: number]: StageRandom };
readonly StageCircle: { readonly [id: number]: StageCircle };
readonly StageTeach: { readonly [id: number]: StageTeach };

    };
    declare const AllExcelSheets: {};
    