"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customToast } from "@/lib/toast";
import {
  FileText,
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Building,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileCheck,
  CreditCard,
  Receipt,
} from "lucide-react";

interface Contract {
  id: string;
  tenantName: string;
  tenantPhone?: string;
  tenantEmail?: string;
  startDate: string;
  endDate: string;
  rent: number;
  deposit?: number;
  status: "ACTIVE" | "EXPIRED" | "TERMINATED" | "PENDING";
  terms?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  room: {
    id: string;
    name: string;
    address?: string;
  };
  invoices: Array<{
    id: string;
    invoiceNo: string;
    amount: number;
    status: string;
    dueDate: string;
    issuedAt: string;
  }>;
  receipts: Array<{
    id: string;
    receiptNo: string;
    amount: number;
    paidAt: string;
    method: string;
  }>;
  documents: Array<{
    id: string;
    filename: string;
    originalName: string;
    description?: string;
    createdAt: string;
  }>;
}

const statusLabels = {
  ACTIVE: { label: "ใช้งาน", color: "badge-success", bgColor: "bg-success/10", icon: CheckCircle },
  EXPIRED: { label: "หมดอายุ", color: "badge-error", bgColor: "bg-error/10", icon: XCircle },
  TERMINATED: { label: "ยกเลิก", color: "badge-warning", bgColor: "bg-warning/10", icon: AlertTriangle },
  PENDING: { label: "รอดำเนินการ", color: "badge-info", bgColor: "bg-info/10", icon: Clock },
};

const invoiceStatusLabels = {
  PENDING: { label: "รอชำระ", color: "badge-warning" },
  PAID: { label: "ชำระแล้ว", color: "badge-success" },
  OVERDUE: { label: "เกินกำหนด", color: "badge-error" },
  CANCELLED: { label: "ยกเลิก", color: "badge-neutral" },
};

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [contractId, setContractId] = useState<string>("");
  
  const router = useRouter();

  useEffect(() => {
    const unwrapParams = async () => {
      const { id } = await params;
      setContractId(id);
    };
    unwrapParams();
  }, [params]);

  const fetchContract = useCallback(async () => {
    if (!contractId) return;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/contracts/${contractId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContract(data.contract);
      } else if (response.status === 404) {
        customToast.error("ไม่พบข้อมูลสัญญาเช่า");
        router.push("/dashboard/contracts");
      } else {
        customToast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสัญญาเช่า");
      }
    } catch (error) {
      console.error("Error fetching contract:", error);
      customToast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  }, [contractId, router]);

  useEffect(() => {
    if (contractId) {
      fetchContract();
    }
  }, [fetchContract, contractId]);

  const handleDeleteContract = async () => {
    if (!contract) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        customToast.deleted("สัญญาเช่า");
        router.push("/dashboard/contracts");
      } else {
        const data = await response.json();
        customToast.error(data.message || "เกิดข้อผิดพลาดในการลบสัญญาเช่า");
      }
    } catch {
      customToast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysUntilExpiry = () => {
    if (!contract) return 0;
    const today = new Date();
    const expiry = new Date(contract.endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getContractDuration = () => {
    if (!contract) return 0;
    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 30); // Convert to months
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="text-base-content/70">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return null;
  }

  const StatusIcon = statusLabels[contract.status].icon;
  const daysUntilExpiry = getDaysUntilExpiry();
  const contractDuration = getContractDuration();
  const pendingInvoices = contract.invoices.filter(inv => inv.status === "PENDING");
  const totalReceived = contract.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 shadow-sm border-b border-base-300">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/contracts" className="btn btn-ghost btn-circle">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-base-content flex items-center gap-3">
                  <FileText className="w-7 h-7 text-primary" />
                  สัญญาเช่า: {contract.tenantName}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <StatusIcon className="w-4 h-4" />
                  <div className={`badge ${statusLabels[contract.status].color}`}>
                    {statusLabels[contract.status].label}
                  </div>
                  {contract.status === "ACTIVE" && (
                    <span className="text-base-content/70 text-sm">
                      {daysUntilExpiry > 0 ? `เหลือ ${daysUntilExpiry} วัน` : "หมดอายุแล้ว"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link 
                href={`/dashboard/contracts/${contract.id}/edit`} 
                className="btn btn-outline btn-primary gap-2"
              >
                <Edit className="w-4 h-4" />
                แก้ไข
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-outline btn-error gap-2"
              >
                <Trash2 className="w-4 h-4" />
                ลบ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tenant Information */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">
                  <Users className="w-6 h-6 text-primary" />
                  ข้อมูลผู้เช่า
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">ชื่อ-นามสกุล</span>
                    </label>
                    <div className="text-lg font-semibold">{contract.tenantName}</div>
                  </div>

                  {contract.tenantPhone && (
                    <div>
                      <label className="label">
                        <span className="label-text font-medium">
                          <Phone className="w-4 h-4 inline mr-1" />
                          เบอร์โทรศัพท์
                        </span>
                      </label>
                      <div className="text-base">{contract.tenantPhone}</div>
                    </div>
                  )}

                  {contract.tenantEmail && (
                    <div className="md:col-span-2">
                      <label className="label">
                        <span className="label-text font-medium">
                          <Mail className="w-4 h-4 inline mr-1" />
                          อีเมล
                        </span>
                      </label>
                      <div className="text-base">{contract.tenantEmail}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Room Information */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">
                  <Building className="w-6 h-6 text-primary" />
                  ข้อมูลห้องพัก
                </h2>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">ชื่อห้อง</span>
                    </label>
                    <div className="text-lg font-semibold">
                      <Link 
                        href={`/dashboard/rooms/${contract.room.id}`}
                        className="link link-primary"
                      >
                        {contract.room.name}
                      </Link>
                    </div>
                  </div>

                  {contract.room.address && (
                    <div>
                      <label className="label">
                        <span className="label-text font-medium">
                          <MapPin className="w-4 h-4 inline mr-1" />
                          ที่อยู่
                        </span>
                      </label>
                      <div className="text-base">{contract.room.address}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contract Terms */}
            {contract.terms && (
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title text-xl mb-4">
                    <FileCheck className="w-6 h-6 text-primary" />
                    เงื่อนไขสัญญา
                  </h2>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{contract.terms}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {contract.notes && (
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title text-xl mb-4">
                    <FileText className="w-6 h-6 text-primary" />
                    หมายเหตุ
                  </h2>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{contract.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Invoices */}
            {contract.invoices.length > 0 && (
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title text-xl mb-4">
                    <CreditCard className="w-6 h-6 text-primary" />
                    ใบแจ้งหนี้
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="table table-zebra">
                      <thead>
                        <tr>
                          <th>เลขที่</th>
                          <th>จำนวน</th>
                          <th>กำหนดชำระ</th>
                          <th>สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contract.invoices.slice(0, 5).map((invoice) => (
                          <tr key={invoice.id}>
                            <td className="font-mono text-sm">{invoice.invoiceNo}</td>
                            <td className="font-semibold">{formatCurrency(invoice.amount)}</td>
                            <td>{formatDate(invoice.dueDate)}</td>
                            <td>
                              <div className={`badge ${invoiceStatusLabels[invoice.status as keyof typeof invoiceStatusLabels].color} badge-sm`}>
                                {invoiceStatusLabels[invoice.status as keyof typeof invoiceStatusLabels].label}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {contract.invoices.length > 5 && (
                    <div className="text-center mt-4">
                      <Link href={`/dashboard/invoices?contractId=${contract.id}`} className="btn btn-ghost btn-sm">
                        ดูทั้งหมด ({contract.invoices.length} รายการ)
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contract Details */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">
                  <Calendar className="w-5 h-5 text-primary" />
                  รายละเอียดสัญญา
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">วันที่เริ่มสัญญา</span>
                    <span className="font-semibold">{formatDate(contract.startDate)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">วันที่สิ้นสุด</span>
                    <span className="font-semibold">{formatDate(contract.endDate)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">ระยะเวลา</span>
                    <span className="font-semibold">{contractDuration} เดือน</span>
                  </div>

                  {contract.status === "ACTIVE" && (
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70">
                        {daysUntilExpiry > 0 ? "เหลือเวลา" : "เกินเวลา"}
                      </span>
                      <span className={`font-semibold ${daysUntilExpiry <= 30 ? "text-warning" : daysUntilExpiry <= 0 ? "text-error" : ""}`}>
                        {Math.abs(daysUntilExpiry)} วัน
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">
                  <DollarSign className="w-5 h-5 text-primary" />
                  สรุปการเงิน
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">ค่าเช่าต่อเดือน</span>
                    <span className="font-semibold text-lg">{formatCurrency(contract.rent)}</span>
                  </div>

                  {contract.deposit && (
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70">เงินมัดจำ</span>
                      <span className="font-semibold">{formatCurrency(contract.deposit)}</span>
                    </div>
                  )}

                  <div className="divider"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">เงินที่รับแล้ว</span>
                    <span className="font-semibold text-success">{formatCurrency(totalReceived)}</span>
                  </div>

                  {pendingInvoices.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70">ค้างชำระ</span>
                      <span className="font-semibold text-error">
                        {formatCurrency(pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">การดำเนินการ</h2>

                <div className="space-y-2">
                  <Link 
                    href={`/dashboard/contracts/${contract.id}/edit`} 
                    className="btn btn-outline btn-primary w-full gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    แก้ไขสัญญา
                  </Link>

                  <Link 
                    href={`/dashboard/invoices/create?contractId=${contract.id}`} 
                    className="btn btn-outline btn-success w-full gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    สร้างใบแจ้งหนี้
                  </Link>

                  <Link 
                    href={`/dashboard/receipts?contractId=${contract.id}`} 
                    className="btn btn-outline btn-info w-full gap-2"
                  >
                    <Receipt className="w-4 h-4" />
                    ประวัติการชำระ
                  </Link>

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn btn-outline btn-error w-full gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    ลบสัญญา
                  </button>
                </div>
              </div>
            </div>

            {/* Contract Timeline */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                  ประวัติ
                </h2>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div>
                      <div className="text-sm font-medium">สร้างสัญญา</div>
                      <div className="text-xs text-base-content/70">{formatDateTime(contract.createdAt)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <div>
                      <div className="text-sm font-medium">เริ่มสัญญา</div>
                      <div className="text-xs text-base-content/70">{formatDate(contract.startDate)}</div>
                    </div>
                  </div>

                  {contract.updatedAt !== contract.createdAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-warning rounded-full"></div>
                      <div>
                        <div className="text-sm font-medium">แก้ไขล่าสุด</div>
                        <div className="text-xs text-base-content/70">{formatDateTime(contract.updatedAt)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error">ยืนยันการลบสัญญาเช่า</h3>
            <p className="py-4">
              คุณแน่ใจหรือไม่ที่จะลบสัญญาเช่าของ <strong>{contract.tenantName}</strong>?
              <br />
              <span className="text-error text-sm">
                การกระทำนี้ไม่สามารถย้อนกลับได้และจะลบข้อมูลทั้งหมดที่เกี่ยวข้อง รวมถึงใบแจ้งหนี้และใบเสร็จ
              </span>
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-error gap-2"
                onClick={handleDeleteContract}
                disabled={isDeleting}
              >
                {isDeleting && <div className="loading loading-spinner loading-sm"></div>}
                <Trash2 className="w-4 h-4" />
                ลบสัญญาเช่า
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
