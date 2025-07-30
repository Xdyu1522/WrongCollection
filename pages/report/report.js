// pages/report/report.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    stats: {
      total: 0,
      mastered: 0,
      reviewing: 0,
      unmastered: 0
    },
    subjectData: [],
    masteryData: [],
    loading: true
  },

  /**
   * 加载错题统计数据
   */
  loadStatsData() {
    const that = this;
    // 从本地存储获取所有错题
    const questions = this.util.storage.get('questions') || [];
    const total = questions.length;

    // 处理没有错题的情况
    if (total === 0) {
      that.setData({
        stats: {
          total: 0,
          mastered: 0,
          reviewing: 0,
          unmastered: 0
        },
        subjectData: [],
        masteryData: [
          { name: '已掌握', value: 0 },
          { name: '复习中', value: 0 },
          { name: '未掌握', value: 0 }
        ],
        loading: false,
        noData: true
      });
      return;
    }

    // 计算不同掌握程度的题目数量 - 兼容不同的状态字段格式
    const mastered = questions.filter(q => {
      const status = q.status || q.mastery;
      return status === 'mastered' || status === 2;
    }).length;
    const reviewing = questions.filter(q => {
      const status = q.status || q.mastery;
      return status === 'review' || status === 'reviewing' || status === 1;
    }).length;
    const unmastered = questions.filter(q => {
      const status = q.status || q.mastery;
      return status === 'not-mastered' || status === 'pending' || status === 0;
    }).length;

    // 按学科统计
    const subjectMap = {};
    questions.forEach(q => {
      if (!subjectMap[q.subject]) {
        subjectMap[q.subject] = 1;
      } else {
        subjectMap[q.subject]++;
      }
    });
    const subjectData = Object.keys(subjectMap).map(key => ({
      name: key,
      value: subjectMap[key]
    }));

    // 掌握程度数据
    const masteryData = [
      { name: '已掌握', value: mastered },
      { name: '复习中', value: reviewing },
      { name: '未掌握', value: unmastered }
    ];

    // 更新数据
    that.setData({
      stats: {
        total,
        mastered,
        reviewing,
        unmastered
      },
      subjectData,
      masteryData,
      loading: false,
      noData: false
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 引入工具函数
    const util = require('../../utils/util.js');
    this.util = util;
    this.loadStatsData();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时重新加载数据
    this.loadStatsData();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})