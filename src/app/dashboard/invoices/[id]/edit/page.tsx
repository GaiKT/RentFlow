'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { customToast } from '@/lib/toast';
import { 
  ArrowLeft, 
  Save,
  Calendar,
  DollarSign,
  FileText,
  AlertTriangle,
  Home,
  User,
  Clock,
  Edit3,
  Info
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
        customToast.success('บันทึกการแก้ไขเรียบร้อยแล้ว');
        router.push(`/dashboard/invoices/${invoiceId}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to update invoice:', errorData);
        customToast.error(`เกิดข้อผิดพลาดในการบันทึก: ${errorData.error || 'ไม่ทราบสาเหตุ'}`);
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      customToast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
            สามารถแก้ไขได้เฉพาะใบแจ้งหนี้ที่มีสถานะ &quot;รอชำระ&quot; เท่านั้น
          </p>
          <Link href={`/dashboard/invoices/${invoiceId}`} className="btn btn-primary">
            กลับไปดูรายละเอียด
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Form */}
          <div className="xl:col-span-2">
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <h2 className="card-title text-xl mb-6 text-primary">
                  <FileText className="w-6 h-6" />
                  แก้ไขรายละเอียดใบแจ้งหนี้
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Amount */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold text-base">
                          <DollarSign className="w-4 h-4 inline mr-2 text-success" />
                          จำนวนเงิน
                        </span>
                        <span className="label-text-alt text-error">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className={`input input-bordered w-full pr-12 ${errors.amount ? 'input-error' : 'focus:input-primary'}`}
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/60 text-sm">
                          บาท
                        </span>
                      </div>
                      {errors.amount && (
                        <label className="label">
                          <span className="label-text-alt text-error flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {errors.amount}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* Due Date */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold text-base">
                          <Calendar className="w-4 h-4 inline mr-2 text-warning" />
                          วันครบกำหนดชำระ
                        </span>
                        <span className="label-text-alt text-error">*</span>
                      </label>
                      <input
                        type="date"
                        className={`input input-bordered w-full ${errors.dueDate ? 'input-error' : 'focus:input-primary'}`}
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                      {errors.dueDate && (
                        <label className="label">
                          <span className="label-text-alt text-error flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {errors.dueDate}
                          </span>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="form-control flex flex-col">
                    <label className="label">
                      <span className="label-text font-semibold text-base">
                        <FileText className="w-4 h-4 inline mr-2 text-info" />
                        รายละเอียด
                      </span>
                      <span className="label-text-alt text-error">*</span>
                    </label>
                    <textarea
                      className={`textarea textarea-bordered h-32 resize-none ${errors.description ? 'textarea-error' : 'focus:textarea-primary'}`}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="ระบุรายละเอียดใบแจ้งหนี้... เช่น ค่าเช่าประจำเดือน กรกฎาคม 2025"
                    />
                    {errors.description && (
                      <label className="label">
                        <span className="label-text-alt text-error flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors.description}
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="divider"></div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      type="submit"
                      className="btn btn-primary flex-1 shadow-lg"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          บันทึกการแก้ไข
                        </>
                      )}
                    </button>
                    <Link href={`/dashboard/invoices/${invoiceId}`} className="btn btn-outline flex-1">
                      <ArrowLeft className="w-4 h-4" />
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
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg mb-4 text-primary">
                  <Info className="w-5 h-5" />
                  ข้อมูลปัจจุบัน
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-base-100 p-4 rounded-lg border">
                    <label className="label p-0 pb-2">
                      <span className="label-text font-semibold text-sm opacity-70">จำนวนเงินเดิม</span>
                    </label>
                    <div className="text-2xl font-bold text-success flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      {formatCurrency(invoice.amount)}
                    </div>
                  </div>
                  
                  <div className="bg-base-100 p-4 rounded-lg border">
                    <label className="label p-0 pb-2">
                      <span className="label-text font-semibold text-sm opacity-70">วันครบกำหนดเดิม</span>
                    </label>
                    <div className="flex items-center gap-2 text-base font-semibold">
                      <Calendar className="w-4 h-4 text-warning" />
                      {formatDate(invoice.dueDate)}
                    </div>
                  </div>

                  <div className="bg-base-100 p-4 rounded-lg border">
                    <label className="label p-0 pb-2 mr-3">
                      <span className="label-text font-semibold text-sm opacity-70">สถานะ</span>
                    </label>
                    <div className="badge badge-warning gap-2">
                      <Clock className="w-3 h-3" />
                      รอชำระ
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="card bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/30 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg mb-4 text-warning">
                  <AlertTriangle className="w-5 h-5" />
                  ข้อควรระวัง
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-warning mt-2 flex-shrink-0"></div>
                    <p>การแก้ไขใบแจ้งหนี้จะมีผลทันทีหลังจากบันทึก</p>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-warning mt-2 flex-shrink-0"></div>
                    <p>ไม่สามารถแก้ไขใบแจ้งหนี้ที่ชำระแล้วหรือยกเลิกแล้ว</p>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-warning mt-2 flex-shrink-0"></div>
                    <p>ควรตรวจสอบข้อมูลให้ถูกต้องก่อนบันทึก</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <h3 className="card-title text-lg mb-4">
                  <Edit3 className="w-5 h-5 text-primary" />
                  การดำเนินการ
                </h3>
                
                <div className="space-y-2">
                  <Link 
                    href={`/dashboard/invoices/${invoiceId}`}
                    className="btn btn-ghost btn-sm w-full justify-start"
                  >
                    <FileText className="w-4 h-4" />
                    ดูรายละเอียดใบแจ้งหนี้
                  </Link>
                  
                  <Link 
                    href={`/dashboard/rooms/${invoice.room.id}`}
                    className="btn btn-ghost btn-sm w-full justify-start"
                  >
                    <Home className="w-4 h-4" />
                    ดูข้อมูลห้องพัก
                  </Link>
                  
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
    </div>
  );
}