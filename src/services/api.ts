// MODAUI API Unified Service Layer for Express integration
// Bridging React frontend with standard server-side endpoints

import { auth } from './firebase';
import { 
  SysUser, 
  TenantConfig, 
  SPUProduct, 
  CustomerOrder, 
  BillingTransaction, 
  RAGKnowledgeChunk, 
  SysAuditLog, 
  SystemCronJob 
} from '../types/modaui';

// Helper to extract the tenant ID directly from logged in user email or explicit local preview session
export const getActiveTenantId = (): string => {
  const userEmail = auth.currentUser?.email || localStorage.getItem('preview_user_email');
  if (userEmail) {
    return userEmail.replace(/[^a-zA-Z0-9]/g, '_');
  }
  // Do not fallback to a generic tenant. Require explicit tenant selection.
  return localStorage.getItem('preview_tenant_id') || '';
};

// Generic handle response helper
const handleResponse = async (res: Response) => {
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error! status: ${res.status}`);
    }
    return data;
  } else {
    const text = await res.text();
    if (!res.ok) {
      throw new Error(text || `HTTP error! status: ${res.status}`);
    }
    return { success: true, text };
  }
};

export const apiService = {
  // === Authentications ===
  auth: {
    async register(email: string, industryId: string, operatingMode: string, planId: string) {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, industryId, operatingMode, planId })
      });
      return handleResponse(res);
    },

    async login(email: string) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return handleResponse(res);
    },

    async logout(email: string) {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return handleResponse(res);
    },

    async me(sessionId: string) {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      return handleResponse(res);
    }
  },

  // === Multi-tenants & Merchants Config ===
  merchants: {
    async list() {
      const res = await fetch('/api/merchants');
      return handleResponse(res);
    },

    async create(newTenant: Partial<TenantConfig>) {
      const res = await fetch('/api/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTenant })
      });
      return handleResponse(res);
    },

    async suspend(tenantId: string, reason: string) {
      const res = await fetch(`/api/merchants/${tenantId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      return handleResponse(res);
    }
  },

  // === Stores Custom configurations ===
  stores: {
    async get(id: string) {
      const res = await fetch(`/api/stores/${id}`);
      return handleResponse(res);
    },

    async update(id: string, storeData: { name?: string; domain?: string; branding?: { logo?: string; colorTheme?: string; bannerText?: string } }) {
      const res = await fetch(`/api/stores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeData)
      });
      return handleResponse(res);
    }
  },

  // === Cart Service API (Dynamically verified server-backed state) ===
  cart: {
    async get(userId: string) {
      const res = await fetch(`/api/cart?userId=${userId}`);
      return handleResponse(res);
    },
    async add(userId: string, productId: string, quantity: number) {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId, quantity })
      });
      return handleResponse(res);
    },
    async remove(userId: string, productId: string) {
      const res = await fetch('/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId })
      });
      return handleResponse(res);
    },
    async clear(userId: string) {
      const res = await fetch('/api/cart/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      return handleResponse(res);
    }
  },

  // === Platform Tenants Directory & Quotas ===
  tenants: {
    async list() {
      const res = await fetch('/api/tenants');
      return handleResponse(res);
    },
    async update(id: string, updateData: { quotaLimit?: number; billingStatus?: 'paid' | 'unpaid' }) {
      const res = await fetch(`/api/tenants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      return handleResponse(res);
    }
  },

  // === Platform Settings Config Center ===
  platformSettings: {
    async get() {
      const res = await fetch('/api/platform/settings');
      return handleResponse(res);
    },
    async update(settings: { maintenanceMode: boolean; allowRegistration: boolean; defaultQuotaLimit?: number }) {
      const res = await fetch('/api/platform/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      return handleResponse(res);
    }
  },

  // === Industry Blueprint Templates Library ===
  templates: {
    async list() {
      const res = await fetch('/api/templates');
      return handleResponse(res);
    },
    async install(tenantId: string, industryId: string, templateId: string) {
      const res = await fetch('/api/templates/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, industryId, templateId })
      });
      return handleResponse(res);
    }
  },

  // === SPU Products CRUD (Dual synced to Firestore under individual tenant scopes) ===
  products: {
    async list(tenantId: string, industryId: string): Promise<{ success: boolean; products: SPUProduct[] }> {
      const res = await fetch(`/api/products?tenantId=${tenantId}&industryId=${industryId}`);
      return handleResponse(res);
    },

    async create(tenantId: string, industryId: string, product: SPUProduct) {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, industryId, product })
      });
      return handleResponse(res);
    },

    async update(tenantId: string, industryId: string, id: string, product: Partial<SPUProduct>) {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, industryId, product })
      });
      return handleResponse(res);
    },

    async delete(tenantId: string, industryId: string, id: string) {
      const res = await fetch(`/api/products/${id}?tenantId=${tenantId}&industryId=${industryId}`, {
        method: 'DELETE'
      });
      return handleResponse(res);
    }
  },

  // === Consumer Storefront Orders & Logistics ===
  orders: {
    async list(tenantId: string, industryId: string): Promise<{ success: boolean; orders: CustomerOrder[] }> {
      const res = await fetch(`/api/orders?tenantId=${tenantId}&industryId=${industryId}`);
      return handleResponse(res);
    },

    async create(tenantId: string, industryId: string, order: CustomerOrder) {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, industryId, order })
      });
      return handleResponse(res);
    },

    async dispatch(tenantId: string, industryId: string, id: string, trackingNum: string) {
      const res = await fetch(`/api/orders/${id}/dispatch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, industryId, trackingNum })
      });
      return handleResponse(res);
    },

    async refund(tenantId: string, industryId: string, id: string, amount: number, reason: string) {
      const res = await fetch(`/api/orders/${id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, industryId, amount, reason })
      });
      return handleResponse(res);
    }
  },

  // === Payments & Transactions ===
  payments: {
    async stripeCheckout(tenantId: string, amount: number, metadata: any) {
      const res = await fetch('/api/payments/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, amount, ...metadata })
      });
      return handleResponse(res);
    },

    async alipayCheckout(tenantId: string, amount: number, metadata: any) {
      const res = await fetch('/api/payments/alipay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, amount, ...metadata })
      });
      return handleResponse(res);
    },

    async wechatCheckout(tenantId: string, amount: number, metadata: any) {
      const res = await fetch('/api/payments/wechat/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, amount, ...metadata })
      });
      return handleResponse(res);
    },

    async paypalCheckout(tenantId: string, amount: number, metadata: any) {
      const res = await fetch('/api/payments/paypal/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, amount, ...metadata })
      });
      return handleResponse(res);
    },

    async getLedger(tenantId: string): Promise<{ success: boolean; logs: BillingTransaction[] }> {
      const res = await fetch(`/api/finance/ledger?tenantId=${tenantId}`);
      return handleResponse(res);
    }
  },

  // === Extended LLM Service Integrations ===
  llm: {
    async openaiGenerate(prompt: string, model = 'gpt-4') {
      const res = await fetch('/api/ai/openai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model })
      });
      return handleResponse(res);
    },

    async ollamaGenerate(prompt: string, model = 'llama2') {
      const res = await fetch('/api/ai/ollama/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model })
      });
      return handleResponse(res);
    },

    async getLangChainAgent() {
      const res = await fetch('/api/ai/langchain/agent');
      return handleResponse(res);
    }
  },

  // === Knowledge RAG Indexing & Vector Search ===
  knowledge: {
    async list(tenantId: string): Promise<{ success: boolean; chunks: RAGKnowledgeChunk[] }> {
      const res = await fetch(`/api/knowledge?tenantId=${tenantId}`);
      return handleResponse(res);
    },

    async add(tenantId: string, title: string, content: string, category: string) {
      const res = await fetch('/api/knowledge/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, title, content, category })
      });
      return handleResponse(res);
    },

    async delete(tenantId: string, id: string) {
      const res = await fetch(`/api/knowledge/${id}?tenantId=${tenantId}`, {
        method: 'DELETE'
      });
      return handleResponse(res);
    }
  },

  // === AI Digital Employee Agents & Tasks Dispatcher ===
  agents: {
    async listTasks(tenantId: string): Promise<{ success: boolean; tasks: SystemCronJob[] }> {
      const res = await fetch(`/api/agents/tasks?tenantId=${tenantId}`);
      return handleResponse(res);
    },

    async execute(tenantId: string, agentId: string, inputMessage: string, rolePrompt: string) {
      const res = await fetch('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, agentId, inputMessage, rolePrompt })
      });
      return handleResponse(res);
    },

    async chat(tenantId: string, message: string, info: { employeeName: string; employeeRole: string; industryTagline: string; strategyName?: string; strategyDesc?: string }) {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, message, ...info })
      });
      return handleResponse(res);
    }
  },

  // === System Audit Logs & Global telemetry ===
  auditLogs: {
    async list(tenantId: string, component?: string, severity?: string): Promise<{ success: boolean; logs: SysAuditLog[] }> {
      let url = `/api/audit/logs?tenantId=${tenantId}`;
      if (component) url += `&component=${encodeURIComponent(component)}`;
      if (severity) url += `&severity=${encodeURIComponent(severity)}`;
      const res = await fetch(url);
      return handleResponse(res);
    }
  },

  // === Dynamic App Store & Extensions ===
  appStore: {
    async list() {
      const res = await fetch('/api/app-store');
      return handleResponse(res);
    },
    async install(tenantId: string, appId: string, config = {}) {
      const res = await fetch(`/api/app-store/${appId}/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: tenantId, config })
      });
      return handleResponse(res);
    },
    async uninstall(tenantId: string, appId: string) {
      const res = await fetch(`/api/app-store/${appId}/uninstall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: tenantId })
      });
      return handleResponse(res);
    },
    async listInstallations(tenantId: string) {
      const res = await fetch(`/api/app-installations?tenantId=${tenantId}`);
      return handleResponse(res);
    }
  },

  // === Marketing Automation Campaigns ===
  campaigns: {
    async list(tenantId: string) {
      const res = await fetch(`/api/campaigns?tenantId=${tenantId}`);
      return handleResponse(res);
    },
    async create(tenantId: string, campaignData: any) {
      const res = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: tenantId, ...campaignData })
      });
      return handleResponse(res);
    },
    async launch(tenantId: string, campaignId: string) {
      const res = await fetch(`/api/campaigns/${campaignId}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: tenantId })
      });
      return handleResponse(res);
    },
    async getAnalytics(tenantId: string, campaignId: string) {
      const res = await fetch(`/api/campaigns/${campaignId}/analytics?tenantId=${tenantId}`);
      return handleResponse(res);
    }
  },

  // === Omni-Channel Sales Integrations ===
  channels: {
    async list(tenantId: string) {
      const res = await fetch(`/api/channels?tenantId=${tenantId}`);
      return handleResponse(res);
    },
    async connect(tenantId: string, channel: string, authCode = '') {
      const res = await fetch('/api/channels/tiktok/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: tenantId, channel, authCode })
      });
      return handleResponse(res);
    },
    async syncProducts(tenantId: string, channels: string[]) {
      const res = await fetch('/api/channels/xiaohongshu/sync-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: tenantId, channels })
      });
      return handleResponse(res);
    },
    async syncOrders(tenantId: string) {
      const res = await fetch('/api/channels/douyin/sync-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: tenantId })
      });
      return handleResponse(res);
    }
  },

  // === Role-Based Access Control (RBAC) ===
  rbac: {
    async listRoles(tenantId: string) {
      const res = await fetch(`/api/roles?tenantId=${tenantId}`);
      return handleResponse(res);
    },
    async createRole(tenantId: string, roleData: any) {
      const res = await fetch('/api/roles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: tenantId, ...roleData })
      });
      return handleResponse(res);
    },
    async listStaff(tenantId: string) {
      const res = await fetch(`/api/staff?tenantId=${tenantId}`);
      return handleResponse(res);
    },
    async updateStaffRole(tenantId: string, staffId: string, roles: string[]) {
      const res = await fetch(`/api/staff/${staffId}/update-role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: tenantId, roles })
      });
      return handleResponse(res);
    },
    async inviteStaff(tenantId: string, email: string, name: string, roles: string[]) {
      const res = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: tenantId, email, name, roles })
      });
      return handleResponse(res);
    }
  },

  // === Theme Designer Engine ===
  themes: {
    async list(tenantId: string) {
      const res = await fetch(`/api/themes?tenantId=${tenantId}`);
      return handleResponse(res);
    },
    async update(tenantId: string, themeId: string, config: any) {
      const res = await fetch(`/api/themes/${themeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: tenantId, config })
      });
      return handleResponse(res);
    },
    async publish(tenantId: string, themeId: string) {
      const res = await fetch(`/api/themes/${themeId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: tenantId })
      });
      return handleResponse(res);
    }
  },

  // === Custom Webhooks & API Keys Gateway ===
  webhooks: {
    async list(tenantId: string) {
      const res = await fetch(`/api/webhooks?tenantId=${tenantId}`);
      const data = await handleResponse(res);
      // Return registrations array if server wrapped it in { success: true, webhooks: [...] }
      if (data && data.success && Array.isArray(data.webhooks)) {
        return data.webhooks.map((w: any) => ({
          id: w.id,
          event: w.event,
          targetUrl: w.targetUrl,
          secret: `whsec_${w.id}_jwt`,
          createdTime: (w.createdAt || '').substring(0, 16).replace('T', ' ')
        }));
      }
      return data;
    },
    async register(tenantId: string, event: string, targetUrl: string) {
      const res = await fetch('/api/webhooks/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: tenantId, event, targetUrl })
      });
      return handleResponse(res);
    },
    async delete(tenantId: string, webhookId: string) {
      const res = await fetch(`/api/webhooks/${webhookId}?tenantId=${tenantId}`, {
        method: 'DELETE'
      });
      return handleResponse(res);
    },
    async testDispatch(tenantId: string, event: string) {
      const res = await fetch('/api/webhooks/test-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: tenantId, event })
      });
      return handleResponse(res);
    },
    async listApiKeys(tenantId: string) {
      const res = await fetch(`/api/settings/api-keys?tenantId=${tenantId}`);
      return handleResponse(res);
    },
    async createApiKey(tenantId: string, name: string) {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: tenantId, name })
      });
      return handleResponse(res);
    }
  },

  apiKeys: {
    async list(tenantId: string) {
      const res = await fetch(`/api/settings/api-keys?tenantId=${tenantId}`);
      const data = await handleResponse(res);
      if (data && data.success && Array.isArray(data.keys)) {
        return data.keys.map((k: any) => ({
          id: k.id,
          token: k.apiKey,
          role: k.name || 'staff',
          rateLimit: k.name === 'admin' ? 120 : k.name === 'manager' ? 60 : 30,
          createdTime: (k.createdAt || '').substring(0, 16).replace('T', ' ')
        }));
      }
      return [];
    },
    async create(tenantId: string, role: string, rateLimit: number) {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: tenantId, name: role })
      });
      const data = await handleResponse(res);
      return { success: true, key: data.key };
    },
    async delete(tenantId: string, keyId: string) {
      const res = await fetch(`/api/settings/api-keys/${keyId}?tenantId=${tenantId}`, {
        method: 'DELETE'
      });
      return handleResponse(res);
    }
  }
};
