import { _decorator, Component, Node, Prefab, instantiate, Label, Vec3, resources, Sprite, SpriteFrame, Texture2D, Animation, macro } from 'cc';
const { ccclass, property } = _decorator;
import { skillDefine, SkillType } from './skillDefine';
import { stageDefine } from './stageDefine';
import { StatusControl } from './StatusControl';

type cord = { x: number, y: number }

enum pipeTypes {
    horizon = 1,
    vertical = 2,
    leftUp = 3,
    upRight = 4,
    rightDown = 5,
    downLeft = 6
}

/** pipeItems animation type define:

1. horizon
2. vertical
3. left-up
4. up-right
5. right-down
6. down-left

**/

const SCREEN_WIDTH = 430

const SCREEN_HEIGHT = 930

const TOP_MARGIN = 120


// this method should keep static block not single to keep all block can be matched

@ccclass('GameControl')
export class GameControl extends Component {

    @property(StatusControl)
    statusControl: StatusControl = null

    @property(Label)
    hintLabel: Label = null;
    @property(Label)
    findSameLabel: Label = null;

    @property(Prefab)
    blockPrefab: Prefab = null;

    @property(Prefab)
    emptyBlockPrefab: Prefab = null;

    @property(Label)
    timeRemainingLabel: Label = null;

    private currentStage = null;
    private currentSkill = null;

    private timeRemaining = null
    private coundDownHandler = null
    private isPausing = false

    private grids = []
    private matchingBlock = null

    private elements = {}

    private pipeItems = []

    jumpToSticky() {
        // @ts-ignore
        wx.openChannelsUserProfile({
            finderUserName: 'sphMb29U7R4wCHH'
        })
    }

    isEmptyBlock(j: number, i: number) {
        return j === 0 || j === this.currentStage.GRID_Y - 1 || i === 0 || i === this.currentStage.GRID_X - 1
    }

    gameOver(isWin: boolean) {
        // @ts-ignore from btn "give up" click
        if (isWin.bubbles) isWin = false
        clearInterval(this.coundDownHandler)
        this.node.destroyAllChildren()
        this.statusControl.gameOver(isWin)
    }

    resetGame() {
        this.resetGrids()
        this.renderBlocks()
        this.coundDownHandler = setInterval(() => {
            this.timeRemainingLabel.string = this.timeRemaining.toString()
            if (!this.isPausing) {
                this.timeRemaining = +this.timeRemaining - 1
                if (this.timeRemaining === 0) {
                    this.gameOver(false)
                }
            }
        }, 1000)
    }

    start() {
        // this.resetGame()
    }

    renderHint() {
        this.hintLabel.string = `提示(剩余${this.currentSkill.hint.effect})`
    }

    renderFindElement() {
        this.findSameLabel.string = `查找相同元素(剩余${this.currentSkill.findSameElement.extraEffect ? '无限' : this.currentSkill.findSameElement.effect})`
    }

    startGame(param: { stage: number, skill: { [key in SkillType]: number } }) {
        const { stage, skill } = param
        this.currentStage = stageDefine[Math.min(119, Math.floor(stage / 10))]
        this.currentSkill = {}
        for (let skl in skill) {
            const { effect, extraEffect } = skillDefine[skl][skill[skl]]
            this.currentSkill[skl] = { effect, extraEffect }
        }
        this.timeRemaining = this.currentStage.timeLimit
        this.isPausing = this.currentSkill.leapBefore.effect > 0
        this.renderFindElement()
        this.renderHint()
        this.resetGame()
        this.tryShuffle()
    }

    makeResolve(twist: number, score: number, hint = false) {
        if (!hint) {
            if (this.currentSkill.leapBefore.effect > 0) {
                this.currentSkill.leapBefore.effect -= 1
            }
            this.isPausing = this.currentSkill.leapBefore.effect > 0
            if (twist === 3) {
                this.statusControl.addGold(score * this.currentSkill.twistBonus.effect * this.currentStage.goldAquirement)
            } else if (this.currentSkill.twistBonus.extraEffect) {
                this.statusControl.addGold(score * this.currentSkill.twistBonus.effect * this.currentStage.goldAquirement)
            } else {
                this.statusControl.addGold(score * this.currentStage.goldAquirement)
            }
        }
        return true
    }

    cordToString(x: number, y: number) {
        return `${x}-${y}`
    }

    getNodePosition: (x: number, y: number) => [number, number] = (x, y) => {
        return [(SCREEN_WIDTH - (this.currentStage.GRID_X) * this.currentStage.BLOCK_WIDTH) / 2 + this.currentStage.BLOCK_WIDTH * (x + 0.5), (SCREEN_HEIGHT - (this.currentStage.GRID_Y - 0.4) * this.currentStage.BLOCK_WIDTH) - TOP_MARGIN + this.currentStage.BLOCK_WIDTH * (y + 0.5)]
    }

    shuffleGrids() {
        this.elements = {}
        // Flatten the grids into a single array
        let flatGrids = [];
        for (let i = 1; i < this.grids.length - 1; i++) {
            for (let j = 1; j < this.grids[i].length - 1; j++) {
                flatGrids.push(this.grids[i][j]);
            }
        }

        // Shuffle the flat array using Fisher-Yates algorithm
        for (let i = flatGrids.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [flatGrids[i], flatGrids[j]] = [flatGrids[j], flatGrids[i]];
        }

        // Reassign the shuffled values back to the grids
        let index = 0;
        for (let i = 1; i < this.grids.length - 1; i++) {
            for (let j = 1; j < this.grids[i].length - 1; j++) {
                this.grids[i][j] = flatGrids[index++];
                this.logElements(this.grids[i][j].elementType, i, j)
            }
        }
        this.node.removeAllChildren()
        this.renderBlocks()
    }


    hint() {
        if (this.currentSkill.hint.effect <= 0) {
            return
        }
        const matchable = this.findMachable()
        if (matchable) {
            this.grids[matchable[0].y][matchable[0].x].node.setScale(new Vec3(0.8 * this.currentStage.RADIO, 0.8 * this.currentStage.RADIO, 0.8 * this.currentStage.RADIO))
            this.grids[matchable[1].y][matchable[1].x].node.setScale(new Vec3(0.8 * this.currentStage.RADIO, 0.8 * this.currentStage.RADIO, 0.8 * this.currentStage.RADIO))
            if (!this.currentSkill.hint.extraEffect || Math.random() < 0.5) {
                this.currentSkill.hint.effect -= 1
            }
            if (this.currentSkill.leapBefore.extraEffect) {
                this.isPausing = true
            }
            this.renderHint()
        }
    }

    tryShuffle() {
        if (!this.findMachable()) {
            this.shuffleGrids()
            this.tryShuffle()
        }
    }

    findMachable() {
        outerLoop: for (let eli = 0; eli < this.currentStage.ELEMENT_RANGE; eli++) {
            if (this.elements[eli]) {
                let cords = Object.keys(this.elements[eli])
                let compareIndex = 0
                let success = false
                while (!success && compareIndex < cords.length) {
                    for (let i = compareIndex + 1; i < cords.length; i++) {
                        const [y1, x1] = cords[compareIndex].split('-')
                        const [y2, x2] = cords[i].split('-')
                        if (this.judge({ x: +x1, y: +y1 }, { x: +x2, y: +y2 }, true)) {
                            return [{ x: +x1, y: +y1 }, { x: +x2, y: +y2 }]
                            // success = true
                            // break outerLoop
                        }
                    }
                    compareIndex++
                }
            }
        }
        return null
    }

    findAllElement(elementType: number) {
        if (!this.elements[elementType]) return
        for (let cord of Object.keys(this.elements[elementType])) {
            const [x, y] = cord.split('-')
            this.grids[x][y].node.setScale(new Vec3(0.8 * this.currentStage.RADIO, 0.8 * this.currentStage.RADIO, 0.8 * this.currentStage.RADIO))
        }
        setTimeout(() => {
            for (let cord of Object.keys(this.elements[elementType])) {
                const [x, y] = cord.split('-')
                this.grids[x][y].node && this.grids[x][y].node.setScale(new Vec3(this.currentStage.RADIO, this.currentStage.RADIO, this.currentStage.RADIO))
            }
        }, 500)
    }

    logElements(eleType: number, x: number, y: number) {
        this.elements[eleType] = this.elements[eleType] || {}
        this.elements[eleType][this.cordToString(x, y)] = true
    }

    resetGrids() {
        this.node.destroyAllChildren()
        this.grids = []
        this.elements = {}

        let blockNotMatched = {}

        // warning: not checking with "isStaticBlock", if game map is complicated, this method should be optimized.
        const remainingBlocks = (j: number, i: number) => {
            let blocks = []
            for (let t = j; t < this.currentStage.GRID_Y; t++) {
                blocks = t === j ? blocks.concat(this.grids[t].slice(i, this.currentStage.GRID_X)) : blocks.concat(this.grids[t])
            }
            return blocks.filter(i => i.type === 'element').length
        }

        const getElementType = (x: number, y: number) => {
            if (remainingBlocks(x, y) > Object.keys(blockNotMatched).length) {
                const randomElementType = Math.floor(Math.random() * this.currentStage.ELEMENT_RANGE)
                if (blockNotMatched[randomElementType]) {
                    delete blockNotMatched[randomElementType]
                } else {
                    blockNotMatched[randomElementType] = true
                }
                this.logElements(randomElementType, x, y)
                return randomElementType
            } else {
                const type = +Object.keys(blockNotMatched)[0]
                delete blockNotMatched[type]
                this.logElements(type, x, y)
                return type
            }
        }

        for (let j = 0; j < this.currentStage.GRID_Y; j++) {
            this.grids[j] = this.grids[j] || []
            for (let i = 0; i < this.currentStage.GRID_X; i++) {
                if (this.isEmptyBlock(j, i) || (this.currentStage?.isEmptyBlock(j, i))) {
                    this.grids[j][i] = { type: 'empty' }
                } else if (this.currentStage?.isStaticBlock(j, i)) {
                    this.grids[j][i] = { type: 'static' }
                } else {
                    this.grids[j][i] = { type: 'element' }
                }
            }
        }
        // get type after generate map completely for counting remaining block when fill the elements.
        for (let j = 0; j < this.currentStage.GRID_Y; j++) {
            for (let i = 0; i < this.currentStage.GRID_X; i++) {
                if (j === this.currentStage.GRID_Y - 2 && i === this.currentStage.GRID_X - 2 && Object.keys(blockNotMatched).length === 1) {
                    this.grids[j][i].type = 'element'
                }
                if (this.grids[j][i].type === 'element') this.grids[j][i].elementType = getElementType(j, i)
            }
        }
    }

    renderBlocks() {
        for (let i = 0; i < this.currentStage.GRID_Y; i++) {
            for (let j = 0; j < this.currentStage.GRID_X; j++) {
                const grid = this.grids[i][j]
                const block = instantiate(grid.type === 'empty' ? this.emptyBlockPrefab : this.blockPrefab)
                if (grid.type === 'element') {
                    const url = "blocks/" + grid.elementType
                    resources.load(url, (err, spriteFrame) => {
                        const sf = new SpriteFrame()
                        const txt = new Texture2D()
                        // @ts-ignore
                        txt.image = spriteFrame
                        sf.texture = txt
                        block.getComponent(Sprite).spriteFrame = sf
                    });
                }
                this.node.addChild(block)
                block.setPosition(...this.getNodePosition(j, i))
                const emptyRadio = grid.type === 'empty' ? 5 / 6 : 1
                block.setScale(new Vec3(this.currentStage.RADIO * emptyRadio, this.currentStage.RADIO * emptyRadio, this.currentStage.RADIO * emptyRadio))
                grid.type === 'element' && block.on(Node.EventType.TOUCH_END, () => this.blockClick(j, i))
                this.grids[i][j].node = block
            }
        }
    }

    blockClick(x: number, y: number) {
        // console.log({ x, y })
        // console.log(this.grids[y][x])
        this.grids[y][x].node.setScale(new Vec3(0.9 * this.currentStage.RADIO, 0.9 * this.currentStage.RADIO, 0.9 * this.currentStage.RADIO))
        if (!this.matchingBlock) {
            this.matchingBlock = { x, y }
        } else {
            if (x === this.matchingBlock.x && y === this.matchingBlock.y) {
                // for debug: double click to remove this block, comment the code below  unitl "return" on production
                // this.setEmptyBlock(x, y)
                if (!this.currentSkill.findSameElement.extraEffect && this.currentSkill.findSameElement.effect <= 0) {
                    return
                }
                this.findAllElement(this.grids[y][x].elementType)
                this.matchingBlock = null
                if (!this.currentSkill.findSameElement.extraEffect) {
                    this.currentSkill.findSameElement.effect -= 1
                    this.renderFindElement()
                }
                return
            }
            this.match({ x, y }, this.matchingBlock)
        }
    }

    playPipeAnimation() {
        for (let i = 0; i < this.pipeItems.length; i++) {
            const { block, type } = this.pipeItems[i]
            const animation = block.node.getComponent(Animation)
            animation.play(`normal${type}`)
        }
        this.pipeItems = []
    }

    match(a: cord, b: cord) {
        if (this.grids[a.y][a.x].elementType !== this.grids[b.y][b.x].elementType) {
            this.grids[this.matchingBlock.y][this.matchingBlock.x].node.setScale(new Vec3(this.currentStage.RADIO, this.currentStage.RADIO, this.currentStage.RADIO))
            this.grids[a.y][a.x].node.setScale(new Vec3(0.9 * this.currentStage.RADIO, 0.9 * this.currentStage.RADIO, 0.9 * this.currentStage.RADIO))
            this.matchingBlock = a
            return
        }
        if (this.judge(a, b)) {
            const timeout = this.pipeItems.length ? 500 : 0
            this.playPipeAnimation()
            setTimeout(() => {
                this.setEmptyBlock(a.x, a.y)
                this.setEmptyBlock(b.x, b.y)
                if (Object.values(this.elements).filter(i => JSON.stringify(i) !== '{}').length === 0) {
                    this.gameOver(true)
                } else {
                    this.tryShuffle()
                }
            }, timeout)
        } else {
            this.grids[b.y][b.x].node.setScale(new Vec3(this.currentStage.RADIO, this.currentStage.RADIO, this.currentStage.RADIO))
            this.grids[a.y][a.x].node.setScale(new Vec3(this.currentStage.RADIO, this.currentStage.RADIO, this.currentStage.RADIO))
        }

        this.matchingBlock = null
    }

    setEmptyBlock(x: number, y: number) {
        delete this.elements[this.grids[y][x].elementType][this.cordToString(y, x)]
        this.grids[y][x].node.destroy();
        const block = instantiate(this.emptyBlockPrefab)
        this.node.addChild(block)
        block.setPosition(...this.getNodePosition(x, y))
        block.setScale(new Vec3(this.currentStage.RADIO / 6 * 5, this.currentStage.RADIO / 6 * 5, this.currentStage.RADIO / 6 * 5))
        this.grids[y][x] = {
            type: 'empty',
            node: block
        }
    }

    isEmpty(blockArr) {
        return !blockArr.length || blockArr.every(block => block.type === 'empty')
    }

    // this 2 methods will not check input, and should be called carefully.
    // and this 2 methods maybe could be optimized by replace the for loop with Array.from.map ?

    isHorizonEmpty(start: cord, end: cord) {
        return this.isEmpty(this.getHorizonBlocks(start, end))
    }
    isVerticalEmpty(start: cord, end: cord) {
        return this.isEmpty(this.getVerticalBlocks(start, end))
    }
    getHorizonBlocks(start: cord, end: cord) {
        let betweenBlocks = []
        for (let t = start.x; t <= end.x; t++) {
            betweenBlocks.push(this.grids[start.y][t])
        }
        return betweenBlocks
    }
    getVerticalBlocks(start: cord, end: cord) {
        let betweenBlocks = []
        for (let t = start.y; t <= end.y; t++) {
            betweenBlocks.push(this.grids[t][start.x])
        }
        return betweenBlocks
    }

    judge(a: cord, b: cord, hint = false) {

        let minX = Math.min(a.x, b.x)
        let maxX = Math.max(a.x, b.x)
        let minY = Math.min(a.y, b.y)
        let maxY = Math.max(a.y, b.y)

        let minXTarget = a.x === minX ? a : b
        let maxXTarget = a.x === maxX ? a : b
        let minYTarget = a.y === minY ? a : b
        let maxYTarget = a.y === maxY ? a : b

        // case: 一根直连: 横/竖
        if (a.x === b.x) {
            // let betweenBlocks = []
            // let min = Math.min(a.y, b.y)
            // let max = Math.max(a.y, b.y)
            // for (let t = min + 1; t < max; t++) {
            //     betweenBlocks.push(this.grids[t][a.x])
            // }
            // if (this.isEmpty(betweenBlocks)) {
            //     return true
            // }
            if (this.isVerticalEmpty({ x: minX, y: minY + 1 }, { x: minX, y: maxY - 1 })) {
                this.pipeItems = this.getVerticalBlocks({ x: minX, y: minY + 1 }, { x: minX, y: maxY - 1 }).map(block => ({ block, type: pipeTypes.vertical }))
                return this.makeResolve(1, this.pipeItems.length + 2, hint)
            }
        }
        if (a.y === b.y) {
            // let betweenBlocks = []
            // let min = Math.min(a.x, b.x)
            // let max = Math.max(a.x, b.x)
            // for (let t = min + 1; t < max; t++) {
            //     betweenBlocks.push(this.grids[a.y][t])
            // }
            // if (this.isEmpty(betweenBlocks)) return true
            if (this.isHorizonEmpty({ x: minX + 1, y: minY }, { x: maxX - 1, y: minY })) {
                this.pipeItems = this.getHorizonBlocks({ x: minX + 1, y: minY }, { x: maxX - 1, y: minY }).map(block => ({ block, type: pipeTypes.horizon }))
                return this.makeResolve(1, this.pipeItems.length + 2, hint)
            }
        }
        // case: 二折: 左上右下/右上左下

        if ((a.x > b.x && a.y < b.y) || (a.x < b.x && a.y > b.y)) {
            {
                // let betweenBlocks = []
                // for (let t = minX + 1; t < maxX + 1; t++) {
                //     betweenBlocks.push(this.grids[maxY][t])
                // }
                // for (let t = minY + 1; t < maxY; t++) {
                //     betweenBlocks.push(this.grids[t][maxX])
                // }
                // if (this.isEmpty(betweenBlocks)) return true
                if (this.isHorizonEmpty({ x: minX + 1, y: maxY }, { x: maxX, y: maxY }) && this.isVerticalEmpty({ x: maxX, y: minY + 1 }, { x: maxX, y: maxY - 1 })) {
                    this.pipeItems = [
                        ...this.getHorizonBlocks({ x: minX + 1, y: maxY }, { x: maxX - 1, y: maxY }).map(block => ({ block, type: pipeTypes.horizon })),
                        { block: this.grids[maxY][maxX], type: pipeTypes.downLeft },
                        ...this.getVerticalBlocks({ x: maxX, y: minY + 1 }, { x: maxX, y: maxY - 1 }).map(block => ({ block, type: pipeTypes.vertical }))
                    ]
                    return this.makeResolve(2, this.pipeItems.length + 2, hint)
                }
            }
            {
                // let betweenBlocks = []
                // for (let t = minX; t < maxX; t++) {
                //     betweenBlocks.push(this.grids[minY][t])
                // }
                // for (let t = minY + 1; t < maxY; t++) {
                //     betweenBlocks.push(this.grids[t][minX])
                // }
                // if (this.isEmpty(betweenBlocks)) return true
                if (this.isHorizonEmpty({ x: minX, y: minY }, { x: maxX - 1, y: minY }) && this.isVerticalEmpty({ x: minX, y: minY + 1 }, { x: minX, y: maxY - 1 })) {
                    this.pipeItems = [
                        ...this.getHorizonBlocks({ x: minX + 1, y: minY }, { x: maxX - 1, y: minY }).map(block => ({ block, type: pipeTypes.horizon })),
                        { block: this.grids[minY][minX], type: pipeTypes.upRight },
                        ...this.getVerticalBlocks({ x: minX, y: minY + 1 }, { x: minX, y: maxY - 1 }).map(block => ({ block, type: pipeTypes.vertical }))
                    ]
                    return this.makeResolve(2, this.pipeItems.length + 2, hint)
                }
            }
        } else {
            {
                // let betweenBlocks = []
                // for (let t = minX; t < maxX; t++) {
                //     betweenBlocks.push(this.grids[maxY][t])
                // }
                // for (let t = minY + 1; t < maxY; t++) {
                //     betweenBlocks.push(this.grids[t][minX])
                // }
                // if (this.isEmpty(betweenBlocks)) return true
                if (this.isHorizonEmpty({ x: minX, y: maxY }, { x: maxX - 1, y: maxY }) && this.isVerticalEmpty({ x: minX, y: minY + 1 }, { x: minX, y: maxY - 1 })) {
                    this.pipeItems = [
                        ...this.getHorizonBlocks({ x: minX + 1, y: maxY }, { x: maxX - 1, y: maxY }).map(block => ({ block, type: pipeTypes.horizon })),
                        { block: this.grids[maxY][minX], type: pipeTypes.rightDown },
                        ...this.getVerticalBlocks({ x: minX, y: minY + 1 }, { x: minX, y: maxY - 1 }).map(block => ({ block, type: pipeTypes.vertical }))
                    ]
                    return this.makeResolve(2, this.pipeItems.length + 2, hint)
                }
            }
            {
                // let betweenBlocks = []
                // for (let t = minX + 1; t < maxX + 1; t++) {
                //     betweenBlocks.push(this.grids[minY][t])
                // }
                // for (let t = minY + 1; t < maxY; t++) {
                //     betweenBlocks.push(this.grids[t][maxX])
                // }
                // if (this.isEmpty(betweenBlocks)) return true
                if (this.isHorizonEmpty({ x: minX + 1, y: minY }, { x: maxX, y: minY }) && this.isVerticalEmpty({ x: maxX, y: minY + 1 }, { x: maxX, y: maxY - 1 })) {
                    this.pipeItems = [
                        ...this.getHorizonBlocks({ x: minX + 1, y: minY }, { x: maxX - 1, y: minY }).map(block => ({ block, type: pipeTypes.horizon })),
                        { block: this.grids[minY][maxX], type: pipeTypes.leftUp },
                        ...this.getVerticalBlocks({ x: maxX, y: minY + 1 }, { x: maxX, y: maxY - 1 }).map(block => ({ block, type: pipeTypes.vertical }))
                    ]
                    return this.makeResolve(2, this.pipeItems.length + 2, hint)
                }
            }
        }

        // case: 三折

        // up

        if (this.grids[a.y + 1][a.x] && this.isEmpty([this.grids[a.y + 1][a.x]]) && this.grids[b.y + 1][b.x] && this.isEmpty([this.grids[b.y + 1][b.x]])) {
            // let betweenBlocks = []
            // for (let t = minY + 1; t <= maxY; t++) {
            //     betweenBlocks.push(this.grids[t][a.y > b.y ? b.x : a.x])
            // }
            const xCord = a.y > b.y ? b.x : a.x
            if (this.isVerticalEmpty({ x: xCord, y: minY + 1 }, { x: xCord, y: maxY })) {
                let line = Math.max(a.y, b.y)
                while (++line < this.currentStage.GRID_Y && this.isEmpty([this.grids[line][minX], this.grids[line][maxX]])) {
                    // let betweenBlocks = []
                    // for (let t = minX + 1; t < maxX; t++) {
                    //     betweenBlocks.push(this.grids[line][t])
                    // }
                    // if (this.isEmpty(betweenBlocks)) return true
                    if (this.isHorizonEmpty({ x: minX + 1, y: line }, { x: maxX - 1, y: line })) {
                        this.pipeItems = [
                            ...this.getVerticalBlocks({ x: xCord, y: minY + 1 }, { x: xCord, y: line - 1 }).map(block => ({ block, type: pipeTypes.vertical })),
                            ...this.getVerticalBlocks({ x: xCord === a.x ? b.x : a.x, y: maxY + 1 }, { x: xCord === a.x ? b.x : a.x, y: line - 1 }).map(block => ({ block, type: pipeTypes.vertical })),
                            ...this.getHorizonBlocks({ x: minX + 1, y: line }, { x: maxX - 1, y: line }).map(block => ({ block, type: pipeTypes.horizon })),
                            { block: this.grids[line][minX], type: pipeTypes.rightDown },
                            { block: this.grids[line][maxX], type: pipeTypes.downLeft },
                        ]
                        return this.makeResolve(3, this.pipeItems.length + 2, hint)
                    }
                }
            }
        }

        // down

        if (this.grids[a.y - 1][a.x] && this.isEmpty([this.grids[a.y - 1][a.x]]) && this.grids[b.y - 1][b.x] && this.isEmpty([this.grids[b.y - 1][b.x]])) {
            // let betweenBlocks = []
            // for (let t = minY; t < maxY; t++) {
            //     betweenBlocks.push(this.grids[t][a.y > b.y ? a.x : b.x])
            // }
            const xCord = a.y > b.y ? a.x : b.x
            if (this.isVerticalEmpty({ x: xCord, y: minY }, { x: xCord, y: maxY - 1 })) {
                let line = Math.min(a.y, b.y)
                while (--line >= 0 && this.isEmpty([this.grids[line][minX], this.grids[line][maxX]])) {
                    // let betweenBlocks = []
                    // for (let t = minX + 1; t < maxX; t++) {
                    //     betweenBlocks.push(this.grids[line][t])
                    // }
                    // if (this.isEmpty(betweenBlocks)) return true
                    if (this.isHorizonEmpty({ x: minX + 1, y: line }, { x: maxX - 1, y: line })) {
                        this.pipeItems = [
                            ...this.getVerticalBlocks({ x: xCord, y: line + 1 }, { x: xCord, y: maxY - 1 }).map(block => ({ block, type: pipeTypes.vertical })),
                            ...this.getVerticalBlocks({ x: xCord === a.x ? b.x : a.x, y: line + 1 }, { x: xCord === a.x ? b.x : a.x, y: minY - 1 }).map(block => ({ block, type: pipeTypes.vertical })),
                            ...this.getHorizonBlocks({ x: minX + 1, y: line }, { x: maxX - 1, y: line }).map(block => ({ block, type: pipeTypes.horizon })),
                            { block: this.grids[line][minX], type: pipeTypes.upRight },
                            { block: this.grids[line][maxX], type: pipeTypes.leftUp },
                        ]
                        return this.makeResolve(3, this.pipeItems.length + 2, hint)
                    }
                }
            }
        }

        // left

        if (this.grids[a.y][a.x - 1] && this.isEmpty([this.grids[a.y][a.x - 1]]) && this.grids[b.y][b.x - 1] && this.isEmpty([this.grids[b.y][b.x - 1]])) {
            // let betweenBlocks = []
            // for (let t = minX; t < maxX; t++) {
            //     betweenBlocks.push(this.grids[a.x > b.x ? a.y : b.y][t])
            // }
            const yCord = a.x > b.x ? a.y : b.y
            if (this.isHorizonEmpty({ x: minX, y: yCord }, { x: maxX - 1, y: yCord })) {
                let line = Math.min(a.x, b.x)
                while (--line >= 0 && this.isEmpty([this.grids[minY][line], this.grids[maxY][line]])) {
                    // let betweenBlocks = []
                    // for (let t = minY + 1; t < maxY; t++) {
                    //     betweenBlocks.push(this.grids[t][line])
                    // }
                    // if (this.isEmpty(betweenBlocks)) return true
                    if (this.isVerticalEmpty({ x: line, y: minY + 1 }, { x: line, y: maxY - 1 })) {
                        this.pipeItems = [
                            ...this.getHorizonBlocks({ x: line + 1, y: yCord }, { x: maxX - 1, y: yCord }).map(block => ({ block, type: pipeTypes.horizon })),
                            ...this.getHorizonBlocks({ x: line + 1, y: yCord === a.y ? b.y : a.y }, { x: minX - 1, y: yCord === a.y ? b.y : a.y }).map(block => ({ block, type: pipeTypes.horizon })),
                            ...this.getVerticalBlocks({ x: line, y: minY + 1 }, { x: line, y: maxY - 1 }).map(block => ({ block, type: pipeTypes.vertical })),
                            { block: this.grids[minY][line], type: pipeTypes.upRight },
                            { block: this.grids[maxY][line], type: pipeTypes.rightDown },
                        ]
                        return this.makeResolve(3, this.pipeItems.length + 2, hint)
                    }
                }
            }
        }

        // right

        if (this.grids[a.y][a.x + 1] && this.isEmpty([this.grids[a.y][a.x + 1]]) && this.grids[b.y][b.x + 1] && this.isEmpty([this.grids[b.y][b.x + 1]])) {
            // let betweenBlocks = []
            // for (let t = minX + 1; t <= maxX; t++) {
            //     betweenBlocks.push(this.grids[a.x > b.x ? b.y : a.y][t])
            // }
            const yCord = a.x > b.x ? b.y : a.y
            if (this.isHorizonEmpty({ x: minX + 1, y: yCord }, { x: maxX, y: yCord })) {
                let line = Math.max(a.x, b.x)
                while (++line < this.currentStage.GRID_X && this.isEmpty([this.grids[minY][line], this.grids[maxY][line]])) {
                    // let betweenBlocks = []
                    // for (let t = minY + 1; t < maxY; t++) {
                    //     betweenBlocks.push(this.grids[t][line])
                    // }
                    // if (this.isEmpty(betweenBlocks)) return true
                    if (this.isVerticalEmpty({ x: line, y: minY + 1 }, { x: line, y: maxY - 1 })) {
                        this.pipeItems = [
                            ...this.getHorizonBlocks({ x: minX + 1, y: yCord }, { x: line - 1, y: yCord }).map(block => ({ block, type: pipeTypes.horizon })),
                            ...this.getHorizonBlocks({ x: maxX + 1, y: yCord === a.y ? b.y : a.y }, { x: line - 1, y: yCord === a.y ? b.y : a.y }).map(block => ({ block, type: pipeTypes.horizon })),
                            ...this.getVerticalBlocks({ x: line, y: minY + 1 }, { x: line, y: maxY - 1 }).map(block => ({ block, type: pipeTypes.vertical })),
                            { block: this.grids[minY][line], type: pipeTypes.leftUp },
                            { block: this.grids[maxY][line], type: pipeTypes.downLeft },
                        ]
                        return this.makeResolve(3, this.pipeItems.length + 2, hint)
                    }
                }
            }

        }

        // twisted - horizon

        if (this.grids[minXTarget.y][minXTarget.x + 1] && this.isEmpty([this.grids[minXTarget.y][minXTarget.x + 1]]) && this.grids[maxXTarget.y][maxXTarget.x - 1] && this.isEmpty([this.grids[maxXTarget.y][maxXTarget.x - 1]])) {
            let leftEnd = minXTarget.x + 1
            let rightEnd = maxXTarget.x - 1
            while (leftEnd + 1 < maxXTarget.x && this.isEmpty([this.grids[minXTarget.y][leftEnd + 1]])) {
                leftEnd += 1
            }
            while (rightEnd - 1 > minXTarget.x && this.isEmpty([this.grids[maxXTarget.y][rightEnd - 1]])) {
                rightEnd -= 1
            }
            for (let t = rightEnd; t <= leftEnd; t++) {
                if (this.isVerticalEmpty({ x: t, y: minYTarget.y }, { x: t, y: maxYTarget.y })) {
                    const isLeftUp = minXTarget.y > maxXTarget.y
                    this.pipeItems = [
                        ...this.getHorizonBlocks({ x: isLeftUp ? t + 1 : minXTarget.x + 1, y: minYTarget.y }, { x: isLeftUp ? maxXTarget.x - 1 : t - 1, y: minYTarget.y }).map(block => ({ block, type: pipeTypes.horizon })),
                        ...this.getHorizonBlocks({ x: isLeftUp ? minXTarget.x + 1 : t + 1, y: maxYTarget.y }, { x: isLeftUp ? t - 1 : maxXTarget.x - 1, y: maxYTarget.y }).map(block => ({ block, type: pipeTypes.horizon })),
                        ...this.getVerticalBlocks({ x: t, y: minYTarget.y + 1 }, { x: t, y: maxYTarget.y - 1 }).map(block => ({ block, type: pipeTypes.vertical })),
                        { block: this.grids[minXTarget.y][t], type: isLeftUp ? pipeTypes.downLeft : pipeTypes.leftUp },
                        { block: this.grids[maxXTarget.y][t], type: isLeftUp ? pipeTypes.upRight : pipeTypes.rightDown },
                    ]
                    return this.makeResolve(3, this.pipeItems.length + 2, hint)
                }
            }
        }

        // twisted - vertical

        if (this.grids[minYTarget.y + 1][minYTarget.x] && this.isEmpty([this.grids[minYTarget.y + 1][minYTarget.x]]) && this.grids[maxYTarget.y - 1][maxYTarget.x] && this.isEmpty([this.grids[maxYTarget.y - 1][maxYTarget.x]])) {
            let topEnd = minYTarget.y + 1
            let bottomEnd = maxYTarget.y - 1
            while (topEnd + 1 < maxYTarget.y && this.isEmpty([this.grids[topEnd + 1][minYTarget.x]])) {
                topEnd += 1
            }
            while (bottomEnd - 1 > minYTarget.y && this.isEmpty([this.grids[bottomEnd - 1][maxYTarget.x]])) {
                bottomEnd -= 1
            }
            for (let t = bottomEnd; t <= topEnd; t++) {
                if (this.isHorizonEmpty({ x: minXTarget.x, y: t }, { x: maxXTarget.x, y: t })) {
                    const isLeftUp = minXTarget.y > maxXTarget.y
                    this.pipeItems = [
                        ...this.getVerticalBlocks({ x: minXTarget.x, y: isLeftUp ? t + 1 : minYTarget.y + 1 }, { x: minXTarget.x, y: isLeftUp ? maxYTarget.y - 1 : t - 1 }).map(block => ({ block, type: pipeTypes.vertical })),
                        ...this.getVerticalBlocks({ x: maxXTarget.x, y: isLeftUp ? minYTarget.y + 1 : t + 1 }, { x: maxXTarget.x, y: isLeftUp ? t - 1 : maxYTarget.y - 1 }).map(block => ({ block, type: pipeTypes.vertical })),
                        ...this.getHorizonBlocks({ x: minXTarget.x + 1, y: t }, { x: maxXTarget.x - 1, y: t }).map(block => ({ block, type: pipeTypes.horizon })),
                        { block: this.grids[t][minXTarget.x], type: isLeftUp ? pipeTypes.upRight : pipeTypes.rightDown },
                        { block: this.grids[t][maxXTarget.x], type: isLeftUp ? pipeTypes.downLeft : pipeTypes.leftUp },
                    ]
                    return this.makeResolve(3, this.pipeItems.length + 2, hint)
                }
            }
        }

        return false
    }

    update(deltaTime: number) {

    }
}

