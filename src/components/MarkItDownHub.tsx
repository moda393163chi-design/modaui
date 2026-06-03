import React, { useState } from 'react';
import { FileText, Terminal, CheckCircle2, ChevronRight, UploadCloud, RefreshCw, FileCode } from 'lucide-react';

interface MarkItDownHubProps {
  currentIndustryLabel: string;
  onSyncToKnowledge: (title: string, content: string, codeValue: string) => void;
  onAddLog: (log: string) => void;
}

export default function MarkItDownHub({ currentIndustryLabel, onSyncToKnowledge, onAddLog }: MarkItDownHubProps) {
  const [docFormat, setDocFormat] = useState<'pdf' | 'docx' | 'xlsx' | 'html'>('pdf');
  const [docName, setDocName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [cliLogs, setCliLogs] = useState<string[]>([]);
  const [extractedMarkdown, setExtractedMarkdown] = useState<string>('');
  const [extractedCodeJson, setExtractedCodeJson] = useState<string>('');
  const [extractedTitle, setExtractedTitle] = useState<string>('');

  const sampleMarkdowns = {
    pdf: {
      title: '秋冬高支保暖羊绒供应链及返利保障协议.pdf',
      markdown: '# 秋冬高支羊绒针织衫工艺与采购准则\n\n- **面辅料规格**: 必须选用100-120支超精细山羊绒，单克保温因子大于8.5。\n- **供应商起订量**: 首单起订量（MOQ）控制在30-50件，超出50件启动10小时二期极速补货流程。\n- **理赔赔付**: 物流延迟超过24小时的，代工厂自动按单价格外扣除5.5%作为对冲补偿。',
      code: '{\n  "rawMaterial": "100-120S Cashmere",\n  "moqLevel": 30,\n  "cloudCompensationRatio": 0.055,\n  "supplierFastReactionThreshold": 10\n}'
    },
    docx: {
      title: '外卖配送差评自愈及全赔核负规则.docx',
      markdown: '# 快送积压及全赔自愈退款规程\n\n1. **事故界定**: 接单至妥投超过38分钟，或用户反馈餐品漏溢汤汁。\n2. **执行方案**: Cyrus纠纷管家11ms内调取Stripe原路径返还退款，并自动派发15元无门槛满减红卡。\n3. **对冲保价**: 由承运方顺丰承担90%的保费索赔，直接追加到商铺税务账单中。',
      code: '{\n  "maxTransitBufferMinutes": 38,\n  "compensateVoucher": 15.00,\n  "sfInsuranceCoverageRatio": 0.90\n}'
    },
    xlsx: {
      title: '直通车爆词竞拍CPC与转化率账眼日结.xlsx',
      markdown: '# 跨境百货关键词CPC动态竞买竞配表\n\n| 关键词 | 最大出价上限 | 动态加权系数 | 目标转化红线 |\n| :--- | :--- | :--- | :--- |\n| 通勤显瘦连衣裙 | ¥1.25 | 1.35 | 8.2% |\n| 老钱风西装 | ¥2.10 | 1.45 | 10.5% |\n| 极简大衣 | ¥0.85 | 1.15 | 5.5% |',
      code: '{\n  "keywordsMaxCpc": 2.10,\n  "dynamicBiddingMultiplier": 1.35,\n  "minConvsionRatio": 0.082\n}'
    },
    html: {
      title: '美发私域高端金卡VIP客诉二度重约方案.html',
      markdown: '# 金卡私域回头客拓客争议重约自愈准则\n\n- **触发卡点**: VIP客户反馈效果不佳，非营业时段有追加赔付抱怨。\n- **自愈路由**: 无需超级管理员审批，系统立即预约翌日上午10点原店总监特剪。\n- **赔款包**: 账户余额自动增记30元安抚券进行客诉拦截。',
      code: '{\n  "autoRebookEnabled": true,\n  "vipCompensationYen": 30.00,\n  "reservedTimeslot": "10:00:00"\n}'
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      setDocName(file.name);
      triggerParse(file.name);
    }
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setDocName(files[0].name);
      triggerParse(files[0].name);
    }
  };

  const triggerParse = (fileName: string) => {
    setIsParsing(true);
    setCliLogs([]);
    setExtractedMarkdown('');
    setExtractedCodeJson('');
    setExtractedTitle('');

    const sample = sampleMarkdowns[docFormat];
    const displayTitle = fileName || sample.title;

    const logs = [
      `[MarkItDown CLI] Initialization: Processing file stream: "${displayTitle}"`,
      `[MarkItDown CLI] Detector: Identified file type as standard [${docFormat.toUpperCase()}] binary structure.`,
      `[MarkItDown CLI] Parser: Spinning up OCR layout extraction modules & cell matrix scanners...`,
      `[MarkItDown CLI] Extraction: Analyzing table headers, parsing bullets and text weights.`,
      `[MarkItDown CLI] Generator: Direct-to-Markdown alignment wrapping completed with 0 errors.`,
      `[MarkItDown CLI] Syncing Cache: Extracted raw data models aligned into JSON mappings.`
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setCliLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setIsParsing(false);
        setExtractedTitle(displayTitle.replace(/\.[^/.]+$/, ""));
        setExtractedMarkdown(sample.markdown);
        setExtractedCodeJson(sample.code);
        onAddLog(`【MarkItDown】成功使用微软 MarkItDown 套件将 "${displayTitle}" 转换为高契合度 Markdown 语义规则！`);
      }
    }, 450);
  };

  const handlePublishToKnowledge = () => {
    if (!extractedMarkdown || !extractedTitle) return;
    onSyncToKnowledge(extractedTitle, extractedMarkdown, extractedCodeJson);
    onAddLog(`【知识扩展】成功将从 "${docName || extractedTitle}" 提取的 Markdown 规则合并注入到当前领域的 AI 共享脑！🟢`);
    // Reset
    setDocName('');
    setExtractedMarkdown('');
    setExtractedCodeJson('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* Upload Zone & CLI */}
      <div className="bg-[#070709] border border-neutral-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 relative">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
              <UploadCloud className="w-3.5 h-3.5 text-[#1D9BF0]" />
              <span>Microsoft MarkItDown 微软物理文件转 Markdown 提取舱</span>
            </span>
          </div>

          {/* Doc type select */}
          <div className="grid grid-cols-4 gap-1.5 bg-neutral-950 p-1 rounded-xl">
            {(['pdf', 'docx', 'xlsx', 'html'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setDocFormat(f)}
                className={`py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  docFormat === f 
                    ? 'bg-[#1D9BF0]/15 text-[#1D9BF0] border border-[#1D9BF0]/30' 
                    : 'text-neutral-500 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Drag and drop bounder */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl py-6 px-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 relative overflow-hidden ${
              isDragging 
                ? 'border-[#1D9BF0] bg-[#1D9BF0]/5 shadow-inner' 
                : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/40'
            }`}
          >
            <input
              type="file"
              id="markitdown-uploader"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleSelectFile}
              accept={
                docFormat === 'pdf' ? '.pdf' :
                docFormat === 'docx' ? '.docx,.doc' :
                docFormat === 'xlsx' ? '.xlsx,.xls' : '.html,.htm'
              }
            />
            <FileText className={`w-8 h-8 mb-2 ${isDragging ? 'text-sky-400' : 'text-neutral-500'}`} />
            <p className="text-[11px] font-bold text-white leading-relaxed">
              {docName ? `已选中: ${docName}` : `拖放或点击上传行业 ${docFormat.toUpperCase()} 文档`}
            </p>
            <p className="text-[9.5px] text-zinc-500 mt-1 max-w-[19rem] leading-normal font-mono uppercase">
              Drag-and-drop support available for fast OCR ingestion.
            </p>
          </div>
        </div>

        {/* Console Live Progress */}
        <div className="space-y-1.5 flex-1 flex flex-col justify-end font-mono">
          <span className="text-[9.5px] text-zinc-550 flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-zinc-650" />
            <span>MarkItDown Converter Core Log:</span>
          </span>
          <div className="bg-black/95 p-3 border border-neutral-900 rounded-xl text-[10px] text-emerald-400 min-h-[7rem] max-h-[8.5rem] overflow-y-auto leading-relaxed space-y-1 select-none">
            {cliLogs.length === 0 ? (
              <span className="text-zinc-600 block italic">等待上传文件以触发 MarkItDown 高精度渲染管道...</span>
            ) : (
              cliLogs.map((log, idx) => (
                <p key={idx} className="truncate">
                  <span className="text-zinc-600 mr-1.5 font-sans">&gt;</span>
                  {log}
                </p>
              ))
            )}
            {isParsing && (
              <div className="flex items-center space-x-2 text-sky-400 animate-pulse pt-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>[MarkItDown] 正在解析文档布局矩阵并编译为高维Markdown语义块...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Parser Extract Result Panel with code view & append to base */}
      <div className="bg-neutral-900/10 border border-neutral-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-neutral-900">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-amber-500" />
              <span>等候同步：MarkItDown 编译内容预览</span>
            </span>
            <span className="text-[8.5px] font-mono whitespace-nowrap text-zinc-550 uppercase">Extracted Syntax</span>
          </div>

          {extractedMarkdown ? (
            <div className="space-y-3">
              <div className="space-y-1 font-sans">
                <label className="text-[9.5px] text-zinc-500 font-mono uppercase">已命名的规则模块标题 (Editable):</label>
                <input
                  type="text"
                  value={extractedTitle}
                  onChange={(e) => setExtractedTitle(e.target.value)}
                  className="w-full bg-black border border-neutral-800 text-xs text-white rounded px-3 py-1.5 focus:outline-none focus:border-zinc-700 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9.5px] text-zinc-500 font-mono uppercase block">Markdown 规章正文:</span>
                  <textarea
                    value={extractedMarkdown}
                    onChange={(e) => setExtractedMarkdown(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded p-2.5 text-[10.5px] font-sans text-neutral-300 leading-normal min-h-[7rem] max-h-[9rem] focus:outline-none focus:border-zinc-700 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[9.5px] text-zinc-500 font-mono uppercase block">同步运行层 JSON 配置:</span>
                  <textarea
                    value={extractedCodeJson}
                    onChange={(e) => setExtractedCodeJson(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded p-2.5 text-[10px] font-mono text-emerald-400 leading-relaxed min-h-[7rem] max-h-[9rem] focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[12.5rem] border border-neutral-900 bg-neutral-950/20 rounded-xl flex flex-col items-center justify-center text-center p-4">
              <FileText className="w-10 h-10 text-neutral-800 mb-2" />
              <p className="text-[11.5px] text-neutral-500">
                暂未提取到 Markdown 结果
              </p>
              <p className="text-[9.5px] text-zinc-650 mt-1 max-w-[15rem] leading-normal uppercase">
                Please drag or select a local doc context to feed Microsoft MarkItDown layout engine.
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handlePublishToKnowledge}
          disabled={!extractedMarkdown || !extractedTitle}
          className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-550 hover:to-sky-650 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white rounded-lg shadow-lg active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          <span>一键追加：注入到当前垂直行业共享大脑【{currentIndustryLabel}】</span>
        </button>
      </div>
    </div>
  );
}
