import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Palette, Check, Save, Sparkles, Phone, HelpCircle, Eye, 
  MapPin, Sliders, Globe, RefreshCcw, Building
} from 'lucide-react';
import { db } from '../services/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

interface VisualTheme {
  id: 'classic' | 'dark' | 'retro' | 'royal' | 'indigo';
  name: string;
  bgHex: string;
  accentHex: string;
  desc: string;
  fontFamily: string;
}

interface StorefrontViewProps {
  tenantId: string;
  industryId: string;
  onAddLog?: (sender: string, emoji: string, message: string, type: 'info' | 'success' | 'warn') => void;
}

const getIndustryDefaultHeadline = (indId: string) => {
  const defaults: Record<string, string> = {
    fashion: '👗 Aria 季风高定系列 · 舒感美学新风尚',
    catering: '☕ Tyson Cafe · 经典美式/手作拿铁特惠',
    retail: '✈️ 全球尖货精选直邮 · 发现品质生活好物',
    beauty: '💄 Coco Salon · 焕活平衡 SPA 与定制深层理疗',
    fitness: '🏋️ Kelly Gym · 尊享周度私教定制与低碳膳食',
    jewelry: '💎 18K足金古法拉丝龙凤金镯 · 匠人高定传承',
    home: '🛋️ 空间美学 · 环保级棉麻主卧全套风格软装'
  };
  return defaults[indId] || defaults.catering;
};

export default function StorefrontView({ tenantId, industryId, onAddLog }: StorefrontViewProps) {
  // Preconfigured visual themes in strict monochrome / high-contrast premium aesthetics
  const themesList: VisualTheme[] = [
    { id: 'retro', name: 'Midas Gold (法国金奢)', bgHex: '#FAF9F6', accentHex: '#D4AF37', desc: '暖白法式复古高品格，适合美发、奢品及法式餐饮', fontFamily: 'font-serif' },
    { id: 'dark', name: 'Silent Obsidian (静默黑曜)', bgHex: '#09090B', accentHex: '#FFFFFF', desc: '先锋主义与纯黑极冷现代，适合高端服装与数码配饰', fontFamily: 'font-sans' },
    { id: 'classic', name: 'Classic Slate (极简都市)', bgHex: '#F4F4F5', accentHex: '#1D9BF0', desc: '明亮通透的商务现代高级灰，适合全品类百货零售', fontFamily: 'font-sans' },
    { id: 'royal', name: 'Imperial Jade (高定御宝)', bgHex: '#0D1B1E', accentHex: '#10B981', desc: '墨绿金镶奢护经典，适合珠宝文玩及品茶私房配食', fontFamily: 'font-serif' },
    { id: 'indigo', name: 'Indigo Velocity (动感电竞)', bgHex: '#030712', accentHex: '#6366F1', desc: '深海靛蓝高频活力，适合运动户外、私教搏击健身等', fontFamily: 'font-mono' }
  ];

  // Core settings synchronized with Firestore
  const [selectedThemeId, setSelectedThemeId] = useState<'classic' | 'dark' | 'retro' | 'royal' | 'indigo'>('classic');
  const [storeHeadline, setStoreHeadline] = useState(getIndustryDefaultHeadline(industryId));
  const [phoneContact, setPhoneContact] = useState('400-820-8820');
  const [deliveryType, setDeliveryType] = useState<'takeout' | 'delivery' | 'dine_in'>('delivery');
  const [logoImage, setLogoImage] = useState('💫');

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Sync settings live
  useEffect(() => {
    let activeTenant = tenantId || 'default_tenant';
    const unsub = onSnapshot(doc(db, 'tenants', activeTenant), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.storeTheme) setSelectedThemeId(data.storeTheme);
        if (data.storeHeadline) setStoreHeadline(data.storeHeadline);
        if (data.phoneContact) setPhoneContact(data.phoneContact);
        if (data.deliveryType) setDeliveryType(data.deliveryType);
        if (data.logoImage) setLogoImage(data.logoImage);
      }
      setLoading(false);
    }, (err) => {
      console.warn("StorefrontView settings fallback:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [tenantId]);

  // Apply Changes with full save to Firestore
  const handleApplyThemeSettings = async () => {
    setIsSaving(true);
    try {
      const activeTenant = tenantId || 'default_tenant';
      await setDoc(doc(db, 'tenants', activeTenant), {
        storeTheme: selectedThemeId,
        storeHeadline,
        phoneContact,
        deliveryType,
        logoImage
      }, { merge: true });

      if (onAddLog) {
        onAddLog('AI视觉主编', '🏪', `一键应用了网店最新视觉系统【${selectedThemeId.toUpperCase()}】，全量推流并刷新了CDN前向静态节点。`, 'success');
      }
    } catch (err: any) {
      console.error("Failed to save style theme to DB: ", err);
    } finally {
      setIsSaving(false);
    }
  };

  const activeTheme = themesList.find(t => t.id === selectedThemeId) || themesList[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn text-left">
      {/* Left panel: configurations control list */}
      <div className="lg:col-span-8 space-y-6">
        {/* Style Selection panel */}
        <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
          <div>
            <h3 className="text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-[#1D9BF0]" />
              <span>智能品牌视觉管理器 (Brand Theme & Settings Studio)</span>
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1">设置前台在线商城的视觉主题色块、排印格式及核心营业参数</p>
          </div>

          {/* Theme card selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {themesList.map((tm) => (
              <div
                key={tm.id}
                onClick={() => setSelectedThemeId(tm.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative overflow-hidden ${
                  selectedThemeId === tm.id 
                    ? 'bg-zinc-950 border-white text-white' 
                    : 'bg-black/60 border-zinc-900 text-neutral-400 hover:border-zinc-805 hover:text-white'
                }`}
              >
                {/* Visual miniature dot indicator */}
                <div className="flex h-5 items-center">
                  <div 
                    className="w-4.5 h-4.5 rounded-full border border-neutral-700 flex items-center justify-center font-mono text-[9px]"
                    style={{ backgroundColor: tm.bgHex, color: tm.accentHex }}
                  >
                    {selectedThemeId === tm.id && <span className="text-[7.5px] font-black text-white mix-blend-difference">✔</span>}
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-[11.5px] font-bold font-mono tracking-tight">{tm.name}</h4>
                  <p className="text-[9px] text-[#8B949E] leading-normal">{tm.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Store settings configurations list */}
        <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
          <span className="text-[9.5px] font-mono uppercase tracking-wider text-zinc-500 block">基础营业信息设置 (Parameters Configuration)</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-400 block font-mono">店铺主标 LOGO 标签 (Emoji Icon / Text)</label>
              <input 
                type="text"
                value={logoImage}
                onChange={e => setLogoImage(e.target.value)}
                className="w-full bg-black border border-[#2F3336] p-2 text-[11px] text-white rounded focus:border-white focus:outline-none"
                placeholder="例如: 👗 / ☕ / 🥐"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] text-zinc-400 block font-mono">店铺专属联系服务电话 (Helpline hotline)</label>
              <input 
                type="text"
                value={phoneContact}
                onChange={e => setPhoneContact(e.target.value)}
                className="w-full bg-black border border-[#2F3336] p-2 text-[11px] text-white rounded focus:border-white focus:outline-none font-mono"
                placeholder="400-820-8820"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[9px] text-zinc-400 block font-mono">主站大堂顶部看板标语 (Headline Hero Title)</label>
              <input 
                type="text"
                value={storeHeadline}
                onChange={e => setStoreHeadline(e.target.value)}
                className="w-full bg-black border border-[#2F3336] p-2 text-[11px] text-white rounded focus:border-white focus:outline-none"
                placeholder="设置在主站轮播大图最瞩目位置的口号标语"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="text-[9px] text-zinc-400 block font-mono">默认支持履约结账模式 (Distribution Settings)</label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['takeout', 'delivery', 'dine_in'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDeliveryType(mode)}
                    className={`py-2 text-[10px] rounded-lg border font-mono transition-all text-center ${
                      deliveryType === mode 
                        ? 'bg-white text-black border-white font-extrabold' 
                        : 'bg-transparent text-zinc-400 border-zinc-900 hover:text-white'
                    }`}
                  >
                    {mode === 'takeout' ? '外卖打包 🥡' : mode === 'delivery' ? '全省配送 🛵' : '现场堂食 🍱'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-900/60 flex justify-end">
            <button
              onClick={handleApplyThemeSettings}
              disabled={isSaving}
              className="bg-white hover:bg-neutral-200 transition-colors text-black font-extrabold text-[10px] py-1.5 px-6 rounded-lg flex items-center space-x-1 cursor-pointer disabled:opacity-45"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border border-black/40 border-t-black rounded-full animate-spin" />
                  <span>设置同步中...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>一键发布并启用主题</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right panel: Live Smartphone layout rendering preview */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
          <div className="border-b border-[#2F3336]/60 pb-2 flex justify-between items-center">
            <h4 className="text-white text-xs font-mono uppercase tracking-wider flex items-center space-x-1">
              <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
              <span>实时前台手机预览 (Virtual Mobile Sim)</span>
            </h4>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-[#1D9BF0]/15 text-sky-400">
              iPhone 17
            </span>
          </div>

          {/* Interactive Phone viewport */}
          <div className="w-full bg-[#1c1c1e] p-2.5 rounded-[28px] border-4 border-[#2f2f31] shadow-2xl overflow-hidden relative mx-auto max-w-[250px]">
            {/* Speaker hole miniature */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-black rounded-full z-35 flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-zinc-900 rounded-full" />
            </div>

            {/* Virtual Screen contents, matching selected style parameters dynamically */}
            <div 
              className={`w-full rounded-[20px] aspect-[9/18] overflow-hidden flex flex-col justify-between font-sans ${activeTheme.fontFamily}`}
              style={{ backgroundColor: activeTheme.id === 'dark' || activeTheme.id === 'indigo' || activeTheme.id === 'royal' ? '#0A0A0A' : '#FAF9F6' }}
            >
              {/* Phone Status bar */}
              <div 
                className="pt-4 px-3 flex justify-between text-[7px] font-bold tracking-tight bg-transparent"
                style={{ color: activeTheme.id === 'dark' || activeTheme.id === 'indigo' || activeTheme.id === 'royal' ? '#FFFFFF' : '#111111' }}
              >
                <span>9:41</span>
                <span>5G 🔋</span>
              </div>

              {/* Store Mobile Header */}
              <div 
                className="px-4 py-2.5 flex items-center justify-between border-b/5 border-dashed"
                style={{ 
                  borderBottomColor: activeTheme.accentHex + '20',
                  color: activeTheme.id === 'dark' || activeTheme.id === 'indigo' || activeTheme.id === 'royal' ? '#FFFFFF' : '#111111' 
                }}
              >
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm">{logoImage}</span>
                  <span className="text-[10px] font-extrabold tracking-wide uppercase">MODA SPACE</span>
                </div>
                <div 
                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{ backgroundColor: activeTheme.accentHex }}
                />
              </div>

              {/* Slogan Banner Block */}
              <div className="p-3 mx-2.5 rounded-xl border border-dashed text-center"
                   style={{ 
                     borderColor: activeTheme.accentHex + '50', 
                     backgroundColor: activeTheme.id === 'dark' || activeTheme.id === 'indigo' || activeTheme.id === 'royal' ? '#111111' : '#EFEFEF' 
                   }}
              >
                <p 
                  className="text-[8.5px] leading-relaxed font-bold font-mono text-left"
                  style={{ color: activeTheme.id === 'dark' || activeTheme.id === 'indigo' || activeTheme.id === 'royal' ? '#F4F4F5' : '#1A1A1A' }}
                >
                  {storeHeadline}
                </p>
                <span className="text-[6.5px] block text-left mt-2 text-zinc-500 font-mono tracking-wide">
                  配送支援: {deliveryType === 'delivery' ? '全省顺丰极寒配位' : deliveryType === 'takeout' ? '外卖打包' : '现场就餐扫描'}
                </span>
              </div>

              {/* Simulated Product Card grid */}
              <div className="flex-1 p-3 grid grid-cols-2 gap-2 overflow-y-auto">
                {([
                  { name: '经典主打新品', val: '¥ 129', icon: '🎽' },
                  { name: '高定穿搭尊享', val: '¥ 450', icon: '🧣' }
                ]).map((prod, idx) => (
                  <div 
                    key={idx}
                    className="p-2 rounded-lg text-left space-y-1 relative"
                    style={{ 
                      backgroundColor: activeTheme.id === 'dark' || activeTheme.id === 'indigo' || activeTheme.id === 'royal' ? '#141416' : '#FFFFFF',
                      border: `1px solid ${activeTheme.id === 'dark' || activeTheme.id === 'indigo' || activeTheme.id === 'royal' ? '#27272A' : '#E4E4E7'}`
                    }}
                  >
                    <span className="text-lg block mb-1.5">{prod.icon}</span>
                    <span 
                      className="text-[7.5px] font-bold block truncate"
                      style={{ color: activeTheme.id === 'dark' || activeTheme.id === 'indigo' || activeTheme.id === 'royal' ? '#FFFFFF' : '#1E1E1E' }}
                    >
                      {prod.name}
                    </span>
                    <span 
                      className="text-[8px] font-mono tracking-tight block font-extrabold"
                      style={{ color: activeTheme.accentHex }}
                    >
                      {prod.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* Hotline Contact Footer */}
              <div 
                className="p-3 text-center border-t text-[6px] font-mono"
                style={{ 
                  borderColor: activeTheme.id === 'dark' || activeTheme.id === 'indigo' || activeTheme.id === 'royal' ? '#222' : '#DDD',
                  color: '#8B949E' 
                }}
              >
                <Phone className="w-2 h-2 inline mr-1 text-zinc-500" />
                <span>客服热线: {phoneContact}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
