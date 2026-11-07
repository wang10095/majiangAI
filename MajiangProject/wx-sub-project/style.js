// viewport = 1000*1200

module.exports = {
    container: {
        width: '100%',
        height: '100%',
        borderRadius: 0,
    },

    rankList: {
        width: 555,
        height: 580,
        backgroundColor: '#0000FF00', //不设置或清除背景色 
        top: 0,
        left: 22.5
    },

    list: {
        width: '100%',
        height: '100%',
    },

    listItemAll: {
        width: '100%',
        height: 105, // ori is 180
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    listItem: {
        width: '100%',
        height: 93, // ori is 180
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    listItemUserData: {
        width: '75%',
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },

    listItemScore: {
        width: '25%',
        height: '100%',
        fontSize: 24,
        lineHeight: 93,
        color: '#4197F4',
        textAlign: 'left',
        marginLeft: 50
        // paddingRight: 10,
    },

    listItemNum: {
        width: 90,
        height: '100%',
        fontSize: 40,
        color: '#CE5F22',
        lineHeight: 93,
        textAlign: 'center',
        marginLeft: 0
    },

    listItemTop3Img: {
        width: 90,
        height: 90,
        marginLeft: 30,
        marginRight: 30,
    },

    listHeadImg: {
        borderRadius: 6,
        width: 70,
        height: 70,
        marginLeft: 20,
    },

    listItemName: {
        width: 200,
        height: '100%',
        fontSize: 24,
        textAlign: 'left',
        color: '#4197F4',
        lineHeight: 93,
        marginLeft: 21,
    },

    selfItem: {
        width: '100%',
        height: 166,
        bottom: -60
    },

    listItemSelf: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
    },
    listItemNumSelf: {
        width: 50,
        height: '100%',
        fontSize: 40,
        lineHeight: 180,
        marginLeft: -20,
        color: '#CB7D4D',
    },
    listHeadImgSelf: {
        borderRadius: 6,
        width: 70,
        height: 70,
        marginLeft: 30,
    },
    listItemNameSelf: {
        width: 200,
        height: '100%',
        fontSize: 26,
        lineHeight: 180,
        marginLeft: 21,
        color: '#CB7D4D',
    },
    listItemScoreSelf: {
        width: 200,
        height: '100%',
        fontSize: 26,
        lineHeight: 180,
        marginLeft: 600,
        color: '#CB7D4D',
        bottom: 164

    },


};
