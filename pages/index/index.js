// index.js
const util = require('../../utils/util.js')
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '学习者',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    isFirstLaunch: true,  // 是否首次启动
    
    // 错题统计数据
    statsData: {
      total: 0,
      weekly: 0,
      mastered: 0,
      progress: 0
    },
    
    // 学科标签
    subjects: [
      '语文', '数学', '英语', '物理', '化学', 
      '生物', '政治', '历史', '地理'
    ],
    
    // 最近错题
    recentMistakes: []
  },
  
  onLoad() {
    // 检查是否首次启动
    this.checkFirstLaunch();
    
    // 尝试获取用户信息
    this.checkUserInfo();
    
    // 读取本地错题数据
    this.loadLocalMistakes();
  },
  
  onShow() {
    // 每次显示页面时刷新数据
    this.loadLocalMistakes();
  },
  
  // 检查是否为首次启动
  checkFirstLaunch() {
    try {
      const isFirstLaunch = wx.getStorageSync('isFirstLaunch');
      if (isFirstLaunch === '') {
        // 首次启动，标记并显示引导
        this.setData({ isFirstLaunch: true });
        wx.setStorageSync('isFirstLaunch', 'false');
      } else {
        this.setData({ isFirstLaunch: false });
      }
    } catch (e) {
      console.error('检查首次启动失败', e);
    }
  },
  
  // 检查用户信息
  checkUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.setData({
          userInfo: JSON.parse(userInfo),
          hasUserInfo: true
        });
      } else if (this.data.canIUseGetUserProfile) {
        // 如果是首次启动，自动请求用户信息
        if (this.data.isFirstLaunch) {
          wx.showModal({
            title: '欢迎使用错题本',
            content: '为了提供更好的服务，请授权您的微信信息',
            confirmText: '确定授权',
            success: (res) => {
              if (res.confirm) {
                this.getUserProfile();
              }
            }
          });
        }
      }
    } catch (e) {
      console.error('获取用户信息失败', e);
    }
  },
  
  // 读取本地错题数据
  loadLocalMistakes() {
    wx.showLoading({
      title: '加载数据中...'
    });
    
    try {
      // 读取所有错题
      const allMistakes = util.storage.get('mistakes', '[]');
      const mistakesArray = JSON.parse(allMistakes);
      
      // 处理统计信息
      const currentTime = new Date().getTime();
      const oneWeek = 7 * 24 * 60 * 60 * 1000; // 一周的毫秒数
      
      const total = mistakesArray.length;
      const weekly = mistakesArray.filter(item => {
        return (currentTime - item.timestamp) <= oneWeek;
      }).length;
      
      const mastered = mistakesArray.filter(item => item.status === 'mastered').length;
      const progress = total > 0 ? Math.round((mastered / total) * 100) : 0;
      
      // 获取最近的错题（最多3个）
      const recentMistakes = mistakesArray
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3)
        .map(item => {
          // 计算时间标签
          const timeLabel = this.getTimeLabel(item.timestamp);
          return {
            id: item.id,
            title: item.title || '未命名错题',
            subject: item.subject || '未分类',
            time: timeLabel,
            status: item.status || 'pending',
            image: item.imageUrl || 'https://images.pexels.com/photos/4021256/pexels-photo-4021256.jpeg?auto=compress&cs=tinysrgb&w=120'
          };
        });
      
      // 更新数据
      this.setData({
        statsData: {
          total,
          weekly,
          mastered,
          progress
        },
        recentMistakes
      });
      
    } catch (e) {
      console.error('读取本地错题失败', e);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },
  
  // 计算时间标签
  getTimeLabel(timestamp) {
    if (!timestamp) return '未知';
    return util.formatRelativeDate(new Date(timestamp));
  },

  // 获取状态文本
  getStatusText(status) {
    return util.getStatusText(status);
  },
  
  // 选择头像事件
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const { nickName } = this.data.userInfo
    
    this.setData({
      "userInfo.avatarUrl": avatarUrl,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    });
    
    // 保存到本地
    this.saveUserInfo();
  },
  
  // 输入昵称事件
  onInputChange(e) {
    const nickName = e.detail.value
    const { avatarUrl } = this.data.userInfo
    
    this.setData({
      "userInfo.nickName": nickName,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    });
    
    // 保存到本地
    this.saveUserInfo();
  },
  
  // 获取用户信息
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料', 
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        });
        
        // 保存到本地
        this.saveUserInfo();
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
        wx.showToast({
          title: '授权失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 保存用户信息到本地
  saveUserInfo() {
    try {
      wx.setStorageSync('userInfo', JSON.stringify(this.data.userInfo));
    } catch (e) {
      console.error('保存用户信息失败', e);
    }
  },
  
  // 导航到拍照页面
  navigateToCamera() {
    wx.navigateTo({
      url: '../add_question/add_question'
    });
  },
  
  // 导航到分析页面
  navigateToAnalysis() {
    wx.navigateTo({
      url: '../analysis/analysis'
    });
  },
  
  // 导航到报告页面
  navigateToReport() {
    wx.navigateTo({
      url: '../report/report'
    });
  },
  
  // 导航到错题列表页
  navigateToQuestions() {
    wx.switchTab({
      url: '../questions/questions'
    });
  },
  
  // 导航到错题详情页
  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) {
      wx.showToast({
        title: '错题ID无效',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `../question_detail/question_detail?id=${id}`
    });
  }
})
