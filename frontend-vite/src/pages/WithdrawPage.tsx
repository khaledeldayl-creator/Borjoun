"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import Toasts from "@/components/Toasts";
import { useAppStore } from "@/store/store";
import { translations } from "@/utils/translations";
import { apiRequest } from "@/utils/api";
import { formatCurrency } from "@/utils/currency";

interface WithdrawalRecord {
  id: string;
  payout_method: string;
  payout_details: string;
  amount: number;
  status: string;
  admin_notes: string;
  transaction_reference: string;
  created_at: string;
}

export default function Withdraw() {
  const navigate = useNavigate();
  const { token, lang, user, setUser, addToast, currency } = useAppStore();
  const t = translations[lang];
  const isAr = lang === "ar";

  const [selectedMethod, setSelectedMethod] = useState("PayPal");
  const [details, setDetails] = useState("");
  const [amountCoins, setAmountCoins] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);

  const fetchHistory = async () => {
    try {
      const records = await apiRequest("/withdrawals/history");
      setHistory(records);
    } catch (err: any) {
      console.error("Could not fetch withdrawals history:", err);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchHistory();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details || !amountCoins) {
      addToast(isAr ? "خطأ" : "Error", isAr ? "يرجى ملء جميع الحقول" : "Please fill in all fields", "error");
      return;
    }

    const amt = parseFloat(amountCoins);
    if (isNaN(amt) || amt <= 0) {
      addToast(isAr ? "مبلغ غير صالح" : "Invalid Amount", isAr ? "يرجى إدخال عدد نقاط صالح" : "Please enter a valid amount of coins", "error");
      return;
    }

    if (user && parseFloat(user.wallet_balance.toString()) < amt) {
      addToast(
        isAr ? "رصيد غير كافٍ" : "Insufficient Balance", 
        isAr ? "ليس لديك نقاط كافية لإجراء هذا السحب." : "You do not have enough coins to withdraw this amount.", 
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/withdrawals/request", {
        method: "POST",
        body: JSON.stringify({
          payout_method: selectedMethod,
          payout_details: details,
          amount: amt,
        }),
      });

      addToast(
        isAr ? "تم إرسال الطلب" : "Withdrawal Requested", 
        isAr ? "طلبك قيد المراجعة من قبل الإدارة." : "Your request is pending admin approval.", 
        "success"
      );
      setDetails("");
      setAmountCoins("");
      
      const profile = await apiRequest("/users/profile");
      setUser(profile);
      fetchHistory();
    } catch (err: any) {
      addToast(
        isAr ? "فشل طلب السحب" : "Withdrawal Request Failed", 
        err.message || "Failed to create request", 
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const getMinCoinsText = () => {
    const minAmountText = formatCurrency(1000, currency);
    return isAr ? `الحد الأدنى: 1000 نقطة (${minAmountText})` : `Min: 1000 coins (${minAmountText})`;
  };

  return (
    <DashboardLayout>
      <Toasts />

      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-on-surface mb-2">
          {t.withdraw_title}
        </h1>
        <p className="text-xs text-on-surface-variant font-medium">
          {t.withdraw_subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Methods selector */}
        <div className="flex flex-col gap-4">
          <h3 className="font-display text-base font-black text-on-surface mb-1">{t.wd_method}</h3>
          {[
            { id: "PayPal", icon: "payments", desc: isAr ? "تحويل كاش USD. وقت المعالجة من 2 إلى 5 أيام." : "USD cash transfer. 2-5 days processing time." },
          ].map((method) => (
            <div
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`bg-white p-5 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                selectedMethod === method.id 
                  ? "border-primary bg-orange-50/20" 
                  : "border-slate-100 hover:bg-slate-50"
              }`}
            >
              <span className="material-symbols-outlined text-3xl text-primary">{method.icon}</span>
              <div>
                <h4 className="font-display font-black text-xs text-on-surface">{method.id}</h4>
                <p className="text-[10px] text-on-surface-variant mt-1.5 leading-relaxed font-semibold">{method.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-display text-base font-black text-on-surface mb-6">{t.wd_title}: {selectedMethod}</h3>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="block text-[10px] font-mono font-black uppercase text-slate-400 mb-2">
                  {t.wd_details}
                </label>
                <input
                  type="text"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold focus:outline-none focus:border-primary transition-all text-on-surface"
                  placeholder={t.wd_details_placeholder}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-black uppercase text-slate-400 mb-2">
                  {t.wd_amount}
                </label>
                <input
                  type="number"
                  value={amountCoins}
                  onChange={(e) => setAmountCoins(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold focus:outline-none focus:border-primary transition-all text-on-surface"
                  placeholder={getMinCoinsText()}
                  required
                />
                {amountCoins && (
                  <p className="text-xs text-primary font-black mt-2">
                    {isAr ? "التقديري للسحب:" : "Est Payout:"} {formatCurrency(parseFloat(amountCoins), currency)}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl text-xs hover:bg-primary-hover hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md shadow-orange-100"
              >
                {loading ? (isAr ? "جاري الإرسال..." : "Requesting...") : t.wd_submit}
              </button>
            </form>
          </div>

          {/* Withdrawal History Table */}
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-50">
              <h3 className="font-display font-black text-on-surface text-sm">{t.wd_history}</h3>
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-on-surface-variant">
                {isAr ? "لا توجد طلبات سحب سابقة." : "No withdrawal requests found."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50 font-mono text-[9px] uppercase font-black text-slate-400 bg-slate-50/30">
                      <th className="p-4">{isAr ? "طريقة السحب" : "Method"}</th>
                      <th className="p-4">{isAr ? "التفاصيل" : "Details"}</th>
                      <th className="p-4">{isAr ? "المبلغ" : "Amount"}</th>
                      <th className="p-4">{isAr ? "الحالة" : "Status"}</th>
                      <th className="p-4">{isAr ? "التاريخ" : "Date"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => {
                      let statusColor = "text-yellow-600 bg-yellow-50 border border-yellow-200";
                      if (record.status === "approved") statusColor = "text-green-600 bg-green-50 border border-green-200";
                      if (record.status === "rejected") statusColor = "text-red-600 bg-red-50 border border-red-200";

                      return (
                        <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-body font-black text-xs text-on-surface">{record.payout_method}</td>
                          <td className="p-4 font-mono text-[10px] text-on-surface-variant max-w-xs truncate font-semibold">{record.payout_details}</td>
                          <td className="p-4 font-display font-black text-xs text-primary">
                            {formatCurrency(parseFloat(record.amount.toString()), currency)}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black ${statusColor}`}>
                              {isAr ? (record.status === "pending" ? "معلق" : record.status === "approved" ? "مقبول" : "مرفوض") : record.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4 font-body text-xs font-semibold text-on-surface-variant">
                            {new Date(record.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
