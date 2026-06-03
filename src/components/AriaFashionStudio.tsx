import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Zap, RefreshCw, Smartphone, Palette, Scissors, Sliders, Cpu, 
  Layers, CheckCircle, Flame, Server, AlertCircle, Building2, TrendingUp,
  Package, Share2, ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip 
} from 'recharts';
import { OperatingStrategy } from '../types';

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

interface AriaFashionStudioProps {
  isAutoRunning: boolean;
  setIsAutoRunning: (v: boolean) => void;
  autoStep: number;
  setAutoStep: (v: number) => void;
  setLogs: any;
  setTestLog: (v: string) => void;
  setSales: any;
  setOrders: any;
  apiProvider: string;
  strategy: OperatingStrategy;
  isAriaGenerating: boolean;
  setIsAriaGenerating: (v: boolean) => void;
  ariaGenerationResult: string | null;
  setAriaGenerationResult: (v: string | null) => void;
  ariaTab: 'trend' | 'design' | 'prototype' | 'catalog' | 'detail' | 'brand';
  setAriaTab: (v: any) => void;
  dbProducts?: any[];
  onUpdateProducts?: () => void;
}

export default function AriaFashionStudio({
  isAutoRunning,
  setIsAutoRunning,
  autoStep,
  setAutoStep,
  setLogs,
  setTestLog,
  setSales,
  setOrders,
  apiProvider,
  strategy,
  isAriaGenerating,
  setIsAriaGenerating,
  ariaGenerationResult,
  setAriaGenerationResult,
  ariaTab,
  setAriaTab,
  dbProducts = [],
  onUpdateProducts = () => {}
}: AriaFashionStudioProps) {

  // --- 1. Trend Analysis State ---
  const [trendData, setTrendData] = useState({
    title: "2026年欧洲及小红书秋冬女装趋势报告",
    colors: [
      { name: "Sage Olive (防风鼠尾草绿)", hex: "#5E6554", score: 92, desc: "回归自然，低饱和度草本中性灰，带来秋冬静谧与高级质感" },
      { name: "Cashmere Camel (高山暖驼色)", hex: "#B99B7E", score: 85, desc: "温暖软糯，象征100%纯山羊绒，拉近都市与自然的距离" },
      { name: "Rustic Chestnut (旷野板栗棕)", hex: "#5A3D31", score: 88, desc: "复古深邃的泥土原野棕，最保值防跌的重度奢华保暖底色" },
      { name: "Creamy Silk (丝绒燕麦乳白)", hex: "#EAE3D2", score: 76, desc: "高智感去尘燕麦白，代替沉闷的生石灰白，温婉而清高" },
      { name: "Vintage Amber (温暖复古琥珀黄)", hex: "#B57C4B", score: 62, desc: "带有颗粒划痕年代感的温暖亮色，为冬装增加落叶温度" },
      { name: "Midnight Navy (午夜深空冷蓝)", hex: "#2B323F", score: 70, desc: "经典高贵理性的底衬，完全替代沉重纯黑，更加灵动抗风" }
    ],
    fabrics: [
      { name: "原生态山羊驼长毛呢 (Organic Alpaca Wool)", percent: 45, color: "#6366F1", desc: "保留天然拉毛丝缕，不经过度酸洗，光泽丰盈感极高" },
      { name: "极限重磅华达呢 (240D Block Gabardine)", percent: 35, color: "#10B981", desc: "高密防雨斜纹经纬交织，拒水抗风性达专业御寒标准" },
      { name: "哑光微皱尼龙 (Matte Crinkled Recycled Twill)", percent: 20, color: "#F59E0B", desc: "100%可循环聚酯纤维，带有纳米防水薄膜，抗皱且有微反光骨感" }
    ],
    silhouettes: [
      { name: "落肩解构斗篷收腰裁制型 (Deconstructed Cape Trench)", desc: "平肩线+大胸围，背部伞褶随风微鼓，在利落与散慢间精算平衡" },
      { name: "不对称多向自调节褶皱 (Asymmetric Adjustable Cinch)", desc: "内置隐形斜向抽绳，调节即可自如在极简茧身与收腰X身中切换" }
    ],
    brands: "Lemaire (法式优雅), Toteme (北欧简约), The Row (静奢高智), Jil Sander (几何秩序)",
    competitors: "Massimo Dutti (精打细造系列), COS, Arket (重磅面料线), Zara Studio"
  });

  // --- 2. Style Design State ---
  const [designNotes, setDesignNotes] = useState("本风衣系列专注于『知识分子风』与『户外机能古典主义』的融合。用天然、粗粝、厚重的面料，衬托高精度拉细玫瑰金五金件，诠释松弛而果断的都市风骨。");
  const [designItems, setDesignItems] = useState([
    {
      id: 1,
      title: "「法式风骨」侧肩解构重华达呢风衣",
      image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600",
      sketch: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=600",
      desc: "大翻领披肩肩罩，一衣多穿可分拆。收紧腰侧极细皮绳时呈优雅漏斗裙摆，舒张时则是飘逸的茧型都市防守大衣。",
      fabric: "70% 美利奴防缩华达呢, 30% 抗静电滑糯内衬; 定制抛光双色牛角扣"
    },
    {
      id: 2,
      title: "「智性漫步」无领斜门襟镶环保牛皮风衣",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600",
      sketch: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&q=80&w=600",
      desc: "整体无领圆弧裁片，展现脖颈天鹅线。侧向极细隐形拉链闭合，并在门襟挂面饰有高品质意大利环保小羊皮。",
      fabric: "重磅800G美利奴海驼绒 (面料厚重温存); 意大利无铅原草鞣皮饰条"
    },
    {
      id: 3,
      title: "「旷野行者」连帽抽绳阻光套头短风衣",
      image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600",
      sketch: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600",
      desc: "连帽微带弧度，下摆与袖口带魔术调整扣。多向插袋设计，方便容纳日常小物件，满足高机能实用主义出行偏好。",
      fabric: "三防特种抗磨双面华达呢 (防强泼水, 防风, 阻撕裂); 抛光拉丝哑光五金"
    },
    {
      id: 4,
      title: "「落拓茧居」宽袖褶大轮廓双面羊毛大衣",
      image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600",
      sketch: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600",
      desc: "插肩袖剪裁打破生硬感，背部伞褶在运动时营造如风流体。不设传统扣件，只配一根加宽纯羊毛厚软宽腰带。",
      fabric: "100% 澳大利亚进口重磅美利奴极细绵羊毛 (手工暗缝缝边)"
    }
  ]);

  // --- 3. 3D Prototype State ---
  const [selectedProtoId, setSelectedProtoId] = useState(1);
  const [active3DAngle, setActive3DAngle] = useState<'front' | 'back' | 'side' | 'model'>('front');
  const [prototypeClothState, setPrototypeClothState] = useState({
    polygons: "185,420 Quad-Meshes (柔性仿真布粒子模拟已锚定)",
    tension: "36.4 N/m (极高抗风垂坠度骨感测试中)",
    texture: "100% 紧致阻滑精梭呢 (220/2S 高级精纺华达呢)",
    shrinkage: "≤0.5% (蒸汽后整干洗预缩率)"
  });

  // --- 4. Catalog Shooting State ---
  const [activeCatalogBg, setActiveCatalogBg] = useState<'studio' | 'paris' | 'nordic' | 'sand'>('studio');

  // --- 5. Detail Page State ---
  const [detailSellingPoints, setDetailSellingPoints] = useState([
    "✅ 澳大利亚进口 82% 塔斯马尼亚绵羊呢：抗风保暖，骨感硬挺，穿出立挺体面",
    "✅ 八档自调节牛角针扣拉绊：束腰侧收紧呈漏斗优雅裙摆，张开呈落拓极简茧轮廓",
    "✅ 拆卸式防雨大肩罩披风：兼顾利落通勤与慵懒假日漫游，一衣多穿经典保值",
    "✅ 背幅雨伞褶+开衩：行走间流线若隐若现，空气回流设计避免闷热"
  ]);

  // --- 6. Brand Visual Design State ---
  const [brandVisualData, setBrandVisualData] = useState({
    name: "SÉRIEUX • M O D A (瑟瑞阁时装)",
    vibe: "落日漫步、知识分子冷感、静奢与实用的浪漫折衷主义。强调整体大重度垂感、以及高定不规则拼接细节，整体色彩偏向天然植物 and 沙尘，内敛而不附势。",
    logoText: "S É R I E U X   A R I A",
    logoSubtitle: "MODERN COUTEURE LABORATORY • LONDON DESIGN UNIT",
    palette: [
      { name: "Sable Sand (流沙矿岩驼)", hex: "#C8B59E" },
      { name: "Sage Grassland (风吟鼠尾灰绿)", hex: "#6A715E" },
      { name: "Raw Obsidian (曜石冷寂黑)", hex: "#1A1A1C" },
      { name: "Écru Flax (原初温润麻麦色)", hex: "#ECE6D9" }
    ]
  });

  const [lastDesignedItem, setLastDesignedItem] = useState<any>(null);

  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isFullscreenProto, setIsFullscreenProto] = useState<boolean>(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([1]);

  const toggleFavorite = (id: number) => {
    if (favoriteIds.includes(id)) {
      setFavoriteIds(favoriteIds.filter(fid => fid !== id));
      setTestLog(`⭐️ 已从专属灵感库移除：方案 ${id}`);
    } else {
      setFavoriteIds([...favoriteIds, id]);
      setTestLog(`⭐️ 成功收藏方案 ${id} 至您的专属灵感素材库！`);
    }
  };

  // --- Agent Collaboration Pipeline (Agent 协同链路) States & Method ---
  const [isPipelineActive, setIsPipelineActive] = useState<boolean>(true);
  const [pipelineStep, setPipelineStep] = useState<number>(4); // Default to synced
  const [pipelineProgress, setPipelineProgress] = useState<number>(100);
  const [pipelineState, setPipelineState] = useState({
    activeStyleName: "「静奢智影」解构腰褶羊毛风衣",
    activePrice: 1599,
    activeFabric: "70% 美利奴防缩华达呢, 30% 丝糯抗静电挂里",
    bartonCost: 520,
    bartonStock: 120,
    bartonMargin: "207%",
    bartonWarehouse: "上海防潮智能 1 号仓",
    novaHeadline: "🏷️【高智感天花板】今天在冷风里漫步，Lemaire同款高级感拉满了！",
    novaTags: ["静奢风", "知识分子穿搭", "美利奴羊毛衣", "SÉRIEUX高定"],
    novaCopy: "高级感不靠堆砌，这条风衣完美的落肩解构加上双面美利奴羊毛呢，让人在通勤和冬日漫步之间松弛却有着坚定的气场。今日新品限定极轻批试发！"
  });

  const runAgentCollaborationPipeline = async (customStyle?: any) => {
    setIsPipelineActive(true);
    setPipelineStep(1);
    setPipelineProgress(15);
    
    const styleName = customStyle?.title || pipelineState.activeStyleName;
    const price = customStyle?.price || pipelineState.activePrice;
    const fabric = customStyle?.fabric || pipelineState.activeFabric;

    setTestLog(`⚡ [多智能协同] Aria 正在计算及画图「${styleName}」的服装细节与工艺要素...`);
    await new Promise(resolve => setTimeout(resolve, 800));
    setPipelineStep(2);
    setPipelineProgress(50);

    const cost = Math.round(price * 0.32 + 50);
    const stock = Math.round((250000 % price) / 10) + 40;
    const margin = Math.round(((price - cost) / cost) * 100);

    setPipelineState(prev => ({
      ...prev,
      activeStyleName: styleName,
      activePrice: price,
      activeFabric: fabric,
      bartonCost: cost,
      bartonStock: stock,
      bartonMargin: `${margin}%`,
      bartonWarehouse: "深圳宝安 3 号冷鲜防潮仓"
    }));

    setTestLog(`📈 [多智能协同] Barton 已自动接收 Aria 时装图，正在计算配货比、起发件数与成本溢价率...`);
    await new Promise(resolve => setTimeout(resolve, 800));
    setPipelineStep(3);
    setPipelineProgress(85);

    const tag1 = styleName.slice(0, 4).replace(/「|」/g, '') || "静奢风";
    const tag2 = fabric.split(" ")[0].slice(0, 4) || "美利奴";
    
    setPipelineState(prev => ({
      ...prev,
      novaHeadline: `🏷️【高智感绝美单物】极力推荐这件「${styleName}」，质感强得不像话！`,
      novaTags: [tag1, tag2, "冬季新款", "高智穿搭"],
      novaCopy: `极佳的高定！这款落肩外套保留了 Aria 创意研发最得意的伞褶阻尼。面料大底含 ${fabric}，轮廓自然蓬松，任何人都能轻松穿出秀场名模既视感。Barton 精算定价 ¥${price}，品质极有保障！`
    }));

    setTestLog(`✨ [多智能协同] Nova 已获取 Barton 美学定价核销单，极速生成高点击营销文案与小红书爆款排版...`);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setPipelineStep(4);
    setPipelineProgress(100);
    setTestLog(`🏁 [协同告捷] Aria ➔ Barton ➔ Nova 闭环链路全量跑通！`);

    const actionTime = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setLogs((prev: any) => [
      ...prev,
      {
        id: 'pipeline-success-' + Date.now(),
        timestamp: actionTime,
        sender: 'AI 多智体协同流水线',
        emoji: '🔗',
        message: `🏁 [多智联动] 【Aria (设计总监) ➔ Barton (商品经理) ➔ Nova (营销经理)】三端自适应协同跑通！服装方案已交接！`,
        type: 'success'
      }
    ]);
  };

  // --- Multi-Agent (Professional AI Boardroom) Group Review States ---
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [reviewStepMsg, setReviewStepMsg] = useState<string>("");
  const [reviewScore, setReviewScore] = useState<number>(91);
  const [reviewsOutput, setReviewsOutput] = useState<any[]>([]);
  const [activeReviewTab, setActiveReviewTab] = useState<'luka' | 'clara' | 'marcus' | 'serene'>('luka');

  const triggerMultiAgentReview = async () => {
    setIsReviewing(true);
    setReviewStepMsg("📊正在呼召 [Lukas - 首席纺织面料官] 研判生态重整度与耐寒纱线捻度...");
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setReviewStepMsg("📐正在召启 [Clara - 3D版型工艺师] 模拟重力垂坠粒子阻尼与空气回流缝合线...");
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setReviewStepMsg("📈正在唤起 [Marcus - 商业拓展官] 拟定价格区间、测算溢价与线上 CTR 社交爆款率...");
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setReviewStepMsg("🎨正在邀约 [Serene - 品牌美学监管官] 定位色卡搭配比例与高奢留白直方图...");
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setReviewStepMsg("👑正在召集 [Aria - 创意总监] 汇编终审决策意见并签发上推报告...");
    await new Promise(resolve => setTimeout(resolve, 600));

    // Dynamic high-fidelity joint review outputs customized based on current active tab and selected outfit
    const currentStyleName = designItems[selectedProtoId - 1]?.title || "SANS 高定秋冬系列款式";
    
    let simulatedReviews: any[] = [];
    let calculatedScore = 85 + Math.floor((selectedProtoId * 3) + (ariaTab.length * 1.5)) % 15;
    if (calculatedScore > 99) calculatedScore = 98;

    switch (ariaTab) {
      case 'trend':
        simulatedReviews = [
          {
            agent: 'Lukas',
            role: '首席纺织面料官 / Lead Textile Forecaster',
            avatar: '🧶',
            rating: 'EXCELLENT',
            metric: '可降解度: 94.5%',
            bgGradient: 'from-blue-500/10 to-indigo-500/10',
            borderCol: 'border-blue-500/20',
            textCol: 'text-blue-400',
            comment: `针对当前拟定的【防风鼠尾草绿】色彩大盘与【原生态山羊驼长毛呢】质感，符合高端回归自然倾向。我建议将经纱定在 220/2S 高级合规标准，以达到静奢高智的颗粒厚重骨感，预计成衣生态降解级别达欧盟一类。`
          },
          {
            agent: 'Clara',
            role: '3D版型工艺师 / 3D Structural Engineer',
            avatar: '📐',
            rating: 'RECOMMENDED',
            metric: '重力垂坠因子: 1.25',
            bgGradient: 'from-emerald-500/10 to-teal-500/10',
            borderCol: 'border-emerald-500/20',
            textCol: 'text-emerald-400',
            comment: `在 18k 重力悬锁粒子仿真下，高密重磅华达呢表现出优秀的御寒遮敝性骨感。但需要注意：[落肩解构斗篷收腰型] 的背部多重伞褶在 65.2 N/m 受力下对扣眼强度有中度扯拽 risk，锁眼周圈需增加内衬无纺加固纸板。`
          },
          {
            agent: 'Marcus',
            role: '商业拓展官 / E-comm Growth Manager',
            avatar: '📈',
            rating: 'OUTSTANDING',
            metric: '企划测销转换比: +21%',
            bgGradient: 'from-amber-500/10 to-orange-500/10',
            borderCol: 'border-amber-500/20',
            textCol: 'text-amber-400',
            comment: `小红书(RED)与抖音秋冬穿搭大盘高频热词检索矩阵显示：'知识分子漫步风衣' 检索趋势环比暴增 45%。建议主推【高山暖驼色】，专柜定价建议锁定 ¥2,980-¥3,480。配合 24 小时全能智能店群自动分销铺开大货！`
          },
          {
            agent: 'Serene',
            role: '品牌美学监管官 / Brand Vibe Overseer',
            avatar: '🎨',
            rating: 'PERFECT ALIGNED',
            metric: '视觉调性符合度: 96%',
            bgGradient: 'from-purple-500/10 to-pink-500/10',
            borderCol: 'border-purple-500/20',
            textCol: 'text-pink-400',
            comment: `Aria 规划的色调与我们 SÉRIEUX MODA AW2026 的 [流沙矿岩驼] 与 [风吟鼠尾灰绿] 核心美学相差无几。这组色彩呈现出优雅、内敛的折衷浪漫质感。在电商和视觉广告中应采用 60% 画面大留白的高阶极简构图。`
          }
        ];
        break;
      case 'design':
        simulatedReviews = [
          {
            agent: 'Lukas',
            role: '首席纺织面料官 / Lead Textile Forecaster',
            avatar: '🧶',
            rating: 'COMPLIANT',
            metric: '纯天然纤维含量: 82%',
            bgGradient: 'from-blue-500/10 to-indigo-500/10',
            borderCol: 'border-blue-500/20',
            textCol: 'text-blue-400',
            comment: `对当前的主力设计款【${currentStyleName}】的面辅料组合赞叹，82% 塔斯马尼亚纯羊毛搭配 18% 抗静电天丝内挂面十分得宜。注意：牛角扣锁针距离需拉开 0.5mm，手工毛缘缝制工艺需由专属工坊采用定制排骨针。`
          },
          {
            agent: 'Clara',
            role: '3D版型工艺师 / 3D Structural Engineer',
            avatar: '📐',
            rating: 'RECOMMENDED',
            metric: '打样对位精度: S级',
            bgGradient: 'from-emerald-500/10 to-teal-500/10',
            borderCol: 'border-emerald-500/20',
            textCol: 'text-emerald-400',
            comment: `本款的无袖或大落肩割片裁短非常精算，完美规避了溜肩短板。双侧内置拉绊腰绳在重吊模拟器上的收腰阻尼正好，但由于双面绵羊毛厚度超重，建议腰部插袋定位上移 1.5 厘米，以便行走时手部姿势最佳。`
          },
          {
            agent: 'Marcus',
            role: '商业拓展官 / E-comm Growth Manager',
            avatar: '📈',
            rating: 'OUTSTANDING',
            metric: '首批测销量: 80件 (极佳)',
            bgGradient: 'from-amber-500/10 to-orange-500/10',
            borderCol: 'border-amber-500/20',
            textCol: 'text-amber-400',
            comment: `【${currentStyleName}】的『一衣多穿可分拆披风大肩罩』完美击中了当下‘通勤与闲漫二合一’新消费诉求。这一功能点是黄金爆款核心支撑。第一批打版实测锁定线下 20 家核心直营买手店作为轻资产柔性测试，溢价空间达 3.2x！`
          },
          {
            agent: 'Serene',
            role: '品牌美学监管官 / Brand Vibe Overseer',
            avatar: '🎨',
            rating: 'PERFECT ALIGNED',
            metric: '格调匹配度: 98%',
            bgGradient: 'from-purple-500/10 to-pink-500/10',
            borderCol: 'border-purple-500/20',
            textCol: 'text-pink-400',
            comment: `此手绘设计搭配古典五金细节，展现出浓郁的高端高智感。包装标签部分应指定使用 250克 重质环保米黄牛皮纸版，吊牌不印大logo，用极其素雅的压钢印，突显内敛高级感。`
          }
        ];
        break;
      case 'prototype':
        simulatedReviews = [
          {
            agent: 'Lukas',
            role: '首席纺织面料官 / Lead Textile Forecaster',
            avatar: '🧶',
            rating: 'PASSED',
            metric: '纱支纱线合规: 120/2S级',
            bgGradient: 'from-blue-500/10 to-indigo-500/10',
            borderCol: 'border-blue-500/20',
            textCol: 'text-blue-400',
            comment: `3D 模型当前投料参数已同步后台面料卡：100% 澳大利亚纯羊毛精梭，热阻高达 1.83 CLO。这意味着该厚软度在 -5℃ 环境下能保持出色的锁温锁风指标，是一笔非常扎实的大货物理性本。`
          },
          {
            agent: 'Clara',
            role: '3D版型工艺师 / 3D Structural Engineer',
            avatar: '📐',
            rating: 'PERFECT_FIT',
            metric: '网格平滑碰撞数: 100K+',
            bgGradient: 'from-emerald-500/10 to-teal-500/10',
            borderCol: 'border-emerald-500/20',
            textCol: 'text-emerald-400',
            comment: `经过双轴拉伸重力仿真，【${currentStyleName}】的后道蒸汽微皱后整整缩预收率被死死锁止在 ≤0.5%。领口围度在四种体态试穿时表现平衡，没有前俯或后仰的衣长失衡。完美版型！`
          },
          {
            agent: 'Marcus',
            role: '商业拓展官 / E-comm Growth Manager',
            avatar: '📈',
            rating: 'OUTSTANDING',
            metric: '预期溢价空间: 3.5x',
            bgGradient: 'from-amber-500/10 to-orange-500/10',
            borderCol: 'border-amber-500/20',
            textCol: 'text-amber-400',
            comment: `物理样衣打样参数已被数字孪生。考虑到大衣自重在 1.6kg 左右，极具奢华厚重分量感，强烈推荐进入大货生产。建议在店面内增加 3D 试衣互动，激发消费者自传播。`
          },
          {
            agent: 'Serene',
            role: '品牌美学监管官 / Brand Vibe Overseer',
            avatar: '🎨',
            rating: 'PASS',
            metric: '色彩显现度: S P3标准',
            bgGradient: 'from-purple-500/10 to-pink-500/10',
            borderCol: 'border-purple-500/20',
            textCol: 'text-pink-400',
            comment: `三维质感渲染非常突出。建议我们在数字大片拍摄中，对呢子面料的长绒天然油脂感进行强边缘高光侧光烘托，使面料的‘微光骨感’在照片中纤毫毕现，符合贵重轻奢。`
          }
        ];
        break;
      case 'catalog':
        simulatedReviews = [
          {
            agent: 'Lukas',
            role: '首席纺织面料官 / Lead Textile Forecaster',
            avatar: '🧶',
            rating: 'APPROVED',
            metric: '光质反射拟合: 98.7%',
            bgGradient: 'from-blue-500/10 to-indigo-500/10',
            borderCol: 'border-blue-500/20',
            textCol: 'text-blue-400',
            comment: `这组在【巴黎玛黑】古典背景和【戈壁大漠】下的光影融合极佳，呢料毛鳞片的天然光泽吸收了逆光，展现出极其纯粹的手工质感，无任何人工智能生硬拼接瑕疵，光线直方图匹配通过。`
          },
          {
            agent: 'Clara',
            role: '3D版型工艺师 / 3D Structural Engineer',
            avatar: '📐',
            rating: 'APPROVED',
            metric: '多角融合精细度: A+',
            bgGradient: 'from-emerald-500/10 to-teal-500/10',
            borderCol: 'border-emerald-500/20',
            textCol: 'text-emerald-400',
            comment: `模特动态姿态下未见衣角拉崩或袖窿处穿模，流体力学风效仿真在行走状态下伞褶飘动力学极为自然，高阶时装画册的构图渲染十分稳定。`
          },
          {
            agent: 'Marcus',
            role: '商业拓展官 / E-comm Growth Manager',
            avatar: '📈',
            rating: 'OUTSTANDING',
            metric: '线上点击CTR优估: S级',
            bgGradient: 'from-amber-500/10 to-orange-500/10',
            borderCol: 'border-amber-500/20',
            textCol: 'text-amber-400',
            comment: `由于【玛黑街拍】和【水泥极简 studios】极度吻合目标消费群自悦漫游和‘天坛冷感高智’社交搜索定位。主图一旦发布，预估能使线上广告 CTR 提高近 32%！建议直接锁定 1 号图用做首页。`
          },
          {
            agent: 'Serene',
            role: '品牌美学监管官 / Brand Vibe Overseer',
            avatar: '🎨',
            rating: 'PERFECT',
            metric: '直方图留白比: 62%',
            bgGradient: 'from-purple-500/10 to-pink-500/10',
            borderCol: 'border-purple-500/20',
            textCol: 'text-pink-400',
            comment: `完全达到了伦敦和巴黎高级秀款成衣画册调性，色温保持在 5100k 偏干凉。建议品牌主页采取无字首焦展示，大作高雅留白。`
          }
        ];
        break;
      case 'detail':
        simulatedReviews = [
          {
            agent: 'Lukas',
            role: '首席纺织面料官 / Lead Textile Forecaster',
            avatar: '🧶',
            rating: 'VERIFIED',
            metric: '溯源标签校验: PASS',
            bgGradient: 'from-blue-500/10 to-indigo-500/10',
            borderCol: 'border-blue-500/20',
            textCol: 'text-blue-400',
            comment: `关于‘TASMANIA精梭 82% 美利奴呢’的品质背书合规卡已成功对接到供应链，全球原产地绿能碳中和溯源二维码已自动附加到吊牌附页，符合中高端买家重视。`
          },
          {
            agent: 'Clara',
            role: '3D版型工艺师 / 3D Structural Engineer',
            avatar: '📐',
            rating: 'RECOMMENDED',
            metric: '尺寸表拟合率: 95.8%',
            bgGradient: 'from-emerald-500/10 to-teal-500/10',
            borderCol: 'border-emerald-500/20',
            textCol: 'text-emerald-400',
            comment: `本款落肩风衣胸围加宽为 116-124cm，偏大剪裁。尺码说明中关于‘上身若有天然垂性，建议偏小半码选择高智漏斗姿，按原码追求洒脱慵懒茧廓形’的文案十分精巧合理，有效规避不合体率。`
          },
          {
            agent: 'Marcus',
            role: '商业拓展官 / E-comm Growth Manager',
            avatar: '📈',
            rating: 'EXCELLENT',
            metric: '新决策转化预估: +18.4%',
            bgGradient: 'from-amber-500/10 to-orange-500/10',
            borderCol: 'border-amber-500/20',
            textCol: 'text-amber-400',
            comment: `在详情顶部放置黄金卖点组合卡：第一条即强调『澳大利亚美利奴 82% 厚挺呢且抗寒』并提炼三条快穿组合，切中都市通勤女高智穿搭偏好，预估转化指数能拉到业界一流水准。`
          },
          {
            agent: 'Serene',
            role: '品牌美学监管官 / Brand Vibe Overseer',
            avatar: '🎨',
            rating: 'PASS',
            metric: '文字留白律: 完美对齐',
            bgGradient: 'from-purple-500/10 to-pink-500/10',
            borderCol: 'border-purple-500/20',
            textCol: 'text-pink-400',
            comment: `黄金卖点描述剔除了廉价堆彻感，中性高情商、精炼客观，极富知音漫步意味。文字排版对齐优雅，主KV美学符合旗舰店移动瀑布流标准。`
          }
        ];
        break;
      default: // brand
        simulatedReviews = [
          {
            agent: 'Lukas',
            role: '首席纺织面料官 / Lead Textile Forecaster',
            avatar: '🧶',
            rating: 'APPROVED',
            metric: '环保整染：最高一等',
            bgGradient: 'from-blue-500/10 to-indigo-500/10',
            borderCol: 'border-blue-500/20',
            textCol: 'text-blue-400',
            comment: `瑟瑞阁高定色卡中的“Sage Grassland (风吟鼠尾灰绿)”和“Sable Sand”配比采用冷整天然矿植泥料，化学固色剂零排放，已通过欧盟 REACH 合规检测。`
          },
          {
            agent: 'Clara',
            role: '3D版型工艺师 / 3D Structural Engineer',
            avatar: '📐',
            rating: 'APPROVED',
            metric: '成衣包装承载: S级',
            bgGradient: 'from-emerald-500/10 to-teal-500/10',
            borderCol: 'border-emerald-500/20',
            textCol: 'text-emerald-400',
            comment: `高端防尘罩和防皱折结构通过 3D 抗受力变形测试，成衣长板长度 120cm 的运输包装重压模型显示：折边抗变形指数高达 Class 4.5 级，运输无损。`
          },
          {
            agent: 'Marcus',
            role: '商业拓展官 / E-comm Growth Manager',
            avatar: '📈',
            rating: 'STRONG BRANDING',
            metric: '品牌溢价倍率: 2.8x',
            bgGradient: 'from-amber-500/10 to-orange-500/10',
            borderCol: 'border-amber-500/20',
            textCol: 'text-amber-400',
            comment: `这套静奢与折衷机能高智调性非常明晰，具有 3.5 倍的冷启动品牌自溢价。在 Toteme 与 Lemaire 长期把持的中高产细分服饰领域，能够占领明确心智高地。`
          },
          {
            agent: 'Serene',
            role: '品牌美学监管官 / Brand Vibe Overseer',
            avatar: '🎨',
            rating: 'PERFECT ALIGNED',
            metric: '美学DNA指数: S+',
            bgGradient: 'from-purple-500/10 to-pink-500/10',
            borderCol: 'border-purple-500/50',
            textCol: 'text-pink-400',
            comment: `品牌 logo 排行与伦敦美学单位的搭配方案堪称经典。SÉRIEUX ARIA 这个子品牌主视觉极富力量与风尘质感，五星通过！可以直接对外宣发首波预备季。`
          }
        ];
        break;
    }

    setReviewsOutput(simulatedReviews);
    setReviewScore(calculatedScore);
    setIsReviewing(false);

    // Write a beautiful enterprise workflow message into the log board
    const actionTime = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setLogs((prev: any) => [
      ...prev,
      {
        id: 'review-done-' + Date.now(),
        timestamp: actionTime,
        sender: 'AI 联席会审董事会',
        emoji: '👔',
        message: `🏁 [多智联审毕] 针对【${currentStyleName}】的跨职业会审通过！联合审评级分：${calculatedScore}分 (优秀/特许大货上柜备品)！各岗位合议意见已签发。`,
        type: 'success'
      }
    ]);
    setTestLog(`✔ 多岗合议决策完毕：【${currentStyleName}】获得联席评审 ${calculatedScore} 分！意见报告书已经锁仓。`);
  };

  // Automatically trigger a nice preloaded review on initial render so the panel doesn't look empty
  React.useEffect(() => {
    if (reviewsOutput.length === 0) {
      // Create initial review data mapping
      const baseReviews = [
        {
          agent: 'Lukas',
          role: '首席纺织面料官 / Lead Textile Forecaster',
          avatar: '🧶',
          rating: 'EXCELLENT',
          metric: '环保合规: 100%',
          bgGradient: 'from-blue-500/10 to-indigo-500/10',
          borderCol: 'border-blue-500/20',
          textCol: 'text-blue-400',
          comment: `大纺织源极核表现优秀。当前所精选的美利奴毛长呢及三防重磅华达呢具有惊叹的极高耐寒弹性指标（CLO值2.1），完全契合2026年高智审美潮流色谱对硬挺防寒的企划命题。`
        },
        {
          agent: 'Clara',
          role: '3D版型工艺师 / 3D Structural Engineer',
          avatar: '📐',
          rating: 'RECOMMENDED',
          metric: '垂坠阻力: S级',
          bgGradient: 'from-emerald-500/10 to-teal-500/10',
          borderCol: 'border-emerald-500/20',
          textCol: 'text-emerald-400',
          comment: `在多体态碰撞解调中，整体落肩及腰抽绳流体形变拟合平滑：背部伞褶在动态行走时的空气回流间距留存得体，防勾丝拉力经纬测试合规。建议保持这套力学仿真。`
        },
        {
          agent: 'Marcus',
          role: '商业拓展官 / E-comm Growth Manager',
          avatar: '📈',
          rating: 'OUTSTANDING',
          metric: '新品搜索预期: +34%',
          bgGradient: 'from-amber-500/10 to-orange-500/10',
          borderCol: 'border-amber-500/20',
          textCol: 'text-amber-400',
          comment: `小红书（RED）大盘风向：知识分子漫步大衣及漏斗裙摆机能大衣首度产生重合流行。定价设定 ¥2,980-¥3,480 的毛利润溢价在 2.8x 左右，首批柔性试销通过。`
        },
        {
          agent: 'Serene',
          role: '品牌美学监管官 / Brand Vibe Overseer',
          avatar: '🎨',
          rating: 'PERFECT ALIGNED',
          metric: '美学完美吻合',
          bgGradient: 'from-purple-500/10 to-pink-500/10',
          borderCol: 'border-purple-500/20',
          textCol: 'text-pink-400',
          comment: `瑟瑞阁 AW2026 视觉色系（沙尘、尾绿、曜石黑、温润麻色）完全对齐首款。画册排版光效通过。`
        }
      ];
      setReviewsOutput(baseReviews);
    }
  }, [selectedProtoId]);

  const handleExportMarkdown = () => {
    const mdContent = `# Aria AI High-Couture Fashion Trend Report (Aria 高定秋冬季度趋势报告)

## 报告基础信息 / Metadata
- **标题**: ${trendData.title}
- **Season**: 2026 Season Autumn/Winter
- **检索源**: Vogue Fashion, TikTok Trends, RED 小红书高频服装零售词频大盘
- **导出时间**: ${new Date().toLocaleString()}

---

## 1. Google 趋势推荐色谱 / Color Palette Analysis

${trendData.colors.map((c: any) => `### 🎨 ${c.name}
- **色值 (HEX)**: \`${c.hex}\`
- **趋势关注热度指数**: ${c.score || 85} / 100
- **风格诠释**: ${c.desc}`).join('\n\n')}

---

## 2. 奢品材质风向标百分比 / Fabric Trend Proportions

${trendData.fabrics.map((f: any) => `- **${f.name}**: 企划占比 ${f.percent || 30}%
  *材料解构描述*: ${f.desc}`).join('\n')}

---

## 3. 意向剪裁与版型结构 / Concept Silhouettes

${trendData.silhouettes.map((s: any) => `- **${s.name}**
  *工艺与结构细节*: ${s.desc}`).join('\n')}

---

## 4. 品牌对标线 / Benchmarks
- **对标顶级奢侈线 (Benchmark Brands)**: ${trendData.brands}
- **对标核心商业大盘 (Competitor Outlets)**: ${trendData.competitors}

---
*Generated by SÉRIEUX • M O D A Studio - Aria Intelligent Fashion Planner Engine*`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Aria_Fashion_Trend_Report_2026.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTestLog("💾 已成功导出完整版 [Aria_Fashion_Trend_Report_2026.md] 趋势报告到本地。");
  };

  const handleExportPDF = () => {
    const textContent = `SÉRIEUX • M O D A FASHION REPORT
============================================================
${trendData.title.toUpperCase()}
============================================================
Generated by Aria Creative Studio | Season: 2026 Autumn/Winter
Export Date: ${new Date().toLocaleString()}

1. COLOR PALETTE ANALYSIS:
------------------------------------------------------------
${trendData.colors.map((c: any) => `* ${c.name} [HEX: ${c.hex}]
  Hot Rating: ${c.score || 85}/100
  Detail: ${c.desc}`).join('\n\n')}

2. FABRIC MATERIAL TREND PROPORTIONS:
------------------------------------------------------------
${trendData.fabrics.map((f: any) => `* ${f.name} (Share: ${f.percent || 30}%)
  Details: ${f.desc}`).join('\n')}

3. CONCEPT SILHOUETTES DESIGN DICTIONARY:
------------------------------------------------------------
${trendData.silhouettes.map((s: any) => `* ${s.name}
  Details: ${s.desc}`).join('\n')}

4. BENCHMARK BRANDS:
------------------------------------------------------------
* High-End Luxe Benchmarks: ${trendData.brands}
* General Commercial Competitors: ${trendData.competitors}

============================================================
SÉRIEUX • M O D A - Aria Intelligent Fashion Planner Engine`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Aria_Fashion_Trend_Report_2026.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTestLog("💾 已成功生成并下载离线 PDF 风格明细趋势报告 [Aria_Fashion_Trend_Report_2026.txt] 文件。");
  };

  // Derived Trend Chart Datasets
  const defaultScores = [92, 85, 88, 76, 62, 70];
  const colorChartData = trendData.colors.map((c: any, idx: number) => {
    const match = c.name.match(/\(([^)]+)\)/);
    const label = match ? match[1] : c.name.split(' (')[0];
    return {
      name: label,
      score: c.score || defaultScores[idx] || 75,
      hex: c.hex
    };
  });

  const defaultPercents = [45, 35, 20];
  const defaultColors = ["#6366F1", "#10B981", "#F59E0B"];
  const fabricPieData = trendData.fabrics.map((f: any, idx: number) => ({
    name: f.name,
    value: f.percent || defaultPercents[idx] || 20,
    color: f.color || defaultColors[idx % defaultColors.length]
  }));

  // Custom API Integration generator for AI Designer Aria
  const handleAriaGenerate = async (capability: string, customPrompt: string) => {
    if (!customPrompt.trim()) return;
    setIsAriaGenerating(true);
    setAriaGenerationResult(null);
    setLastDesignedItem(null);

    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    
    setLogs((prev: any) => [
      ...prev,
      {
        id: Math.random().toString(),
        timestamp,
        sender: 'Aria (AI设计总监)',
        emoji: '👗',
        message: `⚡ [Aria • 服装开发] 正在针对【${capability}】深度构思您的创意命题：“${customPrompt}”，启动大模型开展高维服装版型及立体像素渲染...`,
        type: 'info'
      }
    ]);

    try {
      // Direct call to specialized design pipeline endpoint representing 100% genuine AI designs and images
      const response = await fetch('/api/fashion/design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: customPrompt })
      });

      if (!response.ok) {
        throw new Error(`HTTP 异常 ${response.status}`);
      }

      const data = await response.json();
      if (data && data.success) {
        setAriaGenerationResult(data.text);
        if (data.item) {
          setLastDesignedItem(data.item);
          runAgentCollaborationPipeline(data.item);
        }
        
        setLogs((prev: any) => [
          ...prev,
          {
            id: Math.random().toString(),
            timestamp,
            sender: 'Aria (AI设计总监)',
            emoji: '👗',
            message: `✔ [Aria • 设计完成] 您的时装创意精细化渲染及打打版底案已经生成！`,
            type: 'success'
          }
        ]);
      } else {
        throw new Error(data.error || "大模型未给出返回。");
      }
    } catch (err: any) {
      console.warn("Aria live query failed, fallback to local high-fidelity simulation:", err.message);
      
      // Simulate high-fidelity design outcome with a realistic timer
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let mockResult = "";
      let mockItem = null;

      if (capability === "趋势分析") {
        mockResult = `### 2026 欧洲及线上高阶女装趋势报告 • 补充案\n\n**核心结论：临界微光、知识分子风、多维度功能重叠。**\n\n- **推荐款配色拓展**：【瓦当青】(#4B5F5D)、【冰川泥】(#BCB7B1)、【焦枯橡木】(#3B2F2A)。\n- **面辅料升级**：重磅24%羊驼毛与高光微湿涂层尼龙的解构双面拼接，兼具锁温防雨性与奢华质感。\n- **竞争定位**：抢先 Toteme 经典风衣布局，增加机能锁绊扣眼。`;
      } else {
        // Fallback designed items
        const fallbacks = [
          {
            title: "「浮光流金」高端羊毛立领大衣",
            desc: `针对“${customPrompt}”高定要求，本款大衣选用顶级澳大利亚美利奴高支羊毛面料，融入古典罗马领结构与防风雨飞肩重叠片，兼具洒脱不羁的风格骨感。`,
            fabric: "82% Tasmania 美利奴细羊毛, 18% 抗静电天丝里衬; 定制拉丝浅香槟金双扣钩与辅料挂扣",
            price: 1899,
            image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600",
            sketch: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=600"
          },
          {
            title: "「静奢智影」解构腰褶羊毛风衣",
            desc: `针对“${customPrompt}”命题，前襟特设可调节搭挂式单腰绳，既可以在优雅的法式漏斗收腰大摆间转换，也可以放松做无领茧身知识分子漫步穿搭。`,
            fabric: "70% 美利奴防缩华达呢, 30% 丝糯抗静电挂里; 意大利牛皮拼贴和极细哑拉链",
            price: 1599,
            image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600",
            sketch: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&q=80&w=600"
          }
        ];
        mockItem = fallbacks[Math.floor(Math.abs(hashString(customPrompt)) % fallbacks.length)];
        mockResult = `### 首席设计师 Aria 智绘时装成果提案 [本地离线端]\n\n**经典品名：${mockItem.title}**\n\n- **艺术美学廓形**：${mockItem.desc}\n- **选用奢侈辅料**：${mockItem.fabric}\n- **专柜指导零售价**：\`¥${mockItem.price}元\` (初始试销库存: 50件)\n\n*(AI已经锁定了该服装在3D物理样衣悬挂模拟状态。)*`;
      }

      setAriaGenerationResult(mockResult);
      if (mockItem) {
        setLastDesignedItem(mockItem);
        runAgentCollaborationPipeline(mockItem);
      }
      
      setLogs((prev: any) => [
        ...prev,
        {
          id: Math.random().toString(),
          timestamp,
          sender: 'Aria (AI设计总监)',
          emoji: '👗',
          message: `✔ [Aria • 方案生成] 您下达的指派已被 Aria 拆解并全息推演完毕！ (本地精算端)`,
          type: 'success'
        }
      ]);
    } finally {
      setIsAriaGenerating(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col" id="aria-fashion-studio">
      
      {/* 🌟 Block 1: Autonomous Flight Controller (全权托管飞行控制器) */}
      <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4 relative overflow-hidden" id="aria-auto-panel">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#1F6F54]/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Aria 24H 智能自主新品开发流水线</span>
                <span className="text-[10px] bg-[#1F6F54]/15 text-[#1F6F54] px-2 py-0.5 rounded border border-[#1F6F54]/30 font-mono">AUTONOMOUS</span>
              </h4>
              <p className="text-[10px] text-[#8B949E] mt-0.5">授权 AI 创意总监自主运转：『趋势分析 → 款式手绘 → 3D建模 → 电商影棚 → 黄金文案 → 一键上柜』全链条智能闭环</p>
            </div>
          </div>

          <div className="flex items-center">
            {!isAutoRunning ? (
              <button
                id="action-start-autonomous"
                onClick={() => {
                  setIsAutoRunning(true);
                  setLogs((prev: any) => [
                    ...prev,
                    {
                      id: 'auto-start-' + Date.now(),
                      timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                      sender: '大语言模型控制台',
                      emoji: '🌟',
                      message: '🚀 启动成功：AI 创意总监 Aria 已接管时装公司开发控制权，进入 24H 自主决策飞行路径！',
                      type: 'success'
                    }
                  ]);
                }}
                className="w-full sm:w-auto bg-[#1F6F54] hover:bg-[#2A8A67] text-white shadow-[0_0_15px_rgba(31,111,84,0.3)] duration-200 px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 border border-emerald-500/30 cursor-pointer animate-pulse hover:animate-none"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>一键启动 24H 自主设计开发</span>
              </button>
            ) : (
              <button
                id="action-stop-autonomous"
                onClick={() => {
                  setIsAutoRunning(false);
                  setAutoStep(0);
                  setTestLog('⏸ 用户手动终止了全权托管自主开发作业线。工作流就绪接收手动控制。');
                }}
                className="w-full sm:w-auto bg-red-600/10 border border-red-500/30 hover:bg-red-600 hover:text-white duration-150 px-5 py-2 rounded-lg text-xs text-red-400 font-bold flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span>强行终止托管 (紧急干预)</span>
              </button>
            )}
          </div>
        </div>

        {/* Step Progression Visualizer */}
        {isAutoRunning && (
          <div className="bg-black/50 border border-[#2F3336]/60 p-4 rounded-lg space-y-3" id="aria-auto-progress-deck">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#8B949E]">Aria 正在流水作业大盘第 <strong className="text-white font-bold">{autoStep}/6</strong> 阶段：</span>
              <span className="text-emerald-400 font-bold animate-pulse">
                {autoStep === 1 && "正在捕获 2026 秋冬潮流和流行色系..."}
                {autoStep === 2 && "正在生成 4 套重磅风衣款式与工艺里料..."}
                {autoStep === 3 && "正在构建 3D 样衣物理悬挂结构仿真建模..."}
                {autoStep === 4 && "正在渲染场景与 AI 高级大片融合..."}
                {autoStep === 5 && "正在一站式排版移动端黄金详情吊卡文案..."}
                {autoStep === 6 && "品牌形象升级色彩注入与分销店群自动上柜..."}
              </span>
            </div>
            
            <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-[#2F3336]/40">
              <div 
                className="h-full bg-gradient-to-r from-[#1F6F54] to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${(autoStep / 6) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-6 gap-2 text-center text-[10px] font-mono">
              {[
                { step: 1, label: "趋势" },
                { step: 2, label: "设计" },
                { step: 3, label: "3D样衣" },
                { step: 4, label: "商品大片" },
                { step: 5, label: "详情页" },
                { step: 6, label: "自动上架" }
              ].map((item) => {
                const isDone = autoStep > item.step;
                const isActive = autoStep === item.step;
                return (
                  <div 
                    key={item.step} 
                    className={`py-1.5 px-0.5 rounded border duration-200 ${
                      isDone 
                        ? 'bg-[#1F6F54]/10 border-[#1F6F54]/40 text-emerald-400' 
                        : isActive 
                          ? 'bg-[#1F6F54]/25 border-emerald-400/80 text-white font-bold animate-pulse shadow' 
                          : 'bg-neutral-950 border-[#2F3336] text-[#8B949E]'
                    }`}
                  >
                    <span>{isDone ? "✔" : isActive ? "⚙" : item.step}</span>
                    <span className="block mt-0.5 text-[9px] uppercase tracking-tighter truncate">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 👑 Block 2: Aria High-Couture Workspace Suite (主互动工作室) */}
      <div className="bg-[#09090B] border border-[#2F3336] rounded-xl flex flex-col overflow-hidden" id="aria-suit-hub">
        
        {/* Studio Navigation Header */}
        <div className="bg-[#0d0d0f] border-b border-[#2F3336] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#1F6F54]" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Aria 核心高定研发工作室 / Aria Creative Studio</h3>
          </div>
          
          <div className="flex flex-wrap gap-1 bg-black p-0.5 rounded-lg border border-[#2F3336]">
            {[
              { id: 'trend', label: "趋势分析" },
              { id: 'design', label: "款式设计" },
              { id: 'prototype', label: "3D样衣" },
              { id: 'catalog', label: "商品大片" },
              { id: 'detail', label: "黄金详情" },
              { id: 'brand', label: "品牌视觉" }
            ].map((tab) => (
              <button
                key={tab.id}
                id={`aria-tab-trigger-${tab.id}`}
                onClick={() => {
                  setAriaTab(tab.id as any);
                  setAriaGenerationResult(null);
                }}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors duration-150 cursor-pointer ${
                  ariaTab === tab.id
                    ? 'bg-[#1F6F54] text-white shadow'
                    : 'text-[#8B949E] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Core Workspace Canvas Body */}
        <div className="p-5 flex-1 bg-neutral-950 min-h-[380px] flex flex-col justify-between">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={ariaTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="space-y-4 flex-1"
            >
              {/* 1. Trend Analysis view */}
              {ariaTab === 'trend' && (
                <div className="space-y-4 font-sans" id="aria-canvas-trend">
                  <div className="p-3 bg-neutral-900 border border-[#2F3336]/60 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <span>👗</span>
                        <span>{trendData.title}</span>
                      </h5>
                      <p className="text-[10px] text-[#8B949E] mt-1 font-mono">
                        编排时间：2026 Season Autumn/Winter • 检索源：Vogue, TikTok Trends, RED 小红书高频高热服装词频
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={handleExportMarkdown}
                        className="bg-neutral-950 border border-[#2F3336] hover:border-emerald-500/60 hover:bg-emerald-500/10 text-[10px] font-mono text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center space-x-1"
                        title="下载 Aria 生成的完整 Markdown 趋势报告"
                      >
                        <span className="text-[10px]">📋</span>
                        <span>导出为 Markdown (.md)</span>
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="bg-neutral-950 border border-[#2F3336] hover:border-indigo-500/60 hover:bg-indigo-500/10 text-[10px] font-mono text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center space-x-1"
                        title="导出为 PDF 明细报告文本"
                      >
                        <span className="text-[10px]">📄</span>
                        <span>导出为 PDF 文本 (.txt)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider mb-2">① Google 趋势推荐色谱 / Color Palette</p>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                      {trendData.colors.map((c, idx) => (
                        <div 
                          key={idx} 
                          className="bg-neutral-900 border border-[#2F3336] p-2 rounded-lg text-center cursor-pointer hover:scale-105 transition-all"
                          onClick={() => {
                            navigator.clipboard?.writeText?.(c.hex);
                            setTestLog(`📋 已复制流行色 ${c.name} 的十六进制色值: ${c.hex}`);
                          }}
                          title="点击复制色值"
                        >
                          <div className="h-8 w-full rounded-md shadow-inner" style={{ backgroundColor: c.hex }} />
                          <p className="text-[9px] font-bold text-white mt-1.5 truncate">{c.name.split(' ')[0]}</p>
                          <p className="text-[8px] font-mono text-[#8B949E] uppercase tracking-wider">{c.hex}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recharts Visual Fashion Trend Analysis Charts Panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left: Recharts Radar for Color Preferences */}
                    <div className="bg-neutral-900/60 border border-[#2F3336]/60 p-4 rounded-xl flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider flex items-center space-x-1.5">
                          <Palette className="w-3.5 h-3.5 text-indigo-400" />
                          <span>流行色关注度雷达分布 / Color Interest Radar Map</span>
                        </span>
                        <span className="text-[9px] font-mono text-[#8B949E] bg-black/40 px-1.5 py-0.5 rounded border border-[#2F3336]">
                          Aria AI Analytics
                        </span>
                      </div>
                      
                      <div className="h-[210px] w-full font-sans text-[10px] select-none flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={colorChartData}>
                            <PolarGrid stroke="#2F3336" />
                            <PolarAngleAxis dataKey="name" stroke="#8B949E" fontSize={9} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#4F5254" fontSize={8} />
                            <Radar
                              name="热度得分"
                              dataKey="score"
                              stroke="#6366F1"
                              fill="#6366F1"
                              fillOpacity={0.25}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#09090B',
                                border: '1px solid #2F3336',
                                borderRadius: '6px',
                                fontSize: '10px',
                                color: '#F3F4F6'
                              }}
                              itemStyle={{ color: '#F3F4F6' }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[9px] text-center text-[#8B949E] font-mono">
                        💡 鼠尾草绿 & 旷野板栗棕表现出最高社交媒体检索频次与订货率
                      </p>
                    </div>

                    {/* Right: Recharts Pie for Material trends */}
                    <div className="bg-neutral-900/60 border border-[#2F3336]/60 p-4 rounded-xl flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider flex items-center space-x-1.5">
                          <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                          <span>推荐触感材质配比 / Material Proportions Pie</span>
                        </span>
                        <span className="text-[9px] font-mono text-[#8B949E] bg-black/40 px-1.5 py-0.5 rounded border border-[#2F3336]">
                          Fabric Allocations
                        </span>
                      </div>

                      <div className="h-[210px] w-full flex items-center justify-center font-sans">
                        <div className="w-[50%] h-[180px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={fabricPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={65}
                                paddingAngle={6}
                                dataKey="value"
                              >
                                {fabricPieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#09090B',
                                  border: '1px solid #2F3336',
                                  borderRadius: '6px',
                                  fontSize: '10px'
                                }}
                                itemStyle={{ color: '#F3F4F6' }}
                                formatter={(value) => `${value}%`}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="w-[50%] flex flex-col justify-center space-y-2 pl-3 border-l border-[#2F3336]/30">
                          {fabricPieData.map((item, idx) => (
                            <div key={idx} className="flex flex-col">
                              <span className="flex items-center space-x-1.5 text-[10px] font-medium text-neutral-200">
                                <span className="w-1.5 h-1.5 rounded-full inline-block shrink-0" style={{ backgroundColor: item.color }} />
                                <span className="truncate max-w-[120px]" title={item.name}>{item.name.split(' (')[0]}</span>
                              </span>
                              <span className="text-[9px] font-mono text-emerald-400 pl-3 font-semibold">{item.value}% 企划占比</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-[9px] text-center text-[#8B949E] font-mono">
                        ⚙️ 天然高克重山羊驼物料与重磅华达呢占据本季 80% 大盘预定
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#09090B] border border-[#2F3336]/40 p-3 rounded-lg space-y-2">
                      <p className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider">② 奢品材质风向标 / Premium Fabrics</p>
                      <div className="space-y-2">
                        {trendData.fabrics.map((f, i) => (
                          <div key={i} className="text-xs border-b border-white/[0.02] last:border-b-0 pb-1.5">
                            <span className="font-bold text-neutral-200 font-mono block">{f.name}</span>
                            <span className="text-[10px] text-[#8B949E] mt-0.5 block">{f.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#09090B] border border-[#2F3336]/40 p-3 rounded-lg space-y-2">
                      <p className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider">③ 意向剪裁版型 / Concept Silhouettes</p>
                      <div className="space-y-2">
                        {trendData.silhouettes.map((s, i) => (
                          <div key={i} className="text-xs border-b border-white/[0.02] last:border-b-0 pb-1.5">
                            <span className="font-bold text-neutral-200 font-mono block">{s.name}</span>
                            <span className="text-[10px] text-[#8B949E] mt-0.5 block">{s.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-900/40 border border-[#2F3336]/40 rounded-lg text-xs grid grid-cols-2 gap-4 font-mono">
                    <div>
                      <span className="text-[10px] text-[#8B949E] block uppercase font-bold">对标行业奢侈线 / BENCHMARK BRANDS:</span>
                      <span className="text-neutral-300 font-medium mt-0.5 block">{trendData.brands}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8B949E] block uppercase font-bold">对标核心竞品线 / COMPETITOR OUTLETS:</span>
                      <span className="text-neutral-300 font-medium mt-0.5 block">{trendData.competitors}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Style Design Drafting view */}
              {ariaTab === 'design' && (
                <div className="space-y-4" id="aria-canvas-design">
                  <div className="p-3 bg-neutral-900 border border-[#2F3336]/60 rounded-lg text-xs leading-relaxed font-mono flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase tracking-widest block font-bold">Aria 大衣风衣企划设计案说明</span>
                      <p className="text-neutral-300 mt-1 font-sans">{designNotes}</p>
                    </div>
                    <span className="text-[9px] text-[#8B949E] bg-black/40 border border-[#2F3336] px-2.5 py-1 rounded-md shrink-0">
                      双击大图/多角手绘图可缩放大底
                    </span>
                  </div>

                  {/* Inspiration Library (专属灵感素材库) Section */}
                  <div className="bg-neutral-900/80 border border-[#2F3336]/80 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-base text-yellow-500">★</span>
                        <h6 className="text-[11px] font-bold text-white uppercase tracking-wider">Aria 专属灵感素材库 / Inspiration Mood Board ({favoriteIds.length})</h6>
                      </div>
                      <span className="text-[9px] text-[#8B949E] font-mono">
                        点击款式右上角五角星添加/或在此处一键移除
                      </span>
                    </div>

                    {favoriteIds.length === 0 ? (
                      <div className="border border-dashed border-[#2F3336] p-4 rounded-lg flex flex-col items-center justify-center text-center space-y-1">
                        <span className="text-base text-[#8B949E]">🗂️</span>
                        <p className="text-[10px] text-[#8B949E]">暂无灵感款式，请点击下方款式稿右上方的 ★ 按钮进行收藏</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        {designItems.filter(item => favoriteIds.includes(item.id)).map(item => (
                          <div key={item.id} className="bg-[#09090C] border border-yellow-500/20 rounded-lg p-2.5 flex items-center space-x-2.5 relative group hover:border-yellow-500/40 transition-colors">
                            <img 
                              src={item.image} 
                              alt={item.title} 
                              referrerPolicy="no-referrer"
                              className="w-8 h-10 object-cover rounded shadow border border-[#2F3336]"
                            />
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="text-[10px] font-bold text-white truncate">{item.title}</p>
                              <p className="text-[8px] text-yellow-500/80 font-mono">SANS-#{item.id} • 已收藏</p>
                            </div>
                            <button
                              onClick={() => toggleFavorite(item.id)}
                              className="absolute top-1.5 right-1.5 text-[9px] text-[#8B949E] hover:text-red-400 cursor-pointer"
                              title="移出灵感库"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {designItems.map((item) => (
                      <div key={item.id} className="bg-neutral-900 border border-[#2F3336] rounded-xl overflow-hidden flex flex-col group hover:border-[#1F6F54] duration-200 relative">
                        <div className="h-36 w-full overflow-hidden relative bg-black flex">
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            referrerPolicy="no-referrer"
                            className="w-1/2 h-full object-cover group-hover:scale-105 duration-300 filter saturate-90 border-r border-[#2F3336]/40" 
                          />
                          <img 
                            src={item.sketch} 
                            alt="手绘款式制图" 
                            referrerPolicy="no-referrer"
                            className="w-1/2 h-full object-cover group-hover:scale-105 duration-300 filter grayscale saturate-75 brightness-95" 
                          />
                          
                          {/* Floating Favorite Star Trigger Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(item.id);
                            }}
                            className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-black/75 hover:bg-black border border-white/10 flex items-center justify-center hover:scale-110 active:scale-95 duration-150 backdrop-blur cursor-pointer"
                            title={favoriteIds.includes(item.id) ? "取消收藏" : "加入我的灵感素材库"}
                          >
                            <span className={`text-[12px] leading-none ${favoriteIds.includes(item.id) ? "text-yellow-400 font-bold" : "text-[#8B949E]"}`}>
                              ★
                            </span>
                          </button>

                          <span className="absolute bottom-1.5 left-1.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-mono border border-white/5">
                            方案 {item.id} (款式稿 + 打样稿)
                          </span>
                        </div>

                        <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between font-sans">
                          <div>
                            <h6 className="text-[11px] font-bold text-white group-hover:text-emerald-400 duration-150 truncate">{item.title}</h6>
                            <p className="text-[9px] text-[#8B949E] leading-normal line-clamp-3 mt-1">{item.desc}</p>
                          </div>
                          <div className="border-t border-white/[0.03] pt-1.5 mt-1.5 text-[8px] font-mono text-[#8B949E] flex items-center justify-between">
                            <p className="py-0.5 truncate max-w-[140px]"><strong className="text-neutral-300">材质：</strong>{item.fabric}</p>
                            <button
                              onClick={() => {
                                setSelectedProtoId(item.id);
                                setAriaTab('prototype');
                              }}
                              className="text-[#1F6F54] hover:text-[#2A8A67] font-bold shrink-0 cursor-pointer"
                            >
                              3D试衣 →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. 3D Prototype view */}
              {ariaTab === 'prototype' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono text-[10px]" id="aria-canvas-prototype">
                  <div className="lg:col-span-8 flex flex-col space-y-3">
                    <div className="aspect-[16/10] w-full bg-neutral-900 border border-[#2F3336] rounded-xl overflow-hidden relative flex items-center justify-center">
                      <div className="absolute top-3 left-3 bg-[#111112]/90 border border-[#2F3336] p-2 rounded text-[9px] space-y-1 z-10 pointer-events-none">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                          <span className="text-white font-bold uppercase tracking-wider">3D GPU Physics Engine Stream</span>
                        </div>
                        <p className="text-[#8B949E]">渲染比值: 73.5 FPS • 物理形变精度: 0.5mm 针距</p>
                      </div>

                      <div className="absolute top-3 right-3 bg-[#111112]/90 border border-[#2F3336] px-2 py-0.5 rounded z-10 pointer-events-none text-emerald-400 font-bold">
                        布料物理缩放: SANS 方案 {selectedProtoId}
                      </div>

                      <div className="w-full h-full overflow-hidden flex items-center justify-center bg-black relative">
                        <img 
                          src={
                            active3DAngle === 'front' 
                              ? designItems[selectedProtoId - 1]?.image || designItems[0].image
                              : active3DAngle === 'back'
                                ? designItems[(selectedProtoId) % 4]?.image || designItems[1].image
                                : active3DAngle === 'side'
                                  ? designItems[(selectedProtoId + 1) % 4]?.image || designItems[2].image
                                  : designItems[(selectedProtoId + 2) % 4]?.image || designItems[3].image
                          } 
                          alt="3D 样衣视图" 
                          referrerPolicy="no-referrer"
                          style={{ transform: `scale(${zoomScale})`, transition: 'transform 0.15s ease-out' }}
                          className="w-full h-full object-cover filter saturate-85 contrast-105 origin-center" 
                        />
                      </div>

                      {/* Floating zoom and fullscreen interaction deck */}
                      <div className="absolute bottom-3 right-3 bg-black/95 border border-[#2F3336] px-2 py-1 rounded-lg flex items-center space-x-2.5 z-20 shadow-lg">
                        <span className="text-[8px] text-[#8B949E] font-mono leading-none">物理放大: {Math.round(zoomScale * 100)}%</span>
                        <div className="flex items-center space-x-1 border-l border-[#2F3336] pl-2 shrink-0">
                          <button
                            onClick={() => setZoomScale(prev => Math.max(0.6, prev - 0.2))}
                            className="w-4.5 h-4.5 rounded bg-neutral-900 border border-[#2F3336] hover:border-emerald-400 hover:text-white flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors"
                            title="原位缩细"
                          >
                            -
                          </button>
                          <button
                            onClick={() => setZoomScale(1)}
                            className="px-1.5 py-0.5 rounded bg-neutral-900 border border-[#2F3336] hover:border-emerald-400 text-[7px] font-mono cursor-pointer transition-colors"
                            title="重置"
                          >
                            1:1
                          </button>
                          <button
                            onClick={() => setZoomScale(prev => Math.min(3.0, prev + 0.2))}
                            className="w-4.5 h-4.5 rounded bg-neutral-900 border border-[#2F3336] hover:border-emerald-400 hover:text-white flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors"
                            title="原位放大"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => setIsFullscreenProto(true)}
                          className="bg-[#1f6f54] hover:bg-[#154e3a] text-white px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-wider cursor-pointer transition-colors flex items-center space-x-0.5 shadow-md shrink-0"
                          title="查看大图全屏调校模式"
                        >
                          <span>🔍 全屏大图</span>
                        </button>
                      </div>

                      <div className="absolute bottom-3 left-3 bg-black/90 border border-[#2F3336] p-1 rounded-lg flex items-center space-x-1 z-20">
                        {[
                          { id: 'front', label: "正面 Front" },
                          { id: 'back', label: "背面 Back" },
                          { id: 'side', label: "侧面 Side" },
                          { id: 'model', label: "上身 Model" }
                        ].map((angle) => (
                          <button
                            key={angle.id}
                            id={`angle-trigger-${angle.id}`}
                            onClick={() => setActive3DAngle(angle.id as any)}
                            className={`px-2 py-1 text-[9px] font-bold rounded cursor-pointer transition-all duration-150 ${
                              active3DAngle === angle.id
                                ? 'bg-[#1F6F54] text-white'
                                : 'text-[#8B949E] hover:text-white'
                            }`}
                          >
                            {angle.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] text-[#8B949E] uppercase font-bold">切换物理打板样板:</span>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4].map((id) => (
                          <button
                            key={id}
                            onClick={() => setSelectedProtoId(id)}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all border cursor-pointer ${
                              selectedProtoId === id
                                ? 'bg-white text-black border-white shadow'
                                : 'bg-neutral-900 text-[#8B949E] border-[#2F3336] hover:text-white'
                            }`}
                          >
                            SANS 经典 {id}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 bg-neutral-900 border border-[#2F3336] p-4 rounded-xl flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      <h6 className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center space-x-1">
                        <span>📐</span>
                        <span>3D 布料粒子重力悬锁网格参数</span>
                      </h6>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[#8B949E] uppercase">1. 模型多边形数 / Polygon Mesh</p>
                          <p className="text-neutral-200 font-bold mt-0.5">{prototypeClothState.polygons}</p>
                        </div>
                        <div>
                          <p className="text-[#8B949E] uppercase">2. 弹性系数与垂坠阻尼 / Drape stiffness</p>
                          <p className="text-neutral-200 font-bold mt-0.5">{prototypeClothState.tension}</p>
                        </div>
                        <div>
                          <p className="text-[#8B949E] uppercase">3. 表面梭织工艺精细度 / Texture density</p>
                          <p className="text-neutral-200 font-bold mt-0.5">{prototypeClothState.texture}</p>
                        </div>
                        <div>
                          <p className="text-[#8B949E] uppercase">4. 后道蒸汽整水预缩率 / Shrinkage forecast</p>
                          <p className="text-neutral-200 font-bold mt-0.5">{prototypeClothState.shrinkage}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-white/[0.04] pt-3.5">
                      <p className="text-[9px] text-[#8B949E] uppercase tracking-wider block font-bold">物理解构材质参数方案</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { name: "重英制美利奴", stiffness: "36.4 N/m (美利奴羊毛高回弹垂感)", texture: "220/2S 精纺呢特高密度梭织" },
                          { name: "快反高密华达", stiffness: "65.2 N/m (重型挺括防风级特种呢)", texture: "240D 弹向交错拒水经纬尼龙" },
                          { name: "微反光功能尼", stiffness: "15.8 N/m (机能运动防潮多褶质感)", texture: "100% 科技抗褶抗撕裂复合丝" },
                          { name: "有机毛华达呢", stiffness: "22.5 N/m (松软干爽带孔隙天然流露)", texture: "70% 双粗绒高蓬松拉毛透气呢" }
                        ].map((profile, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setPrototypeClothState({
                                polygons: `${150000 + (i * 24000)} Quad-Meshes (柔性模型碰撞锚定中)`,
                                tension: profile.stiffness,
                                texture: profile.texture,
                                shrinkage: `≤0.${(4 + i)}% (洗整干洗安全指标)`
                              });
                              setTestLog(`📐 3D 物理碰撞网格已切换为新材质物理型谱：【${profile.name}】，网格对位完成。`);
                            }}
                            className="py-1 px-1.5 rounded bg-black hover:bg-neutral-800 text-[9px] text-[#8B949E] hover:text-white border border-[#2F3336] truncate cursor-pointer text-left font-mono"
                          >
                            • {profile.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Catalog Shooting view */}
              {ariaTab === 'catalog' && (
                <div className="space-y-4" id="aria-canvas-catalog">
                  <div className="aspect-[2.39/1] w-full bg-neutral-900 border border-[#2F3336] rounded-xl overflow-hidden relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/10 z-10 pointer-events-none" />
                    
                    <div className="absolute top-4 left-4 bg-[#0d0d0f]/90 border border-[#2F3336] p-2 rounded text-[9px] font-mono z-20 pointer-events-none space-y-0.5">
                      <p className="text-white font-bold flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>ARIA PHOTOREALISTIC CANVAS</span>
                      </p>
                      <p className="text-[#8B949E]">拍摄画布: 方案 {selectedProtoId} • 当前背景: {
                        activeCatalogBg === 'studio' ? "高阶灰纯白影棚白底" :
                        activeCatalogBg === 'paris' ? "玛黑区古典雨雾街拍" :
                        activeCatalogBg === 'nordic' ? "北欧清水混凝土极简工作室" :
                        "流沙暖戈壁大漠砂箱岩景色"
                      }</p>
                    </div>

                    {activeCatalogBg === 'studio' && (
                      <img 
                        src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=1200" 
                        alt="Studio Trench Shot" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top filter grayscale-5 blur-[0.3px]" 
                      />
                    )}
                    {activeCatalogBg === 'paris' && (
                      <img 
                        src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200" 
                        alt="Paris Trench Shot" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover filter saturate-80 contrast-95 brightness-95" 
                      />
                    )}
                    {activeCatalogBg === 'nordic' && (
                      <img 
                        src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=1200" 
                        alt="Nordic Trench Shot" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top filter saturate-70 brightness-90 contrast-105" 
                      />
                    )}
                    {activeCatalogBg === 'sand' && (
                      <img 
                        src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200" 
                        alt="Sand Trench Shot" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover filter sepia-[0.12] brightness-95 contrast-100" 
                      />
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-neutral-900 border border-[#2F3336]/60 rounded-xl gap-4 font-sans text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider block font-bold">① AI 一键多向换景融汇画册</span>
                      <span className="text-[#8B949E]">点击下方影室背景，Aria 将自动分割 3D 样板，并像素级融合阴影光路。</span>
                    </div>
                    <div className="flex flex-wrap gap-2 font-mono">
                      {[
                        { id: 'studio', label: "🏢 影棚白底 (Studio)" },
                        { id: 'paris', label: "🗼 巴黎玛黑 (Paris)" },
                        { id: 'nordic', label: "🗿 水泥展厅 (Nordic)" },
                        { id: 'sand', label: "🏜️ 戈壁荒原 (Sandscape)" }
                      ].map((bg) => (
                        <button
                          key={bg.id}
                          id={`bg-trigger-${bg.id}`}
                          onClick={() => {
                            setActiveCatalogBg(bg.id as any);
                            setTestLog(`🖼️ 电商大片渲染完成：智能剥离3D样衣，完美移植至场景【${bg.label.split(' ')[1]}】，直方图匹配光效已拉平。`);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer flex items-center ${
                            activeCatalogBg === bg.id
                              ? 'bg-white text-black border-white shadow'
                              : 'bg-black text-[#8B949E] border-[#2F3336] hover:text-white'
                          }`}
                        >
                          {bg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Detail Page Listing design view */}
              {ariaTab === 'detail' && (
                <div className="flex justify-center" id="aria-canvas-detail">
                  <div className="w-full max-w-xs rounded-[28px] border-4 border-[#2F3336] bg-black overflow-hidden shadow-2xl relative font-sans">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 h-3.5 w-16 bg-neutral-900 rounded-full z-30 pointer-events-none" />
                    
                    <div className="h-[400px] overflow-y-auto space-y-4 text-left p-3 pt-5 select-none hide-scrollbar text-[10px] bg-[#0c0c0f]">
                      <div className="border-b border-white/[0.04] pb-2 flex items-center justify-between text-[9px] text-[#8B949E] font-mono">
                        <span>SÉRIEUX MODA AW2026</span>
                        <span>详情移动端预览</span>
                      </div>

                      <div className="h-40 w-full bg-neutral-900 rounded-xl overflow-hidden relative">
                        <img 
                          src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600" 
                          alt="Detail trench top" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-top filter saturate-90 contrast-105" 
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider font-mono">2026秋冬首发 · SANS SABLE 风骨系列</span>
                        <h4 className="text-[11px] font-bold text-white tracking-tight">「法式风骨」侧肩解构重华达呢风衣</h4>
                        <div className="flex items-baseline space-x-1 border-b border-white/[0.03] pb-2">
                          <span className="text-orange-500 font-bold text-xs font-mono">¥ 3,280</span>
                          <span className="text-[8px] text-[#8B949E] line-through ml-1.5 font-mono">¥ 5,800</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[9px] font-mono text-[#8B949E] uppercase tracking-wider font-bold">👑 Aria 提炼黄金卖点 / Product highlights</p>
                        <div className="space-y-1 text-[#8B949E]">
                          {detailSellingPoints.map((point, idx) => (
                            <p key={idx} className="text-[9px] text-neutral-300 leading-normal">{point}</p>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#111113] p-2 rounded-lg border border-[#2F3336]/40 text-[8px] text-[#8B949E] leading-normal font-mono divide-y divide-white/[0.02]">
                        <div className="pb-1.5">
                          <strong className="text-neutral-200 block mb-0.5">材质对位:</strong>
                          <span>手感温糯: 澳大利亚美利奴 82% 奢华羊毛呢, 18% 记忆防缩功能丝.</span>
                        </div>
                        <div className="pt-1.5 font-bold">
                          <span className="text-emerald-400">✔ 欧盟 OEKO-TEX Standard 100 环保整洗印染</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-[8px]">
                        <p className="text-[#8B949E] font-bold">👗 尺码搭配规格建议 / Adaptive Size Chart</p>
                        <div className="bg-neutral-900 border border-white/5 rounded overflow-hidden">
                          <div className="grid grid-cols-5 bg-white/5 border-b border-white/10 p-1 font-bold text-neutral-200 text-center font-mono">
                            <span>尺码</span>
                            <span>身高</span>
                            <span>胸围</span>
                            <span>衣长</span>
                            <span>体重</span>
                          </div>
                          {[
                            { size: "S", height: "155-160", chest: "112", length: "114", weight: "45-55k" },
                            { size: "M", height: "160-165", chest: "116", length: "116", weight: "55-65k" },
                            { size: "L", height: "165-172", chest: "120", length: "118", weight: "65-75k" },
                            { size: "XL", height: "172-180", chest: "124", length: "120", weight: "75-85k" }
                          ].map((sz, i) => (
                            <div key={i} className="grid grid-cols-5 border-b border-white/[0.03] last:border-b-0 p-1 text-neutral-400 text-center font-mono">
                              <span className="font-bold text-neutral-200">{sz.size}</span>
                              <span>{sz.height}</span>
                              <span>{sz.chest}</span>
                              <span>{sz.length}</span>
                              <span>{sz.weight}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="h-4" />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Brand Visual guidelines view */}
              {ariaTab === 'brand' && (
                <div className="space-y-4 text-left" id="aria-canvas-brand">
                  <div className="p-6 bg-gradient-to-br from-neutral-900 to-[#121215] border border-[#2F3336] rounded-xl text-center space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono tracking-widest text-[#8B949E] uppercase block">{brandVisualData.logoSubtitle}</span>
                      <h4 className="text-xl md:text-2xl text-white tracking-[0.25em] py-2">{brandVisualData.logoText}</h4>
                      <div className="w-12 h-px bg-[#1F6F54] mx-auto my-1" />
                      <span className="text-[9px] font-mono text-emerald-400 block uppercase">EST. 2026 AW EXOTIC LUXURY COUTEURE</span>
                    </div>

                    <div className="max-w-md mx-auto text-xs text-neutral-300 leading-relaxed font-sans bg-black/40 p-4 rounded-lg">
                      <strong className="text-neutral-400 block mb-1 text-center font-serif text-[11px] uppercase tracking-wider">🏆 品牌调性哲学 / Brand DNA</strong>
                      <p className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider leading-relaxed">{brandVisualData.vibe}</p>
                    </div>

                    <div className="space-y-1.5 text-left max-w-lg mx-auto">
                      <span className="text-[10px] font-mono text-[#8B949E] block uppercase tracking-wider font-bold">瑟瑞阁 AW2026 定制品牌色标 / Branded Color swatches</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {brandVisualData.palette.map((color, idx) => (
                          <div key={idx} className="bg-black border border-white/5 rounded-lg p-2 flex items-center space-x-2">
                            <div className="w-6 h-6 rounded border border-white/10 shrink-0" style={{ backgroundColor: color.hex }} />
                            <div className="font-mono text-[8px] leading-tight flex-1 truncate">
                              <p className="text-white font-bold truncate">{color.name.split('(')[0]}</p>
                              <p className="text-[#8B949E] uppercase tracking-wider">{color.hex}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Large Gemini Assistant response card */}
              {ariaGenerationResult && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#0c0c11] border border-emerald-500/30 p-4 rounded-xl space-y-3 mt-4"
                  id="aria-result-box"
                >
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2 flex-col sm:flex-row gap-2">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span>ARIA 智脑创作数据方案 ✦ 成果回执</span>
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          if (ariaTab === 'trend') {
                            setTrendData((prev) => ({
                              ...prev,
                              title: "大模型定制: 2026秋冬高端女装趋势报告",
                              brands: "Lemaire, Toteme, Jil Sander & ARIA Design Core"
                            }));
                          } else if (ariaTab === 'design') {
                            setDesignNotes(ariaGenerationResult);
                          } else if (ariaTab === 'prototype') {
                            setPrototypeClothState((p) => ({
                              ...p,
                              polygons: "258,400 Quad-Meshes (大模型强化微调流网格已校验)"
                            }));
                          } else if (ariaTab === 'detail') {
                            setDetailSellingPoints([
                              "✅ Tasmania 美利奴绵羊呢拼接：多维耐寒抗泼水机能",
                              "✅ 束侧牛角拉绊腰绳：随手在漏斗裙与落拓直筒风衣中精算切换",
                              "✅ 重磅 480G/㎡ 克重：真正穿出秋冬体面的骨感和重量感"
                            ]);
                          } else if (ariaTab === 'brand') {
                            setBrandVisualData((prev) => ({
                              ...prev,
                              vibe: ariaGenerationResult
                            }));
                          }
                          setAriaGenerationResult(null);
                          setTestLog(`✔ 系统操作：已经成功将该大模型生成报告同步导入到当前 ${ariaTab} 决策面板，作为店群上市分销依据！`);
                        }}
                        className="bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500 hover:text-white text-emerald-300 rounded px-2.5 py-1 text-[9px] font-bold duration-150 cursor-pointer"
                      >
                        ✔ 覆盖导入当前预案
                      </button>
                      <button 
                        onClick={() => setAriaGenerationResult(null)}
                        className="bg-[#2F3336]/60 border border-[#2F3336] text-[#8B949E] hover:text-white rounded px-2.5 py-1 text-[9px] duration-150 cursor-pointer"
                      >
                        清空
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#8B949E] leading-normal font-mono whitespace-pre-wrap overflow-y-auto max-h-[140px] p-2 bg-black/40 rounded border border-white/[0.03]">
                    {ariaGenerationResult}
                  </div>
                  {lastDesignedItem && (
                    <div className="bg-black/50 p-2.5 rounded-lg border border-emerald-500/10 flex flex-col sm:flex-row items-center gap-3 mt-2">
                      <img src={lastDesignedItem.image} alt="时装成果" referrerPolicy="no-referrer" className="w-16 h-16 rounded object-cover border border-[#2F3336] shrink-0" />
                      <div className="flex-1 text-left">
                        <p className="text-[11px] font-bold text-white">{lastDesignedItem.title}</p>
                        <p className="text-[9px] text-[#8B949E] leading-normal line-clamp-1 mt-0.5">{lastDesignedItem.desc}</p>
                        <p className="text-[9px] text-emerald-400 font-mono mt-0.5">专柜指导零售价: ¥{lastDesignedItem.price} | 柔性快反库存: 50件</p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/fashion/products', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(lastDesignedItem)
                            });
                            const result = await res.json();
                            if (result.success) {
                              // Insert style item dynamically to current display list
                              setDesignItems((prev: any) => [result.product, ...prev]);
                              setLastDesignedItem(null);
                              setLogs((l: any) => [
                                ...l,
                                {
                                  id: Math.random().toString(),
                                  timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
                                  sender: 'AI商品经理 Barton',
                                  emoji: '👔',
                                  message: `【上架成功】Barton 已经把您的最新款式（${result.product.title}）成功加入在售货架！初始测销库存50件！`,
                                  type: 'success'
                                }
                              ]);
                              setTestLog(`✔ 上架成功：AI商品经理 Barton 成功将 “${result.product.title}” 投递录入线上数据库！`);
                            }
                          } catch (err: any) {
                            setTestLog(`❌ 录库失败: ${err.message}`);
                          }
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold px-3 py-1.5 text-[10px] duration-150 cursor-pointer flex items-center space-x-1 whitespace-nowrap self-stretch sm:self-auto justify-center"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>一键上架服装库</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Prompt Box under active tab */}
          <div className="border-t border-white/[0.03] pt-4 mt-5 font-sans">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-mono text-[#8B949E] uppercase tracking-wider flex items-center space-x-1">
                <span>✍ 指导总监 Aria 处理「</span>
                <span className="text-emerald-400 font-bold">{
                  ariaTab === 'trend' ? "趋势分析" :
                  ariaTab === 'design' ? "款式设计" :
                  ariaTab === 'prototype' ? "3D样衣" :
                  ariaTab === 'catalog' ? "商品图大片" :
                  ariaTab === 'detail' ? "文案详情" :
                  "品牌视觉"
                }</span>
                <span>」指令 / Prompt Aria</span>
              </label>
              <span className="text-[9px] font-mono text-[#8B949E]">
                底座: {apiProvider.toUpperCase()} Server Client
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="aria-prompt-input"
                type="text"
                defaultValue={
                  ariaTab === 'trend' ? "分析2026欧洲秋冬女装趋势" :
                  ariaTab === 'design' ? "设计2026秋季风衣系列" :
                  ariaTab === 'prototype' ? "把方案2生成3D样衣" :
                  ariaTab === 'catalog' ? "把这件风衣生成电商主图 (白底与大片效果)" :
                  ariaTab === 'detail' ? "生成这款风衣的移动端详情页及尺码表" :
                  "帮我设计一个极简主义时尚女装品牌视觉"
                }
                placeholder="给 Aria 输入自定义款细节与裁剪工艺参数..."
                className="flex-1 bg-black border border-[#2F3336] focus:border-[#1F6F54] rounded-lg py-2 px-3 text-xs text-white focus:outline-none transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAriaGenerate(
                      ariaTab === 'trend' ? "趋势分析" : ariaTab === 'design' ? "款式设计" : ariaTab === 'prototype' ? "3D样衣" : ariaTab === 'catalog' ? "商品图生成" : ariaTab === 'detail' ? "详情页生成" : "品牌设计",
                      e.currentTarget.value
                    );
                  }
                }}
              />
              <button
                id="aria-btn-generate"
                disabled={isAriaGenerating}
                onClick={() => {
                  const inputEl = document.getElementById('aria-prompt-input') as HTMLInputElement;
                  if (inputEl) {
                    handleAriaGenerate(
                      ariaTab === 'trend' ? "趋势分析" : ariaTab === 'design' ? "款式设计" : ariaTab === 'prototype' ? "3D样衣" : ariaTab === 'catalog' ? "商品图生成" : ariaTab === 'detail' ? "详情页生成" : "品牌设计",
                      inputEl.value
                    );
                  }
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 ${
                  isAriaGenerating
                    ? 'bg-neutral-800 border border-neutral-700 text-[#8B949E] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#1f6f54] to-emerald-500 shadow hover:brightness-110'
                }`}
              >
                {isAriaGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>像素渲染中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>调用 AI 算力渲染</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 👑 Block 3: SÉRIEUX • M O D A AI 智能多智协同联席会审董事会 / AI Collaborative Boardroom */}
      <div className="bg-[#09090B] border border-[#2F3336] rounded-xl p-5 space-y-5 relative overflow-hidden" id="aria-boardroom-cabin">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#2F3336]/65">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <span>SÉRIEUX • M O D A 跨工种多智能体智脑合议中枢</span>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded border border-indigo-500/20 font-mono font-bold">BOARDROOM</span>
              </h4>
            </div>
            <p className="text-[10px] text-[#8B949E] leading-relaxed">
              联合 <b>纤维Forecaster、3D力学、E-comm量化分析、品牌DNA</b> 等5大独立专业代理岗，就您当前的「<span className="text-emerald-400 font-bold">{
                ariaTab === 'trend' ? "时风趋势色系" :
                ariaTab === 'design' ? "时衣设计草案" :
                ariaTab === 'prototype' ? "3D打板模拟" :
                ariaTab === 'catalog' ? "商品图照排版" :
                ariaTab === 'detail' ? "卖点文案详情" :
                "品牌美学调性"
              }</span>」进行全逻辑闭环联席评审，保障服装开发决策科学化。
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center">
            <div className="flex flex-col items-end pr-3 border-r border-[#2F3336]">
              <span className="text-[8px] text-[#8B949E] uppercase font-mono font-bold">五智联席合意评分</span>
              <span className="text-xl font-mono font-bold text-indigo-400 leading-none mt-1">{reviewScore}分</span>
            </div>
            <button
              onClick={triggerMultiAgentReview}
              disabled={isReviewing}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold text-white transition-all duration-300 flex items-center space-x-2 shadow-md cursor-pointer shrink-0 ${
                isReviewing
                  ? 'bg-neutral-800 border border-[#2F3336] text-neutral-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.25)]'
              }`}
            >
              <Cpu className={`w-3.5 h-3.5 ${isReviewing ? 'animate-spin' : ''}`} />
              <span>{isReviewing ? '多智协调整理解算中...' : '启动五智智脑联审决策'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Collaboration Progress Animation Deck */}
        {isReviewing && (
          <div className="bg-black/40 border border-indigo-500/20 p-4 rounded-xl flex flex-col items-center justify-center space-y-3 animate-pulse">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
            <p className="text-xs font-mono text-indigo-400 text-center font-semibold leading-relaxed">
              {reviewStepMsg}
            </p>
            <p className="text-[8px] text-neutral-500 font-mono text-center">
              💡 正在跑通「趋势 → 材质耐寒检测 → 3D布料纠偏 → 爆款大盘测市 → 品牌DNA一致性证书」的多智能体联合闭环逻辑...
            </p>
          </div>
        )}

        {!isReviewing && reviewsOutput.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left side checklist metrics */}
            <div className="lg:col-span-4 bg-neutral-900/60 border border-[#2F3336]/60 p-4 rounded-xl flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-indigo-300 uppercase block font-bold tracking-wider">🔒 本次会审时效检验指标书</span>
                
                <div className="space-y-3.5 divide-y divide-white/[0.03]">
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] text-[#8B949E] font-mono">1. 生态零碳指数 (Lukas审)</span>
                    <span className="text-[9px] font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                      Class 1 (一等安全)
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[9px] text-[#8B949E] font-mono">2. 3D 碰撞摩擦抗形变 (Clara审)</span>
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      抗变形 Class 4.5
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[9px] text-[#8B949E] font-mono">3. 线上 CTR 点击预测 (Marcus审)</span>
                    <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      爆款溢价级 (S+)
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[9px] text-[#8B949E] font-mono">4. SÉRIEUX 美学对齐 (Serene审)</span>
                    <span className="text-[9px] font-mono font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded">
                      完全兼容 (Perfect)
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2F3336]/40 mt-4 space-y-1.5 font-sans">
                <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest block font-bold">⚡ 会审签发总指挥官 Aria 综述</span>
                <p className="text-[9.5px] text-neutral-300 leading-normal">
                  「经过其余四智专家联合推演与纠偏，本批在开发端提出的时装细节通过商业对齐。极力推荐一键将优化面辅料和3D拉绊对位细节同步覆盖至时装底案，快速投产发售！」
                </p>
              </div>
            </div>

            {/* Right side expert detail boardroom interaction */}
            <div className="lg:col-span-8 bg-neutral-900/40 border border-[#2F3336]/50 rounded-xl overflow-hidden flex flex-col">
              {/* Advisor small selector bar */}
              <div className="bg-black/50 border-b border-[#2F3336]/60 p-2.5 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[9px] font-mono text-[#8B949E] uppercase">席位席卡 / Advisor Seats:</span>
                  <div className="flex space-x-1 font-mono">
                    {[
                      { id: 'luka', label: "🧶 纺织 Lukas", full: "Lukas (首席面料 Forecaster)" },
                      { id: 'clara', label: "📐 版型 Clara", full: "Clara (3D力学工艺师)" },
                      { id: 'marcus', label: "📈 商业 Marcus", full: "Marcus (电商买手拓展 Lead)" },
                      { id: 'serene', label: "🎨 美学 Serene", full: "Serene (品牌DNA总监)" }
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setActiveReviewTab(btn.id as any)}
                        className={`px-2 py-1 text-[9.5px] rounded cursor-pointer font-bold transition-all ${
                          activeReviewTab === btn.id
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-bold shadow'
                            : 'text-[#8B949E] hover:text-white hover:bg-neutral-800'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <span className="text-[8px] bg-indigo-500/25 border border-indigo-500/40 px-2 py-0.5 rounded text-white font-mono uppercase">
                  ACTIVE FEEDBACK
                </span>
              </div>

              {/* Action and feedback block */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                {reviewsOutput.map((review, idx) => {
                  const matchesTab = 
                    (activeReviewTab === 'luka' && review.agent === 'Lukas') ||
                    (activeReviewTab === 'clara' && review.agent === 'Clara') ||
                    (activeReviewTab === 'marcus' && review.agent === 'Marcus') ||
                    (activeReviewTab === 'serene' && review.agent === 'Serene');
                  
                  if (!matchesTab) return null;

                  return (
                    <div key={idx} className="space-y-3.5 text-left font-sans flex-1 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl bg-black px-1.5 py-1 rounded-md border border-[#2F3336]">{review.avatar}</span>
                            <div className="leading-tight">
                              <p className="text-[11px] font-bold text-white uppercase tracking-tight">{review.role}</p>
                              <p className="text-[9px] text-[#8B949E] font-mono">职业特勤决策官: {review.agent}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 font-mono text-[9px]">
                            <span className={`px-2 py-0.5 rounded border ${review.borderCol} ${review.textCol} font-bold`}>
                              {review.rating}
                            </span>
                            <span className="text-[#8B949E] bg-black/40 px-1.5 py-0.5 rounded">
                              {review.metric}
                            </span>
                          </div>
                        </div>

                        <div className={`p-3 rounded-lg border ${review.borderCol} bg-neutral-950/60 leading-relaxed text-[10px] text-neutral-300 font-mono italic`}>
                          「 {review.comment} 」
                        </div>
                      </div>

                      {/* Adopt & Adjust Trigger Action for absolute enterprise logic synergy! */}
                      <div className="flex items-center justify-between bg-black/40 border border-[#2F3336]/40 p-2.5 rounded-lg flex-wrap gap-2 mt-4">
                        <div className="space-y-0.5 text-left max-w-sm sm:max-w-md">
                          <span className="text-[9px] text-indigo-400 font-bold block font-mono">⚡ 智能多岗建议采纳链路</span>
                          <p className="text-[8.5px] text-[#8B949E] leading-normal font-mono">
                            点击采纳后，工艺师与商品经理的优化项将自适应注入到<b>在售服装物理大盘、详情黄金卖点、或工艺说明</b>。
                          </p>
                        </div>
                        
                        <button
                          onClick={() => {
                            const actionTime = new Date().toLocaleTimeString('zh-CN', { hour12: false });
                            
                            if (ariaTab === 'trend') {
                              // Adopt Lukas / Clara on Trend (Update material proportions or description)
                              if (activeReviewTab === 'luka') {
                                setTrendData(prev => ({
                                  ...prev,
                                  title: "五智联审定制: 独占 2026 欧洲秋冬多维机能服装趋势",
                                  silhouettes: [
                                    ...prev.silhouettes,
                                    { name: "双层 80支澳洲美利奴特种长绒机能防雨领口", desc: "采纳 Lukas 联席意见：配置拉骨缝暗合工艺，强化领口抗拉力防护。" }
                                  ]
                                }));
                                setTestLog(`✔ 多智采纳成功：Lukas 面料优化方案已被深度结合编入 2026 秋冬趋势企划案！`);
                              } else {
                                setTestLog(`✔ 多智采纳成功：合议优化指标已注入至流行色大盘。`);
                              }
                            } else if (ariaTab === 'design') {
                              // Adopt design adjustments onto design notes
                              setDesignNotes(prev => prev + ` \n\n[★五智联审采纳] 建议肩罩受力节点内层缝合加固；面料包边采用 80支/3股 精梳纯纯线，确保耐穿。`);
                              setTestLog(`✔ 多智采纳成功：Clara 力学加固方案和走线细节已自动注入到「款式设计」企划说明书中，保障生产不崩针！`);
                            } else if (ariaTab === 'prototype') {
                              // Adopt prototype cloth adjustments
                              setPrototypeClothState(prev => ({
                                ...prev,
                                tension: "45.0 N/m (经 Lukas & Clara 联合对位后的超稳抗扯面料阻尼)",
                                texture: "220/2S 精纺呢 + 纳米二氧化硅三防整水复合膜"
                              }));
                              setTestLog(`✔ 多智采纳成功：已锁定 3D 模型布粒子受拉系数。`);
                            } else if (ariaTab === 'detail') {
                              // Adopt to selling points
                              setDetailSellingPoints(prev => [
                                ...prev,
                                "✅ 联席签发通过：100% 澳大利亚塔斯马尼亚纯羊毛 + 顶奢牛角扣 (五智终审推荐)"
                              ]);
                              setTestLog(`✔ 多智采纳成功：高溢价卖点文案已经成功推送到移动详情主吊卡！`);
                            } else {
                              setTestLog(`✔ 多智采纳成功：品牌首发宣发及视觉质感已校准完毕。`);
                            }

                            setLogs((prev: any) => [
                              ...prev,
                              {
                                id: 'adopt-' + Date.now(),
                                timestamp: actionTime,
                                sender: 'AI 联席会审系统',
                                emoji: '⚡',
                                message: `【会审决策合并】采纳了 [${review.role.split(' / ')[0]}] 的多岗位优化提案！状态已注入当前决策环！`,
                                type: 'success'
                              }
                            ]);
                          }}
                          className="bg-[#1F6F54] hover:bg-emerald-600 text-white font-mono font-bold text-[9px] px-3 py-1.5 rounded duration-150 cursor-pointer shadow flex items-center space-x-1"
                        >
                          <span>🗃️ 采纳此岗位决策调整</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Global Submit Command report to parent */}
        {!isReviewing && (
          <div className="bg-[#111113] p-3 rounded-lg border border-[#2F3336]/65 flex flex-col md:flex-row md:items-center justify-between gap-3 text-left">
            <div className="space-y-0.5">
              <span className="text-[10px] text-indigo-400 font-bold block font-mono">📤 联签上行一键签发报告 / Submit Executive Decision Package</span>
              <p className="text-[9px] text-[#8B949E] font-mono leading-relaxed">
                点击一键签发，系统将自动汇总：<b>当前趋势、在售打版、3D悬锁网格、大片照排、电商移动端详情以及董事会评审批复意见</b>，一键上报并向集团投产。
              </p>
            </div>
            
            <button
              onClick={() => {
                const currentStyleName = designItems[selectedProtoId - 1]?.title || "Aria 经典秋冬款式";
                const logTime = new Date().toLocaleTimeString('zh-CN', { hour12: false });
                
                setLogs((prev: any) => [
                  ...prev,
                  {
                    id: 'report-sent-' + Date.now(),
                    timestamp: logTime,
                    sender: '集团高管反馈总控',
                    emoji: '🏢',
                    message: `🏆 【签发成功】瑟瑞阁总部已经接收到时装工作舱上报的《${currentStyleName}》AW2026 开发及联审包（包审单ID: AW-${Date.now().toString().slice(-6)}）。项目状态锁死，进入大货柔性供应链。`,
                    type: 'success'
                  }
                ]);
                setTestLog(`🏆 签发成功：已向总公司签发完整的 [${currentStyleName}] 数字资产与联审上报单！`);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-4 py-2 rounded-lg duration-150 cursor-pointer shrink-0 shadow-lg text-center font-mono"
            >
              💼 联席签发并一键向总公司汇报投产
            </button>
          </div>
        )}
      </div>

      {/* 🔮 Block 4: SÉRIEUX • MODA 多智能体全链路协同总控 (Agent Collaboration Pipeline) */}
      <div className="bg-[#09090B] border border-[#2F3336] rounded-xl p-5 space-y-5 relative overflow-hidden" id="aria-agent-collab-pipeline">
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header description */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2F3336]/65">
          <div className="space-y-1 text-left flex-1">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2 font-mono">
                <span>⚓ MULTI-AGENT PIPELINE • 智能协同链路控制台</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">ACTIVE PIPELINE</span>
              </h4>
            </div>
            <p className="text-[10px] text-[#8B949E] leading-relaxed">
              实时追踪 Creative Director (<b>Aria</b>) 研发成品自适应传递给 Merchandise Lead (<b>Barton</b>) 核实初始库存与财务起价率，并迅速流转至 Growth Marketer (<b>Nova</b>) 生成全网分销文案的完整业务联动。
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            <button
              onClick={() => runAgentCollaborationPipeline()}
              disabled={pipelineStep > 0 && pipelineStep < 4}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold text-white transition-all duration-300 flex items-center space-x-2 cursor-pointer shadow-lg ${
                pipelineStep > 0 && pipelineStep < 4
                  ? 'bg-neutral-800 border border-[#2F3336] text-neutral-400 cursor-not-allowed animate-pulse'
                  : 'bg-gradient-to-r from-emerald-600 to-[#1F6F54] hover:from-emerald-500 hover:to-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pipelineStep > 0 && pipelineStep < 4 ? 'animate-spin' : ''}`} />
              <span>{pipelineStep > 0 && pipelineStep < 4 ? '协同链路仿真中...' : '一键重新跑通三岗协同流水线'}</span>
            </button>
          </div>
        </div>

        {/* Global Progress Track Line */}
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-bold text-[#8B949E] uppercase">协同传输总线状态:</span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                pipelineStep === 4 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
              }`}>
                {pipelineStep === 1 && "Aria 正在画图..."}
                {pipelineStep === 2 && "Barton 货存分析中..."}
                {pipelineStep === 3 && "Nova 文案宣发配档中..."}
                {pipelineStep === 4 && "三岗全息同步 (100% 同步)"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-white">{pipelineProgress}% Completeness</span>
            </div>
          </div>
          <div className="overflow-hidden h-1.5 text-xs flex rounded bg-neutral-900 border border-[#2F3336]/60">
            <motion.div 
              initial={{ width: '0%' }}
              animate={{ width: `${pipelineProgress}%` }}
              transition={{ ease: "easeInOut", duration: 0.4 }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 via-indigo-500 to-pink-500 h-full"
            />
          </div>
        </div>

        {/* 3-Agent Flow Diagram Nodes */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center pt-2">
          
          {/* Node 1: ARIA (Designer) */}
          <div className={`col-span-1 lg:col-span-3 bg-neutral-900/60 border rounded-xl p-4 transition-all duration-300 relative ${
            pipelineStep >= 1 ? 'border-emerald-500/40 bg-emerald-500/[0.02]' : 'border-[#2F3336]/60 text-neutral-500'
          }`}>
            <div className="absolute top-2 right-2 flex items-center space-x-1 font-mono text-[8px]">
              <span className={`w-1.5 h-1.5 rounded-full ${pipelineStep >= 1 ? 'bg-emerald-400 animate-ping' : 'bg-neutral-600'}`} />
              <span className={pipelineStep >= 1 ? 'text-emerald-400 font-bold' : 'text-neutral-500'}>
                {pipelineStep >= 1 ? 'ACTIVE DESIGN' : 'STANDBY'}
              </span>
            </div>

            <div className="flex items-center space-x-2.5 mb-3">
              <span className="text-2xl bg-black px-2 py-1 rounded-lg border border-[#2F3336]/80 shadow">👗</span>
              <div className="text-left">
                <h5 className="text-[11px] font-bold text-white uppercase tracking-tight">Aria (创意总监)</h5>
                <p className="text-[9px] text-[#8B949E] font-mono">Role: AI Creative & Rendering</p>
              </div>
            </div>

            <div className="space-y-2 text-left font-mono text-[9px] border-t border-[#2F3336]/45 pt-2.5">
              <p className="text-[#8B949E] leading-normal">
                时装品名: <span className="text-neutral-200 font-bold block truncate">{pipelineState.activeStyleName}</span>
              </p>
              <p className="text-[#8B949E] leading-normal">
                首创配比: <span className="text-neutral-200 font-bold block truncate">{pipelineState.activeFabric}</span>
              </p>
              <p className="text-[#8B949E] leading-normal">
                指导价位: <span className="text-emerald-400 font-bold">¥{pipelineState.activePrice} 元</span>
              </p>
            </div>
            
            <div className="mt-3.5 bg-black/50 p-2 rounded border border-emerald-500/10 text-[8px] text-emerald-400 font-mono italic">
              ⚡ 已输出矢量工艺底案，数据自适应移交 Barton 商品库。
            </div>
          </div>

          {/* Connection Link 1 */}
          <div className="col-span-1 lg:col-span-1 flex flex-col items-center justify-center py-2 lg:py-0">
            <div className="hidden lg:flex flex-col items-center space-y-1">
              <span className="text-[8px] text-[#8B949E] font-mono uppercase tracking-widest">自动交接</span>
              <motion.div 
                animate={{ x: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              >
                <ArrowRight className={`w-5 h-5 ${pipelineStep >= 2 ? 'text-amber-400' : 'text-neutral-600'}`} />
              </motion.div>
              <span className="text-[7px] font-mono text-emerald-500">API PUSH</span>
            </div>
            
            <div className="lg:hidden flex items-center space-x-1.5">
              <span className="text-[8px] font-mono uppercase text-emerald-500">自动交接至 Barton ▼</span>
            </div>
          </div>

          {/* Node 2: BARTON (Merchandise Manager) */}
          <div className={`col-span-1 lg:col-span-3 bg-neutral-900/60 border rounded-xl p-4 transition-all duration-300 relative ${
            pipelineStep >= 2 ? 'border-amber-500/40 bg-amber-500/[0.02]' : 'border-[#2F3336]/60 text-neutral-500'
          }`}>
            <div className="absolute top-2 right-2 flex items-center space-x-1 font-mono text-[8px]">
              <span className={`w-1.5 h-1.5 rounded-full ${pipelineStep >= 2 ? 'bg-amber-400 animate-ping' : 'bg-neutral-600'}`} />
              <span className={pipelineStep >= 2 ? 'text-amber-400 font-bold' : 'text-neutral-500'}>
                {pipelineStep >= 2 ? 'SKU STOCKED' : 'WAIT FOR DATA'}
              </span>
            </div>

            <div className="flex items-center space-x-2.5 mb-3">
              <span className="text-2xl bg-black px-2 py-1 rounded-lg border border-[#2F3336]/80 shadow">👔</span>
              <div className="text-left">
                <h5 className="text-[11px] font-bold text-white uppercase tracking-tight">Barton (商品经理)</h5>
                <p className="text-[9px] text-[#8B949E] font-mono">Role: Inventory & Pricing Core</p>
              </div>
            </div>

            <div className="space-y-2 text-left font-mono text-[9px] border-t border-[#2F3336]/45 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[#8B949E]">成衣估算成本:</span>
                <span className={pipelineStep >= 2 ? "text-neutral-200 font-bold" : "text-neutral-500"}>¥{pipelineStep >= 2 ? pipelineState.bartonCost : '??'}元</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8B949E]">初始开版大货数:</span>
                <span className={pipelineStep >= 2 ? "text-amber-400 font-bold" : "text-neutral-500"}>{pipelineStep >= 2 ? pipelineState.bartonStock : '??'} 件</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8B949E]">毛利润计幅:</span>
                <span className={pipelineStep >= 2 ? "text-emerald-400 font-bold" : "text-neutral-500"}>+{pipelineStep >= 2 ? pipelineState.bartonMargin : '??'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8B949E]">锁定接收仓储备:</span>
                <span className={pipelineStep >= 2 ? "text-neutral-200 block truncate max-w-[100px]" : "text-neutral-500"}>{pipelineStep >= 2 ? pipelineState.bartonWarehouse : '??' }</span>
              </div>
            </div>
            
            <div className="mt-3.5 bg-black/50 p-2 rounded border border-amber-500/10 text-[8px] text-amber-400 font-mono italic">
              📈 已完成财务测度核销，数据包已同步触达 Nova 宣发端。
            </div>
          </div>

          {/* Connection Link 2 */}
          <div className="col-span-1 lg:col-span-1 flex flex-col items-center justify-center py-2 lg:py-0">
            <div className="hidden lg:flex flex-col items-center space-y-1">
              <span className="text-[8px] text-[#8B949E] font-mono uppercase tracking-widest">营销分派</span>
              <motion.div 
                animate={{ x: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              >
                <ArrowRight className={`w-5 h-5 ${pipelineStep >= 3 ? 'text-pink-400' : 'text-neutral-600'}`} />
              </motion.div>
              <span className="text-[7px] font-mono text-pink-500">EVENT PUSH</span>
            </div>
            
            <div className="lg:hidden flex items-center space-x-1.5">
              <span className="text-[8px] font-mono uppercase text-pink-500">自动分派至 Nova ▼</span>
            </div>
          </div>

          {/* Node 3: NOVA (Marketing Specialist) */}
          <div className={`col-span-1 lg:col-span-3 bg-neutral-900/60 border rounded-xl p-4 transition-all duration-300 relative ${
            pipelineStep >= 3 ? 'border-pink-500/40 bg-pink-500/[0.02]' : 'border-[#2F3336]/60 text-neutral-500'
          }`}>
            <div className="absolute top-2 right-2 flex items-center space-x-1 font-mono text-[8px]">
              <span className={`w-1.5 h-1.5 rounded-full ${pipelineStep >= 3 ? 'bg-pink-400 animate-ping' : 'bg-neutral-600'}`} />
              <span className={pipelineStep >= 3 ? 'text-pink-400 font-bold' : 'text-neutral-500'}>
                {pipelineStep >= 3 ? 'AD GENERATED' : 'WAIT FOR PRICING'}
              </span>
            </div>

            <div className="flex items-center space-x-2.5 mb-3">
              <span className="text-2xl bg-black px-2 py-1 rounded-lg border border-[#2F3336]/80 shadow">📣</span>
              <div className="text-left">
                <h5 className="text-[11px] font-bold text-white uppercase tracking-tight">Nova (营销经理)</h5>
                <p className="text-[9px] text-[#8B949E] font-mono">Role: Global Growth & Copys</p>
              </div>
            </div>

            <div className="space-y-2 text-left font-mono text-[9px] border-t border-[#2F3336]/45 pt-2.5">
              <p className="text-[#8B949E] leading-normal font-bold">
                小红书种焦标题:
              </p>
              <p className={pipelineStep >= 3 ? "text-neutral-200 text-[8.5px] font-sans leading-snug font-medium" : "text-neutral-500 text-[8.5px]"}>
                {pipelineStep >= 3 ? pipelineState.novaHeadline : '等待 Barton 计价核定...'}
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {(pipelineStep >= 3 ? pipelineState.novaTags : ["-", "-"]).map((tag, idx) => (
                  <span key={idx} className="text-[7.5px] bg-pink-500/10 text-pink-400 border border-pink-500/15 px-1 py-0.5 rounded font-bold font-mono">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Core Ad copy action utility */}
            {pipelineStep >= 3 && (
              <div className="mt-3.5 pt-2 border-t border-[#2F3336]/40 flex items-center justify-between">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${pipelineState.novaHeadline}\n\n${pipelineState.novaCopy}\n#${pipelineState.novaTags.join(' #')}`);
                    setTestLog("✔ 推广文案与投放标签已经成功复制至剪贴板，可随意在小红书/微淘发布！");
                    const actionTime = new Date().toLocaleTimeString('zh-CN', { hour12: false });
                    setLogs((prev: any) => [
                      ...prev,
                      {
                        id: 'copy-ad-' + Date.now(),
                        timestamp: actionTime,
                        sender: 'Nova 营销分销中枢',
                        emoji: '📋',
                        message: `【文案导出】您已成功一键提取并复制 Nova 撰写的高流量小红书/抖音分销推广案！去平台分发吧。`,
                        type: 'info'
                      }
                    ]);
                  }}
                  className="w-full bg-[#1F6F54] hover:bg-emerald-600 text-white font-mono font-bold text-[8.5px] py-1.5 rounded duration-150 cursor-pointer shadow flex items-center justify-center space-x-1"
                >
                  <Share2 className="w-2.5 h-2.5 text-emerald-200" />
                  <span>一键复制双端分销文案 (Copy)</span>
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Dynamic telemetry state detail log box for collaboration steps */}
        <div className="bg-[#111113] p-3.5 rounded-lg border border-[#2F3336]/65 text-left font-sans flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-emerald-400 font-bold block font-mono">📊 协同决策汇总 / Multi-Agent Workspace Telemetry</span>
            <p className="text-[9px] text-[#8B949E] font-mono leading-relaxed">
              三岗在秋冬 SÉRIEUX MODA 企划中已深度穿透。Aria 矢量美学数据与 Barton 财务利润卡已完全与 Nova 双层推广物案在后端对位绑定，确保在售企划科学、快反、高利。
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <span className="text-[8.5px] font-mono text-[#8B949E] bg-black border border-[#2F3336] p-2 rounded block">
              当前绑定款式 ID: <b className="text-white">AW-NO.{selectedProtoId}</b>
            </span>
            <span className="text-[8.5px] font-mono text-[#8B949E] bg-black border border-[#2F3336] p-2 rounded block">
              财务溢价系数: <b className="text-emerald-400">3.2x</b>
            </span>
          </div>
        </div>
      </div>

      {/* Fullscreen HD Inspection Modal Overlay */}
      <AnimatePresence>
        {isFullscreenProto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 lg:p-6"
          >
            <div className="absolute top-4 right-4 flex items-center space-x-3 z-50 bg-neutral-900/60 p-2 rounded-xl border border-[#2F3336]">
              <span className="text-[10px] font-mono text-[#8B949E] hidden md:inline">
                8K 微距像素成像精度 • 物理形变: 采样已自适应
              </span>
              <button
                onClick={() => {
                  setIsFullscreenProto(false);
                  setZoomScale(1);
                }}
                className="bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider cursor-pointer duration-150 shrink-0"
              >
                关闭全屏 Close [Esc]
              </button>
            </div>

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-neutral-900/90 border border-[#2F3336]/80 p-3 rounded-xl flex flex-col items-center space-y-2 z-50 w-full max-w-sm shadow-2xl">
              <div className="flex items-center space-x-4 w-full justify-between">
                <span className="text-[10px] text-white font-mono uppercase font-bold">
                  微距放大比例: {Math.round(zoomScale * 100)}%
                </span>
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => setZoomScale(p => Math.max(0.5, p - 0.25))}
                    className="w-8 h-7 bg-black/60 border border-[#2F3336] rounded text-[#8B949E] hover:text-white font-bold cursor-pointer text-xs flex items-center justify-center"
                    title="缩小"
                  >
                    -
                  </button>
                  <button
                    onClick={() => setZoomScale(1)}
                    className="px-2 h-7 bg-black/60 border border-[#2F3336] rounded text-[#8B949E] hover:text-white font-mono text-[9px] cursor-pointer flex items-center justify-center"
                    title="原始尺寸"
                  >
                    1:1
                  </button>
                  <button
                    onClick={() => setZoomScale(p => Math.min(4.0, p + 0.25))}
                    className="w-8 h-7 bg-[#1F6F54] text-white rounded font-bold cursor-pointer text-xs flex items-center justify-center"
                    title="放大"
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="text-[8px] text-center text-[#8B949E] font-mono leading-relaxed">
                💡 双指拉伸或使用上方按钮可放大，细致观察 100% 精梭 merino 毛呢及防风快反走工艺细节
              </p>
            </div>

            <div className="w-full max-w-5xl h-[80vh] border border-[#2F3336] rounded-2xl overflow-hidden relative bg-black/50 flex items-center justify-center">
              <div className="absolute top-4 left-4 bg-neutral-950/80 backdrop-blur z-20 border border-[#2F3336] p-2.5 rounded-lg text-[9px] font-mono">
                <span className="text-emerald-400 font-bold uppercase tracking-wider block">ARIA COUTURE HD COLLISION ENGINE</span>
                <p className="text-neutral-300 mt-1">款式案码: {designItems[selectedProtoId - 1]?.title}</p>
                <p className="text-[#8B949E] mt-0.5">多维成像角度: {active3DAngle === 'front' ? '正面 (Front)' : active3DAngle === 'back' ? '背面 (Back)' : active3DAngle === 'side' ? '侧面 (Side)' : '上身效果 (Model)'}</p>
              </div>

              <div className="w-full h-full overflow-auto flex items-center justify-center cursor-pointer">
                <img
                  src={
                    active3DAngle === 'front' 
                      ? designItems[selectedProtoId - 1]?.image || designItems[0].image
                      : active3DAngle === 'back'
                        ? designItems[(selectedProtoId) % 4]?.image || designItems[1].image
                        : active3DAngle === 'side'
                          ? designItems[(selectedProtoId + 1) % 4]?.image || designItems[2].image
                          : designItems[(selectedProtoId + 2) % 4]?.image || designItems[3].image
                  }
                  alt="3D Multiangle Fullscreen View"
                  referrerPolicy="no-referrer"
                  style={{ transform: `scale(${zoomScale})`, transition: 'transform 0.15s ease-out' }}
                  className="max-h-[90%] max-w-[90%] object-contain filter saturate-90 contrast-105 origin-center"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
