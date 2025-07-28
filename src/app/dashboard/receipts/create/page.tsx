'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from '@/lib/auth-context';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Receipt, 
  FileText, 
  Home, 
  User, 
  Calendar, 
  DollarSign,
  Plus,
  Search,
  CreditCard,
  Banknote
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNo: string;
  amount: number;
  dueDate: string;
  description: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  room: {
    id: string;
    name: string;
  };
  contract: {
    tenantName: string;
  } | null;
}

interface CreateReceiptForm {
  invoiceId: string;
  amount: number;
  paidAt: string;
  method: 'cash' | 'transfer' | 'cheque' | 'credit_card';
  notes: string;
}

const paymentMethods = [
  { value: 'cash', label: 'เงินสด', icon: Banknote },
  { value: 'transfer', label: 'โอนเงิน', icon: CreditCard },
  { value: 'cheque', label: 'เช็ค', icon: FileText },
  { value: 'credit_card', label: 'บัตรเครดิต', icon: CreditCard }
];

export default function CreateReceiptPage() {
  const { data: session } = useSession();
  const authFetch = useAuthFetch();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  const [form, setForm] = useState<CreateReceiptForm>({
    invoiceId: '',
    amount: 0,
    paidAt: new Date().toISOString().split('T')[0],
    method: 'cash',
    notes: ''
  });

  // Use useEffect with proper dependencies to fetch data only once
  useEffect(() => {
    if (!session?.user || dataFetched) return;
    
    let isMounted = true;
    
    const fetchInvoicesOnce = async () => {
      try {
        setDataFetched(true); // Set immediately to prevent duplicates
        setLoading(true);
        const response = await authFetch('/api/invoices?status=PENDING,OVERDUE');
        if (response.ok && isMounted) {
          const data = await response.json();
          setInvoices(data.invoices || []);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        if (isMounted) {
          setDataFetched(false); // Reset on error
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInvoicesOnce();

    return () => {
      isMounted = false;
    };
  }, [session?.user]); // Only depend on session?.user, authFetch is stable

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Memoize selected invoice handling to prevent re-runs
  useEffect(() => {
    const invoiceId = searchParams.get('invoice');
    if (invoiceId && invoices.length > 0) {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (invoice && (!selectedInvoice || selectedInvoice.id !== invoice.id)) {
        setSelectedInvoice(invoice);
        setForm(prev => ({
          ...prev,
          invoiceId: invoice.id,
          amount: invoice.amount
        }));
      }
    }
  }, [searchParams, invoices, selectedInvoice]);

  // Memoize filtered invoices based on debounced search term
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setFilteredInvoices(invoices);
      return;
    }

    const filtered = invoices.filter(invoice => 
      invoice.invoiceNo.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      invoice.room.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (invoice.contract?.tenantName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
    );
    
    setFilteredInvoices(filtered);
  }, [invoices, debouncedSearchTerm]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleInvoiceSelect = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setForm(prev => ({
      ...prev,
      invoiceId: invoice.id,
      amount: invoice.amount
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInvoice) return;

    try {
      setSubmitting(true);
      
      const response = await authFetch('/api/receipts', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          paidAt: new Date(form.paidAt).toISOString()
        }),
      });

      if (response.ok) {
        const receipt = await response.json();
        router.push(`/dashboard/receipts/${receipt.id}`);
      } else {
        const error = await response.json();
        alert(error.message || 'เกิดข้อผิดพลาดในการสร้างใบเสร็จ');
      }
    } catch (error) {
      console.error('Error creating receipt:', error);
      alert('เกิดข้อผิดพลาดในการสร้างใบเสร็จ');
    } finally {
      setSubmitting(false);
    }
  }, [authFetch, form, router, selectedInvoice]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/receipts" className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Receipt className="w-8 h-8 text-primary" />
            สร้างใบเสร็จรับเงิน
          </h1>
          <p className="text-base-content/70 mt-2">
            สร้างใบเสร็จสำหรับการชำระค่าเช่า
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invoice Selection */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title mb-4">เลือกใบแจ้งหนี้</h2>
              
              {/* Search */}
              <div className="form-control mb-4">
                <div className="input-group">
                  <span>
                    <Search className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="ค้นหาด้วยเลขที่ใบแจ้งหนี้, ห้อง หรือชื่อผู้เช่า..."
                    className="input input-bordered flex-1"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Invoice List */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-base-content/70 mb-2">
                    {searchTerm ? 'ไม่พบใบแจ้งหนี้ที่ตรงกับการค้นหา' : 'ไม่มีใบแจ้งหนี้ที่รอชำระ'}
                  </h3>
                  {!searchTerm && (
                    <Link href="/dashboard/invoices/create" className="btn btn-primary btn-sm">
                      <Plus className="w-4 h-4" />
                      สร้างใบแจ้งหนี้ใหม่
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className={`card bg-base-200 cursor-pointer transition-all hover:bg-base-300 ${
                        selectedInvoice?.id === invoice.id ? 'ring-2 ring-primary bg-primary/10' : ''
                      }`}
                      onClick={() => handleInvoiceSelect(invoice)}
                    >
                      <div className="card-body py-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">
                              {invoice.invoiceNo}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-base-content/70 mt-1">
                              <span className="flex items-center gap-1">
                                <Home className="w-4 h-4" />
                                {invoice.room.name}
                              </span>
                              {invoice.contract && (
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {invoice.contract.tenantName}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-xl text-primary">
                              {formatCurrency(invoice.amount)}
                            </div>
                            <div className="text-sm text-base-content/70">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              ครบกำหนด: {formatDate(invoice.dueDate)}
                            </div>
                            <div className={`badge ${
                              invoice.status === 'OVERDUE' ? 'badge-error' : 'badge-warning'
                            } badge-sm mt-1`}>
                              {invoice.status === 'OVERDUE' ? 'เกินกำหนด' : 'รอชำระ'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Receipt Form */}
        <div>
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title mb-4">รายละเอียดการชำระ</h3>
              
              {selectedInvoice ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Selected Invoice Info */}
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">ใบแจ้งหนี้ที่เลือก</h4>
                    <div className="text-sm space-y-1">
                      <div>เลขที่: {selectedInvoice.invoiceNo}</div>
                      <div>ห้อง: {selectedInvoice.room.name}</div>
                      <div>จำนวน: {formatCurrency(selectedInvoice.amount)}</div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">จำนวนเงินที่รับ *</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={selectedInvoice.amount}
                      className="input input-bordered"
                      value={form.amount}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        amount: parseFloat(e.target.value) || 0
                      }))}
                      required
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        สูงสุด: {formatCurrency(selectedInvoice.amount)}
                      </span>
                    </label>
                  </div>

                  {/* Payment Date */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">วันที่ชำระ *</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered"
                      value={form.paidAt}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        paidAt: e.target.value
                      }))}
                      required
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">วิธีการชำระ *</span>
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                          <label key={method.value} className="cursor-pointer">
                            <input
                              type="radio"
                              name="method"
                              value={method.value}
                              checked={form.method === method.value}
                              onChange={(e) => setForm(prev => ({
                                ...prev,
                                method: e.target.value as 'cash' | 'transfer' | 'cheque' | 'credit_card'
                              }))}
                              className="radio radio-primary radio-sm"
                            />
                            <span className="label-text ml-2 flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {method.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">หมายเหตุ</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered"
                      rows={3}
                      placeholder="หมายเหตุเพิ่มเติม (ไม่บังคับ)"
                      value={form.notes}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="card-actions justify-end pt-4">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting || form.amount <= 0 || form.amount > selectedInvoice.amount}
                    >
                      {submitting ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          กำลังสร้าง...
                        </>
                      ) : (
                        <>
                          <Receipt className="w-4 h-4" />
                          สร้างใบเสร็จ
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                  <p className="text-base-content/70">
                    กรุณาเลือกใบแจ้งหนี้เพื่อสร้างใบเสร็จ
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
