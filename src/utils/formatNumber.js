/**
 * 统一数字格式化：
 * - 数值 >= 10000 时，按 (n/10000) 显示为 "x万"，保留一位小数并去掉末尾 .0
 * - 否则返回 Math.floor(n).toLocaleString()
 */
export const formatNumber = (num) => {
  const n = Number(num) || 0
  if (n >= 10000) {
    return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  }
  return Math.floor(n).toLocaleString()
}
