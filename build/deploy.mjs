import { NodeSSH } from "node-ssh";
import path from "node:path";
import process from "node:process";

const host = "111.228.38.154";
const username = "root";
const password = process.env.SERVER_PWD;
const targetDir = "/www/wwwroot/simurg-admin";

if (!password) {
  console.error("❌ 错误：未读取到 SERVER_PWD 环境变量！请在 Gitee 流水线【通用变量】中确认！");
  process.exit(1);
}

const ssh = new NodeSSH();

async function run() {
  console.log(`🚀 开始连接服务器 ${host}...`);
  await ssh.connect({
    host,
    username,
    password,
    readyTimeout: 30000
  });
  console.log("✅ 服务器连接成功！正在同步 dist 静态资源...");

  const failed = [];
  const successful = [];
  const status = await ssh.putDirectory("./dist", targetDir, {
    recursive: true,
    concurrency: 10,
    validate: itemPath => !path.basename(itemPath).startsWith("."),
    tick: (localPath, remotePath, error) => {
      if (error) failed.push(localPath);
      else successful.push(localPath);
    }
  });

  if (!status) {
    console.error("❌ 部分文件上传失败:", failed);
    process.exit(1);
  }

  console.log(`✅ 上传成功！共同步 ${successful.length} 个文件。`);
  console.log("🔧 正在刷新宝塔目录时间戳与 www 权限...");
  await ssh.execCommand(
    `touch ${targetDir} && chown -R www:www ${targetDir} && chmod -R 755 ${targetDir}`
  );
  console.log("🎉 自动化部署全部完成！");
  ssh.dispose();
}

run().catch(err => {
  console.error("❌ 部署异常:", err);
  process.exit(1);
});
