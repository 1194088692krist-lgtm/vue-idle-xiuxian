#!/bin/bash
# 回滚脚本：用于紧急回滚到上一个稳定版本
# 用法：./scripts/rollback.sh [tag|commit]
# 示例：
#   ./scripts/rollback.sh              # 回滚到上一个稳定 tag（v1.5.0-stable）
#   ./scripts/rollback.sh v1.4.0       # 回滚到指定 tag
#   ./scripts/rollback.sh 4db39b0      # 回滚到指定 commit

set -e

cd "$(dirname "$0")/.."

# 当前分支
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "当前分支: $CURRENT_BRANCH"

# 稳定 tag 列表（按时间倒序，最新的在前）
STABLE_TAGS=(
  "v1.5.0-stable"
  "v1.4.0-stable"
  "v1.3.0-stable"
)

# 确定回滚目标
TARGET="$1"
if [ -z "$TARGET" ]; then
  # 默认回滚到最新的稳定 tag
  TARGET="${STABLE_TAGS[0]}"
  echo "未指定回滚目标，默认回滚到: $TARGET"
fi

# 验证目标存在
if ! git rev-parse "$TARGET" >/dev/null 2>&1; then
  echo "❌ 错误：找不到目标 '$TARGET'"
  echo ""
  echo "可用的稳定 tag："
  git tag -l 'v*-stable' | sort -Vr | head -10
  echo ""
  echo "最近的 commit："
  git log --oneline -10
  exit 1
fi

echo ""
echo "⚠️  即将回滚到: $TARGET"
echo "当前未提交的改动将被 stash，请确认后继续"
echo ""
read -p "确认回滚？(y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "已取消"
  exit 0
fi

# 1. Stash 未提交的改动
if ! git diff-index --quiet HEAD; then
  echo "📦 暂存未提交的改动..."
  git stash push -m "rollback-backup-$(date +%Y%m%d_%H%M%S)"
fi

# 2. 创建备份分支
BACKUP_BRANCH="rollback-backup-$(date +%Y%m%d_%H%M%S)"
echo "📌 创建备份分支: $BACKUP_BRANCH"
git branch "$BACKUP_BRANCH"

# 3. 回滚
echo "⏪ 正在回滚..."
git checkout "$TARGET"

# 4. 重新安装依赖（如果有 lock 文件变化）
if [ -f "package-lock.json" ]; then
  echo "📦 检查依赖..."
  npm install --prefer-offline 2>/dev/null || npm install
fi

# 5. 重新构建
echo "🔨 重新构建..."
npm run build

echo ""
echo "✅ 回滚完成！"
echo ""
echo "当前版本: $(git log --oneline -1)"
echo "备份分支: $BACKUP_BRANCH（如需恢复，执行 git checkout $BACKUP_BRANCH）"
echo ""
echo "如需推送到远程："
echo "  git push --force-with-lease origin $CURRENT_BRANCH"