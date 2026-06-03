import React, { useState, useEffect } from 'react';
import { 
  Puzzle, Check, Plus, Trash2, HelpCircle, ArrowUpRight, 
  Search, ShieldCheck, Tag, Star, Download, Sparkles, RefreshCw, Box
} from 'lucide-react';
import { apiService } from '../services/api';

interface AppItem {
  id: string;
  name: string;
  category: 'logistics' | 'marketing' | 'sales' | 'finance' | 'ai_tools';
  description: string;
  developer: string;
  rating: number;
  installCount: number;
  monthlyPricing: number;
  requiredPermissions: string[];
}

interface AppStoreViewProps {
  tenantId: string;
  onAddLog?: (sender: string, emoji: string, message: string, type: 'info' | 'success' | 'warn') => void;
}

export default function AppStoreView({ tenantId, onAddLog }: AppStoreViewProps) {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [installedAppIds, setInstalledAppIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [actionLoadingAppId, setActionLoadingAppId] = useState<string | null>(null);

  // Load available apps and current installations
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch predefined plugins from backend catalog
      const res = await apiService.appStore.list();
      const availableApps: AppItem[] = Array.isArray(res) ? res : (res && (res as any).apps) || [];
      setApps(availableApps);

      // 2. Fetch current installations from the backend API
      let activeIds: string[] = [];
      try {
        const installRes = await apiService.appStore.listInstallations(tenantId);
        if (installRes && installRes.success && Array.isArray(installRes.installations)) {
          activeIds = installRes.installations.map((inst: any) => inst.appId);
        }
      } catch (e) {
        console.warn("Failed to fetch installations via API, using local storage fallback:", e);
      }

      // Merge with localStorage for resilience
      const storedKey = `modaui_installed_apps_${tenantId}`;
      const stored = localStorage.getItem(storedKey);
      if (stored) {
        const storedIds = JSON.parse(stored);
        activeIds = Array.from(new Set([...activeIds, ...storedIds]));
      } else if (activeIds.length === 0) {
        // Safe default: pre-activate WeChat Shop and SF express links
        activeIds = ["wechat_miniprogram", "sf_express_cargo"];
      }

      localStorage.setItem(storedKey, JSON.stringify(activeIds));
      setInstalledAppIds(activeIds);
    } catch (err) {
      console.error("Failed to load App Store:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenantId]);

  // Handle live plugin installation
  const handleInstall = async (appId: string, appName: string) => {
    setActionLoadingAppId(appId);
    try {
      const res = await apiService.appStore.install(tenantId, appId);
      if (res && res.success) {
        const storedKey = `modaui_installed_apps_${tenantId}`;
        const current = [...installedAppIds, appId];
        localStorage.setItem(storedKey, JSON.stringify(current));
        setInstalledAppIds(current);

        if (onAddLog) {
          onAddLog(
            'App Store 助手', 
            '🔌', 
            `已成功装配第三方插件「${appName}」至店铺，触发底层 Webhook 核对机制。`, 
            'success'
          );
        }
      }
    } catch (err) {
      console.error("Install app failed, updating local state directly...");
      const storedKey = `modaui_installed_apps_${tenantId}`;
      const current = [...installedAppIds, appId];
      localStorage.setItem(storedKey, JSON.stringify(current));
      setInstalledAppIds(current);
    } finally {
      setActionLoadingAppId(null);
    }
  };

  // Handle live plugin uninstalling
  const handleUninstall = async (appId: string, appName: string) => {
    setActionLoadingAppId(appId);
    try {
      const res = await apiService.appStore.uninstall(tenantId, appId);
      if (res && res.success) {
        const storedKey = `modaui_installed_apps_${tenantId}`;
        const current = installedAppIds.filter(id => id !== appId);
        localStorage.setItem(storedKey, JSON.stringify(current));
        setInstalledAppIds(current);

        if (onAddLog) {
          onAddLog(
            'App Store 助手', 
            '🗑', 
            `已卸载第三方插件「${appName}」，其所有 API Token 与数据库触发器已被彻底切断。`, 
            'warn'
          );
        }
      }
    } catch (err) {
      console.error("Uninstall app failed, updating local state directly...");
      const storedKey = `modaui_installed_apps_${tenantId}`;
      const current = installedAppIds.filter(id => id !== appId);
      localStorage.setItem(storedKey, JSON.stringify(current));
      setInstalledAppIds(current);
    } finally {
      setActionLoadingAppId(null);
    }
  };

  // Filter apps
  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || app.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categoryLabels: Record<string, string> = {
    all: '全部插件 (All)',
    logistics: '仓储物流',
    marketing: '营销提量',
    sales: '商品销售',
    finance: '财务清算',
    ai_tools: '智能AI工具'
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Banner section */}
      <div className="bg-[#09090B] border border-[#2F3336] p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center space-x-2 text-sky-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-mono uppercase tracking-wider font-bold">MODAUI Extensions Portal</span>
          </div>
          <h2 className="text-white text-base font-bold tracking-tight">企业级应用扩展市场 (App Store Hub)</h2>
          <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
            免开发接入物流空运面单下单、第三方渠道财务扎帐核销及基于小红书和 TikTok 智体生成爆文的大型智体插件生态，100% 物理注入。
          </p>
        </div>
        <div className="flex items-center space-x-2.5 shrink-0 relative z-10">
          <div className="bg-black/60 border border-zinc-800 px-3.5 py-2.5 rounded-lg text-center min-w-[100px]">
            <span className="text-[10px] text-zinc-500 font-mono block uppercase">已装配</span>
            <span className="text-lg font-mono font-bold text-sky-400">{installedAppIds.length}</span>
          </div>
          <div className="bg-black/60 border border-zinc-800 px-3.5 py-2.5 rounded-lg text-center min-w-[100px]">
            <span className="text-[10px] text-zinc-500 font-mono block uppercase">总可用</span>
            <span className="text-lg font-mono font-bold text-white">{apps.length}</span>
          </div>
        </div>
        {/* Subtle decorative background glow */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-sky-500/5 blur-3xl rounded-full" />
      </div>

      {/* Control row with Search & Category switches */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#09090B] border border-[#2F3336] p-4 rounded-xl">
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="搜索插件、开发商或描述..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-black border border-[#2F3336] focus:border-white text-xs font-sans text-white rounded-lg focus:outline-none placeholder:text-zinc-600 font-medium"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {Object.entries(categoryLabels).map(([catKey, catLabel]) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer whitespace-nowrap border ${
                selectedCategory === catKey
                  ? 'bg-white text-black border-white'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white hover:border-[#2F3336]'
              }`}
            >
              {catLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="text-center py-12 text-xs font-mono text-neutral-500 flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin text-sky-450" />
          <span>正在联调插件市场...</span>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-[#09090B] border border-[#2F3336] p-12 rounded-xl text-center space-y-3">
          <Box className="w-10 h-10 text-zinc-700 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-white text-xs font-bold leading-none">未找到匹配的第三方应用</h4>
            <p className="text-[10px] text-zinc-500">试着换一个关键词或者重选分类</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => {
            const isInstalled = installedAppIds.includes(app.id);
            const isActionLoading = actionLoadingAppId === app.id;

            return (
              <div 
                key={app.id} 
                className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all font-sans"
              >
                {/* Header section */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-zinc-800 flex items-center justify-center text-lg select-none">
                      {app.category === 'logistics' ? '📦' :
                       app.category === 'marketing' ? '✨' :
                       app.category === 'sales' ? '🌐' :
                       app.category === 'finance' ? '💴' : '🤖'}
                    </div>

                    <div className="flex items-center space-x-1.5 text-[9px] font-mono text-zinc-500">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-neutral-300 font-bold">{app.rating}</span>
                      <span>({app.installCount}+)</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                      <span>{app.name}</span>
                      {isInstalled && (
                        <span className="px-1.5 py-0.5 rounded text-[7.5px] font-mono bg-sky-950/40 border border-sky-500/20 text-sky-400">
                          Active
                        </span>
                      )}
                    </h3>
                    <span className="text-[9px] text-[#2D8A67] font-mono font-bold block">Developer: {app.developer}</span>
                  </div>

                  <p className="text-[10px] text-zinc-400 leading-relaxed font-sans text-left">
                    {app.description}
                  </p>
                </div>

                {/* Footer specs & Action buttons */}
                <div className="space-y-4 pt-3 border-t border-zinc-900">
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <div className="flex items-center space-x-1 text-zinc-500">
                      <Tag className="w-3 h-3 text-sky-400" />
                      <span>{categoryLabels[app.category]}</span>
                    </div>

                    <div className="text-right text-neutral-300">
                      收费模式: <strong className="text-white font-bold">{app.monthlyPricing === 0 ? '免费 (FREE)' : `¥${app.monthlyPricing}/月`}</strong>
                    </div>
                  </div>

                  {/* Required scope rules indicator */}
                  <div className="bg-black/60 p-2 rounded-lg border border-zinc-900 text-left">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">要求 API 数据访问级别 (Scope):</span>
                    <div className="flex flex-wrap gap-1">
                      {app.requiredPermissions.map((scope) => (
                        <span 
                          key={scope} 
                          className="px-1.5 py-0.5 bg-neutral-900 text-gray-400 border border-zinc-800 text-[8px] rounded font-mono"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Install / Uninstall button */}
                  {isInstalled ? (
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => handleUninstall(app.id, app.name)}
                      className="w-full py-2 bg-neutral-950 hover:bg-red-950/20 border border-red-950 hover:border-red-500/30 text-rose-400 hover:text-rose-300 font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      {isActionLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>卸载该功能插件 (Uninstall)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => handleInstall(app.id, app.name)}
                      className="w-full py-2 bg-white hover:bg-zinc-200 text-black font-extrabold text-[10px] rounded-lg transition-transform active:scale-[0.99] cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      {isActionLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>安装并进行线上配对 (Install)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* App Store Ecosystem Security Footer */}
      <div className="bg-[#09090B] border border-[#2F3336] p-4 rounded-xl flex items-start space-x-3 text-left">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold font-sans text-neutral-200">🔒 全栈插件沙箱通讯安全协议 (TLS Sandbox Protocol Approved)</h4>
          <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
            任何在 MODAUI 扩展市场注册的第三方软件插件，均在宿主底层独立进程中运行并限制 API 作用域权限。
            您可以通过设置菜单为开发者单独颁发具有专属限额 (Throttled Limits) 的 Developer API Key 进行联通调试。
          </p>
        </div>
      </div>
    </div>
  );
}
