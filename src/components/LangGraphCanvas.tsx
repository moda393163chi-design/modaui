import React, { useState } from 'react';
import { Layers, Plus, Trash2, ArrowRight, ArrowDown, Settings, AlertTriangle, Play, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

interface LangGraphCanvasProps {
  initialNodes: DagNode[];
  isExecutingSim: boolean;
  setIsExecutingSim: (val: boolean) => void;
  onAddLog: (log: string) => void;
  onUpdateSimDetail: (detail: string) => void;
}

export default function LangGraphCanvas({ initialNodes, isExecutingSim, setIsExecutingSim, onAddLog, onUpdateSimDetail }: LangGraphCanvasProps) {
  const [nodes, setNodes] = useState<DagNode[]>(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node_trig');
  const [simulateTimeout, setSimulateTimeout] = useState(false);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  // Add node form states
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeType, setNewNodeType] = useState<'trigger' | 'decision' | 'tool' | 'fulfillment'>('decision');
  const [newNodeExecutor, setNewNodeExecutor] = useState('Soren (运营精算师)');
  const [newNodeDetails, setNewNodeDetails] = useState('');
  const [newNodeBackupRoute, setNewNodeBackupRoute] = useState('Cyrus (CRM纠纷安抚)');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleCreateNode = () => {
    if (!newNodeLabel || !newNodeDetails) return;
    const nid = `node_custom_${Date.now()}`;
    const nodeItem: DagNode = {
      id: nid,
      label: newNodeLabel,
      type: newNodeType,
      status: 'idle',
      executor: newNodeExecutor,
      details: newNodeDetails,
      backupRoute: newNodeBackupRoute,
      outputPayload: JSON.stringify({
        node_status: "STANDBY_READY",
        custom_node: true,
        assigned_executor: newNodeExecutor,
        backup_destination: newNodeBackupRoute
      }, null, 2)
    };

    setNodes(prev => [...prev, nodeItem]);
    onAddLog(`【DAG扩建】成功向 LangGraph State Graph 物理层追加了新的自愈工作节点 [${newNodeLabel}]！`);
    
    // Reset Form
    setNewNodeLabel('');
    setNewNodeDetails('');
    setShowAddForm(false);
  };

  const handleDeleteNode = (id: string) => {
    if (['node_trig', 'node_dispat', 'node_tool', 'node_full'].includes(id)) {
      alert('⚠️ 该节点属于高密度系统基础骨架，禁止清扫删减！');
      return;
    }
    setNodes(prev => prev.filter(n => n.id !== id));
    onAddLog(`【DAG裁剪】已将自编节点 #${id.toUpperCase()} 移出工作流矩阵。`);
    setSelectedNodeId('node_trig');
  };

  // Run State Graph transition simulation with error detection detouring!
  const handleRunStateGraph = () => {
    if (isExecutingSim) return;
    setIsExecutingSim(true);
    onAddLog('⚡ 【LangGraph 调度】启动多智体 State Graph DAG 协调：载入上下文元数据。');

    // Reset status to idle
    setNodes(prev => prev.map(n => ({ ...n, status: 'idle' })));

    let index = 0;
    const executeSequence = () => {
      if (index < nodes.length) {
        const current = nodes[index];
        setActiveStepId(current.id);

        // Simulate failure if current path is tool call and simulateTimeout is toggled
        if (current.type === 'tool' && simulateTimeout) {
          setNodes(prev => prev.map(n => n.id === current.id ? { ...n, status: 'failed' } : n));
          onAddLog(`⚠️ 【故障警阻】! 侦测到节点 [${current.label}] 抛出网络超时异常 (GATEWAY 504)。触发自愈避雷网闸：正在阻断事故并转向防灾垫资备用路由 [${current.backupRoute || 'Soren (运营财务对冲)'}] !`);
          
          setNodes(prev => prev.map(n => {
            if (n.id === current.id) {
              return { 
                ...n, 
                status: 'failed', 
                outputPayload: JSON.stringify({
                  status: "BLOCKED_TIMEOUT_504",
                  diagnostic: "SF/Stripe Response Latency exceeded 15000ms threshold.",
                  emergency_trigger: "LangGraph State Detour Sequence Active",
                  compensation_route: current.backupRoute || "Justin (审计对冲理赔)"
                }, null, 2)
              };
            }
            return n;
          }));

          onUpdateSimDetail(JSON.stringify({
            status: "DETOUR_FAULT_GRACEFUL_RECOVERY",
            active_alert: "TIMEOUT_GATEWAY_504",
            active_fallback: current.backupRoute || "Soren (运营财务对冲)",
            timestamp: new Date().toISOString()
          }, null, 2));

          setTimeout(() => {
            // Detour jump immediately to fulfillment under backup
            setNodes(prev => prev.map(n => n.id === 'node_full' ? { 
              ...n, 
              status: 'success', 
              outputPayload: JSON.stringify({
                status: "DEVIATION_SUCCESSFULLY_TOWARDS_FULFILLMENT",
                compensate_result: "通过备用财务通道极速理赔15卡，退除Stripe运单理赔。闭环完成。",
                auto_recovered: true
              }, null, 2)
            } : n));
            
            onAddLog('🟢 【故障自收敛】理赔退单通过对账底账。工作流已根据备用分支路由，成功避灾收尾。状态置回。');
            setActiveStepId(null);
            setIsExecutingSim(false);
          }, 2000);

          return; // Terminate normal step runner
        }

        // Normal Execution
        setNodes(prev => prev.map(n => {
          if (n.id === current.id) {
            return { 
              ...n, 
              status: 'active', 
              outputPayload: current.outputPayload || JSON.stringify({
                node_status: "PROCESSING_STABLE",
                step_index: index,
                active_assignee: current.executor,
                allocated_tokens: 3100
              }, null, 2)
            };
          }
          if (index > 0 && n.id === nodes[index - 1].id) {
            return { ...n, status: 'success' };
          }
          return n;
        }));

        onAddLog(`【DAG Step ${index + 1}】节点 [${current.label}] 执行启动。分配给「${current.executor}」...`);
        onUpdateSimDetail(current.outputPayload || JSON.stringify({
          node_execution: "OK",
          active_variables: "userLoyalty: GOLD_VIP",
          output_tokens: 2840
        }, null, 2));

        index++;
        setTimeout(executeSequence, 1500);
      } else {
        // Wrap normal path
        setNodes(prev => prev.map(n => n.id === nodes[nodes.length - 1].id ? { ...n, status: 'success' } : n));
        onAddLog('🟢 【中枢闭环】多智体柔性链自主运营链 DAG 工作流合并畅通。全部交易账套落锁。');
        setActiveStepId(null);
        setIsExecutingSim(false);
      }
    };

    setTimeout(executeSequence, 200);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Visual DAG Flow board & Detour simulator */}
      <div className="lg:col-span-8 p-5 bg-[#070709] border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0E0E12_1px,transparent_1px),linear-gradient(to_bottom,#0E0E12_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-25" />
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 border-b border-neutral-900 gap-3">
          <div>
            <span className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
              <Layers className="w-4 h-4 text-[#1D9BF0]" />
              <span>LangGraph State Graph 物理自愈流画布 (Fault-Tolerant DAG Canvas)</span>
            </span>
            <p className="text-[10px] text-zinc-550 mt-0.5">
              支持多分支逻辑过渡与网络504突发故障逃逸。点击任意节点契约，或在下方添加自定义步骤。
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Detour switcher */}
            <button
              onClick={() => setSimulateTimeout(!simulateTimeout)}
              className={`text-[9.5px] font-mono font-bold tracking-wide px-2 py-1 rounded border cursor-pointer duration-100 flex items-center gap-1.5 ${
                simulateTimeout 
                  ? 'bg-red-500/10 text-red-500 border-red-500/25' 
                  : 'bg-[#1D9BF0]/10 text-sky-400 border-[#1D9BF0]/25'
              }`}
              title="模拟 Tool 调用发生504、超时或限流瓶颈时，DAG 是否能够智能选择备用防灾理赔对冲分支进行柔性闭环"
            >
              <AlertTriangle className="w-3 h-3 text-current" />
              <span>故障自愈路由: {simulateTimeout ? '★ 超时备用劫持中(ON)' : '☆ 常规常规稳定(OFF)'}</span>
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="py-1 px-2.5 rounded bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-xs font-extrabold text-[#1D9BF0] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3 h-3 text-[#1D9BF0]" />
              <span>快速加点</span>
            </button>
          </div>
        </div>

        {/* Form to insert custom self-healing nodes block */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-3 font-sans relative z-15 overflow-hidden"
            >
              <span className="text-[10px] font-bold text-sky-400 font-mono block uppercase">🛠️ 动态配载新 State Graph 环节</span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-550">节点名称 (Label):</label>
                  <input
                    type="text"
                    value={newNodeLabel}
                    onChange={(e) => setNewNodeLabel(e.target.value)}
                    placeholder="如: AI反欺诈审查"
                    className="w-full bg-[#070709] border border-neutral-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-550">功能类别 (Type):</label>
                  <select
                    value={newNodeType}
                    onChange={(e) => setNewNodeType(e.target.value as any)}
                    className="w-full bg-[#070709] border border-neutral-800 rounded px-2.5 py-1 text-xs text-white"
                  >
                    <option value="decision">决策分支 (Decision)</option>
                    <option value="tool">生态执行 (Tool)</option>
                    <option value="fulfillment">终端装配 (Render)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-550">专属执行者 (Executor):</label>
                  <input
                    type="text"
                    value={newNodeExecutor}
                    onChange={(e) => setNewNodeExecutor(e.target.value)}
                    className="w-full bg-[#070709] border border-neutral-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-550">容错退路 (Backup Destination):</label>
                  <input
                    type="text"
                    value={newNodeBackupRoute}
                    onChange={(e) => setNewNodeBackupRoute(e.target.value)}
                    className="w-full bg-[#070709] border border-neutral-800 rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
                <div className="md:col-span-10 space-y-1">
                  <label className="text-[9px] text-zinc-550">运行逻辑契约明细 (Details):</label>
                  <input
                    type="text"
                    value={newNodeDetails}
                    onChange={(e) => setNewNodeDetails(e.target.value)}
                    placeholder="描述该工作节点在何种环境下触发, 所带的防刷或纠缠逻辑..."
                    className="w-full bg-[#070709] border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-300"
                  />
                </div>
                <button
                  onClick={handleCreateNode}
                  className="md:col-span-2 py-2 bg-[#1D9BF0] text-xs font-bold text-white rounded-lg hover:bg-sky-500 duration-150 cursor-pointer self-end"
                >
                  确认配载
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Visual node alignment boxes */}
        <div className="relative z-10 flex flex-col md:flex-row flex-wrap items-center justify-center gap-5 py-4">
          {nodes.map((node, index) => {
            let statusColor = 'border-neutral-800 bg-neutral-950 text-neutral-400';
            if (node.id === activeStepId) {
              statusColor = 'border-[#1D9BF0] bg-[#1D9BF0]/10 text-sky-450 shadow-[0_0_15px_rgba(29,155,240,0.35)] animate-pulse border-2';
            } else if (node.status === 'success') {
              statusColor = 'border-emerald-500 bg-emerald-950/20 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]';
            } else if (node.status === 'failed') {
              statusColor = 'border-red-500 bg-red-950/20 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.25)] border-2';
            } else if (selectedNodeId === node.id) {
              statusColor = 'border-zinc-500 bg-neutral-900 text-white';
            }

            return (
              <React.Fragment key={node.id}>
                <div
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-3 rounded-xl border text-left transition-all duration-300 w-full md:w-[11rem] cursor-pointer hover:border-neutral-600 hover:scale-[1.02] ${statusColor}`}
                >
                  <div className="flex justify-between items-center text-[8.5px] font-mono uppercase opacity-60">
                    <span>{node.type}</span>
                    <span className="bg-neutral-900 border border-neutral-800 px-1 rounded text-neutral-500 font-bold">{node.id.substring(5,9).toUpperCase()}</span>
                  </div>
                  <h4 className="text-[11px] font-extrabold truncate text-white mt-1">{node.label}</h4>
                  
                  <p className="text-[9px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                    {node.details}
                  </p>

                  <div className="mt-2.5 pt-1.5 border-t border-neutral-900/60 flex items-center justify-between text-[8px] font-mono leading-none">
                    <span className="text-[#1D9BF0] truncate max-w-[5.5rem]">{node.executor.split(' ')[0]}</span>
                    <span className="flex items-center gap-1 select-none">
                      <span className={`w-1 h-1 rounded-full ${
                        node.status === 'success' ? 'bg-emerald-400' :
                        node.id === activeStepId ? 'bg-sky-400 animate-ping' :
                        node.status === 'failed' ? 'bg-red-500' : 'bg-neutral-600'
                      }`} />
                      <span>{node.status.toUpperCase()}</span>
                    </span>
                  </div>
                </div>

                {index < nodes.length - 1 && (
                  <div className="flex items-center justify-center shrink-0">
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-800 hidden md:block" />
                    <ArrowDown className="w-3.5 h-3.5 text-neutral-800 md:hidden pb-1" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Run active visual simulation control */}
        <button
          type="button"
          onClick={handleRunStateGraph}
          disabled={isExecutingSim}
          className="w-full py-2.5 rounded-xl border border-[#1D9BF0] bg-[#1D9BF0] hover:bg-sky-400 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 text-white fill-white" />
          <span>{isExecutingSim ? 'Multi-Agent DAG Transition Running...' : '手动模拟：一键触发 State Graph 工作流自解演习'}</span>
        </button>
      </div>

      {/* Right side drawer: Prop pane editor sheet */}
      <div className="lg:col-span-4 bg-black border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 leading-none">
              <Settings className="w-3.5 h-3.5 text-[#1D9BF0]" />
              <span>组件属性精算柜 (Prop Specs)</span>
            </span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Interactive Sheet</span>
          </div>

          <div className="space-y-3 font-sans text-xs">
            <div className="bg-neutral-900/30 p-3 rounded-lg border border-neutral-900 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-zinc-550 uppercase">Active Selection:</span>
                <span className="text-[#1D9BF0] font-bold">#{selectedNode.id}</span>
              </div>
              <h4 className="text-sm font-extrabold text-white">{selectedNode.label}</h4>
              <p className="text-neutral-400 text-[11px] leading-relaxed">{selectedNode.details}</p>
            </div>

            {/* Config properties */}
            <div className="space-y-2.5">
              <div className="space-y-1">
                <span className="text-[9.5px] text-zinc-400 font-mono block">指定算力承载者 (Contract Executor):</span>
                <div className="bg-neutral-950 border border-neutral-900 rounded p-2 text-xs font-mono text-white">
                  {selectedNode.executor}
                </div>
              </div>

              {selectedNode.backupRoute && (
                <div className="space-y-1">
                  <span className="text-[9.5px] text-red-400 font-mono block">容错备用分支退路的目标 (Fault Fallback Node):</span>
                  <div className="bg-neutral-950 border border-red-950/20 rounded p-2 text-xs font-mono text-amber-500">
                    &gt;_ Reroute to: {selectedNode.backupRoute}
                  </div>
                </div>
              )}

              {/* Editable simulated variables schema */}
              <div className="space-y-1.5 bg-neutral-950 p-2.5 rounded-lg border border-neutral-900">
                <span className="text-[9.5px] text-zinc-400 font-mono block">过渡验证变量状态 (State Variable Conditions):</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="text-zinc-500">userLoyalty:</div>
                  <div className="text-sky-400 text-right">"GOLD_VIP"</div>
                  <div className="text-zinc-500">orderThresholdValue:</div>
                  <div className="text-emerald-400 text-right">&gt; 100.00</div>
                  <div className="text-zinc-500">sfFastCargoContract:</div>
                  <div className="text-amber-500 text-right">true</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-1 select-none text-[9.5px] text-zinc-500 leading-relaxed font-sans">
          <div className="flex items-center gap-1 text-zinc-400 font-bold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>自愈 Detour 说明:</span>
          </div>
          <p>
            本拓扑融合了 LangGraph 自主故障检测网架。当您激活上方「故障自愈路由」后，由于 Tool 报错，State 将跳出 node_tool 常规链路，无感滑向备用核账并直接渲染，从而避免交易死锁挂起。
          </p>
        </div>
      </div>
    </div>
  );
}
