import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Trash2, Plus, LogOut, Check, Image as ImageIcon, Settings } from 'lucide-react';

const API_URL = 'http://localhost:8000/api/admin';
const BASE_URL = 'http://localhost:8000';

export default function CouponsAdminPanel() {
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
        fetch(`${API_URL}/settings`, { headers }),
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
      await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify(settings)
      });
      showToast('تم حفظ الإعدادات بنجاح ✅');
    } catch {
      showToast('حدث خطأ أثناء حفظ الإعدادات', 'error');
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
    if (!adImage) return showToast('الرجاء اختيار صورة', 'error');
    if (!adCaption.trim()) return showToast('الرجاء إدخال وصف الإعلان', 'error');
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
        showToast('تم رفع الإعلان بنجاح ✅');
        setAds(prev => [...prev, data.ad]);
        setAdImage(null);
        setAdPreviewUrl(null);
        setAdCaption('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch {
      showToast('حدث خطأ أثناء رفع الإعلان', 'error');
    }
  };

  const removeAd = async (adId: number) => {
    if (!window.confirm('هل تريد حذف الإعلان؟')) return;
    try {
      await fetch(`${API_URL}/advertisement/${adId}`, {
        method: 'DELETE', headers: getHeaders()
      });
      setAds(prev => prev.filter(a => a.id !== adId));
      showToast('تم حذف الإعلان ✅');
    } catch {
      showToast('حدث خطأ أثناء حذف الإعلان', 'error');
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
        showToast('تم إضافة الإعلان بنجاح ✅');
        setDynamicAds(prev => [data.ad, ...prev]);
        setDynamicAdForm({ title: '', htmlCode: '', targetLink: '', placement: 'Both', isActive: true, startDate: '', endDate: '' });
      }
    } catch {
      showToast('حدث خطأ أثناء إضافة الإعلان', 'error');
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
         showToast('تم تغيير حالة الإعلان ✅');
      }
    } catch {
      showToast('حدث خطأ', 'error');
    }
  };

  const removeDynamicAd = async (adId: number) => {
    if (!window.confirm('هل تريد حذف هذا الإعلان الديناميكي؟')) return;
    try {
      await fetch(`${API_URL}/dynamic-ads/${adId}`, { method: 'DELETE', headers: getHeaders() });
      setDynamicAds(prev => prev.filter(a => a.id !== adId));
      showToast('تم حذف الإعلان ✅');
    } catch {
      showToast('حدث خطأ', 'error');
    }
  };

  const handleEndRound = async () => {
    if (!window.confirm('هل أنت متأكد من إنهاء الجولة الحالية وبدء جولة جديدة؟ سيتم أرشفة الجولة الحالية في السجل.')) return;
    try {
      const res = await fetch(`${API_URL}/draw/end`, { method: 'POST', headers: getHeaders() });
      const data = await res.json();
      if (data.error) showToast(data.error, 'error');
      else {
        showToast('تم إنهاء الجولة وبدء جولة جديدة بنجاح ✅');
        fetchData(); // Refresh all data
      }
    } catch {
      showToast('حدث خطأ أثناء إنهاء الجولة', 'error');
    }
  };

  const handleResetSystem = async () => {
    const confirm1 = window.confirm('تحذير خطير: هل أنت متأكد من مسح جميع بيانات الموقع (إعلانات، جولات، مشتركين) وإعادة ضبط المصنع؟');
    if (!confirm1) return;
    const confirm2 = window.prompt('تأكيد: اكتب كلمة "مسح" باللغة العربية لتأكيد الحذف النهائي.');
    if (confirm2 !== 'مسح') {
      showToast('تم إلغاء عملية المسح', 'error');
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/system/reset`, { method: 'POST', headers: getHeaders() });
      const data = await res.json();
      if (data.error) showToast(data.error, 'error');
      else {
        showToast('تم مسح جميع البيانات بنجاح ✅');
        fetchData();
      }
    } catch {
      showToast('حدث خطأ أثناء مسح البيانات', 'error');
    }
  };

  if (loading) return (
    <div className="h-64 flex flex-col items-center justify-center text-slate-400">
      <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-4" />
      <span className="font-bold text-sm tracking-widest uppercase">جاري تحميل بيانات الكوبونات...</span>
    </div>
  );

  const winnersCount = entries.filter(e => e.isWinner).length;
  const drawDone = winnersCount > 0;

  return (
    <div className="space-y-8" dir="rtl">
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
            <span>إعدادات نظام الكوبونات</span>
          </h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">مدة الانتظار (بالثواني)</label>
              <input type="number" name="timerDuration" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none" value={settings.timerDuration} onChange={handleSettingChange} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">الحد الأقصى لقيمة الكوبون ($)</label>
              <input type="number" name="maxCouponValue" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none" value={settings.maxCouponValue} onChange={handleSettingChange} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">الحد اليومي المسموح للمستخدم</label>
              <input type="number" name="dailyLimit" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none" value={settings.dailyLimit} onChange={handleSettingChange} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">عدد الفائزين باليوم</label>
              <input type="number" name="winnersPerDay" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none" value={settings.winnersPerDay} onChange={handleSettingChange} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">قيمة الكوبون المبدئية ($)</label>
              <input type="number" name="couponValue" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none" value={settings.couponValue} onChange={handleSettingChange} />
            </div>
            <div className="flex items-center gap-3 py-2">
              <input type="checkbox" name="couponSystemEnabled" id="couponSystemEnabled" checked={settings.couponSystemEnabled} onChange={handleSettingChange} className="w-5 h-5 accent-amber-500" />
              <label htmlFor="couponSystemEnabled" className="text-sm font-bold text-slate-200">تفعيل نظام الكوبونات</label>
            </div>
            <div className="flex flex-col xl:flex-row gap-3 pt-4 border-t border-slate-800/80">
              <button className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2" onClick={saveSettings}>
                <Check className="w-5 h-5" />
                حفظ الإعدادات
              </button>
              <button className="flex-1 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-bold py-3 rounded-xl transition-colors" onClick={handleResetSystem}>
                مسح البيانات (إعادة ضبط)
              </button>
            </div>
          </div>
        </div>

        {/* Stats & Current Draw */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between">
            <h3 className="font-extrabold text-base text-white mb-6">📊 إحصائيات الجولة الحالية</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">عدد المشتركين</span>
                <span className="text-2xl font-black text-white">{entries.length}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">حالة السحب</span>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${drawDone ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                  {drawDone ? `تم سحب ${winnersCount} فائزين` : '⏳ قيد الانتظار'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
            <h3 className="font-extrabold text-base text-white mb-4">🎲 تحكم الجولة</h3>
            <p className="text-sm text-slate-400 mb-6 font-semibold">
              {drawDone
                ? `تم اختيار ${winnersCount} فائزين تلقائياً في هذه الجولة.`
                : `الجولة نشطة — ${entries.length} مشترك حتى الآن.`}
            </p>
            <p className="text-[11px] text-slate-500 mb-6">ملاحظة: النظام يعمل بشكل أوتوماتيكي بنظام الجولات على مدار 24 ساعة.</p>
            <button className="w-full bg-slate-800 hover:bg-slate-700 text-amber-500 border border-amber-500/20 font-bold py-3 rounded-xl transition-colors text-sm" onClick={handleEndRound}>
              🛑 إنهاء الجولة يدوياً وبدء جولة جديدة
            </button>
          </div>
        </div>
      </div>

      {/* ── SECTION: Participants ── */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800/80">
          <h3 className="font-extrabold text-base text-white">👥 المشتركون في الجولة الحالية ({entries.length})</h3>
        </div>
        <div className="overflow-x-auto max-h-[400px]">
          {entries.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-semibold text-sm">لا يوجد مشتركون بعد في هذه الجولة</div>
          ) : (
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-950 text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4 text-left">رقم الهاتف</th>
                  <th className="px-6 py-4">وقت التسجيل</th>
                  <th className="px-6 py-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {entries.map((entry, idx) => (
                  <tr key={entry.id} className={`hover:bg-slate-800/20 transition-colors ${entry.isWinner ? 'bg-emerald-500/5' : ''}`}>
                    <td className="px-6 py-4 text-slate-500 font-mono">{idx + 1}</td>
                    <td className="px-6 py-4 font-mono text-slate-300 text-left" dir="ltr">{entry.phone}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString('ar-EG')}</td>
                    <td className="px-6 py-4">
                      {entry.status === 'WAITING' ? (
                        <span className="text-blue-400 font-bold">قيد الانتظار</span>
                      ) : entry.isWinner ? (
                        <span className="text-emerald-400 font-bold">كسب</span>
                      ) : (
                        <span className="text-slate-500 font-bold">خسر</span>
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
          <span>إدارة البنرات الإعلانية (صور)</span>
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">اختر صورة الإعلان</label>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500/20 cursor-pointer" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">وصف / نص الإعلان</label>
              <input type="text" value={adCaption} onChange={(e) => setAdCaption(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none" placeholder="مثال: عروض حصرية على المنتجات" />
            </div>
            <button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition-colors mt-4" onClick={uploadAd}>
              رفع الإعلان
            </button>

            {adPreviewUrl && (
              <div className="mt-6 border border-slate-800 rounded-2xl p-4 bg-slate-950">
                <p className="text-xs font-bold text-slate-400 mb-2">معاينة الصورة الجديدة:</p>
                <img src={adPreviewUrl} alt="Preview" className="w-full rounded-xl" />
              </div>
            )}
          </div>

          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4">
            <h4 className="text-sm font-bold text-white mb-4">البنرات النشطة ({ads.length})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
              {ads.length === 0 ? (
                <div className="col-span-full p-6 text-center text-slate-500 text-sm">لا توجد إعلانات نشطة</div>
              ) : (
                ads.map(a => (
                  <div key={a.id} className="relative group rounded-xl overflow-hidden border border-slate-800">
                    <img src={`${BASE_URL}${a.imageUrl}`} alt="Ad" className="w-full h-32 object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/80 p-2 text-xs text-white truncate">
                      {a.caption || 'بدون وصف'}
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
        <h3 className="font-extrabold text-base text-white mb-6">🚀 إدارة الإعلانات الديناميكية (أكواد وروابط)</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">العنوان (اختياري)</label>
              <input type="text" name="title" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none" value={dynamicAdForm.title} onChange={handleDynamicAdFormChange} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">كود HTML / سكريبت</label>
              <textarea name="htmlCode" dir="ltr" rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none font-mono placeholder-slate-600" value={dynamicAdForm.htmlCode} onChange={handleDynamicAdFormChange} placeholder="<script>...</script>" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">الرابط المستهدف (إن وجد)</label>
              <input type="text" name="targetLink" dir="ltr" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none font-mono placeholder-slate-600" value={dynamicAdForm.targetLink} onChange={handleDynamicAdFormChange} placeholder="https://example.com" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">أماكن الظهور</label>
              <select name="placement" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:border-amber-500 outline-none appearance-none" value={dynamicAdForm.placement} onChange={handleDynamicAdFormChange}>
                <option value="Both">الكل (الصفحة الرئيسية + الكوبونات)</option>
                <option value="Homepage">الصفحة الرئيسية فقط</option>
                <option value="Coupons Page">صفحة الكوبونات فقط</option>
              </select>
            </div>
            <div className="flex items-center gap-3 py-2">
              <input type="checkbox" name="isActive" id="dyn-isActive" checked={dynamicAdForm.isActive} onChange={handleDynamicAdFormChange} className="w-5 h-5 accent-amber-500" />
              <label htmlFor="dyn-isActive" className="text-sm font-bold text-slate-200">الإعلان نشط</label>
            </div>
            <button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition-colors mt-2" onClick={createDynamicAd}>
              إضافة الإعلان الديناميكي
            </button>
          </div>

          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col gap-3">
            <h4 className="text-sm font-bold text-white mb-2">الإعلانات الديناميكية ({dynamicAds.length})</h4>
            {dynamicAds.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">لا توجد إعلانات ديناميكية</div>
            ) : (
              dynamicAds.map(ad => (
                <div key={ad.id} className={`p-4 rounded-xl border ${ad.isActive ? 'border-slate-700 bg-slate-900/50' : 'border-slate-800 bg-slate-900/20 opacity-60'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h5 className="font-bold text-slate-200 text-sm">{ad.title || 'إعلان بدون عنوان'}</h5>
                      <span className="inline-block mt-1 text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">{ad.placement}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleDynamicAdStatus(ad)} className={`px-3 py-1 rounded-lg text-xs font-bold ${ad.isActive ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20'}`}>
                        {ad.isActive ? 'تعطيل' : 'تفعيل'}
                      </button>
                      <button onClick={() => removeDynamicAd(ad.id)} className="w-7 h-7 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs font-mono text-slate-500">
                    <span>👀 المشاهدات: {ad.views || 0}</span>
                    <span>👆 النقرات: {ad.clicks || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION: History ── */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
        <h3 className="font-extrabold text-base text-white mb-6">📜 سجل الجولات السابقة ({historyRounds.length})</h3>
        {historyRounds.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">لا يوجد سجلات سابقة</div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {historyRounds.map(r => (
              <div key={r.id} className="border border-slate-800 rounded-2xl p-5 bg-slate-950">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-slate-800/60">
                  <h4 className="font-bold text-slate-200">
                    جولة: <span className="text-amber-500">{new Date(r.cycleStartDate).toLocaleString('ar-EG')}</span>
                  </h4>
                  <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                    عدد المشتركين: {r.entries.length}
                  </span>
                </div>
                {r.entries.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                      <thead className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="py-2 px-4 text-left">الهاتف</th>
                          <th className="py-2 px-4">التسجيل</th>
                          <th className="py-2 px-4">الحالة</th>
                          <th className="py-2 px-4 text-left">الكوبون</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/30">
                        {r.entries.map((entry: any) => (
                          <tr key={entry.id} className={entry.isWinner ? 'bg-emerald-500/5' : ''}>
                            <td className="py-2 px-4 font-mono text-slate-300 text-left" dir="ltr">{entry.phone}</td>
                            <td className="py-2 px-4 text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString('ar-EG')}</td>
                            <td className="py-2 px-4">
                              {entry.status === 'WAITING' ? 'قيد الانتظار' : (entry.isWinner ? <span className="text-emerald-400">كسب</span> : 'خسر')}
                            </td>
                            <td className="py-2 px-4 font-mono text-amber-500 text-left" dir="ltr">{entry.couponCode || '—'}</td>
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
