const PROVINCE_ORDER = [
  '北京市', '天津市', '上海市', '重庆市',
  '河北省', '山西省', '辽宁省', '吉林省',
  '黑龙江省', '江苏省', '浙江省', '安徽省',
  '福建省', '江西省', '山东省', '河南省',
  '湖北省', '湖南省', '广东省', '海南省',
  '四川省', '贵州省', '云南省', '陕西省',
  '甘肃省', '青海省', '内蒙古', '广西',
  '西藏', '宁夏', '新疆'
];

const DEFAULT_OIL_DATA = [
  {
    regionName: '北京市', date: '2026-07-18',
    n92: 7.42, n92Change: 0.24,
    n95: 7.90, n95Change: 0.26,
    n98: 9.40, n98Change: 0.26,
    n0: 7.12, n0Change: 0.25
  },
  {
    regionName: '天津市', date: '2026-07-18',
    n92: 7.41, n92Change: 0.24,
    n95: 7.83, n95Change: 0.26,
    n98: 9.33, n98Change: 0.26,
    n0: 7.07, n0Change: 0.25
  },
  {
    regionName: '河北省', date: '2026-07-18',
    n92: 7.41, n92Change: 0.24,
    n95: 7.83, n95Change: 0.26,
    n98: 8.65, n98Change: 0.26,
    n0: 7.07, n0Change: 0.25
  },
  {
    regionName: '山西省', date: '2026-07-18',
    n92: 7.37, n92Change: 0.24,
    n95: 7.96, n95Change: 0.26,
    n98: 9.14, n98Change: 0.26,
    n0: 7.14, n0Change: 0.25
  },
  {
    regionName: '辽宁省', date: '2026-07-18',
    n92: 7.48, n92Change: 0.25,
    n95: 8.00, n95Change: 0.27,
    n98: 8.76, n98Change: 0.29,
    n0: 6.98, n0Change: 0.25
  }
];

function sortProvinces(dataArray) {
  return dataArray.sort((a, b) => {
    const ia = PROVINCE_ORDER.indexOf(a.regionName);
    const ib = PROVINCE_ORDER.indexOf(b.regionName);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

function getFallbackProvinceList() {
  return PROVINCE_ORDER;
}

module.exports = { sortProvinces, getFallbackProvinceList, DEFAULT_OIL_DATA };