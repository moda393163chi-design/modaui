# MODAUI 开发路线图 (Development Roadmap)

> **目标**：将 MODAUI 升级为 Shopify 级别的企业级 AI 运营系统  
> **当前进度**：60% 完成 → **目标**：100% Shopify 对标  
> **预计工期**：15 周（3-4 个月）| 总工作量：600 小时

---

## 📊 系统完成度对标表

| 功能模块 | MODAUI | Shopify | 优先级 | 预计工期 |
|--------|--------|---------|-------|--------|
| 多租户（商户隔离） | ✅ 70% | ✅ 100% | 🟡 中 | 1 周 |
| 商品库存管理 | ✅ 80% | ✅ 100% | 🟢 低 | 2 周 |
| 订单系统 | ✅ 70% | ✅ 100% | 🟡 中 | 2 周 |
| **支付网关集成** | ⚠️ 40% | ✅ 100% | 🔴 高 | 2 周 |
| **营销自动化系统** | ⚠️ 30% | ✅ 100% | 🔴 高 | 3 周 |
| **App Store 生态** | ❌ 0% | ✅ 100% | 🔴 高 | 3 周 |
| **多渠道销售** | ❌ 0% | ✅ 100% | 🔴 高 | 3 周 |
| 权限管理（RBAC） | ✅ 80% | ✅ 100% | 🟡 中 | 2 周 |
| **主题定制系统** | ⚠️ 50% | ✅ 100% | 🟡 中 | 2 周 |
| **报表分析系统** | ✅ 90% | ✅ 100% | 🟢 低 | 1 周 |
| **API 网关与 Webhook** | ⚠️ 30% | ✅ 100% | 🟡 中 | 2 周 |
| **团队协作工作台** | ❌ 0% | ⚠️ 40% | 🟢 低 | 1 周 |
| AI 驱动员工系统 | ✅ 100% | ⚠️ 30% | ✅ **差异化优势** | - |

---

## 🎯 Phase 1: 核心支付系统完善（第 1-2 周）

### 目标
完全激活多支付方式，支持全球商家收款

### 需要补全的支付方式

#### ✅ 已完成：Stripe（信用卡国际支付）
- 位置：`server.ts` L719-814
- 状态：真实 API 已集成，需配置 Secret Key

#### ✅ 已完成：支付宝（模拟层）
- 位置：`server.ts` L816-859
- 状态：UI 完整，需真实 API 对接

#### ❌ 需要补全：微信支付（WeChat Pay）

**文件：`src/services/payment-wechat.ts`**
```typescript
import axios from 'axios';

export interface WeChatPayConfig {
  appId: string;
  mchId: string;
  apiKey: string;
  notifyUrl: string;
}

export class WeChatPayService {
  private config: WeChatPayConfig;
  
  constructor(config: WeChatPayConfig) {
    this.config = config;
  }
  
  // 创建支付订单
  async createPayment(orderId: string, amount: number, description: string) {
    const params = {
      appid: this.config.appId,
      mch_id: this.config.mchId,
      nonce_str: this.generateNonceStr(),
      body: description,
      out_trade_no: orderId,
      total_fee: Math.round(amount * 100), // 转换为分
      spbill_create_ip: '127.0.0.1',
      notify_url: this.config.notifyUrl,
      trade_type: 'NATIVE' // 扫码支付
    };
    
    // 计算签名
    const sign = this.generateSign(params);
    params.sign = sign;
    
    // 调用微信支付 API
    const response = await axios.post(
      'https://api.mch.weixin.qq.com/pay/unifiedorder',
      this.xmlify(params),
      { headers: { 'Content-Type': 'application/xml' } }
    );
    
    return this.parseXmlResponse(response.data);
  }
  
  // 处理支付回调
  async handleCallback(data: any) {
    const sign = data.sign;
    delete data.sign;
    
    // 验证签名
    const expectedSign = this.generateSign(data);
    if (sign !== expectedSign) {
      throw new Error('Invalid signature');
    }
    
    // 验证订单金额等信息
    return {
      orderId: data.out_trade_no,
      transactionId: data.transaction_id,
      amount: data.total_fee / 100
    };
  }
  
  private generateNonceStr(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  
  private generateSign(params: any): string {
    // 按字母顺序排列参数
    const keys = Object.keys(params).sort();
    const query = keys
      .map(k => `${k}=${params[k]}`)
      .join('&');
    
    const crypto = require('crypto');
    return crypto
      .createHash('md5')
      .update(`${query}&key=${this.config.apiKey}`)
      .digest('hex')
      .toUpperCase();
  }
  
  private xmlify(obj: any): string {
    let xml = '<xml>';
    for (const key in obj) {
      if (typeof obj[key] === 'number') {
        xml += `<${key}>${obj[key]}</${key}>`;
      } else {
        xml += `<${key}><![CDATA[${obj[key]}]]></${key}>`;
      }
    }
    xml += '</xml>';
    return xml;
  }
  
  private parseXmlResponse(xml: string): any {
    // 解析 XML 响应
    // 实现简单的 XML 解析逻辑
  }
}
```

#### ❌ 需要补全：PayPal（国际支付）

**文件：`src/services/payment-paypal.ts`**
```typescript
import { Client, orders } from 'paypal-rest-sdk';

export class PayPalService {
  constructor(clientId: string, clientSecret: string, mode: 'sandbox' | 'live') {
    Client.configure({
      mode,
      client_id: clientId,
      client_secret: clientSecret
    });
  }
  
  async createPayment(orderId: string, amount: number, description: string) {
    const paymentDetails = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      transactions: [{
        amount: {
          total: amount.toString(),
          currency: 'USD',
          details: {
            subtotal: amount.toString()
          }
        },
        description,
        invoice_number: orderId
      }],
      redirect_urls: {
        return_url: `${process.env.APP_URL}/api/payments/paypal/success`,
        cancel_url: `${process.env.APP_URL}/api/payments/paypal/cancel`
      }
    };
    
    return new Promise((resolve, reject) => {
      orders.Order.create(paymentDetails, (err, payment) => {
        if (err) reject(err);
        else resolve(payment);
      });
    });
  }
  
  async executePayment(paymentId: string, payerId: string) {
    return new Promise((resolve, reject) => {
      orders.Order.execute(paymentId, { payer_id: payerId }, (err, payment) => {
        if (err) reject(err);
        else resolve(payment);
      });
    });
  }
}
```

### 实装步骤

1. 在 `.env` 中配置所有支付 Key：
```env
# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLIC_KEY=pk_live_xxxxx

# 支付宝
ALIPAY_APP_ID=xxxxx
ALIPAY_PRIVATE_KEY=xxxxx
ALIPAY_PUBLIC_KEY=xxxxx

# 微信支付
WECHAT_APP_ID=xxxxx
WECHAT_MCH_ID=xxxxx
WECHAT_API_KEY=xxxxx

# PayPal
PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
PAYPAL_MODE=sandbox
```

2. 在 `server.ts` 中集成所有支付方式：
```typescript
import { WeChatPayService } from './src/services/payment-wechat';
import { PayPalService } from './src/services/payment-paypal';

// 初始化支付服务
const wechatPay = new WeChatPayService({
  appId: process.env.WECHAT_APP_ID!,
  mchId: process.env.WECHAT_MCH_ID!,
  apiKey: process.env.WECHAT_API_KEY!,
  notifyUrl: `${process.env.API_URL}/api/payments/wechat/callback`
});

const paypalService = new PayPalService(
  process.env.PAYPAL_CLIENT_ID!,
  process.env.PAYPAL_CLIENT_SECRET!,
  (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox'
);

// 微信支付结账端点
app.post('/api/payments/wechat/checkout', async (req, res) => {
  try {
    const { orderId, amount, description } = req.body;
    const result = await wechatPay.createPayment(orderId, amount, description);
    res.json({ success: true, qrCode: result.code_url });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PayPal 结账端点
app.post('/api/payments/paypal/checkout', async (req, res) => {
  try {
    const { orderId, amount, description } = req.body;
    const payment = await paypalService.createPayment(orderId, amount, description);
    res.json({ 
      success: true, 
      paymentId: payment.id,
      approvalUrl: payment.links.find((l: any) => l.rel === 'approval_url').href
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
```

---

## 📱 Phase 2: App Store 生态系统（第 3-5 周）

### 目标
建立第三方应用生态，让开发者能开发插件扩展 MODAUI

### 核心文件结构
```
src/services/
├── app-store.ts           # App Store 核心逻辑
├── app-installer.ts       # 应用安装/卸载管理
├── app-permissions.ts     # 权限验证系统
└── webhook-dispatcher.ts  # Webhook 系统
```

### 实装代码

**文件：`src/services/app-store.ts`**
```typescript
export interface ModaApp {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  price: number; // 美元
  category: 'marketing' | 'analytics' | 'inventory' | 'customer' | 'payment' | 'integration';
  permissions: string[];
  webhooks: string[];
  installCount: number;
  rating: number;
  logo: string;
  releaseNotes?: string;
}

export interface AppInstallation {
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

// App Store 列表
const OFFICIAL_APPS: ModaApp[] = [
  {
    id: 'app_marketing_pro',
    name: '超级营销助手 Pro',
    description: 'AI 驱动的营销自动化，一键生成爆款文案、智能选品',
    version: '2.0.1',
    author: 'ModaTeam',
    price: 299,
    category: 'marketing',
    permissions: ['write_products', 'read_customers', 'write_campaigns', 'read_orders'],
    webhooks: ['order.paid', 'customer.created', 'product.updated'],
    installCount: 1234,
    rating: 4.8,
    logo: '📱',
    releaseNotes: '新增 AI 文案生成、支持批量产品优化'
  },
  {
    id: 'app_inventory_sync',
    name: '库存实时同步',
    description: '与 1688、淘宝、拼多多等平台实时同步库存',
    version: '1.5.0',
    author: 'InventoryMaster',
    price: 199,
    category: 'integration',
    permissions: ['read_products', 'write_inventory', 'read_orders'],
    webhooks: ['inventory.changed', 'order.created'],
    installCount: 856,
    rating: 4.6,
    logo: '📦'
  },
  {
    id: 'app_analytics_pro',
    name: '高级数据分析',
    description: 'AI 驱动的预测分析、漏斗分析、客户洞察',
    version: '3.0.0',
    author: 'DataInsights',
    price: 499,
    category: 'analytics',
    permissions: ['read_orders', 'read_analytics', 'read_customers'],
    webhooks: ['order.created', 'customer.created'],
    installCount: 567,
    rating: 4.9,
    logo: '📊'
  }
];

export const getAppStore = () => OFFICIAL_APPS;

export const installApp = async (merchantId: string, appId: string, config: any = {}) => {
  const app = OFFICIAL_APPS.find(a => a.id === appId);
  if (!app) throw new Error('App not found');
  
  const installation: AppInstallation = {
    id: `inst_${Math.random().toString(36).slice(2, 11)}`,
    merchantId,
    appId,
    status: 'active',
    config,
    apiKey: generateApiKey(),
    webhookSecret: generateWebhookSecret(),
    installedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return installation;
};

function generateApiKey(): string {
  return `moda_${Math.random().toString(36).slice(2)}`;
}

function generateWebhookSecret(): string {
  return Math.random().toString(36).slice(2);
}
```

### API 端点
```typescript
// 获取 App Store
app.get('/api/app-store', (req, res) => {
  res.json({ success: true, apps: getAppStore() });
});

// 获取应用详情
app.get('/api/app-store/:appId', (req, res) => {
  const { appId } = req.params;
  const app = getAppStore().find(a => a.id === appId);
  if (!app) return res.status(404).json({ success: false });
  res.json({ success: true, app });
});

// 安装应用
app.post('/api/app-store/:appId/install', async (req, res) => {
  const { appId } = req.params;
  const { merchantId, config } = req.body;
  
  try {
    const installation = await installApp(merchantId, appId, config);
    
    // 触发 webhook
    await triggerWebhook('app.installed', merchantId, {
      appId,
      installationId: installation.id
    });
    
    res.json({ success: true, installation });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 卸载应用
app.post('/api/app-store/:appId/uninstall', async (req, res) => {
  const { appId } = req.params;
  const { merchantId } = req.body;
  
  // 移除应用及其配置
  await triggerWebhook('app.uninstalled', merchantId, { appId });
  
  res.json({ success: true });
});

// 更新应用配置
app.put('/api/app-installations/:installationId', (req, res) => {
  const { installationId } = req.params;
  const { config } = req.body;
  
  // 更新配置
  res.json({ success: true });
});
```

---

## 📢 Phase 3: 营销自动化系统（第 6-8 周）

### 目标
建立 Shopify 级别的营销自动化工作流，支持邮件、短信、推送、社交媒体

### 核心功能

**文件：`src/services/campaigns.ts`**
```typescript
export interface Campaign {
  id: string;
  merchantId: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'social';
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  trigger: {
    type: 'manual' | 'scheduled' | 'behavioral';
    condition?: any; // 行为条件
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

// 预设的营销模板
export const CAMPAIGN_TEMPLATES = {
  welcome: {
    name: '欢迎新客户',
    subject: '欢迎加入 {{storeName}}！',
    body: '我们为您准备了 20% 的新客户折扣码...',
  },
  abandoned_cart: {
    name: '购物车挽回',
    subject: '您的购物车在等待你',
    body: '您遗留的商品仍在购物车中，使用折扣码可获得 15% 优惠...',
  },
  re_engagement: {
    name: '重新唤醒沉睡客户',
    subject: '我们想念您！',
    body: '很久没看到您了，我们为您准备了特殊优惠...',
  },
  post_purchase: {
    name: '购后跟进',
    subject: '感谢您的购买',
    body: '您的订单已发货，跟踪号为 {{trackingNumber}}...',
  }
};

export const createCampaign = async (params: any) => {
  const campaign: Campaign = {
    id: `cmp_${Math.random().toString(36).slice(2, 11)}`,
    merchantId: params.merchantId,
    name: params.name,
    type: params.type,
    status: 'draft',
    trigger: params.trigger,
    audience: { filters: params.filters, count: 0 },
    content: params.content,
    performance: { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0, revenue: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return campaign;
};

export const launchCampaign = async (campaignId: string, merchantId: string) => {
  // 计算目标受众数量
  // 根据 trigger 类型执行相应操作
  // 如果是定时任务，创建调度任务
  // 如果是行为触发，注册 webhook
};
```

---

## 🎨 Phase 4: 多渠道销售系统（第 9-11 周）

### 目标
支持 TikTok Shop、小红书、抖音、淘宝、微店等渠道

### 支持的渠道
```typescript
export type SalesChannel = 
  | 'tiktok'      // TikTok Shop
  | 'xiaohongshu' // 小红书
  | 'douyin'      // 抖音
  | 'taobao'      // 淘宝
  | 'pinduoduo'   // 拼多多
  | 'wechat'      // 微店
  | 'instagram'   // Instagram
  | 'facebook'    // Facebook Shop;

export interface ChannelConnection {
  id: string;
  merchantId: string;
  channel: SalesChannel;
  status: 'connected' | 'disconnected' | 'error';
  accessToken: string;
  refreshToken?: string;
  storeId: string;
  config: Record<string, any>;
  connectedAt: string;
}
```

### 关键 API
```typescript
// 连接 TikTok Shop
app.post('/api/channels/tiktok/connect', async (req, res) => {
  const { merchantId, authCode } = req.body;
  // OAuth 流程...
});

// 同步产品到各渠道
app.post('/api/channels/sync-products', async (req, res) => {
  const { merchantId, channels } = req.body;
  // 同步逻辑...
});

// 拉取各渠道订单
app.post('/api/channels/sync-orders', async (req, res) => {
  const { merchantId } = req.body;
  // 订单同步...
});
```

---

## 🔐 Phase 5: 权限和主题系统（第 12-13 周）

### 权限管理（RBAC）

**文件：`src/services/rbac.ts`**
```typescript
export const PERMISSIONS = {
  // 产品权限
  'products:read': '查看产品',
  'products:write': '编辑产品',
  'products:delete': '删除产品',
  
  // 订单权限
  'orders:read': '查看订单',
  'orders:write': '编辑订单',
  'orders:refund': '处理退款',
  
  // 客户权限
  'customers:read': '查看客户',
  'customers:write': '编辑客户',
  'customers:delete': '删除客户',
  
  // 分析权限
  'analytics:read': '查看分析',
  
  // 财务权限
  'finance:read': '查看财务',
  'finance:write': '管理财务',
  
  // 设置权限
  'settings:manage': '管理设置',
  'staff:manage': '管理员工',
  'apps:manage': '管理应用'
};

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  merchantId: string;
}

export interface StaffMember {
  id: string;
  merchantId: string;
  email: string;
  name: string;
  roles: string[];
  status: 'active' | 'inactive' | 'invited';
}
```

### 主题定制系统

**文件：`src/services/theme-builder.ts`**
```typescript
export interface Theme {
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
```
