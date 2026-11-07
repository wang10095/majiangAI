import { _decorator, Component, Node, Asset, AssetManager, AudioClip, AudioSource, Constructor, assetManager, sys } from 'cc';
import { sdkUtils } from '../../sdk-common/sdk-utils';

const { ccclass, property } = _decorator;

export class AudioManager extends Component {
    private static _instance: AudioManager;

    private GAME_MUSIC_STATE: string = 'game_music_status';
    private storage_status_by: {
        music: string;
        audio: string;
        volume: number;
        shock: string;
    } | null = null;

    private _musicSourceBy!: AudioSource;
    private _audioSourceBy!: AudioSource;
    private _bubbleHitAudioSourceBy!: AudioSource;

    private _musicSwitchBy = true; //音乐
    private _audioSwitchBy = true;//音效
    private _audioVolumeBy = 1; // 音量
    private _shockSwitchBy = true;

    static getInstance(rootNode: Node) {
        if (!this._instance) {

            this._instance = rootNode.addComponent(AudioManager);

            const audioNode = new Node('UIAudio');
            audioNode.parent = rootNode;
            this._instance._audioSourceBy = audioNode.addComponent(AudioSource);
            this._instance._audioSourceBy.playOnAwake = false;

            const musicNode = new Node('UIMusic');
            musicNode.parent = rootNode;
            this._instance._musicSourceBy = musicNode.addComponent(AudioSource);
            this._instance._musicSourceBy.playOnAwake = false;

            const bubbleHitAudioNode = new Node('BubbleHitAudio');
            bubbleHitAudioNode.parent = rootNode;
            this._instance._bubbleHitAudioSourceBy = bubbleHitAudioNode.addComponent(AudioSource);
            this._instance._bubbleHitAudioSourceBy.playOnAwake = false;
        }
        return this._instance;
    }

    // 初始化数据
    init() {
        const storageValue = sys.localStorage.getItem(this.GAME_MUSIC_STATE);
        if (storageValue) {
            this.storage_status_by = JSON.parse(storageValue);
            this._musicSwitchBy = this.storage_status_by!.music !== 'off';
            this._audioSwitchBy = this.storage_status_by!.audio !== 'off';
            this._audioVolumeBy = this.storage_status_by!.volume;
            this._shockSwitchBy = this.storage_status_by!.shock !== 'off';
        } else {
            this.storage_status_by = {
                music: this._musicSwitchBy ? 'on' : 'off',
                audio: this._audioSwitchBy ? 'on' : 'off',
                volume: this._audioVolumeBy,
                shock: this._shockSwitchBy ? 'on' : 'off',
            };
        }
    }

    async playMusic(musicName: string, isLoop = true) {
        if (!this.GAME_MUSIC_STATE) {
            this.init();
        }
        if (!this._musicSwitchBy) {
            return;
        }
        if (this._musicSourceBy.clip) {
            if (this._musicSourceBy.clip.name === musicName) {
                // 当前背景音只有一种
                console.log('play _musice same', musicName);
                this._musicSourceBy.play();
                return;
            }

        }
        if (this._musicSourceBy) {
            console.log('stop _musice', this._musicSourceBy?.clip?.name);
            this._musicSourceBy.stop();
        }
        const audioClip: AudioClip | null = await this.load(musicName, AudioClip);
        this.scheduleOnce(() => {
            if (audioClip) {
                this._musicSourceBy.clip = audioClip;
                this._musicSourceBy.volume = this._audioVolumeBy;
                this._musicSourceBy.loop = isLoop;
                this._musicSourceBy.play();
                console.log('start musice', this._musicSourceBy.clip.name);
            }
        }, 0.2);
    }

    stopMusic() {
        this._musicSourceBy.stop();
    }

    async playAudio(audioSource: AudioSource, audioName: string, audioScale = 1) {
        if (!this._audioSwitchBy) {
            return;
        }
        //audioSource = audioSource || this._audioSourceBy;
        if (audioSource) {
            audioSource = audioSource;
        } else {
            audioSource = this._audioSourceBy;
        }
        const audioClip: AudioClip | null = await this.load(audioName, AudioClip);
        if (audioClip) {
            audioSource.playOneShot(audioClip, audioScale * this._audioVolumeBy);
        }
    }

    async playBubbleHitAudio() {
        if (!this._audioSwitchBy) {
            return;
        }
        //this._bubbleHitAudioSourceBy.stop();
        if (this._bubbleHitAudioSourceBy.playing) {
            this._bubbleHitAudioSourceBy.stop();
        }
        const audioClip: AudioClip | null = await this.load('S_BubbleHit', AudioClip);
        if (audioClip) {
            this._bubbleHitAudioSourceBy.clip = audioClip;
            this._bubbleHitAudioSourceBy.play();
        }


        // if (!this._audioSwitchBy) {
        //     return;
        // }
        // const audioClip: AudioClip | null = await this.load('S_BubbleHit', AudioClip);
        // this.scheduleOnce(() => {
        //     if (!this._audioSwitchBy) {
        //         return;
        //     }
        //     this._bubbleHitAudioSourceBy.stop();
        //     // if(this._bubbleHitAudioSourceBy.playing){
        //     //     console.log(1111111111111111111111111111111111111111111111)
        //     //     this._bubbleHitAudioSourceBy.stop();
        //     // }
        //    // const audioClip: AudioClip | null = await this.load('S_BubbleHit', AudioClip);
        //     if (audioClip) {
        //         this._bubbleHitAudioSourceBy.playOneShot(audioClip, 1 * this._audioVolumeBy);
        //     }
        // });
    }

    playShock() {
        if (!this._shockSwitchBy) {
            return;
        }
        sdkUtils.vibrateShort();
    }

    resume() {
        console.log('AudioResume');
        if (this._musicSwitchBy) {
            this._musicSourceBy.play();
        }
    }

    pause() {
        console.log('pauseResume');
        if (this._musicSwitchBy) {
            this._musicSourceBy.pause();
        }
    }

    // 切换状态
    switchMusicStatus(musicState: boolean) {
        this._musicSwitchBy = musicState;
    }

    // 切换状态
    switchAudioStatus(audioState: boolean) {
        this._audioSwitchBy = audioState;
    }

    // 切换震动状态
    switchShockStatus(shockState: boolean) {
        this._shockSwitchBy = shockState;
    }

    // 修改音量大小
    changeVolume(volume: number) {
        this._audioVolumeBy = volume;
    }

    // 加载
    private load<T extends Asset>(path: string, type: Constructor<T> | null): Promise<T> {
        return new Promise((resolve, reject) => {
            const bundleName = 'audio';
            let bundle = assetManager.getBundle(bundleName);
            if (!bundle) {
                const options: { [key: string]: string } = {};
                assetManager.loadBundle(bundleName, options, (err: Error, assetBundle: AssetManager.Bundle) => {
                    if (err) {
                        console.warn('加载包：' + bundleName + ' => 失败');
                        reject(err);
                        return;
                    }
                    bundle = assetBundle;
                    console.log('请求加载' + path);
                    bundle.load(path, (err, data: Asset) => {
                        console.log('加载包：' + path + ' => success');
                        if (err) {
                            reject(err);
                        } else {
                            resolve(data as T);
                        }
                    });
                });
            } else {
                bundle.load(path, (err, data: Asset) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data as T);
                    }
                });
            }
        });
    }


    // 保存状态
    saveAudioStatus() {
        this.storage_status_by = {
            music: this._musicSwitchBy ? 'on' : 'off',
            audio: this._audioSwitchBy ? 'on' : 'off',
            volume: this._audioVolumeBy,
            shock: this._shockSwitchBy ? 'on' : 'off',
        };

        sys.localStorage.setItem(this.GAME_MUSIC_STATE, JSON.stringify(this.storage_status_by));
    }



    //获取音效状态
    getAudioStatus() {
        return {
            music: this._musicSwitchBy,
            audio: this._audioSwitchBy,
            shock: this._shockSwitchBy,
        };
    }

}
