

import { sys } from 'cc';

export const isClientModel = false;
export const isWeChat = sys.platform === sys.Platform.WECHAT_GAME || sys.platform === sys.Platform.WECHAT_MINI_PROGRAM;
export const browserServerAddress: string = ''; // dev开发服地址
export const isBrowser = sys.platform === sys.Platform.MOBILE_BROWSER || sys.platform === sys.Platform.DESKTOP_BROWSER;
export const isNative = sys.platform === sys.Platform.IOS || sys.platform === sys.Platform.ANDROID;
export const isByteDance = sys.platform === sys.Platform.BYTEDANCE_MINI_GAME;
export const gameModel: 'dis' | 'dev' = 'dev'; // dev 内网测试服  dis 正式服  debug 调试服务器
export const isMiniGame = isByteDance || isWeChat; // 是否是小游戏平台
export const isDebugTest: boolean = isBrowser && !isMiniGame;