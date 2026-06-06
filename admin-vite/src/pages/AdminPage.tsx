import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/store';
import { apiRequest } from '@/utils/api';
import { formatCurrency } from '@/utils/currency';
import { translations } from '@/utils/translations';
import {
  LayoutDashboard,
  Users as UsersIcon,
  Wallet,
  Layers,
  BarChart3,
  ShieldAlert,
  FileText,
  Megaphone,
  MessageSquare,
  Settings as SettingsIcon,
  ClipboardList,
  Activity,
  LogOut,
  Globe,
  Plus,
  Search,
  Check,
  X,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
  Eye,
  RefreshCw,
  Lock,
  Unlock,
  CornerDownRight,
  Send,
  Sliders,
  DollarSign,
  Ticket
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import CouponsAdminPanel from '@/components/CouponsAdminPanel';

// Panel types
type TabType =
  | 'overview'
  | 'users'
  | 'withdrawals'
  | 'offerwalls'
  | 'analytics'
  | 'fraud'
  | 'cms'
  | 'notifications'
  | 'tickets'
  | 'settings'
  | 'audit_logs'
  | 'monitor'
  | 'coupons'
  | 'deposits';

export default function AdminPage() {
  const { user, logout, addToast, lang, toggleLang } = useAppStore();
  const t = translations[lang];
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currency, setCurrency] = useState<'SAR'>('SAR');
  const [loading, setLoading] = useState(true);

  // States for data
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [filterWdStatus, setFilterWdStatus] = useState<string>('all');
  const [deposits, setDeposits] = useState<any[]>([]);
  const [offerwalls, setOfferwalls] = useState<any[]>([]);
  const [fraudLogs, setFraudLogs] = useState<any[]>([]);
  const [cmsBlocks, setCmsBlocks] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [settings, setSettings] = useState<any>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [monitorStats, setMonitorStats] = useState<any>(null);

  // Modal Editing States
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingOfferwall, setEditingOfferwall] = useState<any>(null);
  const [isCreatingOfferwall, setIsCreatingOfferwall] = useState(false);
  const [auditingWithdrawal, setAuditingWithdrawal] = useState<any>(null);
  const [auditStatus, setAuditStatus] = useState<'approved' | 'rejected'>('approved');
  const [txRef, setTxRef] = useState('');
  const [auditNotes, setAuditNotes] = useState('');
  const [blacklistIpInput, setBlacklistIpInput] = useState('');
  const [fraudThreshold, setFraudThreshold] = useState(80);
  const [broadcastData, setBroadcastData] = useState({ title: '', message: '', type: 'info' });
  const [cmsInput, setCmsInput] = useState({ key: '', content: '' });
  const [receiptImageModal, setReceiptImageModal] = useState<string | null>(null);

  // Load basic stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Poll server monitor and log counts
  useEffect(() => {
    let interval: any;
    if (activeTab === 'monitor') {
      fetchMonitorData();
      interval = setInterval(fetchMonitorData, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  // Load appropriate panel data when tab changes
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'withdrawals') fetchWithdrawals();
    else if (activeTab === 'deposits') fetchDeposits();
    else if (activeTab === 'offerwalls') fetchOfferwalls();
    else if (activeTab === 'fraud') {
      fetchFraudLogs();
    } else if (activeTab === 'cms') fetchCMSBlocks();
    else if (activeTab === 'tickets') fetchTickets();
    else if (activeTab === 'settings') fetchSettings();
    else if (activeTab === 'audit_logs') fetchAuditLogs();
    else if (activeTab === 'overview') fetchStats();
  }, [activeTab]);

  // API Call wrappers
  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/stats');
      setStats(data);
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const query = searchUser ? `?search=${encodeURIComponent(searchUser)}` : '';
      const data = await apiRequest(`/admin/users${query}`);
      setUsers(data);
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const filter = filterWdStatus !== 'all' ? `?status_filter=${filterWdStatus}` : '';
      const data = await apiRequest(`/admin/withdrawals${filter}`);
      setWithdrawals(data);
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/deposits');
      setDeposits(data);
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOfferwalls = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/offerwalls');
      setOfferwalls(data);
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchFraudLogs = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/fraud-logs');
      setFraudLogs(data);
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCMSBlocks = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/cms');
      setCmsBlocks(data);
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/tickets');
      setTickets(data);
      if (selectedTicket) {
        // Update selection if open
        const updated = data.find((t: any) => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/settings');
      setSettings(data);
      if (data.auto_ban_risk) {
        setFraudThreshold(parseInt(data.auto_ban_risk));
      }
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/audit-logs');
      setAuditLogs(data);
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonitorData = async () => {
    try {
      const data = await apiRequest('/admin/monitor');
      setMonitorStats(data);
    } catch (err) {
      console.error('Error fetching live system stats', err);
    }
  };

  // Actions
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await apiRequest(`/admin/users/${editingUser.id}/edit`, {
        method: 'POST',
        body: JSON.stringify({
          status: editingUser.status,
          role: editingUser.role,
          wallet_balance: parseFloat(editingUser.wallet_balance)
        })
      });
      addToast('User Updated', `Successfully updated profile of user ${editingUser.username}`, 'success');
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleForceLogout = async (userId: string, username: string) => {
    try {
      await apiRequest(`/admin/users/${userId}/logout`, { method: 'POST' });
      addToast('Force Logout', `Revoked all active sessions for ${username}`, 'success');
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleAuditWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditingWithdrawal) return;
    try {
      await apiRequest(`/admin/withdrawals/${auditingWithdrawal.id}/action`, {
        method: 'POST',
        body: JSON.stringify({
          status: auditStatus,
          transaction_reference: txRef,
          admin_notes: auditNotes
        })
      });
      addToast(
        'Payout Processed',
        `Withdrawal of ${auditingWithdrawal.amount} coins has been ${auditStatus}.`,
        auditStatus === 'approved' ? 'success' : 'error'
      );
      setAuditingWithdrawal(null);
      setTxRef('');
      setAuditNotes('');
      fetchWithdrawals();
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleSaveOfferwall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfferwall) return;
    try {
      await apiRequest(`/admin/offerwalls/${editingOfferwall.id}`, {
        method: 'POST',
        body: JSON.stringify({
          api_key: editingOfferwall.api_key,
          api_secret: editingOfferwall.api_secret,
          app_id: editingOfferwall.app_id,
          multiplier: parseFloat(editingOfferwall.multiplier),
          is_enabled: editingOfferwall.is_enabled,
          iframe_url: editingOfferwall.iframe_url,
          geo_restrictions: typeof editingOfferwall.geo_restrictions === 'string'
            ? editingOfferwall.geo_restrictions.split(',').map((c: string) => c.trim()).filter(Boolean)
            : editingOfferwall.geo_restrictions
        })
      });
      addToast('Offerwall Saved', `Successfully updated configurations for ${editingOfferwall.name}`, 'success');
      setEditingOfferwall(null);
      fetchOfferwalls();
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleCreateOfferwall = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const payload = {
      name: formData.get('name') as string,
      identifier: formData.get('identifier') as string,
      iframe_url: formData.get('iframe_url') as string,
      multiplier: parseFloat(formData.get('multiplier') as string || '1.0'),
      is_enabled: formData.get('is_enabled') === 'true',
      geo_restrictions: (formData.get('geo_restrictions') as string || '').split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      await apiRequest('/admin/offerwalls/create', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      addToast('Offerwall Created', `Added customized wall "${payload.name}" to database.`, 'success');
      setIsCreatingOfferwall(false);
      fetchOfferwalls();
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleSaveFraudSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/admin/fraud/settings', {
        method: 'POST',
        body: JSON.stringify({
          auto_ban_risk: fraudThreshold,
          blacklist_ip: blacklistIpInput || undefined
        })
      });
      addToast('Fraud Settings Saved', `Auto-ban threshold set to ${fraudThreshold}%`, 'success');
      setBlacklistIpInput('');
      fetchFraudLogs();
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleSaveCMSBlock = async (key: string, content: string) => {
    try {
      await apiRequest('/admin/cms', {
        method: 'POST',
        body: JSON.stringify({ key, content })
      });
      addToast('CMS Saved', `Updated component block: ${key}`, 'success');
      fetchCMSBlocks();
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastData.title || !broadcastData.message) return;
    try {
      await apiRequest('/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify(broadcastData)
      });
      addToast('Alert Broadcasted', 'System notification pushed to all users successfully.', 'success');
      setBroadcastData({ title: '', message: '', type: 'info' });
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketReply.trim() || !selectedTicket) return;
    try {
      const rep = await apiRequest(`/admin/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: ticketReply })
      });
      // Append reply locally for visual convenience
      setSelectedTicket((prev: any) => ({
        ...prev,
        status: 'replied',
        messages: [...prev.messages, rep]
      }));
      setTicketReply('');
      addToast('Reply Sent', 'Your response has been saved on the ticket.', 'success');
      fetchTickets();
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleDepositAction = async (id: string, action: string, admin_instructions?: string) => {
    try {
      await apiRequest(`/admin/deposits/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, admin_instructions })
      });
      addToast('Success', `Deposit ${action} successful`, 'success');
      fetchDeposits();
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/admin/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
      addToast('Settings Saved', 'Global values updated successfully.', 'success');
      fetchSettings();
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  const sidebarItems = [
    { id: 'overview', label: t.tab_overview, icon: LayoutDashboard },
    { id: 'users', label: t.tab_users, icon: UsersIcon },
    { id: 'withdrawals', label: t.tab_withdrawals, icon: Wallet },
    { id: 'deposits', label: isAr ? 'الإيداعات' : 'Deposits', icon: DollarSign },
    { id: 'offerwalls', label: t.tab_offerwalls, icon: Layers },
    { id: 'analytics', label: t.tab_analytics, icon: BarChart3 },
    { id: 'fraud', label: t.tab_fraud, icon: ShieldAlert },
    { id: 'cms', label: t.tab_cms, icon: FileText },
    { id: 'coupons', label: isAr ? 'الكوبونات' : 'Coupons', icon: Ticket },
    { id: 'notifications', label: t.tab_notifications, icon: Megaphone },
    { id: 'tickets', label: t.tab_tickets, icon: MessageSquare },
    { id: 'settings', label: t.tab_settings, icon: SettingsIcon },
    { id: 'audit_logs', label: t.tab_audit_logs, icon: ClipboardList },
    { id: 'monitor', label: t.tab_monitor, icon: Activity },
  ];

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex font-display antialiased"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Header Branding */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white leading-tight">
                {t.admin_title}
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                {t.admin_subtitle}
              </p>
            </div>
          </div>

          {/* Admin Identity Card */}
          <div className="p-5 border-b border-slate-800/60 bg-slate-950/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center font-bold text-slate-950 shadow-inner">
                {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user?.username || 'Administrator'}</p>
                <span className="inline-block mt-0.5 text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/25 px-1.5 py-0.25 rounded-md">
                  {user?.role || 'Super Admin'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all relative overflow-hidden group cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_4px_15px_rgba(245,158,11,0.2)]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-4">
          {/* Language Switcher */}
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {isAr ? 'اللغة' : 'Language'}
            </span>
            <button
              onClick={toggleLang}
              className="px-2.5 py-1 rounded-lg font-bold text-xs bg-slate-800 border border-slate-700 hover:border-amber-500/30 text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAr ? 'English' : 'العربية'}</span>
            </button>
          </div>


          {/* Sign Out */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-800 hover:border-rose-500/30 bg-slate-950/30 hover:bg-rose-500/5 text-slate-400 hover:text-rose-400 transition-all text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.admin_signout}</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT REGION */}
      <main className="flex-grow flex flex-col h-screen overflow-y-auto bg-slate-950">
        {/* TOP SYSTEM BAR */}
        <header className="h-16 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/40 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white tracking-tight uppercase">
              {sidebarItems.find((s) => s.id === activeTab)?.label}
            </h2>
            <div className="w-px h-5 bg-slate-800" />
            {/* System Status Indicators */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-400">{t.admin_gateway_online}</span>
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-405">
            {t.admin_server_time}: <span className="text-white font-mono">{new Date().toLocaleTimeString()}</span>
          </div>
        </header>

        {/* DYNAMIC SCROLLABLE BODY */}
        <div className="p-8 flex-grow">
          {loading && activeTab !== 'monitor' ? (
            <div className="h-64 flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs text-slate-500 mt-3 font-semibold uppercase tracking-wider">{t.admin_syncing}</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* -------------------- 1. OVERVIEW PANEL -------------------- */}
                {activeTab === 'overview' && stats && (
                  <div className="space-y-8">
                    {/* Overview Stat Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                      <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.ov_registered_users}</p>
                          <h3 className="text-3xl font-extrabold mt-2 text-white">{stats.total_users}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                          <UsersIcon className="w-6 h-6" />
                        </div>
                      </div>

                      <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.ov_active_online}</p>
                          <h3 className="text-3xl font-extrabold mt-2 text-white flex items-center gap-2">
                            <span>{stats.active_users}</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                          </h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                          <Activity className="w-6 h-6" />
                        </div>
                      </div>

                      <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.ov_pending_payouts}</p>
                          <h3 className={`text-3xl font-extrabold mt-2 ${stats.pending_payouts > 0 ? 'text-amber-400' : 'text-white'}`}>
                            {stats.pending_payouts}
                          </h3>
                        </div>
                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                          stats.pending_payouts > 0
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                            : 'bg-slate-800/50 border-slate-800 text-slate-400'
                        }`}>
                          <Wallet className="w-6 h-6" />
                        </div>
                      </div>

                      <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.ov_security_alerts}</p>
                          <h3 className={`text-3xl font-extrabold mt-2 ${stats.fraud_alerts > 0 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                            {stats.fraud_alerts}
                          </h3>
                        </div>
                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                          stats.fraud_alerts > 0
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            : 'bg-slate-800/50 border-slate-800 text-slate-400'
                        }`}>
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                      </div>
                    </div>

                    {/* Chart / Analytical Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Left: simulated activity log */}
                      <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
                        <div>
                          <h3 className="font-extrabold text-base text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                            <Activity className="w-5 h-5 text-amber-500" />
                            <span>{t.ov_activity_feed}</span>
                          </h3>
                          <div className="space-y-4">
                            {stats.activity_feed?.map((item: any, i: number) => (
                              <div key={i} className="flex items-start gap-3 text-sm border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
                                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                  item.type === 'signup' ? 'bg-blue-400' : item.type === 'withdrawal' ? 'bg-amber-400' : 'bg-emerald-400'
                                }`} />
                                <div className="flex-grow">
                                  <p className="text-slate-300 font-semibold">{item.text}</p>
                                  <span className="text-[10px] text-slate-500 font-bold">{item.time}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={fetchStats}
                          className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs uppercase tracking-wider text-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>{t.ov_refresh_stream}</span>
                        </button>
                      </div>

                      {/* Right side stats */}
                      <div className="space-y-6">
                        {/* Top Users */}
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                          <h3 className="font-extrabold text-sm text-white mb-4 uppercase tracking-wider">{t.ov_top_earners}</h3>
                          <div className="space-y-3">
                            {stats.top_users?.map((u: any, i: number) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-450">
                                    {i + 1}
                                  </span>
                                  <span className="font-semibold text-slate-200">{u.username}</span>
                                </div>
                                <span className="font-bold text-emerald-400 font-mono">
                                  {formatCurrency(u.total_earned, currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Top Offerwalls */}
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                          <h3 className="font-extrabold text-sm text-white mb-4 uppercase tracking-wider">{t.ov_top_offerwalls}</h3>
                          <div className="space-y-3">
                            {stats.best_offerwalls?.map((o: any, i: number) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-slate-200">{o.name}</span>
                                <span className="font-bold text-amber-400 font-mono">
                                  {formatCurrency(o.revenue, currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* -------------------- 1.5. COUPONS PANEL -------------------- */}
                {activeTab === 'coupons' && (
                  <CouponsAdminPanel />
                )}

                {/* -------------------- 2. USER MANAGEMENT -------------------- */}
                {activeTab === 'users' && (
                  <div className="space-y-6">
                    {/* Search & Filter Header */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
                      <div className="relative w-full md:max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder={t.us_search_placeholder}
                          value={searchUser}
                          onChange={(e) => setSearchUser(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <button
                        onClick={fetchUsers}
                        className="w-full md:w-auto px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>{t.us_filter_list}</span>
                      </button>
                    </div>

                    {/* Users Table */}
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm" dir={isAr ? 'rtl' : 'ltr'}>
                          <thead className="bg-slate-900 border-b border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="p-4 pl-6 text-start">{t.us_username}</th>
                              <th className="p-4 text-start">{t.us_email}</th>
                              <th className="p-4 text-start">{t.us_balance}</th>
                              <th className="p-4 text-start">{t.us_role}</th>
                              <th className="p-4 text-start">{t.us_status}</th>
                              <th className="p-4 text-start">{t.us_joined}</th>
                              <th className="p-4 pr-6 text-end">{t.us_actions}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {users.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-500">
                                  {t.us_empty}
                                </td>
                              </tr>
                            ) : (
                              users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-900/20 transition-colors">
                                  <td className="p-4 pl-6 font-semibold text-white text-start">{u.username}</td>
                                  <td className="p-4 text-slate-300 font-mono text-xs text-start">{u.email}</td>
                                  <td className="p-4 font-bold text-emerald-400 font-mono text-start">
                                    {formatCurrency(u.wallet_balance, currency)}
                                  </td>
                                  <td className="p-4 text-start">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      u.role === 'admin' || u.role === 'superadmin'
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                                        : 'bg-slate-800 text-slate-450'
                                    }`}>
                                      {u.role}
                                    </span>
                                  </td>
                                  <td className="p-4 text-start">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      u.status === 'active'
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : u.status === 'suspended'
                                        ? 'bg-amber-500/10 text-amber-400'
                                        : 'bg-rose-500/10 text-rose-400'
                                    }`}>
                                      {u.status}
                                    </span>
                                  </td>
                                  <td className="p-4 text-slate-400 text-xs text-start">{new Date(u.created_at).toLocaleDateString()}</td>
                                  <td className="p-4 pr-6 text-end">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => setEditingUser(u)}
                                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                      >
                                        {t.us_edit}
                                      </button>
                                      <button
                                        onClick={() => handleForceLogout(u.id, u.username)}
                                        className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-lg border border-rose-500/20 transition-colors cursor-pointer"
                                      >
                                        {t.us_kill_session}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* -------------------- 3. WITHDRAWAL QUEUE -------------------- */}
                {activeTab === 'withdrawals' && (
                  <div className="space-y-6">
                    {/* Queue filter tabs */}
                    <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
                      <div className="flex gap-2">
                        {['all', 'pending', 'approved', 'rejected'].map((status) => (
                          <button
                            key={status}
                            onClick={() => {
                              setFilterWdStatus(status);
                              setTimeout(fetchWithdrawals, 0);
                            }}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                              filterWdStatus === status
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {status === 'all' ? (isAr ? 'الكل' : 'All') : status === 'pending' ? (isAr ? 'معلق' : 'Pending') : status === 'approved' ? (isAr ? 'مقبول' : 'Approved') : (isAr ? 'مرفوض' : 'Rejected')}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={fetchWithdrawals}
                        className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        {t.py_refresh}
                      </button>
                    </div>

                    {/* Withdrawals Table */}
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm" dir={isAr ? 'rtl' : 'ltr'}>
                          <thead className="bg-slate-900 border-b border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <tr>
                              <th className="p-4 pl-6 text-start">{t.py_id}</th>
                              <th className="p-4 text-start">{t.py_user}</th>
                              <th className="p-4 text-start">{t.py_amount}</th>
                              <th className="p-4 text-start">{t.py_method}</th>
                              <th className="p-4 text-start">{t.py_details}</th>
                              <th className="p-4 text-start">{t.py_date}</th>
                              <th className="p-4 text-start">{t.py_status}</th>
                              <th className="p-4 pr-6 text-end">{t.us_actions}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {withdrawals.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="p-8 text-center text-slate-500">
                                  {t.py_empty}
                                </td>
                              </tr>
                            ) : (
                              withdrawals.map((w) => (
                                <tr key={w.id} className="hover:bg-slate-900/20 transition-colors">
                                  <td className="p-4 pl-6 font-semibold text-slate-450 text-xs font-mono text-start">{w.id.substring(0, 8)}...</td>
                                  <td className="p-4 font-semibold text-white text-start">{w.username}</td>
                                  <td className="p-4 font-bold text-amber-500 font-mono text-start">
                                    {formatCurrency(w.amount, currency)}
                                  </td>
                                  <td className="p-4 font-semibold text-slate-300 text-start">{w.method}</td>
                                  <td className="p-4 text-xs font-mono text-slate-400 max-w-xs truncate text-start">{w.details}</td>
                                  <td className="p-4 text-slate-400 text-xs text-start">{new Date(w.created_at).toLocaleDateString()}</td>
                                  <td className="p-4 text-start">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      w.status === 'pending'
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse'
                                        : w.status === 'approved'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                                    }`}>
                                      {w.status === 'pending' ? (isAr ? 'معلق' : 'pending') : w.status === 'approved' ? (isAr ? 'مقبول' : 'approved') : (isAr ? 'مرفوض' : 'rejected')}
                                    </span>
                                  </td>
                                  <td className="p-4 pr-6 text-end">
                                    {w.status === 'pending' ? (
                                      <button
                                        onClick={() => {
                                          setAuditingWithdrawal(w);
                                          setAuditStatus('approved');
                                        }}
                                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                      >
                                        {t.py_audit_btn}
                                      </button>
                                    ) : (
                                      <span className="text-slate-500 text-xs italic font-medium">{t.py_audited}</span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* -------------------- DEPOSITS PANEL -------------------- */}
                {activeTab === 'deposits' && (
                  <div className="space-y-6">
                    <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl">
                      <div className="p-5 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/80">
                        <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-amber-500" />
                          {isAr ? 'إدارة الإيداعات' : 'Manage Deposits'}
                        </h2>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-900/50 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold border-b border-slate-800/60">
                              <th className="p-4 pl-6">{t.py_user}</th>
                              <th className="p-4">{t.py_amount}</th>
                              <th className="p-4">{t.py_status}</th>
                              <th className="p-4">{isAr ? 'الإثبات' : 'Proof'}</th>
                              <th className="p-4">{t.py_date}</th>
                              <th className="p-4 pr-6 text-end">{isAr ? 'الإجراء' : 'Action'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deposits.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-500 text-xs font-bold">
                                  {isAr ? 'لا توجد طلبات إيداع' : 'No deposit requests found.'}
                                </td>
                              </tr>
                            ) : (
                              deposits.map((d: any) => (
                                <tr key={d.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                                  <td className="p-4 pl-6">
                                    <div className="font-bold text-slate-200 text-sm">{d.username}</div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{d.email}</div>
                                  </td>
                                  <td className="p-4 font-display font-black text-amber-500">
                                    ${parseFloat(d.amount.toString()).toFixed(2)}
                                  </td>
                                  <td className="p-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                      d.status === 'awaiting_details' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                      d.status === 'awaiting_payment' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                      d.status === 'pending_approval' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                      d.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                      'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                    }`}>
                                      {d.status.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    {d.receipt_url ? (
                                      <button onClick={() => setReceiptImageModal(d.receipt_url)} className="text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center gap-1 cursor-pointer">
                                        <Eye className="w-3 h-3" /> {isAr ? 'عرض' : 'View'}
                                      </button>
                                    ) : (
                                      <span className="text-slate-500 text-[10px]">-</span>
                                    )}
                                  </td>
                                  <td className="p-4 text-xs font-medium text-slate-400">
                                    {new Date(d.created_at).toLocaleString()}
                                  </td>
                                  <td className="p-4 pr-6 text-end">
                                    {d.status === 'awaiting_details' && (
                                      <button
                                        onClick={() => {
                                          const instr = prompt(isAr ? 'أدخل تعليمات الدفع (مثلاً إيميل الباي بال):' : 'Enter payment instructions (e.g. PayPal email):');
                                          if (instr) handleDepositAction(d.id, 'send_instructions', instr);
                                        }}
                                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                      >
                                        {isAr ? 'إرسال التفاصيل' : 'Send Details'}
                                      </button>
                                    )}
                                    {d.status === 'pending_approval' && (
                                      <div className="flex justify-end gap-2">
                                        <button
                                          onClick={() => {
                                            if (confirm(isAr ? 'هل أنت متأكد من الموافقة؟' : 'Are you sure you want to approve?')) {
                                              handleDepositAction(d.id, 'approve');
                                            }
                                          }}
                                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                        >
                                          {isAr ? 'قبول' : 'Approve'}
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (confirm(isAr ? 'هل أنت متأكد من الرفض؟' : 'Are you sure you want to reject?')) {
                                              handleDepositAction(d.id, 'reject');
                                            }
                                          }}
                                          className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                        >
                                          {isAr ? 'رفض' : 'Reject'}
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* -------------------- 4. OFFERWALLS PANEL -------------------- */}
                {activeTab === 'offerwalls' && (
                  <div className="space-y-6">
                    {/* Title Header with Add Button */}
                    <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        {t.ow_desc}
                      </p>
                      <button
                        onClick={() => setIsCreatingOfferwall(true)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{t.ow_add_btn}</span>
                      </button>
                    </div>

                    {/* Offerwalls Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {offerwalls.map((wall) => (
                        <div
                          key={wall.id}
                          className={`bg-slate-900 border rounded-2xl p-6 flex flex-col justify-between transition-all hover:translate-y-[-2px] ${
                            wall.is_enabled
                              ? 'border-amber-500/30 shadow-[0_4px_15px_rgba(245,158,11,0.05)]'
                              : 'border-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-extrabold text-base text-white">{wall.name}</h4>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                wall.is_enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                              }`}>
                                {wall.is_enabled ? t.ow_enabled : t.ow_disabled}
                              </span>
                            </div>

                            <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800/50 pt-4 mb-5">
                              <div className="flex justify-between">
                                <span>{t.ow_identifier}:</span>
                                <span className="font-bold text-white font-mono">{wall.identifier}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Postback URL:</span>
                                <span className="font-bold text-blue-400 font-mono select-all">
                                  {`http://localhost:8000/api/postback/${wall.identifier}`}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>{t.ow_multiplier}:</span>
                                <span className="font-bold text-emerald-400 font-mono">x{wall.multiplier}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>{t.ow_restrictions}:</span>
                                <span className="font-semibold text-slate-300">
                                  {wall.geo_restrictions?.length > 0
                                    ? wall.geo_restrictions.join(', ')
                                    : (isAr ? 'لا يوجد' : 'None')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setEditingOfferwall(wall)}
                            className="w-full py-2 bg-slate-850 hover:bg-slate-800 text-white border border-slate-800 hover:border-amber-500/30 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Sliders className="w-4.5 h-4.5 text-amber-500" />
                            <span>{t.ow_modify}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* -------------------- 5. FINANCIAL ANALYTICS -------------------- */}
                {activeTab === 'analytics' && stats && (
                  <div className="space-y-8">
                    {/* Main revenue flow graph */}
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                      <h3 className="font-extrabold text-base text-white mb-6 uppercase tracking-wider">
                        {t.an_title}
                      </h3>
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={stats.revenue_chart || []}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorPayouts" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="month" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                            <Legend />
                            <Area type="monotone" dataKey="revenue" name={isAr ? 'إجمالي الإيرادات ($)' : 'Total Gross Revenue ($)'} stroke="#f59e0b" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                            <Area type="monotone" dataKey="payouts" name={isAr ? 'سحوبات المستخدمين ($)' : 'Total User Payouts ($)'} stroke="#10b981" fillOpacity={1} fill="url(#colorPayouts)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Grid charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                        <h3 className="font-extrabold text-sm text-white mb-6 uppercase tracking-wider">
                          {t.an_geo_traffic}
                        </h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.top_countries || []}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis dataKey="name" stroke="#64748b" />
                              <YAxis stroke="#64748b" />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                              <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                {stats.top_countries?.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#3b82f6'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                        <h3 className="font-extrabold text-sm text-white mb-6 uppercase tracking-wider">
                          {t.an_volume}
                        </h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.best_offerwalls || []} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis type="number" stroke="#64748b" />
                              <YAxis dataKey="name" type="category" stroke="#64748b" width={80} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                              <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* -------------------- 6. FRAUD CENTER -------------------- */}
                {activeTab === 'fraud' && (
                  <div className="space-y-8">
                    {/* Settings Form & Config */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                        <h3 className="font-extrabold text-sm text-white mb-5 uppercase tracking-wider">
                          {t.fr_limits}
                        </h3>
                        <form onSubmit={handleSaveFraudSettings} className="space-y-5">
                          <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                              {t.fr_auto_ban}: {fraudThreshold}%
                            </label>
                            <input
                              type="range"
                              min="50"
                              max="100"
                              value={fraudThreshold}
                              onChange={(e) => setFraudThreshold(parseInt(e.target.value))}
                              className="w-full accent-amber-500 cursor-pointer"
                            />
                            <span className="text-[10px] text-slate-500 mt-1 block">
                              {t.fr_auto_ban_desc}
                            </span>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                              {t.fr_blacklist_ip}
                            </label>
                            <input
                              type="text"
                              placeholder="192.168.1.1"
                              value={blacklistIpInput}
                              onChange={(e) => setBlacklistIpInput(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-amber-600 transition-colors cursor-pointer"
                          >
                            {t.fr_update_policy}
                          </button>
                        </form>
                      </div>

                      {/* Log output */}
                      <div className="md:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                        <h3 className="font-extrabold text-sm text-white mb-5 uppercase tracking-wider">
                          {t.fr_logs_title}
                        </h3>
                        <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left" dir={isAr ? 'rtl' : 'ltr'}>
                              <thead className="bg-slate-900 font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                                <tr>
                                  <th className="p-3 pl-4 text-start">{t.fr_suspect}</th>
                                  <th className="p-3 text-start">{t.au_ip}</th>
                                  <th className="p-3 text-start">{t.fr_threat}</th>
                                  <th className="p-3 text-start">{t.fr_reason}</th>
                                  <th className="p-3 pr-4 text-end">{t.py_date}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/50">
                                {fraudLogs.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="p-6 text-center text-slate-500">
                                      {t.fr_empty}
                                    </td>
                                  </tr>
                                ) : (
                                  fraudLogs.map((log, i) => (
                                    <tr key={i} className="hover:bg-slate-900/20">
                                      <td className="p-3 pl-4 font-semibold text-white text-start">{log.username}</td>
                                      <td className="p-3 font-mono text-slate-300 text-start">{log.ip_address}</td>
                                      <td className="p-3 text-start">
                                        <span className={`inline-block px-1.5 py-0.25 rounded font-bold ${
                                          log.risk_score >= 80
                                            ? 'bg-rose-500/10 text-rose-400'
                                            : 'bg-amber-500/10 text-amber-400'
                                        }`}>
                                          {log.risk_score}%
                                        </span>
                                      </td>
                                      <td className="p-3 text-slate-400 text-start">{log.detection_reason}</td>
                                      <td className="p-3 pr-4 text-end text-slate-505">{new Date(log.created_at).toLocaleDateString()}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* -------------------- 7. CMS MANAGER -------------------- */}
                {activeTab === 'cms' && (
                  <div className="space-y-6">
                    <p className="text-xs text-slate-400 font-medium">
                      {t.cms_desc}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left: block list */}
                      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                        <h3 className="font-extrabold text-sm text-white mb-2 uppercase tracking-wider">
                          {t.cms_blocks}
                        </h3>
                        <div className="space-y-3">
                          {cmsBlocks.length === 0 ? (
                            <p className="text-xs text-slate-500">{t.cms_empty}</p>
                          ) : (
                            cmsBlocks.map((b) => (
                              <div
                                key={b.key}
                                onClick={() => setCmsInput({ key: b.key, content: b.content })}
                                className={`p-4 rounded-xl border border-slate-800/80 bg-slate-950/45 cursor-pointer hover:border-amber-500/30 transition-colors ${
                                  cmsInput.key === b.key ? 'border-amber-500 bg-slate-900/30' : ''
                                }`}
                              >
                                <span className="text-xs font-bold text-amber-500 font-mono">{b.key}</span>
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{b.content}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Right: Block editing console */}
                      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                        <h3 className="font-extrabold text-sm text-white mb-5 uppercase tracking-wider">
                          {t.cms_editor}
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                              {t.cms_key}
                            </label>
                            <input
                              type="text"
                              value={cmsInput.key}
                              onChange={(e) => setCmsInput({ ...cmsInput, key: e.target.value })}
                              placeholder="e.g. faq_1_question"
                              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                              {t.cms_content}
                            </label>
                            <textarea
                              value={cmsInput.content}
                              onChange={(e) => setCmsInput({ ...cmsInput, content: e.target.value })}
                              rows={8}
                              placeholder="Key text or html content template..."
                              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 font-sans"
                            />
                          </div>

                          <button
                            onClick={() => handleSaveCMSBlock(cmsInput.key, cmsInput.content)}
                            disabled={!cmsInput.key || !cmsInput.content}
                            className="w-full py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {t.cms_save}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* -------------------- 8. BROADCAST SYSTEM -------------------- */}
                {activeTab === 'notifications' && (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 max-w-xl">
                    <h3 className="font-extrabold text-base text-white mb-2 uppercase tracking-wider">
                      {t.nt_title}
                    </h3>
                    <p className="text-xs text-slate-400 mb-6">
                      {t.nt_desc}
                    </p>

                    <form onSubmit={handleBroadcastAlert} className="space-y-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                          {t.nt_type}
                        </label>
                        <select
                          value={broadcastData.type}
                          onChange={(e) => setBroadcastData({ ...broadcastData, type: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200"
                        >
                          <option value="info">{isAr ? 'معلوماتي (أزرق)' : 'Information (Blue)'}</option>
                          <option value="success">{isAr ? 'مكافآت وفعاليات (أخضر)' : 'Event Claim / Rewards (Green)'}</option>
                          <option value="warning">{isAr ? 'تنبيه طارئ / صيانة (برتقالي)' : 'System Alert / Maintenance (Orange)'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                          {t.nt_header}
                        </label>
                        <input
                          type="text"
                          required
                          value={broadcastData.title}
                          onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                          placeholder="e.g. Server Maintenance Scheduled"
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                          {t.nt_body}
                        </label>
                        <textarea
                          required
                          value={broadcastData.message}
                          onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                          rows={4}
                          placeholder="Write the contents of the warning banner details here..."
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                      >
                        {t.nt_push}
                      </button>
                    </form>
                  </div>
                )}

                {/* -------------------- 9. SUPPORT TICKETS -------------------- */}
                {activeTab === 'tickets' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px] items-stretch">
                    {/* Left: Tickets queue */}
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 overflow-y-auto flex flex-col">
                      <h3 className="font-extrabold text-sm text-white mb-4 uppercase tracking-wider">
                        {t.tk_inbox}
                      </h3>
                      <div className="space-y-3 flex-grow overflow-y-auto pr-1">
                        {tickets.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-8">{t.tk_empty}</p>
                        ) : (
                          tickets.map((t) => (
                            <div
                              key={t.id}
                              onClick={() => setSelectedTicket(t)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                selectedTicket?.id === t.id
                                  ? 'border-amber-500 bg-slate-950/60 shadow-sm'
                                  : 'border-slate-800/80 bg-slate-950/20 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">{t.username}</span>
                                <span className={`px-1.5 py-0.25 rounded text-[8px] font-bold uppercase ${
                                  t.status === 'open'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                    : t.status === 'replied'
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : 'bg-slate-800 text-slate-500'
                                }`}>
                                  {t.status === 'open' ? (isAr ? 'مفتوح' : 'open') : t.status === 'replied' ? (isAr ? 'تم الرد' : 'replied') : (isAr ? 'مغلق' : 'closed')}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-white mt-2 truncate">{t.subject}</h4>
                              <p className="text-[11px] text-slate-400 mt-1 truncate">{t.message}</p>
                              <div className="text-[9px] text-slate-505 mt-2 text-right">
                                {new Date(t.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Right: Message workspace */}
                    <div className="md:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
                      {selectedTicket ? (
                        <>
                          {/* Ticket header */}
                          <div className="border-b border-slate-800/50 pb-4 mb-4 flex justify-between items-center">
                            <div>
                              <h3 className="font-extrabold text-base text-white">{selectedTicket.subject}</h3>
                              <p className="text-xs text-slate-400 mt-1">
                                {t.tk_opened_by} <span className="font-semibold text-slate-200">{selectedTicket.username}</span>
                              </p>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{selectedTicket.id}</span>
                          </div>

                          {/* Message feed */}
                          <div className="flex-grow overflow-y-auto space-y-4 mb-4 pr-1">
                            {selectedTicket.messages?.map((msg: any) => (
                              <div
                                key={msg.id}
                                className={`flex flex-col max-w-[80%] ${
                                  msg.is_admin ? 'ml-auto items-end' : 'mr-auto items-start'
                                }`}
                              >
                                <div className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed ${
                                  msg.is_admin
                                    ? 'bg-amber-500 text-slate-950 rounded-tr-none'
                                    : 'bg-slate-850 text-slate-100 rounded-tl-none border border-slate-800'
                                }`}>
                                  {msg.message}
                                </div>
                                <span className="text-[9px] text-slate-500 mt-1 px-1">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Reply Box */}
                          <form onSubmit={handleSendTicketReply} className="flex gap-2">
                            <input
                              type="text"
                              value={ticketReply}
                              onChange={(e) => setTicketReply(e.target.value)}
                              placeholder={t.tk_reply_placeholder}
                              className="flex-grow px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                            />
                            <button
                              type="submit"
                              className="p-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                            >
                              <Send className="w-4.5 h-4.5" />
                            </button>
                          </form>
                        </>
                      ) : (
                        <div className="flex-grow flex flex-col justify-center items-center text-slate-500">
                          <MessageSquare className="w-12 h-12 text-slate-600 mb-3" />
                          <p className="text-sm font-semibold uppercase tracking-wider">{t.tk_workspace}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* -------------------- 10. GLOBAL SETTINGS -------------------- */}
                {activeTab === 'settings' && (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 max-w-xl">
                    <h3 className="font-extrabold text-base text-white mb-6 uppercase tracking-wider">
                      {t.st_title}
                    </h3>

                    <form onSubmit={handleSaveGlobalSettings} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                            {t.st_min_withdrawal}
                          </label>
                          <input
                            type="number"
                            value={settings.min_withdrawal || ''}
                            onChange={(e) => setSettings({ ...settings, min_withdrawal: parseInt(e.target.value) })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                            {t.st_referral}
                          </label>
                          <input
                            type="number"
                            value={settings.referral_percentage || ''}
                            onChange={(e) => setSettings({ ...settings, referral_percentage: parseInt(e.target.value) })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                          {t.st_seo_title}
                        </label>
                        <input
                          type="text"
                          value={settings.seo_title || ''}
                          onChange={(e) => setSettings({ ...settings, seo_title: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                          {t.st_seo_desc}
                        </label>
                        <textarea
                          value={settings.seo_description || ''}
                          onChange={(e) => setSettings({ ...settings, seo_description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200"
                        />
                      </div>

                      {/* Maintenance mode switch */}
                      <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">{t.st_maintenance}</h4>
                          <p className="text-[10px] text-slate-400 mt-1">{t.st_maintenance_desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.maintenance_mode === 'true' || settings.maintenance_mode === true}
                          onChange={(e) => setSettings({ ...settings, maintenance_mode: String(e.target.checked) })}
                          className="w-5 h-5 accent-rose-500 cursor-pointer"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                      >
                        {t.st_save}
                      </button>
                    </form>
                  </div>
                )}

                {/* -------------------- 11. AUDIT LOGS -------------------- */}
                {activeTab === 'audit_logs' && (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                    <h3 className="font-extrabold text-sm text-white mb-5 uppercase tracking-wider">
                      {t.au_title}
                    </h3>
                    <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left" dir={isAr ? 'rtl' : 'ltr'}>
                          <thead className="bg-slate-900 font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                            <tr>
                              <th className="p-3 pl-4 text-start">{t.au_admin}</th>
                              <th className="p-3 text-start">{t.au_action}</th>
                              <th className="p-3 text-start">{t.au_details}</th>
                              <th className="p-3 text-start">{t.au_ip}</th>
                              <th className="p-3 pr-4 text-end">{t.au_time}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {auditLogs.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-slate-500">
                                  {t.au_empty}
                                </td>
                              </tr>
                            ) : (
                              auditLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-900/20">
                                  <td className="p-3 pl-4 font-semibold text-white text-start">{log.admin_username}</td>
                                  <td className="p-3 text-start">
                                    <span className="inline-block px-1.5 py-0.25 rounded font-bold bg-slate-850 text-slate-300">
                                      {log.action}
                                    </span>
                                  </td>
                                  <td className="p-3 text-slate-350 text-start">{log.details}</td>
                                  <td className="p-3 font-mono text-slate-400 text-start">{log.ip_address}</td>
                                  <td className="p-3 pr-4 text-end text-slate-505">
                                    {new Date(log.created_at).toLocaleString()}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* -------------------- 12. LIVE SYSTEM MONITOR -------------------- */}
                {activeTab === 'monitor' && (
                  <div className="space-y-6">
                    {/* Live Gauges */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.mo_cpu}</span>
                        <h3 className="text-3xl font-extrabold text-white mt-4 font-mono">
                          {monitorStats?.cpu || '0%'}
                        </h3>
                        <div className="w-full bg-slate-850 h-1.5 rounded-full mt-3 overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: monitorStats?.cpu || '0%' }}
                          />
                        </div>
                      </div>

                      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.mo_ram}</span>
                        <h3 className="text-3xl font-extrabold text-white mt-4 font-mono">
                          {monitorStats?.memory || '0%'}
                        </h3>
                        <div className="w-full bg-slate-850 h-1.5 rounded-full mt-3 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: monitorStats?.memory || '0%' }}
                          />
                        </div>
                      </div>

                      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.mo_db}</span>
                        <h3 className="text-3xl font-extrabold text-white mt-4 font-mono">
                          {monitorStats?.db_pool || 0} / 20
                        </h3>
                        <span className="text-[10px] text-slate-500 mt-3 font-semibold">{t.mo_db_desc}</span>
                      </div>

                      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.mo_state}</span>
                        <h3 className="text-2xl font-extrabold text-emerald-400 mt-4 tracking-wider">
                          {monitorStats?.server_status || 'OFFLINE'}
                        </h3>
                        <span className="text-[10px] text-slate-500 mt-3 font-semibold">{t.mo_state_desc}</span>
                      </div>
                    </div>

                    {/* Mock Server Output Console */}
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                          {t.mo_logs}
                        </h3>
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 h-64 overflow-y-auto space-y-1.5 leading-relaxed scrollbar-thin">
                        <p className="text-slate-500">[2026-05-24T01:12:31] [SYSTEM] Initializing Borjoun cluster nodes...</p>
                        <p className="text-emerald-500">[2026-05-24T01:12:32] [DATABASE] Supabase client initialized and connected</p>
                        <p className="text-slate-300">[2026-05-24T01:12:35] [GATEWAY] API listening on routing interface port 8000</p>
                        <p className="text-slate-400">[2026-05-24T01:12:40] [MIDDLEWARE] Auth security headers loaded successfully</p>
                        <p className="text-blue-400">[2026-05-24T01:13:02] [POSTBACK] Verified postback signature from CPX Research (IP: 185.122.14.3)</p>
                        <p className="text-emerald-400">[2026-05-24T01:13:02] [USER] Credited user 'CryptoKing' +250 coins from CPX Research</p>
                        <p className="text-amber-500">[2026-05-24T01:13:10] [WITHDRAW] Payout request ID {Math.random().toString(36).substring(2,9)} queued (Vodafone Cash)</p>
                        <p className="text-slate-400">[2026-05-24T01:13:20] [MONITOR] CPU loads stabilized at {(Math.random()*15).toFixed(1)}%</p>
                        <p className="text-slate-500">[2026-05-24T01:13:45] [CRON] Cleared expired login credentials cache</p>
                        <p className="text-slate-400">[2026-05-24T01:14:01] [SYSTEM] Keepalive ping returned 200 OK</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* -------------------- DYNAMIC MODALS -------------------- */}

      {/* Modal: Edit User profile */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-extrabold text-white text-base">{t.md_edit_user}</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  {t.us_username}
                </label>
                <input
                  type="text"
                  disabled
                  value={editingUser.username}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-550 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  {t.md_wallet}
                </label>
                <input
                  type="number"
                  required
                  value={editingUser.wallet_balance}
                  onChange={(e) => setEditingUser({ ...editingUser, wallet_balance: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  {t.md_role}
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200"
                >
                  <option value="user">Standard User</option>
                  <option value="moderator">Moderator</option>
                  <option value="finance">Finance Admin</option>
                  <option value="support">Support Agent</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  {t.md_status}
                </label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {t.md_cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                >
                  {t.md_save}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal: Configure Offerwall */}
      {editingOfferwall && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-extrabold text-white text-base">{t.md_conf_offerwall}: {editingOfferwall.name}</h3>
              <button onClick={() => setEditingOfferwall(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOfferwall} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {t.md_api_key}
                  </label>
                  <input
                    type="password"
                    value={editingOfferwall.api_key || ''}
                    onChange={(e) => setEditingOfferwall({ ...editingOfferwall, api_key: e.target.value })}
                    placeholder="None configured"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {t.md_api_secret}
                  </label>
                  <input
                    type="password"
                    value={editingOfferwall.api_secret || ''}
                    onChange={(e) => setEditingOfferwall({ ...editingOfferwall, api_secret: e.target.value })}
                    placeholder="None configured"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {t.md_app_id}
                  </label>
                  <input
                    type="text"
                    value={editingOfferwall.app_id || ''}
                    onChange={(e) => setEditingOfferwall({ ...editingOfferwall, app_id: e.target.value })}
                    placeholder="None configured"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {t.md_rate}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingOfferwall.multiplier}
                    onChange={(e) => setEditingOfferwall({ ...editingOfferwall, multiplier: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.md_iframe}
                </label>
                <input
                  type="text"
                  required
                  value={editingOfferwall.iframe_url || ''}
                  onChange={(e) => setEditingOfferwall({ ...editingOfferwall, iframe_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {t.md_iframe_desc}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.md_geo}
                </label>
                <input
                  type="text"
                  value={
                    Array.isArray(editingOfferwall.geo_restrictions)
                      ? editingOfferwall.geo_restrictions.join(', ')
                      : editingOfferwall.geo_restrictions || ''
                  }
                  onChange={(e) => setEditingOfferwall({ ...editingOfferwall, geo_restrictions: e.target.value })}
                  placeholder="e.g. EG, SA, US (Leave blank for none)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                />
              </div>

              {/* Status checkbox */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-950/30">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{t.md_enable}</span>
                <input
                  type="checkbox"
                  checked={editingOfferwall.is_enabled}
                  onChange={(e) => setEditingOfferwall({ ...editingOfferwall, is_enabled: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingOfferwall(null)}
                  className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {t.md_cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                >
                  {t.md_save}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal: Create Custom Offerwall */}
      {isCreatingOfferwall && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-extrabold text-white text-base">{t.md_create_ow}</h3>
              <button onClick={() => setIsCreatingOfferwall(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOfferwall} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.md_ow_name}
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. MyWall Rewards"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.md_sys_id}
                </label>
                <input
                  type="text"
                  name="identifier"
                  required
                  placeholder="e.g. mywall"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.md_iframe}
                </label>
                <input
                  type="text"
                  name="iframe_url"
                  required
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.md_rate}
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="multiplier"
                  defaultValue="1.00"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  {t.md_geo}
                </label>
                <input
                  type="text"
                  name="geo_restrictions"
                  placeholder="e.g. EG, SA (Comma separated codes)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingOfferwall(false)}
                  className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {t.md_cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                >
                  {t.md_create_btn}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal: Audit Payout (Withdrawal action) */}
      {auditingWithdrawal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-extrabold text-white text-base">{t.md_audit_wd}</h3>
              <button onClick={() => setAuditingWithdrawal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAuditWithdrawal} className="p-6 space-y-4">
              <div className="bg-slate-955 p-4 rounded-xl border border-slate-800 text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">{t.py_user}:</span>
                  <span className="font-bold text-white">{auditingWithdrawal.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">{t.py_amount}:</span>
                  <span className="font-bold text-amber-500 font-mono">{formatCurrency(auditingWithdrawal.amount, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-505 font-medium">{t.py_method}:</span>
                  <span className="font-bold text-white">{auditingWithdrawal.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-505 font-medium">{t.py_details}:</span>
                  <span className="font-semibold text-slate-305 font-mono">{auditingWithdrawal.details}</span>
                </div>
              </div>

              {/* Action selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  {t.md_decision}
                </label>
                <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAuditStatus('approved')}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase transition-all cursor-pointer ${
                      auditStatus === 'approved'
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.md_approve}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditStatus('rejected')}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase transition-all cursor-pointer ${
                      auditStatus === 'rejected'
                        ? 'bg-rose-500 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.md_reject}
                  </button>
                </div>
              </div>

              {/* Conditionally rendered inputs */}
              {auditStatus === 'approved' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    {t.md_tx}
                  </label>
                  <input
                    type="text"
                    required
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    placeholder="e.g. TXN-99882200"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    {t.md_rej_reason}
                  </label>
                  <textarea
                    required
                    value={auditNotes}
                    onChange={(e) => setAuditNotes(e.target.value)}
                    placeholder="e.g. Suspicious device detected. Failed IP check."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  />
                </div>
              )}

              {/* Upload Proof Checkbox simulation */}
              {auditStatus === 'approved' && (
                <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">{t.md_sim_proof}</span>
                    <span className="text-[9px] text-slate-500 block">{t.md_sim_desc}</span>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-amber-500 cursor-pointer" />
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAuditingWithdrawal(null)}
                  className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {t.md_cancel}
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                    auditStatus === 'approved'
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
                      : 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.2)]'
                  }`}
                >
                  {t.md_submit}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Receipt Image Modal */}
      {receiptImageModal && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setReceiptImageModal(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
              <h3 className="text-sm font-black text-slate-100 flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-500" />
                {isAr ? 'عرض الإيصال' : 'View Receipt'}
              </h3>
              <button onClick={() => setReceiptImageModal(null)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/50 min-h-[300px] max-h-[80vh] overflow-auto">
              <img src={receiptImageModal} alt="Receipt" className="max-w-full max-h-full object-contain rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
