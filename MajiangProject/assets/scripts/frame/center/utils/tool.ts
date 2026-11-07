export interface WeightMsg {
    id?: number,
    weight: number
}

export interface WeightedItem {
    value: any;
    weight: number;
}

export default class Random {

    static getRandomIntegerRange(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static randByWeight(arr: Array<WeightMsg>): number {
        let totalWeight: number = 0;
        let randIndex: number;
        for (let itemWeightMsg of arr) {
            totalWeight += itemWeightMsg.weight;
        }

        if (totalWeight <= 0) {
            return randIndex
        } else {
            let randVal: number = Random.getRandomIntegerRange(1, totalWeight);
            for (let index = 0; index < arr.length; index++) {
                if (randVal <= arr[index].weight) {
                    randIndex = index;
                    break;
                } else {
                    randVal -= arr[index].weight;
                }
            }
        }
        return randIndex;
    }

    /**
     * describe: 将数组结构的权重数据转成带weightd的key的obj元素类型的数组
     * 如arr: [[1, 10]], 1为id, 10表示权重
     * @param arr: 双重数组, 且元素长度为2， 元素个数不限, 子元素为number
     */
    static arrChangeWeightObjArr(arr: Array<Array<number>>): Array<WeightMsg> {
        let arrWeight: Array<WeightMsg> = [];
        for (let arrItem of arr) {
            let itemObj: WeightMsg = {
                id: arrItem[0],
                weight: arrItem[1]
            }
            arrWeight.push(itemObj);
        }
        return arrWeight;
    }



    static weightedShuffle<T extends WeightedItem>(items: T[]): T[] {
        // 拷贝原始数组，避免直接修改
        let tempitems = [...items];
        const shuffledItems: T[] = [];

        // 计算所有元素的权重总和
        let totalWeight = items.reduce((acc, item) => acc + item.weight, 0);
        // 如果没有权重或权重总和为0，直接返回原始数组
        if (totalWeight === 0) {
            return shuffledItems;
        }
        //shuffledItems.sort((a, b) => a.weight - b.weight)
        // 生成洗牌后的数组
        let length = items.length;
        for (let i = 0; i < length; i++) {
            // 生成一个介于0和权重总和之间的随机数
            const randomNum = Random.getRandomIntegerRange(1, totalWeight);
            let targetIndex = 0;
            let sum = 0;

            // 找到随机数对应的索引位置
            for (let j = 0; j < tempitems.length; j++) {
                sum += tempitems[j].weight;
                if (sum >= randomNum) {
                    //console.log(tempitems[j].value,sum,randomNum)
                    shuffledItems.push(tempitems[j]);

                    totalWeight -= tempitems[j].weight;
                    tempitems.splice(j, 1);
                    break;
                }
            }



            // // 如果目标索引不是当前索引，则更新权重总和（排除当前索引位置的元素）
            // if (targetIndex !== i) {
            //     totalWeight -= shuffledItems[i].weight;
            // }
        }

        return shuffledItems;
    }

}