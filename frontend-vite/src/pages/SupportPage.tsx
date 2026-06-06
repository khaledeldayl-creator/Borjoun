"use client";

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import Toasts from "@/components/Toasts";
import { useAppStore } from "@/store/store";
import { translations } from "@/utils/translations";
import { apiRequest } from "@/utils/api";

interface TicketMessage {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  messages: TicketMessage[];
}

export default function Support() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, lang, user, addToast } = useAppStore();
  const t = translations[lang];
  const isAr = lang === "ar";

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // If query parameter dictates pre-filling
  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "advertise") {
      setSubject(isAr ? "طلب إعلان جديد" : "New Advertise Request");
      setMessage(
        isAr 
          ? "أريد الإعلان في موقع برجون. يرجى التواصل معي بالتفاصيل والأسعار لموقعنا / شركتنا:" 
          : "I want to advertise on Borjoun. Please contact me with rates and details for our site/brand:"
      );
    }
  }, [searchParams, isAr]);

  const fetchTickets = async () => {
    try {
      const list = await apiRequest("/tickets/list");
      setTickets(list);
    } catch (err: any) {
      console.error("Could not load tickets:", err);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchTickets();
  }, [token]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      addToast(isAr ? "خطأ" : "Error", isAr ? "يرجى تعبئة جميع الحقول" : "Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/tickets/create", {
        method: "POST",
        body: JSON.stringify({ subject, message }),
      });

      addToast(
        isAr ? "تم إنشاء التذكرة" : "Ticket Created", 
        isAr ? "سنقوم بالرد على تذكرتك في أقرب وقت ممكن" : "We will reply to your ticket shortly", 
        "success"
      );
      setSubject("");
      setMessage("");
      fetchTickets();
    } catch (err: any) {
      addToast(isAr ? "فشل الإنشاء" : "Failed to create ticket", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTicketDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage) return;

    setReplyLoading(true);
    try {
      const newMsg = await apiRequest(`/tickets/${selectedTicket.id}/message`, {
        method: "POST",
        body: JSON.stringify({ message: replyMessage }),
      });

      setSelectedTicket((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: "open",
          messages: [...prev.messages, newMsg],
        };
      });

      setReplyMessage("");
      addToast(
        isAr ? "تم إرسال الرد" : "Reply Sent", 
        isAr ? "تم إضافة رسالتك بنجاح إلى التذكرة." : "Your message was added to the ticket.", 
        "success"
      );
      fetchTickets();
    } catch (err: any) {
      addToast(isAr ? "فشل إرسال الرد" : "Reply Failed", err.message, "error");
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Toasts />

      <div className="mb-8">
        <h1 className="font-display text-3xl font-black text-on-surface mb-2">
          {t.t_support}
        </h1>
        <p className="text-xs text-on-surface-variant font-medium">
          {isAr 
            ? "هل لديك استفسار بخصوص دفعة معلقة أو تتبع عرض؟ فريق الدعم الفني متواجد لمساعدتك 24/7."
            : "Have questions about a payment or an offer? Our dedicated moderators are online 24/7."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Ticket Card */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm h-fit">
          <h3 className="font-display text-base font-black text-on-surface mb-6">{t.t_create}</h3>
          
          <form onSubmit={handleCreateTicket} className="flex flex-col gap-5">
            <div>
              <label className="block text-[10px] font-mono font-black uppercase text-slate-400 mb-2">
                {t.t_subject}
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold focus:outline-none focus:border-primary transition-all text-on-surface"
                placeholder={isAr ? "مشكلة في السحب / تتبع عرض..." : "Payment missing / offer issue..."}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-black uppercase text-slate-400 mb-2">
                {t.t_message}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold focus:outline-none focus:border-primary transition-all text-on-surface"
                placeholder={isAr ? "اكتب تفاصيل مشكلتك بوضوح هنا..." : "Describe your issue with transaction IDs..."}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl text-xs hover:bg-primary-hover hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md shadow-orange-100"
            >
              {loading ? (isAr ? "جاري الإرسال..." : "Submitting...") : t.t_send}
            </button>
          </form>
        </div>

        {/* Tickets List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-50">
              <h3 className="font-display font-black text-on-surface text-sm">
                {isAr ? "التذاكر النشطة" : "Active Tickets"}
              </h3>
            </div>

            {tickets.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-on-surface-variant">
                {t.t_no_tickets}
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {tickets.map((ticket) => {
                  let statusColor = "text-yellow-600 bg-yellow-50 border border-yellow-100";
                  if (ticket.status === "replied") statusColor = "text-green-600 bg-green-50 border border-green-100";
                  if (ticket.status === "closed") statusColor = "text-slate-500 bg-slate-50 border border-slate-100";

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => handleOpenTicketDetails(ticket)}
                      className="p-6 hover:bg-slate-50/50 cursor-pointer transition-all flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-display font-black text-xs text-on-surface mb-1">{ticket.subject}</h4>
                        <p className="text-[10px] font-bold text-slate-400">
                          {isAr ? "تاريخ الفتح:" : "Opened on:"} {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black ${statusColor}`}>
                        {isAr 
                          ? (ticket.status === "open" ? "مفتوحة" : ticket.status === "replied" ? "تم الرد" : "مغلقة")
                          : ticket.status.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Chat Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl h-[75vh] rounded-[32px] overflow-hidden border border-slate-100 flex flex-col shadow-2xl">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
              <div>
                <h2 className="font-display font-black text-on-surface text-sm">{selectedTicket.subject}</h2>
                <p className="text-[9px] font-bold text-slate-400 mt-1">Ticket ID: {selectedTicket.id}</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedTicket(null);
                  fetchTickets();
                }}
                className="text-secondary hover:text-on-surface font-black text-xl cursor-pointer"
              >
                close
              </button>
            </div>

            {/* Chat Thread */}
            <div className="flex-grow p-6 bg-slate-50/30 overflow-y-auto flex flex-col gap-4">
              {selectedTicket.messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`max-w-[75%] p-4 rounded-[20px] flex flex-col shadow-sm text-xs font-semibold ${
                    msg.is_admin 
                      ? "self-start bg-white border border-slate-100 text-on-surface rounded-tl-none" 
                      : "self-end bg-primary text-white rounded-tr-none"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  <span className={`text-[8px] mt-2.5 self-end ${msg.is_admin ? "text-slate-400" : "text-white/70"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            {selectedTicket.status !== "closed" && (
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-50 bg-white flex gap-4">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="flex-grow px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                  placeholder={isAr ? "اكتب ردك هنا..." : "Type your message reply..."}
                  required
                />
                <button
                  type="submit"
                  disabled={replyLoading}
                  className="bg-primary text-white px-6 py-3 rounded-2xl text-xs font-bold hover:bg-primary-hover transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-orange-100"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  <span>{t.t_reply}</span>
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
