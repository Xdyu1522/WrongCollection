// profile.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '学习者',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile')
  },
  
  onLoad() {
    // 获取本地存储的用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo: JSON.parse(userInfo),
        hasUserInfo: true
      });
    } else if (this.data.canIUseGetUserProfile && !this.data.hasUserInfo) {
      this.getUserProfile();
    }
  },
  
  // 选择头像事件
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const { nickName } = this.data.userInfo
    this.setData({
      "userInfo.avatarUrl": avatarUrl,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
    // 保存用户数据
    this.saveUserData();
  },
  
  // 获取用户信息
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善个人资料', 
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
        // 保存用户数据
        this.saveUserData();
      }
    })
  },
  
  // 保存用户数据到本地
  saveUserData() {
    wx.setStorageSync('userInfo', JSON.stringify(this.data.userInfo));
  },
  
  // 导航到学习报告
  navigateToReport() {
    wx.navigateTo({
      url: '../report/report'
    })
  },
  
  // 导航到错题分类
  navigateToCategories() {
    wx.navigateTo({
      url: '../categories/categories'
    })
  },
  
  // 导航到通知设置
  navigateToNotifications() {
    wx.navigateTo({
      url: '../notifications/notifications'
    })
  },
  
  // 导航到拍照页面
  navigateToCamera() {
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
          // 清除用户信息
          this.setData({
            userInfo: {
              avatarUrl: defaultAvatarUrl,
              nickName: '学习者',
            },
            hasUserInfo: false
          });
          
          // 清除本地存储
          wx.removeStorageSync('userInfo');
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    })
  }
}) 