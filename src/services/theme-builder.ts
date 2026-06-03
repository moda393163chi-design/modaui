// MODAUI Independent Storefront Theme Customizer and Style Builder

export interface StorefrontTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  buttonRadius: string; // 'none' | 'sm' | 'md' | 'full'
  vibeLabel: string;
}

export const INDUSTRY_THEMES: Record<string, StorefrontTheme> = {
  fashion: {
    primaryColor: "#57534E", // Warm Slate Stone
    accentColor: "#D6D3D1",
    backgroundColor: "#F5F5F4",
    borderColor: "#E7E5E4",
    textColor: "#1C1917",
    buttonRadius: "none", // Sharp high-fashion premium cuts
    vibeLabel: "现代快反法式时装 (Paris Minimalist Slate Style)"
  },
  catering: {
    primaryColor: "#E11D48", // Vibrant Spicy Rose Red
    accentColor: "#F43F5E",
    backgroundColor: "#FFF1F2",
    borderColor: "#FFE4E6",
    textColor: "#4C0519",
    buttonRadius: "md", // Cosy curved bistro
    vibeLabel: "轻熟活力餐饮配送时尚 (Vibrant Cozy Bistro Style)"
  },
  beauty: {
    primaryColor: "#DB2777", // Rose Silk Blossom Pink
    accentColor: "#F472B6",
    backgroundColor: "#FDF2F8",
    borderColor: "#FCE7F3",
    textColor: "#500730",
    buttonRadius: "full", // Playful silk curves
    vibeLabel: "轻奢优雅美容美发沙龙 (Rose Silk Blossom Style)"
  },
  hotel: {
    primaryColor: "#0F172A", // Midnight Sapphire
    accentColor: "#38BDF8",
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    textColor: "#0F172A",
    buttonRadius: "md",
    vibeLabel: "精品酒店与民宿 (Modern Boutique Hospitality Style)"
  },
  creator: {
    primaryColor: "#7C3AED", // Creator Purple
    accentColor: "#8B5CF6",
    backgroundColor: "#F5F3FF",
    borderColor: "#EDE9FE",
    textColor: "#312E81",
    buttonRadius: "full",
    vibeLabel: "电商直播与内容创作 (Creator Commerce Studio Style)"
  }
};

const DEFAULT_NEUTRAL_THEME: StorefrontTheme = {
  primaryColor: "#374151",
  accentColor: "#60A5FA",
  backgroundColor: "#F8FAFC",
  borderColor: "#CBD5E1",
  textColor: "#111827",
  buttonRadius: "md",
  vibeLabel: "通用行业风格 (Neutral Industry Theme)"
};

export const themeBuilderService = {
  getThemeForIndustry(industryId: string): StorefrontTheme {
    const cleanId = industryId?.toLowerCase();
    return (cleanId && INDUSTRY_THEMES[cleanId]) || DEFAULT_NEUTRAL_THEME;
  },

  getCustomBrandingTheme(tenantId: string, defaultIndustry: string): StorefrontTheme {
    const key = `modaui_style_theme_${tenantId}`;
    const stored = localStorage.getItem(key);
    if (!stored) {
      return this.getThemeForIndustry(defaultIndustry);
    }
    try {
      return JSON.parse(stored);
    } catch {
      return this.getThemeForIndustry(defaultIndustry);
    }
  },

  updateCustomBrandingTheme(tenantId: string, customTheme: Partial<StorefrontTheme>): StorefrontTheme {
    const current = this.getCustomBrandingTheme(tenantId, 'fashion');
    const updated = { ...current, ...customTheme };
    localStorage.setItem(`modaui_style_theme_${tenantId}`, JSON.stringify(updated));
    return updated;
  }
};
