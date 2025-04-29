# 使用官方 Node.js 镜像作为基础镜像（推荐 Alpine 版本以减小体积）
FROM node:18-alpine

# 设置容器内的工作目录（后续命令将在此目录下执行）
WORKDIR /app

# 优先复制 package.json 和 package-lock.json（利用 Docker 层缓存加速构建）
COPY package*.json ./

# 安装生产依赖（非 devDependencies）
RUN npm install --production

# 复制项目所有文件到容器的工作目录
COPY . .

# 暴露服务监听的端口（与 server.js 中的端口一致，例如 3000）
EXPOSE 3000

# 定义容器启动命令
CMD ["node", "server.js"]