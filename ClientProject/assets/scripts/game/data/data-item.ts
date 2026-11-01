import { SuperData } from './super-data';
import { DATA_NAME } from '../constant/common-define';


export class DataItem extends SuperData {
    public restitutionItem = []; //返回的道具
    // ---------  数据逻辑处理   ------------------
    netMessageHanders = {

    };

    name = DATA_NAME.ITEM_DATA;

    items: { [id: number]: number } = {};


    public init(): void {
        super.init();
    }

    // ---------  消息发送和接收end   ------------------
    public clear(): void {
        super.clear();
        this.items = {};
    }
}
