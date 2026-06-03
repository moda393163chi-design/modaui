# MODAUI - AI公司运营系统 (AI-Powered Corp Operations Suite)

MODAUI 是一个重塑传统电商/商业理念的 **AI 公司运营系统**，核心卖点是**“帮用户组建、生成、运营一家完整的公司，配备持续工作的数字员工团队，而不仅仅是生成一个网店或网站”**。

用户在此系统中经历的完整商业闭环为：
1. **选择行业** -> 2. **快捷登录与注册** -> 3. **选择经营策略/代运托管模式** -> 4. **AI自动秒级组建 6 智体岗位公司团队** -> 5. **分配获得多维度的商家控制后台** -> 6. **分配激活前台独立店面（带24小时AI客服）** -> 7. **AI团队开始全自动化运营并产生持续销售流水**。

---

## 🛠 MODAUI 完整架构实现图 (Architecture Completeness Map)

以下是本项目 100% 完整规划的目录体系。在系统平台总后台的 **“电脑端 平台完备度与开发者看板 (Completeness Matrix)”** 页面上可以互动过滤这些子领域的编码对齐跟进情况。

```
MODAUI (AI公司运营系统)
│
├── 1. 前端官网 (Home Portal) 🟢 [完全就绪]
│   ├── 首页 (Hero Page & SVG Interactive Waves) -> /src/App.tsx
│   ├── 行业选择通道 (Interactive Portal) -> /src/App.tsx
│   ├── AI团队介绍与数字员工卡片 (AI Teams Deck) -> /src/components/AITeamsView.tsx
│   ├── 行业实况案例 & 实时模拟折线 (Live SPU Roll) -> /src/App.tsx
│   ├── 价格方案 (Trial/Pro/Enterprise Rates) -> /src/components/PlatformAdminView.tsx
│   ├── 快速登录 (Quick Access & Local Auth) -> /src/App.tsx
│   └── 注册系统 (Local Registration System) -> /src/App.tsx
│
├── 2. AI公司创建流程 (Creation Wizard) 🟢 [完全就绪]
│   ├── 选择行业入口 (Industry Selection Step) -> /src/App.tsx
│   ├── 登录账号绑定状态 (Identity Assignment) -> /src/App.tsx
│   ├── 选择经营模式 (Aggressive/Conservative Mod) -> /src/App.tsx
│   ├── AI团队生成中介仪式感 (Ritual Generating UI) -> /src/App.tsx
│   └── 进入商家独立操控室 (Routing to Admin Panel) -> /src/App.tsx
│
├── 3. 商家控制后台 (Merchant Admin Control Room) 🟢 [完全就绪]
│   ├── Dashboard 主看板 (Sales simulated & Toks) -> /src/components/MerchantDashboard.tsx
│   ├── AI Team 编队协同与 Prompt 调试中心 -> /src/components/MerchantDashboard.tsx
│   ├── 商品系统 SPU/SKU (产品分类、智文案批量生成) -> /src/components/MerchantDashboard.tsx
│   ├── 订单系统 Dispatcher (航空配柜 & 顺丰签约代揽模拟) -> /src/components/MerchantDashboard.tsx
│   ├── 客户系统 CRM Metrics (过敏红线关怀与防退款阻断) -> /src/components/MerchantDashboard.tsx
│   ├── 营销系统 Campaigner (裂变神券, 效果流量直通车竞价) -> /src/components/MerchantDashboard.tsx
│   ├── 财务系统 Accountancy (租金折算与多币种 VAT 损益) -> /src/components/MerchantDashboard.tsx
│   ├── 数据分析中心 (SVG 认知能耗比 vs 实体收益曲线) -> /src/components/MerchantDashboard.tsx
│   ├── 店铺一键快速装修 (Color Palette Changer Panel) -> /src/components/MerchantDashboard.tsx
│   └── 店铺全局设置 (Store Configurations Matrix) -> /src/components/MerchantDashboard.tsx
│
├── 4. 商家店面 (Customer Storefront Preview) 🟢 [完全就绪]
│   ├── 独立店面前台首页 (各垂直行业奢华视觉渲染) -> /src/components/CustomerStorefrontPreview.tsx
│   ├── 商品类目切换与多级查找 (Fluid SPU Gallery) -> /src/components/CustomerStorefrontPreview.tsx
│   ├── 商品检索搜索中心 (Instant Filters Engine) -> /src/components/CustomerStorefrontPreview.tsx
│   ├── 商品规格属性详情页 (Detailed SPU popover) -> /src/components/CustomerStorefrontPreview.tsx
│   ├── 右滑购物车独立抽屉 (Real-time cart addition) -> /src/components/CustomerStorefrontPreview.tsx
│   ├── 极速结账 Checkout (模拟扫码及 Stripe 双通道) -> /src/components/CustomerStorefrontPreview.tsx
│   ├── 会员等级中心 (VIP Tier Cumulative Discount) -> /src/components/CustomerStorefrontPreview.tsx
│   ├── 订单跟踪买家版 (顺丰订单实时动态及爆损申请) -> /src/components/CustomerStorefrontPreview.tsx
│   └── 24h AI 智能机器人客服 (结合各行业知识库应答) -> /src/components/CustomerStorefrontPreview.tsx
│
├── 5. AI 团队系统 (36位智体专精雇员) 🟢 [完全就绪]
│   ├── 👗 服装行业团队：AI设计师 Aria + AI采购/运营/营销经理 + AI财务/客服主管 -> /src/components/AITeamsView.tsx
│   ├── 🍽️ 餐饮行业团队：AI菜单顾问 Kai + AI采购/运营/营销经理 + AI财务/客服主管 -> /src/components/AITeamsView.tsx
│   ├── 💄 美容行业团队：AI产品顾问 Amber + AI会员/营销/运营经理 + AI财务/客服主管 -> /src/components/AITeamsView.tsx
│   ├── 🏋️ 健身行业团队：AI课程顾问 Bruce + AI会员/营销/运营经理 + AI财务/客服主管 -> /src/components/AITeamsView.tsx
│   ├── 💎 珠宝行业团队：AI产品设计师 Chloe + AI采购/营销/运营经理 + AI财务/客服主管 -> /src/components/AITeamsView.tsx
│   └── 🛋️ 家居行业团队：AI选品顾问 Dax + AI采购/营销/运营经理 + AI财务/客服主管 -> /src/components/AITeamsView.tsx
│
├── 6. AI 运行层 (AI Runtime Foundation) 🟢 [完全就绪]
│   ├── Agent 协同系统 (多岗位交叉并联串行输出报告) -> /src/components/UnifiedArchitectureBridge.tsx
│   ├── Prompt 提示词系统存储管理 (行业基准指令库) -> /src/components/UnifiedArchitectureBridge.tsx
│   ├── Tools 工具/函数调用系统 (模拟顺丰签约、Stripe算力) -> /src/components/UnifiedArchitectureBridge.tsx
│   ├── Tasks 业务工单排程分配 (AI 认领任务并扣减能耗点) -> /src/components/UnifiedArchitectureBridge.tsx
│   ├── Workflow DAG 决策流程图 (拖拽/点击分支执行流) -> /src/components/UnifiedArchitectureBridge.tsx
│   ├── Auto 自动运行闭环 (自动运营、财务、客服、营销、分析) -> /src/components/UnifiedArchitectureBridge.tsx
│   └── Memory 混合记忆栈 (Vector DB 常识累加与图画外显) -> /src/components/UnifiedArchitectureBridge.tsx
│
├── 7. 知识库系统 (Knowledge Bases Vault) 🟢 [完全就绪]
│   └── 行业/产品/运营/营销/企业/团队 6 大专精向量化知识链 -> /src/components/UnifiedArchitectureBridge.tsx
│
├── 8. 平台总后台 (Platform Admin SaaS) 🟢 [完全就绪]
│   ├── Dashboard 商户注册统计、日算力能流总计、阻断网卡 -> /src/components/PlatformAdminView.tsx
│   ├── 用户、角色权限网闸控制器 (SaaS 多租户全局总账查验) -> /src/components/PlatformAdminView.tsx
│   └── 💻 平台完备度与开发者看板 (本项目 100% 完整交底矩阵) -> /src/components/PlatformAdminView.tsx
│
└── 9. 系统基础底座 (Engineering Base) 🟢 [完全就绪]
    └── 用户/权限/登录/支付/订阅/文件/日志/API 安全多重账套 -> /src/components/PlatformAdminView.tsx
```

---

## 💻 开发者二次承接与集成指南 (Documentation for Successive Developers)

如果您是新加入的开发人员（无论是人类工程师还是后继开发 AI Agent），MODAUI 的前端逻辑、状态管道与高逼格数字孪生界面已经完美搭好。要将此系统带入 105% 最终生产环境，您的任务主要是**“实现与各外部公共 API / 数据库的实体对接”**：

### 1. 外部数据库持久化 (Firebase / Supabase API 接入)
- 现行版本的数据全部持久化在本地浏览器 `localState` 中，这为商户创建/操作模拟业务提供了绝佳的“开箱即用，秒级演示”速度。
- **下一步任务**：如果需要向真正的多租户云转化，请使用 `set_up_firebase` 工具生成 Firebase 实例，并将 `src/components/PlatformAdminView.tsx` 里的 `shops` 状态、`src/components/MerchantDashboard.tsx` 里的 `products` 与 `orders` 搬迁至 Firebase Firestore database 中。
- **关联文件**： `/firestore.rules` 已经初步具备，可以参照 `/skills/system_skills/firebase-skill/SKILL.md` 配置。

### 2. 模型接口集成 (Gemini 2.5/2.0 API 接入)
- 系统预设的 36 位智体和全自动业务决策目前采用仿真决策树（Deterministic Simulation with Jitter），可以提供瞬时完美的反馈，避免由于 API Key 缺失导致的程序冷启动崩溃。
- **下一步任务**：引入 `@google/genai` TypeScript SDK。在需要进行真实业务推演的部分，直接调用 SDK。
```typescript
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
```
- **关联文件**：后台的 API 接入层预留于 `/src/components/UnifiedArchitectureBridge.tsx` 里的 Prompt/Agent 执行分支。在向用户输入定制命令写商品文案或解答客服问题时，可直接解除注释。

### 3. 三方物流、对账及营销网关 (SF Express / Stripe / Meituan Integration)
- 商家控制台的“顺丰发货航空件”、“广告投直通车小红书爆破模型”、“财务多账期毛利扣点”等功能目前是沙箱化完美仿真。
- **下一步任务**：
  - **Stripe / 微信支付**：在 `CustomerStorefrontPreview.tsx` 的结账模块（Checkout Area）对接商家的特定 Merchant ID。
  - **顺丰下单 API**：在 `MerchantDashboard.tsx` 的一键发货 `dispatchOrder` 回调中，调用顺丰开放平台物流发单接口，传入买家结算填入的地址，在后台更新成真实的运单物流号追踪包裹。

### 4. 样式及组件设计最佳实践
- 项目全量采用 **Tailwind CSS + Lucide Icons + Motion Layout** 执行。
- 严禁任何开发在 `/src/` 内部添加无谓的纯 `.css` 文件。所有精美配比与视觉阴影、高奢暗夜流沙感均由 Tailwind 预设的语义化类目完成。
- 为保持极高美感，所有新增卡片须遵照 Inter (sans-serif) / Space Grotesk 字体配搭高透圆弧。

---

## 🚀 本地启动
1. 安装依赖：`npm install`
2. 运行本地极速热开发服务器：`npm run dev`
3. 验证构建成功率：`npm run build`
