import { SuperData } from './super-data';
import { DATA_NAME, PushType } from '../constant/common-define';
import { MessageID } from '../constant/message-define';


export class DataCommon extends SuperData {
    name = DATA_NAME.COMMON_DATA;
    // ---------  数据逻辑处理   ------------------
    netMessageHanders = {

    };

    public init(): void {
        super.init();
    }

    // ---------  消息发送和接收end   ------------------

    requestGetEnterGameCircle() {
        const data = {}
        // this.sendMessage(MessageID.RankArea, data, PushType.Get)
    }









    public clear(): void {
        super.clear();

    }
}
