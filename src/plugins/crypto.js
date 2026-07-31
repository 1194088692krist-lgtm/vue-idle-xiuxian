// 使用 CryptoJS 进行数据加密和解密
import CryptoJS from 'crypto-js'
import { compressSave, decompressSave } from '../utils/saveCompression'

const SECRET = 'vue-idle-xiuxian'

// 数据加密（对象）
export const encryptData = data => {
  try {
    const jsonStr = JSON.stringify(data)
    return CryptoJS.AES.encrypt(jsonStr, SECRET).toString()
  } catch (error) {
    console.error('数据加密失败:', error)
    return null
  }
}

// 数据解密（对象）
export const decryptData = encryptedData => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET)
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8)
    return JSON.parse(decryptedStr)
  } catch (error) {
    console.error('数据解密失败:', error)
    return null
  }
}

// 加密“原始字符串”（非 JSON.stringify 后的对象），供压缩链路复用
export const encryptString = str => {
  try {
    return CryptoJS.AES.encrypt(str, SECRET).toString()
  } catch (error) {
    console.error('字符串加密失败:', error)
    return null
  }
}

// 解密回“原始字符串”（不 JSON.parse），供压缩链路复用
export const decryptToString = encryptedData => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('字符串解密失败:', error)
    return null
  }
}

// 云存档压缩加密：先压明文 JSON 再加密。
// 关键：AES 密文是高熵数据，gzip 对其几乎压不动；必须拿到“明文 JSON”再压才有 8-12 倍收益。
// 失败降级为普通 encryptData，保证任何情况下都能上传（只是不省体积）。
export const compressEncrypt = async obj => {
  try {
    const json = JSON.stringify(obj)
    const compressed = await compressSave(json)
    return encryptString(compressed)
  } catch (e) {
    console.error('[compressEncrypt] 失败，降级为普通加密:', e)
    return encryptData(obj)
  }
}

// 已加密 blob -> 云端压缩格式：解密出明文 JSON -> gzip 压缩 -> 再加密。
// 用于 pushSlotToCloud 单一上传入口，无论调用方传入本地未压缩 blob 还是已压缩 blob 都能正确压缩。
export const recompressBlob = async blob => {
  try {
    const plain = decryptToString(blob)
    if (plain == null) return blob
    const compressed = await compressSave(plain)
    return encryptString(compressed)
  } catch (e) {
    console.error('[recompressBlob] 压缩失败，降级为原 blob 上传:', e)
    return blob
  }
}

// 云端压缩 blob -> 本地未压缩格式：解密 -> 解压 -> 再加密。
// 用于 fetchCloudSaves 单一下载入口，保证写入本地 GameDB 的仍是“普通加密 blob”，
// 下游 initializePlayer / decryptData / _slotInfo 等完全不用改，旧存档天然兼容。
export const toLocalBlob = async cloudBlob => {
  try {
    const plain = decryptToString(cloudBlob)
    if (plain == null) return cloudBlob
    const json = await decompressSave(plain)
    return encryptString(json)
  } catch (e) {
    console.error('[toLocalBlob] 转换失败，降级为原 blob:', e)
    return cloudBlob
  }
}

// 数据校验
export const validateData = data => {
  // 检查必要的数据字段
  const requiredFields = ['name', 'level', 'realm', 'cultivation', 'maxCultivation', 'spirit', 'baseAttributes']

  for (const field of requiredFields) {
    if (!(field in data)) {
      console.error(`数据验证失败: 缺少必要字段 ${field}`)
      return false
    }
  }

  // 检查数值的合理性
  if (data.level < 1 || data.cultivation < 0 || data.spirit < 0) {
    console.error('数据验证失败: 数值异常')
    return false
  }

  return true
}
