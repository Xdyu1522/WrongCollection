// questions.js
Page({
  data: {
    activeTab: '全部',
    filterTabs: [
      '全部', '语文', '数学', '英语', '物理', 
      '化学', '生物', '政治', '历史', '地理'
    ],
    sortOptions: [
      '最近添加', '学科排序', '掌握程度'
    ],
    currentSort: '最近添加',
    questions: [
      {
        id: 1,
        title: '三角函数基本公式应用',
        subject: '数学',
        tags: ['数学', '三角函数'],
        status: 'review',
        statusText: '需复习',
        errorReason: '混淆了正弦和余弦的转换公式，需要记忆基本三角恒等式。',
        date: '今天',
        image: 'https://images.pexels.com/photos/4021256/pexels-photo-4021256.jpeg?auto=compress&cs=tinysrgb&w=300'
      },
      {
        id: 2,
        title: '被动语态时态搭配',
        subject: '英语',
        tags: ['英语', '语法'],
        status: 'mastered',
        statusText: '已掌握',
        errorReason: '没有注意到完成时被动语态的构成方式，应该是have/has been + 过去分词。',
        date: '昨天',
        image: 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=300'
      },
      {
        id: 3,
        title: '动能定理在实际问题中的应用',
        subject: '物理',
        tags: ['物理', '力学'],
        status: 'not-mastered',
        statusText: '未掌握',
        errorReason: '在计算过程中，没有考虑到做功的正负号问题，导致最终结果符号错误。',
        date: '2天前',
        image: 'https://images.pexels.com/photos/3815750/pexels-photo-3815750.jpeg?auto=compress&cs=tinysrgb&w=300'
      },
      {
        id: 4,
        title: '有机物官能团识别',
        subject: '化学',
        tags: ['化学', '有机化学'],
        status: 'not-mastered',
        statusText: '未掌握',
        errorReason: '对醛基和酮基的化学性质区分不清，需要加强对官能团特性的理解。',
        date: '3天前',
        image: 'https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=300'
      }
    ],
    filteredQuestions: []
  },
  
  onLoad() {
    this.setData({
      filteredQuestions: this.data.questions
    });
  },
  
  // 切换筛选标签
  switchTab(e) {
    const tabName = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tabName
    });
    
    this.filterQuestions();
  },
  
  // 切换排序方式
  changeSortOption(e) {
    const sortOption = e.detail.value;
    this.setData({
      currentSort: this.data.sortOptions[sortOption]
    });
    
    this.sortQuestions();
  },
  
  // 筛选错题
  filterQuestions() {
    if (this.data.activeTab === '全部') {
      this.setData({
        filteredQuestions: this.data.questions
      });
    } else {
      const filtered = this.data.questions.filter(q => q.subject === this.data.activeTab);
      this.setData({
        filteredQuestions: filtered
      });
    }
    
    this.sortQuestions();
  },
  
  // 排序错题
  sortQuestions() {
    let sorted = [...this.data.filteredQuestions];
    
    switch(this.data.currentSort) {
      case '学科排序':
        sorted.sort((a, b) => a.subject.localeCompare(b.subject, 'zh'));
        break;
      case '掌握程度':
        // 排序优先级：未掌握 > 需复习 > 已掌握
        const statusOrder = {
          'not-mastered': 0,
          'review': 1,
          'mastered': 2
        };
        sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
        break;
      // 默认按添加时间排序，最近的在前面
      default:
        // 已经是按时间排序的，无需操作
        break;
    }
    
    this.setData({
      filteredQuestions: sorted
    });
  },
  
  // 导航到错题详情
  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `../question_detail/question_detail?id=${id}`
    });
  },
  
  // 导航到拍照页面
  navigateToCamera() {
    wx.navigateTo({
      url: '../add_question/add_question'
    });
  },
  
  // 搜索错题
  searchQuestions(e) {
    const keyword = e.detail.value.trim();
    if (!keyword) {
      this.filterQuestions();
      return;
    }
    
    const filtered = this.data.questions.filter(q => 
      q.title.includes(keyword) || 
      q.subject.includes(keyword) || 
      q.tags.some(tag => tag.includes(keyword)) ||
      q.errorReason.includes(keyword)
    );
    
    this.setData({
      filteredQuestions: filtered
    });
  }
}) 