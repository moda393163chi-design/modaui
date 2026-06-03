import { IndustryData, PricingPlan, OperatingStrategy } from './types';

export const INDUSTRIES: IndustryData[] = [
  {
    id: 'fashion',
    name: '服装公司',
    emoji: '👗',
    tagline: '引领潮流款式设计',
    bgColor: 'from-amber-950/20 to-neutral-950',
    team: [
      {
        role: 'AI设计师',
        emoji: '🎨',
        name: 'Aria',
        desc: '趋势监控与款式设计',
        status: 'active',
        tasks: ['分析本周TikTok潮流趋势', '设计秋季新品风衣线草图', '生成3D样衣渲染图']
      },
      {
        role: 'AI选品经理',
        emoji: '🎒',
        name: 'Barton',
        desc: '细分需求与竞品监控',
        status: 'active',
        tasks: ['分析欧美时尚KOL穿搭高频热词', '优化服装测品打样选定比例', '监测拼多多百亿补贴同款竞品']
      },
      {
        role: 'AI营销经理',
        emoji: '📣',
        name: 'Daphne',
        desc: '穿搭推广与批量派样',
        status: 'active',
        tasks: ['生成小红书法式复古风穿搭笔记', '筛选万粉潮流博主建联推荐', '分析今日直通车推广ROI']
      },
      {
        role: 'AI运营经理',
        emoji: '📈',
        name: 'Cyrus',
        desc: '渠道管理与库存控制',
        status: 'active',
        tasks: ['检测高腰直筒裤库存红线', '生成服装上架SKU排单表', '评估拼多多店群活动回本周期']
      }
    ]
  },
  {
    id: 'catering',
    name: '餐饮公司',
    emoji: '🍜',
    tagline: '打造爆品高效经营',
    bgColor: 'from-orange-950/20 to-neutral-950',
    team: [
      {
        role: 'AI外卖经理',
        emoji: '🛵',
        name: 'Kai',
        desc: '满减配置与活动增收',
        status: 'active',
        tasks: ['调整美团“满30减12”配送券策略', '分析周一午间订单地域聚类图', '更新店铺下午茶时段主推海报']
      },
      {
        role: 'AI大堂经理',
        emoji: '🍽️',
        name: 'Ren',
        desc: '点单推荐与餐单设计',
        status: 'active',
        tasks: ['分析同城冷饮爆款口味变化', '研发低成本新菜单爆品方案', '设计堂客桌牌扫码送折扣活动']
      },
      {
        role: 'AI仓库经理',
        emoji: '📦',
        name: 'Soren',
        desc: '食材询价与物料周转',
        status: 'active',
        tasks: ['对比美白菜/青椒批发价', '自动计算明日猪肉进货需求量', '核算新供销社运费与履约率']
      },
      {
        role: 'AI运营经理',
        emoji: '📈',
        name: 'Lulu',
        desc: '利得计算与自动对账',
        status: 'active',
        tasks: ['核实外卖平台服务费自动对账', '友好拦截并快速安抚起因洒漏退折', '核对支付宝与微信结算账户余额']
      }
    ]
  },
  {
    id: 'retail',
    name: '百货零售',
    emoji: '🏪',
    tagline: '精选爆品智能库存',
    bgColor: 'from-emerald-950/20 to-neutral-950',
    team: [
      {
        role: 'AI选品经理',
        emoji: '🎒',
        name: 'Vara',
        desc: '源头选品与利润测算',
        status: 'active',
        tasks: ['筛查亚马逊近7天飙升日用百货', '提取“解压重力玩具”好评卖点', '测算国内多渠道拿货毛利差值']
      },
      {
        role: 'AI库存经理',
        emoji: '📦',
        name: 'Dax',
        desc: '代发工厂与跟单物流',
        status: 'active',
        tasks: ['匹配3家义乌源头雨伞代加工厂', '自动化核验发货物流准时率', '设定自动采购跟单提醒机制']
      },
      {
        role: 'AI营销经理',
        emoji: '📣',
        name: 'Nova',
        desc: '投流推广与社群引流',
        status: 'active',
        tasks: ['生成创意收纳挂包挂载车投文案', '配置每日50元起步低成本测品计划', '调整直通车千次展现成本出价']
      },
      {
        role: 'AI运营经理',
        emoji: '📈',
        name: 'Tate',
        desc: '线上铺货与售后核退',
        status: 'active',
        tasks: ['全自动向闲鱼派单铺货50起', '扣去代发代扣成本进行财务复核', '友好安抚并自动核退由于运损申请']
      }
    ]
  },
  {
    id: 'beauty',
    name: '美业公司',
    emoji: '💄',
    tagline: '打造明星美容项目',
    bgColor: 'from-pink-950/20 to-neutral-950',
    team: [
      {
        role: 'AI产品经理',
        emoji: '🧴',
        name: 'Yara',
        desc: '成分研究与画稿设计',
        status: 'active',
        tasks: ['检索小红书“积雪草修护”热度数据', '完成新款紧致抗皱乳霜的概念画稿', '校对新款明星单品安全申报材料']
      },
      {
        role: 'AI客户经理',
        emoji: '🤝',
        name: 'Iris',
        desc: '私域引流与客户留存',
        status: 'active',
        tasks: ['为1位熬夜爆痘急需抚平的客户荐品', '推送私域美妆福利群二维码并自动返利', '监控重点年卡客户活跃率与留存周期']
      },
      {
        role: 'AI营销经理',
        emoji: '📣',
        name: 'Sage',
        desc: '红人推广与试样审查',
        status: 'active',
        tasks: ['自动筛选小红书千粉至万粉纯素人', '批量发出50份口红大批样品建联私信', '核验已收样达人的返图与发帖率']
      },
      {
        role: 'AI预约经理',
        emoji: '📅',
        name: 'Cleo',
        desc: '疗程排班与错峰派券',
        status: 'active',
        tasks: ['确认周六下午3点面部SPA疗程预约排班', '生成并群发周度到店路线与时间指南', '协助2组时间异常的客群在线重改排表']
      }
    ]
  },
  {
    id: 'hotel',
    name: '酒店民宿',
    emoji: '🏨',
    tagline: '提升房源入住比例',
    bgColor: 'from-blue-950/20 to-neutral-950',
    team: [
      {
        role: 'AI前台经理',
        emoji: '🛎️',
        name: 'Noel',
        desc: '房态回复与极速向导',
        status: 'active',
        tasks: ['秒回房客急问“密码锁没网开不了门”', '群发当日下午至自锁房核销自主链接', '协助安排前台额外送一床大棉被到302室']
      },
      {
        role: 'AI客房经理',
        emoji: '🧹',
        name: 'Pace',
        desc: '保洁派单与物料订补',
        status: 'active',
        tasks: ['监测102房和205房完成快速清洁派单', '比对备用床品质检与磨损更换周期', '向一站式酒店供应商自动订补消耗品']
      },
      {
        role: 'AI收益经理',
        emoji: '💸',
        name: 'Kira',
        desc: '实时调价与甩尾清仓',
        status: 'active',
        tasks: ['追踪端午假日前夕同城竞争对手房价', '根据明日降水预测下调标准房单价', '设定今晚8点后的夜间甩尾折扣']
      },
      {
        role: 'AI运营经理',
        emoji: '📊',
        name: 'Bella',
        desc: '多平台房态日历同步',
        status: 'active',
        tasks: ['实时同步各订房网站房态日盘', '自动回复买家写的精美多图高分评价', '合并汇总全月渠道佣金收益及水电预算']
      }
    ]
  },
  {
    id: 'influencer',
    name: '电商网红',
    emoji: '📱',
    tagline: '流量变现持续增长',
    bgColor: 'from-indigo-950/20 to-neutral-950',
    team: [
      {
        role: 'AI选品经理',
        emoji: '🛍️',
        name: 'Giles',
        desc: '爆款带货榜单分析',
        status: 'active',
        tasks: ['分析近期大主播高佣爆款带货榜单', '对接高转化零食和日用工厂源头货盘', '设定本周新品首播毛利分成方案']
      },
      {
        role: 'AI内容经理',
        emoji: '📝',
        name: 'Mercedes',
        desc: '内容设计与脚本撰写',
        status: 'active',
        tasks: ['生成15秒快节奏零食评测短视频脚本', '撰写小红书首发高质视频配图文案', '分析历史爆款内容停留时长与触点反馈']
      },
      {
        role: 'AI直播经理',
        emoji: '🎙️',
        name: 'Kellan',
        desc: '直播话术与氛围营造',
        status: 'active',
        tasks: ['调优直播前10秒黄金留存大纲', '设置直播间憋单福利活动与公屏高亮字眼', '实时监控本场直播粉丝停留率与成交转换']
      },
      {
        role: 'AI运营经理',
        emoji: '📈',
        name: 'Sylvia',
        desc: '流水核算与售后解答',
        status: 'active',
        tasks: ['核算本场带货GMV、抽金及分销净利', '自动核验各大平台包裹发运妥投率', '友好解答粉丝咨询并秒级赔付保障']
      }
    ]
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'basic',
    name: '基础版',
    price: '¥ 99',
    period: '月',
    desc: '适合个人与小微起步',
    features: [
      '授权 1 家虚拟公司',
      '配备 2 名 AI 员工',
      '7x24 小时自主工作',
      '支持一件代发与监控',
      '标准财务账单导出'
    ]
  },
  {
    id: 'standard',
    name: '标准版',
    price: '¥ 299',
    period: '月',
    desc: '配备整套完整团队',
    features: [
      '授权 3 家虚拟公司',
      '配备 4 名全能员工',
      '社群营销与自动推送',
      '高级策略智能调控',
      '提供实时销量分析'
    ]
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: '¥ 899',
    period: '月',
    desc: '多品牌集团覆盖运营',
    features: [
      '授权无限家虚拟公司',
      '配备无限位特训员工',
      '独占服务器极速响应',
      '专家模型定制服务',
      '高精物理安全隔离'
    ]
  }
];

export const OPERATING_STRATEGIES: OperatingStrategy[] = [
  {
    id: 'lean',
    name: '精益创业模式',
    tag: '敏捷自适应',
    desc: '精益思维 严控成本',
    intensity: 'low'
  },
  {
    id: 'expansion',
    name: '稳健扩张模式',
    tag: '数据驱动型',
    desc: '稳健测品 智能投流',
    intensity: 'medium'
  },
  {
    id: 'autopilot',
    name: '全权代理模式',
    tag: '智能体托管',
    desc: '完全托管 自动套利',
    intensity: 'high'
  }
];

export const MOCK_LOGS_POOL: Record<string, string[]> = {
  fashion_design: [
    '👗 AI设计师 Aria 发现 TikTok 上 #frenchcottage 话题播放量环比暴增 120%',
    '👗 AI设计师 Aria 已基于积雪草复古色系设计出 3 款夏末长袖风衣，像素渲染已就绪',
    '👗 AI设计师 Aria 顺利上传 3D 服饰模型，完成首批虚拟模特身着效果图，开始进行货品尺码打版'
  ],
  fashion_procure: [
    '📦 AI选品经理 Barton 筛选服装测品打样选定比例，监控同款竞品走势',
    '📦 AI选品经理 Barton 跟踪最新进价水平，与一手打板面料厂达成一件代发样衣直供协议',
    '📦 AI选品经理 Barton 支付首笔样板布费，原料已由顺丰承运，预计明早 9 点抵达车间'
  ],
  fashion_operate: [
    '📈 AI运营经理 Cyrus 检测到高腰直筒裤销量突破 80 件，首单库存已消耗 85%，自动启动柔性快反补货计划',
    '📈 AI运营经理 Cyrus 完成商品多渠道详情页一键上架，已同步排布商品在各大电商平台的展现位',
    '📈 AI运营经理 Cyrus 把控面料和制衣进度，自动分配并校对排单单号'
  ],
  billing: [
    '💰 财务审计 汇总今日完成交易额，今日业务实现高比例利润溢价，单日净利率表现稳健',
    '💰 财务审计 完成微信支付/支付宝流水账户的对账复核，排除多起重复退款申请',
    '💰 财务审计 已生成今日的成本账单与销售曲线，提交至主控制台'
  ],
  support: [
    '💬 运营窗口 在线极速接待客户咨询，顾客精细化说服，顾客在 3 秒后痛快付款购买',
    '💬 运营窗口 成功拦截 1 件处于揽收异常状态的物流，并在线主动向买家赠予 3 元延迟津贴',
    '💬 运营窗口 在线极速调停破损货损申请，退还 2 元折旧补贴，换取五星好评'
  ]
};
