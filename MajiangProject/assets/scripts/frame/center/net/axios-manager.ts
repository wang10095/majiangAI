
import { director, sys } from 'cc';
import Utils from '../utils/utils';
import { Toast } from '../components/toast';
import { DataManager } from '../../../game/data/data-manager';
import { Manager } from '../manager';
import { G_serverUrl, UI_EVENT_NAME } from '../../../game/constant/common-define';
import { gotoScene } from '../../../game/ui-commonset';
import { isMiniGame } from '../../../game/game-define';
import { sdkUtils } from '../../sdk-common/sdk-utils';
import { Alert } from '../../../game/common/alert';
import { AuthResponse, decodeAuthResponse, encodeAuthRequest } from './auth-protocol';

const throttledFunctionMap = new Map<string, (messages: GameMessage | GameMessage[]) => void>();
const MAX_RETRY_TIMES = 6;
const RETRY_DELAY_SECONDS = 0.125;



export const messageHandlers = new Map<string, Function[]>();
export interface GameMessage {
    readonly messageCode: number;
    data: any;
}

// export interface GameClientMessageContainer {
//     sessionId: string;
//     serialNumber?: number;
//     messages: GameMessage[];
//     /**
//      * IP地址，发送时不需要带上
//      */
//     ip?: string;
// }

// export interface GameServerMessageContainer {
//     sessionId?: string;
//     serialNumber?: number;
//     nowDateTime: number;
//     messages?: proto.BaseResponse[];
//     error?: any;
// }

export class SessionService {
    private static _currentSession: SessionService;

    userId!: string;
    sessionId!: string;
    portOffset = 0;
    serverIndex = 0;
    characterId!: string;
    serialNumber = 2; // 1 为登录消息
    unsentMessages: GameMessage[] = [];
    waitResponseMessages = []; //: { [serialNumber: number]: proto.BaseRequest[] } = {};
    sendingInProgress = false;

    static get currentSession() {
        if (!SessionService._currentSession) {
            SessionService._currentSession = new SessionService();
        }

        return SessionService._currentSession;
    }

    static resetSession() {
        SessionService._currentSession = new SessionService();
    }
}

export const getCurrentSession = () => SessionService.currentSession;
export const resetSession = SessionService.resetSession;

// 编码
// function encodeMessage(message?: GameMessage) {
//     const messageName = String(MessageType[message.messageCode]);
//     const encodeFunction = protoMsg && protoMsg[`encode${messageName}`];
//     if (!encodeFunction) {
//         console.error('没有编码函数：' + `encode${messageName}`);
//         return;
//     }

//     const baseMessageData: proto.BaseRequest = {
//         cmd: message.messageCode,
//         pack: encodeFunction(message.data)
//     };
//     return baseMessageData;
// }

// // 解码
// function decodeMessage(messageName: string, message?: Uint8Array) {
//     const decodeFunction = protoMsg && protoMsg[`decode${messageName}`];
//     if (!decodeFunction) {
//         console.error('没有编码函数：' + `decode${messageName}`);
//         return;
//     }
//     return decodeFunction(message);
// }

export class AxiosManager {
    // 网络原因导致堆积的待处理消息
    static waitProcessMessages: Record<number, GameMessage> = {};
    // 节流函数
    static throttles = (func, delay) => {
        let start = 0;
        //let start=+new Date() 不可以这样写，会导致无法第一次就执行函数
        return function (...args) {
            let now = +new Date(); //通过+号可以转化成时间戳
            if (now - start > delay) {
                func.apply(this, args);
                start = now;
            }
        };
    };

    // static sendMessage = (messages: GameMessage | GameMessage[]) => {
    //     if (!getCurrentSession().sessionId) {
    //         return;
    //     }

    //     if (!messages) {
    //         return;
    //     }

    //     let sign = '';
    //     if (Array.isArray(messages)) {
    //         messages.forEach(message => {
    //             if (sign.length > 0) {
    //                 sign += '-' + message.messageCode;
    //             } else {
    //                 sign = message.messageCode + '';
    //             }
    //         });
    //     } else {
    //         sign = messages.messageCode + '';
    //     }

    //     let func: (messages: GameMessage | GameMessage[]) => void;

    //     if (throttledFunctionMap.has(sign)) {
    //         func = throttledFunctionMap.get(sign)!;
    //     } else {
    //         let wait = 750; // 消息阀值（相同消息间隔<.75忽略）
    //         if (
    //             MessageType.EquipOperationRequest + '' === sign ||
    //             MessageType.UpdateGuideRequest + '' === sign
    //         ) {
    //             // 相同消息 非相同逻辑，节流时间缩短至200毫秒(200ms内一般是是代码触发，手操作移动触发至少需要200ms，所以200ms认为其触发连点操作)
    //             wait = 150;
    //         }
    //         func = AxiosManager.throttles(AxiosManager.sendThrottledMessage, wait);
    //         throttledFunctionMap.set(sign, func);
    //     }

    //     func(messages);
    // };

    static toUint8Array(bytes: Uint8Array): Uint8Array {
        const arr = [];
        for (let i = 0; i < bytes.byteLength; i++) {
            arr.push(bytes[i + bytes.byteOffset]);
        }
        return new Uint8Array(arr);
    }

    // private static sendThrottledMessage = async (messages?: GameMessage | GameMessage[]) => {
    //     let currentSession = getCurrentSession();
    //     if (!currentSession.sessionId) {
    //         return;
    //     }
    //     if (currentSession.sendingInProgress) {
    //         // 缓存消息（消息必须不在上次的发送队列中，否则也有可能重复），同消息号仅缓存最后一次
    //         if (Array.isArray(messages)) {
    //             messages.forEach(msg => {
    //                 const waitingMsg = AxiosManager.inWaitingRequestMessages(msg.messageCode, currentSession.waitResponseMessages);
    //                 if (!waitingMsg) {
    //                     AxiosManager.waitProcessMessages[msg.messageCode] = msg;
    //                 }
    //                 console.log('waitingMsg1', waitingMsg);
    //             });
    //         } else {
    //             const waitingMsg = AxiosManager.inWaitingRequestMessages(messages.messageCode, currentSession.waitResponseMessages);

    //             if (!waitingMsg) {
    //                 AxiosManager.waitProcessMessages[messages.messageCode] = messages;
    //             }
    //             console.log('waitingMsg2', waitingMsg);
    //         }
    //         console.log('sendThrottledMessage:上个消息还没返回 暂时存储起来,网速慢的情况会触发', messages, AxiosManager.waitProcessMessages);
    //         return;
    //     }

    //     if (AxiosManager.waitProcessMessages && Object.keys(AxiosManager.waitProcessMessages).length > 0) {
    //         console.log('AxiosManager waitProcessMessages:', AxiosManager.waitProcessMessages);
    //         for (const msgCode in AxiosManager.waitProcessMessages) {
    //             const msg = AxiosManager.waitProcessMessages[msgCode];
    //             if (msg) {
    //                 const inCurrentRequestMessages = AxiosManager.inWaitingRequestMessages(msg.messageCode, messages);
    //                 if (!inCurrentRequestMessages) {
    //                     // 且不在本次的请求中
    //                     currentSession.unsentMessages.push(msg);
    //                 }
    //             }
    //         }
    //         AxiosManager.waitProcessMessages = {};
    //     }

    //     // 深拷贝
    //     if (messages) {
    //         messages = Utils.utils.deepCopy(messages);
    //         if (Array.isArray(messages)) {
    //             messages.forEach(message => {
    //                 currentSession.unsentMessages.push(message);
    //             });
    //         } else {
    //             currentSession.unsentMessages.push(messages);
    //         }

    //         const msgCodes = currentSession.unsentMessages.map(message => {
    //             return message.messageCode;
    //         });
    //         AxiosManager.messageLogger(msgCodes, '%cAxiosManager send messages: %o', 'background-color: white;color:green', messages);
    //         // 先等等，等其它业务逻辑的消息合并在一起后发 (同时多个请求的情况)
    //         await Utils.utils.delaySecond(0.02);
    //     }

    //     if (!currentSession.unsentMessages.length) {
    //         if (!messages) {
    //             AxiosManager.setBusyState(false);
    //         }
    //         return;
    //     }
    //     currentSession.sendingInProgress = true;
    //     const clientMessageContainer: proto.BaseRequestGroup = {
    //         identity: currentSession.sessionId,
    //         sequence: currentSession.serialNumber,
    //         packs: currentSession.unsentMessages.map(message => {
    //             return encodeMessage(message);
    //         }),
    //         conf_version: getGameGlobal().configVersion,
    //         client_version: getGameGlobal().gameVersion,
    //         chat_sequence: DataManager.dataChat.chatSequences
    //     };

    //     currentSession.waitResponseMessages = Utils.utils.deepClone(currentSession.unsentMessages);
    //     const sendMsgs = clientMessageContainer.packs.map(message => {
    //         return message.cmd;
    //     });
    //     AxiosManager.messageLogger(
    //         sendMsgs,
    //         '发 %cAxiosManager send messageContainer==>: %o',
    //         'background-color: white;color:red',
    //         clientMessageContainer.sequence,
    //         Object.keys(clientMessageContainer.packs).length,
    //         sendMsgs
    //     );

    //     currentSession.unsentMessages = [];
    //     let retryTimes = 0;
    //     let messageContainer: GameServerMessageContainer;





    //     AxiosManager.setBusyState(true);
    //     const startReqTime = Date.now();
    //     while (true) {
    //         try {
    //             const ret = await axios({
    //                 method: 'POST',
    //                 url: getGameGlobal().serverUrl, //`${GameConstant.getServerUrl()}`,
    //                 headers: {
    //                     ['Content-Type']: 'application/text',
    //                     Accept: ' application/*'
    //                 },
    //                 responseType: 'arraybuffer' as ResponseType,
    //                 data: AxiosManager.toUint8Array(protoMsg.encodeBaseRequestGroup(clientMessageContainer)),
    //                 timeout: 10000 + retryTimes * 500
    //             });

    //             if (!ret || !ret.data) {
    //                 throw new Error('收到空消息。');
    //             }
    //             currentSession = getCurrentSession();
    //             currentSession.sendingInProgress = false;
    //             const buffer = new Uint8Array(ret.data);
    //             const responseGroup = protoMsg.decodeBaseResponseGroup(buffer);
    //             if (currentSession.serialNumber === responseGroup.sequence + 1) {
    //                 // console.log('responseGroup:', responseGroup);
    //                 console.log('重复请求的消息:', responseGroup.sequence);
    //                 AxiosManager.setBusyState(false);
    //                 return;
    //             }

    //             // 服务器异常提示,不处理grop组
    //             if (responseGroup.state_code) {
    //                 console.log('response group error code:', responseGroup.state_code, responseGroup.info);
    //                 if (responseGroup.state_code !== proto.StateCode.SUCCESS) {
    //                     // 一旦失败，取消队列里所有的消息
    //                     AxiosManager.setBusyState(false);
    //                     if (responseGroup.state_code === proto.StateCode.SESSION_EXPIRED) {
    //                         Alert.show({
    //                             info: { tips: responseGroup.info, confirmStr: '' },
    //                             confirm: () => {
    //                                 // 重新登录
    //                                 resetSession();
    //                                 Manager.eventManager.emit(UI_EVENT_NAME.GAME_EXIT);
    //                                 // director.loadScene('loading');
    //                             }
    //                         });
    //                     } else if (responseGroup.state_code === proto.StateCode.CONFIG_UPDATED) {
    //                         if (isBrowser) {
    //                             showConfigChangedDialogInBroswer(responseGroup.info, responseGroup.error_code);
    //                             return;
    //                         }
    //                         Alert.show({
    //                             info: { tips: responseGroup.info, confirmStr: '' },
    //                             confirm: () => {
    //                                 // 重新登录
    //                                 resetSession();
    //                                 Manager.eventManager.emit(UI_EVENT_NAME.GAME_EXIT);
    //                                 // director.loadScene('loading');
    //                             }
    //                         });
    //                     } else {
    //                         Alert.show({
    //                             info: { tips: responseGroup.info, confirmStr: '' },
    //                             confirm: () => {
    //                                 // 重新登录
    //                                 resetSession();
    //                                 Manager.eventManager.emit(UI_EVENT_NAME.GAME_EXIT);
    //                                 // director.loadScene('loading');
    //                             }
    //                         });
    //                     }
    //                 }
    //                 return;
    //             }
    //             messageContainer = {
    //                 sessionId: currentSession.sessionId,
    //                 serialNumber: responseGroup.sequence,
    //                 nowDateTime: Date.now(),
    //                 messages: responseGroup.packs
    //             };
    //             // 服务器时间戳
    //             DataManager.syncServerTime(responseGroup.timestamp);
    //             break;
    //         } catch (err: any) {
    //             if (++retryTimes <= MAX_RETRY_TIMES) {
    //                 console.error(`发送消息第${retryTimes}次失败。`);
    //                 await Utils.utils.delaySecond(Math.min(10, RETRY_DELAY_SECONDS * Math.pow(2, retryTimes)));
    //                 if (retryTimes > MAX_RETRY_TIMES * 0.5) {
    //                     Toast.showToast('当前网络情况异常');
    //                 }
    //             } else {
    //                 Manager.eventManager.emit(UI_EVENT_NAME.GAME_ERROR, 'net_try_faild', err);
    //                 console.error(`发送消息彻底失败，共计尝试${retryTimes}次。`, getGameGlobal().serverUrl);
    //                 // 一旦失败，取消队列里所有的消息
    //                 resetSession();
    //                 AxiosManager.setBusyState(false);
    //                 if (AxiosManager.onSendMessageFailure) {
    //                     AxiosManager.onSendMessageFailure(err);
    //                 }

    //                 Toast.showToast('网络异常，请检查网络状态');

    //                 return;
    //             }
    //         }
    //     }

    //     let msgs = [];
    //     const msgCmds = [];
    //     messageContainer.messages?.forEach(msg => {
    //         msgs.push(String(MessageType[msg.cmd]));
    //         msgCmds.push(msg.cmd);
    //     });
    //     let reqMsgs = [];
    //     clientMessageContainer.packs?.forEach(message => {
    //         reqMsgs.push(String(MessageType[message.cmd]));
    //     });
    //     if (reqMsgs.length > 0 && reqMsgs[0] != 'KeepaliveRequest') {
    //         NetReport.reportNetResDur(reqMsgs, msgs, Date.now() - startReqTime);
    //     }

    //     AxiosManager.messageLogger(
    //         msgCmds,
    //         '收 %cAxiosManager send messageContainer <==: %o',
    //         'background-color: white;color:red',
    //         messageContainer.serialNumber,
    //         messageContainer.messages?.length,
    //         msgCmds
    //     );
    //     // // 在这里一定要重新获取会话状态
    //     // currentSession = getCurrentSession();
    //     // // sessionId 为空代表着接下来的消息走长连接
    //     // if (messageContainer.sessionId && messageContainer.sessionId !== currentSession.sessionId) {
    //     //     AxiosManager.setBusyState(false);
    //     //     console.error(`${messageContainer.sessionId} 已失效。`);
    //     //     return;
    //     // }

    //     AxiosManager.setBusyState(false);
    //     // sessionId 为空代表着接下来的消息走长连接
    //     if (messageContainer.sessionId && AxiosManager.onSendMessageSuccess) {
    //         AxiosManager.onSendMessageSuccess(messageContainer, currentSession.waitResponseMessages);
    //         // 登录后的第一个条消息 启动心跳
    //         if (2 === messageContainer.serialNumber) {
    //             HeartBeat.enableHeartbeat();
    //         } else {
    //             HeartBeat.resetHeartTime();
    //         }
    //     }

    //     // 这个逻辑好纠结 在处理完成的后面还是前面呢
    //     if (currentSession.unsentMessages.length || (AxiosManager.waitProcessMessages && Object.keys(AxiosManager.waitProcessMessages).length > 0)) {
    //         AxiosManager.sendThrottledMessage();
    //         console.log('currentSession resend cache messages:', currentSession.unsentMessages.length);
    //     }
    // };

    static registerMessage(messageName: string, handler: Function) {
        const handlers = messageHandlers.get(messageName);
        if (!handlers) {
            messageHandlers.set(messageName, [handler]);
        } else {
            handlers.push(handler);
        }
    }

    static unRegisterMessage(messageName: string, handler: Function) {
        const handlers = messageHandlers.get(messageName);
        if (!handlers) {
            return;
        }
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    // // 是否在等待响应的队列中
    // static inWaitingRequestMessages(messageCode: number, messages: GameMessage | GameMessage[], removeMResponseMsg = false) {
    //     let requestData: any;
    //     if (Array.isArray(messages)) {
    //         for (let index = 0; index < messages.length; index++) {
    //             const message = messages[index];
    //             if (message && message.messageCode === messageCode) {
    //                 requestData = message.data;
    //                 if (removeMResponseMsg) {
    //                     messages.splice(index, 1);
    //                 }
    //                 break;
    //             }
    //         }
    //     } else {
    //         if (messages && messages.messageCode === messageCode) {
    //             requestData = messages.data;
    //             if (removeMResponseMsg) {
    //                 messages = [];
    //             }
    //         }
    //     }
    //     return requestData;
    // }

    // // 接受返回消息
    // private static onSendMessageSuccess(messageContainer: GameServerMessageContainer, requestMessages: GameMessage | GameMessage[]) {
    //     if (!messageContainer.messages) {
    //         return;
    //     }

    //     const currentSession = getCurrentSession();
    //     currentSession.serialNumber = messageContainer.serialNumber + 1; // 等待处理成功后自增，在此之间的发送的消息会被忽略
    //     for (let index = 0; index < messageContainer.messages.length; index++) {
    //         const responseData = messageContainer.messages[index];
    //         const messageName = String(MessageType[responseData.cmd]);
    //         let requestData: any;
    //         if (requestMessages) {
    //             requestData = AxiosManager.inWaitingRequestMessages(responseData.cmd, requestMessages, true);
    //         }
    //         const responseMessageName = messageName.replace('Request', 'Response');
    //         const message = responseData.pack ? decodeMessage(responseMessageName, responseData.pack) : undefined;
    //         AxiosManager.messageLogger(
    //             [responseData.cmd],
    //             '%c AxiosManager recieve message >> %o',
    //             'background-color: white; font-size: 12px; color:blue;',
    //             responseMessageName,
    //             message,
    //             requestData
    //         );

    //         // 服务器异常提示
    //         if (responseData.state_code) {
    //             if (responseData.state_code === proto.StateCode.WARN && responseData.info) {
    //                 Toast.showToast(responseData.info);
    //             } else {
    //                 if (responseData.info) {
    //                     Alert.show({
    //                         info: { tips: responseData.info, confirmStr: '' }
    //                     });
    //                 } else {
    //                     console.log('AxiosManager recieve errorcode: >> ', responseData.state_code);
    //                 }
    //             }
    //             console.log('response state_code:', responseData.state_code);
    //         } else {
    //             const handlers = messageHandlers.get(responseMessageName);
    //             try {
    //                 if (handlers !== undefined && handlers.length > 0) {
    //                     handlers.forEach((func: Function) => {
    //                         func(message, requestData);
    //                     });
    //                 }
    //             } catch (e) {
    //                 const currentSession = getCurrentSession();
    //                 console.error('message catch serialNumber error:', currentSession.serialNumber, e);
    //                 currentSession.serialNumber = messageContainer.serialNumber + 1; // 等待处理成功后自增，在此之间的发送的消息会被忽略
    //                 let requestMsgCode = '';
    //                 if (Array.isArray(requestMessages)) {
    //                     for (let index = 0; index < requestMessages.length; index++) {
    //                         const message = requestMessages[index];
    //                         requestMsgCode += message.messageCode;
    //                     }
    //                 } else {
    //                     if (requestMessages) {
    //                         requestMsgCode = requestMessages.messageCode + '';
    //                     }
    //                 }
    //                 Manager.eventManager.emit(UI_EVENT_NAME.GAME_ERROR, requestMsgCode + ':' + responseMessageName, e);



    //             }
    //         }
    //     }

    //     const msgCmds = [];
    //     messageContainer.messages?.forEach(msg => {
    //         msgCmds.push(msg.cmd);
    //     });
    //     AxiosManager.messageLogger(msgCmds, 'messageContainer process finish:', currentSession.serialNumber);
    //     currentSession.waitResponseMessages = [];
    // }

    // private static onSendMessageFailure(err: any) {
    //     console.error('AxiosManager' + err);
    // }

    // // 消息日志输出
    // private static messageLogger(messageCmds: number[], message?: any, ...optionalParams: any[]): void {
    //     if (!(messageCmds.length === 1 && messageCmds[0] === MessageType.KeepaliveRequest)) {
    //         console.log(message, ...optionalParams);
    //     }
    // }

    // private static setBusyState(isBusy: boolean): void {
    //     // console.log('AxiosManager setBusyState' + isBusy);
    //     if (isBusy) {
    //         BusyLayer.show();
    //     } else {
    //         BusyLayer.hide();
    //     }
    // }

    // // 独立于游戏之外，仅相当于http请求
    // public static async request(message: GameMessage, handler: Function, method: 'GET' | 'POST' = 'POST'): Promise<any> {
    //     const baseMessageData: proto.BaseRequest = encodeMessage(message);
    //     const clientMessageContainer: proto.BaseRequestGroup = {
    //         // serialNumber: currentSession.serialNumber++,
    //         packs: [baseMessageData],
    //         conf_version: getGameGlobal().remoteConfigVersion,
    //         client_version: getGameGlobal().gameVersion
    //     };
    //     console.log('request server url:', getGameGlobal().configVersion, getGameGlobal().serverUrl);
    //     const encodeData = proto.encodeBaseRequestGroup(clientMessageContainer);
    //     const ret = await axios({
    //         method: method,
    //         url: getGameGlobal().serverUrl,
    //         headers: {
    //             ['Content-Type']: 'application/text',
    //             Accept: ' application/*'
    //         },
    //         responseType: 'arraybuffer' as ResponseType,
    //         // transformRequest: msgEncode,
    //         // transformResponse: msgDecode,
    //         data: AxiosManager.toUint8Array(encodeData),
    //         timeout: 10000
    //     });
    //     if (!ret || !ret.data) {
    //         handler && handler();
    //         throw new Error('收到空消息。');
    //     }
    //     console.log('request ret:', ret);
    //     const buffer = new Uint8Array(ret.data);
    //     const responseGroupData = proto.decodeBaseResponseGroup(buffer);
    //     if (!responseGroupData || !responseGroupData.packs) {
    //         if (responseGroupData.state_code) {
    //             console.log('response group error code:', responseGroupData.state_code, responseGroupData.info);
    //             if (responseGroupData.state_code !== proto.StateCode.SUCCESS) {
    //                 if (responseGroupData.state_code === proto.StateCode.CONFIG_UPDATED) {
    //                     if (isBrowser) {
    //                         showConfigChangedDialogInBroswer(responseGroupData.info, responseGroupData.error_code);
    //                         return;
    //                     }
    //                     Alert.show({
    //                         info: { tips: responseGroupData.info, confirmStr: '' },
    //                         confirm: () => {
    //                             // 重新登录
    //                             director.loadScene('loading');
    //                         }
    //                     });
    //                 } else {
    //                     Alert.show({
    //                         info: { tips: responseGroupData.info, confirmStr: '' },
    //                         confirm: () => {
    //                             // 重新登录
    //                             director.loadScene('loading');
    //                         }
    //                     });
    //                 }
    //             }
    //             return;
    //         }
    //         handler && handler();
    //         return;
    //     }
    //     for (let index = 0; index < responseGroupData.packs.length; index++) {
    //         const responseData = responseGroupData.packs[index];
    //         const messageName = String(MessageType[responseData.cmd]);
    //         const responseMessageName = messageName.replace('Request', 'Response');
    //         const message = responseData.pack ? decodeMessage(responseMessageName, responseData.pack) : undefined;
    //         // 服务器异常提示
    //         if (responseData.state_code) {
    //             if (responseData.state_code === proto.StateCode.SUCCESS && responseData.info) {
    //                 Toast.showToast(responseData.info);
    //             } else {
    //                 Alert.show({
    //                     info: { tips: responseData.info, confirmStr: '' }
    //                 });
    //             }
    //             console.log('response:', responseData.state_code);
    //         }
    //         console.log('AxiosManager request recieve message: >> ', responseMessageName, message);
    //         handler && handler(message);
    //     }
    // }

    // 多次尝试http请求
    // public static async retryRequest(url: string, data: any, maxAttempts: number) {
    //     let attempt = 0;
    //     while (attempt < maxAttempts) {
    //         try {
    //             const responseData: any = await AxiosManager.requestHttp(url, JSON.stringify(data), 'POST', 'json');
    //             return responseData;
    //         } catch (error) {
    //             console.error(`Attempt ${attempt + 1} failed:`, error);
    //             attempt++;
    //             if (attempt >= maxAttempts) {
    //                 throw new Error('Max retry attempts reached');
    //             }
    //             await new Promise(resolve => setTimeout(resolve, attempt * 1000)); // Wait 1 second before retry
    //         }
    //     }
    // }

    // public static async requestHttp(url: string, data: string, method: 'GET' | 'POST' = 'POST', responseType: 'text' | 'arraybuffer' | 'json') {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             const response = await axios({
    //                 method: method,
    //                 url: url,
    //                 headers: {
    //                     ['Content-Type']: 'application/text',
    //                     Accept: ' application/*'
    //                 },
    //                 responseType: responseType as any,
    //                 data: data,
    //                 timeout: 10000
    //             });
    //             if (!response) {
    //                 throw new Error('No received from the server');
    //             }
    //             resolve(response.data);
    //         } catch (error) {
    //             console.error('Request failed:', error);
    //             reject('');
    //         }
    //     });
    // }
    private static sendDataSave: Map<string, any> = new Map();
    public static saveSendData(messageID, messageData) {
        this.sendDataSave.set(messageID, messageData);
    }

    static token = '';

    public static async sendAuthProtobuf(
        endpoint: 'register' | 'login',
        username: string,
        password: string,
        displayName?: string,
    ): Promise<AuthResponse> {
        const serverUrl = `${G_serverUrl.replace(/\/$/, '')}/auth/protobuf/${endpoint}`;
        console.log(`[Auth] ${endpoint} request:`, serverUrl, username);
        const fetchImplementation = (globalThis as any).fetch;
        if (typeof fetchImplementation !== 'function') {
            throw new Error('当前运行环境不支持 HTTP 请求');
        }
        const response = await fetchImplementation(serverUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-protobuf',
                Accept: 'application/x-protobuf',
            },
            body: encodeAuthRequest(username, password, displayName),
        });
        console.log(`[Auth] ${endpoint} response:`, response.status);
        const result = decodeAuthResponse(await response.arrayBuffer());
        if (!result.success) {
            throw new Error(result.error || '认证失败');
        }
        if (result.accessToken) {
            this.token = result.accessToken;
            sys.localStorage.setItem('access_token', result.accessToken);
        }
        if (result.refreshToken) {
            sys.localStorage.setItem('refresh_token', result.refreshToken);
        }
        return result;
    }
    public static async sendHttpMessage(messageId: string, _type, data, callBack?) {

        const httpUrl = G_serverUrl + messageId;
        console.log('=======cmd===send===========', httpUrl, _type, data);

        this.requestHttp(httpUrl, data, _type, 'json').then((res: any) => {
            if (res.success) { //返回成功
                if (res.data?.access_token) {
                    AxiosManager.token = res.data.access_token;
                }


                console.log("%c " + "【cmdback】" + " %c " + messageId, "background: #0000FF;padding: 1px;border-radius: 2px 0 0 2px;color: #fff;", "background: #000000;padding: 1px;border-radius: 0 2px 2px 0;color: #fff;", this.sendDataSave.get(messageId), res)

                // console.log('%c【cmdback】: %o', 'background-color: white;color:blue', messageId, this.sendDataSave.get(messageId), res);
                // res.data.now = res.now;

                DataManager.syncServerTime(res.now); //同步服务器时间

                const handlers = messageHandlers.get(messageId);
                if (handlers !== undefined && handlers.length > 0) {
                    handlers.forEach((func: Function) => {
                        func(this.sendDataSave.get(messageId), res.data);
                    });
                }

                if (callBack) {
                    callBack(res.data, res.now);
                }
            } else { //返回有错误
                console.error(res.code, '===cmd back error========', JSON.stringify(res.msg));
            }
        }).catch(() => {
            // 无后端时忽略请求失败，避免未处理的 Promise 阻断本地流程。
        })
    }

    // public static async requestHttp(url: string, data: string, method: 'GET' | 'POST' = 'POST', responseType: 'text' | 'arraybuffer' | 'json') {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             const response = await axios({
    //                 method: method,
    //                 url: url,
    //                 headers: {
    //                     ['Content-Type']: 'application/json',
    //                     Accept: ' application/json',
    //                     charset: 'utf-8',
    //                     Authorization: 'Bearer ' + this.token,
    //                 },
    //                 responseType: responseType as any,
    //                 data: data,
    //                 timeout: 10000
    //             });

    //             if (!response) {
    //                 throw new Error('No received from the server');
    //             }
    //             resolve(response.data);
    //         } catch (error) {
    //             Toast.showToast('账号异常，请重新进入游戏')
    //             console.error('Request failed:', error);
    //             reject('');
    //         }
    //     });
    // }


    public static async requestHttp(url: string, data: string, method: 'GET' | 'POST' = 'POST', responseType: 'text' | 'arraybuffer' | 'json') {
        return new Promise(async (resolve, reject) => {
            try {

                // const a = axios;
                axios.interceptors.response.use((res: AxiosResponse) => {
                    // 直接返回res，当然你也可以只返回res.data
                    // 系统如果有自定义code也可以在这里处理
                    // console.log("rrrrrrrrrrrrrrrrr:", res)
                    return res;
                },
                    (err: any) => {
                        // 这里用来处理http常见错误，进行全局提示
                        console.log("2222222222222:", err)
                        if (err.response?.status == 401) {
                            console.log("未授权:");

                            Alert.show({
                                info: { tipContent: '登录已失效，请重新登录', confirmStr: '' },
                                confirm: () => {
                                    if (isMiniGame) {
                                        sdkUtils.resetartMiniGame(); //重起游戏
                                    } else {
                                        director.loadScene('loading', () => { }); //重新登录
                                    }
                                }
                            });
                            return Promise.reject(err.response);
                        } else {
                            return Promise.reject(err.response ?? err);
                        }

                    });

                const response = await axios({
                    method: method,
                    url: url,
                    headers: {
                        ['Content-Type']: 'application/json',
                        Accept: ' application/json',
                        Authorization: 'Bearer ' + this.token,
                    },
                    responseType: responseType as any,
                    data: data,
                    timeout: 10000,
                }
                )
                if (!response) {

                    throw new Error('No received from the server');
                }

                resolve(response.data);
            } catch (error) {
                console.error('Request failed:', error);
                reject('');
            }
        });
    }





}











