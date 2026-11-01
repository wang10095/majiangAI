import {
    Component,
    Prefab,
    ScrollView,
    _decorator,
    Node,
    UITransform,
    Vec2,
    instantiate,
    error,
    log,
    size,
    isValid,
    Vec3,
    CCInteger,
    CCFloat,
    Enum,
    CCBoolean
} from 'cc';
import ScrollReuseItem from './scroll-item';
import { BatchItems } from './batch-items';

const { ccclass, property } = _decorator;
export enum ScrollDirEnum {
    Vertical,
    Horizon,
    VGrid, // 背包
    HGrid // 背包
}

@ccclass
export default class ScrollReuse extends Component {
    /**
     * view裁剪节点，根据view尺寸，计算可视区域可以显示多少个item
     */
    @property(ScrollView)
    scrollView: ScrollView = null;

    /**
     * 充当items的父物体
     */
    @property(Node)
    content: Node = null;

    @property(Prefab)
    itemPrefab: Prefab = null;

    @property({
        type: Enum(ScrollDirEnum),
        displayName: '排列方式 0纵向 1横向 2纵向格子 3横向格子'
    })
    scrollDir = ScrollDirEnum.Vertical;

    @property({
        type: CCInteger,
        displayName: '2格子排列列数',
        visible() {
            return this.scrollDir === ScrollDirEnum.VGrid;
        }
    })
    vNum = 1;

    @property({
        type: CCInteger,
        displayName: '3格子排列行数',
        visible() {
            return this.scrollDir === ScrollDirEnum.HGrid;
        }
    })
    hNum = 1;

    @property(CCInteger)
    itemWidth = 0;

    @property(CCInteger)
    itemHeight = 0;

    @property({
        type: CCInteger,
        displayName: '视图区域外多创建的个数'
    })
    moreCacheNum = 6;

    @property({
        displayName: '是否启用合批功能'
    })
    useBatchComp = true;

    @property({
        displayName: '是否分帧加载'
    })
    isFrameLoad = true;

    @property(CCFloat)
    paddingTop = 10;

    @property(CCFloat)
    paddingBottom = 10;

    @property(CCFloat)
    paddingLeft = 10;

    @property(CCFloat)
    paddingRight = 10;

    @property(CCFloat)
    spaceY = 20;

    @property(CCFloat)
    spaceX = 20;

    private viewItemsCount = 0; // view区域能填充的物体数
    private dataCount = 0;
    private cacheItems: { [idx: number]: Node } = {};
    private cacheCount = 0;

    // scroll开始的最小下标和最大下标
    private startIndex = 0;
    private endIndex = 0;

    private data: any[] = [];

    private setDataFunc: Function;

    private initedScrollOver = false; // 初始实例化是否结束
    private cacheScrollOffset = null; // 初始滚动位置

    initView(datas: any[], initItemCount: number, resetDataFunc?: Function) {
        this.releaseView(); // 重置
        this.addScrollEvent();
        this.data = datas;
        this.dataCount = datas.length;
        this.setDataFunc = resetDataFunc;
        if (this.scrollDir === ScrollDirEnum.Vertical) {
            this.viewItemsCount = initItemCount
                ? initItemCount
                : Math.ceil(this.scrollView.node.getComponent(UITransform).height / (this.itemHeight + this.spaceY));
        } else if (this.scrollDir === ScrollDirEnum.Horizon) {
            this.viewItemsCount = initItemCount
                ? initItemCount
                : Math.ceil(this.scrollView.node.getComponent(UITransform).width / (this.itemWidth + this.spaceX));
        } else if (this.scrollDir === ScrollDirEnum.VGrid) {
            this.viewItemsCount = initItemCount
                ? initItemCount
                : Math.ceil(this.scrollView.node.getComponent(UITransform).height / (this.itemHeight + this.spaceY));
            this.viewItemsCount = this.viewItemsCount * this.vNum;
        } else if (this.scrollDir === ScrollDirEnum.HGrid) {
            this.viewItemsCount = initItemCount
                ? initItemCount
                : Math.ceil(this.scrollView.node.getComponent(UITransform).width / (this.itemWidth + this.spaceX));
            this.viewItemsCount = this.viewItemsCount * this.hNum;
        }
        this.startIndex = 0; // fromindex
        // this.cacheCount = this.viewItemsCount + 6;
        // if (this.dataCount < this.cacheCount) {
        // 	this.cacheCount = this.dataCount;
        // }
        this.resetEndIndex();

        if (this.isFrameLoad) {
            const instanceTime = 4; // 分几次创建
            const fameDur = 0.02;
            const fameNum = Math.ceil(this.cacheCount / instanceTime); // 每次实例化数量
            // 分帧创建
            let instanceItemNum = 0;
            this.initedScrollOver = false;
            this.schedule(
                () => {
                    for (let index = 0; index < fameNum; index++) {
                        this.addItem(instanceItemNum++, true);
                        if (instanceItemNum >= this.cacheCount) {
                            this.initedScrollOver = true;
                            if (this.cacheScrollOffset) {
                                this.setContentOffset(this.cacheScrollOffset);
                            }
                        }
                    }
                },
                fameDur,
                instanceTime,
                0.1
            );
        } else {
            for (let index = 0; index < this.cacheCount; index++) {
                if (this.data[index] === undefined) {
                    break;
                }
                this.addItem(index, true);
            }
            this.initedScrollOver = true;
        }

        // 根据数据总数，以及锚点设置情况来设置content的高度
        this.reCalculateContentSize();
        if (this.useBatchComp && !this.content.getComponent(BatchItems)) {
            this.content.addComponent(BatchItems).enabled = true;
        }
    }

    getData() {
        return this.data;
    }

    // 重新计算内容大小
    private reCalculateContentSize() {
        const contentTempSize = size(this.scrollView.node.getComponent(UITransform).width, this.scrollView.node.getComponent(UITransform).height);
        if (this.scrollDir === ScrollDirEnum.Vertical) {
            const totleHeight = this.dataCount * (this.itemHeight + this.spaceY) - this.spaceY + this.paddingTop + this.paddingBottom;
            if (totleHeight > contentTempSize.height) {
                contentTempSize.height = totleHeight;
            }
        } else if (this.scrollDir === ScrollDirEnum.Horizon) {
            const totleWidth = this.dataCount * (this.itemWidth + this.spaceX) - this.spaceX + this.paddingLeft + this.paddingRight;
            if (totleWidth > contentTempSize.width) {
                contentTempSize.width = totleWidth;
            }
        } else if (this.scrollDir === ScrollDirEnum.VGrid) {
            const totleHeight =
                Math.ceil(this.dataCount / this.vNum) * (this.itemHeight + this.spaceY) - this.spaceY + this.paddingTop + this.paddingBottom;
            if (totleHeight > contentTempSize.height) {
                contentTempSize.height = totleHeight;
            }
        } else if (this.scrollDir === ScrollDirEnum.HGrid) {
            const totleWidth =
                Math.ceil(this.dataCount / this.hNum) * (this.itemWidth + this.spaceX) - this.spaceX + this.paddingLeft + this.paddingRight;
            if (totleWidth > contentTempSize.width) {
                contentTempSize.width = totleWidth;
            }
        }
        this.content.getComponent(UITransform).setContentSize(contentTempSize);
    }
    resetEndIndex() {
        this.cacheCount = this.viewItemsCount + this.moreCacheNum;
        this.endIndex = this.startIndex + this.cacheCount - 1; // toindex
        if (this.endIndex > this.dataCount) {
            this.endIndex = this.dataCount - 1;
        }
        // this.content.setContentSize(this.endIndex * this.itemHeight + this.spaceY);
    }

    addScrollEvent() {
        const eventHandler = new Component.EventHandler();
        eventHandler.target = this.node;
        eventHandler.component = 'scroll-endless';
        eventHandler.handler = 'onScroll';
        this.scrollView.scrollEvents.push(eventHandler);
    }

    onScroll(scroll: ScrollView, eventType: any) {
        // 获取滚动视图相对于左上角原点的当前滚动偏移
        if (this.dataCount === 0) {
            return;
        }

        // 停止滚动
        // if (eventType === 9) {
        // 	this.content.children.forEach(child => {
        // 		const rankData = child.getComponent(RankItem).data;
        // 	})
        // }
        const scrollOffset: Vec2 = this.scrollView.getScrollOffset();
        let offest = 0;
        let currentStartIndex: number = this.startIndex;
        if (this.scrollDir === ScrollDirEnum.Horizon) {
            // 水平的offset是负数，?
            offest = -scrollOffset.x;
            currentStartIndex = Math.floor(offest / (this.itemWidth + this.spaceX));
        } else if (this.scrollDir === ScrollDirEnum.HGrid) {
            offest = -scrollOffset.x;
            currentStartIndex = Math.floor(offest / (this.itemWidth + this.spaceX));
            currentStartIndex = currentStartIndex * this.hNum;
        } else if (this.scrollDir === ScrollDirEnum.Vertical) {
            offest = scrollOffset.y;
            currentStartIndex = Math.floor(offest / (this.itemHeight + this.spaceY));
        } else if (this.scrollDir === ScrollDirEnum.VGrid) {
            offest = scrollOffset.y;
            currentStartIndex = Math.floor(offest / (this.itemHeight + this.spaceY));
            currentStartIndex = currentStartIndex * this.vNum;
        }

        if (currentStartIndex + this.cacheCount > this.dataCount) {
            currentStartIndex = this.dataCount - this.cacheCount;
        }
        if (currentStartIndex <= 0) {
            currentStartIndex = 0;
        }
        if (currentStartIndex === this.startIndex) {
            return;
        }

        // log("changeIndex:", currentStartIndex, this.startIndex, this.endIndex);

        if (currentStartIndex - this.startIndex > 0) {
            // 向上滑动
            for (let index = 0; index <= currentStartIndex - this.startIndex; index++) {
                if (this.endIndex + index < this.dataCount) {
                    this.updateItem(this.endIndex + index, this.startIndex + index - 1);
                }
            }
        } else {
            // 向下滑动
            for (let index = 0; index < this.startIndex - currentStartIndex; index++) {
                if (this.startIndex - index - 1 >= 0) {
                    this.updateItem(this.startIndex - index - 1, this.endIndex - index);
                }
            }
        }

        this.startIndex = currentStartIndex;
        this.resetEndIndex();
    }

    // 添加item项
    addItem(addIndex: number, isInit?: boolean) {
        if (!this.data[addIndex]) {
            return;
        }
        let tmp = this.cacheItems[addIndex];
        if (!tmp) {
            tmp = instantiate(this.itemPrefab);
        }
        tmp.active = true;
        tmp.parent = this.content;
        if (this.setDataFunc) {
            this.setDataFunc(tmp.getComponent(ScrollReuseItem), addIndex, this.data[addIndex]);
        } else {
            tmp.getComponent(ScrollReuseItem).renewView(addIndex, this.data[addIndex]);
        }
        this.cacheItems[addIndex] = tmp;
        // 根据自己的锚点情况来设置x,y坐标
        this.resetItemPosition(addIndex);
        if (isInit) {
            tmp.getComponent(ScrollReuseItem).setInitAnimal(addIndex);
        }
    }

    updateItem(newIndex: number, oldIndex: number) {
        // log("chang:", newIndex, oldIndex)
        if (!this.cacheItems[oldIndex]) {
            // oldIndex中无内容
            return;
        }
        if (this.cacheItems[newIndex] && this.cacheItems[newIndex].parent) {
            this.cacheItems[newIndex].parent = null;
        }
        this.cacheItems[newIndex] = this.cacheItems[oldIndex];
        if (this.setDataFunc) {
            this.setDataFunc(this.cacheItems[newIndex].getComponent(ScrollReuseItem), newIndex, this.data[newIndex]);
        } else {
            if (!this.cacheItems[newIndex]) {
                error('error', newIndex, oldIndex);
            }
            this.cacheItems[newIndex].getComponent(ScrollReuseItem).renewView(newIndex, this.data[newIndex]);
        }
        this.cacheItems[oldIndex] = null;
        this.resetItemPosition(newIndex);
        // log("this.cacheItems:", this.cacheItems)
    }

    // 移除item项
    removeItem(removeIndex: number) {
        // this.cacheItems[this.cacheCount] = this.cacheItems[removeIndex];
        // if (this.cacheItems[removeIndex]) {
        // 	this.cacheItems[removeIndex].parent = null;
        // 	this.cacheItems[removeIndex] = null;
        // }
        // for (let index = removeIndex; index < this.endIndex; index++) {
        // 	if (this.cacheItems[index + 1]) {
        // 		this.cacheItems[index] = this.cacheItems[index + 1];
        // 		if (this.cacheItems[index].parent) {
        // 			this.resetItemPosition(index);
        // 		}
        // 	}
        // }
    }

    resetItemPosition(index: number) {
        // 根据自己的锚点情况来设置x,y坐标
        let tmpX = 0;
        let tmpY = 0;

        if (this.scrollDir === ScrollDirEnum.Vertical) {
            tmpY = -((index + 1) * this.itemHeight - this.itemHeight * 0.5) - this.spaceY * index - this.paddingTop;
        } else if (this.scrollDir === ScrollDirEnum.Horizon) {
            tmpX = (index + 1) * this.itemWidth - this.itemWidth * 0.5 + this.spaceX * index + this.paddingLeft;
        } else if (this.scrollDir === ScrollDirEnum.VGrid) {
            const rowNum: number = Math.floor(index / this.vNum);
            const colnNum: number = index % this.vNum;
            tmpY = -((rowNum + 1) * this.itemHeight - this.itemHeight * 0.5) - this.spaceY * rowNum - this.paddingTop;
            tmpX =
                colnNum * (this.itemWidth + this.spaceX) -
                (this.scrollView.node.getComponent(UITransform).width - this.itemWidth) * 0.5 +
                this.paddingLeft;
        } else if (this.scrollDir === ScrollDirEnum.HGrid) {
            const rowNum: number = index % this.hNum;
            const colnNum: number = Math.floor(index / this.hNum);
            // console.log('rowNum:', index, rowNum, colnNum);
            tmpY = -((rowNum + 1) * this.itemHeight - this.itemHeight * 0.5) - this.spaceY * rowNum - this.paddingTop;
            tmpX = (colnNum + 1) * this.itemWidth - this.itemWidth * 0.5 + this.spaceX * colnNum + this.paddingLeft;
        }
        this.cacheItems[index].position = new Vec3(tmpX, tmpY);
    }

    // 增加数据
    addData(index: number, addData: any) {
        this.data.splice(index, 0, addData);
        this.dataCount = this.data.length;

        this.addDataReset();
    }

    addDataReset() {
        this.resetEndIndex();
        this.resetCurrentView();
        this.reCalculateContentSize();
    }

    // 移除
    removeData(index: number) {
        this.data.splice(index, 1);
        this.dataCount = this.data.length;
        if (this.cacheItems[this.endIndex]) {
            this.cacheItems[this.endIndex].parent = null;
        }
        this.resetEndIndex();

        // this.endIndex = this.startIndex + this.cacheCount - 1;
        // if (this.endIndex > this.dataCount) {
        // 	this.endIndex = this.dataCount - 1;
        // }
        this.resetCurrentView();
        this.reCalculateContentSize();
    }

    // 增加数据
    addDatas(datas: { [idx: number]: any }) {
        const keys = Object.keys(datas);
        log('befor:', keys);
        keys.sort((a, b) => {
            return Number(a) - Number(b);
        });
        log(keys);
        log('after:', keys);
        for (let i = 0; i < keys.length; i++) {
            this.data.splice(Number(keys[i]), 0, datas[Number(keys[i])]);
        }
        this.dataCount = this.data.length;
        this.resetEndIndex();
        // this.endIndex = this.startIndex + this.cacheCount - 1;
        // if (this.endIndex > this.dataCount) {
        // 	this.endIndex = this.dataCount - 1;
        // } else if (this.endIndex < )

        this.resetCurrentView();
        this.reCalculateContentSize();
    }

    // 移除
    removeDatas(idxs: number[]) {
        // 降序
        idxs.sort((a, b) => {
            return b - a;
        });
        for (let i = 0; i < idxs.length; i++) {
            const index = idxs[i];
            this.data.splice(index, 1);
            if (this.cacheItems[this.endIndex]) {
                this.cacheItems[this.endIndex].parent = null;
            }
            this.resetEndIndex();
        }
        this.dataCount = this.data.length;
        // this.endIndex = this.startIndex + this.cacheCount - 1;
        // if (this.endIndex > this.dataCount) {
        // 	this.endIndex = this.dataCount - 1;
        // }
        this.resetCurrentView();
        this.reCalculateContentSize();
    }

    // 数据改变
    changeDatas(datas: { [idx: number]: any }) {
        for (const key of Object.keys(datas)) {
            this.data[Number(key)] = datas[Number(key)];
        }
    }

    // 刷新当前显示数据
    resetCurrentView() {
        for (let index = this.startIndex; index <= this.endIndex; index++) {
            if (this.data[index]) {
                if (!this.cacheItems[index]) {
                    this.cacheItems[index] = instantiate(this.itemPrefab);
                    this.cacheItems[index].parent = this.content;
                }
                if (!this.cacheItems[index].parent) {
                    this.cacheItems[index].parent = this.content;
                }
                if (this.setDataFunc) {
                    this.setDataFunc(this.cacheItems[index].getComponent(ScrollReuseItem), index, this.data[index]);
                } else {
                    this.cacheItems[index].getComponent(ScrollReuseItem).renewView(index, this.data[index]);
                }
                this.resetItemPosition(index);
            } else {
                if (this.cacheItems[index]) {
                    this.cacheItems[index].parent = null;
                }
            }
        }
    }

    // 设置偏移位置 （setScrollOffset 此处使用有些问题 ，设置完成再getScrollOffset获得的为(0,0)）
    setContentOffset(offset: Vec2) {
        if (this.initedScrollOver) {
            this.scrollView.scrollToOffset(offset);
            this.onScroll(null, null);
            this.cacheScrollOffset = null;
        } else {
            this.cacheScrollOffset = offset;
        }
    }

    getContentOffset() {
        return this.scrollView.getContentPosition();
    }

    // 数据重置
    releaseView() {
        for (const key in this.cacheItems) {
            // if (this.cacheItems.hasOwnProperty(key)) {
            //     const item = this.cacheItems[key];
            //     if (item) {
            //         item.active = false;
            //     }
            // }
            if (this.cacheItems.hasOwnProperty(key)) {
                const item = this.cacheItems[key];
                if (isValid(item)) {
                    item.destroy();
                }
            }
        }
        this.cacheItems = {};
        this.data = [];
        this.dataCount = 0;
        this.startIndex = 0;
        this.endIndex = 0;
        this.setDataFunc = null;
        this.viewItemsCount = 0;
        if (this.content && this.content.isValid) {
            this.content.getComponent(UITransform).setContentSize(size(0, 0));
        }

        this.scrollView.stopAutoScroll();
    }

    protected onEnable(): void {
        if (this.useBatchComp && this.content.getComponent(BatchItems)) {
            this.content.getComponent(BatchItems).enabled = true;
        }
    }

    protected onDisable(): void {
        if (this.useBatchComp && this.content.getComponent(BatchItems)) {
            this.content.getComponent(BatchItems).enabled = false;
        }
    }

    onDestroy() {
        this.releaseView();
        for (const key in this.cacheItems) {
            if (this.cacheItems.hasOwnProperty(key)) {
                const item = this.cacheItems[key];
                if (isValid(item)) {
                    item.destroy();
                }
            }
        }
        this.cacheItems = {};
    }
}
