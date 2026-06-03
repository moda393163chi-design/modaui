import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, Terminal, Sliders, Settings, Zap, ArrowLeft, ArrowRight, Database, 
  Code, Clock, BookOpen, Shield, HardDrive, BarChart2, Activity, Wifi
} from 'lucide-react';
import { auth } from '../services/firebase';

// Import our newly created modular specialized engines
import MarkItDownHub from './MarkItDownHub';
import HyperMemEngine from './HyperMemEngine';
import LangGraphCanvas from './LangGraphCanvas';
import ECCAgentConsole from './ECCAgentConsole';
import LangChainValidator from './LangChainValidator';

interface PromptTemplate {
  id: string;
  name: string;
  targetRole: string;
  systemPrompt: string;
  userTokens: number;
  variables: Record<string, string>;
}

interface ToolDef {
  id: string;
  name: string;
  desc: string;
  parameters: string;
  sampleInput: string;
  status: 'active' | 'sandboxed' | 'disabled';
  rateLimit: string;
  avgLatency: string;
}

interface AgentState {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'IDLE' | 'THINKING' | 'EXECUTING' | 'ERROR';
  model: string;
  tokensUsed: number;
  temperature: number;
  activeThreads: number;
  memorySlots: number;
  workspaceFiles: string[];
  activeTask: string;
}

interface DagNode {
  id: string;
  label: string;
  type: 'trigger' | 'decision' | 'tool' | 'fulfillment';
  status: 'idle' | 'active' | 'success' | 'failed';
  details: string;
  executor: string;
  backupRoute?: string;
  outputPayload?: string;
}

interface CronJob {
  id: string;
  name: string;
  cronExpr: string;
  task: string;
  status: 'idle' | 'running' | 'paused';
  priority: 'URGENT' | 'NORMAL' | 'DEFERRED';
  assignee: string;
  lastRun: string;
  failureCount: number;
}

interface VectorMemory {
  id: string;
  key: string;
  data: string;
  relevance: number;
  decayCoeff: number;
  timestamp: string;
}

interface IndustryKnowledge {
  industry: string;
  label: string;
  icon: string;
  color: string;
  rules: { title: string; content: string; codeValue: string }[];
}

export default function AIRuntimeView({ onBackToLanding }: { onBackToLanding: () => void }) {
  const [activeTab, setActiveTab] = useState<'workflows' | 'agents' | 'prompts' | 'tools' | 'tasks' | 'memory' | 'knowledge' | 'model'>('workflows');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('Fashion');
  const [isExecutingSim, setIsExecutingSim] = useState(false);
  const [currentSimNode, setCurrentSimNode] = useState<string | null>(null);
  
  // Real-time latency & live system state
  const [sysLatency, setSysLatency] = useState<number>(12);
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(86430);
  const [simLogs, setSimLogs] = useState<string[]>([
    '【系统就绪】AI 运行层多智体调度核心 (ModaUI Cognitive Scheduler v3.1) 准备完毕。',
    '【心跳检测】节点状态: 🟢 DeepSeek-R1 & Gemini-2.5-Ultra 极速算力通道握手成功 (12ms)。',
    '【安全检测】Hermes 智体围栏微隔离物理权限网关建立：OK。'
  ]);
  const [simDetailJson, setSimDetailJson] = useState<string>('{\n  "status": "ONLINE",\n  "activeGraph": "Multi_Tenant_Enterprise_DAG_v1",\n  "loadedAgentCount": 6,\n  "loadedSaaSModules": 8\n}');

  // Dynamic system simulation metrics
  useEffect(() => {
    const timer = setInterval(() => {
      setSysLatency(prev => {
        const jitter = Math.floor(Math.random() * 5) - 2;
        const next = prev + jitter;
        return next < 8 ? 8 : next > 25 ? 25 : next;
      });
      setUptimeSeconds(prev => prev + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleAddLog = (log: string) => {
    setSimLogs(prev => [...prev, log]);
  };

  // 1. Agent Engine (Multi-Agent Hermes-style States)
  const [agents, setAgents] = useState<AgentState[]>([
    { 
      id: 'ag1', 
      name: 'Aria', 
      role: 'AI视觉与版式陈列师', 
      avatar: '👗', 
      status: 'IDLE', 
      model: 'Gemini-2.5-Pro', 
      tokensUsed: 428000, 
      temperature: 0.7, 
      activeThreads: 0, 
      memorySlots: 12,
      workspaceFiles: ['layout_canvas_cfg.json', 'spu_poster_builder.py', 'palette_matrix.json'],
      activeTask: '待命：监控前端品类主色调是否对齐秋冬热销品类。'
    },
    { 
      id: 'ag2', 
      name: 'Barton', 
      role: '选品采购与供应链契约专家', 
      avatar: '📦', 
      status: 'IDLE', 
      model: 'DeepSeek-R1-671B', 
      tokensUsed: 891000, 
      temperature: 0.1, 
      activeThreads: 0, 
      memorySlots: 24,
      workspaceFiles: ['supplier_contracts.db', 'lead_time_calculator.py', 'reorder_points.csv'],
      activeTask: '待命：拦截大盘中游原材料涨跌波动，重定价阶梯订货单。'
    },
    { 
      id: 'ag3', 
      name: 'Soren', 
      role: '全渠道运营与精算规划师', 
      avatar: '🍲', 
      status: 'IDLE', 
      model: 'Claude-3.5-Sonnet', 
      tokensUsed: 1254000, 
      temperature: 0.3, 
      activeThreads: 0, 
      memorySlots: 32,
      workspaceFiles: ['roi_lever_optimizer.py', 'campaign_vouchers.json', 'ledger_reconcile.py'],
      activeTask: '待命：算力跟踪店面实时转化与综合毛利率，下发调价。'
    },
    { 
      id: 'ag4', 
      name: 'Cyrus', 
      role: '纠纷仲裁与CRM客诉挽回官', 
      avatar: '🛡️', 
      status: 'IDLE', 
      model: 'GPT-4o-Enterprise', 
      tokensUsed: 924000, 
      temperature: 0.4, 
      activeThreads: 0, 
      memorySlots: 18,
      workspaceFiles: ['dispute_history_index.json', 'sf_refund_handlers.js', 'anxiety_mitigation.txt'],
      activeTask: '待命：极速对齐异常签退，触发顺丰自动赔偿或卡包下放。'
    },
    { 
      id: 'ag5', 
      name: 'Daphne', 
      role: '流媒体与全域引流操盘手', 
      avatar: '✨', 
      status: 'IDLE', 
      model: 'Gemini-2.5-Flash', 
      tokensUsed: 2310000, 
      temperature: 0.8, 
      activeThreads: 0, 
      memorySlots: 15,
      workspaceFiles: ['xiaohongshu_hot_trend.py', 'ad_spend_bidder.sh', 'copywrite_templates.csv'],
      activeTask: '待命：探测高频转化词，通过多模态生成新宣传图裂变素材。'
    },
    { 
      id: 'ag6', 
      name: 'Justin', 
      role: '每日流水算力审计总监', 
      avatar: '💰', 
      status: 'IDLE', 
      model: 'GPT-4o-mini', 
      tokensUsed: 154000, 
      temperature: 0.0, 
      activeThreads: 0, 
      memorySlots: 8,
      workspaceFiles: ['daily_ledger.db', 'tax_calculator.js', 'stripe_payout_sync.json'],
      activeTask: '待命：汇总结算商铺纯盈/扣税，对冲全域算力 token 支出。'
    }
  ]);

  const handleUpdateAgentTask = (id: string, newTask: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, activeTask: newTask } : a));
  };

  // 2. Custom Visual Workflow graph nodes (DAG)
  const initialDagNodes: DagNode[] = [
    { id: 'node_trig', label: '消费卡点与纠纷事件捕获 (Trigger)', type: 'trigger', status: 'idle', executor: 'Cyrus (纠纷挽回官)', details: 'Websocket 捕获C端消费者退货差评、汤水洒溢或冷餐争议事件。' },
    { id: 'node_dispat', label: '智体柔性链决策分流 (Decision)', type: 'decision', status: 'idle', executor: 'Soren (精算师) + Barton (供应链)', details: '评估该用户历史价值并匹配长期记忆，决定自动先行赔付35元退还，配合卡。', backupRoute: 'Soren (运营综合理赔对账)' },
    { id: 'node_tool', label: '外部 API 组合调度 (Tool Call)', type: 'tool', status: 'idle', executor: 'Barton (工具调度网关)', details: '自动调用 stripe_pay_refund_reconcile，退款11ms内落地并启动退款理赔。', backupRoute: 'Soren (运营财务对账)' },
    { id: 'node_full', label: '店面前端重新渲染部署 (Render)', type: 'fulfillment', status: 'idle', executor: 'Aria (视觉排版海报师)', details: '热重载C端客户界面，弹出红点满减卡包与Stripe理赔安抚提示，完成自愈。' }
  ];

  // 3. Prompt Engine Playgrounds & Safeguard Matrix
  const [prompts, setPrompts] = useState<PromptTemplate[]>([
    {
      id: 'p1',
      name: '时装陈列与视觉海报设计提示词',
      targetRole: 'Aria (AI陈列师)',
      systemPrompt: '你是一名顶级摩登女装设计师。当你接收到风格主题 "{{theme}}" 与主色调 "{{mainColor}}" 时，生成适合秋冬款式的视觉排版指令、3张海报创意描述、以及RGB配色表。输出严格为 JSON。',
      userTokens: 1240,
      variables: { theme: '极简摩登主义', mainColor: '#C8A2C8' }
    },
    {
      id: 'p2',
      name: '美团/饿了么外卖霸王餐满减精算',
      targetRole: 'Soren (精算规划师)',
      systemPrompt: '你是一名高弹餐饮运营专家。根据商家原材料成本扣率 "{{foodCost}}" 与平台返利比率 "{{platformCost}}"，计算一个既能高频引流拉新，又绝对确保单笔亏损不低于底线保密数值的5档裂变折扣额组。输出标准定价表。',
      userTokens: 1890,
      variables: { foodCost: '22%', platformCost: '4.5%' }
    },
    {
      id: 'p3',
      name: '全渠道纠纷智能风控与垫资仲裁',
      targetRole: 'Cyrus (CRM纠纷官)',
      systemPrompt: '你是全托管客服专家。核对当前账期信用评分 "{{creditLevel}}"，对于恶意差评，立即自动调起申诉工单 "{{appealType}}"；对于由于物流引起的纠纷，立刻执行一键自动顺丰代赔。',
      userTokens: 2540,
      variables: { creditLevel: 'AAA-Level', appealType: '恶意打假赔偿驳回' }
    }
  ]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('p1');
  const [editorSystemPrompt, setEditorSystemPrompt] = useState<string>('');
  const [editorVariables, setEditorVariables] = useState<Record<string, string>>({});
  const [compiledPromptResult, setCompiledPromptResult] = useState<string>('');
  const [isSafeguardOn, setIsSafeguardOn] = useState(true);

  // Synchronize dynamic prompt configs
  useEffect(() => {
    const selected = prompts.find(p => p.id === selectedPromptId);
    if (selected) {
      setEditorSystemPrompt(selected.systemPrompt);
      setEditorVariables(selected.variables);
      setCompiledPromptResult('');
    }
  }, [selectedPromptId, prompts]);

  const handleCompilePrompt = () => {
    let compiled = editorSystemPrompt;
    Object.entries(editorVariables).forEach(([key, val]) => {
      compiled = compiled.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), val);
    });

    if (isSafeguardOn) {
      compiled = `/* [Hermes Shield Active] 检测并规避提示词越狱: OK */\n${compiled}`;
    }

    setCompiledPromptResult(compiled);
    handleAddLog(`【编译输出】编译并注入智体 System Prompt：${prompts.find(p => p.id === selectedPromptId)?.targetRole}。`);
  };

  // 4. Tool Engine definitions (Function calling plugins with avgLatency & rates)
  const initialTools: ToolDef[] = [
    { 
      id: 't1', 
      name: 'sf_shipping_get_quote', 
      desc: '对应 顺丰极速自愈理赔与运单运费估算一秒打单自同步接口 (SF Express API)', 
      parameters: '{\n  "type": "object",\n  "properties": {\n    "weightKg": {"type": "float", "description": "货包物理重量"},\n    "destination": {"type": "string", "description": "目的地"}\n  }\n}',
      sampleInput: '{\n  "weightKg": 2.5,\n  "destination": "深圳"\n}',
      status: 'active',
      rateLimit: '300 req/min',
      avgLatency: '18ms'
    },
    { 
      id: 't2', 
      name: 'meituan_coupon_configurator', 
      desc: '美团商铺API霸王餐或活动大额裂变券一秒落地与防套配发网关 (Meituan API)', 
      parameters: '{\n  "type": "object",\n  "properties": {\n    "campaignId": {"type": "string", "description": "系统活动哈希"},\n    "voucherValue": {"type": "int", "description": "满减面额Yen"}\n  }\n}',
      sampleInput: '{\n  "campaignId": "CAMP_MEI_603",\n  "voucherValue": 15\n}',
      status: 'active',
      rateLimit: '50 req/min',
      avgLatency: '15ms'
    }
  ];

  // 5. Task Engine definitions (Cron and Schedulers with priorities & fail counters)
  const [crons, setCrons] = useState<CronJob[]>([
    { 
      id: 'cron1', 
      name: '全渠道日夜财务核销审计柜', 
      cronExpr: '0 0 * * *', 
      task: 'Justin 审计昨日全部流水分账，多店铺合并账单比对，并生成算力 token 分摊损益 Ledger 本子。', 
      status: 'idle', 
      priority: 'URGENT',
      assignee: 'Justin (财务审计)',
      lastRun: '17小时前',
      failureCount: 0
    },
    { 
      id: 'cron2', 
      name: '快反补货监视与工单报警自愈', 
      cronExpr: '*/30 * * * *', 
      task: 'Barton 检索店面各 SPU 剩余库存与面辅料库存，只要低于红线20%，自动调用外部代工厂一键下料代发工单。', 
      status: 'idle', 
      priority: 'NORMAL',
      assignee: 'Barton (供应链选品)',
      lastRun: '12分钟前',
      failureCount: 0
    },
    { 
      id: 'cron3', 
      name: '小红书社交爆点直通车竞价竞拍器', 
      cronExpr: '*/5 * * * *', 
      task: 'Daphne 定时抓取主流平台爆款热词频度，一秒改写店面标题，精准调整营销大盘出价与 ROI 测算词包。', 
      status: 'running', 
      priority: 'DEFERRED',
      assignee: 'Daphne (营销全域)',
      lastRun: '3分钟前',
      failureCount: 0
    }
  ]);
  const [newCronName, setNewCronName] = useState('');
  const [newCronExpr, setNewCronExpr] = useState('*/15 * * * *');
  const [newCronTask, setNewCronTask] = useState('');
  const [newCronPriority, setNewCronPriority] = useState<'URGENT' | 'NORMAL' | 'DEFERRED'>('NORMAL');

  const handleAddCron = () => {
    if (!newCronName || !newCronTask) return;
    const newJob: CronJob = {
      id: `cron_${Date.now()}`,
      name: newCronName,
      cronExpr: newCronExpr,
      task: newCronTask,
      status: 'idle',
      priority: newCronPriority,
      assignee: 'Soren (运营综合)',
      lastRun: '未运行',
      failureCount: 0
    };
    setCrons(prev => [...prev, newJob]);
    setNewCronName('');
    setNewCronTask('');
    handleAddLog(`【任务调度】热部署注册新计划任务：${newCronName} [${newCronExpr}] 优先级: ${newCronPriority} 🟢`);
  };

  const handleTriggerCronNow = async (id: string) => {
    const job = crons.find(c => c.id === id);
    if (!job) return;

    setCrons(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, status: 'running', lastRun: '正在调协 Gemini 算力...' };
      }
      return c;
    }));

    const userEmail = auth.currentUser?.email;
    const tenantId = userEmail ? userEmail.replace(/[^a-zA-Z0-9]/g, '_') : 'default_tenant';
    
    handleAddLog(`【强行唤醒】[ASYNC TASK TRIGGER] 立刻强行调用后台任务：<${job.name}> 进行实地理算并同步云 Firestore...`);

    try {
      const response = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: job.assignee || 'Soren (运营综合)',
          teamId: 'cron_scheduler_team',
          inputMessage: `计划任务执行启动：${job.task}`,
          rolePrompt: `你是一个摩整数字员工智能工作工作站。针对创始人调度的定时时段任务，结合你所属的专业岗位，输出精准的代运营和结账审计理算。`,
          tenantId
        })
      });
      const data = await response.json();
      if (data.success) {
        handleAddLog(`【智体响应】《${job.name}》实数理算成果：\n${data.response}`);
        setCrons(prev => prev.map(c => {
          if (c.id === id) {
            return { ...c, status: 'idle', lastRun: '执行完毕 (已同步至 Firestore)' };
          }
          return c;
        }));
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      handleAddLog(`【调度警报】时辰任务调度阻碍失败: ${e.message}`);
      setCrons(prev => prev.map(c => {
        if (c.id === id) {
          return { ...c, status: 'idle', lastRun: '运行失败' };
        }
        return c;
      }));
    }
  };

  // 6. Memory Engine (Long-term / Short-term Vector Embedding indexer)
  const [vectorDb, setVectorDb] = useState<VectorMemory[]>([
    { 
      id: 'mem1', 
      key: 'CUST_HABIT_FASHION', 
      data: '高支超细山羊绒在20:00 - 22:30引流时，文案强制绑定“通勤防静电显瘦”，点击率飙升 28.5%。', 
      relevance: 0.94, 
      decayCoeff: 0.15,
      timestamp: '2026-06-02 23:51' 
    },
    { 
      id: 'mem2', 
      key: 'SUPPLY_LOGISTICS_SHANXING', 
      data: '部分服装与美餐偏远发往西北时易受压，自动锁定双层复合打泡防震包装。', 
      relevance: 0.88, 
      decayCoeff: 0.15,
      timestamp: '2026-06-02 22:15' 
    }
  ]);

  const handleInsertMemoryDB = (key: string, data: string) => {
    const item: VectorMemory = {
      id: `mem_${Date.now()}`,
      key: key.toUpperCase(),
      data,
      relevance: 1.0,
      decayCoeff: 0.15,
      timestamp: '刚刚写入'
    };
    setVectorDb(prev => [item, ...prev]);
    handleAddLog(`【存储归并】HyperMem 成功写入新块 #${item.key}！存入 1536d 高阶矢量仓。🟢`);
  };

  // 7. Knowledge Engine (preset professional industry schemas)
  const [industryKnowledgePresets, setIndustryKnowledgePresets] = useState<IndustryKnowledge[]>([
    {
      industry: 'Fashion',
      label: '潮流时装与极速快反',
      icon: '👗',
      color: 'from-amber-400 to-amber-600',
      rules: [
        { title: '柔性柔度供应链反应面', content: '面辅料储备始终维持于单款产销首单50件所需，10小时内极速追加次单并由代工云厂裁剪。', codeValue: '{"minFabricLevelKg": 150, "cloudFactoryFastReactionHours": 10}' },
        { title: '版型首推色泽热搜矩阵', content: '抓取社交大盘上针对“轻复古”、“老钱风”提及的色彩趋势，由Aria重绘店面渲染。', codeValue: '{"targetVibe": ["Retro", "QuietLuxury"], "mainColorWeight": 0.75}' }
      ]
    },
    {
      industry: 'Catering',
      label: '餐饮外卖与霸王满减',
      icon: '🍲',
      color: 'from-emerald-400 to-emerald-600',
      rules: [
        { title: '快送卡点配送积压全退规则', content: '判定骑手接单到店超过35分钟且餐品降温20度以上客诉时，触发Cyrus一秒赔全款、下放神券。', codeValue: '{"maxTransitBufferMinutes": 35, "autoSettleLimit": 50.00}' },
        { title: '裂变霸王餐活动高频配比', content: '大额补贴券仅作用于周度拉新或搭配饮品SPU等极高毛差价物资时，最大锁扣毛利润门槛 20%。', codeValue: '{"campaignMinGrossProfitRatio": 0.20, "allowCombinedVouchers": false}' }
      ]
    },
    {
      industry: 'Goods',
      label: '跨境百货与直通飙车',
      icon: '📦',
      color: 'from-sky-400 to-sky-600',
      rules: [
        { title: '海外仓配一秒自动对账与保价', content: 'Stripe 入账及报关清单自动对比，对冲美元与跨境减资损失。', codeValue: '{"allowCurrencyExchangeAuto": true, "maxSlippageBps": 15}' }
      ]
    },
    {
      industry: 'Beauty',
      label: '美业丽人与客宿增值',
      icon: '✨',
      color: 'from-rose-400 to-rose-600',
      rules: [
        { title: '沙龙耗材自动周结保价线', content: '计算美发、香氛等易耗原料损耗，当余量低于10%触发周边仓配一日达。', codeValue: '{"minConsumableStockPercent": 0.10, "autoBuySupplierId": "SP_BEAUTY_04"}' }
      ]
    }
  ]);

  const handleMarkItDownSync = (title: string, markdown: string, codeValue: string) => {
    // Sync newly extracted Markdown directly to selected industry rules!
    setIndustryKnowledgePresets(prev => prev.map(preset => {
      if (preset.industry === selectedIndustry) {
        return {
          ...preset,
          rules: [
            ...preset.rules,
            { title, content: markdown.replace(/#.*?\n/, "").substring(0, 160) + '...', codeValue }
          ]
        };
      }
      return preset;
    }));
  };

  const currentKnowledge = industryKnowledgePresets.find(x => x.industry === selectedIndustry) || industryKnowledgePresets[0];

  // 8. Model Engine (Compute Provider Switcher & Live token/latency curves)
  const [activeModelProvider, setActiveModelProvider] = useState<'deepseek-r1' | 'gemini-ultra' | 'claude-sonnet' | 'gpt-4o'>('deepseek-r1');
  const [customTemperature, setCustomTemperature] = useState<number>(0.3);

  const modelMetrics = {
    'deepseek-r1': { name: 'DeepSeek-R1-671B (推理超脑)', limit: '128k context', costPerMillion: '¥1.50', speed: '🟢 98 tok/s', activeThreads: 4, securityRating: 'MIL-SPEC 级' },
    'gemini-ultra': { name: 'Gemini-2.5-Ultra (多模态陈列)', limit: '2M context', costPerMillion: '¥8.50', speed: '⚡ 150 tok/s', activeThreads: 3, securityRating: 'Google Sec' },
    'claude-sonnet': { name: 'Claude-3.5-Sonnet (高弹精选)', limit: '200k context', costPerMillion: '¥21.50', speed: '🟡 75 tok/s', activeThreads: 1, securityRating: 'Anthropic Guard' },
    'gpt-4o': { name: 'GPT-4o-Enterprise (金融安全)', limit: '128k context', costPerMillion: '¥35.00', speed: '🟢 82 tok/s', activeThreads: 2, securityRating: 'Enterprise Sec' }
  };

  const currentProviderMetric = modelMetrics[activeModelProvider];

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-6 relative font-sans select-none">
      {/* Dynamic Hex Background Matrix */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F0F12_1px,transparent_1px),linear-gradient(to_bottom,#0F0F12_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-70 pointer-events-none" />
      
      {/* Premium ambient gradient glow */}
      <div className="absolute top-0 left-1/4 w-[35rem] h-[35rem] bg-[#1D9BF0]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[30rem] h-[30rem] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        
        {/* Top Control Header with Breadcrumbs & Real-time Live Stats Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-[#2F3336]/60 pb-6 gap-6">
          <div className="space-y-2">
            <button 
              onClick={onBackToLanding}
              className="inline-flex items-center space-x-2 text-xs text-neutral-400 hover:text-white transition-all py-1.5 px-3 rounded-lg bg-neutral-900/60 border border-[#2F3336]/40 hover:bg-neutral-950 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回系统控制台 Portal</span>
            </button>
            
            <div className="flex items-center space-x-3 pt-1">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#1D9BF0] to-cyan-500 shadow-md shadow-[#1D9BF0]/10">
                <Cpu className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
                  AI 智能认知执行运行层 (Cognitive Engine Hub Plan)
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Hermes-v3 Enterprise Core Active</span>
                  </div>
                  <span>•</span>
                  <span>Uptime: {formatUptime(uptimeSeconds)}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-emerald-400">
                    <Wifi className="w-3" />
                    <span>Live Latency: {sysLatency}ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick industry profile switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1 flex items-center space-x-2 shrink-0">
              <span className="text-[10px] font-bold text-neutral-500 font-mono">INDUSTRY MEMORY BUCKET:</span>
              <select 
                value={selectedIndustry}
                onChange={(e) => {
                  setSelectedIndustry(e.target.value);
                  handleAddLog(`【领域重载】已在全局 AI Core 中热备并部署垂直行业知识底座：${e.target.value} SPU 及对账规章。`);
                }}
                className="bg-black text-[#1D9BF0] text-xs font-bold border-none outline-none cursor-pointer py-1 font-mono focus:ring-0"
              >
                <option value="Fashion">👗 潮流服饰与快反供应</option>
                <option value="Catering">🍲 餐饮外卖与霸王满减</option>
                <option value="Goods">📦 跨境百货与直通飙车</option>
                <option value="Beauty">✨ 美业沙龙与客宿增值</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modular Sub-Engine Selection Rail (8 Core Engines Mapping) */}
        <div className="border-b border-neutral-800 flex flex-wrap gap-1 bg-neutral-950/40 p-1.5 rounded-xl">
          {[
            { id: 'workflows', name: 'Workflow Engine (DAG 画布)', icon: Sliders, label: 'DAG' },
            { id: 'agents', name: 'Agent Engine (智体核心与ECC)', icon: Sliders, label: 'Agents' },
            { id: 'prompts', name: 'Prompt Engine (提示词工厂)', icon: Code, label: 'Prompts' },
            { id: 'tools', name: 'Tool Engine (API 参数校验)', icon: Settings, label: 'Tools' },
            { id: 'tasks', name: 'Task Engine (时频时钟)', icon: Clock, label: 'Tasks' },
            { id: 'memory', name: 'Memory Engine (HyperMem)', icon: Database, label: 'Memory' },
            { id: 'knowledge', name: 'Knowledge Engine (MarkItDown)', icon: BookOpen, label: 'Knowledge' },
            { id: 'model', name: 'Model Engine (算力曲线)', icon: Activity, label: 'Model' }
          ].map((tb) => {
            const Icon = tb.icon;
            const isSelected = activeTab === tb.id;
            return (
              <button
                key={tb.id}
                onClick={() => setActiveTab(tb.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-3 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-900 border border-neutral-800 text-[#1D9BF0] font-extrabold shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-current" />
                <span className="hidden lg:inline-block">{tb.name}</span>
                <span className="lg:hidden">{tb.label}</span>
              </button>
            );
          })}
        </div>

        {/* Core Workspace Panel */}
        <div className="min-h-[28rem] bg-neutral-950/60 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            
            {/* Tab 1: Workflows Canvas based on LangGraph State Graph */}
            {activeTab === 'workflows' && (
              <motion.div
                key="workflows"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6 animate-fade-in"
              >
                <LangGraphCanvas 
                  initialNodes={initialDagNodes}
                  isExecutingSim={isExecutingSim}
                  setIsExecutingSim={setIsExecutingSim}
                  onAddLog={handleAddLog}
                  onUpdateSimDetail={setSimDetailJson}
                />
              </motion.div>
            )}

            {/* Tab 2: Agent Engine connected to ECC Cockpit */}
            {activeTab === 'agents' && (
              <motion.div
                key="agents"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <ECCAgentConsole 
                  agents={agents}
                  onAddLog={handleAddLog}
                  onUpdateAgentTask={handleUpdateAgentTask}
                />
              </motion.div>
            )}

            {/* Tab 3: Prompt Engine Playgrounds */}
            {activeTab === 'prompts' && (
              <motion.div
                key="prompts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="pb-3 border-b border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                      <Code className="w-4 h-4 text-[#1D9BF0]" />
                      <span>企务 System Prompt 防御策略工坊 (Prompt Engine Framework)</span>
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1 font-sans">
                      强大的提示词拼装器。通过大模型在不同垂直节点下动态提取商家元数据变量，并经过 **Jailbreak 越狱防御网架** 彻底加固。
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1">
                    <Shield className="w-3.5 h-3.5 text-[#1D9BF0]" />
                    <span className="text-[10px] font-bold text-neutral-400 font-mono">越狱防守状态 (Compliance Active Guard):</span>
                    <button 
                      onClick={() => {
                        setIsSafeguardOn(!isSafeguardOn);
                        handleAddLog(`【策略变更】越狱阻指引防守网栅状态置为：${!isSafeguardOn ? '🟢 开启拦截' : '🔴 临时放行'}`);
                      }}
                      className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded cursor-pointer ${
                        isSafeguardOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'
                      }`}
                    >
                      {isSafeguardOn ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left: Prompt registry options */}
                  <div className="lg:col-span-4 space-y-3">
                    <span className="text-[10px] font-bold text-neutral-400 font-mono block">系统已注册提示词资源库:</span>
                    <div className="space-y-2 max-h-[18rem] overflow-y-auto pr-1">
                      {prompts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPromptId(p.id)}
                          className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all hover:border-[#1D9BF0]/60 ${
                            selectedPromptId === p.id
                              ? 'border-[#1D9BF0] bg-[#1D9BF0]/5 text-sky-400 font-bold'
                              : 'border-neutral-80 & bg-neutral-900/10 text-neutral-400'
                          }`}
                        >
                          <h4 className="text-xs truncate text-white">{p.name}</h4>
                          <div className="flex justify-between items-center text-[9px] mt-2 opacity-80 text-zinc-500 font-mono leading-none">
                            <span>靶标: {p.targetRole}</span>
                            <span>Tokens: {p.userTokens} t</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Template variables interpolation */}
                  <div className="lg:col-span-8 flex flex-col md:flex-row gap-4 items-stretch justify-between">
                    <div className="flex-1 space-y-4 bg-[#070709] border border-neutral-800 p-5 rounded-xl flex flex-col justify-between font-mono">
                      <div className="space-y-3">
                        <textarea
                          value={editorSystemPrompt}
                          onChange={(e) => setEditorSystemPrompt(e.target.value)}
                          className="w-full bg-black border border-neutral-800 p-3 rounded-lg text-xs text-white focus:outline-none min-h-[7.5rem] leading-normal"
                        />

                        {/* Variables configure */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-neutral-450 block">上下文元参数调优 (Variables):</span>
                          <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                            {Object.entries(editorVariables).map(([key, val]) => (
                              <div key={key} className="flex flex-col space-y-1">
                                <span className="text-sky-450">{`{{${key}}}`}</span>
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => {
                                    setEditorVariables(prev => ({ ...prev, [key]: e.target.value }));
                                  }}
                                  className="bg-black border border-neutral-800 rounded px-2.5 py-1 text-white uppercase focus:outline-none focus:border-zinc-700"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleCompilePrompt}
                        className="w-full py-2 bg-neutral-950 border border-neutral-800 text-xs font-bold text-sky-400 hover:border-[#1D9BF0] rounded-lg duration-150 cursor-pointer active:scale-95 mt-2"
                      >
                        ⚡ 编译并下发该智体制导 System Prompt
                      </button>
                    </div>

                    <div className="w-full md:w-[17.5rem] bg-black border border-neutral-800 p-5 rounded-xl flex flex-col justify-between space-y-3 font-mono">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-neutral-400 tracking-wider">编译出产包 (Live Prompt Output):</span>
                        <div className="bg-[#050508] p-3 border border-neutral-900 rounded-lg text-[10px] text-amber-300 leading-normal min-h-[14rem] max-h-[15rem] overflow-y-auto select-all">
                          {compiledPromptResult || '--- 尚未点击下发编译 ---'}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* Tab 4: Tool Engine Parameters Validator */}
            {activeTab === 'tools' && (
              <motion.div
                key="tools"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="pb-3 border-b border-neutral-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                    <Settings className="w-4 h-4 text-[#1D9BF0]" />
                    <span>外部 API 生态工具调用插座 (API Tool Schema Validator)</span>
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-1 font-sans">
                    结合 LangChain Tool schema 参数约束，在调度 API (包括顺丰特揽、Stripe支付、优惠包) 前执行强类型校验（String, Int, Float, Bool）。
                  </p>
                </div>

                <LangChainValidator 
                  initialTools={initialTools}
                  onAddLog={handleAddLog}
                />
              </motion.div>
            )}

            {/* Tab 5: Scheduling Task Engine */}
            {activeTab === 'tasks' && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="pb-3 border-b border-neutral-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                    <Clock className="w-4 h-4 text-[#1D9BF0]" />
                    <span>异步时钟计划任务管理器 (Enterprise Cron & Task Engine)</span>
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-1 font-sans">
                    异步定时后台引擎。支持多租户高并发审计。只要库存跌超阈值 20%，立刻自主下达工单和财务分账。
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch font-mono">
                  
                  {/* Left list */}
                  <div className="lg:col-span-7 space-y-3">
                    <span className="text-[10px] font-bold text-neutral-400 block">注册中的定时 Cron 任务:</span>
                    <div className="space-y-2.5 max-h-[22rem] overflow-y-auto pr-1">
                      {crons.map((c) => (
                        <div 
                          key={c.id} 
                          className="p-4 rounded-xl border border-neutral-805 bg-neutral-900/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-neutral-700 duration-150 transition-all font-sans"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2 leading-none">
                              <span className={`w-2 h-2 rounded-full ${c.status === 'running' ? 'bg-[#1D9BF0] animate-pulse' : 'bg-zinc-650'}`} />
                              <h4 className="text-xs font-bold text-white font-mono">{c.name}</h4>
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-neutral-900 border border-neutral-800 text-amber-500">{c.priority}</span>
                            </div>
                            <p className="text-[10.5px] text-neutral-400 leading-normal">{c.task}</p>
                            
                            <div className="flex flex-wrap items-center gap-3 text-[9px] text-neutral-550 font-mono leading-none">
                              <span className="bg-neutral-950 px-1 py-0.5 border border-neutral-850 text-emerald-400">{c.cronExpr}</span>
                              <span>执行者: {c.assignee.split(' ')[0]}</span>
                              <span>失败: {c.failureCount}/3</span>
                              <span>前次: {c.lastRun}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleTriggerCronNow(c.id)}
                            className="px-3 py-1.5 rounded bg-neutral-950 border border-neutral-850 text-sky-400 text-[9.5px] hover:border-sky-500 duration-100 cursor-pointer active:scale-95 font-bold"
                          >
                            立即运行
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: add scheduler form */}
                  <div className="lg:col-span-5 bg-[#070709] border border-neutral-800 p-5 rounded-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-3 font-sans text-xs">
                      <span className="text-xs font-bold text-white block pb-1 border-b border-neutral-900">
                        ⚙️ 热部署新时针定时任务
                      </span>

                      <div className="space-y-1">
                        <label className="text-[9.5px] text-zinc-550 font-mono uppercase">任务命名 (Name):</label>
                        <input
                          type="text"
                          value={newCronName}
                          onChange={(e) => setNewCronName(e.target.value)}
                          placeholder="例如: 每日美发耗材审计"
                          className="w-full bg-black border border-neutral-800 rounded px-2.5 py-1.5 text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9.5px] text-zinc-550 font-mono uppercase">Cron 表达式:</label>
                          <input
                            type="text"
                            value={newCronExpr}
                            onChange={(e) => setNewCronExpr(e.target.value)}
                            className="w-full bg-black border border-neutral-800 rounded px-2.5 py-1.5 text-emerald-400 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9.5px] text-zinc-550 font-mono uppercase">优先级:</label>
                          <select
                            value={newCronPriority}
                            onChange={(e) => setNewCronPriority(e.target.value as any)}
                            className="w-full bg-black border border-neutral-800 rounded px-2.5 py-1.5 text-white font-mono cursor-pointer"
                          >
                            <option value="URGENT">🔴 URGENT</option>
                            <option value="NORMAL">🟡 NORMAL</option>
                            <option value="DEFERRED">🟢 DEFERRED</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9.5px] text-zinc-555 font-mono uppercase">调度制导指令:</label>
                        <textarea
                          value={newCronTask}
                          onChange={(e) => setNewCronTask(e.target.value)}
                          placeholder="描述该计划何时调度哪位智体..."
                          className="w-full bg-black border border-neutral-800 rounded p-2 text-white min-h-[3.5rem] leading-normal"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleAddCron}
                      className="w-full py-2 bg-[#1D9BF0] text-xs font-bold rounded-lg text-white font-sans active:scale-[0.98] mt-2 cursor-pointer duration-100"
                    >
                      注册并载入时序中枢
                    </button>
                  </div>

                </div>
              </motion.div>
            )}

            {/* Tab 6: Vector Memory connected to HyperMem */}
            {activeTab === 'memory' && (
              <motion.div
                key="memory"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="pb-3 border-b border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                      <Database className="w-4 h-4 text-[#1D9BF0]" />
                      <span>企业语义感知长期哈希脑 (HyperMem & Mem0 Matrix)</span>
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1 font-sans">
                      利用高维相似度比对，将老客消费偏好与物流故障防退包经验长期沉淀，越用越聪明。
                    </p>
                  </div>
                </div>

                <HyperMemEngine 
                  vectorDb={vectorDb}
                  onInsertMemory={handleInsertMemoryDB}
                  onAddLog={handleAddLog}
                />
              </motion.div>
            )}

            {/* Tab 7: Knowledge Engine connected to MarkItDown file extractor */}
            {activeTab === 'knowledge' && (
              <motion.div
                key="knowledge"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="pb-3 border-b border-neutral-800/80">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                    <BookOpen className="w-4 h-4 text-[#1D9BF0]" />
                    <span>垂直行业策略方案与 MarkItDown 提取中枢 (Domain Knowledge Bases)</span>
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-1 font-sans">
                    在这里查看当前垂直领域默认加载的采购规规，或者 **将您本地的 PDF、Word、Excel、HTML 通过 MarkItDown 一网扫存** 注入共享脑。
                  </p>
                </div>

                {/* Standard presets viewing matrix */}
                <div className="space-y-4 pb-6 border-b border-neutral-900">
                  <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-widest block">当前载入知识规章 Base ({currentKnowledge.label}):</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentKnowledge.rules.map((rule, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-neutral-850 bg-neutral-900/10 hover:border-neutral-700 duration-120 transition-all flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-[#1D9BF0] rounded-full animate-pulse" />
                            <span>{rule.title}</span>
                          </h4>
                          <p className="text-[10.5px] text-neutral-400 font-sans leading-relaxed mt-1">
                            {rule.content}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] font-mono text-zinc-650 uppercase">Config Rule payload:</span>
                          <div className="bg-black p-2 rounded text-[10px] font-mono text-emerald-400 max-h-[6rem] overflow-y-auto leading-relaxed">
                            <pre className="whitespace-pre-wrap">{rule.codeValue}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Microsoft MarkItDown Integration Hub Mount */}
                <MarkItDownHub 
                  currentIndustryLabel={currentKnowledge.label}
                  onSyncToKnowledge={handleMarkItDownSync}
                  onAddLog={handleAddLog}
                />
              </motion.div>
            )}

            {/* Tab 8: Model Compute Load Curve */}
            {activeTab === 'model' && (
              <motion.div
                key="model"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6 animate-fade-in"
              >
                <div className="pb-3 border-b border-neutral-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-display">
                    <Activity className="w-4 h-4 text-[#1D9BF0]" />
                    <span>多供应商算力配额与推理吞吐负载 (Model Engine Topology)</span>
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-1 font-sans">
                    MODAUI 平台支持模型故障热备份切换。当前正全天候对账算力 token 实时支出。
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Switch compute provider */}
                  <div className="lg:col-span-5 space-y-4">
                    <span className="text-[10px] font-bold text-neutral-400 font-mono block">切换算力主控脑 (Live Switch):</span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {Object.entries(modelMetrics).map(([key, item]) => {
                        const isSelected = activeModelProvider === key;
                        let themeBorder = isSelected ? 'border-[#1D9BF0] bg-[#1D9BF0]/5' : 'border-neutral-850 bg-neutral-900/10 hover:border-neutral-700';
                        return (
                          <div
                            key={key}
                            onClick={() => {
                              setActiveModelProvider(key as any);
                              handleAddLog(`【主算力变更】已切换全局推理主控脑为：${item.name}。价格：${item.costPerMillion}/M tokens。`);
                            }}
                            className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between space-y-2 ${themeBorder}`}
                          >
                            <div className="flex items-center justify-between leading-none">
                              <h4 className="text-xs font-bold text-white font-mono">{item.name}</h4>
                              {isSelected && <span className="bg-[#1D9BF0]/15 text-[#1D9BF0] px-1.5 py-0.2 rounded font-mono font-bold text-[8px] border border-[#1D9BF0]/25">ACTIVE</span>}
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-[8.5px] font-mono text-zinc-550 pt-1.5 border-t border-neutral-900/60">
                              <div>孔径: <span className="text-neutral-300 block mt-0.5">{item.limit}</span></div>
                              <div>算力价格: <span className="text-neutral-300 block mt-0.5">{item.costPerMillion}</span></div>
                              <div>实测吞吐: <span className="text-emerald-400 block mt-0.5">{item.speed}</span></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Real-time Load bar */}
                  <div className="lg:col-span-7 bg-[#070709] border border-neutral-800 p-6 rounded-xl flex flex-col justify-between space-y-4 font-mono">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-neutral-900 leading-none">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
                          <BarChart2 className="w-3.5 h-3.5 text-[#1D9BF0]" />
                          <span>全核每日算力吞吐折线 (Real-time Token Burn Audit)</span>
                        </span>
                        <span className="text-[9.5px] text-zinc-500 font-mono font-bold">10-SECOND REFRESH</span>
                      </div>

                      {/* Cool looking SVG representation */}
                      <div className="relative h-28 bg-black/40 border border-neutral-900 rounded-xl overflow-hidden flex items-end justify-between p-4 selection:bg-none">
                        <svg className="absolute inset-0 w-full h-full text-[#1D9BF0] opacity-40 fill-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <path d="M0,90 Q15,40 30,70 T60,20 T90,55" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>

                        <div className="flex items-end justify-between w-full h-full relative z-10 gap-1 rounded-sm">
                          {[35, 48, 25, 62, 85, 42, 60, 75, 49, 92, 59, 78].map((val, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                              <div 
                                className="w-full bg-gradient-to-t from-[#1D9BF0]/30 to-sky-400 rounded-t-sm"
                                style={{ height: `${val}%` }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                        <div className="p-3 bg-neutral-900/30 border border-neutral-850 rounded-lg">
                          <span className="text-[9px] font-mono text-[#1D9BF0] uppercase font-bold block">ACTIVE THREAD SAFETY:</span>
                          <p className="text-white font-bold mt-1 text-[11px]">{currentProviderMetric.securityRating}</p>
                        </div>

                        <div className="p-3 bg-neutral-900/30 border border-neutral-850 rounded-lg">
                          <span className="text-[9px] font-mono text-[#1D9BF0] uppercase font-bold block">CONCURRENT CAPACITY:</span>
                          <p className="text-white font-bold mt-1 text-[11px]">{currentProviderMetric.activeThreads} 条并行节点核心</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-neutral-900 bg-neutral-950 rounded-lg text-xs leading-none">
                      <span className="text-zinc-500 font-mono text-[10px]">自适应混淆温度 Temp: {customTemperature}</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={customTemperature}
                        onChange={(e) => setCustomTemperature(parseFloat(e.target.value))}
                        className="w-24 accent-[#1D9BF0] cursor-pointer"
                      />
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Real-time LLM Communication Pipeline Monitor Output */}
        <div className="p-5 border border-dashed border-[#2F3336]/60 bg-neutral-950/40 rounded-2xl space-y-3.5 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2.5 border-b border-[#2F3336]/40 gap-2">
            <span className="text-[10px] text-neutral-400 font-mono tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#1D9BF0]" />
              <span>智能运行舱核心系统总轨实况输出 (ModaUI Cognitive LLM Guard Monitor)</span>
            </span>
            <span className="text-[9px] text-zinc-550 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>SOCKET HOST • PORT: 3000 // AGENT_TUNNEL_LOGGED</span>
            </span>
          </div>

          <div className="max-h-[10rem] overflow-y-auto space-y-2 font-mono text-[11px] text-neutral-400 pr-1 select-text">
            {simLogs.map((l, idx) => (
              <p key={idx} className="leading-relaxed hover:text-white duration-100 transition-colors">
                <span className="text-neutral-500 mr-2 select-none">{`[COGNITIVE_ACK_${1000 + idx}]`}</span>
                {l}
              </p>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
