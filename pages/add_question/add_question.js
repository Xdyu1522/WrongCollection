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
    // 裁剪框相关数据
    cropFrameTop: 50,
    cropFrameLeft: 50,
    cropFrameWidth: 200,
    cropFrameHeight: 200,
    // 图片实际尺寸
    imageWidth: 0,
    imageHeight: 0,
    // 裁剪框操作相关
    touchStartX: 0,
    touchStartY: 0,
    frameTouchStartX: 0,
    frameTouchStartY: 0,
    frameTouchStartWidth: 0,
    frameTouchStartHeight: 0,
    isMovingFrame: false,
    activeCorner: '',
    activeEdge: '',
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

  // 图片加载完成后设置裁剪框初始位置
  onImageLoad(e) {
    const that = this;
    // 获取图片实际显示尺寸
    const query = wx.createSelectorQuery();
    query.select('.preview-image').boundingClientRect();
    query.exec((res) => {
      if (res && res[0]) {
        const containerRect = res[0];
        
        // 获取图片实际尺寸和显示尺寸
        wx.getImageInfo({
          src: that.data.photoSrc,
          success: function(imageInfo) {
            const imageRatio = imageInfo.width / imageInfo.height;
            const containerRatio = containerRect.width / containerRect.height;
            
            let imgShowWidth, imgShowHeight, imgShowLeft, imgShowTop;
            
            // 根据aspectFit模式计算实际显示尺寸和位置
            if (imageRatio > containerRatio) {
              // 图片比例更宽，将以容器宽度为准，高度会有空白
              imgShowWidth = containerRect.width;
              imgShowHeight = containerRect.width / imageRatio;
              imgShowLeft = 0;
              imgShowTop = (containerRect.height - imgShowHeight) / 2;
            } else {
              // 图片比例更高，将以容器高度为准，宽度会有空白
              imgShowHeight = containerRect.height;
              imgShowWidth = containerRect.height * imageRatio;
              imgShowTop = 0;
              imgShowLeft = (containerRect.width - imgShowWidth) / 2;
            }
            
            // 更新裁剪框为图片实际显示尺寸
            that.setData({
              imageWidth: imgShowWidth,
              imageHeight: imgShowHeight,
              cropFrameTop: imgShowTop,
              cropFrameLeft: imgShowLeft,
              cropFrameWidth: imgShowWidth,
              cropFrameHeight: imgShowHeight
            });
          },
          fail: function(err) {
            console.error("获取图片信息失败:", err);
            // 备用方案，使用容器尺寸
            that.setData({
              imageWidth: containerRect.width,
              imageHeight: containerRect.height,
              cropFrameTop: 0,
              cropFrameLeft: 0,
              cropFrameWidth: containerRect.width,
              cropFrameHeight: containerRect.height
            });
          }
        });
      }
    });
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
    const that = this;
    wx.showLoading({
      title: '处理中...',
    });
    
    // 获取图片信息
    wx.getImageInfo({
      src: that.data.photoSrc,
      success: function(imageInfo) {
        // 计算裁剪区域相对于原始图片的位置
        const originWidth = imageInfo.width;
        const originHeight = imageInfo.height;
        
        // 计算图片在显示时的缩放比例
        const scaleX = originWidth / that.data.imageWidth;
        const scaleY = originHeight / that.data.imageHeight;
        
        // 计算裁剪区域在原图中的位置
        const cropX = that.data.cropFrameLeft * scaleX;
        const cropY = that.data.cropFrameTop * scaleY;
        const cropWidth = that.data.cropFrameWidth * scaleX;
        const cropHeight = that.data.cropFrameHeight * scaleY;
        
        // 创建canvas上下文
        const ctx = wx.createCanvasContext('cropCanvas');
        
        // 为了确保裁剪准确，只将需要裁剪的区域绘制到canvas上
        // canvas尺寸为300x400，需要按比例计算
        const canvasWidth = 300;
        const canvasHeight = 400;
        
        // 计算裁剪区域占原图的比例
        const sx = cropX / originWidth;
        const sy = cropY / originHeight;
        const sWidth = cropWidth / originWidth;
        const sHeight = cropHeight / originHeight;
        
        // 在canvas上绘制需要裁剪的区域
        ctx.drawImage(
          that.data.photoSrc, 
          cropX,           // 原图裁剪起点x
          cropY,           // 原图裁剪起点y
          cropWidth,       // 原图裁剪宽度
          cropHeight,      // 原图裁剪高度
          0,               // canvas起点x
          0,               // canvas起点y
          canvasWidth,     // canvas绘制宽度
          canvasHeight     // canvas绘制高度
        );
        
        // 提交绘制
        ctx.draw(false, () => {
          // 从canvas导出图片
          wx.canvasToTempFilePath({
            canvasId: 'cropCanvas',
            x: 0,
            y: 0,
            width: canvasWidth,
            height: canvasHeight,
            destWidth: cropWidth, // 使用原始裁剪区域的尺寸
            destHeight: cropHeight,
            success: function(res) {
              // 更新裁剪后的图片
              that.setData({
                photoSrc: res.tempFilePath,
                showForm: true // 显示表单
              });
              wx.hideLoading();
            },
            fail: function(err) {
              console.error("裁剪失败:", err);
              wx.hideLoading();
              wx.showToast({
                title: '处理失败',
                icon: 'none'
              });
            }
          });
        });
      },
      fail: function(err) {
        console.error("获取图片信息失败:", err);
        wx.hideLoading();
        wx.showToast({
          title: '处理失败',
          icon: 'none'
        });
        // 如果裁剪失败，仍然显示表单
        that.setData({
          showForm: true
        });
      }
    });
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
  },

  // 裁剪框触摸开始
  cropFrameTouchStart: function(e) {
    const touch = e.touches[0];
    this.setData({
      touchStartX: touch.clientX,
      touchStartY: touch.clientY,
      frameTouchStartX: this.data.cropFrameLeft,
      frameTouchStartY: this.data.cropFrameTop,
      isMovingFrame: true
    });
  },
  
  // 裁剪框移动
  cropFrameTouchMove: function(e) {
    if (!this.data.isMovingFrame) return;
    
    const touch = e.touches[0];
    const moveX = touch.clientX - this.data.touchStartX;
    const moveY = touch.clientY - this.data.touchStartY;
    
    // 计算新位置，并确保不超出边界
    let newLeft = this.data.frameTouchStartX + moveX;
    let newTop = this.data.frameTouchStartY + moveY;
    
    // 边界检查
    newLeft = Math.max(0, Math.min(newLeft, this.data.imageWidth - this.data.cropFrameWidth));
    newTop = Math.max(0, Math.min(newTop, this.data.imageHeight - this.data.cropFrameHeight));
    
    this.setData({
      cropFrameLeft: newLeft,
      cropFrameTop: newTop
    });
  },
  
  // 裁剪框触摸结束
  cropFrameTouchEnd: function() {
    this.setData({
      isMovingFrame: false
    });
  },
  
  // 角落触摸开始
  cornerTouchStart: function(e) {
    const touch = e.touches[0];
    const position = e.currentTarget.dataset.position;
    
    this.setData({
      touchStartX: touch.clientX,
      touchStartY: touch.clientY,
      frameTouchStartX: this.data.cropFrameLeft,
      frameTouchStartY: this.data.cropFrameTop,
      frameTouchStartWidth: this.data.cropFrameWidth,
      frameTouchStartHeight: this.data.cropFrameHeight,
      activeCorner: position
    });
  },
  
  // 角落触摸移动
  cornerTouchMove: function(e) {
    if (!this.data.activeCorner) return;
    
    const touch = e.touches[0];
    const moveX = touch.clientX - this.data.touchStartX;
    const moveY = touch.clientY - this.data.touchStartY;
    
    let newLeft = this.data.frameTouchStartX;
    let newTop = this.data.frameTouchStartY;
    let newWidth = this.data.frameTouchStartWidth;
    let newHeight = this.data.frameTouchStartHeight;
    
    switch (this.data.activeCorner) {
      case 'top-left':
        newLeft = this.data.frameTouchStartX + moveX;
        newTop = this.data.frameTouchStartY + moveY;
        newWidth = this.data.frameTouchStartWidth - moveX;
        newHeight = this.data.frameTouchStartHeight - moveY;
        break;
      case 'top-right':
        newTop = this.data.frameTouchStartY + moveY;
        newWidth = this.data.frameTouchStartWidth + moveX;
        newHeight = this.data.frameTouchStartHeight - moveY;
        break;
      case 'bottom-left':
        newLeft = this.data.frameTouchStartX + moveX;
        newWidth = this.data.frameTouchStartWidth - moveX;
        newHeight = this.data.frameTouchStartHeight + moveY;
        break;
      case 'bottom-right':
        newWidth = this.data.frameTouchStartWidth + moveX;
        newHeight = this.data.frameTouchStartHeight + moveY;
        break;
    }
    
    // 确保裁剪框至少有最小尺寸
    const MIN_SIZE = 50;
    newWidth = Math.max(MIN_SIZE, newWidth);
    newHeight = Math.max(MIN_SIZE, newHeight);
    
    // 边界检查，确保不超出图片范围
    if (newLeft < 0) {
      newLeft = 0;
      newWidth = this.data.frameTouchStartWidth + this.data.frameTouchStartX;
    }
    
    if (newTop < 0) {
      newTop = 0;
      newHeight = this.data.frameTouchStartHeight + this.data.frameTouchStartY;
    }
    
    if (newLeft + newWidth > this.data.imageWidth) {
      newWidth = this.data.imageWidth - newLeft;
    }
    
    if (newTop + newHeight > this.data.imageHeight) {
      newHeight = this.data.imageHeight - newTop;
    }
    
    this.setData({
      cropFrameLeft: newLeft,
      cropFrameTop: newTop,
      cropFrameWidth: newWidth,
      cropFrameHeight: newHeight
    });
  },
  
  // 角落触摸结束
  cornerTouchEnd: function() {
    this.setData({
      activeCorner: ''
    });
  },
  
  // 边缘触摸开始
  edgeTouchStart: function(e) {
    const touch = e.touches[0];
    const position = e.currentTarget.dataset.position;
    
    this.setData({
      touchStartX: touch.clientX,
      touchStartY: touch.clientY,
      frameTouchStartX: this.data.cropFrameLeft,
      frameTouchStartY: this.data.cropFrameTop,
      frameTouchStartWidth: this.data.cropFrameWidth,
      frameTouchStartHeight: this.data.cropFrameHeight,
      activeEdge: position
    });
  },
  
  // 边缘触摸移动
  edgeTouchMove: function(e) {
    if (!this.data.activeEdge) return;
    
    const touch = e.touches[0];
    const moveX = touch.clientX - this.data.touchStartX;
    const moveY = touch.clientY - this.data.touchStartY;
    
    let newLeft = this.data.frameTouchStartX;
    let newTop = this.data.frameTouchStartY;
    let newWidth = this.data.frameTouchStartWidth;
    let newHeight = this.data.frameTouchStartHeight;
    
    switch (this.data.activeEdge) {
      case 'top':
        newTop = this.data.frameTouchStartY + moveY;
        newHeight = this.data.frameTouchStartHeight - moveY;
        break;
      case 'right':
        newWidth = this.data.frameTouchStartWidth + moveX;
        break;
      case 'bottom':
        newHeight = this.data.frameTouchStartHeight + moveY;
        break;
      case 'left':
        newLeft = this.data.frameTouchStartX + moveX;
        newWidth = this.data.frameTouchStartWidth - moveX;
        break;
    }
    
    // 确保裁剪框至少有最小尺寸
    const MIN_SIZE = 50;
    newWidth = Math.max(MIN_SIZE, newWidth);
    newHeight = Math.max(MIN_SIZE, newHeight);
    
    // 边界检查，确保不超出图片范围
    if (newLeft < 0) {
      newLeft = 0;
      newWidth = this.data.frameTouchStartWidth + this.data.frameTouchStartX;
    }
    
    if (newTop < 0) {
      newTop = 0;
      newHeight = this.data.frameTouchStartHeight + this.data.frameTouchStartY;
    }
    
    if (newLeft + newWidth > this.data.imageWidth) {
      newWidth = this.data.imageWidth - newLeft;
    }
    
    if (newTop + newHeight > this.data.imageHeight) {
      newHeight = this.data.imageHeight - newTop;
    }
    
    this.setData({
      cropFrameLeft: newLeft,
      cropFrameTop: newTop,
      cropFrameWidth: newWidth,
      cropFrameHeight: newHeight
    });
  },
  
  // 边缘触摸结束
  edgeTouchEnd: function() {
    this.setData({
      activeEdge: ''
    });
  },
}) 