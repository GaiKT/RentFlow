'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save,
  Calendar,
  DollarSign,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNo: string;
  amount: number;
  dueDate: string;
  description: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issuedAt: string;
  roomId: string;
  contractId: string | null;
  room: {
    id: string;
    name: string;
    rent: number;
  };
  contract?: {
    id: string;
    tenantName: string;
  } | null;
}

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Unwrap params using React.use()
  const { id: invoiceId } = use(params);

  // Form data
  const [formData, setFormData] = useState({
    amount: '',
    dueDate: '',
    description: ''
  });

  useEffect(() => {
    if (!session?.user || !invoiceId) return;
    
    let isMounted = true;
    
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        
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
          
          // Set form data
          setFormData({
            amount: data.amount.toString(),
            dueDate: new Date(data.dueDate).toISOString().split('T')[0],
            description: data.description
          });
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
  }, [session?.user, invoiceId, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'กรุณาระบุจำนวนเงินที่ถูกต้อง';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'กรุณาระบุวันครบกำหนดชำระ';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'กรุณาระบุรายละเอียด';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          dueDate: formData.dueDate,
          description: formData.description
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        router.push(`/dashboard/invoices/${invoiceId}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to update invoice:', errorData);
        alert('เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
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
            ไม่พบใบแจ้งหนี้ที่คุณต้องการแก้ไข
          </p>
          <Link href="/dashboard/invoices" className="btn btn-primary">
            กลับไปหน้ารายการ
          </Link>
        </div>
      </div>
    );
  }

  // Check if invoice can be edited
  if (invoice.status !== 'PENDING') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-base-content/70 mb-2">
            ไม่สามารถแก้ไขได้
          </h3>
          <p className="text-base-content/50 mb-4">
            สามารถแก้ไขได้เฉพาะใบแจ้งหนี้ที่มีสถานะ "รอชำระ" เท่านั้น
          </p>
          <Link href={`/dashboard/invoices/${invoiceId}`} className="btn btn-primary">
            กลับไปดูรายละเอียด
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/dashboard/invoices/${invoiceId}`} className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">แก้ไขใบแจ้งหนี้ #{invoice.invoiceNo}</h1>
          <p className="text-base-content/70">
            ห้อง: {invoice.room.name} | ค่าเช่าปกติ: {formatCurrency(invoice.room.rent)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-xl mb-6">
                <FileText className="w-6 h-6 text-primary" />
                รายละเอียดใบแจ้งหนี้
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Amount */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      จำนวนเงิน (บาท)
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`input input-bordered ${errors.amount ? 'input-error' : ''}`}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                  {errors.amount && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.amount}</span>
                    </label>
                  )}
                </div>

                {/* Due Date */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      วันครบกำหนดชำระ
                    </span>
                  </label>
                  <input
                    type="date"
                    className={`input input-bordered ${errors.dueDate ? 'input-error' : ''}`}
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                  {errors.dueDate && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.dueDate}</span>
                    </label>
                  )}
                </div>

                {/* Description */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      <FileText className="w-4 h-4 inline mr-2" />
                      รายละเอียด
                    </span>
                  </label>
                  <textarea
                    className={`textarea textarea-bordered h-32 ${errors.description ? 'textarea-error' : ''}`}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="ระบุรายละเอียดใบแจ้งหนี้..."
                  />
                  {errors.description && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.description}</span>
                    </label>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        บันทึกการแก้ไข
                      </>
                    )}
                  </button>
                  <Link href={`/dashboard/invoices/${invoiceId}`} className="btn btn-outline">
                    ยกเลิก
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Values */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h3 className="card-title text-lg mb-4">ข้อมูลปัจจุบัน</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text font-medium">จำนวนเงินเดิม</span>
                  </label>
                  <div className="text-lg font-semibold text-primary">
                    {formatCurrency(invoice.amount)}
                  </div>
                </div>
                
                <div>
                  <label className="label">
                    <span className="label-text font-medium">วันครบกำหนดเดิม</span>
                  </label>
                  <div className="text-sm">
                    {new Date(invoice.dueDate).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="card bg-warning/10 border border-warning/20 shadow-lg">
            <div className="card-body">
              <h3 className="card-title text-lg mb-4 text-warning">
                <AlertTriangle className="w-5 h-5" />
                ข้อควรระวัง
              </h3>
              
              <div className="space-y-2 text-sm">
                <p>• การแก้ไขใบแจ้งหนี้จะมีผลทันที</p>
                <p>• ไม่สามารถแก้ไขใบแจ้งหนี้ที่ชำระแล้วหรือยกเลิกแล้ว</p>
                <p>• ควรตรวจสอบข้อมูลให้ถูกต้องก่อนบันทึก</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
