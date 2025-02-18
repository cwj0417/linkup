export type SkillType = 'twistBonus' | 'leapBefore' | 'hint' | 'findSameElement';
export const skillDefine: {
    [key in SkillType]: {
        [key: number]: {
            effect: number;
            nextLevCost: number | boolean;
            desc: string;
            extraEffect?: boolean;
        };
    };
} = {
    twistBonus: {
        0: {
            effect: 1,
            nextLevCost: 100,
            desc: '三折消除获得2倍金币'
        },
        1: {
            effect: 2,
            nextLevCost: 1000,
            desc: '三折消除获得2倍金币\n\n下一级:\n\n三折消除获得3倍金币'
        },
        2: {
            effect: 3,
            nextLevCost: 10000,
            desc: '三折消除获得3倍金币\n\n下一级:\n\n三折消除获得4倍金币'
        },
        3: {
            effect: 4,
            nextLevCost: 100000,
            desc: '三折消除获得4倍金币\n\n下一级:\n\n三折消除获得5倍金币'
        },
        4: {
            effect: 5,
            nextLevCost: 1000000,
            desc: '三折消除获得5倍金币\n\n下一级:\n\n所有消除都获得5倍金币'
        },
        5: {
            effect: 5,
            extraEffect: true,
            nextLevCost: false,
            desc: '所有消除都获得5倍金币'
        },
    },
    leapBefore: {
        0: {
            effect: 0,
            nextLevCost: 100,
            desc: '每局游戏2次匹配后再计时'
        },
        1: {
            effect: 1,
            nextLevCost: 1000,
            desc: '每局游戏2次匹配后再计时\n\n下一级:\n\n每局游戏4次匹配后再计时'
        },
        2: {
            effect: 2,
            nextLevCost: 10000,
            desc: '每局游戏4次匹配后再计时\n\n下一级:\n\n每局游戏6次匹配后再计时'
        },
        3: {
            effect: 3,
            nextLevCost: 100000,
            desc: '每局游戏6次匹配后再计时\n\n下一级:\n\n每局游戏8次匹配后再计时'
        },
        4: {
            effect: 4,
            nextLevCost: 1000000,
            desc: '每局游戏8次匹配后再计时\n\n下一级:\n\n每局游戏10次匹配后再计时, 并且在使用"提示"后暂停倒计时'
        },
        5: {
            effect: 5,
            extraEffect: true,
            nextLevCost: false,
            desc: '每局游戏10次匹配后再计时, 并且在使用"提示"后暂停倒计时'
        }
    },
    hint: {
        0: {
            effect: 0,
            nextLevCost: 100,
            desc: '每局游戏可以获得1次提示'
        },
        1: {
            effect: 1,
            nextLevCost: 1000,
            desc: '每局游戏可以获得1次提示\n\n下一级:\n\n每局游戏可以获得2次提示'
        },
        2: {
            effect: 2,
            nextLevCost: 10000,
            desc: '每局游戏可以获得2次提示\n\n下一级:\n\n每局游戏可以获得3次提示'
        },
        3: {
            effect: 3,
            nextLevCost: 100000,
            desc: '每局游戏可以获得3次提示\n\n下一级:\n\n每局游戏可以获得4次提示'
        },
        4: {
            effect: 4,
            nextLevCost: 1000000,
            desc: '每局游戏可以获得4次提示\n\n下一级:\n\n每局游戏可以获得5次提示, 每次使用有50%概率不消耗次数'
        },
        5: {
            effect: 5,
            extraEffect: true,
            nextLevCost: false,
            desc: '每局游戏可以获得5次提示, 每次使用有50%概率不消耗次数'
        }
    },
    findSameElement: {
        0: {
            effect: 0,
            nextLevCost: 100,
            desc: '每局游戏可以获得2次双击获取全部元素位置'
        },
        1: {
            effect: 2,
            nextLevCost: 1000,
            desc: '每局游戏可以获得2次双击获取全部元素位置\n\n下一级:\n\n每局游戏可以获得4次双击获取全部元素位置'
        },
        2: {
            effect: 4,
            nextLevCost: 10000,
            desc: '每局游戏可以获得4次双击获取全部元素位置\n\n下一级:\n\n每局游戏可以获得6次双击获取全部元素位置'
        },
        3: {
            effect: 6,
            nextLevCost: 100000,
            desc: '每局游戏可以获得6次双击获取全部元素位置\n\n下一级:\n\n每局游戏可以获得8次双击获取全部元素位置'
        },
        4: {
            effect: 8,
            nextLevCost: 1000000,
            desc: '每局游戏可以获得8次双击获取全部元素位置\n\n下一级:\n\n每局游戏可以无限次双击获取全部元素位置'
        },
        5: {
            effect: 0,
            extraEffect: true,
            nextLevCost: false,
            desc: '每局游戏可以无限次双击获取全部元素位置'
        }
    }
}