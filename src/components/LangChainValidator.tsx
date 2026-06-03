import React, { useState } from 'react';
import { Settings, Play, Check, AlertTriangle, Terminal, Plus, Trash2, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

interface LangChainValidatorProps {
  initialTools: ToolDef[];
  onAddLog: (log: string) => void;
}

interface SchemaProperty {
  id: string;
  name: string;
  type: 'String' | 'Int' | 'Float' | 'Bool';
  required: boolean;
  desc: string;
}

export default function LangChainValidator({ initialTools, onAddLog }: LangChainValidatorProps) {
  const [tools, setTools] = useState<ToolDef[]>(initialTools);
  const [selectedId, setSelectedId] = useState<string>('t1');
  const [testerInput, setTesterInput] = useState<string>('');
  const [validationLogs, setValidationLogs] = useState<string[]>([]);
  const [isPassed, setIsPassed] = useState<boolean | null>(null);

  // New Tool Schema form states
  const [newToolName, setNewToolName] = useState('');
  const [newToolDesc, setNewToolDesc] = useState('');
  const [schemaProperties, setSchemaProperties] = useState<SchemaProperty[]>([
    { id: '1', name: 'weightKg', type: 'Float', required: true, desc: '货包物理重量' },
    { id: '2', name: 'destination', type: 'String', required: true, desc: '目的地省市' }
  ]);
  const [showCreator, setShowCreator] = useState(false);

  // Current selected tool
  const currentTool = tools.find(x => x.id === selectedId) || tools[0];

  React.useEffect(() => {
    if (currentTool) {
      setTesterInput(currentTool.sampleInput);
      setIsPassed(null);
      setValidationLogs([]);
    }
  }, [selectedId, tools]);

  const handleAddField = () => {
    setSchemaProperties(prev => [
      ...prev,
      { id: `sf_${Date.now()}`, name: '', type: 'String', required: false, desc: '' }
    ]);
  };

  const handleRemoveField = (id: string) => {
    setSchemaProperties(prev => prev.filter(x => x.id !== id));
  };

  const handleUpdateProperty = (id: string, field: keyof SchemaProperty, val: any) => {
    setSchemaProperties(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const handleRegisterNewTool = () => {
    if (!newToolName || !newToolDesc) return;

    // Build parameter schema matching string representational logic
    const propertiesObj: Record<string, any> = {};
    schemaProperties.forEach(p => {
      if (p.name.trim()) {
        propertiesObj[p.name.trim()] = {
          type: p.type.toLowerCase(),
          required: p.required,
          description: p.desc
        };
      }
    });

    const newObj: ToolDef = {
      id: `t_custom_${Date.now()}`,
      name: newToolName.trim(),
      desc: newToolDesc,
      parameters: JSON.stringify({ type: "object", properties: propertiesObj }, null, 2),
      sampleInput: JSON.stringify(
        schemaProperties.reduce((acc, p) => {
          if (!p.name) return acc;
          let val: any = "Sample";
          if (p.type === 'Int') val = 120;
          if (p.type === 'Float') val = 3.5;
          if (p.type === 'Bool') val = true;
          return { ...acc, [p.name]: val };
        }, {}),
        null,
        2
      ),
      status: 'active',
      rateLimit: '120 req/min',
      avgLatency: '15ms'
    };

    setTools(prev => [newObj, ...prev]);
    onAddLog(`【接口注册】通过 LangChain Tools 规范成功配载了新定制接口 ${newToolName}()！🟢`);
    
    // Reset Creator
    setNewToolName('');
    setNewToolDesc('');
    setShowCreator(false);
  };

  const handleRunValidation = () => {
    setIsPassed(null);
    setValidationLogs([]);
    const logs: string[] = [];

    logs.push(`[Validator Pipeline] Launching LangChain-Schema compliance scanning...`);
    logs.push(`[Validator Pipeline] Target API signature: "${currentTool.name}()"`);

    try {
      const parsedArgs = JSON.parse(testerInput);
      logs.push(`[Validator Pipeline] Successful parsing payload JSON document.`);

      let schemaPropertiesList: Array<{ name: string; type: string; required: boolean }> = [];
      
      // Parse parameters schema representing list
      try {
        const paramObj = JSON.parse(currentTool.parameters);
        if (paramObj && paramObj.properties) {
          schemaPropertiesList = Object.entries(paramObj.properties).map(([name, entry]: [string, any]) => ({
            name,
            type: entry.type || 'string',
            required: !!entry.required
          }));
        }
      } catch (e) {
        // Fallback standard fields checking
        schemaPropertiesList = [
          { name: 'weightKg', type: 'float', required: true },
          { name: 'destination', type: 'string', required: true }
        ];
      }

      let errorDetected = false;

      schemaPropertiesList.forEach((prop) => {
        const val = parsedArgs[prop.name];

        // Check required fields
        if (prop.required && (val === undefined || val === null)) {
          logs.push(`🛑 [Schema Mismatch Alert] Required property "${prop.name}" is completely missing in arguments payload !`);
          errorDetected = true;
          return;
        }

        if (val !== undefined && val !== null) {
          // Check standard type bindings
          const typeOfVal = typeof val;
          if (prop.type === 'int') {
            if (!Number.isInteger(val)) {
              logs.push(`🛑 [Schema Mismatch Alert] Found attribute "${prop.name}" expected standard Int, but parsed "${typeOfVal}" typeof val.`);
              errorDetected = true;
            }
          } else if (prop.type === 'float') {
            if (typeof val !== 'number') {
              logs.push(`🛑 [Schema Mismatch Alert] Found attribute "${prop.name}" expected standard Float, but parsed "${typeOfVal}" typeof val.`);
              errorDetected = true;
            }
          } else if (prop.type === 'bool' || prop.type === 'boolean') {
            if (typeof val !== 'boolean') {
              logs.push(`🛑 [Schema Mismatch Alert] Found attribute "${prop.name}" expected standard Bool, but parsed "${typeOfVal}" typeof val.`);
              errorDetected = true;
            }
          } else { // string
            if (typeof val !== 'string') {
              logs.push(`🛑 [Schema Mismatch Alert] Found attribute "${prop.name}" expected standard String, but parsed "${typeOfVal}" typeof val.`);
              errorDetected = true;
            }
          }
        }
      });

      if (errorDetected) {
        logs.push(`[Validator Pipeline] Validation FAILED. Releasing detailed compile warnings.`);
        setIsPassed(false);
      } else {
        logs.push(`[Validator Pipeline] Schema verified. Parameters perfectly match compliance rules. Checking OK. 🟢`);
        setIsPassed(true);
      }

    } catch (e) {
      logs.push(`🛑 [Compiler Error] Invalid JSON string detected! Parsing aborted: ${(e as Error).message}`);
      setIsPassed(false);
    }

    setValidationLogs(logs);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch font-mono select-none">
      {/* Left side: registered tools list and custom builder */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex justify-between items-center pb-1 border-b border-neutral-900">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">System Registred Tools:</span>
          
          <button
            onClick={() => setShowCreator(!showCreator)}
            className="text-[9.5px] font-bold text-[#1D9BF0] border border-[#1D9BF0]/15 px-2 py-0.5 rounded cursor-pointer hover:bg-[#1D9BF0]/5 transition-colors"
          >
            {showCreator ? '关闭设计器' : '＋ 新接口设计器'}
          </button>
        </div>

        {/* Builder Form */}
        <AnimatePresence>
          {showCreator && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#050507] p-4 rounded-xl border border-neutral-850 space-y-3 font-sans overflow-hidden"
            >
              <span className="text-[10px] text-sky-400 font-mono font-bold block uppercase pb-1 border-b border-neutral-950">
                ✏️ 契约式 LangChain Tool 接口设计
              </span>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[9.5px] text-zinc-500 font-mono">函数名称 (FuncName):</label>
                  <input
                    type="text"
                    value={newToolName}
                    onChange={(e) => setNewToolName(e.target.value)}
                    placeholder="如: stripe_payout_hold"
                    className="w-full bg-[#070709] border border-neutral-800 rounded px-2 text-xs text-emerald-400 font-mono focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] text-zinc-500 font-mono">服务职责 (Desc):</label>
                  <input
                    type="text"
                    value={newToolDesc}
                    onChange={(e) => setNewToolDesc(e.target.value)}
                    placeholder="如: 锁定商家理赔罚金交易"
                    className="w-full bg-[#070709] border border-neutral-800 rounded px-2 text-xs text-neutral-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* properties specification mapping list */}
              <div className="space-y-2 pt-2 border-t border-neutral-950">
                <div className="flex justify-between items-center text-[9.5px] font-mono leading-none">
                  <span className="text-zinc-500 uppercase">参数 Schema 属性矩阵:</span>
                  <button type="button" onClick={handleAddField} className="text-[#1D9BF0] font-extrabold">+ 增加输入</button>
                </div>

                <div className="space-y-1.5 max-h-[7rem] overflow-y-auto">
                  {schemaProperties.map((p, idx) => (
                    <div key={p.id} className="grid grid-cols-12 gap-1.5 items-center bg-[#070709] p-1.5 rounded border border-neutral-900 font-mono text-[9px]">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => handleUpdateProperty(p.id, 'name', e.target.value)}
                        placeholder="键"
                        className="col-span-4 bg-black border border-neutral-800 rounded px-1.5 py-0.5 text-[#1D9BF0]"
                      />
                      <select
                        value={p.type}
                        onChange={(e) => handleUpdateProperty(p.id, 'type', e.target.value)}
                        className="col-span-3 bg-black border border-neutral-800 rounded py-0.5 text-white"
                      >
                        <option value="String">String</option>
                        <option value="Int">Int</option>
                        <option value="Float">Float</option>
                        <option value="Bool">Bool</option>
                      </select>
                      <label className="col-span-3 flex items-center justify-center space-x-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={p.required}
                          onChange={(e) => handleUpdateProperty(p.id, 'required', e.target.checked)}
                          className="rounded border-neutral-850 text-sky-500 bg-black"
                        />
                        <span className="text-zinc-500">必填</span>
                      </label>
                      <button
                        onClick={() => handleRemoveField(p.id)}
                        className="col-span-2 text-red-500 text-center text-xs"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleRegisterNewTool}
                className="w-full py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-550 hover:to-sky-650 font-bold text-xs rounded-lg text-white font-sans active:scale-[0.98] transition-all cursor-pointer shadow-md"
              >
                完工登记：配载至全局 API 工具池
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3.5 max-h-[17.5rem] overflow-y-auto pr-1">
          {tools.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`p-4 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.01] ${
                selectedId === t.id
                  ? 'border-[#1D9BF0] bg-[#1D9BF0]/5'
                  : 'border-neutral-850 bg-neutral-900/10 hover:border-neutral-700'
              }`}
            >
              <div className="flex justify-between items-center leading-none">
                <h4 className="text-xs font-bold text-white font-mono">{t.name}()</h4>
                <span className="text-[8.5px] font-mono bg-emerald-500/15 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20 font-bold">
                  {t.status.toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 font-sans font-normal leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right side: Input JSON playground and live validation logs console */}
      <div className="lg:col-span-7 bg-[#070709] border border-neutral-800 p-6 rounded-2xl flex flex-col justify-between space-y-4">
        <div className="space-y-3.5">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5 font-sans">
              <Code className="w-3.5 h-3.5 text-[#1D9BF0]" />
              <span>LangChain JSON-Schema 实参编译校验测试舱</span>
            </span>
            <span className="text-[9px] text-[#1D9BF0] font-bold tracking-widest bg-[#1D9BF0]/15 px-2 py-0.5 rounded font-mono">
              TYPE VERIFIER UNIT
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-[9.5px] text-zinc-500 font-mono block uppercase">编辑入参 JSON (Arguments Payload for execution):</label>
            <textarea
              value={testerInput}
              onChange={(e) => setTesterInput(e.target.value)}
              className="w-full bg-black border border-neutral-805 p-3 rounded-lg text-[11px] font-mono text-white focus:outline-none min-h-[6rem] max-h-[8rem] leading-normal"
            />
          </div>

          <button
            type="button"
            onClick={handleRunValidation}
            className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-900 hover:border-[#1D9BF0] text-sky-400 text-xs font-extrabold border border-neutral-800 duration-150 cursor-pointer rounded-lg active:scale-[0.98] flex items-center justify-center space-x-1.5"
          >
            <Play className="w-3 h-3 fill-sky-400 text-sky-400" />
            <span>自校准编译测试 Tool Parameter Compliance</span>
          </button>
        </div>

        {/* Validation log ledger output box */}
        <div className="space-y-1.5 flex-1 flex flex-col justify-end font-mono">
          <span className="text-[9.5px] text-zinc-550 flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-zinc-650" />
            <span>Schema Validator In-Line Diagnostics logs:</span>
          </span>

          <div className="bg-black border border-neutral-950 p-4 rounded-xl min-h-[7rem] max-h-[9.5rem] overflow-y-auto leading-relaxed text-[10.5px] space-y-1">
            {validationLogs.length === 0 ? (
              <span className="text-zinc-600 block italic font-sans text-[11px]">暂无运行校验日志。修改 JSON 并一键跑检 API 合规性。</span>
            ) : (
              validationLogs.map((log, idx) => {
                const isError = log.includes('🛑');
                const isOk = log.includes('🟢');
                let color = 'text-sky-455 text-sky-300';
                if (isError) color = 'text-red-500 font-bold';
                if (isOk) color = 'text-emerald-400 font-bold';
                return (
                  <p key={idx} className={`${color} truncate`}>
                    <span className="text-zinc-650 mr-1 select-none font-sans">&gt;</span>
                    {log}
                  </p>
                );
              })
            )}
            {isPassed === true && (
              <div className="flex items-center space-x-1.5 text-emerald-400 pt-1 font-bold">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Compiler Status Code: (HTTP 200 OK SUCCESS). Safe to dispatch and call inside LangGraph!</span>
              </div>
            )}
            {isPassed === false && (
              <div className="flex items-center space-x-1.5 text-red-500 pt-1 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Compiler Status Code: (400 COMPLIANCE MISMATCH WARNING). Parameter binding validation failed.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
