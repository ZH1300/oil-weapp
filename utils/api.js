const BASE_URL = 'https://your-api.example.com/oilPrice';

let lastRequestTime = 0;
let lastRequestPromise = null;
const MIN_INTERVAL = 60000; // 60秒

function fetchOilPrice() {
  console.log('[查油价Now] API - 请求触发');
  const now = Date.now();

  // 若距离上次请求不足60秒且有缓存的Promise，直接复用
  if (lastRequestPromise && (now - lastRequestTime < MIN_INTERVAL)) {
    console.log('[查油价Now] API - 请求节流，复用上一次Promise');
    return lastRequestPromise;
  }

  // 发起新请求
  lastRequestTime = now;
  lastRequestPromise = new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL,
      method: 'GET',
      timeout: 8000,
      success(res) {
        if (res.statusCode !== 200) {
          console.error('[查油价Now] API - HTTP状态异常:', res.statusCode);
          reject(`服务器状态异常: ${res.statusCode}`);
          return;
        }
        const body = res.data;
        if (!body || body.code !== 200) {
          console.error('[查油价Now] API - 业务错误, code:', body?.code, body?.msg);
          reject(body?.msg || '接口返回业务错误');
          return;
        }
        if (!Array.isArray(body.data) || body.data.length === 0) {
          console.warn('[查油价Now] API - 数据为空');
          reject('油价数据为空');
          return;
        }
        console.log('[查油价Now] API - 成功，省份数:', body.data.length);
        resolve(body.data);
      },
      fail(err) {
        console.error('[查油价Now] API - 网络失败:', err);
        reject(err.errMsg || '网络请求失败');
      }
    });
  });

  // 请求结束后不清理 lastRequestPromise，使其可被复用直到超时
  // 为防止请求失败后一直缓存错误状态，我们可以在失败时重置，但节流逻辑下允许重试
  lastRequestPromise.catch(() => {
    // 如果请求失败，清除缓存，允许立即重试
    lastRequestPromise = null;
    lastRequestTime = 0;
  });

  return lastRequestPromise;
}

module.exports = { fetchOilPrice };