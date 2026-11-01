import { _decorator, Node } from 'cc';
import { TimerManager } from './managers/timer-manager';
import { EventManager } from './managers/event-manager';
import { BundleManager } from './managers/bundle-manager';
import { AudioManager } from './managers/audio-manager';
import { FileManager } from './managers/file-manager';
import { i18n } from './managers/language-manager';
// import { RemoteImageManager } from './managers/remote-image-manager';

const { ccclass, property } = _decorator;

export class Manager {
    static hasInit = false;
    /** 资源管理管理 */
    public static bundleManager: BundleManager;
    /** 时间管理 */
    public static timeManager: TimerManager;
    /** 音效管理 */
    public static audioManager: AudioManager;
    /** 事件管理 */
    public static eventManager: EventManager;
    /** 文件管理 */
    public static fileManager: FileManager;
    /** 远程图片管理 */
    // public static remoteImageManager: RemoteImageManager;

    public static init(rootNode: Node) {
        Manager.hasInit = true;
        this.bundleManager = BundleManager.getInstance();
        this.timeManager = TimerManager.getInstance();
        this.audioManager = AudioManager.getInstance(rootNode);
        this.audioManager.init();
        this.eventManager = EventManager.getInstance();

        //文件管理
        this.fileManager = FileManager.getInstance();
        // this.remoteImageManager = RemoteImageManager.getInstance();

        i18n.init();
    }
}