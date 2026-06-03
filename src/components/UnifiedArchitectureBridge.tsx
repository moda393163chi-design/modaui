import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Network, Layers, Server, Shield, Cpu, RefreshCw, X, ArrowRight, CheckCircle2, Zap, Layout, Play, BookOpen, Settings, Users, Laptop
} from 'lucide-react';

interface UnifiedArchitectureBridgeProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: string;
  onNavigate: (step: any, params?: any) => void;
}

export default function UnifiedArchitectureBridge({ isOpen, onClose, currentStep, onNavigate }: UnifiedArchitectureBridgeProps) {
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
        { name: '美业丽人团队 (拓客/耗材)', action: { step: 'AI_TEAMS', industry: 'beauty' } },
        { name: '健身轻食团队 (社群/教练)', action: { step: 'AI_TEAMS', industry: 'fitness' } },
        { name: '高级珠宝团队 (高奢/保价)', action: { step: 'AI_TEAMS', industry: 'jewelry' } },
        { name: '家居装潢团队 (软装/定制)', action: { step: 'AI_TEAMS', industry: 'home' } }
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

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 hover:border-neutral-500 duration-150 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic systems structure view */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 font-sans scrollbar-thin scrollbar-thumb-neutral-800 bg-black">
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

        {/* Footer */}
        <div className="p-4 border-t border-[#2F3336] bg-neutral-950 text-center shrink-0">
          <p className="text-[9.5px] text-neutral-500 font-mono tracking-wider">
            MODAUI COGNITIVE SaaS CORP © 2026 • ENVIRONMENT PORT: 3000 • DEPLOYMENT REVISION SECURED
          </p>
        </div>
      </motion.div>
    </div>
  );
}
