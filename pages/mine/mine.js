// pages/mine/mine.js
const CACHE_KEY = 'oil_price_cache';
const PROVINCE_CACHE_KEY = 'last_province';
const RANK_PENDING_KEY = 'ranking_pending_province';
const RECENT_KEY = 'recent_provinces';

const VERSION = '1.5.0';

function pad2(n) {
  return String(n).padStart(2, '0');
}

Page({
  data: {
    recentProvinces: [],
    dataUpdateTime: '',
    version: VERSION
  },

  onShow() {
    // 首次渲染前调用 setData 可能触发渲染层错误
    // （Expected updated data but get first rendering data）
    // 因此首次加载交由 onReady（渲染完成后）处理，onShow 仅负责后续返回刷新
    if (this._ready) {
      this.refreshData();
    }
  },

  onReady() {
    this._ready = true;
    this.refreshData();
  },

  // 刷新页面展示数据（最近查看 + 更新时间）
  refreshData() {
    this.loadRecentProvinces();
    this.loadDataUpdateTime();
  },

  // 最近查看的省份
  loadRecentProvinces() {
    const list = wx.getStorageSync(RECENT_KEY) || [];
    this.setData({ recentProvinces: list });
  },

  // 缓存中油价数据的更新时间
  loadDataUpdateTime() {
    const cache = wx.getStorageSync(CACHE_KEY);
    if (cache && cache.timestamp) {
      const d = new Date(cache.timestamp);
      this.setData({
        dataUpdateTime: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
      });
    } else {
      this.setData({ dataUpdateTime: '' });
    }
  },

  // 跳转首页并选中该省份
  onGoProvince(e) {
    const province = e.currentTarget.dataset.province;
    if (!province) return;
    wx.setStorageSync(PROVINCE_CACHE_KEY, province);
    wx.setStorageSync(RANK_PENDING_KEY, province);
    wx.switchTab({ url: '/pages/index/index' });
  },

  // 意见反馈
  showFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '感谢您的使用！\n欢迎通过以下方式联系我们：\n\n📧 me@imzh.cn\n💬 微信：E310500',
      confirmText: '复制微信',
      cancelText: '取消',
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({ data: 'oilcheck' });
        }
      }
    });
  },

  /**
   * 关于对话框
   */
  showAbout() {
    wx.showModal({
      title: '关于油查查',
      content: `油查查New v${VERSION}，一款便捷查看全国各地最新油价的小工具。\n数据来源于公开渠道，仅供参考。\n\n开发者：I'm ZH`,
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#e74c3c',
    });
  },

  /**
   * 清除缓存（油价数据 + 记忆省份 + 最近查看记录）
   */
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '将清除本地缓存的油价数据、记忆的省份及最近查看记录，下次打开需重新获取。',
      confirmText: '确定清除',
      cancelText: '取消',
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync(CACHE_KEY);
            wx.removeStorageSync(PROVINCE_CACHE_KEY);
            wx.removeStorageSync(RECENT_KEY);
            wx.showToast({
              title: '缓存已清除',
              icon: 'success',
              duration: 1500
            });
            this.loadRecentProvinces();
            this.loadDataUpdateTime();
          } catch (e) {
            wx.showToast({
              title: '清除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // ========== 分享功能 ==========
  onShareAppMessage() {
    return {
      title: '⛽ 油查查 - 全国油价查询小工具',
      path: '/pages/index/index'
    };
  },
  onShareTimeline() {
    return {
      title: '⛽ 油查查 - 全国油价查询小工具'
    };
  }
});