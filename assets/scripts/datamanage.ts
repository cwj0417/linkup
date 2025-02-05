// @ts-nocheck
const datamanage = {
    getGold() {
        try {
            return wx.getStorageSync('gold') || 0
        } catch (e) {
            return 0
        }
    },
    setGold(v) {
        try {
            wx.setStorageSync('gold', v)
        } catch (e) { }
    },
    getStage() {
        try {
            return wx.getStorageSync('stage') || {
                currentStage: 1,
                topStage: 1,
            }
        } catch (e) {
            return {
                currentStage: 1,
                topStage: 1,
            }
        }
    },
    setStage(v) {
        try {
            wx.setStorageSync('stage', v)
        } catch (e) { }
    },
    getSkill() {
        try {
            return wx.getStorageSync('skill') || {
                twistBonus: 0,
                leapBefore: 0,
                hint: 0,
                findSameElement: 0,
            }
        } catch (e) {
            return {
                twistBonus: 0,
                leapBefore: 0,
                hint: 0,
                findSameElement: 0,
            }
        }
    },
    setSkill(v) {
        try {
            wx.setStorageSync('skill', v)
        }
        catch (e) { }
    }
}

export default datamanage;