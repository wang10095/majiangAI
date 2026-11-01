import { _decorator } from 'cc';
import { SuperComponent } from './super-component';

const { ccclass, property } = _decorator;

@ccclass
export default class ScrollReuseItem extends SuperComponent {
    /**
     * DataIndex 从0开始，对应EndlessScrollView中Init函数传入的data[]数组的索引
     */
    public dataIndex = 0;
    data: any;
    public renewView(dataIndex: number, data: any) {
        this.dataIndex = dataIndex;
        this.data = data;
    }

    public setInitAnimal(dataIndex: number) { }
}
