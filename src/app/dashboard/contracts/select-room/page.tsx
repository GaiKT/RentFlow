"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customToast } from "@/lib/toast";
import { Navbar } from "@/components/Navbar";
import {
  FileText,
  ArrowLeft,
  Home,
  Plus,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
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
  address?: string;
  rent: number;
  deposit?: number;
  description?: string;
  status: string;
}

export default function SelectRoomPage() {
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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

      // Fetch available rooms
      const roomsResponse = await fetch("/api/rooms/available", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json();
        setRooms(roomsData.rooms);
      } else {
        customToast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลห้องที่ว่าง");
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    customToast.logoutSuccess();
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
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
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/contracts" className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-base-content flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              เลือกห้องสำหรับสัญญาเช่า
            </h1>
            <p className="text-base-content/70 mt-1">
              เลือกห้องที่ว่างเพื่อสร้างสัญญาเช่าใหม่
            </p>
          </div>
        </div>

        {rooms.length === 0 ? (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body text-center py-16">
              <Home className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
              <h3 className="text-xl font-semibold text-base-content/70 mb-2">
                ไม่มีห้องว่างให้เช่า
              </h3>
              <p className="text-base-content/50 mb-6">
                ขณะนี้ไม่มีห้องที่ว่างให้สร้างสัญญาเช่าใหม่
                <br />
                ห้องทั้งหมดของคุณอาจมีสัญญาเช่าอยู่แล้ว หรือยังไม่ได้เพิ่มห้องใหม่
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/dashboard/rooms" className="btn btn-primary gap-2">
                  <Home className="w-5 h-5" />
                  จัดการห้อง
                </Link>
                <Link href="/dashboard/rooms/create" className="btn btn-outline gap-2">
                  <Plus className="w-5 h-5" />
                  เพิ่มห้องใหม่
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
                <div className="card-body">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="card-title text-lg mb-2 flex items-center gap-2">
                        <Home className="w-5 h-5 text-primary" />
                        {room.name}
                      </h3>
                      {room.address && (
                        <p className="text-sm text-base-content/70 mb-2">
                          📍 {room.address}
                        </p>
                      )}
                      <div className="badge badge-success badge-sm">
                        ห้องว่าง
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {room.description && (
                    <div className="mb-4">
                      <p className="text-sm text-base-content/70">
                        {room.description}
                      </p>
                    </div>
                  )}

                  {/* Financial Info */}
                  <div className="bg-base-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="font-medium">ค่าเช่า</span>
                      </div>
                      <span className="font-bold text-primary">
                        {formatCurrency(room.rent)}/เดือน
                      </span>
                    </div>
                    
                    {room.deposit && room.deposit > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-base-content/70">เงินประกัน</span>
                        <span className="text-sm font-medium">
                          {formatCurrency(room.deposit)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="bg-primary/10 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">รวมเงินเริ่มต้น</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(room.rent + (room.deposit || 0))}
                      </span>
                    </div>
                    <p className="text-xs text-base-content/60 mt-1">
                      ค่าเช่าเดือนแรก + เงินประกัน
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="card-actions justify-end">
                    <Link
                      href={`/dashboard/contracts/create?roomId=${room.id}`}
                      className="btn btn-primary gap-2 flex-1"
                    >
                      <FileText className="w-4 h-4" />
                      สร้างสัญญาเช่า
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Alert */}
        <div className="alert alert-info mt-8">
          <AlertCircle className="w-5 h-5" />
          <div>
            <h3 className="font-medium">ข้อมูลที่ควรรู้</h3>
            <p className="text-sm mt-1">
              แสดงเฉพาะห้องที่ว่างหรือไม่มีสัญญาเช่าที่ใช้งานอยู่เท่านั้น
              หากไม่เห็นห้องที่คาดหวัง ตรวจสอบสถานะสัญญาเช่าในห้องนั้น ๆ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
