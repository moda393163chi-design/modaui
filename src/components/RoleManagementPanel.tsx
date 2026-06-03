import React, { useState, useEffect } from 'react';
import { 
  Shield, ShieldCheck, Users, ToggleLeft, ToggleRight, 
  UserCheck, AlertTriangle, Key, Plus, Trash2, Edit3, HelpCircle 
} from 'lucide-react';
import { UserRole, ROLE_PERMISSIONS, rbacService } from '../services/rbac';

interface TeamMember {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  status: 'active' | 'suspended';
  assignedTasks: number;
}

interface RoleManagementPanelProps {
  tenantId: string;
  currentRole: UserRole;
  onRoleChange: (newRole: UserRole) => void;
  onAddLog?: (sender: string, emoji: string, message: string, type: 'info' | 'success' | 'warn') => void;
}

export default function RoleManagementPanel({ 
  tenantId, 
  currentRole, 
  onRoleChange,
  onAddLog 
}: RoleManagementPanelProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole | 'all'>('all');
  
  // New member form
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('Staff');

  // Load team list from localStorage
  const loadMembers = () => {
    const key = `modaui_rbac_members_${tenantId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setMembers(JSON.parse(stored));
    } else {
      const defaultMembers: TeamMember[] = [
        { id: 'usr-1', name: '智点运营专员', role: 'Staff', email: 'staff@modaui.com', status: 'active', assignedTasks: 18 },
        { id: 'usr-2', name: '极智副总裁', role: 'Manager', email: 'manager@modaui.com', status: 'active', assignedTasks: 35 },
        { id: 'usr-3', name: '联合商户所有者', role: 'Merchant Owner', email: 'founder@modaui.com', status: 'active', assignedTasks: 82 }
      ];
      localStorage.setItem(key, JSON.stringify(defaultMembers));
      setMembers(defaultMembers);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [tenantId]);

  const saveMembers = (newMembers: TeamMember[]) => {
    setMembers(newMembers);
    localStorage.setItem(`modaui_rbac_members_${tenantId}`, JSON.stringify(newMembers));
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    const newMember: TeamMember = {
      id: `usr-${Math.random().toString(36).substring(2, 6)}`,
      name: newMemberName,
      role: newMemberRole,
      email: newMemberEmail,
      status: 'active',
      assignedTasks: 0
    };

    const updated = [...members, newMember];
    saveMembers(updated);
    
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('Staff');
    setShowAddModal(false);

    if (onAddLog) {
      onAddLog('RBAC 权限守卫', '🛡️', `成功添加用户 ${newMember.name} 并预设「${newMember.role}」RBAC 权限策略。`, 'success');
    }
  };

  const handleToggleStatus = (memberId: string) => {
    const updated = members.map(m => {
      if (m.id === memberId) {
        const nextStatus = m.status === 'active' ? 'suspended' : 'active';
        if (onAddLog) {
          onAddLog('RBAC 权限守卫', '⚠️', `主体「${m.name}」已被安全调配，状态更新为: [${nextStatus.toUpperCase()}]`, 'warn');
        }
        return { ...m, status: nextStatus };
      }
      return m;
    });
    saveMembers(updated);
  };

  const handleDeleteMember = (memberId: string, memberName: string) => {
    const updated = members.filter(m => m.id !== memberId);
    saveMembers(updated);
    if (onAddLog) {
      onAddLog('RBAC 权限守卫', '🗑️', `成功吊销了员工「${memberName}」对应的 SaaS 所有子级访问凭准。`, 'warn');
    }
  };

  const filteredMembers = members.filter(m => {
    if (selectedRoleFilter === 'all') return true;
    return m.role === selectedRoleFilter;
  });

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      
      {/* RBAC Visual Matrix Dashboard Header */}
      <div className="bg-[#09090B] border border-[#2F3336] p-6 rounded-xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="flex items-center space-x-2 text-sky-400">
            <Shield className="w-4 h-4 text-sky-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider font-bold">Role-Based Access Control Portal</span>
          </div>
          <h2 className="text-white text-base font-bold tracking-tight">企业多账号角色权限配置 (RBAC Matrix)</h2>
          <p className="text-xs text-neutral-400 leading-relaxed font-sans">
            对商户旗下的操作员、客服智体以及创始者账户细化多维度控制权限规则。您可以在上方全局控制卡片中，一键重签当前的调试身份。
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0 relative z-10">
          <div className="bg-black/60 border border-[#2F3336] p-3 rounded-lg text-left">
            <span className="text-[9px] text-[#8B949E] font-mono block uppercase">当前仿真调试身份</span>
            <span className="text-sm font-mono font-bold text-sky-400 flex items-center gap-1 mt-0.5">
              <UserCheck className="w-4 h-4 text-sky-400" />
              <span>{currentRole}</span>
            </span>
          </div>
        </div>
        
        {/* Subtle geometric background glow */}
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
        
        {/* Left Column: Permissions Matrix Details */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Perm Matrix Details table style */}
          <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
            <div className="border-b border-[#2F3336]/60 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>MODAUI 实效权限规约矩阵 (Matrix Registry)</span>
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans text-neutral-300">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 text-[10px] font-mono uppercase">
                    <th className="py-2.5">核心角色 (RBAC Role)</th>
                    <th className="py-2.5 text-center">读取/写单 SPU</th>
                    <th className="py-2.5 text-center">发货顺丰 (Courier)</th>
                    <th className="py-2.5 text-center">修改AI词库 (RAG)</th>
                    <th className="py-2.5 text-center">卸装 App 插件</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60 font-mono text-[11px]">
                  {Object.entries(ROLE_PERMISSIONS).map(([roleKey, perm]) => (
                    <tr 
                      key={roleKey}
                      className={`hover:bg-zinc-950/40 transition-colors ${
                        currentRole === roleKey ? 'bg-sky-950/20 text-sky-300 border-l-2 border-sky-500' : ''
                      }`}
                    >
                      <td className="py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{roleKey}</span>
                          <span className="text-[9px] text-[#8B949E]">
                            {roleKey === 'Platform Admin' ? 'Saas 高级总控人' :
                             roleKey === 'Merchant Owner' ? '商行发起者 Founders' :
                             roleKey === 'Manager' ? '运营管理高级经理' :
                             roleKey === 'Staff' ? '操作值班店长' : '最终访客消费者'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className={perm.canCreateProduct ? 'text-emerald-400' : 'text-zinc-600'}>
                          {perm.canCreateProduct ? '✔ 完美写入' : '❌ 限制写入'}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={perm.canDispatchOrder ? 'text-emerald-400' : 'text-zinc-600'}>
                          {perm.canDispatchOrder ? '✔ 支持' : '❌ 无权'}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={perm.canModifyAITeams ? 'text-emerald-400' : 'text-zinc-600'}>
                          {perm.canModifyAITeams ? '✔ 全权配置' : '❌ 禁止'}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={perm.canManageApps ? 'text-emerald-400' : 'text-zinc-600'}>
                          {perm.canManageApps ? '✔ 电机装配' : '❌ 无权'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Users Roster with interactive control */}
          <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#2F3336]/60 pb-3">
              <div>
                <h3 className="text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-400" />
                  <span>席位名录与子成员 (User Roster)</span>
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1">控制具有后台系统登录许可的操作者或客服代签代行机器人。</p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="bg-white hover:bg-neutral-200 text-black text-[10px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>分配新席位</span>
              </button>
            </div>

            {/* Filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedRoleFilter('all')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                  selectedRoleFilter === 'all' 
                    ? 'bg-zinc-850 text-white border-zinc-700' 
                    : 'bg-transparent text-zinc-500 border-transparent hover:text-white'
                }`}
              >
                全部成员 ({members.length})
              </button>
              {['Merchant Owner', 'Manager', 'Staff', 'Customer'].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRoleFilter(role as UserRole)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                    selectedRoleFilter === role 
                      ? 'bg-zinc-850 text-white border-zinc-700' 
                      : 'bg-transparent text-zinc-500 border-transparent hover:text-white'
                  }`}
                >
                  {role} ({members.filter(m => m.role === role).length})
                </button>
              ))}
            </div>

            {/* Members items display list */}
            <div className="space-y-2.5">
              {filteredMembers.map((m) => (
                <div 
                  key={m.id}
                  className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-between gap-4 hover:border-zinc-800 transition-colors text-xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-bold">{m.name}</span>
                      <span className="bg-sky-950/40 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded text-[8.5px] font-mono leading-none">
                        {m.role}
                      </span>
                      {m.status === 'suspended' && (
                        <span className="bg-red-950/40 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded text-[8.5px] font-mono leading-none">
                          已被锁定
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500">{m.email} | 承载流水事件: <strong>{m.assignedTasks}</strong></div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(m.id)}
                      className={`p-1 border.2 rounded cursor-pointer ${
                        m.status === 'active' 
                          ? 'text-emerald-400 hover:text-emerald-300' 
                          : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                      title={m.status === 'active' ? "禁用席位" : "重新激活"}
                    >
                      {m.status === 'active' ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteMember(m.id, m.name)}
                      className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="废免账号"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active session role quick override */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
            <div className="border-b border-[#2F3336]/60 pb-2">
              <h4 className="text-white text-xs font-mono uppercase tracking-wider flex items-center space-x-1">
                <Key className="w-4 h-4 text-amber-400" />
                <span>一键切换系统角色 (Switch active role)</span>
              </h4>
            </div>

            <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
              为了方便您全栈测试 MODAUI 设计的高级细粒度权限逻辑。
              您可以一键在此更改当前的预览调试席位，测试系统界面的响应拦截：
            </p>

            <div className="space-y-2">
              {[
                { r: 'Platform Admin', label: '💻 平台超级管理员 (Admin)', color: 'border-sky-500 bg-sky-950/15 text-sky-400' },
                { r: 'Merchant Owner', label: '👑 创始人和所有者 (Founder)', color: 'border-white bg-white/5 text-white' },
                { r: 'Manager', label: '👔 运营与市场总监 (Manager)', color: 'border-emerald-500 bg-emerald-950/15 text-emerald-400' },
                { r: 'Staff', label: '🛠️ 店内值班客服/员工 (Staff)', color: 'border-amber-500 bg-amber-950/15 text-amber-400' },
                { r: 'Customer', label: '👤 端点消费者/买家 (Buyer)', color: 'border-zinc-800 bg-zinc-900/40 text-zinc-400' }
              ].map((item) => (
                <button
                  key={item.r}
                  onClick={() => {
                    onRoleChange(item.r as UserRole);
                    if (onAddLog) {
                      onAddLog('SaaS 系统总台', '🧬', `已将测试用户的工作空间角色切换为: ${item.r}`, 'info');
                    }
                  }}
                  className={`w-full p-2.5 border text-left rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    currentRole === item.r 
                      ? `${item.color} shadow-lg scale-[1.01]` 
                      : 'border-zinc-900 bg-black/40 text-zinc-500 hover:text-zinc-300 hover:border-[#2F3336]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{item.label}</span>
                    {currentRole === item.r && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#09090B] border border-[#2F3336] p-5 rounded-xl space-y-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h4 className="text-white text-xs font-mono uppercase tracking-wider font-bold">RBAC 熔断与防护规范</h4>
            </div>

            <div className="h-px bg-zinc-900" />
            
            <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
              MODAUI 搭载的高带宽 API 模型及 WeChat Pay 回调端点受多重物理网盾拦截。
              对于 Staff 席位，其所调起的任何未授权写入或高危删除一律将被底层安全过滤并打印系统告警日志。
            </p>
          </div>
        </div>
      </div>

      {/* Modal: New Member allocation */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#09090B] border border-[#2F3336] w-full max-w-md p-6 rounded-xl space-y-5 shadow-2xl relative text-left">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white font-sans">分配全新员工/客服席位</h3>
              <p className="text-[10px] text-zinc-500">
                此新主体将加入商户团队并获取专门签发的登录 OAuth 通证。
              </p>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-zinc-500 uppercase block">成员姓名 / 客服机器人</label>
                <input
                  type="text"
                  required
                  placeholder="如: AI-006文案专员 或 运营小张"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  className="w-full bg-black border border-[#2F3336] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-white font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-zinc-500 uppercase block">成员系统邮箱</label>
                <input
                  type="email"
                  required
                  placeholder="name@business.com"
                  value={newMemberEmail}
                  onChange={e => setNewMemberEmail(e.target.value)}
                  className="w-full bg-black border border-[#2F3336] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-zinc-500 uppercase block">预置系统角色等级 (Role)</label>
                <select
                  value={newMemberRole}
                  onChange={e => setNewMemberRole(e.target.value as UserRole)}
                  className="w-full bg-black border border-[#2F3336] rounded-lg p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-white"
                >
                  <option value="Staff">常规员工权限 (Staff)</option>
                  <option value="Manager">主管经理权限 (Manager)</option>
                  <option value="Merchant Owner">创始人全局席位 (Founder Owner)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-900 rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-extrabold rounded-lg cursor-pointer"
                >
                  确认添加并签发契约
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
