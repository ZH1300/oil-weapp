// dateUtil.js
function getNextAdjustDate(currentDateStr) {
  const current = new Date(currentDateStr);
  if (isNaN(current.getTime())) current.setHours(0, 0, 0, 0);
  let daysAdded = 0;
  let nextDate = new Date(current);
  while (daysAdded < 10) {
    nextDate.setDate(nextDate.getDate() + 1);
    const day = nextDate.getDay();
    if (day !== 0 && day !== 6) daysAdded++;
  }
  return formatDate(nextDate);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function countdown(targetDateStr) {
  const target = new Date(targetDateStr);
  target.setHours(23, 59, 59, 999);
  const now = new Date();
  const diff = target - now;
  if (diff <= 0) return '已开始';

  const totalMinutes = Math.floor(diff / (1000 * 60));      // 总分钟数（向下取整）
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  let result = '还有 ';
  if (days > 0) {
    result += `${days} 天 ${hours} 小时 ${minutes} 分钟`;
  } else if (hours > 0) {
    result += `${hours} 小时 ${minutes} 分钟`;
  } else {
    result += `${minutes} 分钟`;
  }
  return result;
}

module.exports = { getNextAdjustDate, countdown };