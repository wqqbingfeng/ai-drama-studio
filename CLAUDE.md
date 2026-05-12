# AI Drama Studio — 多 Agent 制片框架

基于浏览器的 AI Agent 框架，用于 AI 真人剧制作。用户输入想法或剧本，6 个专业 AI Agent 自动协作完成从编剧到后期合成的完整流程。

## 启动方式

```bash
# 一键启动（代理 + 前端）
npm run dev:full

# 或分步启动：
npm run proxy    # 终端 1：本地 CORS 代理 (端口 5174)
npm run dev      # 终端 2：Vite 开发服务器 (端口 5173)
```

访问 `http://localhost:5173`，打开设置（齿轮图标），确保中转站地址为 `http://127.0.0.1:5174`（一键填入按钮可用）。

## 为什么需要 proxy.mjs？

cc-switch 虽然有 CORS 响应头（`Access-Control-Allow-Origin: *`），但**拒绝浏览器的 OPTIONS 预检请求（返回 405）**。浏览器在发送带 `Content-Type: application/json` 的 POST 前必须先发 OPTIONS，被拒绝后直接拦截所有请求。

`proxy.mjs`（端口 5174）做两件事：
1. 拦截 OPTIONS → 直接返回 204（浏览器满意）
2. 转发 POST 到 `http://127.0.0.1:15721/v1/chat/completions`（cc-switch）

如果 cc-switch 端口不是 15721，修改 `proxy.mjs` 顶部的 `TARGET` 常量。

## 技术栈

- Vite 8 + React 19 + TypeScript 6
- Tailwind CSS v4（`@tailwindcss/vite` 插件，非 PostCSS）
- oklch 色彩空间，Space Grotesk + Inter 字体
- Zustand 全局状态管理
- Framer Motion 动画
- lucide-react 图标

## 项目结构

```
ai-drama-studio/
├── proxy.mjs              # cc-switch 本地 CORS 代理（独立 Node 脚本）
├── vite.config.ts         # Vite 配置（仅 react + tailwindcss 插件）
├── index.html             # 入口 HTML
├── public/                # 静态资源（当前为空）
└── src/
    ├── main.tsx           # React 入口
    ├── App.tsx            # 顶层：制作/控制台 标签切换 + 暗色模式切换
    ├── index.css          # Tailwind v4 入口 + 自定义 oklch 主题 + 暗/亮模式
    ├── agent-core/        # Agent 运行时引擎
    │   ├── base-agent.ts   # BaseAgent 抽象类 + AgentContext 接口 + parseJsonStrict
    │   ├── orchestrator.ts # 流水线编排器：DAG 依赖、审查循环、re-run、动态 import
    │   ├── types.ts        # AgentConstructor 类型
    │   └── agents/         # 6 个专业 Agent
    │       ├── screenwriter.ts         # 编剧 → Script（角色+对白+分场）
    │       ├── character-designer.ts   # 角色设计师 → CharacterCardOutput
    │       ├── scene-designer.ts       # 场景设计师 → SceneDesign
    │       ├── director.ts            # 导演 → Storyboard（含 review() 覆盖）
    │       ├── cinematographer.ts     # 摄影指导 → 镜头参数
    │       └── post-production.ts     # 后期合成 → 制作包（尝试调 generateImage）
    ├── gateway/           # API 适配层
    │   ├── gateway.ts      # IGateway 接口 + 所有类型定义
    │   ├── gemini-adapter.ts # 文本推理（支持中转站模式 + Gemini 直连模式）
    │   ├── gpt-image-adapter.ts  # GPT Image 2 适配器（桩）
    │   ├── seedance-adapter.ts   # Seedance 2.0 适配器（桩）
    │   └── index.ts        # GatewayRouter（门面，延迟加载适配器）
    ├── models/            # TypeScript 类型定义（纯类型，无逻辑）
    │   ├── production.ts   # AgentRole, AgentOutput, ProductionPlan
    │   ├── script.ts       # Script, ScriptCharacter, ScriptScene, SceneDialogue
    │   ├── character.ts    # CharacterCard, CharacterCardOutput
    │   ├── scene.ts        # SceneDesign
    │   └── storyboard.ts   # Shot, Storyboard
    ├── state/             # 全局状态
    │   └── store.ts        # Zustand store + useAgentOutput hook
    └── ui/                # React 前端
        ├── pages/
        │   ├── ProductionPage.tsx  # 制作主页（输入+设置+Agent网格+日志+产物）
        │   └── AgentConsole.tsx    # 控制台（管线图+Agent详情+导出）
        └── components/
            ├── AgentCard.tsx       # Agent 状态卡片
            ├── ArtifactPanel.tsx   # 产物 JSON 查看器
            ├── Timeline.tsx        # 执行日志时间线
            └── ModelSwitcher.tsx   # 模型切换器（含测速功能）
```

## 核心架构

### Agent 执行流水线（DAG）

```
screenwriter (编剧)
  ├─→ character_designer (角色设计师)
  ├─→ scene_designer (场景设计师)
  └─→ director (导演) ← 也依赖 character_designer
        └─→ cinematographer (摄影指导)
              └─→ post_production (后期合成) ← 也依赖 scene_designer, character_designer
```

- 默认**串行执行**（`orchestrator.ts` 的 `PRODUCTION_FLOW` 常量）
- 每个 Agent 输出结构化 JSON 到 Zustand store
- 下游 Agent 通过 `ctx.getArtifact<T>(role)` 消费上游产出
- 导演 Agent 覆盖了 `review()` 方法，审核编剧产出后可触发重跑

### Agent 基类模式

每个 Agent = `systemPrompt + run(ctx) + 可选的 review()`。
- `run()` 调用 `this.thinkJson<T>(ctx, messages)` 与 LLM 交互
- `review()` 让下游 Agent 审核上游产出质量
- 所有 Agent 文件用 `export default class` 导出，orchestrator 通过动态 `import()` 加载

### Gateway 模式

`GatewayRouter`（`src/gateway/index.ts`）按能力路由：
- `think()` → `GeminiAdapter`（支持中转站 OpenAI 兼容格式 + Gemini 原生 API）
- `generateImage()` → `GptImageAdapter`（**桩**，等待 API）
- `generateVideo()` → `SeedanceAdapter`（**桩**，等待 API）

### 状态管理

单一 Zustand store（`useProductionStore`）：
- `plan`, `outputs`, `logs`, `isRunning`, `currentAgent`, `notification`
- `editingOutput` + `clearDownstreamOutputs` 支持人工干预和重跑

### 人工干预

点击完成的 Agent 卡片 → 编辑 JSON → "保存并从此重新执行" → 清除下游 → 自动重跑

## 关键约定

1. **Agent 命名**：代码中 `AgentRole` 用蛇形命名法（`character_designer`），文件名用短横线命名法（`character-designer.ts`）。`orchestrator.ts` 的 `loadAgent()` 会做转换：`role.replace(/_/g, '-')`

2. **动态导入**：所有 Agent 类和 Gateway 适配器都通过动态 `import()` 延迟加载。必须用 `export default class`。

3. **端点归一化**：三处（`gemini-adapter.ts`, `modelSwitcher.tsx`, `productionPage.tsx`）各有一份 `normalizeEndpoint` 逻辑。规则：代理端口 `:5174` 或 `/api/` 路径不修改；其余自动追加 `/v1/chat/completions`。如需改规则，**三处都要同步**。

4. **localStorage 键名**：
   - `ai-drama-studio-config` — 端点+密钥+模型
   - `ai-drama-studio-selected-model` — 当前选中模型
   - `ai-drama-studio-models` — 模型列表（含测速数据）
   - `ai-drama-studio-theme` — 暗/亮模式偏好

5. **中文优先**：所有 Agent system prompt、UI 文本、日志消息都用中文。错误消息尽量中文。API 调用本身不受影响。

6. **禁止 verbatimModuleSyntax**：`tsconfig.app.json` 中已移除，确保 `import X` 而不是 `import type { X }` 不会导致编译错误。

## 已知问题和待办

| 优先级 | 内容 |
|--------|------|
| 🔴 高 | `gpt-image-adapter.ts` — 实现 GPT Image 2 API 调用 |
| 🔴 高 | `seedance-adapter.ts` — 实现 Seedance 2.0 API 调用 |
| 🟡 中 | `post-production.ts` — 一旦图像/视频 API 就绪，就可以调用 `ctx.gateway.generateImage/Video()` |
| 🟡 中 | `cinematographer.ts` — `run()` 使用了裸的 `thinkJson()` 而没有泛型类型参数（返回 unknown） |
| 🟢 低 | 三处 `normalizeEndpoint` 逻辑重复 — 可以提取到共享工具函数 |
| 🟢 低 | `parseJsonStrict` 在 base-agent.ts 中 — 对于某些 LLM 响应可能需要更健壮的 JSON 修复 |
| 🟢 低 | productionPage.tsx 是最大的文件（381 行）— 可以考虑拆分设置模态框和编辑模态框 |

## cc-switch 集成说明

- 项目地址：https://github.com/farion1231/cc-switch
- cc-switch 本地代理默认端口：用户通常配置为 15721（可自定义）
- 本项目代理（proxy.mjs）默认端口：5174
- 三者关系：浏览器 → proxy.mjs(5174) → cc-switch(15721) → AI 提供商
- 如需更换 cc-switch 端口，修改 `proxy.mjs` 第 8 行的 `TARGET.port`
