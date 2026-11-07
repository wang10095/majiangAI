
import Utils from '../../frame/center/utils/utils';
import { DataBattle } from './data-battle';
import { DataPlayer } from './data-player';
//import { DataABTest } from './data-abtest';
import { DataItem } from './data-item';
import { DataSkill } from './data-skill';
import { Long, TIMER_ID } from '../constant/common-define';
import { DataHome } from './data-home';
import { Manager } from '../../frame/center/manager';

class DataManagerSingleton extends Utils.Singleton {
    // 玩家数据
    public dataPlayer: DataPlayer;
    // 道具数据
    public dataItem: DataItem;
    // 战斗数据
    public dataBattle: DataBattle;
    // abtest
    //public abTest: DataABTest;

    //Home数据
    public dataHome: DataHome;

    public dataSkill: DataSkill;
    private serverTime: number = 0;
    private isInit = false;
    private serversTime = 0; // 毫秒
    public currentSceneName: string = 'home';
    private nextDayTime = 0; // 凌晨5点跨天刷新
    public create() {
        console.log('=========DataManager====create======')
        // 玩家数据
        if (this.isInit) {
            this.clear();
            this.initData();
            return;
        }
        this.dataPlayer = new DataPlayer();
        this.dataItem = new DataItem();
        this.dataBattle = new DataBattle();
        //this.abTest = new DataABTest();
        this.dataSkill = new DataSkill();
        this.dataHome = new DataHome();

        this.initData();
    }

    // 初始化数据
    private initData() {
        this.dataPlayer.init();
        this.dataItem.init();
        this.dataBattle.init();
        //this.abTest.init();
        this.dataSkill.init();
        this.dataHome.init();

        this.isInit = true;
        this.initGameData();
    }

    public clear(): void {
        if (this.isInit) {
            console.log('=========DataManager====clear======')
            this.dataPlayer.clear();
            this.dataItem.clear();
            this.dataBattle.clear();
            //this.abTest.clear();
            this.dataSkill.clear();
            this.dataHome.clear();
        }
    }

    // 进入游戏后的立马需要的数据
    private initGameData() {
        // // 进入游戏请求初始数据
        // //DataManager.dataEquip.requestAllEquip(); 废弃

        Manager.timeManager.unRegisterTimer(TIMER_ID.GAME_SERVER_TIME);
        Manager.timeManager.regTimer(TIMER_ID.GAME_SERVER_TIME, 1, -1, () => {
            const serverCurrentTime = this.serverTime + 1000;
            if (this.serverTime !== 0) {
                const lastDate = new Date(this.serverTime);
                const currentDate = new Date(serverCurrentTime);
                // if (lastDate.getHours() < this.serverNextDayHour) {
                //     if (currentDate.getHours() >= this.serverNextDayHour) {
                //         // 认为跨天了
                //         console.log('5点跨天', this.serverTime, serverCurrentTime);
                //         setTimeout(() => {
                //             this.refreshNextDayData();
                //         }, 2000);
                //     }
                // }
                if (lastDate.getHours() === 23) {
                    if (currentDate.getHours() === 0) {
                        // 0 点刷新了
                        console.log('0点跨天', this.serverTime, serverCurrentTime);
                        // 特殊的需要0点刷新的数据处理，默认都走上面的恶5点刷新
                    }

                }
            }
            this.serverTime = serverCurrentTime;
        });
    }

    // // 服务器时间同步
    public syncServerTime(serverTime: Long) {
        this.serverTime = Utils.utils.longToNumber(serverTime);
        console.log('sync  server time is === ', this.serverTime);
    }

    // // 服务器时间 毫秒
    public getServerTime() {
        return this.serverTime;
    }

    // 跨天剩余时间 s,  nowTime 传入的时间戳:毫秒
    // public GetOffsetNextDatas(serverNextDayHour: number = this.serverNextDayHour, nowTime?: number) {
    //     if (!nowTime) {
    //         nowTime = this.serverTime;
    //     }
    //     this.GetOffsetNextDatasStep2(nowTime, serverNextDayHour)
    // }

    // private GetOffsetNextDatasStep2(nowTime?: number, serverNextDayHour: number = this.serverNextDayHour) {
    //     const curerntDate = new Date(nowTime);
    //     let nextDayTime;
    //     if (curerntDate.getHours() < serverNextDayHour) {
    //         nextDayTime = curerntDate.setHours(serverNextDayHour, 0, 0, 0);
    //     } else {
    //         curerntDate.setDate(curerntDate.getDate() + 1);
    //         nextDayTime = curerntDate.setHours(serverNextDayHour, 0, 0, 0);
    //     }
    //     const mul = (nextDayTime - nowTime) / 1000;
    //     return mul;
    // }

    // 5点跨天刷新
    // private refreshNextDayData() {
    //     // 功能解锁
    //     // this.dataItem.requestAllItems();
    //     // 通知view层 跨天了
    //     // Manager.eventManager.emit(UI_EVENT_NAME.GAME_REFRESH_NEXT_DAY);
    // }

    //跨周剩余时间  周一零点零分
    // public getOffsetNextWeek(is5Am: boolean = false) {
    //     // 创建一个当前日期对象
    //     const currentDate = new Date(this.serverTime);
    //     // 获取当前日期是星期几（0表示星期日，1表示星期一，...）
    //     const currentDayOfWeek = currentDate.getDay();
    //     // 创建一个新的日期对象，表示下一个过期时间点
    //     let nextExpiryDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), is5Am ? 5 : 0, 0, 0, 0);

    //     // 如果今天是星期一并且当前时间未超过过期时间点，则使用今天的日期
    //     // 否则，计算下一个星期一的过期时间点
    //     if (!(currentDayOfWeek === 1 && currentDate < nextExpiryDate)) {
    //         // 计算距离下一个星期一的天数（如果今天是星期一，则距离下一个星期一为7天）
    //         const daysUntilNextMonday = currentDayOfWeek === 1 ? 7 : 1 + ((7 - currentDayOfWeek) % 7);
    //         // 更新下一个过期时间点为下一个星期一的对应时间
    //         nextExpiryDate.setDate(currentDate.getDate() + daysUntilNextMonday);
    //     }
    //     // 计算剩余时间（以秒为单位）整数
    //     const secondsToExpiry = Math.floor((nextExpiryDate.getTime() - this.serverTime) / 1000);
    //     return secondsToExpiry;
    // }

    //下一个周几几点距离现在时间戳 s秒
    // weekDay 1~7 表示周一到周日
    // public getOffsetNextWeekTime(weekDay: number, is5Am: boolean = false) {
    //     // 创建一个当前日期对象
    //     const secondsToExpiry = this.getOffsetNextWeek(is5Am); //以下一个周一凌晨为准
    //     const expirySecond = secondsToExpiry - 60 * 60 * 24 * (7 - weekDay + 1);
    //     return expirySecond;
    // }

    // //注册时间(单位:秒) 距离现在有多少天 (5点为跨天)
    // public getDayByRegisterTime(regiserTime: number) {
    //     const disTime = Math.floor(DataManager.getServerTime() / 1000) - regiserTime - Math.floor(DataManager.getOffsetNextDatas(5, regiserTime * 1000));
    //     const day = Math.ceil(disTime / (24 * 3600)) + 1;
    //     console.log('======Register_Time==距离现在==========', day);
    //     return day;
    // }
}

export const DataManager = DataManagerSingleton.getInstance();
// (window as any).DM = DataManager;
