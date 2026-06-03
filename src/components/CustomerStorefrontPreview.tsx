import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, ShoppingCart, ArrowLeft, Check, Sparkles, Smartphone, 
  Monitor, ChevronRight, Star, Clock, MapPin, Phone, Heart, Flame, Send, Search, MessageSquare
} from 'lucide-react';
import { db } from '../services/firebase';
import { sanitizeIndustryId } from '../services/industryGuard';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  desc: string;
  sales?: number;
  rating?: string;
  specs?: {
    sizes?: string[];
    labels?: string;
  };
}

const getIndustryDefaults = (indId: string) => {
  const defaults: Record<string, {
    company: string;
    headline: string;
    theme: 'retro' | 'dark' | 'classic' | 'fashion' | 'beauty' | 'hotel' | 'creator' | 'retail';
    products: Product[];
    welcome: string;
    recommendation: string;
    agentName: string;
    agentDesc: string;
    agentEmoji: string;
  }> = {
    fashion: {
      company: 'Aria Fashion Studio',
      headline: '👗 Aria 季风高定系列 · 舒感美学新风尚',
      theme: 'dark',
      welcome: '您好！我是 Claire，您的 24 小时 AI 穿搭与服饰顾问。尺码不合、现货配发、潮流搭配，随时问我哦！👗',
      recommendation: 'Aria 精选季风穿搭新款碎花长裙搭配流苏开衫外套',
      agentName: 'Claire',
      agentDesc: 'AI 经典穿搭服饰客服主管',
      agentEmoji: '💬',
      products: [
        { id: 'f1', name: '季风碎花垂坠长裙', price: 399, stock: 45, image: '👗', category: '女装', desc: '经典优雅，高腰版型，展现浪漫法式度假感，纯真丝爽滑内里。', sales: 412, rating: '99%', specs: { sizes: ['S码', 'M码', 'L码'], labels: '标准版/加长版' } },
        { id: 'f2', name: '舒感全棉针织吊带', price: 129, stock: 120, image: '👚', category: '女装', desc: '100%有机长绒棉，贴身舒适回弹，不易起球，多色百搭。', sales: 1240, rating: '98%', specs: { sizes: ['均码 / 白色', '均码 / 灰色', '均码 / 黑色'], labels: '修身版/宽松版' } },
        { id: 'f3', name: '桑蚕丝缎面修身西装', price: 899, stock: 30, image: '🧥', category: '外套', desc: '精选桑蚕丝混纺挺阔面料，手感高级莹润，利落剪裁。', sales: 98, rating: '97%', specs: { sizes: ['S码', 'M码', 'L码'], labels: '修身一粒扣' } },
        { id: 'f4', name: '收腹塑形高腰瑜伽裤', price: 199, stock: 85, image: '👖', category: '运动', desc: '双重高密弹力空气层，裸感雕琢腰腹线条，轻凉防震。', sales: 310, rating: '96%', specs: { sizes: ['S码', 'M码', 'L码', 'XL码'], labels: '高腰提臀版' } }
      ]
    },
    catering: {
      company: 'Tyson Cafe',
      headline: '☕ Tyson Cafe · 经典美式/手作拿铁特惠',
      theme: 'retro',
      welcome: '您好！我是 Mia，欢迎光临美食小站！对我们的招牌推荐、特惠神券或者送达时效有什么疑问吗？立即帮您解答！🍛',
      recommendation: 'Mia 臻选深烘椰香拿铁配手工熔岩黑森林慕斯',
      agentName: 'Mia',
      agentDesc: 'AI 餐饮外卖关怀客服主管',
      agentEmoji: '📞',
      products: [
        { id: 'p1', name: '冰美式', price: 18, stock: 120, image: '🥤', category: '咖啡', desc: '清爽顺滑，经典之选，100%阿拉比卡咖啡豆。', sales: 1234, rating: '98%', specs: { sizes: ['中杯 ¥18', '大杯 ¥22'], labels: '标准/少冰' } },
        { id: 'p2', name: '拿铁咖啡', price: 28, stock: 85, image: '☕', category: '咖啡', desc: '经典比例，奶香浓郁，自然甘甜，丝滑口感。', sales: 889, rating: '97%', specs: { sizes: ['中杯 ¥28', '大杯 ¥32'], labels: '标准/多奶' } },
        { id: 'p3', name: '生椰拿铁', price: 28, stock: 140, image: '🥥', category: '咖啡', desc: '椰香浓郁，口感顺滑，香甜醇厚，一口惊艳。', sales: 1109, rating: '99%', specs: { sizes: ['中杯 ¥28', '大杯 ¥32'], labels: '推荐冰饮' } },
        { id: 'p6', name: '提拉米苏', price: 26, stock: 40, image: '🍰', category: '甜品', desc: '意式经典重现，马斯卡彭慕斯搭配咖啡酒味，回味悠长。', sales: 310, rating: '96%', specs: { sizes: ['标准切片'], labels: '配热咖啡' } }
      ]
    },
    retail: {
      company: 'Moda Global Direct',
      headline: '✈️ 全球尖货精选直邮 · 发现品质生活好物',
      theme: 'retail',
      welcome: 'Hello！我是 Holly，生活百货采购及物流管家。货运发运详情、多规格对账、质保保真，均可一秒解答！✈️',
      recommendation: 'Holly 甄选便携式高强度真空保温杯与极速空气炸锅组',
      agentName: 'Holly',
      agentDesc: 'AI 跨境好物客服主管',
      agentEmoji: '🗣️',
      products: [
        { id: 'r1', name: '真空不锈钢保温杯', price: 129, stock: 88, image: '🥛', category: '餐具', desc: '镜面抽真空高规不锈钢，超强保冷防漏，24小时保温。', sales: 620, rating: '98%', specs: { sizes: ['350ml', '500ml'], labels: '曜石黑/皓月白' } },
        { id: 'r2', name: '智能防粘空气炸锅', price: 388, stock: 40, image: '🍳', category: '电器', desc: '360°热风循环极速脆化，免除繁多油脂，不粘易拆洗。', sales: 315, rating: '99%', specs: { sizes: ['4.5L 经典款', '6L 尊享家庭款'], labels: '一键智能屏' } },
        { id: 'r3', name: '按摩气垫发梳', price: 89, stock: 110, image: '🪮', category: '个护', desc: '活性透气气垫，防止拉拉掉发，轻按头部穴位酥爽体验。', sales: 124, rating: '95%', specs: { sizes: ['气囊按摩款', '防静电木齿款'], labels: '天然原木柄' } },
        { id: 'r4', name: '无叶降温挂脖风扇', price: 59, stock: 150, image: '🌀', category: '百货', desc: '双侧强力直流电机不吹发，全时柔风，环抱式清凉。', sales: 450, rating: '97%', specs: { sizes: ['标准款', '10小时长续航款'], labels: '风道防缠发' } }
      ]
    },
    beauty: {
      company: 'Coco Beauty Salon',
      headline: '💄 Coco Salon · 焕活平衡 SPA 与定制深层理疗',
      theme: 'beauty',
      welcome: '欢迎来到佳人沙龙！我是 Coco，对我们的预约变更、私域团购特卡或面膜红肿客诉有什么想了解的吗？💄',
      recommendation: 'Coco 极力特推焕活平衡 SPA 专属紧致精油深层疗程',
      agentName: 'Coco',
      agentDesc: 'AI 美容私域特惠客服主管',
      agentEmoji: '💁‍♀️',
      products: [
        { id: 'b1', name: '焕活全身精油SPA', price: 398, stock: 20, image: '🧴', category: 'SPA', desc: '独家精油按摩调理，通调身心气血，驱除肌肉深度僵硬。', sales: 88, rating: '99%', specs: { sizes: ['单人/60分钟', '单人/90分钟尊享'], labels: '到店即享/提供简餐' } },
        { id: 'b2', name: '无痕睫毛嫁接', price: 168, stock: 45, image: '👁️', category: '美睫', desc: '进口材质无重力重叠嫁接，防过敏不流泪，持久卷挺。', sales: 240, rating: '97%', specs: { sizes: ['自然款/120根', '浓密芭比款/不限根数'], labels: '专业技师一对一' } },
        { id: 'b3', name: '修护胶原蛋白面膜组', price: 258, stock: 75, image: '💆‍♀️', category: '护肤', desc: '冷敷多肽原液深层吸收，针对换季脱皮泛红极速赋活。', sales: 185, rating: '98%', specs: { sizes: ['5片疗程体验装', '15片密集修复囤货装'], labels: '敏感肌可用' } },
        { id: 'b4', name: '头道舒压毛囊净化养护', price: 128, stock: 50, image: '🧼', category: '沙龙', desc: '控油研磨净化颗粒，深层舒缓长期偏头痛与紧张脑沉。', sales: 310, rating: '96%', specs: { sizes: ['标准体验/40分钟'], labels: '附赠肩颈推拿' } }
      ]
    },
    hotel: {
      company: 'Luxe Haven Hotel',
      headline: '🏨 Luxe Haven · 精品酒店尊享入住与管家式服务',
      theme: 'hotel',
      welcome: '欢迎入住Luxe Haven，我是您的客房智能管家Aria。需要调整房态、升级早餐或安排专车接送？我随时为您服务。🏨',
      recommendation: 'Luxe Haven 推出当日快订升级房型与贵宾管家早餐礼遇',
      agentName: 'Aria',
      agentDesc: 'AI 酒店客房与礼宾客服主管',
      agentEmoji: '🛎️',
      products: [
        { id: 'h1', name: '豪华大床房 + 早餐礼遇', price: 680, stock: 18, image: '🛏️', category: '住宿', desc: '高级大床房含丰盛早餐礼遇，适合城市出差与度假贵宾。', sales: 44, rating: '98%', specs: { sizes: ['标准大床房', '景观大床房'], labels: '含自助早餐' } },
        { id: 'h2', name: '商务会议室时段租赁', price: 420, stock: 12, image: '🏢', category: '会议', desc: '含投影、白板与高速WiFi，适合小型商务洽谈与集训。', sales: 18, rating: '97%', specs: { sizes: ['半天/4小时', '全天/8小时'], labels: '含无线投影' } },
        { id: 'h3', name: '房内私人SPA按摩套餐', price: 480, stock: 15, image: '💆‍♀️', category: '体验', desc: '酒店房内私享按摩服务，放松身心，配套精油与音乐。', sales: 30, rating: '96%', specs: { sizes: ['60分钟', '90分钟'], labels: '按需预定' } },
        { id: 'h4', name: '机场接送豪华轿车服务', price: 320, stock: 10, image: '🚘', category: '接送', desc: '专车接送，含行李协助与贵宾接机引导服务。', sales: 22, rating: '98%', specs: { sizes: ['单程接机', '往返接送'], labels: '含司机服务' } }
      ]
    },
    creator: {
      company: 'Nova Creator Studio',
      headline: '📱 Nova Creator Studio · 直播带货与内容变现引擎',
      theme: 'creator',
      welcome: '欢迎来到 Nova，我是您的电商直播内容与选品引擎。需要优化直播脚本、搭配爆款带货品，或设置粉丝福利？我马上处理。📱',
      recommendation: 'Nova 推出本场带货爆品组合与涨粉互动直播脚本',
      agentName: 'Nova',
      agentDesc: 'AI 创作者直播内容客服主管',
      agentEmoji: '🎥',
      products: [
        { id: 'c1', name: '超火爆带货零食礼包', price: 59, stock: 240, image: '🍪', category: '直播爆款', desc: '社区零食组合，适合短视频高转化直播单品。', sales: 620, rating: '99%', specs: { sizes: ['单套装', '两套装'], labels: '带货推荐' } },
        { id: 'c2', name: '专业主播补光环LED灯', price: 149, stock: 90, image: '💡', category: '直播装备', desc: '高显指柔光补光环，适合直播间拍摄与短视频拍摄。', sales: 430, rating: '98%', specs: { sizes: ['18英寸', '24英寸'], labels: '调色可调亮' } },
        { id: 'c3', name: '短视频标题金句智能生成服务', price: 199, stock: 120, image: '📝', category: '内容服务', desc: 'AI 生成爆款短视频文案与直播开场脚本，提升转化率。', sales: 310, rating: '97%', specs: { sizes: ['单稿', '五稿合集'], labels: '含风格定制' } },
        { id: 'c4', name: '专业降噪领夹麦克风', price: 299, stock: 60, image: '🎙️', category: '直播设备', desc: '智能降噪，适合 mobile 直播与短视频录制。', sales: 255, rating: '98%', specs: { sizes: ['单麦克风', '双麦克风套装'], labels: '含防喷海绵' } }
      ]
    }
  };
  return defaults[indId as keyof typeof defaults];
};

const getSupportAgent = (indId: string) => {
  const def = getIndustryDefaults(indId);
  return { name: def.agentName, emoji: def.agentEmoji, desc: def.agentDesc, welcome: def.welcome };
};

const getIndustryRecommendation = (indId: string) => {
  return getIndustryDefaults(indId).recommendation;
};

const getSpecsForProduct = (product: Product, indId: string): string[] => {
  if (product.specs?.sizes && product.specs.sizes.length > 0) {
    return product.specs.sizes;
  }
  const defaultSpecs = getIndustryDefaults(indId).products.find(p => p.id === product.id)?.specs?.sizes;
  if (defaultSpecs) return defaultSpecs;
  
  const specFallback: Record<string, string[]> = {
    fashion: ['S码 / 黑色', 'M码 / 黑色', 'M码 / 白色', 'L码 / 白色'],
    catering: ['中杯 / 常温', '中杯 / 少冰', '大杯 / 热饮', '大杯 / 少冰'],
    retail: ['标准款 / 曜石黑', '升级款 / 曜石黑', '标准款 / 皓月白', '五包超值共享装'],
    beauty: ['单人体验 / 立即到店', '标准套餐 / 精细重构', '双人尊享 / 专属技师', '五次周期卡 / 极力推荐'],
    hotel: ['标准大床房', '景观大床房', '房内SPA', '机场接送专车'],
    creator: ['单稿内容 / 直播脚本', '三套带货文案', '主播装备包', '直播优惠组']
  };
  return specFallback[indId as keyof typeof specFallback];
};

// Safe localStorage sync reader
const getLocalValue = (key: string, fallback: string) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (e) {
    return fallback;
  }
};

// Industry validation moved to src/services/industryGuard.ts

export default function CustomerStorefrontPreview() {
  const localIndId = sanitizeIndustryId(getLocalValue('preview_industry_id', ''));
  const defaults = localIndId ? getIndustryDefaults(localIndId) : undefined;

  const [industryId, setIndustryId] = useState<string | undefined>(localIndId);
  const [theme, setTheme] = useState<'retro' | 'dark' | 'classic' | 'fashion' | 'beauty' | 'hotel' | 'creator' | 'retail' | undefined>(defaults?.theme);
  const [headline, setHeadline] = useState(defaults?.headline || '');
  const [company, setCompany] = useState(defaults?.company || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [customerCart, setCustomerCart] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'menu' | 'cart' | 'success'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [couponApplied, setCouponApplied] = useState(true);
  const [selectedSpecs, setSelectedSpecs] = useState<string>('');
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('朝阳区望京SOHO 2单元1102');
  const [orderType, setOrderType] = useState<'takeout' | 'dine_in'>('takeout');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState<'stripe' | 'alipay' | 'wechat' | 'paypal'>('stripe');
  const [wechatQrUrl, setWechatQrUrl] = useState('');
  const [paypalApprovalLink, setPaypalApprovalLink] = useState('');
  const [currentPaymentOrderId, setCurrentPaymentOrderId] = useState('');
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState<'unknown' | 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'failed'>('unknown');
  const [isPollingPaymentStatus, setIsPollingPaymentStatus] = useState(false);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const refreshPaymentStatus = async (orderId: string) => {
    if (!orderId) return;
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      if (data.success && data.order) {
        setCurrentPaymentStatus(data.order.status || 'unknown');
        if (data.order.status && data.order.status !== 'pending') {
          setOrderSubmitted(true);
          setShowPaymentModal(false);
          setActiveTab('success');
          setIsPaying(false);
          showToast(`支付已确认：订单状态 ${data.order.status}`, 'success');
        }
      }
    } catch (error: any) {
      setCurrentPaymentStatus('failed');
      console.warn('Refresh payment status failed', error);
    }
  };

  useEffect(() => {
    if (!currentPaymentOrderId || (selectedPayMethod !== 'wechat' && selectedPayMethod !== 'paypal')) {
      return;
    }

    setIsPollingPaymentStatus(true);
    const poll = async () => {
      await refreshPaymentStatus(currentPaymentOrderId);
    };
    poll();
    const interval = setInterval(poll, 8000);
    return () => {
      clearInterval(interval);
      setIsPollingPaymentStatus(false);
    };
  }, [currentPaymentOrderId, selectedPayMethod]);

  // Multi-device synchronization & Real interactive support state configuration
  const [searchQuery, setSearchQuery] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [userMsgInput, setUserMsgInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load configuration from localStorage on mount & subscribe to Firestore live Tenant attributes
  useEffect(() => {
    const localTheme = localStorage.getItem('preview_theme') as any;
    const localHeadline = localStorage.getItem('preview_headline');
    const localCompany = localStorage.getItem('preview_company');
    const localIndustryId = sanitizeIndustryId(localStorage.getItem('preview_industry_id') || '');
    const localProducts = localStorage.getItem('preview_products');
    const localTenantId = localStorage.getItem('preview_tenant_id') || '';

    if (localTheme) setTheme(localTheme);
    if (localHeadline) setHeadline(localHeadline);
    if (localCompany) setCompany(localCompany);
    if (localIndustryId) setIndustryId(localIndustryId);
    
    // Read teleport state
    const localTab = localStorage.getItem('customer_active_tab');
    if (localTab && ['home', 'menu', 'cart', 'success'].includes(localTab)) {
      setActiveTab(localTab as any);
      localStorage.removeItem('customer_active_tab');
    }

    // Dynamic subscription to Tenant Profile directly from Firestore for multi-end design connectivity!
    const tenantDocRef = doc(db, 'tenants', localTenantId);
    const unsubscribeTenant = onSnapshot(tenantDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.merchantName) setCompany(data.merchantName);
        if (data.companySlogan) setHeadline(data.companySlogan);
        if (data.storeTheme) setTheme(data.storeTheme);
        if (data.industryId) setIndustryId(data.industryId);
      }
    }, (error) => {
      console.warn("Real-time preview tenant sync failed (falling back): ", error);
    });

    // Dynamic subscription to the multi-tenant Firestore path for real-time customer menu updates!
    let unsubscribeProducts: (() => void) | null = null;
    if (localTenantId && localIndustryId) {
      try {
        const productColRef = collection(db, 'tenants', localTenantId, 'industries', localIndustryId, 'products');
        unsubscribeProducts = onSnapshot(productColRef, (colSnap) => {
          if (!colSnap.empty) {
            const list: Product[] = [];
            colSnap.forEach((docSnap) => {
              list.push({ id: docSnap.id, ...(docSnap.data() as any) } as Product);
            });
            setProducts(list);
          } else if (localProducts) {
            try {
              setProducts(JSON.parse(localProducts));
            } catch (e) {
              console.error(e);
            }
          } else {
            const indDefaults = getIndustryDefaults(localIndustryId);
            setProducts(indDefaults.products);
          }
        }, (error) => {
          console.warn('Real-time preview product load fallback: ', error);
          if (localProducts) {
            try {
              setProducts(JSON.parse(localProducts));
            } catch (e) {
              console.error(e);
            }
          } else {
            const indDefaults = getIndustryDefaults(localIndustryId);
            setProducts(indDefaults.products);
          }
        });
      } catch (err) {
        console.warn('Failed to subscribe to product collection:', err);
      }
    } else {
      // No tenant or industry selected in preview — load from localProducts or defaults
      if (localProducts) {
        try {
          setProducts(JSON.parse(localProducts));
        } catch (e) {
          console.error(e);
        }
      } else if (localIndustryId) {
        setProducts(getIndustryDefaults(localIndustryId).products);
      } else {
        setProducts([]);
      }
    }

    return () => {
      if (unsubscribeProducts) unsubscribeProducts();
      unsubscribeTenant();
    };
  }, []);

  // Theme styling palettes
  const palettes = {
    retro: {
      bg: 'bg-[#FCFAF2]',
      text: 'text-amber-950',
      textSec: 'text-zinc-650',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
      primaryBtn: 'bg-[#C15C3D] hover:bg-[#A94C2F] text-white',
      accentBg: 'bg-[#F2EDDB]',
      accentBorder: 'border-[#E7DEC1]',
    },
    dark: {
      bg: 'bg-neutral-950',
      text: 'text-white',
      textSec: 'text-neutral-400',
      badgeBg: 'bg-neutral-900 text-zinc-300 border-neutral-800',
      primaryBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      accentBg: 'bg-neutral-900/40',
      accentBorder: 'border-neutral-800',
    },
    classic: {
      bg: 'bg-white',
      text: 'text-slate-900',
      textSec: 'text-slate-550',
      badgeBg: 'bg-slate-50 text-slate-800 border-slate-100',
      primaryBtn: 'bg-[#18181B] hover:bg-black text-white',
      accentBg: 'bg-slate-50',
      accentBorder: 'border-slate-200',
    },
    fashion: {
      bg: 'bg-[#111827]',
      text: 'text-white',
      textSec: 'text-slate-300',
      badgeBg: 'bg-[#111827] text-[#FCA5A5] border-[#374151]',
      primaryBtn: 'bg-[#ec4899] hover:bg-[#db2777] text-white',
      accentBg: 'bg-[#1f2937]',
      accentBorder: 'border-[#4f46e5]',
    },
    retail: {
      bg: 'bg-white',
      text: 'text-slate-900',
      textSec: 'text-slate-500',
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
      primaryBtn: 'bg-[#0f172a] hover:bg-[#1e293b] text-white',
      accentBg: 'bg-[#f8fafc]',
      accentBorder: 'border-[#e2e8f0]',
    },
    beauty: {
      bg: 'bg-[#FFF1F6]',
      text: 'text-[#831843]',
      textSec: 'text-[#9d174d]',
      badgeBg: 'bg-[#fbcfe8] text-[#881337] border-[#f9a8d4]',
      primaryBtn: 'bg-[#be185d] hover:bg-[#9d174d] text-white',
      accentBg: 'bg-[#fff1f6]',
      accentBorder: 'border-[#f9a8d4]',
    },
    hotel: {
      bg: 'bg-[#F8FAFC]',
      text: 'text-slate-900',
      textSec: 'text-slate-600',
      badgeBg: 'bg-[#e2e8f0] text-slate-900 border-[#cbd5e1]',
      primaryBtn: 'bg-[#0f172a] hover:bg-[#1e293b] text-white',
      accentBg: 'bg-[#e2e8f0]',
      accentBorder: 'border-[#94a3b8]',
    },
    creator: {
      bg: 'bg-[#0F172A]',
      text: 'text-white',
      textSec: 'text-[#c7d2fe]',
      badgeBg: 'bg-[#312e81] text-[#c7d2fe] border-[#4338ca]',
      primaryBtn: 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white',
      accentBg: 'bg-[#111827]',
      accentBorder: 'border-[#4338ca]',
    }
  };

  const currentStyle = theme ? palettes[theme as keyof typeof palettes] : undefined;

  if (!industryId || !defaults || !currentStyle) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-black text-white">
        <div className="max-w-xl text-center px-6 py-10 border border-red-500 rounded-3xl bg-[#1a030d]">
          <h2 className="text-2xl font-bold mb-4">行业模板不存在</h2>
          <p className="text-sm text-red-200">当前选择的行业没有可用前端模板。请重新选择有效行业或联系管理员。</p>
        </div>
      </div>
    );
  }

  // Dynamic SPU search filtering corresponding to products list in database
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Add to cart helper
  const addToCart = (product: Product, selectedOptions?: string) => {
    const sizeStr = selectedOptions || getSpecsForProduct(product, industryId)[0] || '标准规格';
    const existing = customerCart.find(it => it.id === product.id && it.specs === sizeStr);
    
    if (existing) {
      setCustomerCart(p => p.map(it => it.id === product.id && it.specs === sizeStr ? { ...it, quantity: it.quantity + 1 } : it));
    } else {
      setCustomerCart(p => [...p, { ...product, quantity: 1, specs: sizeStr }]);
    }
  };

  const getCartTotal = () => {
    const sub = customerCart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    return Math.max(0, sub - (couponApplied ? 12 : 0));
  };

  // Chat window initialization with industry-specific digital assistant welcome message
  useEffect(() => {
    if (isChatOpen && chatMessages.length === 0) {
      const agent = getSupportAgent(industryId);
      setChatMessages([
        {
          id: 'welcome',
          sender: 'agent',
          text: agent.welcome,
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [isChatOpen, industryId]);

  // Keep chat scrolls to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setUserMsgInput('');

    const agent = getSupportAgent(industryId);
                        const localTenantId = localStorage.getItem('preview_tenant_id') || '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          employeeName: agent.name,
          employeeRole: agent.desc,
          industryTagline: headline,
          strategyName: '自主深度托管模式 (Full-Auto)',
          strategyDesc: '深度结合 RAG 向量智库实时应答，全额理算。',
          tenantId: localTenantId
        })
      });
      const data = await response.json();
      if (data.success && data.reply) {
        setChatMessages((prev) => [...prev, {
          id: `a-${Date.now()}`,
          sender: 'agent',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsTyping(false);
        return;
      }
    } catch (err: any) {
      console.warn("Backend chat call failed, triggers offline smart fallback: ", err.message);
    }

    // Interactive fallback smart rule catalog matches
    setTimeout(() => {
      const lowerText = text.toLowerCase();
      let reply = '';

      if (lowerText.includes('推荐') || lowerText.includes('招牌') || lowerText.includes('卖得好') || lowerText.includes('最火') || lowerText.includes('推荐一下')) {
        const topProduct = products[0] || { name: '招牌主推单品', price: 28 };
        reply = `我们极力推荐今日主打款【${topProduct.name}】，售价仅需 ￥${topProduct.price} 元！高品质原材料供应，当前下单并结账还能扣减大额红包。您可以直接在手机端一键加购体验噢！✨`;
      } else if (lowerText.includes('便宜') || lowerText.includes('划算') || lowerText.includes('价格') || lowerText.includes('多少钱') || lowerText.includes('折扣')) {
        if (products.length > 0) {
          const sorted = [...products].sort((a, b) => a.price - b.price);
          reply = `我们店性价比最高的是【${sorted[0].name}】，售价仅 ￥${sorted[0].price} 元。另外当前我们有线上限定无门槛红包 -￥12，结算时会自动扣减！`;
        } else {
          reply = `我们的核心定价非常透明亲民，同时本店铺有全线安全假一损一和免单大红包权益保障，您可以放心直接在右端点单买单哦！`;
        }
      } else if (lowerText.includes('送') || lowerText.includes('物流') || lowerText.includes('发货') || lowerText.includes('多长时间') || lowerText.includes('到货')) {
        reply = `我们默认配发【顺丰同城急送】与【航空保价物流】。对于同城用户，AI 运营系统会在 1秒内响应自动出货揽件，30 分钟内送达，大件重货直接免费搬运上楼！`;
      } else if (lowerText.includes('你好') || lowerText.includes('在吗') || lowerText.includes('开店') || lowerText.includes('哈喽') || lowerText.includes('有人吗')) {
        reply = `您好！我是您的 24 小时 AI 智能助理 ${agent.name}，很高兴为您服务！对我们的商品规格、发货时效、折扣、定制细节等，我都能极速回答。`;
      } else {
        const matchedProduct = products.find(p => lowerText.includes(p.name.toLowerCase()));
        if (matchedProduct) {
          reply = `不错哦！您了解的【${matchedProduct.name}】是我们的口碑推荐款（售价 ￥${matchedProduct.price}），介绍说：${matchedProduct.desc}。需要我帮您直接加载到购物车吗？🛍️`;
        } else {
          reply = `收到！我已经将您的反馈记录到云端。我们店面搭载的 24h 运营智脑已极速跟进订单流，如有任何不适客诉，支持直接发起退垫赔付机制，让您购物无忧！`;
        }
      }

      const agentMsg = {
        id: `a-${Date.now()}`,
        sender: 'agent',
        text: reply,
        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);
    }, 1100);
  };

  // Switch back to merchant panel
  const handleBackToDashboard = () => {
    window.close();
    // Safety fallback: if not opened as blank popup, replace URL back
    const url = new URL(window.location.href);
    url.searchParams.delete('preview');
    window.location.href = url.toString();
  };

  return (
    <div className="min-h-screen bg-[#09090C] text-zinc-100 flex flex-col font-sans overflow-x-hidden select-none">
      
      {/* Top Banner Control Header */}
      <header className="bg-zinc-950 border-b border-zinc-800 py-3.5 px-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 relative z-50 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold shrink-0 animate-pulse">
            🌐
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-extrabold tracking-tight text-white">{company} • 预览系统</h1>
              <span className="bg-emerald-500/10 text-sky-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-sky-500/20">LIVE ACTIVE</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">店铺线上预览</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button 
            onClick={handleBackToDashboard}
            className="inline-flex items-center space-x-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded-lg cursor-pointer hover:bg-zinc-850 duration-150 transition-all font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回商家工作台</span>
          </button>
        </div>
      </header>

      {/* Main Preview Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: DESKTOP OFFICIAL WEB PREVIEW (col-span-7) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-450 uppercase tracking-widest font-mono flex items-center space-x-2">
              <Monitor className="w-4 h-4 text-sky-400" />
              <span>电脑端商户官网</span>
            </h2>
            <span className="text-[10px] font-mono text-zinc-500">企业版预览</span>
          </div>

          {/* Simulated Browser Workspace Container */}
          <div className="w-full bg-[#111115] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Elegant Browser Top Chrome Address Bar */}
            <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-850 flex items-center space-x-2">
              <div className="flex space-x-1.5 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex-1 bg-zinc-900 text-[10px] font-mono py-1 px-3 text-zinc-400 rounded-lg text-center flex items-center justify-center space-x-1 truncate max-w-md mx-auto border border-zinc-800">
                <span className="text-sky-500 select-none">🔒 https://</span>
                <span className="text-zinc-200 select-all">{company.toLowerCase().replace(/\s+/g, '-') || 'shop'}.ai-shop.co</span>
              </div>
              <span className="text-[10px] font-mono text-sky-400 shrink-0 select-none px-1.5 py-0.5 bg-sky-950/40 rounded border border-emerald-900">100% 极速加载</span>
            </div>

            {/* Generated Shop Website Body */}
            <div className={`p-6 min-h-[520px] max-h-[580px] overflow-y-auto custom-scrollbar flex flex-col ${currentStyle.bg} ${currentStyle.text}`}>
              
              {/* Web Header/Navigation bar */}
              <nav className="flex justify-between items-center pb-5 border-b border-zinc-200/10">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🏪</span>
                  <span className="font-extrabold text-sm tracking-tight">{company}</span>
                </div>
                <div className="flex items-center space-x-6 text-xs font-medium">
                  <span className="cursor-pointer hover:opacity-75">主页</span>
                  <span className="cursor-pointer hover:opacity-75">精选菜单</span>
                  <span className="cursor-pointer hover:opacity-75">关于品牌</span>
                  <span className="cursor-pointer hover:opacity-75">联系我们</span>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <div className="relative cursor-pointer">
                    <ShoppingBag className="w-4 h-4" />
                    {customerCart.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[8px] font-bold">
                        {customerCart.reduce((s, it) => s + it.quantity, 0)}
                      </span>
                    )}
                  </div>
                </div>
              </nav>

              {/* Web Hero Section */}
              <div className="py-8 text-center space-y-4">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-800 border border-emerald-200 select-none">
                  ⚡ 专属官网
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
                  {headline}
                </h1>
                <p className="text-xs max-w-md mx-auto opacity-75">
                  为您精选优质工艺。
                </p>
                <div className="flex items-center justify-center space-x-3 pt-2">
                  <button onClick={() => {
                    showToast('【官网模拟下单】：已成功定位产品系列，您可以通过右侧的 Mobile App 端进行真实交互订购！', 'info');
                  }} className={`px-5 py-2 rounded-lg font-bold text-xs shadow-md transition-all ${currentStyle.primaryBtn}`}>
                    立即阅览点餐 / Experience
                  </button>
                  <button className="px-5 py-2 rounded-lg border border-zinc-300 text-xs font-bold bg-transparent">
                    领取限定红包 🎟️
                  </button>
                </div>

                {/* Interactive SPU search bar on PC Storefront */}
                <div className="max-w-md mx-auto relative mt-5">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="请输入商品名称、描述或分类进行实时 SPU 搜索过滤..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-black/10 text-xs border border-zinc-300/15 focus:border-[#1D9BF0] focus:outline-none focus:ring-1 focus:ring-[#1D9BF0] rounded-xl duration-150 transition-colors placeholder:text-zinc-500 font-sans"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-zinc-400 hover:text-white font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Product Visual Showcase Grid */}
              <div className="mt-4 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-200/5 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-90 text-left">🌟 主推招牌系列 ({filteredProducts.length}款)</h3>
                  {searchQuery && <span className="text-[10px] text-sky-400">正在按关键词 “{searchQuery}” 过滤</span>}
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-xs font-mono">
                    ⚠️ 没有找到符合 “{searchQuery}” 搜索词的商品，建议换一个词再试试。
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {filteredProducts.map((p) => (
                      <div 
                        key={p.id} 
                        className={`p-3 rounded-xl border flex flex-col justify-between hover:scale-101 duration-150 cursor-pointer ${currentStyle.accentBg} ${currentStyle.accentBorder}`}
                      >
                        <div className="relative">
                          <span className="absolute top-0 left-0 bg-red-500 text-white font-bold text-[8px] px-1 py-0.5 rounded shadow">REC</span>
                          <div className="text-center py-4 text-4xl filter drop-shadow select-none">{p.image}</div>
                        </div>
                        <div className="space-y-1 text-left mt-2">
                          <h4 className="text-xs font-bold leading-tight truncate">{p.name}</h4>
                          <p className="text-[10px] opacity-60 leading-normal line-clamp-2 min-h-[30px]">{p.desc}</p>
                          <div className="flex items-center justify-between pt-1.5">
                            <span className="text-xs font-black font-mono">¥{p.price}</span>
                            <button 
                              type="button"
                              onClick={() => {
                                addToCart(p);
                                showToast(`已将【${p.name}】加车！`, 'success');
                              }}
                              className={`px-2 py-1 rounded text-[9px] font-bold ${currentStyle.primaryBtn}`}
                            >
                              加购
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Promo Footer Cards */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className={`p-4 rounded-xl border ${currentStyle.accentBg} ${currentStyle.accentBorder}`}>
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>今日营业时段 (Opening Hours)</span>
                  </div>
                  <p className="text-[11px] mt-1.5 opacity-75">星期一至星期日 09:00 - 22:30，AI 店长与专业员工 24 小时全自动处理线上订单结款。</p>
                </div>
                <div className={`p-4 rounded-xl border ${currentStyle.accentBg} ${currentStyle.accentBorder}`}>
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>智能店址指引 (Delivery Area)</span>
                  </div>
                  <p className="text-[11px] mt-1.5 opacity-75">本地实体双轨网关，支持全周边界外卖极速自动派单配送与店内一键免排队扫码结算。</p>
                </div>
              </div>

              {/* Quick info feedback copyright */}
              <div className="mt-12 pt-4 border-t border-zinc-200/5 text-center text-[10px] opacity-40">
                © 2026 {company}. Powered by Antigravity AI Engine. All rights reserved.
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SMARTPHONE INTERACTIVE APP SIMULATOR (col-span-5) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-450 uppercase tracking-widest font-mono flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-sky-400" />
              <span>手机 App 预览</span>
            </h2>
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] text-zinc-500 font-mono">INTERACTIVE</span>
            </div>
          </div>

          {/* Elegant Phone frame wrapper */}
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[315px] bg-[#0c0c0e] border-[10px] border-zinc-800 rounded-[44px] h-[550px] shadow-2xl relative flex flex-col overflow-hidden group-hover:border-neutral-700">
              
              {/* Top Speaker/Notch */}
              <div className="absolute top-0 inset-x-0 h-5 bg-black flex items-center justify-center z-40 select-none">
                <div className="w-24 h-4 bg-neutral-900 rounded-b-xl flex items-center justify-center">
                  <span className="w-8 h-1 bg-zinc-800 rounded-full" />
                </div>
              </div>

              {/* Status accents */}
              <div className="absolute top-1.5 inset-x-5 flex justify-between items-center z-30 select-none text-zinc-400">
                <span className="text-[9px] font-bold font-mono">12:35 ☕</span>
                <span className="text-[9px] font-bold font-mono">5G 📶 98% 🔋</span>
              </div>

              {/* Display page screen */}
              <div className={`flex-1 flex flex-col relative h-full pt-6 overflow-hidden ${currentStyle.bg} ${currentStyle.text}`}>
                
                {/* Scrollable mini content viewport */}
                <div className="flex-1 overflow-y-auto px-3.5 pb-10 pt-2 custom-scrollbar flex flex-col min-h-0 text-left">
                  
                  {/* APP HOME PAGE */}
                  {activeTab === 'home' && (
                    <div className="space-y-3.5 flex flex-col flex-1">
                      
                      {/* Interactive banner header */}
                      <div className="rounded-2xl p-3.5 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white relative overflow-hidden shadow">
                        <span className="absolute top-2 right-2 bg-rose-500 text-white text-[7px] px-1 py-0.5 rounded font-mono animate-pulse font-extrabold">NEW</span>
                        <h4 className="font-extrabold text-[12px] tracking-tight">{company} 小程序</h4>
                        <p className="text-[9px] text-zinc-400 mt-1">{headline.slice(0, 24)}...</p>
                        <div className="flex items-center space-x-1.5 mt-2.5 pt-2 border-t border-white/10 text-[7.5px] text-emerald-300">
                          <span>⭐⭐⭐⭐⭐</span>
                          <span>(320+ 人消费评级)</span>
                        </div>
                      </div>

                      {/* Mode choice indicator */}
                      <div className="bg-zinc-150 dark:bg-zinc-900/60 p-1 rounded-lg border border-zinc-200 dark:border-zinc-850 flex gap-1 text-center font-bold text-[8.5px]">
                        <button 
                          onClick={() => setOrderType('takeout')}
                          className={`flex-1 py-1 rounded transition-all text-[8px] ${orderType === 'takeout' ? 'bg-[#1D9BF0] text-white' : 'opacity-60'}`}
                        >
                          🛵 外卖配送
                        </button>
                        <button 
                          onClick={() => setOrderType('dine_in')}
                          className={`flex-1 py-1 rounded transition-all text-[8px] ${orderType === 'dine_in' ? 'bg-[#1D9BF0] text-white' : 'opacity-60'}`}
                        >
                          🍱 扫码自取
                        </button>
                      </div>

                      {/* Mini AI selection */}
                      <div className="p-2.5 rounded-xl border border-sky-500/10 bg-sky-500/5 text-left text-[8.5px] opacity-95 leading-relaxed">
                        <span className="font-extrabold text-[#1D9BF0] block mb-0.5">💡 智脑专属推荐 / AI Suggestion</span>
                        {getIndustryRecommendation(industryId)}。
                      </div>

                      {/* Hot items listing */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black">🔥 人气必点推荐</span>
                          <span onClick={() => setActiveTab('menu')} className="text-[8px] text-zinc-500 hover:underline cursor-pointer">全部菜单</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(filteredProducts.length > 0 ? filteredProducts : products).slice(0, 2).map(p => (
                            <div 
                              key={p.id} 
                              onClick={() => { setSelectedProduct(p); setSelectedSpecs(getSpecsForProduct(p, industryId)[0] || '标准规格'); }}
                              className={`p-2 rounded-lg border cursor-pointer hover:border-sky-500 transition-all ${currentStyle.accentBg} ${currentStyle.accentBorder}`}
                            >
                              <div className="text-2xl text-center pb-1">{p.image}</div>
                              <div className="font-bold text-[9px] truncate">{p.name}</div>
                              <p className="text-[7.5px] text-zinc-400 truncate mt-0.5">{p.desc}</p>
                              <div className="flex justify-between items-center mt-1.5">
                                <span className="text-[9px] font-extrabold">¥{p.price}</span>
                                <span className="w-3.5 h-3.5 rounded-full bg-[#1D9BF0] text-white flex items-center justify-center font-bold text-[8px]">+</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* APP MENU PAGE */}
                  {activeTab === 'menu' && (
                    <div className="space-y-2.5">
                      <div className="border-b pb-1.5 flex justify-between items-center border-zinc-200/10">
                        <span className="font-extrabold text-[10px]">📖 线上点餐中心</span>
                        <span className="text-[8px] text-zinc-400">一键极速点单</span>
                      </div>

                      {/* Interactive Mini Search bar on Mobile App layout */}
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-500">
                          <Search className="w-2.5 h-2.5" />
                        </span>
                        <input
                          type="text"
                          placeholder="搜索店内好物..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-7 pr-6 py-1 bg-black/10 dark:bg-white/5 text-[8px] border border-zinc-350/10 rounded-lg focus:outline-none focus:border-[#1D9BF0] font-sans"
                        />
                        {searchQuery && (
                          <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-2 flex items-center text-[8px] text-zinc-400 hover:text-white"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-1.5 flex-1 max-h-[310px] overflow-y-auto custom-scrollbar">
                        {filteredProducts.length === 0 ? (
                          <p className="text-[8px] font-mono text-zinc-500 py-8 text-center bg-black/5 rounded">没有找到符合条件的商品</p>
                        ) : (
                          filteredProducts.map(p => (
                            <div 
                              key={p.id} 
                              onClick={() => { setSelectedProduct(p); setSelectedSpecs(getSpecsForProduct(p, industryId)[0] || '标准规格'); }}
                              className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer hover:border-sky-500 transition-all ${currentStyle.accentBg} ${currentStyle.accentBorder}`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <span className="text-xl shrink-0">{p.image}</span>
                                <div className="min-w-0">
                                  <div className="font-black text-[9px] truncate">{p.name}</div>
                                  <div className="text-[7.5px] text-zinc-500 truncate w-28 mt-0.5">{p.desc}</div>
                                  <span className="text-[9px] font-black text-amber-700 block mt-0.5">¥{p.price}</span>
                                </div>
                              </div>
                              <span className="w-4 h-4 rounded-full bg-[#1D9BF0] text-white flex items-center justify-center text-[10px] font-bold shrink-0">+</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* APP CART PAGE */}
                  {activeTab === 'cart' && (
                    <div className="space-y-2.5 flex-1 flex flex-col">
                      <div className="border-b pb-1 flex justify-between items-center border-zinc-200/10">
                        <span className="font-black text-[10px]">🛒 您的选购清单 ({customerCart.length}款)</span>
                        {customerCart.length > 0 && (
                          <button onClick={() => setCustomerCart([])} className="text-[8px] text-zinc-400 underline">清空</button>
                        )}
                      </div>

                      {customerCart.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-2">
                          <span className="text-3xl animate-bounce">🛍️</span>
                          <p className="text-[8.5px] text-zinc-400 text-center">暂无加车产品，快去点单吧！</p>
                          <button onClick={() => setActiveTab('menu')} className="px-3 py-1 bg-[#1D9BF0] text-white text-[8px] rounded-full">去挑两杯</button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar">
                            {customerCart.map((item, idx) => (
                              <div key={idx} className={`p-1.5 rounded border flex items-center justify-between ${currentStyle.accentBg} ${currentStyle.accentBorder}`}>
                                <div className="flex items-center space-x-1.5 truncate">
                                  <span className="text-lg">{item.image}</span>
                                  <div className="min-w-0 text-left">
                                    <h5 className="font-bold text-[8.5px] truncate">{item.name}</h5>
                                    <p className="text-[7px] text-emerald-800">{item.specs}</p>
                                    <span className="text-[8.5px] font-extrabold text-amber-800">¥{item.price}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 shrink-0 scale-90">
                                  <button onClick={() => {
                                    setCustomerCart(p => p.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it));
                                  }} className="bg-zinc-200 dark:bg-zinc-800 text-zinc-750 w-4 h-4 rounded text-[9.5px] font-bold">-</button>
                                  <span className="text-[9px] font-black w-2 text-center">{item.quantity}</span>
                                  <button onClick={() => {
                                    setCustomerCart(p => p.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it));
                                  }} className="bg-[#1D9BF0] text-white w-4 h-4 rounded text-[9.5px] font-bold">+</button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-1.5 border-t border-dashed border-zinc-250 pt-2.5">
                            {orderType === 'takeout' && (
                              <div className="space-y-0.5 text-left">
                                <label className="text-[7.5px] text-zinc-400 font-mono block">🛵 送餐派送点：</label>
                                <input 
                                  type="text" 
                                  value={deliveryAddress}
                                  onChange={e => setDeliveryAddress(e.target.value)}
                                  className="w-full bg-black/10 border border-zinc-300 dark:border-zinc-800 rounded p-1 text-[8px] focus:outline-none"
                                />
                              </div>
                            )}

                            <div className="p-1 px-1.5 rounded text-[8px] bg-red-500/5 border border-red-500/10 flex justify-between items-center">
                              <span className="text-amber-800 dark:text-amber-400 font-bold">🎟️ 红包扣减</span>
                              <button onClick={() => setCouponApplied(!couponApplied)} className="underline cursor-pointer font-bold">{couponApplied ? '-¥12' : '不可用'}</button>
                            </div>

                            <div className="flex justify-between items-center text-[9px] font-black pt-1">
                              <span>总付结款金额：</span>
                              <span className="text-amber-800 text-[10.5px]">¥{getCartTotal().toFixed(2)}</span>
                            </div>

                             <button 
                              type="button"
                              onClick={() => setShowPaymentModal(true)}
                              className="w-full py-1.5 bg-[#1D9BF0] hover:bg-emerald-600 text-white font-bold text-[8.5px] rounded-lg shadow-md uppercase transition-all"
                            >
                              🚀 立即支付 / Submit Link
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUCCESS CONSOLE ORDER */}
                  {activeTab === 'success' && (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-3.5 text-center py-10 animate-fadeIn">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-sky-500/20 text-emerald-550 text-xl flex items-center justify-center font-mono">
                        ✔
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[12px]">☕ 订单提交成功！</h4>
                        <p className="text-[8.5px] text-zinc-400 mt-1 max-w-[185px] mx-auto leading-relaxed">
                          订单已成功提交。
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setOrderSubmitted(false);
                          setActiveTab('home');
                        }}
                        className="px-4 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-250 font-bold text-[8px] rounded-full hover:scale-102 transition-all"
                      >
                        返回主页
                      </button>
                    </div>
                  )}

                </div>

                {showPaymentModal && (
                  <div className="absolute inset-x-0 bottom-0 top-[20px] bg-zinc-950 z-45 flex flex-col p-4 text-left justify-between animate-fadeIn border-t border-zinc-800 rounded-t-3xl">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                        <span className="text-[11px] font-black text-white flex items-center space-x-1">
                          <span>💳 Stripe 安全结算中心</span>
                        </span>
                        <button 
                          onClick={() => setShowPaymentModal(false)}
                          className="text-zinc-400 hover:text-white font-bold text-xs"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Payment Method Selector */}
                      <div className="grid grid-cols-2 gap-2 text-center">
                        {[
                          { id: 'stripe', label: '💳 Stripe (国际卡)', activeClass: 'bg-[#635BFF]/10 text-[#635BFF] border-[#635BFF]' },
                          { id: 'alipay', label: '📱 Alipay', activeClass: 'bg-[#1D9BF0]/10 text-[#1D9BF0] border-[#1D9BF0]' },
                          { id: 'wechat', label: '🟢 WeChat Pay', activeClass: 'bg-[#1EB23B]/10 text-[#1EB23B] border-[#1EB23B]' },
                          { id: 'paypal', label: '🅿️ PayPal', activeClass: 'bg-[#003087]/10 text-[#003087] border-[#003087]' }
                        ].map((pay) => (
                          <button
                            key={pay.id}
                            type="button"
                            onClick={() => setSelectedPayMethod(pay.id as any)}
                            className={`py-1.5 rounded-xl border text-[8px] font-bold flex flex-col items-center justify-center space-y-1 ${
                              selectedPayMethod === pay.id ? pay.activeClass : 'bg-transparent text-zinc-450 border-zinc-900 shadow-sm'
                            }`}
                          >
                            <span>{pay.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Form Inputs based on method selector */}
                      {selectedPayMethod === 'stripe' ? (
                        <div className="space-y-2 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-805/80 font-sans text-[8.5px]">
                          <div className="space-y-0.5">
                            <label className="text-[7px] text-zinc-500 font-mono">卡号 (Card Number)</label>
                            <input
                              type="text"
                              readOnly
                              value="4242 •••• •••• 4242"
                              className="w-full bg-black/50 border border-zinc-800 rounded p-1 text-[8px] font-mono text-zinc-300 focus:outline-none cursor-not-allowed"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-0.5">
                              <label className="text-[7px] text-zinc-500 font-mono">有效期 (Expiry)</label>
                              <input
                                type="text"
                                readOnly
                                value="12 / 29"
                                className="w-full bg-black/50 border border-zinc-800 rounded p-1 text-[8px] font-mono text-zinc-300 focus:outline-none cursor-not-allowed"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[7px] text-zinc-500 font-mono">安全码 (CVC)</label>
                              <input
                                type="text"
                                readOnly
                                value="***"
                                className="w-full bg-black/50 border border-zinc-800 rounded p-1 text-[8px] font-mono text-zinc-300 focus:outline-none cursor-not-allowed"
                              />
                            </div>
                          </div>
                          <span className="text-[7px] text-zinc-550 block text-center">🔐 SSL Secured • Stripe sandbox enabled</span>
                        </div>
                      ) : selectedPayMethod === 'alipay' ? (
                        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-850 text-center space-y-2">
                          <div className="w-20 h-20 mx-auto bg-white p-1 rounded-md flex items-center justify-center relative">
                            <div className="absolute inset-1 bg-gradient-to-br from-[#1D9BF0] to-teal-400 opacity-10 animate-pulse" />
                            <span className="text-[10px] relative z-10 font-bold text-sky-600 font-mono">SCAN TO PAY</span>
                          </div>
                          <p className="text-[7.5px] text-zinc-400 leading-normal">已自动绑定您的付款账单进行极速二维码算力汇兑，支持国内一键扫描安全扣减。</p>
                        </div>
                      ) : selectedPayMethod === 'wechat' ? (
                        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-850 text-center space-y-3">
                          <div className="w-24 h-24 mx-auto rounded-2xl bg-white p-3 flex items-center justify-center">
                            {wechatQrUrl ? (
                              <img src={wechatQrUrl} alt="WeChat Pay QR" className="h-full w-full object-contain" />
                            ) : (
                              <span className="text-[9px] font-bold text-[#059E3E]">生成微信支付二维码</span>
                            )}
                          </div>
                          <p className="text-[7.5px] text-zinc-400">请使用微信扫码二维码完成支付，支付后系统将自动回调并更新订单状态。</p>
                          <div className="space-y-1 text-left text-[8px] text-zinc-300">
                            <div>订单号：{currentPaymentOrderId || '尚未生成'}</div>
                            <div>当前状态：{currentPaymentStatus}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => refreshPaymentStatus(currentPaymentOrderId)}
                            className="inline-flex items-center justify-center rounded-full bg-[#059E3E] px-3 py-1 text-[8.5px] font-bold text-white"
                          >
                            刷新支付状态
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-850 text-center space-y-3">
                          <div className="w-24 h-24 mx-auto rounded-2xl bg-white p-3 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-[#003087]">PayPal</span>
                          </div>
                          <p className="text-[7.5px] text-zinc-400">点击下方按钮进入 PayPal 结账页面，完成支付后可返回本页面查看状态。</p>
                          {paypalApprovalLink ? (
                            <a
                              href={paypalApprovalLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block px-3 py-1 rounded-full bg-[#003087] text-white text-[8.5px] font-bold"
                            >
                              打开 PayPal 付款页面
                            </a>
                          ) : null}
                          <div className="space-y-1 text-left text-[8px] text-zinc-300">
                            <div>订单号：{currentPaymentOrderId || '尚未生成'}</div>
                            <div>当前状态：{currentPaymentStatus}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => refreshPaymentStatus(currentPaymentOrderId)}
                            className="inline-flex items-center justify-center rounded-full bg-[#003087] px-3 py-1 text-[8.5px] font-bold text-white"
                          >
                            刷新支付状态
                          </button>
                        </div>
                      )}

                      <div className="space-y-1 font-mono text-[8.5px] border-t border-dashed border-zinc-900 pt-2 text-zinc-400 leading-normal">
                        <div className="flex justify-between">
                          <span>小计 (Subtotal):</span>
                          <span>¥{(getCartTotal() + (couponApplied ? 12 : 0)).toFixed(2)}</span>
                        </div>
                        {couponApplied && (
                          <div className="flex justify-between text-emerald-400">
                            <span>红包抵扣 (Coupon):</span>
                            <span>-¥12.00</span>
                          </div>
                        )}
                        <div className="flex justify-between font-black text-white text-[9.5px] pt-1 border-t border-zinc-900/40">
                          <span>应付总计 (Payable Total):</span>
                          <span className="text-amber-500 font-extrabold text-[10.5px]">¥{getCartTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isPaying}
                      onClick={async () => {
                        setIsPaying(true);
                        const localTenantId = localStorage.getItem('preview_tenant_id') || '';
                        const localIndustryId = sanitizeIndustryId(localStorage.getItem('preview_industry_id') || '');
                        const newOrderId = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
                        const desc = customerCart.map(it => `${it.name} x ${it.quantity}`).join(', ');
                        const total = getCartTotal();

                        try {
                          if (selectedPayMethod === 'stripe') {
                            showToast('💳 Stripe 金流支付安全认证通道握手中...', 'info');
                            const orderToSave = {
                              id: newOrderId,
                              time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                              location: orderType === 'takeout' ? deliveryAddress : 'B08桌',
                              desc,
                              price: total,
                              status: 'paid',
                              type: orderType,
                              customerName: '联合智点买家',
                              phone: '13910245678',
                              tracking: '顺丰自动配货中'
                            };
                            const orderDocRef = doc(db, 'tenants', localTenantId, 'industries', localIndustryId, 'orders', newOrderId);
                            await setDoc(orderDocRef, orderToSave);
                            const billingLogId = `SAAS-BILL-${Date.now()}`;
                            const billingLogRef = doc(db, 'tenants', localTenantId, 'billing_logs', billingLogId);
                            await setDoc(billingLogRef, {
                              id: billingLogId,
                              orderId: newOrderId,
                              amount: total,
                              clientName: '联合智点买家',
                              time: new Date().toISOString().substring(0, 19).replace('T', ' '),
                              method: 'Stripe (Visa/Master)',
                              type: 'order_payment',
                              status: 'settled',
                              tokenConsumed: Math.floor(total * 8 + 15),
                              description: `完成店面消费订单付款扣减，商品: ${desc}`
                            });
                            showToast('🎉 Stripe 安全结算收银成功！您的代运营团队已极速跟进派单出货！', 'success');
                            setOrderSubmitted(true);
                            setCustomerCart([]);
                            setShowPaymentModal(false);
                            setActiveTab('success');
                          } else if (selectedPayMethod === 'alipay') {
                            showToast('📱 Alipay 二维码生成中，请准备扫码支付...', 'info');
                            const orderToSave = {
                              id: newOrderId,
                              time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                              location: orderType === 'takeout' ? deliveryAddress : 'B08桌',
                              desc,
                              price: total,
                              status: 'paid',
                              type: orderType,
                              customerName: '联合智点买家',
                              phone: '13910245678',
                              tracking: '顺丰自动配货中'
                            };
                            const orderDocRef = doc(db, 'tenants', localTenantId, 'industries', localIndustryId, 'orders', newOrderId);
                            await setDoc(orderDocRef, orderToSave);
                            const billingLogId = `SAAS-BILL-${Date.now()}`;
                            const billingLogRef = doc(db, 'tenants', localTenantId, 'billing_logs', billingLogId);
                            await setDoc(billingLogRef, {
                              id: billingLogId,
                              orderId: newOrderId,
                              amount: total,
                              clientName: '联合智点买家',
                              time: new Date().toISOString().substring(0, 19).replace('T', ' '),
                              method: 'Alipay',
                              type: 'order_payment',
                              status: 'settled',
                              tokenConsumed: Math.floor(total * 8 + 15),
                              description: `完成店面消费订单付款扣减，商品: ${desc}`
                            });
                            showToast('✅ Alipay 支付已确认，系统已完成订单发起。', 'success');
                            setOrderSubmitted(true);
                            setCustomerCart([]);
                            setShowPaymentModal(false);
                            setActiveTab('success');
                          } else if (selectedPayMethod === 'wechat') {
                            showToast('⌛ 微信扫码支付请求已发送，二维码生成中...', 'info');
                            const response = await fetch('/api/payments/wechat/checkout', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ orderId: newOrderId, amount: total })
                            });
                            const data = await response.json();
                            if (data.success) {
                              setWechatQrUrl(data.qrCode || '');
                              setCurrentPaymentOrderId(newOrderId);
                              setCurrentPaymentStatus('pending');
                              await fetch('/api/orders', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  orderId: newOrderId,
                                  userId: localTenantId,
                                  storeId: localIndustryId,
                                  merchantId: localTenantId,
                                  items: customerCart.map((it) => ({ productId: it.id, productName: it.name, price: it.price, quantity: it.quantity })),
                                  totalPrice: total,
                                  orderType,
                                  deliveryAddress
                                })
                              });
                              const orderToSave = {
                                id: newOrderId,
                                time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                location: orderType === 'takeout' ? deliveryAddress : 'B08桌',
                                desc,
                                price: total,
                                status: 'pending',
                                type: orderType,
                                customerName: '联合智点买家',
                                phone: '13910245678',
                                tracking: '等待微信支付完成'
                              };
                              const orderDocRef = doc(db, 'tenants', localTenantId, 'industries', localIndustryId, 'orders', newOrderId);
                              await setDoc(orderDocRef, orderToSave);
                              showToast('✅ 已生成微信支付二维码，请扫码完成支付。', 'success');
                            } else {
                              throw new Error(data.error || '微信支付二维码生成失败');
                            }
                          } else if (selectedPayMethod === 'paypal') {
                            showToast('⌛ PayPal 结账跳转准备中...', 'info');
                            const response = await fetch('/api/payments/paypal/checkout', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                orderId: newOrderId,
                                amount: total,
                                items: customerCart.map((it) => ({ name: it.name, quantity: it.quantity, price: it.price }))
                              })
                            });
                            const data = await response.json();
                            if (data.success) {
                              setPaypalApprovalLink(data.approvalLink || '');
                              setCurrentPaymentOrderId(newOrderId);
                              setCurrentPaymentStatus('pending');
                              await fetch('/api/orders', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  orderId: newOrderId,
                                  userId: localTenantId,
                                  storeId: localIndustryId,
                                  merchantId: localTenantId,
                                  items: customerCart.map((it) => ({ productId: it.id, productName: it.name, price: it.price, quantity: it.quantity })),
                                  totalPrice: total,
                                  orderType,
                                  deliveryAddress
                                })
                              });
                              const orderToSave = {
                                id: newOrderId,
                                time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                location: orderType === 'takeout' ? deliveryAddress : 'B08桌',
                                desc,
                                price: total,
                                status: 'pending',
                                type: orderType,
                                customerName: '联合智点买家',
                                phone: '13910245678',
                                tracking: '等待 PayPal 支付完成'
                              };
                              const orderDocRef = doc(db, 'tenants', localTenantId, 'industries', localIndustryId, 'orders', newOrderId);
                              await setDoc(orderDocRef, orderToSave);
                              if (data.approvalLink) {
                                window.open(data.approvalLink, '_blank');
                              }
                              showToast('✅ PayPal 结账页面已打开，请完成支付。', 'success');
                            } else {
                              throw new Error(data.error || 'PayPal checkout failed');
                            }
                          }
                          setCustomerCart(selectedPayMethod === 'stripe' || selectedPayMethod === 'alipay' ? [] : customerCart);
                          setShowPaymentModal(selectedPayMethod === 'stripe' || selectedPayMethod === 'alipay' ? false : true);
                          setActiveTab(selectedPayMethod === 'stripe' || selectedPayMethod === 'alipay' ? 'success' : 'cart');
                          setIsPaying(false);
                        } catch (err: any) {
                          console.error('Payment secure backend sync failed:', err);
                          showToast('支付结算通道出现未决异常: ' + err.message, 'error');
                          setIsPaying(false);
                        }
                      }}
                      className={`w-full py-2 rounded-lg font-bold text-xs shadow-md uppercase transition-all text-center flex items-center justify-center space-x-1 ${
                        isPaying
                          ? 'bg-[#635BFF]/30 text-[#635BFF] cursor-not-allowed'
                          : 'bg-[#635BFF] hover:bg-[#4F46E5] text-white cursor-pointer hover:scale-[1.01]'
                      }`}
                    >
                      {isPaying ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                          <span>正在解算扣款...</span>
                        </>
                      ) : (
                        <span>确认安全代付 ¥{getCartTotal().toFixed(2)}</span>
                      )}
                    </button>
                  </div>
                )}

                {/* Simulated Smartphone bottom navigation bar */}
                <div className="absolute bottom-0 inset-x-0 h-11 bg-zinc-950 border-t border-zinc-850 px-3 flex justify-around items-center text-zinc-400 z-30 select-none">
                  {[
                    { id: 'home', emoji: '🏠', label: '首页' },
                    { id: 'menu', emoji: '☕', label: '菜单' },
                    { id: 'cart', emoji: '🛒', label: '购物车', badg: customerCart.reduce((s, it) => s + it.quantity, 0) }
                  ].map((tb) => (
                    <button 
                      key={tb.id} 
                      onClick={() => setActiveTab(tb.id as any)}
                      className={`flex flex-col items-center justify-center p-1 w-11 transition-colors relative cursor-pointer ${
                        activeTab === tb.id ? 'text-sky-400 font-extrabold' : 'hover:text-zinc-250'
                      }`}
                    >
                      <span className="text-xs shrink-0">{tb.emoji}</span>
                      <span className="text-[7px] transform scale-90 whitespace-nowrap leading-none mt-0.5">{tb.label}</span>
                      {tb.badg && tb.badg > 0 ? (
                        <span className="absolute top-1 right-2.5 bg-red-500 text-white text-[6.5px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center scale-90">{tb.badg}</span>
                      ) : null}
                    </button>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Specification Choice Popup Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl w-full max-w-[280px] text-left space-y-3.5 shadow-2xl">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{selectedProduct.image}</span>
                <h4 className="font-extrabold text-[12px]">{selectedProduct.name}</h4>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-zinc-450 hover:text-white font-bold text-xs">✕</button>
            </div>
            
            <p className="text-[8.5px] text-zinc-400 leading-normal">{selectedProduct.desc}</p>
            
            <div className="space-y-1.5">
              <span className="text-[8.5px] font-bold text-zinc-450 block uppercase">🌡️ 选择规格</span>
              <div className="grid grid-cols-2 gap-1.5 text-center font-bold text-[8.5px]">
                {getSpecsForProduct(selectedProduct, industryId).map((opt) => (
                  <button 
                    key={opt}
                    onClick={() => setSelectedSpecs(opt)}
                    className={`py-1.5 px-1 rounded border text-[8px] truncate transition-all duration-100 ${
                      selectedSpecs === opt ? 'bg-emerald-600/10 text-sky-400 border-sky-500' : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
              <span className="text-[12px] font-black text-amber-700">¥{selectedProduct.price}</span>
              <button 
                onClick={() => {
                  addToCart(selectedProduct, selectedSpecs);
                  setSelectedProduct(null);
                  showToast(`已成功选择【${selectedProduct.name} - ${selectedSpecs}】并加入购物车！`, 'success');
                }}
                className="px-4 py-1.5 bg-[#1D9BF0] hover:bg-emerald-600 font-bold text-[9px] text-white rounded-lg shadow-md"
              >
                确认并选好 🤝
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 24-HOUR INTERACTIVE AI SUPPORT CHATBAR COGNITIVE BOX */}
      <div className="fixed bottom-6 right-6 z-50">
        {isChatOpen ? (
          <div className="w-80 h-[400px] bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp font-sans">
            {/* Chat header */}
            <div className={`p-3 border-b border-zinc-800 flex justify-between items-center ${currentStyle.bg === 'bg-neutral-950' ? 'bg-zinc-900' : 'bg-black/40'}`}>
              <div className="flex items-center space-x-2">
                <span className="text-xl shrink-0">{getSupportAgent(industryId).emoji}</span>
                <div className="text-left leading-none">
                  <h4 className="font-extrabold text-[11px] text-white flex items-center space-x-1">
                    <span>{getSupportAgent(industryId).name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  </h4>
                  <p className="text-[7.5px] text-zinc-400 mt-0.5">{getSupportAgent(industryId).desc}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)} 
                className="text-zinc-400 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Chat messages stream */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 flex flex-col bg-[#0b0b0d]">
              {chatMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <p className={`p-2 rounded-xl text-[9px] leading-relaxed text-left whitespace-pre-wrap ${
                    msg.sender === 'user' 
                      ? 'bg-[#1D9BF0] text-white rounded-br-none' 
                      : 'bg-zinc-900 text-zinc-200 border border-zinc-800/80 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </p>
                  <span className="text-[7px] text-zinc-500 mt-1">{msg.timestamp}</span>
                </div>
              ))}
              
              {isTyping && (
                <div className="self-start flex items-center space-x-1 p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400">
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat action input */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(userMsgInput);
              }}
              className="p-2 border-t border-zinc-800 bg-zinc-950 flex items-center space-x-1.5"
            >
              <input
                type="text"
                placeholder="向 AI 客服询问尺码、物流或推荐..."
                value={userMsgInput}
                onChange={(e) => setUserMsgInput(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-[#141416] text-[9.5px] text-white border border-zinc-800 focus:outline-none focus:border-[#1D9BF0] rounded-xl font-sans"
              />
              <button 
                type="submit" 
                className="p-1.5 rounded-lg bg-[#1D9BF0] hover:bg-sky-500 text-white transition-all shrink-0 cursor-pointer"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        ) : (
          <button 
            type="button" 
            onClick={() => setIsChatOpen(true)}
            className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center text-white cursor-pointer hover:scale-110 active:scale-95 transition-all duration-150 animate-bounce relative ${currentStyle.primaryBtn}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#1D9BF0]"></span>
            </span>
          </button>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[9999] bg-zinc-950/95 text-white backdrop-blur border border-zinc-800 rounded-lg px-4 py-2.5 flex items-center space-x-2 shadow-2xl max-w-xs text-center justify-center animate-fade-in">
          {toast.type === 'success' ? (
            <span className="text-emerald-500 font-bold">✔</span>
          ) : toast.type === 'error' ? (
            <span className="text-red-500 font-bold">✖</span>
          ) : (
            <span className="text-[#1D9BF0] font-bold">ℹ</span>
          )}
          <span className="text-[10px] font-sans font-medium text-zinc-100">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
