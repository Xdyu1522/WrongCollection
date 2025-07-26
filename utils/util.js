// 格式化时间为 YYYY/MM/DD HH:MM:SS
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

// 格式化数字，确保两位数
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// 格式化日期为相对时间（今天/昨天/X天前）
const formatRelativeDate = date => {
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

// 获取状态文本
const getStatusText = status => {
  const statusMap = {
    'not-mastered': '未掌握',
    'review': '需复习',
    'mastered': '已掌握',
    'pending': '待处理'
  }
  return statusMap[status] || '未掌握'
}

// 存储管理工具
const storage = {
  // 获取存储数据
  get: function(key, defaultValue = null) {
    try {
      const value = wx.getStorageSync(key)
      return value !== '' ? value : defaultValue
    } catch (e) {
      console.error(`获取存储 ${key} 失败:`, e)
      return defaultValue
    }
  },
  
  // 设置存储数据
  set: function(key, value) {
    try {
      wx.setStorageSync(key, value)
      return true
    } catch (e) {
      console.error(`设置存储 ${key} 失败:`, e)
      return false
    }
  },
  
  // 删除存储数据
  remove: function(key) {
    try {
      wx.removeStorageSync(key)
      return true
    } catch (e) {
      console.error(`删除存储 ${key} 失败:`, e)
      return false
    }
  }
}

module.exports = {
  formatTime,
  formatNumber,
  formatRelativeDate,
  getStatusText,
  storage
}
