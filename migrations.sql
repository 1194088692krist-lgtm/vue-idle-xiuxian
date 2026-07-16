-- 凡人修仙（挂机）· 账号 / 云存档 / GM 礼包 数据库结构
-- 适用于 Cloudflare D1（SQLite 兼容）。执行：wrangler d1 execute DB --file=./migrations.sql

-- 玩家账号：明文密码，仅用于区分用户（已与产品确认接受该简化）
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   TEXT UNIQUE NOT NULL,   -- 即"用户ID"，登录名
  password   TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- 在线存档：5 个槽位全同步。slot 0 = 当前活动档(playerData)，1..5 = 手动槽位
CREATE TABLE IF NOT EXISTS saves (
  user_id    INTEGER NOT NULL,
  slot       INTEGER NOT NULL,          -- 0..5
  data       TEXT NOT NULL,             -- 加密 blob（沿用前端 crypto-js，服务端不可读）
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, slot)
);

-- 礼包收件箱
CREATE TABLE IF NOT EXISTS gift_inbox (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  items_json TEXT NOT NULL,             -- 礼包内容（资源增量，见 functions/api/_utils.js 的 validateItems）
  message    TEXT,
  created_at INTEGER NOT NULL,
  claimed    INTEGER DEFAULT 0
);

-- GM 账号（高权限，发礼包用），由运维手动写入
CREATE TABLE IF NOT EXISTS gm_accounts (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL                  -- 明文即可；如需更稳可预先 hash
);

-- GM 凭证表：gm_tokens 校验系统核心
CREATE TABLE IF NOT EXISTS gm_tokens (
  token        TEXT PRIMARY KEY,
  gm_account_id INTEGER NOT NULL,
  label        TEXT,
  created_at   INTEGER NOT NULL,
  expires_at   INTEGER                        -- NULL = 永久有效
);
