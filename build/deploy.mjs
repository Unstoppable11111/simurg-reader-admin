import { NodeSSH } from "node-ssh";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const host = "111.228.38.154";
const username = "root";
const password = process.env.SERVER_PWD;
const targetDir = "/www/wwwroot/simurg-admin";
const backupDir = "/www/backup/simurg-admin";
const localArchive = "dist.tar.gz";
const remoteTmpArchive = `/tmp/simurg-admin-dist-${Date.now()}.tar.gz`;

if (!password) {
  console.error("❌ 错误：未读取到 SERVER_PWD 环境变量！请在 Gitee 流水线【通用变量】中确认！");
  process.exit(1);
}

if (!fs.existsSync(localArchive)) {
  console.error(`❌ 错误：未找到构建压缩包 ${localArchive}！请确认打包步骤已生成该文件。`);
  process.exit(1);
}

const stats = fs.statSync(localArchive);
const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

const ssh = new NodeSSH();

async function run() {
  console.log(`🚀 开始连接服务器 ${host}...`);
  await ssh.connect({
    host,
    username,
    password,
    readyTimeout: 30000
  });
  console.log("✅ 服务器连接成功！");

  // 1. 上传构建压缩包（单文件秒级上传）
  console.log(`📦 正在推送产物包 ${localArchive} (${fileSizeMB} MB) 到服务器...`);
  const uploadStart = Date.now();
  await ssh.putFile(localArchive, remoteTmpArchive);
  const uploadDuration = ((Date.now() - uploadStart) / 1000).toFixed(1);
  console.log(`⚡ 传输完成！耗时: ${uploadDuration}s`);

  // 2. 远端执行：自动备份最近3次快照 + 解压覆盖部署 + 刷新宝塔权限
  console.log("🔄 正在执行：历史快照备份 (保留最近3次) 与 原子解压部署...");
  const deployScript = `
    set -e
    TARGET_DIR="${targetDir}"
    BACKUP_DIR="${backupDir}"
    TMP_ARCHIVE="${remoteTmpArchive}"

    # 1. 若当前存在线上版本，则自动创建快照备份（保留最近 3 个历史版本）
    if [ -f "$TARGET_DIR/index.html" ]; then
      mkdir -p "$BACKUP_DIR"
      BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).tar.gz"
      tar -czf "$BACKUP_FILE" -C "$TARGET_DIR" . 2>/dev/null || true
      echo "==> 已成功创建当前版本快照备份: $BACKUP_FILE"
      # 保留最近 3 次备份，清理多余的旧版本
      cd "$BACKUP_DIR"
      (ls -t backup_*.tar.gz 2>/dev/null || true) | tail -n +4 | xargs -r rm -f
    fi

    # 2. 解压新产物至目标站点目录并清理临时压缩包
    mkdir -p "$TARGET_DIR"
    tar -xzf "$TMP_ARCHIVE" -C "$TARGET_DIR/"
    rm -f "$TMP_ARCHIVE"

    # 3. 刷新目录时间戳与宝塔 www 权限
    touch "$TARGET_DIR"
    chown -R www:www "$TARGET_DIR"
    chmod -R 755 "$TARGET_DIR"

    echo "==> 当前可供回滚的历史备份清单："
    ls -lh "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null || echo "(首个版本部署)"
  `;

  const result = await ssh.execCommand(deployScript);
  if (result.stdout) {
    console.log(result.stdout.trim());
  }
  if (result.code !== 0) {
    console.error("❌ 远程部署命令执行失败:", result.stderr);
    process.exit(1);
  }

  console.log("🎉 自动化部署全部完成！新版本已上线。");
  ssh.dispose();
}

run().catch(err => {
  console.error("❌ 部署异常:", err);
  process.exit(1);
});
