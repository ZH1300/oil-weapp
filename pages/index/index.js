// pages/index/index.js
const { getOilPrice } = require('../../utils/oilService');
const { getNextAdjustDate, countdown } = require('../../utils/dateUtil');
const { getFallbackProvinceList } = require('../../utils/provinces');

const PROVINCE_CACHE_KEY = 'last_province';
const RANK_PENDING_KEY = 'ranking_pending_province';
const RECENT_KEY = 'recent_provinces';
const MAX_RECENT = 5;

/**
 * 记录最近查看的省份（去重，保留最近 MAX_RECENT 个）
 */
function recordRecentProvince(province) {
  const list = wx.getStorageSync(RECENT_KEY) || [];
  const next = [province, ...list.filter(p => p !== province)].slice(0, MAX_RECENT);
  wx.setStorageSync(RECENT_KEY, next);
}

Page({
  data: {
    selectedProvince: '',
    provinceList: [],
    currentPrice: null,
    currentDate: '',
    nextAdjustDate: '',
    countdownText: '',
    allProvinceData: [],
    loading: true,
    error: false,
    usingCache: false,
    usingDefault: false,
    showProvincePicker: false,
    tempSelectedProvince: '',
    filteredProvinces: [],
    searchKeyword: ''
  },
  _refreshing: false,
  __isActive: false,
  _shareProvince: null, // 暂存分享带来的省份参数

  onLoad(options) {
    // 若从分享打开，options 中可能有 province 和 price
    if (options.province) {
      this._shareProvince = decodeURIComponent(options.province);
    }
    this.initPage();
  },

  onShow() {
    this.__isActive = true;

    // 处理从排行榜页跳转过来的省份选择
    const pendingProvince = wx.getStorageSync(RANK_PENDING_KEY);
    if (pendingProvince) {
      wx.removeStorageSync(RANK_PENDING_KEY);
      if (this.data.allProvinceData.length > 0) {
        this.applyProvince(pendingProvince);
      } else {
        this._shareProvince = pendingProvince;
        if (!this.data.loading) {
          this.initPage();
        }
      }
    }

    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this.updateCountdown();
    this._timer = setInterval(() => {
      if (this.__isActive) this.updateCountdown();
    }, 60000);
  },

  onHide() {
    this.__isActive = false;
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  onUnload() {
    this.__isActive = false;
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  onPullDownRefresh() {
    // 省份选择弹窗打开时禁止任何页面操作（含下拉刷新）
    if (this.data.showProvincePicker) {
      wx.stopPullDownRefresh();
      return;
    }
    if (this._refreshing) return;
    this._refreshing = true;
    const stopTimer = setTimeout(() => {
      this._refreshing = false;
      wx.stopPullDownRefresh();
      console.warn('[油查查New] 刷新超时');
      wx.showToast({ title: '刷新超时', icon: 'none' });
    }, 8000);
    this.initPage()
      .then(() => {
        clearTimeout(stopTimer);
        this._refreshing = false;
        wx.stopPullDownRefresh();
      })
      .catch(() => {
        clearTimeout(stopTimer);
        this._refreshing = false;
        wx.stopPullDownRefresh();
        console.error('[油查查New] 刷新失败');
      });
  },

  async initPage() {
    wx.showLoading({ title: '获取最新油价', mask: true });
    this.setData({
      loading: true, error: false,
      usingCache: false, usingDefault: false
    });

    try {
      const { data: sortedData, source } = await getOilPrice();
      if (source === 'cache') {
        this.setData({ usingCache: true });
        wx.showToast({ title: '网络异常，显示缓存', icon: 'none' });
      } else if (source === 'default') {
        this.setData({ usingDefault: true });
        wx.showToast({ title: '网络异常，显示参考数据', icon: 'none' });
      }

      const provinceList = sortedData.map(item => item.regionName).filter(Boolean);
      
      // 处理分享参数：如果有分享省份，优先使用
      let targetProvince = null;
      if (this._shareProvince && provinceList.includes(this._shareProvince)) {
        targetProvince = this._shareProvince;
        this._shareProvince = null; // 使用后清除
      }

      // 如果没有分享省份，尝试读取缓存
      if (!targetProvince) {
        const lastProvince = wx.getStorageSync(PROVINCE_CACHE_KEY);
        if (lastProvince && provinceList.includes(lastProvince)) {
          targetProvince = lastProvince;
        }
      }

      if (targetProvince) {
        this.setData({
          provinceList,
          allProvinceData: sortedData,
          loading: false,
          showProvincePicker: false
        });
        wx.hideLoading();
        this.applyProvince(targetProvince);
        return;
      }

      // 无任何记忆省份，显示全屏选择器（隐藏 tabBar，防止切到排行榜绕过选择）
      this.setData({
        provinceList,
        allProvinceData: sortedData,
        loading: false,
        showProvincePicker: true,
        tempSelectedProvince: provinceList[0] || '',
        filteredProvinces: provinceList,
        searchKeyword: ''
      });
      wx.hideTabBar({ animation: false });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      console.error('[油查查New] 初始化失败:', err);
      this.setData({
        loading: false,
        error: true,
        provinceList: getFallbackProvinceList()
      });
    }
  },

  onProvinceChange(e) {
    const province = this.data.provinceList[e.detail.value];
    this.applyProvince(province);
  },

  applyProvince(province) {
    const priceData = this.data.allProvinceData.find(item => item.regionName === province);
    if (!priceData) return;
    const wasPickerOpen = this.data.showProvincePicker;
    this.setData({
      selectedProvince: province,
      currentPrice: priceData,
      currentDate: priceData.date,
      nextAdjustDate: getNextAdjustDate(priceData.date),
      showProvincePicker: false
    });
    // 全屏省份选择完成/跳过，恢复 tabBar
    if (wasPickerOpen) {
      wx.showTabBar({ animation: false });
    }
    wx.setStorageSync(PROVINCE_CACHE_KEY, province);
    recordRecentProvince(province);
    this.updateCountdown();
  },

  // ========== 省份选择弹窗（列表式） ==========
  // catchtouchmove 依赖此空处理函数拦截触摸移动，防止弹窗背后的页面滚动
  noop() {},

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.updateFilteredProvinces(keyword);
  },

  onClearSearch() {
    this.setData({ searchKeyword: '' });
    this.updateFilteredProvinces('');
  },

  updateFilteredProvinces(keyword) {
    const kw = (keyword || '').trim();
    const list = this.data.provinceList;
    const filtered = kw ? list.filter(p => p.indexOf(kw) !== -1) : list;
    this.setData({ filteredProvinces: filtered });
    // 若当前选中项不在过滤结果中，自动选中第一个过滤结果
    const cur = this.data.tempSelectedProvince;
    if (cur && filtered.indexOf(cur) === -1 && filtered.length > 0) {
      this.setData({ tempSelectedProvince: filtered[0] });
    }
  },

  onTapProvince(e) {
    const province = e.currentTarget.dataset.province;
    if (province) {
      this.setData({ tempSelectedProvince: province });
    }
  },

  onConfirmProvince() {
    const province = this.data.tempSelectedProvince || this.data.provinceList[0] || '北京市';
    this.applyProvince(province);
  },

  onClosePicker() {
    const defaultProvince = this.data.provinceList[0] || '北京市';
    this.applyProvince(defaultProvince);
  },

  updateCountdown() {
    const { nextAdjustDate } = this.data;
    if (nextAdjustDate) {
      this.setData({ countdownText: countdown(nextAdjustDate) });
    }
  },

  onRetry() {
    this.initPage();
  },

  // ========== 分享功能 ==========
  // 组装分享标题：省份 + 92#/95#/98# 价格（每项带单位），可附加数据日期
  buildShareTitle(withDate) {
    const { selectedProvince, currentPrice } = this.data;
    const province = selectedProvince || '全国';
    let title = `⛽ ${province}`;
    if (currentPrice) {
      const prices = ['n92', 'n95', 'n98']
        .map(key => `${key.slice(1)}#${currentPrice[key] || '--'}元/升`)
        .join(' ');
      title += ` ${prices}`;
    }
    if (withDate && currentPrice && currentPrice.date) {
      title += ` (${currentPrice.date})`;
    }
    return title;
  },

  /**
   * 分享给好友/群聊
   * 路径附带省份和油价，接收方打开后可直接显示
   */
  onShareAppMessage() {
    const { selectedProvince, currentPrice } = this.data;
    const province = selectedProvince || '全国';
    const price = currentPrice?.n92 || '--';

    return {
      title: this.buildShareTitle(true),
      path: `/pages/index/index?province=${encodeURIComponent(province)}&price=${price}`,
      // 不设置 imageUrl，默认使用当前页面截图
    };
  },

  /**
   * 分享到朋友圈
   * query 附带省份和油价
   * 需基础库 2.11.3+，且必须同时配置 onShareAppMessage
   */
  onShareTimeline() {
    const { selectedProvince, currentPrice } = this.data;
    const province = selectedProvince || '全国';
    const price = currentPrice?.n92 || '--';

    return {
      title: this.buildShareTitle(false),
      query: `province=${encodeURIComponent(province)}&price=${price}`,
      // 不设置 imageUrl，默认使用当前页面截图
    };
  }
});