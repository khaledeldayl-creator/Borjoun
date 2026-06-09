import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Trash2, Check, Image as ImageIcon, Settings } from 'lucide-react';
import { useAppStore } from '@/store/store';

const API_URL = 'https://borjoun-production.up.railway.app/api/admin';
const BASE_URL = 'https://borjoun-production.up.railway.app';

const txt = {
  en: {
    loading: 'Loading coupon data...',
    settings_title: 'Coupon System Settings',
    timer_label: 'Wait Duration (seconds)',
    max_coupon: 'Max Coupon Value ($)',
    daily_limit: 'Daily Limit Per User',
    winners_per_day: 'Winners Per Day',
    coupon_value: 'Default Coupon Value ($)',
    system_enabled: 'Enable Coupon System',
    save_settings: 'Save Settings',
    reset_data: 'Reset All Data',
    stats_title: '📊 Current Round Stats',
    participants_count: 'Participants',
    draw_status: 'Draw Status',
    draw_done: (n: number) => `${n} winners selected`,
    draw_pending: '⏳ Pending',
    round_control: '🎲 Round Control',
    round_active: (n: number) => `Round active — ${n} participants so far.`,
    round_done: (n: number) => `${n} winners selected automatically.`,
    round_note: 'Note: System runs automatically on 24-hour cycles.',
    end_round: '🛑 End Round Manually & Start New',
    participants_title: (n: number) => `👥 Current Round Participants (${n})`,
    no_participants: 'No participants yet in this round',
    col_phone: 'Phone',
    col_time: 'Time',
    col_status: 'Status',
    col_coupon: 'Coupon',
    status_waiting: 'Waiting',
    status_won: 'Won',
    status_lost: 'Lost',
    ads_title: '🖼 Ad Banner Manager (Images)',
    choose_image: 'Choose Ad Image',
    ad_caption: 'Ad Caption / Text',
    ad_caption_placeholder: 'e.g. Exclusive deals on products',
    upload_ad: 'Upload Ad',
    preview_label: 'New Image Preview:',
    active_banners: (n: number) => `Active Banners (${n})`,
    no_ads: 'No active ads',
    no_caption: 'No caption',
    dynamic_ads_title: '🚀 Dynamic Ads Manager (Codes & Links)',
    dyn_title_label: 'Title (optional)',
    dyn_html_label: 'HTML Code / Script',
    dyn_link_label: 'Target Link (if any)',
    dyn_placement_label: 'Display Placement',
    placement_both: 'Both (Homepage + Coupons)',
    placement_home: 'Homepage only',
    placement_coupons: 'Coupons page only',
    dyn_active: 'Ad is Active',
    add_dynamic_ad: 'Add Dynamic Ad',
    dynamic_ads_list: (n: number) => `Dynamic Ads (${n})`,
    no_dynamic_ads: 'No dynamic ads',
    no_title: 'Untitled Ad',
    disable: 'Disable',
    enable: 'Enable',
    views: 'Views',
    clicks: 'Clicks',
    history_title: (n: number) => `📜 Previous Rounds History (${n})`,
    no_history: 'No history yet',
    round_label: 'Round:',
    entries_count: 'Participants:',
    toast_settings_saved: 'Settings saved ✅',
    toast_settings_error: 'Error saving settings',
    toast_ad_uploaded: 'Ad uploaded ✅',
    toast_no_image: 'Please select an image',
    toast_no_caption: 'Please enter an ad caption',
    toast_ad_error: 'Error uploading ad',
    toast_ad_deleted: 'Ad deleted ✅',
    toast_ad_delete_error: 'Error deleting ad',
    toast_dyn_added: 'Dynamic ad added ✅',
    toast_dyn_error: 'Error adding dynamic ad',
    toast_dyn_toggled: 'Ad status changed ✅',
    toast_error: 'An error occurred',
    toast_dyn_deleted: 'Dynamic ad deleted ✅',
    toast_round_ended: 'Round ended and new round started ✅',
    toast_round_error: 'Error ending round',
    toast_reset_done: 'All data cleared ✅',
    toast_reset_error: 'Error clearing data',
    toast_reset_cancelled: 'Reset cancelled',
    confirm_delete_ad: 'Are you sure you want to delete this ad?',
    confirm_delete_dyn: 'Are you sure you want to delete this dynamic ad?',
    confirm_end_round: 'Are you sure you want to end the current round and start a new one? The current round will be archived.',
    confirm_reset_1: 'DANGER: Are you sure you want to clear ALL site data (ads, rounds, participants) and reset to factory defaults?',
    confirm_reset_2: 'Type "DELETE" to confirm permanent deletion.',
    confirm_reset_word: 'DELETE',
  },
  ar: {
    loading: 'جاري تحميل بيانات الكوبونات...',
    settings_title: 'إعدادات نظام الكوبونات',
    timer_label: 'مدة الانتظار (بالثواني)',
    max_coupon: 'الحد الأقصى لقيمة الكوبون ($)',
    daily_limit: 'الحد اليومي المسموح للمستخدم',
    winners_per_day: 'عدد الفائزين باليوم',
    coupon_value: 'قيمة الكوبون المبدئية ($)',
    system_enabled: 'تفعيل نظام الكوبونات',
    save_settings: 'حفظ الإعدادات',
    reset_data: 'مسح البيانات (إعادة ضبط)',
    stats_title: '📊 إحصائيات الجولة الحالية',
    participants_count: 'عدد المشتركين',
    draw_status: 'حالة السحب',
    draw_done: (n: number) => `تم سحب ${n} فائزين`,
    draw_pending: '⏳ قيد الانتظار',
    round_control: '🎲 تحكم الجولة',
    round_active: (n: number) => `الجولة نشطة — ${n} مشترك حتى الآن.`,
    round_done: (n: number) => `تم اختيار ${n} فائزين تلقائياً في هذه الجولة.`,
    round_note: 'ملاحظة: النظام يعمل بشكل أوتوماتيكي بنظام الجولات على مدار 24 ساعة.',
    end_round: '🛑 إنهاء الجولة يدوياً وبدء جولة جديدة',
    participants_title: (n: number) => `👥 المشتركون في الجولة الحالية (${n})`,
    no_participants: 'لا يوجد مشتركون بعد في هذه الجولة',
    col_phone: 'رقم الهاتف',
    col_time: 'وقت التسجيل',
    col_status: 'الحالة',
    col_coupon: 'الكوبون',
    status_waiting: 'قيد الانتظار',
    status_won: 'كسب',
    status_lost: 'خسر',
    ads_title: '🖼 إدارة البنرات الإعلانية (صور)',
    choose_image: 'اختر صورة الإعلان',
    ad_caption: 'وصف / نص الإعلان',
    ad_caption_placeholder: 'مثال: عروض حصرية على المنتجات',
    upload_ad: 'رفع الإعلان',
    preview_label: 'معاينة الصورة الجديدة:',
    active_banners: (n: number) => `البنرات النشطة (${n})`,
    no_ads: 'لا توجد إعلانات نشطة',
    no_caption: 'بدون وصف',
    dynamic_ads_title: '🚀 إدارة الإعلانات الديناميكية (أكواد وروابط)',
    dyn_title_label: 'العنوان (اختياري)',
    dyn_html_label: 'كود HTML / سكريبت',
    dyn_link_label: 'الرابط المستهدف (إن وجد)',
    dyn_placement_label: 'أماكن الظهور',
    placement_both: 'الكل (الصفحة الرئيسية + الكوبونات)',
    placement_home: 'الصفحة الرئيسية فقط',
    placement_coupons: 'صفحة الكوبونات فقط',
    dyn_active: 'الإعلان نشط',
    add_dynamic_ad: 'إضافة الإعلان الديناميكي',
    dynamic_ads_list: (n: number) => `الإعلانات الديناميكية (${n})`,
    no_dynamic_ads: 'لا توجد إعلانات ديناميكية',
    no_title: 'إعلان بدون عنوان',
    disable: 'تعطيل',
    enable: 'تفعيل',
    views: 'المشاهدات',
    clicks: 'النقرات',
    history_title: (n: number) => `📜 سجل الجولات السابقة (${n})`,
    no_history: 'لا يوجد سجلات سابقة',
    round_label: 'جولة:',
    entries_count: 'عدد المشتركين:',
    toast_settings_saved: 'تم حفظ الإعدادات بنجاح ✅',
    toast_settings_error: 'حدث خطأ أثناء حفظ الإعدادات',
    toast_ad_uploaded: 'تم رفع الإعلان بنجاح ✅',
    toast_no_image: 'الرجاء اختيار صورة',
    toast_no_caption: 'الرجاء إدخال وصف الإعلان',
    toast_ad_error: 'حدث خطأ أثناء رفع الإعلان',
    toast_ad_deleted: 'تم حذف الإعلان ✅',
    toast_ad_delete_error: 'حدث خطأ أثناء حذف الإعلان',
    toast_dyn_added: 'تم إضافة الإعلان بنجاح ✅',
    toast_dyn_error: 'حدث خطأ أثناء إضافة الإعلان',
    toast_dyn_toggled: 'تم تغيير حالة الإعلان ✅',
    toast_error: 'حدث خطأ',
    toast_dyn_deleted: 'تم حذف الإعلان ✅',
    toast_round_ended: 'تم إنهاء الجولة وبدء جولة جديدة بنجاح ✅',
    toast_round_error: 'حدث خطأ أثناء إنهاء الجولة',
    toast_reset_done: 'تم مسح جميع البيانات بنجاح ✅',
    toast_reset_error: 'حدث خطأ أثناء مسح البيانات',
    toast_reset_cancelled: 'تم إلغاء عملية المسح',
    confirm_delete_ad: 'هل تريد حذف الإعلان؟',
    confirm_delete_dyn: 'هل تريد حذف هذا الإعلان الديناميكي؟',
    confirm_end_round: 'هل أنت متأكد من إنهاء الجولة الحالية وبدء جولة جديدة؟ سيتم أرشفة الجولة الحالية في السجل.',
    confirm_reset_1: 'تحذير خطير: هل أنت متأكد من مسح جميع بيانات الموقع (إعلانات، جولات، مشتركين) وإعادة ضبط المصنع؟',
    confirm_reset_2: 'تأكيد: اكتب كلمة "مسح" لتأكيد الحذف النهائي.',
    confirm_reset_word: 'مسح',
  }
};

export default function CouponsAdminPanel() {
  const { lang } = useAppStore();
  const isAr = lang === 'ar';
  const t = isAr ? txt.ar : txt.en;

  const [settings, setSettings] = useState({
    timerDuration: 60,
    maxCouponValue: 200,
    dailyLimit: 2,
    couponSystemEnabled: true,
    winnersPerDay: 5,
    couponValue: 50
  });
  const [round, setRound] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [historyRounds, setHistoryRounds] = useState<any[]>([]);
  const [dynamicAds, setDynamicAds] = useState<any[]>([]);
  const [dynamicAdForm, setDynamicAdForm] = useState({ title: '', htmlCode: '', targetLink: '', placement: 'Both', isActive: true, startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<any>(null);
  const [adImage, setAdImage] = useState<File | null>(null);
  const [adCaption, setAdCaption] = useState('');
  const [adPreviewUrl, setAdPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchDrawData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`
  });

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    try {
      const headers = getHeaders();
      const [settingsRes, drawRes, adRes, historyRes, dynamicAdsRes] = await Promise.all([
        fetch(`${API_URL}/coupon-settings`, { headers }),
        fetch(`${API_URL}/draw`, { headers }),
        fetch(`${API_URL}/advertisement`, { headers }),
        fetch(`${API_URL}/history`, { headers }),
        fetch(`${API_URL}/dynamic-ads`, { headers })
      ]);
      const s = await settingsRes.json();
      const d = await drawRes.json();
      const a = await adRes.json();
      const h = await historyRes.json();
      const da = await dynamicAdsRes.json();

      if (s && !s.error) setSettings(s);
      if (d && !d.error) { setRound(d.round); setEntries(d.entries || []); }
      if (Array.isArray(a)) setAds(a);
      if (Array.isArray(h)) setHistoryRounds(h);
      if (Array.isArray(da)) setDynamicAds(da);
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrawData = async () => {
    try {
      const res = await fetch(`${API_URL}/draw`, { headers: getHeaders() });
      const d = await res.json();
      if (d && !d.error) { setRound(d.round); setEntries(d.entries || []); }
    } catch (_) {}
  };

  const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveSettings = async () => {
    try {
      await fetch(`${API_URL}/coupon-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify(settings)
      });
      showToast(t.toast_settings_saved);
    } catch {
      showToast(t.toast_settings_error, 'error');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAdImage(file);
      setAdPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadAd = async () => {
    if (!adImage) return showToast(t.toast_no_image, 'error');
    if (!adCaption.trim()) return showToast(t.toast_no_caption, 'error');
    const formData = new FormData();
    formData.append('image', adImage);
    formData.append('caption', adCaption);
    try {
      const res = await fetch(`${API_URL}/advertisement`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData
      });
      const data = await res.json();
      if (data.error) showToast(data.error, 'error');
      else {
        showToast(t.toast_ad_uploaded);
        setAds(prev => [...prev, data.ad]);
        setAdImage(null);
        setAdPreviewUrl(null);
        setAdCaption('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch {
      showToast(t.toast_ad_error, 'error');
    }
  };

  const removeAd = async (adId: number) => {
    if (!window.confirm(t.confirm_delete_ad)) return;
    try {
      await fetch(`${API_URL}/advertisement/${adId}`, {
        method: 'DELETE', headers: getHeaders()
      });
      setAds(prev => prev.filter(a => a.id !== adId));
      showToast(t.toast_ad_deleted);
    } catch {
      showToast(t.toast_ad_delete_error, 'error');
    }
  };

  const handleDynamicAdFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    setDynamicAdForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const createDynamicAd = async () => {
    try {
      const res = await fetch(`${API_URL}/dynamic-ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify(dynamicAdForm)
      });
      const data = await res.json();
      if (data.error) showToast(data.error, 'error');
      else {
        showToast(t.toast_dyn_added);
        setDynamicAds(prev => [data.ad, ...prev]);
        setDynamicAdForm({ title: '', htmlCode: '', targetLink: '', placement: 'Both', isActive: true, startDate: '', endDate: '' });
      }
    } catch {
      showToast(t.toast_dyn_error, 'error');
    }
  };

  const toggleDynamicAdStatus = async (ad: any) => {
    try {
      const res = await fetch(`${API_URL}/dynamic-ads/${ad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ ...ad, isActive: !ad.isActive })
      });
      const data = await res.json();
      if (!data.error) {
        setDynamicAds(prev => prev.map(a => a.id === ad.id ? data.ad : a));
        showToast(t.toast_dyn_toggled);
      }
    } catch {
      showToast(t.toast_error, 'error');
    }
  };

  const removeDynamicAd = async (adId: number) => {
    if (!window.confirm(t.confirm_delete_dyn)) return;
    try {
      await fetch(`${API_URL}/dynamic-ads/${adId}`, { method: 'DELETE', headers: getHeaders() });
      setDynamicAds(prev => prev.filter(a => a.id !== adId));
      showToast(t.toast_dyn_deleted);
    } catch {
      showToast(t.toast_error, 'error');
    }
  };

  const handleEndRound = async () => {
    if (!window.confirm(t.confirm_end_round)) return;
    try {
      const res = await fetch(`${API_URL}/draw/end`, { method: 'POST', headers: getHeaders() });
      const data = await res.json();
      if (data.error) showToast(data.error, 'error');
      else {
        showToast(t.toast_round_ended);
        fetchData();
      }
    } catch {
      showToast(t.toast_round_error, 'error');
    }
  };

  const handleResetSystem = async () => {
    const confirm1 = window.confirm(t.confirm_reset_1);
    if (!confirm1) return;
    const confirm2 = window.prompt(t.confirm_reset_2);
    if (confirm2 !== t.confirm_reset_word) {
      showToast(t.toast_reset_cancelled, 'error');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/system/reset`, { method: 'POST', headers: getHeaders() });
      const data = await res.json();
      if (data.error) showToast(data.error, 'error');
      else {
        showToast(t.toast_reset_done);
        fetchData();
      }
    } catch {
      showToast(t.toast_reset_error, 'error');
    }
  };

  if (loading) return (
    <div className="h-64 flex flex-col items-center justify-center text-slate-400">
      <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-4" />
      <span className="font-bold text-sm tracking-widest uppercase">{t.loading}</span>
    </div>
  );

  const winnersCount = entries.filter(e => e.isWinner).length;
  const drawDone = winnersCount > 0;

  return (
    <div className="space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-xl font-bold shadow-lg flex items-center gap-2 ${toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
          <Check className="w-5 h-5" />
          {toast.msg}
        </div>
      )}

      {/* ── SECTION 1: Settings + Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Settings */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
          <h3 className="font-extrabold text-base text-white mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            <span>{t.settings_title}</span>
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.timer_label}</label>
              <input type="number" name="timerDuration" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none" value={settings.timerDuration} onChange={handleSettingChange} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.max_coupon}</label>
              <input type="number" name="maxCouponValue" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none" value={settings.maxCouponValue} onChange={handleSettingChange} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.daily_limit}</label>
              <input type="number" name="dailyLimit" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none" value={settings.dailyLimit} onChange={handleSettingChange} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.winners_per_day}</label>
              <input type="number" name="winnersPerDay" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none" value={settings.winnersPerDay} onChange={handleSettingChange} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.coupon_value}</label>
              <input type="number" name="couponValue" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none" value={settings.couponValue} onChange={handleSettingChange} />
            </div>
            <div className="flex items-center gap-3 py-2">
              <input type="checkbox" name="couponSystemEnabled" id="couponSystemEnabled" checked={settings.couponSystemEnabled} onChange={handleSettingChange} className="w-5 h-5 accent-amber-500" />
              <label htmlFor="couponSystemEnabled" className="text-sm font-bold text-slate-200">{t.system_enabled}</label>
            </div>
            <div className="flex flex-col xl:flex-row gap-3 pt-4 border-t border-slate-800/80">
              <button className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2" onClick={saveSettings}>
                <Check className="w-5 h-5" />
                {t.save_settings}
              </button>
              <button className="flex-1 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-bold py-3 rounded-xl transition-colors" onClick={handleResetSystem}>
                {t.reset_data}
              </button>
            </div>
          </div>
        </div>

        {/* Stats & Current Draw */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between">
            <h3 className="font-extrabold text-base text-white mb-6">{t.stats_title}</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.participants_count}</span>
                <span className="text-2xl font-black text-white">{entries.length}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.draw_status}</span>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${drawDone ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                  {drawDone ? t.draw_done(winnersCount) : t.draw_pending}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
            <h3 className="font-extrabold text-base text-white mb-4">{t.round_control}</h3>
            <p className="text-sm text-slate-400 mb-6 font-semibold">
              {drawDone ? t.round_done(winnersCount) : t.round_active(entries.length)}
            </p>
            <p className="text-[11px] text-slate-500 mb-6">{t.round_note}</p>
            <button className="w-full bg-slate-800 hover:bg-slate-700 text-amber-500 border border-amber-500/20 font-bold py-3 rounded-xl transition-colors text-sm" onClick={handleEndRound}>
              {t.end_round}
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION: Participants ── */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800/80">
          <h3 className="font-extrabold text-base text-white">{t.participants_title(entries.length)}</h3>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          {entries.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-semibold text-sm">{t.no_participants}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-950 text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">{t.col_phone}</th>
                  <th className="px-6 py-4">{t.col_time}</th>
                  <th className="px-6 py-4">{t.col_status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {entries.map((entry, idx) => (
                  <tr key={entry.id} className={`hover:bg-slate-800/20 transition-colors ${entry.isWinner ? 'bg-emerald-500/5' : ''}`}>
                    <td className="px-6 py-4 text-slate-500 font-mono text-center">{idx + 1}</td>
                    <td className="px-6 py-4 font-mono text-slate-300 text-center" dir="ltr">{entry.phone}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 text-center">{new Date(entry.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</td>
                    <td className="px-6 py-4 text-center">
                      {entry.status === 'WAITING' ? (
                        <span className="text-blue-400 font-bold">{t.status_waiting}</span>
                      ) : entry.isWinner ? (
                        <span className="text-emerald-400 font-bold">{t.status_won}</span>
                      ) : (
                        <span className="text-slate-500 font-bold">{t.status_lost}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── SECTION: Advertisement Manager ── */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
        <h3 className="font-extrabold text-base text-white mb-6 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-amber-500" />
          <span>{t.ads_title}</span>
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.choose_image}</label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500/20 cursor-pointer" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.ad_caption}</label>
              <input type="text" value={adCaption} onChange={(e) => setAdCaption(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none" placeholder={t.ad_caption_placeholder} />
            </div>
            <button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition-colors mt-4" onClick={uploadAd}>
              {t.upload_ad}
            </button>
            {adPreviewUrl && (
              <div className="mt-6 border border-slate-800 rounded-2xl p-4 bg-slate-950">
                <p className="text-xs font-bold text-slate-400 mb-2">{t.preview_label}</p>
                <img src={adPreviewUrl} alt="Preview" className="w-full rounded-xl" />
              </div>
            )}
          </div>

          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4">
            <h4 className="text-sm font-bold text-white mb-4">{t.active_banners(ads.length)}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
              {ads.length === 0 ? (
                <div className="col-span-full p-6 text-center text-slate-500 text-sm">{t.no_ads}</div>
              ) : (
                ads.map(a => (
                  <div key={a.id} className="relative group rounded-xl overflow-hidden border border-slate-800">
                    <img src={`${BASE_URL}${a.imageUrl}`} alt="Ad" className="w-full h-32 object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/80 p-2 text-xs text-white truncate">
                      {a.caption || t.no_caption}
                    </div>
                    <button onClick={() => removeAd(a.id)} className="absolute top-2 right-2 w-8 h-8 bg-rose-500 hover:bg-rose-600 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION: Dynamic Ads ── */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
        <h3 className="font-extrabold text-base text-white mb-6">{t.dynamic_ads_title}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.dyn_title_label}</label>
              <input type="text" name="title" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none" value={dynamicAdForm.title} onChange={handleDynamicAdFormChange} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.dyn_html_label}</label>
              <textarea name="htmlCode" dir="ltr" rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none font-mono placeholder-slate-600" value={dynamicAdForm.htmlCode} onChange={handleDynamicAdFormChange} placeholder="<script>...</script>" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.dyn_link_label}</label>
              <input type="text" name="targetLink" dir="ltr" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none font-mono placeholder-slate-600" value={dynamicAdForm.targetLink} onChange={handleDynamicAdFormChange} placeholder="https://example.com" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.dyn_placement_label}</label>
              <select name="placement" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none appearance-none" value={dynamicAdForm.placement} onChange={handleDynamicAdFormChange}>
                <option value="Both">{t.placement_both}</option>
                <option value="Homepage">{t.placement_home}</option>
                <option value="Coupons Page">{t.placement_coupons}</option>
              </select>
            </div>
            <div className="flex items-center gap-3 py-2">
              <input type="checkbox" name="isActive" id="dyn-isActive" checked={dynamicAdForm.isActive} onChange={handleDynamicAdFormChange} className="w-5 h-5 accent-amber-500" />
              <label htmlFor="dyn-isActive" className="text-sm font-bold text-slate-200">{t.dyn_active}</label>
            </div>
            <button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition-colors mt-2" onClick={createDynamicAd}>
              {t.add_dynamic_ad}
            </button>
          </div>

          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col gap-3">
            <h4 className="text-sm font-bold text-white mb-2">{t.dynamic_ads_list(dynamicAds.length)}</h4>
            {dynamicAds.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">{t.no_dynamic_ads}</div>
            ) : (
              dynamicAds.map(ad => (
                <div key={ad.id} className={`p-4 rounded-xl border ${ad.isActive ? 'border-slate-700 bg-slate-900/50' : 'border-slate-800 bg-slate-900/20 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h5 className="font-bold text-slate-200 text-sm">{ad.title || t.no_title}</h5>
                      <span className="inline-block mt-1 text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">{ad.placement}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleDynamicAdStatus(ad)} className={`px-3 py-1 rounded-lg text-xs font-bold ${ad.isActive ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20'}`}>
                        {ad.isActive ? t.disable : t.enable}
                      </button>
                      <button onClick={() => removeDynamicAd(ad.id)} className="w-7 h-7 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs font-mono text-slate-500">
                    <span>👀 {t.views}: {ad.views || 0}</span>
                    <span>👆 {t.clicks}: {ad.clicks || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION: History ── */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
        <h3 className="font-extrabold text-base text-white mb-6">{t.history_title(historyRounds.length)}</h3>
        {historyRounds.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">{t.no_history}</div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {historyRounds.map(r => (
              <div key={r.id} className="border border-slate-800 rounded-2xl p-5 bg-slate-950">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-slate-800/60">
                  <h4 className="font-bold text-slate-200">
                    {t.round_label} <span className="text-amber-500">{new Date(r.cycleStartDate).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</span>
                  </h4>
                  <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                    {t.entries_count} {r.entries.length}
                  </span>
                </div>
                {r.entries.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center">
                      <thead className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="py-2 px-4">{t.col_phone}</th>
                          <th className="py-2 px-4">{t.col_time}</th>
                          <th className="py-2 px-4">{t.col_status}</th>
                          <th className="py-2 px-4">{t.col_coupon}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/30">
                        {r.entries.map((entry: any) => (
                          <tr key={entry.id} className={entry.isWinner ? 'bg-emerald-500/5' : ''}>
                            <td className="py-2 px-4 font-mono text-slate-300" dir="ltr">{entry.phone}</td>
                            <td className="py-2 px-4 text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</td>
                            <td className="py-2 px-4">
                              {entry.status === 'WAITING' ? t.status_waiting : (entry.isWinner ? <span className="text-emerald-400">{t.status_won}</span> : t.status_lost)}
                            </td>
                            <td className="py-2 px-4 font-mono text-amber-500" dir="ltr">{entry.couponCode || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
