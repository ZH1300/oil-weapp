/**
 * 全国油价排行榜工具
 * 按油品类型对省份价格排序（价格从高到低）
 */

const OIL_TYPES = [
  { key: 'n92', label: '92#', field: 'n92', changeField: 'n92Change' },
  { key: 'n95', label: '95#', field: 'n95', changeField: 'n95Change' },
  { key: 'n98', label: '98#', field: 'n98', changeField: 'n98Change' },
  { key: 'n0', label: '0#柴油', field: 'n0', changeField: 'n0Change' }
];

const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * 构建排行榜列表
 * @param {Array} data 省份油价数组
 * @param {string} oilKey OIL_TYPES 中的 key
 * @returns {Array} [{ rank, rankClass, rankIcon, regionName, price, changeText, trendClass, isTop3 }]
 */
function buildRanking(data, oilKey) {
  const type = OIL_TYPES.find(t => t.key === oilKey) || OIL_TYPES[0];
  const list = data
    .filter(item => item && typeof item[type.field] === 'number')
    .map(item => ({
      regionName: item.regionName,
      price: item[type.field],
      change: item[type.changeField] || 0
    }))
    .sort((a, b) => b.price - a.price || b.change - a.change);

  return list.map((item, index) => {
    const rank = index + 1;
    const isTop3 = rank <= 3;
    const change = item.change;
    const trendClass = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
    let changeText = '→ 持平';
    if (change > 0) changeText = `↑+${change.toFixed(2)}`;
    else if (change < 0) changeText = `↓${Math.abs(change).toFixed(2)}`;

    return {
      rank,
      rankClass: isTop3 ? `top-${rank}` : '',
      rankIcon: isTop3 ? MEDALS[rank - 1] : '',
      regionName: item.regionName,
      price: item.price.toFixed(2),
      changeText,
      trendClass,
      isTop3
    };
  });
}

module.exports = { OIL_TYPES, buildRanking };
