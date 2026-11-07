import { _decorator, Button, Component, director, find } from 'cc';
import { Manager } from '../../frame/center/manager';

const { ccclass } = _decorator;

@ccclass('HomeEntry')
export class HomeEntry extends Component {
    onLoad(): void {
        const button = find('Canvas/btn_single') ?? this.node.getChildByPath('btn_single');
        const buttonComponent = button?.getComponent(Button);
        if (!buttonComponent) {
            console.error('[HomeEntry] btn_single Button not found');
            return;
        }
        buttonComponent.node.off(Button.EventType.CLICK, this.enterSingle, this);
        buttonComponent.node.on(Button.EventType.CLICK, this.enterSingle, this);
    }

    private async enterSingle(): Promise<void> {
        console.log('[HomeEntry] enter single-player Mahjong');
        try {
            const battleBundle = await Manager.bundleManager.loadBundle('battle');
            battleBundle.loadScene('battle', (error) => {
                if (error) {
                    console.error('[HomeEntry] failed to load battle scene', error);
                    return;
                }
                director.loadScene('battle');
            });
        } catch (error) {
            console.error('[HomeEntry] failed to load battle bundle', error);
        }
    }
}
