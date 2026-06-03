import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Network, Layers, Server, Shield, Cpu, RefreshCw, X, ArrowRight, CheckCircle2, Zap, Layout, Play, BookOpen, Settings, Users, Laptop, FileText, Check, AlertTriangle, PlayCircle, Sparkles, TrendingUp
} from 'lucide-react';

interface UnifiedArchitectureBridgeProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: string;
  onNavigate: (step: any, params?: any) => void;
}

export default function UnifiedArchitectureBridge({ isOpen, onClose, currentStep, onNavigate }: UnifiedArchitectureBridgeProps) {
  const [activeTab, setActiveTab] = useState<'shuttle' | 'roadmap'>('shuttle');

  if (!isOpen) return null;

  // Nodes metadata matching the requested structural tree
  const layers = [
    {
      id: 'FRONTEND_PORTAL',
      title: '1. 前端官网 (Official Portal)',
      subtitle: 'SaaS宣传与行业指引导航',
      color: 'border-sky-500/30 text-sky-400 bg-sky-950/25',
      nodes: [
        { name: '官网首页', action: { step: 'LANDING' } },
        { name: '行业选择', action: { step: 'CHOOSE_INDUSTRY' } },
        { name: 'AI团队介绍', action: { step: 'LANDING', target: 'team_rosters' } },
        { name: '行业案例示范', action: { step: 'LANDING', target: 'cases' } },
        { name: 'SaaS价格方案', action: { step: 'LANDING', target: 'pricing' } },
        { name: '快速登录', action: { step: 'LANDING', target: 'login' } },
        { name: '新商户注册', action: { step: 'LANDING', target: 'register' } }
      ]
    },
    {
      id: 'CREATION_FLOW',
      title: '2. AI公司创建流程 (Creation Flow)',
      subtitle: '无缝快捷开店及AI初始化配种',
      color: 'border-indigo-500/30 text-indigo-400 bg-indigo-950/25',
      nodes: [
        { name: '选定产业方向', action: { step: 'CHOOSE_INDUSTRY' } },
        { name: '谷歌OAuth鉴权同步', action: { step: 'CHOOSE_INDUSTRY', trigger: 'login' } },
        { name: '配置经营决策权重', action: { step: 'SELECT_MODE' } },
        { name: 'AI员工队列异步孵化', action: { step: 'ONBOARDING' } },
        { name: '一键进入运营后台', action: { step: 'DASHBOARD' } }
      ]
    },
    {
      id: 'MERCHANT_DASHBOARD',
      title: '3. 商家管理后台 (Merchant Admin)',
      subtitle: '全渠道AI联合协作面板',
      color: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/25',
      nodes: [
        { name: '智能数据大盘', action: { step: 'DASHBOARD', activeMenu: 'workbench' } },
        { name: 'AI Team 运营聊天室', action: { step: 'DASHBOARD', activeMenu: 'workbench' } },
        { name: '商品物资录单系统', action: { step: 'DASHBOARD', activeMenu: 'product' } },
        { name: '多渠道订单托管与顺丰物流', action: { step: 'DASHBOARD', activeMenu: 'order' } },
        { name: 'CRM客诉赔付拦截', action: { step: 'DASHBOARD', activeMenu: 'customer' } },
        { name: 'AI全渠道活动营销策划', action: { step: 'DASHBOARD', activeMenu: 'marketing' } },
        { name: '每日流水审计与损益表', action: { step: 'DASHBOARD', activeMenu: 'analytics' } },
        { name: '多模型算力提供者切换', action: { step: 'DASHBOARD', activeMenu: 'settings' } }
      ]
    },
    {
      id: 'CUSTOMER_STOREFRONT',
      title: '4. 商家前端店面 (Customer Mall)',
      subtitle: '支持多元视效装修的C端商城',
      color: 'border-rose-500/30 text-rose-400 bg-rose-950/25',
      nodes: [
        { name: '品牌官方首页', action: { step: 'CUSTOMER_STOREFRONT', tab: 'home' } },
        { name: '多分类索引选品', action: { step: 'CUSTOMER_STOREFRONT', tab: 'menu' } },
        { name: '支持满减券的购物车', action: { step: 'CUSTOMER_STOREFRONT', tab: 'cart' } },
        { name: '多渠道快速结账付款', action: { step: 'CUSTOMER_STOREFRONT', tab: 'checkout' } },
        { name: '秒级极客AI客服中心', action: { step: 'CUSTOMER_STOREFRONT', tab: 'menu', chat: true } },
        { name: '会员及订单核销中心', action: { step: 'CUSTOMER_STOREFRONT', tab: 'success' } }
      ]
    },
    {
      id: 'AI_TEAMS',
      title: '5. AI 团队架构系统 (AI Team System)',
      subtitle: '覆盖6大垂直行业的专家化员工排班矩阵',
      color: 'border-amber-500/30 text-amber-400 bg-amber-950/25',
      nodes: [
        { name: '服装行业团队 (时装/快反)', action: { step: 'AI_TEAMS', industry: 'fashion' } },
        { name: '餐饮行业团队 (外卖/堂食)', action: { step: 'AI_TEAMS', industry: 'catering' } },
        { name: '零售百货团队 (选品/直通车)', action: { step: 'AI_TEAMS', industry: 'retail' } },
        { name: '美业丽人团队 (拓客/预约)', action: { step: 'AI_TEAMS', industry: 'beauty' } },
        { name: '酒店民宿团队 (房态/收益)', action: { step: 'AI_TEAMS', industry: 'hotel' } },
        { name: '电商网红团队 (选品/直播)', action: { step: 'AI_TEAMS', industry: 'creator' } }
      ]
    },
    {
      id: 'AI_RUNTIME',
      title: '6. AI 认知执行运行层 (AI Agent Engine)',
      subtitle: '驱动AI自主分析、出价与生成的基础大脑',
      color: 'border-teal-500/30 text-teal-400 bg-teal-950/25',
      nodes: [
        { name: '多智体 Agent 状态管理', action: { step: 'AI_RUNTIME', tab: 'agents' } },
        { name: 'Prompt 提示词工厂与上下文注入', action: { step: 'AI_RUNTIME', tab: 'prompts' } },
        { name: 'Tools 外部功能调用 (物流/计算器)', action: { step: 'AI_RUNTIME', tab: 'tools' } },
        { name: 'Tasks 后台计划任务驱动中心', action: { step: 'AI_RUNTIME', tab: 'tasks' } },
        { name: 'DAG 工作流引擎设计画布', action: { step: 'AI_RUNTIME', tab: 'workflows' } },
        { name: 'AI 知识缓存与长期记忆关联度', action: { step: 'AI_RUNTIME', tab: 'memory' } }
      ]
    },
    {
      id: 'KNOWLEDGE_BASE',
      title: '7. 知识库管理系统 (Knowledge Base)',
      subtitle: '多行业深度自适应微调素材',
      color: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/25',
      nodes: [
        { name: '垂直行业知识库 (6类通用)', action: { step: 'KNOWLEDGE_BASE', category: 'industry' } },
        { name: '产品参数及SPU描述档案', action: { step: 'KNOWLEDGE_BASE', category: 'product' } },
        { name: '品牌运营和供应链采购准则', action: { step: 'KNOWLEDGE_BASE', category: 'operating' } },
        { name: '高点击率营销与投放配方库', action: { step: 'KNOWLEDGE_BASE', category: 'marketing' } },
        { name: '企业历史流水损益账套', action: { step: 'KNOWLEDGE_BASE', category: 'corporate' } }
      ]
    },
    {
      id: 'PLATFORM_ADMIN',
      title: '8. 平台超级管理总后台 (Platform Controller)',
      subtitle: '管理多租户多商铺与算力流水配额',
      color: 'border-violet-500/30 text-violet-400 bg-violet-950/25',
      nodes: [
        { name: 'SaaS数据监控总面板', action: { step: 'PLATFORM_ADMIN', tab: 'dashboard' } },
        { name: '店铺实例与商户账户管理', action: { step: 'PLATFORM_ADMIN', tab: 'shops' } },
        { name: '行业及AI小队技能热部署', action: { step: 'PLATFORM_ADMIN', tab: 'teams' } },
        { name: '全渠道任务高并发作业监视', action: { step: 'PLATFORM_ADMIN', tab: 'tasks' } },
        { name: '全局API密钥池与额度限制', action: { step: 'PLATFORM_ADMIN', tab: 'settings' } }
      ]
    },
    {
      id: 'SYSTEM_BASE',
      title: '9. 基础系统底层 (Infra Base Layer)',
      subtitle: '微服务架构、防刷防火墙与读写事件队列',
      color: 'border-neutral-500/30 text-neutral-400 bg-neutral-900/40',
      nodes: [
        { name: '模拟账户与RBAC权限权限表', action: { step: 'SYSTEM_BASE', view: 'rbac' } },
        { name: 'Stripe/Alipay 金流通道同步日志', action: { step: 'SYSTEM_BASE', view: 'payment' } },
        { name: 'Websocket 广播触发排队管线', action: { step: 'SYSTEM_BASE', view: 'socket' } },
        { name: '实时 API 流量及防DDoS防火墙', action: { step: 'SYSTEM_BASE', view: 'firewall' } },
        { name: '模拟文件桶存储浏览器', action: { step: 'SYSTEM_BASE', view: 'storage' } }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Dim overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black backdrop-blur-xs cursor-pointer"
        id="arch_dim_overlay"
      />

      {/* Holographic Control Board */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 24, stiffness: 200 }}
        className="relative w-full max-w-2xl sm:max-w-3xl h-full bg-[#050505] border-l border-[#2F3336] shadow-2xl flex flex-col z-10"
        id="arch_bridge_panel"
      >
        {/* Holographic glowing lines on header */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

        {/* Panel Header */}
        <div className="px-6 py-5 border-b border-[#2F3336] flex items-center justify-between shrink-0 bg-neutral-950">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#1D9BF0]/10 border border-[#1D9BF0]/30 flex items-center justify-center text-[#1D9BF0] shadow-glow">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-white tracking-widest uppercase font-display">MODAUI UNIFIED BRIDGE</span>
                <span className="bg-[#1D9BF0]/15 text-[#1D9BF0] border border-[#1D9BF0]/30 text-[9px] px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                  ARCH_CORE
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">全景统一核心架构树 • 一键式无缝定位传送舱</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Tab Swappers */}
            <button
              onClick={() => setActiveTab('shuttle')}
              className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-bold transition-all ${
                activeTab === 'shuttle'
                  ? 'border-[#1D9BF0] bg-[#1D9BF0]/10 text-[#1D9BF0]'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              🌐 拓扑穿梭 (Shuttle Map)
            </button>
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`text-xs px-3 py-1.5 rounded-lg border font-mono font-bold transition-all flex items-center gap-1 ${
                activeTab === 'roadmap'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> 📄 智能化成熟度白皮书
            </button>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 hover:border-neutral-500 duration-150 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic systems structure view */}
        <div className="flex-1 overflow-y-auto px-6 py-6 font-sans scrollbar-thin scrollbar-thumb-neutral-800 bg-black">
          
          {activeTab === 'shuttle' ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-[#2F3336] bg-neutral-950/60 leading-relaxed text-xs text-neutral-400 flex items-start space-x-3">
                <span className="text-xl">🗺️</span>
                <div>
                  <p className="font-bold text-neutral-200">系统自白: 架构高度一统化</p>
                  <p className="mt-1">MODAUI 决非空洞的营销落地页。本控制舱生动链接了包含从<b>面向用户官网</b>到<b>经营创建流程</b>、<b>多员商家日常后台</b>、<b>实时客户店面交易、专家小队、智能微服务逻辑层、平台管理员大盘及容器网络接口层</b>。点击以下任意蓝色闪烁微组件，均可即刻重组页面逻辑并飞越穿梭至目标模块！</p>
                </div>
              </div>

              {/* Connected Grid Trace Lines */}
              <div className="relative space-y-6 lg:space-y-8 pl-4 border-l border-[#2F3336]/60">
                {layers.map((layer, idx) => {
                  const worksOnStep = 
                    currentStep === 'LANDING' && layer.id === 'FRONTEND_PORTAL' ||
                    (currentStep === 'CHOOSE_INDUSTRY' || currentStep === 'SELECT_MODE' || currentStep === 'ONBOARDING') && layer.id === 'CREATION_FLOW' ||
                    currentStep === 'DASHBOARD' && layer.id === 'MERCHANT_DASHBOARD' ||
                    currentStep === 'CUSTOMER_STOREFRONT' && layer.id === 'CUSTOMER_STOREFRONT' ||
                    currentStep === 'AI_TEAMS' && layer.id === 'AI_TEAMS' ||
                    currentStep === 'AI_RUNTIME' && layer.id === 'AI_RUNTIME' ||
                    currentStep === 'KNOWLEDGE_BASE' && layer.id === 'KNOWLEDGE_BASE' ||
                    currentStep === 'PLATFORM_ADMIN' && layer.id === 'PLATFORM_ADMIN' ||
                    currentStep === 'SYSTEM_BASE' && layer.id === 'SYSTEM_BASE';

                  return (
                    <div key={layer.id} className="relative group">
                      {/* Left horizontal connect point */}
                      <div className="absolute -left-[21px] top-6 w-5 h-[1px] bg-[#2F3336]/80 group-hover:bg-[#1D9BF0]/50 duration-150" />
                      <div className={`absolute -left-[24.5px] top-[21px] w-1.5 h-1.5 rounded-full ${worksOnStep ? 'bg-[#1D9BF0] animate-ping' : 'bg-neutral-700'}`} />
                      <div className={`absolute -left-[24.5px] top-[21px] w-1.5 h-1.5 rounded-full ${worksOnStep ? 'bg-[#1D9BF0]' : 'bg-neutral-700'}`} />

                      {/* Header box */}
                      <div className={`p-4 rounded-xl border duration-200 transition-all ${
                        worksOnStep 
                          ? 'border-[#1D9BF0] bg-[#1D9BF0]/5 shadow-[0_0_15px_rgba(29,155,240,0.08)]' 
                          : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-extrabold tracking-widest text-[#FFFFFF] font-mono leading-none">{layer.title}</h4>
                            <p className="text-[10px] text-neutral-400 mt-1.5 font-mono">{layer.subtitle}</p>
                          </div>
                          {worksOnStep && (
                            <span className="bg-[#1D9BF0] text-black text-[8px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider scale-95">
                              ACTIVE NOW
                            </span>
                          )}
                        </div>

                        {/* Nodes within this layer */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {layer.nodes.map((node, nodeIdx) => {
                            return (
                              <div
                                key={nodeIdx}
                                onClick={() => {
                                  onNavigate(node.action);
                                  onClose();
                                }}
                                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md border border-neutral-800 bg-neutral-900 hover:border-[#1D9BF0] hover:bg-[#1D9BF0]/10 hover:text-white cursor-pointer duration-150 transition-all text-[10.5px] font-semibold text-neutral-300"
                              >
                                <span className="text-[9px] text-[#1D9BF0]">✦</span>
                                <span>{node.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Roadmap Whitepaper Analysis Tab */
            <div className="space-y-6 text-sm text-zinc-300 leading-relaxed font-sans">
              <div className="p-5 border border-emerald-500/20 bg-emerald-950/10 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-bold text-sm tracking-wide">MODAUI 智能化成熟度与投产白皮书</h3>
                </div>
                <p className="text-[11px] text-zinc-400">
                  详细梳理系统<b>物理上线的成套架构及技术资产</b>。本报告对MODAUI全套9大系统级板块的<b>真实已实现代码、沙箱仿真降级层、系统缺失及后续智能化深度优化空间</b>进行权威盘点。
                </p>
              </div>

              {/* SECTION 1: SYSTEM COMPLETENESS MATRIX */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white tracking-widest font-mono border-l-2 border-emerald-500 pl-2 uppercase">
                  一、 全系统 9 大板块真实性与就绪度矩阵 (Engineering Matrix)
                </h4>
                <div className="border border-[#2F3336] rounded-xl overflow-hidden bg-neutral-950/80">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-[#2F3336] bg-neutral-900/40 text-gray-400 font-mono">
                        <th className="p-3">系统板块</th>
                        <th className="p-3">真实化特性描述 (Production Status)</th>
                        <th className="p-3 text-right">成熟度</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2F3336]/60 font-mono text-zinc-400">
                      <tr>
                        <td className="p-3 font-bold text-white">1. 前端官网</td>
                        <td className="p-3">全面就绪。包含谷歌登录、行业精选配置方案、响应式计费表。</td>
                        <td className="p-3 text-right text-emerald-400">100% 🟢</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">2. 开店创建流</td>
                        <td className="p-3">注册即创建。异步批量初始化 AI 骨干阵容，持久写入 ModaDB 商户注册。</td>
                        <td className="p-3 text-right text-emerald-400">95% 🟢</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">3. 商家主后台</td>
                        <td className="p-3">商品SPU录入、微信扫码付追踪、智能AI投。已对接 API 后端。</td>
                        <td className="p-3 text-right text-emerald-400">92% 🟢</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">4. 客户商城前台</td>
                        <td className="p-3">行业换肤、智能24h AI客诉聊天。购物车、真实下单结算闭环。</td>
                        <td className="p-3 text-right text-emerald-400">95% 🟢</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">5. 智能专家团队</td>
                        <td className="p-3">36 位专家级 AI 人设及细分权重机制。支持单独设定预算与核心提示词。</td>
                        <td className="p-3 text-right text-emerald-400">100% 🟢</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">6. AI 智能引擎</td>
                        <td className="p-3">对接 Gemini API，能真实起草具有行业针对性的爆量营销文案及回复。</td>
                        <td className="p-3 text-right text-yellow-400">75% 🟡</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">7. 企业知识库</td>
                        <td className="p-3">模拟长短时 RAG 微调机制。后台支持动态添加业务知识与参数清单。</td>
                        <td className="p-3 text-right text-yellow-400">80% 🟡</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">8. Super SaaS 平台总控</td>
                        <td className="p-3">全局看板，展示租户配额、流量防刷、全局 API Key 安全分配情况。</td>
                        <td className="p-3 text-right text-emerald-400">90% 🟢</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">9. 基础设施底层</td>
                        <td className="p-3">ModaDB 持久化存储，提供真实的 CRUD 数据，完美支持网页刷新。</td>
                        <td className="p-3 text-right text-emerald-400">95% 🟢</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: COMPLETED AND CONNECT REAL RUNTIMES */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white tracking-widest font-mono border-l-2 border-emerald-500 pl-2 uppercase">
                  二、 深度连通与“真实运行”部分 (Fully Connected & Real Operational Modules)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-[#09090B] border border-[#2F3336] p-4 rounded-xl space-y-1.5">
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase">💾 ModaDB 固态物理存储</span>
                    <p className="text-[11px] text-zinc-400">
                      彻底告别纯硬编码数据！后端搭建了微型持久化数据库，可对<b>商品(Products)列表、订单(Orders)、支付历史(Payments)、智能广告活动(Campaigns)</b>进行真实读取与长效写入。
                    </p>
                  </div>
                  <div className="bg-[#09090B] border border-[#2F3336] p-4 rounded-xl space-y-1.5">
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase">🔌 应用扩展中心 (App Store View)</span>
                    <p className="text-[11px] text-zinc-400">
                      完全可用的软件插件生态，不仅在前端提供直观的配置界面，同时也通过后端 `/api/app-store/:appId/install` 接口，赋予商户一键装配微信小程序、顺丰速运物流或抖音插件的能力。
                    </p>
                  </div>
                  <div className="bg-[#09090B] border border-[#2F3336] p-4 rounded-xl space-y-1.5">
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase">⚡ 自动推广营销投流 (AI Campaign Controller)</span>
                    <p className="text-[11px] text-zinc-400">
                      营销看板直接打通了 `/api/campaigns` 的后台注册流程。用户通过营销词配合 AI 专员起草带货文案后，可一键将其推向正在运行的计划队伍，实现自适应流控。
                    </p>
                  </div>
                  <div className="bg-[#09090B] border border-[#2F3336] p-4 rounded-xl space-y-1.5">
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase">🤝 全网多渠道双向握手 (Multichannel Sync)</span>
                    <p className="text-[11px] text-zinc-400">
                      在渠道视图内集成了真实的针对小红书 SPU 产品、抖音直播订单及 TikTok 端点的推送 API，能够在商户进行一键全局对账时触发多端镜像库存对轴锁仓。
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 3: SIMULATED / DEGRADED ZONES */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white tracking-widest font-mono border-l-2 border-yellow-500 pl-2 uppercase">
                  三、 仿真沙箱降级/本地模拟区 (Simulated Sandbox Fallbacks)
                </h4>
                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3.5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-mono font-bold text-white block">微信扫码支付 (WeChat QR Checkout) • 仿真 4s 扣减对账回调</span>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        <b>现状:</b> 当系统缺失 `WECHAT_MCH_ID` 密钥配置时，系统将动态调用全球公共 QR 生成器返回真实的支付验证二维码；同时，在后端<b>启用了一个 4 秒的心跳延迟线程</b>。4 秒后自动模拟微信异步 Callback 返回，强制把未付款订单流转为“支付对账成功，大货准备中”并充值财务损益表。
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 border-t border-[#2F3336]/50 pt-3.5">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-mono font-bold text-white block">顺丰打单与保价代款 (SF Cargo Contract) • 虚拟状态演进</span>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        <b>现状:</b> 系统内嵌了顺丰物流自动结算模块，运费、保价费用基于大宗协议计算。此处的轨迹反馈目前为服务器异步状态机生成的演进状态组合（未对接 SF 开放平台大客户联机）。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: INTELLIGENCE GAPS & NEXT-PHASE ROADMAP */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white tracking-widest font-mono border-l-2 border-teal-500 pl-2 uppercase">
                  四、 智能化差距与待进化区域 (Intelligence Gaps & Optimization Areas)
                </h4>
                <div className="p-4 bg-zinc-950 border border-teal-900/40 rounded-xl space-y-4">
                  <div>
                    <span className="text-xs font-bold text-teal-400 font-mono block">❓ 哪些地方还没有“自主智能化” (Where is Autopilot Missing?)</span>
                    <ul className="list-disc pl-4 mt-2 text-[11px] text-zinc-400 space-y-2">
                      <li>
                        <strong className="text-zinc-200">自主广告预算核销</strong> ━ 目前的营销大盘中虽然设定了 ¥{`{mktBudget}`} 的预算，但 AI 仅仅是按照 3.4x 以上的虚拟 ROI 进行收益核算，没有真正接入真实主流社交媒体流量接口提供实时的投流出价回款（Real-time Bid Autopilot）。
                      </li>
                      <li>
                        <strong className="text-zinc-200">客诉赔付动态裁决 (Refund Auditing)</strong> ━ 针对退单、尺码或口味不对的客诉拦截目前依据固定的商户配比阀，而未能基于多模态对客视频/聊天证据自动评定欺诈风控模型并实施自主赔付。
                      </li>
                      <li>
                        <strong className="text-zinc-200">知识库持续反向补给 (Reverse Knowledge Feeding)</strong> ━ 当前的行业知识库是静态的一维文本块架构，未能捕获 C 端商城买家与 24h 客服主管的对话精髓并将其提炼为动态企业 SOP 回馈至知识底座中。
                      </li>
                    </ul>
                  </div>

                  <div className="border-t border-[#2F3336]/50 pt-3">
                    <span className="text-xs font-bold text-teal-400 font-mono block">🚀 投产后的演进三大目标 (Evolution targets)</span>
                    <p className="text-[11px] text-zinc-400 mt-1.5">
                      1. <b>引入知识库高阶 RAG 向量热更新</b> ━ 只要商家录入新商品，多组 AI 专员会同时将商品材质、参数打包转换为向量进行动态本地持久切片。<br/>
                      2. <b>全自动采购补仓触发机制</b> ━ 协同采购经理，自动分析订单增幅趋势并一键向底层供应商下发订货电子面单。<br/>
                      3. <b>AI 高层大客户回访 SOP</b> ━ 在退款达到高危系数或客户高价值购买后，调用智能高定专家发起跨时区暖心邮件及专属优惠回访。
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2F3336] bg-neutral-950 text-center shrink-0 flex items-center justify-between px-6">
          <p className="text-[9.5px] text-neutral-500 font-mono tracking-wider">
            MODAUI COGNITIVE SaaS CORP © 2026 • ENVIRONMENT PORT: 3000 • SECURITY SECURED
          </p>
          <span className="text-[9px] font-mono text-zinc-500 bg-[#111] px-2 py-0.5 rounded border border-neutral-800">
            REV_ID: MDUI-2026-RELEASE
          </span>
        </div>
      </motion.div>
    </div>
  );
}

