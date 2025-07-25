'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from '@/lib/auth-context';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Printer,
  Download
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNo: string;
  amount: number;
  dueDate: string;
  description: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issuedAt: string;
  room: {
    id: string;
    name: string;
  };
  contract: {
    id: string;
    tenantName: string;
  } | null;
}

const statusConfig = {
  PENDING: { 
    label: 'รอชำระ', 
    color: 'badge-warning', 
    icon: Clock,
    bgColor: 'bg-warning/10'
  },
  PAID: { 
    label: 'ชำระแล้ว', 
    color: 'badge-success', 
    icon: CheckCircle,
    bgColor: 'bg-success/10'
  },
  OVERDUE: { 
    label: 'เกินกำหนด', 
    color: 'badge-error', 
    icon: AlertTriangle,
    bgColor: 'bg-error/10'
  },
  CANCELLED: { 
    label: 'ยกเลิก', 
    color: 'badge-neutral', 
    icon: XCircle,
    bgColor: 'bg-neutral/10'
  }
};

export default function InvoicesPage() {
  const { data: session } = useSession();
  const authFetch = useAuthFetch();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'issuedAt'>('dueDate');
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
    pending: 0,
    paid: 0,
    overdue: 0,
    totalAmount: 0,
    pendingAmount: 0
  });

  const fetchInvoices = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      setLoading(true);
      const response = await authFetch('/api/invoices');
      if (response.ok) {
        const data = await response.json();
        const invoicesArray = data.invoices || [];
        setInvoices(invoicesArray);
        calculateStats(invoicesArray);
      } else {
        console.error('Failed to fetch invoices');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const calculateStats = (invoicesData: Invoice[]) => {
    const total = invoicesData.length;
    const pending = invoicesData.filter(inv => inv.status === 'PENDING').length;
    const paid = invoicesData.filter(inv => inv.status === 'PAID').length;
    const overdue = invoicesData.filter(inv => inv.status === 'OVERDUE').length;
    const totalAmount = invoicesData.reduce((sum, inv) => sum + inv.amount, 0);
    const pendingAmount = invoicesData
      .filter(inv => inv.status === 'PENDING' || inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + inv.amount, 0);

    setStats({
      total,
      pending,
      paid,
      overdue,
      totalAmount,
      pendingAmount
    });
  };

  // Filter and sort invoices with useMemo for performance
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(invoice => {
        const matchesSearch = 
          invoice.invoiceNo.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          invoice.room.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          (invoice.contract?.tenantName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || false);
        
        const matchesStatus = statusFilter === 'ALL' || invoice.status === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        if (sortBy === 'amount') {
          aValue = Number(aValue);
          bValue = Number(bValue);
        } else {
          aValue = new Date(aValue as string).getTime();
          bValue = new Date(bValue as string).getTime();
        }
        
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
  }, [invoices, debouncedSearchTerm, statusFilter, sortBy, sortOrder]);

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

  const isOverdue = useCallback((dueDate: string, status: string) => {
    return status === 'PENDING' && new Date(dueDate) < new Date();
  }, []);

  // Handle print function
  const handlePrint = async (invoiceId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch(`/api/invoices/${invoiceId}/print`, {
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
      console.error('Error printing invoice:', error);
    }
  };

  // Handle PDF download function
  const handleDownloadPDF = async (invoiceId: string, invoiceNo: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
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
        a.download = `invoice-${invoiceNo}.pdf`;
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

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

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
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            จัดการใบแจ้งหนี้
          </h1>
          <p className="text-base-content/70 mt-2">
            ออกใบแจ้งหนี้และติดตามการชำระเงิน
          </p>
        </div>
        <div className="flex gap-3 mt-4 lg:mt-0">
          <Link href="/dashboard/invoices/create" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            ออกใบแจ้งหนี้ใหม่
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat bg-base-100 shadow-lg rounded-lg">
            <div className="stat-figure text-primary">
              <FileText className="w-8 h-8" />
            </div>
            <div className="stat-title">ใบแจ้งหนี้ทั้งหมด</div>
            <div className="stat-value text-primary">{stats.total}</div>
            <div className="stat-desc">ฉบับ</div>
          </div>

          <div className="stat bg-base-100 shadow-lg rounded-lg">
            <div className="stat-figure text-warning">
              <Clock className="w-8 h-8" />
            </div>
            <div className="stat-title">รอชำระ</div>
            <div className="stat-value text-warning">{stats.pending}</div>
            <div className="stat-desc">ฉบับ</div>
          </div>

          <div className="stat bg-base-100 shadow-lg rounded-lg">
          <div className="stat-figure text-success">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="stat-title">ชำระแล้ว</div>
          <div className="stat-value text-success">{stats.paid}</div>
          <div className="stat-desc">ฉบับ</div>
        </div>
        
          <div className="stat bg-base-100 shadow-lg rounded-lg">
            <div className="stat-figure text-error">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="stat-title">เกินกำหนด</div>
            <div className="stat-value text-error">{stats.overdue}</div>
            <div className="stat-desc">ฉบับ</div>
          </div>
        </div>
      )}

      {/* Financial Summary */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card bg-gradient-to-r from-primary to-primary-focus text-primary-content shadow-lg">
          <div className="card-body">
            <h3 className="card-title">
              <DollarSign className="w-6 h-6" />
              ยอดรวมทั้งหมด
            </h3>
            <div className="text-3xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <p className="opacity-80">จากใบแจ้งหนี้ทั้งหมด</p>
          </div>
        </div>

        <div className="card bg-gradient-to-r from-warning to-orange-500 text-white shadow-lg">
          <div className="card-body">
            <h3 className="card-title">
              <Clock className="w-6 h-6" />
              ยอดค้างชำระ
            </h3>
            <div className="text-3xl font-bold">{formatCurrency(stats.pendingAmount)}</div>
            <p className="opacity-80">ที่ยังไม่ได้รับชำระ</p>
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
                  placeholder="ค้นหาเลขที่ใบแจ้งหนี้, ห้อง, หรือชื่อผู้เช่า..."
                  className="input input-bordered w-full pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              className="select select-bordered"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">สถานะทั้งหมด</option>
              <option value="PENDING">รอชำระ</option>
              <option value="PAID">ชำระแล้ว</option>
              <option value="OVERDUE">เกินกำหนด</option>
              <option value="CANCELLED">ยกเลิก</option>
            </select>

            {/* Sort By */}
            <select
              className="select select-bordered"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="dueDate">วันครบกำหนด</option>
              <option value="amount">จำนวนเงิน</option>
              <option value="issuedAt">วันที่ออก</option>
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
            {(searchTerm || statusFilter !== "ALL" || sortBy !== "dueDate" || sortOrder !== "desc") && (
              <button
                className="btn btn-outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                  setSortBy("dueDate");
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
              แสดงผล {filteredInvoices.length} จาก {invoices.length} ใบแจ้งหนี้
            </span>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-base-content/70 mb-2">
                ไม่พบใบแจ้งหนี้
              </h3>
              <p className="text-base-content/50">
                {searchTerm || statusFilter !== 'ALL' 
                  ? 'ลองค้นหาด้วยคำอื่น หรือเปลี่ยนตัวกรอง'
                  : 'เริ่มต้นด้วยการออกใบแจ้งหนี้ฉบับแรก'
                }
              </p>
              {!searchTerm && statusFilter === 'ALL' && (
                <Link href="/dashboard/invoices/create" className="btn btn-primary mt-4">
                  <Plus className="w-4 h-4" />
                  ออกใบแจ้งหนี้ใหม่
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>เลขที่ใบแจ้งหนี้</th>
                    <th>ห้อง</th>
                    <th>ผู้เช่า</th>
                    <th>จำนวนเงิน</th>
                    <th>วันครบกำหนด</th>
                    <th>สถานะ</th>
                    <th>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => {
                    const status = statusConfig[invoice.status];
                    const StatusIcon = status.icon;
                    const overdue = isOverdue(invoice.dueDate, invoice.status);
                    
                    return (
                      <tr key={invoice.id} className={overdue ? 'bg-error/5' : ''}>
                        <td>
                          <div className="font-mono font-semibold">
                            {invoice.invoiceNo}
                          </div>
                          <div className="text-sm text-base-content/60">
                            {formatDate(invoice.issuedAt)}
                          </div>
                        </td>
                        <td>
                          <div className="font-medium">{invoice.room.name}</div>
                        </td>
                        <td>
                          <div className="font-medium">
                            {invoice.contract?.tenantName || '-'}
                          </div>
                        </td>
                        <td>
                          <div className="font-semibold text-lg">
                            {formatCurrency(invoice.amount)}
                          </div>
                        </td>
                        <td>
                          <div className={`font-medium ${overdue ? 'text-error' : ''}`}>
                            {formatDate(invoice.dueDate)}
                          </div>
                          {overdue && (
                            <div className="text-xs text-error">
                              เกิน {Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))} วัน
                            </div>
                          )}
                        </td>
                        <td>
                          <div className={`badge ${status.color} gap-2`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <Link
                              href={`/dashboard/invoices/${invoice.id}`}
                              className="btn btn-sm btn-ghost"
                              title="ดูรายละเอียด"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              className="btn btn-sm btn-ghost"
                              title="พิมพ์"
                              onClick={() => handlePrint(invoice.id)}
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              className="btn btn-sm btn-ghost"
                              title="ดาวน์โหลด PDF"
                              onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNo)}
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
