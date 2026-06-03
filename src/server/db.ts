import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Types representing our database schemas

export interface DBUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'Platform Admin' | 'Merchant Owner' | 'Manager' | 'Staff' | 'Customer';
  merchantId?: string; // Links users to their specific tenant
  verified: boolean;
  createdAt: string;
  profile?: {
    fullName?: string;
    phone?: string;
    avatar?: string;
  };
}

export interface DBSession {
  id: string;
  userId: string;
  expiresAt: string;
}

export interface DBMerchant {
  id: string;
  name: string;
  ownerId: string;
  status: 'active' | 'suspended' | 'pending';
  billingPlan: 'free' | 'growth' | 'enterprise';
  createdAt: string;
}

export interface DBStore {
  id: string;
  merchantId: string;
  name: string;
  domain: string;
  branding: {
    logo?: string;
    colorTheme?: 'classic' | 'warm' | 'emerald' | 'monochrome';
    bannerText?: string;
  };
  createdAt: string;
}

export interface DBProduct {
  id: string;
  storeId: string;
  name: string;
  category: string;
  price: number;
  inventory: number;
  sku: string;
  variant: {
    color?: string[];
    size?: string[];
  };
  images: string[];
  createdAt: string;
}

export interface DBCartItem {
  productId: string;
  quantity: number;
}

export interface DBCart {
  userId: string;
  items: DBCartItem[];
  coupon?: string;
  discount: number; // in currency units
}

export interface DBOrder {
  id: string;
  userId: string;
  storeId: string;
  merchantId: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
  }[];
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'refunded';
  shipmentTracking?: {
    carrier: string;
    trackingNumber: string;
    status: string;
  };
  cancellationReason?: string;
  refundReason?: string;
  createdAt: string;
}

export interface DBPaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  method: 'Stripe' | 'Alipay' | 'WeChatPay' | 'PayPal';
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  transactionId: string;
  createdAt: string;
}

export interface DBFinanceRecord {
  id: string;
  merchantId: string;
  type: 'revenue' | 'expense';
  amount: number;
  orderId?: string;
  description: string;
  createdAt: string;
}

export interface DBAIAgent {
  id: string;
  teamId: string;
  name: string;
  role: 'sales_assistant' | 'marketing_strategist' | 'support_rep' | 'inventory_manager';
  systemPrompt: string;
  status: 'idle' | 'running' | 'paused';
  memoryContext: string[]; // local agent context array
  createdAt: string;
}

export interface DBAITeam {
  id: string;
  merchantId: string;
  name: string;
  createdAt: string;
}

export interface DBKBChunk {
  id: string;
  merchantId: string;
  title: string;
  content: string;
  tokenCount: number;
  createdAt: string;
  vector?: number[];
}

export interface DBPendingAgentTask {
  id: string;
  teamId: string;
  agentId: string;
  inputMessage: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  response?: string;
  createdAt: string;
  completedAt?: string;
}

export interface DBPlatformTenant {
  id: string; // matches merchantId
  quotaLimit: number; // max transactions per month
  quotaUsed: number;
  billingStatus: 'paid' | 'unpaid';
  globalSettings: {
    maintenanceMode: boolean;
    allowRegistration: boolean;
  };
}

export interface DBAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  action: string;
  component: string;
  details: string;
}

// Global schema container
export interface DBAppInstallation {
  id: string;
  merchantId: string;
  appId: string;
  status: 'active' | 'paused' | 'pending' | 'failed';
  config: Record<string, any>;
  apiKey: string;
  webhookSecret: string;
  installedAt: string;
  updatedAt: string;
}

export interface DBCampaign {
  id: string;
  merchantId: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'social';
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  trigger: {
    type: 'manual' | 'scheduled' | 'behavioral';
    condition?: any;
    schedule?: { startTime: string; frequency: 'once' | 'daily' | 'weekly' | 'monthly' };
  };
  audience: {
    filters: Array<{ field: string; operator: string; value: any }>;
    count: number;
  };
  content: {
    subject?: string;
    body: string;
    cta?: { text: string; url: string };
  };
  performance: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DBCampaignAnalytics {
  id: string;
  campaignId: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  conversionCount: number;
  revenue: number;
  timestamp: string;
}

export interface DBChannelConnection {
  id: string;
  merchantId: string;
  channel: 'tiktok' | 'xiaohongshu' | 'douyin' | 'taobao' | 'pinduoduo' | 'wechat' | 'instagram' | 'facebook';
  status: 'connected' | 'disconnected' | 'error';
  accessToken: string;
  refreshToken?: string;
  storeId: string;
  config: Record<string, any>;
  connectedAt: string;
}

export interface DBRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  merchantId: string;
}

export interface DBStaffPermission {
  id: string;
  merchantId: string;
  email: string;
  name: string;
  roles: string[];
  status: 'active' | 'inactive' | 'invited';
}

export interface DBTheme {
  id: string;
  merchantId: string;
  name: string;
  status: 'draft' | 'published' | 'archived';
  config: {
    colors: { primary: string; secondary: string; background: string; text: string };
    fonts: { heading: string; body: string };
    layout: { headerStyle: 'minimal' | 'standard' | 'luxury'; footerEnabled: boolean };
  };
  previewUrl: string;
  publishedAt?: string;
}

export interface DBWebhookReg {
  id: string;
  merchantId: string;
  event: string;
  targetUrl: string;
  active: boolean;
  createdAt: string;
}

export interface DBWebhookLog {
  id: string;
  webhookId: string;
  merchantId: string;
  event: string;
  targetUrl: string;
  payload: string;
  responseStatus: number;
  responseBody: string;
  timestamp: string;
  success: boolean;
}

export interface DBAPIKey {
  id: string;
  merchantId: string;
  name: string;
  apiKey: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
}

export interface DatabaseSchema {
  users: DBUser[];
  sessions: DBSession[];
  merchants: DBMerchant[];
  stores: DBStore[];
  products: DBProduct[];
  carts: DBCart[];
  orders: DBOrder[];
  payments: DBPaymentRecord[];
  finance: DBFinanceRecord[];
  ai_teams: DBAITeam[];
  ai_agents: DBAIAgent[];
  kb_chunks: DBKBChunk[];
  agent_tasks: DBPendingAgentTask[];
  tenants: DBPartialTenantInfo[];
  audit_logs: DBAuditLog[];
  appInstallations: DBAppInstallation[];
  campaigns: DBCampaign[];
  campaignAnalytics: DBCampaignAnalytics[];
  channelConnections: DBChannelConnection[];
  roles: DBRole[];
  staffPermissions: DBStaffPermission[];
  themes: DBTheme[];
  webhookRegistrations: DBWebhookReg[];
  webhookLogs: DBWebhookLog[];
  apiKeys: DBAPIKey[];
}

export interface DBPartialTenantInfo {
  id: string;
  quotaLimit: number;
  quotaUsed: number;
  billingStatus: 'paid' | 'unpaid';
}

const DB_FILE_PATH = path.resolve('data/modadb.json');

// Initialize base database with production configuration bootstrap values
const INITIAL_DATABASE: DatabaseSchema = {
  users: [],
  sessions: [],
  merchants: [],
  stores: [],
  products: [],
  carts: [],
  orders: [],
  payments: [],
  finance: [],
  ai_teams: [],
  ai_agents: [],
  kb_chunks: [],
  agent_tasks: [],
  tenants: [],
  audit_logs: [],
  appInstallations: [],
  campaigns: [],
  campaignAnalytics: [],
  channelConnections: [],
  roles: [],
  staffPermissions: [],
  themes: [],
  webhookRegistrations: [],
  webhookLogs: [],
  apiKeys: [],
};

// Safe atomic file operations
export class ModaDB {
  private static cachedData: DatabaseSchema | null = null;

  private static ensureDirExists() {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Reloads database. Uses memory caching unless refresh is requested.
  public static read(): DatabaseSchema {
    this.ensureDirExists();
    if (this.cachedData) {
      return this.cachedData;
    }

    if (!fs.existsSync(DB_FILE_PATH)) {
      this.write(INITIAL_DATABASE);
      return INITIAL_DATABASE;
    }

    try {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const data = JSON.parse(content) as DatabaseSchema;
      // Ensure all arrays exist
      for (const key of Object.keys(INITIAL_DATABASE)) {
        if (!Array.isArray((data as any)[key])) {
          (data as any)[key] = [];
        }
      }
      this.cachedData = data;
      return data;
    } catch (e) {
      console.error("Corrupted database. Re-building...", e);
      this.write(INITIAL_DATABASE);
      return INITIAL_DATABASE;
    }
  }

  // Atomically writes target JSON structure to the file system using Temp-Rename pattern
  public static write(data: DatabaseSchema): void {
    this.ensureDirExists();
    const tempPath = `${DB_FILE_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE_PATH);
    this.cachedData = data;
  }

  // SHA256 helper for real non-mocked secure user registration
  public static hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  // Audit logger directly recording to system log
  public static log(userId: string, username: string, action: string, component: string, details: string) {
    const db = this.read();
    const newLog: DBAuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId,
      username,
      action,
      component,
      details,
    };
    db.audit_logs.unshift(newLog); // Prepend so fresh is always first
    // Limit to last 500 records to maintain speed and avoid storage quotas
    if (db.audit_logs.length > 500) {
      db.audit_logs = db.audit_logs.slice(0, 500);
    }
    this.write(db);
  }
}
