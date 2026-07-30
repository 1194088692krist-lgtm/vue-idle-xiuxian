/**
 * 统一数字格式化：
 * - 数值 >= 1e8 时，按 (n/1e8) 显示为 "x亿"，保留一位小数并去掉末尾 .0
 * - 数值 >= 1e4 时，按 (n/1e4) 显示为 "x万"，保留一位小数并去掉末尾 .0
 * - 否则返回 Math.floor(n).toLocaleString()
 */
export const formatNumber = (num) => {
  const n = Number(num) || 0
  if (n >= 1e8) {
    return (n / 1e8).toFixed(1).replace(/\.0$/, '') + '亿'
  }
  if (n >= 10000) {
    return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  }
  return Math.floor(n).toLocaleString()
}
