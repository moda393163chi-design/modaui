// MODAUI SaaS App Store Ecosystem Service
// Supporting third-party integrations and modular feature installations

export interface AppStoreItem {
  id: string;
  name: string;
  category: 'logistics' | 'marketing' | 'sales' | 'finance' | 'ai_tools';
  description: string;
  developer: string;
  rating: number;
  installCount: number;
  monthlyPricing: number;
  status: 'available' | 'installed' | 'beta';
  requiredPermissions: string[];
}

export const OFFICIAL_APPS: AppStoreItem[] = [
  {
    id: "sf_express_cargo",
    name: "顺丰航空特惠专线 Linker",
    category: "logistics",
    description: "接入顺丰航空、陆运动态运价，自动下单并打印电子面单，包裹异常快速打折和保价理赔闭环。",
    developer: "SF Express Official",
    rating: 4.9,
    installCount: 5410,
    monthlyPricing: 15,
    status: "available",
    requiredPermissions: ["orders.read", "orders.write"]
  },
  {
    // 小红书软文爆破阵列
    id: "xiaohongshu_poster",
    name: "小红书 AI 种草爆文矩阵",
    category: "marketing",
    description: "智体自动撰写针对服装、美发和家居的精致图文笔记，多账号矩阵定时定量分发突击。",
    developer: "MODAUI AI Labs",
    rating: 4.8,
    installCount: 4230,
    monthlyPricing: 29,
    status: "available",
    requiredPermissions: ["products.read", "marketing.write"]
  },
  {
    id: "tiktok_shop_sync",
    name: "TikTok Shop 跨多国货盘同步",
    category: "sales",
    description: "一键同步海外货盘多SKU库存，英美加多国汇率实时换算。自动派件至各海运转运。",
    developer: "CrossBorder Dev Group",
    rating: 4.6,
    installCount: 1890,
    monthlyPricing: 39,
    status: "available",
    requiredPermissions: ["products.read", "products.write", "orders.read"]
  },
  {
    id: "wechat_miniprogram",
    name: "微信小程序极速开店一键部署",
    category: "sales",
    description: "免代码极速开通微信官方二级小程序店面，客户通过微信支付直达后端控制层。",
    developer: "Tencent SaaS Build",
    rating: 4.9,
    installCount: 9120,
    monthlyPricing: 0, // 免费提供
    status: "available",
    requiredPermissions: ["products.read", "orders.write"]
  },
  {
    id: "meituan_coupon_hub",
    name: "美团点评团购优惠券代核销",
    category: "sales",
    description: "专为餐饮与沙龙健身打造，AI 机器人全天候核销美团券、大众点评核券，自动充卡记账。",
    developer: "MODAUI Platform Corp",
    rating: 4.7,
    installCount: 3200,
    monthlyPricing: 19,
    status: "available",
    requiredPermissions: ["orders.write", "finance.write"]
  },
  {
    id: "ai_voice_customer",
    name: "AI 实时语音双向对话客服",
    category: "ai_tools",
    description: "使用 Gemini 深度声音及文本模型，支持买家通过电话、微信实时和克隆声优交流售后与选款。",
    developer: "Gemini Interactions Dev",
    rating: 4.9,
    installCount: 1205,
    monthlyPricing: 59,
    status: "available",
    requiredPermissions: ["customers.read", "customers.write", "ai.voice"]
  }
];

export const appStoreService = {
  // Set default installs on localStorage to prevent resets
  getInstalledApps(tenantId: string): string[] {
    const key = `modaui_installed_apps_${tenantId}`;
    const stored = localStorage.getItem(key);
    if (!stored) {
      // Default install WeChat connectivity and SF logistics
      const defaults = ["wechat_miniprogram", "sf_express_cargo"];
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return ["wechat_miniprogram", "sf_express_cargo"];
    }
  },

  installApp(tenantId: string, appId: string): { success: boolean; installed: string[] } {
    const installed = this.getInstalledApps(tenantId);
    if (!installed.includes(appId)) {
      installed.push(appId);
      localStorage.setItem(`modaui_installed_apps_${tenantId}`, JSON.stringify(installed));
    }
    return { success: true, installed };
  },

  uninstallApp(tenantId: string, appId: string): { success: boolean; installed: string[] } {
    const installed = this.getInstalledApps(tenantId);
    const updated = installed.filter(id => id !== appId);
    localStorage.setItem(`modaui_installed_apps_${tenantId}`, JSON.stringify(updated));
    return { success: true, installed: updated };
  }
};
