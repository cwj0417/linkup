import { _decorator, Component, Node, Label, resources, SpriteFrame, Texture2D, Sprite } from 'cc';
const { ccclass, property } = _decorator;
import datamanage from './datamanage';
import { GameControl } from './GameControl';
import { skillDefine } from './skillDefine';

export const formatGold = (gold: number | string) => {
    gold = +gold;
    const digit = Math.floor(Math.log10(gold)) + 1
    if (digit < 5) return gold.toString();
    if (digit < 8) return Math.floor((gold / (10 ** 3))) + 'K';
    if (digit < 11) return Math.floor((gold / (10 ** 6))) + 'M';
    if (digit < 14) return Math.floor((gold / (10 ** 9))) + 'G';
    return Math.floor((gold / (10 ** 12))) + 'T';
}

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
    twistBtn: Label = null;

    @property(Label)
    beforeLeapText: Label = null;

    @property(Label)
    beforeLeapBtn: Label = null;

    @property(Label)
    hintText: Label = null;

    @property(Label)
    hintBtn: Label = null;

    @property(Label)
    findSameElementText: Label = null;

    @property(Label)
    findSameElementBtn: Label = null;

    @property(Node)
    bg: Node = null;

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
        resources.load('game_bg', (err, spriteFrame) => {
            const sf = new SpriteFrame()
            const txt = new Texture2D()
            // @ts-ignore
            txt.image = spriteFrame
            sf.texture = txt
            this.bg.getComponent(Sprite).spriteFrame = sf
        });
    }

    addGold(gold: number) {
        this.renderGold(`${formatGold(this.userGold)}+${gold}`);
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
        resources.load('bg', (err, spriteFrame) => {
            const sf = new SpriteFrame()
            const txt = new Texture2D()
            // @ts-ignore
            txt.image = spriteFrame
            sf.texture = txt
            this.bg.getComponent(Sprite).spriteFrame = sf
        });
    }

    renderGold(string?: string) {
        this.goldText.string = string || formatGold(this.userGold);
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
        this.twistText.string = skillDefine.twistBonus[this.userSkill.twistBonus].desc;
        this.twistBtn.string = (skillDefine.twistBonus[this.userSkill.twistBonus].nextLevCost !== false ? '升级:金币' + formatGold(skillDefine.twistBonus[this.userSkill.twistBonus].nextLevCost as number) : '已经达到最高');

        this.beforeLeapText.string = skillDefine.leapBefore[this.userSkill.leapBefore].desc;
        this.beforeLeapBtn.string = (skillDefine.leapBefore[this.userSkill.leapBefore].nextLevCost !== false ? '升级:金币' + formatGold(skillDefine.leapBefore[this.userSkill.leapBefore].nextLevCost as number) : '已经达到最高');

        this.hintText.string = skillDefine.hint[this.userSkill.hint].desc;
        this.hintBtn.string = (skillDefine.hint[this.userSkill.hint].nextLevCost !== false ? '升级:金币' + formatGold(skillDefine.hint[this.userSkill.hint].nextLevCost as number) : '已经达到最高');

        this.findSameElementText.string = skillDefine.findSameElement[this.userSkill.findSameElement].desc;
        this.findSameElementBtn.string = (skillDefine.findSameElement[this.userSkill.findSameElement].nextLevCost !== false ? '升级:金币' + formatGold(skillDefine.findSameElement[this.userSkill.findSameElement].nextLevCost as number) : '已经达到最高');
    }

    update(deltaTime: number) {

    }
}

