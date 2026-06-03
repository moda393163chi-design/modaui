import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Stripe from "stripe";
import { Payment, middleware as wechatMiddleware } from "wechat-pay";
import * as paypalCheckoutServerSDK from "@paypal/checkout-server-sdk";
import { PayPalService } from "./src/services/payment-paypal";
import { ModaDB } from "./src/server/db";
import { generateWithOpenAI } from "./src/services/openai.service";
import { createLangChainAgent } from "./src/services/langchain.service";
import { generateWithOllama } from "./src/services/ollama.service";

// Initialize Firebase client for server backup & live cloud persistence syncing
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection as firestoreCollection, 
  getDocs as firestoreGetDocs, 
  setDoc as firestoreSetDoc, 
  doc as firestoreDoc 
} from "firebase/firestore";

// Load environment variables
dotenv.config();

let firebaseApp;
let serverDb: any = null;

try {
  const cfgPath = path.resolve("firebase-applet-config.json");
  if (fs.existsSync(cfgPath)) {
    const config = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
    firebaseApp = initializeApp(config, "serverAppInstance");
    serverDb = getFirestore(firebaseApp, config.firestoreDatabaseId);
    console.log("[Firebase Server Init] Successfully bootstrapped Firestore with ID: " + config.firestoreDatabaseId);
  }
} catch (fireErr: any) {
  console.warn("[Firebase Server Warn] Failed to bootstrap cloud client fallback:", fireErr.message);
}

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Lazy safe Stripe initializer
let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === "MY_STRIPE_SECRET_KEY") {
    return null; // Fallback gracefully to realistic transaction simulator if keys aren't provisioned yet
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2025-01-27.acacia" as any
    });
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());

  // === 1. API STATUS PORTAL ===
  app.get("/api/status", (req, res) => {
    const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
    const hasStripe = !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== "MY_STRIPE_SECRET_KEY";
    res.json({
      success: true,
      provider: "Gemini Engine (Cloud Run Gateway)",
      hasKey,
      hasStripe,
      stripeStatus: hasStripe ? "Provisioned" : "Simulation Fallback Active",
      status: hasKey ? "Online" : "Offline Simulation",
      env: process.env.NODE_ENV || "development",
      time: new Date().toISOString()
    });
  });

  // === 2. AUTHENTICATION SERVICES (AUTH & USERS API) ===
  app.post("/api/auth/register", (req, res) => {
    try {
      const { username, email, password, role = "Customer" } = req.body;
      if (!email || !password || !username) {
        res.status(400).json({ success: false, error: "Missing required registration parameters." });
        return;
      }
      const db = ModaDB.read();
      const userExists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        res.status(409).json({ success: false, error: "Email already registered." });
        return;
      }
      const userId = `usr_${Math.random().toString(36).slice(2, 11)}`;
      const newUser = {
        id: userId,
        username,
        email,
        passwordHash: ModaDB.hashPassword(password),
        role,
        verified: false,
        createdAt: new Date().toISOString()
      };
      db.users.push(newUser);
      ModaDB.write(db);
      ModaDB.log(userId, username, "USER_REGISTER", "AUTH", `User registration successful: ${email}`);

      res.status(201).json({ success: true, user: { id: userId, username, email, role } });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ success: false, error: "Missing email or password." });
        return;
      }
      const db = ModaDB.read();
      const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user || user.passwordHash !== ModaDB.hashPassword(password)) {
        res.status(401).json({ success: false, error: "Invalid credentials." });
        return;
      }
      const sessionId = `sess_${Math.random().toString(36).slice(2, 15)}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      db.sessions.push({ id: sessionId, userId: user.id, expiresAt });
      ModaDB.write(db);
      ModaDB.log(user.id, user.username, "USER_LOGIN", "AUTH", `User login session created: ${sessionId}`);

      res.json({ success: true, sessionId, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    try {
      const { sessionId } = req.body;
      if (sessionId) {
        const db = ModaDB.read();
        db.sessions = db.sessions.filter(s => s.id !== sessionId);
        ModaDB.write(db);
      }
      res.json({ success: true, message: "Logged out from unified console." });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/auth/me", (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        res.status(400).json({ success: false, error: "Session token is required" });
        return;
      }
      const db = ModaDB.read();
      const session = db.sessions.find(s => s.id === sessionId && new Date(s.expiresAt) > new Date());
      if (!session) {
        res.status(401).json({ success: false, error: "Session expired or invalid" });
        return;
      }
      const user = db.users.find(u => u.id === session.userId);
      if (!user) {
        res.status(404).json({ success: false, error: "User associated with session not found" });
        return;
      }
      res.json({ success: true, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Fetch users (Platform Admin & RBAC Audit)
  app.get("/api/users", (req, res) => {
    try {
      const db = ModaDB.read();
      res.json({ success: true, users: db.users.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role, createdAt: u.createdAt })) });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // === 3. MERCHANTS & STORE TENANCY API ===
  app.get("/api/merchants", (req, res) => {
    try {
      const db = ModaDB.read();
      res.json({ success: true, merchants: db.merchants });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/merchants", (req, res) => {
    try {
      const { name, ownerId, billingPlan = "free" } = req.body;
      if (!name || !ownerId) {
        res.status(400).json({ success: false, error: "Name and ownerId are mandatory attributes." });
        return;
      }
      const db = ModaDB.read();
      const merchantId = `mer_${Math.random().toString(36).slice(2, 11)}`;
      const newMerchant = {
        id: merchantId,
        name,
        ownerId,
        status: "active" as const,
        billingPlan,
        createdAt: new Date().toISOString()
      };
      db.merchants.push(newMerchant);
      
      // Instantiate global tenant quotas
      db.tenants.push({
        id: merchantId,
        quotaLimit: billingPlan === "enterprise" ? 100000 : billingPlan === "growth" ? 5000 : 500,
        quotaUsed: 0,
        billingStatus: "paid"
      });

      ModaDB.write(db);
      ModaDB.log(ownerId, "SYSTEM", "MERCHANT_CREATE", "TENANT_ENGINE", `Merchant created: ${name} (${merchantId})`);
      res.status(201).json({ success: true, merchant: newMerchant });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });


  app.post("/api/tenants/initialize", async (req, res) => {
    try {
      const { email, companyName, industryId, strategyId, strategyName, strategyDesc } = req.body;
      if (!email || !companyName || !industryId) {
        res.status(400).json({ success: false, error: "Missing email, companyName, or industryId" });
        return;
      }

      const tenantId = email.replace(/[^a-zA-Z0-9]/g, '_');
      const db = ModaDB.read();

      // 1. Create/Update Merchant
      const merchantIdx = db.merchants.findIndex(m => m.id === tenantId);
      const newMerchant = {
        id: tenantId,
        name: companyName,
        ownerId: email,
        status: "active" as const,
        billingPlan: "free" as const,
        createdAt: new Date().toISOString()
      };
      if (merchantIdx > -1) {
        db.merchants[merchantIdx] = newMerchant;
      } else {
        db.merchants.push(newMerchant);
      }

      // 2. Create/Update Store
      const storeId = `sto_${tenantId}`;
      const storeIdx = db.stores.findIndex(s => s.id === storeId);
      const newStore = {
        id: storeId,
        merchantId: tenantId,
        name: companyName,
        domain: `${tenantId}.modaui.com`,
        branding: {
          logo: "📦",
          colorTheme: "classic" as const,
          bannerText: `欢迎光临 ${companyName} 智体店样板！`
        },
        createdAt: new Date().toISOString()
      };
      if (storeIdx > -1) {
        db.stores[storeIdx] = newStore;
      } else {
        db.stores.push(newStore);
      }

      // 3. Clear and create default products scoped to this tenant-store
      db.products = db.products.filter(p => p.storeId !== storeId);
      
      const productsTemplates: Record<string, Array<{name: string, price: number, inventory: number, image: string, category: string, desc: string}>> = {
        fashion: [
          { name: "复古重工连帽卫衣 (Aria 联名定制系列)", price: 199, inventory: 150, image: "🧥", category: "外套大衣", desc: "精选高质摇粒绒保暖面。快反供应链极速打样出货。" },
          { name: "经典百搭翻盖帆布包 (Barton 选品推荐)", price: 149, inventory: 180, image: "👜", category: "美学配饰", desc: "加厚加密牛津帆布。多功能内置网兜与防水涂层材质。" },
          { name: "高腰褶皱新中式高定牛仔裙 (Aria 剪裁设计)", price: 299, inventory: 90, image: "👗", category: "裙装系列", desc: "复古提花深色牛仔布料。高腰显瘦完美比例版型。" }
        ],
        catering: [
          { name: "特色秘制宫保鸡丁双人份大套餐 (Kai 推荐)", price: 28, inventory: 100, image: "🍱", category: "智造招牌", desc: "热度数据优选菜单，低物耗供应链极速配送。" },
          { name: "灌汤黑猪肉手工水饺 (十二只装)", price: 18, inventory: 250, image: "🥟", category: "精品小点", desc: "纯手工擀制，肉馅紧实多汁不柴。" },
          { name: "招牌沁心冷泡高山乌龙茶", price: 10, inventory: 400, image: "🍹", category: "爽口特饮", desc: "去热解腻搭档，低温长续保留甘甜天然茶酚。" }
        ],
        retail: [
          { name: "磨砂吸饱高硅玻璃马克杯 (Vara 特荐书签款)", price: 29, inventory: 200, image: "🥛", category: "生活家居", desc: "防烫无毒环保材质。设计师原案定制防指纹漆面。" },
          { name: "三层隔热高密封防漏竹纤维饭盒", price: 49, inventory: 150, image: "🍱", category: "时尚厨具", desc: "天然竹原纤维降解压制。带提手轻便易携可微波。" },
          { name: "极低空噪超纯声波电动牙刷 (Dax 跟单选型)", price: 129, inventory: 70, image: "🪥", category: "智体个护", desc: "超声磁悬浮马达，精选五挡护理记忆，续航超百天。" }
        ],
        beauty: [
          { name: "真花萃取臻美大马士革玫瑰精油 (Yara 概念版)", price: 198, inventory: 80, image: "🧪", category: "奢宠护肤", desc: "滴滴尊贵精纯原液。强效保湿抗氧化。Iris深度私域高复购单品。" },
          { name: "免按泡沫温和氨基酸净澈面膜慕斯", price: 89, inventory: 120, image: "🧴", category: "温和洁面", desc: "双重氨基酸表面活性成分。超微细泡低残留不敏感紧绷。" },
          { name: "医用冻干重组胶原蛋白润养补水面膜 (5贴)", price: 59, inventory: 250, image: "🎭", category: "舒缓保湿", desc: "二类器械安全标准。修护医美术后泛红干燥，敏感退火。" }
        ],
        hotel: [
          { name: "大堂定制沉敛高雅小众木质扩香 (Noel 迎客香)", price: 120, inventory: 100, image: "🕯️", category: "特选周边", desc: "天然植萃精油。经典雪松与无花果清香，安抚差旅倦惫。" },
          { name: "释压支撑高弹抗菌防螨天然乳胶枕", price: 189, inventory: 40, image: "🛏️", category: "舒适酣眠", desc: "高密度蜂窝双气孔，承托颈部自然弯曲，深睡舒压。" },
          { name: "高克重精梳大圈绒亲肤速干全棉浴袍", price: 299, inventory: 30, image: "👘", category: "客房体验", desc: "特长绒全棉多圈编织。丝滑柔软，绝佳吸水保暖性能。" }
        ],
        influencer: [
          { name: "大主播评测力捧高纤低卡爆料威化饼", price: 39, inventory: 800, image: "🍪", category: "直播爆款", desc: "Sylvia运营推荐无蔗糖高饱腹代餐卡零食。" },
          { name: "万能RGB自拍补光大光环美颜美妆灯", price: 149, inventory: 120, image: "💡", category: "主播数码", desc: "多折叠收缩高度，无缝全光谱，Kellan直播话术搭配神器。" },
          { name: "高清数字电磁动圈降噪直播领夹麦克风", price: 399, inventory: 50, image: "🎙️", category: "专业声卡", desc: "智能防喷防爆声。一拖二高速发射续航。Mercedes剪辑首推。" }
        ]
      };

      const matchedSPUList = productsTemplates[industryId] || productsTemplates.fashion;
      matchedSPUList.forEach(item => {
        db.products.push({
          id: `prod_${Math.random().toString(36).slice(2, 11)}`,
          storeId: storeId,
          name: item.name,
          category: item.category,
          price: Number(item.price),
          inventory: Number(item.inventory),
          sku: `SKU-${industryId.toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          variant: {},
          images: [item.image],
          createdAt: new Date().toISOString()
        });
      });

      // 4. Create/Update AI Team and Employees
      db.ai_teams = db.ai_teams.filter(t => t.merchantId !== tenantId);
      const teamId = `team_${tenantId}`;
      const newAITeam = {
        id: teamId,
        merchantId: tenantId,
        name: `${companyName}专家智体委员会`,
        createdAt: new Date().toISOString()
      };
      db.ai_teams.push(newAITeam);

      // Clear old agents of this tenant's team
      db.ai_agents = db.ai_agents.filter(a => a.teamId !== teamId);

      const rolesTemplates: Record<string, Array<{name: string, role: string, desc: string}>> = {
        fashion: [
          { name: "Aria", role: "AI设计师", desc: "监控最新抖音/小红书潮流红线，负责策划线上微店陈列、海报文案和穿搭海报视觉。" },
          { name: "Barton", role: "AI选品经理", desc: "分析欧美大牌及KOL穿搭高频买点，自动优化本微店SPU多规格上新，确保转化率。" },
          { name: "Daphne", role: "AI营销经理", desc: "生成小红书/微淘复古种草笔记，规划广告直通车每日竞价出价及裂变优惠券预算分配。" },
          { name: "Cyrus", role: "AI运营经理", desc: "跟踪发货进销存状态，一键自动打单顺丰并安排揽收，拦截退款纠纷和退换货安抚。" }
        ],
        catering: [
          { name: "Kai", role: "AI外卖经理", desc: "主导外卖平台的满减、配送费及神券折扣梯度，极速配置下午茶推广大图海报。" },
          { name: "Ren", role: "AI大堂经理", desc: "专研新品口味。根据城市物耗、包装溢价快速给出新品提价与招牌搭配方案。" },
          { name: "Soren", role: "AI仓库经理", desc: "极智比对农品批发价，按日核动肉菜周转红线，自动汇总明日食材物耗进库采购单。" },
          { name: "Lulu", role: "AI运营经理", desc: "对接物流跑腿，处理差评、餐损破洒极速垫付。汇总每日美团流水并对账。" }
        ],
        retail: [
          { name: "Vara", role: "AI选品经理", desc: "选定亚马逊热榜飙升百货。对比国内拼多多/1688等高溢价渠道，优化起价及保价险配置。" },
          { name: "Dax", role: "AI库存经理", desc: "对接代加工厂，自动化检索国内货品拼集拼仓跟踪，跟单并警示揽派延误。" },
          { name: "Nova", role: "AI营销经理", desc: "拟定百日精推首发单。输出高转化引引流直通车方案，优化每日竞价ROI。" },
          { name: "Tate", role: "AI运营经理", desc: "闲鱼/微店铺货。合并日出单入账，友好协商物流损坏先行核退等争夺安抚。" }
        ],
        beauty: [
          { name: "Yara", role: "AI产品经理", desc: "研发特色美发/面膜耗材。草拟产品高颜值包装海报，并过滤安全合规文案。" },
          { name: "Iris", role: "AI客户经理", desc: "策划节日轻奢SPA充值送返项目。监控年卡到店周期，自动给核心VIP发送问候。" },
          { name: "Sage", role: "AI营销经理", desc: "批量达人测样分包建联。输出千粉美睫试用小红书图文文案，快速引流拓客。" },
          { name: "Cleo", role: "AI预约经理", desc: "管理面部护理及预约时段。动态进行时空差错峰引客，并在客户请假时极速重安排。" }
        ],
        hotel: [
          { name: "Noel", role: "AI前台经理", desc: "接待入住。提供微信一键取房及智能门锁、行李快递、同城美食安心导览建议。" },
          { name: "Pace", role: "AI客房经理", desc: "管理房间打扫并一键派发保洁工单。核定香香/浴巾采购及季度损耗周期。" },
          { name: "Kira", role: "AI收益经理", desc: "跟踪节假日溢价。分析竞争房价、天气与尾房入座比例，执行夜间动态打折甩干。" },
          { name: "Bella", role: "AI运营经理", desc: "全渠道OTA日历自动抗冲突合并。高转化话术秒回住客精美多图高分评语。" }
        ],
        influencer: [
          { name: "Giles", role: "AI选品经理", desc: "多平台佣金分成高物色。分析今日爆带品类大盘。策划限时拼买低门槛策略。" },
          { name: "Mercedes", role: "AI内容经理", desc: "设计直播间15s快速场场脚本。撰写吃货系列引流量笔记文案，最大化吸睛。" },
          { name: "Kellan", role: "AI直播经理", desc: "生成大促爆憋话术、高光高频滚动。调节直播节奏与弹幕互动，推高场观粘度。" },
          { name: "Sylvia", role: "AI运营经理", desc: "高精度GMV分成净利对账。跟踪货品派发反馈。买家物流丢件纠纷主动降级赔付。" }
        ]
      };

      const matchedRoster = rolesTemplates[industryId] || rolesTemplates.fashion;
      const createdAgents: any[] = [];
      matchedRoster.forEach(emp => {
        const agt = {
          id: `agt_${tenantId}_${emp.name}`,
          teamId: teamId,
          name: emp.name,
          role: `${emp.role} ${emp.name}` as any,
          systemPrompt: `你已受雇为 ${companyName} 的专属【${emp.role}】。岗位职责：${emp.desc}\n\n当前团队执行的运营策略是：${strategyName}（${strategyDesc}）。请极力贯彻执行，让商铺业绩持续攀升。`,
          status: 'idle' as const,
          memoryContext: [`于 ${new Date().toISOString()} 系统安全初始化就绪。岗位口号与授权契约已部署完毕。`],
          createdAt: new Date().toISOString()
        };
        db.ai_agents.push(agt);
        createdAgents.push(agt);
      });

      // 5. Clear and create default Knowledge Base chunks
      db.kb_chunks = db.kb_chunks.filter(c => c.merchantId !== tenantId);
      const defaultKBChks = [
        {
          id: `chk_${tenantId}_1`,
          title: `${companyName} 商业愿景与经营守则`,
          content: `本企业名为：${companyName}。\n创始人及企业主：${email}。\n行业定位与特种行业背景：${industryId}。\n公司战略策略定位是：${strategyName}（${strategyDesc}）。\n所有智体员工在向顾客提供解答或协助管理店铺时，必须以此策略为指导原则，遵守服务纪律。`,
          category: "企业政策",
          tokenCount: 220
        },
        {
          id: `chk_${tenantId}_2`,
          title: "顺丰速运一件代发极速分发履约标准",
          content: `公司为保障配送时效已与《顺丰速运》达成官方特惠寄递协议。\n前台店面所有买单订单，系统运营主管（如Cyrus/Lulu等）将无缝执行打包及一键传单顺丰派发航空专件。\n若出现揽收超时或揽派延误，平台将启动首单免首重和 ¥15 延时关怀专属优惠。`,
          category: "物流规范",
          tokenCount: 180
        },
        {
          id: `chk_${tenantId}_3`,
          title: "顾客退款退货阻拦、安抚与客情公关条例",
          content: `对于前台申请退款的顾客，客服智体员工须执行主动安抚和快速响应。\n如出现质检争议或错发：首单新客直接发起 ¥10 折扣福利补偿并建议保退，或直接免退货仅极速原件补发。\n凡遭遇不合理投诉，系统主管均启动客情调停，快速纠葛，保留品牌口碑。`,
          category: "客户服务",
          tokenCount: 210
        }
      ];

      for (const chk of defaultKBChks) {
        let vector: number[] | null = null;
        try {
          if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
            const api = getGeminiClient();
            const embedRes = await api.models.embedContent({
              model: "gemini-embedding-2-preview",
              contents: [chk.content]
            });
            vector = embedRes.embeddings?.[0]?.values || (embedRes as any).embedding?.values || null;
          }
        } catch (_) {}

        db.kb_chunks.push({
          id: chk.id,
          merchantId: tenantId,
          title: chk.title,
          content: chk.content,
          tokenCount: chk.tokenCount,
          createdAt: new Date().toISOString(),
          vector: vector as any
        });
      }

      // 6. Create partial tenant info for quota managing
      db.tenants = db.tenants.filter(t => t.id !== tenantId);
      db.tenants.push({
        id: tenantId,
        quotaLimit: 3000,
        quotaUsed: 0,
        billingStatus: "paid"
      });

      // 7. Push a simulated initial sales and finance report
      db.finance = db.finance.filter(f => f.merchantId !== tenantId);
      db.finance.push({
        id: `FIN-${Math.floor(100000 + Math.random() * 900000)}`,
        merchantId: tenantId,
        type: "revenue",
        amount: 3200,
        description: "系统上线预热活动订单交易收益",
        createdAt: new Date().toISOString()
      });

      // 8. Log audit trail
      ModaDB.write(db);
      ModaDB.log(email, email, "TENANT_INITIALIZE", "TENANT_ENGINE", `企业智体自动运营中枢彻底完成就绪：成功部署 4 名 AI 独立特遣岗位专家、SPU供货名录、以及 3 个 RAG 加固底座文件。`);

      // 9. Sync directly to live cloud Firestore if client is boot
      if (serverDb) {
        try {
          const mDocRef = firestoreDoc(serverDb, "tenants", tenantId);
          await firestoreSetDoc(mDocRef, {
            id: tenantId,
            name: companyName,
            industryId,
            strategyId,
            strategyName,
            ownerEmail: email,
            createdAt: new Date().toISOString()
          });

          // sync products to cloud
          for (const item of matchedSPUList) {
            const pSlug = `prod_${tenantId}_${item.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const pDocRef = firestoreDoc(serverDb, "products", pSlug);
            await firestoreSetDoc(pDocRef, {
              id: pSlug,
              storeId,
              name: item.name,
              category: item.category,
              price: item.price,
              inventory: item.inventory,
              images: [item.image],
              createdAt: new Date().toISOString()
            });
          }
          console.log("[Firebase Cloud Sync] Tenant initialized on live Cloud Firestore!");
        } catch (syncErr: any) {
          console.warn("[Firebase Sync Warn] Failed sync-write through initialization to Clouds.", syncErr.message);
        }
      }

      res.status(200).json({
        success: true,
        merchantId: tenantId,
        merchant: newMerchant,
        store: newStore,
        message: "Successfully initialized tenant assets."
      });
    } catch (err: any) {
      console.error("Initialize endpoint error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // === 3.1 STORES CONFIGURATION ENDPOINTS ===
  app.get("/api/stores/:id", (req, res) => {
    try {
      const { id } = req.params;
      const db = ModaDB.read();
      const store = db.stores.find(s => s.id === id || s.merchantId === id);
      if (!store) {
        res.status(404).json({ success: false, error: "Store configuration not found." });
        return;
      }
      res.json({ success: true, store });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.put("/api/stores/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { name, domain, branding } = req.body;
      const db = ModaDB.read();
      const store = db.stores.find(s => s.id === id || s.merchantId === id);
      if (!store) {
        res.status(404).json({ success: false, error: "Store not found." });
        return;
      }
      
      if (name) store.name = name;
      if (domain) store.domain = domain;
      if (branding) {
        store.branding = {
          ...store.branding,
          ...branding
        };
      }
      
      ModaDB.write(db);
      ModaDB.log(store.merchantId, "MERCHANT", "STORE_UPDATE", "STORE_ENGINE", `Store branding and configuration updated: ${store.id}`);
      res.json({ success: true, store });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/merchants/:id/suspend", (req, res) => {
    try {
      const { id } = req.params;
      const { suspend = true, sessionId } = req.body;
      
      const reqRole = req.headers["x-user-role"] || req.query.userRole;
      let userRole = reqRole;
      const db = ModaDB.read();
      
      const targetSessionId = (sessionId || req.headers["authorization"]) as string | undefined;
      if (targetSessionId) {
        const session = db.sessions.find(s => s.id === targetSessionId && new Date(s.expiresAt) > new Date());
        if (session) {
          const u = db.users.find(usr => usr.id === session.userId);
          if (u) {
            userRole = u.role;
          }
        }
      }

      if (userRole !== "Platform Admin") {
        res.status(403).json({ success: false, error: "Access Denied: Only Platform Admin can lock or suspend tenant directories." });
        return;
      }

      const merchant = db.merchants.find(m => m.id === id);
      if (!merchant) {
        res.status(404).json({ success: false, error: "Merchant not found." });
        return;
      }
      merchant.status = suspend ? "suspended" : "active";
      ModaDB.write(db);
      ModaDB.log("ADMIN", "SUPER_ADMIN", "MERCHANT_STATUS_SHIFT", "TENANT_ENGINE", `Merchant status set to ${merchant.status}: ${id}`);
      res.json({ success: true, merchant });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // === 4. PRODUCTS SPU & SKU CONTROLS ===
  app.get("/api/products", (req, res) => {
    try {
      const db = ModaDB.read();
      res.json({ success: true, products: db.products });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/products", (req, res) => {
    try {
      const { storeId, name, category, price, inventory, sku, image = "📦" } = req.body;
      if (!name || price === undefined) {
        res.status(400).json({ success: false, error: "Name and price are required product values." });
        return;
      }
      const db = ModaDB.read();
      const newProd = {
        id: `prod_${Math.random().toString(36).slice(2, 11)}`,
        storeId: storeId || "universal_store",
        name,
        category: category || "General",
        price: Number(price),
        inventory: Number(inventory || 100),
        sku: sku || `SKU-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        variant: {},
        images: [image],
        createdAt: new Date().toISOString()
      };
      db.products.push(newProd);
      ModaDB.write(db);
      res.status(201).json({ success: true, product: newProd });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.put("/api/products/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { name, category, price, inventory, sku, image } = req.body;
      const db = ModaDB.read();
      const prodIndex = db.products.findIndex(p => p.id === id);
      if (prodIndex === -1) {
        res.status(404).json({ success: false, error: "Product not found." });
        return;
      }
      const prod = db.products[prodIndex];
      if (name) prod.name = name;
      if (category) prod.category = category;
      if (price !== undefined) prod.price = Number(price);
      if (inventory !== undefined) prod.inventory = Number(inventory);
      if (sku) prod.sku = sku;
      if (image) prod.images = [image];
      ModaDB.write(db);
      res.json({ success: true, product: prod });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.delete("/api/products/:id", (req, res) => {
    try {
      const { id } = req.params;
      const db = ModaDB.read();
      db.products = db.products.filter(p => p.id !== id);
      ModaDB.write(db);
      res.json({ success: true, message: "Product deleted successfully." });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // === 5. ORDERS AUTOMATED DISPATCH SYSTEM ===
  app.get("/api/orders", (req, res) => {
    try {
      const db = ModaDB.read();
      res.json({ success: true, orders: db.orders });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/orders/:id", (req, res) => {
    try {
      const { id } = req.params;
      const db = ModaDB.read();
      const order = db.orders.find(o => o.id === id);
      if (!order) {
        res.status(404).json({ success: false, error: "Order not found." });
        return;
      }
      res.json({ success: true, order });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/orders", (req, res) => {
    try {
      const { userId, storeId, merchantId, items, totalPrice, orderType = "takeout", deliveryAddress } = req.body;
      if (!items || !items.length) {
        res.status(400).json({ success: false, error: "Order items sequence cannot be empty." });
        return;
      }
      const db = ModaDB.read();
      const { orderId: providedOrderId } = req.body;
      const orderId = providedOrderId || `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder = {
        id: orderId,
        userId: userId || "guest_user",
        storeId: storeId || "universal_store",
        merchantId: merchantId || "default_tenant",
        items,
        totalPrice: Number(totalPrice),
        status: "pending" as const,
        shipmentTracking: {
          carrier: "顺丰速运",
          trackingNumber: `SF${Math.floor(100000000000 + Math.random() * 900000000000)}`,
          status: "待安排快递员揽收"
        },
        createdAt: new Date().toISOString()
      };
      
      db.orders.push(newOrder);

      // Deduct product inventory dynamically (Real Inventory Check)
      items.forEach((it: any) => {
        const prod = db.products.find(p => p.id === it.productId);
        if (prod) {
          prod.inventory = Math.max(0, prod.inventory - (it.quantity || 1));
        }
      });

      ModaDB.write(db);
      ModaDB.log(userId || "GUEST", "BUYER", "ORDER_PLACED", "ORDER_ENG", `Placed order: ${orderId} total: ¥${totalPrice}`);
      res.status(201).json({ success: true, order: newOrder });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.put("/api/orders/:id/dispatch", (req, res) => {
    try {
      const { id } = req.params;
      const { status = "shipped" } = req.body;
      const db = ModaDB.read();
      const order = db.orders.find(o => o.id === id);
      if (!order) {
        res.status(404).json({ success: false, error: "Order not found." });
        return;
      }
      order.status = status;
      if (order.shipmentTracking) {
        order.shipmentTracking.status = status === "shipped" ? "顺丰专车正在飞速寄送中，预计明日送达" : "已签发妥投";
      }
      ModaDB.write(db);
      ModaDB.log("MERCHANT", "STAFF_DISPATCHER", "ORDER_DISPATCH", "ORDER_ENG", `Dispatched tracking update for: ${id} to ${status}`);
      res.json({ success: true, order });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/orders/:id/refund", (req, res) => {
    try {
      const { id } = req.params;
      const { reason = "客户申请无理由退款" } = req.body;
      const db = ModaDB.read();
      const order = db.orders.find(o => o.id === id);
      if (!order) {
        res.status(404).json({ success: false, error: "Order not found." });
        return;
      }
      order.status = "refunded";
      order.refundReason = reason;

      // Reverse revenue ledgers and create financial correction transaction
      const refundId = `PAY-REF-${Math.floor(100000 + Math.random() * 900000)}`;
      db.finance.push({
        id: refundId,
        merchantId: order.merchantId,
        type: "expense",
        amount: order.totalPrice,
        orderId: order.id,
        description: `订单退款原路退回: ${order.id}. 原因: ${reason}`,
        createdAt: new Date().toISOString()
      });

      ModaDB.write(db);
      ModaDB.log("MERCHANT", "MANAGER_REFUND", "ORDER_REFUND", "PAYMENT_ENG", `Process refund for order ${id}: ¥${order.totalPrice}`);
      res.json({ success: true, order });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // === 6. STRIPE & ALIPAY DIRECT TRANSACTIONS (WITH CALLBACK WEBHOOKS) ===
  app.post("/api/payments/stripe/checkout", async (req, res) => {
    try {
      const { orderId, amount, currency = "cny" } = req.body;
      if (!orderId || !amount) {
        res.status(400).json({ success: false, error: "OrderId and amount are required for checkout sessions." });
        return;
      }

      const stripe = getStripe();
      if (stripe) {
        // True Stripe Session execution for exact credit card processing matches
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: currency,
                product_data: {
                  name: `MODA 智体企业服务网店订单: ${orderId}`
                },
                unit_amount: Math.round(Number(amount) * 100) // stripe is in cents
              },
              quantity: 1
            }
          ],
          mode: "payment",
          success_url: `${req.headers.origin || "http://localhost:3000"}/customer-mall?success=true&order_id=${orderId}`,
          cancel_url: `${req.headers.origin || "http://localhost:3000"}/customer-mall?cancelled=true`
        });
        
        // Save the transaction record as pending
        const db = ModaDB.read();
        db.payments.push({
          id: `pay_${Math.random().toString(36).slice(2, 11)}`,
          orderId,
          amount: Number(amount),
          method: "Stripe",
          status: "pending",
          transactionId: session.id,
          createdAt: new Date().toISOString()
        });
        ModaDB.write(db);

        res.json({ success: true, url: session.url, isSimulation: false });
      } else {
        // Safe immersive high-fidelity simulation fallbacks if no API key is specified
        const mockSessionId = `cs_test_${Math.random().toString(36).slice(2, 20)}`;
        const db = ModaDB.read();
        
        db.payments.push({
          id: `pay_${Math.random().toString(36).slice(2, 11)}`,
          orderId,
          amount: Number(amount),
          method: "Stripe",
          status: "succeeded",
          transactionId: mockSessionId,
          createdAt: new Date().toISOString()
        });

        // Add to finance records simultaneously
        const order = db.orders.find(o => o.id === orderId);
        const mId = order ? order.merchantId : "default_tenant";
        db.finance.push({
          id: `FIN-${Math.floor(100000 + Math.random() * 900000)}`,
          merchantId: mId,
          type: "revenue",
          amount: Number(amount),
          orderId,
          description: `网店零售客单收款 (渠道: Stripe 快捷支付)`,
          createdAt: new Date().toISOString()
        });

        // Trigger billing log simulation (invoice dispatching)
        db.audit_logs.unshift({
          id: crypto.randomUUID ? crypto.randomUUID() : `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: "STRIPE_GATEWAY",
          username: "Stripe Webhook Listener",
          action: "INCOMING_CALLBACK",
          component: "PAYMENT_ENG",
          details: `付款回调校验成功。流水笔ID: ${mockSessionId}. 支付金额: ¥${amount}`
        });

        ModaDB.write(db);

        res.json({
          success: true,
          url: `${req.headers.origin || "http://localhost:3000"}/customer-mall?success=true&order_id=${orderId}`,
          isSimulation: true,
          message: "Stripe Sandbox Checkout Complete (Simulated callback webhook triggered instantly)"
        });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/payments/alipay/checkout", (req, res) => {
    try {
      const { orderId, amount } = req.body;
      const db = ModaDB.read();
      const mockPayId = `ALI_TX_${Math.floor(10000 + Math.random() * 90000)}`;

      db.payments.push({
        id: `pay_${Math.random().toString(36).slice(2, 11)}`,
        orderId,
        amount: Number(amount),
        method: "Alipay",
        status: "succeeded",
        transactionId: mockPayId,
        createdAt: new Date().toISOString()
      });

      const order = db.orders.find(o => o.id === orderId);
      const mId = order ? order.merchantId : "default_tenant";
      db.finance.push({
        id: `FIN-${Math.floor(100000 + Math.random() * 900000)}`,
        merchantId: mId,
        type: "revenue",
        amount: Number(amount),
        orderId,
        description: `支付宝快捷手机结账订单: ${orderId}`,
        createdAt: new Date().toISOString()
      });

      // Automatically advance order stage to processing
      if (order) {
        order.status = "processing";
        if (order.shipmentTracking) {
          order.shipmentTracking.status = "买家支付完成，系统正在自动打包准备出配";
        }
      }

      ModaDB.write(db);
      ModaDB.log("ALIPAY_SDK", "支付宝中继服务", "PAYMENT_CALLBACK", "FINANCE", `Alipay callback checkout success. Order ID: ${orderId}, txn: ${mockPayId}`);

      res.json({ success: true, txnId: mockPayId, message: "Alipay mobile layout parsed. Successful callback webhook applied." });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // === WeChat Pay (Native QR Code) ===
  app.post("/api/payments/wechat/checkout", async (req, res) => {
    try {
      const { orderId, amount } = req.body;
      if (!orderId || !amount) {
        res.status(400).json({ success: false, error: "orderId and amount are required." });
        return;
      }

      const wechatPayment = new Payment({
        partnerKey: process.env.WECHAT_API_KEY || "",
        appId: process.env.WECHAT_APP_ID || "",
        mchId: process.env.WECHAT_MCH_ID || "",
        notifyUrl: `${process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`}/api/payments/wechat/callback`
      });

      const order = {
        body: `MODAUI 订单 ${orderId}`,
        out_trade_no: orderId,
        total_fee: Math.round(Number(amount) * 100),
        spbill_create_ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        trade_type: 'NATIVE'
      };

      const response = await new Promise<any>((resolve, reject) => {
        wechatPayment.getBrandWCPayRequestParams(order, (err: any, result: any) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

      res.json({ success: true, qrCode: response.code_url || response.codeUrl || '', prepayId: response.prepay_id || response.package, data: response });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/payments/wechat/callback", wechatMiddleware({
    partnerKey: process.env.WECHAT_API_KEY || "",
    appId: process.env.WECHAT_APP_ID || "",
    mchId: process.env.WECHAT_MCH_ID || "",
    notifyUrl: `${process.env.API_BASE_URL || "http://localhost:3000"}/api/payments/wechat/callback`
  }).getNotify().done(async (message: any, req: any, res: any, next: any) => {
    const outTradeNo = message.out_trade_no;
    const transactionId = message.transaction_id;
    const totalFee = Number(message.total_fee || 0);

    const db = ModaDB.read();
    const order = db.orders.find(o => o.id === outTradeNo);
    if (order) {
      order.status = 'processing';
      if (!order.shipmentTracking) {
        order.shipmentTracking = { carrier: 'WeChatPay', trackingNumber: transactionId, status: '微信支付已确认，等待发货' };
      }
      db.payments.push({
        id: `pay_${Math.random().toString(36).slice(2, 11)}`,
        orderId: outTradeNo,
        amount: totalFee / 100,
        method: 'WeChatPay',
        status: 'succeeded',
        transactionId,
        createdAt: new Date().toISOString()
      });
      db.finance.push({
        id: `FIN-${Math.floor(100000 + Math.random() * 900000)}`,
        merchantId: order.merchantId,
        type: 'revenue',
        amount: totalFee / 100,
        orderId: outTradeNo,
        description: `微信扫码支付完成：${outTradeNo}`,
        createdAt: new Date().toISOString()
      });
      ModaDB.write(db);
    }

    res.reply('success');
  }));

  // === PayPal Checkout ===
  const payPalRestService = new PayPalService(
    process.env.PAYPAL_CLIENT_ID || '',
    process.env.PAYPAL_CLIENT_SECRET || '',
    'sandbox'
  );

  app.post("/api/payments/paypal/checkout", async (req, res) => {
    try {
      const { orderId, amount } = req.body;
      if (!orderId || !amount) {
        res.status(400).json({ success: false, error: 'orderId and amount are required.' });
        return;
      }

      // If we don't have real credentials, simulate redirect fallback loop safely
      if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        const mockApprovalToken = `EC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const mockApprovalLink = `${process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`}/api/payments/paypal/success?paymentId=PAYID-${Math.random().toString(34).substring(2, 12).toUpperCase()}&token=${mockApprovalToken}&PayerID=PAYER-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        
        // Log down pending payment in db
        const db = ModaDB.read();
        db.payments.push({
          id: `pay_${Math.random().toString(36).slice(2, 11)}`,
          orderId: orderId,
          amount: Number(amount),
          method: 'PayPal',
          status: 'pending',
          transactionId: mockApprovalToken,
          createdAt: new Date().toISOString()
        });
        ModaDB.write(db);

        res.json({ success: true, orderId: mockApprovalToken, approvalLink: mockApprovalLink });
        return;
      }

      const payment = await payPalRestService.createPayment(orderId, Number(amount), `Order payment: ${orderId}`);
      const approvalLink = payment.links?.find((l: any) => l.rel === 'approval_url')?.href;
      res.json({ success: true, orderId: payment.id, approvalLink });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/payments/paypal/success', async (req, res) => {
    try {
      const { paymentId, PayerID, token } = req.query;
      const targetPaymentId = (paymentId || token) as string;
      const targetPayerId = (PayerID || 'MOCK_PAYER_ID') as string;

      if (!targetPaymentId) {
        res.status(400).send('Missing calculation criteria or PayPal parameters');
        return;
      }

      let capturedAmount = 0.0;
      let referenceId = '';

      if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        // Local state simulation for demo mode
        const db = ModaDB.read();
        const paymentRecord = db.payments.find(p => p.transactionId === targetPaymentId || p.orderId === targetPaymentId);
        capturedAmount = paymentRecord ? paymentRecord.amount : 99.0;
        referenceId = paymentRecord ? paymentRecord.orderId : targetPaymentId;
      } else {
        const executionResult = await payPalRestService.executePayment(targetPaymentId, targetPayerId);
        capturedAmount = Number(executionResult.transactions?.[0]?.amount?.total || 0);
        referenceId = executionResult.transactions?.[0]?.invoice_number || targetPaymentId;
      }

      const db = ModaDB.read();
      let order = db.orders.find(o => o.id === referenceId);
      if (!order) {
        order = db.orders.find(o => o.id === targetPaymentId);
      }
      if (order) {
        order.status = 'processing';
        if (!order.shipmentTracking) {
          order.shipmentTracking = { carrier: 'PayPal', trackingNumber: targetPaymentId, status: 'PayPal 支付完成，等待发货' };
        }
      }

      let payment = db.payments.find(p => p.transactionId === targetPaymentId || p.orderId === referenceId);
      if (payment) {
        payment.status = 'succeeded';
        payment.amount = payment.amount || capturedAmount;
        payment.orderId = payment.orderId || referenceId;
      } else {
        db.payments.push({
          id: `pay_${Math.random().toString(36).slice(2, 11)}`,
          orderId: referenceId || targetPaymentId,
          amount: capturedAmount,
          method: 'PayPal',
          status: 'succeeded',
          transactionId: targetPaymentId,
          createdAt: new Date().toISOString()
        });
      }

      if (order) {
        db.finance.push({
          id: `FIN-${Math.floor(100000 + Math.random() * 900000)}`,
          merchantId: order.merchantId,
          type: 'revenue',
          amount: capturedAmount,
          orderId: order.id,
          description: `PayPal 交易完成：${order.id}`,
          createdAt: new Date().toISOString()
        });
      }

      ModaDB.write(db);

      // Render a premium payment success screen for interactive users inside preview frame!
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>MODAUI Payment Success</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; }
          </style>
        </head>
        <body class="bg-stone-50 min-h-screen flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-stone-100 text-center animate-fade-in">
            <div class="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
              <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"></path>
              </svg>
            </div>
            <h1 class="text-2xl font-bold text-stone-900 mb-2">支付完成并捕获</h1>
            <p class="text-stone-500 mb-6 text-sm">PayPal 智能通道已确认完成并全额结算</p>
            <div class="bg-stone-50 rounded-2xl p-4 text-left space-y-3 mb-6 text-sm">
              <div class="flex justify-between"><span class="text-stone-400">交易流水：</span><span class="font-mono text-stone-800 font-medium">${targetPaymentId}</span></div>
              <div class="flex justify-between"><span class="text-stone-400">参考商户单：</span><span class="font-mono text-stone-800 font-medium">${referenceId}</span></div>
              <div class="flex justify-between"><span class="text-stone-400">清算总额：</span><span class="font-semibold text-stone-900">$${capturedAmount.toFixed(2)} USD</span></div>
              <div class="flex justify-between"><span class="text-stone-400">核保状态：</span><span class="text-emerald-600 font-medium font-mono">Captured (succeeded)</span></div>
            </div>
            <button onclick="try { window.opener.focus(); } catch(e) {} window.close();" class="w-full py-3 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition shadow-lg shadow-stone-900/10">
              返回 MODAUI 终端
            </button>
            <p class="text-xs text-stone-400 mt-4">窗口将在片刻后自动关闭，返回后台即可刷新订单流</p>
            <script>
              setTimeout(() => {
                try { window.close(); } catch(e) {}
              }, 4000);
            </script>
          </div>
        </body>
        </html>
      `);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/payments/paypal/cancel', async (req, res) => {
    try {
      const { token } = req.query;
      if (token) {
        const db = ModaDB.read();
        const payment = db.payments.find(p => p.transactionId === token);
        if (payment) {
          payment.status = 'failed';
          ModaDB.write(db);
        }
      }
      res.json({ success: false, cancelled: true, message: 'PayPal checkout cancelled by user.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // === 7. FINANCE LEDGER & METRICS ===
  app.get("/api/finance/ledger", (req, res) => {
    try {
      const db = ModaDB.read();
      res.json({ success: true, ledger: db.finance });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // === 8. AUDIT LOGS SEARCH INDEX ===
  app.get("/api/audit/logs", (req, res) => {
    try {
      const { search, component, sessionId, userRole: queryRole } = req.query;
      const db = ModaDB.read();
      
      const reqRole = req.headers["x-user-role"] || queryRole;
      let userRole = reqRole;
      
      const targetSessionId = (sessionId || req.headers["authorization"]) as string | undefined;
      if (targetSessionId) {
        const session = db.sessions.find(s => s.id === targetSessionId && new Date(s.expiresAt) > new Date());
        if (session) {
          const u = db.users.find(usr => usr.id === session.userId);
          if (u) {
            userRole = u.role;
          }
        }
      }

      if (userRole !== "Platform Admin" && userRole !== "Merchant Owner" && userRole !== "Manager") {
        res.status(403).json({ success: false, error: "Access Denied: Insufficient permissions to read system audit trails." });
        return;
      }

      let logs = db.audit_logs;
      if (search) {
        const query = String(search).toLowerCase();
        logs = logs.filter(l => 
          l.details.toLowerCase().includes(query) || 
          l.action.toLowerCase().includes(query) || 
          l.username.toLowerCase().includes(query)
        );
      }
      if (component) {
        logs = logs.filter(l => l.component === component);
      }
      res.json({ success: true, length: logs.length, logs });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // === 9. COGNITIVE VECTOR ENGINE & SEMANTIC RAG RETRIEVER ===
  function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return normA === 0 || normB === 0 ? 0 : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async function retrieveRAGContext(queryText: string, tenantId: string): Promise<string> {
    try {
      const api = getGeminiClient();
      const embedRes = await api.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: [queryText]
      });
      const queryVector = embedRes.embeddings?.[0]?.values || (embedRes as any).embedding?.values;
      if (!queryVector) return "";

      let chunks: any[] = [];
      
      // Attempt Firestore retrieval first
      if (serverDb) {
        try {
          const colRef = firestoreCollection(serverDb, "tenants", tenantId || "default_tenant", "kb_chunks");
          const snap = await firestoreGetDocs(colRef);
          snap.forEach(docSnap => {
            const d = docSnap.data();
            if (d.vector && d.content) {
              chunks.push(d);
            }
          });
        } catch (fsErr: any) {
          console.warn("Firestore RAG chunks sync-read warning:", fsErr.message);
        }
      }

      // Fallback to local DB if Firestore has no vector embeddings yet
      if (chunks.length === 0) {
        const localDB = ModaDB.read();
        chunks = localDB.kb_chunks.filter(c => c.merchantId === tenantId && (c as any).vector);
      }

      if (chunks.length === 0) return "";

      // Score similarities
      const scored = chunks.map(c => {
        const score = cosineSimilarity(queryVector, c.vector);
        return { ...c, score };
      });

      // Sort descending and filter top matches
      const topMatches = scored
        .filter(item => item.score > 0.60)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      if (topMatches.length === 0) return "";

      console.log(`[RAG Engine] Successfully retrieved ${topMatches.length} relevant context blocks with max score of ${(topMatches[0].score * 100).toFixed(1)}%`);
      return topMatches.map((m, idx) => `[已关联商业规则 #${idx + 1}] 《${m.title}》\n真实规章条目：\n${m.content}`).join("\n\n");
    } catch (err: any) {
      console.warn("[RAG Context Retrieval warning]:", err.message);
      return "";
    }
  }

  // === 10. KNOWLEDGE BASE & EMBEDDING RAG APIS ===
  app.get("/api/knowledge", async (req, res) => {
    try {
      const tenantId = String(req.query.tenantId || "default_tenant");
      let chunks: any[] = [];
      if (serverDb) {
        try {
          const colRef = firestoreCollection(serverDb, "tenants", tenantId, "kb_chunks");
          const snap = await firestoreGetDocs(colRef);
          snap.forEach(docSnap => {
            const data = docSnap.data();
            // Prevent sending huge vector arrays unless requested to conserve pipeline speed
            chunks.push(data);
          });
        } catch (fsErr: any) {
          console.warn("Firestore read kb_chunks warning fallback to local:", fsErr.message);
        }
      }
      if (chunks.length === 0) {
        const localDB = ModaDB.read();
        chunks = localDB.kb_chunks.filter(c => c.merchantId === tenantId);
      }
      res.json({ success: true, chunks });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/knowledge/add", async (req, res) => {
    try {
      const { title, content, category, tenantId } = req.body;
      if (!title || !content || !category) {
        res.status(400).json({ success: false, error: "Missing title, content, or category." });
        return;
      }
      const activeTenant = tenantId || "default_tenant";

      // Compute embedding vector using Gemini real model
      let vector: number[] | null = null;
      let tokenCount = Math.floor(content.length * 1.3);
      try {
        const client = getGeminiClient();
        const embedRes = await client.models.embedContent({
          model: "gemini-embedding-2-preview",
          contents: [content]
        });
        vector = embedRes.embeddings?.[0]?.values || (embedRes as any).embedding?.values || null;
        console.log(`[Embedding Engine] Computed vector (dims: ${vector?.length}) for: ${title}`);
      } catch (warn: any) {
        console.warn("[Embedding Engine Warning] Failed to compute text vector embedding:", warn.message);
      }

      const chunkId = `chk_${Math.random().toString(36).slice(2, 11)}`;
      const newChunk = {
        id: chunkId,
        merchantId: activeTenant,
        title,
        content,
        tokenCount,
        category,
        vector,
        createdAt: new Date().toISOString()
      };

      // Persistence Layer 1: Local atomic write-through fallback
      const db = ModaDB.read();
      db.kb_chunks.push(newChunk);
      ModaDB.write(db);

      // Persistence Layer 2: Live Client Cloud Firestore
      if (serverDb) {
        try {
          const docRef = firestoreDoc(serverDb, "tenants", activeTenant, "kb_chunks", chunkId);
          await firestoreSetDoc(docRef, newChunk);
          console.log(`[Firestore Match] kb_chunk synced to clouds namespace tenants/${activeTenant}/kb_chunks/${chunkId}`);
        } catch (fsErr: any) {
          console.warn("Firestore sync-write warning:", fsErr.message);
        }
      }

      res.status(201).json({ success: true, chunk: newChunk });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.delete("/api/knowledge/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const tenantId = String(req.query.tenantId || "default_tenant");
      
      const db = ModaDB.read();
      db.kb_chunks = db.kb_chunks.filter(c => c.id !== id);
      ModaDB.write(db);

      if (serverDb) {
        try {
          const { deleteDoc } = await import("firebase/firestore");
          const docRef = firestoreDoc(serverDb, "tenants", tenantId, "kb_chunks", id);
          await deleteDoc(docRef);
        } catch (fsErr: any) {
          console.warn("Firestore kb_chunks item deletion failing:", fsErr.message);
        }
      }
      res.json({ success: true, message: "KB chunk removed successfully from matching sync lanes." });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Fetch all pending and processed task logs
  app.get("/api/agents/tasks", async (req, res) => {
    try {
      const tenantId = String(req.query.tenantId || "default_tenant");
      let tasks: any[] = [];
      if (serverDb) {
        try {
          const colRef = firestoreCollection(serverDb, "tenants", tenantId, "agent_tasks");
          const snap = await firestoreGetDocs(colRef);
          snap.forEach(docSnap => {
            tasks.push(docSnap.data());
          });
        } catch (fsErr: any) {
          console.warn("Firestore fetch agent tasks falled back:", fsErr.message);
        }
      }
      if (tasks.length === 0) {
        const localDB = ModaDB.read();
        tasks = localDB.agent_tasks;
      }
      // sort latest first
      tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json({ success: true, tasks });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // === 11. AGENT RUNTIME DISPATCH ENGINE & TASK SCHEDULERS (REAL FIRESTORE & DUAL SYNCED QUEUE) ===
  app.post("/api/agents/execute", async (req, res) => {
    try {
      const { agentId, teamId, inputMessage, rolePrompt, tenantId } = req.body;
      if (!agentId || !inputMessage) {
        res.status(400).json({ success: false, error: "Missing agentId or input message content." });
        return;
      }
      const activeTenant = tenantId || "default_tenant";
      const db = ModaDB.read();
      const taskId = `task_${Math.random().toString(36).slice(2, 11)}`;
      
      const newPendingTask = {
        id: taskId,
        teamId: teamId || "universal_team",
        agentId,
        inputMessage,
        status: "processing" as const,
        createdAt: new Date().toISOString()
      };
      
      db.agent_tasks.push(newPendingTask);
      ModaDB.write(db);

      // Write transaction to Firestore live tasks queue namespace
      if (serverDb) {
        try {
          const taskRef = firestoreDoc(serverDb, "tenants", activeTenant, "agent_tasks", taskId);
          await firestoreSetDoc(taskRef, newPendingTask);
        } catch (taskErr: any) {
          console.warn("Firestore task enqueue log warning:", taskErr.message);
        }
      }

      // Perform Gemini reasoning processing or offline simulation dynamically
      try {
        const client = getGeminiClient();
        
        // Retrieve context using RAG
        const retrievedRAG = await retrieveRAGContext(inputMessage, activeTenant);
        const enhancedSystemInstruction = retrievedRAG
          ? `${rolePrompt || "你是一个摩整数字员工智能工作站"}\n\n=== RAG 商业规则与规章参考 (Real Retrieve) ===\n${retrievedRAG}`
          : (rolePrompt || "你是一个摩整数字员工智能工作站");

        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: inputMessage,
          config: {
            systemInstruction: enhancedSystemInstruction,
            temperature: 0.8
          }
        });

        const reply = response.text || "已完成相应的数字流程分析并自动交付中继。";
        
        // Update task status inside local DB
        const freshDB = ModaDB.read();
        const activeTask = freshDB.agent_tasks.find(t => t.id === taskId);
        if (activeTask) {
          activeTask.status = "completed";
          activeTask.response = reply;
          activeTask.completedAt = new Date().toISOString();
        }
        ModaDB.write(freshDB);

        // Update task status inside Firestore
        if (serverDb) {
          try {
            const taskRef = firestoreDoc(serverDb, "tenants", activeTenant, "agent_tasks", taskId);
            await firestoreSetDoc(taskRef, {
              ...newPendingTask,
              status: "completed",
              response: reply,
              completedAt: new Date().toISOString()
            });
          } catch (taskErr: any) {
            console.warn("Firestore task fulfillment sync exception:", taskErr.message);
          }
        }

        res.json({ success: true, taskId, status: "completed", response: reply });
      } catch (geminiError: any) {
        console.warn("Gemini Engine runtime call fallback (applying simulated logic):", geminiError.message);
        
        const responseFallback = `[智体自主代运营中继]：已接受数据 "${inputMessage}"。已根据目前商家最合适的价格，进行一键补货，同步完成顺丰寄发。`;
        const freshDB = ModaDB.read();
        const activeTask = freshDB.agent_tasks.find(t => t.id === taskId);
        if (activeTask) {
          activeTask.status = "completed";
          activeTask.response = responseFallback;
          activeTask.completedAt = new Date().toISOString();
        }
        ModaDB.write(freshDB);

        if (serverDb) {
          try {
            const taskRef = firestoreDoc(serverDb, "tenants", activeTenant, "agent_tasks", taskId);
            await firestoreSetDoc(taskRef, {
              ...newPendingTask,
              status: "completed",
              response: responseFallback,
              completedAt: new Date().toISOString()
            });
          } catch (taskErr: any) {
            console.warn("Firestore task simulation callback exception:", taskErr.message);
          }
        }

        res.json({ success: true, taskId, status: "completed", response: responseFallback, warning: geminiError.message });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // API 2: Interactive AI Employee response dispatcher (With Full Real RAG Retrieval and Cloud Logs)
  app.post("/api/chat", async (req, res) => {
    try {
      const { 
        message, 
        employeeRole, 
        employeeName, 
        employeeDesc, 
        industryName, 
        industryTagline,
        strategyName,
        strategyDesc,
        tenantId
      } = req.body;

      if (!message) {
        res.status(400).json({ error: "Message input is required." });
        return;
      }

      const activeTenant = tenantId || "default_tenant";

      // System instruction template to give high-fidelity specialized role-playing behavior
      const systemInstruction = `你是一位高智商、极具智慧与实操执行力的数字员工（类似 Shopify Sidekick 智能伙伴）。
你的名字和岗位是：【${employeeRole} - ${employeeName}】
你目前所在的行业公司：【${industryName}】(${industryTagline})
当前公司选择的经营和运营战略：【${strategyName}】(${strategyDesc})
你的核心工作范畴：${employeeDesc}

请以此真实雇员身份，面对公司创始人（所有者，即用户）下达的指令、询问或探讨，进行专业、高效、针对性强、不拖泥带出的直接回复：
1. 语言表达：自然、沉着、带有该行当行话特色的语感。
2. 回复结构：不用客套寒暄、不要背书、也不要输出任何前置 of 助手说明文字。
3. 关键特色：紧扣行业痛点，结合当前的运营策略（精益/扩张/全权托管）来组织你的策略与态度。
4. 字数控制：保持高度凝练，并严格控制在 160 字以内，字字珠玑，突出高算力高能效。
5. **(Sidekick 后台实地执勤与微操作系统级能力)**:
作为掌握实机控制能力的 AI 面板秘书，如果创始人向你下达了“做/修改/设定/执行”等具体操作指令，你应在专业文字回复后，在文字末尾追加一串具体的物理动作标签（文字中需同步表达‘已为您自动修改并提交’或‘已极速派单’）。
动作标签格式必须为（单独紧随行尾，包含左右括号）：
- 更换网店主图标语:  [ACTION: SET_HEADLINE | 标语文字]
- 更换首页视觉主题:  [ACTION: SET_THEME | retro|dark|classic] (选择对应的主题ID)
- 研发并自动上架产品: [ACTION: ADD_PRODUCT | 商品品名 | 售价] (售价需为纯数字，如129)
- 一键完成订单自动分包并极速发顺丰快递: [ACTION: SHIP_ORDERS]
- 解决客户纠纷调停(解救李阿姨投诉): [ACTION: RESOLVE_COMPLAINT]
- 调整并更改直通车营销每日资金预算:  [ACTION: SET_BUDGET | 预算金额] (金额需为50~1000内的数字)

注意：如果用户只是闲聊或泛泛而谈，探讨经营方法，而非直接要求你操作或改动，则**绝对不能**附带任何 [ACTION] 标签。`;

      // 1. Live Semantic RAG Retrieval overlay
      const retrievedRAG = await retrieveRAGContext(message, activeTenant);
      const enhancedSystemPrompt = retrievedRAG
        ? `${systemInstruction}\n\n=== 智体匹配到的知识库商业规则 (RAG Context) ===\n${retrievedRAG}`
        : systemInstruction;

      try {
        const ai = getGeminiClient();
        
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: message,
          config: {
            systemInstruction: enhancedSystemPrompt,
            temperature: 0.85,
            topP: 0.9,
          },
        });

        const reply = response.text || "接收到了您的指示，我已经在落实相应的数字要素调整。";
        res.json({ success: true, reply, source: "Gemini Cloud Live Engine (RAG Enabled)" });
      } catch (err: any) {
        console.warn("Gemini Live server call failed, returning simulated responsive fallback:", err.message);
        
        // Simulating the AI employee offline behavior intelligently
        let simulatedReply = `你好，我是【${employeeRole} - ${employeeName}】。已收到关于商铺运作管理提案：对业务要素进行科学精算与匹配。`;
        if (message.includes("换标语") || message.includes("口号") || message.includes("修改标语")) {
          simulatedReply = `好的创始人，我正在通过 MODAUI 双向同步链路精调店招画卷。已为您自动修改并提交新标语。[ACTION: SET_HEADLINE | ${message.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "").slice(-20)}]`;
        } else if (message.includes("上架") || message.includes("研发新产品") || message.includes("上新")) {
          const matchPrice = message.match(/\d+/);
          const price = matchPrice ? Number(matchPrice[0]) : 199;
          simulatedReply = `已经调集了供应链伙伴，一键研发完成、并全额生成主页海报，已为您自动修改并提交产品正式上架出售！[ACTION: ADD_PRODUCT | AI 极智爆款好物 | ${price}]`;
        } else if (message.includes("发货") || message.includes("顺丰") || message.includes("寄送")) {
          simulatedReply = `报告掌柜！您的新单积存货栈已于1秒前自动理算，由顺丰快递派送极速打单完毕。已极速派单顺丰发运！[ACTION: SHIP_ORDERS]`;
        } else if (message.includes("投诉") || message.includes("差评") || message.includes("李阿姨")) {
          simulatedReply = `不用担心，我已联系客户进行了贴心致歉，全额退还了算力损耗，并补偿了首單专享券。投诉已顺利撤销调停！[ACTION: RESOLVE_COMPLAINT]`;
        } else if (message.includes("广告") || message.includes("预算") || message.includes("直通车")) {
          simulatedReply = `明白。现已通过精益理财层计算合理的每日竞价扣减阈值，预算已调实。[ACTION: SET_BUDGET | 350]`;
        }

        res.json({ 
          success: true, 
          source: "Simulated Offline Engine (RAG Fallback)",
          reply: simulatedReply
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // === 11. EXTENDED LLM SERVICE APIs ===
  app.post("/api/ai/openai/generate", async (req, res) => {
    try {
      const { prompt, model = "gpt-4" } = req.body;
      if (!prompt) {
        res.status(400).json({ success: false, error: "Prompt is required." });
        return;
      }
      const output = await generateWithOpenAI(prompt, model);
      res.json({ success: true, output, provider: "openai", model });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/ai/langchain/agent", async (req, res) => {
    try {
      const agent = createLangChainAgent();
      res.json({ success: true, provider: "langchain", model: "gemini-pro", status: "ready", hint: "Use this agent to orchestrate chained Gemini workflows." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/ai/ollama/generate", async (req, res) => {
    try {
      const { prompt, model = "llama2" } = req.body;
      if (!prompt) {
        res.status(400).json({ success: false, error: "Prompt is required." });
        return;
      }
      const output = await generateWithOllama(prompt, model);
      res.json({ success: true, output, provider: "ollama", model });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // === 12. DYNAMIC REAL-TIME CART ENGINE ===
  app.get("/api/cart", (req, res) => {
    try {
      const userId = String(req.query.userId || "guest_user");
      const db = ModaDB.read();
      let cart = db.carts.find(c => c.userId === userId);
      if (!cart) {
        cart = { userId, items: [], discount: 0 };
        db.carts.push(cart);
        ModaDB.write(db);
      }
      
      // Calculate subtotals based on real product price info
      let subtotal = 0;
      const details = cart.items.map(it => {
        const prod = db.products.find(p => p.id === it.productId);
        const itemPrice = prod ? prod.price : 99;
        const itemName = prod ? prod.name : "MODA精品商品";
        subtotal += itemPrice * it.quantity;
        return {
          productId: it.productId,
          name: itemName,
          price: itemPrice,
          quantity: it.quantity,
          image: prod?.images?.[0] || "https://picsum.photos/200/200"
        };
      });

      // Simple Coupon code handler
      let couponDiscount = 0;
      if (cart.coupon === "MODA99") {
        couponDiscount = 9.9;
      } else if (cart.coupon === "VIP88") {
        couponDiscount = 12.0;
      }

      const shipping = subtotal > 100 || subtotal === 0 ? 0 : 10;
      const tax = Math.round(subtotal * 0.01 * 100) / 100;
      const total = Math.max(0, subtotal - couponDiscount + shipping + tax);

      res.json({
        success: true,
        cart: {
          userId,
          items: cart.items,
          coupon: cart.coupon,
          discount: couponDiscount
        },
        calculations: {
          subtotal,
          discount: couponDiscount,
          shipping,
          tax,
          total
        },
        items: details
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/cart/add", (req, res) => {
    try {
      const { userId = "guest_user", productId, quantity = 1 } = req.body;
      if (!productId) {
        res.status(400).json({ success: false, error: "Missing Product ID parameter" });
        return;
      }
      const db = ModaDB.read();
      let cart = db.carts.find(c => c.userId === userId);
      if (!cart) {
        cart = { userId, items: [], discount: 0 };
        db.carts.push(cart);
      }

      const existingItem = cart.items.find(it => it.productId === productId);
      if (existingItem) {
        existingItem.quantity += Number(quantity);
      } else {
        cart.items.push({ productId, quantity: Number(quantity) });
      }

      ModaDB.write(db);
      res.json({ success: true, message: "Product successfully enqueued into persistent cart", cart });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/cart/remove", (req, res) => {
    try {
      const { userId = "guest_user", productId } = req.body;
      if (!productId) {
        res.status(400).json({ success: false, error: "Product ID required to execute eviction." });
        return;
      }
      const db = ModaDB.read();
      const cart = db.carts.find(c => c.userId === userId);
      if (cart) {
        cart.items = cart.items.filter(it => it.productId !== productId);
        ModaDB.write(db);
      }
      res.json({ success: true, message: "Cart item removed successfully", cart });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/cart/clear", (req, res) => {
    try {
      const { userId = "guest_user" } = req.body;
      const db = ModaDB.read();
      const cart = db.carts.find(c => c.userId === userId);
      if (cart) {
        cart.items = [];
        cart.coupon = undefined;
        ModaDB.write(db);
      }
      res.json({ success: true, message: "Cart cleared state completed successfully", cart });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // === 13. TENANTS QUOTA & METERING ADMIN API ===
  app.get("/api/tenants", (req, res) => {
    try {
      const db = ModaDB.read();
      res.json({ success: true, tenants: db.tenants });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.put("/api/tenants/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { quotaLimit, billingStatus } = req.body;
      const db = ModaDB.read();
      const tenant = db.tenants.find(t => t.id === id);
      if (!tenant) {
        res.status(404).json({ success: false, error: "Tenant not found." });
        return;
      }

      if (quotaLimit !== undefined) tenant.quotaLimit = Number(quotaLimit);
      if (billingStatus !== undefined) tenant.billingStatus = billingStatus;

      ModaDB.write(db);
      ModaDB.log("PLATFORM_ADMIN", "SAAS_CONTROLLER", "TENANT_QUOTA_UPDATE", "BILLING_SYS", `Adjusted tenant quotas and metrics: ${id}`);
      res.json({ success: true, tenant });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // === 14. GLOBAL PLATFORM SETTINGS ENGINE ===
  const PLATFORM_SETTINGS_FILE = path.resolve("data/platform_settings.json");
  const defaultSettings = {
    maintenanceMode: false,
    allowRegistration: true,
    defaultQuotaLimit: 10000,
    supportedPaymentGateways: ["Stripe", "Alipay", "WeChatPay", "PayPal"],
    activeSystemVersion: "v3.0.0 Stable Enterprise",
    aiConfig: {
      defaultModel: "gemini-3.5-flash",
      embeddingModel: "gemini-embedding-2-preview"
    }
  };

  app.get("/api/platform/settings", (req, res) => {
    try {
      if (!fs.existsSync(PLATFORM_SETTINGS_FILE)) {
        fs.mkdirSync(path.dirname(PLATFORM_SETTINGS_FILE), { recursive: true });
        fs.writeFileSync(PLATFORM_SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2), "utf-8");
        res.json({ success: true, settings: defaultSettings });
        return;
      }
      const data = JSON.parse(fs.readFileSync(PLATFORM_SETTINGS_FILE, "utf-8"));
      res.json({ success: true, settings: data });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.put("/api/platform/settings", (req, res) => {
    try {
      const currentSettings = fs.existsSync(PLATFORM_SETTINGS_FILE)
        ? JSON.parse(fs.readFileSync(PLATFORM_SETTINGS_FILE, "utf-8"))
        : defaultSettings;
      
      const updated = {
        ...currentSettings,
        ...req.body
      };

      fs.writeFileSync(PLATFORM_SETTINGS_FILE, JSON.stringify(updated, null, 2), "utf-8");
      ModaDB.log("PLATFORM_ADMIN", "PLATFORM_CORE", "UPDATE_GLOBAL_SETTINGS", "CORE_SETTINGS", "Platform global system parameters reconfigured.");
      res.json({ success: true, settings: updated });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // === 15. INDUSTRY OPERATIONS BLUEPRINT TEMPLATES MARKET ===
  const INDUSTRY_TEMPLATES = [
    {
      id: "clothing",
      name: "时尚服装 (Modern Clothing)",
      tagline: "领跑前沿，AI赋能高端服饰与跨境选品运营",
      agents: [
        { role: "AI设计师", name: "Bella", prompt: "设计引领趋势、融合经典。结合大数据智能分析最热款式与高端面料。" },
        { role: "AI商品经理", name: "Ryan", prompt: "跨境高德供应链分析，智能调整库存，监控爆单流转，推荐SKU优化款。" },
        { role: "AI运营经理", name: "David", prompt: "统筹全店铺各流程顺畅，实时监控财务漏斗，分配高并发订单出仓单。" },
        { role: "AI营销经理", name: "Zack", prompt: "自动化营销宣发，擅于书写小红书、TikTok爆款高质带货视频文案，提ROI。" }
      ]
    },
    {
      id: "catering",
      name: "餐饮外卖 (Smart Catering)",
      tagline: "极速响应，AI菜单顾问与高频配送自动控制系统",
      agents: [
        { role: "AI菜单顾问", name: "Chef Spark", prompt: "深入分析客群偏好，智能化调整推荐菜谱与时令新品推荐搭配。" },
        { role: "AI采购经理", name: "Fresh Line", prompt: "每日清晨直连产地供应链，智能控生鲜库存，缩减原材料损耗率。" },
        { role: "AI运营经理", name: "Speedy Tech", prompt: "保障多门店高频配送响应。无缝协调美团/饿了么及自有配送渠道调度。" },
        { role: "AI营销经理", name: "Flavor Bomb", prompt: "撰写让食客口齿留香的优质推送短文，定时触发秒杀及免配送费大促。" }
      ]
    },
    {
      id: "beauty",
      name: "美业沙龙 (Salon Beauty)",
      tagline: "至尊呵护，高级会员积分忠诚度与预约分配顾问",
      agents: [
        { role: "AI产品顾问", name: "Chloe", prompt: "分析敏感肤质与高端护理项目配方，提供极致个性化美容诊疗咨询建议。" },
        { role: "AI会员运营经理", name: "Loyal Heart", prompt: "管理VIP阶梯客户积分与生日特权，极大促进二次到店预约消费率。" },
        { role: "AI运营经理", name: "Style Hub", prompt: "统筹高级技师预约时段及美甲美发床位周转率，提供排班推荐。" },
        { role: "AI营销经理", name: "Glow Daily", prompt: "发掘社交媒体美容爆款话题，推出体验项目折扣券和闺蜜同行拼单包。" }
      ]
    },
    {
      id: "fitness",
      name: "运动健身 (Healthy Exercise)",
      tagline: "科学律动，AI健身课程顾问与长期活跃留存增长体系",
      agents: [
        { role: "AI课程顾问", name: "Coach Iron", prompt: "构建科学健身食谱与力量抗阻训练计划，针对减脂增肌精准推荐配餐。" },
        { role: "AI会员运营经理", name: "Active Track", prompt: "追踪会员打卡频次，发送智能化加油短信及唤醒特惠，提活跃度。" },
        { role: "AI运营经理", name: "Gym Flow", prompt: "合理调度私教空闲时段和跑度机等高端器械的使用损耗预测维护。" },
        { role: "AI营销经理", name: "Power Rush", prompt: "运营高粘性社群打卡挑战赛，激发老带新裂变转化和季卡续费折扣券。" }
      ]
    },
    {
      id: "jewelry",
      name: "高定珠宝 (Luxury Jewelry)",
      tagline: "奢华传世，大师智拟高端珠宝鉴定与高客单价值宣发",
      agents: [
        { role: "AI产品设计师", name: "Valerie", prompt: "融合复古与现代极简，提供钻石与珍稀彩色宝石款式高定推荐方案。" },
        { role: "AI采购经理", name: "Gem Origin", prompt: "寻根南非与缅甸源头，直通海关清关鉴定，安全控珍奢级物流供应链。" },
        { role: "AI运营经理", name: "Crown Keeper", prompt: "管理高价值保值保险库存，统筹超高客单鉴定回访及实名私人定制预约。" },
        { role: "AI营销经理", name: "Golden Era", prompt: "用极尽典雅的传世美学语言，输出至臻浪漫的高端求婚钻戒定制故事文案。" }
      ]
    },
    {
      id: "household",
      name: "家居生活 (Warm Furniture)",
      tagline: "温馨栖所，柔性环保家居建材选品与空间收纳顾问",
      agents: [
        { role: "AI选品顾问", name: "Monica", prompt: "提供北欧极简与侘寂美学整体家装配置配色灵感，把关材料环保评级。" },
        { role: "AI采购经理", name: "Wood Craft", prompt: "追踪大宗原木及零配件厂直发状态，预测大促备货，降低仓储物流成本。" },
        { role: "AI运营经理", name: "Logis Force", prompt: "无缝调度大件家具物流上门配送及安装师傅服务节点跟踪，优化售后体验。" },
        { role: "AI营销经理", name: "Home Sweet", prompt: "分享创意温暖家居收纳技巧，撰写种草文案拉动低频次家装复购爆单。" }
      ]
    }
  ];

  app.get("/api/templates", (req, res) => {
    res.json({ success: true, templates: INDUSTRY_TEMPLATES });
  });

  app.post("/api/templates/install", async (req, res) => {
    try {
      const { tenantId, industryId } = req.body;
      if (!tenantId || !industryId) {
        res.status(400).json({ success: false, error: "Missing parameters tenantId or industryId" });
        return;
      }
      const matched = INDUSTRY_TEMPLATES.find(t => t.id === industryId);
      if (!matched) {
        res.status(404).json({ success: false, error: "Industry blueprint template not found." });
        return;
      }

      const db = ModaDB.read();
      
      // Clear old agents inside selected team if any
      const matchedTeam = db.ai_teams.find(t => t.merchantId === tenantId);
      let teamId = matchedTeam ? matchedTeam.id : `team_${tenantId}`;
      
      if (!matchedTeam) {
        db.ai_teams.push({
          id: teamId,
          merchantId: tenantId,
          name: `${matched.name}智能团队`,
          createdAt: new Date().toISOString()
        });
      }

      db.ai_agents = db.ai_agents.filter(a => a.teamId !== teamId);

      // Deploy agents from selected templates
      matched.agents.forEach((agent, index) => {
        const agtRoleMap: Record<string, 'sales_assistant' | 'marketing_strategist' | 'support_rep' | 'inventory_manager'> = {
          "AI设计师": "sales_assistant",
          "AI产品设计师": "sales_assistant",
          "AI菜单顾问": "sales_assistant",
          "AI产品顾问": "sales_assistant",
          "AI选品顾问": "sales_assistant",
          "AI课程顾问": "sales_assistant",
          "AI采购经理": "inventory_manager",
          "AI商品经理": "inventory_manager",
          "AI会员运营经理": "support_rep",
          "AI运营经理": "support_rep",
          "AI财务主管": "support_rep",
          "AI营销经理": "marketing_strategist"
        };
        const resolvedRole = agtRoleMap[agent.role] || "support_rep";

        db.ai_agents.push({
          id: `agt_${tenantId}_installed_${index}`,
          teamId,
          name: agent.name,
          role: resolvedRole,
          systemPrompt: agent.prompt,
          status: "idle",
          memoryContext: [],
          createdAt: new Date().toISOString()
        });
      });

      ModaDB.write(db);
      ModaDB.log(tenantId, "MERCHANT", "DEPLOY_TEMPLATE", "TEMPLATE_MARKET", `Deployed ${matched.name} blueprint to merchant config.`);
      res.json({ success: true, message: `Successfully installed ${matched.name} business templates to active runtime lanes.` });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Serve static assets OR handle Vite in middleware mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AI Host Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
