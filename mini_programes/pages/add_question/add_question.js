// add_question.js
Page({
  data: {
    photoSrc: '', // 照片路径
    cameraCtx: null, // 相机上下文
    cameraDevice: 'back', // 相机设备，默认后置
    cameraFlash: 'auto', // 闪光灯
    isPreview: false, // 是否预览状态
    processing: false, // 是否处理中
    cameraAuth: false, // 相机授权状态
  },
  
  onLoad() {
    // 检查相机授权
    this.checkCameraAuth();
  },
  
  onReady() {
    // 创建相机上下文
    if (this.data.cameraAuth) {
      this.initCamera();
    }
  },
  
  // 检查相机授权
  checkCameraAuth() {
    wx.authorize({
      scope: 'scope.camera',
      success: () => {
        this.setData({ cameraAuth: true });
        this.initCamera();
      },
      fail: () => {
        this.setData({ cameraAuth: false });
        wx.showModal({
          title: '提示',
          content: '需要您授权相机权限才能拍照记录错题',
          confirmText: '去授权',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting({
                success: (authRes) => {
                  if (authRes.authSetting['scope.camera']) {
                    this.setData({ cameraAuth: true });
                    this.initCamera();
                  }
                }
              });
            }
          }
        });
      }
    });
  },
  
  // 初始化相机
  initCamera() {
    this.setData({
      cameraCtx: wx.createCameraContext()
    });
  },
  
  // 拍照
  takePhoto() {
    if (!this.data.cameraCtx || this.data.processing) {
      return;
    }
    
    this.setData({ processing: true });
    
    // 拍照
    this.data.cameraCtx.takePhoto({
      quality: 'high',
      success: (res) => {
        // 拍照成功，显示预览
        this.setData({
          photoSrc: res.tempImagePath,
          isPreview: true,
          processing: false
        });
      },
      fail: (err) => {
        console.error('拍照失败', err);
        this.setData({ processing: false });
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 切换摄像头
  switchCamera() {
    this.setData({
      cameraDevice: this.data.cameraDevice === 'back' ? 'front' : 'back'
    });
  },
  
  // 切换闪光灯
  switchFlash() {
    const flashModes = ['auto', 'on', 'off'];
    const currentIndex = flashModes.indexOf(this.data.cameraFlash);
    const nextIndex = (currentIndex + 1) % flashModes.length;
    
    this.setData({
      cameraFlash: flashModes[nextIndex]
    });
  },
  
  // 从相册选择
  chooseFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        if (res.tempFiles && res.tempFiles.length > 0) {
          this.setData({
            photoSrc: res.tempFiles[0].tempFilePath,
            isPreview: true
          });
        }
      }
    });
  },
  
  // 重新拍照
  retakePhoto() {
    this.setData({
      photoSrc: '',
      isPreview: false
    });
  },
  
  // 使用照片
  usePhoto() {
    if (!this.data.photoSrc) {
      wx.showToast({
        title: '请先拍照',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '正在处理...',
    });
    
    // 保存临时图片到本地
    this.saveImageToLocal(this.data.photoSrc, (savedPath) => {
      wx.hideLoading();
      
      // 跳转到错题详情页面进行编辑
      wx.navigateTo({
        url: `../question_detail/question_detail?photo=${encodeURIComponent(savedPath)}`
      });
    });
  },
  
  // 保存图片到本地
  saveImageToLocal(tempFilePath, callback) {
    // 获取本地存储目录
    const fs = wx.getFileSystemManager();
    // 生成保存路径
    const timestamp = new Date().getTime();
    const savedPath = `${wx.env.USER_DATA_PATH}/${timestamp}.jpg`;
    
    // 保存文件
    fs.saveFile({
      tempFilePath: tempFilePath,
      filePath: savedPath,
      success: (res) => {
        callback(res.savedFilePath);
      },
      fail: (err) => {
        console.error('保存图片失败', err);
        // 失败时直接使用临时路径
        callback(tempFilePath);
      }
    });
  },
  
  // 返回上一页
  navigateBack() {
    wx.navigateBack();
  }
}) 