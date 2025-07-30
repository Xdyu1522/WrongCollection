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
      // 读取所有错题 - 统一使用 'questions' 键
      const questions = util.storage.get('questions', []);
      
      // 处理统计信息
      const currentTime = new Date().getTime();
      const oneWeek = 7 * 24 * 60 * 60 * 1000; // 一周的毫秒数
      const oneWeekAgo = currentTime - oneWeek;
      
      const total = questions.length;
      
      // 修复每周新增错题数计算逻辑
      // 确保正确处理所有时间格式，并添加详细日志便于调试
      let weekly = 0;
      const weeklyItems = [];
      
      questions.forEach(item => {
        // 兼容旧数据格式，优先使用 date 字段，如果没有则使用 timestamp
        let itemTime = 0;
        
        if (item.date) {
          if (typeof item.date === 'string') {
            // 处理特殊日期字符串
            if (item.date === '今天') {
              itemTime = new Date().setHours(0, 0, 0, 0);
            } else if (item.date === '昨天') {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              itemTime = yesterday.setHours(0, 0, 0, 0);
            } else {
              // 处理ISO格式日期字符串
              const parsedDate = new Date(item.date);
              itemTime = parsedDate.getTime();
              // 验证日期有效性
              if (isNaN(itemTime)) {
                console.warn('无效的date字符串:', item.date, '错题ID:', item.id);
                itemTime = 0;
              }
            }
          } else if (typeof item.date === 'number') {
            itemTime = item.date;
          }
        } else if (item.timestamp) {
          itemTime = item.timestamp;
        }
        
        // 检查是否在一周内
        const isWithinWeek = itemTime >= oneWeekAgo && itemTime <= currentTime;
        
        if (isWithinWeek) {
          weekly++;
          weeklyItems.push({
            id: item.id,
            date: item.date,
            timestamp: item.timestamp,
            itemTime: itemTime
          });
        }
      });
      
      // 调试日志
      console.log('总错题数:', total, '本周新增:', weekly);
      console.log('本周新增错题详情:', weeklyItems);
      console.log('一周前时间戳:', oneWeekAgo);
      console.log('当前时间戳:', currentTime);
      
      // 兼容不同的状态字段格式
      const mastered = questions.filter(item => {
        const status = item.status || item.mastery;
        return status === 'mastered' || status === 2;
      }).length;
      const progress = total > 0 ? Math.round((mastered / total) * 100) : 0;
      
      // 获取最近的错题（最多3个）
      const recentMistakes = questions
        .sort((a, b) => {
          // 兼容不同的时间字段格式
          const timeA = a.date ? new Date(a.date).getTime() : (a.timestamp || 0);
          const timeB = b.date ? new Date(b.date).getTime() : (b.timestamp || 0);
          return timeB - timeA;
        })
        .slice(0, 3)
        .map(item => {
          // 计算时间标签
          const timeLabel = this.getTimeLabel(item.date || item.timestamp);
          return {
            id: item.id,
            title: item.title || '未命名错题',
            subject: item.subject || '未分类',
            time: timeLabel,
            status: item.status || item.mastery || 'pending',
            image: item.image || item.imageUrl || 'https://images.pexels.com/photos/4021256/pexels-photo-4021256.jpeg?auto=compress&cs=tinysrgb&w=120'
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
  },

  // 调试数据一致性
  debugData() {
    const questions = util.storage.get('questions', []);
    const mistakes = util.storage.get('mistakes', []);
    
    console.log('=== 数据一致性检查 ===');
    console.log('questions 数据:', questions);
    console.log('mistakes 数据:', mistakes);
    console.log('questions 数量:', questions.length);
    console.log('mistakes 数量:', mistakes ? (typeof mistakes === 'string' ? JSON.parse(mistakes).length : mistakes.length) : 0);
    
    // 统计状态分布
    const statusStats = questions.reduce((acc, q) => {
      const status = q.status || q.mastery || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('状态分布:', statusStats);
    
    wx.showModal({
      title: '数据调试',
      content: `questions: ${questions.length}条\nmistakes: ${mistakes ? (typeof mistakes === 'string' ? JSON.parse(mistakes).length : mistakes.length) : 0}条\n状态分布: ${JSON.stringify(statusStats)}`,
      showCancel: false
    });
  },
  
  // 调试每周新增错题数据
  debugWeeklyData() {
    const questions = util.storage.get('questions', []);
    const currentTime = new Date().getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const oneWeekAgo = currentTime - oneWeek;
    
    // 计算每周新增
    let weekly = 0;
    const weeklyItems = [];
    
    questions.forEach(item => {
      let itemTime = 0;
      
      if (item.date) {
        if (typeof item.date === 'string') {
          const parsedDate = new Date(item.date);
          itemTime = parsedDate.getTime();
          if (isNaN(itemTime)) {
            console.warn('无效的date字符串:', item.date, '错题ID:', item.id);
            itemTime = 0;
          }
        } else if (typeof item.date === 'number') {
          itemTime = item.date;
        }
      } else if (item.timestamp) {
        itemTime = item.timestamp;
      }
      
      const isWithinWeek = itemTime >= oneWeekAgo && itemTime <= currentTime;
      
      if (isWithinWeek) {
        weekly++;
        weeklyItems.push({
          id: item.id,
          title: item.title || '未命名',
          date: item.date,
          timestamp: item.timestamp,
          itemTime: itemTime,
          dateString: item.date ? (typeof item.date === 'string' ? item.date : new Date(item.date).toISOString()) : (item.timestamp ? new Date(item.timestamp).toISOString() : '未知')
        });
      }
    });
    
    console.log('=== 每周新增错题调试 ===');
    console.log('当前时间:', new Date(currentTime).toISOString());
    console.log('一周前时间:', new Date(oneWeekAgo).toISOString());
    console.log('本周新增错题数:', weekly);
    console.log('本周新增错题详情:', weeklyItems);
    
    // 显示详细信息
    const detailText = weeklyItems.map(item => {
      return `ID: ${item.id}\n标题: ${item.title}\n日期: ${item.dateString}\n`;
    }).join('\n--------------------\n');
    
    wx.showModal({
      title: '每周数据调试',
      content: `本周新增错题数: ${weekly}\n\n详细信息:\n${detailText}`,
      showCancel: false,
      confirmText: '查看控制台详情',
      success: () => {
        wx.showToast({
          title: '请查看控制台输出',
          icon: 'none'
        });
      }
    });
  }
})
