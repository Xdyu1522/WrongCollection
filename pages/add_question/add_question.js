// add_question.js
const app = getApp()

Page({
  data: {
    cameraAuth: false,
    cameraDevice: 'back',
    cameraFlash: 'off',
    isPreview: false,
    photoSrc: '',
    hasTakePhoto: false,
    // 错题信息表单
    showForm: false,
    formData: {
      title: '',
      subject: '',
      tags: [],
      errorReason: '',
      status: 'not-mastered',
      statusText: '未掌握'
    },
    // 学科选项
    subjects: ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'],
    // 标签选项
    tagOptions: [
      '公式', '定理', '概念', '计算', '实验', '阅读', '写作', '听力', '口语',
      '力学', '电学', '光学', '热学', '有机', '无机', '细胞', '遗传', '进化',
      '经济', '政治', '文化', '科技', '古代', '近代', '现代', '自然', '人文'
    ],
    selectedTags: []
  },

  onLoad() {
    // 检查相机权限
    this.checkCameraAuth()
  },

  // 检查相机权限
  checkCameraAuth() {
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.camera']) {
          this.setData({ cameraAuth: false })
        } else {
          this.setData({ cameraAuth: true })
        }
      }
    })
  },

  // 请求相机权限
  requestCameraAuth() {
    wx.authorize({
      scope: 'scope.camera',
      success: () => {
        this.setData({ cameraAuth: true })
      },
      fail: () => {
        wx.showModal({
          title: '提示',
          content: '请在设置中开启相机权限',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting()
            }
          }
        })
      }
    })
  },

  // 切换闪光灯
  switchFlash() {
    const flashModes = ['off', 'on', 'auto']
    const currentIndex = flashModes.indexOf(this.data.cameraFlash)
    const nextIndex = (currentIndex + 1) % flashModes.length
    this.setData({
      cameraFlash: flashModes[nextIndex]
    })
  },

  // 切换摄像头
  switchCamera() {
    this.setData({
      cameraDevice: this.data.cameraDevice === 'back' ? 'front' : 'back'
    })
  },

  // 从相册选择
  chooseFromAlbum() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        this.setData({
          photoSrc: res.tempFilePaths[0],
          isPreview: true,
          hasTakePhoto: true
        })
      }
    })
  },

  // 拍照
  takePhoto() {
    const ctx = wx.createCameraContext()
    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        this.setData({
          photoSrc: res.tempImagePath,
          isPreview: true,
          hasTakePhoto: true
        })
      },
      fail: () => {
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        })
      }
    })
  },

  // 重新拍照
  retakePhoto() {
    this.setData({
      isPreview: false,
      photoSrc: '',
      hasTakePhoto: false
    })
  },

  // 使用照片
  usePhoto() {
    this.setData({
      showForm: true
    })
  },

  // 表单输入处理
  onTitleInput(e) {
    this.setData({
      'formData.title': e.detail.value
    })
  },

  // 选择学科
  onSubjectChange(e) {
    this.setData({
      'formData.subject': this.data.subjects[e.detail.value]
    })
  },

  // 选择标签
  onTagSelect(e) {
    const tag = e.currentTarget.dataset.tag
    const selectedTags = [...this.data.selectedTags]
    const index = selectedTags.indexOf(tag)
    
    if (index > -1) {
      selectedTags.splice(index, 1)
    } else {
      if (selectedTags.length < 3) {
        selectedTags.push(tag)
      } else {
        wx.showToast({
          title: '最多选择3个标签',
          icon: 'none'
        })
        return
      }
    }
    
    this.setData({
      selectedTags,
      'formData.tags': selectedTags
    })
  },

  // 错误原因输入
  onErrorReasonInput(e) {
    this.setData({
      'formData.errorReason': e.detail.value
    })
  },

  // 保存错题
  saveQuestion() {
    const { formData, photoSrc } = this.data
    
    // 表单验证
    if (!formData.title.trim()) {
      wx.showToast({
        title: '请输入错题标题',
        icon: 'none'
      })
      return
    }
    
    if (!formData.subject) {
      wx.showToast({
        title: '请选择学科',
        icon: 'none'
      })
      return
    }
    
    if (!formData.errorReason.trim()) {
      wx.showToast({
        title: '请输入错误原因',
        icon: 'none'
      })
      return
    }

    // 获取当前时间
    const now = new Date()
    const date = this.formatDate(now)
    
    // 构建错题数据
    const questionData = {
      id: Date.now(), // 使用时间戳作为唯一ID
      ...formData,
      date,
      image: photoSrc
    }

    // 获取现有错题列表
    const questions = wx.getStorageSync('questions') || []
    
    // 添加新错题
    questions.unshift(questionData)
    
    // 保存到本地存储
    wx.setStorageSync('questions', questions)
    
    // 更新全局数据
    if (app.globalData.questions) {
      app.globalData.questions.unshift(questionData)
    }
    
    wx.showToast({
      title: '保存成功',
      icon: 'success',
      duration: 2000,
      success: () => {
        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack()
        }, 2000)
      }
    })
  },

  // 格式化日期
  formatDate(date) {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return '今天'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天'
    } else {
      const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24))
      return `${diff}天前`
    }
  }
}) 