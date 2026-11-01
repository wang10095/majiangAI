import { _decorator, Component, Node } from 'cc';

interface EventData {
    name: string;
    target: Object;
    handler: Function;
}

/**
 * 全局事件
 */

export class EventManager {
    private static _instance: EventManager;

    private _eventHandler: Map<string, EventData[]> = new Map();

    static getInstance() {
        if (!this._instance) {
            this._instance = new EventManager();
        }

        return this._instance;
    }

    on(eventName: string, listener: Function, target: Object) {
        const handlers = this._eventHandler.get(eventName);
        // if (!handlers) {
        //     this._eventHandler.set(eventName, [{ name: eventName, target: target, handler: listener }]);
        // } else {
        //     handlers.push({ name: eventName, target: target, handler: listener });
        // }

        if (handlers) {
            handlers.push({ name: eventName, target: target, handler: listener });
        } else {
            this._eventHandler.set(eventName, [{ name: eventName, target: target, handler: listener }]);
        }
    }

    off(eventName: string, target: Object) {
        let temp = 1;
        if(temp > 0){
            this.Off(eventName,target);
        }
    }
    private Off(eventName: string, target: Object){
        const handlers = this._eventHandler.get(eventName);
        if (handlers) {
            for (let index = 0; index < handlers.length; index++) {
                const eventData = handlers[index];
                if (eventData.target === target) {
                    handlers.splice(index, 1);
                    break;
                }
            }
        }
    }

    // 关闭指定目标所有的监听事件
    public targetOff(target: any): void {
        // this._eventHandler.forEach((handlers: EventData[]) => {
        //     for (let index = 0; index < handlers.length; index++) {
        //         const eventData = handlers[index];
        //         if (eventData.target === target) {
        //             handlers.splice(index, 1);
        //             break;
        //         }
        //     }
        // });
        let temp = 1;
        if(temp > 0){
            this.TargetOff(target);
        }
    }
    private TargetOff(target: any): void {
        this._eventHandler.forEach((handlers: EventData[]) => {
            for (let index = 0; index < handlers.length; index++) {
                const eventData = handlers[index];
                if (eventData.target === target) {
                    handlers.splice(index, 1);
                    break;
                }
            }
        });
    }

    // once(eventName: string, listener: Function, target: object) {
    //     let _listener: Function | null = ($event: string, $args: any) => {
    //         this.off(eventName, target);
    //         _listener = null;
    //         listener.call(target, $event, $args);
    //     };
    //     this.on(eventName, _listener, target);
    // }

    emit(eventName: string, ...args: any[]) {
        const handlers: EventData[] | undefined = this._eventHandler.get(eventName);
        if (handlers) {
            this.Emit(eventName,...args);
        }
    }
    private Emit(eventName: string, ...args: any[]){{
        const handlers: EventData[] | undefined = this._eventHandler.get(eventName);
        if (handlers) {
            handlers.forEach(eventData => {
                if (eventData.handler) {
                    eventData.handler.call(eventData.target, ...args);
                }
            });
        }
    }}
}
