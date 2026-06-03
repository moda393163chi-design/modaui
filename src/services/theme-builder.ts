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
  clothing: {
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
  fitness: {
    primaryColor: "#312E81", // Indigo Sport Core
    accentColor: "#4F46E5",
    backgroundColor: "#EEF2FF",
    borderColor: "#E0E7FF",
    textColor: "#1E1B4B",
    buttonRadius: "sm", // Tech athletics
    vibeLabel: "高能深沉运动健身会馆 (Indigo Sport Core Style)"
  },
  jewelry: {
    primaryColor: "#D97706", // Gold luxury Amber Gold
    accentColor: "#F59E0B",
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
    textColor: "#78350F",
    buttonRadius: "none", // Precision diamond cuts
    vibeLabel: "高定奢贵金灿珠宝大赏 (Diamond Golden Luxury Style)"
  },
  home: {
    primaryColor: "#78350F", // Wood Brown Warmth
    accentColor: "#B45309",
    backgroundColor: "#FDF8F6",
    borderColor: "#F6EAE2",
    textColor: "#451A03",
    buttonRadius: "md", // Safe organic roundings
    vibeLabel: "雅致温润北欧大件家居 (North-Organic Wood Aesthetic Style)"
  }
};

export const themeBuilderService = {
  getThemeForIndustry(industryId: string): StorefrontTheme {
    const cleanId = industryId?.toLowerCase() || 'clothing';
    return INDUSTRY_THEMES[cleanId] || INDUSTRY_THEMES['clothing'];
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
    const current = this.getCustomBrandingTheme(tenantId, 'clothing');
    const updated = { ...current, ...customTheme };
    localStorage.setItem(`modaui_style_theme_${tenantId}`, JSON.stringify(updated));
    return updated;
  }
};
