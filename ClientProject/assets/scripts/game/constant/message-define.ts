//和服务器交互的接口名称

export const MessageID = {
    TestLogin: 'v1/auth/temp_login', //test 登录
    Login: 'v1/auth/xcx/login', //正式登录
    PushLocation: 'v1/user/postion', //根据经纬度获取省份
    UpdateUserInfo: 'v1/user/center/info/update', //向服务器 更新个人信息
    RankArea: 'v1/user/rank/area',//排行榜城市信息地区表
    GameInfo: 'v1/user/game/info',//获取用户游戏数据
    gameClubInfo: 'v1/auth/xcx/gameClub',//获得用户微信加圈信息
    getUserItemsList: 'v1/items/user_items/list',//查询用户道具列表 类型 pose word
    UpdateNewWord: 'v1/items/word',//更新个人新的词条 获取新的词条
    GetInviteFriendInfo: 'v1/user/invite', //获取已邀请的人数
    GetInviteFriendReward: 'v1/user/invite/reward', //领取邀请好友奖励
    GameInfoUpdate: 'v1/user/game/info/update',//游戏更新
    PlayGame: 'v1/user/game/play_game',//开始游戏
    EmailMessage: 'v1/message',//获取全部邮件
    EmailRead: 'v1/message/read', //邮件已读
    EmailGetReward: 'v1/message/receive', //领取邮件奖励
    EmailDelAllHadRead: 'v1/message/delete/ids',//删除邮件
    NoticeMessage: 'v1/notice',//公告信息
    FishRank: 'v1/user/ranking_list/fish', //捕鱼排行榜
    CaoCaoRank: 'v1/user/ranking_list/pk', //捕鱼排行榜


}
