import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, User, Briefcase, Zap, Star, ShieldCheck, Mail, ArrowLeft, Layers, MessageSquare, BookOpen, Activity
} from 'lucide-react';

interface AIEmployee {
  role: string;
  name: string;
  emoji: string;
  desc: string;
  status: 'active' | 'sleeping' | 'recruiting' | 'offline';
  specialty: string[];
  cognitiveWeight: string;
  promptsCount: number;
}

interface IndustryTeam {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  color: string;
  roster: AIEmployee[];
}

export default function AITeamsView({ onBackToLanding }: { onBackToLanding: () => void }) {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('fashion');

  const industryTeams: IndustryTeam[] = [
    {
      id: 'fashion',
      name: '服装行业核心团队',
      emoji: '👗',
      tagline: '专注服装公司的设计、选品、营销与运营闭环。',
      color: 'from-sky-500/20 to-indigo-500/10 border-sky-500/30',
      roster: [
        { role: 'AI设计师', name: 'Aria', emoji: '🎨', desc: '负责潮流款式设计与视觉陈列。', status: 'active', specialty: ['款式设计', '视觉搭配', '面料建议'], cognitiveWeight: 'GPT-4o', promptsCount: 12 },
        { role: 'AI采购经理', name: 'Barton', emoji: '🧵', desc: '负责供应链选品与成本控制。', status: 'active', specialty: ['供应商评估', '成本核算', 'SPU管理'], cognitiveWeight: 'Gemini 1.5', promptsCount: 9 },
        { role: 'AI运营经理', name: 'Cyrus', emoji: '📈', desc: '负责库存、促销及售后运营策略。', status: 'active', specialty: ['库存调度', '活动策划', '售后优化'], cognitiveWeight: 'Claude', promptsCount: 10 },
        { role: 'AI营销经理', name: 'Daphne', emoji: '📣', desc: '负责品牌推广与渠道投放。', status: 'active', specialty: ['社媒运营', '内容策划', '投放优化'], cognitiveWeight: 'DeepSeek', promptsCount: 14 }
      ]
    },
    {
      id: 'catering',
      name: '餐饮行业核心团队',
      emoji: '🍜',
      tagline: '专注餐饮公司的外卖、堂食与供应链事务。',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
      roster: [
        { role: 'AI菜单顾问', name: 'Kai', emoji: '🍽️', desc: '负责菜品规划、菜单组合与口味推荐。', status: 'active', specialty: ['菜品组合', '口味优化', '菜单定价'], cognitiveWeight: 'Gemini 2.0', promptsCount: 12 },
        { role: 'AI采购经理', name: 'Soren', emoji: '📦', desc: '负责原料采购、供应链与成本控制。', status: 'active', specialty: ['食材采购', '成本控制', '物料调度'], cognitiveWeight: 'GPT-4o-mini', promptsCount: 11 },
        { role: 'AI运营经理', name: 'Lulu', emoji: '📈', desc: '负责门店运营、配送与订单履约。', status: 'active', specialty: ['订单履约', '配送策略', '门店运营'], cognitiveWeight: 'DeepSeek', promptsCount: 13 },
        { role: 'AI营销经理', name: 'Mia', emoji: '📣', desc: '负责外卖拉新与本地化营销。', status: 'active', specialty: ['外卖活动', '券策略', '本地推广'], cognitiveWeight: 'Claude', promptsCount: 10 }
      ]
    },
    {
      id: 'beauty',
      name: '美业核心团队',
      emoji: '💄',
      tagline: '专注美容与美业的会员、预约与服务体验。',
      color: 'from-pink-500/20 to-rose-500/10 border-pink-500/30',
      roster: [
        { role: 'AI产品顾问', name: 'Yara', emoji: '🧴', desc: '负责产品线规划与成分建议。', status: 'active', specialty: ['产品设计', '成分研究', '项目化运营'], cognitiveWeight: 'GPT-4o', promptsCount: 10 },
        { role: 'AI会员运营经理', name: 'Iris', emoji: '🤝', desc: '负责会员体系与私域运营。', status: 'active', specialty: ['会员成长', '复购激活', '私域运营'], cognitiveWeight: 'Gemini', promptsCount: 9 },
        { role: 'AI运营经理', name: 'Cleo', emoji: '📅', desc: '负责预约、排班与到店体验。', status: 'active', specialty: ['预约管理', '排班优化', '到店转化'], cognitiveWeight: 'DeepSeek', promptsCount: 11 },
        { role: 'AI营销经理', name: 'Sage', emoji: '📣', desc: '负责口碑与渠道广告投放。', status: 'active', specialty: ['本地推广', '种草文案', '渠道投放'], cognitiveWeight: 'Claude', promptsCount: 12 }
      ]
    },
    {
      id: 'fitness',
      name: '健身行业核心团队',
      emoji: '🏋️‍♀️',
      tagline: '专注课程、教练与会员体系的健身运营。',
      color: 'from-indigo-500/20 to-sky-500/10 border-indigo-500/30',
      roster: [
        { role: 'AI课程顾问', name: 'Rey', emoji: '🧭', desc: '负责课程设计与教练协同。', status: 'active', specialty: ['课程编排', '教练匹配', '课程定价'], cognitiveWeight: 'GPT-4o', promptsCount: 10 },
        { role: 'AI会员运营经理', name: 'Nia', emoji: '🎫', desc: '负责会员转化与留存策略。', status: 'active', specialty: ['会员激活', '留存策略', '权益设计'], cognitiveWeight: 'Gemini', promptsCount: 9 },
        { role: 'AI运营经理', name: 'Cole', emoji: '📈', desc: '负责场馆运营與预约履约。', status: 'active', specialty: ['场馆排期', '预约管理', '课程履约'], cognitiveWeight: 'Claude', promptsCount: 11 },
        { role: 'AI营销经理', name: 'Lina', emoji: '📣', desc: '负责健身活动促销与品牌传播。', status: 'active', specialty: ['活动策划', '社群运营', '品牌传播'], cognitiveWeight: 'DeepSeek', promptsCount: 10 }
      ]
    },
    {
      id: 'jewelry',
      name: '珠宝行业核心团队',
      emoji: '💎',
      tagline: '专注珠宝设计、鉴定与高端运营。',
      color: 'from-amber-300/20 to-yellow-500/10 border-amber-300/30',
      roster: [
        { role: 'AI产品设计师', name: 'Celeste', emoji: '💍', desc: '负责珠宝设计與款式开发。', status: 'active', specialty: ['宝石设计', '款式CAD', '材质建议'], cognitiveWeight: 'GPT-4o', promptsCount: 12 },
        { role: 'AI采购经理', name: 'Duke', emoji: '📦', desc: '负责原料采购与鉴定流程。', status: 'active', specialty: ['供应商鉴定', '原料质量', '成本控制'], cognitiveWeight: 'Gemini', promptsCount: 9 },
        { role: 'AI运营经理', name: 'Ivy', emoji: '📈', desc: '负责高净值客户服务与售后。', status: 'active', specialty: ['VIP服务', '售后鉴定', '物流保险'], cognitiveWeight: 'Claude', promptsCount: 11 },
        { role: 'AI营销经理', name: 'Sora', emoji: '📣', desc: '负责高端品牌推广與渠道策略。', status: 'active', specialty: ['高端营销', '品牌合作', '展会策划'], cognitiveWeight: 'DeepSeek', promptsCount: 10 }
      ]
    },
    {
      id: 'home',
      name: '家居行业核心团队',
      emoji: '🏡',
      tagline: '专注家居选品、搭配与物流履约。',
      color: 'from-emerald-400/20 to-emerald-600/10 border-emerald-400/30',
      roster: [
        { role: 'AI选品顾问', name: 'Hugo', emoji: '🛋️', desc: '负责家居选品與风格搭配。', status: 'active', specialty: ['风格搭配', '家具选品', '供应链对接'], cognitiveWeight: 'GPT-4o', promptsCount: 10 },
        { role: 'AI采购经理', name: 'Maya', emoji: '📦', desc: '负责采购与物流协调。', status: 'active', specialty: ['供应商管理', '库存控制', '物流协同'], cognitiveWeight: 'Gemini', promptsCount: 9 },
        { role: 'AI运营经理', name: 'Oren', emoji: '📈', desc: '负责售后與履约优化。', status: 'active', specialty: ['履约优化', '退换货处理', '客服流程'], cognitiveWeight: 'Claude', promptsCount: 11 },
        { role: 'AI营销经理', name: 'Tess', emoji: '📣', desc: '负责内容與渠道推广。', status: 'active', specialty: ['内容营销', '渠道运营', '促销策划'], cognitiveWeight: 'DeepSeek', promptsCount: 10 }
      ]
    }
  ];

  const currentTeam = industryTeams.find(t => t.id === selectedIndustry) || industryTeams[0];

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-6 relative font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-[#2F3336] pb-6 gap-4">
          <div>
            <button 
              onClick={onBackToLanding}
              className="inline-flex items-center space-x-1 text-xs text-neutral-400 hover:text-white transition-colors py-1.5 px-3 rounded bg-neutral-900 border border-[#2F3336]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回系统控制台</span>
            </button>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display pt-3 flex items-center gap-2">
              <Users className="w-8 h-8 text-[#1D9BF0]" />
              <span>AI 团队配置管理系统 (AI Teams)</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1 font-mono tracking-wider uppercase">
              MODAUI EXPERT COLLABORATION ROSTERS • 6 VERTICAL CHANNELS
            </p>
          </div>
          
          <div className="text-xs max-w-sm text-neutral-400 leading-relaxed bg-neutral-950 p-3 rounded-lg border border-[#2F3336]">
            用户在MODAUI选中任意一个行业后，系统会在本地或Firestore数据库中自动配置该行业名下的<b>4大专属AI高智能员工</b>，24h执行业务。
          </div>
        </div>

        {/* Industry switcher */}
        <div className="flex flex-wrap gap-2.5">
          {industryTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedIndustry(team.id)}
              className={`px-4 py-2.5 rounded-lg border text-xs font-bold transition-all duration-150 flex items-center space-x-2 cursor-pointer ${
                selectedIndustry === team.id
                  ? 'border-[#1D9BF0] bg-[#1D9BF0]/10 text-white'
                  : 'border-neutral-800 bg-neutral-950 hover:border-neutral-500 text-neutral-400 hover:text-white'
              }`}
            >
              <span>{team.emoji}</span>
              <span>{team.name}</span>
            </button>
          ))}
        </div>

        {/* Selected Team Detail Panel */}
        <div className={`p-6 sm:p-8 rounded-xl border bg-gradient-to-br ${currentTeam.color} space-y-6`}>
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{currentTeam.emoji}</span>
              <h3 className="text-lg font-bold text-white">{currentTeam.name} - 岗位架构大图</h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed mt-2 max-w-3xl">
              {currentTeam.tagline}
            </p>
          </div>

          {/* Roster of 4 employees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentTeam.roster.map((emp, empIdx) => (
              <div 
                key={empIdx}
                className="p-5 rounded-lg border border-[#2F3336] bg-neutral-950/90 hover:border-neutral-700 duration-150 flex items-start space-x-4"
              >
                <div className="w-11 h-11 shrink-0 rounded-full border border-[#2F3336] bg-neutral-900 flex items-center justify-center text-xl font-bold">
                  {emp.emoji}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5 leading-none">
                        <span>{emp.role}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </h4>
                      <p className="text-[10px] text-neutral-400 mt-1 font-mono">智体名: {emp.name}</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1D9BF0]/10 text-[#1D9BF0] border border-[#1D9BF0]/20 font-mono">
                      {emp.cognitiveWeight}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
                    {emp.desc}
                  </p>

                  <div className="pt-2 border-t border-[#2F3336]/40 flex flex-wrap gap-1">
                    {emp.specialty.map((s, sIdx) => (
                      <span key={sIdx} className="text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded font-medium">
                        ✦ {s}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-neutral-500 font-mono pt-1">
                    <span>提示词上下文节点: {emp.promptsCount} 组</span>
                    <span>记忆状态: ACTIVE_LONG</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Agents Workflow Simulator Section */}
        <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-950 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#2F3336]/60">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-[#1D9BF0]" />
              <h4 className="text-xs font-bold text-white tracking-wider uppercase font-mono">智体协同协作模拟器</h4>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono font-bold">MODE: SIM_AUTO_DYNAMIC</span>
          </div>

          <div className="space-y-3 font-mono text-[11px] text-neutral-400">
            <div className="p-3.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-start space-x-3 leading-relaxed">
              <span className="text-emerald-400 shrink-0">🟢</span>
              <div>
                <span className="font-bold text-white">[时装设计师 Aria ➔ 选品商品经理 Barton]</span>
                <p className="mt-1">“检测到小红书‘呼吸感亚麻风衣’热度攀升。我已将生成的产品视觉图和打底配色包投递至你的选品池，请核算原料工厂物耗和退货运保定价规则，准备商品SPU一键发布。”</p>
              </div>
            </div>

            <div className="p-3.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-start space-x-3 leading-relaxed">
              <span className="text-sky-400 shrink-0">🔵</span>
              <div>
                <span className="font-bold text-white">[选品商品经理 Barton ➔ 跟单运营经理 Cyrus]</span>
                <p className="mt-1">“已完成 100%呼吸感亚麻风衣 的上架属性归档。首期核定成本 ¥180，售价定为 ¥680 保证毛利润。已通知后端跟单并配置首单阈值。库存警戒线目前设定为 20 件。”</p>
              </div>
            </div>

            <div className="p-3.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-start space-x-3 leading-relaxed">
              <span className="text-rose-400 shrink-0">🔴</span>
              <div>
                <span className="font-bold text-white">[跟单运营经理 Cyrus ➔ 社媒宣发运营 Daphne]</span>
                <p className="mt-1">“商品已成功录单，顺丰官方发仓揽收一件代发接口测试成功。Daphne，请依据穿搭图和成本比例，输出 3 篇小红书高佣金种草文案和抖音博主寄样投放案推进流量转化！”</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
