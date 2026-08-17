// pages/ranking/ranking.js
const { getOilPrice } = require('../../utils/oilService');
const { OIL_TYPES, buildRanking } = require('../../utils/ranking');

const RANK_PENDING_KEY = 'ranking_pending_province';

Page({
  data: {
    oilTypes: OIL_TYPES,
    currentType: 'n92',
    ranking: [],
    dataDate: '',
    highest: null,
    lowest: null,
    loading: true,
    error: false,
    usingCache: false,
    usingDefault: false
  },
  _refreshing: false,
  _allData: [],

  onLoad() {
    this.initData();
  },

  async initData() {
    this.setData({ loading: true, error: false, usingCache: false, usingDefault: false });
    try {
      const { data: sortedData, source } = await getOilPrice();
      if (source === 'cache') {
        this.setData({ usingCache: true });
      } else if (source === 'default') {
        this.setData({ usingDefault: true });
      }
      this._allData = sortedData;
      const first = sortedData.find(item => item && item.date);
      this.setData({
        dataDate: first ? first.date : '',
        loading: false,
        error: false
      });
      this.applyRanking();
    } catch (err) {
      console.error('[油查查New] 排行榜初始化失败:', err);
      this.setData({ loading: false, error: true });
    }
  },

  applyRanking() {
    const ranking = buildRanking(this._allData, this.data.currentType);
    this.setData({
      ranking,
      highest: ranking.length ? ranking[0] : null,
      lowest: ranking.length ? ranking[ranking.length - 1] : null
    });
  },

  onSwitchType(e) {
    const type = e.currentTarget.dataset.type;
    if (!type || type === this.data.currentType) return;
    this.setData({ currentType: type });
    this.applyRanking();
  },

  onPullDownRefresh() {
    if (this._refreshing) return;
    this._refreshing = true;
    const stopTimer = setTimeout(() => {
      this._refreshing = false;
      wx.stopPullDownRefresh();
      wx.showToast({ title: '刷新超时', icon: 'none' });
    }, 8000);
    this.initData()
      .then(() => {
        clearTimeout(stopTimer);
        this._refreshing = false;
        wx.stopPullDownRefresh();
      })
      .catch(() => {
        clearTimeout(stopTimer);
        this._refreshing = false;
        wx.stopPullDownRefresh();
      });
  },

  // 点击省份 -> 切回首页并选中该省
  onTapProvince(e) {
    const province = e.currentTarget.dataset.province;
    if (!province) return;
    wx.setStorageSync(RANK_PENDING_KEY, province);
    wx.switchTab({ url: '/pages/index/index' });
  },

  onRetry() {
    this.initData();
  },

  // ========== 分享功能 ==========
  onShareAppMessage() {
    return {
      title: '📊 全国油价排行榜，看看各地油价排第几',
      path: '/pages/ranking/ranking'
    };
  },
  onShareTimeline() {
    return {
      title: '📊 全国油价排行榜，看看各地油价排第几'
    };
  }
});
