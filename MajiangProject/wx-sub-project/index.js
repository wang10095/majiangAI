import style from './style';
import Layout from './engine';

const __env = GameGlobal.wx || GameGlobal.tt || GameGlobal.swan;
const sharedCanvas = __env.getSharedCanvas();
const sharedContext = sharedCanvas.getContext('2d');

__env.onMessage(data => {
    if (data.type !== 'engine') {
        console.warn('Open Context get wrong type:', data.type);
        return;
    }

    switch (data.event) {
        case 'viewport':
            updateViewPort(data);
            break;

        case 'score':
            showRankList('score', data.openId);
            break;

        default:
            break;
    }
});

function draw(template) {
    Layout.clear();
    Layout.init(template, style);
    Layout.layout(sharedContext);
}

function updateViewPort(data) {
    Layout.updateViewPort({
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
    });
}

function layoutOf(itemsList, openId) {
    let out = '<view class="container" id="main"> \
    <view class="rankList"> <scrollview class="list" scrollY="true"> ';
    let datas = itemsList.data;

    // const info = datas[0];
    // for (let i = 0; i < 19; i++) {
    //     datas.push(info);
    // }

    console.log('============openid=========1========', openId)

    let selfInfo = {};
    if (datas) {
        let item, index = -1;
        const len = datas.length - 1;

        while (index < len) {
            item = datas[index += 1];
            if (item.openid == openId) {
                console.log('============openid=====self============')
                selfInfo = item;
                selfInfo.rank = index + 1;
            }
            console.log('============openid==========333=======', item)
            out += ' ';

            // if (index < 3) {
            //     let imageSrc = '';
            //     switch (index) {
            //         case 0:
            //             imageSrc = 'openDataContext/Leaderboard_GoldCrown.png';
            //             break;
            //         case 1:
            //             imageSrc = 'openDataContext/Leaderboard_SilverCrown.png';
            //             break;
            //         case 2:
            //             imageSrc = 'openDataContext/Leaderboard_BronzeCrown.png';
            //             break;
            //         default: break;
            //     }

            //     out += ' <view class="listItem"> ';
            //     out += ' ';
            //     out += ' <view id="listItemUserData"> <image class="listItemTop3Img" src="' + imageSrc
            //         + '"></image> <image class="listHeadImg" src="' + (item.avatarUrl)
            //         + '"></image> <text class="listItemName" value="' + (item.nickname)
            //         + '"></text> </view> <text class="listItemScore" value="' + '通关' + (item.level) + '次'
            //         + '"></text> </view> ';
            // } else {
            out += ' <view class="listItemAll"> ';
            out += ' <image class="listItem" src="openDataContext/bg_item.png"> ';
            out += ' ';
            out += ' <view id="listItemUserData"> <text class="listItemNum" value="' + (index + 1)
                + '"></text> <image class="listHeadImg" src="' + (item.avatarUrl)
                + '"></image> <text class="listItemName" value="' + (item.nickname)

            + '"></text> </view> <text class="listItemScore" value="' + '' + (item.score) + ''
                + '"></text> </image></view> ';

            // }
        }
    }
    out += ' </scrollview></view> \
    <view id="selfItem">';

    const selfUrl = 'https://wx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTJOPbFTiamcjuEsqpEt2zY4IPAkHNSicTQH0bE9EbEPAibydF4HZabYYSXvFcey3LzUKGxcZcOickFzZw/132'

    out += ' <view class="listItemSelf"> ';
    out += ' ';
    out += ' <view id="listItemUserData"> <text class="listItemNumSelf" value="' + (selfInfo.rank)
        + '"></text> <image class="listHeadImgSelf" src="' + (selfInfo.avatarUrl)
        + '"></image> <text class="listItemNameSelf" value="' + (selfInfo.nickname)
        + '"></text> </view> <text class="listItemScoreSelf" value="' + (selfInfo.score)
        + '"></text> </view> ';


    out += '</view></view> ';

    // console.log('======', out)
    return out;
}

function showRankList(key, openId) {
    console.log('rank key:', key);


    __env.getFriendCloudStorage({
        keyList: [key],
        success: res => {
            if (!res.data) {
                console.log('rank data is empty!');
                return;
            } else {
                console.log('rank data ====', JSON.stringify(res));
            }

            const friendsData = { data: [] };// data: [{level,avatarUrl,nickname}, ...]
            for (let i = 0; i < res.data.length; i++) {
                const score = res.data[i].KVDataList.length > 0 ? res.data[i].KVDataList[0].value : '0';
                const item = {};
                item.score = `${score}`;
                item.avatarUrl = res.data[i].avatarUrl; //'openDataContext/avatar.png'
                item.nickname = res.data[i].nickname;
                item.openid = res.data[i].openid;
                friendsData.data.push(item);
            }
            friendsData.data.sort((a, b) => b.score - a.score);
            draw(layoutOf(friendsData, openId));
            console.log('show rank success');
        },

        fail: err => {
            console.log('rank list show err:', err);
        }
    });
}
