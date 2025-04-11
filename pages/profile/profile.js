// profile.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    hasUserInfo: false
  },
  
  onLoad() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      this.handleLogin()
    } else {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    }
  },

  // 处理登录
  handleLogin() {
    wx.showModal({
      title: '登录提示',
      content: '需要授权登录才能使用错题本功能',
      confirmText: '去登录',
      cancelText: '退出',
      success: (res) => {
        if (res.confirm) {
          this.getUserProfile()
        } else {
          // 用户拒绝登录，退出小程序
          wx.exitMiniProgram()
        }
      }
    })
  },
  
  // 获取用户信息
  getUserProfile() {
    app.login().then(userInfo => {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      })
    }).catch(err => {
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      })
      // 登录失败也退出小程序
      setTimeout(() => {
        wx.exitMiniProgram()
      }, 1500)
    })
  },
  
  // 选择头像事件
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const userInfo = this.data.userInfo
    userInfo.avatarUrl = avatarUrl
    this.setData({ userInfo })
    // 更新全局数据
    app.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
  },
  
  // 导航到学习报告
  navigateToReport() {
    if (!this.data.hasUserInfo) {
      this.handleLogin()
      return
    }
    wx.navigateTo({
      url: '../report/report'
    })
  },
  
  // 导航到错题分类
  navigateToCategories() {
    if (!this.data.hasUserInfo) {
      this.handleLogin()
      return
    }
    wx.navigateTo({
      url: '../categories/categories'
    })
  },
  
  // 导航到通知设置
  navigateToNotifications() {
    if (!this.data.hasUserInfo) {
      this.handleLogin()
      return
    }
    wx.navigateTo({
      url: '../notifications/notifications'
    })
  },
  
  // 导航到拍照页面
  navigateToCamera() {
    if (!this.data.hasUserInfo) {
      this.handleLogin()
      return
    }
    wx.navigateTo({
      url: '../add_question/add_question'
    })
  },
  
  // 退出登录
  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout()
          this.setData({
            userInfo: null,
            hasUserInfo: false
          })
          // 退出小程序
          wx.exitMiniProgram()
        }
      }
    })
  }
}) 