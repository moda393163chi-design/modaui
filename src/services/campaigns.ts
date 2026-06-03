// MODAUI Unified Marketing Automated Campaign Builder Service

export interface AutomatedCampaign {
  id: string;
  name: string;
  type: 'coupon' | 'influencer_matrix' | 'bidding' | 'rebate';
  platform: 'wechat' | 'xiaohongshu' | 'tiktok' | 'douyin';
  budgetSpend: number;
  revenueGenerated: number;
  roi: number;
  conversionCount: number;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  smartCopywriterPrompt?: string;
  generatedCopy?: string;
}

export const AUTO_CAMPAIGNS_PRESET: AutomatedCampaign[] = [
  {
    id: "camp_xhs_attraction",
    name: "新势力时装矩阵种草爆破",
    type: "influencer_matrix",
    platform: "xiaohongshu",
    budgetSpend: 1500,
    revenueGenerated: 8900,
    roi: 5.93,
    conversionCount: 310,
    status: "active",
    createdAt: "2026-05-10T12:00:00Z",
    smartCopywriterPrompt: "编写2篇小红书爆款软文，强调‘微胖友好、法式高腰’特点，带有话题 #法式洋裙 与 #日常穿搭 营销标。",
    generatedCopy: "【姐妹们闭眼冲！】绝美法式小众高腰长裙，藏肉修身的神！亚麻面料轻盈呼吸，高腰线一秒拉长身材比例，复古浪漫直接拿捏了。#法式洋裙 #日常穿搭 #修身长裙"
  },
  {
    id: "camp_wechat_sharing",
    name: "餐饮新品爆赞神券裂变方案",
    type: "coupon",
    platform: "wechat",
    budgetSpend: 500,
    revenueGenerated: 3400,
    roi: 6.80,
    conversionCount: 450,
    status: "active",
    createdAt: "2026-05-18T10:00:00Z",
    smartCopywriterPrompt: "生成裂变代金券文案：邀请3个好友在小程序助力即可解锁‘泰餐单人高能爆汁蟹黄拌面’3.8元神仙尝鲜特惠。",
    generatedCopy: "🎉【小程序专享】超值蟹黄拌面仅3.8！邀请3位好友围观助力即可解封，快来戳我助力拉享福利！"
  },
  {
    id: "camp_tiktok_livestream",
    name: "大件实木家具国际直邮投流",
    type: "bidding",
    platform: "tiktok",
    budgetSpend: 4000,
    revenueGenerated: 18200,
    roi: 4.55,
    conversionCount: 88,
    status: "active",
    createdAt: "2026-05-01T08:00:00Z",
  }
];

export const campaignService = {
  getCampaigns(tenantId: string): AutomatedCampaign[] {
    const key = `modaui_campaigns_${tenantId}`;
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(AUTO_CAMPAIGNS_PRESET));
      return AUTO_CAMPAIGNS_PRESET;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return AUTO_CAMPAIGNS_PRESET;
    }
  },

  createCampaign(tenantId: string, item: Omit<AutomatedCampaign, 'id' | 'createdAt'>): AutomatedCampaign {
    const campaigns = this.getCampaigns(tenantId);
    const newCamp: AutomatedCampaign = {
      ...item,
      id: `camp_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    campaigns.push(newCamp);
    localStorage.setItem(`modaui_campaigns_${tenantId}`, JSON.stringify(campaigns));
    return newCamp;
  },

  updateCampaignStatus(tenantId: string, id: string, status: 'active' | 'paused' | 'completed'): AutomatedCampaign[] {
    const campaigns = this.getCampaigns(tenantId);
    const updated = campaigns.map(c => c.id === id ? { ...c, status } : c);
    localStorage.setItem(`modaui_campaigns_${tenantId}`, JSON.stringify(updated));
    return updated;
  },

  calculateOverallROI(campaigns: AutomatedCampaign[]): { totalSpend: number; totalRevenue: number; avgRoi: number } {
    const totalSpend = campaigns.reduce((acc, c) => acc + c.budgetSpend, 0);
    const totalRevenue = campaigns.reduce((acc, c) => acc + c.revenueGenerated, 0);
    const avgRoi = totalSpend > 0 ? Number((totalRevenue / totalSpend).toFixed(2)) : 0;
    return { totalSpend, totalRevenue, avgRoi };
  }
};
