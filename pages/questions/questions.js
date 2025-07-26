// questions.js
const app = getApp()
const util = require('../../utils/util.js')

Page({
  data: {
    questions: [],
    subjects: ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'],
    currentSubject: 'all',
    searchText: '',
    sortOptions: ['最近添加', '最近修改', '掌握程度'],
    sortIndex: 0,
    page: 1,
    pageSize: 10,
    hasMore: true,
    totalCount: 0
  },
  
  onLoad() {
    this.loadQuestions()
  },

  onShow() {
    // 每次页面显示时重新加载数据，以获取最新状态
    this.loadQuestions()
  },
  
  // 加载错题数据
  loadQuestions() {
    const questions = util.storage.get('questions', [])
    
    // 设置错题总数
    this.setData({
      totalCount: questions.length
    })
    
    let filteredQuestions = this.filterQuestions(questions)
    
    // 更新状态文本
    filteredQuestions = filteredQuestions.map(q => ({
      ...q,
      statusText: this.getStatusText(q.status)
    }))

    this.setData({
      questions: filteredQuestions,
      hasMore: filteredQuestions.length > this.data.page * this.data.pageSize
    })
    
    // 更新全局数据
    app.globalData.questions = questions
  },
  
  // 过滤错题
  filterQuestions(questions) {
    let filtered = [...questions]
    
    // 按学科筛选
    if (this.data.currentSubject !== 'all') {
      filtered = filtered.filter(q => q.subject === this.data.currentSubject)
    }
    
    // 按搜索关键词筛选
    if (this.data.searchText) {
      const keyword = this.data.searchText.toLowerCase()
      filtered = filtered.filter(q => 
        q.title.toLowerCase().includes(keyword) ||
        q.errorReason.toLowerCase().includes(keyword)
      )
    }
    
    // 排序
    filtered.sort((a, b) => {
      switch (this.data.sortIndex) {
        case 0: // 最近添加
          return b.createTime - a.createTime
        case 1: // 最近修改
          return b.updateTime - a.updateTime
        case 2: // 掌握程度
          const statusOrder = { 'not-mastered': 0, 'review': 1, 'mastered': 2 }
          return statusOrder[a.status] - statusOrder[b.status]
        default:
          return 0
      }
    })
    
    return filtered
  },
  
  // 获取状态文本
  getStatusText(status) {
    return util.getStatusText(status)
  },
  
  // 搜索处理
  onSearch(e) {
    this.setData({
      searchText: e.detail.value
    })
    this.loadQuestions()
  },
  
  // 学科筛选
  filterBySubject(e) {
    const subject = e.currentTarget.dataset.subject
    this.setData({
      currentSubject: subject
    })
    this.loadQuestions()
  },
  
  // 排序处理
  onSortChange(e) {
    this.setData({
      sortIndex: e.detail.value
    })
    this.loadQuestions()
  },
  
  // 加载更多
  loadMore() {
    if (!this.data.hasMore) return
    
    this.setData({
      page: this.data.page + 1
    })
    this.loadQuestions()
  },
  
  // 跳转到详情页
  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/question_detail/question_detail?id=${id}`
    })
  },
  
  // 跳转到添加页
  navigateToAdd() {
    wx.navigateTo({
      url: '/pages/add_question/add_question'
    })
  },

  // 删除错题
  deleteQuestion(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这道错题吗？',
      success: (res) => {
        if (res.confirm) {
          let questions = wx.getStorageSync('questions') || [];
          questions = questions.filter(q => q.id !== id);
          util.storage.set('questions', questions);
          
          // 更新页面数据及计数
          this.setData({
            totalCount: questions.length
          });
          
          this.loadQuestions();
          
          // 更新全局数据
          app.globalData.questions = questions;
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  }
})