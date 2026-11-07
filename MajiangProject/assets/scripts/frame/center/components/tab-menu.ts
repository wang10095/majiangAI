import { _decorator, CCInteger, CCString, Component, instantiate, isValid, Node } from 'cc';
import { Label } from 'cc';
import { SuperComponent } from './super-component';
import { ClickDelegate } from '../../../game/common/click-delegate';
import { RedDot } from '../../../game/common/red-dot';
const { ccclass, property } = _decorator;


@ccclass('TabMenu')
export class TabMenu extends SuperComponent {
    @property({
        type: [CCString],
        tooltip: 'menu名字'
    })
    private menuNames: string[] = [];

    @property({
        type: [Node],
        tooltip: '菜单对应node'
    })
    private menuContents: Node[] = [];

    @property({
        type: CCInteger,
        tooltip: '默认选中tab'
    })
    private defaultIndex = 0;

    private menus: string[];
    private selectedFunc: (idx: number) => void;
    private currentSelectedIndex = -1;

    protected onLoad(): void {
        if (this.menuNames && this.menuNames.length > 0) {
            this.refresh(this.menuNames, this.selectedFunc || null, this.defaultIndex);
        }
    }

    refresh(menuNames: string[], callFunc: (idx: number) => void = null, defaultSelectedIdx = 0) {
        this.menuNames = menuNames || this.menuNames;
        this.selectedFunc = callFunc;
        // this.selectedListener((name: string) => {
        //     this.selectMenu(name);
        // });
        this.initMenu(this.menuNames, defaultSelectedIdx);
    }

    onTabMenu(tabIdx: number, callFunc: (idx: number) => void = null) {
        if (callFunc) {
            this.selectedFunc = callFunc;
            // this.selectedListener((name: string) => {
            //     this.selectMenu(name);
            // });
        }
        this.currentSelectedIndex = -1;
        console.log('onTabMenu selected');
        this.selectMenu(this.menus[tabIdx]);
    }

    private initMenu(menuNames: string[], defaultSelectedIdx = 0) {
        this.currentSelectedIndex = -1;
        this.menus = menuNames;
        this.node.children.forEach(child => {
            child.active = false;
        });
        menuNames.forEach((name, idx) => {
            let menuItemNode = this.node.children[idx];
            if (!menuItemNode) {
                menuItemNode = instantiate(this.node.children[0]);
                menuItemNode.parent = this.node;
            }
            menuItemNode.name = name;
            menuItemNode.active = true;
            // safeLanguage(menuItemNode.getChildByName('on').getChildByName('name'), `Tab.${name}`);
            // safeLanguage(menuItemNode.getChildByName('off').getChildByName('name'), `Tab.${name}`);
            const menuClick = menuItemNode.getComponent(ClickDelegate) || menuItemNode.addComponent(ClickDelegate);
            menuClick.init(
                this,
                () => {
                    this.selectMenu(name);
                },
                name
            );
            const redDotNode = menuItemNode.getChildByName('RedDot');
            if (redDotNode) {
                redDotNode.getComponent(RedDot).refresh(name);
            }
        });
        this.selectMenu(menuNames[defaultSelectedIdx]);
    }

    private selectMenu(name: string) {
        const menuIdx = this.menus.indexOf(name);
        if (menuIdx === -1) {
            console.warn('button group menu error:', name);
            return;
        }
        if (this.currentSelectedIndex === menuIdx) {
            console.warn('tabmenu current selected:', name, menuIdx);
            return;
        }
        if (this.selectedFunc) {
            // 你注册，你负责
            this.selectedFunc(menuIdx);
            // this.switchToContent(menuIdx);
        } else {
            const selectedContentNode = this.switchToContent(menuIdx);
            if (selectedContentNode.getComponent(SuperComponent)) {
                selectedContentNode.getComponent(SuperComponent).setData(menuIdx);
            }
        }
    }

    // 确认切换到指定内容
    public switchToContent(menuIdx: number) {
        this.currentSelectedIndex = menuIdx;
        this.menuContents.forEach(child => {
            child.active = false;
        });
        let selectedContentNode = this.menuContents[menuIdx];
        if (!selectedContentNode) {
            selectedContentNode = this.menuContents[0];
        }
        selectedContentNode.active = true;

        this.selectMenuTab(menuIdx);
        return selectedContentNode;
    }

    // 点中哪个button
    private selectMenuTab(menuIdx: number): void {
        this.node.children.forEach((node: Node, idx: number) => {
            if (!isValid(node)) {
                console.warn('ButtonGroup的子节点必须添加IButton组件');
                return;
            }
            if (!node.active) {
                return;
            }
            node.getChildByName('on').active = false;
            node.getChildByName('off').active = false;
            if (idx === menuIdx) {
                // this._selectedListener && this._selectedListener(name);
                node.getChildByName('on').active = true;
            } else {
                node.getChildByName('off').active = true;
            }
        });
    }

    public getContents() {
        return this.menuContents;
    }

    public setTabNewName(idx: number, name: string) {
        const node = this.node.children[idx];
        if (node) {
            node.getChildByPath('on/name').getComponent(Label).string = name;
            node.getChildByPath('off/name').getComponent(Label).string = name;
        }
    }
}
