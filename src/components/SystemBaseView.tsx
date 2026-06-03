import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Server, ShieldAlert, Key, HelpCircle, HardDrive, Cpu, Terminal, Layers, RefreshCw, Send, CheckCircle2, ArrowLeft, Trash2, Sliders, Database
} from 'lucide-react';

interface RBACNode {
  role: string;
  scope: string;
  canCreateShop: boolean;
  canDeployAI: boolean;
  canAuditFinancials: boolean;
  status: 'allowed' | 'restricted';
}

export default function SystemBaseView({ onBackToLanding }: { onBackToLanding: () => void }) {
  const [activeTab, setActiveTab] = useState<'rbac' | 'firewall' | 'api' | 'queue' | 'bucket'>('rbac');
  const [swaggerResponse, setSwaggerResponse] = useState<string>('【空闲中】等待执行 API 调用请求校验测试...');
  const [isCallingAPI, setIsCallingAPI] = useState(false);

  const permissionsMatrix: RBACNode[] = [
    { role: 'SYSTEM_SUPER_ADMIN', scope: 'platform_global_all', canCreateShop: true, canDeployAI: true, canAuditFinancials: true, status: 'allowed' },
    { role: 'MERCHANT_OWNER', scope: 'merchant_tenant_owned_only', canCreateShop: true, canDeployAI: true, canAuditFinancials: true, status: 'allowed' },
    { role: 'AI_AGENT_AUTONOMOUS', scope: 'authorized_specialty_actions', canCreateShop: false, canDeployAI: false, canAuditFinancials: true, status: 'allowed' },
    { role: 'CUSTOMER_GUEST', scope: 'public_catalogs_checkout_only', canCreateShop: false, canDeployAI: false, canAuditFinancials: false, status: 'restricted' }
  ];

  const handleTestAPIEndpoint = (endpoint: string) => {
    setIsCallingAPI(true);
    setSwaggerResponse(`【调用中】POST ${endpoint} 对接握手建立。进行 RBAC 鉴权比对中...`);

    setTimeout(() => {
      setIsCallingAPI(false);
      setSwaggerResponse(`【校验完成】200 OK
Response Payload:
{
  "status": "success",
  "requestId": "req_sh_92a9b${Math.floor(Math.random() * 90000) + 10000}cfff",
  "timestamp": "2026-06-02 23:53:50 UTC",
  "data": {
    "authChecked": true,
    "userRole": "AI_AGENT_AUTONOMOUS",
    "allocatedHost": "https://api.modaui.ai/api/v1",
    "envPort": 3000
  }
}`);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-6 relative font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        
        {/* Top Header */}
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
              <Server className="w-8 h-8 text-[#1D9BF0]" />
              <span>系统基础层 (System Base Layer)</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1 font-mono tracking-wider uppercase">
              MODAUI SYSTEM INFRASTRUCTURE • ACCESS POLICIES & MICROSERVICE DISPATCHERS
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-[#09090C] p-3 rounded-lg border border-[#2F3336] shrink-0 font-mono text-[10px] text-neutral-400">
            <div className="flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>API安全级别: WAF_TIER_3</span>
            </div>
            <div className="h-4 w-[1px] bg-neutral-800" />
            <div className="flex items-center space-x-1.5">
              <Terminal className="w-4 h-4 text-[#1D9BF0]" />
              <span>默认容器口: 3000</span>
            </div>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="border-b border-neutral-800 flex flex-wrap gap-1">
          {[
            { id: 'rbac', name: '用户与RBAC权限组 (RBAC)' },
            { id: 'api', name: 'API 网关联动调试 (OpenAPI / Swagger)' },
            { id: 'firewall', name: '安全策略与WAF防刷 (WAF)' },
            { id: 'queue', name: 'Websocket 消息分发队列 (Queues)' },
            { id: 'bucket', name: '文件桶模拟浏览器 (Storage File Bucket)' }
          ].map((tb) => (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id as any)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === tb.id
                  ? 'border-[#1D9BF0] text-sky-400 bg-[#1D9BF0]/5 font-extrabold'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              {tb.name}
            </button>
          ))}
        </div>

        {/* Core Workspace Detail Card */}
        <div className="min-h-[22rem] bg-neutral-950 border border-neutral-800 rounded-xl p-6 sm:p-8">
          <AnimatePresence mode="wait">
            
            {activeTab === 'rbac' && (
              <motion.div
                key="rbac"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center pb-2.5 border-b border-[#2F3336]/60">
                  <h3 className="text-sm font-bold text-white">RBAC 核心权限矩阵控制表 (RBAC Rule Nodes)</h3>
                  <span className="text-[10px] font-mono text-neutral-500">BASE_ACL_COMPILER</span>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs font-sans divide-y divide-neutral-800">
                    <thead>
                      <tr className="text-neutral-500 font-mono text-[10px]">
                        <th className="pb-3 font-bold">基础系统角色名 (RBAC_ROLE)</th>
                        <th className="pb-3 font-bold">默认作用域 (SCOPE)</th>
                        <th className="pb-3 font-bold">创建店铺 (create_shop)</th>
                        <th className="pb-3 font-bold">智体调用部署 (deploy_ai)</th>
                        <th className="pb-3 font-bold">财务对账审计 (audit_financials)</th>
                        <th className="pb-3 font-bold">控制红线</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/40 font-mono">
                      {permissionsMatrix.map((node, idx) => (
                        <tr key={idx} className="hover:bg-neutral-900/10">
                          <td className="py-4 font-bold text-white">{node.role}</td>
                          <td className="py-4 text-neutral-400">`{node.scope}`</td>
                          <td className="py-4">{node.canCreateShop ? '🟢 ALLOW' : '🔴 DENY'}</td>
                          <td className="py-4">{node.canDeployAI ? '🟢 ALLOW' : '🔴 DENY'}</td>
                          <td className="py-4">{node.canAuditFinancials ? '🟢 ALLOW' : '🔴 DENY'}</td>
                          <td className="py-4 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                              node.status === 'allowed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'
                            }`}>
                              {node.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'api' && (
              <motion.div
                key="api"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="pb-2.5 border-b border-[#2F3336]/60">
                  <h3 className="text-sm font-bold text-white">Swagger / OpenAPI 网关联动测试中心</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left endpoints lists */}
                  <div className="md:col-span-1 space-y-2.5">
                    <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider block font-bold">API 路由端点</span>
                    {[
                      { method: 'POST', path: '/api/v1/auth/sync_google' },
                      { method: 'POST', path: '/api/v1/store/theme_deploy' },
                      { method: 'POST', path: '/api/v1/ai/audit_ledger' },
                      { method: 'GET', path: '/api/v1/shipping/quote' }
                    ].map((api, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTestAPIEndpoint(api.path)}
                        className="w-full text-left p-3 rounded bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 font-mono text-[10.5px] transition-colors duration-150 flex items-center justify-between"
                      >
                        <div>
                          <span className={`${api.method === 'POST' ? 'text-[#1D9BF0]' : 'text-emerald-400'} font-black mr-2`}>{api.method}</span>
                          <span className="text-neutral-300">{api.path}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Right tester output terminal */}
                  <div className="md:col-span-2 space-y-2">
                    <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider block font-bold">响应测试终端 (Terminal Response)</span>
                    <div className="p-4 bg-black border border-neutral-800 rounded font-mono text-[10.5px] whitespace-pre leading-relaxed text-sky-400 h-64 overflow-y-auto">
                      {swaggerResponse}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'firewall' && (
              <motion.div
                key="firewall"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="pb-2.5 border-b border-[#2F3336]/60">
                  <h3 className="text-sm font-bold text-white">WAF Web 金流与防刷防火墙规则 (Web Application Firewall)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
                  <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 space-y-2">
                    <div className="flex justify-between items-center text-rose-400 font-bold">
                      <span>✦ RATE_LIMIT_STOREFRONT_CHECKOUT</span>
                      <span>已启用</span>
                    </div>
                    <p className="text-neutral-400 leading-relaxed">限制同一个独立消费者网闸IP在 1 分钟内的最大结账创单频率为 5 次。超频熔断并触发安全系统人工复审。</p>
                  </div>

                  <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 space-y-2">
                    <div className="flex justify-between items-center text-emerald-400 font-bold">
                      <span>✦ STRIPE_SIGNATURE_VERIFICATION</span>
                      <span>已验证</span>
                    </div>
                    <p className="text-neutral-400 leading-relaxed">通过配置安全校验签 header 对接，绝对阻断防范非 Stripe 或者是支付宝后台返回的欺诈退赔伪回调。</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'queue' && (
              <motion.div
                key="queue"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="pb-2.5 border-b border-[#2F3336]/60">
                  <h3 className="text-sm font-bold text-white">WebSocket 事件广播与通知管道 (WS Queues)</h3>
                </div>

                <div className="p-4 bg-black border border-neutral-800 rounded font-mono text-[10.5px] space-y-2 text-neutral-400 overflow-y-auto h-56 leading-relaxed">
                  <p className="hover:text-white duration-100 transition-colors"><span className="text-neutral-500">[10:14:24]</span> CONNECTED: WebSocket 订阅建立成功。安全认证ID: ws_user_99a82</p>
                  <p className="hover:text-white duration-100 transition-colors"><span className="text-neutral-500">[10:14:32]</span> EVENT_EMITTED: `order_paid_event` - 用户朝阳区下单拿铁。正在推送至 Cyrus 跟单智体网络。</p>
                  <p className="hover:text-white duration-100 transition-colors"><span className="text-neutral-500">[10:14:34]</span> WORKFLOW_SCHEDULER: 启动 SF-Express 一站自提 API 打单，回传单号并通知顾客前端店面。</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'bucket' && (
              <motion.div
                key="bucket"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="pb-2.5 border-b border-[#2F3336]/60">
                  <h3 className="text-sm font-bold text-white">云端安全文件桶存储浏览器 (Storage File Bucket)</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'logo_and_icons/', filesCount: 14, size: '2.4 MB' },
                    { name: 'storefront_banners/', filesCount: 8, size: '11.5 MB' },
                    { name: 'product_images/', filesCount: 32, size: '42.0 MB' },
                    { name: 'regulatory_documents/', filesCount: 5, size: '1.8 MB' }
                  ].map((folder, idx) => (
                    <div key={idx} className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg space-y-1 hover:border-[#1D9BF0] duration-150 transition-all cursor-pointer">
                      <span className="text-xl">📁</span>
                      <h4 className="text-xs font-bold text-white font-mono mt-1">{folder.name}</h4>
                      <p className="text-[10px] text-neutral-500 font-mono">包含文件: {folder.filesCount} | 大小: {folder.size}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
