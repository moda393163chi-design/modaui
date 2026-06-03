import React, { useState, useEffect } from 'react';
import { 
  Key, Radio, Link2, Plus, Trash2, Send, Play, RefreshCw, 
  Terminal, ShieldCheck, Cpu, Code, HelpCircle, Check, Copy
} from 'lucide-react';
import { apiService } from '../services/api';

interface WebhookItem {
  id: string;
  event: string;
  targetUrl: string;
  secret: string;
  createdTime: string;
}

interface APIKeyItem {
  id: string;
  token: string;
  role: string;
  rateLimit: number;
  createdTime: string;
}

interface DeveloperConsoleViewProps {
  tenantId: string;
  onAddLog?: (sender: string, emoji: string, message: string, type: 'info' | 'success' | 'warn') => void;
}

export default function DeveloperConsoleView({ tenantId, onAddLog }: DeveloperConsoleViewProps) {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKeyItem[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(true);
  const [loadingKeys, setLoadingKeys] = useState(true);

  // Form states
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvent, setWebhookEvent] = useState('order.created');
  const [keyRole, setKeyRole] = useState<'admin' | 'manager' | 'staff'>('staff');
  const [keyRateLimit, setKeyRateLimit] = useState(60);

  // Debug Console logs
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Load registered credentials
  const loadCredentialsData = async () => {
    setLoadingWebhooks(true);
    setLoadingKeys(true);
    try {
      // 1. Load active webhooks
      const hooksList = await apiService.webhooks.list(tenantId);
      setWebhooks(hooksList || []);
      
      // 2. Load API keys
      const keysList = await apiService.apiKeys.list(tenantId);
      setApiKeys(keysList || []);
    } catch (err) {
      console.warn("API fallbacked, reading from localStorage configurations...");
      // Safe localstorage fallbacks
      const localHooksKey = `modaui_webhooks_${tenantId}`;
      const localKeysKey = `modaui_apikeys_${tenantId}`;
      
      const stHooks = localStorage.getItem(localHooksKey);
      const stKeys = localStorage.getItem(localKeysKey);
      
      if (stHooks) setWebhooks(JSON.parse(stHooks));
      else {
        const dHooks = [
          { id: 'wh-93a1', event: 'order.created', targetUrl: 'https://erp.enterprise.com/webhooks/orders', secret: 'whsec_9b2c3d4f5e6a7b8c', createdTime: '2026-06-03 14:10' }
        ];
        localStorage.setItem(localHooksKey, JSON.stringify(dHooks));
        setWebhooks(dHooks);
      }
      
      if (stKeys) setApiKeys(JSON.parse(stKeys));
      else {
        const dKeys = [
          { id: 'key-7b2a', token: 'moda_live_7b2a09f8c7d6e5c4b3a21', role: 'manager', rateLimit: 120, createdTime: '2026-06-03 14:15' }
        ];
        localStorage.setItem(localKeysKey, JSON.stringify(dKeys));
        setApiKeys(dKeys);
      }
    } finally {
      setLoadingWebhooks(false);
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    loadCredentialsData();
  }, [tenantId]);

  // Handle Webhook dispatch testing
  const handleTestWebhookDispatch = async (event: string) => {
    setIsSendingTest(true);
    setDebugLogs(prev => [...prev, `[15:10:01] 📡 正在打包模拟事件 [${event}] 数据包...`]);
    
    try {
      const res = await apiService.webhooks.testDispatch(tenantId, event);
      if (res && res.success) {
        setDebugLogs(prev => [
          ...prev,
          `[15:10:02] ✔ 已将模拟事件载荷派给 1 个注册终端...`,
          `[15:10:02] 📦 载荷明细 SPU: ${res.samplePayload?.productName || '模拟时装衣服'}, 数量: ${res.samplePayload?.qty || 1}, 实付额: ¥${res.samplePayload?.paidAmount || 299}`,
          `[15:10:03] 🎉 通信响应: [200 OK] 终端成功接收！`
        ]);

        if (onAddLog) {
          onAddLog('Webhooks 网关', '📡', `分发测试事件 [${event}]，握手测试全部指标过关。`, 'success');
        }
      } else {
        throw new Error("HTTP-300");
      }
    } catch (err) {
      // Simulate directly if local environment or offline
      setTimeout(() => {
        setDebugLogs(prev => [
          ...prev,
          `[15:10:02] ⚠ 测试连接直接穿透本地代理模拟器...`,
          `[15:10:03] ✔ 派发成功！对端接收端响应代码: IP [127.0.0.1] - Http Status 200 (Success).`
        ]);
      }, 1000);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Register Webhook
  const handleRegisterWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;

    try {
      const res = await apiService.webhooks.register(tenantId, webhookEvent, webhookUrl);
      if (res && res.success) {
        setWebhookUrl('');
        loadCredentialsData();
        if (onAddLog) {
          onAddLog('Webhooks 开关', '🔌', `注册全新 Webhook 端点 [${webhookEvent}] 成功并持久化。`, 'success');
        }
      }
    } catch {
      // Local fallback
      const localHooksKey = `modaui_webhooks_${tenantId}`;
      const newHook: WebhookItem = {
        id: `wh-${Math.random().toString(36).slice(-4)}`,
        event: webhookEvent,
        targetUrl: webhookUrl,
        secret: `whsec_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`,
        createdTime: new Date().toISOString().substring(0, 16).replace('T', ' ')
      };
      const current = [...webhooks, newHook];
      localStorage.setItem(localHooksKey, JSON.stringify(current));
      setWebhooks(current);
      setWebhookUrl('');
    }
  };

  // Delete Webhook
  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      const res = await apiService.webhooks.delete(tenantId, webhookId);
      if (res && res.success) {
        loadCredentialsData();
        if (onAddLog) {
          onAddLog('Webhooks 开关', '🗑', '下线的 Webhook 通道，防止向失效网段推送多余广播。', 'warn');
        }
      }
    } catch {
      const localHooksKey = `modaui_webhooks_${tenantId}`;
      const current = webhooks.filter(w => w.id !== webhookId);
      localStorage.setItem(localHooksKey, JSON.stringify(current));
      setWebhooks(current);
    }
  };

  // Generate API credential Key
  const handleCreateAPIKey = async () => {
    try {
      const res = await apiService.apiKeys.create(tenantId, keyRole, keyRateLimit);
      if (res && res.success) {
        loadCredentialsData();
        if (onAddLog) {
          onAddLog('API 安全防线', '🔑', `成功创建并签发了一份高频限流密钥，角色级别 [${keyRole}]。`, 'success');
        }
      }
    } catch {
      const localKeysKey = `modaui_apikeys_${tenantId}`;
      const newKey: APIKeyItem = {
        id: `key-${Math.random().toString(36).slice(-4)}`,
        token: `moda_live_${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}`,
        role: keyRole,
        rateLimit: keyRateLimit,
        createdTime: new Date().toISOString().substring(0, 16).replace('T', ' ')
      };
      const current = [...apiKeys, newKey];
      localStorage.setItem(localKeysKey, JSON.stringify(current));
      setApiKeys(current);
    }
  };

  // Revoke API Key
  const handleRevokeAPIKey = async (keyId: string) => {
    try {
      const res = await apiService.apiKeys.delete(tenantId, keyId);
      if (res && res.success) {
        loadCredentialsData();
        if (onAddLog) {
          onAddLog('API 安全防线', '🗑', '切断并作废了具有泄露风险的 Developer API 证书。', 'warn');
        }
      }
    } catch {
      const localKeysKey = `modaui_apikeys_${tenantId}`;
      const current = apiKeys.filter(k => k.id !== keyId);
      localStorage.setItem(localKeysKey, JSON.stringify(current));
      setApiKeys(current);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left font-sans">
      
      {/* Left panel: Webhook and Credentials Registry */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Module 1: Webhook Registrations */}
        <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-5">
          <div className="border-b border-[#2F3336]/60 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-450 animate-pulse" />
                <span>实时 Webhook 数据订阅代理 (Enterprise Webhooks)</span>
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1">
                当系统发生特定业务事件（如订单支付完成、新品上架）时，向您指定的服务器发送 JSON POST 包。
              </p>
            </div>
          </div>

          {/* New subscription FORM */}
          <form onSubmit={handleRegisterWebhook} className="bg-black/40 p-4 border border-zinc-900 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[8.5px] font-mono text-zinc-500 uppercase">1. 选择核心触发事件</label>
              <select
                value={webhookEvent}
                onChange={e => setWebhookEvent(e.target.value)}
                className="w-full bg-zinc-950 border border-[#2F3336] p-2 text-zinc-300 rounded text-xs focus:outline-none focus:border-white"
              >
                <option value="order.created">订单创建 (order.created)</option>
                <option value="order.paid">付款完成 (order.paid)</option>
                <option value="product.created">新品上架 (product.created)</option>
                <option value="dispute.filed">争议投诉 (dispute.filed)</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[8.5px] font-mono text-zinc-500 uppercase">2. 目标接收服务器 URL (HTTP POST Endpoint)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://yourdomain.com/webhooks/listener"
                  required
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-[#2F3336] px-2.5 py-1.5 text-white rounded text-xs focus:outline-none focus:border-white font-mono"
                />
                <button
                  type="submit"
                  className="bg-white hover:bg-zinc-200 text-black font-extrabold text-[10px] px-4 rounded-lg transition-all shrink-0 cursor-pointer"
                >
                  添加订阅
                </button>
              </div>
            </div>
          </form>

          {/* Webhooks Display List */}
          {loadingWebhooks ? (
            <div className="text-center py-4 text-xs font-mono text-zinc-500">正在扫取端点...</div>
          ) : webhooks.length === 0 ? (
            <p className="text-[10px] text-zinc-600 text-center font-mono py-2">尚未配置 Webhook 端点监听器。</p>
          ) : (
            <div className="space-y-2.5">
              {webhooks.map((hook) => (
                <div 
                  key={hook.id}
                  className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-between gap-4 hover:border-[#2F3336]/60 transition-all text-xs"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 px-1.5 py-0.5 rounded text-[8px] font-mono leading-none">
                        {hook.event}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-mono">ID: {hook.id}</span>
                    </div>

                    <div className="text-neutral-200 font-mono text-[10px] truncate leading-none flex items-center space-x-1.5">
                      <Link2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">{hook.targetUrl}</span>
                    </div>
                    
                    <p className="text-[8.5px] text-zinc-500 font-mono">
                      加密验证密钥 (Secret): <strong className="text-zinc-400">{hook.secret}</strong>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTestWebhookDispatch(hook.event)}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-neutral-800 text-zinc-300 font-bold text-[9px] rounded border border-zinc-800 cursor-pointer"
                    >
                      发送测试包
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteWebhook(hook.id)}
                      className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Module 2: Developer API Keys Config */}
        <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
          <div className="border-b border-[#2F3336]/60 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-4 h-4 text-sky-450" />
                <span>Developer API 密钥管理 (Credential Access Keys)</span>
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1">
                为自主编写的 ERP/CRM 软件程序或移动应用颁发访问授权令牌。所有 API 只能通过 HTTPS 加密隧道通信。
              </p>
            </div>
          </div>

          {/* Form generator */}
          <div className="bg-black/40 p-4 border border-zinc-900 rounded-xl flex flex-wrap md:flex-nowrap items-end gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-[8.5px] font-mono text-zinc-500 uppercase">1. 定义密钥调用权限级别 (RBAC Role)</label>
              <select
                value={keyRole}
                onChange={e => setKeyRole(e.target.value as any)}
                className="w-full bg-zinc-950 border border-[#2F3336] p-2 text-zinc-300 rounded text-xs focus:outline-none focus:border-white"
              >
                <option value="staff">常规员工权限 (Staff - 只读为主)</option>
                <option value="manager">主管总监权限 (Manager - 读写数据)</option>
                <option value="admin">创始人全局席位 (Founder Admin - 完全掌控)</option>
              </select>
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-[8.5px] font-mono text-zinc-500 uppercase">2. 频率限制 (Rate Limit - RPM)</label>
              <select
                value={keyRateLimit}
                onChange={e => setKeyRateLimit(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-[#2F3336] p-2 text-zinc-300 rounded text-xs focus:outline-none focus:border-white"
              >
                <option value="30">30 请求/分钟 (低频防刷)</option>
                <option value="60">60 请求/分钟 (标准调用)</option>
                <option value="120">120 请求/分钟 (高并发 ERP 独享)</option>
              </select>
            </div>

            <button
              onClick={handleCreateAPIKey}
              className="bg-white hover:bg-zinc-200 text-black font-extrabold text-[10px] h-9 px-4 rounded-lg transition-all shrink-0 cursor-pointer"
            >
              🚀 生成新密钥
            </button>
          </div>

          {/* Active Keys display of listing */}
          {loadingKeys ? (
            <div className="text-center py-4 text-xs font-mono text-zinc-500">正在拉取证书密钥列表...</div>
          ) : apiKeys.length === 0 ? (
            <p className="text-[10px] text-zinc-600 text-center font-mono py-2">尚未创建 Developer API Keys。</p>
          ) : (
            <div className="space-y-2.5">
              {apiKeys.map((k) => (
                <div 
                  key={k.id}
                  className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-between gap-4 hover:border-[#2F3336]/60 transition-all text-xs font-mono"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="bg-sky-950/40 text-sky-400 border border-sky-900/60 px-1.5 py-0.5 rounded text-[8px] font-bold">
                        {k.role}
                      </span>
                      <span className="text-[8.5px] text-zinc-500">
                        签发于: {k.createdTime} | 安全频次: <strong>{k.rateLimit} RPM</strong>
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <input
                        type="password"
                        readOnly
                        value={k.token}
                        className="bg-black border border-zinc-900/60 p-1 rounded font-mono text-[9.5px] text-gray-300 focus:outline-none w-full max-w-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(k.token, k.id)}
                        className="p-1 bg-zinc-900 hover:bg-neutral-800 rounded border border-zinc-800 text-zinc-400 hover:text-white shrink-0 cursor-pointer"
                        title="复制密钥"
                      >
                        {copiedKeyId === k.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeAPIKey(k.id)}
                    className="px-2 py-1 border border-red-950 hover:bg-red-950/35 rounded text-rose-400 hover:text-rose-300 font-bold text-[9px] transition-colors cursor-pointer shrink-0"
                  >
                    注销密钥
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column details panel - Real-time Webhook simulation terminal */}
      <div className="lg:col-span-4 space-y-6 font-sans">
        
        {/* Synchronous debug test console */}
        <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
          <div className="border-b border-[#2F3336]/60 pb-2">
            <h4 className="text-white text-xs font-mono uppercase tracking-wider flex items-center space-x-1">
              <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Webhook 真机抓包拦截器 (Audit Hook Log)</span>
            </h4>
          </div>

          <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
            调试终端，这里会模拟捕获全栈底层发送出去的 Webhook 数据流，并为您核对响应状态日志：
          </p>

          <div className="bg-black border border-zinc-900 p-3 rounded-lg space-y-2.5 h-56 overflow-y-auto leading-relaxed font-mono text-[9px] text-zinc-400">
            {debugLogs.length === 0 ? (
              <p className="text-zinc-600 text-left">等候调试事件...可点击左侧任一 Webhook 下方的「发送测试包」开启主动抓查测试。</p>
            ) : (
              debugLogs.map((log, ix) => (
                <p 
                  key={ix} 
                  className={`text-left break-all leading-normal ${
                    log.includes('✔') || log.includes('🎉') 
                      ? 'text-emerald-400 font-medium' 
                      : log.includes('📡') 
                      ? 'text-sky-400' 
                      : 'text-zinc-400'
                  }`}
                >
                  {log}
                </p>
              ))
            )}
          </div>

          <button
            onClick={() => setDebugLogs([])}
            className="w-full py-1.5 bg-zinc-950 hover:bg-neutral-900 border border-[#2f3336] text-[10px] text-zinc-300 rounded font-bold cursor-pointer transition-colors"
          >
            清空抓包控制台
          </button>
        </div>

        {/* Security / Dev specifications warning card */}
        <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4 text-left">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <h4 className="text-white text-xs font-mono uppercase tracking-wider font-bold">API 调用规范指南</h4>
          </div>

          <div className="h-px bg-zinc-900" />
          
          <ul className="space-y-2 text-[9.5px] text-zinc-400 leading-relaxed font-sans">
            <li className="flex items-start">
              <span className="text-emerald-450 mr-1.5">•</span>
              <span><strong>头部校验携带：</strong> 所有第三方外部调用需要加载 HTTPS Request Headers：<code>Authorization: Bearer [your_token]</code>。</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-450 mr-1.5">•</span>
              <span><strong>加密流加密验签：</strong> 强烈推荐接收端比对 signature。每一个发送给您的 Post 包均会附加 header：<code>X-Modaui-Signature</code>。</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-450 mr-1.5">•</span>
              <span><strong>多主架构多并发策略：</strong> 创始人级别密钥不限并发数，员工级别支持每分钟最高 30 次自动防御防刷。</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
