// Templates registry for MODAUI — defines 18 industry-specific templates
export interface TemplateMeta {
  id: string;
  industry: string;
  name: string;
  entry: string; // relative component path
  description?: string;
}

export const TEMPLATES: TemplateMeta[] = [
  // Fashion
  { id: 'fashion-white', industry: 'fashion', name: 'Fashion White', entry: 'src/templates/fashion/fashion-white/Home.tsx', description: '极简北欧白，适合品牌服装' },
  { id: 'fashion-dark', industry: 'fashion', name: 'Fashion Dark', entry: 'src/templates/fashion/fashion-dark/Home.tsx', description: '高级黑时尚风，适合潮牌' },
  { id: 'fashion-luxury', industry: 'fashion', name: 'Fashion Luxury', entry: 'src/templates/fashion/fashion-luxury/Home.tsx', description: '奢侈品杂志风' },

  // Catering
  { id: 'catering-white', industry: 'catering', name: 'Restaurant White', entry: 'src/templates/catering/catering-white/Home.tsx', description: '明亮轻餐风' },
  { id: 'catering-dark', industry: 'catering', name: 'Restaurant Dark', entry: 'src/templates/catering/catering-dark/Home.tsx', description: '工业风餐厅' },
  { id: 'catering-luxury', industry: 'catering', name: 'Restaurant Luxury', entry: 'src/templates/catering/catering-luxury/Home.tsx', description: '高端餐饮风' },

  // Beauty
  { id: 'beauty-white', industry: 'beauty', name: 'Beauty White', entry: 'src/templates/beauty/beauty-white/Home.tsx', description: '医美极简风' },
  { id: 'beauty-dark', industry: 'beauty', name: 'Beauty Dark', entry: 'src/templates/beauty/beauty-dark/Home.tsx', description: '高级美容会所' },
  { id: 'beauty-luxury', industry: 'beauty', name: 'Beauty Luxury', entry: 'src/templates/beauty/beauty-luxury/Home.tsx', description: '明星美容品牌风' },

  // Fitness
  { id: 'fitness-white', industry: 'fitness', name: 'Fitness White', entry: 'src/templates/fitness/fitness-white/Home.tsx', description: '现代健身房风' },
  { id: 'fitness-dark', industry: 'fitness', name: 'Fitness Dark', entry: 'src/templates/fitness/fitness-dark/Home.tsx', description: '力量训练风' },
  { id: 'fitness-luxury', industry: 'fitness', name: 'Fitness Luxury', entry: 'src/templates/fitness/fitness-luxury/Home.tsx', description: '高端私教俱乐部风' },

  // Jewelry
  { id: 'jewelry-white', industry: 'jewelry', name: 'Jewelry White', entry: 'src/templates/jewelry/jewelry-white/Home.tsx', description: '珠宝画册风' },
  { id: 'jewelry-dark', industry: 'jewelry', name: 'Jewelry Dark', entry: 'src/templates/jewelry/jewelry-dark/Home.tsx', description: '黑金奢华风' },
  { id: 'jewelry-luxury', industry: 'jewelry', name: 'Jewelry Luxury', entry: 'src/templates/jewelry/jewelry-luxury/Home.tsx', description: '顶级珠宝旗舰风' },

  // Home
  { id: 'home-white', industry: 'home', name: 'Home White', entry: 'src/templates/home/home-white/Home.tsx', description: '北欧家居风' },
  { id: 'home-dark', industry: 'home', name: 'Home Dark', entry: 'src/templates/home/home-dark/Home.tsx', description: '现代极简风' },
  { id: 'home-luxury', industry: 'home', name: 'Home Luxury', entry: 'src/templates/home/home-luxury/Home.tsx', description: '高端生活方式风' }
];

export function templatesForIndustry(industry: string) {
  return TEMPLATES.filter(t => t.industry === industry);
}
