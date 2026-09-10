# 🎬 AI 漫剧智能体

6个AI Agent协作，一键生成漫剧剧本、分镜、图片、视频。

## ✨ 功能特性

- 🤖 **6个AI Agent协作流水线**：导演→编剧→角色设计→分镜师→视频制作
- 📝 **智能剧本生成**：三幕结构、人物弧光、完整对白
- 🎨 **角色DNA设计**：8维特征（脸型、发型、服装、配色等），确保人物一致
- 🖼️ **分镜出图**：16:9横屏，统一风格，实时预览
- 🎥 **视频生成**：基于分镜图生成动态视频
- 📱 **响应式设计**：手机电脑都能用
- 🔒 **API Key 安全**：存在后端环境变量，不暴露给前端

## 🚀 快速开始

### 1. 安装依赖

```bash
cd ai-drama-studio
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`，填入你的 API Key：

```bash
cp .env.example .env.local
```

### 3. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 `http://localhost:3000`

## 🌐 部署到 Vercel（推荐）

1. 把这个项目推送到你的 GitHub 仓库
2. 登录 [Vercel](https://vercel.com)
3. 点击 "Add New..." → "Project"
4. 导入你的 GitHub 仓库
5. 在 "Environment Variables" 里填入 API 配置
6. 点击 "Deploy"，等待部署完成
7. 部署成功后会得到一个 `xxx.vercel.app` 的公网网址

## 📁 项目结构

```
ai-drama-studio/
├── app/
│   ├── api/generate/route.ts  # 完整生成 API（SSE流式返回进度）
│   ├── globals.css              # 全局样式
│   ├── layout.tsx               # 根布局
│   └── page.tsx                 # 首页（创作+进度+结果）
├── lib/
│   ├── agents/                  # 6个Agent
│   ├── api.ts                   # API 调用工具函数
│   ├── orchestrator.ts          # 编排器
│   └── types.ts                 # 类型定义
└── ...
```

## ⚠️ 注意事项

1. **API Key 安全**：API Key 只存在后端环境变量中
2. **生成成本**：图片和视频生成会消耗 API 额度
3. **生成时间**：完整生成（含图片）通常需要 2-5 分钟
4. **人物一致性**：通过角色DNA和统一风格后缀尽量保持一致

## 📄 许可证

MIT License
