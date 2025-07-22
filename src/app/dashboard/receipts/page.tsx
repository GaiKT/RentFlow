'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Receipt as ReceiptIcon, 
  Plus, 
  Search, 
  Calendar,
  DollarSign,
  TrendingUp,
  Eye,
  Printer,
  Download,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowLeft
} from 'lucide-react';

interface Receipt {
  id: string;
  receiptNo: string;
  amount: number;
  paidAt: string;
  method: string;
  notes: string | null;
  room: {
    id: string;
    name: string;
  };
  contract: {
    id: string;
    tenantName: string;
  } | null;
  invoice: {
    id: string;
    invoiceNo: string;
    dueDate: string;
  };
}

const paymentMethodConfig = {
  cash: { 
    label: 'เงินสด', 
    color: 'badge-success', 
    icon: Banknote,
    bgColor: 'bg-success/10'
  },
  transfer: { 
    label: 'โอนเงิน', 
    color: 'badge-info', 
    icon: CreditCard,
    bgColor: 'bg-info/10'
  },
  mobile: { 
    label: 'Mobile Banking', 
    color: 'badge-warning', 
    icon: Smartphone,
    bgColor: 'bg-warning/10'
  },
  other: { 
    label: 'อื่นๆ', 
    color: 'badge-neutral', 
    icon: CreditCard,
    bgColor: 'bg-neutral/10'
  }
};

export default function ReceiptsPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'paidAt' | 'amount'>('paidAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    thisMonth: 0,
    thisMonthAmount: 0,
    cashCount: 0,
    transferCount: 0,
    mobileCount: 0
  });

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/login");
        return;
      }

      console.log('Fetching receipts with token...');
      const response = await fetch('/api/receipts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        const receiptsArray = data.receipts || [];
        console.log('Receipts array:', receiptsArray.length, receiptsArray);
        setReceipts(receiptsArray);
        calculateStats(receiptsArray);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Failed to fetch receipts:', response.status, errorData);
        if (response.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
        }
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const calculateStats = (receiptsData: Receipt[]) => {
    const total = receiptsData.length;
    const totalAmount = receiptsData.reduce((sum, receipt) => sum + receipt.amount, 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthReceipts = receiptsData.filter(receipt => {
      const receiptDate = new Date(receipt.paidAt);
      return receiptDate.getMonth() === currentMonth && receiptDate.getFullYear() === currentYear;
    });
    
    const thisMonth = thisMonthReceipts.length;
    const thisMonthAmount = thisMonthReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
    
    const cashCount = receiptsData.filter(r => r.method === 'cash').length;
    const transferCount = receiptsData.filter(r => r.method === 'transfer').length;
    const mobileCount = receiptsData.filter(r => r.method === 'mobile').length;

    setStats({
      total,
      totalAmount,
      thisMonth,
      thisMonthAmount,
      cashCount,
      transferCount,
      mobileCount
    });
  };

  // Filter and sort receipts with useMemo for performance
  const filteredReceipts = useMemo(() => {
    return receipts
      .filter(receipt => {
        const matchesSearch = 
          receipt.receiptNo.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          receipt.room.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          receipt.invoice.invoiceNo.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          (receipt.contract?.tenantName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || false);
        
        const matchesMethod = methodFilter === 'ALL' || receipt.method === methodFilter;
        
        let matchesDate = true;
        if (dateFilter !== 'ALL') {
          const receiptDate = new Date(receipt.paidAt);
          const now = new Date();
          
          switch (dateFilter) {
            case 'TODAY':
              matchesDate = receiptDate.toDateString() === now.toDateString();
              break;
            case 'THIS_WEEK':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              matchesDate = receiptDate >= weekAgo;
              break;
            case 'THIS_MONTH':
              matchesDate = receiptDate.getMonth() === now.getMonth() && receiptDate.getFullYear() === now.getFullYear();
              break;
            case 'THIS_YEAR':
              matchesDate = receiptDate.getFullYear() === now.getFullYear();
              break;
          }
        }
        
        return matchesSearch && matchesMethod && matchesDate;
      })
      .sort((a, b) => {
        let aValue, bValue;
        
        if (sortBy === 'amount') {
          aValue = a.amount;
          bValue = b.amount;
        } else {
          aValue = new Date(a.paidAt).getTime();
          bValue = new Date(b.paidAt).getTime();
        }
        
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
  }, [receipts, debouncedSearchTerm, methodFilter, dateFilter, sortBy, sortOrder]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const formatDateTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Handle print function
  const handlePrint = async (receiptId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch(`/api/receipts/${receiptId}/print`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const html = await response.text();
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
      } else {
        console.error('Failed to generate print document');
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
    }
  };

  // Handle PDF download function
  const handleDownloadPDF = async (receiptId: string, receiptNo: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch(`/api/receipts/${receiptId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `receipt-${receiptNo}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ReceiptIcon className="w-8 h-8 text-primary" />
              จัดการใบเสร็จ
            </h1>
            <p className="text-base-content/70 mt-2">
              ดูและจัดการใบเสร็จการชำระเงิน
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-4 lg:mt-0">
          <Link href="/dashboard/invoices" className="btn btn-outline">
            ดูใบแจ้งหนี้
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stats shadow-lg bg-base-100">
            <div className="stat">
              <div className="stat-figure text-primary">
                <ReceiptIcon className="w-8 h-8" />
              </div>
              <div className="stat-title">ใบเสร็จทั้งหมด</div>
              <div className="stat-value text-primary">{stats.total}</div>
              <div className="stat-desc">ฉบับ</div>
            </div>
          </div>

          <div className="stats shadow-lg bg-base-100">
            <div className="stat">
              <div className="stat-figure text-success">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div className="stat-title">เดือนนี้</div>
              <div className="stat-value text-success">{stats.thisMonth}</div>
              <div className="stat-desc">ฉบับ</div>
            </div>
          </div>

          <div className="stats shadow-lg bg-base-100">
            <div className="stat">
              <div className="stat-figure text-info">
                <DollarSign className="w-8 h-8" />
              </div>
              <div className="stat-title">ยอดรวมทั้งหมด</div>
              <div className="stat-value text-info text-lg">{formatCurrency(stats.totalAmount)}</div>
              <div className="stat-desc">บาท</div>
            </div>
          </div>

          <div className="stats shadow-lg bg-base-100">
            <div className="stat">
              <div className="stat-figure text-warning">
                <Calendar className="w-8 h-8" />
              </div>
              <div className="stat-title">เดือนนี้</div>
              <div className="stat-value text-warning text-lg">{formatCurrency(stats.thisMonthAmount)}</div>
              <div className="stat-desc">บาท</div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Summary */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-r from-success to-green-600 text-white shadow-lg">
            <div className="card-body">
              <h3 className="card-title">
                <Banknote className="w-6 h-6" />
                เงินสด
              </h3>
              <div className="text-2xl font-bold">{stats.cashCount} รายการ</div>
              <p className="opacity-80">การชำระด้วยเงินสด</p>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-info to-blue-600 text-white shadow-lg">
            <div className="card-body">
              <h3 className="card-title">
                <CreditCard className="w-6 h-6" />
                โอนเงิน
              </h3>
              <div className="text-2xl font-bold">{stats.transferCount} รายการ</div>
              <p className="opacity-80">การโอนเงินผ่านธนาคาร</p>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-warning to-orange-600 text-white shadow-lg">
            <div className="card-body">
              <h3 className="card-title">
                <Smartphone className="w-6 h-6" />
                Mobile Banking
              </h3>
              <div className="text-2xl font-bold">{stats.mobileCount} รายการ</div>
              <p className="opacity-80">การชำระผ่านแอพ</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 w-4 h-4" />
                <input
                  type="text"
                  placeholder="ค้นหาเลขที่ใบเสร็จ, ห้อง, หรือชื่อผู้เช่า..."
                  className="input input-bordered w-full pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Method Filter */}
            <select
              className="select select-bordered"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="ALL">วิธีชำระทั้งหมด</option>
              <option value="cash">เงินสด</option>
              <option value="transfer">โอนเงิน</option>
              <option value="mobile">Mobile Banking</option>
              <option value="other">อื่นๆ</option>
            </select>

            {/* Date Filter */}
            <select
              className="select select-bordered"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="ALL">ช่วงเวลาทั้งหมด</option>
              <option value="TODAY">วันนี้</option>
              <option value="THIS_WEEK">สัปดาห์นี้</option>
              <option value="THIS_MONTH">เดือนนี้</option>
              <option value="THIS_YEAR">ปีนี้</option>
            </select>

            {/* Sort By */}
            <select
              className="select select-bordered"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="paidAt">วันที่ชำระ</option>
              <option value="amount">จำนวนเงิน</option>
            </select>

            {/* Sort Order */}
            <select
              className="select select-bordered"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
            >
              <option value="desc">ใหม่ไปเก่า</option>
              <option value="asc">เก่าไปใหม่</option>
            </select>

            {/* Reset Filters */}
            {(searchTerm || methodFilter !== "ALL" || dateFilter !== "ALL" || sortBy !== "paidAt" || sortOrder !== "desc") && (
              <button
                className="btn btn-outline"
                onClick={() => {
                  setSearchTerm("");
                  setMethodFilter("ALL");
                  setDateFilter("ALL");
                  setSortBy("paidAt");
                  setSortOrder("desc");
                }}
              >
                ล้างทั้งหมด
              </button>
            )}
          </div>

          {/* Search Results Info */}
          <div className="flex justify-between items-center text-sm text-base-content/70 mt-4">
            <span>
              แสดงผล {filteredReceipts.length} จาก {receipts.length} ใบเสร็จ
            </span>
          </div>
        </div>
      </div>

      {/* Receipts List */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-16">
              <ReceiptIcon className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-base-content/70 mb-2">
                {receipts.length === 0 ? "ยังไม่มีใบเสร็จ" : "ไม่พบใบเสร็จที่ค้นหา"}
              </h3>
              <p className="text-base-content/50">
                {receipts.length === 0
                  ? 'ยังไม่มีใบเสร็จในระบบ'
                  : 'ลองค้นหาด้วยคำอื่น หรือเปลี่ยนตัวกรอง'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>เลขที่ใบเสร็จ</th>
                    <th>ใบแจ้งหนี้</th>
                    <th>ห้อง</th>
                    <th>ผู้เช่า</th>
                    <th>จำนวนเงิน</th>
                    <th>วิธีชำระ</th>
                    <th>วันที่ชำระ</th>
                    <th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map((receipt) => {
                    const method = paymentMethodConfig[receipt.method as keyof typeof paymentMethodConfig] || paymentMethodConfig.other;
                    const MethodIcon = method.icon;
                    
                    return (
                      <tr key={receipt.id}>
                        <td>
                          <div className="font-mono font-semibold">
                            {receipt.receiptNo}
                          </div>
                        </td>
                        <td>
                          <div className="font-mono text-sm">
                            {receipt.invoice.invoiceNo}
                          </div>
                          <div className="text-xs text-base-content/60">
                            ครบกำหนด: {formatDate(receipt.invoice.dueDate)}
                          </div>
                        </td>
                        <td>
                          <div className="font-medium">{receipt.room.name}</div>
                        </td>
                        <td>
                          <div className="font-medium">
                            {receipt.contract?.tenantName || '-'}
                          </div>
                        </td>
                        <td>
                          <div className="font-semibold text-lg text-success">
                            {formatCurrency(receipt.amount)}
                          </div>
                        </td>
                        <td>
                          <div className={`badge ${method.color} gap-2`}>
                            <MethodIcon className="w-3 h-3" />
                            {method.label}
                          </div>
                        </td>
                        <td>
                          <div className="font-medium">
                            {formatDateTime(receipt.paidAt)}
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <Link
                              href={`/dashboard/receipts/${receipt.id}`}
                              className="btn btn-sm btn-ghost"
                              title="ดูรายละเอียด"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              className="btn btn-sm btn-ghost"
                              title="พิมพ์"
                              onClick={() => handlePrint(receipt.id)}
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              className="btn btn-sm btn-ghost"
                              title="ดาวน์โหลด PDF"
                              onClick={() => handleDownloadPDF(receipt.id, receipt.receiptNo)}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
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
  );
}
