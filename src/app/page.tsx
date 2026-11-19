"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, FileText, Wallet, CalendarDays, Eye, MessageCircle, Printer, X, Trash2, Check, ReceiptText, Pencil, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import companyLogo from "../WhatsApp Image 2026-11-18 at 3.39.14 PM.jpeg";
import InvoiceTemplate from "./InvoiceTemplate";
import { deleteCloudInvoice, fetchCloudInvoices, isSupabaseConfigured, saveCloudInvoice, updateCloudInvoice, type Invoice, type InvoiceItem } from "@/lib/invoices";

const STORAGE_KEY = "beta-power-invoices-v1";
const fmt = (n: number) => new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 2 }).format(n || 0);
const dateFmt = (s: string) => new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "long", day: "numeric" }).format(new Date(s));
const localDateParts = (value: string) => {
  // Treat date-only values as calendar dates, and timestamps by their written
  // calendar date, avoiding UTC/local conversions that can shift a day.
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
};
type InvoiceFormItem = Omit<InvoiceItem, "quantity" | "price"> & { quantity: number | ""; price: number | "" };
const newItem = (): InvoiceFormItem => ({ id: crypto.randomUUID(), name: "", quantity: "", price: "" });

export default function Home() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "day" | "month" | "year">("all");
  const [selectedDay, setSelectedDay] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [creating, setCreating] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState("");
  const [items, setItems] = useState<InvoiceFormItem[]>([newItem()]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [sharing, setSharing] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const printableInvoice = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (isSupabaseConfigured) {
        const { data, error: dbError } = await fetchCloudInvoices();
        if (!active) return;
        if (dbError) setStorageError(`تعذر تحميل الفواتير من Supabase: ${dbError}`);
        else setInvoices(data);
      } else {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) setInvoices(JSON.parse(saved) as Invoice[]);
        } catch { setStorageError("تعذر قراءة الفواتير المحفوظة في هذا المتصفح."); }
      }
      if (active) setReady(true);
    };
    void load();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (ready && !isSupabaseConfigured) localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  }, [invoices, ready]);

  const filtered = useMemo(() => invoices.filter((inv) => {
    const matchesSearch = `${inv.number} ${inv.client}`.toLowerCase().includes(search.trim().toLowerCase());
    if (!matchesSearch) return false;
    if (dateFilter === "all") return true;
    const parts = localDateParts(inv.date);
    if (!parts) return false;
    if (dateFilter === "day") return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}` === selectedDay;
    if (dateFilter === "month") return `${parts.year}-${String(parts.month).padStart(2, "0")}` === selectedMonth;
    return parts.year === Number(selectedYear);
  }), [invoices, search, dateFilter, selectedDay, selectedMonth, selectedYear]);
  const totalValue = filtered.reduce((sum, inv) => sum + inv.total, 0);
  const draftTotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0);
  const updateItem = (id: string, key: "name" | "quantity" | "price", value: string) => setItems((current) => current.map((item) => {
    if (item.id !== id) return item;
    if (key === "name") return { ...item, name: value };
    return { ...item, [key]: value === "" ? "" : Number(value) };
  }));
  const resetForm = () => { setClient(""); setItems([newItem()]); setError(""); setEditingInvoice(null); setCreating(false); };
  const startCreate = () => { resetForm(); setCreating(true); };
  const startEdit = (invoice: Invoice) => {
    setSelected(null);
    setEditingInvoice(invoice);
    setClient(invoice.client);
    setItems(invoice.items.map((item) => ({ ...item })));
    setError("");
    setCreating(true);
  };

  const createInvoice = async () => {
    const validItems: InvoiceItem[] = items
      .filter((item) => item.name.trim() && item.quantity !== "" && Number(item.quantity) > 0 && item.price !== "" && Number(item.price) >= 0)
      .map((item) => ({ ...item, quantity: Number(item.quantity), price: Number(item.price) }));
    if (!client.trim()) { setError("يرجى إدخال اسم العميل أو الجهة."); return; }
    if (!validItems.length) { setError("أضف صنفًا واحدًا على الأقل مع الكمية والسعر."); return; }
    const total = validItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    if (editingInvoice) {
      const updated: Invoice = { ...editingInvoice, client: client.trim(), items: validItems, total, creator: "Mahmoud Hany" };
      if (isSupabaseConfigured) {
        const { error: dbError } = await updateCloudInvoice(updated);
        if (dbError) { setError(`تعذر تعديل الفاتورة في Supabase: ${dbError}`); toast.error("تعذر تعديل الفاتورة", { description: dbError }); return; }
      }
      setInvoices((current) => current.map((invoice) => invoice.id === updated.id ? updated : invoice));
      resetForm();
      setSelected(updated);
      toast.success("تم تعديل الفاتورة بنجاح");
      return;
    }
    const now = new Date();
    const invoice: Invoice = { id: crypto.randomUUID(), number: `INV-${now.getFullYear()}-${String(Date.now()).slice(-5)}`, client: client.trim(), items: validItems, date: now.toISOString(), total, creator: "Mahmoud Hany" };
    if (isSupabaseConfigured) {
      const { error: dbError } = await saveCloudInvoice(invoice);
      if (dbError) { setError(`لم يتم حفظ الفاتورة في Supabase: ${dbError}`); toast.error("تعذر إضافة الفاتورة", { description: dbError }); return; }
    }
    setInvoices((current) => [invoice, ...current]);
    resetForm();
    setSelected(invoice);
    toast.success("تمت إضافة الفاتورة بنجاح");
  };

  const removeInvoice = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const invoice = pendingDelete;
    if (isSupabaseConfigured) {
      const { error: dbError } = await deleteCloudInvoice(invoice.id);
      if (dbError) { setStorageError(`تعذر حذف الفاتورة من Supabase: ${dbError}`); toast.error("تعذر حذف الفاتورة", { description: dbError }); setDeleting(false); return; }
    }
    setInvoices((list) => list.filter((item) => item.id !== invoice.id));
    setPendingDelete(null);
    setDeleting(false);
    toast.success("تم حذف الفاتورة بنجاح");
  };

  const shareInvoicePdf = async (invoice: Invoice) => {
    if (sharing) return;
    setSharing(true);
    try {
      // html2pdf.js requires a browser DOM, so load it only after this user action.
      const pdfLibrary = await import("html2pdf.js");
      const html2pdf = pdfLibrary.default;
      let source = printableInvoice.current;
      // If the share button is in the list, render the invoice view before exporting it.
      if (!source || selected?.id !== invoice.id) {
        setSelected(invoice);
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        source = document.querySelector<HTMLElement>(".invoice-paper");
      }
      if (!source) throw new Error("تعذر تجهيز قالب الفاتورة.");
      await Promise.all(Array.from(source.querySelectorAll("img")).map(async (image) => {
        if (!image.complete) {
          await new Promise<void>((resolve, reject) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => reject(new Error("تعذر تحميل شعار الفاتورة.")), { once: true });
          });
        }
        if (!image.naturalWidth) throw new Error("صورة شعار الفاتورة غير متاحة للتصدير.");
        await image.decode();
      }));
      const blob = await html2pdf().set({
        margin: 10,
        filename: `${invoice.number}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }).from(source).outputPdf("blob") as Blob;
      const file = new File([blob], `${invoice.number}.pdf`, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url; anchor.download = file.name; anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        toast.success("تم تنزيل نسخة PDF إلى جهازك");
      }
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      setStorageError(cause instanceof Error ? `تعذرت مشاركة PDF: ${cause.message}` : "تعذرت مشاركة PDF.");
    } finally { setSharing(false); }
  };

  return <main className="shell" dir="rtl">
    <header className="topbar no-print"><div className="brand"><div className="brand-mark logo-frame navbar-logo"><Image src={companyLogo} alt="شعار Beta Power" priority/></div><div><div className="brand-name">Beta Power</div><div className="brand-sub">إدارة الفواتير</div></div></div><div className="profile"><div className="avatar">م</div><span>Mahmoud Hany</span></div></header>
    <section className="welcome no-print"><div><h1>إدارة الفواتير</h1><p>تابع فواتيرك وأنشئ فاتورة جديدة بكل سهولة.</p></div><button className="primary" onClick={startCreate}><Plus size={18}/> إنشاء فاتورة جديدة</button></section>
    <section className="stats no-print">
      <div className="stat"><div><div className="stat-label">إجمالي الفواتير</div><div className="stat-value">{filtered.length}</div></div><div className="stat-icon"><ReceiptText size={20}/></div></div>
      <div className="stat"><div><div className="stat-label">إجمالي قيمة الفواتير</div><div className="stat-value" style={{fontSize:19}}>{fmt(totalValue)}</div></div><div className="stat-icon"><Wallet size={20}/></div></div>
      <div className="stat"><div><div className="stat-label">آخر فاتورة</div><div className="stat-value" style={{fontSize:17}}>{invoices[0] ? dateFmt(invoices[0].date) : "—"}</div></div><div className="stat-icon"><CalendarDays size={20}/></div></div>
    </section>
    <section className="panel no-print"><div className="panel-head"><div><h2>الفواتير</h2><p>جميع الفواتير التي تم إنشاؤها</p></div><label className="search"><Search size={17}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث برقم الفاتورة أو اسم العميل" aria-label="ابحث في الفواتير"/></label></div>      <div className="date-filter" aria-label="Invoice date filter">
        <label>الفترة <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as typeof dateFilter)}><option value="all">الكل</option><option value="day">يوم</option><option value="month">شهر</option><option value="year">سنة</option></select></label>
        {dateFilter === "day" && <label>اختر اليوم <input type="date" value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)}/></label>}
        {dateFilter === "month" && <label>اختر الشهر <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}/></label>}
        {dateFilter === "year" && <label>اختر السنة <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>{Array.from({length: 11}, (_, index) => new Date().getFullYear() - 5 + index).map((year) => <option key={year} value={year}>{year}</option>)}</select></label>}
      </div>
      {storageError && <p className="error storage-message">{storageError}</p>}
      {filtered.length ? <div className="table-wrap"><table><thead><tr><th>رقم الفاتورة</th><th>العميل</th><th>التاريخ</th><th>الإجمالي</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>{filtered.map((inv) => <tr key={inv.id}><td className="inv-id">{inv.number}</td><td className="client-cell">{inv.client}</td><td className="date-cell">{dateFmt(inv.date)}</td><td className="amount">{fmt(inv.total)}</td><td><span className="status"><Check size={13}/> مكتملة</span></td><td><div className="actions"><button className="icon-btn" title="عرض الفاتورة" aria-label="عرض الفاتورة" onClick={() => setSelected(inv)}><Eye size={16}/></button><button className="icon-btn" title="مشاركة PDF عبر واتساب" aria-label="مشاركة PDF عبر واتساب" disabled={sharing} onClick={() => void shareInvoicePdf(inv)}><MessageCircle size={16}/></button><button className="icon-btn" title="تعديل الفاتورة" aria-label="تعديل الفاتورة" onClick={() => startEdit(inv)}><Pencil size={15}/></button><button className="icon-btn" title="حذف الفاتورة" aria-label="حذف الفاتورة" onClick={() => setPendingDelete(inv)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div> : <div className="empty"><FileText className="empty-icon" size={34}/><div>{search ? "لا توجد فواتير تطابق بحثك." : ready ? "لا توجد فواتير حتى الآن. ابدأ بإنشاء فاتورتك الأولى." : "جارٍ تحميل الفواتير..."}</div></div>}
    </section>

    {creating && <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) resetForm(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-title"><div className="modal-head"><h2 id="create-title">{editingInvoice ? "تعديل الفاتورة" : "إنشاء فاتورة جديدة"}</h2><button className="close" onClick={resetForm} aria-label="إغلاق"><X size={20}/></button></div><div className="modal-body"><label className="field-label" htmlFor="client">اسم العميل / الجهة</label><input id="client" className="text-input" value={client} onChange={(e) => setClient(e.target.value)} placeholder="أدخل اسم العميل أو الجهة" autoFocus/><div className="items-title"><span>الأصناف</span><button className="add-line" onClick={() => setItems((current) => [...current, newItem()])}><Plus size={15}/> إضافة صنف</button></div><div className="item-head"><span>اسم الصنف</span><span>الكمية</span><span>سعر الوحدة</span><span style={{textAlign:"center"}}>الإجمالي</span><span/></div>{items.map((item) => <div className="item-row" key={item.id}><input className="text-input" value={item.name} onChange={(e) => updateItem(item.id,"name",e.target.value)} placeholder="اسم الصنف" aria-label="اسم الصنف"/><input className="text-input" type="number" min="1" placeholder="الكمية" value={item.quantity} onChange={(e) => updateItem(item.id,"quantity",e.target.value)} aria-label="الكمية"/><input className="text-input" type="number" min="0" step="0.01" placeholder="سعر الوحدة" value={item.price} onChange={(e) => updateItem(item.id,"price",e.target.value)} aria-label="سعر الوحدة"/><div className="item-total">{fmt(Number(item.quantity || 0) * Number(item.price || 0))}</div><button className="remove" onClick={() => setItems((current) => current.length > 1 ? current.filter((x) => x.id !== item.id) : current)} aria-label="حذف الصنف"><X size={16}/></button></div>)}<div className="grand"><span>الإجمالي الكلي</span><strong>{fmt(draftTotal)}</strong></div>{error && <div className="error" role="alert">{error}</div>}</div><div className="modal-foot"><button className="primary" onClick={() => void createInvoice()}>{editingInvoice ? "حفظ التعديلات" : "حفظ الفاتورة"}</button><button className="secondary" onClick={resetForm}>إلغاء</button></div></section></div>}

    {pendingDelete && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setPendingDelete(null); }}><section className="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description"><div className="modal-head"><div className="confirm-heading"><div className="confirm-icon"><AlertTriangle size={22}/></div><div><h2 id="delete-title">تأكيد حذف الفاتورة</h2><p>يرجى مراجعة الفاتورة قبل الحذف</p></div></div><button className="close" onClick={() => !deleting && setPendingDelete(null)} aria-label="إغلاق"><X size={20}/></button></div><div className="modal-body"><p id="delete-description" className="confirm-copy">هل تريد حذف الفاتورة <strong>{pendingDelete.number}</strong> الخاصة بالعميل <strong>{pendingDelete.client}</strong>؟ لا يمكن التراجع عن هذا الإجراء.</p></div><div className="modal-foot"><button className="danger-button" disabled={deleting} onClick={() => void removeInvoice()}>{deleting ? "جارٍ الحذف…" : "حذف الفاتورة"}</button><button className="secondary" disabled={deleting} onClick={() => setPendingDelete(null)}>إلغاء</button></div></section></div>}

    {selected && <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}><section className="modal detail-modal" role="dialog" aria-modal="true" aria-label="تفاصيل الفاتورة"><div className="modal-head no-print"><h2>تفاصيل الفاتورة</h2><div style={{display:"flex",gap:12,alignItems:"center"}}><button className="close" title="طباعة" aria-label="طباعة الفاتورة" onClick={() => window.print()}><Printer size={19}/></button><button className="close" onClick={() => setSelected(null)} aria-label="إغلاق"><X size={20}/></button></div></div><InvoiceTemplate invoice={selected} invoiceRef={printableInvoice}/><div className="modal-foot no-print"><button className="secondary" onClick={() => startEdit(selected)}><Pencil size={16}/> تعديل الفاتورة</button><button className="primary" disabled={sharing} onClick={() => void shareInvoicePdf(selected)}><MessageCircle size={17}/> {sharing ? "جارٍ تجهيز PDF…" : "مشاركة PDF عبر واتساب"}</button><button className="secondary" onClick={() => window.print()}><Printer size={16}/> طباعة</button></div></section></div>}
  </main>;
}
