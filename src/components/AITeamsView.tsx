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
      name: '服装快反智体团队',
      emoji: '👗',
      tagline: '重组季度潮流趋势预测，打样成本核算，一件分销代揽配发，以及小红书裂变种草文案输出。',
      color: 'from-sky-500/20 to-indigo-500/10 border-sky-500/30',
      roster: [
        { role: 'AI设计师 Aria', name: 'Aria', emoji: '🎨', desc: '主策划线上微店视觉陈列、Banner促销版面和潮流单品穿搭海报设计。', status: 'active', specialty: ['线上橱窗搭配', '品牌形象设计', '穿搭海报生成'], cognitiveWeight: 'GPT-4o / Gemini-2.0', promptsCount: 14 },
        { role: 'AI采购经理 Barton', name: 'Barton', emoji: '👚', desc: '潮流热度数据抓取与款式红线采购、快反供应商订单排单、SPU自动分类上架。', status: 'active', specialty: ['快反仓储配比', '新品趋势抓取', '售价精算体系'], cognitiveWeight: 'Gemini 1.5 Pro', promptsCount: 8 },
        { role: 'AI运营经理 Cyrus', name: 'Cyrus', emoji: '📈', desc: '打单并发运顺丰物流官方揽件，监控进销存异常、拦截不合理退换安抚。', status: 'active', specialty: ['顺丰一键履约', '库存红线告警', '售后金流退还'], cognitiveWeight: 'Claude 3.5 Sonnet', promptsCount: 19 },
        { role: 'AI营销经理 Daphne', name: 'Daphne', emoji: '📣', desc: '输出高点击率小红书种草文、抖音开箱起播视频脚本、招募优质分销KOL博主。', status: 'active', specialty: ['小红书穿搭推荐', '短视频脚本输出', '博主派样寄样'], cognitiveWeight: 'DeepSeek-V3', promptsCount: 22 },
        { role: 'AI财务主管 Fiona', name: 'Fiona', emoji: '🧮', desc: '每日自动对账、微信/Stripe损益核算、算力消耗计费以及营销投流ROI损溢分析。', status: 'active', specialty: ['自动资金核销', 'API算力损耗精算', '毛利润变动模型'], cognitiveWeight: 'DeepSeek-R1', promptsCount: 15 },
        { role: 'AI客服主管 Claire', name: 'Claire', emoji: '💬', desc: '24h全天候高情商售后接待、尺码问题及售后退款自动阻退安抚解决。', status: 'active', specialty: ['极速响应安抚', '退款自动拦截', '投诉升级分流'], cognitiveWeight: 'GPT-4o-mini', promptsCount: 20 }
      ]
    },
    {
      id: 'catering',
      name: '餐饮智慧外卖团队',
      emoji: '🍛',
      tagline: '智能外卖接单调度，精算满减券套利，一句话生成实体店门头Banner并投递KOL探店小红书推广。',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
      roster: [
        { role: 'AI菜单顾问 Kai', name: 'Kai', emoji: '🍽️', desc: '制作餐饮网店大促招牌、美团大众菜单视觉拼合图、极速新品宣发Banner美轮海报。', status: 'active', specialty: ['菜单门牌陈列', '美食图片生成', 'VI营销排板'], cognitiveWeight: 'Gemini 2.0 Flash', promptsCount: 11 },
        { role: 'AI采购经理 Ren', name: 'Ren', emoji: '🍜', desc: '研究并开发爆款新品配方，预估外卖包装扣率与物料进销单，合理给出溢价建议。', status: 'active', specialty: ['爆款菜谱研发', '物料扣率倒算', '供应链单价核定'], cognitiveWeight: 'Gemini 1.5 Pro', promptsCount: 6 },
        { role: 'AI运营经理 Lulu', name: 'Lulu', emoji: '📈', desc: '实时核验外卖第三方跑腿派单，秒级纠纷判定及赔付安抚、下班自动流水结账。', status: 'active', specialty: ['闪送派单呼叫', '用餐洒漏售后赔付', '每日资金损益对账'], cognitiveWeight: 'GPT-4o-mini', promptsCount: 15 },
        { role: 'AI营销经理 Soren', name: 'Soren', emoji: '📣', desc: '精算满返神券、代金券营销梯度。策划小红书地方夜宵探店大餐博主霸王餐召集令。', status: 'active', specialty: ['神券预算穿透', '探店霸王餐营销', '高回购社群宣发'], cognitiveWeight: 'DeepSeek-R1', promptsCount: 25 },
        { role: 'AI财务主管 Ken', name: 'Ken', emoji: '💰', desc: '精细化美团/饿了么账期财务比对、供应链结算。监控单店物料毛利红线。', status: 'active', specialty: ['外卖扣点结算', '门店账期审计', '食材物耗统计'], cognitiveWeight: 'DeepSeek-V3', promptsCount: 12 },
        { role: 'AI客服主管 Mia', name: 'Mia', emoji: '📞', desc: '餐饮出餐延误主动关怀、洒漏破损秒级先行赔付、差评自动解释与折扣包推送。', status: 'active', specialty: ['洒漏极速退垫', '差评危机处理', '专属满减券发放'], cognitiveWeight: 'GPT-4o-mini', promptsCount: 18 }
      ]
    },
    {
      id: 'retail',
      name: '生活百货跨境零售团队',
      emoji: '🏪',
      tagline: '跨境好物趋势选品，多重规格分类定价，搭建顺丰官方合作仓对接配送，精算直通车推广竞价。',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
      roster: [
        { role: 'AI选品顾问 Dax', name: 'Dax', emoji: '🏪', desc: '负责百货门面美工布局。配置高转化风格首页。一句话智能重排Banner展示橱窗。', status: 'active', specialty: ['风格主题适配', 'Banner排版精整', '一键换色调音'], cognitiveWeight: 'Gemini 2.0 Flash', promptsCount: 9 },
        { role: 'AI采购经理 Barton', name: 'Barton', emoji: '📦', desc: '精研新型百货。针对高退货率分类做出熔断剔除，上架多SKU重量规格及退货保价。', status: 'active', specialty: ['居家好物开发', '质量熔断监控', '保价险算套利'], cognitiveWeight: 'Claude 3.5 Sonnet', promptsCount: 12 },
        { role: 'AI运营经理 Cyrus', name: 'Cyrus', emoji: '📈', desc: '监控国内外发货。分销商一单代发顺丰配送，核对到货入仓流水与海派空运跟踪。', status: 'active', specialty: ['海派包裹监控', '一件代发全托管', '货代账目审计'], cognitiveWeight: 'GPT-4o', promptsCount: 20 },
        { role: 'AI营销经理 Nova', name: 'Nova', emoji: '📣', desc: '大促限时首发折扣、流量直通车竞价预算自动控价、生成高转化率种草文案。', status: 'active', specialty: ['直通车自动竞保', '高点击率投产比', '大促社群裂变券'], cognitiveWeight: 'DeepSeek-V3', promptsCount: 21 },
        { role: 'AI财务主管 Henry', name: 'Henry', emoji: '🏦', desc: '执行海外与本土网店VAT结算、财务周损益审计与物流报价费率对冲精算。', status: 'active', specialty: ['跨境税务合规', '多币种损益审计', '网店年季财报'], cognitiveWeight: 'DeepSeek-R1', promptsCount: 16 },
        { role: 'AI客服主管 Holly', name: 'Holly', emoji: '🗣️', desc: '24h解答百货规格参数、物流查询、签收延误快速补偿、错发秒理。', status: 'active', specialty: ['参数信息秒查', '多语种翻译沟通', '运输丢单速理'], cognitiveWeight: 'GPT-4o-mini', promptsCount: 17 }
      ]
    },
    {
      id: 'beauty',
      name: '美发丽人美容美体团队',
      emoji: '💅',
      tagline: '美容耗材供应链打底、智能私域VIP拓客卡片、抖音团购核销对账及抗敏感客诉秒级解决。',
      color: 'from-pink-500/20 to-rose-500/10 border-pink-500/30',
      roster: [
        { role: 'AI产品顾问 Amber', name: 'Amber', emoji: '💄', desc: '设计私域美发团购卡面、节日特惠SPA海报、优雅高端风格客户预约界面。', status: 'active', specialty: ['美感视觉提料', '私域团购UI设计', '高端品牌海报'], cognitiveWeight: 'GPT-4o', promptsCount: 10 },
        { role: 'AI会员运营经理 Bella', name: 'Bella', emoji: '🧪', desc: '管理面膜、精油及美化耗材。核销每日核算红线、根据进客转化率倒订库存。', status: 'active', specialty: ['耗材库存红线', '采购套路降本', '转化卡点分析'], cognitiveWeight: 'Gemini 1.5 Pro', promptsCount: 7 },
        { role: 'AI运营经理 Cherry', name: 'Cherry', emoji: '📈', desc: 'VIP等级管理。处理抖音美团团购代核销，过敏等不适客诉的秒送保退赔款。', status: 'active', specialty: ['团购快速核销', '敏感安抚客平', '全链订单关怀'], cognitiveWeight: 'Claude 3.5 Sonnet', promptsCount: 16 },
        { role: 'AI营销经理 Dora', name: 'Dora', emoji: '📣', desc: '策划「闺蜜同行半壁立减」活动，编写高曝光本地种草文案，优化ROI。', status: 'active', specialty: ['私域卡项设计', '本地团购文案', '裂变佣金分成'], cognitiveWeight: 'DeepSeek-V3', promptsCount: 18 },
        { role: 'AI财务主管 David', name: 'David', emoji: '💸', desc: '精算美业储值卡提成比例。分析高频率充值周期并向老板推送资金沉淀策略。', status: 'active', specialty: ['储值卡金流核查', '财务现金流规划', '大促收益计算'], cognitiveWeight: 'DeepSeek-R1', promptsCount: 11 },
        { role: 'AI客服主管 Coco', name: 'Coco', emoji: '💁‍♀️', desc: '解决敏感红肿异常安抚客诉、代金发券、美业项目精细预约变更快速登记。', status: 'active', specialty: ['过敏极速应急', '二次到店预约', '差评回访安抚'], cognitiveWeight: 'GPT-4o-mini', promptsCount: 19 }
      ]
    },
    {
      id: 'fitness',
      name: '健身轻食运动塑形团队',
      emoji: '🏋️',
      tagline: '定制健身周课谱、卡路里轻食营养配比、社群打卡机器人维护、以及多店卡项预约对冲。',
      color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30',
      roster: [
        { role: 'AI课程顾问 Bruce', name: 'Bruce', emoji: '🏋️', desc: '制定高清身材挑战打卡海报、智能团课海报、轻食大卡可视化拼图。', status: 'active', specialty: ['多设备排课视觉', '挑战赛海报', '营养结构图'], cognitiveWeight: 'GPT-4o-mini', promptsCount: 12 },
        { role: 'AI会员运营经理 Jane', name: 'Jane', emoji: '🥗', desc: '精研生酮、低碳膳食配比，核定零售轻食毛利，并把控即开供应商冷链。', status: 'active', specialty: ['卡量配比核对', '冷链配送扣损', '轻食SPU上架'], cognitiveWeight: 'Gemini 2.0 Flash', promptsCount: 9 },
        { role: 'AI运营经理 Kevin', name: 'Kevin', emoji: '📈', desc: '监管团课入座率、预约秒级退赛与赔偿、社群24h打卡机器人答疑对账。', status: 'active', specialty: ['社群全天响应', '排队机动调补', '充卡退卡核算'], cognitiveWeight: 'Claude 3.5 Sonnet', promptsCount: 14 },
        { role: 'AI营销经理 Cindy', name: 'Cindy', emoji: '📣', desc: '推广「百天逆袭挑战」、朋友圈裂变海报配文、抖音团购直播间热度推文。', status: 'active', specialty: ['百天打卡文案', '团购推广预热', '圈层流量裂变'], cognitiveWeight: 'DeepSeek-R1', promptsCount: 19 },
        { role: 'AI财务主管 Frank', name: 'Frank', emoji: '📅', desc: '审计健身房会费、轻食餐供应链。统计月度分批划款损耗。', status: 'active', specialty: ['年卡摊销计算', '供应链损益精算', '发发票及缴款控管'], cognitiveWeight: 'DeepSeek-V3', promptsCount: 10 },
        { role: 'AI客服主管 Kelly', name: 'Kelly', emoji: '🗣️', desc: '健身卡延期变更、请假快捷核准、教练安排对冲争议秒级调换和高情商接待。', status: 'active', specialty: ['课程快速请假', '预约冲突调平', '投诉分流转化'], cognitiveWeight: 'GPT-4o-mini', promptsCount: 15 }
      ]
    },
    {
      id: 'jewelry',
      name: '珠宝奢品保真质检团队',
      emoji: '💎',
      tagline: '大师高奢首饰设计、一件保真顺丰护航质检、黄金珠宝保重变动溢价机制、中泰溯源文案。',
      color: 'from-amber-600/20 to-yellow-500/10 border-amber-600/30',
      roster: [
        { role: 'AI产品设计师 Chloe', name: 'Chloe', emoji: '💎', desc: '奢侈感官网海报排定、高清黄金裸石3D渲染图、定制款式细节展示页面。', status: 'active', specialty: ['3D渲染视觉', '高奢侈感排板', '宝石证书排色'], cognitiveWeight: 'GPT-4o', promptsCount: 15 },
        { role: 'AI采购经理 Rex', name: 'Rex', emoji: '💍', desc: '每日挂钩贵研黄金基准变动、动态修改微店珠宝克重单价、录配保真溯源。', status: 'active', specialty: ['黄金实时控价', '珠宝一证一验', '极轻快配打样'], cognitiveWeight: 'Gemini 1.5 Pro', promptsCount: 11 },
        { role: 'AI运营经理 Vance', name: 'Vance', emoji: '📈', desc: '珠宝顺丰全程保价航空件打单，提供一对一客户核款对账与安心假赔。', status: 'active', specialty: ['全程航空保价', '高等级纠纷核对', '专席专属安平'], cognitiveWeight: 'Claude 3.5 Sonnet', promptsCount: 13 },
        { role: 'AI营销经理 Jewel', name: 'Jewel', emoji: '📣', desc: '小红书婚礼高定首饰推荐。生成「中泰溯源」古法黄金种草文，精准ROI。', status: 'active', specialty: ['高级首饰种草', '溯源故事文案', '大额代金券出货'], cognitiveWeight: 'DeepSeek-V3', promptsCount: 20 },
        { role: 'AI财务主管 Jeff', name: 'Jeff', emoji: '⚖️', desc: '针对金价波动极快对冲计算、大宗裸钻金料采购成本账目精算、出证质检核算。', status: 'active', specialty: ['金价套期估算', '出证书物耗核算', '外币购矿汇率保值'], cognitiveWeight: 'DeepSeek-R1', promptsCount: 14 },
        { role: 'AI客服主管 Joy', name: 'Joy', emoji: '🤵', desc: '高级珠宝终身保养细节答疑、顺丰物流最高密安查询、大额卡项变更人工通道分流。', status: 'active', specialty: ['专席优雅礼宾', '保值理赔对接', '定期养护预约'], cognitiveWeight: 'GPT-4o-mini', promptsCount: 16 }
      ]
    },
    {
      id: 'home',
      name: '家居软装生活美学团队',
      emoji: '🛋️',
      tagline: '空间美学选品顾问、家具供应链及大件超载运输损耗核定、24h大件破损补送售后。',
      color: 'from-orange-600/20 to-yellow-600/10 border-orange-500/30',
      roster: [
        { role: 'AI选品顾问 Dax', name: 'Dax', emoji: '🛋️', desc: '空间效果美化设计、居家场景大图视觉、定制化产品功能细节展示。', status: 'active', specialty: ['空间色彩渲染', '高颜值场景海报', '环保等级详情'], cognitiveWeight: 'GPT-4o', promptsCount: 11 },
        { role: 'AI采购经理 Logan', name: 'Logan', emoji: '🪵', desc: '甄选实木环保、家具零配件五金。针对出海大件外物损管理和供应链拼集仓排单。', status: 'active', specialty: ['实木环保检测', '集装箱拆重体积比', '海关合规账书'], cognitiveWeight: 'Gemini 1.5 Pro', promptsCount: 9 },
        { role: 'AI运营经理 Kyle', name: 'Kyle', emoji: '🚚', desc: '负责专线重货托运运单比价打单。大件家居质保及破损先行补发调度。', status: 'active', specialty: ['专线大件计泡核算', '物流破漏秒先行', '库存补货红线'], cognitiveWeight: 'Claude 3.5 Sonnet', promptsCount: 15 },
        { role: 'AI营销经理 Nova', name: 'Nova', emoji: '📢', desc: '撰写「侘寂风整屋软装」高转化博主种草案。策划限时包邮拼团免运保。', status: 'active', specialty: ['风格种草文案', '大件特惠拼装', '博主家居测评'], cognitiveWeight: 'DeepSeek-V3', promptsCount: 19 },
        { role: 'AI财务主管 Henry', name: 'Henry', emoji: '💳', desc: '家居建材对账、供应商季度账款结算、运输超泡体积费折抵精细清盘。', status: 'active', specialty: ['物流账目比对', '整单报价毛利估算', '企业税务账目'], cognitiveWeight: 'DeepSeek-R1', promptsCount: 13 },
        { role: 'AI客服主管 Holly', name: 'Holly', emoji: '📐', desc: '24h大件上楼服务安排反馈、破损零配件补寄对接、尺寸退货高成本阻退。', status: 'active', specialty: ['安装上楼对接', '高货损极力纠纷阻退', '配件一键补寄'], cognitiveWeight: 'GPT-4o-mini', promptsCount: 16 }
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
