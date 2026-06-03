import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, ArrowRight, ArrowLeft, ShieldCheck, Mail, CheckCircle, 
  HelpCircle, Settings, Laptop, BarChart2, Network,
  ChevronLeft, ChevronRight, RotateCw, Lock 
} from 'lucide-react';
import { FlowStep, IndustryData, OperatingStrategy } from './types';
import { INDUSTRIES, OPERATING_STRATEGIES } from './data';
import LandingPage from './components/LandingPage';
import GoogleLoginModal from './components/GoogleLoginModal';
import OnboardingScreen from './components/OnboardingScreen';
import MerchantDashboard from './components/MerchantDashboard';
import CustomerStorefrontPreview from './components/CustomerStorefrontPreview';
import UnifiedArchitectureBridge from './components/UnifiedArchitectureBridge';
import AITeamsView from './components/AITeamsView';
import AIRuntimeView from './components/AIRuntimeView';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import PlatformAdminView from './components/PlatformAdminView';
import SystemBaseView from './components/SystemBaseView';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function App() {
  // Check if we are in preview mode
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isPreviewMode = urlParams?.get('preview') === 'true';

  if (isPreviewMode) {
    return <CustomerStorefrontPreview />;
  }

  const stepUrlMap: Record<FlowStep, string> = {
    LANDING: '/',
    CHOOSE_INDUSTRY: '/choose-industry',
    LOGIN: '/login',
    SELECT_MODE: '/create-strategy',
    ONBOARDING: '/onboarding',
    DASHBOARD: '/merchant-admin',
    CUSTOMER_STOREFRONT: '/customer-mall',
    AI_TEAMS: '/ai-rosters',
    AI_RUNTIME: '/ai-engine',
    KNOWLEDGE_BASE: '/knowledge-base',
    PLATFORM_ADMIN: '/platform-admin',
    SYSTEM_BASE: '/infra-base',
  };

  const getInitialStep = (): FlowStep => {
    if (typeof window === 'undefined') return 'LANDING';
    const path = window.location.pathname;
    const matches = Object.entries(stepUrlMap).find(([_, url]) => url === path);
    return matches ? (matches[0] as FlowStep) : 'LANDING';
  };

  const [step, setStep] = useState<FlowStep>(getInitialStep());
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryData>(INDUSTRIES[0]);
  const [customCompanyName, setCustomCompanyName] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<OperatingStrategy>(OPERATING_STRATEGIES[0]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'founder' | 'admin' | 'manager' | 'staff' | 'customer'>('founder');
  const [isBridgeOpen, setIsBridgeOpen] = useState(false);

  const handleUpdateRole = async (newRole: 'founder' | 'admin' | 'manager' | 'staff' | 'customer') => {
    setUserRole(newRole);
    if (auth.currentUser) {
      try {
        const { updateDoc, doc } = await import('firebase/firestore');
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, { role: newRole });
      } catch (e) {
        console.error("Error updating user role in Database:", e);
      }
    }
  };

  // Synchronize dynamic Firebase Auth user and fetch actual DB role profile
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email || 'founder@gmail.com');
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const roleVal = snap.data().role;
            if (roleVal) {
              setUserRole(roleVal);
            } else {
              setUserRole('founder');
            }
          } else {
            setUserRole('founder');
          }
        } catch (e) {
          console.error("Error reading role profile:", e);
          setUserRole('founder');
        }
      } else {
        setUserEmail('');
        setUserRole('customer'); // default base role
      }
    });
    return () => unsubscribe();
  }, []);

  // Synchronize path when step state changes
  React.useEffect(() => {
    const targetPath = stepUrlMap[step] || '/';
    if (typeof window !== 'undefined' && window.history && window.history.pushState) {
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ step }, '', targetPath);
      }
    }
  }, [step]);

  // Handle browser back and forward navigation
  React.useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.step) {
        setStep(event.state.step);
      } else {
        const path = window.location.pathname;
        const matches = Object.entries(stepUrlMap).find(([_, url]) => url === path);
        if (matches) {
          setStep(matches[0] as FlowStep);
        } else {
          setStep('LANDING');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleNavigate = (action: any) => {
    if (action.step) {
      if (action.step === 'CUSTOMER_STOREFRONT') {
        if (action.tab) {
          localStorage.setItem('customer_active_tab', action.tab);
        }
        setStep('CUSTOMER_STOREFRONT');
      } else if (action.step === 'DASHBOARD') {
        if (action.activeMenu) {
          localStorage.setItem('platform_active_menu', action.activeMenu);
        }
        setStep('DASHBOARD');
      } else {
        setStep(action.step);
      }
    }
  };

  // Trigger from Landing Hero or general click
  const handleStartFlow = (industryId?: string) => {
    if (industryId) {
      const ind = INDUSTRIES.find(i => i.id === industryId);
      if (ind) {
        setSelectedIndustry(ind);
        // Autopopulate placeholder company name styled matching industry
        setCustomCompanyName(`摩登${ind.name.slice(0, 2)} AI 有限公司`);
      }
    } else {
      setSelectedIndustry(INDUSTRIES[0]);
      setCustomCompanyName(`摩登${INDUSTRIES[0].name.slice(0, 2)} AI 有限公司`);
    }
    setStep('CHOOSE_INDUSTRY');
  };

  // Trigger from specific industry card click
  const handleSelectIndustryFromCard = (id: string) => {
    const ind = INDUSTRIES.find(i => i.id === id);
    if (ind) {
      setSelectedIndustry(ind);
      setCustomCompanyName(`摩登${ind.name.slice(0, 2)} AI 有限公司`);
      // Advance immediately to login step next in click flow
      setIsLoginOpen(true);
    }
  };

  const handleOAuthSuccess = (email: string) => {
    setUserEmail(email);
    setIsLoginOpen(false);
    setStep('SELECT_MODE');
  };

  // Custom rendering based on Step State Machine
  const stepMeta: Record<FlowStep, { path: string; name: string; tag: string }> = {
    LANDING: { path: 'modaui.com/', name: '官方首页', tag: 'PORTAL' },
    CHOOSE_INDUSTRY: { path: 'modaui.com/industry', name: '选择行业', tag: 'INDUSTRIES' },
    LOGIN: { path: 'modaui.com/login', name: '用户登录', tag: 'AUTH_GATE' },
    SELECT_MODE: { path: 'modaui.com/strategy', name: '决策配置', tag: 'STRATEGIES' },
    ONBOARDING: { path: 'modaui.com/spawn', name: '智体孵化', tag: 'INCUBATOR' },
    DASHBOARD: { path: 'modaui.com/merchant', name: '商家管理', tag: 'MERCHANT' },
    CUSTOMER_STOREFRONT: { path: 'modaui.com/mall', name: '店面交易', tag: 'BUYER_MALL' },
    AI_TEAMS: { path: 'modaui.com/rosters', name: '专家小队', tag: 'AI_ROSTERS' },
    AI_RUNTIME: { path: 'modaui.com/engine', name: '执行控制', tag: 'CR_ENGINE' },
    KNOWLEDGE_BASE: { path: 'modaui.com/knowledge', name: '知识底座', tag: 'KNOWLEDGE' },
    PLATFORM_ADMIN: { path: 'modaui.com/platform', name: '超级控制', tag: 'SUPER_SaaS' },
    SYSTEM_BASE: { path: 'modaui.com/infra', name: '系统底层', tag: 'INFRA_BASE' },
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-[#1D9BF0] selection:text-white">
      
      {/* Immersive Virtual Browser Router Bar */}
      <div className="w-full bg-[#0A0A0C]/90 backdrop-blur border-b border-[#2F3336] sticky top-0 z-50 flex items-center justify-between px-4 py-2 select-none font-sans">
        {/* Navigation & Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.history.back();
            }}
            className="p-1.5 rounded hover:bg-neutral-900 border border-transparent hover:border-neutral-850 text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="后退"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.history.forward();
            }}
            className="p-1.5 rounded hover:bg-neutral-900 border border-transparent hover:border-neutral-850 text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="前进"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.location.reload();
            }}
            className="p-1.5 rounded hover:bg-neutral-900 border border-transparent hover:border-neutral-850 text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="重新加载"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Central Address Bar Input container */}
        <div className="flex-1 max-w-lg mx-4">
          <div className="w-full bg-black/60 border border-zinc-800 rounded-lg px-3 py-1 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2 min-w-0">
              <Lock className="w-3 h-3 text-sky-400 shrink-0" />
              <div className="text-[11px] text-zinc-500 flex items-center select-all truncate">
                <span className="text-zinc-650">https://</span>
                <span className="text-[#1D9BF0] font-semibold">modaui.com</span>
                <span className="text-zinc-300">{(stepMeta[step] || stepMeta.LANDING).path.replace('modaui.com', '')}</span>
              </div>
            </div>
            <span className="text-[9px] text-emerald-500 font-bold tracking-wider shrink-0 bg-emerald-500/10 px-1 rounded">
              SECURE
            </span>
          </div>
        </div>

        {/* Right side section tag name & live indicator */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest hidden sm:inline-block">LIVE</span>
          </div>

          {/* Section badge identifier */}
          <div className="bg-[#1D9BF0]/10 border border-[#1D9BF0]/25 text-[#1D9BF0] font-mono text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
            {(stepMeta[step] || stepMeta.LANDING).tag}
          </div>
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        
        {/* Step 1: Landing Page */}
        {step === 'LANDING' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <LandingPage 
              onStartFlow={handleStartFlow} 
              onSelectIndustry={handleSelectIndustryFromCard} 
            />

            {/* Float Google Login overlay if triggered from industry card */}
            {isLoginOpen && (
              <GoogleLoginModal 
                userEmail={userEmail}
                onSuccess={handleOAuthSuccess}
                onCancel={() => setIsLoginOpen(false)}
              />
            )}
          </motion.div>
        )}

        {/* Step 2: Immersive Industry Selection Screen */}
        {step === 'CHOOSE_INDUSTRY' && (
          <motion.div
            key="choose-industry"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col justify-center items-center py-16 px-6 relative"
          >
            {/* Gritty background line grids */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />

            <div className="w-full max-w-4xl relative z-10 space-y-8">
              
              <div className="text-center space-y-2">
                <button 
                  onClick={() => setStep('LANDING')}
                  className="inline-flex items-center space-x-1 text-xs text-[#8B949E] hover:text-white transition-colors py-1.5 px-3 rounded bg-neutral-900 border border-[#2F3336]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>返回首页</span>
                </button>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display pt-2">选择行业</h2>
                <p className="text-xs text-[#8B949E] font-mono uppercase tracking-wider">选择企业方向</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {INDUSTRIES.map((ind) => (
                  <div
                    key={ind.id}
                    onClick={() => {
                      setSelectedIndustry(ind);
                      setCustomCompanyName(`摩登${ind.name.slice(0, 2)} AI 有限公司`);
                    }}
                    className={`p-5 rounded-xl border cursor-pointer duration-150 transition-all flex flex-col justify-between min-h-[14rem] ${
                      selectedIndustry.id === ind.id 
                        ? 'border-[#1D9BF0] bg-[#1D9BF0]/5 shadow-[0_0_20px_rgba(31,111,84,0.05)]' 
                        : 'border-[#2F3336] bg-neutral-950 hover:border-neutral-500'
                    }`}
                  >
                    <div className="text-2xl">{ind.emoji}</div>
                    <div className="space-y-1 mt-4">
                      <h3 className="text-xs font-bold text-white font-sans">{ind.name}</h3>
                      <p className="text-[10px] text-[#8B949E] leading-relaxed line-clamp-2">
                        {ind.tagline}
                      </p>

                      {/* Team Roster Mini-list */}
                      <div className="mt-3 pt-3 border-t border-[#2F3336]/40 space-y-1 block text-left">
                        {ind.team.map((member, mIdx) => (
                          <div key={mIdx} className="flex items-center space-x-1.5 text-[9px] leading-tight text-neutral-400">
                            <span className="shrink-0">{member.emoji}</span>
                            <span className="truncate font-sans font-medium text-neutral-300">{member.role} {member.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="bg-[#1D9BF0] hover:bg-[#38BDF8] duration-150 font-bold text-xs text-white py-3 px-8 rounded-lg flex items-center space-x-2 border border-[#1D9BF0]/30"
                >
                  <span>确认并登录</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {isLoginOpen && (
              <GoogleLoginModal 
                userEmail={userEmail}
                onSuccess={handleOAuthSuccess}
                onCancel={() => setIsLoginOpen(false)}
              />
            )}
          </motion.div>
        )}

        {/* Step 3: Select strategy & name company ("一句话创建公司") */}
        {step === 'SELECT_MODE' && (
          <motion.div
            key="select-mode"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col justify-center items-center py-16 px-6 relative"
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35 pointer-events-none" />

            <div className="w-full max-w-2xl relative z-10 bg-black border border-[#2F3336] p-6 sm:p-8 rounded-xl space-y-6 shadow-2xl">
              
              <div className="flex items-center justify-between border-b border-[#2F3336] pb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{selectedIndustry.emoji}</span>
                  <div>
                    <h2 className="text-sm font-bold text-white font-display">配置 【{selectedIndustry.name}】</h2>
                    <p className="text-[10px] text-[#8B949E] font-mono">{userEmail}</p>
                  </div>
                </div>

                <button
                  onClick={() => setStep('CHOOSE_INDUSTRY')}
                  className="text-xs text-[#8B949E] hover:text-white transition-colors"
                >
                  ← 重选行业
                </button>
              </div>

              {/* Form 1: Company Input */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8B949E] block">
                  企业名称
                </label>
                <input
                  type="text"
                  required
                  value={customCompanyName}
                  onChange={(e) => setCustomCompanyName(e.target.value)}
                  maxLength={36}
                  className="w-full bg-neutral-950 border border-[#2F3336] focus:border-[#1D9BF0] rounded-lg py-2.5 px-3.5 text-xs text-white focus:outline-none transition-colors"
                  placeholder={`例如: 摩登${selectedIndustry.name.slice(0, 2)} AI 有限公司`}
                />
                <span className="text-[10px] text-[#8B949E] block">请输入核心词</span>
              </div>

              {/* Form 2: Operating Strategy Selector */}
              <div className="space-y-3">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8B949E] block">
                  选择经营策略
                </label>
                <div className="space-y-3">
                  {OPERATING_STRATEGIES.map((strategy) => (
                    <div
                      key={strategy.id}
                      onClick={() => setSelectedStrategy(strategy)}
                      className={`p-4 rounded-xl border cursor-pointer duration-150 transition-all ${
                        selectedStrategy.id === strategy.id
                          ? 'border-[#1D9BF0] bg-[#1D9BF0]/5 shadow-inner'
                          : 'border-[#2F3336] bg-neutral-950 hover:border-neutral-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${
                            strategy.intensity === 'low' ? 'bg-zinc-400' :
                            strategy.intensity === 'medium' ? 'bg-[#1D9BF0]' :
                            'bg-[#38BDF8] animate-pulse'
                          }`} />
                          <h4 className="text-xs font-bold text-white">{strategy.name}</h4>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-[#2F3336] text-[#8B949E]">
                          {strategy.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8B949E] leading-relaxed mt-2 font-sans">
                        {strategy.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deploy Action */}
              <div className="pt-2 border-t border-[#2F3336] flex items-center justify-between">
                <p className="text-[10px] text-[#8B949E] leading-relaxed max-w-xs font-mono">
                  一键登录系统。
                </p>
                <button
                  onClick={() => setStep('ONBOARDING')}
                  disabled={!customCompanyName.trim()}
                  className={`bg-[#1D9BF0] hover:bg-[#38BDF8] active:bg-[#1A8CD8] text-white font-bold text-xs py-3 px-8 rounded-lg transition-colors border border-[#1D9BF0]/25 ${
                    !customCompanyName.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  一键登录系统
                </button>
              </div>

            </div>
          </motion.div>
        )}

        {/* Step 4: Onboarding Stream Process Animation */}
        {step === 'ONBOARDING' && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <OnboardingScreen
              industry={selectedIndustry}
              strategy={selectedStrategy}
              userEmail={userEmail}
              companyName={customCompanyName}
              onComplete={() => setStep('DASHBOARD')}
            />
          </motion.div>
        )}

        {/* Step 5: Merchant Dashboard (Merchant后台) */}
        {step === 'DASHBOARD' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MerchantDashboard
              industry={{
                ...selectedIndustry,
                name: customCompanyName || selectedIndustry.name
              }}
              strategy={selectedStrategy}
              userEmail={userEmail}
              userRole={userRole}
              onUpdateRole={setUserRole}
              onExit={async () => {
                try {
                  await signOut(auth);
                } catch (err) {
                  console.error("Error signing out:", err);
                }
                setStep('LANDING');
              }}
            />
          </motion.div>
        )}

        {/* Step 6: Customer Storefront (商家店面) */}
        {step === 'CUSTOMER_STOREFRONT' && (
          <motion.div
            key="customer-storefront"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CustomerStorefrontPreview />
          </motion.div>
        )}

        {/* Step 7: AI Teams System (AI团队系统) */}
        {step === 'AI_TEAMS' && (
          <motion.div
            key="ai-teams"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AITeamsView onBackToLanding={() => setStep('LANDING')} />
          </motion.div>
        )}

        {/* Step 8: AI Runtime Layer (AI运行层) */}
        {step === 'AI_RUNTIME' && (
          <motion.div
            key="ai-runtime"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AIRuntimeView onBackToLanding={() => setStep('LANDING')} />
          </motion.div>
        )}

        {/* Step 9: Knowledge Base System (知识库系统) */}
        {step === 'KNOWLEDGE_BASE' && (
          <motion.div
            key="knowledge-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <KnowledgeBaseView onBackToLanding={() => setStep('LANDING')} />
          </motion.div>
        )}

        {/* Step 10: Platform Admin Portal (平台总后台) */}
        {step === 'PLATFORM_ADMIN' && (
          <motion.div
            key="platform-admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PlatformAdminView 
              onBackToLanding={() => setStep('LANDING')} 
              userRole={userRole}
              onUpdateRole={handleUpdateRole}
            />
          </motion.div>
        )}

        {/* Step 11: System Base Layer (系统基础层) */}
        {step === 'SYSTEM_BASE' && (
          <motion.div
            key="system-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SystemBaseView onBackToLanding={() => setStep('LANDING')} />
          </motion.div>
        )}

      </AnimatePresence>

      {/* Universal Floating System Core Tree Trigger */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsBridgeOpen(true)}
          className="flex items-center space-x-2 px-4.5 py-3 bg-[#0A0A0C] hover:bg-neutral-900 border border-sky-500/30 hover:border-sky-400 font-mono text-xs font-bold text-sky-400 hover:text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 duration-150 cursor-pointer shadow-sky-500/5 select-none"
        >
          <Network className="w-4 h-4 text-[#1D9BF0] animate-pulse" />
          <span>MODAUI 统合核心架构树</span>
        </button>
      </div>

      <AnimatePresence>
        {isBridgeOpen && (
          <UnifiedArchitectureBridge 
            isOpen={isBridgeOpen}
            onClose={() => setIsBridgeOpen(false)}
            currentStep={step}
            onNavigate={handleNavigate}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
