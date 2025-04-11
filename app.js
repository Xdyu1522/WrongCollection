// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 检查登录状态
    this.checkLoginStatus()
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false
  },

  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
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
          wx.setStorageSync('userInfo', userInfo)
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
    wx.removeStorageSync('userInfo')
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false
  }
})
