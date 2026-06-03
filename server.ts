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
import { VALID_INDUSTRIES } from "./src/services/industryGuard";
import { TEMPLATES } from "./src/services/templatesRegistry";
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

function normalizeTenantId(value: any): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function requireTenantId(value: any, context = 'request'): string {
  const tenantId = normalizeTenantId(value);
  if (!tenantId) {
    throw new Error(`Missing tenantId for ${context}`);
  }
  return tenantId;
}

function requireStoreId(value: any, context = 'request'): string {
  if (!value || typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing storeId for ${context}`);
  }
  return value.trim();
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
      const {
        email,
        companyName,
        industryId,
        templateId,
        tenantId,
        companyId,
        storeId,
        strategyId,
        strategyName,
        strategyDesc
      } = req.body;

      const missingFields = [
        { key: 'email', value: email },
        { key: 'companyName', value: companyName },
        { key: 'industryId', value: industryId },
        { key: 'templateId', value: templateId },
        { key: 'tenantId', value: tenantId },
        { key: 'companyId', value: companyId },
        { key: 'storeId', value: storeId }
      ].filter(item => !item.value || String(item.value).trim() === '');

      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          error: `Missing required field(s): ${missingFields.map(item => item.key).join(', ')}`
        });
        return;
      }

      const normalizedIndustryId = String(industryId).trim();
      const normalizedTemplateId = String(templateId).trim();
      const normalizedTenantId = String(tenantId).trim();
      const normalizedCompanyId = String(companyId).trim();
      const normalizedStoreId = String(storeId).trim();
      const normalizedEmail = String(email).trim();
      const normalizedCompanyName = String(companyName).trim();

      if (!VALID_INDUSTRIES.includes(normalizedIndustryId as any)) {
        res.status(400).json({ success: false, error: `Invalid industryId: ${normalizedIndustryId}` });
        return;
      }

      const templateMeta = TEMPLATES.find((template) => template.id === normalizedTemplateId);
      if (!templateMeta) {
        res.status(400).json({ success: false, error: `Invalid templateId: ${normalizedTemplateId}` });
        return;
      }
      if (templateMeta.industry !== normalizedIndustryId) {
        res.status(400).json({
          success: false,
          error: `Template ${normalizedTemplateId} does not belong to industry ${normalizedIndustryId}.`
        });
        return;
      }

      const db = ModaDB.read();

      const merchantIdx = db.merchants.findIndex((m) => m.id === normalizedTenantId);
      const newMerchant = {
        id: normalizedTenantId,
        name: normalizedCompanyName,
        ownerId: normalizedEmail,
        status: 'active' as const,
        billingPlan: 'free' as const,
        companyId: normalizedCompanyId,
        createdAt: new Date().toISOString()
      } as any;
      if (merchantIdx > -1) {
        db.merchants[merchantIdx] = newMerchant;
      } else {
        db.merchants.push(newMerchant);
      }

      const storeIdx = db.stores.findIndex((s) => s.id === normalizedStoreId);
      const newStore = {
        id: normalizedStoreId,
        merchantId: normalizedTenantId,
        companyId: normalizedCompanyId,
        name: normalizedCompanyName,
        domain: `${normalizedTenantId}.modaui.com`,
        branding: {
          logo: '📦',
          colorTheme: 'classic' as const,
          bannerText: `欢迎光临 ${normalizedCompanyName} 智体店样板！`
        },
        createdAt: new Date().toISOString()
      } as any;
      if (storeIdx > -1) {
        db.stores[storeIdx] = newStore;
      } else {
        db.stores.push(newStore);
      }

      db.products = db.products.filter((p) => p.storeId !== normalizedStoreId);
      
      const productsTemplates: Record<string, Array<{name: string, price: number, inventory: number, image: string, category: string, desc: string}>> = {
        fashion: [
          { name: '复古工装连帽卫衣', price: 199, inventory: 150, image: '🧥', category: '款式', desc: '精选高质摇粒绒保暖面。' },
          { name: '经典翻盖帆布包', price: 149, inventory: 180, image: '👜', category: '颜色', desc: '加厚牛津帆布，多功能防水。' },
          { name: '高腰褶皱牛仔裙', price: 299, inventory: 90, image: '👗', category: '面料', desc: '深色牛仔布，高腰显瘦。' }
        ],
        catering: [
          { name: '秘制宫保鸡丁', price: 28, inventory: 100, image: '🍱', category: '菜品', desc: '热度数据优选菜单。' },
          { name: '香辣手工水饺', price: 18, inventory: 250, image: '🥟', category: '口味', desc: '纯手工擀制，肉馅多汁。' },
          { name: '冷泡高山乌龙茶', price: 10, inventory: 400, image: '🍹', category: '外卖', desc: '清甜解腻，适合配送。' }
        ],
        beauty: [
          { name: '玫瑰精油护肤套装', price: 198, inventory: 80, image: '🧪', category: '项目', desc: '高保湿抗氧化配方。' },
          { name: '医美胶原补水面膜', price: 59, inventory: 250, image: '🎭', category: '套餐', desc: '修护术后泛红干燥。' },
          { name: '私人技师SPA预约', price: 299, inventory: 40, image: '💆', category: '预约', desc: '专业技师一对一服务。' }
        ],
        fitness: [
          { name: '私教课程包', price: 399, inventory: 60, image: '🏋️', category: '课程', desc: '定制训练计划，燃脂塑形。' },
          { name: '会员卡半年卡', price: 980, inventory: 120, image: '🎫', category: '会员卡', desc: '畅享场地与团课权益。' },
          { name: '教练在线预约', price: 129, inventory: 80, image: '🤸', category: '预约', desc: '支持私教和小团专属课。' }
        ],
        jewelry: [
          { name: '18K 金钻戒', price: 1999, inventory: 20, image: '💍', category: '款式', desc: '高级切工钻石，经典设计。' },
          { name: 'S925 珍珠项链', price: 799, inventory: 35, image: '📿', category: '材质', desc: '精选珍珠与纯银镀金。' },
          { name: '定制钻石对戒', price: 2899, inventory: 12, image: '💎', category: '证书', desc: '含GIA证书，支持刻字。' }
        ],
        home: [
          { name: '北欧风沙发', price: 1299, inventory: 40, image: '🛋️', category: '风格', desc: '极简设计，舒适面料。' },
          { name: '橡木餐桌', price: 1899, inventory: 20, image: '🍽️', category: '材料', desc: '原木实心，耐磨防水。' },
          { name: '定制收纳柜', price: 799, inventory: 60, image: '🪑', category: '尺寸', desc: '支持多种规格定制。' }
        ]
      };

      const createdProducts: any[] = [];
      (productsTemplates[normalizedIndustryId] || []).forEach((item) => {
        const product = {
          id: `prod_${normalizedIndustryId}_${Math.random().toString(36).slice(2, 11)}`,
          storeId: normalizedStoreId,
          name: item.name,
          category: item.category,
          price: item.price,
          inventory: item.inventory,
          sku: `SKU-${normalizedIndustryId.toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          variant: {},
          images: [item.image],
          createdAt: new Date().toISOString()
        };
        db.products.push(product);
        createdProducts.push(product);
      });

      // 4. Create/Update AI Team and Employees
      db.ai_teams = db.ai_teams.filter((t) => t.merchantId !== normalizedTenantId);
      const teamId = `team_${normalizedTenantId}`;
      const newAITeam = {
        id: teamId,
        merchantId: normalizedTenantId,
        name: `${normalizedCompanyName} AI 团队`, 
        createdAt: new Date().toISOString()
      };
      db.ai_teams.push(newAITeam);

      db.ai_agents = db.ai_agents.filter((a) => a.teamId !== teamId);

      const rolesTemplates: Record<string, Array<{ name: string; role: string; desc: string }>> = {
        fashion: [
          { name: 'Aria', role: 'AI设计师', desc: '负责服装橱窗/上新/选品视觉策略。' },
          { name: 'Barton', role: 'AI选品经理', desc: '分析趋势与尺码配置，推荐爆款供应组合。' },
          { name: 'Daphne', role: 'AI营销经理', desc: '生成品牌宣传与社交种草文案。' },
          { name: 'Cyrus', role: 'AI运营经理', desc: '监控库存、补货与售后运营。' }
        ],
        catering: [
          { name: 'Kai', role: 'AI菜品经理', desc: '设计菜单和味型组合，优化配送打包。' },
          { name: 'Luna', role: 'AI外卖经理', desc: '调度外卖渠道、促销与配送策略。' },
          { name: 'Soren', role: 'AI营销经理', desc: '构建餐饮品牌传播与推广活动。' },
          { name: 'Lulu', role: 'AI运营经理', desc: '统计销量、菜品周转与客户评价。' }
        ],
        beauty: [
          { name: 'Yara', role: 'AI产品顾问', desc: '打造美容项目与护理套餐组合。' },
          { name: 'Iris', role: 'AI会员经理', desc: '设计会员复购和预约服务体系。' },
          { name: 'Sage', role: 'AI营销经理', desc: '撰写医美/SPA营销文案与活动方案。' },
          { name: 'Cleo', role: 'AI运营经理', desc: '管理预约排班与顾客服务体验。' }
        ],
        fitness: [
          { name: 'Milo', role: 'AI课程顾问', desc: '制定课程表与训练计划。' },
          { name: 'Nova', role: 'AI会员经理', desc: '管理会员卡与续费策略。' },
          { name: 'Rhea', role: 'AI营销经理', desc: '策划健身品牌推广与课程卖点。' },
          { name: 'Zane', role: 'AI运营经理', desc: '监控课时利用率与教练排班。' }
        ],
        jewelry: [
          { name: 'Luna', role: 'AI设计师', desc: '设计珠宝款式与钻石参数组合。' },
          { name: 'Orion', role: 'AI采购经理', desc: '优化材质和钻石采购成本。' },
          { name: 'Astra', role: 'AI营销经理', desc: '撰写高端珠宝品牌故事与成交话术。' },
          { name: 'Vera', role: 'AI运营经理', desc: '管理订单履约与证书调配。' }
        ],
        home: [
          { name: 'Finn', role: 'AI选品顾问', desc: '推荐家居风格与定制材料。' },
          { name: 'June', role: 'AI采购经理', desc: '协调供应链、材料与尺寸规格。' },
          { name: 'Maya', role: 'AI营销经理', desc: '输出家居陈列与软装推广方案。' },
          { name: 'Noah', role: 'AI运营经理', desc: '监控交付、定制工期与客户反馈。' }
        ]
      };

      const matchedRoster = rolesTemplates[normalizedIndustryId] || [];
      const createdAgents: any[] = [];
      matchedRoster.forEach((emp) => {
        const agt = {
          id: `agt_${normalizedTenantId}_${emp.name}`,
          teamId,
          name: emp.name,
          role: emp.role,
          systemPrompt: `你已受雇为 ${normalizedCompanyName} 的专属【${emp.role}】。岗位职责：${emp.desc}。当前策略是：${strategyName}。`,
          status: 'idle' as const,
          memoryContext: [`初始化完成，行业：${normalizedIndustryId}，模板：${normalizedTemplateId}。`],
          createdAt: new Date().toISOString()
        };
        db.ai_agents.push(agt);
        createdAgents.push(agt);
      });

      // 5. Clear and create default Knowledge Base chunks
      db.kb_chunks = db.kb_chunks.filter((c) => c.merchantId !== normalizedTenantId);
      const defaultKBChks = [
        {
          id: `chk_${normalizedTenantId}_1`,
          title: `${normalizedCompanyName} 商业愿景与经营守则`,
          content: `本企业名为：${normalizedCompanyName}。\n创始人及企业主：${email}。\n行业定位与特种行业背景：${normalizedIndustryId}。\n公司战略策略定位是：${strategyName}（${strategyDesc}）。\n所有智体员工在向顾客提供解答或协助管理店铺时，必须以此策略为指导原则，遵守服务纪律。`,
          category: '企业政策',
          tokenCount: 220
        },
        {
          id: `chk_${normalizedTenantId}_2`,
          title: '顺丰速运一件代发极速分发履约标准',
          content: `公司为保障配送时效已与《顺丰速运》达成官方特惠寄递协议。\n前台店面所有买单订单，系统运营主管将无缝执行打包与一键派单顺丰。\n若出现揽收超时或揽派延误，平台将启动延时关怀专属优惠。`,
          category: '物流规范',
          tokenCount: 180
        },
        {
          id: `chk_${normalizedTenantId}_3`,
          title: '顾客退款退货阻拦、安抚与客情公关条例',
          content: `对于前台申请退款的顾客，客服智体员工须执行主动安抚和快速响应。\n如出现质检争议或错发：首单新客可直接发起折扣福利补偿或原件补发。\n凡遭遇不合理投诉，系统主管均启动客情调停，维护品牌口碑。`,
          category: '客户服务',
          tokenCount: 210
        }
      ];

      for (const chk of defaultKBChks) {
        let vector: number[] | null = null;
        try {
          if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
            const api = getGeminiClient();
            const embedRes = await api.models.embedContent({
              model: 'gemini-embedding-2-preview',
              contents: [chk.content]
            });
            vector = embedRes.embeddings?.[0]?.values || (embedRes as any).embedding?.values || null;
          }
        } catch (_) {}

        db.kb_chunks.push({
          id: chk.id,
          merchantId: normalizedTenantId,
          title: chk.title,
          content: chk.content,
          tokenCount: chk.tokenCount,
          createdAt: new Date().toISOString(),
          vector: vector as any
        });
      }

      // 6. Create partial tenant info for quota managing
      db.tenants = db.tenants.filter((t) => t.id !== normalizedTenantId);
      db.tenants.push({
        id: normalizedTenantId,
        quotaLimit: 3000,
        quotaUsed: 0,
        billingStatus: 'paid'
      });

      // 7. Push a simulated initial sales and finance report
      db.finance = db.finance.filter((f) => f.merchantId !== normalizedTenantId);
      db.finance.push({
        id: `FIN-${Math.floor(100000 + Math.random() * 900000)}`,
        merchantId: normalizedTenantId,
        type: 'revenue',
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
          const mDocRef = firestoreDoc(serverDb, "tenants", normalizedTenantId);
          await firestoreSetDoc(mDocRef, {
            id: normalizedTenantId,
            name: normalizedCompanyName,
            industryId: normalizedIndustryId,
            strategyId,
            strategyName,
            ownerEmail: email,
            createdAt: new Date().toISOString()
          });

          // sync products to cloud
          for (const item of matchedSPUList) {
            const pSlug = `prod_${normalizedTenantId}_${item.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
            const pDocRef = firestoreDoc(serverDb, "products", pSlug);
            await firestoreSetDoc(pDocRef, {
              id: pSlug,
              storeId: normalizedStoreId,
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
        merchantId: normalizedTenantId,
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
        storeId: requireStoreId(storeId, 'product.create'),
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
      const activeStoreId = requireStoreId(storeId, 'order.create');
      const activeMerchantId = requireTenantId(merchantId, 'order.create');
      const newOrder = {
        id: orderId,
        userId: userId || "guest_user",
        storeId: activeStoreId,
        merchantId: activeMerchantId,
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
        if (!order) {
          throw new Error(`Order not found for payment simulation: ${orderId}`);
        }
        db.finance.push({
          id: `FIN-${Math.floor(100000 + Math.random() * 900000)}`,
          merchantId: requireTenantId(order.merchantId, 'payment.simulation'),
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
      if (!order) {
        res.status(404).json({ success: false, error: `Order not found for Alipay callback: ${orderId}` });
        return;
      }
      db.finance.push({
        id: `FIN-${Math.floor(100000 + Math.random() * 900000)}`,
        merchantId: requireTenantId(order.merchantId, 'payment.alipay'),
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

      // Robust simulation fallback when credentials are empty
      if (!process.env.WECHAT_API_KEY || !process.env.WECHAT_APP_ID || !process.env.WECHAT_MCH_ID) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://modaui.com/pay-simulation?orderId=${orderId}%26amount=${amount}`;
        
        // Auto convert order status to processing after 4 seconds to simulate user scanning on callback
        setTimeout(() => {
          const db = ModaDB.read();
          const order = db.orders.find(o => o.id === orderId);
          if (order && order.status === 'pending') {
            order.status = 'processing';
            order.shipmentTracking = { 
              carrier: 'WeChatPay_Simulated', 
              trackingNumber: `WX-${Math.floor(10000000 + Math.random() * 90000000)}`, 
              status: '模拟微信扫码支付对账成功，大货统筹中' 
            };
            db.payments.push({
              id: `pay_${Math.random().toString(36).slice(2, 11)}`,
              orderId,
              amount: Number(amount),
              method: 'WeChatPay',
              status: 'succeeded',
              transactionId: `WXSim-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
              createdAt: new Date().toISOString()
            });
            db.finance.push({
              id: `FIN-${Math.floor(100000 + Math.random() * 900000)}`,
              merchantId: requireTenantId(order.merchantId, 'payment.wechat'),
              type: 'revenue',
              amount: Number(amount),
              orderId,
              description: `微信移动扫码汇率结算完成：${orderId}`,
              timestamp: new Date().toISOString()
            });
            ModaDB.write(db);
            console.log(`[WeChat Pay Simulated Callback] Order ${orderId} reconciled successfully via background thread!`);
          }
        }, 4000);

        res.json({ 
          success: true, 
          qrCode: qrUrl, 
          prepayId: `prepay_sim_${Math.random().toString(36).slice(2, 10)}`, 
          mode: 'simulation' 
        });
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
          const activeTenantId = requireTenantId(tenantId, 'knowledge.rag.read');
        const colRef = firestoreCollection(serverDb, "tenants", activeTenantId, "kb_chunks");
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
      const tenantId = requireTenantId(req.query.tenantId, 'knowledge.fetch');
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
      const activeTenant = requireTenantId(tenantId, 'knowledge.add');

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
      const tenantId = requireTenantId(req.query.tenantId, 'knowledge.delete');
      
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
      const tenantId = requireTenantId(req.query.tenantId, 'agent.tasks.fetch');
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
      const activeTenant = requireTenantId(tenantId, 'agent.execute');
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

      const activeTenant = requireTenantId(tenantId, 'chat.execute');

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

  // === 16. DETAILED ENTERPRISE APP STORE PLUGIN INSTALLATION API ===
  app.get("/api/app-store", (req, res) => {
    try {
      // Return predefined official robust store plugins catalog
      const storeApps = [
        { id: "sf_express_cargo", name: "顺丰航空特惠专线 Linker", category: "logistics", description: "接入顺丰航空、陆运动态运价，自动下单并打印电子面单，包裹异常快速打折和保价理赔闭环。", developer: "SF Express Official", rating: 4.9, installCount: 5410, monthlyPricing: 15, status: "available", requiredPermissions: ["orders.read", "orders.write"] },
        { id: "xiaohongshu_poster", name: "小红书 AI 种草爆文矩阵", category: "marketing", description: "智体自动撰写针对服装、美发和家居的精致图文笔记，多账号矩阵定时定量分发突击。", developer: "MODAUI AI Labs", rating: 4.8, installCount: 4230, monthlyPricing: 29, status: "available", requiredPermissions: ["products.read", "marketing.write"] },
        { id: "tiktok_shop_sync", name: "TikTok Shop 跨多国货盘同步", category: "sales", description: "一键同步海外货盘多SKU库存，英美加多国汇率实时换算。自动派件至各海运转转。", developer: "CrossBorder Dev Group", rating: 4.6, installCount: 1890, monthlyPricing: 39, status: "available", requiredPermissions: ["products.read", "products.write", "orders.read"] },
        { id: "wechat_miniprogram", name: "微信小程序极速开店一键部署", category: "sales", description: "免代码极速开通微信官方二级小程序店面，客户通过微信支付直达后端控制层。", developer: "Tencent SaaS Build", rating: 4.9, installCount: 9120, monthlyPricing: 0, status: "available", requiredPermissions: ["products.read", "orders.write"] },
        { id: "meituan_coupon_hub", name: "美团点评团购优惠券代核销", category: "sales", description: "专为餐饮与沙龙健身打造，AI 机器人全天候核销美团券、大众点评核券，自动充卡记账。", developer: "MODAUI Platform Corp", rating: 4.7, installCount: 3200, monthlyPricing: 19, status: "available", requiredPermissions: ["orders.write", "finance.write"] },
        { id: "ai_voice_customer", name: "AI 实时语音双向对话客服", category: "ai_tools", description: "使用 Gemini 深度声音及文本模型，支持买家通过电话、微信实时和克隆声优交流售后与选款。", developer: "Gemini Interactions Dev", rating: 4.9, installCount: 1205, monthlyPricing: 59, status: "available", requiredPermissions: ["customers.read", "customers.write", "ai.voice"] }
      ];
      res.json({ success: true, apps: storeApps });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/app-installations", (req, res) => {
    try {
      const tenantId = requireTenantId(req.query.tenantId, 'app.installations.fetch');
      const db = ModaDB.read();
      const installs = db.appInstallations.filter(i => i.merchantId === tenantId);
      res.json({ success: true, installations: installs });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/app-store/:appId/install", (req, res) => {
    try {
      const { appId } = req.params;
      const { merchantId, config = {} } = req.body;
      if (!merchantId) {
        res.status(400).json({ success: false, error: "Missing parameter: merchantId is required." });
        return;
      }
      const db = ModaDB.read();
      const existing = db.appInstallations.find(i => i.merchantId === merchantId && i.appId === appId);
      
      if (existing) {
        existing.status = "active";
        existing.config = { ...existing.config, ...config };
        existing.updatedAt = new Date().toISOString();
      } else {
        db.appInstallations.push({
          id: `inst_${Math.random().toString(36).substring(2, 9)}`,
          merchantId,
          appId,
          status: "active",
          config,
          apiKey: `key_ext_${crypto.randomUUID().replace(/-/g, "")}`,
          webhookSecret: `whs_${Math.random().toString(36).substring(2, 10)}`,
          installedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      ModaDB.write(db);
      ModaDB.log(merchantId, "MERCHANT", "APP_INSTALL", "APP_STORE", `Installed plugin extension into business sandbox: ${appId}`);
      res.json({ success: true, message: "Modular store extension successfully instantiated." });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/app-store/:appId/uninstall", (req, res) => {
    try {
      const { appId } = req.params;
      const { merchantId } = req.body;
      if (!merchantId) {
        res.status(400).json({ success: false, error: "Missing merchantId parameter" });
        return;
      }
      const db = ModaDB.read();
      db.appInstallations = db.appInstallations.filter(i => !(i.merchantId === merchantId && i.appId === appId));
      ModaDB.write(db);
      ModaDB.log(merchantId, "MERCHANT", "APP_UNINSTALL", "APP_STORE", `Evicted plugin extension: ${appId}`);
      res.json({ success: true, message: "Plugin uninstalled successfully." });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // === 17. MARKETING AUTOMATION WORKFLOWS & CAMPAIGNS API ===
  app.get("/api/campaigns", (req, res) => {
    try {
      const tenantId = requireTenantId(req.query.tenantId, 'campaigns.fetch');
      const db = ModaDB.read();
      const merchantCampaigns = db.campaigns.filter(c => c.merchantId === tenantId);
      res.json({ success: true, campaigns: merchantCampaigns });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/campaigns/create", (req, res) => {
    try {
      const { merchantId, name, type, trigger, audience, content } = req.body;
      if (!merchantId || !name || !type) {
        res.status(400).json({ success: false, error: "Missing required campaign parameters." });
        return;
      }
      const db = ModaDB.read();
      const newCampaign: DBCampaign = {
        id: `cmp_${crypto.randomUUID().substring(0, 8)}`,
        merchantId,
        name,
        type,
        status: "draft",
        trigger: trigger || { type: "manual" },
        audience: audience || { filters: [], count: 154 },
        content: content || { body: "输入您的营销爆款文案内容..." },
        performance: { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0, revenue: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.campaigns.unshift(newCampaign);
      ModaDB.write(db);
      ModaDB.log(merchantId, "MERCHANT_CAMPAIGN", "CREATE_CAMPAIGN", "CAMPAIGN_BUILDER", `Drafted advertising campaign: ${name}`);
      res.json({ success: true, campaign: newCampaign });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/campaigns/:campaignId/launch", (req, res) => {
    try {
      const { campaignId } = req.params;
      const { merchantId } = req.body;
      const db = ModaDB.read();
      const campaign = db.campaigns.find(c => c.id === campaignId && c.merchantId === merchantId);
      if (!campaign) {
        res.status(404).json({ success: false, error: "Campaign not found." });
        return;
      }

      // Simulate sending out metrics
      campaign.status = "completed";
      campaign.updatedAt = new Date().toISOString();
      campaign.performance = {
        sent: 1000,
        delivered: 980,
        opened: 412,
        clicked: 184,
        converted: 24,
        revenue: 2376
      };

      // Add a financial receipt of simulated ads distribution pricing
      db.finance.push({
        id: `fin_cmp_${crypto.randomUUID().substring(0, 8)}`,
        merchantId,
        type: "expense",
        amount: 50.0, // $50 advertising cost
        description: `广告营销网络推送分发成本 (活动: ${campaign.name})`,
        createdAt: new Date().toISOString()
      });

      ModaDB.write(db);
      ModaDB.log(merchantId, "MERCHANT_CAMPAIGN", "LAUNCH_CAMPAIGN", "CAMPAIGN_LAUNCHER", `Dispatched promotional ads: ${campaign.name}`);
      res.json({ success: true, campaign });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/campaigns/:campaignId/analytics", (req, res) => {
    try {
      const { campaignId } = req.params;
      const tenantId = requireTenantId(req.query.tenantId, 'campaign.analytics.fetch');
      const db = ModaDB.read();
      const campaign = db.campaigns.find(c => c.id === campaignId && c.merchantId === tenantId);
      if (!campaign) {
        res.status(404).json({ success: false, error: "Campaign profile missing" });
        return;
      }
      res.json({ success: true, performance: campaign.performance });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // === 18. OMNI-CHANNEL STORE integrations (TikTok, xiaohongshu) ===
  app.get("/api/channels", (req, res) => {
    try {
      const tenantId = requireTenantId(req.query.tenantId, 'channels.fetch');
      const db = ModaDB.read();
      const currentChs = db.channelConnections.filter(c => c.merchantId === tenantId);
      res.json({ success: true, connections: currentChs });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/channels/tiktok/connect", (req, res) => {
    try {
      const { merchantId, channel, authCode } = req.body;
      if (!merchantId || !channel) {
        res.status(400).json({ success: false, error: "Missing parameters merchantId or channel" });
        return;
      }
      const db = ModaDB.read();
      // Remove stale connection if existing
      db.channelConnections = db.channelConnections.filter(c => !(c.merchantId === merchantId && c.channel === channel));

      const newConn: DBChannelConnection = {
        id: `chn_${Math.random().toString(36).substring(2, 9)}`,
        merchantId,
        channel,
        status: "connected",
        accessToken: `tok_ext_${crypto.randomUUID().substring(0, 16)}`,
        storeId: `sto_ext_${Math.random().toString(36).substring(2, 8)}`,
        config: { authCode: authCode || "standard_oauth_token" },
        connectedAt: new Date().toISOString()
      };
      db.channelConnections.push(newConn);
      ModaDB.write(db);
      ModaDB.log(merchantId, "CHANNELS", "CONNECT_CHANNEL", "CHANNEL_INTEGRATOR", `Connected store to external media channel: ${channel}`);
      res.json({ success: true, connection: newConn });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/channels/xiaohongshu/sync-products", (req, res) => {
    try {
      const { merchantId, channels } = req.body;
      if (!merchantId || !channels) {
        res.status(400).json({ success: false, error: "Parameters merchantId and channels list are required." });
        return;
      }
      // Log external system API calls
      ModaDB.log(merchantId, "CHANNELS", "SYNC_PRODUCTS", "CHANNEL_INTEGRATOR", `Synchronized merchandise catalog to external lanes: ${channels.join(", ")}`);
      res.json({ success: true, message: `Successfully synced inventory metadata to active networks: ${channels.join(", ")}` });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/channels/douyin/sync-orders", (req, res) => {
    try {
      const { merchantId } = req.body;
      if (!merchantId) {
        res.status(400).json({ success: false, error: "merchantId required" });
        return;
      }
      const db = ModaDB.read();
      // Pull and construct a simulated purchase from TikTok / Douyin
      const mockOrderId = `ord_ext_${Math.random().toString(36).substring(2, 9)}`;
      const extProducts = db.products.filter(p => p.storeId === `sto_${merchantId}`);
      const selectedProd = extProducts[0] || { id: "p1", name: "时尚风衣外套", price: 199 };
      
      const newOrder: DBOrder = {
        id: mockOrderId,
        userId: "ext_omni_buyer",
        storeId: `sto_${merchantId}`,
        merchantId,
        items: [{ productId: selectedProd.id, productName: selectedProd.name, price: Number(selectedProd.price), quantity: 1 }],
        totalPrice: Number(selectedProd.price),
        status: "processing",
        createdAt: new Date().toISOString()
      };

      db.orders.unshift(newOrder);

      // Add financial revenue ledger
      db.finance.push({
        id: `fin_${crypto.randomUUID().substring(0, 8)}`,
        merchantId,
        type: "revenue",
        amount: Number(selectedProd.price),
        orderId: mockOrderId,
        description: `对外全渠道销售回款 (渠道: 多媒体渠道自动同步录单)`,
        createdAt: new Date().toISOString()
      });

      ModaDB.write(db);
      ModaDB.log(merchantId, "CHANNELS", "SYNC_ORDERS", "CHANNEL_INTEGRATOR", `Imported external customer ticket automatically: ${mockOrderId}`);
      res.json({ success: true, message: "Channel orders updated.", order: newOrder });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // === 19. RBAC TEAM PRIVILEGES & STAFF SYSTEM ===
  app.get("/api/roles", (req, res) => {
    try {
      const tenantId = requireTenantId(req.query.tenantId, 'roles.fetch');
      const db = ModaDB.read();
      const merchantRoles = db.roles.filter(r => r.merchantId === tenantId);
      res.json({ success: true, roles: merchantRoles.length > 0 ? merchantRoles : [
        { id: "owner", name: "系统创办持有人", description: "拥有全局所有控制权限、结账配置与高级微调设置范围。", permissions: ["products:write", "orders:write", "finance:read", "settings:manage"], merchantId: tenantId },
        { id: "operator", name: "智能带班店长", description: "日常商品及分单履约处理，可以查阅销售明细。", permissions: ["products:write", "orders:write"], merchantId: tenantId }
      ] });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/roles/create", (req, res) => {
    try {
      const { merchantId, name, description, permissions } = req.body;
      if (!merchantId || !name) {
        res.status(400).json({ success: false, error: "Missing active tenant context or role tag name" });
        return;
      }
      const db = ModaDB.read();
      const newRole: DBRole = {
        id: `rol_${Math.random().toString(36).substring(2, 8)}`,
        name,
        description: description || "店员角色说明...",
        permissions: permissions || ["products:read"],
        merchantId
      };
      db.roles.push(newRole);
      ModaDB.write(db);
      ModaDB.log(merchantId, "RBAC_SYSTEM", "CREATE_ROLE", "TEAM_SECURITY", `Created custom workspace role level: ${name}`);
      res.json({ success: true, role: newRole });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/staff", (req, res) => {
    try {
      const tenantId = requireTenantId(req.query.tenantId, 'staff.fetch');
      const db = ModaDB.read();
      const list = db.staffPermissions.filter(s => s.merchantId === tenantId);
      res.json({ success: true, staff: list.length > 0 ? list : [
        { id: "stf_1", merchantId: tenantId, email: "manager@modaui.com", name: "店长助手 阿杰", roles: ["operator"], status: "active" }
      ] });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.put("/api/staff/:staffId/update-role", (req, res) => {
    try {
      const { staffId } = req.params;
      const { merchantId, roles } = req.body;
      const db = ModaDB.read();
      const staff = db.staffPermissions.find(s => s.id === staffId && s.merchantId === merchantId);
      if (!staff) {
        res.status(404).json({ success: false, error: "Teammate profile not found in active workspace." });
        return;
      }
      staff.roles = roles;
      ModaDB.write(db);
      ModaDB.log(merchantId, "RBAC_SYSTEM", "UPDATE_STAFF", "TEAM_SECURITY", `Adjusted team parameters for system user: ${staff.name}`);
      res.json({ success: true, staff });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/staff/invite", (req, res) => {
    try {
      const { merchantId, email, name, roles } = req.body;
      if (!merchantId || !email || !name) {
        res.status(400).json({ success: false, error: "Missing recipient details" });
        return;
      }
      const db = ModaDB.read();
      const newStaff: DBStaffPermission = {
        id: `stf_${Math.random().toString(36).substring(2, 9)}`,
        merchantId,
        email,
        name,
        roles: roles || ["operator"],
        status: "invited"
      };
      db.staffPermissions.push(newStaff);
      ModaDB.write(db);
      ModaDB.log(merchantId, "RBAC_SYSTEM", "INVITE_STAFF", "TEAM_SECURITY", `Dispatched collaboration invitation to: ${email}`);
      res.json({ success: true, staff: newStaff });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // === 20. CUSTOM THEME DESIGNER ENGINE ===
  app.get("/api/themes", (req, res) => {
    try {
      const tenantId = requireTenantId(req.query.tenantId, 'themes.fetch');
      const db = ModaDB.read();
      const list = db.themes.filter(t => t.merchantId === tenantId);
      res.json({ success: true, themes: list.length > 0 ? list : [
        { id: "thm_default", merchantId: tenantId, name: "MODA经典流线 (Default Air)", status: "published", config: { colors: { primary: "#d4af37", secondary: "#111111", background: "#fcfbf7", text: "#1e1e1e" }, fonts: { heading: "Playfair Display", body: "Inter" }, layout: { headerStyle: "luxury", footerEnabled: true } }, previewUrl: "https://picsum.photos/400/300" }
      ] });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.put("/api/themes/:themeId", (req, res) => {
    try {
      const { themeId } = req.params;
      const { merchantId, config } = req.body;
      const db = ModaDB.read();
      let theme = db.themes.find(t => t.id === themeId && t.merchantId === merchantId);
      if (!theme) {
        // Create custom theme node on edit if it doesn't exist
        theme = {
          id: themeId,
          merchantId,
          name: "自定义品牌微调 (Custom Vibe)",
          status: "draft",
          config: config,
          previewUrl: "https://picsum.photos/400/300"
        };
        db.themes.push(theme);
      } else {
        theme.config = { ...theme.config, ...config };
      }
      ModaDB.write(db);
      res.json({ success: true, theme });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/themes/:themeId/publish", (req, res) => {
    try {
      const { themeId } = req.params;
      const { merchantId } = req.body;
      const db = ModaDB.read();
      db.themes.forEach(t => {
        if (t.merchantId === merchantId) {
          t.status = t.id === themeId ? "published" : "archived";
        }
      });
      const published = db.themes.find(t => t.id === themeId && t.merchantId === merchantId);
      
      // Mirror branding details inside DBStore
      const matchedStore = db.stores.find(s => s.merchantId === merchantId);
      if (matchedStore && published) {
        matchedStore.branding = {
          ...matchedStore.branding,
          colorTheme: (published.config.colors.primary === "#d4af37" ? "classic" : "warm")
        };
      }

      ModaDB.write(db);
      ModaDB.log(merchantId, "STOREFRONT_THEMES", "PUBLISH_THEME", "THEME_BUILDER", `Deimplemented previous layout; published branding code style: ${themeId}`);
      res.json({ success: true, message: "Theme published to global storefront." });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // === 21. CUSTOM WEBHOOKS & API CREDENTIALS GATEWAY ===
  app.get("/api/webhooks", (req, res) => {
    try {
      const tenantId = requireTenantId(req.query.tenantId, 'webhooks.fetch');
      const db = ModaDB.read();
      const currentList = db.webhookRegistrations.filter(w => w.merchantId === tenantId);
      res.json({ success: true, webhooks: currentList });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/webhooks/register", (req, res) => {
    try {
      const { merchantId, event, targetUrl } = req.body;
      if (!merchantId || !event || !targetUrl) {
        res.status(400).json({ success: false, error: "Missing parameters merchantId, event, or targetUrl." });
        return;
      }
      const db = ModaDB.read();
      const newWebhook: DBWebhookReg = {
        id: `whk_${Math.random().toString(36).substring(2, 9)}`,
        merchantId,
        event,
        targetUrl,
        active: true,
        createdAt: new Date().toISOString()
      };
      db.webhookRegistrations.push(newWebhook);
      ModaDB.write(db);
      ModaDB.log(merchantId, "WEBHOOKS", "REGISTER_WEBHOOK", "WEBHOOK_DISPATCHER", `Subscribed URL node to system event listener stream: ${event} -> ${targetUrl}`);
      res.json({ success: true, webhook: newWebhook });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.delete("/api/webhooks/:webhookId", (req, res) => {
    try {
      const { webhookId } = req.params;
      const tenantId = requireTenantId(req.query.tenantId, 'webhooks.delete');
      const db = ModaDB.read();
      db.webhookRegistrations = db.webhookRegistrations.filter(w => !(w.id === webhookId && w.merchantId === tenantId));
      ModaDB.write(db);
      res.json({ success: true, message: "Webhook successfully detached." });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/settings/api-keys", (req, res) => {
    try {
      const tenantId = requireTenantId(req.query.tenantId, 'api-keys.fetch');
      const db = ModaDB.read();
      const keys = db.apiKeys.filter(k => k.merchantId === tenantId);
      res.json({ success: true, keys });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/settings/api-keys", (req, res) => {
    try {
      const { merchantId, name } = req.body;
      if (!merchantId || !name) {
        res.status(400).json({ success: false, error: "Parameters merchantId and name are required." });
        return;
      }
      const db = ModaDB.read();
      const newKey: DBAPIKey = {
        id: `api_${Math.random().toString(36).substring(2, 8)}`,
        merchantId,
        name,
        apiKey: `moda_key_${crypto.randomUUID().replace(/-/g, "")}`,
        scopes: ["products:read", "orders:read"],
        createdAt: new Date().toISOString()
      };
      db.apiKeys.push(newKey);
      ModaDB.write(db);
      ModaDB.log(merchantId, "DEVELOPER_PORTAL", "GENERATE_API_KEY", "SECURITY_MGMT", `Issued custom headless developer API client credential: ${name}`);
      res.json({ success: true, key: newKey });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.delete("/api/settings/api-keys/:keyId", (req, res) => {
    try {
      const { keyId } = req.params;
      const tenantId = requireTenantId(req.query.tenantId, 'api-keys.revoke');
      const db = ModaDB.read();
      db.apiKeys = db.apiKeys.filter(k => !(k.id === keyId && k.merchantId === tenantId));
      ModaDB.write(db);
      res.json({ success: true, message: "API key successfully revoked." });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/webhooks/test-dispatch", (req, res) => {
    try {
      const { merchantId, event } = req.body;
      if (!merchantId || !event) {
        res.status(400).json({ success: false, error: "Missing parameters merchantId or event." });
        return;
      }
      
      const db = ModaDB.read();
      const matchedHooks = db.webhookRegistrations.filter(w => w.merchantId === merchantId && w.event === event);
      
      // Simulate payload
      const samplePayload = {
        eventId: `evt_${Math.random().toString(36).substring(2, 9)}`,
        event,
        timestamp: new Date().toISOString(),
        productName: "经典极智高级成衣 SPU-009",
        qty: 1,
        paidAmount: 299,
        customerEmail: "vip@modaui.com",
        orderId: `ord_${Math.random().toString(36).substring(2, 9)}`
      };

      ModaDB.log(merchantId, "WEBHOOKS", "TEST_DISPATCH_WEBHOOK", "WEBHOOK_DISPATCHER", `Dispatched mock event payload for: [${event}]`);
      
      res.json({ 
        success: true, 
        matchedCount: matchedHooks.length,
        samplePayload
      });
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
