import React, { useState } from 'react';
import { Customer, PaymentRecord } from '../../types';
import {
  CreditCard,
  IndianRupee,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Receipt,
  FileDown
} from 'lucide-react';

interface PaymentsTrackingProps {
  customers: Customer[];
  payments: PaymentRecord[];
  onRecordPayment: (payment: PaymentRecord) => void;
  lang: 'en' | 'ta';
}

export const PaymentsTracking: React.FC<PaymentsTrackingProps> = ({
  customers,
  payments,
  onRecordPayment,
  lang
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [amount, setAmount] = useState(450);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('Cash');
  const [receiptNumber, setReceiptNumber] = useState(`RCPT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [notes, setNotes] = useState('Collected during morning delivery route');

  const totalMonthlyBilled = customers.reduce((sum, c) => sum + (c.monthlyAmount || 0), 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = Math.max(0, totalMonthlyBilled - totalCollected);

  const handleOpenPaymentFor = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setAmount(c.monthlyAmount || 450);
    setReceiptNumber(`RCPT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setIsModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (!cust) return;

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      customerId: cust.id,
      customerName: cust.fullName,
      monthYear: 'October 2026',
      amount: Number(amount),
      paidOn: new Date().toISOString().split('T')[0],
      paymentMethod,
      receiptNumber,
      notes,
    };

    onRecordPayment(newPayment);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {lang === 'ta' ? 'சந்தாக் கட்டண மேலாண்மை' : 'Subscription & Monthly Billing Tracker'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'ta'
              ? 'மாதாந்திர நாளிதழ் சந்தா தொகை, ரொக்க வசூல் பதிவு மற்றும் ரசீது எண்கள்.'
              : 'Track monthly newspaper dues, record cash or UPI payments, and generate delivery partner receipts.'}
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedCustomerId(customers[0]?.id || '');
            setAmount(customers[0]?.monthlyAmount || 450);
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Customer Payment</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Monthly Billed
          </span>
          <p className="text-2xl font-black text-slate-900 mt-2">₹{totalMonthlyBilled}</p>
          <span className="text-xs text-slate-500 mt-1 block">
            Across {customers.length} subscribers
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Amount Collected
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-2">₹{totalCollected}</p>
          <span className="text-xs text-slate-500 mt-1 block">
            {payments.length} receipts issued
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pending / Outstanding Due
          </span>
          <p className="text-2xl font-black text-amber-600 mt-2">₹{totalOutstanding}</p>
          <span className="text-xs text-slate-500 mt-1 block">Awaiting collection</span>
        </div>
      </div>

      {/* Customer Dues Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-sm">
          Subscriber Dues & Ledger
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold">
              <tr>
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-5 py-3.5">Contact & Area</th>
                <th className="px-5 py-3.5">Monthly Due</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Last Payment Date</th>
                <th className="px-5 py-3.5 text-right">Collect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{c.fullName}</td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {c.phone} • {c.area}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">₹{c.monthlyAmount}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        c.paymentStatus === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : c.paymentStatus === 'overdue'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {c.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {c.lastPaymentDate || 'Pending payment'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {c.paymentStatus !== 'paid' && (
                      <button
                        onClick={() => handleOpenPaymentFor(c)}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Record Cash
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Receipts List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-3">
          Issued Payment Receipts ({payments.length})
        </h3>
        <div className="divide-y divide-slate-100">
          {payments.map((p) => (
            <div key={p.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">{p.customerName}</div>
                  <div className="text-[11px] text-slate-500">
                    Ref: {p.receiptNumber} • Method: {p.paymentMethod} • Date: {p.paidOn}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-black text-emerald-600 text-sm">₹{p.amount}</span>
                <p className="text-[10px] text-slate-400">{p.monthYear}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-xs">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Record Customer Subscription Payment
            </h3>

            <form onSubmit={handleSavePayment} className="space-y-4 mt-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    const cust = customers.find((c) => c.id === e.target.value);
                    if (cust) setAmount(cust.monthlyAmount);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} (#{c.houseNumber}, {c.street}) - Due: ₹{c.monthlyAmount}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Amount Collected (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Cash">Cash (Delivery Partner)</option>
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Receipt Reference Number
                </label>
                <input
                  type="text"
                  required
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Collection Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  Confirm & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
