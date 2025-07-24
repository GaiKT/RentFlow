"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customToast } from "@/lib/toast";
import {
  Building,
  Edit,
  Trash2,
  ArrowLeft,
  DollarSign,
  MapPin,
  FileText,
  Home,
  Users,
  Calendar,
  Phone,
  Mail,
  Clock,
  Badge,
} from "lucide-react";

interface Room {
  id: string;
  name: string;
  description?: string;
  address?: string;
  rent: number;
  deposit?: number;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "UNAVAILABLE";
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  contracts: Array<{
    id: string;
    tenantName: string;
    tenantPhone?: string;
    tenantEmail?: string;
    startDate: string;
    endDate: string;
    rent: number;
    deposit?: number;
    status: string;
    invoices: Array<{
      id: string;
      amount: number;
      status: string;
      dueDate: string;
    }>;
  }>;
}

const statusLabels = {
  AVAILABLE: { label: "ว่าง", color: "badge-success", bgColor: "bg-success/10" },
  OCCUPIED: { label: "มีผู้เช่า", color: "badge-warning", bgColor: "bg-warning/10" },
  MAINTENANCE: { label: "ซ่อมแซม", color: "badge-error", bgColor: "bg-error/10" },
  UNAVAILABLE: { label: "ไม่พร้อมใช้", color: "badge-neutral", bgColor: "bg-neutral/10" },
};

const contractStatusLabels = {
  ACTIVE: { label: "ใช้งาน", color: "badge-success" },
  EXPIRED: { label: "หมดอายุ", color: "badge-error" },
  TERMINATED: { label: "ยกเลิก", color: "badge-warning" },
  PENDING: { label: "รอดำเนินการ", color: "badge-info" },
};

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [roomId, setRoomId] = useState<string>("");
  
  const router = useRouter();

  useEffect(() => {
    const unwrapParams = async () => {
      const { id } = await params;
      setRoomId(id);
    };
    unwrapParams();
  }, [params]);

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/rooms/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoom(data.room);
      } else if (response.status === 404) {
        customToast.error("ไม่พบข้อมูลห้องพัก");
        router.push("/dashboard/rooms");
      } else {
        customToast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลห้องพัก");
      }
    } catch (error) {
      console.error("Error fetching room:", error);
      customToast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  }, [roomId, router]);

  useEffect(() => {
    if (roomId) {
      fetchRoom();
    }
  }, [fetchRoom, roomId]);

  const handleDeleteRoom = async () => {
    if (!room) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/rooms/${room.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        customToast.deleted("ห้องพัก");
        router.push("/dashboard/rooms");
      } else {
        const data = await response.json();
        customToast.error(data.message || "เกิดข้อผิดพลาดในการลบห้องพัก");
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

  if (!room) {
    return null;
  }

  const activeContract = room.contracts.find(contract => contract.status === "ACTIVE");

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 shadow-sm border-b border-base-300">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/rooms" className="btn btn-ghost btn-circle">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-base-content flex items-center gap-3">
                  <Building className="w-7 h-7 text-primary" />
                  {room.name}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`badge ${statusLabels[room.status].color}`}>
                    {statusLabels[room.status].label}
                  </div>
                  <span className="text-base-content/70 text-sm">
                    สร้างเมื่อ {formatDate(room.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Link 
                href={`/dashboard/rooms/${room.id}/edit`} 
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
            {/* Basic Information Card */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4">
                  <Home className="w-6 h-6 text-primary" />
                  ข้อมูลพื้นฐาน
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">ชื่อห้องพัก</span>
                    </label>
                    <div className="text-lg font-semibold">{room.name}</div>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-medium mr-4">สถานะ</span>
                    </label>
                    <div className={`badge ${statusLabels[room.status].color} badge-lg`}>
                      {statusLabels[room.status].label}
                    </div>
                  </div>

                  {room.address && (
                    <div className="md:col-span-2">
                      <label className="label">
                        <span className="label-text font-medium">
                          <MapPin className="w-4 h-4 inline mr-1" />
                          ที่อยู่
                        </span>
                      </label>
                      <div className="text-base">{room.address}</div>
                    </div>
                  )}

                  {room.description && (
                    <div className="md:col-span-2">
                      <label className="label">
                        <span className="label-text font-medium">
                          <FileText className="w-4 h-4 inline mr-1" />
                          คำอธิบาย
                        </span>
                      </label>
                      <div className="text-base">{room.description}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Current Contract Card */}
            {activeContract && (
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title text-xl mb-4">
                    <Users className="w-6 h-6 text-primary" />
                    สัญญาเช่าปัจจุบัน
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">
                        <span className="label-text font-medium">ชื่อผู้เช่า</span>
                      </label>
                      <div className="text-lg font-semibold">{activeContract.tenantName}</div>
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text font-medium mr-4">สถานะสัญญา</span>
                      </label>
                      <div className={`badge ${contractStatusLabels[activeContract.status as keyof typeof contractStatusLabels].color} badge-lg`}>
                        {contractStatusLabels[activeContract.status as keyof typeof contractStatusLabels].label}
                      </div>
                    </div>

                    {activeContract.tenantPhone && (
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">
                            <Phone className="w-4 h-4 inline mr-1" />
                            เบอร์โทรศัพท์
                          </span>
                        </label>
                        <div className="text-base">{activeContract.tenantPhone}</div>
                      </div>
                    )}

                    {activeContract.tenantEmail && (
                      <div>
                        <label className="label">
                          <span className="label-text font-medium">
                            <Mail className="w-4 h-4 inline mr-1" />
                            อีเมล
                          </span>
                        </label>
                        <div className="text-base">{activeContract.tenantEmail}</div>
                      </div>
                    )}

                    <div>
                      <label className="label">
                        <span className="label-text font-medium">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          วันที่เริ่มสัญญา
                        </span>
                      </label>
                      <div className="text-base">{formatDate(activeContract.startDate)}</div>
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text font-medium">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          วันที่สิ้นสุดสัญญา
                        </span>
                      </label>
                      <div className="text-base">{formatDate(activeContract.endDate)}</div>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">ใบแจ้งหนี้ที่ค้างชำระ</span>
                    <div className="badge badge-error">
                      {activeContract.invoices.filter(invoice => invoice.status === "PENDING").length} รายการ
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contract History */}
            {room.contracts.length > 0 && (
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title text-xl mb-4">
                    <Clock className="w-6 h-6 text-primary" />
                    ประวัติสัญญาเช่า
                  </h2>

                  <div className="space-y-4">
                    {room.contracts.map((contract) => (
                      <div key={contract.id} className="border border-base-300 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold">{contract.tenantName}</div>
                            <div className="text-sm text-base-content/70">
                              {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                            </div>
                          </div>
                          <div className={`badge ${contractStatusLabels[contract.status as keyof typeof contractStatusLabels].color}`}>
                            {contractStatusLabels[contract.status as keyof typeof contractStatusLabels].label}
                          </div>
                        </div>
                        <div className="text-sm">
                          ค่าเช่า: {formatCurrency(contract.rent)}/เดือน
                          {contract.deposit && ` | มัดจำ: ${formatCurrency(contract.deposit)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Information */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">
                  <DollarSign className="w-5 h-5 text-primary" />
                  ข้อมูลการเงิน
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">ค่าเช่าต่อเดือน</span>
                    <span className="font-semibold text-lg">{formatCurrency(room.rent)}</span>
                  </div>

                  {room.deposit && (
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70">เงินมัดจำ</span>
                      <span className="font-semibold">{formatCurrency(room.deposit)}</span>
                    </div>
                  )}

                  {activeContract && (
                    <>
                      <div className="divider"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-base-content/70">ค่าเช่าปัจจุบัน</span>
                        <span className="font-semibold">{formatCurrency(activeContract.rent)}</span>
                      </div>
                      {activeContract.deposit && (
                        <div className="flex justify-between items-center">
                          <span className="text-base-content/70">มัดจำที่รับแล้ว</span>
                          <span className="font-semibold">{formatCurrency(activeContract.deposit)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Owner Information */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">
                  <Badge className="w-5 h-5 text-primary" />
                  ข้อมูลเจ้าของ
                </h2>

                <div className="space-y-3">
                  <div>
                    <span className="text-base-content/70 text-sm">ชื่อ</span>
                    <div className="font-semibold">{room.owner.name}</div>
                  </div>
                  <div>
                    <span className="text-base-content/70 text-sm">อีเมล</span>
                    <div className="font-semibold">{room.owner.email}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">การดำเนินการ</h2>

                <div className="space-y-2">
                  <Link 
                    href={`/dashboard/rooms/${room.id}/edit`} 
                    className="btn btn-outline btn-primary w-full gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    แก้ไขข้อมูลห้อง
                  </Link>
                  
                  {!activeContract && (
                    <Link 
                      href={`/dashboard/contracts/create?roomId=${room.id}`} 
                      className="btn btn-outline btn-success w-full gap-2"
                    >
                      <Users className="w-4 h-4" />
                      สร้างสัญญาเช่า
                    </Link>
                  )}

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn btn-outline btn-error w-full gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    ลบห้องพัก
                  </button>
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
            <h3 className="font-bold text-lg text-error">ยืนยันการลบห้องพัก</h3>
            <p className="py-4">
              คุณแน่ใจหรือไม่ที่จะลบห้องพัก <strong>{room.name}</strong>?
              <br />
              <span className="text-error text-sm">
                การกระทำนี้ไม่สามารถย้อนกลับได้และจะลบข้อมูลทั้งหมดที่เกี่ยวข้อง
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
                onClick={handleDeleteRoom}
                disabled={isDeleting}
              >
                {isDeleting && <div className="loading loading-spinner loading-sm"></div>}
                <Trash2 className="w-4 h-4" />
                ลบห้องพัก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
