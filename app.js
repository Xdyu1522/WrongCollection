// app.js
const util = require('./utils/util.js')
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = util.storage.get('logs', [])
    logs.unshift(Date.now())
    util.storage.set('logs', logs)

    // 检查登录状态
    this.checkLoginStatus()
    
    // 数据迁移：将旧的 'mistakes' 数据合并到 'questions' 中
    this.migrateData()
    
    // 初始化全局错题数据
    this.globalData.questions = util.storage.get('questions', [])
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    questions: [] // 添加全局错题数据
  },

  checkLoginStatus() {
    const userInfo = util.storage.get('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
      this.globalData.isLoggedIn = true
    } else {
      this.globalData.isLoggedIn = false
    }
  },

  // 用户登录方法
  login() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          const userInfo = res.userInfo
          util.storage.set('userInfo', userInfo)
          this.globalData.userInfo = userInfo
          this.globalData.isLoggedIn = true
          resolve(userInfo)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  // 退出登录方法
  logout() {
    util.storage.remove('userInfo')
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false
  },

  // 数据迁移方法
  migrateData() {
    try {
      // 检查是否存在旧的 'mistakes' 数据
      const oldMistakes = util.storage.get('mistakes')
      if (oldMistakes) {
        console.log('发现旧数据，开始迁移...')
        
        // 获取现有的 'questions' 数据
        const questions = util.storage.get('questions', [])
        
        // 解析旧的错题数据
        let mistakesArray = []
        if (typeof oldMistakes === 'string') {
          mistakesArray = JSON.parse(oldMistakes)
        } else {
          mistakesArray = oldMistakes
        }
        
        // 合并数据，避免重复
        const existingIds = new Set(questions.map(q => q.id))
        const newQuestions = mistakesArray.filter(mistake => {
          // 如果ID不存在，则添加
          if (!existingIds.has(mistake.id)) {
            // 转换状态格式
            if (mistake.status === 'mastered') {
              mistake.mastery = 2
            } else if (mistake.status === 'review') {
              mistake.mastery = 1
            } else {
              mistake.mastery = 0
            }
            return true
          }
          return false
        })
        
        // 合并数据
        const mergedQuestions = [...questions, ...newQuestions]
        
        // 保存合并后的数据
        util.storage.set('questions', mergedQuestions)
        
        // 删除旧数据
        util.storage.remove('mistakes')
        
        console.log(`数据迁移完成，合并了 ${newQuestions.length} 条记录`)
      }
    } catch (e) {
      console.error('数据迁移失败:', e)
    }
  }
})
