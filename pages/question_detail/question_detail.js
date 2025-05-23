const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    question: null,
    isEditing: false,
    answerInputMode: 'text', // 默认为文字输入模式
    editForm: {
      title: '',
      subject: '',
      tags: [],
      status: 'not-mastered',
      errorReason: '',
      answerType: '',
      answer: '',
      answerList: [],
      answerImage: '' // 添加答案图片字段
    },
    subjects: ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'],
    answerTypes: [
      { id: 'choice', name: '选择题' },
      { id: 'fill', name: '填空题' },
      { id: 'normal', name: '解答题' }
    ],
    subjectIndex: 0,
    answerTypeIndex: 0,
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
    const id = parseInt(options.id)
    this.loadQuestion(id)
  },

  /**
   * 加载错题数据
   */
  loadQuestion(id) {
    const questions = wx.getStorageSync('questions') || []
    const question = questions.find(q => q.id === id)
    
    if (question) {
      this.setData({
        question,
        editForm: {
          title: question.title,
          subject: question.subject,
          tags: [...question.tags],
          status: question.status || 'not-mastered',
          errorReason: question.errorReason,
          answerType: question.answerType || 'normal',
          answer: question.answer || '',
          answerList: question.answerList || [],
          answerImage: question.answerImage || ''
        },
        answerInputMode: question.answerImage ? 'image' : 'text',
        subjectIndex: this.data.subjects.indexOf(question.subject) > -1 ? 
                      this.data.subjects.indexOf(question.subject) : 0,
        answerTypeIndex: this.getAnswerTypeIndex(question.answerType),
        difficulty: question.difficulty || 'medium',
        knowledgePoints: question.knowledgePoints || [],
        errorReason: question.errorReason || '',
        notes: question.notes || '',
        recognitionResult: question.recognitionResult || '',
        isLoading: false
      })
    } else {
      wx.showToast({
        title: '找不到错题数据',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  /**
   * 获取答案类型索引
   */
  getAnswerTypeIndex(type) {
    if (!type) return 2; // 默认为解答题
    const index = this.data.answerTypes.findIndex(t => t.id === type);
    return index > -1 ? index : 2;
  },

  /**
   * 选择答案类型
   */
  selectAnswerType(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({
      'editForm.answerType': type,
      // 切换类型时重置答案
      'editForm.answer': '',
      'editForm.answerList': []
    });
  },

  /**
   * 更新填空题答案
   */
  updateFillAnswer(e) {
    const { index } = e.currentTarget.dataset;
    const value = e.detail.value;
    const answerList = [...this.data.editForm.answerList];
    
    // 更新指定索引的答案
    answerList[index] = value;
    
    this.setData({
      'editForm.answerList': answerList
    });
  },

  /**
   * 添加填空
   */
  addFillBlank() {
    const answerList = [...this.data.editForm.answerList, ''];
    this.setData({
      'editForm.answerList': answerList
    });
  },

  /**
   * 删除填空
   */
  removeFillBlank(e) {
    const { index } = e.currentTarget.dataset;
    const answerList = [...this.data.editForm.answerList];
    answerList.splice(index, 1);
    
    this.setData({
      'editForm.answerList': answerList
    });
  },

  /**
   * 切换编辑模式
   */
  toggleEdit() {
    this.setData({
      isEditing: !this.data.isEditing
    })
  },

  /**
   * 更新表单数据
   */
  updateForm(e) {
    const { field } = e.currentTarget.dataset
    const value = e.detail.value
    
    this.setData({
      [`editForm.${field}`]: value
    })
  },

  /**
   * 更新标签
   */
  updateTags(e) {
    const tags = e.detail.value.split(',').map(tag => tag.trim()).filter(tag => tag)
    this.setData({
      'editForm.tags': tags
    })
  },

  /**
   * 保存修改
   */
  saveChanges() {
    const { question, editForm } = this.data
    
    // 表单验证
    if (!editForm.title.trim()) {
      wx.showToast({
        title: '请输入错题标题',
        icon: 'none'
      })
      return
    }
    
    if (!editForm.subject) {
      wx.showToast({
        title: '请选择学科',
        icon: 'none'
      })
      return
    }
    
    // 更新错题数据
    const questions = wx.getStorageSync('questions') || []
    const updatedQuestions = questions.map(q => {
      if (q.id === question.id) {
        return {
          ...q,
          ...editForm,
          statusText: this.getStatusText(editForm.status)
        }
      }
      return q
    })
    
    // 保存到本地存储
    wx.setStorageSync('questions', updatedQuestions)
    
    // 更新全局数据
    app.globalData.questions = updatedQuestions
    
    // 显示保存成功提示
    wx.showToast({
      title: '保存成功',
      icon: 'success',
      duration: 1500,
      success: () => {
        // 延迟返回，让用户看到提示
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    })
  },

  /**
   * 获取状态文本
   */
  getStatusText(status) {
    const statusMap = {
      'not-mastered': '未掌握',
      'review': '需复习',
      'mastered': '已掌握'
    }
    return statusMap[status] || '未掌握'
  },

  /**
   * 预览图片
   */
  previewImage: function() {
    if (this.data.question && this.data.question.image) {
      wx.previewImage({
        urls: [this.data.question.image]
      });
    }
  },

  /**
   * 预览答案图片
   */
  previewAnswerImage: function() {
    if (this.data.question && this.data.question.answerImage) {
      wx.previewImage({
        urls: [this.data.question.answerImage]
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
  },

  // 删除错题
  deleteQuestion() {
    const { question } = this.data
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这道错题吗？',
      success: (res) => {
        if (res.confirm) {
          const questions = wx.getStorageSync('questions') || []
          const updatedQuestions = questions.filter(q => q.id !== question.id)
          
          // 保存到本地存储
          wx.setStorageSync('questions', updatedQuestions)
          
          // 更新全局数据
          app.globalData.questions = updatedQuestions
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
          
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      }
    })
  },

  /**
   * 选择掌握状态
   */
  selectStatus(e) {
    const { status } = e.currentTarget.dataset
    this.setData({
      'editForm.status': status
    })
  },

  /**
   * 选择学科
   */
  selectSubject(e) {
    const { subject } = e.currentTarget.dataset
    this.setData({
      'editForm.subject': subject
    })
  },

  /**
   * 设置答案输入模式
   */
  setAnswerInputMode(e) {
    const { mode } = e.currentTarget.dataset;
    this.setData({
      answerInputMode: mode
    });
  },

  /**
   * 选择答案图片
   */
  chooseAnswerImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        // 更新表单中的图片路径
        this.setData({
          'editForm.answerImage': tempFilePath
        });
      }
    });
  }
}) 