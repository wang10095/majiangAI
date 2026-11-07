import { _decorator, Button, Component, director, find, instantiate, Label, Node, Sprite, SpriteFrame, sys, UITransform } from 'cc';
import { Manager } from '../../frame/center/manager';
import { Toast } from '../../frame/center/components/toast';
import { G_serverUrl } from '../constant/common-define';
import socketIo from '../../../libs/socket.io.js';

const { ccclass } = _decorator;

type MahjongPlayer = {
    seat: number;
    hand: number[];
    discards?: number[];
    melds?: { type: string; tiles: number[] }[];
};

type MahjongAction = {
    actionSeq?: number;
    type?: string;
    actorSeat?: number;
    tile?: number;
    tiles?: number[];
    event?: string;
};

type MahjongSnapshot = {
    phase?: string;
    currentSeat?: number;
    dealerSeat?: number;
    wallRemaining?: number;
    openingIndex?: number;
    actionSeq?: number;
    lastAction?: MahjongAction;
    operationWindow?: {
        sourceSeat: number;
        tile: number;
        eligible: string[];
    };
    winnerSeat?: number;
    winType?: string;
    players?: MahjongPlayer[];
};

enum MahjongFlowState {
    INITIALIZING = 'INITIALIZING',
    ANNOUNCING_START = 'ANNOUNCING_START',
    ANNOUNCING_DEALER = 'ANNOUNCING_DEALER',
    ANNOUNCING_DICE = 'ANNOUNCING_DICE',
    ANNOUNCING_DEAL = 'ANNOUNCING_DEAL',
    DEALING = 'DEALING',
    ANNOUNCING_TURN = 'ANNOUNCING_TURN',
    WAITING_DISCARD = 'WAITING_DISCARD',
    WAITING_RESPONSE = 'WAITING_RESPONSE',
    WAITING_ROBOT = 'WAITING_ROBOT',
    ENDED = 'ENDED',
}

type MahjongStartResponse = MahjongSnapshot & {
    gameId: string;
};

type MahjongSocket = {
    disconnect: () => void;
    emit: (event: string, payload: unknown, ack?: (response: unknown) => void) => void;
    on: (event: string, listener: (...args: any[]) => void) => void;
};

@ccclass('battle')
export class battle extends Component {
    private mahjongGameId = '';
    private mahjongClientSeq = 0;
    private mahjongSelected: Node | null = null;
    private operationChoiceNode: Node | null = null;
    private mahjongSocket: MahjongSocket | null = null;
    private snapshotStateQueue: Promise<void> = Promise.resolve();
    private operationActions: string[] = [];
    private cardTemplate: Node | null = null;
    private lastAnnouncedActionSeq = 0;
    private gameEnded = false;
    private renderedHandKey = '';
    private lastTurnSeat: number | undefined;
    private flowState = MahjongFlowState.INITIALIZING;
    private toastQueue: Promise<void> = Promise.resolve();
    private lastSnapshotLogKey = '';
    private lastOperationLogKey = '';
    private lastAppliedActionSeq = -1;
    private mahjongStarting = false;
    private mahjongStarted = false;
    private mahjongRefreshPromise: Promise<string> | null = null;

    onLoad(): void {
        console.log('[Mahjong] onLoad: battle scene initialized');
        const initialized = this.initializeMahjongUi();
        if (!initialized) return;
        console.log('[Mahjong] onLoad: required nodes found, starting game request');
        void this.startMahjongGame();
    }

    private initializeMahjongUi(): boolean {
        this.cardTemplate ??= this.node.getChildByPath('card_node/node_my/my_card/card_1') ??
            this.findNode('card_node/node_my/my_card/card_1');
        const discardButton = this.findNode('btn_push')?.getComponent(Button);
        const operationButton = this.findNode('btn_op')?.getComponent(Button);
        const backButton = this.findNode('btn_back')?.getComponent(Button);

        discardButton?.node.off(Button.EventType.CLICK, this.discardMahjongTile, this);
        discardButton?.node.on(Button.EventType.CLICK, this.discardMahjongTile, this);
        operationButton?.node.off(Button.EventType.CLICK, this.handleOperationButton, this);
        operationButton?.node.on(Button.EventType.CLICK, this.handleOperationButton, this);
        backButton?.node.off(Button.EventType.CLICK, this.goHome, this);
        backButton?.node.on(Button.EventType.CLICK, this.goHome, this);
        this.clearOperationLabels();
        if (discardButton) discardButton.node.active = false;
        if (operationButton) operationButton.node.active = false;
        const currentPlayer = this.findNode('center/selectZhuangBg/currentPlayer');
        if (currentPlayer) currentPlayer.active = false;
        if (this.cardTemplate) this.cardTemplate.active = false;

        if (!this.cardTemplate || !discardButton || !backButton) {
            console.error('[Mahjong] battle scene is missing required UI nodes');
            void this.queueMahjongToast('麻将界面初始化失败');
            return false;
        }
        return true;
    }

    private findNode(path: string): Node | null {
        return find(`Canvas/${path}`) ?? this.node.getChildByPath(path);
    }

    private async startMahjongGame(): Promise<void> {
        if (this.mahjongStarting || this.mahjongStarted) return;
        if (!this.initializeMahjongUi()) return;
        this.mahjongStarting = true;
        this.mahjongStarted = false;
        this.gameEnded = false;
        this.mahjongClientSeq = 0;
        this.lastAnnouncedActionSeq = 0;
        this.lastTurnSeat = undefined;
        this.renderedHandKey = '';
        this.lastSnapshotLogKey = '';
        this.lastOperationLogKey = '';
        this.logSnapshot('before start request', null);
        try {
            this.flowState = MahjongFlowState.ANNOUNCING_START;
            const response = await this.mahjongRequest<MahjongStartResponse>('POST', 'mahjong/single');
            this.mahjongGameId = response.gameId;
            console.log('[Mahjong] start response:', response);
            await this.waitAndToast(0, '游戏开始');
            this.flowState = MahjongFlowState.ANNOUNCING_DEALER;
            await this.waitAndToast(3000, `庄家：${this.seatName(response.dealerSeat)}边`);
            this.flowState = MahjongFlowState.ANNOUNCING_DICE;
            await this.waitAndToast(
                3000,
                `转骰子发牌，牌墩从${this.seatName(response.openingIndex ?? 0)}边开始`,
            );
            this.flowState = MahjongFlowState.ANNOUNCING_DEAL;
            await this.waitAndToast(3000, '开始发牌');
            this.flowState = MahjongFlowState.DEALING;
            await this.processMahjongSnapshot(response, true);
            this.connectMahjongSocket();
            this.mahjongStarted = true;
        } catch (error) {
            console.error('[Mahjong] start failed', error);
            this.queueMahjongToast('麻将服务连接失败');
            this.setCurrentPlayerText('麻将服务连接失败');
        } finally {
            this.mahjongStarting = false;
        }
    }

    private connectMahjongSocket(): void {
        const token = sys.localStorage.getItem('access_token') ?? '';
        const serverUrl = G_serverUrl.replace(/\/api\/?$/, '');
        this.mahjongSocket?.disconnect();
        this.mahjongSocket = socketIo(`${serverUrl}/mahjong`, {
            auth: { token },
            transports: ['websocket'],
        });
        this.mahjongSocket.on('connect', () => {
            console.log('[Mahjong] WebSocket connected');
            this.mahjongSocket?.emit(
                'mahjong:watch',
                { gameId: this.mahjongGameId },
                (response: unknown) => console.log('[Mahjong] watch response:', response),
            );
        });
        this.mahjongSocket.on('mahjong:state', (snapshot: MahjongSnapshot) => {
            console.log('[Mahjong] pushed snapshot:', snapshot);
            void this.processMahjongSnapshot(snapshot);
        });
        this.mahjongSocket.on('connect_error', (error) => {
            console.error('[Mahjong] WebSocket connection failed:', error);
        });
    }

    onDestroy(): void {
        this.mahjongSocket?.disconnect();
        this.mahjongSocket = null;
    }

    private async discardMahjongTile(): Promise<void> {
        console.log('[Mahjong] discard button clicked', {
            gameId: this.mahjongGameId,
            selectedCard: this.mahjongSelected?.name ?? null,
        });
        if (this.flowState !== MahjongFlowState.WAITING_DISCARD || !this.mahjongGameId || !this.mahjongSelected) {
            console.warn('[Mahjong] discard ignored: game or selected card is missing');
            this.queueMahjongToast('请先选择一张手牌');
            this.setCurrentPlayerText('请先选择一张手牌');
            return;
        }

        const tile = Number(this.mahjongSelected.name.replace('tile_', ''));
        console.log('[Mahjong] discard request prepared', {
            tile,
            tileName: this.tileName(tile),
            resourceId: this.tileResourceId(tile),
        });
        try {
            const result = await this.mahjongRequest<{ snapshot: MahjongSnapshot }>(
                'POST',
                `mahjong/single/${this.mahjongGameId}/command`,
                {
                    action: 'DISCARD',
                    tile,
                    clientSeq: ++this.mahjongClientSeq,
                    requestId: `${Date.now()}-${tile}`,
                },
            );
            console.log('[Mahjong] discard response:', result);
            await this.processMahjongSnapshot(result.snapshot);
        } catch (error) {
            console.error('[Mahjong] discard failed', error);
            const message = error instanceof Error && error.message === '登录已过期，请重新登录'
                ? error.message
                : '当前不能出这张牌';
            this.queueMahjongToast(message);
            this.setCurrentPlayerText(message);
        }
    }

    private async renderMahjongSnapshot(snapshot: MahjongSnapshot, revealHand = false): Promise<void> {
        const player = snapshot.players?.find((item) => item.seat === 0);
        const template = this.cardTemplate;
        if (!player || !template) return;

        const handNode = template.parent;
        if (!handNode) return;

        const handKey = player.hand.join(',');
        const snapshotLogKey = `${snapshot.phase}:${snapshot.currentSeat}:${snapshot.actionSeq}:${snapshot.wallRemaining}:${handKey}`;
        if (snapshotLogKey !== this.lastSnapshotLogKey) {
            this.lastSnapshotLogKey = snapshotLogKey;
            this.logSnapshot('render snapshot', snapshot);
        }
        if (revealHand || handKey !== this.renderedHandKey) {
            handNode.children.slice(1).forEach((child) => child.destroy());
            template.active = false;
            this.mahjongSelected = null;
            this.renderedHandKey = handKey;

            console.log('[Mahjong] rendering player hand:', player.hand.map((tile) => ({
                tile,
                name: this.tileName(tile),
                resourceId: this.tileResourceId(tile),
            })));

            for (const [index, tile] of player.hand.entries()) {
                const card = instantiate(template);
                card.name = `tile_${tile}`;
                card.active = true;
                card.setPosition(index * 54, 0, 0);
                const label = card.getComponent(Label) ?? card.getComponentInChildren(Label);
                if (label) label.string = this.tileName(tile);
                const sprite = card.getComponent(Sprite) ?? card.getComponentInChildren(Sprite);
                if (sprite) {
                    const resourcePath = `card://self_card/green_self_card_${this.tileResourceId(tile)}/spriteFrame`;
                    console.log('[Mahjong] loading tile sprite:', {
                        tile,
                        tileName: this.tileName(tile),
                        resourcePath,
                    });
                    try {
                        sprite.spriteFrame = await Manager.bundleManager.load<SpriteFrame>(resourcePath, SpriteFrame);
                        console.log('[Mahjong] tile sprite loaded:', {
                            tile,
                            spriteFrame: sprite.spriteFrame?.name,
                        });
                    } catch (error) {
                        console.error('[Mahjong] failed to load tile sprite:', { tile, resourcePath, error });
                    }
                }
                card.on(Node.EventType.TOUCH_END, () => this.selectMahjongTile(card), this);
                card.parent = handNode;
                if (revealHand) await this.delay(160);
            }
        }

        const currentPlayer = this.findNode('center/selectZhuangBg/currentPlayer');
        if (currentPlayer) currentPlayer.active = false;
        this.updateOpponentOperation(snapshot);
        this.updateInteractionButtons(snapshot);
    }

    private processMahjongSnapshot(snapshot: MahjongSnapshot, revealHand = false): Promise<void> {
        this.snapshotStateQueue = this.snapshotStateQueue
            .then(async () => {
                const actionSeq = snapshot.actionSeq ?? 0;
                if (!revealHand && actionSeq <= this.lastAppliedActionSeq) return;
                this.lastAppliedActionSeq = Math.max(this.lastAppliedActionSeq, actionSeq);
                await this.renderMahjongSnapshot(snapshot, revealHand);
                await this.announceAction(snapshot);
                await this.advanceFlow(snapshot);
            })
            .catch((error) => console.error('[Mahjong] snapshot processing failed:', error));
        return this.snapshotStateQueue;
    }

    private async advanceFlow(snapshot: MahjongSnapshot): Promise<void> {
        if (snapshot.phase === 'ENDED') {
            this.flowState = MahjongFlowState.ENDED;
            this.clearOperationChoices();
            await this.finishMahjongGame(snapshot);
            return;
        }

        if (snapshot.phase === 'WAITING_RESPONSE') {
            this.flowState = MahjongFlowState.WAITING_RESPONSE;
            this.updateInteractionButtons(snapshot);
            return;
        }

        if (snapshot.phase !== 'WAITING_DISCARD') return;
        this.clearOperationChoices();
        this.operationActions = [];
        this.flowState = MahjongFlowState.ANNOUNCING_TURN;
        await this.announceTurn(snapshot);
        if (snapshot.currentSeat === 0) {
            this.flowState = MahjongFlowState.WAITING_DISCARD;
            this.updateInteractionButtons(snapshot);
            return;
        }
        this.flowState = MahjongFlowState.WAITING_ROBOT;
        this.updateInteractionButtons(snapshot);
    }

    private selectMahjongTile(card: Node): void {
        if (this.flowState !== MahjongFlowState.WAITING_DISCARD) return;
        const tile = Number(card.name.replace('tile_', ''));
        console.log('[Mahjong] tile selected:', {
            node: card.name,
            tile,
            tileName: this.tileName(tile),
            resourceId: this.tileResourceId(tile),
        });
        if (this.mahjongSelected && this.mahjongSelected !== card) {
            this.mahjongSelected.setPosition(this.mahjongSelected.position.x, 0, 0);
        }
        this.mahjongSelected = card;
        card.setPosition(card.position.x, 50, 0);
    }

    private updateOpponentOperation(snapshot: MahjongSnapshot): void {
        const operationLogKey = `${snapshot.phase}:${snapshot.currentSeat}:${snapshot.actionSeq}:${snapshot.wallRemaining}`;
        if (operationLogKey !== this.lastOperationLogKey) {
            this.lastOperationLogKey = operationLogKey;
            console.log('[Mahjong] operation state:', {
                phase: snapshot.phase,
                currentSeat: snapshot.currentSeat,
                currentPlayer: this.seatName(snapshot.currentSeat),
                dealerSeat: snapshot.dealerSeat,
                wallRemaining: snapshot.wallRemaining,
            });
        }
        for (const seat of [0, 1, 2, 3]) {
            const side = seat === 0 ? 'my' : seat === 1 ? 'left' : seat === 2 ? 'top' : 'right';
            const operationNode = this.findNode(`card_node/node_${side}/opCard`);
            const operationLabel = operationNode?.getComponent(Label) ?? operationNode?.getComponentInChildren(Label);
            if (operationLabel) {
                operationLabel.string = '';
                const player = snapshot.players?.find((item) => item.seat === seat);
                operationLabel.string = player?.melds?.map((meld) => {
                    const name = meld.type === 'CHI' ? '吃' : meld.type === 'PENG' ? '碰' : '杠';
                    return `${name}${this.tileName(meld.tiles[0])}`;
                }).join('，') ?? '';
            }
        }
    }

    private updateInteractionButtons(snapshot: MahjongSnapshot): void {
        const discardButton = this.findNode('btn_push');
        const operationButton = this.findNode('btn_op');
        const canDiscard = snapshot.phase === 'WAITING_DISCARD' && snapshot.currentSeat === 0 &&
            this.flowState === MahjongFlowState.WAITING_DISCARD;
        if (discardButton) discardButton.active = canDiscard;

        this.operationActions = snapshot.phase === 'WAITING_RESPONSE'
            ? (snapshot.operationWindow?.eligible ?? []).filter((action) => action !== 'PASS')
            : [];
        if (!operationButton) return;
        operationButton.active = this.operationActions.length > 0;
        const label = operationButton.getComponentInChildren(Label);
        if (label) {
            const names: Record<string, string> = { CHI: '吃', PENG: '碰', MING_GANG: '杠', HU: '胡' };
            label.string = this.operationActions.map((action) => names[action] ?? action).join('/');
        }
    }

    private handleOperationButton(): void {
        if (this.operationActions.length === 1) {
            void this.submitMahjongAction(this.operationActions[0]);
            return;
        }
        const snapshotActions = this.operationActions;
        if (snapshotActions.length > 1) {
            const snapshot: MahjongSnapshot = {
                phase: 'WAITING_RESPONSE',
                operationWindow: { sourceSeat: 0, tile: 0, eligible: [...snapshotActions, 'PASS'] },
            };
            this.renderOperationChoices(snapshot);
        }
    }

    private renderOperationChoices(snapshot: MahjongSnapshot): void {
        this.clearOperationChoices();
        const actions = snapshot.operationWindow?.eligible ?? [];
        if (!actions.length) return;
        const canvas = director.getScene()?.getChildByName('Canvas');
        if (!canvas) return;

        const container = new Node('MahjongOperationChoices');
        container.parent = canvas;
        container.setPosition(0, -260, 0);
        this.operationChoiceNode = container;

        const labels: Record<string, string> = {
            HU: '胡',
            MING_GANG: '杠',
            PENG: '碰',
            CHI: '吃',
            PASS: '放弃',
        };
        actions.forEach((action, index) => {
            const buttonNode = new Node(`MahjongOperation_${action}`);
            buttonNode.parent = container;
            buttonNode.setPosition((index - (actions.length - 1) / 2) * 150, 0, 0);
            const transform = buttonNode.addComponent(UITransform);
            transform.setContentSize(120, 64);
            const button = buttonNode.addComponent(Button);
            const label = buttonNode.addComponent(Label);
            label.string = labels[action] ?? action;
            label.fontSize = 30;
            button.node.on(Button.EventType.CLICK, () => {
                void this.submitMahjongAction(action);
            }, this);
        });
    }

    private clearOperationChoices(): void {
        if (this.operationChoiceNode && this.operationChoiceNode.isValid) {
            this.operationChoiceNode.destroy();
        }
        this.operationChoiceNode = null;
    }

    private async submitMahjongAction(action: string): Promise<void> {
        if (!this.mahjongGameId || this.flowState !== MahjongFlowState.WAITING_RESPONSE) return;
        this.clearOperationChoices();
        try {
            const result = await this.mahjongRequest<{ snapshot: MahjongSnapshot }>(
                'POST',
                `mahjong/single/${this.mahjongGameId}/command`,
                {
                    action,
                    clientSeq: ++this.mahjongClientSeq,
                    requestId: `${Date.now()}-${action}`,
                },
            );
            await this.processMahjongSnapshot(result.snapshot);
        } catch (error) {
            console.error('[Mahjong] response action failed', { action, error });
            await this.showToast('当前不能执行该操作');
        }
    }

    private async announceAction(snapshot: MahjongSnapshot): Promise<void> {
        const action = snapshot.lastAction;
        if (!action?.actionSeq || action.actionSeq <= this.lastAnnouncedActionSeq) return;
        this.lastAnnouncedActionSeq = action.actionSeq;
        const actor = action.actorSeat ?? 0;
        const tile = action.tile ?? action.tiles?.[0];
        let message = '';
        if (action.type === 'DISCARD' && tile !== undefined) message = `${this.sideName(actor)}出牌${this.tileName(tile)}`;
        if (action.type === 'CHI' && tile !== undefined) message = `${this.sideName(actor)}吃${this.tileName(tile)}`;
        if (action.type === 'PENG' && tile !== undefined) message = `${this.sideName(actor)}碰${this.tileName(tile)}`;
        if (['MING_GANG', 'AN_GANG', 'BU_GANG'].includes(action.type ?? '') && tile !== undefined) {
            message = `${this.sideName(actor)}杠${this.tileName(tile)}`;
        }
        if (action.type === 'HU') message = `${this.seatName(snapshot.winnerSeat ?? actor)}边胡了`;
        if (action.event === 'liuju') message = '黄庄';
        if (message) {
            await this.showToast(message);
            this.updateOpponentOperation(snapshot);
        }
    }

    private async announceTurn(snapshot: MahjongSnapshot): Promise<void> {
        if (snapshot.phase === 'ENDED' || snapshot.currentSeat === undefined) return;
        if (snapshot.currentSeat === this.lastTurnSeat) return;
        this.lastTurnSeat = snapshot.currentSeat;
        const actor = this.sideName(snapshot.currentSeat);
        const message = `轮到${actor}出牌`;
        this.setCurrentPlayerText(`当前：${message}`);
        await this.showToast(message);
    }

    private clearOperationLabels(): void {
        for (const side of ['my', 'left', 'top', 'right']) {
            const label = this.findNode(`card_node/node_${side}/opCard`)?.getComponentInChildren(Label);
            if (label) label.string = '';
        }
    }

    private async finishMahjongGame(snapshot: MahjongSnapshot): Promise<void> {
        if (this.gameEnded) return;
        this.gameEnded = true;
        await this.delay(3000);
        await this.showToast('游戏结束');
        const currentPlayer = this.findNode('center/selectZhuangBg/currentPlayer');
        if (currentPlayer) currentPlayer.active = false;
    }

    private setCurrentPlayerText(text: string): void {
        const currentPlayer = this.findNode('center/selectZhuangBg/currentPlayer');
        if (!currentPlayer) return;
        const currentSeat = this.lastTurnSeat ?? 0;
        currentPlayer.angle = [90, 0, 270, 180][currentSeat] ?? 0;
        currentPlayer.active = true;
        console.log('[Mahjong] currentPlayer indicator:', { text, seat: currentSeat, angle: currentPlayer.angle });
    }

    private tileName(tile: number): string {
        const suit = ['万', '筒', '条'][Math.floor(tile / 9)] ?? '';
        return `${(tile % 9) + 1}${suit}`;
    }

    private tileResourceId(tile: number): number {
        const suit = Math.floor(tile / 9);
        const value = (tile % 9) + 1;
        return suit === 0 ? value : suit * 10 + value;
    }

    private seatName(seat?: number): string {
        return ['南', '西', '北', '东'][seat ?? 0] ?? `座位${seat}`;
    }

    private sideName(seat: number): string {
        return `${this.seatName(seat)}边`;
    }

    private logSnapshot(stage: string, snapshot: MahjongSnapshot | null): void {
        console.log(`[Mahjong] ${stage}:`, snapshot ? {
            phase: snapshot.phase,
            currentSeat: snapshot.currentSeat,
            dealerSeat: snapshot.dealerSeat,
            wallRemaining: snapshot.wallRemaining,
            hands: snapshot.players?.map((player) => ({ seat: player.seat, hand: player.hand })),
        } : null);
    }

    private async waitAndToast(milliseconds: number, message: string): Promise<void> {
        await this.delay(milliseconds);
        await this.showToast(message);
    }

    private async showToast(message: string): Promise<void> {
        const task = this.toastQueue.then(async () => {
            console.log('[Mahjong] toast:', message);
            try {
                await Toast.showToast(message);
            } catch (error) {
                console.error('[Mahjong] toast display failed:', { message, error });
            }
            await this.delay(1600);
        });
        this.toastQueue = task.catch(() => undefined);
        await task;
    }

    private queueMahjongToast(message: string): void {
        void this.showToast(message);
    }

    private delay(milliseconds: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    }

    private async mahjongRequest<T>(
        method: string,
        requestPath: string,
        body?: unknown,
        retryOnUnauthorized = true,
    ): Promise<T> {
        const token = sys.localStorage.getItem('access_token') ?? '';
        console.log('[Mahjong] HTTP request:', { method, requestPath, body });
        const response = await fetch(`${G_serverUrl}${requestPath}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (response.status === 401 && retryOnUnauthorized) {
            await this.refreshMahjongAccessToken();
            return this.mahjongRequest<T>(method, requestPath, body, false);
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const payload = (await response.json()) as { success?: boolean; message?: string; data?: T };
        console.log('[Mahjong] HTTP response:', { requestPath, status: response.status, payload });
        if (payload?.success === false) throw new Error(payload.message || '麻将请求失败');
        return (payload?.data ?? payload) as T;
    }

    private async refreshMahjongAccessToken(): Promise<string> {
        if (this.mahjongRefreshPromise) return this.mahjongRefreshPromise;

        this.mahjongRefreshPromise = (async () => {
            const refreshToken = sys.localStorage.getItem('refresh_token') ?? '';
            if (!refreshToken) throw new Error('登录已过期，请重新登录');

            const response = await fetch(`${G_serverUrl}auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });
            if (!response.ok) throw new Error('登录已过期，请重新登录');

            const payload = (await response.json()) as {
                data?: { accessToken?: string; refreshToken?: string };
            };
            const accessToken = payload.data?.accessToken;
            const rotatedRefreshToken = payload.data?.refreshToken;
            if (!accessToken || !rotatedRefreshToken) throw new Error('登录已过期，请重新登录');

            sys.localStorage.setItem('access_token', accessToken);
            sys.localStorage.setItem('refresh_token', rotatedRefreshToken);
            console.log('[Mahjong] access token refreshed');
            return accessToken;
        })();

        try {
            return await this.mahjongRefreshPromise;
        } finally {
            this.mahjongRefreshPromise = null;
        }
    }

    private async goHome(): Promise<void> {
        console.log('[Mahjong] back button clicked');
        try {
            const homeBundle = await Manager.bundleManager.loadBundle('home');
            homeBundle.loadScene('home', (error) => {
                if (error) {
                    console.error('[Mahjong] failed to load home scene', error);
                    return;
                }
                director.loadScene('home');
            });
        } catch (error) {
            console.error('[Mahjong] failed to load home bundle', error);
        }
    }
}
