const { fetchOilPrice } = require('./api');
const { sortProvinces, DEFAULT_OIL_DATA } = require('./provinces');

const CACHE_KEY = 'oil_price_cache';

/**
 * 获取油价数据（三级回退：API → 本地缓存 → 内置默认数据）。
 * @returns {Promise<{ data: Array, source: 'api'|'cache'|'default' }>}
 *          data 已按省份固定顺序排序。
 */
async function getOilPrice() {
  let rawData;
  let source = 'api';

  try {
    rawData = await fetchOilPrice();
    wx.setStorageSync(CACHE_KEY, { data: rawData, timestamp: Date.now() });
  } catch (apiErr) {
    console.warn('[油查查New] API失败，尝试缓存:', apiErr);
    const cache = wx.getStorageSync(CACHE_KEY);
    if (cache && cache.data) {
      rawData = cache.data;
      source = 'cache';
    } else {
      rawData = DEFAULT_OIL_DATA;
      source = 'default';
    }
  }

  if (!Array.isArray(rawData) || rawData.length === 0) {
    throw new Error('无可用油价');
  }

  return { data: sortProvinces([...rawData]), source };
}

module.exports = { getOilPrice };
