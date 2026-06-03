import React, { useState, useEffect } from 'react';
import { Database, Search, Plus, Trash2, LineChart, Cpu, MessageSquare, Zap, RefreshCw } from 'lucide-react';

interface VectorMemory {
  id: string;
  key: string;
  data: string;
  relevance: number;
  decayCoeff: number;
  timestamp: string;
}

interface HyperMemEngineProps {
  vectorDb: VectorMemory[];
  onInsertMemory: (key: string, data: string) => void;
  onAddLog: (log: string) => void;
}

export default function HyperMemEngine({ vectorDb: initialDb, onInsertMemory, onAddLog }: HyperMemEngineProps) {
  const [decayHalfLife, setDecayHalfLife] = useState<number>(15);
  const [dbList, setDbList] = useState<VectorMemory[]>(initialDb);
  const [simQuery, setSimQuery] = useState<string>('通勤显瘦');
  const [simOperation, setSimOperation] = useState<'READ' | 'WRITE' | 'FORGET'>('READ');
  const [simContent, setSimContent] = useState<string>('');
  const [simKey, setSimKey] = useState<string>('');
  const [transactionLogs, setTransactionLogs] = useState<Array<{
    id: string;
    op: 'READ' | 'WRITE' | 'FORGET';
    key: string;
    score: string;
    decayedStrength: string;
    tokenCost: number;
    timestamp: string;
  }>>([
    { id: '1', op: 'WRITE', key: 'CUST_HABIT_FASHION', score: 'N/A', decayedStrength: '1.000', tokenCost: 1530, timestamp: '11:42:01' },
    { id: '2', op: 'READ', key: 'CUST_HABIT_FASHION', score: '0.941', decayedStrength: '0.982', tokenCost: 450, timestamp: '11:45:15' }
  ]);

  // Update lists when outer vectorDb changes
  useEffect(() => {
    setDbList(initialDb);
  }, [initialDb]);

  // Calculate Decay Lambda
  const lambda = parseFloat((Math.log(2) / decayHalfLife).toFixed(5));

  // Memory decay factor calculation for display (at Day 1, 5, 15, 30)
  const calculateDecayForDay = (days: number) => {
    return Math.exp(-lambda * days);
  };

  const handleSimulateTransaction = () => {
    const timestampStr = new Date().toLocaleTimeString();
    if (simOperation === 'READ') {
      const q = simQuery.toLowerCase().trim();
      if (!q) return;

      // Find best match in database
      const matched = dbList.map(item => {
        let score = 0.2 + Math.random() * 0.15;
        if (item.key.toLowerCase().includes(q) || item.data.toLowerCase().includes(q)) {
          score = 0.85 + Math.random() * 0.12;
        }
        return { item, score };
      }).sort((a, b) => b.score - a.score)[0];

      const bestMatch = matched ? matched.item : null;
      const matchScore = matched ? matched.score : 0.1;
      const strength = bestMatch ? Math.exp(-lambda * 2.5) : 0; // Simulated 2.5 days elapsed

      setTransactionLogs(prev => [
        {
          id: `tx_${Date.now()}`,
          op: 'READ',
          key: bestMatch ? bestMatch.key : 'UNKNOWN_INDEX',
          score: matchScore.toFixed(3),
          decayedStrength: strength.toFixed(3),
          tokenCost: Math.floor(400 + Math.random() * 100),
          timestamp: timestampStr
        },
        ...prev
      ]);

      if (bestMatch) {
        onAddLog(`【HyperMem 检索】相似度比对关联命中: #${bestMatch.key} (Score: ${matchScore.toFixed(3)}), 强度自适应扣减: ${strength.toFixed(3)}。🟢`);
      } else {
        onAddLog(`【HyperMem 检索】查询「${simQuery}」未匹配到高相似语义节点，进入大盘零碎缓存。`);
      }

    } else if (simOperation === 'WRITE') {
      if (!simKey || !simContent) return;
      
      const keyFormatted = simKey.toUpperCase().trim();
      onInsertMemory(keyFormatted, simContent);
      
      setTransactionLogs(prev => [
        {
          id: `tx_${Date.now()}`,
          op: 'WRITE',
          key: keyFormatted,
          score: '1.000 (Anchor)',
          decayedStrength: '1.000',
          tokenCost: Math.floor(1500 + Math.random() * 200),
          timestamp: timestampStr
        },
        ...prev
      ]);
      
      setSimKey('');
      setSimContent('');

    } else if (simOperation === 'FORGET') {
      if (dbList.length === 0) return;
      const randomIndex = Math.floor(Math.random() * dbList.length);
      const target = dbList[randomIndex];
      
      setDbList(prev => prev.filter(x => x.id !== target.id));
      
      setTransactionLogs(prev => [
        {
          id: `tx_${Date.now()}`,
          op: 'FORGET',
          key: target.key,
          score: 'N/A',
          decayedStrength: '0.000 (Purged)',
          tokenCost: 200,
          timestamp: timestampStr
        },
        ...prev
      ]);
      
      onAddLog(`【HyperMem 释退】由于空间溢出或人工强制，已修剪忘却记忆节点：#${target.key}！`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Visual Memory decay curve chart Area */}
      <div className="lg:col-span-8 p-5 bg-[#070709] border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2.5 border-b border-neutral-900 gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
              <LineChart className="w-4 h-4 text-[#1D9BF0]" />
              <span>Mem0 / HyperMem 长期特征半衰期曲线 (&tau; Decay Equation Plotter)</span>
            </span>
            <p className="text-[10px] text-zinc-550 lowercase font-mono">
              STRENGTH S(t) = S0 * exp(-&lambda; * t), half-life T_0.5 = {decayHalfLife} days, &lambda; = {lambda}
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-48 shrink-0">
            <span className="text-[10.5px] font-mono text-zinc-500 whitespace-nowrap">半衰期: {decayHalfLife}天</span>
            <input
              type="range"
              min="3"
              max="60"
              step="1"
              value={decayHalfLife}
              onChange={(e) => setDecayHalfLife(parseInt(e.target.value))}
              className="w-full accent-[#1D9BF0] h-1.5 rounded-full cursor-pointer bg-neutral-900"
            />
          </div>
        </div>

        {/* Elegant SVG Curve plot with hover grid and decay projection dots */}
        <div className="relative h-[11rem] bg-black/40 border border-neutral-900 rounded-xl flex flex-col justify-between p-4 selection:bg-none">
          {/* background grid */}
          <div className="absolute inset-x-0 bottom-4 border-t border-neutral-900/60 border-dashed" />
          <div className="absolute inset-x-0 bottom-12 border-t border-neutral-900/60 border-dashed" />
          <div className="absolute inset-x-0 bottom-20 border-t border-neutral-900/60 border-dashed" />
          <div className="absolute inset-y-0 left-1/4 border-r border-neutral-900/60 border-dashed" />
          <div className="absolute inset-y-0 left-2/4 border-r border-neutral-900/60 border-dashed" />
          <div className="absolute inset-y-0 left-3/4 border-r border-neutral-900/65 border-dashed" />

          {/* Coordinate Plot labels */}
          <div className="absolute top-2 left-3 text-[8.5px] font-mono text-zinc-650 flex gap-4 uppercase select-none">
            <span>Y: Cognitive Force [0.0 - 1.0]</span>
            <span>X: Elapsed Horizon [0 - 30 Days]</span>
          </div>

          {/* Exponential Curve line plotter */}
          <svg className="absolute inset-0 w-full h-full text-sky-400 opacity-60 flex fill-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path 
              d={`M0,30 Q10,${40 + (30 * calculateDecayForDay(5))} 35,${30 + (70 * (1 - calculateDecayForDay(10)))} 65,${30 + (70 * (1 - calculateDecayForDay(20)))} 100,${30 + (70 * (1 - calculateDecayForDay(30)))}`} 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinejoin="round"
            />
          </svg>

          {/* Decay dots with detailed specs */}
          <div className="flex justify-between items-end w-full h-full relative z-10 select-none">
            {[0, 1, 5, 15, 30].map(days => {
              const strength = calculateDecayForDay(days);
              const heightPct = strength * 85;
              return (
                <div key={days} className="flex-1 flex flex-col items-center justify-end h-full font-mono relative">
                  <div 
                    className="w-2.5 h-2.5 rounded-full bg-sky-400 border border-black shadow-[0_0_8px_rgba(56,189,248,0.7)] hover:scale-125 transition-transform cursor-crosshair absolute"
                    style={{ bottom: `${heightPct}%` }}
                    title={`第${days}天: 记忆剩存 ${(strength * 100).toFixed(1)}%`}
                  />
                  
                  <div className="text-[9px] text-zinc-550 flex flex-col items-center gap-0.5 mt-auto">
                    <span className="text-[#1D9BF0] font-bold">{(strength * 100).toFixed(0)}%</span>
                    <span>T+{days}d</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Local database list with current active vector keys */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-widest block">
            目前常驻物理特征矢量记忆节点 (Active Vector In-Memory Nodes):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[14rem] overflow-y-auto pr-1">
            {dbList.map(item => (
              <div key={item.id} className="p-3 bg-black/60 border border-neutral-900 rounded-xl space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center pb-1 border-b border-neutral-950 font-mono text-[9.5px]">
                  <span className="text-sky-400 font-bold">#{item.key}</span>
                  <span className="text-zinc-650">衰减系数: {item.decayCoeff}</span>
                </div>
                <p className="text-neutral-400 leading-relaxed truncate-2-lines line-clamp-2">{item.data}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* R/W Transaction Live simulator block */}
      <div className="lg:col-span-4 p-5 bg-black border border-neutral-800 rounded-2xl flex flex-col justify-between space-y-4">
        <div className="space-y-3.5">
          <span className="text-xs font-bold text-white block pb-2 border-b border-neutral-800">
            📊 记忆读写对账仿真网口 (HyperMem Simulator)
          </span>

          {/* Operation switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-lg">
            {(['READ', 'WRITE', 'FORGET'] as const).map(op => (
              <button
                key={op}
                type="button"
                onClick={() => setSimOperation(op)}
                className={`py-1 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer ${
                  simOperation === op 
                    ? 'bg-sky-400/10 text-sky-400 border border-sky-400/20' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {op}
              </button>
            ))}
          </div>

          {/* Dynamic input according to choose */}
          {simOperation === 'READ' && (
            <div className="space-y-1.5 font-sans">
              <label className="text-[9.5px] text-zinc-400 font-mono">相似匹配输入语句 (Query Term):</label>
              <input
                type="text"
                value={simQuery}
                onChange={(e) => setSimQuery(e.target.value)}
                placeholder="例如: 秋冬羊绒"
                className="w-full bg-[#070709] border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-700"
              />
            </div>
          )}

          {simOperation === 'WRITE' && (
            <div className="space-y-2 font-sans">
              <div className="space-y-1">
                <label className="text-[9.5px] text-zinc-400 font-mono">哈希认知键值 (Key):</label>
                <input
                  type="text"
                  value={simKey}
                  onChange={(e) => setSimKey(e.target.value)}
                  placeholder="例如: CUST_SIZE_XS"
                  className="w-full bg-[#070709] border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-emerald-400 font-mono uppercase focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9.5px] text-zinc-400 font-mono">语义记忆切片 (Chunk Content):</label>
                <textarea
                  value={simContent}
                  onChange={(e) => setSimContent(e.target.value)}
                  placeholder="内容越详实，后续在R/W周期内的语义匹配相似分就越高..."
                  className="w-full bg-[#070709] border border-neutral-800 rounded p-2 text-xs text-neutral-300 min-h-[4.5rem] max-h-[5.5rem] focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>
          )}

          {simOperation === 'FORGET' && (
            <div className="p-3 bg-neutral-900/30 border border-neutral-850 rounded-lg text-[10.5px] text-zinc-400 leading-normal font-sans">
              <span className="text-amber-500 font-bold block mb-0.5">⚠️ 认知修剪忘却警告:</span>
              点击模拟运行将遵循 HyperMem 熵减淘汰法则，自动随机丢弃或清扫一个长期低热度常驻记忆板块以释放算力代金券。
            </div>
          )}

          <button
            type="button"
            onClick={handleSimulateTransaction}
            className="w-full py-2 bg-neutral-950 border border-neutral-800 text-xs font-bold text-sky-400 hover:border-sky-500 hover:bg-neutral-900 rounded-lg transition-all active:scale-[0.98]"
          >
            模拟运行 {simOperation} 指令
          </button>
        </div>

        {/* Live ledger listing transactional history */}
        <div className="space-y-1.5 font-mono">
          <span className="text-[9.5px] text-zinc-550 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-zinc-600" />
            <span>HyperMem Ledger Real-time Logs:</span>
          </span>

          <div className="border border-neutral-900 rounded-lg overflow-hidden bg-black max-h-[9rem] overflow-y-auto">
            <table className="w-full text-left border-collapse text-[9.5px]">
              <thead>
                <tr className="bg-neutral-950 text-zinc-500 border-b border-neutral-900 font-bold">
                  <th className="px-2 py-1">时</th>
                  <th className="px-2 py-1">操作</th>
                  <th className="px-2 py-1">密钥</th>
                  <th className="px-2 py-1">相似分数</th>
                  <th className="px-2 py-1 text-right">损耗</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-950 text-neutral-400">
                {transactionLogs.map(log => (
                  <tr key={log.id} className="hover:bg-neutral-900/60 transition-colors">
                    <td className="px-2 py-1 text-zinc-600">{log.timestamp}</td>
                    <td className="px-2 py-1">
                      <span className={`px-1 rounded font-bold text-[8.5px] ${
                        log.op === 'WRITE' ? 'bg-emerald-500/10 text-emerald-400' :
                        log.op === 'READ' ? 'bg-sky-500/10 text-[#1D9BF0]' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {log.op}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-zinc-300 max-w-[5rem] truncate">#{log.key}</td>
                    <td className="px-2 py-1 text-zinc-400">{log.score}</td>
                    <td className="px-2 py-1 text-right text-emerald-500 font-bold">-{log.tokenCost}t</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
