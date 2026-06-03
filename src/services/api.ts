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

// Helper to extract the tenant ID directly from logged in user email or local session fallback
export const getActiveTenantId = (): string => {
  const userEmail = auth.currentUser?.email || localStorage.getItem('preview_user_email');
  if (userEmail) {
    return userEmail.replace(/[^a-zA-Z0-9]/g, '_');
  }
  return localStorage.getItem('preview_tenant_id') || 'default_tenant';
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
    async install(tenantId: string, industryId: string) {
      const res = await fetch('/api/templates/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, industryId })
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
  }
};
