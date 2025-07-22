"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customToast } from "@/lib/toast";
import {
  Building,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  DollarSign,
  MapPin,
  Search,
  Filter,
  ArrowLeft,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
}

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
    startDate: string;
    endDate: string;
  }>;
}

const statusLabels = {
  AVAILABLE: { label: "ว่าง", color: "badge-success" },
  OCCUPIED: { label: "มีผู้เช่า", color: "badge-warning" },
  MAINTENANCE: { label: "ซ่อมแซม", color: "badge-error" },
  UNAVAILABLE: { label: "ไม่พร้อมใช้", color: "badge-neutral" },
};

export default function RoomsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const router = useRouter();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

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

      // Fetch rooms data
      const roomsResponse = await fetch("/api/rooms", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json();
        setRooms(roomsData.rooms);
      } else {
        customToast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลห้องพัก");
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

  // Filter and sort rooms with useMemo for performance
  const filteredRooms = useMemo(() => {
    let filtered = rooms;

    // Apply search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(
        (room) =>
          room.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          room.address?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          room.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((room) => room.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "rent":
          aValue = a.rent;
          bValue = b.rent;
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
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [rooms, debouncedSearchTerm, statusFilter, sortBy, sortOrder]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    customToast.logoutSuccess();
    setTimeout(() => {
      router.push("/");
    }, 1000);
  }, [router]);

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/rooms/${roomToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        customToast.deleted("ห้องพัก");
        setRooms(rooms.filter((room) => room.id !== roomToDelete.id));
        setShowDeleteModal(false);
        setRoomToDelete(null);
      } else {
        const data = await response.json();
        customToast.error(data.message || "เกิดข้อผิดพลาดในการลบห้องพัก");
      }
    } catch {
      customToast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  }, []);

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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
              <Building className="w-8 h-8 text-primary" />
              จัดการห้องพัก
            </h1>
            <p className="text-base-content/70 mt-1">
              จัดการข้อมูลห้องพักทั้งหมด
            </p>
          </div>
        </div>
        
        <Link href="/dashboard/rooms/create" className="btn btn-primary gap-2">
          <Plus className="w-5 h-5" />
          เพิ่มห้องพักใหม่
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Main Search and Filter Join */}
            <div className="join flex-1">
              <input
                type="text"
                placeholder="ค้นหาด้วยชื่อห้อง, ที่อยู่, หรือคำอธิบาย..."
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
                <option value="AVAILABLE">ว่าง</option>
                <option value="OCCUPIED">มีผู้เช่า</option>
                <option value="MAINTENANCE">ซ่อมแซม</option>
                <option value="UNAVAILABLE">ไม่พร้อมใช้</option>
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
                <option value="name-asc">ชื่อ A-Z</option>
                <option value="name-desc">ชื่อ Z-A</option>
                <option value="rent-asc">ราคาต่ำ-สูง</option>
                <option value="rent-desc">ราคาสูง-ต่ำ</option>
                <option value="status-asc">สถานะ A-Z</option>
                <option value="createdAt-desc">ใหม่ล่าสุด</option>
                <option value="createdAt-asc">เก่าที่สุด</option>
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
            {(searchTerm || statusFilter !== "ALL" || sortBy !== "name" || sortOrder !== "asc") && (
              <div>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("ALL");
                    setSortBy("name");
                    setSortOrder("asc");
                  }}
                >
                  ล้างทั้งหมด
                </button>
              </div>
            )}
          </div>

          {/* Search Results Info */}
          <div className="flex justify-between items-center text-sm text-base-content/70 mt-4">
            <span>
              แสดงผล {filteredRooms.length} จาก {rooms.length} ห้องพัก
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

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body text-center py-16">
            <Building className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
            <h3 className="text-xl font-semibold text-base-content/70 mb-2">
              {rooms.length === 0 ? "ยังไม่มีห้องพัก" : "ไม่พบห้องพักที่ค้นหา"}
            </h3>
            <p className="text-base-content/50 mb-6">
              {rooms.length === 0
                ? "เริ่มต้นด้วยการเพิ่มห้องพักแรกของคุณ"
                : "ลองเปลี่ยนคำค้นหาหรือตัวกรองที่ใช้"}
            </p>
            {rooms.length === 0 && (
              <Link href="/dashboard/rooms/create" className="btn btn-primary gap-2">
                <Plus className="w-5 h-5" />
                เพิ่มห้องพักใหม่
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <div key={room.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
              <div className="card-body flex flex-col justify-between">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="card-title text-lg">{room.name}</h3>
                    <div className={`badge ${statusLabels[room.status].color} badge-sm mt-1`}>
                      {statusLabels[room.status].label}
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
                        <Link href={`/dashboard/rooms/${room.id}`} className="gap-2">
                          <Eye className="w-4 h-4" />
                          ดูรายละเอียด
                        </Link>
                      </li>
                      <li>
                        <Link href={`/dashboard/rooms/${room.id}/edit`} className="gap-2">
                          <Edit className="w-4 h-4" />
                          แก้ไข
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            setRoomToDelete(room);
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

                {/* Address */}
                {room.address && (
                  <div className="flex items-center gap-2 text-base-content/70 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{room.address}</span>
                  </div>
                )}

                {/* Description */}
                {room.description && (
                  <p className="text-base-content/70 text-sm mb-4 line-clamp-2">
                    {room.description}
                  </p>
                )}

                {/* Rent and Deposit */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{formatCurrency(room.rent)}</span>
                    <span className="text-sm text-base-content/70">/เดือน</span>
                  </div>
                  {room.deposit && (
                    <div className="text-sm text-base-content/70">
                      มัดจำ: {formatCurrency(room.deposit)}
                    </div>
                  )}
                </div>

                {/* Active Contract */}
                {room.contracts.length > 0 && (
                  <div className="bg-base-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">ผู้เช่าปัจจุบัน</span>
                    </div>
                    <p className="text-sm font-semibold">{room.contracts[0].tenantName}</p>
                    <p className="text-xs text-base-content/70">
                      {new Date(room.contracts[0].startDate).toLocaleDateString('th-TH')} -{" "}
                      {new Date(room.contracts[0].endDate).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="card-actions justify-end">
                  <Link
                    href={`/dashboard/rooms/${room.id}`}
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    ดูรายละเอียด
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && roomToDelete && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error">ยืนยันการลบห้องพัก</h3>
            <p className="py-4">
              คุณแน่ใจหรือไม่ที่จะลบห้องพัก <strong>{roomToDelete.name}</strong>?
              <br />
              <span className="text-error text-sm">
                การกระทำนี้ไม่สามารถย้อนกลับได้
              </span>
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowDeleteModal(false);
                  setRoomToDelete(null);
                }}
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
