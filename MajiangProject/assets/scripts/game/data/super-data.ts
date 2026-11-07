

import { Manager } from '../../frame/center/manager';
import { AxiosManager } from '../../frame/center/net/axios-manager';
import { G_isTest } from '../constant/common-define';
// import { AxiosManager, GameMessage } from '../../frame/center/net/AxiosManager';
// import { SocketIo } from '../../frame/center/net/Socket-io';

export abstract class SuperData {
    abstract name;
    // 网络返回处理
    netMessageHanders = {};

    constructor() { }

    public init(...args: any[]): void {
        for (const messageName in this.netMessageHanders) {
            const messageHandler = this.netMessageHanders[messageName];
            AxiosManager.registerMessage(messageName, messageHandler);
        }
    }

    protected sendMessage(messageID: string, messageData: any, _type) {
  
        AxiosManager.saveSendData(messageID, messageData);
        // AxiosManager.sendHttpMessage(messageID, _type, messageData);
    }

    // protected sendSocketMessage(messageCode: number, messageData: any) {
    //     const gameMessage: GameMessage = {
    //         messageCode: messageCode,
    //         data: messageData
    //     };
    //     SocketIo.sendSocketMessage(gameMessage);
    // }

    // /**
    //  * 派发事件
    //  * @param eventName
    //  * @param args
    //  */
    // protected dispatchEmit(propertyName: string, ...args: any[]) {
    //     const eventName = [this.name, propertyName].join('_');
    //     Manager.eventManager.emit(eventName, ...args);
    // }

    /**
     * 派发事件
     * @param eventName
     * @param args
     */
    protected dispatchUIEmit(eventName: string, ...args: any[]) {
        Manager.eventManager.emit(eventName, ...args);
    }

    public clear(): void {
        Manager.eventManager.targetOff(this);

        // for (const messageName in this.netMessageHanders) {
        //     const messageHandler = this.netMessageHanders[messageName];
        //     AxiosManager.unRegisterMessage(messageName, messageHandler);
        // }
    }
}
