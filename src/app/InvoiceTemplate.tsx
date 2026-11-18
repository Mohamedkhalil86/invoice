import Image from "next/image";
import type { RefObject } from "react";
import type { Invoice } from "@/lib/invoices";
import companyLogo from "../WhatsApp Image 2026-11-18 at 3.39.14 PM.jpeg";

type InvoiceTemplateProps = {
  invoice: Invoice;
  invoiceRef: RefObject<HTMLElement | null>;
};

const amount = (value: number) => new Intl.NumberFormat("en-EG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value || 0);

const arabicDate = (value: string) => new Intl.DateTimeFormat("ar-EG", {
  day: "numeric", month: "long", year: "numeric",
}).format(new Date(value));

const englishDate = (value: string) => new Intl.DateTimeFormat("en-GB", {
  day: "2-digit", month: "short", year: "numeric",
}).format(new Date(value));

export default function InvoiceTemplate({ invoice, invoiceRef }: InvoiceTemplateProps) {
  return <article className="invoice-paper" ref={invoiceRef} dir="rtl">
    <header className="invoice-header">
      <div className="invoice-company">
        <Image
          className="invoice-company-logo"
          src={companyLogo}
          alt="Beta Power"
          width={90}
          height={90}
          unoptimized
        />
        <div>
          <p className="invoice-company-kicker">فاتورة مبيعات</p>
          <h2>Beta Power</h2>
        </div>
      </div>
      <div className="invoice-identity">
        <div className="invoice-title-ar">فاتورة</div>
        <div className="invoice-title-en">Sales Invoice</div>
        <strong className="invoice-number" dir="ltr">{invoice.number}</strong>
        <div className="invoice-dates">
          <span dir="rtl">{arabicDate(invoice.date)}</span>
          <span dir="ltr">{englishDate(invoice.date)}</span>
        </div>
      </div>
    </header>

    <section className="invoice-client-card">
      <div className="invoice-client-main">
        <div className="invoice-section-label"><span>فاتورة إلى</span></div>
        <strong className="invoice-client-name">{invoice.client}</strong>
      </div>
    </section>

    <table className="invoice-items-table">
      <thead><tr><th>الصنف</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
      <tbody>{invoice.items.map((item) => <tr key={item.id}>
        <td>{item.name}</td>
        <td>{item.quantity}</td>
        <td dir="ltr">{amount(item.price)}</td>
        <td dir="ltr">{amount(item.price * item.quantity)}</td>
      </tr>)}</tbody>
    </table>

    <section className="invoice-total-card">
      <div className="invoice-total-heading">
        <strong>الإجمالي الكلي</strong>
        <span>Total Amount</span>
      </div>
      <div className="invoice-total-amount">
        <strong dir="ltr">{amount(invoice.total)}</strong>
        <span>جنيه مصري / EGP</span>
      </div>
    </section>

    <div className="invoice-thanks">شكرًا لاختياركم <strong>Beta Power</strong></div>

    <section className="invoice-contact-grid" aria-label="بيانات التواصل">
      <div className="invoice-contact-card">
        <span className="invoice-contact-glyph invoice-whatsapp" aria-hidden="true">W</span>
        <div><small>واتساب</small><a href="https://wa.me/201114981832" dir="ltr">01114981832</a></div>
      </div>
      <div className="invoice-contact-card">
        <span className="invoice-contact-glyph invoice-phone" aria-hidden="true">&#9742;</span>
        <div><small>رقم الاتصال</small><a href="tel:+201550579513" dir="ltr">01550579513</a></div>
      </div>
      <div className="invoice-contact-card">
        <span className="invoice-contact-glyph invoice-facebook" aria-hidden="true">f</span>
        <div><small>فيسبوك</small><a href="https://www.facebook.com/share/1AV97pEsng/" target="_blank" rel="noopener noreferrer">صفحتنا على فيسبوك</a></div>
      </div>
    </section>

    <footer className="invoice-bottom-line">
      <span>إعداد: Mahmoud Hany</span>
      <span>صفحة 1 من 1</span>
    </footer>
  </article>;
}
