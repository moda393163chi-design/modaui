MODAUI 行业模板体系重构任务 — 交给代码代理执行（行动说明）

目标：按行业彻底重构前端店铺模板体系，保证行业与模板的完全隔离。（重点：不要只是换颜色/Logo，要重做结构与组件）

概述要求：
- 6 个行业：fashion, catering, beauty, fitness, jewelry, home
- 每行业 3 套独立模板：{industry}-white, {industry}-dark, {industry}-luxury
- 共计 18 套前端模板，存放在 `src/templates/{industry}/{templateId}/` 下

每套模板必须独立实现：
- 首页（Home）布局（不同模块与信息层级）
- 商品卡片（Card）组件（不同字段/展示逻辑）
- 商品详情页（Detail）
- 顶部导航（Nav）与底部（Footer）结构
- Banner 与品牌展示模块（BrandShow）
- 活动模块（Campaigns）
- 会员模块（Membership）
- AI团队展示模块（AITeam）

严格规则（必须遵守）：
1) 绝对禁止跨行业模板回退/共享：任何模板查找失败时必须显示错误 “行业模板不存在”，不得fallback到其它行业或通用模板。
2) 禁止使用单一通用模板并仅替换颜色/图片。每套模板须具备不同 DOM 布局或组件组合（可复用基础UI原子，但整体页面结构必须可区分）。
3) 所有模板需绑定 `industry_id` 与 `template_id`，并在创建租户/店铺时强制选定。
4) Onboarding 流程必须新增“选择模板”步骤（在选择行业及策略后，进入模板选择，然后才能创建公司）。
5) 创建公司 API（POST /api/tenants/initialize 或等价接口）必须接收并验证 `industry_id` 与 `template_id`，服务端拒绝缺失或不匹配的请求。
6) 前端 `apiService` 与写入层必须去掉 `default_tenant` 自动回退，遇到缺失 tenant 时阻止调用并显示提示。
7) AI 团队、知识库、商品 SPU 等资源在创建公司时自动从对应行业/模板的蓝图生成并写入 tenant-scoped 路径（Firestore：`tenants/{tenantId}/industries/{industryId}/...`）。

实施步骤（建议顺序，代理可按实际情况调整）：
1. 新建模板注册表：`src/services/templatesRegistry.ts`，列出 18 个模板的 meta（id, industry, displayName, defaultPalette, entryComponentPath）。
2. 在前端创建模板目录结构：`src/templates/{industry}/{templateId}/`，每个目录至少包含 `Home.tsx`, `ProductCard.tsx`, `ProductDetail.tsx`, `Nav.tsx`, `Banner.tsx`, `AITeam.tsx` 的骨架实现和 index 导出。
3. 修改前端创建流程：在 `src/App.tsx` 的步骤序列中加入 `SELECT_TEMPLATE` 步骤，渲染模板选择器（只显示与所选行业匹配的 3 套模板），并把 `templateId` 作为必须参数传入 `OnboardingScreen`。
4. 更新 `OnboardingScreen`：将 POST `/api/tenants/initialize` 的 payload 强制包含 `template_id`，并在服务器端验证。界面上显示“正在部署：{industry} + {templateId}”日志条目。
5. 服务端 API（如果仓库内有 server 代码）或前端 mock 层：实现 `/api/templates/install` 接受 `{tenantId, industryId, templateId}`，并基于 registry 拷贝/生成对应行业资源（AI 团队配置、知识库初始文档、SPU样例、后台菜单）。如果无服务端代码，前端需在初始化完成后自行写入 Firestore 对应命名空间并确保字段 `industry_id`、`template_id`、`tenant_id` 存在。
6. 移除所有 `default_tenant` 回退逻辑（前端文件包括但不限于 `ChannelsView.tsx`, `DiscountsView.tsx`, `StorefrontView.tsx`, `MerchantDashboard.tsx`, `CustomerStorefrontPreview.tsx`），替换为明确的错误处理或阻止操作的提示。
7. 增加单元/集成检查：确保以下行为被覆盖：
   - 创建公司流程中若未选择模板则无法进行下一步；
   - 模板不存在时，UI 显示错误字符串 "行业模板不存在"；
   - 所有 Firestore 写入均带 `tenant_id`、`industry_id`、`template_id`；
   - AI 团队只从对应行业模板加载角色配置。

验收标准（PR Review 要求）：
- 有新增 `src/services/templatesRegistry.ts` 并列明 18 套模板（id 与 industry 必须匹配）。
- `src/templates/` 包含 6 个行业目录且每个行业含 3 个模板目录，每个模板至少有 `Home.tsx`、`ProductCard.tsx`、`ProductDetail.tsx` 的骨架实现与样式占位（不需要完成美术细节，但结构必须差异化）。
- `src/App.tsx` 的创建流程新增模板选择步骤且 `OnboardingScreen` 接收 `templateId` 并在 POST payload 中发送 `template_id`。
- 所有自动回退 `default_tenant` 已被移除并替换为错误提示或阻止逻辑。
- API 或前端初始化逻辑已强制校验并注入 `tenant_id`/`industry_id`/`template_id`，缺失时报错并写入 audit log。

注意事项（给代理的提醒）：
- 这次改动是架构级别的，请不要改动现有的视觉配色或整体布局风格（除非模板本身需要不同的 DOM 结构）。
- 模板实现可以复用基础 UI 原子（button, card, grid），但页面层级（模块组合）必须区分不同模板。
- 保留现有数据与样例，但不要再用单一 `classic` 或 `default_tenant` 流程。

交付物：
- PR（分支名 `feature/template-refactor`），包含代码与必要的迁移说明。
- 一个简短的迁移脚本（或说明）用于将现有 tenant 映射到新的 template_id（如果需要，需手动审查）。

如果你是自动执行代理，请依次执行上面步骤并在每个主要步骤后提交 PR（或在单个 PR 中分阶段提交，保留清晰的 commit message）。

---

负责人（代理）执行时遇到任何不确定点请在 PR 描述中注明并 @ 指定人工审查者。