"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customToast } from "@/lib/toast";
import { Navbar } from "@/components/Navbar";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  DollarSign,
  Search,
  Filter,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
}

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
    amount: number;
    status: string;
    dueDate: string;
  }>;
}

const statusLabels = {
  ACTIVE: { label: "ใช้งาน", color: "badge-success", icon: CheckCircle },
  EXPIRED: { label: "หมดอายุ", color: "badge-error", icon: XCircle },
  TERMINATED: { label: "ยกเลิก", color: "badge-warning", icon: AlertTriangle },
  PENDING: { label: "รอดำเนินการ", color: "badge-info", icon: Clock },
};

export default function ContractsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Fetch user data
      const userResponse = await fetch("/api/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      const userData = await userResponse.json();
      setUser(userData.user);

      // Fetch contracts data
      const contractsResponse = await fetch("/api/contracts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (contractsResponse.ok) {
        const contractsData = await contractsResponse.json();
        setContracts(contractsData.contracts);
        setFilteredContracts(contractsData.contracts);
      } else {
        customToast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลสัญญาเช่า");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      customToast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter and sort contracts based on search term, status, and sort options
  useEffect(() => {
    let filtered = contracts;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (contract) =>
          contract.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.tenantEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.room.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((contract) => contract.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "tenantName":
          aValue = a.tenantName.toLowerCase();
          bValue = b.tenantName.toLowerCase();
          break;
        case "roomName":
          aValue = a.room.name.toLowerCase();
          bValue = b.room.name.toLowerCase();
          break;
        case "rent":
          aValue = a.rent;
          bValue = b.rent;
          break;
        case "startDate":
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
        case "endDate":
          aValue = new Date(a.endDate);
          bValue = new Date(b.endDate);
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredContracts(filtered);
  }, [contracts, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    customToast.logoutSuccess();
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  const handleDeleteContract = async () => {
    if (!contractToDelete) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/contracts/${contractToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        customToast.deleted("สัญญาเช่า");
        setContracts(contracts.filter((contract) => contract.id !== contractToDelete.id));
        setShowDeleteModal(false);
        setContractToDelete(null);
      } else {
        const data = await response.json();
        customToast.error(data.message || "เกิดข้อผิดพลาดในการลบสัญญาเช่า");
      }
    } catch {
      customToast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsDeleting(false);
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
      month: "short",
      day: "numeric",
    });
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (endDate: string, status: string) => {
    if (status !== "ACTIVE") return null;
    const daysLeft = getDaysUntilExpiry(endDate);
    
    if (daysLeft < 0) return { type: "expired", text: "หมดอายุแล้ว", color: "text-error" };
    if (daysLeft <= 30) return { type: "warning", text: `เหลือ ${daysLeft} วัน`, color: "text-warning" };
    if (daysLeft <= 90) return { type: "info", text: `เหลือ ${daysLeft} วัน`, color: "text-info" };
    return null;
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar user={user} onLogout={handleLogout} notificationCount={3} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="btn btn-ghost btn-circle">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                จัดการสัญญาเช่า
              </h1>
              <p className="text-base-content/70 mt-1">
                จัดการสัญญาเช่าทั้งหมด
              </p>
            </div>
          </div>
          
          <Link href="/dashboard/contracts/select-room" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" />
            สร้างสัญญาเช่าใหม่
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-figure text-success">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="stat-title">สัญญาใช้งาน</div>
            <div className="stat-value text-success">
              {contracts.filter(c => c.status === "ACTIVE").length}
            </div>
          </div>
          
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-figure text-warning">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="stat-title">ใกล้หมดอายุ</div>
            <div className="stat-value text-warning">
              {contracts.filter(c => {
                const expiry = getExpiryStatus(c.endDate, c.status);
                return expiry && (expiry.type === "warning" || expiry.type === "info");
              }).length}
            </div>
          </div>
          
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-figure text-error">
              <XCircle className="w-8 h-8" />
            </div>
            <div className="stat-title">หมดอายุ</div>
            <div className="stat-value text-error">
              {contracts.filter(c => c.status === "EXPIRED").length}
            </div>
          </div>
          
          <div className="stat bg-base-100 rounded-lg shadow">
            <div className="stat-figure text-primary">
              <DollarSign className="w-8 h-8" />
            </div>
            <div className="stat-title">รายได้ต่อเดือน</div>
            <div className="stat-value text-primary text-sm">
              {formatCurrency(contracts.filter(c => c.status === "ACTIVE").reduce((sum, c) => sum + c.rent, 0))}
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Main Search and Filter Join */}
              <div className="join flex-1">
                <input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อผู้เช่า, ห้อง, หรืออีเมล..."
                  className="input input-bordered join-item flex-1"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="select select-bordered join-item"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">ทุกสถานะ</option>
                  <option value="ACTIVE">ใช้งาน</option>
                  <option value="EXPIRED">หมดอายุ</option>
                  <option value="TERMINATED">ยกเลิก</option>
                  <option value="PENDING">รอดำเนินการ</option>
                </select>
                <select
                  className="select select-bordered join-item"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order as "asc" | "desc");
                  }}
                >
                  <option value="createdAt-desc">วันที่สร้างล่าสุด</option>
                  <option value="createdAt-asc">วันที่สร้างเก่าสุด</option>
                  <option value="tenantName-asc">ชื่อผู้เช่า A-Z</option>
                  <option value="tenantName-desc">ชื่อผู้เช่า Z-A</option>
                  <option value="roomName-asc">ห้อง A-Z</option>
                  <option value="rent-desc">ค่าเช่าสูง-ต่ำ</option>
                  <option value="rent-asc">ค่าเช่าต่ำ-สูง</option>
                  <option value="startDate-desc">วันเริ่มใหม่ล่าสุด</option>
                  <option value="endDate-asc">หมดอายุเร็วสุด</option>
                </select>
                {searchTerm && (
                  <button
                    className="btn btn-outline join-item"
                    onClick={() => setSearchTerm("")}
                    title="ล้างการค้นหา"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Reset All Filters */}
              {(searchTerm || statusFilter !== "ALL" || sortBy !== "createdAt" || sortOrder !== "desc") && (
                <fieldset>
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("ALL");
                      setSortBy("createdAt");
                      setSortOrder("desc");
                    }}
                  >
                    ล้างทั้งหมด
                  </button>
                </fieldset>
              )}
            </div>

            {/* Search Results Info */}
            <div className="flex justify-between items-center text-sm text-base-content/70 mt-4">
              <span>
                แสดงผล {filteredContracts.length} จาก {contracts.length} สัญญาเช่า
              </span>
              {(searchTerm || statusFilter !== "ALL") && (
                <span>
                  {searchTerm && `ค้นหา: "${searchTerm}"`}
                  {searchTerm && statusFilter !== "ALL" && " | "}
                  {statusFilter !== "ALL" && `กรอง: ${statusLabels[statusFilter as keyof typeof statusLabels]?.label}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contracts Grid */}
        {filteredContracts.length === 0 ? (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body text-center py-16">
              <FileText className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
              <h3 className="text-xl font-semibold text-base-content/70 mb-2">
                {contracts.length === 0 ? "ยังไม่มีสัญญาเช่า" : "ไม่พบสัญญาเช่าที่ค้นหา"}
              </h3>
              <p className="text-base-content/50 mb-6">
                {contracts.length === 0
                  ? "เริ่มต้นด้วยการสร้างสัญญาเช่าแรกของคุณ"
                  : "ลองเปลี่ยนคำค้นหาหรือตัวกรองที่ใช้"}
              </p>
              {contracts.length === 0 && (
                <Link href="/dashboard/contracts/select-room" className="btn btn-primary gap-2">
                  <Plus className="w-5 h-5" />
                  สร้างสัญญาเช่าใหม่
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredContracts.map((contract) => {
              const StatusIcon = statusLabels[contract.status].icon;
              const expiryStatus = getExpiryStatus(contract.endDate, contract.status);
              const pendingInvoices = contract.invoices.filter(inv => inv.status === "PENDING");
              
              return (
                <div key={contract.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="card-body">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="card-title text-lg mb-2">{contract.tenantName}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <StatusIcon className="w-4 h-4" />
                          <div className={`badge ${statusLabels[contract.status].color} badge-sm`}>
                            {statusLabels[contract.status].label}
                          </div>
                          {expiryStatus && (
                            <span className={`text-xs ${expiryStatus.color} font-medium`}>
                              {expiryStatus.text}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-base-content/70 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {contract.room.name}
                        </div>
                      </div>
                      <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-sm btn-square">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </label>
                        <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                          <li>
                            <Link href={`/dashboard/contracts/${contract.id}`} className="gap-2">
                              <Eye className="w-4 h-4" />
                              ดูรายละเอียด
                            </Link>
                          </li>
                          <li>
                            <Link href={`/dashboard/contracts/${contract.id}/edit`} className="gap-2">
                              <Edit className="w-4 h-4" />
                              แก้ไข
                            </Link>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setContractToDelete(contract);
                                setShowDeleteModal(true);
                              }}
                              className="gap-2 text-error"
                            >
                              <Trash2 className="w-4 h-4" />
                              ลบ
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Contract Period */}
                    <div className="bg-base-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">ระยะเวลาสัญญา</span>
                      </div>
                      <div className="text-sm">
                        <span>{formatDate(contract.startDate)}</span>
                        <span className="mx-2">ถึง</span>
                        <span>{formatDate(contract.endDate)}</span>
                      </div>
                    </div>

                    {/* Financial Info */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{formatCurrency(contract.rent)}</span>
                        <span className="text-sm text-base-content/70">/เดือน</span>
                      </div>
                      {contract.deposit && (
                        <div className="text-sm text-base-content/70">
                          มัดจำ: {formatCurrency(contract.deposit)}
                        </div>
                      )}
                    </div>

                    {/* Pending Invoices Alert */}
                    {pendingInvoices.length > 0 && (
                      <div className="alert alert-warning mb-4">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm">
                          มีใบแจ้งหนี้ค้างชำระ {pendingInvoices.length} ใบ
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="card-actions justify-end">
                      <Link
                        href={`/dashboard/contracts/${contract.id}`}
                        className="btn btn-primary btn-sm gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        รายละเอียด
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && contractToDelete && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error">ยืนยันการลบสัญญาเช่า</h3>
            <p className="py-4">
              คุณแน่ใจหรือไม่ที่จะลบสัญญาเช่าของ <strong>{contractToDelete.tenantName}</strong>?
              <br />
              <span className="text-error text-sm">
                การกระทำนี้ไม่สามารถย้อนกลับได้และจะลบข้อมูลทั้งหมดที่เกี่ยวข้อง
              </span>
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowDeleteModal(false);
                  setContractToDelete(null);
                }}
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
