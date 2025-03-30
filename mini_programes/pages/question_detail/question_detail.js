Page({
  /**
   * 页面的初始数据
   */
  data: {
    question: {
      imageUrl: ''
    },
    subjects: ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'],
    subjectIndex: 0,
    difficulty: 'medium',
    knowledgePoint: '',
    knowledgePoints: [],
    errorReason: '',
    notes: '',
    recognitionResult: '',
    isLoading: false,
    isEditMode: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 如果传入了错题ID，加载错题数据
    if (options.id) {
      this.setData({
        isLoading: true,
        isEditMode: true
      });
      
      // 从本地存储获取错题数据
      this.loadMistakeById(options.id);
    } else if (options.photo) {
      // 如果是从拍照页面跳转过来的，设置临时图片路径
      this.setData({
        'question.imageUrl': options.photo,
        isEditMode: false
      });
      
      // 调用图像识别API
      this.recognizeImage(options.photo);
    } else {
      // 默认设置一个示例图片
      this.setData({
        'question.imageUrl': 'https://images.pexels.com/photos/4021256/pexels-photo-4021256.jpeg?auto=compress&cs=tinysrgb&w=300',
        isEditMode: false
      });
    }
  },

  /**
   * 从本地存储读取错题数据
   */
  loadMistakeById: function(id) {
    try {
      // 读取所有错题
      const allMistakes = wx.getStorageSync('mistakes') || '[]';
      const mistakesArray = JSON.parse(allMistakes);
      
      // 查找指定ID的错题
      const mistake = mistakesArray.find(item => item.id === id);
      
      if (mistake) {
        // 设置数据
        this.setData({
          question: mistake,
          subjectIndex: this.data.subjects.indexOf(mistake.subject) > -1 ? 
                        this.data.subjects.indexOf(mistake.subject) : 0,
          difficulty: mistake.difficulty || 'medium',
          knowledgePoints: mistake.knowledgePoints || [],
          errorReason: mistake.errorReason || '',
          notes: mistake.notes || '',
          recognitionResult: mistake.recognitionResult || '',
          isLoading: false
        });
      } else {
        wx.showToast({
          title: '未找到错题数据',
          icon: 'none'
        });
        
        // 延迟返回
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (e) {
      console.error('读取错题数据失败', e);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
      this.setData({ isLoading: false });
    }
  },

  /**
   * 图像识别
   */
  recognizeImage: function(imagePath) {
    this.setData({ isLoading: true });
    
    // 实际应用中，这里应该调用真实的OCR服务
    // 这里仅作为模拟
    setTimeout(() => {
      // 模拟识别结果
      const mockResult = '已识别的内容：计算函数 f(x) = ln(x²+1) 在点 x=1 处的导数。';
      
      this.setData({
        recognitionResult: mockResult,
        isLoading: false
      });
      
      wx.showToast({
        title: '识别完成',
        icon: 'success'
      });
    }, 1500);
  },

  /**
   * 预览图片
   */
  previewImage: function() {
    if (this.data.question && this.data.question.imageUrl) {
      wx.previewImage({
        urls: [this.data.question.imageUrl]
      });
    }
  },

  /**
   * 科目选择器变化
   */
  bindSubjectChange: function(e) {
    this.setData({
      subjectIndex: e.detail.value
    });
  },

  /**
   * 设置难度
   */
  setDifficulty: function(e) {
    this.setData({
      difficulty: e.currentTarget.dataset.difficulty
    });
  },

  /**
   * 输入知识点
   */
  inputKnowledgePoint: function(e) {
    this.setData({
      knowledgePoint: e.detail.value
    });
  },

  /**
   * 添加知识点标签
   */
  addKnowledgePoint: function() {
    if (this.data.knowledgePoint.trim() === '') {
      return;
    }
    
    const knowledgePoints = this.data.knowledgePoints;
    knowledgePoints.push(this.data.knowledgePoint);
    
    this.setData({
      knowledgePoints: knowledgePoints,
      knowledgePoint: ''
    });
  },

  /**
   * 移除知识点标签
   */
  removeKnowledgePoint: function(e) {
    const index = e.currentTarget.dataset.index;
    const knowledgePoints = this.data.knowledgePoints;
    knowledgePoints.splice(index, 1);
    
    this.setData({
      knowledgePoints: knowledgePoints
    });
  },

  /**
   * 输入错误原因
   */
  inputErrorReason: function(e) {
    this.setData({
      errorReason: e.detail.value
    });
  },

  /**
   * 输入笔记
   */
  inputNotes: function(e) {
    this.setData({
      notes: e.detail.value
    });
  },

  /**
   * 保存错题
   */
  saveQuestion: function() {
    // 表单验证
    if (!this.data.question || !this.data.question.imageUrl) {
      wx.showToast({
        title: '请添加错题图片',
        icon: 'none'
      });
      return;
    }
    
    // 显示保存中提示
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    
    try {
      // 从填写信息中提取题目标题
      let title = '未命名错题';
      if (this.data.recognitionResult) {
        // 从识别结果中提取前20个字符作为标题
        title = this.data.recognitionResult.substring(0, 20) + (this.data.recognitionResult.length > 20 ? '...' : '');
      }
      
      // 构建错题数据
      const questionData = {
        imageUrl: this.data.question.imageUrl,
        subject: this.data.subjects[this.data.subjectIndex],
        difficulty: this.data.difficulty,
        knowledgePoints: this.data.knowledgePoints,
        errorReason: this.data.errorReason,
        notes: this.data.notes,
        recognitionResult: this.data.recognitionResult,
        timestamp: new Date().getTime(),
        title: title,
        status: 'pending' // 默认为待掌握状态
      };
      
      // 读取现有错题数据
      const allMistakes = wx.getStorageSync('mistakes') || '[]';
      let mistakesArray = JSON.parse(allMistakes);
      
      // 如果是编辑已有错题
      if (this.data.isEditMode && this.data.question.id) {
        // 查找并更新已有错题
        const index = mistakesArray.findIndex(item => item.id === this.data.question.id);
        if (index > -1) {
          // 保留原有ID和状态
          questionData.id = this.data.question.id;
          questionData.status = mistakesArray[index].status || 'pending';
          // 更新错题
          mistakesArray[index] = questionData;
        } else {
          // 未找到对应ID，作为新增处理
          questionData.id = this.generateUniqueId();
          mistakesArray.push(questionData);
        }
      } else {
        // 新增错题
        questionData.id = this.generateUniqueId();
        mistakesArray.push(questionData);
      }
      
      // 保存到本地存储
      wx.setStorageSync('mistakes', JSON.stringify(mistakesArray));
      
      // 隐藏加载提示
      wx.hideLoading();
      
      // 提示保存成功
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          // 延迟返回，让用户看到提示
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      });
    } catch (e) {
      console.error('保存错题失败', e);
      wx.hideLoading();
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  /**
   * 生成唯一ID
   */
  generateUniqueId: function() {
    return 'mistake_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 9);
  },

  /**
   * 取消
   */
  onCancel: function() {
    wx.navigateBack();
  }
}) 