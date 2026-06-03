import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Users, Flame, Send, Star, Zap, ShoppingCart, 
  CheckCircle, ArrowLeft, TrendingUp, AlertCircle, Sparkles, Terminal, ShieldAlert,
  Sliders, Cpu, Globe, Database, Key, RefreshCw, Layers, Activity, Server, Save, 
  ChevronDown, BookOpen, Package, Eye, LayoutGrid, Award, MessageSquare, LineChart, Settings, PlayCircle,
  Mic, Image, Volume2, X, Upload, FileImage, Check, Copy, ChevronRight, Search, Plus,
  Cloud, CloudUpload, CloudDownload, Briefcase, CreditCard, History
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend as ReLegend,
  Cell
} from 'recharts';
import { IndustryData, OperatingStrategy, TeamMember, TaskLog, ChatMessage } from '../types';
import { MOCK_LOGS_POOL } from '../data';
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import DiscountsView from './DiscountsView';
import ContentView from './ContentView';
import ChannelsView from './ChannelsView';
import StorefrontView from './StorefrontView';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs,
  query
} from 'firebase/firestore';

interface MerchantDashboardProps {
  industry: IndustryData;
  strategy: OperatingStrategy;
  userEmail: string;
  onExit: () => void;
  userRole?: 'founder' | 'admin' | 'manager' | 'staff' | 'customer';
  onUpdateRole?: (newRole: 'founder' | 'admin' | 'manager' | 'staff' | 'customer') => void;
}

interface Manager {
  roleId: string;
  role: string;
  emoji: string;
  name: string;
  desc: string;
  welcome: string;
  specialty: string;
}

// 4 distinct managers mapping exactly to tabs
const getManagers = (industryId: string): Manager[] => {
  if (industryId === 'catering') {
    return [
      {
        roleId: 'designer',
        role: 'AI设计师',
        emoji: '🍽️',
        name: '视觉陈列师 Kai',
        desc: '负责门脸品牌设计、线上美团/点评菜单视觉编排和一句话生成高还原度海报。主要负责：店铺 70%、产品 30%。',
        welcome: '我是您的 AI设计师Kai。我负责店铺首页设计、Banner海报排布、视觉美化与一站式宣传图生成。主要对接「店铺页面」！',
        specialty: '海报设计及排版、线上菜单视觉呈现、品牌形象VI'
      },
      {
        roleId: 'product_mgr',
        role: 'AI商品经理',
        emoji: '🍜',
        name: '菜品研发官 Ren',
        desc: '负责菜品新品开发、外卖菜单打样、物料扣率精算与零售定价。主要负责：产品 100%。',
        welcome: '我是您的 AI商品经理Ren。我负责菜品新品研发、SKU属性与录单维护、毛利与采购成本定价。主要对接「产品页面」！',
        specialty: '新品概念配置、零售菜谱溢价评估、采购供应链核算'
      },
      {
        roleId: 'ops_mgr',
        role: 'AI运营经理',
        emoji: '📈',
        name: '门店运营官 Lulu',
        desc: '负责线上接单调度、即时客诉与秒级异常退款拦截、资金合规对账。主要负责：订单、客户与销量/财务分析。',
        welcome: '我是您的 AI运营经理Lulu。我负责全网订单接单调度、客诉拦截与退款处理、进销存异常告警及每晚财务结账复盘。主要对接「订单、客户、分析」页面！',
        specialty: '极客订单履约、多退款拦截安抚、流水一键审计'
      },
      {
        roleId: 'marketing_mgr',
        role: 'AI营销经理',
        emoji: '📣',
        name: '餐饮营销官 Soren',
        desc: '精算营销代金券、霸王餐引流案、探店KOL宣发文案内容撰写。主要负责：营销 100%。',
        welcome: '我是您的 AI营销经理Soren。我负责全网引流活动策划、满减代金券计算投放、探店KOL宣发文案。主要对接「营销页面」！',
        specialty: '满减精算折扣、活动策划与KOL内容、美团大众推广投放'
      }
    ];
  } else if (industryId === 'retail') {
    return [
      {
        roleId: 'designer',
        role: 'AI设计师',
        emoji: '🏪',
        name: '店铺设计师 Dax',
        desc: '负责百货门脸平面设计、网店视觉海报排布和橱窗创意陈列。主要负责：店铺 70%、产品 30%。',
        welcome: '我是您的 AI设计师Dax。我负责百货门脸平面设计、网站Banner排版、橱窗视觉呈现创意渲染。主要对接「店铺页面」！',
        specialty: '线上橱窗陈列、配色方案制定、店头氛围美化二创'
      },
      {
        roleId: 'product_mgr',
        role: 'AI商品经理',
        emoji: '📦',
        name: '选品好手 Barton',
        desc: '精研新型百货分类、新品SPU自动建档、毛利预算核定与零售溢价。主要负责：产品 100%。',
        welcome: '我是您的 AI商品经理Barton。我负责百货商品开发与科学选品定价、SKU多规格管理、上架SPU录单、进销存监控。主要对接「产品页面」！',
        specialty: '百货新品研发、快反库存配比、商品录单与价格打法'
      },
      {
        roleId: 'ops_mgr',
        role: 'AI运营经理',
        emoji: '📈',
        name: '运营专家 Cyrus',
        desc: '主导网店订单发货、顺丰快递官方揽收通知对接、精细CRM客户关怀与销量财务报表。主要负责：订单、客户与销量/财务分析。',
        welcome: '我是您的 AI运营经理Cyrus。我负责百货业务日常订单履约、客诉退款拦截、分销跟单与每日资金大盘审计。主要对接「订单、客户、分析」页面！',
        specialty: '订单极速下发发货、客诉秒级关怀拦截、分销渠道数据结转'
      },
      {
        roleId: 'marketing_mgr',
        role: 'AI营销经理',
        emoji: '📣',
        name: '营销专家 Nova',
        desc: '撰写社媒裂变推介内容、大促销优惠券发放方案、及流量直通车竞价调优。主要负责：营销 100%。',
        welcome: '我是您的 AI营销经理Nova。我负责线上大促优惠券配置、小红书/微群文案创意输出、直通车精准预算调优。主要对接「营销页面」！',
        specialty: '精敏直通车调价竞价、大促满减券派发策略、品牌曝光推播策划'
      }
    ];
  } else {
    // Default: 'fashion' 服装公司
    return [
      {
        roleId: 'designer',
        role: 'AI设计师',
        emoji: '👗',
        name: '时装设计师 Aria',
        desc: '负责服装线上装修、版图搭配、微店页面整体视觉设计与UI风格排布。配置比例：店铺 70%、产品 30%。',
        welcome: '我是您的 AI设计师 Aria。我负责服装页面的视觉陈列、首页海报视觉设计、详情页穿搭排版。主要精力负责「店铺页面」与部分「产品详情」！',
        specialty: '线上橱窗陈列、配色方案制定、海报视觉设计渲染'
      },
      {
        roleId: 'product_mgr',
        role: 'AI商品经理',
        emoji: '👚',
        name: '选品好手 Barton',
        desc: '负责服装面料比对、潮流选品、极速快反打样排单与价格核定。配置比例：产品 100%。',
        welcome: '我是您的 AI商品经理 Barton。我负责服装商品研发选品、规格多SKU/SPU建档上架及毛利定价。全权负责「产品页面」！',
        specialty: '潮流热词选款、快反打样物耗、服装溢价与毛利率策略'
      },
      {
        roleId: 'ops_mgr',
        role: 'AI运营经理',
        emoji: '📈',
        name: '跟单专家 Cyrus',
        desc: '负责分销渠道、SPU库存红线监控、一站式发往顺丰极速托揽与日常退款纠纷。配置比例：订单、客户、分析页面。',
        welcome: '我是您的 AI运营经理 Cyrus。我负责订单一件代发托管、顺丰揽件打单、客户CRM退换退款拦截、资金损益对账。全权管控「订单、客户、分析」页面！',
        specialty: '订单托管揽件、顺丰一件代发对接、每日资金结算周报'
      },
      {
        roleId: 'marketing_mgr',
        role: 'AI营销经理',
        emoji: '📣',
        name: '宣发大咖 Daphne',
        desc: '主导活动策划、全网优惠代金券发放、投放广告ROI精细化调优及博主寄样。配置比例：营销 100%。',
        welcome: '我是您的 AI营销经理 Daphne。我负责活动策划、优惠代金券发放、推广ROI调优与小红书等社媒带货文案输出。全权对接「营销页面」！',
        specialty: '小红书潮流穿搭种草文案、抖音短视起拍脚本、千万粉博主派样'
      }
    ];
  }
};

/*
};��主拼单寄样投放策划。',
        welcome: '我是您的 AI营销经理。我负责营销活动、优惠券、广告推广、小红书社媒文案输出。',
        specialty: '社交穿搭种草内容运营、首发让利优惠精排、直通车出资投放'
      }
    ];
  }
};�经理。我负责活动策划、广告推广和内容营销。',
        specialty: 'ROI千人千面精准引流、营销投放预算细调、带货推介脚本撰写'
      }
    ];
  }

};��出价千人千面推广文案创作。',
        welcome: '我是您的 AI营销经理。我负责活动策划、广告推广和内容营销。',
        specialty: '首发让利测品、优惠代金券精排、抖音挂车引流脚本'
      }
    ];
  } else {
    // Default: 'fashion' 服装公司
    return [
      {
        roleId: 'store_mgr',
        role: 'AI开店经理',
        emoji: '🏪',
        name: '装潢设计师 Aria',
        desc: '负责线上店铺装修、版图搭配、微店页面整体视觉设计与网页排版。',
        welcome: '我是您的 AI开店经理。我负责店铺装修、页面设计和一句话生成网站。',
        specialty: '线上橱窗陈列、配色方案制定、一句话渲染店头氛围'
      },
      {
        roleId: 'product_mgr',
        role: 'AI商品经理',
        emoji: '👗',
        name: '选品好手 Barton',
        desc: '负责服装面料比对、潮流选品、极速快反打样排单与定价建议。',
        welcome: '我是您的 AI商品经理。我负责服装选品、商品上架、商品图片和定价建议。',
        specialty: '潮流热词选款、快反柔选比例、上架SPU建档与毛利定价'
      },
      {
        roleId: 'ops_mgr',
        role: 'AI运营经理',
        emoji: '📈',
        name: '跟单专家 Cyrus',
        desc: '负责分销渠道维护、SPU库存红线监控、一站式订单极速托管发货。',
        welcome: '我是您的 AI运营经理。我负责订单处理、库存建议和经营分析。',
        specialty: '订单托管揽件、顺丰一件代发对接、每日资金结算周报'
      },
      {
        roleId: 'marketing_mgr',
        role: 'AI营销经理',
        emoji: '📣',
        name: '宣发大咖 Daphne',
        desc: '负责撰写小红书穿搭种草内容、抖音探店脚本与建立博主拼单寄样。',
        welcome: '我是您的 AI营销经理。我负责活动策划、广告推广和内容营销。',
        specialty: '小红书潮流穿搭种草文案、抖音短视起拍脚本、千万粉博主派样'
      }
    ];
  }
};
*/

const SlsTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#09090B] border border-[#2F3336] p-3 rounded-lg shadow-xl font-mono text-xs text-neutral-200">
        <p className="font-bold mb-1 text-white">{label}</p>
        <p className="text-sky-400">
          销售额: <span className="font-bold">¥{Number(payload[0].value).toFixed(2)}</span>
        </p>
      </div>
    );
  }
  return null;
};

const ChnTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#09090B] border border-[#2F3336] p-3 rounded-lg shadow-xl font-mono text-xs text-neutral-200">
        <p className="font-bold mb-1 text-white">{label}</p>
        <p className="text-indigo-400">
          获客比率: <span className="font-bold">{payload[0].value}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function MerchantDashboard({ 
  industry, 
  strategy, 
  userEmail, 
  onExit,
  userRole = 'founder',
  onUpdateRole
}: MerchantDashboardProps) {
  // Backstage Active Menu State
  // 'workbench' | 'store' | 'product' | 'order' | 'customer' | 'marketing' | 'analytics' | 'settings' | 'team_members'
  const [activeMenu, setActiveMenu] = useState<'workbench' | 'store' | 'product' | 'order' | 'customer' | 'marketing' | 'analytics' | 'settings' | 'team_members'>('workbench');
  
  const [sales, setSales] = useState(25488.60);

  // Dynamic daily revenue data based on live sales state
  const getDailySalesData = () => {
    const baseDays = [
      { date: '5-26', sales: 3200 },
      { date: '5-27', sales: 4100 },
      { date: '5-28', sales: 3800 },
      { date: '5-29', sales: 5200 },
      { date: '5-30', sales: 4800 },
      { date: '5-31', sales: 6100 },
    ];
    const todaySales = Math.max(1000, Number((sales - 19800).toFixed(2)));
    return [
      ...baseDays,
      { date: '今天(实时)', sales: todaySales }
    ];
  };

  const channelsData = [
    { name: '小红书种草', value: 42, color: '#f43f5e' },
    { name: '抖音生活圈', value: 35, color: '#6366f1' },
    { name: '平台自然流量', value: 15, color: '#10b981' },
    { name: '私域裂变推广', value: 8, color: '#f59e0b' }
  ];
  const [orders, setOrders] = useState(132);
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'stream' | 'tasks'>('stream');
  
  // Custom Multi-Modal states for Advanced AI Control Console
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'transcribing'>('idle');
  const [micActiveLevel, setMicActiveLevel] = useState<number>(0);
  const [voiceWaveformArr, setVoiceWaveformArr] = useState<number[]>(new Array(16).fill(3));
  
  // Right Sidebar active manager focus
  const managers = getManagers(industry.id);
  const [selectedStaff, setSelectedStaff] = useState<TeamMember>({
    role: managers[0].role,
    emoji: managers[0].emoji,
    name: managers[0].name,
    desc: managers[0].desc,
    status: 'active',
    tasks: []
  });

  // Master Settings States
  const [apiProvider, setApiProvider] = useState<'gemini' | 'deepseek' | 'openai' | 'ollama'>('gemini');
  const [geminiKey, setGeminiKey] = useState('sk-gemini-8v1823ha923m1acb...');
  const [deepseekKey, setDeepseekKey] = useState('sk-ds-921a9230b080cff1a...');
  const [openaiKey, setOpenaiKey] = useState('sk-proj-4o0129kals01a238b...');
  const [ollamaEndpoint, setOllamaEndpoint] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3:8b');
  const [ollamaModels, setOllamaModels] = useState<string[]>([
    'llama3:8b', 
    'qwen2.5:7b', 
    'gemma2:9b', 
    'mistral:7b',
    'deepseek-r1:8b',
    'deepseek-v3:latest'
  ]);
  const [ollamaSearchQuery, setOllamaSearchQuery] = useState('');
  const [customOllamaModelInput, setCustomOllamaModelInput] = useState('');
  const [isSyncingOllama, setIsSyncingOllama] = useState(false);
  const [isDropdownActive, setIsDropdownActive] = useState(false);
  const [ollamaSyncError, setOllamaSyncError] = useState<string | null>(null);
  const [globalTemperature, setGlobalTemperature] = useState(0.85);
  const [selectedPreset, setSelectedPreset] = useState<'balanced' | 'aggressive' | 'harmonic' | 'analytic'>('balanced');
  const [testConnectionStatus, setTestConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testLog, setTestLog] = useState<string>('系统路由就绪。等待诊断通信连通性...');
  const [geminiConnected, setGeminiConnected] = useState<'online' | 'local'>('local');

  // Sub-navigation state selectors for secondary-level dashboard tabs
  const [storeSubTab, setStoreSubTab] = useState<'overview' | 'decoration' | 'channels' | 'domain' | 'brand' | 'seo'>('overview');
  const [productSubTab, setProductSubTab] = useState<'list' | 'categories' | 'inventory' | 'sku' | 'suppliers' | 'purchase'>('list');
  const [orderSubTab, setOrderSubTab] = useState<'all' | 'draft' | 'refund' | 'aftersales' | 'tracking'>('all');
  const [customerSubTab, setCustomerSubTab] = useState<'list' | 'tags' | 'segments' | 'membership' | 'b2b'>('list');
  const [marketingSubTab, setMarketingSubTab] = useState<'coupon' | 'campaign' | 'email' | 'sms' | 'ai'>('coupon');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'sales' | 'customer' | 'product' | 'marketing' | 'realtime'>('sales');

  // Extra sub-navigation database fields for store overview and other parameters
  const [isStoreOnline, setIsStoreOnline] = useState(true);
  const [customDomainName, setCustomDomainName] = useState('');
  const [brandPrimaryColor, setBrandPrimaryColor] = useState('#1D9BF0');
  const [brandLogoText, setBrandLogoText] = useState('');
  const [seoHtmlTitle, setSeoHtmlTitle] = useState('');
  const [seoMetaDesc, setSeoMetaDesc] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');

  // Auxiliary database lists loaded dynamically or seeded
  const [categoriesList, setCategoriesList] = useState<string[]>(['爆款推荐', '本季新品', '限时折扣', '招牌单品']);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [suppliersList, setSuppliersList] = useState<any[]>([
    { id: 'sup1', name: '大同高定面料源头基地', contact: '梁经理', phone: '13812345678', category: '针织纺织类', status: '合作中' },
    { id: 'sup2', name: '云滇有机茶山庄园', contact: '罗庄主', phone: '18998765432', category: '餐饮原料类', status: '优质服务商' },
    { id: 'sup3', name: '万通精品包材制造集团', contact: '肖厂长', phone: '15566667777', category: '包装辅助材料', status: '合作中' }
  ]);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierCategory, setNewSupplierCategory] = useState('');

  const [purchaseOrdersList, setPurchaseOrdersList] = useState<any[]>([
    { id: 'PO20260601', supplierName: '云滇有机茶山庄园', productName: '极品高山乌龙茶胚', qty: 200, amount: 4800, date: '2026-06-01', status: '已发货' },
    { id: 'PO20260602', supplierName: '大同高定面料源头基地', productName: '100%精梳长绒棉布匹', qty: 50, amount: 12500, date: '2026-06-02', status: '等待付款' }
  ]);
  const [purchaseSelectedProduct, setPurchaseSelectedProduct] = useState('');
  const [purchaseSelectedSupplier, setPurchaseSelectedSupplier] = useState('');
  const [purchaseQtyInput, setPurchaseQtyInput] = useState('100');
  const [purchasePriceInput, setPurchasePriceInput] = useState('25');

  const [draftOrdersList, setDraftOrdersList] = useState<any[]>([
    { id: 'DR1001', customerName: '张敏捷 (大客户渠道)', items: '首发重磅卫衣 x10', total: 2990, date: '2026-06-03', status: '待审核' },
    { id: 'DR1002', customerName: '李思聪 (企业定制专区)', items: '定制印花礼盒 x50', total: 8500, date: '2026-06-03', status: '草稿' }
  ]);
  const [refundOrdersList, setRefundOrdersList] = useState<any[]>([]);

  const [couponsList, setCouponsList] = useState<any[]>([
    { code: 'VIP888', discount: 12, desc: 'VIP全店通用直减 ¥12', minSpend: 100, active: true },
    { code: 'MODA666', discount: 20, desc: '公司开业百万红包 ¥20', minSpend: 150, active: true },
    { code: 'WELCOME5', discount: 5, desc: '新人关注即送 ¥5 无门槛', minSpend: 0, active: true }
  ]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('10');
  const [newCouponMinSpend, setNewCouponMinSpend] = useState('50');
  const [newCouponDesc, setNewCouponDesc] = useState('');

  const [customerTags, setCustomerTags] = useState<string[]>(['白金会员', '高频消遣', '沉睡客群', '首购新客', '餐饮狂热粉']);
  const [newTagInput, setNewTagInput] = useState('');
  const [selectedProductSkuUid, setSelectedProductSkuUid] = useState<string>('');
  const [skuVariants, setSkuVariants] = useState<any[]>([
    { name: '尺寸: M | 颜色: 玄黑', price: 199, stock: 45 },
    { name: '尺寸: L | 颜色: 玄黑', price: 199, stock: 60 },
    { name: '尺寸: M | 颜色: 霜白', price: 219, stock: 30 },
    { name: '尺寸: L | 颜色: 霜白', price: 219, stock: 55 }
  ]);
  const [newSkuVariantName, setNewSkuVariantName] = useState('');
  const [newSkuVariantPrice, setNewSkuVariantPrice] = useState('');
  const [newSkuVariantStock, setNewSkuVariantStock] = useState('');

  const [b2bCustomers, setB2bCustomers] = useState<any[]>([
    { id: 'b2b-01', company: '望京SOHO联合办公集团', contact: '沈总', creditLimit: 50000, usedCredit: 12000, termDays: 30 },
    { id: 'b2b-02', company: '爱琴海美业连锁机构', contact: '王经理', creditLimit: 20000, usedCredit: 4500, termDays: 15 }
  ]);
  const [newB2bCompany, setNewB2bCompany] = useState('');
  const [newB2bContact, setNewB2bContact] = useState('');
  const [newB2bCreditLimit, setNewB2bCreditLimit] = useState('30000');
  const [newB2bTermDays, setNewB2bTermDays] = useState('30');

  // Interactive Mock Workspace States
  // 1. Store Decoration mock state
  const [storeTheme, setStoreTheme] = useState<'retro' | 'dark' | 'classic'>('retro');
  const [storeHeadline, setStoreHeadline] = useState(industry.id === 'catering' ? '☕ Tyson Cafe · 经典美式/手作拿铁特惠' : '🧺 摩登法式·100%呼吸感亚麻新品首发');
  const [isGeneratingWebsite, setIsGeneratingWebsite] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  
  // 2. Product selection mock state
  const [productsList, setProductsList] = useState<any[]>([]);
  const [newProductInput, setNewProductInput] = useState('');
  const [newProductPriceInput, setNewProductPriceInput] = useState('');
  const [isDevelopingProduct, setIsDevelopingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingPrice, setEditingPrice] = useState<number>(0);
  const [editingStock, setEditingStock] = useState<number>(0);
  const [editingImage, setEditingImage] = useState('🍛');

  const [newProductStockInput, setNewProductStockInput] = useState('100');
  const [newProductEmojiInput, setNewProductEmojiInput] = useState(
    industry.id === 'catering' ? '🍛' : industry.id === 'retail' ? '📦' : '👚'
  );

  // 3. Order fulfillment mock state
  const [ordersList, setOrdersList] = useState<any[]>([]);

  // AI Team members custom avatars state
  const [memberAvatars, setMemberAvatars] = useState<Record<string, string>>({
    'Aria': '/src/assets/images/fashion_designer_aria_1780453654705.png',
    'Barton': '/src/assets/images/fashion_buyer_barton_1780453671012.png',
    'Kai': '/src/assets/images/catering_chef_kai_1780453688255.png',
    'Lulu': '/src/assets/images/catering_ops_lulu_1780453703816.png',
  });
  const [isGeneratingAvatarForRole, setIsGeneratingAvatarForRole] = useState<string | null>(null);
  const [avatarProgress, setAvatarProgress] = useState<number>(0);
  const [avatarProgressText, setAvatarProgressText] = useState<string>('');

  // Real Merchant System, Profile, Status and Billing fields
  const [merchantName, setMerchantName] = useState(`${industry.name}极智协同总站`);
  const [merchantSlogan, setMerchantSlogan] = useState('');
  const [editBrandName, setEditBrandName] = useState('');
  const [editSlogan, setEditSlogan] = useState('');
  const [merchantStatus, setMerchantStatus] = useState<'active' | 'suspended' | 'trial_expired'>('active');
  const [merchantBillingTier, setMerchantBillingTier] = useState<'trial' | 'professional' | 'enterprise'>('trial');
  const [merchantTokenBalance, setMerchantTokenBalance] = useState<number>(1500000); // 1.5M tokens
  const [merchantSpendAmount, setMerchantSpendAmount] = useState<number>(24.50); // initial spending RMB
  const [merchantRechargeTotal, setMerchantRechargeTotal] = useState<number>(0); // initial recharge RMB
  const [billingLogs, setBillingLogs] = useState<any[]>([]); // Dynamic invoices from Firestore sub-collection
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Teleportation active menu listener
  useEffect(() => {
    const targetMenu = localStorage.getItem('platform_active_menu');
    if (targetMenu && ['workbench', 'store', 'product', 'order', 'customer', 'marketing', 'analytics', 'settings', 'team_members'].includes(targetMenu)) {
      setActiveMenu(targetMenu as any);
      localStorage.removeItem('platform_active_menu');
    }
  });

  const tenantId = userEmail ? userEmail.replace(/[^a-zA-Z0-9]/g, '_') : 'default_tenant';

  // Real-time synchronization and Seeding logic with Google Firestore
  useEffect(() => {
    // 0. Listen and seed Tenant Profile / Status / Account Billing metadata (SaaS Merchant)
    const unsubscribeTenantProfile = onSnapshot(doc(db, 'tenants', tenantId), async (tenantSnap) => {
      setIsLoadingProfile(false);
      if (tenantSnap.exists()) {
        const data = tenantSnap.data();
        if (data.merchantName) {
          setMerchantName(data.merchantName);
          setEditBrandName(prev => {
            if (!prev) return data.merchantName;
            return prev;
          });
        }
        if (data.companySlogan) {
          setMerchantSlogan(data.companySlogan);
          setStoreHeadline(data.companySlogan);
          setEditSlogan(prev => {
            if (!prev) return data.companySlogan;
            return prev;
          });
        }
        if (data.status) setMerchantStatus(data.status);
        if (data.billingTier) setMerchantBillingTier(data.billingTier);
        if (data.tokenBalance !== undefined) setMerchantTokenBalance(data.tokenBalance);
        if (data.spendAmount !== undefined) setMerchantSpendAmount(data.spendAmount);
        if (data.rechargeTotal !== undefined) setMerchantRechargeTotal(data.rechargeTotal);
        
        // Load extra store setting params from DB (Store overview, domain, branding, SEO)
        if (data.isStoreOnline !== undefined) setIsStoreOnline(data.isStoreOnline);
        if (data.customDomainName !== undefined) setCustomDomainName(data.customDomainName);
        if (data.brandPrimaryColor !== undefined) setBrandPrimaryColor(data.brandPrimaryColor);
        if (data.brandLogoText !== undefined) setBrandLogoText(data.brandLogoText);
        if (data.seoHtmlTitle !== undefined) setSeoHtmlTitle(data.seoHtmlTitle);
        if (data.seoMetaDesc !== undefined) setSeoMetaDesc(data.seoMetaDesc);
        if (data.seoKeywords !== undefined) setSeoKeywords(data.seoKeywords);
      } else {
        // Build Real Tenant Profile / Initialize (Sandbox SaaS onboarding setup - Merchant Creation)
        try {
          await setDoc(doc(db, 'tenants', tenantId), {
            merchantName: `${industry.name}极智协同总站`,
            companySlogan: industry.id === 'catering' ? '☕ Tyson Cafe · 经典美式/手作拿铁特惠' : '🧺 摩登法式·100%呼吸感亚麻新品首发',
            status: 'active',
            billingTier: 'trial',
            tokenBalance: 1500000,
            spendAmount: 24.50,
            rechargeTotal: 0,
            createdAt: new Date().toISOString(),
            industryId: industry.id
          });
        } catch (e) {
          console.error("Failed to seed initial tenant profile: ", e);
        }
      }
    });

    // 0.5. Listen to Tenant Billing Invoice Logs (Simulated callback invoices)
    const unsubscribeBillingLogs = onSnapshot(collection(db, 'tenants', tenantId, 'billing_logs'), (colSnap) => {
      const logsList: any[] = [];
      colSnap.forEach((doc) => {
        logsList.push({ id: doc.id, ...doc.data() });
      });
      // Sort newest billing logs first
      logsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setBillingLogs(logsList);
    });

    // A. Listen and seed "metrics"
    const unsubscribeMetrics = onSnapshot(doc(db, 'tenants', tenantId, 'industries', industry.id, 'metrics', 'operating'), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSales(data.sales || 0);
        setOrders(data.orders || 0);
      } else {
        try {
          await setDoc(doc(db, 'tenants', tenantId, 'industries', industry.id, 'metrics', 'operating'), { sales: 0, orders: 0 });
        } catch (e) {
          console.error("Failed to seed initial metrics in Firestore: ", e);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `tenants/${tenantId}/industries/${industry.id}/metrics/operating`);
    });

    // B. Listen and seed "products"
    const unsubscribeProducts = onSnapshot(collection(db, 'tenants', tenantId, 'industries', industry.id, 'products'), async (colSnap) => {
      if (!colSnap.empty) {
        const list: any[] = [];
        colSnap.forEach((doc) => {
          list.push({ ...doc.data() });
        });
        setProductsList(list);
      } else {
        const defaultProducts = industry.id === 'catering' ? [
          { id: 'p1', name: '冰美式', price: 18, stock: 120, image: '🥤', category: '咖啡', desc: '清爽顺滑，经典之选，100%阿拉比卡咖啡豆。', sales: 0, rating: '100%', specs: { sizes: ['中杯 ¥18', '大杯 ¥22', '超大杯 ¥26'], labels: '标准/少冰/去冰' } },
          { id: 'p2', name: '拿铁咖啡', price: 28, stock: 85, image: '☕', category: '咖啡', desc: '经典比例，奶香浓郁，自然甘甜，丝滑口感。', sales: 0, rating: '100%', specs: { sizes: ['中杯 ¥28', '大杯 ¥32', '超大杯 ¥36'], labels: '常温/少冰/去冰' } },
          { id: 'p3', name: '生椰拿铁', price: 28, stock: 140, image: '🥥', category: '咖啡', desc: '椰香浓郁，口感顺滑，香甜醇厚，一口惊艳。', sales: 0, rating: '100%', specs: { sizes: ['中杯 ¥28', '大杯 ¥32', '超大杯 ¥36'], labels: '推荐冰饮' } },
          { id: 'p4', name: '焦糖玛奇朵', price: 32, stock: 60, image: '🍯', category: '咖啡', desc: '经典香草糖浆融合浓缩，淋上焦糖沙司，甜润芬芳。', sales: 0, rating: '100%', specs: { sizes: ['中杯 ¥32', '大杯 ¥36', '超大杯 ¥40'], labels: '多冰/标准' } },
          { id: 'p5', name: '巧克力蛋糕', price: 36, stock: 35, image: '🍫', category: '甜品', desc: '醇厚黑巧克力重度烘焙，口感细腻，入口即化，甜而不腻。', sales: 0, rating: '100%', specs: { sizes: ['标准切片'], labels: '冷藏风味' } },
          { id: 'p6', name: '提拉米苏', price: 26, stock: 40, image: '🍰', category: '甜品', desc: '意式经典重现，马斯卡彭慕斯搭配咖啡酒味，回味悠长。', sales: 0, rating: '100%', specs: { sizes: ['标准切片'], labels: '甜品配咖啡' } },
          { id: 'p7', name: '抹茶拿铁', price: 28, stock: 95, image: '🍵', category: '饮品', desc: '精选高山茶叶研磨抹茶，融入细腻蒸牛奶，清爽微甘。', sales: 0, rating: '100%', specs: { sizes: ['中杯 ¥28', '大杯 ¥32'], labels: '香浓纯厚' } }
        ] : industry.id === 'retail' ? [
          { id: 'p1', name: '日系多功能防尘便携包', price: 49, stock: 110, image: '🎒', category: '配饰', desc: '防泼水防污黑科技面料，十三分区科学收纳空间', sales: 0 },
          { id: 'p2', name: '桌面高密度空气循环扇', price: 99, stock: 75, image: '🌀', category: '数码', desc: '直流变频超静音无刷风机，双螺旋加速空气对流', sales: 0 },
          { id: 'p3', name: '智能重力速感防漏雨伞', price: 35, stock: 240, image: '☔', category: '居家', desc: '一键全自动回弹秒收，杜绝雨水沾湿衣物', sales: 0 }
        ] : [
          { id: 'p1', name: '法式单排扣羊毛经典风衣', price: 680, stock: 120, image: '👗', category: '外套', desc: '100%美利奴高支全羊毛面料，利落意式手工剪裁', sales: 0 },
          { id: 'p2', name: '高腰水洗修身直筒牛仔裤', price: 239, stock: 95, image: '👖', category: '下装', desc: '经典复古水洗丹宁工艺，修饰腿型不紧绷', sales: 0 },
          { id: 'p3', name: '重磅双股纯棉复古刺绣T恤', price: 159, stock: 450, image: '👕', category: '上装', desc: '挺括美式复古圆领，240g精梳棉双股排吸汗透气', sales: 0 }
        ];

        try {
          const batch = writeBatch(db);
          defaultProducts.forEach((p) => {
            const ref = doc(db, 'tenants', tenantId, 'industries', industry.id, 'products', p.id);
            batch.set(ref, p);
          });
          await batch.commit();
        } catch (e) {
          console.error("Failed to seed initial products in Firestore: ", e);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `tenants/${tenantId}/industries/${industry.id}/products`);
    });

    // C. Listen and seed "orders"
    const unsubscribeOrders = onSnapshot(collection(db, 'tenants', tenantId, 'industries', industry.id, 'orders'), async (colSnap) => {
      if (!colSnap.empty) {
        const list: any[] = [];
        colSnap.forEach((doc) => {
          list.push({ ...doc.data() });
        });
        // Sort orders so highest ID or time comes first
        list.sort((a, b) => b.id.localeCompare(a.id));
        setOrdersList(list);
      } else {
        // No orders seeded by default for live release, keeping history blank
        setOrdersList([]);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `tenants/${tenantId}/industries/${industry.id}/orders`);
    });

    // D. Listen and seed "coupons"
    const unsubscribeCoupons = onSnapshot(collection(db, 'tenants', tenantId, 'industries', industry.id, 'coupons'), (colSnap) => {
      if (!colSnap.empty) {
        const list: any[] = [];
        colSnap.forEach((doc) => {
          list.push({ ...doc.data() });
        });
        setCouponsList(list);
      } else {
        const defaultCoupons = [
          { code: 'VIP888', discount: 12, desc: 'VIP全店通用直减 ¥12', minSpend: 100, active: true },
          { code: 'MODA666', discount: 20, desc: '公司开业百万红包 ¥20', minSpend: 150, active: true },
          { code: 'WELCOME5', discount: 5, desc: '新人关注即送 ¥5 无门槛', minSpend: 0, active: true }
        ];
        const batch = writeBatch(db);
        defaultCoupons.forEach(c => {
          batch.set(doc(db, 'tenants', tenantId, 'industries', industry.id, 'coupons', c.code), c);
        });
        batch.commit().catch(e => console.error("Error seeding default coupons:", e));
      }
    });

    // E. Listen and seed "categories"
    const unsubscribeCategories = onSnapshot(collection(db, 'tenants', tenantId, 'industries', industry.id, 'categories'), (colSnap) => {
      if (!colSnap.empty) {
        const list: string[] = [];
        colSnap.forEach((doc) => {
          list.push(doc.id);
        });
        setCategoriesList(list);
      } else {
        const defaultCats = ['爆款推荐', '本季新品', '限时折扣', '招牌单品'];
        const batch = writeBatch(db);
        defaultCats.forEach(cat => {
          batch.set(doc(db, 'tenants', tenantId, 'industries', industry.id, 'categories', cat), { name: cat });
        });
        batch.commit().catch(e => console.error("Error seeding default categories:", e));
      }
    });

    return () => {
      unsubscribeTenantProfile();
      unsubscribeBillingLogs();
      unsubscribeMetrics();
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeCoupons();
      unsubscribeCategories();
    };
  }, [industry.id, userEmail]);

  // Helper to save Merchant profile configs to DB (Merchant Settings)
  const handleSaveMerchantProfile = async (newBrandName: string, newSlogan: string) => {
    try {
      await setDoc(doc(db, 'tenants', tenantId), {
        merchantName: newBrandName,
        companySlogan: newSlogan
      }, { merge: true });
      
      setLogs(prev => [
        {
          id: `profile-update-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          sender: '系统运营',
          emoji: '⚙️',
          message: `商户核心配置修改入库成功。新商号:「${newBrandName}」，新标语:「${newSlogan}」。`,
          type: 'success'
        },
        ...prev
      ]);
    } catch (e) {
      console.error("Failed to update merchant profile in DB: ", e);
    }
  };

  // Helper to perform computing power topup or SaaS package upgrade in Firestore
  const handlePerformSaaSTopup = async (topupType: 'token_pack' | 'tier_upgrade', amount: number, tokensCredited: number, itemName: string) => {
    try {
      const updatedBalance = merchantTokenBalance + tokensCredited;
      const updatedRechargeTotal = merchantRechargeTotal + amount;
      const nextTier = topupType === 'tier_upgrade' ? 'professional' : merchantBillingTier;
      
      // 1. Write the update to Tenant Master doc (Merchant Status / Billing)
      await setDoc(doc(db, 'tenants', tenantId), {
        tokenBalance: updatedBalance,
        rechargeTotal: updatedRechargeTotal,
        billingTier: nextTier,
        status: 'active' // automatically reactivate if suspended or expired!
      }, { merge: true });

      // 2. Insert new transaction invoice document to subcollection
      const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
      await setDoc(doc(db, 'tenants', tenantId, 'billing_logs', invoiceId), {
        id: invoiceId,
        timestamp: new Date().toISOString(),
        item: itemName,
        amount: amount,
        tokensCredited: tokensCredited,
        status: 'success',
        type: topupType,
        paymentMethod: 'alipay'
      });

      // 3. Print log on workbench
      setLogs(prev => [
        {
          id: `topup-success-${invoiceId}`,
          timestamp: new Date().toLocaleTimeString(),
          sender: '财务系统',
          emoji: '🪙',
          message: `【财务记账】商户成功订购「${itemName}」，实付 ￥${amount}。算力已到账: +${tokensCredited.toLocaleString()} Tokens。`,
          type: 'success'
        },
        ...prev
      ]);
    } catch (e) {
      console.error("Failed to perform simulated SaaS topup in Firestore: ", e);
    }
  };

  // Helper helper to safely update aggregate performance stats in Firestore
  const updateMetricsInDb = async (addedSales: number, addedOrders: number) => {
    try {
      const metricsRef = doc(db, 'tenants', tenantId, 'industries', industry.id, 'metrics', 'operating');
      const snap = await getDoc(metricsRef);
      if (snap.exists()) {
        const currentData = snap.data();
        await setDoc(metricsRef, {
          sales: Number(((currentData.sales || 0) + addedSales).toFixed(2)),
          orders: (currentData.orders || 0) + addedOrders
        });
      } else {
        await setDoc(metricsRef, {
          sales: Number((25488.60 + addedSales).toFixed(2)),
          orders: 132 + addedOrders
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tenants/${tenantId}/industries/${industry.id}/metrics/operating`);
    }
  };

  // 6. Food Delivery (Takeout) and Dine-in simulation states
  const [customerOrderType, setCustomerOrderType] = useState<'takeout' | 'dine_in'>('takeout');
  const [customerCart, setCustomerCart] = useState<any[]>([]); // Array of { id, name, price, image, quantity, customSpecs }
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('北京市朝阳区望京西园三区301楼1204室');
  const [deliveryPhone, setDeliveryPhone] = useState('13910245678');
  const [deliveryName, setDeliveryName] = useState('王小二');
  const [dineInTableNumber, setDineInTableNumber] = useState('B08桌');
  
  // Tab-state inside the simulator (home, menu, cart, checkout, success, mine)
  const [simulatorTab, setSimulatorTab] = useState<'home' | 'menu' | 'cart' | 'checkout' | 'success' | 'mine'>('home');
  const [simulatorBalance, setSimulatorBalance] = useState<number>(258.00);
  // Specific customized spec choices state for Product Detail Choices
  const [chosenSpecSize, setChosenSpecSize] = useState<string>('中杯');
  const [chosenSpecSweetness, setChosenSpecSweetness] = useState<string>('标准糖');
  const [chosenSpecIce, setChosenSpecIce] = useState<string>('标准冰');
  
  const [activeOrderCategory, setActiveOrderCategory] = useState<'all' | 'dine_in' | 'takeout'>('all');
  const [incomingOrderAlert, setIncomingOrderAlert] = useState<{
    id: string;
    type: 'dine_in' | 'takeout';
    desc: string;
    price: number;
    location: string;
    customerName: string;
  } | null>(null);

  // Advanced ordering app details state
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<any | null>(null);
  const [simulatorCategory, setSimulatorCategory] = useState<string>('全部');
  const [simulatorSearchQuery, setSimulatorSearchQuery] = useState<string>('');

  const [autoOrderInterval, setAutoOrderInterval] = useState<boolean>(false); // Sandbox automatic busy hours simulation toggle

  // Sandbox realistic busy-hour dining simulation order stream
  useEffect(() => {
    if (!autoOrderInterval) return;

    const intervalId = setInterval(() => {
      // Create random order based on available products list
      if (productsList.length === 0) return;
      const index = Math.floor(Math.random() * productsList.length);
      const item = productsList[index];
      const quantity = Math.floor(Math.random() * 2) + 1;
      const type = Math.random() > 0.4 ? 'takeout' : 'dine_in';
      const orderId = 'AUTO-' + (type === 'takeout' ? 'WM' : 'TS') + '-' + Math.floor(Math.random() * 899 + 100);
      
      const addresses = ['朝阳区曙光西里甲15号 凤凰城A座', '朝阳区阜通东大街 望京方恒国际C座', '朝阳区酒仙桥路4号 798艺术区B05', '朝阳区建国门外大街1号 国贸商城南区', '朝阳区工体东路 16号院公寓'];
      const tables = ['A03桌', 'B12桌', 'C02桌', 'A15桌', 'B04桌'];
      
      const selectedLocation = type === 'takeout' 
        ? '配送 🛵 ' + addresses[Math.floor(Math.random() * addresses.length)] 
        : '就餐 🍱 ' + tables[Math.floor(Math.random() * tables.length)] + ' 扫码点单';

      const usernames = ['林先生', '孙小姐', '钱老板', '周女士', '小胖同学'];
      const name = type === 'takeout' ? usernames[Math.floor(Math.random() * usernames.length)] : (tables[Math.floor(Math.random() * tables.length)] + '顾客');
      const phone = type === 'takeout' ? '158****' + Math.floor(Math.random() * 8999 + 1000) : '堂食自助';

      const simulatedOrder = {
        id: orderId,
        time: '刚才',
        location: selectedLocation,
        desc: `${item.name} x${quantity}`,
        price: item.price * quantity,
        status: 'pending',
        type: type,
        customerName: name,
        phone: phone,
        tracking: ''
      };

      setDoc(doc(db, 'tenants', tenantId, 'industries', industry.id, 'orders', orderId), simulatedOrder)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `tenants/${tenantId}/industries/${industry.id}/orders/${orderId}`));
      
      updateMetricsInDb(item.price * quantity, 1);

      setLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
          sender: type === 'takeout' ? '仿真外卖网关' : '仿真堂食终端',
          emoji: type === 'takeout' ? '🛵' : '🍱',
          message: `📡 【流式模拟下单】顾客 ${name} 成功下单 ${item.image} ${item.name}*${quantity}，已安全持久化至远程 Firestore。`,
          type: 'success'
        }
      ]);

      // Trigger tone notification chime and set state alert so it displays elegantly
      setIncomingOrderAlert(simulatedOrder);
      playLiveOrderChime();

    }, 20000); // Trigger order simulation every 20 seconds

    return () => clearInterval(intervalId);
  }, [autoOrderInterval, productsList]);

  const [couponApplied, setCouponApplied] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wechat' | 'alipay' | 'balance'>('wechat');
  const [orderRemarks, setOrderRemarks] = useState<string>('');
  const [customSpecOption, setCustomSpecOption] = useState<string>(''); // For size, spicy level or sweetness

  // Sound chime synthesizer using HTML5 Web Audio API
  const playLiveOrderChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Play melody (beautiful digital service ring)
      playNote(523.25, 0, 0.4);      // C5
      playNote(659.25, 0.15, 0.4);   // E5
      playNote(783.99, 0.3, 0.4);    // G5
      playNote(1046.5, 0.45, 0.6);   // C6
    } catch (err) {
      console.warn('Web Audio has been blocked:', err);
    }
  };

  // 4. CRM Client Complaint mock state
  const [disputeResolved, setDisputeResolved] = useState<'active' | 'resolving' | 'solved'>('active');
  const [crmLog, setCrmLog] = useState<string>('客户【李阿姨】发起求求助：收到衣服发现码数选大了，套上去不显腰身，正在联系客服退款且在沟通群情绪激动。');

  // 5. Marketing context state
  const [mktBudget, setMktBudget] = useState(150);
  const [mktTopic, setMktTopic] = useState('');
  const [mktOutput, setMktOutput] = useState('');
  const [mktLoading, setMktLoading] = useState(false);

  const bottomLogsRef = useRef<HTMLDivElement>(null);
  const bottomChatsRef = useRef<HTMLDivElement>(null);

  // Sync selected staff member to current menu context automatically
  useEffect(() => {
    let targetRole = 'AI运营经理';
    if (activeMenu === 'store') {
      targetRole = 'AI设计师';
    } else if (activeMenu === 'product') {
      targetRole = 'AI商品经理';
    } else if (activeMenu === 'marketing') {
      targetRole = 'AI营销经理';
    } else {
      targetRole = 'AI运营经理';
    }

    const matched = managers.find(m => m.role === targetRole);
    if (matched) {
      // Create TeamMember item wrapper
      const staffMember: TeamMember = {
        role: matched.role,
        emoji: matched.emoji,
        name: matched.name,
        desc: matched.desc,
        status: 'active',
        tasks: getTasksForRole(matched.role, industry.id)
      };
      setSelectedStaff(staffMember);
    }
  }, [activeMenu]);

  // ==========================================
  // GOOGLE DRIVE INTEGRATION & OPERATIONS
  // ==========================================
  const [selectedBackupId, setSelectedBackupId] = useState<string>('');
  const [wipeProductsInPurge, setWipeProductsInPurge] = useState(false);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [driveUserEmail, setDriveUserEmail] = useState<string | null>(null);
  const [driveBackups, setDriveBackups] = useState<any[]>([]);
  const [isSearchingBackups, setIsSearchingBackups] = useState<boolean>(false);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  const handleConnectDrive = async () => {
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive');

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setDriveAccessToken(credential.accessToken);
        setDriveUserEmail(result.user.email);
        setLogs(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
            sender: 'Google 安全盾',
            emoji: '🔑',
            message: `🔓 成功对接 Google Drive 云端存储授权！账号：${result.user.email}。数据导入/备份导出通道已全面开启。`,
            type: 'success'
          }
        ]);
        await handleFetchBackups(credential.accessToken);
      } else {
        alert('无法获取 Google Drive 访问令牌。');
      }
    } catch (err: any) {
      console.error('连接 Google Drive 失败:', err);
      alert('连接 Google Drive 授权失败: ' + err.message);
    }
  };

  const handleDisconnectDrive = () => {
    setDriveAccessToken(null);
    setDriveUserEmail(null);
    setDriveBackups([]);
    setSelectedBackupId('');
    setLogs(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        sender: 'Google 备份引擎',
        emoji: '🔒',
        message: '🔒 已断开 Google Drive 连接，缓存的 Access Token 已安全清空。',
        type: 'info'
      }
    ]);
  };

  const handleFetchBackups = async (token = driveAccessToken) => {
    const activeToken = token || driveAccessToken;
    if (!activeToken) return;
    setIsSearchingBackups(true);
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=name contains 'dining_system_backup' and mimeType='application/json'&spaces=drive&fields=files(id, name, createdTime)&orderBy=createdTime desc`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (data.files) {
        setDriveBackups(data.files);
        if (data.files.length > 0) {
          setSelectedBackupId(data.files[0].id);
        }
      }
    } catch (e: any) {
      console.error('获取 Google Drive 备份失败:', e);
    } finally {
      setIsSearchingBackups(false);
    }
  };

  const handleBackupToDrive = async () => {
    if (!driveAccessToken) {
      alert('请先连接 Google Drive');
      return;
    }
    const confirmed = window.confirm('确认要将当前店铺的在售商品、销售记录、业绩大盘数据导出一份备份文件保存到 Google Drive 吗？');
    if (!confirmed) return;

    setIsBackingUp(true);
    try {
      const { getDocs, collection, doc, getDoc } = await import('firebase/firestore');
      
      const metricsSnap = await getDoc(doc(db, 'tenants', tenantId, 'industries', industry.id, 'metrics', 'operating'));
      const metricsData = metricsSnap.exists() ? metricsSnap.data() : { sales: sales, orders: orders };

      const productsSnap = await getDocs(collection(db, 'tenants', tenantId, 'industries', industry.id, 'products'));
      const backupProducts: any[] = [];
      productsSnap.forEach(docSnapVal => {
        backupProducts.push(docSnapVal.data());
      });

      const ordersSnap = await getDocs(collection(db, 'tenants', tenantId, 'industries', industry.id, 'orders'));
      const backupOrders: any[] = [];
      ordersSnap.forEach(docSnapVal => {
        backupOrders.push(docSnapVal.data());
      });

      const backupObj = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        industry: industry.id,
        companyName: industry.name,
        metrics: metricsData,
        products: backupProducts.length > 0 ? backupProducts : productsList,
        orders: backupOrders.length > 0 ? backupOrders : ordersList
      };

      const fileName = `dining_system_backup_${industry.id}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const metadata = {
        name: fileName,
        mimeType: 'application/json'
      };

      const fileContent = JSON.stringify(backupObj, null, 2);
      const boundary = 'foo_bar_backup_boundary';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const body =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        close_delim;

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${driveAccessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: body
      });

      const fileInfo = await res.json();

      setLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
          sender: 'Google 备份引擎',
          emoji: '💾',
          message: `💾 店铺数据云备份储存成功！文件名称：${fileName} (ID: ${fileInfo.id})`,
          type: 'success'
        }
      ]);

      alert('云端数据备份上传成功！');
      await handleFetchBackups();
    } catch (err: any) {
      console.error('备份失败:', err);
      alert('备份导出失败: ' + err.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleProductionPurge = async (wipeProducts: boolean) => {
    const doubleCheck1 = window.confirm('⚠️ 警告：当前操作为上线做准备。您即将彻底清除所有的测试订单和销售额额度，使主盘数据恢复为 0 (测试环境彻底消亡)！确定要执行吗？');
    if (!doubleCheck1) return;

    const doubleCheck2 = window.confirm(`🔥 最终确认：是否同意彻底删档？${wipeProducts ? '包括所有商品条目也将被完全清理空，' : ''}该操作将真实地在 Firestore 数据库中发生，一旦开始无法撤销！`);
    if (!doubleCheck2) return;

    try {
      const { getDocs, collection, doc, writeBatch, setDoc } = await import('firebase/firestore');

      // Reset metrics
      await setDoc(doc(db, 'tenants', tenantId, 'industries', industry.id, 'metrics', 'operating'), { sales: 0, orders: 0 });

      // Clear orders
      const ordersSnap = await getDocs(collection(db, 'tenants', tenantId, 'industries', industry.id, 'orders'));
      const ordBatch = writeBatch(db);
      ordersSnap.forEach(ordDoc => {
        ordBatch.delete(doc(db, 'tenants', tenantId, 'industries', industry.id, 'orders', ordDoc.id));
      });
      await ordBatch.commit();

      // Clear products if requested
      if (wipeProducts) {
        const productsSnap = await getDocs(collection(db, 'tenants', tenantId, 'industries', industry.id, 'products'));
        const prodBatch = writeBatch(db);
        productsSnap.forEach(prodDoc => {
          prodBatch.delete(doc(db, 'tenants', tenantId, 'industries', industry.id, 'products', prodDoc.id));
        });
        await prodBatch.commit();
      } else {
        // Reset product-level sales tracking back to 0 so they don't look simulated
        const productsSnap = await getDocs(collection(db, 'tenants', tenantId, 'industries', industry.id, 'products'));
        const prodBatch = writeBatch(db);
        productsSnap.forEach(prodDoc => {
          prodBatch.update(doc(db, 'tenants', tenantId, 'industries', industry.id, 'products', prodDoc.id), {
            sales: 0
          });
        });
        await prodBatch.commit();
      }

      setLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
          sender: '生产微控制',
          emoji: '🚀',
          message: `⚙️ 【生产校准完成】实验室沙箱模拟记录完美擦除！交易总流水、每日销售统计已完美结算归零 (0 元 / 0 订单)。系统现已处于 100% 真实营业就绪状态，无任何非真实交易。`,
          type: 'success'
        }
      ]);

      alert('生产整盘清零成功！系统已处于纯净状态，随时可以迎接真实客户下单。');
    } catch (e: any) {
      console.error('Clearing database error: ', e);
      alert('数据清空失败: ' + e.message);
    }
  };


const handleRestoreFromDrive = async () => {
    if (!driveAccessToken) {
      alert('请先连接 Google Drive');
      return;
    }
    if (!selectedBackupId) {
      alert('未检测到有效的备份文件，请确认列表或重新获取');
      return;
    }
    const confirmed = window.confirm('⚠️ 警告：从云备份恢复数据，将会重置并清空当前店铺所有的订单、销售数据业绩大盘，并用备份覆盖商品属性！请确认是否继续？该操作不可逆！');
    if (!confirmed) return;

    setIsRestoring(true);
    try {
      const { getDocs, collection, doc, writeBatch } = await import('firebase/firestore');

      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${selectedBackupId}?alt=media`, {
        headers: { Authorization: `Bearer ${driveAccessToken}` }
      });
      if (!res.ok) {
        throw new Error('无法下载对应的备份数据');
      }
      const data = await res.json();

      // Clear existing products
      const productsSnap = await getDocs(collection(db, 'tenants', tenantId, 'industries', industry.id, 'products'));
      const prodBatch = writeBatch(db);
      productsSnap.forEach(prodDoc => {
        prodBatch.delete(doc(db, 'tenants', tenantId, 'industries', industry.id, 'products', prodDoc.id));
      });
      await prodBatch.commit();

      // Clear existing orders
      const ordersSnap = await getDocs(collection(db, 'tenants', tenantId, 'industries', industry.id, 'orders'));
      const ordBatch = writeBatch(db);
      ordersSnap.forEach(ordDoc => {
        ordBatch.delete(doc(db, 'tenants', tenantId, 'industries', industry.id, 'orders', ordDoc.id));
      });
      await ordBatch.commit();

      // Restore metrics
      const operatingMetrics = data.metrics || { sales: 0, orders: 0 };
      await setDoc(doc(db, 'tenants', tenantId, 'industries', industry.id, 'metrics', 'operating'), {
        sales: Number(operatingMetrics.sales || 0),
        orders: Number(operatingMetrics.orders || 0)
      });

      // Restore products
      if (Array.isArray(data.products)) {
        const newProdBatch = writeBatch(db);
        data.products.forEach((p: any) => {
          if (p.id) {
            newProdBatch.set(doc(db, 'tenants', tenantId, 'industries', industry.id, 'products', p.id), p);
          }
        });
        await newProdBatch.commit();
      }

      // Restore orders
      if (Array.isArray(data.orders)) {
        const newOrdBatch = writeBatch(db);
        data.orders.forEach((o: any) => {
          if (o.id) {
            newOrdBatch.set(doc(db, 'tenants', tenantId, 'industries', industry.id, 'orders', o.id), o);
          }
        });
        await newOrdBatch.commit();
      }

      setLogs(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
          sender: 'Google 备份引擎',
          emoji: '🔄',
          message: `🔄 数据还原完毕！成功恢复 ${data.products?.length || 0} 款商品、${data.orders?.length || 0} 张订单，大盘总营业额变更为：¥${(operatingMetrics.sales || 0).toLocaleString()} 元`,
          type: 'success'
        }
      ]);

      alert('云端备份还原入库成功！界面所有属性已加载刷新。');
    } catch (err: any) {
      console.error('备份恢复失败:', err);
      alert('备份导入还原失败: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };


  const parseActionDetails = (rawResponseText: string) => {
    const actionRegex = /\[ACTION:\s*([^\]\s|]+)\s*(?:\|\s*([^\]|]+)\s*)?(?:\|\s*([^\]|]+)\s*)?\]/;
    const match = rawResponseText.match(actionRegex);
    
    if (match) {
      const actionType = match[1].trim();
      const arg1 = match[2]?.trim() || '';
      const arg2 = match[3]?.trim() || '';
      
      let title = '';
      if (actionType === 'SET_HEADLINE') {
        title = '主页面标语热更新';
      } else if (actionType === 'SET_THEME') {
        title = '一键切换店面视觉主题';
      } else if (actionType === 'ADD_PRODUCT') {
        title = '精细测款并自动上架产品';
      } else if (actionType === 'SHIP_ORDERS') {
        title = '顺丰速运极速出库发货';
      } else if (actionType === 'RESOLVE_COMPLAINT') {
        title = 'AI 调解中心介入纠纷调停';
      } else if (actionType === 'SET_BUDGET') {
        title = '每日直通车营销投放推广限额微调';
      } else {
        title = `AI 物理动作指令 [${actionType}]`;
      }
      
      return {
        type: actionType,
        title,
        success: true,
        param1: arg1,
        param2: arg2
      };
    }
    return undefined;
  };

  // Sidekick action parser & executor helper
  const executeAction = (rawResponseText: string): string => {
    let cleanMsg = rawResponseText;
    const actionRegex = /\[ACTION:\s*([^\]\s|]+)\s*(?:\|\s*([^\]|]+)\s*)?(?:\|\s*([^\]|]+)\s*)?\]/;
    const match = rawResponseText.match(actionRegex);
    
    if (match) {
      const actionType = match[1].trim();
      const arg1 = match[2]?.trim() || '';
      const arg2 = match[3]?.trim() || '';
      
      // Remove the action block from display
      cleanMsg = rawResponseText.replace(actionRegex, "").trim();

      // 1. SET_HEADLINE: Change slogan
      if (actionType === 'SET_HEADLINE') {
        setStoreHeadline(arg1);
        setLogs((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
            sender: selectedStaff.role,
            emoji: selectedStaff.emoji,
            message: `⚙️ 【Sidekick 自动部署】网店主页标语已由 AI 实时发布热更新为：“${arg1}”！`,
            type: 'success'
          }
        ]);
      }
      
      // 2. SET_THEME: Change CSS theme
      else if (actionType === 'SET_THEME') {
        const targetTheme = arg1.toLowerCase();
        let matchedTheme: 'retro' | 'dark' | 'classic' = 'retro';
        if (targetTheme.includes('dark') || targetTheme.includes('暗') || targetTheme.includes('黑')) {
          matchedTheme = 'dark';
        } else if (targetTheme.includes('classic') || targetTheme.includes('极简') || targetTheme.includes('观') || targetTheme.includes('雅') || targetTheme.includes('经')) {
          matchedTheme = 'classic';
        } else {
          matchedTheme = 'retro';
        }
        setStoreTheme(matchedTheme);
        setLogs((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
            sender: selectedStaff.role,
            emoji: selectedStaff.emoji,
            message: `✨ 【Sidekick 自动部署】首页视觉风格已更换装配为：【${matchedTheme === 'dark' ? '潮冷暗黑' : matchedTheme === 'classic' ? '现代极简' : '奶油法式'}】！`,
            type: 'success'
          }
        ]);
      }

      // 3. ADD_PRODUCT: Add a new product
      else if (actionType === 'ADD_PRODUCT') {
        const prodName = arg1;
        const prodPrice = parseFloat(arg2) || Math.floor(Math.random() * 150 + 50);
        const em = industry.id === 'catering' ? '🍛' : industry.id === 'retail' ? '📦' : '👚';
        const newItemId = 'p' + (productsList.length + Math.floor(Math.random() * 100) + 10);
        const newItem = {
          id: newItemId,
          name: prodName,
          price: prodPrice,
          stock: Math.floor(Math.random() * 200 + 100),
          image: em,
          category: industry.id === 'catering' ? '咖啡' : industry.id === 'retail' ? '居家' : '外套',
          desc: 'AI 研发打新商品',
          sales: 0,
          rating: '100%',
          specs: { sizes: ['标准'], labels: 'AI精算' }
        };

        setDoc(doc(db, 'tenants', tenantId, 'industries', industry.id, 'products', newItemId), newItem)
          .then(() => {
            setLogs((prevLogs) => [
              ...prevLogs,
              {
                id: Math.random().toString(),
                timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                sender: 'AI商品经理',
                emoji: '👚',
                message: `✔ 【Sidekick 自动建档】新品【${newItem.name}】精算打版完毕，定价 ¥${prodPrice}，初始配给库存 ${newItem.stock}件，已成功上架并写入 Firestore！`,
                type: 'success'
              }
            ]);
          })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `tenants/${tenantId}/industries/${industry.id}/products/${newItemId}`));
      }

      // 4. SHIP_ORDERS: Ship all pending orders
      else if (actionType === 'SHIP_ORDERS') {
        const batch = writeBatch(db);
        let checkPendingCount = 0;
        ordersList.forEach((o) => {
          if (o.status === 'pending') {
            checkPendingCount++;
            batch.update(doc(db, 'tenants', tenantId, 'industries', industry.id, 'orders', o.id), {
              status: 'dispatched',
              tracking: 'SF' + Math.floor(Math.random() * 8999999 + 1000000000)
            });
          }
        });

        if (checkPendingCount > 0) {
          batch.commit()
            .then(() => {
              setLogs((prevLogs) => [
                ...prevLogs,
                {
                  id: Math.random().toString(),
                  timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                  sender: 'AI运营经理',
                  emoji: '📈',
                  message: `🚚 【Sidekick 自动跟单】一键托管发货，已在 Firestore 批量更新发货并在顺丰网关生成 ${checkPendingCount} 个单号！`,
                  type: 'success'
                }
              ]);
              updateMetricsInDb(325 * checkPendingCount, checkPendingCount);
            })
            .catch(err => handleFirestoreError(err, OperationType.UPDATE, `tenants/${tenantId}/industries/${industry.id}/orders`));
        }
      }

      // 5. RESOLVE_COMPLAINT: Mitigate customer complaints
      else if (actionType === 'RESOLVE_COMPLAINT') {
        setDisputeResolved('solved');
        setCrmLog('👴 李阿姨的纠纷已被自动解决。\n【调停反馈】：“哎哟，小姑娘服务真是好得没话说，态度真诚还送了无门槛代金券，退换货也免费，我就不申请退款了，穿穿看，给你们评个大大的五星好评！”');
        setLogs((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
            sender: 'AI 客服调停',
            emoji: '💬',
            message: '🎉 【Sidekick 客情调解】秒级介入客户补偿调和，李阿姨投诉已化解，成功撤销客怨！',
            type: 'success'
          }
        ]);
      }

      // 6. SET_BUDGET: Save daily marketing limits
      else if (actionType === 'SET_BUDGET') {
        const parsedB = parseInt(arg1) || 150;
        const finalB = Math.max(50, Math.min(1000, parsedB));
        setMktBudget(finalB);
        setLogs((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
            sender: 'AI营销经理',
            emoji: '📣',
            message: `📈 【Sidekick 预算微控】直通车投发每日预算调整并锁定为：¥${finalB} 元！`,
            type: 'success'
          }
        ]);
      }
    }

    return cleanMsg;
  };

  const queryBackendForText = async (searchKeyword: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: searchKeyword,
          employeeRole: selectedStaff.role,
          employeeName: selectedStaff.name,
          employeeDesc: selectedStaff.desc,
          industryName: industry.name,
          industryTagline: industry.tagline,
          strategyName: strategy.name,
          strategyDesc: strategy.desc,
          apiProvider,
          ollamaEndpoint,
          ollamaModel
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      if (data && data.fallbackToSimulated) {
        throw new Error(`Ollama sandbox simulation bypass trigger: ${data.error || "unreachable"}`);
      }

      if (data && data.success && data.reply) {
        const parsedAct = parseActionDetails(data.reply.trim());
        const executedReply = executeAction(data.reply.trim());
        const aiReply: ChatMessage = {
          id: Math.random().toString(),
          sender: selectedStaff.name,
          role: selectedStaff.role,
          emoji: selectedStaff.emoji,
          message: executedReply,
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
          isUser: false,
          actionDetected: parsedAct
        };

        setChats((prev) => ({
          ...prev,
          [selectedStaff.role]: [...(prev[selectedStaff.role] || []), aiReply]
        }));

        setLogs((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
            sender: selectedStaff.role,
            emoji: selectedStaff.emoji,
            message: `【${selectedStaff.name}】实时接收指令任务并执行部署完毕。 (模型引擎：${data.source || 'Gemini Core'})`,
            type: 'success'
          }
        ]);
        setIsTyping(false);
        return;
      }
      throw new Error("模型故障或回复为空");
    } catch (err: any) {
      // Fallback simulation fallback
      console.warn('Backend chat failed, using premium local parameters:', err.message);
      
      let fallbackReply = '';
      const lowerText = searchKeyword.toLowerCase();

      if (lowerText.includes('利润') || lowerText.includes('钱') || lowerText.includes('账') || lowerText.includes('财务') || lowerText.includes('周报') || lowerText.includes('报告')) {
        fallbackReply = `收到指示！当前采取【${strategy.name}】。今日累计取得销售利润约 ¥${(sales * 0.38).toFixed(2)}，渠道无异常退款拦截，已完成自动流水核销与资产合并。`;
      } else if (lowerText.includes('标语') || lowerText.includes('看板') || lowerText.includes('招牌') || lowerText.includes('改成') || lowerText.includes('主题') || lowerText.includes('装修') || lowerText.includes('风格')) {
        const hMatch = searchKeyword.match(/(?:标语改成|看板改成|改成|设为标语|改为标语|标语定为)[：:]?\s*(.+)/);
        const targetHead = hMatch ? hMatch[1].trim().replace(/["'「」]/g, "") : "👗 2026春夏高定·亚麻系列新品首发";
        
        let actionTag = `[ACTION: SET_HEADLINE | ${targetHead}]`;
        let themeDesc = "";
        if (lowerText.includes('暗黑') || lowerText.includes('黑色') || lowerText.includes('酷')) {
          actionTag = `[ACTION: SET_THEME | dark]`;
          themeDesc = "已同步将网店格调更换为【潮冷暗黑】主题风格。";
        } else if (lowerText.includes('极简') || lowerText.includes('现代') || lowerText.includes('高级')) {
          actionTag = `[ACTION: SET_THEME | classic]`;
          themeDesc = "已同步将网店格调更换为【现代极简】主题风格。";
        } else if (lowerText.includes('法式') || lowerText.includes('复古') || lowerText.includes('奶油')) {
          actionTag = `[ACTION: SET_THEME | retro]`;
          themeDesc = "已同步将网店格调更换为【奶油法式】主题风格。";
        }

        fallbackReply = `明白，所有者！网店装修与品牌橱窗发布指令已代完成。改动信息已经直接推流至全网CDN节点生效中。` + (themeDesc ? ` ${themeDesc}` : "") + ` \n\n${actionTag}`;
      } else if (lowerText.includes('产品') || lowerText.includes('商品') || lowerText.includes('上架') || lowerText.includes('添加') || lowerText.includes('新增')) {
        const pMatch = searchKeyword.match(/(?:上架|添加|新增|打板上架)(?:一个|款)?(?:新品|新产品|商品)?(?:服装|美食|货品)?[:：]?\s*([^，,。¥\d]+)(?:价格|售价|卖)?(?:为)?(\d+)?/);
        const prodName = pMatch ? pMatch[1].trim() : "莫代尔柔肤修身打底衫";
        const prodPrice = pMatch && pMatch[2] ? pMatch[2].trim() : "129";
        
        fallbackReply = `收到！我已核算物料及备货物流，新品打样成功！SPU属性与录单已经100%匹配上线，主站商品目录即时生效。 \n\n[ACTION: ADD_PRODUCT | ${prodName} | ${prodPrice}]`;
      } else if (lowerText.includes('发货') || lowerText.includes('打包') || lowerText.includes('跟单') || lowerText.includes('顺丰') || lowerText.includes('快递')) {
        fallbackReply = `收到托管指令！正联系顺丰极速接单配货，已对当前所有待履约订单执行一键打包发配程序，物流单号已写进运单。 \n\n[ACTION: SHIP_ORDERS]`;
      } else if (lowerText.includes('李阿姨') || lowerText.includes('投诉') || lowerText.includes('客怨') || lowerText.includes('解决差评') || lowerText.includes('纠纷')) {
        fallbackReply = `高优先级纠纷已接管！我们极速沟通李阿姨并在系统内主动赔付5元无门槛券。买家对极高时效跟进深表感激，已改口好评，退款诉求撤销。 \n\n[ACTION: RESOLVE_COMPLAINT]`;
      } else if (lowerText.includes('预算') || lowerText.includes('广告') || lowerText.includes('每日预算') || lowerText.includes('直通车') || lowerText.includes('营销金')) {
        const bMatch = searchKeyword.match(/(?:预算|直通车)(?:设为|改成|调整为|定为|增加至|增加到|减少到)?[:：]?\s*(\d+)/);
        const budgetVal = bMatch ? bMatch[1].trim() : "350";
        
        fallbackReply = `明白，所有者！商业直通车与多矩阵小红书多点开花每日推广投放支出限额已修改。让我们全权护航。 \n\n[ACTION: SET_BUDGET | ${budgetVal}]`;
      } else if (lowerText.includes('推广') || lowerText.includes('营销') || lowerText.includes('小红书') || lowerText.includes('文案') || lowerText.includes('种草')) {
        fallbackReply = `正在为您代拟营销文案。我已经将穿搭潮流高契合种草帖子草稿放到了“营销页面”，直通车引流也保持高速拉新姿态。`;
      } else {
        fallbackReply = `明白您的指示。关于“${searchKeyword}”，我已经作为最高优先级载入了当前的 AI 常态流水之中。我会督促各位成员形成坚实决策闭环，5 分钟内执行完毕。`;
      }

      setTimeout(() => {
        const parsedAct = parseActionDetails(fallbackReply.trim());
        const executedReply = executeAction(fallbackReply);
        const aiReply: ChatMessage = {
          id: Math.random().toString(),
          sender: selectedStaff.name,
          role: selectedStaff.role,
          emoji: selectedStaff.emoji,
          message: executedReply,
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
          isUser: false,
          actionDetected: parsedAct
        };

        setChats((prev) => ({
          ...prev,
          [selectedStaff.role]: [...(prev[selectedStaff.role] || []), aiReply]
        }));

        setLogs((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
            sender: selectedStaff.role,
            emoji: selectedStaff.emoji,
            message: `【${selectedStaff.name}】完成了对您“${searchKeyword}”指令的即时对齐和处理。 (高仿真精算沙盒 - 引擎：${apiProvider === 'ollama' ? 'Ollama/' + ollamaModel : apiProvider === 'gemini' ? 'Gemini 1.5 Flash' : apiProvider})`,
            type: 'success'
          }
        ]);
        setIsTyping(false);
      }, 1200);
    }
  };

  // Action helper to update specific fields of a message in real-time
  const updateChatMessageCustomField = (msgId: string, updater: (msg: any) => any) => {
    setChats((prev) => {
      const currentList = prev[selectedStaff.role] || [];
      const updatedList = currentList.map((m) => (m.id === msgId ? updater(m) : m));
      return {
        ...prev,
        [selectedStaff.role]: updatedList,
      };
    });
  };

  // Simulated Speech-to-Text high fidelity listening driver
  const handleVoiceSimulationStart = () => {
    if (voiceState !== 'idle') return;
    
    setVoiceState('listening');
    setMicActiveLevel(10);
    
    let ticks = 0;
    const waveOscillator = setInterval(() => {
      // Create fancy shifting waveform array
      setVoiceWaveformArr(() => 
        new Array(16).fill(0).map(() => Math.floor(Math.random() * 14) + 2)
      );
      setMicActiveLevel(Math.floor(Math.random() * 30) + 70);
      ticks++;
      
      if (ticks >= 15) { // 3 seconds
        clearInterval(waveOscillator);
        setVoiceState('transcribing');
        
        setTimeout(() => {
          let transcribedStr = "请拉取今天的各渠道销量利润以及流水一览，顺便写个财报汇报。";
          const r = selectedStaff.role;
          if (r === 'AI设计师' || r === 'AI开店经理') {
            transcribedStr = "请帮我将网店标语改成：🧺 梦回巴黎·奶油法式经典双排叠扣百褶防风风衣今日首发上线！";
          } else if (r === 'AI商品经理') {
            transcribedStr = "帮我打板上架一款价格为 189 元的 莫代尔温润高密舒柔卫衣居家服，极速建立 SPU 档案！";
          } else if (r === 'AI运营经理') {
            transcribedStr = "把我们系统里处于待履约的全部订单一键打包，同步让顺丰速运极速扫描出库。";
          } else if (r === 'AI营销经理') {
            transcribedStr = "立刻帮我们直通车推广在全网 CDN 的单日预算调整为限额 500 元，做好精细控投。";
          }
          
          setChatMessage(transcribedStr);
          setVoiceState('idle');
          
          setLogs((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
              sender: '创始人语音听写',
              emoji: '🎙️',
              message: `【AI语音听写成功】听写识别语素为：“${transcribedStr}”，已载入对话框。`,
              type: 'info'
            }
          ]);
        }, 800);
      }
    }, 200);
  };

  // 1. Trigger AI Creative Poster inside Chat Stream
  const triggerAICreativePoster = () => {
    const isRetail = industry.id === 'retail';
    const isCatering = industry.id === 'catering';
    const defaultTitle = isCatering ? "拾光老街 匠心传承霸王餐" : isRetail ? "摩登法式 100%全呼吸高定风衣" : "AI 臻选·限定爆款正式发售";
    const defaultSubtitle = isCatering ? "正宗川西口味限时5折双人套餐" : isRetail ? "感知天然麻料，定义法式柔焦新美学" : "全链路工艺打版，限量爆品实时特惠中";
    
    const userMsgId = Math.random().toString();
    const posterMsgId = Math.random().toString();
    
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: '创始人(你)',
      role: 'Owner',
      emoji: '👤',
      message: '🎨 帮我针对当前的网店风格和战略，全自动设计排版一款引流视觉海报/招牌展示面板。',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      isUser: true
    };

    const workerMsg: ChatMessage = {
      id: posterMsgId,
      sender: selectedStaff.name,
      role: selectedStaff.role,
      emoji: selectedStaff.emoji,
      message: `收到！我已经深度解析您当前的【${strategy.name}】战略和 ${storeTheme === 'dark' ? '潮冷暗黑' : storeTheme === 'classic' ? '现代极简' : '奶油法式'} 首页色调，为您自动进行创意海报渲染。您可在下方面板中实时预览和微调，并一键发布热更新到店铺首页招牌中！`,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      isUser: false,
      generatedPoster: {
        title: defaultTitle,
        subtitle: defaultSubtitle,
        theme: storeTheme,
        image: isCatering ? '🍛' : isRetail ? '👚' : '📦',
        isDeployed: false
      }
    };

    setChats((prev) => ({
      ...prev,
      [selectedStaff.role]: [...(prev[selectedStaff.role] || []), userMsg, workerMsg]
    }));

    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        sender: selectedStaff.role,
        emoji: '🎨',
        message: `【AI创意排版】设计海报画幅渲染完成，已载入创始人会商工作流。`,
        type: 'success'
      }
    ]);
  };

  // 2. Trigger AI Xiaohongshu/Douyin Copywriter inside Chat Stream
  const triggerAICopywriter = () => {
    const isRetail = industry.id === 'retail';
    const isCatering = industry.id === 'catering';
    
    const baseTitle = isCatering ? "🔥 怎么会有这么绝的小店！老街双人套餐好吃到哭！" : isRetail ? "🧺 救命！穿上这件法式风衣出门被疯狂询问要链接！" : "✨ 太酷了！创始人一秒把店铺装修成高端潮流风！";
    const baseBody = isCatering 
      ? "姐妹们！今天终于薅到了这家宝藏老字号的羊毛！一进门就被它复古的环境震撼到，双人霸王餐简直是性价比之王！\n\n那碗手作经典意面爽滑弹牙，裹满了浓郁的秘制酱汁，一口下去幸福感拉满！配料超有诚意，用料极其讲究！\n\n重点是全线5折！精选老街风味，真的太懂年轻人的胃了。别再吃外卖了，快和闺蜜来打卡吧！"
      : "懂行的人都在穿这件！100%呼吸感亚麻质地的法式风行款，真的是早春降降温穿搭神仙单品！\n\n它的天然亚麻面料轻盈透气，有一种慵懒松弛的高级感，挺括的版型不论是上班通勤还是出门喝杯咖啡都绝美！\n\n温柔耐看的卡其杏色，高级而克制，真的是完美演绎法式优雅的穿衣美学。穿上去优雅显瘦，回头率100%！";

    const userMsgId = Math.random().toString();
    const copyMsgId = Math.random().toString();

    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: '创始人(你)',
      role: 'Owner',
      emoji: '👤',
      message: '✍️ 帮我写一篇高点击、强种草属性的热门小红书营销传播文案，要符合咱们当下的品牌主张。',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      isUser: true
    };

    const workerMsg: ChatMessage = {
      id: copyMsgId,
      sender: selectedStaff.name,
      role: selectedStaff.role,
      emoji: selectedStaff.emoji,
      message: `已为您定制撰写高互动爆文。结合了点击率预估推荐特征并附带了多轮语气调换，您可以拖拽滑块微调文案口舌，一键复制使用：`,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      isUser: false,
      generatedCopywriting: {
        title: baseTitle,
        body: baseBody,
        tags: isCatering ? ['老街风味', '周末吃什么', '霸王餐'] : ['每日穿搭', '慵懒法式', '早春高级感'],
        rating: 94,
        emotionalScore: 85,
        tone: 'classic'
      }
    };

    setChats((prev) => ({
      ...prev,
      [selectedStaff.role]: [...(prev[selectedStaff.role] || []), userMsg, workerMsg]
    }));

    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        sender: selectedStaff.role,
        emoji: '📖',
        message: `【AI爆文写作】自研写手模型根据创始战略，极速编制高流量笔记草案。`,
        type: 'success'
      }
    ]);
  };

  // 3. Trigger AI Merchandiser Product Model Prediction in Chat Stream
  const triggerAIPrediction = () => {
    const isRetail = industry.id === 'retail';
    const isCatering = industry.id === 'catering';

    const pName = isCatering ? "手工黑松露菌菇宽意面 (AI预测款)" : isRetail ? "手作罗纹莫代尔高弹针织内搭" : "AI自研智能配给畅销尖货";
    const cPrice = isCatering ? 12.50 : 28.00;
    const normMarkup = 240; // 240%

    const userMsgId = Math.random().toString();
    const predMsgId = Math.random().toString();

    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: '创始人(你)',
      role: 'Owner',
      emoji: '👤',
      message: '🔮 帮我结合供应链库存，测算一款当前高利润率、易打爆的趋势测款新品。',
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      isUser: true
    };

    const workerMsg: ChatMessage = {
      id: predMsgId,
      sender: selectedStaff.name,
      role: selectedStaff.role,
      emoji: selectedStaff.emoji,
      message: `我深度检索了上游供应链库存配额，结合【${strategy.name}】的溢价期望值，为您智能打底以下新品参数。推演毛利倍数即可自动得出首月预估投产比，批准即可直接录入 ERP 货架！`,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      isUser: false,
      generatedPrediction: {
        name: pName,
        price: Math.floor(cPrice * (normMarkup / 100)),
        markup: normMarkup,
        cost: cPrice,
        predictedROI: 78,
        isUploaded: false
      }
    };

    setChats((prev) => ({
      ...prev,
      [selectedStaff.role]: [...(prev[selectedStaff.role] || []), userMsg, workerMsg]
    }));

    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        sender: selectedStaff.role,
        emoji: '🔮',
        message: `【AI趋势测算】产品模型微控搭建完毕，正加载于会商面板待创始批准。`,
        type: 'success'
      }
    ]);
  };

  // Action: Trigger Image Scan & Analysis
  const handleLocalImageScan = (imageUrl: string, filename: string) => {
    setIsAnalyzingImage(true);
    
    // Push the user message showing a picture placeholder
    const userMsgId = Math.random().toString();
    const scanMsgId = Math.random().toString();
    
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: '创始人(你)',
      role: 'Owner',
      emoji: '👤',
      message: `📷 [已上载商品图纸素材 - ${filename}] 帮我运行视觉智能感知，提取配色与SPU卖点信息！`,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      isUser: true,
      analyzedImage: {
        name: filename,
        detectedSPUs: [],
        colorPalette: [],
        suggestedPrice: 0,
        textIdea: '',
        imageBase64: imageUrl
      }
    };

    setChats((prev) => ({
      ...prev,
      [selectedStaff.role]: [...(prev[selectedStaff.role] || []), userMsg]
    }));

    // Trigger computer vision simulated logic with actual uploaded base64 reference!
    setTimeout(() => {
      const isRetail = industry.id === 'retail';
      const isCatering = industry.id === 'catering';
      
      const suggestedPrice = isCatering ? 58 : 169;
      const detectedSPUs = isCatering 
        ? ['经典汤料配方 (主厨特级纯手工)', '色泽红亮 (严选大明灯笼椒与汉源花椒)', '精美保鲜塑封 (外带不洒不漏)']
        : ['100% 新西兰原生精梳美利奴羊毛', '高级卡其暖杏 (天然活性染料)', '无死褶隐形骨接针理工艺'];
      const colorPalette = isCatering 
        ? ['#DC2626 (极耀辣椒红)', '#F59E0B (金橘橙)', '#B45309 (琥珀酱黄)']
        : ['#D4B296 (法式温润卡其)', '#E5E5E5 (磨砂哑灰)', '#1E293B (藏青矿石绿)'];
      const textIdea = isCatering 
        ? '【全景视觉SPU要义】汤红油亮，质地浓糯，在自然采光摄影中散发浓郁麦香胃口感。建议在主图追加大标题文字突出非遗古法手作！'
        : '【全景视觉SPU要义】原生美利奴纱线的丰盈磨合质感完美契合了【奶油法式】店铺风格，质地细挺，绝对是高点击爆款的标配！';

      const workerMsg: ChatMessage = {
        id: scanMsgId,
        sender: selectedStaff.name,
        role: selectedStaff.role,
        emoji: selectedStaff.emoji,
        message: `【AI Computer Vision 计算机视觉引擎】针对创始人上传的实拍图质 [${filename}] 感知解析成功！已提取出其微观质感卖点要素与配色组态。建议测款制定基础售价为 ¥${suggestedPrice} 元：`,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        isUser: false,
        analyzedImage: {
          name: filename,
          detectedSPUs,
          colorPalette,
          suggestedPrice,
          textIdea,
          imageBase64: imageUrl
        }
      };

      setChats((prev) => ({
        ...prev,
        [selectedStaff.role]: [...(prev[selectedStaff.role] || []), workerMsg]
      }));

      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
          sender: selectedStaff.role,
          emoji: '🔍',
          message: `【AI多模态扫描成功】检测到上载素材 [${filename}]，提取色彩及SPU细节就绪。`,
          type: 'success'
        }
      ]);
      setIsAnalyzingImage(false);
      setAttachedImage(null);
      setAttachedImageName(null);
    }, 2200);
  };

  const handleShortcutClick = (promptText: string) => {
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: '创始人(你)',
      role: 'Owner',
      emoji: '👤',
      message: promptText,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      isUser: true
    };

    setChats((prev) => ({
      ...prev,
      [selectedStaff.role]: [...(prev[selectedStaff.role] || []), userMsg]
    }));

    setIsTyping(true);
    queryBackendForText(promptText);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: '创始人(你)',
      role: 'Owner',
      emoji: '👤',
      message: chatMessage,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      isUser: true
    };

    setChats((prev) => ({
      ...prev,
      [selectedStaff.role]: [...(prev[selectedStaff.role] || []), userMsg]
    }));

    const searchKeyword = chatMessage;
    setChatMessage('');
    setIsTyping(true);

    queryBackendForText(searchKeyword);
  };

  const getPromptShortcuts = (role: string) => {
    if (role === 'AI设计师' || role === 'AI开店经理') {
      return [
        { label: '标语: 奶油法式', prompt: '帮我把网店的标题改成 🧺 舒适经典·极致软糯法式针织新品今日上新！' },
        { label: '风格: 潮冷暗黑', prompt: '一键将我的店铺整体页面调换为酷潮冷色暗黑主题风格' },
        { label: '标语: 极简通勤', prompt: '帮我改写标题标语并且调换为意式极简高定通勤系列发布' }
      ];
    } else if (role === 'AI商品经理') {
      return [
        { label: '上架：柔糯打底衫 ¥139', prompt: '打板上架一个高性价比新品服装，“柔糯高弹莫代尔通勤打底衫”，定价139元' },
        { label: '上架：金牌手作意面 ¥48', prompt: '上架畅销爆品“意式白松露手工意面”，定价48元' }
      ];
    } else if (role === 'AI运营经理') {
      return [
        { label: '承运：顺丰一键批量发货', prompt: '将目前处于待处理的待发货订单一键安排顺丰速运极速出库' },
        { label: '客情：调和解危李阿姨投诉', prompt: '极速介入：帮忙化解买家李阿姨的衣服尺码中差评误会' }
      ];
    } else if (role === 'AI营销经理') {
      return [
        { label: '预算: 提至 ¥600/天', prompt: '提升直通车推广广告投放每日资金限额至600元' },
        { label: '限额: 降至 ¥80/天', prompt: '降低营销每日预算直通车限额到精打细算水平80元' }
      ];
    }
    return [
      { label: '核账: 查询今日累计利润营收', prompt: '拉取今天的各渠道销量利润以及流水一览，顺便写个财报汇报' }
    ];
  };

  const getTasksForRole = (role: string, industryId: string): string[] => {
    if (role === 'AI设计师' || role === 'AI开店经理') {
      return ['布置店铺高级装潢视觉版块', '一句话实时微调首页促销标语', '设计生成视觉海报与穿搭详情页'];
    } else if (role === 'AI商品经理') {
      return industryId === 'catering' ? 
        ['更新今日堂食特惠新品', '开发健康营养低卡套餐', '核验食材出厂进价及毛利策略'] :
        ['精选1688创意零售居家新品', '自动同步匹配一件代发供应商API', '对比全网活动类似竞品定价'];
    } else if (role === 'AI运营经理') {
      return ['检测渠道库存周转水位红线', '一键全流程跟单发货顺丰揽揽件', '全网稽核资金账期安全对账'];
    } else {
      return ['更新小红书精品博主寄样穿搭文案', '编排抖音极客短视频起盘文大纲', '精算广告ROI测品推广让利出价'];
    }
  };

  // Quick Macro Directives for main workbench
  const triggerQuickMacro = (type: 'ad_boost' | 'inventory_sync' | 'audit_reconcile' | 'customer_crm') => {
    let message = '';
    let emoji = '⚡';
    let sender = '操作面板';

    if (type === 'ad_boost') {
      message = '📣 所有者触发【投放直通车推广扩充】，自动划拨 ¥100 开路。已在 Firestore 实时累加销售额 ¥480，订单量 +2，智能推广正极速获客。';
      emoji = '📣';
      sender = '智能推广控制台';
      updateMetricsInDb(480, 2);
    } else if (type === 'inventory_sync') {
      message = '📦 所有者启动【柔性快反补货系统】，批处理写入 Firestore，在线更新商品在轨库存（全员 +20~60 件）！';
      emoji = '📦';
      sender = '柔性供应链控管';
      
      const batch = writeBatch(db);
      productsList.forEach((p) => {
        const added = Math.floor(Math.random() * 40 + 20);
        batch.update(doc(db, 'tenants', tenantId, 'industries', industry.id, 'products', p.id), { stock: p.stock + added });
      });
      batch.commit().catch(err => handleFirestoreError(err, OperationType.UPDATE, `tenants/${tenantId}/industries/${industry.id}/products`));
    } else if (type === 'audit_reconcile') {
      const p = (sales * 0.385).toFixed(2);
      message = `💰 启动【全局资产全合并稽查】，自动对标 Firestore 实收数据。本期预估税后净利约 ¥${p}元，账面极度坚实。`;
      emoji = '💰';
      sender = '全域财务审计中心';
    } else {
      message = '💬 所有者启用【智能买家安抚与退款纠纷极速拦截】，客服中心极速接入。化解一宗历史差评疑点并挽留客户。';
      emoji = '💬';
      sender = 'AI 客服调停中枢';
      setDisputeResolved('solved');
      setCrmLog('👴 李阿姨的纠纷已被自动解决。\n【调停反馈】：“哎哟，小姑娘服务真是好得没话说，态度真诚还送了无门槛代金券，退换货也免费，我就不申请退款了，穿穿看，给你们评个大大的五星好评！”');
    }

    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
        sender,
        emoji,
        message,
        type: 'success'
      }
    ]);
  };

  // Fetch / Sync Ollama list
  const syncOllamaModelsList = async () => {
    setIsSyncingOllama(true);
    setOllamaSyncError(null);
    setTestLog(`▶ [Ollama 注册表] 正在同步本地 ${ollamaEndpoint}/api/tags 模型清单...`);
    
    try {
      const res = await fetch(`${ollamaEndpoint}/api/tags`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && Array.isArray(data.models)) {
        const names = data.models.map((m: any) => m.name);
        if (names.length > 0) {
          setOllamaModels(names);
          setOllamaModel(names[0]);
          setTestLog(`✔ 同步本地 Ollama 成功！共发现 ${names.length} 个本地就绪模型: [${names.join(', ')}]`);
        } else {
          throw new Error('未发现模型 (Ollama database is empty)');
        }
      }
    } catch (err: any) {
      console.warn('Ollama offline, fallback placeholders synced:', err.message);
      setTestLog(`⚠ 本地 Ollama 未接通，已为您拉取预备本地极安全沙盒替代库。\n(${err.message || "CORS拦截"})`);
    } finally {
      setIsSyncingOllama(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] font-sans flex flex-col antialiased selection:bg-[#1D9BF0] selection:text-white">
      
      {/* Interactive Website & App Published Modal Overlay */}
      <AnimatePresence>
        {isPublishModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 max-w-lg w-full relative space-y-5 text-white shadow-2xl text-left"
            >
              {/* Close Button top-right */}
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex w-12 h-12 bg-emerald-500/10 text-sky-400 rounded-full items-center justify-center text-xl animate-bounce">
                  🚀
                </div>
                <h3 className="text-base font-extrabold tracking-tight text-white mb-1">恭喜！官方网站与 App 已经一键同步发布全网</h3>
                <p className="text-[11px] text-zinc-400 font-sans">
                  您的线上店铺已部署至超高速云服务器，完成了全网跨端推流。
                </p>
              </div>

              {/* URL card with direct action button */}
              <div className="bg-[#09090B] border border-zinc-900 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">官方全渠道体验链接:</span>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8px] bg-emerald-500/10 text-sky-400">
                    运行中 / Online
                  </span>
                </div>

                <div className="flex items-center space-x-2 bg-black border border-zinc-850 px-3 py-2 rounded-lg">
                  <span className="text-sky-500 text-[11px] font-mono select-none">https://</span>
                  <span className="text-zinc-250 text-xs font-mono select-all flex-1 truncate">
                    {(industry.name || 'shop').toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}.ai-shop.co
                  </span>
                  
                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + '?preview=true');
                      alert('已成功复制官方线上体验链接！您可在任何浏览器或手机中打开体验。');
                    }}
                    className="p-1 hover:text-white text-zinc-500 rounded transition-colors duration-150 cursor-pointer"
                    title="复制链接"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary CTA - Opens Browser Tab */}
                <button
                  type="button"
                  onClick={() => {
                    window.open(window.location.origin + '?preview=true', '_blank');
                  }}
                  className="w-full py-2.5 bg-[#1D9BF0] hover:bg-[#38BDF8] duration-150 rounded-lg text-xs font-extrabold text-white cursor-pointer select-none active:scale-98 flex items-center justify-center space-x-2 border border-sky-500/10 shadow-[0_4px_12px_rgba(31,111,84,0.15)]"
                >
                  <Globe className="w-4 h-4" />
                  <span>🖥️ 在浏览器新窗口直接大屏预览 ➔</span>
                </button>
              </div>

              {/* QR Code description mockup */}
              <div className="flex items-center space-x-4 bg-[#09090B]/40 p-3 rounded-xl border border-zinc-900 text-left">
                <div className="w-16 h-16 bg-white p-1 rounded-lg shrink-0 flex items-center justify-center select-none shadow">
                  {/* Simulated QR Code via a neat visual grid */}
                  <div className="grid grid-cols-5 gap-0.5 w-[56px] h-[56px] text-zinc-950">
                    {[
                      1, 1, 0, 1, 1,
                      1, 0, 1, 0, 1,
                      0, 1, 1, 1, 0,
                      1, 0, 1, 0, 1,
                      1, 1, 0, 1, 1
                    ].map((val, idx) => (
                      <div key={idx} className={val ? 'bg-black' : 'bg-white'} />
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-sky-400 font-bold block">微信/手机扫一扫立即预览 (QR CODE)</span>
                  <p className="text-[9.5px] text-zinc-400 font-sans leading-relaxed">
                    使用手机相机或微信扫码，可直接加载跨端编译的 **Mobile 小程序点单端**，体验真实的在线加购与结算。
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-900 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-5 py-2 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold border border-zinc-800 transition-all duration-150 cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Realtime Order Toast Notification Block */}
      <AnimatePresence>
        {incomingOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 18 }}
            className="fixed top-4 right-4 z-50 w-full max-w-sm bg-[#09090B] border-2 border-sky-500 rounded-xl p-4 shadow-[0_0_20px_rgba(16,185,129,0.3)] text-xs text-white"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 select-none text-xl animate-bounce">
                  {incomingOrderAlert.type === 'takeout' ? '🛵' : '🍱'}
                </div>
                <div>
                  <h4 className="font-bold text-[12px] text-white tracking-tight flex items-center">
                    <span>⚡ 您有新订单啦！(New Catering Order!)</span>
                    <span className="ml-2 animate-pulse inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{incomingOrderAlert.id} • {incomingOrderAlert.time}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIncomingOrderAlert(null)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 p-2 bg-neutral-900/60 rounded border border-[#2F3336] space-y-1.5">
              <div className="flex justify-between font-mono text-[9px]">
                <span className="text-zinc-500">分类:</span>
                <span className="text-white font-bold px-1.5 py-0.2 rounded bg-[#1D9BF0] text-[8.5px]">
                  {incomingOrderAlert.type === 'takeout' ? '外卖配送点单' : '堂食扫码点单'}
                </span>
              </div>
              <div className="flex justify-between font-mono text-[9.5px]">
                <span className="text-zinc-500">详情:</span>
                <span className="text-white font-bold truncate max-w-[200px]">{incomingOrderAlert.desc}</span>
              </div>
              <div className="flex justify-between font-mono text-[9.5px]">
                <span className="text-zinc-500">地址/桌台:</span>
                <span className="text-zinc-300 font-bold max-w-[190px] truncate">{incomingOrderAlert.location}</span>
              </div>
              <div className="flex justify-between font-mono text-[9.5px]">
                <span className="text-zinc-500">顾客:</span>
                <span className="text-[#8B949E] font-bold">{incomingOrderAlert.customerName}</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] font-mono border-t border-[#2F3336]/60 pt-2.5">
              <div className="text-sky-400 font-bold text-sm">
                ¥ {incomingOrderAlert.price.toFixed(2)}
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIncomingOrderAlert(null)}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 font-bold transition-all cursor-pointer"
                >
                  暂存
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Accept and ship instantly (update Firestore)
                    const trackingNo = incomingOrderAlert.type === 'takeout' ? ('MT' + Math.floor(Math.random() * 899999 + 100000)) : '店内自配传菜';
                    const orderDocRef = doc(db, 'tenants', tenantId, 'industries', industry.id, 'orders', incomingOrderAlert.id);
                    setDoc(orderDocRef, {
                      status: 'dispatched',
                      tracking: trackingNo
                    }, { merge: true })
                      .then(() => {
                        setLogs(prev => [
                          ...prev,
                          {
                            id: Math.random().toString(),
                            timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                            sender: '餐饮厨调度',
                            emoji: '🧑‍🍳',
                            message: `🍳 【一键接单】接受自主点菜/外卖【${incomingOrderAlert.id}】，已在 Firestore 持久化流式就位，后厨传单配制承接。`,
                            type: 'success'
                          }
                        ]);
                      })
                      .catch(err => handleFirestoreError(err, OperationType.UPDATE, `tenants/${tenantId}/industries/${industry.id}/orders/${incomingOrderAlert.id}`));

                    setIncomingOrderAlert(null);
                  }}
                  className="px-3 py-1 rounded bg-[#1D9BF0] hover:bg-[#38BDF8] font-bold transition-all text-white cursor-pointer"
                >
                  立即接单制作
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Professional Header */}
      <header className="border-b border-[#2F3336] bg-[#09090B] px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <span className="text-2xl filter drop-shadow select-none">{industry.emoji}</span>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-sm font-bold text-white tracking-tight font-display">{merchantName || industry.name} — 智能控制中心</h1>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#111] border border-[#2F3336] text-[#8B949E]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1D9BF0] animate-pulse" />
                <span>在线</span>
              </span>
            </div>
            <p className="text-[11px] text-[#8B949E] font-mono mt-0.5">
              {userEmail} • {strategy.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Active human role badge & simulator */}
          <div className="flex items-center space-x-2 border border-[#2F3336] bg-black/40 rounded-lg px-3 py-1.5 text-xs shrink-0 select-none">
            <span className="text-neutral-400 text-[10px] font-mono uppercase tracking-wider">🔒 席位:</span>
            <select
              value={userRole}
              onChange={(e) => {
                if (onUpdateRole) {
                  onUpdateRole(e.target.value as any);
                }
              }}
              className="bg-transparent text-[#1D9BF0] font-bold border-none outline-none focus:ring-0 text-xs py-0 px-1 cursor-pointer font-sans"
            >
              <option value="founder" className="bg-[#09090B] text-white">创始人 (Founder/Owner)</option>
              <option value="manager" className="bg-[#09090B] text-white">副总裁 (Manager)</option>
              <option value="staff" className="bg-[#09090B] text-white">运营员工 (Staff)</option>
              <option value="customer" className="bg-[#09090B] text-white">进店顾客 (Customer)</option>
              <option value="admin" className="bg-[#09090B] text-white">超级管理员 (Admin)</option>
            </select>
          </div>

          <span className="text-xs font-mono text-[#8B949E] bg-neutral-900 border border-[#2F3336] px-2.5 py-1 rounded-lg">
            系统在线
          </span>
          <button
            onClick={onExit}
            className="flex items-center space-x-1 bg-[#1D9BF0]/10 hover:bg-[#1D9BF0]/20 border border-[#1D9BF0]/30 duration-150 px-3 py-1 text-xs text-sky-400 hover:text-white rounded-lg font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>安全退出</span>
          </button>
        </div>
      </header>

      {/* Main Backstage Dashboard Frame (Three Columns Panel) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* SIDE COLUMN 1: LEFT HAND-CRAFTED DARK BACKSTAGE MENU */}
        <aside className="w-full lg:w-56 bg-[#09090B] border-b lg:border-b-0 lg:border-r border-[#2F3336] flex flex-row lg:flex-col shrink-0 overflow-x-auto lg:overflow-x-visible">
          
          <div className="hidden lg:block p-4 border-b border-[#2F3336]/60 bg-black/40">
            <span className="text-[10px] text-[#8B949E] uppercase tracking-wider font-mono block">操作菜单</span>
            <p className="text-[11px] text-neutral-400 font-bold mt-1">系统控制台</p>
          </div>

          <nav className="flex-1 p-2 lg:p-3 flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-1.5 min-w-max lg:min-w-0">
            {[
              { id: 'workbench', label: '工作台', desc: '营运大盘', emoji: '📊', icon: LayoutGrid },
              { id: 'store', label: '店铺', desc: '店面装修', emoji: '🏪', icon: Building2 },
              { id: 'product', label: '产品', desc: '商品管理', emoji: '👗', icon: Package },
              { id: 'order', label: '订单', desc: '订单监控', emoji: '📈', icon: ShoppingCart },
              { id: 'customer', label: '客户', desc: '客户服务', emoji: '👥', icon: Users },
              { id: 'marketing', label: '营销', desc: '营销推广', emoji: '📣', icon: Sparkles },
              { id: 'analytics', label: '分析', desc: '数据统计', emoji: '📊', icon: LineChart },
              { id: 'team_members', label: '团队成员', desc: '专家头像', emoji: '🤖', icon: Award },
              { id: 'settings', label: '设置', desc: '核心设置', emoji: '⚙️', icon: Settings },
            ].map((menuItem) => {
              const Icon = menuItem.icon;
              const isActive = activeMenu === menuItem.id;
              return (
                <button
                  key={menuItem.id}
                  onClick={() => {
                    setActiveMenu(menuItem.id as any);
                    // Append small systemic directive logs when swapping tabs
                    setLogs((prev) => [
                      ...prev,
                      {
                        id: Math.random().toString(),
                        timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                        sender: '后台主页',
                        emoji: '📑',
                        message: `所有者进入【${menuItem.label}】核心工作空间看板。`,
                        type: 'info'
                      }
                    ]);
                  }}
                  className={`w-40 lg:w-full flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-left transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-[#1D9BF0] text-white font-bold shadow-lg border border-[#1D9BF0]/30' 
                      : 'text-[#8B949E] hover:text-white hover:bg-neutral-900/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#8B949E]'}`} />
                  <div className="flex flex-col">
                    <span className="text-xs tracking-tight">{menuItem.label}</span>
                  </div>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden lg:flex p-4 border-t border-[#2F3336]/60 bg-black/40 text-[9px] text-[#8B949E] font-mono flex-col space-y-1">
            <span>底座信息: <span className="text-[#38BDF8] font-bold">ONLINE</span></span>
            <span>运行时间: <span className="text-neutral-400">24H</span></span>
          </div>
        </aside>

        {/* MIDDLE COLUMN 2: ACTIVE DYNAMIC BACKSTAGE CANVAS VIEWPORT */}
        <main className="flex-1 bg-black p-4 lg:p-6 overflow-y-auto border-r border-[#2F3336]/50 flex flex-col space-y-6">
          
          {/* HEADER BAR FOR SELECTED VIEW */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2F3336]/60 pb-3 gap-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#1D9BF0] animate-pulse" />
                <span>{
                  activeMenu === 'workbench' ? '智能大盘' :
                  activeMenu === 'store' ? '店铺装修' :
                  activeMenu === 'product' ? '产品列表' :
                  activeMenu === 'order' ? '订单管理' :
                  activeMenu === 'customer' ? '客诉维权' :
                  activeMenu === 'marketing' ? '营销活动' :
                  activeMenu === 'analytics' ? '收支分析' :
                  activeMenu === 'team_members' ? '团队智能专家' : '安全设置'
                }</span>
              </h2>
              <p className="text-[11px] text-[#8B949E] font-mono mt-0.5">
                {activeMenu === 'workbench' ? '监控收入' :
                 activeMenu === 'store' ? '样式配置' :
                 activeMenu === 'product' ? '商品管理' :
                 activeMenu === 'order' ? '订单处理' :
                 activeMenu === 'customer' ? '纠纷解决' :
                 activeMenu === 'marketing' ? '生成文案' :
                 activeMenu === 'analytics' ? '损益趋势' :
                 activeMenu === 'team_members' ? 'AI专家智能形象绘设' : '接口配置'}
              </p>
            </div>

            <div className="text-[10px] bg-[#111] border border-[#2F3336] px-3 py-1 rounded-full font-mono text-[#8B949E]">
              负责人：<span className="text-white font-bold">{selectedStaff.name}</span>
            </div>
          </div>

          {/* SECONDARY LEVEL DASHBOARD NAVIGATION SUB-MENU */}
          {(() => {
            const getSubTabsForMenu = () => {
              switch (activeMenu) {
                case 'store':
                  return [
                    { id: 'overview', name: '店铺概览', emoji: '🏢' },
                    { id: 'decoration', name: '店铺装修', emoji: '🎨' },
                    { id: 'channels', name: '渠道接收', emoji: '🔌' },
                    { id: 'domain', name: '域名设置', emoji: '🌐' },
                    { id: 'brand', name: '品牌设置', emoji: '✨' },
                    { id: 'seo', name: 'SEO设置', emoji: '🔍' }
                  ];
                case 'product':
                  return [
                    { id: 'list', name: '产品列表', emoji: '👗' },
                    { id: 'categories', name: '分类管理', emoji: '🗂' },
                    { id: 'inventory', name: '库存管理', emoji: '📊' },
                    { id: 'sku', name: 'SKU管理', emoji: '🎟' },
                    { id: 'suppliers', name: '供应商', emoji: '🤝' },
                    { id: 'purchase', name: '采购单', emoji: '📝' }
                  ];
                case 'order':
                  return [
                    { id: 'all', name: '全部订单', emoji: '📈' },
                    { id: 'draft', name: '草稿订单', emoji: '📝' },
                    { id: 'refund', name: '退款订单', emoji: '💸' },
                    { id: 'aftersales', name: '售后管理', emoji: '🛡' },
                    { id: 'tracking', name: '物流跟踪', emoji: '🚚' }
                  ];
                case 'customer':
                  return [
                    { id: 'list', name: '客户列表', emoji: '👥' },
                    { id: 'tags', name: '客户标签', emoji: '🏷' },
                    { id: 'segments', name: '客户分群', emoji: '🎯' },
                    { id: 'membership', name: '会员等级', emoji: '💎' },
                    { id: 'b2b', name: '企业客户(B2B)', emoji: '🏢' }
                  ];
                case 'marketing':
                  return [
                    { id: 'coupon', name: '优惠券', emoji: '🎫' },
                    { id: 'campaign', name: '活动中心', emoji: '🎡' },
                    { id: 'email', name: '邮件营销', emoji: '✉' },
                    { id: 'sms', name: '短信营销', emoji: '💬' },
                    { id: 'ai', name: 'AI营销', emoji: '🤖' }
                  ];
                case 'analytics':
                  return [
                    { id: 'sales', name: '销售分析', emoji: '📈' },
                    { id: 'customer', name: '客户分析', emoji: '👥' },
                    { id: 'product', name: '商品分析', emoji: '🛍' },
                    { id: 'marketing', name: '营销分析', emoji: '📣' },
                    { id: 'realtime', name: '实时数据', emoji: '⚡' }
                  ];
                default:
                  return null;
              }
            };

            const getActiveSubTab = () => {
              if (activeMenu === 'store') return storeSubTab;
              if (activeMenu === 'product') return productSubTab;
              if (activeMenu === 'order') return orderSubTab;
              if (activeMenu === 'customer') return customerSubTab;
              if (activeMenu === 'marketing') return marketingSubTab;
              if (activeMenu === 'analytics') return analyticsSubTab;
              return '';
            };

            const setSubTab = (id: string) => {
              if (activeMenu === 'store') setStoreSubTab(id as any);
              else if (activeMenu === 'product') setProductSubTab(id as any);
              else if (activeMenu === 'order') setOrderSubTab(id as any);
              else if (activeMenu === 'customer') setCustomerSubTab(id as any);
              else if (activeMenu === 'marketing') setMarketingSubTab(id as any);
              else if (activeMenu === 'analytics') setAnalyticsSubTab(id as any);
            };

            const subTabs = getSubTabsForMenu();
            if (!subTabs) return null;
            const currentSubTab = getActiveSubTab();
            return (
              <div className="flex items-center space-x-1 p-1 bg-[#09090B] border border-[#2F3336]/60 rounded-xl overflow-x-auto min-w-0 shrink-0 scrollbar-none">
                {subTabs.map((subTab) => {
                  const isActive = currentSubTab === subTab.id;
                  return (
                    <button
                      key={subTab.id}
                      onClick={() => setSubTab(subTab.id)}
                      className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium duration-150 shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#1D9BF0]/15 border border-[#1D9BF0]/35 text-sky-450 font-bold'
                          : 'text-[#8B949E] hover:text-white hover:bg-neutral-900 border border-transparent'
                      }`}
                    >
                      <span className="text-xs">{subTab.emoji}</span>
                      <span>{subTab.name}</span>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* ACTIVE RENDER CONTENT BODY PANEL */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex-1 flex flex-col space-y-6"
            >
              
              {/* VIEW 1: WORKBENCH (📊 工作台) */}
              {activeMenu === 'workbench' && (
                <div className="space-y-6">
                  {/* Grid cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#09090B] border border-[#2F3336] p-4 rounded-xl flex flex-col justify-between h-28 text-left animate-fadeIn">
                      <p className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider">今日累计收入</p>
                      <span className="text-lg font-bold font-mono tracking-tight text-white mt-1">
                        ¥ {sales.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] text-sky-400 font-mono mt-auto flex items-center space-x-1">
                        <TrendingUp className="w-2.5 h-2.5" />
                        <span>自动增加28%</span>
                      </span>
                    </div>

                    <div className="bg-[#09090B] border border-[#2F3336] p-4 rounded-xl flex flex-col justify-between h-28 text-left animate-fadeIn">
                      <p className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider">成单数量</p>
                      <span className="text-lg font-bold font-mono tracking-tight text-white mt-1">{orders} 笔</span>
                      <span className="text-[9px] text-[#8B949E] font-mono mt-auto">处理完毕</span>
                    </div>

                    <div className="bg-[#09090B] border border-[#2F3336] p-4 rounded-xl flex flex-col justify-between h-28 text-left animate-fadeIn">
                      <p className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider">数字员工</p>
                      <span className="text-lg font-bold font-mono text-[#1D9BF0] mt-1">4位智能在岗</span>
                      <span className="text-[9px] text-sky-400 font-mono mt-auto flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                        <span>持续运行</span>
                      </span>
                    </div>

                    <div className="bg-[#09090B] border border-[#2F3336] p-4 rounded-xl flex flex-col justify-between h-28 text-left animate-fadeIn">
                      <p className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider">节省成本</p>
                      <span className="text-lg font-bold font-mono tracking-tight text-white mt-1">¥ 1,540 /天</span>
                      <span className="text-[9px] text-neutral-400 font-mono mt-auto">降本增效</span>
                    </div>
                  </div>

                  {/* Cumulative Sales SVG slope chart */}
                  <div className="bg-[#09090B] border border-[#2F3336] p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-3 text-left">
                      <span className="text-xs font-mono text-[#8B949E] uppercase tracking-wider">销售趋势</span>
                      <span className="text-[9px] bg-neutral-900 border border-[#2F3336] px-2 py-0.5 rounded font-mono text-sky-400">实时更新</span>
                    </div>
                    {/* SVG Curve */}
                    <div className="h-32 w-full relative">
                      <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1D9BF0" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#1D9BF0" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path 
                          d="M0,90 Q40,65 80,72 T160,50 T240,42 T320,25 T400,10 L400,100 L0,100 Z" 
                          fill="url(#chartGrad)" 
                        />
                        <path 
                          d="M0,90 Q40,65 80,72 T160,50 T240,42 T320,25 T400,10" 
                          fill="none" 
                          stroke="#1D9BF0" 
                          strokeWidth="2" 
                        />
                        <circle cx="80" cy="72" r="3" fill="#ffffff" />
                        <circle cx="160" cy="50" r="3" fill="#ffffff" />
                        <circle cx="320" cy="25" r="3" fill="#ffffff" stroke="#1D9BF0" strokeWidth="1" />
                        <circle cx="400" cy="10" r="4" fill="#1D9BF0" className="animate-pulse" />
                      </svg>
                      {/* X labels */}
                      <div className="flex justify-between text-[8px] font-mono text-[#8B949E] mt-1.5">
                        <span>08:00</span>
                        <span>10:00</span>
                        <span>12:00</span>
                        <span>14:00</span>
                        <span>16:00</span>
                      </div>
                    </div>
                  </div>

                  {/* Manual direct controls */}
                  <div className="bg-[#09090B] border border-[#2F3336] p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">快捷操作</span>
                      <span className="text-[9px] text-[#8B949E]">CONTROL</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <button 
                        type="button"
                        onClick={() => triggerQuickMacro('ad_boost')}
                        className="bg-neutral-950 border border-[#2F3336] hover:border-[#1D9BF0] hover:bg-[#1D9BF0]/5 duration-200 p-3 rounded-xl text-left cursor-pointer group active:scale-95"
                      >
                        <span className="text-sm">📣</span>
                        <p className="text-xs font-bold text-white mt-1 group-hover:text-sky-400">推广投放</p>
                        <p className="text-[10px] text-[#8B949E] mt-0.5">一键推广</p>
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => triggerQuickMacro('inventory_sync')}
                        className="bg-neutral-950 border border-[#2F3336] hover:border-[#1D9BF0] hover:bg-[#1D9BF0]/5 duration-200 p-3 rounded-xl text-left cursor-pointer group active:scale-95"
                      >
                        <span className="text-sm">📦</span>
                        <p className="text-xs font-bold text-white mt-1 group-hover:text-sky-400">货源快反</p>
                        <p className="text-[10px] text-[#8B949E] mt-0.5">一键补货</p>
                      </button>

                      <button 
                        type="button"
                        onClick={() => triggerQuickMacro('audit_reconcile')}
                        className="bg-[#09090B] border border-[#2F3336] hover:border-[#1D9BF0] hover:bg-[#1D9BF0]/5 duration-200 p-3 rounded-xl text-left cursor-pointer group active:scale-95"
                      >
                        <span className="text-sm">🪙</span>
                        <p className="text-xs font-bold text-white mt-1 group-hover:text-sky-400">对账合并</p>
                        <p className="text-[10px] text-[#8B949E] mt-0.5">自动核对</p>
                      </button>

                      <button 
                        type="button"
                        onClick={() => triggerQuickMacro('customer_crm')}
                        className="bg-neutral-950 border border-[#2F3336] hover:border-[#1D9BF0] hover:bg-[#1D9BF0]/5 duration-200 p-3 rounded-xl text-left cursor-pointer group active:scale-95"
                      >
                        <span className="text-sm">💬</span>
                        <p className="text-xs font-bold text-white mt-1 group-hover:text-sky-400">纠纷处理</p>
                        <p className="text-[10px] text-[#8B949E] mt-0.5">极速安抚</p>
                      </button>
                    </div>
                  </div>

                  {/* Logs ticker layout */}
                  <div className="bg-[#09090B] border border-[#2F3336] rounded-xl flex flex-col h-[280px] overflow-hidden">
                    <div className="bg-[#0d0d0f] border-b border-[#2F3336] px-4 py-2.5 flex items-center justify-between shrink-0">
                      <span className="text-xs font-mono text-[#8B949E] uppercase tracking-wider">系统监控日志</span>
                      <span className="text-[9px] bg-[#1D9BF0]/15 text-[#38BDF8] border border-[#1D9BF0]/20 px-2 py-0.5 rounded">ONLINE</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-[11px] bg-black text-left">
                      {logs.slice(-30).map((log) => (
                        <div key={log.id} className="p-2 border border-[#2F3336]/40 bg-[#070708] rounded-lg">
                          <div className="flex justify-between items-center text-[9px] text-[#8B949E] mb-1">
                            <span className="font-bold text-neutral-300 flex items-center space-x-1">
                              <span>{log.emoji}</span>
                              <span>{log.sender}</span>
                            </span>
                            <span>{log.timestamp}</span>
                          </div>
                          <p className="text-neutral-200 leading-relaxed text-[11px] pl-1.5 border-l border-[#1D9BF0]">{log.message}</p>
                        </div>
                      ))}
                      <div ref={bottomLogsRef} />
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: STORE装饰 (🏪 店铺) */}
              {activeMenu === 'store' && (
                <>
                  {/* Overview Screen */}
                  {storeSubTab === 'overview' && (
                    <div className="bg-[#09090B] border border-[#2F3336] p-6 rounded-xl space-y-6 animate-fadeIn text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2F3336]/60 pb-4 gap-4">
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                            <span className="text-sky-400">🏪</span>
                            <span>店铺线上状态及基础配置概览</span>
                          </h3>
                          <p className="text-[10px] text-zinc-500 mt-1">检测边缘节点及分布式静态网页运行就绪指标</p>
                        </div>
                        
                        <div className="flex items-center space-x-3 bg-black/60 border border-[#2F3336] px-4 py-2.5 rounded-xl">
                          <span className={`w-2 h-2 rounded-full ${isStoreOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                          <span className="text-[11px] font-bold text-zinc-300">
                            {isStoreOnline ? '店面线上营业中' : '店面自配打烊中'}
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              const nextState = !isStoreOnline;
                              setIsStoreOnline(nextState);
                              await setDoc(doc(db, 'tenants', tenantId), { isStoreOnline: nextState }, { merge: true })
                                .then(() => {
                                  setLogs(prev => [
                                    ...prev,
                                    {
                                      id: Math.random().toString(),
                                      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                      sender: '系统核心',
                                      emoji: '🔌',
                                      message: `店面营业状态已同步修改为：【${nextState ? '营业中 ONLINE' : '打烊 OFFLINE'}】。顾客端网站已全流量生效。`,
                                      type: 'success'
                                    }
                                  ]);
                                })
                                .catch(err => handleFirestoreError(err, OperationType.UPDATE, 'tenants/' + tenantId));
                            }}
                            className={`px-3 py-1 text-[10px] font-extrabold rounded cursor-pointer ${isStoreOnline ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                          >
                            {isStoreOnline ? '拉闸停业' : '一键营业'}
                          </button>
                        </div>
                      </div>

                      {/* Info panels */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-black/40 border border-[#2F3336] p-4 rounded-xl space-y-1.5">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">前台店点单网口</span>
                          <a 
                            href="https://ais-dev-tz6cp6zgpu3agngra5xchs-478988042930.europe-west2.run.app" 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs text-sky-450 hover:underline inline-flex items-center space-x-1 font-bold"
                          >
                            <span>点我打开前向订餐流 🛍</span>
                            <Globe className="w-3 h-3" />
                          </a>
                          <span className="text-[9px] text-[#8B949E] block mt-4 bg-zinc-950/40 p-1.5 rounded font-mono">
                            URL: shusi-fashion.modaui.com
                          </span>
                        </div>

                        <div className="bg-black/40 border border-[#2F3336] p-4 rounded-xl space-y-1.5">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">安全证书 SSL / CDN</span>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-emerald-500 text-xs">✔</span>
                            <span className="text-xs text-zinc-300 font-mono">Let's Encrypt 100％ 加密</span>
                          </div>
                          <span className="text-[9px] text-zinc-500 block leading-relaxed mt-2">
                            边缘加速：万兆光纤多播路由节点就绪
                          </span>
                        </div>

                        <div className="bg-black/40 border border-[#2F3336] p-4 rounded-xl space-y-1.5">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">页面自然搜索引擎收录</span>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[#1D9BF0] text-xs">ℹ</span>
                            <span className="text-xs text-sky-400 font-mono">Baidu / Google 已全权重抓取</span>
                          </div>
                          <span className="text-[9px] text-zinc-500 block leading-relaxed mt-2">
                            每24h自动推流全网 sitemap 节点树索引
                          </span>
                        </div>
                      </div>

                      {/* Store Live Activity simulation card */}
                      <div className="bg-[#111] border border-[#2F3336] p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-200">👥 店内实时买家足迹 (实时仿真流)</span>
                          <span className="px-2 py-0.5 rounded text-[8.5px] bg-[#1D9BF0]/15 text-sky-400 font-mono">
                            7人在线
                          </span>
                        </div>
                        
                        <div className="bg-black p-3 rounded-lg border border-[#2F3336] space-y-2 text-[11px] font-mono leading-relaxed">
                          <div className="flex items-center justify-between text-neutral-400">
                            <span>- 游客 [IP: 120.244.11.*]</span>
                            <span className="text-sky-505 font-bold text-[10px] tracking-tight">正在挑选商品规格...</span>
                          </div>
                          <div className="flex items-center justify-between text-neutral-400">
                            <span>- 游客 [IP: 221.11.83.*]</span>
                            <span className="text-amber-500 font-bold text-[10px] tracking-tight">将招牌单品装入了购物车</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {storeSubTab === 'decoration' && (
                    <StorefrontView 
                      tenantId={tenantId}
                      industryId={industry.id || 'catering'}
                      onAddLog={(sender, emoji, msg, type) => setLogs(prev => [
                        ...prev, 
                        { id: Math.random().toString(), timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }), sender, emoji, message: msg, type }
                      ])}
                    />
                  )}

                  {storeSubTab === 'channels' && (
                    <ChannelsView 
                      tenantId={tenantId}
                      onAddLog={(sender, emoji, msg, type) => setLogs(prev => [
                        ...prev, 
                        { id: Math.random().toString(), timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }), sender, emoji, message: msg, type }
                      ])}
                    />
                  )}

                  {storeSubTab === 'decoration_legacy' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Controls */}
                  <div className="md:col-span-5 bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#8B949E]">店铺装修</h3>
                      <p className="text-[10px] text-zinc-500 mt-0.5">配置海报标语</p>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 font-mono">宣发标语</label>
                      <input 
                        type="text" 
                        value={storeHeadline}
                        onChange={(e) => setStoreHeadline(e.target.value)}
                        className="w-full bg-black border border-[#2F3336] rounded-lg p-2 text-xs text-white focus:border-[#1D9BF0] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-neutral-400 font-mono block">风格挑选</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'retro', label: '奶油法式 🧺' },
                          { id: 'dark', label: '潮冷暗黑 🛹' },
                          { id: 'classic', label: '现代极简 🏛️' }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => setStoreTheme(t.id as any)}
                            className={`p-2 rounded border text-[11px] cursor-pointer transition-all duration-150 ${storeTheme === t.id ? 'border-[#1D9BF0] bg-[#1D9BF0]/10 text-white font-bold' : 'border-[#2F3336] bg-black text-[#8B949E]'}`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="w-full h-px bg-[#2F3336]/60" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-neutral-400 font-mono block">模拟流量</span>
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8px] bg-emerald-500/10 text-sky-400">
                          网关就绪
                        </span>
                      </div>
                      
                      <div className="p-3 bg-black/60 rounded-xl border border-[#2F3336] space-y-2.5">
                        <label className="flex items-start space-x-2.5 text-[11px] font-mono cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={autoOrderInterval}
                            onChange={(e) => {
                              setAutoOrderInterval(e.target.checked);
                              setLogs(prev => [
                                ...prev,
                                {
                                  id: Math.random().toString(),
                                  timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                  sender: '系统核心',
                                  emoji: '⚙️',
                                  message: e.target.checked 
                                    ? '🔔 开启仿真繁忙订购流：后台多线程 model 已启动并运行中，持续自动投放模拟流量，加速店面订单结款吞吐！'
                                    : '⏸️ 暂停仿真订购流：流式订单产生器已关闭，切回静置听诊模式。',
                                  type: e.target.checked ? 'success' : 'info'
                                }
                              ]);
                            }}
                            className="mt-0.5 accent-[#1D9BF0] w-3.5 h-3.5 rounded border-[#2F3336] bg-black" 
                          />
                          <div>
                            <span className="font-bold text-zinc-300">繁忙仿真</span>
                            <p className="text-[9.5px] text-zinc-500 mt-0.5 leading-relaxed">
                              循环产生订单流
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-neutral-400 font-mono block">区块排版</span>
                      <div className="space-y-1.5 text-[11px] font-mono">
                        <label className="flex items-center space-x-2 p-2 bg-black/40 border border-[#2F3336] rounded">
                          <input type="checkbox" defaultChecked className="accent-[#1D9BF0]" />
                          <span>展现宣传图</span>
                        </label>
                        <label className="flex items-center space-x-2 p-2 bg-black/40 border border-[#2F3336] rounded">
                          <input type="checkbox" defaultChecked className="accent-[#1D9BF0]" />
                          <span>展现瀑布流</span>
                        </label>
                        <label className="flex items-center space-x-2 p-2 bg-black/40 border border-[#2F3336] rounded text-neutral-500">
                          <input type="checkbox" className="accent-[#1D9BF0]" />
                          <span>展现穿搭栏</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setIsGeneratingWebsite(true);
                          setLogs((prev) => [
                            ...prev,
                            {
                              id: Math.random().toString(),
                              timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                              sender: selectedStaff.role,
                              emoji: selectedStaff.emoji,
                              message: `【${selectedStaff.name}】正在全自动解析“${storeHeadline}”布局参数，生成并推流最新的线上展示网页至云CDN服务器。`,
                              type: 'info'
                            }
                          ]);
                          setTimeout(() => {
                            setIsGeneratingWebsite(false);
                            setLogs((prev) => [
                              ...prev,
                              {
                                id: Math.random().toString(),
                                timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                sender: selectedStaff.role,
                                emoji: selectedStaff.emoji,
                                message: `✔ 部署完成！全新的线上展示网页已通过 HTML5 规范编译生效，已缓存并面向全网公开。 (CDN 缓存就绪)`,
                                type: 'success'
                              }
                            ]);
                          }, 2200);
                        }}
                        disabled={isGeneratingWebsite || isPublishing}
                        className="py-3 bg-zinc-900 hover:bg-neutral-900 border border-[#2F3336] duration-150 rounded-lg text-xs font-bold text-white cursor-pointer select-none active:scale-98 flex items-center justify-center space-x-1.5 disabled:opacity-50"
                      >
                        {isGeneratingWebsite ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>生成中...</span>
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-3.5 h-3.5 text-sky-400" />
                            <span>智能装修</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setIsPublishing(true);
                          setLogs((prev) => [
                            ...prev,
                            {
                              id: Math.random().toString(),
                              timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                              sender: selectedStaff.role,
                              emoji: selectedStaff.emoji,
                              message: `【一键发布】启动中：正在编译生成“${storeHeadline}”官网资产、同步推流至云服务器部署中...`,
                              type: 'info'
                            }
                          ]);
                          
                          localStorage.setItem('preview_theme', storeTheme);
                          localStorage.setItem('preview_headline', storeHeadline);
                          localStorage.setItem('preview_company', industry.name);
                          localStorage.setItem('preview_industry_id', industry.id || 'catering');
                          localStorage.setItem('preview_products', JSON.stringify(productsList));
                          localStorage.setItem('preview_tenant_id', tenantId);

                          // Real database sync for multi-device/multi-end design connectivity in the tenant profile
                          const tenantDocRef = doc(db, 'tenants', tenantId);
                          setDoc(tenantDocRef, {
                            merchantName: industry.name,
                            companySlogan: storeHeadline,
                            storeTheme: storeTheme,
                            industryId: industry.id || 'catering',
                            status: 'active'
                          }, { merge: true }).catch(err => console.error("Firestore tenant publish sync error: ", err));

                          setTimeout(() => {
                            setIsPublishing(false);
                            setIsPublishModalOpen(true);
                            setLogs((prev) => [
                              ...prev,
                              {
                                id: Math.random().toString(),
                                timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                sender: selectedStaff.role,
                                emoji: selectedStaff.emoji,
                                message: `✔ 【一键发布成功】全包装官网与 App 小程序已极速同步上线！`,
                                type: 'success'
                              }
                            ]);
                            try {
                              window.open(window.location.origin + '?preview=true', '_blank');
                            } catch (e) {
                              console.error('Popup blocker prevented opening preview tab automatically.', e);
                            }
                          }, 1500);
                        }}
                        disabled={isGeneratingWebsite || isPublishing}
                        className="py-3 bg-[#1D9BF0] hover:bg-[#38BDF8] duration-150 rounded-lg text-xs font-bold text-white cursor-pointer select-none active:scale-98 flex items-center justify-center space-x-1.5 disabled:opacity-50 border border-sky-500/10 shadow-[0_4px_12px_rgba(31,111,84,0.15)]"
                      >
                        {isPublishing ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>同步中...</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-3.5 h-3.5" />
                            <span>一键发布</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Right Live Device Preview */}
                  <div className="md:col-span-7 flex flex-col items-center justify-center bg-neutral-950 border border-[#2F3336] p-4 rounded-xl min-h-[460px] relative overflow-hidden group">
                    <span className="absolute top-2.5 left-3 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">手机预览</span>
                    
                    <div className="absolute top-2.5 right-3 flex items-center space-x-1.5 bg-[#111] px-2 py-0.5 rounded border border-[#2F3336] shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] font-mono text-zinc-400">点单就绪</span>
                    </div>

                    {/* Theme colors dynamic variables calculations */}
                    {(() => {
                      const isRetro = storeTheme === 'retro';
                      const isDark = storeTheme === 'dark';
                      const itemCardBg = isRetro ? 'bg-amber-100/20 border-[#9E9685]/20 hover:border-amber-500/50' : isDark ? 'bg-neutral-900/40 border-neutral-800 hover:border-sky-500/50' : 'bg-white border-gray-150 hover:border-sky-500/50';
                      const cardHeadingText = isRetro ? 'text-amber-950 font-bold' : isDark ? 'text-white' : 'text-slate-900';
                      
                      return (
                        <div className="w-full max-w-[285px] bg-[#0c0c0e] border-[6px] border-neutral-800 rounded-[32px] h-[460px] shadow-2xl relative flex flex-col overflow-hidden transition-all duration-300 group-hover:border-neutral-700">
                          {/* Top Notch */}
                          <div className="absolute top-0 inset-x-0 h-4 bg-black flex items-center justify-center z-10 select-none">
                            <div className="w-16 h-3 bg-neutral-900 rounded-b-xl" />
                          </div>

                          {/* Device screen */}
                          <div className={`flex-1 flex flex-col relative h-full overflow-hidden ${isRetro ? 'bg-[#FCFAF2] text-zinc-900' : isDark ? 'bg-neutral-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
                            
                            {/* Scrollable View Area */}
                            <div className="flex-1 overflow-y-auto pt-4 pb-12 px-2 custom-scrollbar min-h-0 flex flex-col">
                              
                              {/* SCREEN 1: HOME 首页 */}
                              {simulatorTab === 'home' && (
                                <div className="space-y-2.5 animate-fadeIn text-left flex-1 flex flex-col">
                                  {/* Tyson Cafe Banner Header */}
                                  <div className="rounded-2xl p-3 bg-gradient-to-br from-[#1b1e1a] to-[#2d3a2f] text-white relative overflow-hidden shadow-sm mt-1">
                                    <div className="absolute right-2 top-2 opacity-10"><Flame className="w-10 h-10" /></div>
                                    <div className="flex justify-between items-center">
                                      <span className="font-extrabold text-[13px] tracking-tight text-amber-100 flex items-center">
                                        ☕ Tyson Cafe <span className="bg-red-500 text-white font-mono text-[7px] px-1 py-0.5 rounded ml-1 animate-pulse">AI店</span>
                                      </span>
                                      <span className="text-[7.5px] px-1.5 py-0.5 bg-white/10 rounded-full">AI团队为您服务 👩‍🍳</span>
                                    </div>
                                    <p className="text-[8px] text-zinc-300 mt-1">今日营业 10:00 - 22:00 • ⭐ 4.9</p>
                                    <div className="flex items-center space-x-1.5 mt-2 border-t border-white/10 pt-1.5">
                                      <div className="flex -space-x-1">
                                        <div className="w-3.5 h-3.5 rounded-full bg-orange-500 text-[6.5px] flex items-center justify-center font-bold text-white border border-black">Kai</div>
                                        <div className="w-3.5 h-3.5 rounded-full bg-teal-600 text-[6.5px] flex items-center justify-center font-bold text-white border border-black">Ren</div>
                                        <div className="w-3.5 h-3.5 rounded-full bg-purple-500 text-[6.5px] flex items-center justify-center font-bold text-white border border-black">Mimi</div>
                                      </div>
                                      <span className="text-[7.5px] text-emerald-200">已有 3268 人扫码点单</span>
                                    </div>
                                  </div>

                                  {/* Quick shortcuts */}
                                  <div className="grid grid-cols-4 gap-1 py-1 text-center font-bold text-zinc-550 text-[8.5px]">
                                    {[
                                      { emoji: '🎟️', label: '优惠活动', act: () => { setCouponApplied(true); playLiveOrderChime(); } },
                                      { emoji: '👑', label: '会员中心', act: () => setSimulatorTab('mine') },
                                      { emoji: '📋', label: '我的订单', act: () => setSimulatorTab('mine') },
                                      { emoji: 'ℹ️', label: '店铺信息', act: () => setSimulatorTab('menu') }
                                    ].map((sh, idx) => (
                                      <div key={idx} onClick={sh.act} className="p-1 hover:bg-neutral-500/5 rounded transition-all cursor-pointer">
                                        <div className="text-sm">{sh.emoji}</div>
                                        <div className="scale-90 mt-0.5 whitespace-nowrap active:text-sky-500">{sh.label}</div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* AI Intelligent banner suggestion */}
                                  <div className="p-2 bg-amber-500/5 rounded-xl border border-amber-500/10 text-left relative overflow-hidden bg-gradient-to-r from-amber-50/20 to-orange-100/10">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[8px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold px-1 rounded">AI 为您精心推荐 ☕</span>
                                      <span onClick={() => setSimulatorTab('menu')} className="text-[7.5px] text-amber-600 hover:underline cursor-pointer">菜单挑选 ➔</span>
                                    </div>
                                    <p className="text-[7.5px] text-zinc-500 mt-1 leading-normal">
                                      今日气温微凉，系统自动为您推荐一杯浓香温热的【生椰拿铁】搭配冷藏【提拉米苏】。
                                    </p>
                                  </div>

                                  {/* Hot Recommendations Section */}
                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-extrabold text-[9.5px]">🔥 热销推荐 (Top list)</span>
                                      <span onClick={() => setSimulatorTab('menu')} className="text-[8px] text-zinc-550 hover:underline cursor-pointer">查看更多</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {productsList.slice(0, 2).map((p) => (
                                        <div key={p.id} onClick={() => setSelectedDetailProduct(p)} className="p-1.5 rounded-lg border border-neutral-200 bg-white/50 backdrop-blur-sm shadow-sm relative flex flex-col justify-between cursor-pointer hover:border-sky-500">
                                          <span className="absolute top-1 left-1 bg-rose-500 text-white font-mono font-bold text-[6px] px-1 rounded shadow">TOP</span>
                                          <div className="text-center py-1 text-2xl filter drop-shadow">{p.image}</div>
                                          <div className="text-[8px] font-bold truncate">{p.name}</div>
                                          <p className="text-[6.5px] text-zinc-400 truncate mb-1">{p.desc}</p>
                                          <div className="flex justify-between items-center">
                                            <span className="text-[8.5px] font-bold text-amber-605">¥{p.price}</span>
                                            <span className="w-3.5 h-3.5 rounded-full bg-[#1D9BF0] text-white flex items-center justify-center font-bold text-[10px]">+</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* SCREEN 2: MENU 菜单 */}
                              {simulatorTab === 'menu' && (
                                <div className="space-y-1.5 animate-fadeIn text-left flex-1 flex flex-col">
                                  {/* Top Search bar */}
                                  <div className="relative mb-1">
                                    <Search className="w-3 h-3 absolute left-1.5 top-1.5 text-zinc-400" />
                                    <input
                                      type="text"
                                      placeholder="提拉米苏, 生椰拿铁..."
                                      value={simulatorSearchQuery}
                                      onChange={(e) => setSimulatorSearchQuery(e.target.value)}
                                      className="w-full text-[8.5px] bg-white/20 border border-neutral-300 px-5 py-1 rounded focus:outline-none focus:border-sky-500"
                                    />
                                  </div>

                                  <div className="flex flex-1 min-h-[220px]">
                                    {/* Left Category selector */}
                                    <div className="w-14 border-r border-[#1D9BF0]/10 pr-1 flex flex-col space-y-1">
                                      {['全部', '咖啡', '饮品', '甜品'].map((cat) => (
                                        <button
                                          key={cat}
                                          onClick={() => setSimulatorCategory(cat)}
                                          className={`py-1.5 px-0.5 rounded text-[8.5px] font-bold text-center transition-all ${
                                            simulatorCategory === cat
                                              ? 'bg-[#1D9BF0] text-white'
                                              : 'text-zinc-500 hover:bg-neutral-500/5'
                                          }`}
                                        >
                                          {cat}
                                        </button>
                                      ))}
                                    </div>

                                    {/* Right product shelf */}
                                    <div className="flex-1 pl-2 space-y-1 overflow-y-auto max-h-[220px] custom-scrollbar">
                                      {productsList
                                        .filter(p => {
                                          if (simulatorCategory !== '全部' && p.category !== simulatorCategory) return false;
                                          if (simulatorSearchQuery && !p.name.includes(simulatorSearchQuery)) return false;
                                          return true;
                                        })
                                        .map(p => {
                                          const isHot = p.name === '冰美式' || p.name === '生椰拿铁';
                                          return (
                                            <div
                                              key={p.id}
                                              onClick={() => setSelectedDetailProduct(p)}
                                              className="p-1 rounded bg-white dark:bg-neutral-900 border border-neutral-150 flex items-center justify-between cursor-pointer hover:border-sky-500 transition-all"
                                            >
                                              <div className="flex items-center space-x-1.5 min-w-0">
                                                <span className="text-xl select-none">{p.image}</span>
                                                <div className="min-w-0">
                                                  <div className="font-bold text-[8.5px] flex items-center truncate">
                                                    {p.name}
                                                    {isHot && <span className="bg-red-500 text-white font-mono scale-75 px-1 rounded ml-0.5 text-[5px]">热销</span>}
                                                  </div>
                                                  <span className="text-[6.5px] text-zinc-400 block truncate w-24">{p.desc}</span>
                                                  <span className="text-[8px] text-amber-600 font-bold">¥{p.price}</span>
                                                </div>
                                              </div>
                                              <span className="w-3.5 h-3.5 rounded-full bg-[#1D9BF0] text-white flex items-center justify-center font-bold text-[10px] shrink-0">+</span>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* SCREEN 3: CART 购物车 */}
                              {simulatorTab === 'cart' && (
                                <div className="space-y-1.5 animate-fadeIn text-left flex-1 flex flex-col">
                                  <div className="flex justify-between items-center border-b border-neutral-200 pb-1">
                                    <span className="font-extrabold text-[9px]">🛒 我的购物车 (Cart)</span>
                                    {customerCart.length > 0 && (
                                      <button onClick={() => setCustomerCart([])} className="text-[7.5px] text-rose-500 hover:underline">清空</button>
                                    )}
                                  </div>

                                  {customerCart.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-2">
                                      <span className="text-3xl">☕</span>
                                      <p className="text-[8.5px] text-zinc-400 text-center leading-normal">
                                        购物车空空如也，<br />快去点杯香醇咖啡吧！
                                      </p>
                                      <button onClick={() => setSimulatorTab('menu')} className="px-3 py-1 bg-[#1D9BF0] text-white text-[8px] font-bold rounded-lg hover:bg-[#38BDF8] transition-all">去点餐</button>
                                    </div>
                                  ) : (
                                    <div className="space-y-1 overflow-y-auto max-h-[205px] custom-scrollbar flex-1">
                                      {customerCart.map((item, idx) => (
                                        <div key={idx} className="p-1 bg-white dark:bg-neutral-900 border border-neutral-150 rounded flex items-center justify-between">
                                          <div className="flex items-center space-x-1.5 min-w-0">
                                            <span className="text-lg select-none shrink-0">{item.image}</span>
                                            <div className="min-w-0">
                                              <div className="font-bold text-[8.5px] truncate">{item.rawName || item.name}</div>
                                              <p className="text-[6.5px] text-emerald-600 truncate w-24 mt-0.5">{item.customSpecs || '中杯/标准'}</p>
                                              <span className="text-[8px] text-amber-600 font-bold">¥{item.price}</span>
                                            </div>
                                          </div>

                                          {/* Counter */}
                                          <div className="flex items-center space-x-1 shrink-0">
                                            <button
                                              onClick={() => {
                                                setCustomerCart(p => p.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it));
                                              }}
                                              className="w-3.5 h-3.5 bg-neutral-100 text-zinc-700 hover:bg-neutral-200 rounded flex items-center justify-center font-bold text-[8px]"
                                            >
                                              -
                                            </button>
                                            <span className="text-[8.5px] font-bold font-mono w-2.5 text-center">{item.quantity}</span>
                                            <button
                                              onClick={() => {
                                                setCustomerCart(p => p.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it));
                                              }}
                                              className="w-3.5 h-3.5 bg-[#1D9BF0] text-white hover:bg-emerald-600 rounded flex items-center justify-center font-bold text-[8px]"
                                            >
                                              +
                                            </button>
                                          </div>
                                        </div>
                                      ))}

                                      {/* Offer Voucher row */}
                                      <div className="p-1 px-2 rounded-lg bg-rose-500/5 border border-rose-500/10 flex justify-between items-center text-[7.5px] text-[#1D9BF0]">
                                        <span className="font-bold">✨ 平台优惠券可用</span>
                                        <button onClick={() => setCouponApplied(!couponApplied)} className="underline cursor-pointer font-extrabold">{couponApplied ? '已减12元' : '可抵扣12元'}</button>
                                      </div>

                                      {/* Checkout section */}
                                      <div className="border-t border-dashed border-neutral-200 pt-1.5 text-right">
                                        <div className="text-[8px] text-zinc-600">
                                          合计: <span className="font-extrabold text-[10px] text-amber-655">¥ {(customerCart.reduce((s, it) => s + (it.price * it.quantity), 0) - (couponApplied ? 12 : 0)).toFixed(2)}</span>
                                        </div>
                                        <button
                                          onClick={() => setSimulatorTab('checkout')}
                                          className="w-full mt-1.5 py-1.5 bg-[#1D9BF0] text-white hover:bg-[#38BDF8] font-bold text-[9px] rounded-lg shadow-sm"
                                        >
                                          去结算 ➔
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* SCREEN 2: MENU 菜单 */}
                              {simulatorTab === 'menu' && (
                                <div className="space-y-1.5 animate-fadeIn text-left flex-1 flex flex-col">
                                  {/* Top Search bar */}
                                  <div className="relative mb-1">
                                    <Search className="w-3 h-3 absolute left-1.5 top-1.5 text-zinc-400" />
                                    <input
                                      type="text"
                                      placeholder="提拉米苏, 生椰拿铁..."
                                      value={simulatorSearchQuery}
                                      onChange={(e) => setSimulatorSearchQuery(e.target.value)}
                                      className="w-full text-[8.5px] bg-white/20 border border-neutral-300 px-5 py-1 rounded focus:outline-none focus:border-sky-500"
                                    />
                                  </div>

                                  <div className="flex flex-1 min-h-[220px]">
                                    {/* Left Category selector */}
                                    <div className="w-14 border-r border-[#1D9BF0]/10 pr-1 flex flex-col space-y-1">
                                      {['全部', '咖啡', '饮品', '甜品'].map((cat) => (
                                        <button
                                          key={cat}
                                          onClick={() => setSimulatorCategory(cat)}
                                          className={`py-1.5 px-0.5 rounded text-[8.5px] font-bold text-center transition-all ${
                                            simulatorCategory === cat
                                              ? 'bg-[#1D9BF0] text-white'
                                              : 'text-zinc-500 hover:bg-neutral-500/5'
                                          }`}
                                        >
                                          {cat}
                                        </button>
                                      ))}
                                    </div>

                                    {/* Right product shelf */}
                                    <div className="flex-1 pl-2 space-y-1 overflow-y-auto max-h-[220px] custom-scrollbar">
                                      {productsList
                                        .filter(p => {
                                          if (simulatorCategory !== '全部' && p.category !== simulatorCategory) return false;
                                          if (simulatorSearchQuery && !p.name.includes(simulatorSearchQuery)) return false;
                                          return true;
                                        })
                                        .map(p => {
                                          const isHot = p.name === '冰美式' || p.name === '生椰拿铁';
                                          return (
                                            <div
                                              key={p.id}
                                              onClick={() => setSelectedDetailProduct(p)}
                                              className="p-1 rounded bg-white dark:bg-neutral-900 border border-neutral-150 flex items-center justify-between cursor-pointer hover:border-sky-500 transition-all"
                                            >
                                              <div className="flex items-center space-x-1.5 min-w-0">
                                                <span className="text-xl select-none">{p.image}</span>
                                                <div className="min-w-0">
                                                  <div className="font-bold text-[8.5px] flex items-center truncate">
                                                    {p.name}
                                                    {isHot && <span className="bg-red-500 text-white font-mono scale-75 px-1 rounded ml-0.5 text-[5px]">热销</span>}
                                                  </div>
                                                  <span className="text-[6.5px] text-zinc-400 block truncate w-24">{p.desc}</span>
                                                  <span className="text-[8px] text-amber-600 font-bold">¥{p.price}</span>
                                                </div>
                                              </div>
                                              <span className="w-3.5 h-3.5 rounded-full bg-[#1D9BF0] text-white flex items-center justify-center font-bold text-[10px] shrink-0">+</span>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* SCREEN 3: CART 购物车 */}
                              {simulatorTab === 'cart' && (
                                <div className="space-y-1.5 animate-fadeIn text-left flex-1 flex flex-col">
                                  <div className="flex justify-between items-center border-b border-neutral-200 pb-1">
                                    <span className="font-extrabold text-[9px]">🛒 我的购物车 (Cart)</span>
                                    {customerCart.length > 0 && (
                                      <button onClick={() => setCustomerCart([])} className="text-[7.5px] text-rose-500 hover:underline">清空</button>
                                    )}
                                  </div>

                                  {customerCart.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-2">
                                      <span className="text-3xl">☕</span>
                                      <p className="text-[8.5px] text-zinc-400 text-center leading-normal">
                                        购物车空空如也，<br />快去点杯香醇咖啡吧！
                                      </p>
                                      <button onClick={() => setSimulatorTab('menu')} className="px-3 py-1 bg-[#1D9BF0] text-white text-[8px] font-bold rounded-lg hover:bg-[#38BDF8] transition-all">去点餐</button>
                                    </div>
                                  ) : (
                                    <div className="space-y-1 overflow-y-auto max-h-[205px] custom-scrollbar flex-1">
                                      {customerCart.map((item, idx) => (
                                        <div key={idx} className="p-1 bg-white dark:bg-neutral-900 border border-neutral-150 rounded flex items-center justify-between">
                                          <div className="flex items-center space-x-1.5 min-w-0">
                                            <span className="text-lg select-none shrink-0">{item.image}</span>
                                            <div className="min-w-0">
                                              <div className="font-bold text-[8.5px] truncate">{item.rawName || item.name}</div>
                                              <p className="text-[6.5px] text-emerald-600 truncate w-24 mt-0.5">{item.customSpecs || '中杯/标准'}</p>
                                              <span className="text-[8px] text-amber-600 font-bold">¥{item.price}</span>
                                            </div>
                                          </div>

                                          {/* Counter */}
                                          <div className="flex items-center space-x-1 shrink-0">
                                            <button
                                              onClick={() => {
                                                setCustomerCart(p => p.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it));
                                              }}
                                              className="w-3.5 h-3.5 bg-neutral-100 text-zinc-700 hover:bg-neutral-200 rounded flex items-center justify-center font-bold text-[8px]"
                                            >
                                              -
                                            </button>
                                            <span className="text-[8.5px] font-bold font-mono w-2.5 text-center">{item.quantity}</span>
                                            <button
                                              onClick={() => {
                                                setCustomerCart(p => p.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it));
                                              }}
                                              className="w-3.5 h-3.5 bg-[#1D9BF0] text-white hover:bg-emerald-600 rounded flex items-center justify-center font-bold text-[8px]"
                                            >
                                              +
                                            </button>
                                          </div>
                                        </div>
                                      ))}

                                      {/* Offer Voucher row */}
                                      <div className="p-1 px-2 rounded-lg bg-rose-500/5 border border-rose-500/10 flex justify-between items-center text-[7.5px] text-rose-500">
                                        <span className="font-bold">✨ 平台优惠券可用</span>
                                        <button onClick={() => setCouponApplied(!couponApplied)} className="underline cursor-pointer font-extrabold">{couponApplied ? '已减12元' : '可抵扣12元'}</button>
                                      </div>

                                      {/* Checkout section */}
                                      <div className="border-t border-dashed border-neutral-200 pt-1.5 text-right">
                                        <div className="text-[8px] text-zinc-600">
                                          合计: <span className="font-extrabold text-[10px] text-amber-655">¥ {(customerCart.reduce((s, it) => s + (it.price * it.quantity), 0) - (couponApplied ? 12 : 0)).toFixed(2)}</span>
                                        </div>
                                        <button
                                          onClick={() => setSimulatorTab('checkout')}
                                          className="w-full mt-1.5 py-1.5 bg-[#1D9BF0] text-white hover:bg-[#38BDF8] font-bold text-[9px] rounded-lg shadow-sm"
                                        >
                                          去结算 ➔
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* DIGITAL STATUS ACCENTS */}
                            <div className="absolute top-1 inset-x-3.5 flex justify-between items-center z-20 select-none">
                              <span className="text-[9.5px] font-bold text-neutral-500 font-mono">12:30 ☕</span>
                              <span className="text-[9.5px] font-bold text-neutral-500 font-mono">18:00 📶🔋</span>
                            </div>

                            {/* Order Mode selector */}
                            <div className="bg-neutral-900/10 p-1 rounded-lg border border-neutral-500/10 flex gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomerOrderType('takeout');
                                  setCustomerCart([]);
                                  setIsCheckoutModalOpen(false);
                                }}
                                className={`flex-1 py-1 rounded-md text-[9px] font-bold transition-all flex items-center justify-center space-x-1 ${
                                  customerOrderType === 'takeout'
                                    ? 'bg-[#1D9BF0] text-white shadow-sm'
                                    : 'text-neutral-500 hover:text-neutral-700'
                                }`}
                              >
                                <span>🛵 外卖送餐</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomerOrderType('dine_in');
                                  setCustomerCart([]);
                                  setIsCheckoutModalOpen(false);
                                }}
                                className={`flex-1 py-1 rounded-md text-[9px] font-bold transition-all flex items-center justify-center space-x-1 ${
                                  customerOrderType === 'dine_in'
                                    ? 'bg-[#1D9BF0] text-white shadow-sm'
                                    : 'text-neutral-500 hover:text-neutral-700'
                                }`}
                              >
                                <span>🍱 堂食扫码</span>
                              </button>
                            </div>

                            {/* Mini Slogan Banner Spot */}
                            <div className="p-2 rounded-lg flex flex-col justify-between h-12 relative overflow-hidden bg-gradient-to-r from-neutral-900 to-zinc-950 text-white shrink-0 shadow-sm border border-neutral-800">
                              <div className="absolute right-1.5 top-0.5 text-2xl opacity-15">🔥</div>
                              <div className="font-bold text-[9.5px] leading-tight z-10 text-emerald-300 truncate">
                                {storeHeadline}
                              </div>
                              <span className="text-[7.5px] tracking-wider uppercase opacity-80 z-10 font-mono shrink-0">
                                {customerOrderType === 'takeout' ? '⚡ 满￥35免配送费 • 极速直达' : '🍱 无接触扫码 • 先吃后付'}
                              </span>
                            </div>

                            {/* Claim Voucher/Coupon Ribbon */}
                            <button
                              type="button"
                              onClick={() => {
                                if (!couponApplied) {
                                  setCouponApplied(true);
                                  // Play tiny sound
                                  try {
                                    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                                    if (AudioCtx) {
                                      const ctx = new AudioCtx();
                                      const osc = ctx.createOscillator();
                                      const gain = ctx.createGain();
                                      osc.frequency.setValueAtTime(880, ctx.currentTime);
                                      gain.gain.setValueAtTime(0.08, ctx.currentTime);
                                      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                                      osc.connect(gain);
                                      gain.connect(ctx.destination);
                                      osc.start();
                                      osc.stop(ctx.currentTime + 0.3);
                                    }
                                  } catch (_) {}
                                }
                              }}
                              className={`py-1 px-1.5 rounded border text-[8.5px] font-mono flex items-center justify-between transition-all duration-200 shrink-0 ${
                                couponApplied 
                                  ? 'bg-emerald-500/10 border-sky-500/30 text-sky-500' 
                                  : 'bg-rose-500/10 border-rose-500/25 text-rose-500 hover:bg-rose-500/15 animate-pulse cursor-pointer'
                              }`}
                            >
                              <span className="flex items-center space-x-1">
                                <Award className="w-3 h-3 shrink-0" />
                                <span className="font-bold">{couponApplied ? '已领：食神新客减免¥12券' : '全场红包：新客专享￥12立减券'}</span>
                              </span>
                              <span className="font-extrabold px-1 rounded bg-black/10 text-[7px]">{couponApplied ? '✔ 已用' : '领券 🎁'}</span>
                            </button>

                            {/* Search bar inside phone screen */}
                            <div className="relative shrink-0">
                              <Search className="w-3 h-3 absolute left-1.5 top-1.5 text-zinc-400" />
                              <input
                                type="text"
                                value={simulatorSearchQuery}
                                onChange={(e) => setSimulatorSearchQuery(e.target.value)}
                                placeholder="输入搜索美食单品..."
                                className={`w-full text-[9px] pl-5.5 pr-4 py-1.5 rounded-lg focus:outline-none transition-all ${
                                  isRetro ? 'bg-[#9E9685]/10 text-zinc-800 placeholder-zinc-500 focus:bg-amber-100/50' : 
                                  isDark ? 'bg-neutral-900 border border-neutral-800 text-white placeholder-zinc-650' : 
                                  'bg-white border border-gray-250 text-zinc-900'
                                }`}
                              />
                              {simulatorSearchQuery && (
                                <button 
                                  onClick={() => setSimulatorSearchQuery('')}
                                  className="absolute right-1.5 top-1.5 text-zinc-500 hover:text-zinc-800"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* Category selector Ribbon */}
                            <div className="flex space-x-1 overflow-x-auto py-0.5 scrollbar-none shrink-0 border-b border-dashed border-neutral-500/15 pb-1">
                              {['全部', '主食', '小吃', '饮品', '甜点'].map((cat) => (
                                <button
                                  key={cat}
                                  onClick={() => setSimulatorCategory(cat)}
                                  className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 transition-all ${
                                    simulatorCategory === cat 
                                      ? 'bg-[#1D9BF0] text-white shadow-sm' 
                                      : isRetro ? 'bg-neutral-200/50 text-zinc-600' : 'bg-neutral-900 text-zinc-400 hover:bg-neutral-850'
                                  }`}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>

                            {/* Catalog Menu list */}
                            <div className="flex-1 overflow-y-auto pr-0.2 space-y-1 custom-scrollbar min-h-[140px] pb-10">
                              {productsList
                                .filter((p) => {
                                  if (simulatorCategory !== '全部' && p.category !== simulatorCategory) return false;
                                  if (simulatorSearchQuery && !p.name.toLowerCase().includes(simulatorSearchQuery.toLowerCase())) return false;
                                  return true;
                                })
                                .map((p) => {
                                  const cartItem = customerCart.find(item => item.id === p.id);
                                  const qty = cartItem ? cartItem.quantity : 0;
                                  return (
                                    <div 
                                      key={p.id} 
                                      onClick={() => setSelectedDetailProduct(p)}
                                      className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${itemCardBg}`}
                                    >
                                      <div className="flex items-center space-x-2 mr-1 min-w-0">
                                        <span className="text-xl select-none filter drop-shadow">{p.image}</span>
                                        <div className="flex flex-col min-w-0">
                                          <span className={`font-bold text-[9.5px] truncate max-w-[110px] ${cardHeadingText}`}>{p.name}</span>
                                          <p className="text-[7.5px] text-zinc-400 truncate max-w-[110px]">{p.desc || '地道食材，精品秘制。'}</p>
                                          <span className="text-[8px] text-sky-500 font-mono font-bold mt-0.5">
                                            ¥{p.price} 
                                            <span className="text-[7px] text-zinc-500 font-normal ml-1">剩:{p.stock}</span>
                                          </span>
                                        </div>
                                      </div>

                                      {/* Micro quantizer in menu */}
                                      <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        {qty > 0 ? (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setCustomerCart(prev => {
                                                  const exist = prev.find(item => item.id === p.id);
                                                  if (exist) {
                                                    if (exist.quantity > 1) {
                                                      return prev.map(item => item.id === p.id ? { ...item, quantity: item.quantity - 1 } : item);
                                                    } else {
                                                      return prev.filter(item => item.id !== p.id);
                                                    }
                                                  }
                                                  return prev;
                                                });
                                              }}
                                              className="w-4 h-4 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                                            >
                                              -
                                            </button>
                                            <span className={`text-[9.5px] font-mono font-bold w-3 text-center ${isRetro ? 'text-zinc-800' : 'text-white'}`}>{qty}</span>
                                          </>
                                        ) : null}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedDetailProduct(p); // Prefer showing specs choices Modal, extremely premium!
                                          }}
                                          className="w-4 h-4 rounded-full bg-[#1D9BF0] hover:bg-[#38BDF8] text-white flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}

                              {productsList.filter((p) => {
                                if (simulatorCategory !== '全部' && p.category !== simulatorCategory) return false;
                                if (simulatorSearchQuery && !p.name.toLowerCase().includes(simulatorSearchQuery.toLowerCase())) return false;
                                return true;
                              }).length === 0 && (
                                <div className="p-6 text-center text-zinc-500 text-[9.5px]">
                                  没有匹配的商品单品 🍜<br/>更换关键词再搜搜吧！
                                </div>
                              )}
                            </div>

                            {/* Interactive Cart Bottom Panel sheet */}
                            {customerCart.length > 0 && !isCheckoutModalOpen && (
                              <div className="absolute bottom-0 inset-x-0 bg-[#0c0c0e] border-t border-[#1D9BF0] p-2 flex items-center justify-between z-20 space-x-2 shadow-2xl animate-slideUp shrink-0">
                                <div className="flex flex-col">
                                  <span className="text-[8px] text-gray-400 font-mono">共计 {customerCart.reduce((sum, item) => sum + item.quantity, 0)} 件商品</span>
                                  <span className="text-xs font-mono font-extrabold text-[#38BDF8] flex items-center">
                                    ¥ {(customerCart.reduce((sum, item) => sum + (item.price * item.quantity), 0) - (couponApplied ? 12 : 0)).toFixed(2)}
                                    {couponApplied && <span className="text-[7.5px] font-normal text-rose-500 ml-1">(-¥12)</span>}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsCheckoutModalOpen(true);
                                  }}
                                  className="bg-[#1D9BF0] hover:bg-[#38BDF8] active:scale-95 duration-75 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-lg"
                                >
                                  立即结算 ➔
                                </button>
                              </div>
                            )}

                            {/* PRODUCT SPECIFICATION CHOICES MODAL (POPUP SHEET) */}
                            <AnimatePresence>
                              {selectedDetailProduct && (
                                <motion.div
                                  initial={{ opacity: 0, y: 50 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 50 }}
                                  className="absolute inset-x-0 bottom-0 max-h-[340px] bg-[#0c0c0e] border-t-2 border-[#1D9BF0] p-3 rounded-t-2xl flex flex-col justify-between z-40 text-left text-white"
                                >
                                  <div>
                                    <div className="flex items-start justify-between border-b border-neutral-800 pb-2">
                                      <div className="flex items-center space-x-2.5">
                                        <span className="text-2xl filter drop-shadow select-none">{selectedDetailProduct.image}</span>
                                        <div>
                                          <h4 className="font-bold text-[11px] text-white tracking-tight">{selectedDetailProduct.name}</h4>
                                          <p className="text-[8.5px] text-[#38BDF8] font-mono">
                                            基础价：¥{selectedDetailProduct.price} • 剩余:{selectedDetailProduct.stock}
                                          </p>
                                        </div>
                                      </div>
                                      <button 
                                        type="button" 
                                        onClick={() => {
                                          setSelectedDetailProduct(null);
                                          setCustomSpecOption('');
                                        }}
                                        className="text-zinc-500 hover:text-white cursor-pointer"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {/* Scrollable Description and Specs Choices */}
                                    <div className="py-2.5 space-y-3 overflow-y-auto max-h-[180px] custom-scrollbar text-[9.5px]">
                                      <div className="text-[8.5px] text-zinc-400 bg-neutral-950 p-2 rounded leading-normal border border-neutral-900 font-sans">
                                        {selectedDetailProduct.desc || '主厨精选优质时鲜，秘方慢炖，香气醇厚滑嫩，营养全面均衡。'}
                                      </div>

                                      {/* Specs Choice Size option if any */}
                                      {selectedDetailProduct.specs && (
                                        <div className="space-y-1.5">
                                          <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider font-bold">自定款式（可选规格）</p>
                                          <div className="grid grid-cols-2 gap-1.5">
                                            {selectedDetailProduct.specs.sizes.map((s: string, index: number) => {
                                              const isActive = customSpecOption === s || (!customSpecOption && index === 0);
                                              return (
                                                <button
                                                  key={s}
                                                  type="button"
                                                  onClick={() => setCustomSpecOption(s)}
                                                  className={`p-1.5 rounded border text-[9px] font-mono font-bold transition-all text-center ${
                                                    isActive 
                                                      ? 'border-sky-500 bg-emerald-500/10 text-sky-400' 
                                                      : 'border-neutral-800 bg-black text-zinc-400 hover:text-white'
                                                  }`}
                                                >
                                                  {s}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {/* Interactive Spicy / Sweet choice block */}
                                      <div className="space-y-1.5">
                                        <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider font-bold">口味附加备注偏好</p>
                                        <div className="grid grid-cols-3 gap-1">
                                          {selectedDetailProduct.category === '饮品' || selectedDetailProduct.category === '甜点' ? (
                                            ['正常糖/少冰', '少糖/去冰', '无糖/常温'].map((sw, idx) => (
                                              <button
                                                key={sw}
                                                type="button"
                                                onClick={() => setOrderRemarks(sw)}
                                                className={`py-1 rounded text-[8px] text-center border font-mono transition-all ${
                                                  orderRemarks === sw || (!orderRemarks && idx === 0)
                                                    ? 'border-sky-500 bg-emerald-500/10 text-sky-400 font-bold'
                                                    : 'border-neutral-900 bg-neutral-950 text-zinc-500 hover:text-zinc-300'
                                                }`}
                                              >
                                                {sw}
                                              </button>
                                            ))
                                          ) : (
                                            ['微辣(特制)', '不辣(原香)', '变态中辣'].map((sp, idx) => (
                                              <button
                                                key={sp}
                                                type="button"
                                                onClick={() => setOrderRemarks(sp)}
                                                className={`py-1 rounded text-[8px] text-center border font-mono transition-all ${
                                                  orderRemarks === sp || (!orderRemarks && idx === 0)
                                                    ? 'border-sky-500 bg-emerald-500/10 text-sky-400 font-bold'
                                                    : 'border-neutral-900 bg-neutral-950 text-zinc-500 hover:text-zinc-300'
                                                }`}
                                              >
                                                {sp}
                                              </button>
                                            ))
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Confirm spec add to cart */}
                                  <div className="border-t border-neutral-800 pt-2 flex items-center justify-between shrink-0">
                                    <div className="text-sky-400 font-extrabold text-xs font-mono">
                                      ¥ {
                                        (() => {
                                          const extra = customSpecOption.includes('+¥15') ? 15 : customSpecOption.includes('+¥10') ? 10 : customSpecOption.includes('+¥8') ? 8 : customSpecOption.includes('+¥5') ? 5 : customSpecOption.includes('+¥4') ? 4 : 0;
                                          return selectedDetailProduct.price + extra;
                                        })()
                                      }
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // Compute premium modifications
                                        const extraPrice = customSpecOption.includes('+¥15') ? 15 : customSpecOption.includes('+¥10') ? 10 : customSpecOption.includes('+¥8') ? 8 : customSpecOption.includes('+¥5') ? 5 : customSpecOption.includes('+¥4') ? 4 : 0;
                                        const finalPrice = selectedDetailProduct.price + extraPrice;
                                        const chosenSize = customSpecOption || (selectedDetailProduct.specs ? selectedDetailProduct.specs.sizes[0] : '标准份');
                                        const chosenFlavor = orderRemarks || (selectedDetailProduct.category === '饮品' || selectedDetailProduct.category === '甜点' ? '正常糖/少冰' : '微辣(特制)');

                                        const formattedItemName = `${selectedDetailProduct.name} [${chosenSize}, ${chosenFlavor}]`;

                                        setCustomerCart(prev => {
                                          const exist = prev.find(item => item.id === selectedDetailProduct.id && item.name === formattedItemName);
                                          if (exist) {
                                            return prev.map(item => (item.id === selectedDetailProduct.id && item.name === formattedItemName) ? { ...item, quantity: item.quantity + 1 } : item);
                                          } else {
                                            return [...prev, {
                                              id: selectedDetailProduct.id,
                                              name: formattedItemName,
                                              rawName: selectedDetailProduct.name,
                                              price: finalPrice,
                                              image: selectedDetailProduct.image,
                                              quantity: 1,
                                              customSpecs: `${chosenSize}•${chosenFlavor}`
                                            }];
                                          }
                                        });

                                        // Close and clear
                                        setSelectedDetailProduct(null);
                                        setCustomSpecOption('');
                                        setOrderRemarks('');

                                        // Prompt bubble
                                        try {
                                          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                                          if (AudioCtx) {
                                            const ctx = new AudioCtx();
                                            const osc = ctx.createOscillator();
                                            const gain = ctx.createGain();
                                            osc.frequency.setValueAtTime(659, ctx.currentTime);
                                            gain.gain.setValueAtTime(0.06, ctx.currentTime);
                                            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                                            osc.connect(gain);
                                            gain.connect(ctx.destination);
                                            osc.start();
                                            osc.stop(ctx.currentTime + 0.2);
                                          }
                                        } catch (_) {}
                                      }}
                                      className="bg-[#1D9BF0] hover:bg-[#38BDF8] text-white font-extrabold text-[9.5px] px-4 py-1.5 rounded-lg transition-all cursor-pointer"
                                    >
                                      确认加料并加车 🛒
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* CHECKOUT OVERLAY PANEL SHEET */}
                            <AnimatePresence>
                              {isCheckoutModalOpen && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 15 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 15 }}
                                  className="absolute inset-x-0 bottom-0 top-[24px] bg-black/98 border-t border-neutral-800 p-3 flex flex-col justify-between z-40 space-y-2 text-white overflow-y-auto"
                                >
                                  <div className="space-y-2 pt-1 text-left">
                                    <div className="flex items-center justify-between border-b border-[#2F3336] pb-1.5">
                                      <span className="text-[10px] font-bold text-white flex items-center">
                                        {customerOrderType === 'takeout' ? '🛵 美食家外卖直通车' : '🍱 店内扫码免排队点单'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setIsCheckoutModalOpen(false)}
                                        className="text-zinc-450 hover:text-white cursor-pointer p-0.5"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Parameters for Delivery Address or Table */}
                                    {customerOrderType === 'takeout' ? (
                                      <div className="space-y-1.5 text-left">
                                        <div className="space-y-0.5">
                                          <div className="flex justify-between items-center">
                                            <label className="text-[8px] font-mono text-zinc-400 uppercase tracking-wide">送餐派送地址 (Delivery Address)</label>
                                            <span className="text-[7.5px] font-mono text-sky-400">预计30分送达</span>
                                          </div>
                                          <input
                                            type="text"
                                            value={deliveryAddress}
                                            onChange={(e) => setDeliveryAddress(e.target.value)}
                                            className="w-full bg-[#111] border border-neutral-700 rounded p-1 text-[9.5px] text-white focus:outline-none focus:border-[#1D9BF0] font-mono"
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5">
                                          <div className="space-y-0.5">
                                            <label className="text-[8px] font-mono text-zinc-400 block">买家贵姓</label>
                                            <input
                                              type="text"
                                              value={deliveryName}
                                              onChange={(e) => setDeliveryName(e.target.value)}
                                              className="w-full bg-[#111] border border-neutral-700 rounded p-1 text-[9px] text-white focus:outline-none focus:border-[#1D9BF0]"
                                            />
                                          </div>
                                          <div className="space-y-0.5">
                                            <label className="text-[8px] font-mono text-zinc-400 block">配送电话</label>
                                            <input
                                              type="text"
                                              value={deliveryPhone}
                                              onChange={(e) => setDeliveryPhone(e.target.value)}
                                              className="w-full bg-[#111] border border-neutral-700 rounded p-1 text-[9.5px] text-white focus:outline-none focus:border-[#1D9BF0] font-mono"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-1.5 text-left">
                                        <div className="space-y-0.5">
                                          <label className="text-[8px] font-mono text-zinc-400 uppercase tracking-wide block">就餐桌位号定位 (Table ID)</label>
                                          <input
                                            type="text"
                                            value={dineInTableNumber}
                                            onChange={(e) => setDineInTableNumber(e.target.value)}
                                            placeholder="例如：B08桌"
                                            className="w-full bg-[#111] border border-neutral-700 rounded p-1 text-[11px] font-mono font-bold text-center text-white focus:outline-none focus:border-[#1D9BF0]"
                                          />
                                        </div>
                                        <p className="text-[7.5px] text-gray-500 leading-normal">
                                          用餐客户扫桌角标签后系统自带定位坐标，起锅后智能出单系统自动匹配到对应座位传送。
                                        </p>
                                      </div>
                                    )}

                                    {/* Remarks comment details */}
                                    <div className="space-y-0.5 text-left pt-0.5 bg-neutral-900/40">
                                      <label className="text-[8px] font-mono text-zinc-400 block">额外要求及忌口备注（Comment Remarks）</label>
                                      <input
                                        type="text"
                                        placeholder="加葱/去葱/请多给一份辣椒油包..."
                                        value={orderRemarks}
                                        onChange={(e) => setOrderRemarks(e.target.value)}
                                        className="w-full bg-[#111] border border-neutral-750 rounded p-1 text-[9px] text-white focus:outline-none focus:border-[#1D9BF0]"
                                      />
                                    </div>

                                    {/* Custom interactive select payment channels */}
                                    <div className="space-y-1 pt-0.5 text-left">
                                      <p className="text-[8px] font-mono text-zinc-400 font-bold">自研聚合收银网口 (Payment Method)</p>
                                      <div className="grid grid-cols-3 gap-1">
                                        {[
                                          { id: 'wechat', label: '微信 🟢', color: 'border-sky-500/20' },
                                          { id: 'alipay', label: '支付宝 🔵', color: 'border-blue-500/20' },
                                          { id: 'balance', label: '店卡 🪙', color: 'border-amber-500/20' }
                                        ].map(pay => (
                                          <button
                                            key={pay.id}
                                            type="button"
                                            onClick={() => setSelectedPaymentMethod(pay.id as any)}
                                            className={`py-1 text-[8px] rounded border font-mono transition-all text-center ${
                                              selectedPaymentMethod === pay.id 
                                                ? 'bg-[#1D9BF0] border-[#1D9BF0] text-white font-bold' 
                                                : `bg-[#151515] text-zinc-400 border-neutral-800`
                                            }`}
                                          >
                                            {pay.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Billing Breakdown */}
                                    <div className="bg-neutral-900/50 p-2 rounded border border-neutral-800 text-[8.5px] space-y-1 font-mono text-left">
                                      <div className="flex justify-between text-zinc-400">
                                        <span>商品总计:</span>
                                        <span className="text-zinc-300 font-bold">
                                          ¥ {customerCart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                                        </span>
                                      </div>
                                      {couponApplied && (
                                        <div className="flex justify-between text-rose-450">
                                          <span>新客立减卷:</span>
                                          <span className="font-bold">-¥ 12.00</span>
                                        </div>
                                      )}
                                      
                                      <div className="flex justify-between font-bold text-white border-t border-neutral-800 pt-1 text-[9px]">
                                        <span>应付实合 (Total Paid)</span>
                                        <span className="text-sky-400 font-extrabold text-[10px]">
                                          ¥ {Math.max(0, customerCart.reduce((sum, item) => sum + (item.price * item.quantity), 0) - (couponApplied ? 12 : 0)).toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cartSum = customerCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                                      const finalPrice = Math.max(0, cartSum - (couponApplied ? 12 : 0));
                                      const productsDesc = customerCart.map(item => `${item.name} x${item.quantity}`).join(' + ');
                                      
                                      const orderId = 'ORD-' + Math.floor(Math.random() * 8999 + 1000);
                                      const locationText = customerOrderType === 'takeout' 
                                        ? `配送 🛵 ${deliveryAddress}` 
                                        : `堂食 🍱 ${dineInTableNumber} 号台`;

                                      const remarksString = orderRemarks ? `【附加备注：${orderRemarks}】` : '无备注需求';
                                      const paymentName = selectedPaymentMethod === 'wechat' ? '微信支付 🟢' 
                                                        : selectedPaymentMethod === 'alipay' ? '支付宝支付 🔵' : '会员卡余额 🪙';

                                      const placedOrder = {
                                        id: orderId,
                                        time: '刚才',
                                        location: locationText,
                                        desc: productsDesc + (orderRemarks ? ` (${orderRemarks})` : ''),
                                        price: finalPrice,
                                        status: 'pending',
                                        type: customerOrderType,
                                        customerName: customerOrderType === 'takeout' ? deliveryName : `${dineInTableNumber}现场顾客`,
                                        phone: customerOrderType === 'takeout' ? deliveryPhone : '微信小程序免登'
                                      };

                                      // Write checkout directly to Firestore
                                      const orderToSave = {
                                        ...placedOrder,
                                        tracking: ''
                                      };
                                      setDoc(doc(db, 'tenants', tenantId, 'industries', industry.id, 'orders', orderId), orderToSave)
                                        .catch(err => handleFirestoreError(err, OperationType.WRITE, `tenants/${tenantId}/industries/${industry.id}/orders/${orderId}`));

                                      // Automatically update global metric counters in Firestore
                                      updateMetricsInDb(finalPrice, 1);

                                      // Create dynamic, highly realistic logging flow
                                      setLogs(prev => [
                                        ...prev,
                                        {
                                          id: Math.random().toString(),
                                          timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                          sender: customerOrderType === 'takeout' ? '外卖小程序' : '扫码点单台',
                                          emoji: customerOrderType === 'takeout' ? '🛵' : '🍱',
                                          message: `🍽️ 【新单热线】订单【${placedOrder.id}】闪入成功！实付金额 ¥${finalPrice.toFixed(2)}，客户选定 [${paymentName}]结算。 ${remarksString}`,
                                          type: 'success'
                                        },
                                        {
                                          id: Math.random().toString(),
                                          timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                          sender: '后厨中枢',
                                          emoji: '🧑‍🍳',
                                          message: `👨‍🍳 后厨云打印机出单中！开始准备制作【${productsDesc}】。`,
                                          type: 'info'
                                        }
                                      ]);

                                      // Close checkout panel and wipe cart & remarks
                                      setIsCheckoutModalOpen(false);
                                      setCustomerCart([]);
                                      setOrderRemarks('');

                                      // Trigger vibration sound notification toast
                                      setIncomingOrderAlert(placedOrder);
                                      playLiveOrderChime();
                                    }}
                                    className="w-full bg-[#1D9BF0] hover:bg-[#38BDF8] text-white font-extrabold text-[11px] py-2 rounded-lg transition-all cursor-pointer shadow-md select-none shrink-0 border border-sky-500/20 active:scale-95"
                                  >
                                    {customerOrderType === 'takeout' ? '确认付款并呼叫顺丰起送 🛵' : '确认扫码点单同步厨房 🍱'}
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>

                           </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Domain screen */}
              {storeSubTab === 'domain' && (
                <div className="bg-[#09090B] border border-[#2F3336] p-6 rounded-xl space-y-6 animate-fadeIn text-left">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-sky-400" />
                      <span>独享自定义域名解析绑定</span>
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1">输入您的私有企业级网站域名（如 shop.brand.com），自动映射至 MODA 全球高防点餐边缘多向网关。</p>
                  </div>

                  <div className="space-y-4 max-w-lg bg-black/40 border border-[#2F3336] p-5 rounded-xl">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-zinc-400 block">品牌二级专属子域名</label>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="text" 
                          value={customDomainName}
                          onChange={(e) => setCustomDomainName(e.target.value)}
                          placeholder="shusi-fashion"
                          className="bg-black border border-neutral-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#1D9BF0] flex-1 font-mono"
                        />
                        <span className="text-xs text-zinc-500 font-mono">.modaui.com</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDoc(doc(db, 'tenants', tenantId), { customDomainName: customDomainName }, { merge: true })
                          .then(() => {
                            setLogs(prev => [
                              ...prev,
                              {
                                id: Math.random().toString(),
                                timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                sender: '系统核心',
                                emoji: '🌐',
                                message: `🎯 成功更新并同步域名映射协议：目标 CNAME cdn.modaui.com 指向 ${customDomainName}.modaui.com 成功，边缘证书校验完毕。`,
                                type: 'success'
                              }
                            ]);
                            alert('域名配置更新成功，已缓存写入分布式边缘宿主数据库！');
                          });
                      }}
                      className="bg-[#1D9BF0] hover:bg-sky-400 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer"
                    >
                      校验 DNS 并在全球边缘多播网关广播
                    </button>
                  </div>

                  <div className="bg-black/60 border border-[#2F3336] p-4 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-zinc-300 block">CNAME 指向配置基准规范说明</span>
                    <table className="w-full text-[10px] font-mono text-zinc-400 border-collapse">
                      <thead>
                        <tr className="border-b border-[#2F3336] text-zinc-500">
                          <th className="text-left pb-1.5">记录类型</th>
                          <th className="text-left pb-1.5">主机记录</th>
                          <th className="text-left pb-1.5">解析线路</th>
                          <th className="text-left pb-1.5">记录值 (CNAME TO)</th>
                          <th className="text-left pb-1.5">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2 text-sky-400">CNAME</td>
                          <td className="py-2 text-white">@</td>
                          <td className="py-2">默认/电信/联通多播</td>
                          <td className="py-2 text-[#38BDF8]">cdn.modaui.com</td>
                          <td className="py-2 text-emerald-400">✅ 解析就绪</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Brand settings screen */}
              {storeSubTab === 'brand' && (
                <div className="bg-[#09090B] border border-[#2F3336] p-6 rounded-xl space-y-6 animate-fadeIn text-left">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Sliders className="w-4 h-4 text-sky-400" />
                      <span>店铺视觉品牌自定义</span>
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1">通过配置自选主色调及形象图标，店面顾客订餐前台会同步切换到适配您的主风格色系！</p>
                  </div>

                  <div className="bg-black/40 border border-[#2F3336] p-5 rounded-xl space-y-4 max-w-lg">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-zinc-400 block">品牌名(Logo Text)</label>
                      <input 
                        type="text" 
                        value={brandLogoText}
                        onChange={(e) => setBrandLogoText(e.target.value)}
                        placeholder={merchantName}
                        className="w-full bg-black border border-neutral-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#1D9BF0] font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-mono text-zinc-400 block">自适应前台主题主色系(Brand Accent Color)</label>
                      <div className="flex items-center space-x-2.5">
                        <input 
                          type="color" 
                          value={brandPrimaryColor} 
                          onChange={(e) => setBrandPrimaryColor(e.target.value)}
                          className="w-10 h-10 border border-[#2F3336] bg-transparent rounded cursor-pointer"
                        />
                        <div className="flex items-center space-x-2">
                          {['#1D9BF0', '#EAB308', '#10B981', '#EF4444', '#8B5CF6'].map(col => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => setBrandPrimaryColor(col)}
                              className="w-6 h-6 rounded-full border border-[#2F3336]/60 cursor-pointer"
                              style={{ backgroundColor: col }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDoc(doc(db, 'tenants', tenantId), {
                          brandLogoText: brandLogoText,
                          brandPrimaryColor: brandPrimaryColor
                        }, { merge: true })
                          .then(() => {
                            setLogs(prev => [
                              ...prev,
                              {
                                id: Math.random().toString(),
                                timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                sender: '系统核心',
                                emoji: '✨',
                                message: `🎨 主打品牌视觉成功写入云服务器，主色调：【${brandPrimaryColor}】，前向顾客点单端网站主板配色已同步更新生效。`,
                                type: 'success'
                              }
                            ]);
                            alert('自适应主题参数同步成功，已即刻应用到顾客前台！');
                          });
                      }}
                      className="bg-[#1D9BF0] hover:bg-sky-400 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer"
                    >
                      保存品牌视觉元素
                    </button>
                  </div>
                </div>
              )}

              {/* SEO Configuration screen */}
              {storeSubTab === 'seo' && (
                <div className="bg-[#09090B] border border-[#2F3336] p-6 rounded-xl space-y-6 animate-fadeIn text-left">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Search className="w-4 h-4 text-sky-400" />
                      <span>搜索引擎收录与 SEO 配置面板</span>
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1">编辑网站的 HTML Title, Meta Tags 以及核心站外长尾词，便于各大地图/搜狗快速抓取并获得高曝光展现。</p>
                  </div>

                  <div className="bg-black/40 border border-[#2F3336] p-5 rounded-xl space-y-4 max-w-xl">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-zinc-400 block">网页标题 (HTML Title Tag)</label>
                      <input 
                        type="text" 
                        value={seoHtmlTitle}
                        onChange={(e) => setSeoHtmlTitle(e.target.value)}
                        placeholder="最美定制装配送 - "
                        className="w-full bg-black border border-neutral-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#1D9BF0] font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-zinc-400 block">描述 (Meta Description Tag)</label>
                      <textarea 
                        value={seoMetaDesc}
                        onChange={(e) => setSeoMetaDesc(e.target.value)}
                        rows={3}
                        placeholder="提供高端服装/餐饮/品类专属，支持24小时送达极致体验..."
                        className="w-full bg-black border border-neutral-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#1D9BF0] font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-zinc-400 block">关键词（Keywords - 以逗号隔开）</label>
                      <input 
                        type="text" 
                        value={seoKeywords}
                        onChange={(e) => setSeoKeywords(e.target.value)}
                        placeholder="极简服饰, 线上点餐外卖, 沙龙沙发精品"
                        className="w-full bg-black border border-neutral-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#1D9BF0] font-mono"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDoc(doc(db, 'tenants', tenantId), {
                          seoHtmlTitle: seoHtmlTitle,
                          seoMetaDesc: seoMetaDesc,
                          seoKeywords: seoKeywords
                        }, { merge: true })
                          .then(() => {
                            setLogs(prev => [
                              ...prev,
                              {
                                id: Math.random().toString(),
                                timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                sender: '系统核心',
                                emoji: '🔍',
                                message: `⚡ 已成功更新 HTML SEO SEO/META 元协议，重度缓存预刷新完毕。前台 SEO 权重已全面上升。`,
                                type: 'success'
                              }
                            ]);
                            alert('元数据修改成功！全新的网页标头及 robots.txt 已经重新推流完成。');
                          });
                      }}
                      className="bg-[#1D9BF0] hover:bg-sky-400 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer"
                    >
                      安全同步并向搜索引擎推送全量 Sitemap.xml
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
              







              {/* VIEW 3: PRODUCT 选品 (👗 产品) */}
              {activeMenu === 'product' && (
                <>
                  {productSubTab === 'list' && (
                    <div className="space-y-6 animate-fadeIn">
                  {/* Item dev box form */}
                  <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-[#1D9BF0]" />
                        <h3 className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">发布商品</h3>
                      </div>
                      <span className="text-[10px] bg-[#111] text-zinc-400 font-mono border border-[#2F3336] px-2 py-0.5 rounded-full">极速上架</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider block">商品名称</label>
                        <input 
                          type="text"
                          value={newProductInput}
                          onChange={(e) => setNewProductInput(e.target.value)}
                          placeholder={industry.id === 'catering' ? "例如: 飘香咖喱牛腩捞面" : industry.id === 'retail' ? "例如: 户外防水双拉链收纳盒" : "例如: 港风冷淡灰修身上衣"}
                          className="w-full bg-black border border-[#2F3336] focus:border-[#1D9BF0] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider block">在售单价</label>
                        <input 
                          type="number"
                          min="1"
                          step="0.01"
                          value={newProductPriceInput}
                          onChange={(e) => setNewProductPriceInput(e.target.value)}
                          placeholder="智能定价 (数字)"
                          className="w-full bg-black border border-[#2F3336] focus:border-[#1D9BF0] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none placeholder:text-gray-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider block">常态库存</label>
                        <input 
                          type="number"
                          min="0"
                          value={newProductStockInput}
                          onChange={(e) => setNewProductStockInput(e.target.value)}
                          placeholder="请输入初始库存"
                          className="w-full bg-black border border-[#2F3336] focus:border-[#1D9BF0] rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none placeholder:text-gray-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Emoji Select Grid */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider block">选择图标</label>
                      <div className="flex flex-wrap gap-1.5 p-2 bg-black/40 border border-[#2F3336] rounded-lg">
                        {[
                          '🍛', '🍖', '🍹', '🍔', '🍕', '🍰', '🍜', '🍣',
                          '👗', '👖', '👕', '👚', '👜', '🕶', '👠', '👟',
                          '🎒', '🌀', '☔', '📦', '🎁', '📱', '💻', '💡', '🔥'
                        ].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewProductEmojiInput(emoji)}
                            className={`w-8 h-8 rounded text-lg flex items-center justify-center transition-all ${
                              newProductEmojiInput === emoji
                                ? 'bg-[#1D9BF0]/30 border border-[#1D9BF0] scale-110 shadow-sm'
                                : 'bg-transparent border border-transparent hover:bg-zinc-800/40'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end items-center gap-2 pt-2 border-t border-[#2F3336]/60">
                      {/* Manual upload button */}
                      <button
                        type="button"
                        onClick={() => {
                          const cleanedName = newProductInput.trim();
                          if (!cleanedName) return;
                          const finalPrice = newProductPriceInput.trim() 
                            ? parseFloat(newProductPriceInput) 
                            : Math.floor(Math.random() * 80 + 30);
                          const finalStock = parseInt(newProductStockInput.trim()) || 100;
                          
                          const newItemId = 'p' + (productsList.length + 1) + '-' + Date.now();
                          const newItem = {
                            id: newItemId,
                            name: cleanedName,
                            price: finalPrice,
                            stock: finalStock,
                            image: newProductEmojiInput,
                            category: industry.id === 'catering' ? '咖啡' : industry.id === 'retail' ? '居家' : '外套',
                            desc: '手动极速发布 SPU 商品',
                            sales: 0,
                            rating: '100%',
                            specs: { sizes: ['标准'], labels: '手工新建' }
                          };

                          setDoc(doc(db, 'tenants', tenantId, 'industries', industry.id, 'products', newItemId), newItem)
                            .then(() => {
                              setLogs((prevLogs) => [
                                ...prevLogs,
                                {
                                  id: Math.random().toString(),
                                  timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                  sender: '商户总控',
                                  emoji: '📝',
                                  message: `✔ 【手动极速发布】成功上架新微商城 SPU商品名：【${newItem.name}】，单价 ¥${finalPrice} 元，初始库存：${finalStock} 并同步写入 Firestore！`,
                                  type: 'success'
                                }
                              ]);
                            })
                            .catch(err => handleFirestoreError(err, OperationType.WRITE, 'products/' + newItemId));

                          setNewProductInput('');
                          setNewProductPriceInput('');
                          setNewProductStockInput('100');
                        }}
                        disabled={isDevelopingProduct || !newProductInput.trim()}
                        className="bg-zinc-800 hover:bg-zinc-700 transition-all py-2.5 px-5 rounded-lg text-xs font-bold text-gray-200 cursor-pointer flex items-center justify-center space-x-1.5 shrink-0 disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#1D9BF0]" />
                        <span>手动发布</span>
                      </button>

                      {/* AI build upload button */}
                      <button
                        onClick={() => {
                          if (!newProductInput.trim()) return;
                          setIsDevelopingProduct(true);
                          setLogs((prev) => [
                            ...prev,
                            {
                              id: Math.random().toString(),
                              timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                              sender: 'AI商品经理',
                              emoji: '👗',
                              message: `【${selectedStaff.name}】正在抓取各大平台同款热销比值，运算物耗成本并出具定价推荐书...`,
                              type: 'info'
                            }
                          ]);

                          setTimeout(() => {
                            const newPrice = newProductPriceInput.trim() 
                              ? parseFloat(newProductPriceInput) 
                              : Math.floor(Math.random() * 80 + 30);
                            const newStock = parseInt(newProductStockInput.trim()) || Math.floor(Math.random() * 200 + 100);
                            
                            const newItemId = 'p' + (productsList.length + 1) + '-' + Date.now();
                            const newItem = {
                              id: newItemId,
                              name: newProductInput.trim(),
                              price: newPrice,
                              stock: newStock,
                              image: newProductEmojiInput,
                              category: industry.id === 'catering' ? '咖啡' : industry.id === 'retail' ? '居家' : '外套',
                              desc: 'AI 自动打样生产 SPU 商品',
                              sales: 0,
                              rating: '100%',
                              specs: { sizes: ['标准'], labels: 'AI严选' }
                            };

                            setDoc(doc(db, 'tenants', tenantId, 'industries', industry.id, 'products', newItemId), newItem)
                              .then(() => {
                                setLogs((prevLogs) => [
                                  ...prevLogs,
                                  {
                                    id: Math.random().toString(),
                                    timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                    sender: 'AI商品经理',
                                    emoji: '👗',
                                    message: `✔ [AI打样发布成功] 上架智能爆款 SPU 名：【${newItem.name}】，精细化定价为：¥${newPrice} (初始配发库存: ${newStock}件) 并同步写入 Firestore！`,
                                    type: 'success'
                                  }
                                ]);
                              })
                              .catch(err => handleFirestoreError(err, OperationType.WRITE, `tenants/${tenantId}/industries/${industry.id}/products/${newItemId}`));

                            setIsDevelopingProduct(false);
                            setNewProductInput('');
                            setNewProductPriceInput('');
                            setNewProductStockInput('100');
                          }, 1800);
                        }}
                        disabled={isDevelopingProduct || !newProductInput.trim()}
                        className="bg-[#1D9BF0] hover:bg-[#38BDF8] transition-all py-2.5 px-6 rounded-lg text-xs font-bold text-white cursor-pointer flex items-center justify-center space-x-1 shrink-0 disabled:opacity-50"
                      >
                        {isDevelopingProduct ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>打样中...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>智能上架</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Active Products Tables Grid */}
                  <div className="bg-[#09090B] border border-[#2F3336] rounded-xl overflow-hidden">
                    <div className="bg-[#0d0d0f] border-b border-[#2F3336] px-4 py-3 flex items-center justify-between">
                      <span className="text-xs font-mono text-[#8B949E] uppercase tracking-wider">在售商品</span>
                      <span className="text-[10px] text-zinc-400 font-mono">共 {productsList.length} 款在线</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#0c0c0e] text-[#8B949E] uppercase text-[9px] border-b border-[#2F3336]">
                          <tr>
                            <th className="p-3">视觉</th>
                            <th className="p-3">商品品名</th>
                            <th className="p-3 text-right">上游进价</th>
                            <th className="p-3 text-right">智能定价</th>
                            <th className="p-3 text-right">常态在售库存</th>
                            <th className="p-3 text-right">安全周转度</th>
                            <th className="p-3 text-center">操作管理</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2F3336]/40">
                          {productsList.map((p) => {
                            const isEditing = editingProductId === p.id;
                            const rawCost = (isEditing ? editingPrice * 0.42 : p.price * 0.42).toFixed(2);
                            return (
                              <tr key={p.id} className="hover:bg-neutral-900/40 transition-colors">
                                {isEditing ? (
                                  <>
                                    <td className="p-3">
                                      <select
                                        value={editingImage}
                                        onChange={(e) => setEditingImage(e.target.value)}
                                        className="bg-black border border-[#2F3336] rounded px-1.5 py-1 text-xs text-white text-base focus:outline-none"
                                      >
                                        {[
                                          '🍛', '🍖', '🍹', '🍔', '🍕', '🍰', '🍜', '🍣',
                                          '👗', '👖', '👕', '👚', '👜', '🕶', '👠', '👟',
                                          '🎒', '🌀', '☔', '📦', '🎁', '📱', '💻', '💡', '🔥'
                                        ].map(em => (
                                          <option key={em} value={em}>{em}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="p-3">
                                      <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="w-full bg-black border border-[#2F3336] focus:border-[#1D9BF0] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                                        maxLength={60}
                                      />
                                    </td>
                                    <td className="p-3 text-right text-gray-500">¥ {rawCost}</td>
                                    <td className="p-3 text-right">
                                      <input
                                        type="number"
                                        value={editingPrice}
                                        min="0"
                                        step="0.01"
                                        onChange={(e) => setEditingPrice(parseFloat(e.target.value) || 0)}
                                        className="w-24 bg-black border border-[#2F3336] focus:border-[#1D9BF0] rounded px-2 py-1 text-xs text-white text-right focus:outline-none font-mono"
                                      />
                                    </td>
                                    <td className="p-3 text-right">
                                      <input
                                        type="number"
                                        value={editingStock}
                                        min="0"
                                        onChange={(e) => setEditingStock(parseInt(e.target.value) || 0)}
                                        className="w-24 bg-black border border-[#2F3336] focus:border-[#1D9BF0] rounded px-2 py-1 text-xs text-white text-right focus:outline-none font-mono"
                                      />
                                    </td>
                                    <td className="p-3 text-right">
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                                        正在修改
                                      </span>
                                    </td>
                                    <td className="p-3 text-center">
                                      <div className="flex justify-center items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!editingName.trim()) return;
                                            // Save to Firestore
                                            setDoc(doc(db, 'tenants', tenantId, 'industries', industry.id, 'products', p.id), {
                                              ...p,
                                              name: editingName.trim(),
                                              price: editingPrice,
                                              stock: editingStock,
                                              image: editingImage
                                            })
                                              .then(() => {
                                                setLogs((prev) => [
                                                  ...prev,
                                                  {
                                                    id: Math.random().toString(),
                                                    timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                                    sender: '商户总控',
                                                    emoji: '🔧',
                                                    message: `✔ SPU商品规格及价格档案【${editingName.trim()}】修改成功，价格定价 ¥${editingPrice}，库存 ${editingStock} 件。已在 Firestore 数据库实时同步生效！`,
                                                    type: 'success'
                                                  }
                                                ]);
                                              })
                                              .catch(err => handleFirestoreError(err, OperationType.WRITE, `tenants/${tenantId}/industries/${industry.id}/products/${p.id}`));
                                            setEditingProductId(null);
                                          }}
                                          className="bg-[#1D9BF0] hover:bg-[#38BDF8] text-white px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer"
                                        >
                                          保存
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingProductId(null)}
                                          className="bg-zinc-800 hover:bg-zinc-700 text-gray-300 px-2 py-1 rounded text-[11px] transition-all cursor-pointer"
                                        >
                                          取消
                                        </button>
                                      </div>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="p-3 text-base">{p.image}</td>
                                    <td className="p-3 font-bold text-white">{p.name}</td>
                                    <td className="p-3 text-right text-gray-500">¥ {rawCost}</td>
                                    <td className="p-3 text-right text-sky-400 font-bold">¥ {p.price}</td>
                                    <td className="p-3 text-right text-white font-mono">{p.stock} 件</td>
                                    <td className="p-3 text-right">
                                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                                        p.stock > 100 
                                          ? 'bg-emerald-500/10 text-sky-400 border-sky-500/20' 
                                          : p.stock > 0 
                                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                                      }`}>
                                        {p.stock > 100 ? '在轨充足' : p.stock > 0 ? '少量存货' : '售罄补货'}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center">
                                      <div className="flex justify-center items-center gap-3">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingProductId(p.id);
                                            setEditingName(p.name);
                                            setEditingPrice(p.price);
                                            setEditingStock(p.stock);
                                            setEditingImage(p.image);
                                          }}
                                          className="text-[#38BDF8] hover:text-[#1D9BF0] hover:underline cursor-pointer"
                                        >
                                          编辑
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            deleteDoc(doc(db, 'tenants', tenantId, 'industries', industry.id, 'products', p.id))
                                              .then(() => {
                                                setLogs((prev) => [
                                                  ...prev,
                                                  {
                                                    id: Math.random().toString(),
                                                    timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                                    sender: '商户总控',
                                                    emoji: '🗑',
                                                    message: `✔ 商品【${p.name}】已成功下架封存，销毁其在售 SPU/SKU 档案，已实时同步至 Firestore。`,
                                                    type: 'info'
                                                  }
                                                ]);
                                              })
                                              .catch(err => handleFirestoreError(err, OperationType.DELETE, `tenants/${tenantId}/industries/${industry.id}/products/${p.id}`));
                                          }}
                                          className="text-red-500 hover:text-red-400 hover:underline cursor-pointer"
                                        >
                                          删除
                                        </button>
                                      </div>
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Categories Management view */}
              {productSubTab === 'categories' && (
                <div className="bg-[#09090B] border border-[#2F3336] p-6 rounded-xl space-y-6 animate-fadeIn text-left">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span className="text-sky-400 font-sans">🗂</span>
                      <span>前向商品分类（树状类目）配置中心</span>
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1">管理店铺内上架商品的自定义类目（如：热咖啡、秋季外套物料、B2B批料），支持实时云数据库挂接同步。</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-6 border-b border-[#2F3336]/60">
                    {/* New Category input */}
                    <div className="md:col-span-12 lg:col-span-5 bg-black/40 border border-[#2F3336] p-4 rounded-xl space-y-3.5">
                      <span className="text-xs font-bold text-zinc-300 block font-sans">✙ 创建全新类目名</span>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-neutral-400 block font-bold">新分类名</label>
                        <input 
                          type="text" 
                          value={newCategoryInput}
                          onChange={(e) => setNewCategoryInput(e.target.value)}
                          placeholder="例如：冷萃冰调系列"
                          className="w-full bg-black border border-neutral-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#1D9BF0] font-sans"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!newCategoryInput.trim()) return;
                          const cat = newCategoryInput.trim();
                          try {
                            await setDoc(doc(db, 'tenants', tenantId, 'industries', industry.id, 'categories', cat), { name: cat });
                            setNewCategoryInput('');
                            setLogs(prev => [
                              ...prev,
                              {
                                id: Math.random().toString(),
                                timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                sender: '商户数据库',
                                emoji: '🗂',
                                message: `✔ 成功添加全新商品分类：【${cat}】。已完美映射至云 Firestore 端。`,
                                type: 'success'
                              }
                            ]);
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="bg-[#1D9BF0] hover:bg-sky-400 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all cursor-pointer w-full"
                      >
                        注册并推送到前台
                      </button>
                    </div>

                    {/* List of active categories */}
                    <div className="md:col-span-12 lg:col-span-7 bg-black/20 border border-[#2F3336] p-4 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-zinc-300 block font-sans">📂 活跃在售类目列表 ({categoriesList.length})</span>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {categoriesList.map((cat, idx) => (
                          <div key={idx} className="flex items-center space-x-1.5 bg-[#111] border border-[#2F3336]/60 px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-300">
                            <span>📁</span>
                            <span>{cat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Management View */}
              {productSubTab === 'inventory' && (
                <div className="bg-[#09090B] border border-[#2F3336] p-6 rounded-xl space-y-6 animate-fadeIn text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-[#2F3336]/60 font-sans">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                        <span>📊</span>
                        <span>全局商品物理库存盘点管理</span>
                      </h3>
                      <p className="text-[10px] text-zinc-500 mt-1">全局统一盘存，直观监测微量或脱销异常。所作修改直接同步关联到买家点餐及排单端。</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#2F3336] text-zinc-500 font-mono">
                          <th className="pb-3 pt-1 pl-2">商品代号</th>
                          <th className="pb-3 pt-1">图片</th>
                          <th className="pb-3 pt-1">名称</th>
                          <th className="pb-3 pt-1">分类</th>
                          <th className="pb-3 pt-1">当前实物库存</th>
                          <th className="pb-3 pt-1">警戒标志</th>
                          <th className="pb-3 pt-1 text-center font-sans">快捷增减量控制（实时存盘）</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2F3336]/40">
                        {productsList.map((p, idx) => {
                          const isLow = p.stock <= 5;
                          const isOut = p.stock === 0;
                          return (
                            <tr key={idx} className="hover:bg-black/20 text-neutral-250">
                              <td className="py-3 font-mono text-[10px] pl-2 text-[#8B949E]">{p.id}</td>
                              <td className="py-2 text-lg">{p.image || '👗'}</td>
                              <td className="py-2 font-bold text-white text-xs">{p.name}</td>
                              <td className="py-2 font-mono text-zinc-400">{p.category || '通品'}</td>
                              <td className="py-2 text-white font-bold font-mono">{p.stock} 件</td>
                              <td className="py-2">
                                {isOut ? (
                                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[8.5px]">已售罄 🈲</span>
                                ) : isLow ? (
                                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[8.5px]">微量告急 ⚠️</span>
                                ) : (
                                  <span className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/25 px-2 py-0.5 rounded text-[8.5px]">充足 ✅</span>
                                )}
                              </td>
                              <td className="py-2">
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const nextStock = Math.max(0, p.stock - 5);
                                      const ref = doc(db, 'tenants', tenantId, 'industries', industry.id, 'products', p.id);
                                      await setDoc(ref, { stock: nextStock }, { merge: true })
                                        .catch(err => console.error("Error setting stock:", err));
                                    }}
                                    className="w-7 h-7 bg-black hover:bg-neutral-900 border border-[#2F3336] rounded text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                                  >
                                    -5
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const nextStock = p.stock + 10;
                                      const ref = doc(db, 'tenants', tenantId, 'industries', industry.id, 'products', p.id);
                                      await setDoc(ref, { stock: nextStock }, { merge: true })
                                        .catch(err => console.error("Error setting stock:", err));
                                    }}
                                    className="w-7 h-7 bg-black hover:bg-neutral-900 border border-[#2F3336] rounded text-white flex items-center justify-center font-bold text-xs cursor-pointer"
                                  >
                                    +10
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SKU Management View */}
              {productSubTab === 'sku' && (
                <div className="bg-[#09090B] border border-[#2F3336] p-6 rounded-xl space-y-6 animate-fadeIn text-left">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span className="text-sky-400">🎟</span>
                      <span>多规格 SKU 智能销售矩阵设置</span>
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1">选中大单品级 SPU，配置旗下多规格子属性变体（如不同尺码配特定色系的单独售价与独立持货盘仓）。</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 font-sans">
                    {/* Selector of product catalog */}
                    <div className="md:col-span-12 lg:col-span-5 bg-black/40 border border-[#2F3336] p-4 rounded-xl space-y-4">
                      <div className="space-y-1.5 font-sans">
                        <label className="text-[11px] font-mono text-zinc-400 block font-bold">🎯 选择对应主体商品 SPU</label>
                        <select
                          value={selectedProductSkuUid}
                          onChange={(e) => setSelectedProductSkuUid(e.target.value)}
                          className="w-full bg-[#111] border border-neutral-700 rounded-lg p-2 text-xs text-white focus:outline-none"
                        >
                          <option value="">-- 请选择关联商品 --</option>
                          {productsList.map(p => (
                            <option key={p.id} value={p.id}>{p.image} {p.name} (ID: {p.id})</option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-black/60 p-3 rounded-lg border border-[#2F3336]/60 space-y-3.5 text-xs font-sans">
                        <span className="font-bold text-zinc-300 block font-sans">✙ 注册全新 SKU 变体信息</span>
                        
                        <div className="space-y-2 font-sans">
                          <div className="space-y-0.5">
                            <label className="text-[9px] text-[#8B949E] uppercase tracking-wider font-mono">子规格名称 (如-尺寸: S | 颜色: 玄黑)</label>
                            <input
                              type="text"
                              value={newSkuVariantName}
                              onChange={(e) => setNewSkuVariantName(e.target.value)}
                              placeholder="尺寸: XXL | 颜色: 青瓦"
                              className="w-full bg-black border border-neutral-700 rounded p-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-0.5 font-sans">
                              <label className="text-[9px] text-[#8B949E] font-mono">售价 ¥</label>
                              <input
                                type="number"
                                value={newSkuVariantPrice}
                                onChange={(e) => setNewSkuVariantPrice(e.target.value)}
                                placeholder="219"
                                className="w-full bg-black border border-neutral-700 rounded p-1.5 text-xs text-white focus:outline-none font-mono"
                              />
                            </div>
                            <div className="space-y-0.5 font-sans">
                              <label className="text-[9px] text-[#8B949E] font-mono">单独库存</label>
                              <input
                                type="number"
                                value={newSkuVariantStock}
                                onChange={(e) => setNewSkuVariantStock(e.target.value)}
                                placeholder="50"
                                className="w-full bg-black border border-neutral-700 rounded p-1.5 text-xs text-white focus:outline-none font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                          type="button"
                          onClick={() => {
                            if (!selectedProductSkuUid) {
                              alert('请先选择要关联的商品 SPU 主体！');
                              return;
                            }
                            if (!newSkuVariantName.trim() || !newSkuVariantPrice || !newSkuVariantStock) {
                              alert('请输入完整的变体子规格名、售价及独立库存！');
                              return;
                            }
                            const variantObj = {
                              name: newSkuVariantName.trim(),
                              price: Number(newSkuVariantPrice),
                              stock: Number(newSkuVariantStock)
                            };
                            setSkuVariants(prev => [...prev, variantObj]);
                            setNewSkuVariantName('');
                            setNewSkuVariantPrice('');
                            setNewSkuVariantStock('');
                            alert('SKU变体子类注册成功！');
                          }}
                          className="w-full bg-[#1D9BF0] hover:bg-sky-450 text-white font-bold text-xs py-2 rounded-lg cursor-pointer animate-pulse"
                        >
                          提交注册此 SKU 变体
                        </button>
                      </div>

                      {/* Right-hand side display list of variants */}
                      <div className="md:col-span-12 lg:col-span-7 bg-black/20 border border-[#2F3336] p-4 rounded-xl space-y-4">
                        <span className="text-xs font-bold text-zinc-300 block font-sans">📊 已经注册生成的商品变体矩阵 ({skuVariants.length})</span>
                        <div className="space-y-2.5 font-sans font-sans">
                          {skuVariants.map((v, index) => (
                            <div key={index} className="bg-black border border-[#2F3336] p-3 rounded-lg flex justify-between items-center text-xs text-zinc-300">
                              <div>
                                <p className="font-bold text-white font-mono">{v.name}</p>
                                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">关联 SPU ID：{selectedProductSkuUid || '未知'}</p>
                              </div>
                              <div className="text-right font-mono text-zinc-400">
                                <p>售价: <span className="text-[#38BDF8]">¥ {v.price}</span></p>
                                <p>库存: <span className="text-white">{v.stock} 件</span></p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Global credit suppliers qualification view */}
                {productSubTab === 'suppliers' && (
                  <div className="bg-[#09090B] border border-[#2F3336] p-6 rounded-xl space-y-6 animate-fadeIn text-left">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center space-x-2 font-sans">
                        <span className="text-sky-455">🤝</span>
                        <span>上游供应链资质管理与授信准入</span>
                      </h3>
                      <p className="text-[10px] text-zinc-500 mt-1">登记公司及店铺的上游合作供货商、物流及质检机构，执行信用履约跟踪，支持货源渠道多轮比选。</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Register new supplier layout menu */}
                      <div className="md:col-span-12 lg:col-span-4 bg-black/40 border border-[#2F3336] p-4 rounded-xl space-y-4">
                        <span className="text-xs font-bold text-zinc-300 block font-sans">✙ 登记新的上游供应链伙伴</span>

                        <div className="space-y-3 text-xs">
                          <div className="space-y-1">
                            <label className="text-[10px] text-[#8B949E] font-mono">企业 / 机构伙伴名称</label>
                            <input
                              type="text"
                              value={newSupplierName}
                              onChange={(e) => setNewSupplierName(e.target.value)}
                              placeholder="例如: 杭州尚德服装辅料有限公司"
                              className="w-full bg-black border border-neutral-700 rounded p-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] text-[#8B949E] font-mono font-sans">供应物料类目</label>
                            <input
                              type="text"
                              value={newSupplierCategory}
                              onChange={(e) => setNewSupplierCategory(e.target.value)}
                              placeholder="例如: 羽绒辅料 / 餐饮冷链"
                              className="w-full bg-black border border-neutral-700 rounded p-1.5 text-xs text-white focus:outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 font-sans">
                            <div className="space-y-1">
                              <label className="text-[10px] text-[#8B949E] font-mono">销售接口负责</label>
                              <input
                                type="text"
                                value={newSupplierContact}
                                onChange={(e) => setNewSupplierContact(e.target.value)}
                                placeholder="陈经理"
                                className="w-full bg-black border border-neutral-700 rounded p-1.5 text-xs text-white focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1 font-sans">
                              <label className="text-[10px] text-[#8B949E] font-mono">结算电话</label>
                              <input
                                type="text"
                                value={newSupplierPhone}
                                onChange={(e) => setNewSupplierPhone(e.target.value)}
                                placeholder="0571-8818****"
                                className="w-full bg-black border border-neutral-700 rounded p-1.5 text-xs text-white focus:outline-none font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!newSupplierName.trim() || !newSupplierContact || !newSupplierPhone || !newSupplierCategory) {
                              alert('请输入完整的供应商名称、经营类别、联系人及手机号！');
                              return;
                            }
                            const supObj = {
                              name: newSupplierName.trim(),
                              category: newSupplierCategory.trim(),
                              contact: newSupplierContact.trim(),
                              phone: newSupplierPhone.trim(),
                              status: '评级A'
                            };
                            setSuppliersList(prev => [...prev, supObj]);
                            setNewSupplierName('');
                            setNewSupplierContact('');
                            setNewSupplierPhone('');
                            setNewSupplierCategory('');
                            alert('上游供应商协议准入审核存盘通过，已录入供应链系统！');
                          }}
                          className="w-full bg-[#1D9BF0] hover:bg-sky-400 text-white font-bold text-xs py-2 rounded-lg cursor-pointer"
                        >
                          签署正式采购物料框架协议
                        </button>
                      </div>

                    {/* List of current active suppliers */}
                    <div className="md:col-span-12 lg:col-span-8 bg-black/20 border border-[#2F3336] p-4 rounded-xl space-y-3 font-sans">
                      <span className="text-xs font-bold text-zinc-300 block">📊 全球授信供应商资质名录 ({suppliersList.length})</span>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px] font-mono text-zinc-450 border-collapse">
                          <thead>
                            <tr className="border-b border-[#2F3336] text-zinc-500 whitespace-nowrap">
                              <th className="pb-2 text-left pl-1">供应商</th>
                              <th className="pb-2 text-left">供物种类</th>
                              <th className="pb-2 text-left">销售渠道负责人</th>
                              <th className="pb-2 text-left">结算对接固话</th>
                              <th className="pb-2 text-left">授信履约评级</th>
                            </tr>
                          </thead>
                          <tbody>
                            {suppliersList.map((sup, key) => (
                              <tr key={key} className="border-b border-[#2F3336]/35 text-zinc-200">
                                <td className="py-2 pl-1 font-bold text-white">{sup.name}</td>
                                <td className="py-2 text-sky-450">{sup.category}</td>
                                <td className="py-2 text-zinc-300">{sup.contact}</td>
                                <td className="py-2 text-zinc-400">{sup.phone}</td>
                                <td className="py-2">
                                  <span className="bg-sky-500/10 text-[#38BDF8] border border-[#1D9BF0]/20 px-2 py-0.5 rounded text-[8.5px]">{sup.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Purchase Orders View */}
              {productSubTab === 'purchase' && (
                <div className="bg-[#09090B] border border-[#2F3336] p-6 rounded-xl space-y-6 animate-fadeIn text-left animate-fadeIn">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2 font-sans">
                      <span className="text-sky-450">📝</span>
                      <span>原装物料财务采购单(Purchase Bill)生成台</span>
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-1">创建和提交物料框架大批量采购出纳单，生成采购回执单并向流水总账注入资金占用支出。</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 font-sans">
                    {/* Build contract purchase layout menu */}
                    <div className="md:col-span-12 lg:col-span-5 bg-black/40 border border-[#2F3336]/60 p-4 rounded-xl space-y-4 font-sans">
                      <span className="text-xs font-bold text-zinc-300 block font-sans">✙ 新建上游采购契约</span>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9.5px] text-[#8B949E] font-mono block">1. 指定供货商资质</label>
                          <select
                            value={purchaseSelectedSupplier}
                            onChange={(e) => setPurchaseSelectedSupplier(e.target.value)}
                            className="w-full bg-black border border-neutral-700 rounded p-2 text-xs text-white"
                          >
                            <option value="">-- 选择供应商 --</option>
                            {suppliersList.map(sup => (
                              <option key={sup.id} value={sup.name}>{sup.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9.5px] text-[#8B949E] font-mono block">2. 选择意向大货品类物料</label>
                          <select
                            value={purchaseSelectedProduct}
                            onChange={(e) => setPurchaseSelectedProduct(e.target.value)}
                            className="w-full bg-black border border-neutral-700 rounded p-2 text-xs text-white"
                          >
                            <option value="">-- 选择商品 --</option>
                            {productsList.map(p => (
                              <option key={p.id} value={p.name}>{p.image} {p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-[#8B949E] font-mono block">3. 货运总量</label>
                            <input
                              type="number"
                              value={purchaseQtyInput}
                              onChange={(e) => setPurchaseQtyInput(e.target.value)}
                              className="w-full bg-black border border-neutral-700 rounded p-2 text-xs text-white text-center font-mono font-bold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9.5px] text-[#8B949E] font-mono block">4. 单件物料成本 ¥</label>
                            <input
                              type="number"
                              value={purchasePriceInput}
                              onChange={(e) => setPurchasePriceInput(e.target.value)}
                              className="w-full bg-black border border-neutral-700 rounded p-2 text-xs text-white text-center font-mono font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-neutral-950 p-3 rounded-lg border border-[#2F3336]/60 flex justify-between items-center text-xs">
                        <span className="text-zinc-400">预计批量到货总对价:</span>
                        <span className="text-[#38BDF8] font-bold font-mono text-sm leading-none">
                          ¥ {Number(purchaseQtyInput) * Number(purchasePriceInput)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!purchaseSelectedSupplier || !purchaseSelectedProduct || !purchaseQtyInput || !purchasePriceInput) {
                            alert('请设置完整的上游供应商名、大货品类、货量和单件拿货成本价！');
                            return;
                          }
                          const poObj = {
                            id: 'PO' + new Date().toISOString().slice(0,10).replace(/[^0-9]/g, '') + Math.random().toString().slice(2, 6),
                            supplierName: purchaseSelectedSupplier,
                            productName: purchaseSelectedProduct,
                            qty: Number(purchaseQtyInput),
                            amount: Number(purchaseQtyInput) * Number(purchasePriceInput),
                            date: new Date().toISOString().slice(0, 10),
                            status: '等待付款'
                          };
                          setPurchaseOrdersList(prev => [poObj, ...prev]);
                          setLogs(prev => [
                            ...prev,
                            {
                              id: Math.random().toString(),
                              timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                              sender: '供应链结算',
                              emoji: '📝',
                              message: `✔ 成功拟定大货订货对款合同【${poObj.id}】。物料：${purchaseSelectedProduct} x${purchaseQtyInput}。已向出纳发起排款审核流程。`,
                              type: 'info'
                            }
                          ]);
                          alert('合约定购出纳账单拟定完毕，已推送出纳中心挂载应付总账！');
                        }}
                        className="w-full bg-emerald-500 hover:bg-emerald-450 text-white font-extrabold text-xs py-2 rounded-lg cursor-pointer"
                      >
                        签署大货合规订购物料合同并划账
                      </button>
                    </div>

                    {/* List of procurement records */}
                    <div className="md:col-span-12 lg:col-span-7 bg-black/20 border border-[#2F3336] p-4 rounded-xl space-y-4">
                      <span className="text-xs font-bold text-zinc-300 block font-sans">📊 历史在档采购划款货单 ({purchaseOrdersList.length})</span>
                      <div className="space-y-2.5">
                        {purchaseOrdersList.map((po, index) => (
                          <div key={index} className="bg-black/60 border border-[#2F3336] p-3 rounded-lg text-[10.5px] font-mono space-y-2 text-zinc-300">
                            <div className="flex justify-between items-center border-b border-[#2F3336]/45 pb-1.5">
                              <span className="text-white font-bold text-[11px] font-mono">{po.id}</span>
                              <span className="text-zinc-500">{po.date}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>供应商: <span className="text-zinc-200">{po.supplierName}</span></span>
                              <span>对款金额: <span className="text-[#38BDF8] font-bold">¥ {po.amount}</span></span>
                            </div>
                            <div className="flex justify-between text-zinc-400 font-sans">
                              <span>货品名: <span className="text-zinc-200">{po.productName}</span></span>
                              <span>批量数: <span className="text-zinc-200 font-bold font-mono">{po.qty} 件</span></span>
                            </div>
                            <div className="flex justify-between items-center pt-1.5 border-t border-[#2F3336]/45">
                              <span className="bg-[#1D9BF0]/10 text-sky-450 border border-[#1D9BF0]/20 px-1.5 py-0.2 rounded text-[8px]">{po.status}</span>
                              {po.status === '等待付款' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPurchaseOrdersList(prev => prev.map((item, i) => i === index ? { ...item, status: '已发货' } : item));
                                    alert('划转付款对数成功，已通知该供应商加急装车发货配送！');
                                  }}
                                  className="bg-black hover:bg-zinc-850 border border-[#2F3336] rounded px-2.5 py-1 text-[8.5px] text-emerald-400 font-bold cursor-pointer"
                                >
                                  确认划账打款
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

              {/* VIEW 4: ORDER 订单 (📈 订单) */}
              {activeMenu === 'order' && (
                <div className="space-y-6">
                  
                  {/* Category Selection Tabs & Fast Simulation controls */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left category switch tabs */}
                    <div className="lg:col-span-8 bg-[#09090B] border border-[#2F3336] p-4 rounded-xl flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">订单处理</h3>
                        <p className="text-[11px] text-zinc-400 mt-0.5">外卖与堂食自动处理。</p>
                      </div>

                      {/* Filter Sub-Tabs */}
                      {/* Filter Sub-Tabs */}
                      <div className="flex bg-black p-1 rounded-lg border border-[#2F3336] gap-1.5 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setActiveOrderCategory('all')}
                          className={`flex-1 sm:flex-initial text-center px-4 py-2 rounded-md text-xs font-bold transition-all duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
                            activeOrderCategory === 'all'
                              ? 'bg-[#1D9BF0] text-white shadow-md'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                          }`}
                        >
                          <span>全部订单</span>
                          <span className="text-[9px] bg-black/40 px-1.5 py-0.2 rounded font-mono text-zinc-300">
                            {ordersList.length}
                          </span>
                        </button>

                        
                        <button
                          type="button"
                          onClick={() => setActiveOrderCategory('dine_in')}
                          className={`flex-1 sm:flex-initial text-center px-4 py-2 rounded-md text-xs font-bold transition-all duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
                            activeOrderCategory === 'dine_in'
                              ? 'bg-[#1D9BF0] text-white shadow-md'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                          }`}
                        >
                          <span>堂食点单</span>
                          <span className="text-[9px] bg-black/40 px-1.5 py-0.2 rounded font-mono text-zinc-300">
                            {ordersList.filter(o => o.type === 'dine_in').length}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveOrderCategory('takeout')}
                          className={`flex-1 sm:flex-initial text-center px-4 py-2 rounded-md text-xs font-bold transition-all duration-150 flex items-center justify-center space-x-1.5 cursor-pointer ${
                            activeOrderCategory === 'takeout'
                              ? 'bg-[#1D9BF0] text-white shadow-md'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                          }`}
                        >
                          <span>外卖点单</span>
                          <span className="text-[9px] bg-black/40 px-1.5 py-0.2 rounded font-mono text-zinc-300">
                            {ordersList.filter(o => o.type === 'takeout').length}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Right Sandbox Injectors representing instant notifications */}
                    <div className="lg:col-span-4 bg-[#09090B] border border-dashed border-[#1D9BF0]/50 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <Volume2 className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
                          <h4 className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-bold">提示机制 / 模拟测试</h4>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal">
                          模拟外卖/堂食的高并发推送与弹窗。
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sans">
                        <button
                          type="button"
                          onClick={() => {
                            const newId = 'SIM-TS-' + Math.floor(Math.random() * 899 + 100);
                            const tbl = 'Table-' + Math.floor(Math.random() * 20 + 1);
                            const items = ['风味蜜汁叉烧双人餐 + 手打热茶', '金牌石磨肠粉 + 乌龙柠檬茶', '金牌手工肠粉 2份'];
                            const selectedItem = items[Math.floor(Math.random() * items.length)];
                            const computedPrice = selectedItem.includes('叉烧') ? 83 : selectedItem.includes('2份') ? 36 : 33;
                            
                            const simOrder = {
                              id: newId,
                              time: '刚才',
                              location: `店内 ${tbl} 扫码下单`,
                              desc: selectedItem,
                              price: computedPrice,
                              status: 'pending',
                              type: 'dine_in',
                              customerName: `${tbl}自助消费`,
                              phone: '店内自助'
                            };

                            // Write sandbox dining order directly to Firestore
                            const orderToSave = {
                              ...simOrder,
                              tracking: ''
                            };
                            setDoc(doc(db, 'tenants', tenantId, 'industries', industry.id, 'orders', newId), orderToSave)
                              .catch(err => handleFirestoreError(err, OperationType.WRITE, `tenants/${tenantId}/industries/${industry.id}/orders/${newId}`));

                            updateMetricsInDb(computedPrice, 1);

                            setLogs(prev => [
                              ...prev,
                              {
                                id: Math.random().toString(),
                                timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                sender: '扫码终端',
                                emoji: '🍱',
                                message: `🔔 【扫码下单响铃】${tbl} 客户完成自主扫码，起锅通知已下达，账金 ¥${computedPrice} 结算挂账。`,
                                type: 'success'
                              }
                            ]);

                            setIncomingOrderAlert(simOrder);
                            playLiveOrderChime();
                          }}
                          className="bg-amber-950/40 hover:bg-amber-900/60 transition-all text-amber-400 text-[10px] py-1.5 rounded border border-amber-800/40 font-bold cursor-pointer text-center"
                        >
                          堂食秒下单 🍱
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const newId = 'SIM-WM-' + Math.floor(Math.random() * 899 + 100);
                            const streets = ['望京麒麟社A座', 'SOHO现代城B座', '达美中心4号楼', '三里屯soho', '国贸写字楼二期'];
                            const selectedStreet = streets[Math.floor(Math.random() * streets.length)] + ` ${Math.floor(Math.random() * 20 + 1)}层`;
                            const names = ['李先生', '郭女士', '陈大明', '高小姐', '任先生'];
                            const selectedName = names[Math.floor(Math.random() * names.length)];
                            
                            const simOrder = {
                              id: newId,
                              time: '刚才',
                              location: `送往 ${selectedStreet}`,
                              desc: '金牌石磨手工肠粉 1份 + 风味蜜汁叉烧餐 + 柠檬茶 2杯',
                              price: 101,
                              status: 'pending',
                              type: 'takeout',
                              customerName: selectedName,
                              phone: '186****' + Math.floor(Math.random() * 8999 + 1000)
                            };

                            // Write sandbox takeout order directly to Firestore
                            const orderToSave = {
                              ...simOrder,
                              tracking: ''
                            };
                            setDoc(doc(db, 'tenants', tenantId, 'industries', industry.id, 'orders', newId), orderToSave)
                              .catch(err => handleFirestoreError(err, OperationType.WRITE, `tenants/${tenantId}/industries/${industry.id}/orders/${newId}`));

                            updateMetricsInDb(101, 1);

                            setLogs(prev => [
                              ...prev,
                              {
                                id: Math.random().toString(),
                                timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                sender: '美大网关',
                                emoji: '🛵',
                                message: `🔔 【美团外卖落地响】接到线上外卖外送新订单【${newId}】，自动核对履约地址：${selectedStreet}。`,
                                type: 'success'
                              }
                            ]);

                            setIncomingOrderAlert(simOrder);
                            playLiveOrderChime();
                          }}
                          className="bg-blue-950/40 hover:bg-blue-900/60 transition-all text-blue-300 text-[10px] py-1.5 rounded border border-blue-800/40 font-bold cursor-pointer text-center"
                        >
                          外卖秒下单 🛵
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Orders lists pipeline */}
                  <div className="bg-[#09090B] border border-[#2F3336] rounded-xl overflow-hidden">
                    <div className="bg-[#0d0d0f] border-b border-[#2F3336] px-4 py-3 flex items-center justify-between">
                      <span className="text-xs font-mono text-[#8B949E] uppercase tracking-wider">
                        订单列表 ({
                          activeOrderCategory === 'all' ? '全部' :
                          activeOrderCategory === 'dine_in' ? '堂食' : '外卖'
                        })
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        待处理 pending: {ordersList.filter(o => o.status === 'pending').length} 笔
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#0c0c0e] text-[#8B949E] uppercase text-[9px] border-b border-[#2F3336]">
                          <tr>
                            <th className="p-3">类型</th>
                            <th className="p-3">订单号 / ID</th>
                            <th className="p-3">消费详情</th>
                            <th className="p-3">地址/桌台号</th>
                            <th className="p-3">顾客联系信息</th>
                            <th className="p-3 text-right">营业利得</th>
                            <th className="p-3 text-right">流转状态</th>
                            <th className="p-3 text-right">履约行动</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2F3336]/40">
                          {ordersList
                            .filter(o => activeOrderCategory === 'all' || (o.type || 'takeout') === activeOrderCategory)
                            .map((ord) => (
                              <tr key={ord.id} className="hover:bg-neutral-900/40 transition-colors">
                                <td className="p-3 select-none">
                                  {ord.type === 'dine_in' ? (
                                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      <span>堂食</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                      <span>外卖</span>
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 font-bold text-white">{ord.id}</td>
                                <td className="p-3 text-white font-sans max-w-[170px] truncate" title={ord.desc}>{ord.desc}</td>
                                <td className="p-3 text-neutral-300 font-sans max-w-[150px] truncate" title={ord.location}>{ord.location}</td>
                                <td className="p-3 text-gray-400 font-sans">
                                  {ord.customerName} <span className="text-[10px] text-zinc-500">({ord.phone || '堂食/免号'})</span>
                                </td>
                                <td className="p-3 text-right text-sky-400 font-bold font-mono">¥ {ord.price}</td>
                                <td className="p-3 text-right font-mono">
                                  {ord.status === 'pending' ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse">
                                      待制作
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/10 text-sky-400 border border-sky-500/20">
                                      {ord.type === 'dine_in' ? '传菜送达' : '骑手极速派送'}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  {ord.status === 'pending' ? (
                                    <div className="flex justify-end space-x-1.5">
                                      {ord.type === 'dine_in' ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const tableLoc = ord.location.split(' ')[1] || '号位已传达';
                                            setDoc(doc(db, 'tenants', tenantId, 'industries', industry.id, 'orders', ord.id), {
                                              status: 'dispatched',
                                              tracking: '桌号: ' + tableLoc
                                            }, { merge: true })
                                              .catch(err => handleFirestoreError(err, OperationType.UPDATE, `tenants/${tenantId}/industries/${industry.id}/orders/${ord.id}`));
                                            
                                            setLogs(prev => [
                                              ...prev,
                                              {
                                                id: Math.random().toString(),
                                                timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                                sender: '后厨传菜',
                                                emoji: '🧑‍🍳',
                                                message: `✔️ 堂食单【${ord.id}】起锅完成，智能传菜机器人已定位送到座位！`,
                                                type: 'success'
                                              }
                                            ]);
                                          }}
                                          className="bg-amber-600 hover:bg-amber-500 duration-100 text-white font-bold text-[9px] px-2 py-1 rounded cursor-pointer"
                                        >
                                          一键传菜送达
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const simulatedTracking = 'MT' + Math.floor(Math.random() * 89999 + 10000);
                                            setDoc(doc(db, 'tenants', tenantId, 'industries', industry.id, 'orders', ord.id), {
                                              status: 'dispatched',
                                              tracking: simulatedTracking
                                            }, { merge: true })
                                              .catch(err => handleFirestoreError(err, OperationType.UPDATE, `tenants/${tenantId}/industries/${industry.id}/orders/${ord.id}`));

                                            setLogs(prev => [
                                              ...prev,
                                              {
                                                id: Math.random().toString(),
                                                timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                                sender: '美团专骑',
                                                emoji: '🛵',
                                                message: `✔️ 外卖单【${ord.id}】已由骑手背箱接单，骑手电话 139****4243，数字物流单号: ${simulatedTracking}。`,
                                                type: 'success'
                                              }
                                            ]);
                                          }}
                                          className="bg-blue-600 hover:bg-blue-500 duration-100 text-white font-bold text-[9px] px-2 py-1 rounded cursor-pointer"
                                        >
                                          呼叫骑手配送
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-zinc-500 font-mono">
                                      {ord.tracking || '已处理'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 5: CUSTOMER 客服 (👥 客户) */}
              {activeMenu === 'customer' && (
                <div className="space-y-6">
                  {/* Complaint list and live dispute solver card */}
                  <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                        <h3 className="text-xs font-mono uppercase tracking-wider text-rose-400">客户纠纷</h3>
                      </div>
                      <span className="text-[9px] bg-rose-950/40 text-rose-400 border border-rose-900/30 px-2 py-0.5 rounded font-mono">紧急纠纷</span>
                    </div>

                    <div className="p-4 bg-black border border-rose-950/40 rounded-xl space-y-3.5">
                      <div className="flex items-center space-x-3 text-xs">
                        <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 select-none font-bold">
                          👵
                        </div>
                        <div>
                          <p className="font-bold text-white">李阿姨的投诉</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">需降级调停。</p>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-300 leading-relaxed font-mono">
                        {crmLog}
                      </p>

                      <div className="pt-2 flex justify-end">
                        {disputeResolved === 'active' && (
                          <button
                            onClick={() => {
                              setDisputeResolved('resolving');
                              setCrmLog('▶ 客服正在与李阿姨取得联系，沟通解决方案，极速代发 ¥5 代金券并配备一键退换保障...');

                              setTimeout(() => {
                                setDisputeResolved('solved');
                                setCrmLog('👴 李阿姨的纠纷已妥善解决。\n【回访反馈】：“态度诚妥，送了代金券，还提供了退换保障，就不申请退款了，给个好评！”');
                                
                                setLogs((prev) => [
                                  ...prev,
                                  {
                                    id: Math.random().toString(),
                                    timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                    sender: '客服回访',
                                    emoji: '💬',
                                    message: '🎉 成功化解纠纷！提供退退换货保障与代金券补偿，赢得老客好评。',
                                    type: 'success'
                                  }
                                ]);
                              }, 2500);
                            }}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2 px-5 rounded-lg cursor-pointer"
                          >
                            一键调停
                          </button>
                        )}

                        {disputeResolved === 'resolving' && (
                          <div className="text-xs text-yellow-500 font-mono flex items-center space-x-1.5 animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>正在安抚...</span>
                          </div>
                        )}

                        {disputeResolved === 'solved' && (
                          <div className="text-xs text-sky-400 font-bold font-mono flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>✔ 已成功拦截</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Regular VIP card indexes */}
                  <div className="bg-[#09090B] border border-[#2F3336] rounded-xl overflow-hidden">
                    <div className="bg-[#0d0d0f] border-b border-[#2F3336] px-4 py-3">
                      <span className="text-xs font-mono text-[#8B949E] uppercase tracking-wider">活跃顾客</span>
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                      {[
                        { title: '达人: 菲菲酱 💃', salesCount: 5, spent: 3420, tag: '传播达人', tagColor: 'text-purple-400 bg-purple-500/10' },
                        { title: '熟客: 陈先生 👨‍💼', salesCount: 12, spent: 5490, tag: '铁杆老客', tagColor: 'text-sky-400 bg-emerald-500/10' },
                        { title: '粉丝: 琪琪子 👩‍🎨', salesCount: 3, spent: 1120, tag: '上新关注', tagColor: 'text-blue-400 bg-blue-500/10' },
                      ].map((vip, i) => (
                        <div key={i} className="p-3.5 bg-black rounded-lg border border-[#2F3336]/60 space-y-2">
                          <p className="font-bold text-white">{vip.title}</p>
                          <div className="text-[11px] text-gray-400 space-y-0.5">
                            <p>累计成单: {vip.salesCount} 笔</p>
                            <p>贡献金额: ¥ {vip.spent}</p>
                          </div>
                          <span className={`inline-block text-[9px] px-2 py-0.5 rounded ${vip.tagColor}`}>
                            {vip.tag}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 6: MARKETING 营销 (📣 营销) */}
              {activeMenu === 'marketing' && (
                <div className="space-y-6">
                  {/* Sliding budget controllers */}
                  <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">预算规划</h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-neutral-400">投放预算：</span>
                        <span className="text-sky-400 font-bold">¥ {mktBudget} 元</span>
                      </div>
                      <input 
                        type="range"
                        min="50"
                        max="1000"
                        step="50"
                        value={mktBudget}
                        onChange={(e) => setMktBudget(parseInt(e.target.value))}
                        className="w-full accent-[#1D9BF0] cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-[#8B949E]">
                        <span>冷启动 (¥50)</span>
                        <span>全网推量 (¥1000)</span>
                      </div>
                    </div>
                  </div>

                  {/* Sowing seed text copywriter helpers */}
                  <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
                    <div>
                      <h3 className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">营销种草</h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">输入核心，生成推广文案</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={mktTopic}
                          onChange={(e) => setMktTopic(e.target.value)}
                          placeholder="例如: 法式长裙 / 椒麻肉松"
                          className="flex-1 bg-black border border-[#2F3336] rounded-lg p-2.5 text-xs text-white focus:border-[#1D9BF0] focus:outline-none"
                        />
                        <button
                          onClick={async () => {
                            if (!mktTopic.trim()) return;
                            setMktLoading(true);
                            setLogs((prev) => [
                              ...prev,
                              {
                                id: Math.random().toString(),
                                timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                sender: 'AI营销经理',
                                emoji: '📣',
                                message: `【${selectedStaff.name}】正在运用[爆款文案吸引力法则]，一键撰写极富时尚质感的推广文案。`,
                                type: 'info'
                              }
                            ]);

                            // Trigger complete server-side prompt calling for real marketing content or fallback simulations
                            try {
                              const response = await fetch('/api/chat', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  message: `请作为【${selectedStaff.role} - ${selectedStaff.name}】，为我们这款最新的产品【${mktTopic}】撰写一段极致吸引力的小红书爆款带货种草文案。包含生动表情图、买家核心痛点、情绪价值和爆款标签。回复尽量凝练，控制在 150 字以内。`,
                                  employeeRole: selectedStaff.role,
                                  employeeName: selectedStaff.name,
                                  employeeDesc: selectedStaff.desc,
                                  industryName: industry.name,
                                  industryTagline: industry.tagline,
                                  strategyName: strategy.name,
                                  strategyDesc: strategy.desc
                                })
                              });
                              const data = await response.json();
                              if (data && data.success && data.reply) {
                                setMktOutput(data.reply.trim());
                              } else {
                                throw new Error("API 空回复");
                              }
                            } catch (e) {
                              // Offline fallback
                              setTimeout(() => {
                                setMktOutput(`✨ 【小红书爆款种草】${mktTopic} 来啦！🥰\n\n一穿上就真的惊艳到了！优雅古典感迎面扑来，真的是春夏季的完美救赎，舒适度可以说是100分。细节材质质感拉满，微风扫过自带高级慵懒滤镜～\n\n省心搭配必备！姐妹们闭眼囤，谁穿谁惊艳！💖\n#今日穿搭 #${mktTopic} #高质感生活`);
                              }, 1200);
                            } finally {
                              setMktLoading(false);
                            }
                          }}
                          disabled={mktLoading || !mktTopic.trim()}
                          className="bg-[#1D9BF0] hover:bg-[#38BDF8] transition-all text-white font-bold text-xs py-2.5 px-6 rounded-lg cursor-pointer shrink-0 disabled:opacity-50"
                        >
                          {mktLoading ? '生成中...' : '营销生成'}
                        </button>
                      </div>

                      {mktOutput && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-500 block font-mono">生成结果</span>
                          <textarea
                            value={mktOutput}
                            readOnly
                            className="w-full bg-[#050505] text-neutral-200 border border-[#2F3336] rounded-xl p-4 text-xs font-mono h-32 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 7: ANALYTICS 分析 (📊 分析) */}
              {activeMenu === 'analytics' && (
                (userRole === 'customer') ? (
                  <div className="w-full bg-[#09090B] border border-[#2F3336] p-10 rounded-xl text-center space-y-4 max-w-xl mx-auto my-12 animate-fadeIn">
                    <div className="w-12 h-12 mx-auto rounded-full bg-yellow-950/20 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white tracking-tight">🚫 权限不足 (Access Restrained)</h4>
                      <p className="text-xs text-neutral-400 leading-normal">
                        您的当前席位角色为 <strong className="text-amber-400">[{userRole === 'customer' ? '进店顾客/买家' : userRole}]</strong>。查阅公司核心资产负债、成交流水折线图等核心敏感报表仅限对商户内部人员（如 **Founder / Manager / Staff**）授予。
                      </p>
                    </div>
                    <div className="text-[10px] font-mono text-[#8B949E] italic bg-neutral-950 p-2.5 rounded border border-neutral-800">
                      提示: 请在顶部控制中心导航栏中，切换账户角色为「创始人」或「副总裁/运营员工」进行调试。
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                  {/* Dynamic Recharts Visualizations Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 1. Daily Sales Trends (Line Chart) */}
                    <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Activity className="w-4 h-4 text-sky-400" />
                          <h3 className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">
                            成交趋势
                          </h3>
                        </div>
                        <span className="text-[10px] bg-sky-950 text-sky-400 border border-emerald-800/60 px-2 py-0.5 rounded font-mono">
                          实时数据
                        </span>
                      </div>

                      <div className="h-[240px] w-full text-xs font-mono mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReLineChart
                            data={getDailySalesData()}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#2F3336" vertical={false} />
                            <XAxis
                              dataKey="date"
                              stroke="#8B949E"
                              tickLine={false}
                              axisLine={false}
                              style={{ fontSize: '10px' }}
                            />
                            <YAxis
                              stroke="#8B949E"
                              tickLine={false}
                              axisLine={false}
                              style={{ fontSize: '10px' }}
                              tickFormatter={(v) => `¥${v}`}
                            />
                            <ReTooltip content={<SlsTooltip />} />
                            <Line
                              type="monotone"
                              dataKey="sales"
                              stroke="#10b981"
                              strokeWidth={2.5}
                              activeDot={{ r: 6, stroke: '#09090B', strokeWidth: 2 }}
                              dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                              name="成交总额"
                            />
                          </ReLineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 2. Channel Acquisition Percentages (Bar Chart) */}
                    <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                          <h3 className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">
                            获客分布
                          </h3>
                        </div>
                        <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800/60 px-2 py-0.5 rounded font-mono">
                          多维度
                        </span>
                      </div>

                      <div className="h-[240px] w-full text-xs font-mono mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReBarChart
                            data={channelsData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#2F3336" vertical={false} />
                            <XAxis
                              dataKey="name"
                              stroke="#8B949E"
                              tickLine={false}
                              axisLine={false}
                              style={{ fontSize: '10px' }}
                            />
                            <YAxis
                              stroke="#8B949E"
                              tickLine={false}
                              axisLine={false}
                              style={{ fontSize: '10px' }}
                              tickFormatter={(v) => `${v}%`}
                            />
                            <ReTooltip content={<ChnTooltip />} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} name="渠道比重">
                              {channelsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </ReBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Detailed conversion report card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left detailed statistics */}
                    <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">流量转化</h3>
                      
                      <div className="space-y-3 font-mono text-xs">
                        {[
                          { label: '点击访问：', value: '4,520 次', percent: 100, color: 'bg-zinc-600' },
                          { label: '加入购物车：', value: '820 件 (18.1%)', percent: 18.1, color: 'bg-blue-500' },
                          { label: '支付成单：', value: '132 笔 (2.9%)', percent: 12, color: 'bg-[#1D9BF0]' }
                        ].map((fun, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between">
                              <span>{fun.label}</span>
                              <span className="font-bold text-white">{fun.value}</span>
                            </div>
                            <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-[#2F3336]">
                              <div className={`h-full ${fun.color}`} style={{ width: `${fun.percent}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right channels matrix bar breakdown */}
                    <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">渠道分布</h3>
                      
                      <div className="space-y-3 text-xs font-mono">
                        {[
                          { channel: '小红书', ratio: '42%', width: 'w-[42%]', color: 'bg-rose-500' },
                          { channel: '抖音', ratio: '35%', width: 'w-[35%]', color: 'bg-indigo-500' },
                          { channel: '平台自流', ratio: '23%', width: 'w-[23%]', color: 'bg-[#1D9BF0]' }
                        ].map((ch, idx) => (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-neutral-400">{ch.channel}</span>
                              <span className="font-bold text-white">{ch.ratio}</span>
                            </div>
                            <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-[#2F3336]/65">
                              <div className={`h-full ${ch.color} ${ch.width}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI compiled manager weekly report */}
                  <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-3.5">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-[#1D9BF0]" />
                      <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">审计报告</h3>
                    </div>

                    <div className="bg-black/60 p-4 border border-[#2F3336]/60 rounded-xl space-y-2.5 font-mono text-xs leading-relaxed text-neutral-300">
                      <p>📋 <span className="font-bold text-white">审计概要：</span>本周期根据所有者下发的【{strategy.name}】战略大盘：</p>
                      <p>▶ <span className="text-[#1D9BF0] font-bold">1. 资产变动：</span>由于上架了 AI 商品经理精选之高毛利 SKU 【${productsList[0]?.name}】等爆款拼单，平均溢价高达 58%，抵扣极快反供应链拿货成本，回款周期缩短了 3.2 天。</p>
                      <p>▶ <span className="text-[#1D9BF0] font-bold">2. 直通车ROI：</span>直通车投发每日预算限制在 ¥{mktBudget} 元左右，综合转化获客率稳定于 3.4x 以上利好方位，避免了冗余曝光浪费。</p>
                      <p>▶ <span className="text-[#1D9BF0] font-bold">3. CRM安全防御：</span>成功发现并主动妥开干预客因退款差评纠纷 1 例，极速挽救高价值回头客画像粘合度，守住了在售网店铺五星全满赞誉。</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* VIEW 8: SETTINGS 配置 (⚙️ 设置) */}
              {activeMenu === 'settings' && (
                (userRole === 'staff' || userRole === 'customer') ? (
                  <div className="w-full bg-[#09090B] border border-[#2F3336] p-10 rounded-xl text-center space-y-4 max-w-xl mx-auto my-12 animate-fadeIn">
                    <div className="w-12 h-12 mx-auto rounded-full bg-red-950/20 border border-red-500/30 flex items-center justify-center text-rose-500">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white tracking-tight">🚫 权限不足 (Access Restrained)</h4>
                      <p className="text-xs text-neutral-400 leading-normal">
                        您的当前席位角色为 <strong className="text-rose-400">[{userRole === 'staff' ? '运营员工' : '进店顾客'}]</strong>。修改核心模型接口、密钥池配置、算力策略等参数仅限对具有拥有者 <strong className="text-white">Founder</strong> 或高级经理 <strong className="text-white">Manager</strong> 身份授予。
                      </p>
                    </div>
                    <div className="text-[10px] font-mono text-[#8B949E] italic bg-neutral-950 p-2.5 rounded border border-neutral-800">
                      提示: 请在顶部控制中心导航栏中，切换账户角色为「创始人」或「副总裁」进行调试。
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* MERCHANT PROFILE & BILLING CONSOLE ROWS - lg:col-span-12 */}
                    <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-[#2F3336]/60">
                      
                      {/* SUB-CARD 1: MERCHANT BRAND PROFILE EDITING */}
                      <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Briefcase className="w-4 h-4 text-[#38BDF8] animate-pulse" />
                            <h3 className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">
                              商户运营主体注册 (SaaS Brand Onboarding)
                            </h3>
                          </div>
                          <span className="text-[10px] bg-[#1D9BF0]/20 text-[#38BDF8] border border-[#1D9BF0]/30 px-2 py-0.5 rounded font-mono">
                            商户资料 (100% 真实)
                          </span>
                        </div>

                        <div className="w-full h-px bg-[#2F3336]/60" />

                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider block font-mono">实体商号 / 机构名称</label>
                            <input 
                              type="text" 
                              value={editBrandName}
                              onChange={(e) => setEditBrandName(e.target.value)}
                              className="w-full bg-black border border-[#2F3336] focus:border-[#38BDF8] rounded-lg p-2.5 text-xs text-white focus:outline-none font-sans"
                              placeholder="请输入官方注册商号"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider block font-mono">网店核心推广标语 / Slogan</label>
                            <input 
                              type="text" 
                              value={editSlogan}
                              onChange={(e) => setEditSlogan(e.target.value)}
                              className="w-full bg-black border border-[#2F3336] focus:border-[#38BDF8] rounded-lg p-2.5 text-xs text-white focus:outline-none font-sans"
                              placeholder="如: Tyson Cafe · 经典美式特惠"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSaveMerchantProfile(editBrandName, editSlogan)}
                            className="w-full py-2.5 bg-neutral-900 border border-[#2F3336] hover:bg-neutral-800 text-xs font-bold text-white rounded-lg cursor-pointer flex items-center justify-center space-x-1 transition-all"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>💾 保存商户核心配置到 Firestore 主仓</span>
                          </button>
                        </div>
                      </div>

                      {/* SUB-CARD 2: SAAS ENTERPRISE BILLING & COMPUTING POWER CONSOLE */}
                      <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4 text-amber-400 animate-pulse" />
                            <h3 className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">
                              SaaS 算力计费与企业充值 (Billing & Compute)
                            </h3>
                          </div>
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                            企业账务 (实时汇算)
                          </span>
                        </div>

                        <div className="w-full h-px bg-[#2F3336]/60" />

                        {/* Financial and Token metrics view */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-[#050505] border border-[#2F3336]/50 p-2.5 rounded-lg">
                            <span className="text-[9px] text-[#8B949E] font-mono block">云端节点状态</span>
                            <span className={`text-[11px] font-bold font-mono mt-0.5 inline-block ${
                              merchantStatus === 'active' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              ● {merchantStatus === 'active' ? '正常运力' : '节点挂起'}
                            </span>
                          </div>

                          <div className="bg-[#050505] border border-[#2F3336]/50 p-2.5 rounded-lg">
                            <span className="text-[9px] text-[#8B949E] font-mono block">账户订阅层级</span>
                            <span className="text-[11px] font-bold font-mono text-white mt-0.5 block uppercase">
                              {merchantBillingTier === 'trial' ? '🛡 试用沙盒' : merchantBillingTier === 'professional' ? '👑 专业版' : '💼 企业级'}
                            </span>
                          </div>

                          <div className="bg-[#050505] border border-[#2F3336]/50 p-2.5 rounded-lg">
                            <span className="text-[9px] text-[#8B949E] font-mono block">可用算力 Token</span>
                            <span className="text-[11px] font-bold font-mono text-sky-400 mt-0.5 block truncate">
                              {merchantTokenBalance.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Recharge Quick options list */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-[#8B949E] uppercase tracking-wider font-mono block font-mono">购买算力包 / 升级高级席位</span>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => handlePerformSaaSTopup('token_pack', 49, 1000000, '算力扩容: 1,000,000 Tokens 包')}
                              className="p-2 border border-[#2F3336] bg-black hover:border-sky-500 rounded-lg text-left transition-all"
                            >
                              <div className="font-bold text-white font-sans">￥49 / 100万 Token</div>
                              <span className="text-[9px] text-[#8B949E] block mt-0.5 font-mono">算力扩容补充包</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePerformSaaSTopup('tier_upgrade', 299, 5000000, '订购升级: 尊享专业版系统月租')}
                              className="p-2 border border-[#2F3336] bg-black hover:border-amber-500 rounded-lg text-left transition-all"
                            >
                              <div className="font-bold text-amber-400 flex items-center font-sans">
                                ￥299 / 专业版 👑
                              </div>
                              <span className="text-[9px] text-[#8B949E] block mt-0.5 font-mono">赠送 500万 Token + 专业客服</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* SUB-CARD 3: REAL-TIME BILLING INVOICE RECORDS FROM FIRESTORE */}
                      <div className="col-span-1 md:col-span-2 bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <History className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">
                              商户对账单 / 云计费入账明细 (Firestore Billing Invoices)
                            </h3>
                          </div>
                          <span className="text-[9px] text-gray-400 font-mono">
                            累积已支付: <strong className="text-white font-mono">￥{merchantRechargeTotal} RMB</strong>
                          </span>
                        </div>

                        <div className="w-full h-px bg-[#2F3336]/60" />

                        {billingLogs.length === 0 ? (
                          <div className="border border-dashed border-[#2F3336] rounded-xl p-8 text-center text-xs text-neutral-500 font-sans">
                            📭 尚未产生任何计费对账单。系统会自动保留您的第一笔冷试用配额 (1.5M Tokens)。<br />
                            <span className="text-[10px] mt-2 block text-gray-600 font-mono">试用配额每日零时自动重置。您可以通过上方按钮模拟下单并结算充值，一秒观察真实入册数据。</span>
                          </div>
                        ) : (
                          <div className="border border-[#2F3336] rounded-xl overflow-hidden bg-black/40">
                            <div className="max-h-[160px] overflow-y-auto divide-y divide-[#2F3336] custom-scrollbar">
                              {billingLogs.map((log) => (
                                <div key={log.id} className="p-3 text-xs flex justify-between items-center hover:bg-white/[0.02] transition-colors font-mono">
                                  <div className="space-y-0.5 text-left font-mono">
                                    <div className="flex items-center space-x-1.5 font-sans">
                                      <span className="text-[10px] text-gray-500 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded font-mono">
                                        {log.id}
                                      </span>
                                      <span className="font-bold text-white font-sans">{log.item}</span>
                                    </div>
                                    <div className="text-[10px] text-gray-500">
                                      入账时间: {new Date(log.timestamp).toLocaleString()} | 支付渠道: 支付宝
                                    </div>
                                  </div>

                                  <div className="text-right space-y-1 font-mono">
                                    <div className="font-bold text-emerald-400">￥{log.amount} 元</div>
                                    <div className="text-[9px] text-neutral-400">
                                      额度: +{log.tokensCredited.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Left Parameter form config */}
                  <div className="lg:col-span-5 bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-5">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-[#38BDF8] animate-pulse" />
                      <h3 className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">模型设置</h3>
                    </div>

                    <div className="w-full h-px bg-[#2F3336]/60" />

                    <div className="space-y-3">
                      <label className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider block">选择模型</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'gemini', name: 'Google Gemini', desc: '1.5 Flash' },
                          { id: 'deepseek', name: 'DeepSeek V3', desc: '全新旗舰模型' },
                          { id: 'openai', name: 'OpenAI GPT-4', desc: '通用智能模型' },
                          { id: 'ollama', name: 'Ollama (Local)', desc: '本地推理模型' }
                        ].map(prov => (
                          <button
                            key={prov.id}
                            type="button"
                            onClick={() => {
                              setApiProvider(prov.id as any);
                              setTestConnectionStatus('idle');
                              setTestLog(`切换为 ${prov.name}`);
                            }}
                            className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors duration-150 relative ${
                              apiProvider === prov.id
                                ? 'border-[#38BDF8] bg-[#1D9BF0]/5'
                                : 'border-[#2F3336] bg-black text-[#8B949E]'
                            }`}
                          >
                            <p className="text-xs font-bold text-white leading-tight">{prov.name}</p>
                            <span className="text-[9px] text-[#8B949E] mt-1 block font-mono">{prov.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      {apiProvider === 'gemini' && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider block">Gemini密钥</label>
                          <div className="relative">
                            <Key className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#8B949E]" />
                            <input 
                              type="password" 
                              value={geminiKey}
                              onChange={(e) => setGeminiKey(e.target.value)}
                              className="w-full bg-black border border-[#2F3336] focus:border-[#38BDF8] rounded-lg py-2 pl-9 pr-3 text-xs font-mono text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {apiProvider === 'deepseek' && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider block">DeepSeek密钥</label>
                          <div className="relative">
                            <Key className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#8B949E]" />
                            <input 
                              type="password" 
                              value={deepseekKey}
                              onChange={(e) => setDeepseekKey(e.target.value)}
                              className="w-full bg-black border border-[#2F3336] focus:border-[#38BDF8] rounded-lg py-2 pl-9 pr-3 text-xs font-mono text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {apiProvider === 'openai' && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider block">OpenAI密钥</label>
                          <div className="relative">
                            <Key className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#8B949E]" />
                            <input 
                              type="password" 
                              value={openaiKey}
                              onChange={(e) => setOpenaiKey(e.target.value)}
                              className="w-full bg-black border border-[#2F3336] focus:border-[#38BDF8] rounded-lg py-2 pl-9 pr-3 text-xs font-mono text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {apiProvider === 'ollama' && (
                        <div className="space-y-4 bg-black/40 border border-[#2F3336] p-4 rounded-xl">
                          {/* Endpoint Configuration */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider block">本地端</label>
                            <input 
                              type="text" 
                              value={ollamaEndpoint}
                              onChange={(e) => setOllamaEndpoint(e.target.value)}
                              className="w-full bg-black border border-[#2F3336] focus:border-[#38BDF8] rounded-lg p-2 text-xs text-white font-mono placeholder:text-gray-600 focus:outline-none"
                              placeholder="http://localhost:11434"
                            />
                          </div>
                          
                          {/* Search & Active Dropdown List */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-[#8B949E] uppercase tracking-wider font-mono text-[10px]">搜索模型</span>
                              <button 
                                type="button"
                                onClick={async () => {
                                  await syncOllamaModelsList();
                                }}
                                className="text-[#38BDF8] hover:text-[#1D9BF0] font-mono hover:underline flex items-center space-x-1"
                              >
                                {isSyncingOllama ? (
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-2.5 h-2.5" />
                                )}
                                <span>同步本地库</span>
                              </button>
                            </div>

                            {/* Search Input Box */}
                            <div className="relative">
                              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-500" />
                              <input 
                                type="text"
                                value={ollamaSearchQuery}
                                onChange={(e) => setOllamaSearchQuery(e.target.value)}
                                placeholder="输入模型关键词检索 (如: qwen, llama, deepseek)..."
                                className="w-full bg-black border border-[#2F3336] focus:border-[#38BDF8] rounded-lg py-2 pl-8 pr-3 text-xs text-white placeholder:text-gray-500 focus:outline-none placeholder:text-gray-500 font-sans"
                              />
                              {ollamaSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => setOllamaSearchQuery('')}
                                  className="absolute right-2.5 top-2.5 text-gray-500 hover:text-white"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Live Filtered Results list */}
                            <div className="border border-[#2F3336] rounded-lg bg-black/60 max-h-[160px] overflow-y-auto divide-y divide-[#2F3336] custom-scrollbar">
                              {(() => {
                                const filtered = ollamaModels.filter(m => 
                                  m.toLowerCase().includes(ollamaSearchQuery.toLowerCase())
                                );
                                if (filtered.length === 0) {
                                  return (
                                    <div className="p-3 text-center text-[11px] text-gray-500">
                                      无匹配的已注册模型。可以在下方手动录入注册。
                                    </div>
                                  );
                                }
                                return filtered.map(modelName => {
                                  const isActive = ollamaModel === modelName;
                                  return (
                                    <button
                                      key={modelName}
                                      type="button"
                                      onClick={() => {
                                        setOllamaModel(modelName);
                                        setTestConnectionStatus('idle');
                                        setTestLog(`[模型自流转] 已完美切换本地高性能 LLM 为: ${modelName}。您可以直接在会商区进行推理对话测试！`);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors duration-150 flex items-center justify-between hover:bg-[#111112] ${
                                        isActive ? 'bg-[#1D9BF0]/15 text-white font-bold' : 'text-[#8B949E]'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <Layers className={`w-3 h-3 ${isActive ? 'text-[#38BDF8]' : 'text-gray-600'}`} />
                                        <span>{modelName}</span>
                                      </div>
                                      {isActive && (
                                        <span className="flex items-center text-[9px] bg-[#1D9BF0]/30 text-[#38BDF8] border border-[#1D9BF0]/50 px-1.5 py-0.5 rounded-full">
                                          <Check className="w-2.5 h-2.5 mr-0.5" /> 已激活
                                        </span>
                                      )}
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </div>

                          {/* Horizontal divider */}
                          <div className="h-px bg-[#2F3336]/60" />

                          {/* Quick register custom high-performance model */}
                          <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider block">添加模型</label>
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                value={customOllamaModelInput}
                                onChange={(e) => setCustomOllamaModelInput(e.target.value)}
                                placeholder="输入模型名称 (如: qwen2.5:7b)"
                                className="flex-1 bg-black border border-[#2F3336] focus:border-[#38BDF8] rounded-lg px-2.5 py-2 text-xs font-mono text-white placeholder:text-gray-600 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const cleaned = customOllamaModelInput.trim();
                                  if (!cleaned) return;
                                  if (!ollamaModels.includes(cleaned)) {
                                    setOllamaModels(prev => [...prev, cleaned]);
                                  }
                                  setOllamaModel(cleaned);
                                  setCustomOllamaModelInput('');
                                  setTestConnectionStatus('idle');
                                  setTestLog(`已注册模型【${cleaned}】`);
                                }}
                                disabled={!customOllamaModelInput.trim()}
                                className="bg-[#1D9BF0] hover:bg-[#38BDF8] text-white text-xs px-3.5 py-2 rounded-lg font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0"
                              >
                                快速注册
                              </button>
                            </div>
                            <p className="text-[9px] text-gray-500 leading-normal">
                              注册并使用本地模型
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right hand diagnostic view */}
                  <div className="lg:col-span-7 bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">连接诊断</h3>
                    
                    <div className="bg-[#050505] border border-[#2F3336] p-4 rounded-xl min-h-[140px] flex items-center font-mono text-xs text-sky-400">
                      <div>
                        <p className="text-[9px] text-[#8B949E] tracking-tight uppercase mb-1">诊断日志</p>
                        <p className="font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap">{testLog}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        setTestConnectionStatus('testing');
                        setTestLog('▶ 正在向系统核心底座 `/api/status` 发起握手探测包探查...');
                        try {
                          const res = await fetch('/api/status');
                          const d = await res.json();
                          if (d && d.success) {
                            setTestConnectionStatus('success');
                            if (d.hasKey) {
                              setGeminiConnected('online');
                              setTestLog(`✔ 通信验证成功。`);
                            } else {
                              setGeminiConnected('local');
                              setTestLog(`⚠ 离线状态就绪。`);
                            }
                          } else {
                            throw new Error("响应格式有误");
                          }
                        } catch (e: any) {
                          setTestConnectionStatus('failed');
                          setTestLog(`❌ 通信失败。`);
                        }
                      }}
                      className="w-full py-3 bg-neutral-900 border border-[#2F3336] hover:bg-neutral-800 text-xs font-bold text-white rounded-lg cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${testConnectionStatus === 'testing' ? 'animate-spin' : ''}`} />
                      <span>进行通信测试</span>
                    </button>

                    {/* INTERACTIVE CONNECTION BLUEPRINT & LIVE STATE AUDITOR PANEL */}
                    <div className="border border-[#1D9BF0]/30 bg-black/60 p-4 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Activity className="w-4 h-4 text-[#38BDF8] animate-pulse" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">底层数据流接线微控制台</span>
                        </div>
                        <span className="text-[8px] bg-[#1D9BF0]/20 text-[#38BDF8] border border-[#1D9BF0]/30 px-2 py-0.5 rounded-full font-bold">
                          指针物理绑定 • 100% 真实
                        </span>
                      </div>

                      {/* Live pointer states grid */}
                      <div className="grid grid-cols-2 gap-3 text-left">
                        <div className="bg-[#0D0D10] border border-[#2F3336]/60 p-2.5 rounded-lg space-y-1">
                          <span className="text-[10px] text-gray-500 font-mono block">今日销售统计 (sales)</span>
                          <span className="text-xs font-extrabold text-sky-400 font-mono">¥{sales.toLocaleString()} 元</span>
                        </div>

                        <div className="bg-[#0D0D10] border border-[#2F3336]/60 p-2.5 rounded-lg space-y-1">
                          <span className="text-[10px] text-gray-500 font-mono block">产品库总量 (productsList)</span>
                          <span className="text-xs font-extrabold text-white font-mono">{productsList.length} 款在售 SPU</span>
                        </div>

                        <div className="bg-[#0D0D10] border border-[#2F3336]/60 p-2.5 rounded-lg space-y-1 col-span-2">
                          <span className="text-[10px] text-gray-500 font-mono block">网店橱窗推广标语 (storeHeadline)</span>
                          <p className="text-[11px] font-medium text-amber-500 font-mono truncate" title={storeHeadline}>{storeHeadline}</p>
                        </div>

                        <div className="bg-[#0D0D10] border border-[#2F3336]/60 p-2.5 rounded-lg space-y-1">
                          <span className="text-[10px] text-gray-500 font-mono block">视觉主题风格 (storeTheme)</span>
                          <span className="inline-flex items-center text-[9px] font-bold text-gray-300 bg-neutral-900 border border-[#2F3336] px-2 py-0.5 rounded">
                            {storeTheme === 'dark' ? '潮冷暗黑 🌑' : storeTheme === 'classic' ? '现代极简 ⚪' : '奶油法式 🧺'}
                          </span>
                        </div>

                        <div className="bg-[#0D0D10] border border-[#2F3336]/60 p-2.5 rounded-lg space-y-1">
                          <span className="text-[10px] text-gray-500 font-mono block">CRM 争议状态 (disputeResolved)</span>
                          <span className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded ${
                            disputeResolved === 'solved' 
                              ? 'bg-emerald-500/10 text-sky-400 border border-sky-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                          }`}>
                            {disputeResolved === 'solved' ? '✔ 撤回纠纷 (李阿姨)' : '⚠ 争议未决 (李阿姨)'}
                          </span>
                        </div>
                      </div>

                      {/* Collapsible Integration Manual Document directly inside UI */}
                      <details className="group border border-[#2F3336] rounded-xl overflow-hidden text-left bg-[#050505]">
                        <summary className="p-3 text-xs font-bold text-gray-300 font-mono cursor-pointer bg-[#0D0D10] hover:bg-neutral-900 flex justify-between items-center select-none">
                          <span className="flex items-center space-x-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-[#2D8A67]" />
                            <span>查看本系统《真实按钮接线配置文档》</span>
                          </span>
                          <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-open:rotate-180 duration-150" />
                        </summary>
                        <div className="p-4 border-t border-[#2F3336] space-y-4 text-[11px] leading-relaxed text-neutral-300 font-sans max-h-[300px] overflow-y-auto">
                          <div className="space-y-1.5">
                            <h4 className="text-white font-bold font-mono">📡 1. 大盘快速控制宏 (Workbench Controls)</h4>
                            <p className="text-[#8B949E] pl-2 leading-relaxed">
                              • <strong>推广投放按钮：</strong> 调用 <code>triggerQuickMacro('ad_boost')</code>，真实变更 <code>sales</code> 状态（+¥480），并在经营看板实时汇算生成日志。<br />
                              • <strong>货源快反按钮：</strong> 绑定 <code>triggerQuickMacro('inventory_sync')</code>，对 <code>productsList</code> 的所有品类的库存执行真机重发（补充 <code>20~60</code> 件配额），全商城和预览区直接秒刷新同步。<br />
                              • <strong>对账合并按钮：</strong> 提取当前真实 <code>sales</code> 数据，以 <code>(sales * 0.385)</code> 公式实时轧账并向监控面板发布财务汇总报告。<br />
                              • <strong>纠纷处理按钮：</strong> 修改 <code>disputeResolved</code> 指针状态为 <code>'solved'</code>，全天候撤销客户不合规申诉。
                            </p>
                          </div>

                          <div className="space-y-1.5 border-t border-[#2F3336]/60 pt-2.5">
                            <h4 className="text-white font-bold font-mono">🎨 2. 店铺装修 & 物理热上线 (Store Aesthetics)</h4>
                            <p className="text-[#8B949E] pl-2 leading-relaxed">
                              • <strong>标语和主题：</strong> 直接由 <code>storeHeadline</code> 和 <code>storeTheme</code> 控制，一键部署触发 <code>localStorage.setItem</code> 将整套属性写入宿主缓存。调用大栏目的手机扫码或二维码，能够 100% 渲染您的真实视觉设计。
                            </p>
                          </div>

                          <div className="space-y-1.5 border-t border-[#2F3336]/60 pt-2.5">
                            <h4 className="text-white font-bold font-mono">📦 3. SKU 商品上架/研制 (SPU Catalog)</h4>
                            <p className="text-[#8B949E] pl-2 leading-relaxed">
                              • <strong>手动和 AI 录入：</strong> 均通过 <code>setProductsList</code> 执行 <code>Push</code> 节点建档写进商品数据库，支持自定义商品进行下架、改价、改库存操作。
                            </p>
                          </div>

                          <div className="space-y-1.5 border-t border-[#2F3336]/60 pt-2.5">
                            <h4 className="text-white font-bold font-mono">🛵 4. 会商会话与 AI 物理反射 (AI Employee Dispatch)</h4>
                            <p className="text-[#8B949E] pl-2 leading-relaxed">
                              • 会商对话直通后端 API <code>/api/chat</code>。<strong>当输入具有行为词义的命令时</strong>（例如“帮我换极简风格”或“上架新品白松露意面”），AI 返回的内容将自动切分出 <code>[ACTION: xxx]</code> 系统标签，后台拦截该标签并自动为您完成修改大盘标语、上架对应价格商品或批量顺丰发货等<strong>系统级物理改动</strong>。
                            </p>
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>

                  {/* GOOGLE DRIVE & PRODUCTION INITIATION GRID */}
                  <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#2F3336]/60">
                    
                    {/* CARD 1: GOOGLE DRIVE CLOUD BACKUP & MANAGEMENT */}
                    <div id="drive-backup-panel" className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4 text-left">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Cloud className="w-4 h-4 text-[#38BDF8] animate-pulse" />
                          <h3 className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">
                            Google Drive 云备份控制台
                          </h3>
                        </div>
                        <span className="text-[10px] bg-[#1D9BF0]/20 text-[#38BDF8] border border-[#1D9BF0]/30 px-2 py-0.5 rounded font-mono">
                          云端存储
                        </span>
                      </div>

                      <div className="w-full h-px bg-[#2F3336]/60" />

                      {!driveAccessToken ? (
                        <div className="space-y-4">
                          <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                            🔌 尚未对接 Google Drive 云端安全仓库。授权并获得 OAuth 访问令牌后，您可以对店铺在售商品名录、真实订单进行云端实时冷备份或一键恢复，实现数据绝对永固。
                          </p>
                          <button
                            type="button"
                            onClick={handleConnectDrive}
                            className="w-full py-2.5 bg-[#1D9BF0] hover:bg-[#38BDF8] transition-all text-white font-bold text-xs rounded-lg cursor-pointer flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(29,155,240,0.25)] hover:shadow-[0_0_22px_rgba(56,189,248,0.45)]"
                          >
                            <Key className="w-4 h-4" />
                            <span>🔑 授权连接 Google Drive 云主库</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Connection details banner */}
                          <div className="bg-black/60 border border-[#2F3336] p-3.5 rounded-lg flex items-center justify-between">
                            <div className="text-left">
                              <span className="text-[9px] text-[#8B949E] uppercase tracking-wider block font-mono">已连接云账号</span>
                              <p className="text-xs text-sky-400 font-bold font-mono truncate">{driveUserEmail}</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleDisconnectDrive}
                              className="px-2.5 py-1.5 border border-red-900/50 hover:bg-red-950/25 text-[10px] text-red-400 rounded-md font-bold transition-all cursor-pointer"
                            >
                              断开连接
                            </button>
                          </div>

                          {/* Trigger immediate database backup */}
                          <div className="space-y-2">
                            <span className="text-[10px] text-[#8B949E] uppercase tracking-wider font-mono block">触发大盘全量备份</span>
                            <button
                              type="button"
                              onClick={handleBackupToDrive}
                              disabled={isBackingUp}
                              className="w-full py-2.5 bg-neutral-900 border border-[#2F3336] hover:bg-neutral-800 transition-all text-white font-bold text-xs rounded-lg cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                              {isBackingUp ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                                  <span>正在上传高精密备份包...</span>
                                </>
                              ) : (
                                <>
                                  <CloudUpload className="w-3.5 h-3.5 text-[#38BDF8]" />
                                  <span>💾 备份当前全部商品与订单至 Google Drive</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Historical Restorations list */}
                          <div className="space-y-2.5 pt-2 border-t border-[#2F3336]/40">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-[#8B949E] uppercase tracking-wider font-mono">从云备份包回滚恢复</span>
                              <button
                                type="button"
                                onClick={() => handleFetchBackups()}
                                className="text-[#38BDF8] hover:text-[#1D9BF0] font-mono hover:underline flex items-center space-x-1"
                              >
                                <RefreshCw className={`w-2.5 h-2.5 ${isSearchingBackups ? 'animate-spin' : ''}`} />
                                <span>刷新备份</span>
                              </button>
                            </div>

                            {driveBackups.length === 0 ? (
                              <div className="border border-dashed border-[#2F3336] rounded-lg p-3 text-center text-[11px] text-gray-500">
                                📭 您的 Google Drive 根目录未发现历史生成的备份包。
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <select
                                  value={selectedBackupId}
                                  onChange={(e) => setSelectedBackupId(e.target.value)}
                                  className="w-full bg-black border border-[#2F3336] rounded-lg p-2 text-xs text-white font-mono focus:outline-none"
                                >
                                  {driveBackups.map((bak) => (
                                    <option key={bak.id} value={bak.id}>
                                      {bak.name} ({new Date(bak.createdTime).toLocaleString('zh-CN', { hour12: false })})
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={handleRestoreFromDrive}
                                  disabled={isRestoring || !selectedBackupId}
                                  className="w-full py-2 bg-neutral-900 border border-[#2F3336] hover:bg-neutral-800 hover:border-red-900/50 transition-all text-xs text-yellow-400 font-bold rounded-lg cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                                >
                                  {isRestoring ? (
                                    <>
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      <span>正在解析并解包数据还原...</span>
                                    </>
                                  ) : (
                                    <>
                                      <CloudDownload className="w-3.5 h-3.5" />
                                      <span>🔄 一键反拉并还原选中云端备份 (覆盖大盘)</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CARD 2: PRODUCTION LAUNCH PREPARATION & RESET WIPE */}
                    <div id="production-purge-panel" className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4 text-left">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Activity className="w-4 h-4 text-red-500 animate-pulse" />
                          <h3 className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">
                            生产就绪校准与数据肃清
                          </h3>
                        </div>
                        <span className="text-[10px] bg-red-950/40 text-red-400 border border-red-800/40 px-2 py-0.5 rounded font-mono">
                          上线准备 (清零)
                        </span>
                      </div>

                      <div className="w-full h-px bg-[#2F3336]/60" />

                      <div className="space-y-4">
                        <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                          🚀 <strong>准备正式上线就绪阶段：</strong>
                          本系统目前处于联调仿真的沙箱模式。如果您要为正式上线剪彩，必须清除全部仿真下单测试数据、虚拟营业流水和测试订单，保持主盘和客户名目处于最纯净、最健康的真实营业就绪状态。
                        </p>

                        <div className="bg-black/40 border border-red-950/20 p-3.5 rounded-lg space-y-3">
                          <span className="text-[9px] text-[#8B949E] uppercase tracking-wider block font-mono">清零配比参数</span>
                          
                          <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={wipeProductsInPurge}
                              onChange={(e) => setWipeProductsInPurge(e.target.checked)}
                              className="mt-0.5 rounded border-[#2F3336] text-red-600 bg-black focus:ring-red-600 focus:ring-offset-black w-3.5 h-3.5"
                            />
                            <div className="text-left leading-tight">
                              <span className="text-xs font-bold text-white block">清除所有商品条目 (Spu / Catalog)</span>
                              <span className="text-[10px] text-gray-500">勾选将完全清除产品。不勾选则仅清除商品的累积模拟销售量并保留默认模板。</span>
                            </div>
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleProductionPurge(wipeProductsInPurge)}
                          className="w-full py-2.5 bg-black border border-red-900/50 hover:bg-red-950/25 hover:border-red-700 transition-all text-red-400 hover:text-red-300 font-bold text-xs rounded-lg cursor-pointer flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:shadow-[0_0_22px_rgba(248,113,113,0.45)]"
                        >
                          <Star className="w-3.5 h-3.5 animate-pulse text-red-500" />
                          <span>🧹 一键彻底抹除测试数据（交易与营业总计清零）</span>
                        </button>

                        <p className="text-[10px] text-gray-500 leading-normal text-left">
                          💡 操作将在生产 Firestore 中进行，抹除后营业收入及历史订单将彻底变为 0，迎接首位真实顾客。
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              ))}

              {/* VIEW 9: TEAM MEMBERS (🤖 团队成员) */}
              {activeMenu === 'team_members' && (
                <div className="space-y-6">
                  {/* Dynamic Industry Header */}
                  <div className="bg-[#09090B] border border-[#2F3336] p-6 rounded-xl relative overflow-hidden text-left">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#1D9BF0]/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{industry.emoji}</span>
                          <h3 className="text-lg font-bold text-white font-display">{industry.name} — AI 高维专家智能团队</h3>
                        </div>
                        <p className="text-xs text-neutral-400 mt-2 max-w-2xl leading-relaxed">
                          当前为您的【{industry.name}】自动搭载了 <strong>4 位高智能 AI 数字员工</strong>，全天候 24 小时执行设计、选品、运营、营销和客诉监控，极智提升店面转化收益。你可以调用图像生成引擎，为您团队专属生成独特的数字虚拟形象。
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 bg-neutral-900/60 border border-[#2F3336] px-3 py-1.5 rounded-lg text-[11px] font-mono whitespace-nowrap text-neutral-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>智体团队连接状态: <strong>ACTIVE</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Team Members Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {industry.team.map((member, index) => {
                      const hasPresetAvatar = memberAvatars[member.name] || memberAvatars[member.role.replace("AI", "")];
                      const avatarSrc = hasPresetAvatar || `https://picsum.photos/seed/${member.name || member.role}/400/400`;
                      const isGenerating = isGeneratingAvatarForRole === member.role;

                      // Triggering a custom visual avatar generation simulation with steps
                      const triggerAvatarGeneration = () => {
                        if (isGeneratingAvatarForRole) return;
                        setIsGeneratingAvatarForRole(member.role);
                        setAvatarProgress(0);
                        setAvatarProgressText("🔍 分析岗位提示词权重...");
                        setLogs(prev => [
                          ...prev,
                          {
                            id: Math.random().toString(),
                            timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                            sender: 'AI 绘人网关',
                            emoji: '🎨',
                            message: `⚡ 启动对 【${member.role} — ${member.name}】 专属智体形象的二次智能合成重排...`,
                            type: 'info'
                          }
                        ]);

                        const intervalSteps = [
                          { val: 20, text: "🔍 分析岗位提示词权重..." },
                          { val: 45, text: "🌌 生成全彩潜向量空间..." },
                          { val: 75, text: "✨ 渲染超清光影与面部轮廓..." },
                          { val: 95, text: "🛡️ 重置 C8 通道滤镜并封装..." },
                          { val: 100, text: "✔ 专家级 1:1 特制人像载入成功！" }
                        ];

                        let currentIdx = 0;
                        const timer = setInterval(() => {
                          if (currentIdx < intervalSteps.length) {
                            const step = intervalSteps[currentIdx];
                            setAvatarProgress(step.val);
                            setAvatarProgressText(step.text);
                            currentIdx++;
                          } else {
                            clearInterval(timer);
                            // Set a new dynamic random high fidelity avatar URL
                            const uniqueSeed = member.name + '-' + Math.floor(Math.random() * 9999);
                            setMemberAvatars(prev => ({
                              ...prev,
                              [member.name]: `https://picsum.photos/seed/${uniqueSeed}/400/400`
                            }));
                            setIsGeneratingAvatarForRole(null);
                            setLogs(prev => [
                              ...prev,
                              {
                                id: Math.random().toString(),
                                timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                sender: 'AI 绘人网关',
                                emoji: '🎨',
                                message: `🎨 智体形象重画成功！【${member.role} - ${member.name}】专属虚拟形象头像及风格配置文件已热重载加载。`,
                                type: 'success'
                              }
                            ]);
                          }
                        }, 750);
                      };

                      return (
                        <div 
                          key={index} 
                          className="bg-[#09090B] border border-[#2F3336] rounded-xl overflow-hidden flex flex-col md:flex-row text-left duration-150 hover:border-neutral-700/80 group"
                        >
                          {/* Image Container Area */}
                          <div className="w-full md:w-36 h-36 relative bg-neutral-950 flex items-center justify-center border-b md:border-b-0 md:border-r border-[#2F3336] shrink-0 overflow-hidden">
                            {isGenerating ? (
                              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-3 text-center space-y-2 z-25">
                                <span className="w-6 h-6 rounded-full border-2 border-[#1D9BF0] border-t-transparent animate-spin" />
                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-mono text-[#1D9BF0] block font-bold">{avatarProgress}%</span>
                                  <span className="text-[8px] text-[#8B949E] block animate-pulse leading-snug">{avatarProgressText}</span>
                                </div>
                              </div>
                            ) : null}

                            <img 
                              src={avatarSrc} 
                              alt={`${member.role} Avatar`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 duration-300 pointer-events-none select-none"
                            />

                            <div className="absolute bottom-2 left-2 bg-black/85 border border-[#2F3336] px-2 py-0.5 rounded text-[9px] text-white font-mono flex items-center space-x-1 shrink-0 z-10">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                              <span>智体在线</span>
                            </div>
                          </div>

                          {/* Detail Info Card Panel */}
                          <div className="flex-1 p-4 flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white font-display tracking-tight flex items-center gap-1.5">
                                  <span>{member.role} • {member.name}</span>
                                </span>
                                <span className="text-[9px] font-mono bg-[#1D9BF0]/10 text-sky-400 border border-[#1D9BF0]/20 px-1.5 py-0.5 rounded">
                                  COGNITIVE
                                </span>
                              </div>

                              <p className="text-[11px] text-neutral-400 leading-relaxed min-h-[32px]">
                                {member.desc || "担任对应行业核心智能算法算力调度，主理线上店面全方位自主经营业务。"}
                              </p>

                              {/* Task Checklist inside card */}
                              <div className="space-y-1 pt-1.5 border-t border-[#2F3336]/60">
                                <span className="text-[9px] font-mono text-[#8B949E] uppercase tracking-wider block">今日核心任务 (Daily Backlog)</span>
                                <div className="space-y-0.5">
                                  {member.tasks?.slice(0, 2).map((task, tIdx) => (
                                    <div key={tIdx} className="flex items-start space-x-1.5 text-[10px] text-neutral-300">
                                      <span className="text-emerald-500 shrink-0">✦</span>
                                      <span className="truncate max-w-[210px]" title={task}>{task}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Actions bar inside individual expert card */}
                            <div className="flex items-center justify-between pt-2 border-t border-[#2F3336]/40 mt-2 md:mt-0">
                              <div className="text-[9px] text-[#8B949E] font-mono">
                                算力占用: <strong className="text-white">Medium</strong>
                              </div>

                              <button
                                type="button"
                                onClick={triggerAvatarGeneration}
                                disabled={isGeneratingAvatarForRole !== null}
                                className={`text-[10px] px-2 py-1 rounded-lg border flex items-center space-x-1.5 font-bold transition-all duration-150 cursor-pointer ${
                                  isGeneratingAvatarForRole !== null
                                    ? 'border-neutral-800 bg-neutral-900 text-neutral-500 cursor-not-allowed'
                                    : 'border-[#1D9BF0]/40 bg-[#1D9BF0]/10 text-sky-400 hover:bg-[#1D9BF0]/20 hover:text-white hover:border-[#1D9BF0]'
                                }`}
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>{isGenerating ? "正在重设..." : "重修智体形象"}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Collaborative AI intelligence framework visualization map in team space */}
                  <div className="bg-[#09090B] border border-[#2F3336] p-6 rounded-xl space-y-4 text-left">
                    <div className="flex items-center justify-between border-b border-[#2F3336]/80 pb-3">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-[#1D9BF0]" />
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">团队会商与全自动拓扑闭环</h4>
                      </div>
                      <span className="text-[9px] bg-[#111] border border-[#2F3336] text-neutral-500 font-mono px-2 py-0.5 rounded-full">
                        拓扑环路: ACTIVE
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                      <div className="border border-neutral-800 bg-black/40 p-4 rounded-lg space-y-2">
                        <div className="flex items-center space-x-1.5 text-sky-400 font-bold">
                          <span>①</span>
                          <span>前向数据感知监听</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#8B949E] font-sans">
                          运营智体积极扫描同城行业热度大盘数据，当测出爆款词句与高搜索特征参数时，实时下发微信号感知，自动激活设计师进行草图编设。
                        </p>
                      </div>

                      <div className="border border-neutral-800 bg-black/40 p-4 rounded-lg space-y-2">
                        <div className="flex items-center space-x-1.5 text-yellow-500 font-bold">
                          <span>②</span>
                          <span>柔性供应链核价挂单</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#8B949E] font-sans">
                          选品经理自动核算大宗拿货与打样成本，执行对冲精算决策，按设定的毛利红线计算最优溢价售价，一键将 SPU 在全平台录单部署上线。
                        </p>
                      </div>

                      <div className="border border-neutral-800 bg-black/40 p-4 rounded-lg space-y-2">
                        <div className="flex items-center space-x-1.5 text-emerald-500 font-bold">
                          <span>③</span>
                          <span>高点击推广与客诉守备</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#8B949E] font-sans">
                          营销经理自动起草高转换文案并匹配达人精准派发，客服经理开启 24 小时哨兵雷达拦截纠纷、执行顺丰打单发件，全流程闭环自治。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

        </main>

        {/* SIDE COLUMN 3: PERSISTENT RIGHT CHATBOX INTERFACE PANEL */}
        <section className="w-full lg:w-80 bg-[#09090B] border-t lg:border-t-0 lg:border-l border-[#2F3336] shrink-0 flex flex-col h-[520px] lg:h-auto overflow-hidden">
          
          <div className="bg-[#0d0d0f] border-b border-[#2F3336] p-4 flex flex-col justify-between space-y-2">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-[#1D9BF0]" />
              <div className="text-left">
                <span className="text-[10px] text-[#8B949E] uppercase tracking-wider font-mono block">当前窗口数字岗位伙伴</span>
                <p className="text-xs font-extrabold text-white">7x24 执勤全天候会商室</p>
              </div>
            </div>
          </div>

          {/* Active Employee Bio */}
          <div className="p-3 bg-black/60 border-b border-[#2F3336]/60 flex items-start space-x-3 text-xs font-mono">
            <div className="w-10 h-10 rounded-full border border-[#2F3336] bg-neutral-950 flex items-center justify-center text-2xl select-none shrink-0 animate-pulse">
              {selectedStaff.emoji}
            </div>
            <div className="text-left space-y-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-white font-bold">{selectedStaff.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neutral-900 border border-[#2F3336] text-[#8B949E]">
                  {selectedStaff.role}
                </span>
              </div>
              <p className="text-[10px] text-[#8B949E] leading-relaxed">{selectedStaff.desc}</p>
            </div>
          </div>

          {/* Chat scrolling log window */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-950 flex flex-col">
            {chats[selectedStaff.role]?.map((chat) => (
              <div
                key={chat.id}
                className={`flex flex-col max-w-[85%] text-left ${chat.isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div className="flex items-center space-x-1.5 mb-1 text-[9px] text-[#8B949E] font-mono">
                  <span>{chat.emoji}</span>
                  <span>{chat.sender}</span>
                  <span>•</span>
                  <span>{chat.timestamp}</span>
                </div>
                <div className={`p-3 rounded-xl border text-xs leading-relaxed whitespace-pre-wrap ${
                  chat.isUser 
                    ? 'bg-[#1D9BF0] border-[#1D9BF0]/30 text-white rounded-tr-none' 
                    : 'bg-[#09090B] border-[#2F3336] text-neutral-200 rounded-tl-none'
                }`}>
                  {chat.message}

                  {/* Render Sidekick interactive AI action terminal block if parsed */}
                  {!chat.isUser && chat.actionDetected && (
                    <div className="mt-2.5 overflow-hidden rounded-md border border-sky-500/35 bg-black text-left font-mono">
                      {/* Header */}
                      <div className="flex items-center justify-between bg-sky-950/20 px-2.5 py-1.5 border-b border-sky-500/20">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                          <span className="text-[9px] uppercase font-bold text-sky-400 tracking-wider">
                            SIDEKICK 自动化决策调试调度
                          </span>
                        </div>
                        <span className="text-[7px] text-sky-500/70 border border-sky-500/20 px-1 py-0.5 rounded scale-90 origin-right">
                          LIVE ACTIVE
                        </span>
                      </div>

                      {/* Decoded system parameters */}
                      <div className="p-2.5 space-y-2 text-[9px] leading-relaxed text-neutral-300">
                        <div className="flex items-start space-x-1 text-[#8B949E]">
                          <span className="text-sky-500 font-bold select-none">$</span>
                          <span>sidekick --dispatch-core --task={chat.actionDetected.type.toLowerCase()}</span>
                        </div>
                        
                        <div className="border-t border-neutral-900 pt-1.5 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-neutral-500">业务指令类 (Type)</span>
                            <span className="text-neutral-200 font-medium">{chat.actionDetected.title}</span>
                          </div>
                          {chat.actionDetected.param1 && (
                            <div className="flex justify-between">
                              <span className="text-neutral-500">特征参数 A (Param1)</span>
                              <span className="text-sky-400 font-bold truncate max-w-[170px]" title={chat.actionDetected.param1}>
                                {chat.actionDetected.param1}
                              </span>
                            </div>
                          )}
                          {chat.actionDetected.param2 && (
                            <div className="flex justify-between">
                              <span className="text-neutral-500">特征参数 B (Param2)</span>
                              <span className="text-yellow-400 font-bold">
                                ¥{chat.actionDetected.param2}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-neutral-900 pt-1">
                            <span className="text-neutral-500">后台反应堆 (Status)</span>
                            <span className="text-sky-400 font-bold flex items-center space-x-0.5 animate-pulse">
                              <span>● 部署发布生效</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render 1: Generated Design Poster Canvas Workspace */}
                  {chat.generatedPoster && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-[#2F3336] bg-[#0D0D10] text-[#E5E5E5] text-left">
                      <div className={`p-5 relative overflow-hidden flex flex-col justify-between items-center text-center aspect-[16/10] ${
                        chat.generatedPoster.theme === 'dark' 
                          ? 'bg-gradient-to-br from-zinc-950 via-neutral-900 to-zinc-950 text-white' 
                          : chat.generatedPoster.theme === 'classic'
                          ? 'bg-gradient-to-br from-zinc-100 via-neutral-200 to-zinc-50 text-neutral-900'
                          : 'bg-gradient-to-br from-[#FAF6F0] via-[#F4EBE1] to-[#FAF6F0] text-amber-950'
                      }`}>
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-amber-500/15 blur-xl pointer-events-none" />
                        
                        <div className="text-[9px] uppercase tracking-widest font-mono font-bold opacity-75">
                          ✦ {industry.name} OFFICIAL MERCH DESIGNER ✦
                        </div>
                        
                        <div className="my-[15px] space-y-1 z-10 w-full max-w-[240px]">
                          <input
                            type="text"
                            value={chat.generatedPoster.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateChatMessageCustomField(chat.id, (m) => ({
                                ...m,
                                generatedPoster: { ...m.generatedPoster, title: val }
                              }));
                            }}
                            className="bg-zinc-900/30 border border-transparent hover:border-neutral-500/30 focus:bg-black/60 focus:border-[#1D9BF0] transition-all text-sm font-extrabold text-center w-full focus:outline-none p-1 rounded"
                            placeholder="编辑海报主文案..."
                          />
                          <input
                            type="text"
                            value={chat.generatedPoster.subtitle}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateChatMessageCustomField(chat.id, (m) => ({
                                ...m,
                                generatedPoster: { ...m.generatedPoster, subtitle: val }
                              }));
                            }}
                            className="bg-zinc-900/10 border border-transparent hover:border-neutral-500/15 focus:bg-black/40 focus:border-[#1D9BF0] transition-all text-[10px] text-center w-full focus:outline-none opacity-80 p-0.5 rounded"
                            placeholder="编辑推广副文案..."
                          />
                        </div>

                        <div className="text-4xl bg-gradient-to-b from-neutral-800 to-neutral-950 border border-white/5 backdrop-blur-sm w-12 h-12 rounded-full flex items-center justify-center animate-bounce duration-1000 select-none shadow-lg">
                          {chat.generatedPoster.image}
                        </div>

                        <div className="text-[8px] font-mono opacity-60 tracking-wider">
                          MERCH DEMAND CORE ENGINE • VER: 2026
                        </div>
                      </div>

                      <div className="p-3 bg-neutral-900/60 border-t border-[#2F3336] flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#8B949E]">
                          风格: <span className="text-white capitalize">{chat.generatedPoster.theme === 'dark' ? '潮冷暗黑' : chat.generatedPoster.theme === 'classic' ? '现代极简' : '奶油法式'}</span>
                        </span>
                        
                        <button
                          type="button"
                          disabled={chat.generatedPoster.isDeployed}
                          onClick={() => {
                            setStoreHeadline(chat.generatedPoster!.title);
                            updateChatMessageCustomField(chat.id, (m) => ({
                              ...m,
                              generatedPoster: { ...m.generatedPoster, isDeployed: true }
                            }));
                            setLogs((p) => [
                              ...p,
                              {
                                id: Math.random().toString(),
                                timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                sender: selectedStaff.role,
                                emoji: '🎨',
                                message: `⚙️ 【Sidekick 热更新】主店标语已热部署升级为：“${chat.generatedPoster!.title}”！`,
                                type: 'success'
                              }
                            ]);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center space-x-1 cursor-pointer ${
                            chat.generatedPoster.isDeployed 
                              ? 'bg-neutral-800 border border-neutral-700 text-neutral-500 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-sky-500/20 active:scale-95'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>{chat.generatedPoster.isDeployed ? '店铺招牌已生效上线' : '一键发布至网店主页'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Render 2: Generated Copywriting Canvas Workspace */}
                  {chat.generatedCopywriting && (
                    <div className="mt-3 p-3 overflow-hidden rounded-xl border border-[#2F3336] bg-[#0c0c0e] text-[#E5E5E5] text-left space-y-3">
                      <div className="flex items-center justify-between border-b border-[#2F3336] pb-2 text-[10px] font-mono font-bold tracking-wider text-rose-500">
                        <span className="flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-rose-400 animate-spin" />
                          <span>小红书高流量文案工作室 [Red Book Workspace]</span>
                        </span>
                      </div>

                      <div className="space-y-2 bg-[#050506] border border-[#2F3336]/60 rounded-lg p-2.5 font-sans">
                        <div className="text-[11px] font-extrabold text-neutral-100 flex items-center space-x-1.5 border-b border-[#2F3336]/30 pb-1">
                          <span className="text-rose-500">📌</span>
                          <span>{chat.generatedCopywriting.title}</span>
                        </div>
                        <p className="text-[10px] leading-relaxed font-mono text-neutral-300 select-all whitespace-pre-wrap">
                          {chat.generatedCopywriting.body}
                        </p>
                        <div className="flex flex-wrap gap-1 pt-1.5 border-t border-[#2F3336]/30 animate-pulse">
                          {chat.generatedCopywriting.tags.map((tg, i) => (
                            <span key={i} className="text-[8px] bg-rose-950/20 text-rose-400 border border-rose-500/10 px-1.5 py-0.5 rounded">
                              #{tg}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 bg-[#08080a] p-2 rounded-lg border border-[#2F3336]/30 font-mono">
                        <div className="flex justify-between items-center text-[9px] text-neutral-400">
                          <span>情感核心倾向微调 (Interactive Tone Selector)</span>
                          <span className="text-rose-400 font-bold">
                            {chat.generatedCopywriting.tone === 'classic' ? '轻奢优雅' : chat.generatedCopywriting.tone === 'hype' ? '爆品引流' : '匠心知性'}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const isRetail = industry.id === 'retail';
                              const bodyText = isRetail 
                                ? "爆红单品来袭！天然100%呼吸亚麻质地的法式风行款，真的是早春保暖又透气的绝密神仙物料！挺阔有骨骨感，回头率大爆炸！"
                                : "姐妹们薅秃这家古法老字号！双人套餐大红大火，经典意面爽滑弹牙，辣劲爆浆，精排霸王餐好吃到哭！全站冲冲冲！";
                              updateChatMessageCustomField(chat.id, (m) => ({
                                ...m,
                                generatedCopywriting: { 
                                  ...m.generatedCopywriting, 
                                  tone: 'hype', 
                                  body: bodyText,
                                  rating: 98,
                                  emotionalScore: 92
                                }
                              }));
                            }}
                            className={`flex-1 text-[8px] py-1 border rounded transition-all cursor-pointer ${
                              chat.generatedCopywriting.tone === 'hype' 
                                ? 'bg-rose-950/30 border-rose-500 text-rose-300 font-bold' 
                                : 'border-[#2F3336] text-neutral-400 hover:bg-neutral-900'
                            }`}
                          >
                            🔥 燥热吸粉
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const isRetail = industry.id === 'retail';
                              const bodyText = isRetail 
                                ? "好衣服能写满光阴。严选100%法国麻，它的松弛、骨挺与清雅，无一不在演绎着关于高阶审美的独立意志。低调、克制，通勤首推。"
                                : "岁月是一缕香浓。在老街头用八小时慢熬出一锅香郁。意式手工宽面里揉入的是质朴的心思。一箸入口，恰如风土的回响。";
                              updateChatMessageCustomField(chat.id, (m) => ({
                                ...m,
                                generatedCopywriting: { 
                                  ...m.generatedCopywriting, 
                                  tone: 'intellectual', 
                                  body: bodyText,
                                  rating: 91,
                                  emotionalScore: 94
                                }
                              }));
                            }}
                            className={`flex-1 text-[8px] py-1 border rounded transition-all cursor-pointer ${
                              chat.generatedCopywriting.tone === 'intellectual' 
                                ? 'bg-sky-950/30 border-sky-500 text-emerald-300 font-bold' 
                                : 'border-[#2F3336] text-neutral-400 hover:bg-neutral-900'
                            }`}
                          >
                            ☕ 深沉匠心
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const isRetail = industry.id === 'retail';
                              const bodyText = isRetail 
                                ? "懂行的人都在穿这件！100%呼吸感亚麻质地的法式风行款，真的是早春降降温穿搭神仙单品！它的天然亚麻面料轻盈透气，有一种慵懒松弛的高级感。"
                                : "姐妹们！今天终于薅到了这家宝藏老字号的羊毛！一进门就被它复古的环境震撼到，双人霸王餐简直是性价比之王！那碗意面裹满了秘制酱汁，巨美味！";
                              updateChatMessageCustomField(chat.id, (m) => ({
                                ...m,
                                generatedCopywriting: { 
                                  ...m.generatedCopywriting, 
                                  tone: 'classic', 
                                  body: bodyText,
                                  rating: 94,
                                  emotionalScore: 85
                                }
                              }));
                            }}
                            className={`flex-1 text-[8px] py-1 border rounded transition-all cursor-pointer ${
                              chat.generatedCopywriting.tone === 'classic' 
                                ? 'bg-indigo-950/30 border-indigo-500 text-indigo-300 font-bold' 
                                : 'border-[#2F3336] text-neutral-400 hover:bg-neutral-900'
                            }`}
                          >
                            ⚜ 经典优雅
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#2F3336] pt-2">
                        <div className="flex space-x-3 text-[8.5px] font-mono text-neutral-500">
                          <div>
                            爆款红利转化率: <span className="text-[#10b981] font-bold">{chat.generatedCopywriting.rating}%</span>
                          </div>
                          <div>
                            点击倾向: <span className="text-yellow-400 font-bold">{chat.generatedCopywriting.emotionalScore} 分</span>
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`${chat.generatedCopywriting!.title}\n\n${chat.generatedCopywriting!.body}\n\n${chat.generatedCopywriting!.tags.map(m=>'#'+m).join(' ')}`);
                            setLogs((p) => [
                              ...p,
                              {
                                id: Math.random().toString(),
                                timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                sender: '系统听写',
                                emoji: '📋',
                                message: `✔ 小红书文案已成功一键同步至切板面板！`,
                                type: 'success'
                              }
                            ]);
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 border border-rose-500/20 rounded text-[9px] font-bold text-white transition-all cursor-pointer flex items-center space-x-1 active:scale-95"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          <span>一键复制爆款推文</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Render 3: Generated Product Sourcing Forecast ERP Card */}
                  {chat.generatedPrediction && (
                    <div className="mt-3 p-3 overflow-hidden rounded-xl border border-[#2F3336] bg-[#0c0c0e] text-[#E5E5E5] text-left space-y-3 font-mono text-[9.5px]">
                      <div className="flex items-center justify-between border-b border-[#2F3336] pb-2 text-[10px] font-bold tracking-wider text-yellow-500">
                        <span className="flex items-center space-x-1">
                          <LineChart className="w-3.5 h-3.5 text-yellow-500" />
                          <span>AI供应链测款与ROI反向精算 [Merchandiser Predict]</span>
                        </span>
                      </div>

                      <div className="space-y-1.5 p-2 bg-[#050506] rounded-lg border border-[#2F3336]/40">
                        <div className="flex justify-between items-center text-xs font-bold text-white border-b border-neutral-900 pb-1">
                          <span>推荐商品名 (SPU Name)</span>
                          <span className="text-yellow-400 text-[10px] text-right font-extrabold max-w-[130px] truncate">{chat.generatedPrediction.name}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-neutral-400 border-b border-neutral-900 pb-1.5">
                          <div className="flex justify-between">
                            <span>供应链物料成本:</span>
                            <span className="text-neutral-200">¥{chat.generatedPrediction.cost.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>建档建议零售价:</span>
                            <span className="text-sky-400">¥{chat.generatedPrediction.price}</span>
                          </div>
                          <div className="flex justify-between col-span-2">
                            <span>毛益加乘倍数:</span>
                            <span className="text-yellow-400 font-bold">{chat.generatedPrediction.markup}% ({(chat.generatedPrediction.price / chat.generatedPrediction.cost).toFixed(1)}x Cost)</span>
                          </div>
                        </div>

                        <div className="pt-2 space-y-1">
                          <div className="flex justify-between text-[8.5px]">
                            <span className="text-neutral-500 font-sans">交互式演算利润率 (Slide to Adjust Markup):</span>
                            <span className="text-indigo-400 font-bold">{chat.generatedPrediction.markup}%</span>
                          </div>
                          <input
                            type="range"
                            min="120"
                            max="450"
                            value={chat.generatedPrediction.markup}
                            onChange={(e) => {
                              const newMarkup = parseInt(e.target.value);
                              const calculatedPrice = Math.floor(chat.generatedPrediction!.cost * (newMarkup / 100));
                              const priceRatio = calculatedPrice / chat.generatedPrediction!.cost;
                              let valROI = 78;
                              if (priceRatio >= 1.5 && priceRatio <= 3.5) {
                                valROI = Math.floor(92 - (priceRatio - 2.5) * (priceRatio - 2.5) * 15);
                              } else {
                                valROI = Math.floor(62 - Math.abs(priceRatio - 2.5) * 12);
                              }
                              updateChatMessageCustomField(chat.id, (m) => ({
                                ...m,
                                generatedPrediction: {
                                  ...m.generatedPrediction,
                                  markup: newMarkup,
                                  price: calculatedPrice,
                                  predictedROI: Math.max(30, Math.min(99, valROI))
                                }
                              }));
                            }}
                            className="w-full h-1 bg-neutral-900 rounded appearance-none cursor-pointer accent-yellow-400"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[8.5px] text-neutral-400 pt-1">
                        <span>首月综合销路热度 / ROI 预估:</span>
                        <span className="text-sky-400 font-bold font-mono">
                          {chat.generatedPrediction.predictedROI}分 / ROI ~ 1:{(chat.generatedPrediction.price / chat.generatedPrediction.cost * 0.85).toFixed(1)}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={chat.generatedPrediction.isUploaded}
                        onClick={() => {
                          const newItem = {
                            id: 'p' + Math.floor(Math.random() * 1000 + 100),
                            name: chat.generatedPrediction!.name,
                            price: chat.generatedPrediction!.price,
                            stock: 250,
                            image: industry.id === 'catering' ? '🍲' : '👚'
                          };
                          setProductsList((prev) => [...prev, newItem]);
                          updateChatMessageCustomField(chat.id, (m) => ({
                            ...m,
                            generatedPrediction: { ...m.generatedPrediction, isUploaded: true }
                          }));
                          setLogs((prev) => [
                            ...prev,
                            {
                              id: Math.random().toString(),
                              timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                              sender: 'AI商品经理',
                              emoji: '📦',
                              message: `✔ 【ERP 建档成功】爆款商品【${newItem.name}】精算定价为 ¥${newItem.price} 元并上架，今日同步配置初始现货 ${newItem.stock} 件。`,
                              type: 'success'
                            }
                          ]);
                        }}
                        className={`w-full py-1.5 rounded-lg text-center font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                          chat.generatedPrediction.isUploaded
                            ? 'bg-neutral-800 border border-neutral-700 text-neutral-500 cursor-not-allowed'
                            : 'bg-yellow-500 hover:bg-yellow-400 text-black border border-yellow-500/20 active:scale-95 font-sans'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{chat.generatedPrediction.isUploaded ? '已一建录单并在前端货架发布' : '批准建档：录入 ERP 后台并在网店上架'}</span>
                      </button>
                    </div>
                  )}

                  {/* Render 4: Generated Sensory Analysis Image Center Card */}
                  {chat.analyzedImage && (
                    <div className="mt-3 p-3 overflow-hidden rounded-xl border border-[#2F3336] bg-[#0c0c0e] text-[#E5E5E5] text-left space-y-3 font-mono text-[9.5px]">
                      <div className="flex items-center justify-between border-b border-[#2F3336] pb-2 text-[10px] font-bold tracking-wider text-sky-400">
                        <span className="flex items-center space-x-1.5">
                          <Server className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                          <span>AI 商品视觉像素解构终端 [Eye CV Studio]</span>
                        </span>
                      </div>

                      <div className="flex space-x-3 items-start bg-[#050506] p-2 rounded-lg border border-[#2F3336]/40">
                        <div className="w-14 h-14 rounded border border-[#2F3336] bg-neutral-900 overflow-hidden shrink-0 relative flex items-center justify-center">
                          {chat.analyzedImage.imageBase64 ? (
                            <img
                              src={chat.analyzedImage.imageBase64}
                              alt="Item Source"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <FileImage className="w-6 h-6 text-neutral-600" />
                          )}
                          <div className="absolute inset-0 border border-sky-500/20 animate-pulse pointer-events-none" />
                        </div>

                        <div className="flex-1 space-y-1.5 text-[10px] text-neutral-300">
                          <div className="flex justify-between text-[11px] font-bold text-white border-b border-neutral-900 pb-1">
                            <span>材质来源图纸</span>
                            <span className="text-sky-400 max-w-[110px] truncate" title={chat.analyzedImage.name}>
                              {chat.analyzedImage.name}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-neutral-500 text-[8px] block">高灵敏色素吸取 (Visual Swatches):</span>
                            <div className="flex flex-wrap gap-1">
                              {chat.analyzedImage.colorPalette.map((col, idx) => {
                                const hexVal = col.split(' ')[0] || '#4B5563';
                                return (
                                  <div key={idx} className="flex items-center space-x-1 border border-[#2F3336]/40 bg-[#0d0d0f] rounded px-1.5 py-0.5 scale-90 origin-left">
                                    <span className="w-2.5 h-2.5 rounded-sm border border-neutral-800" style={{ backgroundColor: hexVal }} />
                                    <span className="text-[7.5px] text-neutral-400">{col.split(' ')[1] || 'Color'}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {chat.analyzedImage.detectedSPUs.length > 0 && (
                        <div className="space-y-1 p-2 bg-[#09090b] rounded border border-[#2F3336]/30">
                          <span className="text-[#8B949E] text-[8.5px] block font-bold">💎 智能提取微操卖点 (SPU Key Elements):</span>
                          <ul className="space-y-1 text-neutral-300 list-disc list-inside">
                            {chat.analyzedImage.detectedSPUs.map((spu, idx) => (
                              <li key={idx} className="list-none flex items-start space-x-1">
                                <span className="text-[#10b981] font-bold">✔</span>
                                <span>{spu}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="p-2 bg-sky-950/10 border border-sky-500/10 text-emerald-300/90 leading-relaxed text-[8.5px] rounded-lg">
                        {chat.analyzedImage.textIdea}
                      </div>

                      <div className="flex items-center space-x-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            triggerAICopywriter();
                          }}
                          className="flex-1 py-1 px-2 text-center text-[9px] font-bold bg-[#1D9BF0] hover:bg-[#38BDF8] text-white rounded transition-all cursor-pointer border border-[#1D9BF0]/10"
                        >
                          ✍ 一键编写种草笔记
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerAICreativePoster();
                          }}
                          className="flex-1 py-1 px-2 text-center text-[9px] font-bold bg-neutral-900 border border-[#2F3336] text-[#8B949E] hover:text-white rounded transition-all cursor-pointer hover:bg-neutral-800"
                        >
                          🎨 渲染视觉宣传海报
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
 
             {isTyping && (
               <div className="flex flex-col items-start max-w-[80%] text-left">
                 <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-[#8B949E] font-mono">
                   <span>{selectedStaff.emoji}</span>
                   <span>【{selectedStaff.name}】正在进行大网调优、整合数据...</span>
                 </div>
                 <div className="p-3 rounded-xl border bg-[#09090B] border-[#2F3336] text-xs flex items-center space-x-1.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#8B949E] animate-bounce" />
                   <span className="w-1.5 h-1.5 rounded-full bg-[#8B949E] animate-bounce [animation-delay:0.2s]" />
                   <span className="w-1.5 h-1.5 rounded-full bg-[#8B949E] animate-bounce [animation-delay:0.4s]" />
                 </div>
               </div>
             )}
             <div ref={bottomChatsRef} />
           </div>

          {/* Quick interactive suggest shortcuts panel */}
          <div className="px-3 py-1.5 bg-[#09090B] border-t border-[#2F3336]/40 text-left">
            <span className="text-[9px] text-[#8B949E] uppercase tracking-wider font-mono block mb-1">
              推荐指令 / Suggestions
            </span>
            <div className="flex flex-wrap gap-1.5 pb-1 max-h-[72px] overflow-y-auto scrollbar">
              {getPromptShortcuts(selectedStaff.role).map((shortcut, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleShortcutClick(shortcut.prompt)}
                  className="text-[9px] bg-neutral-900 hover:bg-neutral-800 border border-[#2F3336] text-neutral-300 rounded px-2 py-0.5 cursor-pointer transition-colors font-mono flex items-center space-x-1 hover:text-white"
                >
                  <span>🚀</span>
                  <span>{shortcut.label}</span>
                </button>
              ))}
            </div>
          </div>
 
           {/* Chat input submit box form */}
           <form onSubmit={handleChatSubmit} className="p-3 border-t border-[#2F3336] bg-[#09090B] flex flex-col space-y-2 shrink-0">
             {/* Premium Advanced AI Action Toolbar inside form container */}
             <div className="flex items-center justify-between text-left pb-1 border-b border-[#2F3336]/30">
               <div className="flex items-center space-x-1">
                 <Sparkles className="w-3 h-3 text-sky-400 animate-pulse" />
                 <span className="text-[9px] font-bold text-neutral-300 tracking-wider font-mono">
                   AI 战略多模态行动工具条 (Premium Copilot Tool Belt)
                 </span>
               </div>
               <div className="flex items-center space-x-1.5">
                 <button
                   type="button"
                   onClick={triggerAICreativePoster}
                   className="text-[9px] bg-sky-950/40 hover:bg-sky-900 border border-sky-500/20 text-emerald-300 rounded px-2 py-0.5 cursor-pointer transition-all active:scale-95 duration-100 font-sans"
                 >
                   🎨 视觉海报
                 </button>
                 <button
                   type="button"
                   onClick={triggerAICopywriter}
                   className="text-[9px] bg-rose-950/40 hover:bg-rose-900 border border-rose-500/20 text-rose-300 rounded px-2 py-0.5 cursor-pointer transition-all active:scale-95 duration-100 font-sans"
                 >
                   ✍ 文案开发
                 </button>
                 <button
                   type="button"
                   onClick={triggerAIPrediction}
                   className="text-[9px] bg-yellow-950/40 hover:bg-yellow-900 border border-yellow-500/20 text-yellow-300 rounded px-2 py-0.5 cursor-pointer transition-all active:scale-95 duration-100 font-sans"
                 >
                   🔮 爆款微测
                 </button>
               </div>
             </div>

             <div className="flex items-center space-x-2 w-full">
               {voiceState !== 'idle' ? (
                 /* Voice recording Waveform View replacing input box */
                 <div className="flex-1 h-9 bg-neutral-900 border border-rose-500/40 rounded-lg flex items-center justify-between px-3 text-white font-mono text-[9px] animate-pulse w-full">
                   <div className="flex items-center space-x-2 relative">
                     <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute" />
                     <span className="w-2 h-2 rounded-full bg-rose-500 relative" />
                     <span className="font-bold pl-1">
                       {voiceState === 'listening' ? '高精语音听感捕捉中...' : '深度识素译谱中...'}
                     </span>
                   </div>
                   
                   {/* Oscillating visual bars */}
                   <div className="flex items-center space-x-0.5 h-3">
                     {voiceWaveformArr.map((vol, idx) => (
                       <div
                         key={idx}
                         className="w-0.5 bg-rose-500 rounded-sm"
                         style={{ height: `${vol}px`, minHeight: '2px' }}
                       />
                     ))}
                   </div>

                   <button
                     type="button"
                     onClick={() => {
                       setVoiceState('idle');
                       setLogs((prev) => [
                         ...prev,
                         {
                           id: Math.random().toString(),
                           timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                           sender: '控制台',
                           emoji: '🎙',
                           message: '创始人取消了语音输入。',
                           type: 'info'
                         }
                       ]);
                     }}
                     className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                   >
                     <X className="w-3 h-3" />
                   </button>
                 </div>
               ) : (
                 /* Normal view with text input & multi-modal buttons */
                 <div className="flex-1 flex items-center gap-1.5 min-w-0">
                   {/* Upload picker */}
                   <div className="relative group shrink-0">
                     <input
                       type="file"
                       accept="image/*"
                       onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                           const reader = new FileReader();
                           reader.onload = (event) => {
                             const base64Str = event.target?.result as string;
                             setAttachedImage(base64Str);
                             setAttachedImageName(file.name);
                           };
                           reader.readAsDataURL(file);
                         }
                       }}
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                       id="multi-modal-file-picker"
                     />
                     <button
                       type="button"
                       className="p-2 bg-neutral-900 border border-[#2F3336] rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
                       title="上传大底图片进行AI多模层分析"
                     >
                       <Image className="w-3.5 h-3.5" />
                       <span className="sr-only">Upload Asset</span>
                     </button>
                   </div>

                   {/* Microphone activator trigger */}
                   <button
                     type="button"
                     onClick={handleVoiceSimulationStart}
                     className="p-2 bg-neutral-900 border border-[#2F3336] rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer shrink-0"
                     title="高精语音听写"
                   >
                     <Mic className="w-3.5 h-3.5 animate-pulse" />
                   </button>

                   {/* Text input with floating preview */}
                   <div className="flex-1 relative flex items-center min-w-0">
                     <input
                       type="text"
                       value={chatMessage}
                       onChange={(e) => setChatMessage(e.target.value)}
                       placeholder={
                         attachedImage 
                           ? `[素材就绪: ${attachedImageName}] 点击右侧 Scan 开始解析` 
                           : `向【${selectedStaff.role}】的 ${selectedStaff.name} 下指任务指令...`
                       }
                       className="w-full bg-black border border-[#2F3336] focus:border-[#1D9BF0] rounded-lg py-2 pl-3 pr-24 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#1D9BF0] truncate"
                     />
                     
                     {attachedImage && (
                       <div className="absolute right-1 flex items-center space-x-1 bg-neutral-900/95 border border-[#2F3336] p-0.5 rounded z-20 scale-90">
                         <div className="w-4 h-4 rounded overflow-hidden border border-neutral-800 shrink-0">
                           <img src={attachedImage} alt="attached draft" className="w-full h-full object-cover" />
                         </div>
                         <button
                           type="button"
                           onClick={() => handleLocalImageScan(attachedImage!, attachedImageName || 'image_spec.png')}
                           className="text-[8px] bg-[#1D9BF0] hover:bg-[#38BDF8] font-bold px-1.5 py-0.5 rounded text-white flex items-center transition-all cursor-pointer active:scale-95 shrink-0"
                           title="多模态智能感知识别"
                         >
                           <span>Scan</span>
                         </button>
                         <button
                           type="button"
                           onClick={() => {
                             setAttachedImage(null);
                             setAttachedImageName(null);
                           }}
                           className="p-0.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
                         >
                           <X className="w-2.5 h-2.5" />
                         </button>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               <button
                 type="submit"
                 disabled={voiceState !== 'idle' || isTyping}
                 className={`p-2 rounded-lg text-white font-mono flex items-center justify-center shrink-0 border cursor-pointer active:scale-95 duration-150 ${
                   voiceState !== 'idle' || isTyping
                     ? 'bg-neutral-800 border-neutral-700 text-neutral-500 cursor-not-allowed'
                     : 'bg-[#1D9BF0] hover:bg-[#38BDF8] border-[#1D9BF0]/25'
                 }`}
               >
                 <Send className="w-3.5 h-3.5" />
               </button>
             </div>
           </form>

        </section>

      </div>
    </div>
  );
}
