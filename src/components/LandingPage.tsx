import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, ArrowRight, CheckCircle2, Clock, Hourglass, HelpCircle, Sparkles, Code 
} from 'lucide-react';
import { IndustryData, PricingPlan } from '../types';
import { INDUSTRIES, PRICING_PLANS } from '../data';

interface LandingPageProps {
  onStartFlow: (industryId?: string) => void;
  onSelectIndustry: (id: string) => void;
}

export default function LandingPage({ onStartFlow, onSelectIndustry }: LandingPageProps) {
  const [activeShowcaseId, setActiveShowcaseId] = useState('fashion');
  const selectedShowcase = INDUSTRIES.find(ind => ind.id === activeShowcaseId) || INDUSTRIES[0];

  return (
    <div className="bg-black text-[#FFFFFF] font-sans selection:bg-[#1D9BF0] selection:text-white">
      
      {/* Visual noise reduction header */}
      <nav className="border-b border-[#2F3336] bg-black/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white flex items-center justify-center rounded-sm shrink-0">
              <div className="w-5 h-5 bg-black"></div>
            </div>
            <span className="font-bold text-lg tracking-tight text-white font-display uppercase">MODA UI</span>
            <span className="text-[10px] bg-neutral-900 border border-[#2F3336] text-[#8B949E] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider hidden sm:inline-block">
              AI-EMP Network
            </span>
          </div>
          <div className="flex items-center space-x-6 text-sm font-medium text-[#8B949E]">
            <button 
              onClick={() => onStartFlow()}
              className="hover:text-white transition-colors cursor-pointer text-xs"
            >
              控制面板
            </button>
            <div className="h-4 w-[1px] bg-[#2F3336]"></div>
            <button 
              onClick={() => onStartFlow()}
              className="bg-[#1D9BF0] hover:bg-[#38BDF8] duration-150 text-white font-bold text-xs px-4 py-2 rounded-full border border-transparent shadow-md active:scale-95"
            >
              创建公司
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32 border-b border-[#2F3336]">
        {/* Gritty grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10 space-y-10">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="space-y-4"
          >
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter leading-tight italic font-display text-white">
              创建您的公司
            </h1>
            <h2 className="text-2xl sm:text-4xl font-light text-[#8B949E] tracking-tight font-display">
              AI 团队立即上岗
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[#050505] border border-[#2F3336] px-6 py-3.5 max-w-sm mx-auto rounded-lg text-xs sm:text-sm text-[#8B949E] italic font-mono"
          >
            即刻开始企业经营
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="pt-2"
          >
            <button
              onClick={() => onStartFlow()}
              className="bg-[#1D9BF0] text-white px-10 py-4 rounded-full text-lg font-bold hover:bg-[#38BDF8] transition-all transform active:scale-95 shadow-lg shadow-[#1D9BF0]/10 duration-200 flex items-center justify-center space-x-3.5 mx-auto border border-transparent"
            >
              <span>创建我的公司</span>
              <ArrowRight className="w-5 h-5 text-white/80" />
            </button>
          </motion.div>

          {/* Dots Separator Bar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs tracking-widest text-[#8B949E] uppercase font-bold font-mono pt-4"
          >
            <span>设计</span>
            <span className="text-[#2F3336]">•</span>
            <span>采购</span>
            <span className="text-[#2F3336]">•</span>
            <span>运营</span>
            <span className="text-[#2F3336]">•</span>
            <span>营销</span>
            <span className="text-[#2F3336]">•</span>
            <span>财务</span>
            <span className="text-[#2F3336]">•</span>
            <span>客服</span>
          </motion.div>

        </div>
      </section>

      {/* Screen 2: Six Major Inds Grid */}
      <section className="py-20 max-w-7xl mx-auto px-6 border-b border-[#2F3336]">
        <div className="text-center space-y-2 mb-14">
          <span className="text-xs font-mono tracking-wider text-[#1D9BF0] uppercase">行业列表</span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">选择行业</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {INDUSTRIES.map((ind, idx) => (
            <motion.div
              key={ind.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              onClick={() => onSelectIndustry(ind.id)}
              className="bg-[#050505] border border-[#2F3336] p-6 rounded-xl cursor-pointer hover:border-[#1D9BF0] hover:bg-[#1D9BF0]/5 duration-200 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3.5">
                <div className="w-12 h-12 rounded-xl bg-neutral-950 border border-[#2F3336] flex items-center justify-center text-2xl group-hover:bg-black group-hover:border-[#1D9BF0]/40 duration-200">
                  {ind.emoji}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-white duration-150 flex items-center gap-1">
                    <span>{ind.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 duration-150 text-[#1D9BF0]" />
                  </h3>
                  <p className="text-xs text-[#8B949E] leading-relaxed mt-2.5 font-sans">
                    {ind.tagline}
                  </p>

                  {/* Team Members List */}
                  <div className="mt-4 pt-4 border-t border-[#2F3336]/40 space-y-2 text-left">
                    <span className="text-[10px] font-mono tracking-wider text-[#1D9BF0]/90 block uppercase">
                      ⚓ 团队智能体名录
                    </span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-0.5">
                      {ind.team.map((member, mIdx) => (
                        <div key={mIdx} className="flex items-center space-x-1.5 text-[10px] leading-tight text-neutral-300 hover:text-white transition-colors">
                          <span className="text-xs shrink-0">{member.emoji}</span>
                          <span className="truncate font-sans font-medium text-[#c9d1d9]">{member.role} {member.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#2F3336]/60 flex items-center justify-between text-[10px] font-mono text-[#8B949E]">
                <span>团队 6 名</span>
                <span className="text-[#1D9BF0]">一键启动 →</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Screen 3: AI Team Showcase */}
      <section className="py-20 bg-neutral-950 border-b border-[#2F3336]">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-2.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">专属 AI 团队</h2>
            <p className="text-xs text-[#8B949E] font-mono uppercase tracking-widest max-w-lg mx-auto">
              全天候自适应闭环
            </p>
          </div>

          {/* Interactive Switcher */}
          <div className="flex flex-wrap justify-center gap-2.5 bg-black p-1.5 rounded-xl border border-[#2F3336] max-w-xl mx-auto">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind.id}
                onClick={() => setActiveShowcaseId(ind.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors duration-150 flex items-center space-x-1.5 ${
                  activeShowcaseId === ind.id 
                    ? 'bg-[#1D9BF0] text-white border border-[#1D9BF0]/30' 
                    : 'text-[#8B949E] hover:text-white hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <span>{ind.emoji}</span>
                <span>{ind.name}</span>
              </button>
            ))}
          </div>

          {/* 6 Grid items showcase dynamically */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {selectedShowcase.team.map((member, idx) => (
              <div 
                key={idx}
                className="bg-black border border-[#2F3336] p-5 rounded-xl space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-full bg-neutral-900 border border-[#2F3336] flex items-center justify-center text-lg">
                    {member.emoji}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-mono">{member.role}【{member.name}】</h4>
                    <span className="inline-flex items-center space-x-1.5 text-[9px] font-mono text-[#38BDF8] bg-[#1D9BF0]/10 px-2 py-0.5 rounded-full border border-[#1D9BF0]/20">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#38BDF8]"></span>
                      </span>
                      <span>待命</span>
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#8B949E] leading-relaxed">
                  {member.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Status highlight footer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-center border-t border-[#2F3336]/60 max-w-3xl mx-auto">
            <div className="p-4 bg-black border border-[#2F3336]/40 rounded-xl">
              <span className="text-xl">⏳</span>
              <h4 className="text-xs font-bold text-white mt-1.5">7×24工作</h4>
              <p className="text-[10px] text-[#8B949E] mt-0.5">全天候持续运行</p>
            </div>
            <div className="p-4 bg-black border border-[#2F3336]/40 rounded-xl">
              <span className="text-xl">👔</span>
              <h4 className="text-xs font-bold text-white mt-1.5">无需招聘</h4>
              <p className="text-[10px] text-[#8B949E] mt-0.5">一键完成部署</p>
            </div>
            <div className="p-4 bg-black border border-[#2F3336]/40 rounded-xl">
              <span className="text-xl">🧠</span>
              <h4 className="text-xs font-bold text-white mt-1.5">无需培训</h4>
              <p className="text-[10px] text-[#8B949E] mt-0.5">开箱即用模型</p>
            </div>
          </div>

        </div>
      </section>

      {/* Screen 4: Pricing Section */}
      <section className="py-20 max-w-7xl mx-auto px-6 border-b border-[#2F3336]">
        <div className="text-center space-y-2.5 mb-14">
          <span className="text-xs font-mono tracking-wider text-[#1D9BF0] uppercase">企业级套餐</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">选择最适配置</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`bg-[#09090B] border rounded-xl p-6 flex flex-col justify-between relative transition-all duration-150 ${
                plan.id === 'standard' 
                  ? 'border-[#1D9BF0] shadow-[0_0_30px_rgba(31,111,84,0.05)]' 
                  : 'border-[#2F3336]'
              }`}
            >
              {plan.id === 'standard' && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1D9BF0] text-white text-[9px] font-mono uppercase font-bold py-1 px-3 rounded-full border border-[#16503c]">
                  RECOMMENDED
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#8B949E] uppercase tracking-wider font-mono">{plan.name}</h3>
                  <div className="flex items-baseline mt-2">
                    <span className="text-3xl font-bold font-mono tracking-tight text-white">{plan.price}</span>
                    <span className="text-xs text-[#8B949E] font-mono ml-1.5">/ {plan.period}</span>
                  </div>
                  <p className="text-[11px] text-[#8B949E] mt-2 leading-relaxed">
                    {plan.desc}
                  </p>
                </div>

                <div className="w-full h-px bg-[#2F3336]" />

                <ul className="space-y-2.5">
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start text-xs text-neutral-200 leading-relaxed font-sans">
                      <span className="text-[#1D9BF0] shrink-0 mr-2 select-none">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => onStartFlow()}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all duration-150 border uppercase tracking-wider ${
                    plan.id === 'standard'
                      ? 'bg-[#1D9BF0] hover:bg-[#38BDF8] text-white border-transparent'
                      : 'bg-black hover:bg-neutral-900 text-white border-[#2F3336]'
                  }`}
                >
                  立即开始
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Screen 5: Action Steps */}
      <section className="py-20 bg-neutral-950 border-b border-[#2F3336]">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-2.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">自适应轻量启动</h2>
            <p className="text-xs text-[#8B949E] font-mono tracking-widest uppercase">极致简便</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 font-mono text-xs text-[#8B949E] relative">
            
            <div className="p-5 bg-black border border-[#2F3336] rounded-xl space-y-2.5">
              <span className="text-white text-base">01 /</span>
              <h4 className="text-white font-bold font-sans">选择行业</h4>
              <p className="text-[10px] leading-relaxed">
                定位并载入行业团队。
              </p>
            </div>

            <div className="p-5 bg-black border border-[#2F3336] rounded-xl space-y-2.5">
              <span className="text-white text-base">02 /</span>
              <h4 className="text-white font-bold font-sans">一键登录</h4>
              <p className="text-[10px] leading-relaxed">
                快捷认证与账户建立。
              </p>
            </div>

            <div className="p-4 bg-black border border-[#2F3336] rounded-xl space-y-2.5">
              <span className="text-white text-base">03 /</span>
              <h4 className="text-white font-bold font-sans">团队到岗</h4>
              <p className="text-[10px] leading-relaxed">
                模型全天候自动工作。
              </p>
            </div>

            <div className="p-4 bg-black border border-[#2F3336] rounded-xl space-y-2.5">
              <span className="text-white text-base">04 /</span>
              <h4 className="text-white font-bold font-sans">开始经营</h4>
              <p className="text-[10px] leading-relaxed">
                后台自动托管与分析。
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Screen 6: Footer */}
      <footer className="bg-black py-8 px-8 border-t border-[#2F3336] text-[10px] text-[#8B949E] tracking-widest uppercase font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex space-x-6 italic">
            <span>7x24 实时在线</span>
            <span className="text-[#2F3336]">•</span>
            <span>零招聘成本</span>
            <span className="text-[#2F3336]">•</span>
            <span>极速部署</span>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
            <span className="text-white">MODA UI © {new Date().getFullYear()}</span>
            <span className="text-[#2F3336]">|</span>
            <a href="#about" className="hover:text-white transition-colors">关于我们</a>
            <a href="#privacy" className="hover:text-white transition-colors">隐私政策</a>
            <a href="#contact" className="hover:text-white transition-colors">使用条款</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
