'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  DollarSign,
  User,
  Home,
  Phone,
  Mail,
  Edit,
  Printer,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  CreditCard
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNo: string;
  amount: number;
  dueDate: string;
  description: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issuedAt: string;
  createdAt: string;
  room: {
    id: string;
    name: string;
    address: string;
    rent: number;
  };
  contract: {
    id: string;
    tenantName: string;
    tenantPhone: string;
    tenantEmail: string;
    rent: number;
    startDate: string;
    endDate: string;
  } | null;
  receipts: {
    id: string;
    receiptNo: string;
    amount: number;
    paidAt: string;
    method: string;
  }[];
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

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Unwrap params using React.use()
  const { id: invoiceId } = use(params);

  useEffect(() => {
    if (!session?.user || !invoiceId) return;
    
    let isMounted = true;
    
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        
        // Use fetch directly to avoid authFetch dependency
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/invoices/${invoiceId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        
        if (response.ok && isMounted) {
          const data = await response.json();
          setInvoice(data);
        } else if (response.status === 404 && isMounted) {
          router.push('/dashboard/invoices');
        } else if (isMounted) {
          console.error('Failed to fetch invoice');
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching invoice:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInvoice();

    return () => {
      isMounted = false;
    };
  }, [session?.user, invoiceId]); // ใช้ invoiceId แทน params.id

  const updateInvoiceStatus = async (newStatus: string) => {
    if (!invoice) return;
    
    setUpdating(true);
    try {
      // Use fetch directly to avoid authFetch dependency
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        const updatedInvoice = await response.json();
        setInvoice(updatedInvoice);
      } else {
        console.error('Failed to update invoice status');
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    if (!invoice) return;
    
    const token = localStorage.getItem('token');
    const url = `/api/invoices/${invoice.id}/print?autoprint=true`;
    
    // Open in new window with authorization
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      .then(response => response.text())
      .then(html => {
        printWindow.document.write(html);
        printWindow.document.close();
      })
      .catch(error => {
        console.error('Error loading print page:', error);
        printWindow.close();
        alert('เกิดข้อผิดพลาดในการโหลดหน้าพิมพ์');
      });
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoiceNo}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('เกิดข้อผิดพลาดในการดาวน์โหลด PDF');
    }
  };

  const isOverdue = () => {
    if (!invoice) return false;
    return invoice.status === 'PENDING' && new Date(invoice.dueDate) < new Date();
  };

  if (!session) {
    return <div>กรุณาล็อกอินก่อน</div>;
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

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-base-content/70 mb-2">
            ไม่พบใบแจ้งหนี้
          </h3>
          <p className="text-base-content/50 mb-4">
            ไม่พบใบแจ้งหนี้ที่คุณต้องการ
          </p>
          <Link href="/dashboard/invoices" className="btn btn-primary">
            กลับไปหน้ารายการ
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[invoice.status];
  const StatusIcon = status.icon;
  const overdue = isOverdue();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/invoices" className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">ใบแจ้งหนี้ #{invoice.invoiceNo}</h1>
            <div className={`badge ${status.color} gap-2`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </div>
            {overdue && (
              <div className="badge badge-error gap-2">
                <AlertTriangle className="w-3 h-3" />
                เกิน {Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))} วัน
              </div>
            )}
          </div>
          <p className="text-base-content/70 mt-1">
            ออกวันที่ {formatDate(invoice.issuedAt)}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            className="btn btn-outline btn-sm"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" />
            พิมพ์
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleDownloadPDF}
          >
            <Download className="w-4 h-4" />
            ดาวน์โหลด PDF
          </button>
          {invoice.status === 'PENDING' && (
            <Link href={`/dashboard/invoices/${invoice.id}/edit`} className="btn btn-primary btn-sm">
              <Edit className="w-4 h-4" />
              แก้ไข
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-xl mb-6">
                <FileText className="w-6 h-6 text-primary" />
                รายละเอียดใบแจ้งหนี้
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">
                    <span className="label-text font-medium">เลขที่ใบแจ้งหนี้</span>
                  </label>
                  <div className="text-lg font-mono font-semibold">{invoice.invoiceNo}</div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-medium">จำนวนเงิน</span>
                  </label>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(invoice.amount)}
                  </div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-medium">วันที่ออกใบแจ้งหนี้</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-base-content/60" />
                    {formatDate(invoice.issuedAt)}
                  </div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-medium">วันครบกำหนดชำระ</span>
                  </label>
                  <div className={`flex items-center gap-2 ${overdue ? 'text-error' : ''}`}>
                    <Calendar className="w-4 h-4" />
                    {formatDate(invoice.dueDate)}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="label">
                    <span className="label-text font-medium">รายละเอียด</span>
                  </label>
                  <div className="p-3 bg-base-200 rounded-lg">
                    {invoice.description}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Room Information */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-xl mb-6">
                <Home className="w-6 h-6 text-primary" />
                ข้อมูลห้องพัก
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">
                    <span className="label-text font-medium">ชื่อห้อง</span>
                  </label>
                  <div className="font-semibold">{invoice.room.name}</div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-medium">ค่าเช่าต่อเดือน</span>
                  </label>
                  <div className="font-semibold text-primary">
                    {formatCurrency(invoice.room.rent)}
                  </div>
                </div>

                {invoice.room.address && (
                  <div className="md:col-span-2">
                    <label className="label">
                      <span className="label-text font-medium">ที่อยู่</span>
                    </label>
                    <div>{invoice.room.address}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tenant Information */}
          {invoice.contract && (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl mb-6">
                  <User className="w-6 h-6 text-primary" />
                  ข้อมูลผู้เช่า
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">ชื่อผู้เช่า</span>
                    </label>
                    <div className="font-semibold">{invoice.contract.tenantName}</div>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-medium">ค่าเช่าตามสัญญา</span>
                    </label>
                    <div className="font-semibold text-primary">
                      {formatCurrency(invoice.contract.rent)}
                    </div>
                  </div>

                  {invoice.contract.tenantPhone && (
                    <div>
                      <label className="label">
                        <span className="label-text font-medium">เบอร์โทรศัพท์</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-base-content/60" />
                        {invoice.contract.tenantPhone}
                      </div>
                    </div>
                  )}

                  {invoice.contract.tenantEmail && (
                    <div>
                      <label className="label">
                        <span className="label-text font-medium">อีเมล</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-base-content/60" />
                        {invoice.contract.tenantEmail}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="label">
                      <span className="label-text font-medium">ระยะเวลาสัญญา</span>
                    </label>
                    <div className="text-sm">
                      {formatDate(invoice.contract.startDate)} - {formatDate(invoice.contract.endDate)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment History */}
          {invoice.receipts.length > 0 && (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl mb-6">
                  <CreditCard className="w-6 h-6 text-primary" />
                  ประวัติการชำระเงิน
                </h2>

                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>เลขที่ใบเสร็จ</th>
                        <th>จำนวนเงิน</th>
                        <th>วันที่ชำระ</th>
                        <th>วิธีการชำระ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.receipts.map((receipt) => (
                        <tr key={receipt.id}>
                          <td className="font-mono">{receipt.receiptNo}</td>
                          <td className="font-semibold">{formatCurrency(receipt.amount)}</td>
                          <td>{formatDateTime(receipt.paidAt)}</td>
                          <td>
                            <span className="badge badge-outline">{receipt.method}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title text-lg mb-4">การจัดการ</h3>
              
              <div className="space-y-3">
                {invoice.status === 'PENDING' && (
                  <>
                    <button
                      className="btn btn-success w-full"
                      disabled={updating}
                      onClick={() => updateInvoiceStatus('PAID')}
                    >
                      <CheckCircle className="w-4 h-4" />
                      บันทึกการชำระเงิน
                    </button>
                    <button
                      className="btn btn-outline btn-error w-full"
                      disabled={updating}
                      onClick={() => updateInvoiceStatus('CANCELLED')}
                    >
                      <XCircle className="w-4 h-4" />
                      ยกเลิกใบแจ้งหนี้
                    </button>
                  </>
                )}

                {invoice.status === 'PAID' && (
                  <button
                    className="btn btn-outline w-full"
                    disabled={updating}
                    onClick={() => updateInvoiceStatus('PENDING')}
                  >
                    <Clock className="w-4 h-4" />
                    เปลี่ยนเป็นรอชำระ
                  </button>
                )}

                {invoice.status === 'CANCELLED' && (
                  <button
                    className="btn btn-outline w-full"
                    disabled={updating}
                    onClick={() => updateInvoiceStatus('PENDING')}
                  >
                    <Clock className="w-4 h-4" />
                    เปลี่ยนเป็นรอชำระ
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div className={`card shadow-lg ${status.bgColor} border border-current border-opacity-20`}>
            <div className="card-body">
              <h3 className="card-title text-lg mb-4">สถานะใบแจ้งหนี้</h3>
              
              <div className="space-y-3">
                <div className={`badge ${status.color} gap-2 text-sm p-3`}>
                  <StatusIcon className="w-4 h-4" />
                  {status.label}
                </div>

                {overdue && (
                  <div className="text-sm text-error">
                    เกินกำหนดชำระแล้ว {Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))} วัน
                  </div>
                )}

                <div className="text-sm text-base-content/60">
                  สร้างเมื่อ: {formatDateTime(invoice.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Related Links */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title text-lg mb-4">ลิงก์ที่เกี่ยวข้อง</h3>
              
              <div className="space-y-2">
                <Link 
                  href={`/dashboard/rooms/${invoice.room.id}`}
                  className="btn btn-ghost btn-sm w-full justify-start"
                >
                  <Home className="w-4 h-4" />
                  ดูข้อมูลห้องพัก
                </Link>
                
                {invoice.contract && (
                  <Link 
                    href={`/dashboard/contracts/${invoice.contract.id}`}
                    className="btn btn-ghost btn-sm w-full justify-start"
                  >
                    <FileText className="w-4 h-4" />
                    ดูสัญญาเช่า
                  </Link>
                )}
                
                <Link 
                  href="/dashboard/invoices"
                  className="btn btn-ghost btn-sm w-full justify-start"
                >
                  <ArrowLeft className="w-4 h-4" />
                  กลับไปรายการใบแจ้งหนี้
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
