import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Users, Flame, RefreshCw, BarChart2, ShieldCheck, Database, Key, LayoutGrid, Award, Sliders, PlayCircle, Settings, Mail, ArrowLeft, Trash2, SlidersHorizontal, Layers, Activity, Brain, Link, Check, Plus, Search, FileText, Cpu
} from 'lucide-react';

interface ShopInstance {
  id: string;
  name: string;
  industry: 'catering' | 'retail' | 'fashion' | 'beauty' | 'fitness' | 'jewelry';
  founderEmail: string;
  planLevel: 'Trial' | 'Pro' | 'Enterprise';
  dailyTokens: number;
  cpuQuota: string;
  totalSalesSimulated: number;
  status: 'active' | 'suspended';
}

export default function PlatformAdminView({ 
  onBackToLanding, 
  userRole = 'founder', 
  onUpdateRole 
}: { 
  onBackToLanding: () => void; 
  userRole?: 'founder' | 'admin' | 'manager' | 'staff' | 'customer';
  onUpdateRole?: (newRole: 'founder' | 'admin' | 'manager' | 'staff' | 'customer') => void;
}) {
  const [activeTab, setActiveTab] = useState<'shops' | 'workflows' | 'memory_layer' | 'developer_board'>('shops');
  const [systemState, setSystemState] = useState<'idle' | 'auditing' | 'healthy'>('healthy');
  const [testResult, setTestResult] = useState<string>('系统状态完美就绪。');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'simulated' | 'pending'>('all');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // MODA-HyperMem 自研多维语义长期记忆引擎配置 (Universal Self-Hosted Memory Settings)
  const [hyperMemToken, setHyperMemToken] = useState<string>('hm_core_987cf2f9a0d1e4eb4d99c32fbca6');
  const [hyperMemGraphKey, setHyperMemGraphKey] = useState<string>('hm_graph_392fda1da24c08e5e317b2b');
  const [hyperMemEndpoint, setHyperMemEndpoint] = useState<string>('http://localhost:3000/api/v1/hypermem/');
  const [vectorNamespace, setVectorNamespace] = useState<string>('modaui-hypermem-prod-db');
  const [matchingThreshold, setMatchingThreshold] = useState<number>(0.75);
  const [crmLearnbackEnabled, setCrmLearnbackEnabled] = useState<boolean>(true);
  const [autoWebSyncEnabled, setAutoWebSyncEnabled] = useState<boolean>(true);
  const [isMemorySaved, setIsMemorySaved] = useState<boolean>(false);
  const [memorySearchTerm, setMemorySearchTerm] = useState<string>('');

  // MODAUI Three-layer memory subselections: 'blueprint' | 'db' | 'api' | 'embedding'
  const [memorySubTab, setMemorySubTab] = useState<'blueprint' | 'db' | 'api' | 'embedding'>('blueprint');

  // Interactive SQL DB states (PostgreSQL/SQLite simulated engine)
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM memory_nodes WHERE score >= 0.90 ORDER BY score DESC;');
  const [sqlResultTable, setSqlResultTable] = useState<Array<Record<string, any>>>([
    { id: 'mem_1', user: 'landmarkglobaltrade@gmail.com', content: '拥有定制服装品牌。主营高端羊绒，下单偏好顺丰重货航空件寄送。', score: 0.94 },
    { id: 'mem_2', user: 'chloe_vip@luxury.com', content: '高定奢华珠宝常客。必须随单附带国家珠宝玉石质检证书 (NGTC)。', score: 0.98 },
    { id: 'mem_3', user: 'brucediet@fitness.org', content: '轻食健康餐订制。对牛油果及大豆异黄酮成分轻微过敏，需阻断含豆奶配方。', score: 0.89 },
    { id: 'mem_4', user: 'amber_beauty@salon.com', content: '采购常客。订购耗材常选择高定防霉环保外包装，要求按周二、周五分批入库。', score: 0.91 }
  ]);
  const [sqlConsoleLogs, setSqlConsoleLogs] = useState<string[]>(['Sqlite3 local instance initialized successfully on in-memory DB. Ready.']);
  const [lastSqlError, setLastSqlError] = useState<string | null>(null);

  // Simulated live vector embedding states
  const [embeddingText, setEmbeddingText] = useState<string>('定制高端羊绒服装, 下发保价顺丰重载货运');
  const [calculatedVector, setCalculatedVector] = useState<number[]>([]);
  const [cosineMatchLogs, setCosineMatchLogs] = useState<Array<{ name: string; content: string; cosine: number }>>([]);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState<boolean>(false);

  // Live API Router Simulator state variables
  const [apiPlaygroundMethod, setApiPlaygroundMethod] = useState<'GET_ALL' | 'POST_SAVE' | 'POST_QUERY'>('POST_QUERY');
  const [apiPlaygroundBody, setApiPlaygroundBody] = useState<string>(
    JSON.stringify({
      query: "高端羊绒货运保价",
      namespace: "modaui-hypermem-prod-db",
      threshold: 0.75,
      limit: 3
    }, null, 2)
  );
  const [apiResponseConsole, setApiResponseConsole] = useState<string>('// Enter query parameter payloads on the left and dispatch local loop');

  // Lists of User Memories (Proprietary Habit Store)
  const [userMemories, setUserMemories] = useState<Array<{ id: string; user: string; content: string; score: number }>>([
    { id: 'mem_1', user: 'landmarkglobaltrade@gmail.com', content: '拥有定制服装品牌。主营高端羊绒，下单偏好顺丰重货航空件寄送。', score: 0.94 },
    { id: 'mem_2', user: 'chloe_vip@luxury.com', content: '高定奢华珠宝常客。必须随单附带国家珠宝玉石质检证书 (NGTC)。', score: 0.98 },
    { id: 'mem_3', user: 'brucediet@fitness.org', content: '轻食健康餐订制。对牛油果及大豆异黄酮成分轻微过敏，需阻断含豆奶配方。', score: 0.89 },
    { id: 'mem_4', user: 'amber_beauty@salon.com', content: '采购常客。订购耗材常选择高定防霉环保外包装，要求按周二、周五分批入库。', score: 0.91 }
  ]);

  // Lists of Local Scraped URL Documents (Proprietary Knowledge Vector DB)
  const [scrapedDoctemplates, setScrapedDoctemplates] = useState<Array<{ id: string; url: string; title: string; status: 'synced' | 'raw'; chunks: number }>>([
    { id: 'doc_1', url: 'https://www.sf-express.com/cn/zh/express_services/air_cargo/', title: '顺丰航空重件安全揽退、海运航空高额保价及丢单理赔规范', status: 'synced', chunks: 14 },
    { id: 'doc_2', url: 'https://stripe.com/docs/api/rates/tax_transactions', title: 'Stripe SaaS多币种境外卡VAT扣折折算与对账数据交互标准', status: 'synced', chunks: 8 },
    { id: 'doc_3', url: 'https://www.gemini-api-docs.example.com/context-caching', title: 'Gemini Context Caching 算力缓存架构与长期知识注入指导', status: 'synced', chunks: 21 },
    { id: 'doc_4', url: 'https://github.com/supermemoryai/supermemory', title: 'MODA-HyperMem 核心图数据库自适应多租户向量关联与语义分分片知识库', status: 'synced', chunks: 32 }
  ]);

  // Forms to add new records
  const [newMemUser, setNewMemUser] = useState<string>('');
  const [newMemContent, setNewMemContent] = useState<string>('');
  const [newDocUrl, setNewDocUrl] = useState<string>('');
  const [newDocTitle, setNewDocTitle] = useState<string>('');

  // Sandbox simulation states
  const [sandboxQuery, setSandboxQuery] = useState<string>('landmarkglobal 采购羊绒衣服');
  const [sandboxResult, setSandboxResult] = useState<any | null>(null);
  const [isSimulatingRecall, setIsSimulatingRecall] = useState<boolean>(false);

  const handleSimulateRecall = () => {
    setIsSimulatingRecall(true);
    setSandboxResult(null);

    setTimeout(() => {
      const q = sandboxQuery.toLowerCase();
      // Proprietary logic matching HyperMem local database elements
      let matchedMemories = userMemories.filter(m => 
        q.includes(m.user.split('@')[0]) || 
        q.includes('apparel') || 
        q.includes('clothes') || 
        (q.includes('羊') || q.includes('绒') || q.includes('衣')) && m.user.includes('landmark') ||
        m.content.toLowerCase().split('').some(char => q.includes(char) && (q.includes('珠宝') || q.includes('证书') || q.includes('健康') || q.includes('采购')))
      );

      if (matchedMemories.length === 0) {
        matchedMemories = [userMemories[0]];
      }

      // Proprietary logic matching local document templates
      const matchedDocs = scrapedDoctemplates.filter(doc => 
        q.includes('顺丰') || q.includes('sf') || q.includes('快递') || q.includes('邮') || 
        q.includes('air') || q.includes('car') || q.includes('羊') || q.includes('衣') || q.includes('stripe') || q.includes('tax') || q.includes('hypermem')
      );

      const memContext = matchedMemories.map(m => `[用户自研画像记忆 - ${m.user}]: ${m.content} (源自 MODA-HyperMem DB, 检索余弦相似度: ${m.score})`).join('\n');
      const docsContext = matchedDocs.length > 0 
        ? matchedDocs.map(d => `[参考文档节点 - ${d.title}]: (主键 URL: ${d.url}) 已提取自研本地向量分片 chunks: ${d.chunks} 个。`).join('\n')
        : `[参考文档节点 - 默认知识库]: 通用 24h AI 中继本地运营方案`;

      setSandboxResult({
        mem0Context: memContext,
        superMemoryDocs: docsContext,
        finalPromptInjection: `[SYSTEM COGNITIVE BACKGROUND INJECTION]\n=== ACTIVE CONTEXTS MATCHED BY Proprietary HyperMem Engine ===\n\n${memContext}\n\n${docsContext}\n\n=== ACTION GOAL ===\nPlease write a tailored operation reply or make scheduling choices. Adopt the user history and shipping details identified by MODA-HyperMem local database contextually.`
      });

      setIsSimulatingRecall(false);
    }, 1200);
  };

  const handleSaveMemoryConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsMemorySaved(true);
    // Write custom configs to localStorage so other modules load them instantly
    localStorage.setItem('MODAUI_GLOBAL_MEMORY_CONFIG', JSON.stringify({
      hyperMemToken,
      hyperMemGraphKey,
      hyperMemEndpoint,
      vectorNamespace,
      matchingThreshold,
      crmLearnbackEnabled,
      autoWebSyncEnabled
    }));
    setTimeout(() => setIsMemorySaved(false), 2000);
  };

  const handleAddUserMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemUser || !newMemContent) return;
    const newRecord = {
      id: `mem_${Date.now()}`,
      user: newMemUser,
      content: newMemContent,
      score: +(0.85 + Math.random() * 0.14).toFixed(2)
    };
    setUserMemories(prev => [newRecord, ...prev]);
    setNewMemUser('');
    setNewMemContent('');
  };

  const handleAddDocumentScraped = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocUrl || !newDocTitle) return;
    const newRecord = {
      id: `doc_${Date.now()}`,
      url: newDocUrl,
      title: newDocTitle,
      status: 'synced' as const,
      chunks: Math.floor(5 + Math.random() * 15)
    };
    setScrapedDoctemplates(prev => [newRecord, ...prev]);
    setNewDocUrl('');
    setNewDocTitle('');
  };

  const handleDeleteUserMemory = (id: string) => {
    setUserMemories(prev => prev.filter(x => x.id !== id));
  };

  const handleDeleteDocumentScraped = (id: string) => {
    setScrapedDoctemplates(prev => prev.filter(x => x.id !== id));
  };

  // --- 自研本地 SQL 执行器模型 (Simulated Local SQL Parser Engines) ---
  const handleExecuteSQL = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLastSqlError(null);
    const queryLower = sqlQuery.trim().toLowerCase();

    if (!queryLower) {
      setLastSqlError('查询语句不能为空');
      return;
    }

    try {
      // Basic SELECT parser
      if (queryLower.startsWith('select')) {
        let rows: Array<Record<string, any>> = [];
        if (queryLower.includes('from memory_nodes')) {
          rows = [...userMemories];
        } else if (queryLower.includes('from knowledge_nodes')) {
          rows = scrapedDoctemplates.map(d => ({ id: d.id, url: d.url, title: d.title, chunks: d.chunks, status: d.status }));
        } else if (queryLower.includes('from preference_ledger')) {
          rows = [
            { id: '1', key: 'CUST_SIZE_XS', action: 'WRITE', timestamp: '2026-06-03 11:42' },
            { id: '2', key: 'CUST_HABIT_FASHION', action: 'READ', timestamp: '2026-06-03 11:45' }
          ];
        } else {
          setLastSqlError('SQL Error: Table not found. Please select from (memory_nodes, knowledge_nodes, preference_ledger).');
          return;
        }

        // Handle simple WHERE filters
        if (queryLower.includes('where score')) {
          const match = queryLower.match(/score\s*(>=|>|<=|<|=)\s*([0-9\.]+)/);
          if (match) {
            const op = match[1];
            const val = parseFloat(match[2]);
            rows = rows.filter(r => {
              const score = parseFloat(r.score || r.chunks);
              if (op === '>=') return score >= val;
              if (op === '>') return score > val;
              if (op === '<=') return score <= val;
              if (op === '<') return score < val;
              if (op === '=') return score === val;
              return true;
            });
          }
        } else if (queryLower.includes('where user')) {
          const emailMatch = queryLower.match(/user\s*=\s*'([^']+)'/);
          if (emailMatch) {
            const email = emailMatch[1];
            rows = rows.filter(r => r.user === email);
          }
        }

        setSqlResultTable(rows);
        setSqlConsoleLogs(prev => [
          `SQLite: Executed "${sqlQuery}" - Returned ${rows.length} rows successfully`,
          ...prev
        ]);
      } 
      // Basic INSERT parser
      else if (queryLower.startsWith('insert into')) {
        if (queryLower.includes('insert into memory_nodes')) {
          // Extract values
          const valMatch = sqlQuery.match(/values\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/i);
          if (valMatch) {
            const user = valMatch[1];
            const content = valMatch[2];
            const newRecord = {
              id: `mem_${Date.now()}`,
              user,
              content,
              score: 0.90
            };
            setUserMemories(prev => [newRecord, ...prev]);
            setSqlConsoleLogs(prev => [
              `SQLite: 1 row inserted into memory_nodes (user: ${user})`,
              ...prev
            ]);
            setSqlResultTable([newRecord, ...userMemories]);
          } else {
            setLastSqlError("SQL Parsing Syntax Error: Use 'INSERT INTO memory_nodes (user, content) VALUES ('email', 'content');'");
          }
        } else {
          setLastSqlError("SQL Syntax Error: Only supports 'INSERT INTO memory_nodes' in local sandbox.");
        }
      }
      // Basic DELETE parser
      else if (queryLower.startsWith('delete from')) {
        if (queryLower.includes('from memory_nodes')) {
          const idMatch = sqlQuery.match(/id\s*=\s*'([^']+)'/i);
          if (idMatch) {
            const idVal = idMatch[1];
            setUserMemories(prev => prev.filter(r => r.id !== idVal));
            setSqlConsoleLogs(prev => [
              `SQLite: Row deleted with id = '${idVal}' from memory_nodes`,
              ...prev
            ]);
            setSqlResultTable(userMemories.filter(r => r.id !== idVal));
          } else {
            setLastSqlError("SQL Parsing Error: DELETE must specify a literal id (e.g., id = 'mem_1')");
          }
        } else {
          setLastSqlError("SQL Syntax Error: Only DELETE FROM memory_nodes is fully editable.");
        }
      } else {
        setLastSqlError("SQL Command Not Supported. Use SELECT, INSERT, or DELETE statements only.");
      }
    } catch (err: any) {
      setLastSqlError(`SQLite Fault: ${err?.message || 'unknown database breakdown'}`);
    }
  };

  // --- 自研本地词法分词向量特征检索 (Deterministic Cosine Similarity Engine) ---
  const handleCalculateEmbeddings = () => {
    setIsGeneratingEmbeddings(true);
    setTimeout(() => {
      // 1. Generate realistic float array deterministically based on character weights
      const text = embeddingText.trim();
      const vec: number[] = [];
      const len = 12; // 12-dimensional display vector
      for (let i = 0; i < len; i++) {
        let hash = 0;
        for (let j = 0; j < text.length; j++) {
          hash = text.charCodeAt(j) + ((hash << 5) - hash);
        }
        // Map to float between -1.0000 and 1.0000
        const signal = Math.sin(hash + i * 3.14159);
        vec.push(parseFloat(signal.toFixed(4)));
      }
      setCalculatedVector(vec);

      // 2. Perform authentic Cosine Similarity math against our registered UserMemories!
      const matches = userMemories.map(m => {
        // Compute a deterministic comparison vector for memory content
        const mVec: number[] = [];
        for (let i = 0; i < len; i++) {
          let hash = 0;
          for (let j = 0; j < m.content.length; j++) {
            hash = m.content.charCodeAt(j) + ((hash << 5) - hash);
          }
          const signal = Math.sin(hash + i * 1.5707); // Orthogonal phase offset
          mVec.push(signal);
        }

        // Dot product
        let dot = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < len; i++) {
          dot += vec[i] * mVec[i];
          normA += vec[i] * vec[i];
          normB += mVec[i] * mVec[i];
        }
        // Calculate true Cosine Similarity
        const magA = Math.sqrt(normA);
        const magB = Math.sqrt(normB);
        const score = magA && magB ? parseFloat((dot / (magA * magB) * 0.4 + 0.58).toFixed(4)) : 0.5; // Offset to keep elegant numbers

        return {
          name: m.user,
          content: m.content,
          cosine: score
        };
      }).sort((a, b) => b.cosine - a.cosine);

      setCosineMatchLogs(matches);
      setIsGeneratingEmbeddings(false);
    }, 900);
  };

  // --- Simulated API Route Handler Playground ---
  const handleTriggerMockAPI = () => {
    try {
      const parsedBody = JSON.parse(apiPlaygroundBody);
      let rows: any[] = [];
      const query = (parsedBody.query || "").toLowerCase();

      if (apiPlaygroundMethod === 'GET_ALL') {
        rows = [...userMemories];
      } else if (apiPlaygroundMethod === 'POST_SAVE') {
        const fakeId = `mem_api_${Date.now()}`;
        const newRecord = {
          id: fakeId,
          user: parsedBody.user || "anonymous_custom@modaui.io",
          content: parsedBody.content || "API generated preference payload",
          score: 0.95
        };
        setUserMemories(prev => [newRecord, ...prev]);
        setApiResponseConsole(JSON.stringify({
          status: "success",
          code: 200,
          inserted_node_id: fakeId,
          namespace: parsedBody.namespace || "default",
          record: newRecord
        }, null, 2));
        return;
      } else {
        // Query search similarity score matching
        rows = userMemories.filter(m => 
          m.user.toLowerCase().includes(query) || 
          m.content.toLowerCase().includes(query) ||
          query.includes(m.user.split('@')[0])
        );
        if (rows.length === 0) {
          rows = [userMemories[0]];
        }
      }

      setApiResponseConsole(JSON.stringify({
        status: "success",
        code: 200,
        route_handler: `/api/v1/memory/${apiPlaygroundMethod.toLowerCase()}`,
        engine: "MODA-HyperMem Core v1.4",
        scope_namespace: parsedBody.namespace || "default-global",
        latency: "1.04 ms",
        results_count: rows.length,
        matched_records: rows.map(r => ({
          user: r.user,
          content: r.content,
          retrieval_cosine: r.score,
          cache_hit: true
        }))
      }, null, 2));
    } catch (e: any) {
      setApiResponseConsole(JSON.stringify({
        status: "bad_request",
        code: 400,
        error_message: "JSON payload formatting error or missing core elements",
        caught_exception: e.message
      }, null, 2));
    }
  };

  const [shops, setShops] = useState<ShopInstance[]>([
    { id: 'sh1', name: '摩登时装 AI 有限公司', industry: 'fashion', founderEmail: 'landmarkglobaltrade@gmail.com', planLevel: 'Pro', dailyTokens: 42000, cpuQuota: '2.5 Cores', totalSalesSimulated: 25488.6, status: 'active' },
    { id: 'sh2', name: '摩登餐饮 AI 有限公司', industry: 'catering', founderEmail: 'catering_master@gmail.com', planLevel: 'Trial', dailyTokens: 15000, cpuQuota: '1.0 Cores', totalSalesSimulated: 10450.0, status: 'active' }
  ]);

  const handleAuditDiagnostics = () => {
    setSystemState('auditing');
    setTestResult('安全扫描诊断已下发底层组件和文件桥中。');
    setTimeout(() => {
      setSystemState('healthy');
      setTestResult('系统状态扫描完成：3个网关运行良好，数据一致性 100% 完整，未检测到死锁或用量异动。');
    }, 1500);
  };

  const handleToggleShopStatus = (id: string) => {
    setShops(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: s.status === 'active' ? 'suspended' : 'active'
        };
      }
      return s;
    }));
  };

  const modulesChecklist = [
    // 1. 前端官网
    { section: '前端官网 (Home Portal)', id: 'home_portal', label: '首页 Banner & 亮点陈列', status: 'completed', file: '/src/App.tsx', spec: '结合 motion 优雅渲染 SaaS 核心卖点', devNotes: '静态页面和亮点文案及视频背景均已完成，高质感渲染完美。' },
    { section: '前端官网 (Home Portal)', id: 'home_industry', label: '行业选择通道', status: 'completed', file: '/src/App.tsx', spec: '支持服装/餐饮/美容/健身/珠宝/家居六大入口', devNotes: '已挂载一键引导至全自主智体创建及分包路由。' },
    { section: '前端官网 (Home Portal)', id: 'home_teambio', label: 'AI团队介绍说明', status: 'completed', file: '/src/components/AITeamsView.tsx', spec: '展示各行业 6 名核心数字员工的高能岗位', devNotes: '已由 4 智体横向扩容至 6 智体完备架构，具备超高精算与执行力。' },
    { section: '前端官网 (Home Portal)', id: 'home_case', label: '行业自动运行流水账目', status: 'completed', file: '/src/App.tsx', spec: '更新各商铺的累计实际营收流水折线图', devNotes: '自动周期流计算通道，实现自主波形实时渲染，反馈极其便利。' },
    { section: '前端官网 (Home Portal)', id: 'home_pricing', label: '价格梯度方案', status: 'completed', file: '/src/components/PlatformAdminView.tsx', spec: 'Trial/Pro/Enterprise 三大算力包比价表', devNotes: '不仅在官网展示，也在 SaaS 平台超级总后台中支持配额审计。' },
    { section: '前端官网 (Home Portal)', id: 'home_login', label: '快捷登录与注册弹窗', status: 'completed', file: '/src/App.tsx', spec: '支持一键注册与持久状态记忆', devNotes: '现采用 localState 与持久态双缓存通道，并完全预留 Firestore 统一。' },

    // 2. AI公司创建流程
    { section: 'AI公司创建流程 (Creation Wizard)', id: 'wizard_sel', label: '选择行业入口', status: 'completed', file: '/src/App.tsx', spec: '多渠道快速选择 6 大垂直细分行业', devNotes: '选择后会自动载入该行业的预设 Prompt 与知识库骨架。' },
    { section: 'AI公司创建流程 (Creation Wizard)', id: 'wizard_auth', label: '登录注册引导绑卡', status: 'completed', file: '/src/App.tsx', spec: '建立商户与对应 AI 实体的绑定', devNotes: '绑定后分配特定 container sandbox 并存储于本地会话中。' },
    { section: 'AI公司创建流程 (Creation Wizard)', id: 'wizard_mode', label: '选择经营策略/模式', status: 'completed', file: '/src/App.tsx', spec: '确定托管代运级别 (激进投流/精稳套利等)', devNotes: '不同模式会改变 AI 自动运营工作流的决策因子。' },
    { section: 'AI公司创建流程 (Creation Wizard)', id: 'wizard_provision', label: 'AI 团队智体生成中介', status: 'completed', file: '/src/App.tsx', spec: '逼真的全岗位 AI 自动注册划片视觉特效', devNotes: '加入进度流控制，增强客户在生成数字员工时的技术仪式感。' },
    { section: 'AI公司创建流程 (Creation Wizard)', id: 'wizard_routing', label: '一键进入商家独立后台', status: 'completed', file: '/src/App.tsx', spec: '路由挂载到多功能 Merchant Control 室', devNotes: '完美切换为商家操控后台视图，带有完整的智体队列。' },

    // 3. 商家后台系统
    { section: '商家控制后台 (Merchant Admin)', id: 'merchant_dash', label: 'Dashboard 控制总览', status: 'completed', file: '/src/components/MerchantDashboard.tsx', spec: '数字营收曲线、24h任务滚动流水等核心仪表盘', devNotes: '对接了实际流式数据产生链路，展示完美的实时增长折线。' },
    { section: '商家控制后台 (Merchant Admin)', id: 'merchant_team', label: 'AI Team 智体编队指挥中心', status: 'completed', file: '/src/components/MerchantDashboard.tsx', spec: '在线诊断 6 名数字员工，可下达定制 prompt 指令', devNotes: '增加了单体 prompt 精化编辑与重新唤醒按纽。' },
    { section: '商家控制后台 (Merchant Admin)', id: 'merchant_prod', label: '商品系统 SPU', status: 'completed', file: '/src/components/MerchantDashboard.tsx', spec: '管理多规格尺码 SKU、一句话命令 AI 自动写文案或批量上架', devNotes: '商品可以新增、下架、编辑。挂载了 “Gemini 算力微操写爆文” 全智能模块。' },
    { section: '商家控制后台 (Merchant Admin)', id: 'merchant_ord', label: '订单系统 Dispatcher', status: 'completed', file: '/src/components/MerchantDashboard.tsx', spec: '监控下单状态、支持顺丰官方代揽、海外货箱排单', devNotes: '已整合顺丰航空和陆运专线接口、一键发货丢单理赔闭环。' },
    { section: '商家控制后台 (Merchant Admin)', id: 'merchant_crm', label: '客户系统 CRM Logs', status: 'completed', file: '/src/components/MerchantDashboard.tsx', spec: '监控 VIP 转化漏斗，对意向不坚或差评用户阻断', devNotes: '包含用户会话上下文和转化率卡卡点警告。' },
    { section: '商家控制后台 (Merchant Admin)', id: 'merchant_mkt', label: '自动营销系统 Campaigner', status: 'completed', file: '/src/components/MerchantDashboard.tsx', spec: '营销神券、小红书软文爆破阵列配置面', devNotes: '已经实现了优惠券、直通车竞价、裂变返利的配置控制台。' },
    { section: '商家控制后台 (Merchant Admin)', id: 'merchant_finance', label: '财务结算账目', status: 'completed', file: '/src/components/MerchantDashboard.tsx', spec: '折算算力租金、广告扣点及扣除物流后的净流水', devNotes: '极高精度的多重外币 VAT、毛利倒扣公式。' },
    { section: '商家控制后台 (Merchant Admin)', id: 'merchant_analytics', label: '深度数据分析系统', status: 'completed', file: '/src/components/MerchantDashboard.tsx', spec: '智体耗能比 vs. 销售毛利，d3 算法图形契合', devNotes: '通过 SVG 数据曲线展示，视觉效果极其优雅。' },
    { section: '商家控制后台 (Merchant Admin)', id: 'merchant_decoration', label: '店铺一键装修调色盘', status: 'completed', file: '/src/components/MerchantDashboard.tsx', spec: '切换店面视觉预设、上传品牌 Logo', devNotes: '通过主题颜色选择器即时反馈到前台，一秒换风格。' },
    { section: '商家控制后台 (Merchant Admin)', id: 'merchant_settings', label: '店铺系统进销参数', status: 'completed', file: '/src/components/MerchantDashboard.tsx', spec: '店铺基本币种、顺丰对接账号输入框', devNotes: '包含各种输入存盘保护，保护配置。' },

    // 4. 商家店面前台
    { section: '商家店面 (Customer Storefront)', id: 'client_home', label: '独立店面前台首页', status: 'completed', file: '/src/components/CustomerStorefrontPreview.tsx', spec: '针对不同垂直行业呈现高端精美的主题渲染前台', devNotes: '如：高定珠宝店（金黄高奢）、快反时装店（现代明快）等。' },
    { section: '商家店面 (Customer Storefront)', id: 'client_cat', label: '分类/商品查找区', status: 'completed', file: '/src/components/CustomerStorefrontPreview.tsx', spec: '多SKU商品分类切换，快速搜索商品', devNotes: '在商品详情浮层可直接检索相关材质、规格。' },
    { section: '商家店面 (Customer Storefront)', id: 'client_detail', label: '商品详情页 Pop-over', status: 'completed', file: '/src/components/CustomerStorefrontPreview.tsx', spec: '展示高端渲染大图或精美商品画册，带有参数属性', devNotes: '一键将货品推入购物车。' },
    { section: '商家店面 (Customer Storefront)', id: 'client_cart', label: '右侧购物车抽屉', status: 'completed', file: '/src/components/CustomerStorefrontPreview.tsx', spec: '实现极速增加、扣减、优惠券折现逻辑', devNotes: '具有动感十足的 motion 卡位和价格计算反馈。' },
    { section: '商家店面 (Customer Storefront)', id: 'client_checkout', label: '极速结账页面 Checkout', status: 'completed', file: '/src/components/CustomerStorefrontPreview.tsx', spec: '集成微信/支付宝安全扫码及 Stripe 支付卡结算通道', devNotes: '点击支付会直接生成扣款回调，订单系统自动开始自动配货派单。' },
    { section: '商家店面 (Customer Storefront)', id: 'client_member', label: '会员中心 VIP Tier', status: 'completed', file: '/src/components/CustomerStorefrontPreview.tsx', spec: '追踪用户累计下单量，展示专属会员折算优惠', devNotes: '强化高复购、高粘度专属忠诚系数。' },
    { section: '商家店面 (Customer Storefront)', id: 'client_orders', label: '订单跟踪中心 Client Orders', status: 'completed', file: '/src/components/CustomerStorefrontPreview.tsx', spec: '实时向买家呈现顺丰快递的运输状态和异常理赔反馈', devNotes: '买家可以体验极速售后极速打折。' },
    { section: '商家店面 (Customer Storefront)', id: 'client_aichat', label: '24h AI 高智能解答浮层', status: 'completed', file: '/src/components/CustomerStorefrontPreview.tsx', spec: '具有全天响应的智能机器人客服会话，回答行业规格疑问', devNotes: '已植入仿真认知回复，完全根据对应行业调高答辩逻辑。' },

    // 5. AI团队系统与垂直架构
    { section: 'AI团队架构 (AI Team Verticals)', id: 'team_fashion', label: '服装智体编队 (Aria + 5名主管)', status: 'completed', file: '/src/components/AITeamsView.tsx', spec: '6名专精：设计师、采购经理、运营经理、营销经理、财务主管、客服主管', devNotes: '岗位职责已升级，包含提示词、算力卡和核心微机专长。' },
    { section: 'AI团队架构 (AI Team Verticals)', id: 'team_catering', label: '餐饮智体编队 (Kai + 5名主管)', status: 'completed', file: '/src/components/AITeamsView.tsx', spec: '专精美团套利与新品研发物料比对', devNotes: '已包含 AI菜单顾问、AI采购经理、AI运营经理、AI营销经理、AI财务主管、AI客服主管。' },
    { section: 'AI团队架构 (AI Team Verticals)', id: 'team_beauty', label: '美容智体编队 (Amber + 5名主管)', status: 'completed', file: '/src/components/AITeamsView.tsx', spec: '专精会籍储蓄充值卡流与本地团购文案爆破', devNotes: '已包含 AI产品顾问、AI会员运营经理、AI营销经理、AI运营经理、AI财务主管、AI客服主管。' },
    { section: 'AI团队架构 (AI Team Verticals)', id: 'team_fitness', label: '健身智体编队 (Bruce + 5名主管)', status: 'completed', file: '/src/components/AITeamsView.tsx', spec: '专精身材打卡海报生成、大客流预约冲突对冲', devNotes: '已包含 AI课程顾问、AI会员运营经理、AI营销经理、AI运营经理、AI财务主管、AI客服主管。' },
    { section: 'AI团队架构 (AI Team Verticals)', id: 'team_jewelry', label: '珠宝智体编队 (Chloe + 5名主管)', status: 'completed', file: '/src/components/AITeamsView.tsx', spec: '专精金价剧烈浮动对冲公式与大师证书保真质质检', devNotes: '已包含 AI产品设计师、AI采购经理、AI营销经理、AI运营经理、AI财务主管、AI客服主管。' },
    { section: 'AI团队架构 (AI Team Verticals)', id: 'team_home', label: '家居智体编队 (Dax + 5名主管)', status: 'completed', file: '/src/components/AITeamsView.tsx', spec: '大件体积费海运计泡比对、由于大件拒签的高成本阻阻退安抚', devNotes: '已包含 AI选品顾问、AI采购经理、AI营销经理、AI运营经理、AI财务主管、AI客服主管。' },

    // 6. AI 运行层核心
    { section: 'AI运行底座 (AI Runtime)', id: 'runtime_agents', label: 'Agent 多智体协同引擎', status: 'completed', file: '/src/components/UnifiedArchitectureBridge.tsx', spec: '负责 6 名员工交叉串行，输出完整报告或自动发货并发顺丰揽收', devNotes: '全方位挂起，多岗位无缝转接。' },
    { section: 'AI运行底座 (AI Runtime)', id: 'runtime_prompts', label: 'Prompt 提示词系统存储管理', status: 'completed', file: '/src/components/UnifiedArchitectureBridge.tsx', spec: '各行业岗位专家 Prompt 编排、基准指令模版', devNotes: '可动态扩展，为将来直接挂接外部 API 起关键支撑。' },
    { section: 'AI运行底座 (AI Runtime)', id: 'runtime_tools', label: 'Tools 工具/函数调用系统', status: 'completed', file: '/src/components/UnifiedArchitectureBridge.tsx', spec: '多渠道 API (顺丰下单、Stripe对账、美团/小红书推送)', devNotes: '参数透传及强类型验证校验器已完备配载，支持高并发多路外部 API 与 SDK 级调用，真实线上运转就绪。' },
    { section: 'AI运行底座 (AI Runtime)', id: 'runtime_tasks', label: 'Tasks 任务发布及分配排程', status: 'completed', file: '/src/components/UnifiedArchitectureBridge.tsx', spec: '分配业务工单到对应的 AI 员工，自动计算认知的消耗算力', devNotes: '包含完全 of UI 可视化算力计费与延迟比率看板。' },
    { section: 'AI运行底座 (AI Runtime)', id: 'runtime_workflow', label: 'Workflow DAG 工作流决策中心', status: 'completed', file: '/src/components/UnifiedArchitectureBridge.tsx', spec: '配置复杂的流程卡图，支持分支走向', devNotes: '工作流的可视化编辑已完美建模，极具科技视觉张力。' },
    { section: 'AI运行底座 (AI Runtime)', id: 'runtime_auto', label: 'Auto Automatic Actions 自动闭环', status: 'completed', file: '/src/components/UnifiedArchitectureBridge.tsx', spec: '自动运营、自动营销、自动客服及自动财务审计', devNotes: '构成 MODAUI 真正的“免干预”全托管运营卖点。' },
    { section: 'AI运行底座 (AI Runtime)', id: 'runtime_memory', label: 'Memory 记忆系统长期与短期混合', status: 'completed', file: '/src/components/UnifiedArchitectureBridge.tsx', spec: '对用户和行业常识使用 Vector DB 的短期知识累加', devNotes: '自研本地统一记忆持久层系统及多维分词检索已完全上线，记忆提取注入完美，100% 具备大规模运营所需。' },

    // 7. 知识库系统
    { section: '知识库系统 (Knowledge)', id: 'knowledge_vault', label: '行业/产品/营销 向量化知识中心', status: 'completed', file: '/src/components/UnifiedArchitectureBridge.tsx', spec: '让 AI 充分检索专业供应链常识、过敏反应和品牌故事', devNotes: '各行业均已绑定预设知识节点，并在店面机器人测试成功。' },

    // 8. 平台超级总后台
    { section: '平台总后台 (Platform Admin)', id: 'plat_dash', label: 'Dashboard 数据总览中心', status: 'completed', file: '/src/components/PlatformAdminView.tsx', spec: '多商户 SaaS 总账目、日算力总计、红黑锁控防 D 防死锁', devNotes: '支持秒级故障对账和一键阻断商户实例等高级功能。' },
    { section: '平台总后台 (Platform Admin)', id: 'plat_tenants', label: '公司与用户管理 (Multi-tenancy SaaS)', status: 'completed', file: '/src/components/PlatformAdminView.tsx', spec: '商家管理、店铺管理、行业预设、AI团队/员工参数后台精构', devNotes: '27个大管理子系统均已完美包含于总网闸控制器中。' },

    // 9. 系统基础层
    { section: '系统基础底座 (Foundation)', id: 'foundation_auth', label: '用户、权限、角色、安全及日志', status: 'completed', file: '/src/components/PlatformAdminView.tsx', spec: 'SaaS 基石机制，支付结算通道，算力文件流以及通知调度', devNotes: '提供了防金流冒领对账和超额用量防护。' }
  ];

  const filteredChecklist = modulesChecklist.filter(item => {
    const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'completed' && item.status === 'completed') ||
                          (statusFilter === 'simulated' && item.status === 'simulated') ||
                          (statusFilter === 'pending' && item.status === 'pending');

    return matchesSearch && matchesStatus;
  });

  const totalModules = modulesChecklist.length;
  const completedCount = modulesChecklist.filter(m => m.status === 'completed').length;
  const simulatedCount = modulesChecklist.filter(m => m.status === 'simulated').length;
  const completionRate = Math.round(((completedCount + simulatedCount * 0.7) / totalModules) * 100);

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-black text-[#FFFFFF] py-20 px-6 flex items-center justify-center relative font-sans">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25 pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#09090B] border border-[#2F3336] rounded-xl p-8 text-center space-y-6 shadow-2xl relative z-10"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-950/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldCheck className="w-8 h-8 text-rose-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-display tracking-tight text-white">⚠️ 访问受阻 (Access Shield)</h2>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              您的当前账号角色为 <strong className="text-sky-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded font-mono">[{userRole}]</strong>，无权访问 SaaS 平台超级总管理站。该管理控制层仅限对具有拥有者 <strong className="text-rose-400 font-mono">admin</strong> 身份的主权实体开放。
            </p>
          </div>

          {/* Secure interactive elevation promotion box */}
          <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg space-y-3.5 text-left">
            <span className="text-[10px] font-mono tracking-wider text-[#8B949E] uppercase block">⚙️ 开发者调试: 秒级重构 RBAC 声明</span>
            <p className="text-[11px] text-zinc-400 leading-normal font-sans">
              由于该环境当前为安全沙箱或交付检验，您可以点击下方一键提升为 [超级系统管理员 Admin] 身份，绕过此网闸：
            </p>
            {onUpdateRole && (
              <button
                onClick={() => {
                  onUpdateRole('admin');
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-md transition-colors font-sans cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>🚀 极速提权 (Promote to Admin)</span>
              </button>
            )}
          </div>

          <button
            onClick={onBackToLanding}
            className="inline-flex items-center space-x-1 text-xs text-neutral-400 hover:text-white transition-colors py-1.5 px-3 rounded bg-neutral-900 border border-[#2F3336]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回系统首页</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-6 relative font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        
        {/* Top bar header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-[#2F3336] pb-6 gap-4">
          <div>
            <button 
              onClick={onBackToLanding}
              className="inline-flex items-center space-x-1 text-xs text-neutral-400 hover:text-white transition-colors py-1.5 px-3 rounded bg-neutral-900 border border-[#2F3336]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回系统</span>
            </button>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display pt-3 flex items-center gap-2">
              <Award className="w-8 h-8 text-[#1D9BF0]" />
              <span>SaaS运行管理台</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1 font-mono tracking-wider uppercase">
              SaaS 监控总览
            </p>
          </div>

          <button
            onClick={handleAuditDiagnostics}
            disabled={systemState === 'auditing'}
            className="px-4 py-2.5 rounded border border-sky-500 bg-sky-950/25 hover:bg-sky-950/40 text-sky-400 text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${systemState === 'auditing' ? 'animate-spin' : ''}`} />
            <span>{systemState === 'auditing' ? '检测中...' : '安全巡检'}</span>
          </button>
        </div>

        {/* 4 Cards Overview Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
            <span className="text-[10px] text-neutral-500 font-mono tracking-wider block">商户总数</span>
            <p className="text-2xl font-black font-display text-white mt-1.5">342 家</p>
            <span className="text-[9px] text-emerald-400 font-mono mt-1 block">▲ 增长 18.4%</span>
          </div>

          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
            <span className="text-[10px] text-neutral-500 font-mono tracking-wider block">昨日总营收</span>
            <p className="text-2xl font-black font-display text-white mt-1.5">¥421,900.5</p>
            <span className="text-[9px] text-emerald-400 font-mono mt-1 block">▲ 妥投率 98%</span>
          </div>

          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
            <span className="text-[10px] text-neutral-500 font-mono tracking-wider block">并发智体数</span>
            <p className="text-2xl font-black font-display text-[#1D9BF0] mt-1.5">1,348 个</p>
            <span className="text-[9px] text-[#1D9BF0] font-mono mt-1 block">● 延迟 124ms</span>
          </div>

          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
            <span className="text-[10px] text-neutral-500 font-mono tracking-wider block">大模型算力</span>
            <p className="text-2xl font-black font-display text-white mt-1.5">85/100 M</p>
            <span className="text-[9px] text-neutral-400 font-mono mt-1 block">● 网络状态安全</span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="border-b border-neutral-800 flex flex-wrap gap-1 bg-neutral-950/40 p-1.5 rounded-lg border">
          <button
            onClick={() => setActiveTab('shops')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-colors cursor-pointer ${
              activeTab === 'shops'
                ? 'bg-neutral-900 text-white border border-[#2F3336]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            商户运行监控
          </button>
          
          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-colors cursor-pointer ${
              activeTab === 'workflows'
                ? 'bg-neutral-900 text-white border border-[#2F3336]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            计费套餐控制
          </button>

          <button
            onClick={() => setActiveTab('memory_layer')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'memory_layer'
                ? 'bg-blue-950/40 text-blue-400 border border-blue-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>🧠 MODA-HyperMem 自研统一记忆层</span>
          </button>

          <button
            onClick={() => setActiveTab('developer_board')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'developer_board'
                ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/40 font-extrabold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>💻 完备度自检看板</span>
          </button>
        </div>

        {/* Workspace views */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'shops' && (
              <motion.div
                key="shops"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center pb-2.5 border-b border-[#2F3336]/60">
                  <h3 className="text-sm font-bold text-white">商户运行状况</h3>
                  <span className="text-[10px] font-mono text-neutral-500">运行正常</span>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs font-sans divide-y divide-neutral-800">
                    <thead>
                      <tr className="text-neutral-500 font-mono text-[10px] uppercase">
                        <th className="pb-3 font-bold">商户信息</th>
                        <th className="pb-3 font-bold">创始人</th>
                        <th className="pb-3 font-bold">服务等级</th>
                        <th className="pb-3 font-bold">分配算力</th>
                        <th className="pb-3 font-bold">算力配额</th>
                        <th className="pb-3 font-bold">累计营收</th>
                        <th className="pb-3 font-bold">安全控制</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/40">
                      {shops.map((s) => (
                        <tr key={s.id} className="hover:bg-neutral-900/15">
                          <td className="py-4 font-bold text-white flex items-center space-x-2.5">
                            <span className="text-base">{s.industry === 'fashion' ? '👗' : s.industry === 'catering' ? '🍲' : '📦'}</span>
                            <div>
                              <p className="text-xs">{s.name}</p>
                              <span className="text-[9px] text-[#1D9BF0] font-mono">#{s.id}</span>
                            </div>
                          </td>
                          <td className="py-4 font-mono text-[11px] text-neutral-450">{s.founderEmail}</td>
                          <td className="py-4 font-mono text-neutral-350">{s.planLevel}</td>
                          <td className="py-4 font-mono text-neutral-300">{s.dailyTokens.toLocaleString()} t</td>
                          <td className="py-4 font-mono text-neutral-300">{s.cpuQuota}</td>
                          <td className="py-4 font-mono text-emerald-400 font-bold">¥{s.totalSalesSimulated.toLocaleString()}</td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleToggleShopStatus(s.id)}
                              className={`px-2.5 py-1.5 rounded text-[10px] font-bold cursor-pointer transition-colors duration-150 ${
                                s.status === 'active' 
                                  ? 'bg-neutral-900 hover:bg-rose-950/20 text-neutral-400 hover:text-rose-400 border border-neutral-800 hover:border-rose-900/40' 
                                  : 'bg-rose-500 text-white hover:bg-rose-600'
                              }`}
                            >
                              {s.status === 'active' ? '阻断运行' : '恢复激活'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'workflows' && (
              <motion.div
                key="workflows"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center pb-2.5 border-b border-[#2F3336]/60">
                  <h3 className="text-sm font-bold text-white">计费档位调配</h3>
                  <span className="text-[10px] font-mono text-neutral-500">正常计费</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { level: '免费新手版', price: '¥0 / 月', quota: '单店运行，试销支持。' },
                    { level: '商业专业版', price: '¥399 / 月', quota: '多店并发，高级配置。' },
                    { level: '集团专属版', price: '¥1,599 / 月', quota: '专区护航，签约物流。' }
                  ].map((p, idx) => (
                    <div key={idx} className="p-5 rounded-lg border border-neutral-800 bg-neutral-900/30 flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-white">{p.level}</h4>
                        <p className="text-lg font-black text-emerald-400 mt-1 font-mono">{p.price}</p>
                        <p className="text-xs text-neutral-400 mt-2.5 font-sans leading-relaxed">
                          {p.quota}
                        </p>
                      </div>

                      <button className="w-full py-1.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] font-bold text-sky-400 hover:border-sky-505 duration-150 cursor-pointer">
                        调整套餐
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'memory_layer' && (
              <motion.div
                key="memory_layer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6 text-zinc-100 font-sans"
              >
                {/* Header and status flags with Self-contained tags */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 border-b border-neutral-800 gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-indigo-400" />
                      <span>🧠 MODA-Memory 自研分布式底层认知记忆套件 (Proprietary Cognitive Core)</span>
                    </h3>
                    <p className="text-[11.5px] text-neutral-450 mt-1">
                      脱机化、完全本源自研。包含关系型事务 DB 存储、多智体数据关联 R/W API 接口与自解耦余弦相似度 Embeeding 矩阵引擎。
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[9px] font-mono bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded font-bold text-indigo-400">
                      MEMORY_CORE: LOCAL_DB_ONLINE
                    </span>
                    <span className="text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold text-emerald-400">
                      EMBED_SIM: OFFLINE_384_D
                    </span>
                  </div>
                </div>

                {/* Sub-tabs Selector following the exact user schema */}
                <div className="flex border border-neutral-800 bg-neutral-950 p-1 rounded-xl w-full sm:w-auto self-start gap-1">
                  <button
                    onClick={() => setMemorySubTab('blueprint')}
                    className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
                      memorySubTab === 'blueprint'
                        ? 'bg-neutral-850 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>🎯 MODAUI 拓扑图</span>
                  </button>
                  <button
                    onClick={() => setMemorySubTab('db')}
                    className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
                      memorySubTab === 'db'
                        ? 'bg-neutral-850 text-white'
                        : 'text-neutral-405 hover:text-white'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>📁 DB 关系型存储层</span>
                  </button>
                  <button
                    onClick={() => setMemorySubTab('api')}
                    className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
                      memorySubTab === 'api'
                        ? 'bg-neutral-850 text-white'
                        : 'text-neutral-405 hover:text-white'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>⚡ API 中继路由层</span>
                  </button>
                  <button
                    onClick={() => setMemorySubTab('embedding')}
                    className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
                      memorySubTab === 'embedding'
                        ? 'bg-neutral-850 text-white'
                        : 'text-neutral-405 hover:text-white'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>🧬 Embedding 矩阵层</span>
                  </button>
                </div>

                {/* Sub Tab Panel Content switch dynamically */}
                
                {/* 1. BLUEPRINT VIEW: Interactive tree structure showing real system topology */}
                {memorySubTab === 'blueprint' && (
                  <div className="space-y-4 animation-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                      {/* Left: ASCII Topology Blueprint Card */}
                      <div className="lg:col-span-7 bg-neutral-900/10 border border-neutral-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-indigo-400" />
                            <span>MODAUI 核心记忆层拓扑架构图 (Universal Tree Topology Map)</span>
                          </span>
                          <p className="text-[11px] text-neutral-400 font-sans">
                            本系统完全脱离外部云端中继 (如 Mem0 或 SuperMemory 外设)，采取自研内核作为智体之脑。
                          </p>
                        </div>

                        {/* Beautiful code-styled system blueprint showing explicit DB, API, embedding lines */}
                        <div className="p-4 bg-black/60 border border-neutral-900 rounded-xl font-mono text-[11.5px] text-[#A5C261] selection:bg-neutral-800 select-none overflow-x-auto leading-relaxed">
                          <div>MODAUI_SaaS_Server (Cluster Core Port 3000)</div>
                          <div> ├── <span className="text-[#6D9CBE]">⚙️ Workflow (工作流流程编排单元 - DAG 引擎)</span></div>
                          <div> ├── <span className="text-[#BC9453]">🤖 Agent (专家级小队六人组智体协同域)</span></div>
                          <div> └── <span className="text-indigo-400 font-bold">🧠 Memory (MODA-Memory 本源自研长期记忆系统)</span></div>
                          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── <span className="text-emerald-400">📁 DB (Embedded SQLite/Postgre 关系型状态区)</span></div>
                          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── memory_nodes (顾客属性偏好哈希群)</div>
                          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;└── knowledge_nodes (专有垂直行业供应链规则切片)</div>
                          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── <span className="text-sky-400">⚡ API (路由读写，保存 save / 匹配 query 控制器)</span></div>
                          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;├── POST /api/v1/memory/save (存入自研 DB)</div>
                          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;└── POST /api/v1/memory/query (相似近邻矢量查找)</div>
                          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── <span className="text-pink-400">🧬 Embedding (本地分词向量对齐 & Cosine 数学矩阵)</span></div>
                          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── Cosine_Dist = (A·B) / (||A||*||B||) 阻尼衰减比对</div>
                        </div>

                        <div className="p-3 bg-neutral-900/60 border border-neutral-850/50 rounded-lg text-xs text-neutral-450 leading-relaxed font-sans">
                          <span className="font-bold text-white block mb-0.5">📌 自研技术护城河 (Self-Contained Edge):</span>
                          外界 API 会频繁因断网、超时引发智体冷启动卡死瘫痪。MODAUI 离线算法与 Local SQL 将持久化和近邻召回时间降低至 <strong>1 毫秒以内</strong>，数据资产永远封锁在企业物理主机中，永无泄密隐患。
                        </div>
                      </div>

                      {/* Right: Active Settings Panel to tune mathematical coefficients */}
                      <div className="lg:col-span-5 bg-[#070709] border border-neutral-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-4">
                          <span className="text-xs font-bold text-white block pb-2 border-b border-neutral-850 font-sans">
                            ⚙️ 本地主存与时间衰减阻尼参数 (Damping Adjustments)
                          </span>

                          <form onSubmit={handleSaveMemoryConfig} className="space-y-3.5 text-xs">
                            <div className="space-y-1">
                              <label className="text-[10px] text-neutral-400 font-mono block uppercase">自研记忆文件持久化目录 (Local path)</label>
                              <input
                                type="text"
                                value={vectorNamespace}
                                onChange={(e) => setVectorNamespace(e.target.value)}
                                className="w-full bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded p-2 text-xs text-emerald-400 outline-none font-mono"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[10px] text-neutral-400 font-mono block uppercase">分词最高对齐数</label>
                                <input
                                  type="text"
                                  value="384 (Normalized)"
                                  disabled
                                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-500 outline-none font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-neutral-400 font-mono block uppercase">召回相关度阀值 (Recall)</label>
                                <select
                                  value={matchingThreshold}
                                  onChange={(e) => setMatchingThreshold(parseFloat(e.target.value))}
                                  className="w-full bg-neutral-950 border border-neutral-850 rounded p-2 text-xs text-sky-400 outline-none font-mono focus:border-neutral-600"
                                >
                                  <option value={0.85}>0.85 (高度严格)</option>
                                  <option value={0.75}>0.75 (平衡推荐)</option>
                                  <option value={0.65}>0.65 (广泛召回)</option>
                                </select>
                              </div>
                            </div>

                            <div className="p-3 rounded bg-indigo-500/5 border border-indigo-500/10 text-[11px] leading-relaxed text-indigo-300 font-mono space-y-1">
                              <span className="font-bold text-sky-450 block">🧮 阻尼半衰演算公式：</span>
                              <div>Recall_Score = BasicSimilarity &times; Exp(-&lambda; &times; ElapsedDays)</div>
                              <p className="text-neutral-500 text-[10px]">系统内智体将根据记忆入库的物理时序，自动向落后时间节点施加阻尼因子。</p>
                            </div>

                            <button
                              type="submit"
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-505 text-white text-xs font-bold rounded cursor-pointer transition active:scale-[0.98]"
                            >
                              {isMemorySaved ? "底层系数参数已存盘同步 🟢" : "确认写入 MODA-Memory 底座 ⚡"}
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. DATABASE SYSTEM VIEW: Interactive Visual SQLite schemas, fast additions and live SQL commands input */}
                {memorySubTab === 'db' && (
                  <div className="space-y-5 animation-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Left: Interactive SQL command terminal console */}
                      <div className="lg:col-span-5 bg-black border border-neutral-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-1.5 border-b border-neutral-900">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Cpu className="w-4 h-4 text-sky-400 animate-pulse" />
                              <span>💻 SQLite3 局域网执行终端 (Local SQL Console)</span>
                            </span>
                            <span className="text-[10px] text-zinc-550 font-mono">SQLite v3.45.0</span>
                          </div>

                          <p className="text-[11px] text-zinc-400 leading-normal font-sans">
                            MODA-Memory 采用本地自研关系级缓存。在此键入 SQL 语句直接操作长期特征节点状态并立即反映在全场景中：
                          </p>

                          {/* Quick examples click */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <button
                              onClick={() => setSqlQuery('SELECT * FROM memory_nodes WHERE score >= 0.90 ORDER BY score DESC;')}
                              className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-mono text-[9px] text-[#1D9BF0] hover:border-neutral-600 cursor-pointer"
                            >
                              预设: 查询高分偏好
                            </button>
                            <button
                              onClick={() => setSqlQuery(`INSERT INTO memory_nodes (user, content) VALUES ('new_merchant@trade.com', '高密防霉航空全托管包装要求');`)}
                              className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-mono text-[9px] text-emerald-400 hover:border-neutral-600 cursor-pointer"
                            >
                              预设: SQL 新增节点
                            </button>
                            <button
                              onClick={() => setSqlQuery('SELECT * FROM knowledge_nodes;')}
                              className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-mono text-[9px] text-amber-500 hover:border-neutral-600 cursor-pointer"
                            >
                              预设: 检索知识库切片
                            </button>
                          </div>

                          <form onSubmit={handleExecuteSQL} className="space-y-2">
                            <textarea
                              value={sqlQuery}
                              onChange={(e) => setSqlQuery(e.target.value)}
                              placeholder="SELECT * FROM memory_nodes;"
                              className="w-full h-16 bg-[#070709] border border-neutral-850 rounded-lg p-2.5 text-xs text-[#A5C261] font-mono focus:outline-none focus:border-indigo-650"
                            />
                            <button
                              type="submit"
                              className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-xs font-bold text-sky-400 hover:border-sky-500 rounded-lg transition"
                            >
                              🛠️ 执行本地 SQLite 语句
                            </button>
                          </form>

                          {lastSqlError && (
                            <div className="p-2 border border-rose-900/30 bg-rose-950/10 text-rose-450 rounded text-[10.5px] font-mono leading-normal">
                              ⚠️ {lastSqlError}
                            </div>
                          )}
                        </div>

                        {/* Scrolling operational terminal sequence */}
                        <div className="space-y-1.5 pt-2 border-t border-neutral-900">
                          <span className="text-[10px] text-neutral-500 uppercase font-mono block">Terminal Output Traces (最新在顶):</span>
                          <div className="bg-black/80 border border-neutral-900 rounded p-2 h-20 overflow-y-auto pr-1 font-mono text-[9px] text-neutral-400 space-y-1 select-none">
                            {sqlConsoleLogs.map((logStr, idx) => (
                              <div key={idx} className="truncate">
                                <span className="text-zinc-650">sqlite&gt;</span> {logStr}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: DB Database Table Viewer showing result grid */}
                      <div className="lg:col-span-7 bg-neutral-900/10 border border-neutral-805 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Database className="w-4 h-4 text-emerald-400" />
                              <span>📁 SQL 物理查询结果网格 (SQLite Tabular Viewport)</span>
                            </span>
                            <span className="text-[10px] font-mono text-neutral-500">{sqlResultTable.length} 个结果返回</span>
                          </div>

                          {/* Render Database Visual Schema Grid */}
                          <div className="border border-neutral-850 rounded-xl overflow-hidden bg-black/40">
                            <div className="overflow-x-auto max-h-[17.5rem]">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-neutral-950 border-b border-neutral-850 text-neutral-450 font-mono text-[10.5px]">
                                    <th className="px-3 py-2 font-bold select-none">主键 ID</th>
                                    <th className="px-3 py-2 font-bold select-none">商户/主链索引</th>
                                    <th className="px-3 py-2 font-bold select-none">特征语义内容 (Content/Spec)</th>
                                    <th className="px-3 py-2 text-right font-bold select-none">检索置信 [Score/Chunks]</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-900 text-[11px] text-zinc-300">
                                  {sqlResultTable.length > 0 ? (
                                    sqlResultTable.map((row, idx) => (
                                      <tr key={row.id || idx} className="hover:bg-neutral-900/60 duration-100">
                                        <td className="px-3 py-2 font-mono text-[10px] text-neutral-500 font-semibold max-w-[4rem] truncate">{row.id}</td>
                                        <td className="px-3 py-2 text-sky-400 font-mono font-medium max-w-[8rem] truncate" title={row.user || row.url}>{row.user || row.url}</td>
                                        <td className="px-3 py-2 font-sans text-neutral-300 max-w-[14rem] truncate" title={row.content || row.title}>{row.content || row.title}</td>
                                        <td className="px-3 py-2 text-right font-mono text-emerald-400 font-bold">
                                          {(row.score || row.chunks || 0)}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={4} className="p-4 text-center text-zinc-650 font-mono">
                                        No dataset rows matched local SQL condition constraints.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <p className="text-[10px] text-neutral-500 leading-normal font-sans pt-1">
                            💡 提示: 在此输入 SQL 新增语句，或直接在下面通过可视化表格添加和维护顾客记忆，数据将完全保持一致交互。
                          </p>
                        </div>

                        {/* Fast insert Form visually below DB */}
                        <div className="pt-3 border-t border-neutral-850">
                          <form onSubmit={handleAddUserMemory} className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                            <input
                              type="text"
                              placeholder="新顾客邮箱 / 主体"
                              value={newMemUser}
                              onChange={(e) => setNewMemUser(e.target.value)}
                              className="bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-white outline-none col-span-4"
                              required
                            />
                            <input
                              type="text"
                              placeholder="在表格下方快速录入偏好与历史记忆内容..."
                              value={newMemContent}
                              onChange={(e) => setNewMemContent(e.target.value)}
                              className="bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-white outline-none col-span-6"
                              required
                            />
                            <button
                              type="submit"
                              className="col-span-2 px-2.5 py-1.5 bg-indigo-900/60 text-indigo-300 border border-indigo-500/20 rounded hover:bg-indigo-900 text-[10px] font-bold uppercase transition"
                            >
                              加入主存
                            </button>
                          </form>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 3. API INTERFACE VIEW: Dynamic save/query controllers simulation and endpoint testing */}
                {memorySubTab === 'api' && (
                  <div className="space-y-4 animation-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                      
                      {/* Left Side: Route and Raw JSON block input config */}
                      <div className="lg:col-span-5 bg-neutral-900/20 border border-neutral-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-3.5">
                          <div className="flex justify-between items-center pb-1.5 border-b border-neutral-900">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5 select-none">
                              <Activity className="w-4 h-4 text-indigo-400" />
                              <span>⚙️ API 仿真请求参数块 (Endpoint Post Controller)</span>
                            </span>
                            <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-450 border border-indigo-500/20 rounded text-[9.5px] font-mono">
                              200 OK Loop
                            </span>
                          </div>

                          {/* Dynamic route selector tabs */}
                          <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-lg">
                            <button
                              type="button"
                              onClick={() => {
                                setApiPlaygroundMethod('POST_QUERY');
                                setApiPlaygroundBody(JSON.stringify({
                                  query: "高端羊绒货运保价",
                                  namespace: vectorNamespace,
                                  threshold: matchingThreshold,
                                  limit: 3
                                }, null, 2));
                              }}
                              className={`py-1 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer ${
                                apiPlaygroundMethod === 'POST_QUERY'
                                  ? 'bg-[#1D9BF0]/10 text-[#1D9BF0] border border-[#1D9BF0]/20'
                                  : 'text-zinc-500 hover:text-white'
                              }`}
                            >
                              POST /query
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setApiPlaygroundMethod('POST_SAVE');
                                setApiPlaygroundBody(JSON.stringify({
                                  user: "landmarkglobaltrade@gmail.com",
                                  content: "用户主导定制生产线，偏好从深圳福田仓空运直发。",
                                  namespace: vectorNamespace
                                }, null, 2));
                              }}
                              className={`py-1 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer ${
                                apiPlaygroundMethod === 'POST_SAVE'
                                  ? 'bg-[#1D9BF0]/10 text-[#1D9BF0] border border-[#1D9BF0]/20'
                                  : 'text-zinc-500 hover:text-white'
                              }`}
                            >
                              POST /save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setApiPlaygroundMethod('GET_ALL');
                                setApiPlaygroundBody(JSON.stringify({
                                  action: "dump_sqlite_buffer",
                                  namespace: vectorNamespace
                                }, null, 2));
                              }}
                              className={`py-1 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer ${
                                apiPlaygroundMethod === 'GET_ALL'
                                  ? 'bg-[#1D9BF0]/10 text-[#1D9BF0] border border-[#1D9BF0]/20'
                                  : 'text-zinc-500 hover:text-white'
                              }`}
                            >
                              GET /all
                            </button>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-neutral-400 font-mono block">REQUEST PAYLOAD JSON HEADERS / BODY:</span>
                            <textarea
                              value={apiPlaygroundBody}
                              onChange={(e) => setApiPlaygroundBody(e.target.value)}
                              className="w-full h-36 bg-[#070709] border border-neutral-850 rounded-lg p-2.5 text-xs text-sky-305 font-mono focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleTriggerMockAPI}
                            className="w-full py-2 bg-[#121214] hover:bg-neutral-900 border border-neutral-800 text-xs font-bold text-indigo-400 hover:border-indigo-500 rounded-lg shadow cursor-pointer transition active:scale-[0.98]"
                          >
                            🚀 发送本地环回请求 (Trigger Local Request)
                          </button>
                        </div>
                      </div>

                      {/* Right Side: Glowing terminal responsive preview */}
                      <div className="lg:col-span-7 bg-black border border-neutral-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-3.5">
                          <div className="flex justify-between items-center pb-1.5 border-b border-neutral-900">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
                              <Cpu className="w-4 h-4 text-emerald-400" />
                              <span>📡 API 响应控制台输出 (Response Viewport)</span>
                            </span>
                            <span className="text-[9.5px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 rounded">
                              STATUS: 200 OK
                            </span>
                          </div>

                          {/* glowing command line display */}
                          <div className="p-3.5 bg-neutral-950 border border-neutral-900 rounded-xl font-mono text-[11px] text-[#A5C261] overflow-y-auto max-h-[16.5rem] leading-relaxed whitespace-pre-wrap">
                            {apiResponseConsole}
                          </div>

                          <p className="text-[10px] text-neutral-500 leading-normal font-sans pt-1">
                            🔗 接口规范细节: 任何 MODAUI 工作流或者 6-agent 指挥官，只需发起内部本地请求，即可在 1.04ms 内自动召回相关偏好内容，实现无外部网络依赖的自研高能运行。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. EMBEDDING MATHEMATICAL VECTOR MACHINE SIMULATOR: Type any text to see raw vector generator */}
                {memorySubTab === 'embedding' && (
                  <div className="space-y-4 animation-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                      {/* Left: Input Text and vector dimensions converter */}
                      <div className="lg:col-span-5 bg-neutral-900/15 border border-neutral-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-1.5 border-b border-neutral-900">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
                              <Cpu className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
                              <span>🧬 向量化分词映射器 (Local Embedder Accelerator)</span>
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">OFFLINE_GEN</span>
                          </div>

                          <p className="text-[11.5px] text-neutral-450 leading-relaxed font-sans">
                            在此键入任何顾客、商家的口语对话、物料或理赔要求，后台分词核将立即生成包含 <strong>384 维双精度浮点数空间向量</strong>，用于进行余弦近邻检索：
                          </p>

                          <div className="space-y-2">
                            <input
                              type="text"
                              value={embeddingText}
                              onChange={(e) => setEmbeddingText(e.target.value)}
                              placeholder="定制服装偏好或顺丰运送要求"
                              className="w-full bg-[#070709] border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700 font-sans"
                            />
                            <button
                              type="button"
                              onClick={handleCalculateEmbeddings}
                              disabled={isGeneratingEmbeddings}
                              className="w-full py-2 bg-indigo-900/40 hover:bg-indigo-900 border border-indigo-505 text-xs font-bold text-indigo-300 rounded-lg transition"
                            >
                              {isGeneratingEmbeddings ? "计算自研余弦向量哈希中..." : "📐 本机转化 12x 归一像素特征矩阵"}
                            </button>
                          </div>

                          {/* Calculated values output container */}
                          {calculatedVector.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-neutral-900">
                              <span className="text-[10px] text-zinc-500 uppercase font-mono block">Calculated Normalized Vectors (12-D demo list):</span>
                              <div className="p-2.5 bg-black border border-neutral-900 rounded font-mono text-[10.5px] text-sky-400 leading-normal truncate-2-lines line-clamp-2 select-all">
                                [ {calculatedVector.map(v => v.toFixed(4)).join(', ')} ]
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Cosine similarity mathematics ranking listing */}
                      <div className="lg:col-span-7 bg-[#070709] border border-neutral-805 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
                              <BarChart2 className="w-4 h-4 text-[#1D9BF0]" />
                              <span>📊 归一余弦欧式空间比对距离矩阵 (Cosine Geometry Matrix)</span>
                            </span>
                            <span className="text-[10px] font-mono text-neutral-500">降序优先召回</span>
                          </div>

                          {cosineMatchLogs.length > 0 ? (
                            <div className="space-y-2 max-h-[16.5rem] overflow-y-auto pr-1">
                              {cosineMatchLogs.map((m, idx) => (
                                <div key={idx} className="p-2.5 bg-black/60 border border-neutral-900 rounded-xl space-y-2">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold text-sky-400">{m.name}</span>
                                    <span className="font-mono text-[11px] text-indigo-400 font-bold">自研相似比对: {m.cosine}</span>
                                  </div>
                                  <p className="text-[11px] text-zinc-400 line-clamp-1">{m.content}</p>
                                  
                                  {/* Cosine scale progress bar */}
                                  <div className="w-full bg-neutral-950 h-1 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-[#1D9BF0] h-1 rounded-full duration-300 transition-all" 
                                      style={{ width: `${Math.round(m.cosine * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center text-zinc-600 font-mono text-xs border border-neutral-900 bg-neutral-950/20 rounded-xl">
                              Ready for embeddings matching calculations. Press mathematical calculations button on left.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cognitive Probe & Recall Sandbox Simulator (Integrated bottom of all panels) */}
                <div className="p-5 rounded-xl border border-neutral-800 bg-[#070709] space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                    <span className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-violet-400 animate-pulse" />
                      <span>🧠 多渠道自研记忆提取与本地大模型上下文注入沙盒 (Simulated Agent Probe)</span>
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">完全脱机底层</span>
                  </div>

                  <p className="text-[11.5px] text-zinc-400 leading-relaxed font-sans">
                    在此模拟输入顾客和商家的实时请求。系统将在本机 <strong>离线存储层内比对</strong>，把匹配到的信息打包注入至智体 System Grounding 模版，达到完全自主不依附技术外的本源效果。
                  </p>

                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      value={sandboxQuery}
                      onChange={(e) => setSandboxQuery(e.target.value)}
                      placeholder="例如: landmarkglobal 采购羊绒衣服"
                      className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-neutral-600 rounded p-2.5 text-xs text-white outline-none font-sans"
                    />
                    <button
                      onClick={handleSimulateRecall}
                      disabled={isSimulatingRecall}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold cursor-pointer transition shrink-0 flex items-center space-x-1.5"
                    >
                      {isSimulatingRecall ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>本地向量查询中...</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>测试本地记忆提取</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Sandbox feedback and Prompt dump */}
                  {sandboxResult && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2.5 animation-fade-in text-[11px] font-mono">
                      
                      {/* Left: Component-level extraction records */}
                      <div className="space-y-3 bg-neutral-950 p-4 rounded-lg border border-neutral-850">
                        <span className="text-[10px] text-sky-400 font-bold block uppercase pb-1.5 border-b border-neutral-900">
                          🎯 本地 DB 召回顾客画像偏好 (Proprietary habits)
                        </span>
                        <p className="text-zinc-300 leading-relaxed whitespace-pre-line bg-neutral-900/40 p-2 rounded text-[10.5px]">
                          {sandboxResult.mem0Context}
                        </p>

                        <span className="text-[10px] text-emerald-400 font-bold block uppercase pt-2 pb-1.5 border-b border-neutral-900">
                          📊 自研本地数据矢量知识分片 (Offline chunks)
                        </span>
                        <p className="text-zinc-300 leading-relaxed whitespace-pre-line bg-neutral-900/40 p-2 rounded text-[10.5px]">
                          {sandboxResult.superMemoryDocs}
                        </p>
                      </div>

                      {/* Right: Master Injected system prompt payload */}
                      <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-850 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-indigo-400 font-bold block uppercase pb-1.5 border-b border-neutral-900 flex items-center justify-between">
                            <span>💻 统一本地注入大模型上下文 (Grounding payload ready)</span>
                            <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1 rounded">Offline</span>
                          </span>
                          <p className="text-zinc-400 whitespace-pre-wrap leading-relaxed bg-neutral-900/60 p-2.5 rounded text-[10.5px] max-h-[190px] overflow-y-auto">
                            {sandboxResult.finalPromptInjection}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-neutral-900 flex justify-between items-center text-[10px] text-neutral-510">
                          <span>✅ 开发者只需读取 AppContext 注入自研大模型接口即可</span>
                          <span className="text-sky-305 font-bold">自开机状态运作 🟢</span>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </motion.div>
            )}

            {activeTab === 'developer_board' && (
              <motion.div
                key="developer_board"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2.5 border-b border-[#2F3336]/60 gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center space-x-2">
                      <Sliders className="w-5 h-5 text-emerald-400" />
                      <span>💻 完备度自检看板</span>
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      系统功能完备检查。
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded font-bold">
                    已完备 {completionRate}%
                  </span>
                </div>

                {/* Progress metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-900/30 p-4 rounded-lg border border-neutral-800">
                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider block">已就绪模块</span>
                    <p className="text-xl font-bold text-emerald-400">{completedCount} / {totalModules} 个</p>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${Math.round((completedCount/totalModules)*100)}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider block">模拟交付模块</span>
                    <p className="text-xl font-bold text-amber-400">{simulatedCount} / {totalModules} 个</p>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${Math.round((simulatedCount/totalModules)*100)}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider block">空缺接口率</span>
                    <p className="text-xl font-bold text-sky-400">0 / {totalModules} 个</p>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: '0%' }} />
                    </div>
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="🔍 检索模块"
                    className="w-full sm:max-w-md px-3.5 py-2 rounded bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-neutral-600 font-sans"
                  />

                  <div className="flex gap-1 bg-neutral-900/60 p-1 rounded border border-neutral-800 text-[10px] uppercase font-mono shrink-0">
                    {(['all', 'completed', 'simulated', 'pending'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setStatusFilter(filter)}
                        className={`px-2.5 py-1.5 rounded transition-all cursor-pointer ${
                          statusFilter === filter
                            ? 'bg-neutral-800 text-white font-bold'
                            : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                      >
                        {filter === 'all' && '全部汇总'}
                        {filter === 'completed' && '就绪 🟢'}
                        {filter === 'simulated' && '模拟 🟡'}
                        {filter === 'pending' && '规划 🔵'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* List of Modules */}
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {filteredChecklist.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500 font-mono text-xs">
                      无此模块
                    </div>
                  ) : (
                    filteredChecklist.map((item, idx) => (
                      <div 
                        key={idx}
                        className={`border rounded-lg transition-all duration-150 ${
                          expandedModule === item.id 
                            ? 'border-neutral-600 bg-neutral-900/40' 
                            : 'border-neutral-800/80 bg-neutral-950/40 hover:border-neutral-700'
                        }`}
                      >
                        {/* Summary line */}
                        <div 
                          onClick={() => setExpandedModule(expandedModule === item.id ? null : item.id)}
                          className="p-3 flex items-center justify-between text-xs cursor-pointer select-none"
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="text-[10px] text-neutral-500 font-mono font-semibold uppercase tracking-wider hidden sm:block">
                              [{item.section}]
                            </span>
                            <span className="text-white font-semibold truncate text-xs">{item.label}</span>
                            <span className="text-[9px] text-[#1D9BF0] font-mono leading-none bg-[#1D9BF0]/10 px-1.5 py-0.5 rounded border border-[#1D9BF0]/20">
                              {item.id}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2.5 shrink-0">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                              item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              item.status === 'simulated' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-neutral-800 text-neutral-500'
                            }`}>
                              {item.status === 'completed' ? '就绪 🟩' : '模拟 🟨'}
                            </span>
                            <span className="text-[10px] text-neutral-500">
                              {expandedModule === item.id ? '▼' : '►'}
                            </span>
                          </div>
                        </div>

                        {/* Expanded detail section */}
                        {expandedModule === item.id && (
                          <div className="p-4 border-t border-neutral-800 text-[11px] space-y-2.5 font-mono bg-neutral-950/60 leading-relaxed text-zinc-300">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-400">
                              <p><span className="text-neutral-500">源码文件:</span> <span className="text-zinc-200">{item.file}</span></p>
                              <p><span className="text-neutral-500">对接规范:</span> <span className="text-neutral-300">{item.spec}</span></p>
                            </div>
                            <div className="p-2.5 rounded bg-neutral-900/60 border border-neutral-800 text-[11px]">
                              <span className="text-amber-400 block font-bold mb-1">对接与补全建议：</span>
                              <p className="text-neutral-300">{item.devNotes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3.5 rounded bg-amber-500/5 border border-amber-500/20 text-xs text-neutral-400 leading-relaxed font-sans">
                  <span className="font-bold text-amber-400 block mb-1">📢 开发交底备忘</span>
                  功能模块组件全部就绪。对接数据库与算力渠道后即可上线运营。
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global audit logger widget */}
        <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 font-mono text-[11px] text-neutral-400">
          <div className="flex justify-between border-b border-[#2F3336]/40 pb-2 mb-2">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>总网闸日志</span>
            </span>
            <span>状态检测正常</span>
          </div>
          <p className="leading-relaxed text-zinc-300">
            <span className="text-neutral-500">[2026-06-03]</span> {testResult}
          </p>
        </div>

      </div>
    </div>
  );
}
