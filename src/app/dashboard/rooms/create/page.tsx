"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customToast } from "@/lib/toast";
import {
  Building,
  Save,
  ArrowLeft,
  DollarSign,
  MapPin,
  FileText,
  Home,
} from "lucide-react";

export default function CreateRoomPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    rent: "",
    deposit: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.rent) {
      customToast.error("กรุณากรอกชื่อห้องและค่าเช่า");
      return;
    }

    if (parseFloat(formData.rent) <= 0) {
      customToast.error("ค่าเช่าต้องมากกว่า 0");
      return;
    }

    if (formData.deposit && parseFloat(formData.deposit) < 0) {
      customToast.error("มัดจำต้องไม่ติดลบ");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          address: formData.address || null,
          rent: parseFloat(formData.rent),
          deposit: formData.deposit ? parseFloat(formData.deposit) : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        customToast.success("สร้างห้องพักสำเร็จ");
        router.push("/dashboard/rooms");
      } else {
        customToast.error(data.message || "เกิดข้อผิดพลาดในการสร้างห้องพัก");
      }
    } catch {
      customToast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 shadow-sm border-b border-base-300">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/rooms" className="btn btn-ghost btn-circle">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-base-content flex items-center gap-3">
                <Building className="w-7 h-7 text-primary" />
                เพิ่มห้องพักใหม่
              </h1>
              <p className="text-base-content/70 mt-1">
                กรอกข้อมูลห้องพักที่ต้องการเพิ่ม
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Room Name */}
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">
                    <Home className="w-4 h-4 inline mr-2" />
                    ชื่อห้องพัก <span className="text-error">*</span>
                  </legend>
                  <input
                    type="text"
                    name="name"
                    placeholder="เช่น ห้อง 101, ห้องพักชั้น 2 หน้า, อพาร์ทเมนต์ A"
                    className="input input-bordered w-full validator"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </fieldset>

                {/* Address */}
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    ที่อยู่
                  </legend>
                  <input
                    type="text"
                    name="address"
                    placeholder="ที่อยู่ของห้องพัก"
                    className="input input-bordered w-full validator"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </fieldset>

                {/* Description */}
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">
                    <FileText className="w-4 h-4 inline mr-2" />
                    คำอธิบาย
                  </legend>
                  <textarea
                    name="description"
                    placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับห้องพัก เช่น ขนาด, สิ่งอำนวยความสะดวก"
                    className="textarea textarea-bordered w-full h-24 validator"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </fieldset>

                {/* Rent and Deposit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Rent */}
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      ค่าเช่าต่อเดือน <span className="text-error">*</span>
                    </legend>
                    <div className="input-group">
                      <input
                        type="number"
                        name="rent"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="input input-bordered w-full validator"
                        value={formData.rent}
                        onChange={handleChange}
                        required
                      />
                      <span className="bg-base-300 text-base-content">บาท</span>
                    </div>
                  </fieldset>

                  {/* Deposit */}
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      เงินมัดจำ
                    </legend>
                    <div className="input-group">
                      <input
                        type="number"
                        name="deposit"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="input input-bordered w-full validator"
                        value={formData.deposit}
                        onChange={handleChange}
                      />
                      <span className="bg-base-300 text-base-content">บาท</span>
                    </div>
                  </fieldset>
                </div>

                {/* Info Alert */}
                <div className="alert alert-info">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <h3 className="font-bold">ข้อมูลที่ต้องการ</h3>
                    <div className="text-xs">
                      กรุณากรอกข้อมูลที่มีเครื่องหมาย * เป็นข้อมูลที่จำเป็น
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <Link href="/dashboard/rooms" className="btn btn-ghost">
                    ยกเลิก
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary gap-2"
                    disabled={isLoading}
                  >
                    {isLoading && <div className="loading loading-spinner loading-sm"></div>}
                    <Save className="w-4 h-4" />
                    สร้างห้องพัก
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
