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
        { role: 'AI设计师', name: 'Aria', emoji: '🎨', desc: '负责潮流款式设计、视觉陈列与新品搭配。', status: 'active', specialty: ['流行趋势提炼', '款式画稿生成', '线上视觉排版'], cognitiveWeight: 'GPT-4o / Gemini-2.0', promptsCount: 14 },
        { role: 'AI选品经理', name: 'Barton', emoji: '🧵', desc: '负责样衣打版选品、成本测算与爆款监控。', status: 'active', specialty: ['热销款分析', '工厂拿货评估', 'SPU分类管理'], cognitiveWeight: 'Gemini 1.5 Pro', promptsCount: 8 },
        { role: 'AI营销经理', name: 'Daphne', emoji: '📣', desc: '负责穿搭种草、社媒内容与投放策略。', status: 'active', specialty: ['小红书种草文案', '短视频脚本', '渠道投流优化'], cognitiveWeight: 'DeepSeek-V3', promptsCount: 22 },
        { role: 'AI运营经理', name: 'Cyrus', emoji: '📈', desc: '负责库存分配、促销排期与售后运营。', status: 'active', specialty: ['库存调度', '活动排期', '售后引导'], cognitiveWeight: 'Claude 3.5 Sonnet', promptsCount: 19 }
      ]
    },
    {
      id: 'catering',
      name: '餐饮行业核心团队',
      emoji: '🍜',
      tagline: '专注餐饮公司的外卖、堂食、供应与运营。',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
      roster: [
        { role: 'AI外卖经理', name: 'Kai', emoji: '🛵', desc: '负责外卖转化、满减策略与配送节奏。', status: 'active', specialty: ['外卖券策划', '配送节奏优化', '平台活动运营'], cognitiveWeight: 'Gemini 2.0 Flash', promptsCount: 11 },
        { role: 'AI大堂经理', name: 'Ren', emoji: '🍽️', desc: '负责堂食点单、菜品推荐与现场服务设计。', status: 'active', specialty: ['菜品推荐优化', '点单界面设计', '堂食布局配置'], cognitiveWeight: 'Gemini 1.5 Pro', promptsCount: 6 },
        { role: 'AI仓库经理', name: 'Soren', emoji: '📦', desc: '负责食材采购、库存补货与物料周转。', status: 'active', specialty: ['食材成本核算', '库存红线告警', '物料供应调度'], cognitiveWeight: 'GPT-4o-mini', promptsCount: 15 },
        { role: 'AI运营经理', name: 'Lulu', emoji: '📈', desc: '负责门店运营、财务结算与客户反馈闭环。', status: 'active', specialty: ['运营数据监控', '订单结算', '服务质量回收'], cognitiveWeight: 'DeepSeek-R1', promptsCount: 25 }
      ]
    },
    {
      id: 'retail',
      name: '百货零售核心团队',
      emoji: '🏪',
      tagline: '专注百货零售的选品、库存、营销与运营。',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
      roster: [
        { role: 'AI选品经理', name: 'Vara', emoji: '🎒', desc: '负责百货品类筛选与爆款结构分析。', status: 'active', specialty: ['品类筛选', '竞品价效分析', 'SKU组合设计'], cognitiveWeight: 'Gemini 2.0 Flash', promptsCount: 9 },
        { role: 'AI库存经理', name: 'Dax', emoji: '📦', desc: '负责库存预警、补货策略与仓储分配。', status: 'active', specialty: ['库存波动分析', '补货计划', '仓储成本控制'], cognitiveWeight: 'Claude 3.5 Sonnet', promptsCount: 12 },
        { role: 'AI营销经理', name: 'Nova', emoji: '📣', desc: '负责促销计划、直通车投放与社群运营。', status: 'active', specialty: ['直通车预算', '社群裂变', '大促文案'], cognitiveWeight: 'DeepSeek-V3', promptsCount: 21 },
        { role: 'AI运营经理', name: 'Tate', emoji: '📈', desc: '负责订单履约、退换货与多渠道铺货。', status: 'active', specialty: ['订单履约', '退换货处理', '渠道同步'], cognitiveWeight: 'GPT-4o', promptsCount: 20 }
      ]
    },
    {
      id: 'beauty',
      name: '美业核心团队',
      emoji: '💄',
      tagline: '专注美业公司的产品、客户、营销与预约。',
      color: 'from-pink-500/20 to-rose-500/10 border-pink-500/30',
      roster: [
        { role: 'AI产品经理', name: 'Yara', emoji: '🧴', desc: '负责美容产品设计、成分规划与项目化运营。', status: 'active', specialty: ['产品规划', '成分研究', '服务组合设计'], cognitiveWeight: 'GPT-4o', promptsCount: 10 },
        { role: 'AI客户经理', name: 'Iris', emoji: '🤝', desc: '负责私域客户关系、会员留存与复购激活。', status: 'active', specialty: ['会员管理', '客户留存', '复购促活'], cognitiveWeight: 'Gemini 1.5 Pro', promptsCount: 7 },
        { role: 'AI营销经理', name: 'Sage', emoji: '📣', desc: '负责推广活动、口碑种草与渠道引流。', status: 'active', specialty: ['本地推广', '私域话术', '种草文案'], cognitiveWeight: 'Claude 3.5 Sonnet', promptsCount: 16 },
        { role: 'AI预约经理', name: 'Cleo', emoji: '📅', desc: '负责疗程预约、客流错峰与排班优化。', status: 'active', specialty: ['预约排班', '错峰调度', '到店转化'], cognitiveWeight: 'DeepSeek-R1', promptsCount: 18 }
      ]
    },
    {
      id: 'hotel',
      name: '酒店民宿核心团队',
      emoji: '🏨',
      tagline: '专注酒店民宿的前台、客房、收益与运营。',
      color: 'from-blue-500/20 to-sky-500/10 border-blue-500/30',
      roster: [
        { role: 'AI前台经理', name: 'Noel', emoji: '🛎️', desc: '负责房态管理、客户接待与预订问答。', status: 'active', specialty: ['房态同步', '预订确认', '客户礼宾'], cognitiveWeight: 'GPT-4o-mini', promptsCount: 12 },
        { role: 'AI客房经理', name: 'Pace', emoji: '🧹', desc: '负责客房清洁调度、物料补货与入住准备。', status: 'active', specialty: ['保洁排程', '物料补给', '服务标准化'], cognitiveWeight: 'Claude 3.5 Sonnet', promptsCount: 13 },
        { role: 'AI收益经理', name: 'Kira', emoji: '💸', desc: '负责动态定价、收益分析与渠道分配。', status: 'active', specialty: ['房价策略', '收益优化', '渠道排期'], cognitiveWeight: 'Gemini 1.5 Pro', promptsCount: 11 },
        { role: 'AI运营经理', name: 'Bella', emoji: '📊', desc: '负责入住运营、客诉修复与订单监控。', status: 'active', specialty: ['入住协调', '客诉处理', '运营报表'], cognitiveWeight: 'DeepSeek-V3', promptsCount: 15 }
      ]
    },
    {
      id: 'creator',
      name: '电商网红核心团队',
      emoji: '📱',
      tagline: '专注网红电商的选品、内容、直播与运营。',
      color: 'from-purple-500/20 to-violet-500/10 border-purple-500/30',
      roster: [
        { role: 'AI选品经理', name: 'Giles', emoji: '🛍️', desc: '负责带货选品、爆款结构与成本控价。', status: 'active', specialty: ['爆品选品', '成本核算', '价效对比'], cognitiveWeight: 'Gemini 1.5 Pro', promptsCount: 12 },
        { role: 'AI内容经理', name: 'Mercedes', emoji: '📝', desc: '负责内容脚本、短视频文案与账号调性。', status: 'active', specialty: ['脚本撰写', '内容创意', '账号定位'], cognitiveWeight: 'GPT-4o', promptsCount: 14 },
        { role: 'AI直播经理', name: 'Kellan', emoji: '🎙️', desc: '负责直播话术、场控与转化策略。', status: 'active', specialty: ['直播话术', '场控策略', '互动留存'], cognitiveWeight: 'DeepSeek-V3', promptsCount: 18 },
        { role: 'AI运营经理', name: 'Sylvia', emoji: '📈', desc: '负责数据分析、订单跟进与售后闭环。', status: 'active', specialty: ['转化分析', '订单跟踪', '售后复盘'], cognitiveWeight: 'Claude 3.5 Sonnet', promptsCount: 16 }
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
