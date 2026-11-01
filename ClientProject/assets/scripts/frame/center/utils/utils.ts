import { Rect, sys, Vec2 } from 'cc';
// import { Long } from '../libs/protobuf/long';
import { CountdownTypeBy } from '../../../game/constant/common-define';

namespace Utils {
    // 时间工具
    export namespace time {
        /**
         * 获取当前时间 秒
         * */
        function getNowSecond() {
            return Math.floor(Date.now() / 1000);
        }

        /**
         * 获取当前时间对应的该天的0点时间戳
         * */
        export function getDayMidTime(time?: number) {
            const currentTime = time || Date.now();
            // 创建一个新的 Date 对象，并将时间设置为午夜
            const date = new Date(currentTime);
            date.setHours(0, 0, 0, 0);
            // 返回午夜时间的时间戳
            return date.getTime();
        }
        /**
         * 获取当前周几
         * */
        export function getDayOfWeek(date: Date): number {
            let dow = date.getDay();
            if (dow === 0) {
                dow = 7;
            }
            return dow;
        }

        /**
         * 格式化时间 300秒=>00:05:00  仅显示 时:分:秒
         * @param seconds
         * @param showHourByZero h是0 是否显示  00:05:00 -> 05:00 默认显示
         * @returns
         */
        export function formatTime(seconds: number, formatType: CountdownTypeBy = CountdownTypeBy['HH:MM:ss'], showHourByZero: boolean = true): string {
            const TimerDuration = [
                {
                    key: 'dd',
                    val: 86400
                },
                {
                    key: 'HH',
                    val: 3600
                },
                {
                    key: 'MM',
                    val: 60
                },
                {
                    key: 'ss',
                    val: 1
                }
            ];

            const format = Object(CountdownTypeBy)[formatType];
            let timerStr: string = format;
            let countdown: number = Math.round(seconds);
            for (let index = 0; index < TimerDuration.length; index++) {
                const data = TimerDuration[index];
                if (format.includes(data.key)) {
                    const value = Math.floor(countdown / data.val);
                    if (data.key === 'dd') {
                        timerStr = timerStr.replace(data.key, String(value));
                    } else {
                        if (showHourByZero) {
                            timerStr = timerStr.replace(data.key, value < 10 ? `0${value}` : String(value));
                        } else {
                            timerStr = timerStr.replace(data.key, String(value));
                        }
                    }
                    countdown = countdown % data.val;
                }
            }
            // if (convert) {
            //     const name = ["分", '时'];
            //     let count = 0;
            //     for (let i = timerStr.length - 1; i >= 0; i--) {
            //         if (timerStr[i] === ':') {
            //             timerStr = timerStr.slice(0, i) + name[count] + timerStr.slice(i + 1);
            //             count++;
            //         }
            //     }
            //     timerStr += '秒';
            // }
            return timerStr;
        }

        /**
         * 获取当前时间是否是同一天 单位 毫秒
         */
        export function isSameDay(time1: any, time2 = Date.now()) {
            let t1 = Number(time1);
            let t2 = Number(time2);
            if (t1 && t2) {
                let date1 = new Date(t1);
                let date2 = new Date(t2);
                let tick1 = date1.setHours(0, 0, 0, 0);
                let tick2 = date2.setHours(0, 0, 0, 0);
                console.log('=========isSameDay=========', tick1, tick2)
                return tick1 === tick2;
            }
            return false;
        }

        export function format(date: Date | number, mask: string = 'yyyy-mm-dd HH:MM:ss'): string {
            if (utils.isNumber(date)) {
                return dateFormat(new Date(date), mask);
            } else if (date instanceof Date) {
                return dateFormat(date, mask);
            }
            return '';
        }
        export function dateFormat(date: Date = new Date(), mask: string = 'yyyy-mm-dd HH:MM:ss', utc: boolean = false, gmt: boolean = false) {
            mask = String(DateMask[mask] || mask || DateMask['default']);

            let maskSlice = mask.slice(0, 4);
            if (maskSlice === 'UTC:' || maskSlice === 'GMT:') {
                mask = mask.slice(4);
                utc = true;
                if (maskSlice === 'GMT:') {
                    gmt = true;
                }
            }

            const _ = utc ? 'getUTC' : 'get';
            const d = date[_ + 'Date']();
            const D = date[_ + 'Day']();
            const m = date[_ + 'Month']();
            const y = date[_ + 'FullYear']();
            const H = date[_ + 'Hours']();
            const M = date[_ + 'Minutes']();
            const s = date[_ + 'Seconds']();
            const L = date[_ + 'Milliseconds']();
            const o = utc ? 0 : date.getTimezoneOffset();
            const W = getWeek(date);
            const N = getDayOfWeek(date);
            const flags = {
                d: d,
                dd: pad(d),
                ddd: i18n.dayNames[D],
                dddd: i18n.dayNames[D + 7],
                m: m + 1,
                mm: pad(m + 1),
                mmm: i18n.monthNames[m],
                mmmm: i18n.monthNames[m + 12],
                yy: String(y).slice(2),
                yyyy: y,
                h: H % 12 || 12,
                hh: pad(H % 12 || 12),
                H: H,
                HH: pad(H),
                M: M,
                MM: pad(M),
                s: s,
                ss: pad(s),
                l: pad(L, 3),
                L: pad(Math.round(L / 10)),
                t: H < 12 ? 'a' : 'p',
                tt: H < 12 ? 'am' : 'pm',
                T: H < 12 ? 'A' : 'P',
                TT: H < 12 ? 'AM' : 'PM',
                Z: gmt ? 'GMT' : utc ? 'UTC' : (String(date).match(timezone) || ['']).pop().replace(timezoneClip, ''),
                o: (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + (Math.abs(o) % 60), 4),
                S: ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (Number((Number(d) % 100) - (Number(d) % 10) != 10) * d) % 10],
                W: W,
                N: N
            };
            return mask.replace(token, match => {
                if (match in flags) {
                    return flags[match];
                }
                return match.slice(1, match.length - 1);
            });
        }
        export enum DateMask {
            default = 'ddd mmm dd yyyy HH:MM:ss',
            shortDate = 'm/d/yy',
            mediumDate = 'mmm d, yyyy',
            longDate = 'mmmm d, yyyy',
            fullDate = 'dddd, mmmm d, yyyy',
            shortTime = 'h:MM TT',
            mediumTime = 'h:MM:ss TT',
            longTime = 'h:MM:ss TT Z',
            isoDate = 'yyyy-mm-dd',
            isoTime = 'HH:MM:ss',
            isoDateTime = "yyyy-mm-dd'T'HH:MM:sso",
            isoUtcDateTime = "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'",
            expiresHeaderFormat = 'ddd, dd mmm yyyy HH:MM:ss Z'
        }
        const token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZWN]|'[^']*'|'[^']*'/g;
        const timezone =
            /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
        const timezoneClip = /[^-+\dA-Z]/g;
        const i18n = {
            dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            monthNames: [
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec',
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December'
            ]
        };
        function pad(val: any, len?: number) {
            val = String(val);
            len = len || 2;
            while (val.length < len) {
                val = '0' + val;
            }
            return val;
        }
        export function getWeek(date: Date): number {
            // Remove time components of date
            let targetThursday = new Date(date.getFullYear(), date.getMonth(), date.getDate());

            // Change date to Thursday same week
            targetThursday.setDate(targetThursday.getDate() - ((targetThursday.getDay() + 6) % 7) + 3);

            // Take January 4th as it is aays in week 1 (see ISO 8601)
            let firstThursday = new Date(targetThursday.getFullYear(), 0, 4);

            // Change date to Thursday same week
            firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);
            // Check if daylight-saving-time-switch occured and correct for it
            let ds = targetThursday.getTimezoneOffset() - firstThursday.getTimezoneOffset();
            targetThursday.setHours(targetThursday.getHours() - ds);

            // Number of weeks between target Thursday and first Thursday
            let weekDiff = (Number(targetThursday) - Number(firstThursday)) / (86400000 * 7);
            return 1 + Math.floor(weekDiff);
        }

        // 当前时间距离1970年的天数
        export function daysSince1970(currentTime: Date): number {
            // 定义1970年1月1日5点的时间
            const startDay = new Date(Date.UTC(1970, 0, 1, 5, 0, 0, 0)); // 注��月份从0开始，0表示1月
            // 计算从1970年1月1日5点到现在的总毫秒数
            const totalMilliseconds = currentTime.getTime() - startDay.getTime() + 8 * 3600 * 1000;

            // 每天的毫秒数是从5点到第二天5点，即24小时
            const millisecondsPerDay = 24 * 60 * 60 * 1000;

            // 计算总天数
            const totalDays = Math.floor(totalMilliseconds / millisecondsPerDay);
            return totalDays;
        }
    }

    // 本地存储器
    export namespace storage {
        let gameStorage = {};
        let globalId = '';
        export function setGlobalStorageKey(accountId: string) {
            globalId = accountId;
        }

        export function setItem(key: string, value: string) {
            const itemKey = getGlobalKeys(key);
            gameStorage[itemKey] = value;
            sys.localStorage.setItem(itemKey, value);
        }

        export function getItem(key: string): any {
            const itemKey = getGlobalKeys(key);
            const storageValue = gameStorage[itemKey] || sys.localStorage.getItem(itemKey);
            return storageValue;
        }

        export function removeItem(key: string) {
            const itemKey = getGlobalKeys(key);
            gameStorage[itemKey] = null;
            sys.localStorage.removeItem(itemKey);
        }

        export function clear(): void {
            gameStorage = {};
            sys.localStorage.clear();
        }

        export function getGlobalKeys(key: string): string {
            return globalId + key;
        }
    }

    // 常用工具
    export namespace utils {
        // 将Uint8Array转换为Base64字符串
        export function uint8ArrayToBase64(buffer) {
            let binary = '';
            for (let i = 0; i < buffer.length; i++) {
                binary += String.fromCharCode(buffer[i]);
            }
            return window.btoa && window.btoa(binary);
        }
        /**
         * 根据长度截取先使用字符串
         * 第二个参数：需要显示的长度大于这个长度就用...表示
         * @param str 字符串
         * @param len 截取字符串的长度，中文文字的长度
         * @param ellipsis 省略号(...)
         */
        export function cutString(str: string, len: number = 5, ellipsis: boolean = true): string {
            if (!str) {
                return '';
            }
            len *= 2;
            let outStr = '',
                str_length = 0,
                str_len = str.length;
            for (let i = 0; i < str_len; i++) {
                let a = str.charAt(i);
                str_length++;
                if (str.charCodeAt(i) > 127 || str.charCodeAt(i) === 94) {
                    // 中文字符的长度经编码之后大于4
                    str_length++;
                }
                if (str_length > len) {
                    if (ellipsis) {
                        outStr = outStr.concat('...');
                    }
                    break;
                }
                outStr = outStr.concat(a);
            }
            // 如果给定字符串小于指定长度，则返回源字符串；
            if (str_length <= len) {
                return str;
            }
            return outStr;
        }

        /**
         * 是否是字符串
         * */
        export function isString(obj: any): boolean {
            return typeof obj === 'string' && obj.constructor === String;
        }

        /**
         * 是否是数字
         * */
        export function isNumber(obj: any): boolean {
            return typeof obj === 'number' && obj.constructor === Number;
        }

        /**
         * 是否是数组
         * */
        export function isArray(obj: any): boolean {
            return typeof obj === 'object' && obj.constructor === Array;
        }

        /**
         * 是否是对象
         * */
        export function isObject(obj: any): boolean {
            return typeof obj === 'object' && obj.constructor === Object;
        }

        // 长整型
        export function isLong(obj: any) {
            return (obj && obj['_isLong_']) === true || (obj.hasOwnProperty('low') && obj.hasOwnProperty('high'));
        }

        /**
         * 深拷贝
         * */
        export function deepCopy(data: Array<any> | {}): any {
            if (isArray(data) || isObject(data)) {
                return JSON.parse(JSON.stringify(data));
            }
            return data;
        }

        //根据类型进行深拷贝
        export function deepClone<T>(original: T): T {
            if (typeof original !== 'object' || original === null) {
                return original;
            }
            if (Array.isArray(original)) {
                const newArray = [];
                original.forEach(item => {
                    newArray.push(deepCopy(item));
                });
                return newArray as unknown as T;
            }
            if (original instanceof Map) {
                const newMap = new Map();
                original.forEach((value, key) => {
                    newMap.set(key, deepCopy(value));
                });
                return newMap as unknown as T;
            }
            if (original instanceof Set) {
                const newSet = new Set();
                original.forEach(value => {
                    newSet.add(deepCopy(value));
                });
                return newSet as unknown as T;
            }
            const newObj = {} as T;
            Object.keys(original).forEach(key => {
                newObj[key] = deepCopy(original[key]);
            });
            return newObj;
        }

        /**
         * map的所有值
         * */
        export function mapValues(map: {}): any[] {
            if (!isObject(map)) {
                return [];
            }
            const temp = deepCopy(map);
            const arr = [];
            for (const key in temp) {
                if (Object.prototype.hasOwnProperty.call(temp, key)) {
                    arr.push(temp[key]);
                }
            }
            return arr;
        }

        /**
         * mapArray => map
         * */
        export function mapArrayToMap(mapArray: Array<any>) {
            if (!isArray(mapArray)) {
                return {};
            }
            const map = {};
            const temp = deepCopy(mapArray);
            temp.forEach(item => {
                map[Number(Object.keys(item)[0])] = Number(Object.values(item)[0]);
            });
            return map;
        }

        /**
         * { [id: number]: number } => { id: number; quantity: number }[]
         * */
        export function itemMapToItemDatas(map: {
            [key: number]:
            | number
            | {
                low: number;
                high: number;
                unsigned: boolean;
            };
        }) {
            const items: { id: number; quantity: number }[] = [];
            for (const key in map) {
                items.push({
                    id: Number(key),
                    quantity: Number(map[Number(key)])
                });
            }
            return items;
        }

        /**
         *  { {id?: number,count?: number} }[] => { [id: number]: number } =>
         * */
        export function itemDatasToItemMap(items: { id?: number; count?: number }[]) {
            const itemMap: { [id: number]: number } = {};
            items.forEach(item => {
                itemMap[item.id] = item.count;
            });
            return itemMap;
        }

        /**
         * [{ id: 100021, count: 2 },{ id: 100008, count: 2 },{ id: 100008, count: 1 }] =>
         * {100021:2, 100008:3}
         * */
        export function itemDatasSameToItemMap(items: { id?: number; count?: number }[]): { [key: number]: number } {
            const result: { [key: number]: number } = {};
            items.forEach(item => {
                if (result[item.id]) {
                    result[item.id] += item.count;
                } else {
                    result[item.id] = item.count;
                }
            });
            return result;
        }

        /**
         * 比较版本号
         * @param preVersion 之前版本号
         * @param curVersion 当前版本号
         */
        export function compareVersion(preVersion: string, curVersion: string) {
            let v1_arr = preVersion.split('.');
            let v2_arr = curVersion.split('.');
            const len = Math.max(v1_arr.length, v2_arr.length);

            while (v1_arr.length < len) {
                v1_arr.push('0');
            }
            while (v2_arr.length < len) {
                v2_arr.push('0');
            }

            for (let i = 0; i < len; i++) {
                const num1 = parseInt(v1_arr[i]);
                const num2 = parseInt(v2_arr[i]);

                if (num1 < num2) {
                    return 1;
                } else if (num1 > num2) {
                    return -1;
                }
            }
            return 0;
        }

        // 验证字符串是否是数字
        function checkNumber(str: string): boolean {
            return /^[0-9]+.?[0-9]*$/.test(str);
        }

        // 转化成数字
        export function toNumber(value: any): number {
            if (!value) {
                return 0;
            }
            if (isString(value) && checkNumber(value)) {
                return Number(value);
            }
            return 0;
        }

        // 服务器活动结束时间戳和当前服务器时间戳 差值（用于倒计时展示）
        export function getLeftCoolTime(endTimeStamp: any, currentTimeStamp: any) {
            const leftTime = (toNumber(endTimeStamp) - toNumber(currentTimeStamp)) / 1000;
            return leftTime < 0 ? 0 : ~~leftTime;
        }

        /**
         * 字符串格式化,args数组或者对象
         * @param template
         * @param args
         * @example let str = "my name is {0}, my age is {1}", stringFormat(str,["test",30]) => my name is test, my age is 30
         * @example {{text}} replace 对应的值：=> hi {{apple}}, stringFormat(str,{apple:value}) =>=> hi value
         * */
        export function stringFormat(template: string, arg: any): string {
            if (!template) {
                return '';
            }
            if (isArray(arg)) {
                arg.forEach((arg, idx) => {
                    const reg = new RegExp(`{[${idx}]}`, 'gmi');
                    template = template.replace(reg, () => {
                        return String(arg);
                    });
                });
            } else {
                const names = Object.keys(arg);
                const vals = names.map(name => arg[name]);

                names.forEach((name, idx) => {
                    //  /apples/gi;
                    const searchRegExp = new RegExp(`{{${name}}}`, 'gi');
                    template = template.replace(searchRegExp, vals[idx]);
                });

                return template;
            }

            return template;
        }

        /**
         * 首字母大写
         */
        export function capitalizeFirstLetter(str: string): string {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        /**
         * 延迟N秒调用
         * @param seconds
         * @returns
         */
        export function delaySecond(seconds: number) {
            return new Promise((resolve, reject) => {
                setTimeout(resolve, seconds * 1000);
            });
        }

        /**
         * 时间消耗
         * @param target
         * @param name
         * @param time
         * @returns
         */
        export function handleCostTime(target: any, name: any, descriptor: any) {
            const oldValue = descriptor.value;
            descriptor.value = async function () {
                const start = Date.now();
                const ret = await oldValue.apply(this, arguments);
                console.log(`【handleCostTime】${name}执行耗时 ${Date.now() - start}ms`);
                return ret;
            };

            return descriptor;
        }

        /**
         * long转化为客户端number
         */
        export function longToNumber(long: { low: number; high: number; unsigned: boolean } | number): number {
            if (isNumber(long)) {
                return long as number;
            }
            long = long as { low: number; high: number; unsigned: boolean };
            const TWO_PWR_16_DBL = 1 << 16;
            const TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
            if (long.unsigned) return (long.high >>> 0) * TWO_PWR_32_DBL + (long.low >>> 0);
            return long.high * TWO_PWR_32_DBL + (long.low >>> 0);
        }

        /**
         * 没发现应用场景（一般情况服务器传过来的long直接回传过去） 先加上吧
         * number to long
         */
        export function numberToLong(num: number, unsigned = false) {
            return Long.fromNumber(this.serverTime, unsigned);
        }

        export function defaultLong() {
            return Long.fromNumber(0, true);
        }

        /**
         * //保留小数点后几位 不保留0  比如 1.20 显示1.2  0舍去
         * @param number
         * @param resaveFloat 保留小数点后几位
         */
        export function numberResave(number: number, resaveFloat?: number) {
            return Math.floor(number * Math.pow(10, resaveFloat || 2) + Number.EPSILON) / Math.pow(10, resaveFloat || 2);
        }

        /**
         * 获取量化后的数值 100万以内具体数值 100万以上保留小数点后2位(不包含末尾0)    不四舍五入
         * @param number  不能超过16位数字
         * @param resaveFloat 保留小数点后位数  有效位 去除0
         */
        export function getNumberFormat(number: number, resaveFloat?: number) {
            if (number < 1000000) {
                return number;
            }
            const amount = ['万', '亿', '万亿', '京'];
            let count = 0;
            let a: string = number.toString();
            let func = () => {
                if (number / 10000 > 1) {
                    number = number / 10000;
                    let _num = Math.floor(number * Math.pow(10, resaveFloat || 2) + Number.EPSILON) / Math.pow(10, resaveFloat || 2);
                    a = _num + amount[count];
                    count++;
                    return func();
                } else {
                    return a;
                }
            };
            return func();
        }
        /** 暂时不用
         * 获取量化后的数值 32999 => 3.29万  不四舍五入  国外 KMBT
         * @param number 不能超过16位数字
         * @param resaveFloat 保留小数点后位数  有效位 去除0
         * @returns
         */
        // export function getNumberFormat_en(number: number,resaveFloat?:number) {
        //     const amount = ['K','M','B','T'];
        //     let count = 0;
        //     let a:string = number.toString();
        //     let func = ()=>{
        //         if (number/1000 > 1){
        //             number = number/1000;
        //             let _num = Math.floor((number * (Math.pow(10, resaveFloat || 2))) + Number.EPSILON) / Math.pow(10, resaveFloat || 2);
        //             a = _num + amount[count];
        //             count++;
        //             return func();
        //         }else{
        //             return a;
        //         }
        //     }
        //     return func();
        // }

        /**
         * @param str 字符串  startIndex 起始位置 endIndex截止位置 [startIndex,endIndex)
         * @returns 字符串
         */
        //前闭后开区别例如[0,5) 一个汉字按照2个字节算
        export function byteSubstring(str, startIndex, endIndex) {
            var result = '';
            for (var i = startIndex; i < str.length && i < endIndex; i++) {
                if (/^[\u4e00-\u9fa5]$/.test(str[i])) {
                    // 判断当前字符是否为汉字
                    result += str[i];
                    --endIndex;
                    continue;
                } else if (/^\w$/.test(str[i]) || /^.$/gm.test(str[i])) {
                    // 判断当前字符是否为英文或其他特殊字符（如标点符号）
                    result += str[i];
                    continue;
                } else {
                    break;
                }
            }
            return result;
        }

        /**
         * 移除ArrayBuffer开头的固定长度字符
         * @param buffer
         * @param charLengthToRemove
         * @returns
         */
        export function removePrefixFromStringBuffer(buffer: ArrayBuffer, charLengthToRemove: number): ArrayBuffer {
            // 创建一个Uint8Array视图来操作ArrayBuffer
            const uint8View = new Uint8Array(buffer);
            // 使用TextDecoder将ArrayBuffer转换为字符串
            const decoder = new TextDecoder('utf-8');
            const str = decoder.decode(uint8View);
            // 移除字符串开头的固定长度字符
            const newStr = str.substring(charLengthToRemove).substring(0, -charLengthToRemove);
            // 使用TextEncoder将修改后的字符串转换回ArrayBuffer
            const encoder = new TextEncoder();
            return encoder.encode(newStr).buffer;
        }

        // 字符转化ASCII码
        export function strToAscII(str) {
            let size = str.length;
            let result = [];
            for (let i = 0; i < size; i++) {
                result.push(str.charCodeAt(i));
            }
            return result;
        }

        export function AscIITostr(arr) {
            let size = arr.length;
            let result = '';
            for (let i = 0; i < size; i++) {
                result += String.fromCharCode(arr[i]);
            }
            return result;
        }

        // 字符串长度 中文或全角2个字符 其他1个
        export function getStrLength(str: string): number {
            let length = 0;
            const fullWidthCharRegex = /[\u3000-\u303F\u4E00-\u9FFF\uFF00-\uFFEF]/;
            for (const char of str) {
                if (fullWidthCharRegex.test(char)) {
                    length += 2;
                } else {
                    length += 1;
                }
            }

            return length;
        }
    }

    // 数组相关的函数
    export namespace array {
        /**
         * 随机数组中的一个值
         * @param arr 随机数组
         * */
        export function random(arr: Array<any> = []): any {
            return arr[Math.floor(Math.random() * arr.length)];
        }

        /**
         * 展开成一维数组
         * @param arr 需要展开的数组
         * @param unique 是否需要去重
         * */
        export function one(arr: Array<any>, unique: boolean = false): Array<any> {
            if (arr.length == 0) {
                return arr;
            }
            if (unique) {
                return array.unique(arr.join().split(','));
            }
            return arr.join().split(',');
        }

        /**
         * 判断一个元素是否在数组中
         * */
        export function contains(arr: Array<any>, val: any): boolean {
            return arr.indexOf(val) !== -1;
        }

        /**
         * 数组a是否都包含数组b中的元素
         * @param primaryArray
         * @param secondaryArray
         * */
        export function containsAll(primaryArray: number[], secondaryArray: number[]) {
            for (let i = 0; i < secondaryArray.length; i++) {
                const ele = secondaryArray[i];
                if (primaryArray.indexOf(ele) === -1) {
                    return false;
                }
            }
            return true;
        }

        /**
         * 排序 1：从小到大  2：从大到小  3：随机
         * */
        export function sort(arr: any[], type = 1) {
            return arr.sort((a: number, b: number) => {
                switch (type) {
                    case 1:
                        return a - b;
                    case 2:
                        return b - a;
                    case 3:
                        return Math.random() - 0.5;
                }
                return -1;
            });
        }

        /**
         * 乱序
         * @param arr
         * */
        export function disorder(arr: any[]): any[] {
            return arr.sort(() => {
                return Math.random() - 0.5;
            });
        }

        //根据属性排序
        export function sortListByObject(arr: Array<any>, pro1: string, pro2?: string) {
            arr.sort((item1, item2) => {
                if (item1[pro1] > item2[pro1]) {
                    return 1;
                } else if (item1[pro1] < item2[pro1]) {
                    return -1;
                }
                if (pro2) {
                    return item1[pro2] - item2[pro2];
                } else {
                    return 0;
                }
            });
        }

        //根据属性排序 normal  true  从小到大 false 从大到小
        export function sortListByObjectDir(arr: Array<any>, pro1: string, normal: boolean = true) {
            arr.sort((item1, item2) => {
                if (item1[pro1] > item2[pro1]) {
                    return normal ? 1 : -1;
                } else if (item1[pro1] < item2[pro1]) {
                    return normal ? -1 : 1;
                }
            });
        }

        /**
         * 乱序：洗牌法
         * @param arr
         * */
        export function shuffle(arr: any[]): any[] {
            let len = arr.length;
            let index = 0;
            let temp = 0;
            while (len) {
                index = Math.floor(Math.random() * len);
                temp = arr[len - 1];
                arr[len - 1] = arr[index];
                arr[index] = temp;
                len--;
            }
            return arr;
        }

        /**
         * 去重
         * */
        export function unique(arr: Array<any>): Array<any> {
            if (Array.hasOwnProperty('from')) {
                return Array.from(new Set(arr));
            } else {
                let n: any = {},
                    r = [];
                for (let i = 0; i < arr.length; i++) {
                    let value = arr[i];
                    if (!n[value]) {
                        n[arr[i]] = true;
                        r.push(arr[i]);
                    }
                }
                return r;
            }
        }

        /**
         * 求两个集合的并集
         * */
        export function union(a: Array<any>, b: Array<any>): Array<any> {
            const newArr = a.concat(b);
            return unique(newArr);
        }

        /**
         * 求两个集合的交集
         * */
        export function intersection(a: Array<any>, b: Array<any>): Array<any> {
            return a.filter(function (val) {
                return b.indexOf(val) > -1;
            });
        }

        /**
         * 求两个集合的补集
         */
        export function complementa(a: Array<any>, b: Array<any>): Array<any> {
            return a
                .filter(function (val) {
                    return !(b.indexOf(val) > -1);
                })
                .concat(
                    b.filter(function (val) {
                        return !(a.indexOf(val) > -1);
                    })
                );
        }

        /**
         * 删除其中一个元素
         * */
        export function remove(arr: Array<any>, ele: any): Array<any> {
            let idx = arr.indexOf(ele);
            if (idx !== -1) {
                arr.splice(idx, 1);
            }
            return arr;
        }

        /**
         * 删除指定数组中的元素
         * */
        export function removeByArray(arr: Array<any>, removeArr: Array<any>): Array<any> {
            for (let i = 0; i < removeArr.length; i++) {
                let index = arr.indexOf(removeArr[i]);
                if (index > -1) {
                    arr.splice(index, 1);
                }
            }
            return arr;
        }

        /**
         * 最大值
         * */
        export function max(arr: Array<number>): number {
            return Math.max.apply(null, arr);
        }

        /**
         * 最小值
         * */
        export function min(arr: Array<any>): number {
            return Math.min.apply(null, arr);
        }

        /**
         * 求和
         * */
        export function sum(arr: Array<number>): number {
            return arr.reduce((pre, cur) => {
                return pre + cur;
            });
        }

        /**
         * 平均值
         * */
        export function average(arr: Array<number>): number {
            return sum(arr) / arr.length;
        }

        /**
         * 获得指定元素的个数
         * */
        export function count(arr: Array<any>, ele: any): number {
            let n = 0;
            for (let index = 0; index < arr.length; index++) {
                if (arr[index] === ele) {
                    n++;
                }
            }
            return n;
        }

        /**
         * 将一维数组切成二维数组
         * @param arr 数组
         * @param num 子数组长度 [1,2,3,4,5,6,7] => [[1,2,3],[4,5,6],[7]]
         * */
        export function sliceSubArray(arr: Array<any>, num: number): Array<any> {
            const slice_arr = [];
            const slice_num = Math.ceil(arr.length / num);
            for (let i = 0; i < slice_num; i++) {
                const start = i * num;
                slice_arr.push(arr.slice(start, start + num));
            }
            return slice_arr;
        }

        /**
         * 判断两个数组值是否相等
         * @param arr1 数组
         * @param arr2 数组
         * @param disorder 是否是无序比较
         * */
        export function compare(arr1: number[], arr2: number[], disorder = true): boolean {
            arr1 = utils.deepCopy(arr1);
            arr2 = utils.deepCopy(arr2);
            if (disorder) {
                arr1.sort((a, b) => {
                    return a - b;
                });
                arr2.sort((a, b) => {
                    return a - b;
                });
            }
            return JSON.stringify(arr1) == JSON.stringify(arr2);
        }

        /**
         * 冒泡排序
         * */
        export function bubbleSort(arr: Array<number>): Array<number> {
            let len = arr.length - 1;
            let temp = 0; // 存放交换的中间值
            let tempPosition = 0; // 记录最后一次交换的位置
            for (let i = 0; i < arr.length; i++) {
                let flag = true; // 标志位
                for (let j = 0; j < len - i; j++) {
                    if (arr[j] < arr[j + 1]) {
                        temp = arr[j];
                        arr[j] = arr[j + 1];
                        arr[j + 1] = temp;
                        flag = false; // 记录发生交换
                        tempPosition = j; // 记录交换的位置
                    }
                }
                len = tempPosition;

                // 如果没有交换过元素，则排序结束
                if (flag) {
                    return arr;
                }
            }
            return arr;
        }

        /**
         * 选择排序
         * */
        export function selectionSort(arr: Array<number>): Array<number> {
            let len = arr.length;
            let minIndex: number, temp: number;
            for (let i = 0; i < len - 1; i++) {
                minIndex = i;
                for (let j = i + 1; j < len; j++) {
                    if (arr[j] < arr[minIndex]) {
                        // 寻找最小的数
                        minIndex = j; // 将最小数的索引保存
                    }
                }
                temp = arr[i];
                arr[i] = arr[minIndex];
                arr[minIndex] = temp;
            }
            return arr;
        }

        /**
         * 插入排序
         * */
        export function insertionSort(arr: Array<number>): Array<number> {
            let len = arr.length;
            let preIndex = 0,
                current = 0;
            for (let i = 1; i < len; i++) {
                preIndex = i - 1;
                current = arr[i];
                while (preIndex >= 0 && arr[preIndex] > current) {
                    arr[preIndex + 1] = arr[preIndex];
                    preIndex--;
                }
                arr[preIndex + 1] = current;
            }
            return arr;
        }

        /**
         * 归并排序
         * */
        export function mergeSort(arr: Array<number>): Array<number> {
            let len = arr.length;
            if (len < 2) {
                return arr;
            }
            let middle = Math.floor(len / 2),
                left = arr.slice(0, middle),
                right = arr.slice(middle);
            return mergeSort(left).concat(mergeSort(right));
        }

        /**
         * Base64 加密
         * @param data 加密的数据
         * @returns 返回加密后的字符串
         */
        export function base64Encode(input: string): string {
            const _keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            let output = '';
            let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            let i = 0;

            while (i < input.length) {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output + _keyStr.charAt(enc1) + _keyStr.charAt(enc2) + _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
            }
            return output;
        }

        /**
         * Base64 解密
         * @param data 解密的数据
         * @returns 返回解密后的字符串
         */
        export function base64Decode(input: string): string {
            const _keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            let output = '';
            let chr1, chr2, chr3;
            let enc1, enc2, enc3, enc4;
            let i = 0;
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
            while (i < input.length) {
                enc1 = _keyStr.indexOf(input.charAt(i++));
                enc2 = _keyStr.indexOf(input.charAt(i++));
                enc3 = _keyStr.indexOf(input.charAt(i++));
                enc4 = _keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output += String.fromCharCode(chr1);

                if (enc3 !== 64) {
                    output += String.fromCharCode(chr2);
                }
                if (enc4 !== 64) {
                    output += String.fromCharCode(chr3);
                }
            }

            return output;
        }
    }

    // 数学相关
    export namespace math {
        /**
         * @desc 随机的生成[min, max] 范围内的整数
         * @param min
         * @param max
         * */
        export function randomInt(min: number, max: number): number {
            let num = Math.floor(min + Math.random() * (max - min + 1));
            return num > max ? max : num;
        }

        /**
         * @desc 随机生成指定长度的字符串（大写字母、小写字母、数字）
         * @param len
         * */
        export function randomString(len: number): string {
            let $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz0123456789';
            let maxPos = $chars.length;
            let str = '';
            for (let i = 0; i < len; i++) {
                str += $chars.charAt(Math.floor(Math.random() * maxPos));
            }
            return str;
        }

        /**
         * @desc 随机生成指定长度的字符串（纯数字）
         * @param  len
         * */
        export function randomIntString(len: number): string {
            let chars = '0123456789';
            let maxPos = chars.length;
            let str = '';
            for (let i = 0; i < len; i++) {
                str += chars.charAt(Math.floor(Math.random() * maxPos));
            }
            return str;
        }
        const pattern = /^-?\d+(\.\d+)?$/;
        /**
         * @desc 判断字符串是否为整数数字
         * @param  len
         * */
        export function isNumeric(input: string): boolean {
            return pattern.test(input);
        }
    }

    export namespace intersect {
        export function rectCircle(rect: Rect, cp: Readonly<Vec2>, cr: number): boolean {
            const cx = cp.x;
            const cy = cp.y;

            const rx = rect.x;
            const ry = rect.y;
            const rw = rect.width;
            const rh = rect.height;

            // temporary variables to set edges for testing
            let testX = cx;
            let testY = cy;

            // which edge is closest?
            if (cx < rx) testX = rx;      // test left edge
            else if (cx > rx + rw) testX = rx + rw;   // right edge
            if (cy < ry) testY = ry;      // top edge
            else if (cy > ry + rh) testY = ry + rh;   // bottom edge

            // get distance from closest edges
            const distX = cx - testX;
            const distY = cy - testY;
            const distance = Math.sqrt((distX * distX) + (distY * distY));

            // if the distance is less than the radius, collision!
            if (distance <= cr) {
                return true;
            }
            return false;
        }
    }

    // 单例基类
    export class Singleton {
        public static getInstance<T extends {}>(this: new () => T): T {
            if (!(<any>this).instance) {
                (<any>this).instance = new this();
            }
            return (<any>this).instance;
        }
    }
}

(window as any).Utils = Utils;
export default Utils;
