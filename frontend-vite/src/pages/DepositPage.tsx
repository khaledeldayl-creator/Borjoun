"use client";

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import Toasts from "@/components/Toasts";
import { useAppStore } from "@/store/store";
import { apiRequest } from "@/utils/api";
import { formatCurrency } from "@/utils/currency";

interface DepositRecord {
  id: string;
  amount: number;
  status: string;
  admin_instructions: string | null;
  receipt_url: string | null;
  created_at: string;
}

export default function DepositPage() {
  const navigate = useNavigate();
  const { token, lang, user, setUser, addToast, currency } = useAppStore();
  const isAr = lang === "ar";

  const [amountUsd, setAmountUsd] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<DepositRecord[]>([]);
  const [receiptImageModal, setReceiptImageModal] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = async () => {
    try {
      const records = await apiRequest("/deposits/history");
      setHistory(records);
    } catch (err: any) {
      console.error("Could not fetch deposits history:", err);
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
    if (!amountUsd) {
      addToast(isAr ? "خطأ" : "Error", isAr ? "يرجى إدخال المبلغ" : "Please enter the amount", "error");
      return;
    }

    const amtUsd = parseFloat(amountUsd);
    if (isNaN(amtUsd) || amtUsd <= 0) {
      addToast(isAr ? "مبلغ غير صالح" : "Invalid Amount", isAr ? "يرجى إدخال مبلغ صحيح" : "Please enter a valid amount", "error");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/deposits/request", {
        method: "POST",
        body: JSON.stringify({
          amount: amtUsd,
        }),
      });

      addToast(
        isAr ? "تم إرسال الطلب" : "Deposit Requested", 
        isAr ? "طلبك قيد المراجعة، يرجى انتظار تفاصيل الدفع." : "Your request is sent, please wait for payment details.", 
        "success"
      );
      setAmountUsd("");
      fetchHistory();
    } catch (err: any) {
      addToast(
        isAr ? "فشل طلب الإيداع" : "Deposit Request Failed", 
        err.message || "Failed to create request", 
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, depositId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast(isAr ? "خطأ" : "Error", isAr ? "حجم الصورة كبير جداً" : "Image size is too large", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      try {
        await apiRequest(`/deposits/${depositId}/upload`, {
          method: "POST",
          body: JSON.stringify({ receipt_url: base64String })
        });
        addToast(
          isAr ? "تم الرفع" : "Uploaded", 
          isAr ? "تم إرسال الإيصال للمراجعة." : "Receipt sent for review.", 
          "success"
        );
        fetchHistory();
      } catch (err: any) {
        addToast(isAr ? "فشل" : "Failed", err.message || "Upload failed", "error");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout>
      <Toasts />

      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-on-surface mb-2">
          {isAr ? "إيداع الرصيد" : "Deposit Balance"}
        </h1>
        <p className="text-xs text-on-surface-variant font-medium">
          {isAr ? "قم بإنشاء طلب إيداع جديد وسيتم مراجعته وإرسال تفاصيل الدفع." : "Create a new deposit request and wait for admin instructions."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="flex flex-col gap-8">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-display text-base font-black text-on-surface mb-6">{isAr ? "طلب إيداع جديد" : "New Deposit Request"}</h3>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="block text-[10px] font-mono font-black uppercase text-slate-400 mb-2">
                  {isAr ? "المبلغ المراد إيداعه (بالدولار)" : "Deposit Amount (USD)"}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold focus:outline-none focus:border-primary transition-all text-on-surface"
                    placeholder={isAr ? "مثال: 60" : "e.g. 60"}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl text-xs hover:bg-primary-hover hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md shadow-orange-100"
              >
                {loading ? (isAr ? "جاري الإرسال..." : "Requesting...") : (isAr ? "إرسال الطلب" : "Submit Request")}
              </button>
            </form>
          </div>
        </div>

        {/* Deposit History Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-50">
              <h3 className="font-display font-black text-on-surface text-sm">{isAr ? "سجل الإيداعات" : "Deposit History"}</h3>
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-on-surface-variant">
                {isAr ? "لا توجد طلبات إيداع سابقة." : "No deposit requests found."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50 font-mono text-[9px] uppercase font-black text-slate-400 bg-slate-50/30">
                      <th className="p-4">{isAr ? "المبلغ" : "Amount"}</th>
                      <th className="p-4">{isAr ? "الحالة" : "Status"}</th>
                      <th className="p-4">{isAr ? "بيانات الدفع من الإدارة" : "Admin Instructions"}</th>
                      <th className="p-4">{isAr ? "إثبات الدفع" : "Proof"}</th>
                      <th className="p-4">{isAr ? "التاريخ" : "Date"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => {
                      let statusColor = "text-slate-600 bg-slate-50 border border-slate-200";
                      let statusText = record.status;
                      
                      if (record.status === "awaiting_details") {
                        statusColor = "text-yellow-600 bg-yellow-50 border border-yellow-200";
                        statusText = isAr ? "بانتظار تفاصيل الدفع" : "Awaiting Details";
                      } else if (record.status === "awaiting_payment") {
                        statusColor = "text-orange-600 bg-orange-50 border border-orange-200";
                        statusText = isAr ? "بانتظار الدفع" : "Awaiting Payment";
                      } else if (record.status === "pending_approval") {
                        statusColor = "text-blue-600 bg-blue-50 border border-blue-200";
                        statusText = isAr ? "قيد المراجعة" : "Pending Approval";
                      } else if (record.status === "approved") {
                        statusColor = "text-green-600 bg-green-50 border border-green-200";
                        statusText = isAr ? "مقبول" : "Approved";
                      } else if (record.status === "rejected") {
                        statusColor = "text-red-600 bg-red-50 border border-red-200";
                        statusText = isAr ? "مرفوض" : "Rejected";
                      }

                      return (
                        <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-display font-black text-xs text-primary">
                            ${parseFloat(record.amount.toString()).toFixed(2)}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black ${statusColor} whitespace-nowrap`}>
                              {statusText}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-[10px] text-on-surface-variant max-w-xs font-semibold whitespace-pre-wrap">
                            {record.admin_instructions || (isAr ? "لم يتم الإرسال بعد" : "Not sent yet")}
                          </td>
                          <td className="p-4">
                            {record.status === "awaiting_payment" ? (
                              <div className="flex items-center gap-2">
                                <label className="cursor-pointer bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-primary-hover transition-colors">
                                  {isAr ? "رفع صورة الدفع" : "Upload Proof"}
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleFileUpload(e, record.id)} 
                                  />
                                </label>
                              </div>
                            ) : record.receipt_url ? (
                              <button onClick={() => setReceiptImageModal(record.receipt_url!)} className="text-blue-500 hover:underline text-[10px] font-bold cursor-pointer">
                                {isAr ? "عرض الإيصال" : "View Receipt"}
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">-</span>
                            )}
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

      {/* Receipt Image Modal */}
      {receiptImageModal && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setReceiptImageModal(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-on-surface">
                {isAr ? 'عرض الإيصال' : 'View Receipt'}
              </h3>
              <button onClick={() => setReceiptImageModal(null)} className="text-slate-400 hover:text-primary transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-50 min-h-[300px] max-h-[80vh] overflow-auto">
              <img src={receiptImageModal} alt="Receipt" className="max-w-full max-h-full object-contain rounded" />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
