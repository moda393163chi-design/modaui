import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, FolderOpen, Database, Search, Plus, Trash2, ArrowLeft, Upload, CheckCircle, HelpCircle, HardDrive, Cpu, Layers
} from 'lucide-react';
import { auth } from '../services/firebase';

interface KBFile {
  id: string;
  name: string;
  category: string;
  fileSize: string;
  chunksCount: number;
  tokensCount: number;
  uploadedAt: string;
  embedStatus: 'indexed' | 'indexing' | 'failed';
}

export default function KnowledgeBaseView({ onBackToLanding }: { onBackToLanding: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [kbFiles, setKbFiles] = useState<KBFile[]>([
    { id: 'f1', name: '2026年服装电商小红书种草推广高点击率词汇黄金配方.docx', category: 'marketing', fileSize: '240 KB', chunksCount: 18, tokensCount: 15400, uploadedAt: '2026-06-02 23:45', embedStatus: 'indexed' },
    { id: 'f2', name: '摩登精品12大核心SKU面料精梳棉高支参数配方.pdf', category: 'product', fileSize: '1.2 MB', chunksCount: 54, tokensCount: 42000, uploadedAt: '2026-06-02 23:30', embedStatus: 'indexed' },
    { id: 'f3', name: '顺丰大兴一级保仓航空快递协议托运与退赔政策.pdf', category: 'operating', fileSize: '480 KB', chunksCount: 22, tokensCount: 18900, uploadedAt: '2026-06-02 23:15', embedStatus: 'indexed' },
    { id: 'f4', name: '2026年度多商铺损益分析与支付宝对账审计流程.pdf', category: 'corporate', fileSize: '850 KB', chunksCount: 35, tokensCount: 28400, uploadedAt: '2026-06-02 21:00', embedStatus: 'indexed' },
    { id: 'f5', name: '餐饮行业美团大众外卖折扣代金满减神券精算模版.xlsx', category: 'industry', fileSize: '180 KB', chunksCount: 12, tokensCount: 9200, uploadedAt: '2026-06-02 18:30', embedStatus: 'indexed' }
  ]);

  const [simFileName, setSimFileName] = useState('');
  const [simFileCategory, setSimFileCategory] = useState('marketing');
  const [simFileContent, setSimFileContent] = useState('');
  const [isUploadingSim, setIsUploadingSim] = useState(false);
  const [simProgress, setSimProgress] = useState(0);

  const userEmail = auth.currentUser?.email;
  const tenantId = userEmail ? userEmail.replace(/[^a-zA-Z0-9]/g, '_') : 'default_tenant';

  // 1. Fetch real synced KB Chunks from Firestore/Backend
  const fetchFiles = async () => {
    try {
      const res = await fetch(`/api/knowledge?tenantId=${tenantId}`);
      const data = await res.json();
      if (data.success && data.chunks && data.chunks.length > 0) {
        // Map backend kb_chunk object to KBFile UI structure
        const mapped: KBFile[] = data.chunks.map((item: any) => ({
          id: item.id,
          name: item.title,
          category: item.category,
          fileSize: `${Math.ceil((item.content?.length || 0) * 1.5 / 1024)} KB`,
          chunksCount: 1,
          tokensCount: item.tokenCount || 0,
          uploadedAt: item.createdAt ? item.createdAt.substring(0, 16).replace('T', ' ') : '刚刚',
          embedStatus: 'indexed' as const
        }));
        
        // Combine presets with live chunks (ensuring no duplicate IDs)
        setKbFiles(prev => {
          const presets = prev.filter(f => f.id.startsWith('f'));
          return [...mapped, ...presets];
        });
      }
    } catch (err) {
      console.warn("fetch files error:", err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [tenantId]);

  const categories = [
    { id: 'all', name: '全部知识库 (All Files)', count: kbFiles.length },
    { id: 'industry', name: '行业知识库 (Industry KBs)', count: kbFiles.filter(f => f.category === 'industry').length },
    { id: 'product', name: '产品知识库 (Products SPU)', count: kbFiles.filter(f => f.category === 'product').length },
    { id: 'operating', name: '运营知识库 (Operating Rules)', count: kbFiles.filter(f => f.category === 'operating').length },
    { id: 'marketing', name: '营销知识库 (Marketing Formula)', count: kbFiles.filter(f => f.category === 'marketing').length },
    { id: 'corporate', name: '企业知识库 (Corporate Ledger)', count: kbFiles.filter(f => f.category === 'corporate').length }
  ];

  const handleSimUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simFileName.trim() || !simFileContent.trim() || isUploadingSim) return;

    setIsUploadingSim(true);
    setSimProgress(20);

    const interval = setInterval(() => {
      setSimProgress(p => p < 80 ? p + 20 : p);
    }, 250);

    try {
      // Direct POST to RAG vector ingestion endpoint
      const response = await fetch('/api/knowledge/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: simFileName,
          content: simFileContent,
          category: simFileCategory,
          tenantId
        })
      });
      const data = await response.json();
      clearInterval(interval);
      
      if (data.success) {
        setSimProgress(100);
        setTimeout(() => {
          fetchFiles();
          setSimFileName('');
          setSimFileContent('');
          setIsUploadingSim(false);
          setSimProgress(0);
        }, 300);
      } else {
        alert("向量分词载入失败: " + data.error);
        setIsUploadingSim(false);
        setSimProgress(0);
      }
    } catch (err: any) {
      clearInterval(interval);
      alert("连接知识库上传接口错误: " + err.message);
      setIsUploadingSim(false);
      setSimProgress(0);
    }
  };

  const handleRemoveFile = async (id: string) => {
    try {
      if (id.startsWith('chk_')) {
        await fetch(`/api/knowledge/${id}?tenantId=${tenantId}`, {
          method: 'DELETE'
        });
      }
      setKbFiles(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      console.warn("Delete file error:", err.message);
    }
  };

  const filteredFiles = kbFiles.filter(f => {
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-6 relative font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-[#2F3336] pb-6 gap-4">
          <div>
            <button 
              onClick={onBackToLanding}
              className="inline-flex items-center space-x-1 text-xs text-neutral-400 hover:text-white transition-colors py-1.5 px-3 rounded bg-neutral-900 border border-[#2F3336]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回系统控制台</span>
            </button>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display pt-3 flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-[#1D9BF0]" />
              <span>企业及行业知识库系统 (Knowledge Vault)</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1 font-mono tracking-wider uppercase">
              MODAUI EMBEDDED CORPORATE RULES • VECTOR DATABASES & SEMANTIC OVERLAYS
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-neutral-950 p-3 rounded-lg border border-neutral-800 shrink-0 font-mono text-[10px] text-neutral-400">
            <div className="flex items-center space-x-1.5">
              <HardDrive className="w-4 h-4 text-emerald-500" />
              <span>向量维度: 1536</span>
            </div>
            <div className="h-4 w-[1px] bg-neutral-800" />
            <div className="flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-[#1D9BF0]" />
              <span>模型: text-embedding-004</span>
            </div>
          </div>
        </div>

        {/* Content Body Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Left Category Rail */}
          <div className="space-y-4 lg:col-span-1">
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider border-b border-[#2F3336] pb-2 mb-3">
                分类索引
              </h4>
              <nav className="space-y-1">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold font-sans flex items-center justify-between transition-colors cursor-pointer ${
                      selectedCategory === c.id
                        ? 'bg-[#1D9BF0]/10 text-white border-l-2 border-[#1D9BF0]'
                        : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                    }`}
                  >
                    <span>{c.name.split(' (')[0]}</span>
                    <span className="text-[10px] bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-500 border border-[#2F3336] font-mono">
                      {c.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Quick Upload Form Widget */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3.5">
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider border-b border-[#2F3336] pb-2">
                新增知识文档 (Upload File)
              </h4>

              <form onSubmit={handleSimUpload} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-500 font-mono tracking-wider block">文件名 (包含.pdf/.docx等后缀)</label>
                  <input
                    type="text"
                    required
                    value={simFileName}
                    onChange={(e) => setSimFileName(e.target.value)}
                    placeholder="例如: 2026年服装运营决策..."
                    className="w-full bg-black border border-neutral-800 focus:border-[#1D9BF0] rounded-md py-1.5 px-2.5 text-xs text-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-500 font-mono tracking-wider block">知识库类别</label>
                  <select
                    value={simFileCategory}
                    onChange={(e) => setSimFileCategory(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-md py-1.5 px-2.5 text-xs text-neutral-300 focus:outline-none focus:border-[#1D9BF0]"
                  >
                    <option value="industry">行业知识库 (Catering/Retail Rules)</option>
                    <option value="product">产品知识库 (SPU Params)</option>
                    <option value="operating">运营知识库 (SF / Refund Ops)</option>
                    <option value="marketing">营销知识库 (Content Formulas)</option>
                    <option value="corporate">企业知识库 (Profit Ledger)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-neutral-500 font-mono tracking-wider block">核心文档内容 (Text Content)</label>
                  <textarea
                    required
                    value={simFileContent}
                    onChange={(e) => setSimFileContent(e.target.value)}
                    placeholder="输入规则内容、宣传文句或配方参数..."
                    className="w-full bg-black border border-neutral-800 focus:border-[#1D9BF0] rounded-md py-1.5 px-2.5 text-xs text-white focus:outline-none transition-colors min-h-[4.5rem] leading-normal"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!simFileName.trim() || !simFileContent.trim() || isUploadingSim}
                  className={`w-full py-2 rounded font-bold text-xs transition-colors border border-transparent flex items-center justify-center space-x-1.5 ${
                    isUploadingSim 
                      ? 'bg-[#1D9BF0]/20 text-[#1D9BF0] cursor-not-allowed'
                      : 'bg-[#1D9BF0] hover:bg-[#38BDF8] text-white cursor-pointer'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingSim ? '分词生成向量中...' : '提交载入并生成真实向量'}</span>
                </button>
              </form>

              {isUploadingSim && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-[#8B949E]">
                    <span>安全加密向量处理</span>
                    <span>{simProgress}%</span>
                  </div>
                  <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-400 transition-all duration-300" style={{ width: `${simProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Slices Files List Panel */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Filter Search Bar */}
            <div className="bg-neutral-950 p-4 border border-neutral-800 rounded-lg flex items-center space-x-3">
              <Search className="w-4 h-4 text-neutral-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                aria-label="检索知识库文档"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="检索已同步的知识文档、法律条例及运营账本..."
                className="w-full bg-transparent text-xs text-white focus:outline-none font-sans"
              />
            </div>

            {/* List Table Grid Container */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-neutral-800 shrink-0 flex items-center justify-between bg-neutral-950/20">
                <span className="text-[10px] text-neutral-400 font-mono tracking-wider font-bold">已同步的知识文档 ({filteredFiles.length})</span>
                <span className="text-[10px] text-neutral-500 font-mono">嵌入参数: COSINE_SIMILARITY</span>
              </div>

              {filteredFiles.length === 0 ? (
                <div className="p-12 text-center text-neutral-500 text-xs">
                  <FolderOpen className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
                  没有符合当前过滤索引的知识库材料。
                </div>
              ) : (
                <div className="divide-y divide-neutral-800">
                  {filteredFiles.map((file) => (
                    <div 
                      key={file.id} 
                      className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-neutral-900/40 duration-150 transition-colors"
                    >
                      <div className="flex items-start space-x-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg border border-neutral-800 bg-neutral-900 flex items-center justify-center text-rose-400 font-mono text-xs font-bold shrink-0">
                          {file.name.endsWith('.docx') ? 'W' : file.name.endsWith('.xlsx') ? 'X' : 'P'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate break-all">{file.name}</h4>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-neutral-500 mt-1.5 font-mono">
                            <span className="capitalize text-sky-400">#{file.category}</span>
                            <span>•</span>
                            <span>大小: {file.fileSize}</span>
                            <span>•</span>
                            <span>上传于: {file.uploadedAt}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-neutral-800">
                        <div className="text-left md:text-right font-mono text-[10px] text-neutral-400">
                          <p>词块数: {file.chunksCount} chunks</p>
                          <p className="text-[9px] text-neutral-500">消耗代金元: {file.tokensCount} tokens</p>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0">
                          <button
                            onClick={() => handleRemoveFile(file.id)}
                            className="p-1.5 rounded bg-neutral-900 hover:bg-red-950/40 hover:text-red-400 border border-neutral-800 hover:border-red-900/40 cursor-pointer duration-150 transition-all text-neutral-400"
                            title="从知识库移除并解除向量"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visual Vector Chunk Simulator Grid */}
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg space-y-3">
              <h4 className="text-[11px] text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#1D9BF0]" />
                <span>知识切片映射池 (Vector Space Visualizer)</span>
              </h4>
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                {Array.from({ length: 40 }).map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-7 rounded border font-mono text-[9px] flex items-center justify-center cursor-help transition-all duration-150 ${
                      idx % 5 === 0 
                        ? 'border-emerald-500 bg-emerald-950/25 text-emerald-400 shadow-inner' 
                        : idx % 3 === 0
                          ? 'border-sky-500 bg-sky-950/25 text-sky-400'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-500'
                    }`}
                    title={`语义切片编号: idx_chunk_${100 + idx} • 嵌入系数: [${(0.85 + (idx % 10) * 0.01).toFixed(2)}]`}
                  >
                    #{idx + 1}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
