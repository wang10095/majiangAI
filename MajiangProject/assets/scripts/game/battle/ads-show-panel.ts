

import { Node, _decorator, tween } from 'cc';
import { SuperPanel } from '../../frame/center/components/super-panel';
import { isDebugTest, isMiniGame } from '../game-define';
import { G_playVideoAd } from '../ui-commonset';
import { TESdkData } from '../../frame/sdk-common/TE-sdk';
import { G_adId, G_isTest } from '../constant/common-define';

const { ccclass, property } = _decorator;

@ccclass('AdsShowPanel')
export class AdsShowPanel extends SuperPanel {
    @property({
        type: [Node],
        tooltip: ''
    })
    nodeTitle: Node[] = [];

    _key: string = null;
    _callback = null;
    _branchId = '';
    _prop_id: number = null;
    show(key: string, callBack, branchId, prop_id): void {
        this._key = key;
        this._callback = callBack;
        this._branchId = branchId;
        if (prop_id) {
            this._prop_id = prop_id;
        }
    }

    protected onLoad(): void {
        super.onLoad();
    }

    start(): void {
        super.start();

        if (isMiniGame) { //扣扣表情包还没有ad_id

            this.nodeTitle.forEach((node) => {
                node.active = false;
            })

            const adId = Config.AdsKey[this._key].adId;
            TESdkData.createAds(G_adId, this._key);
            G_playVideoAd(G_adId, (isSuccess: boolean) => {
                this.pushEmit(isSuccess);
            }, this._branchId, this._prop_id);

        } else {
            let count = 1;
            this.nodeTitle.forEach((node) => {
                node.active = false;
            })

            this.nodeTitle[0].active = true;

            if (isDebugTest) {
                this.scheduleOnce(() => {
                    this.pushEmit(true);
                }, 0.5);
            } else {

                this.schedule(() => {
                    this.nodeTitle.forEach((node) => {
                        node.active = false;
                    })
                    console.log('======count============', count)
                    if (count < this.nodeTitle.length) {
                        this.nodeTitle[count].active = true;
                    }

                    count++;

                    if (count > this.nodeTitle.length) {
                        this.pushEmit(true);
                        this.unscheduleAllCallbacks();
                    }

                }, 1, 2)
            }
        }



    }


    pushEmit(isSuccess: boolean) {
        this.close();
        if (isSuccess && this._callback) {
            console.log('=pushEmit===看广告成功 发奖励==')
            this._callback();
            this._callback = null;
        }

    }

}