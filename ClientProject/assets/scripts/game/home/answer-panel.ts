import { _decorator } from "cc";
import { SuperPanel } from "../../frame/center/components/super-panel";
import { Node } from "cc";
import { Label } from "cc";
import ScrollReuse from "../../frame/center/components/scroll-endless";

const { ccclass, property } = _decorator

@ccclass('AnswerPanel')
export class AnswerPanel extends SuperPanel {
    @property({
        type: Label
    })
    labAnswer: Label = null;

    @property({
        type: Node
    })
    answerNode: Node = null;

    @property({
        type: Node
    })
    scrollView: Node = null;

    protected onLoad(): void {
        super.onLoad();


        this.scrollView.getComponent(ScrollReuse).initView([], 4);

    }

    start(): void {
        super.start();

    }






}