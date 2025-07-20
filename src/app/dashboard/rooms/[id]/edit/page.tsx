"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customToast } from "@/lib/toast";
import {
  Building,
  ArrowLeft,
  Save,
  X,
  DollarSign,
  MapPin,
  FileText,
  Home,
} from "lucide-react";

interface Room {
  id: string;
  name: string;
  description?: string;
  address?: string;
  rent: number;
  deposit?: number;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "UNAVAILABLE";
}

interface FormData {
  name: string;
  description: string;
  address: string;
  rent: string;
  deposit: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "UNAVAILABLE";
}

const statusOptions = [
  { value: "AVAILABLE", label: "ว่าง" },
  { value: "OCCUPIED", label: "มีผู้เช่า" },
  { value: "MAINTENANCE", label: "ซ่อมแซม" },
  { value: "UNAVAILABLE", label: "ไม่พร้อมใช้" },
];

export default function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    address: "",
    rent: "",
    deposit: "",
    status: "AVAILABLE",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
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
        setFormData({
          name: data.room.name,
          description: data.room.description || "",
          address: data.room.address || "",
          rent: data.room.rent.toString(),
          deposit: data.room.deposit?.toString() || "",
          status: data.room.status,
        });
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

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "กรุณากรอกชื่อห้องพัก";
    }

    if (!formData.rent || isNaN(Number(formData.rent)) || Number(formData.rent) <= 0) {
      newErrors.rent = "กรุณากรอกค่าเช่าที่ถูกต้อง";
    }

    if (formData.deposit && (isNaN(Number(formData.deposit)) || Number(formData.deposit) < 0)) {
      newErrors.deposit = "กรุณากรอกเงินมัดจำที่ถูกต้อง";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          address: formData.address.trim() || null,
          rent: Number(formData.rent),
          deposit: formData.deposit ? Number(formData.deposit) : null,
          status: formData.status,
        }),
      });

      if (response.ok) {
        customToast.success("อัปเดตข้อมูลห้องพักสำเร็จ");
        router.push(`/dashboard/rooms/${roomId}`);
      } else {
        const data = await response.json();
        if (data.errors) {
          setErrors(data.errors);
        } else {
          customToast.error(data.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูลห้องพัก");
        }
      }
    } catch {
      customToast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSaving(false);
    }
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

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 shadow-sm border-b border-base-300">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href={roomId ? `/dashboard/rooms/${roomId}` : "/dashboard/rooms"} className="btn btn-ghost btn-circle">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-base-content flex items-center gap-3">
                <Building className="w-7 h-7 text-primary" />
                แก้ไขข้อมูลห้องพัก
              </h1>
              <p className="text-base-content/70 mt-1">
                แก้ไขข้อมูล: {room.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl mb-6">
                  <Home className="w-6 h-6 text-primary" />
                  ข้อมูลพื้นฐาน
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Room Name */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        ชื่อห้องพัก <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      className={`input input-bordered ${errors.name ? 'input-error' : ''}`}
                      placeholder="เช่น ห้อง 101, ห้องชั้น 2 หลังใหญ่"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                    {errors.name && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.name}</span>
                      </label>
                    )}
                  </div>

                  {/* Status */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">สถานะห้อง</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Address */}
                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text font-medium">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        ที่อยู่
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      placeholder="ที่อยู่ของห้องพัก"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  </div>

                  {/* Description */}
                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text font-medium">
                        <FileText className="w-4 h-4 inline mr-1" />
                        คำอธิบาย
                      </span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered h-24"
                      placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับห้องพัก"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl mb-6">
                  <DollarSign className="w-6 h-6 text-primary" />
                  ข้อมูลการเงิน
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Rent */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        ค่าเช่าต่อเดือน (บาท) <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="number"
                      className={`input input-bordered ${errors.rent ? 'input-error' : ''}`}
                      placeholder="0"
                      min="0"
                      value={formData.rent}
                      onChange={(e) => handleInputChange('rent', e.target.value)}
                    />
                    {errors.rent && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.rent}</span>
                      </label>
                    )}
                  </div>

                  {/* Deposit */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">เงินมัดจำ (บาท)</span>
                    </label>
                    <input
                      type="number"
                      className={`input input-bordered ${errors.deposit ? 'input-error' : ''}`}
                      placeholder="0"
                      min="0"
                      value={formData.deposit}
                      onChange={(e) => handleInputChange('deposit', e.target.value)}
                    />
                    {errors.deposit && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.deposit}</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <Link
                    href={roomId ? `/dashboard/rooms/${roomId}` : "/dashboard/rooms"}
                    className="btn btn-ghost gap-2"
                  >
                    <X className="w-4 h-4" />
                    ยกเลิก
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary gap-2"
                    disabled={isSaving}
                  >
                    {isSaving && <div className="loading loading-spinner loading-sm"></div>}
                    <Save className="w-4 h-4" />
                    บันทึกการเปลี่ยนแปลง
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
