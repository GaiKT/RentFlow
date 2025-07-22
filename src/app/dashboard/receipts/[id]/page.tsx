'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Receipt as ReceiptIcon, 
  ArrowLeft, 
  Calendar, 
  DollarSign,
  Building2,
  User,
  FileText,
  Clock,
  Printer,
  Download,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle
} from 'lucide-react';

interface Receipt {
  id: string;
  receiptNo: string;
  amount: number;
  paidAt: string;
  method: string;
  notes: string | null;
  createdAt: string;
  room: {
    id: string;
    name: string;
    address?: string;
  };
  contract: {
    id: string;
    tenantName: string;
    tenantPhone?: string;
    tenantEmail?: string;
  } | null;
  invoice: {
    id: string;
    invoiceNo: string;
    amount: number;
    dueDate: string;
    description?: string;
    issuedAt: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

const paymentMethodConfig = {
  cash: { 
    label: 'เงินสด', 
    color: 'badge-success', 
    icon: Banknote,
    bgColor: 'bg-success/10',
    description: 'ชำระด้วยเงินสดโดยตรง'
  },
  transfer: { 
    label: 'โอนเงิน', 
    color: 'badge-info', 
    icon: CreditCard,
    bgColor: 'bg-info/10',
    description: 'โอนเงินผ่านธนาคาร'
  },
  mobile: { 
    label: 'Mobile Banking', 
    color: 'badge-warning', 
    icon: Smartphone,
    bgColor: 'bg-warning/10',
    description: 'ชำระผ่านแอพธนาคาร'
  },
  other: { 
    label: 'อื่นๆ', 
    color: 'badge-neutral', 
    icon: CreditCard,
    bgColor: 'bg-neutral/10',
    description: 'วิธีการชำระอื่นๆ'
  }
};

export default function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!session?.user) return;

      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          setError('ไม่พบข้อมูลการยืนยันตัวตน');
          return;
        }

        const response = await fetch(`/api/receipts/${resolvedParams.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setReceipt(data.receipt);
        } else if (response.status === 404) {
          setError('ไม่พบใบเสร็จที่ระบุ');
        } else {
          setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        }
      } catch (error) {
        console.error('Error fetching receipt:', error);
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [session?.user, resolvedParams.id]);

  // Handle print function
  const handlePrint = async () => {
    if (!receipt) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch(`/api/receipts/${receipt.id}/print`, {
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
  const handleDownloadPDF = async () => {
    if (!receipt) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch(`/api/receipts/${receipt.id}/pdf`, {
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
        a.download = `receipt-${receipt.receiptNo}.pdf`;
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="text-error text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-base-content/70 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-base-content/50 mb-6">{error}</p>
          <Link href="/dashboard/receipts" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้ารายการใบเสร็จ
          </Link>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <ReceiptIcon className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-base-content/70 mb-2">ไม่พบใบเสร็จ</h3>
          <p className="text-base-content/50 mb-6">ใบเสร็จที่คุณค้นหาไม่พบในระบบ</p>
          <Link href="/dashboard/receipts" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้ารายการใบเสร็จ
          </Link>
        </div>
      </div>
    );
  }

  const paymentMethod = paymentMethodConfig[receipt.method as keyof typeof paymentMethodConfig] || paymentMethodConfig.other;
  const PaymentIcon = paymentMethod.icon;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/receipts" 
            className="btn btn-ghost btn-circle"
            title="กลับไปหน้ารายการใบเสร็จ"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ReceiptIcon className="w-8 h-8 text-success" />
              ใบเสร็จ #{receipt.receiptNo}
            </h1>
            <p className="text-base-content/70 mt-2">
              รายละเอียดการชำระเงิน
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-4 lg:mt-0">
          <button 
            onClick={handlePrint}
            className="btn btn-outline"
            title="พิมพ์ใบเสร็จ"
          >
            <Printer className="w-4 h-4" />
            พิมพ์
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="btn btn-primary"
            title="ดาวน์โหลด PDF"
          >
            <Download className="w-4 h-4" />
            ดาวน์โหลด PDF
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <div className="badge badge-success badge-lg gap-2">
          <CheckCircle className="w-4 h-4" />
          ชำระเงินเรียบร้อยแล้ว
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Receipt Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Receipt Information */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                <ReceiptIcon className="w-6 h-6 text-success" />
                ข้อมูลใบเสร็จ
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-base-content/60">เลขที่ใบเสร็จ</label>
                  <div className="font-mono text-lg font-semibold">{receipt.receiptNo}</div>
                </div>

                <div>
                  <label className="text-sm text-base-content/60">จำนวนเงินที่ชำระ</label>
                  <div className="text-2xl font-bold text-success">{formatCurrency(receipt.amount)}</div>
                </div>

                <div>
                  <label className="text-sm text-base-content/60">วันที่ชำระ</label>
                  <div className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {formatDateTime(receipt.paidAt)}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-base-content/60 mr-3">วิธีการชำระ</label>
                  <div className={`badge ${paymentMethod.color} gap-2 mb-2`}>
                    <PaymentIcon className="w-4 h-4" />
                    {paymentMethod.label}
                  </div>
                  <div className="text-xs text-base-content/50 mt-1">
                    {paymentMethod.description}
                  </div>
                </div>
              </div>

              {receipt.notes && (
                <div className="mt-4">
                  <label className="text-sm text-base-content/60">หมายเหตุ</label>
                  <div className="mt-1 p-3 bg-base-200 rounded-lg">
                    {receipt.notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Information */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                <FileText className="w-6 h-6 text-info" />
                ข้อมูลใบแจ้งหนี้ที่เกี่ยวข้อง
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-base-content/60">เลขที่ใบแจ้งหนี้</label>
                  <Link 
                    href={`/dashboard/invoices/${receipt.invoice.id}`}
                    className="font-mono text-lg font-semibold link link-primary"
                  >
                    {receipt.invoice.invoiceNo}
                  </Link>
                </div>

                <div>
                  <label className="text-sm text-base-content/60">จำนวนเงินในใบแจ้งหนี้</label>
                  <div className="text-lg font-semibold">{formatCurrency(receipt.invoice.amount)}</div>
                </div>

                <div>
                  <label className="text-sm text-base-content/60">วันที่ออกใบแจ้งหนี้</label>
                  <div className="font-medium">{formatDate(receipt.invoice.issuedAt)}</div>
                </div>

                <div>
                  <label className="text-sm text-base-content/60">วันครบกำหนดชำระ</label>
                  <div className="font-medium">{formatDate(receipt.invoice.dueDate)}</div>
                </div>
              </div>

              {receipt.invoice.description && (
                <div className="mt-4">
                  <label className="text-sm text-base-content/60">รายละเอียดการชำระ</label>
                  <div className="mt-1 p-3 bg-base-200 rounded-lg">
                    {receipt.invoice.description}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Room & Tenant Information */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                <Building2 className="w-6 h-6 text-warning" />
                ข้อมูลห้องและผู้เช่า
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-base-content/60">ห้อง</label>
                  <div className="text-lg font-semibold">{receipt.room.name}</div>
                  {receipt.room.address && (
                    <div className="text-sm text-base-content/60 mt-1">{receipt.room.address}</div>
                  )}
                </div>

                {receipt.contract && (
                  <>
                    <div>
                      <label className="text-sm text-base-content/60">ชื่อผู้เช่า</label>
                      <div className="text-lg font-semibold flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        {receipt.contract.tenantName}
                      </div>
                    </div>

                    {receipt.contract.tenantPhone && (
                      <div>
                        <label className="text-sm text-base-content/60">เบอร์โทรศัพท์</label>
                        <div className="font-medium">{receipt.contract.tenantPhone}</div>
                      </div>
                    )}

                    {receipt.contract.tenantEmail && (
                      <div>
                        <label className="text-sm text-base-content/60">อีเมล</label>
                        <div className="font-medium">{receipt.contract.tenantEmail}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          
          {/* Payment Summary */}
          <div className="card bg-gradient-to-br from-success/10 to-success/5 border border-success/20 shadow-lg">
            <div className="card-body">
              <h3 className="card-title text-success">
                <DollarSign className="w-6 h-6" />
                สรุปการชำระเงิน
              </h3>
              
              <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center">
                  <span>จำนวนเงินที่ต้องชำระ:</span>
                  <span className="font-semibold">{formatCurrency(receipt.invoice.amount)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>จำนวนเงินที่ชำระ:</span>
                  <span className="font-semibold text-success">{formatCurrency(receipt.amount)}</span>
                </div>
                
                <div className="divider my-2"></div>
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>สถานะ:</span>
                  <div className="badge badge-success gap-2">
                    <CheckCircle className="w-4 h-4" />
                    ชำระครบแล้ว
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title">การจัดการ</h3>
              
              <div className="space-y-3 mt-4">
                <button 
                  onClick={handlePrint}
                  className="btn btn-outline w-full justify-start"
                >
                  <Printer className="w-4 h-4" />
                  พิมพ์ใบเสร็จ
                </button>
                
                <button 
                  onClick={handleDownloadPDF}
                  className="btn btn-primary w-full justify-start"
                >
                  <Download className="w-4 h-4" />
                  ดาวน์โหลด PDF
                </button>
                
                <Link 
                  href={`/dashboard/invoices/${receipt.invoice.id}`}
                  className="btn btn-ghost w-full justify-start"
                >
                  <FileText className="w-4 h-4" />
                  ดูใบแจ้งหนี้
                </Link>

                <Link 
                  href="/dashboard/receipts"
                  className="btn btn-ghost w-full justify-start"
                >
                  <ArrowLeft className="w-4 h-4" />
                  กลับไปรายการใบเสร็จ
                </Link>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title text-sm">ผู้ออกใบเสร็จ</h3>
              
              <div className="space-y-2 mt-3">
                <div>
                  <label className="text-xs text-base-content/60">ชื่อ</label>
                  <div className="font-medium">{receipt.owner.name}</div>
                </div>
                
                <div>
                  <label className="text-xs text-base-content/60">อีเมล</label>
                  <div className="text-sm">{receipt.owner.email}</div>
                </div>
                
                {receipt.owner.phone && (
                  <div>
                    <label className="text-xs text-base-content/60">เบอร์โทร</label>
                    <div className="text-sm">{receipt.owner.phone}</div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-base-content/60">วันที่ออกใบเสร็จ</label>
                  <div className="text-xs text-base-content/70">{formatDateTime(receipt.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
