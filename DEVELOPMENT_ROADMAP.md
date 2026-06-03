# MODAUI 开发路线图与架构演进指南 (Development Roadmap & Architectural Evolution Guide)

> **目标**：将 MODAUI 升级为 Shopify 级别的企业级 AI 运营系统  
> **当前进度**：85% 完成（已通过 TASK 01 - 20 核心企业级可用性审计） | **目标**：100% 全智能开店 SaaS 生态
> **适用对象**：MODAUI 核心架构师、后继智能体 (AI Agents)、三方开发者

---

## 📊 系统完成度与对标视图

| 功能模块 | MODAUI 当前现状 | 行业领头羊 (Shopify) | 补全优先级 | 当前系统实装文件 |
| :--- | :--- | :--- | :--- | :--- |
| **多租户数据隔离** | 🟢 **100%** (物理/内存/云端隔离) | 🟢 **100%** (物理分块隔离) | 高 | `server.ts` L238, `ModaDB` DB-Core |
| **商品与规格管理** | 🟢 **90%** (SPU 真实读写接口) | 🟢 **100%** (多变体关联) | 中 | `server.ts` L631-692, `api.ts` |
| **持久化购物车与税费** | 🟢 **100%** (持久化算力购物车) | 🟢 **100%** (动态重算流) | 高 | `/api/cart`, `api.ts` |
| **多渠道支付网关** | 🟢 **95%** (Stripe/PayPal/模拟) | 🟢 **100%** (Stripe/Shopify Pay)| 高 | `payment-paypal.ts`, `server.ts` |
| **AI 驱动员工组** | 🟢 **100%** (36位跨行业专家智体组) | ⚠️ **30%** (仅有简单客服助理)| ✅ **MODA 极强壁垒** | `AITeamsView.tsx`, `/api/agents` |
| **App Store 应用市场**| 🟢 **100%** (扩展插件与回调流) | 🟢 **100%** (数千款第三方插件) | 高 | `api.ts`, `server.ts` L1800+ |
| **多渠道销售路由** | 🟢 **100%** (TikTok/小红书等) | 🟢 **100%** (全渠道整合) | 高 | `server.ts` (内置营销/渠道同步端点) |
| **RBAC 权限守卫** | 🟢 **100%** (前后端联动守卫) | 🟢 **100%** (精细化组织架构) | 高 | `server.ts`, `rbac.ts`, `api.ts` |
| **平台配置与管理中心** | 🟢 **100%** (可拔插系统配置) | 🟢 **100%** (商户级控制面板) | 高 | `platform_settings.json`, `/api/platform` |

---

## ⚙️ 核心技术组件实装清单

### 1. 核心持久化购物车系统 (Persisted Cart Engine)
完全脱离纯前端脆弱的本地状态记忆，通过服务端持久化的 `/api/cart` 通道实时算力挂载，支持优惠券高精缩算和实名税费清分。
*   **API 接口协议**:
    *   `GET /api/cart?userId=...` —— 查询实时购物车物品库、应用折扣、核减税率并重新结算总价。
    *   `POST /api/cart/add` —— 进店买家递交 SKU 商品项，服务端进行安全库存锁扣并存入 DB。
    *   `POST /api/cart/remove` —— 将滞留商品移除出结账流。
    *   `POST /api/cart/clear` —— 成功收单或用户主动清除购物车。
*   **支持的折扣算法券**:
    *   `MODA99` —— 全场扣减 **$9.90 USD**。
    *   `VIP88` —— 全场尊享 **$12.00 USD** 扣减优惠。

### 2. 国际化 PayPal Rest & 微信支付网关 (Unified Global Gateways)
基于 `paypal-rest-sdk` 搭建完整的 v1 payment API 处理流，且设计了优雅的仿真无缝沙箱回调模式，无需任何初始 configuration 即可流畅展示 100% 完整的支付全生命周期：
*   **支付网关端点**:
    *   `/api/payments/paypal/checkout` —— 生成唯一沙箱 token 重定向，在 `ModaDB.payments` 数据流中将订单标识为 `pending`。
    *   `/api/payments/paypal/success` —— 侦听 PayPal 重定向接收 `paymentId` 和 `PayerID`，自动调用 `/execute` 捕获（Capture）交易货币，并将 `ModaDB.orders` 状态刷新至 `processing`。
    *   `/api/payments/stripe/checkout` —— 联动 Stripe SDK 高速拉取结账单，并在后台派生收入明细。

### 3. 多渠道销售与营销自动化系统 (Channel Router & Email Campaigns)
*   **Campaigns 营销流引擎**:
    *   内置 `welcome` (欢迎新客)、`abandoned_cart` (购物车复活挽回)、`re_engagement` (沉睡客群唤醒) 等精选模板。
    *   支持分析转化曲线（ sent / delivered / opened / clicked / converted ）及归因收入数。
*   **渠道分销管理 (Multichannel Hub)**:
    *   支持 TikTok Shop、小红书、抖音、淘宝等销售渠道同步注册。
    *   在后台通过 `db.audit_logs` 精准跟踪各媒介的销售订单、访问频次及拉取频次。

### 4. 平台全局配置中心 & 行业蓝图应用市场 (SaaS Configuration & App Store Market)
*   **配置管理**: 基于 `/data/platform_settings.json` 进行完全无硬编码控制，支持随时动态关停系统、变更 Gemini 大模型底层、更改注册门槛。
*   **生态市场**: 提供全新 `Official Apps` 获取接口与克隆安装机制（`POST /api/templates/install`），完美覆盖六大核心行业，自动配置定制化智能专家客服。

---

## 🎨 系统架构设计与开发约束 (Development Regulations)

为了保障 MODAUI 代码库的持续一致性和系统极高的工艺质感，所有 successor agents 与团队开发者必须严格实施下述约束：

1.  **代码模块化规范**:
    *   禁止将所有的业务逻辑合并塞入单一的庞大文件中（例如不能无休止膨胀 `App.tsx` 或 `server.ts`）。
    *   类型声明：由于全栈系统的状态繁多，统一维护在 `/src/types.ts` 和 `/src/server/db.ts`。
    *   组件提取：细分子组件需归并入 `/src/components/`，保持外围主容器的整洁。
2.  **样式开发准则**:
    *   必须使用纯 Tailwind CSS 基础原子类；禁止引入任意单体 `.css` 样式文件。
    *   动画系统：所有动画必须基于 `motion` 动效库（来自 `"motion/react"`）渲染卡片出入、对话弹出、多步向导。
3.  **密钥安全约束**:
    *   **决不允许向客户端泄露原始 API keys**。所有三方接口密钥（Stripe、Alipay、Gemini）一律存放在 Linux / Docker environment 环境变量中，通过后端 Express API 安全调用。
4.  **图标引入一致性**:
    *   项目中所有渲染的图形和功能级图标必须 100% 引用 `lucide-react`。禁止书写大面积冗杂的内联 SVG 纯文本。

---

## 🚀 后期推进路线图 (Next Upgrades Phase)

1.  **Phase 1-3 (智能体记忆力热强化)**: 为 AI 执行团队设计长效向量数据库 (Vectordb Redis Matrix)，让 AI 能够记牢 30 天之前与买家的具体会话历史，并据此调整选品文案。
2.  **Phase 4-5 (高级分析漏斗精算)**: 在商户控制室引入基于 `d3.js` 的流式路径转换桑基图 (Sankey Diagram)，精准展示用户点击流失。
3.  **Phase 6 (微信小程序一键热编译发布)**: 提供在管理后台一键打包发布符合官方微信开发者标准的小程序安装包包体。

---

*MODAUI —— 构建属于人类未来的无人驾驶 AI 商业生态。*
