import { _decorator, Component, Node, Label } from 'cc';
const { ccclass, property } = _decorator;
import datamanage from './datamanage';
import { GameControl } from './GameControl';
import { skillDefine } from './skillDefine';

@ccclass('StatusControl')
export class StatusControl extends Component {

    @property(GameControl)
    gameControl: GameControl = null;

    @property(Label)
    goldText: Label = null;

    @property(Label)
    stageText: Label = null;

    @property(Node)
    prevLvBtn: Node = null;

    @property(Node)
    nextLvBtn: Node = null;

    @property(Node)
    gameplay: Node = null;

    @property(Label)
    twistText: Label = null;

    @property(Label)
    beforeLeapText: Label = null;

    @property(Label)
    hintText: Label = null;

    @property(Label)
    findSameElementText: Label = null;

    private userGold: number = 0;
    private userStage = {
        currentStage: 0,
        topStage: 0,
    }
    private userSkill = {
        twistBonus: 0,
        leapBefore: 0,
        hint: 0,
        findSameElement: 0,
    }

    test() {
        this.userGold = 999999;
        this.userStage = {
            currentStage: 1,
            topStage: 1,
        }
        this.userSkill = {
            twistBonus: 0,
            leapBefore: 0,
            hint: 0,
            findSameElement: 0,
        }
        this.saveGold();
        this.saveSkill();
        this.saveStage();
        this.renderGold();
        this.renderStage();
        this.renderSkill();
    }

    upgradeSkill(event: any, skill: string) {
        if (skillDefine[skill][this.userSkill[skill]].nextLevCost !== false && this.userGold >= skillDefine[skill][this.userSkill[skill]].nextLevCost) {
            this.userGold -= skillDefine[skill][this.userSkill[skill]].nextLevCost;
            this.userSkill[skill]++;
            this.saveGold();
            this.saveSkill();
            this.renderGold();
            this.renderSkill();
        }
    }

    saveGold() {
        datamanage.setGold(this.userGold);
    }
    saveStage() {
        datamanage.setStage(this.userStage);
    }
    saveSkill() {
        datamanage.setSkill(this.userSkill);
    }
    start() {
        this.userGold = datamanage.getGold();
        this.userStage = datamanage.getStage();
        this.userSkill = datamanage.getSkill();
        this.renderGold();
        this.renderStage();
        this.renderSkill();
        this.gameplay.active = false;
    }

    startGame() {
        this.gameControl.startGame({
            stage: this.userStage.currentStage,
            skill: this.userSkill,
        });
        this.node.active = false;
        this.gameplay.active = true;
    }

    addGold(gold: number) {
        this.renderGold(`${this.userGold}+${gold}`);
        this.userGold += gold;
        this.saveGold();
        setTimeout(() => {
            this.renderGold();
        }, 2000);
    }
    gameOver(isWin: boolean) {
        if (isWin) {
            if (this.userStage.currentStage === this.userStage.topStage) {
                this.userStage.topStage++;
                this.userStage.currentStage++;
            }
            this.saveStage();
            this.renderStage();
        }
        this.node.active = true;
        this.gameplay.active = false;
    }

    renderGold(string?: string) {
        this.goldText.string = string || this.userGold.toString();
    }

    renderStage() {
        this.stageText.string = `开始第${this.userStage.currentStage}关`
        this.prevLvBtn.active = this.userStage.currentStage > 1;
        this.nextLvBtn.active = this.userStage.currentStage < this.userStage.topStage;
    }

    prevLv() {
        this.userStage.currentStage--;
        this.saveStage();
        this.renderStage();
    }

    nextLv() {
        this.userStage.currentStage++;
        this.saveStage();
        this.renderStage();
    }

    renderSkill() {
        this.twistText.string = skillDefine.twistBonus[this.userSkill.twistBonus].desc + (skillDefine.twistBonus[this.userSkill.twistBonus].nextLevCost !== false ? '\n\n点击升级(需要金币: ' + skillDefine.twistBonus[this.userSkill.twistBonus].nextLevCost + ')' : '\n\n已经达到最高等级');
        this.beforeLeapText.string = skillDefine.leapBefore[this.userSkill.leapBefore].desc + (skillDefine.leapBefore[this.userSkill.leapBefore].nextLevCost !== false ? '\n\n点击升级(需要金币: ' + skillDefine.leapBefore[this.userSkill.leapBefore].nextLevCost + ')' : '\n\n已经达到最高等级');
        this.hintText.string = skillDefine.hint[this.userSkill.hint].desc + (skillDefine.hint[this.userSkill.hint].nextLevCost !== false ? '\n\n点击升级(需要金币: ' + skillDefine.hint[this.userSkill.hint].nextLevCost + ')' : '\n\n已经达到最高等级');
        this.findSameElementText.string = skillDefine.findSameElement[this.userSkill.findSameElement].desc + (skillDefine.findSameElement[this.userSkill.findSameElement].nextLevCost !== false ? '\n\n点击升级(需要金币: ' + skillDefine.findSameElement[this.userSkill.findSameElement].nextLevCost + ')' : '\n\n已经达到最高等级');
    }

    update(deltaTime: number) {

    }
}

