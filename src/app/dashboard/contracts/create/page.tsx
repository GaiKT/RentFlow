"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { customToast } from "@/lib/toast";
import {
  FileText,
  ArrowLeft,
  Save,
  X,
  Users,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Building,
} from "lucide-react";

interface Room {
  id: string;
  name: string;
  rent: number;
  deposit?: number;
  status: string;
}

interface FormData {
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  startDate: string;
  endDate: string;
  rent: string;
  deposit: string;
  terms: string;
  notes: string;
}

export default function CreateContractPage() {
  const [room, setRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<FormData>({
    tenantName: "",
    tenantPhone: "",
    tenantEmail: "",
    startDate: "",
    endDate: "",
    rent: "",
    deposit: "",
    terms: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");

  const fetchRoom = useCallback(async () => {
    if (!roomId) {
      customToast.error("ไม่พบข้อมูลห้องพัก");
      router.push("/dashboard/rooms");
      return;
    }

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
        // Set default values from room
        setFormData(prev => ({
          ...prev,
          rent: data.room.rent.toString(),
          deposit: data.room.deposit?.toString() || "",
        }));
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
    fetchRoom();
  }, [fetchRoom]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.tenantName.trim()) {
      newErrors.tenantName = "กรุณากรอกชื่อผู้เช่า";
    }

    if (!formData.tenantPhone.trim()) {
      newErrors.tenantPhone = "กรุณากรอกเบอร์โทรศัพท์";
    }

    if (!formData.tenantEmail.trim()) {
      newErrors.tenantEmail = "กรุณากรอกอีเมล";
    } else if (!/\S+@\S+\.\S+/.test(formData.tenantEmail)) {
      newErrors.tenantEmail = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    if (!formData.startDate) {
      newErrors.startDate = "กรุณาเลือกวันที่เริ่มสัญญา";
    }

    if (!formData.endDate) {
      newErrors.endDate = "กรุณาเลือกวันที่สิ้นสุดสัญญา";
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = "วันที่สิ้นสุดต้องหลังจากวันที่เริ่มสัญญา";
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

    if (!validateForm() || !roomId) {
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId,
          tenantName: formData.tenantName.trim(),
          tenantPhone: formData.tenantPhone.trim(),
          tenantEmail: formData.tenantEmail.trim(),
          startDate: formData.startDate,
          endDate: formData.endDate,
          rent: Number(formData.rent),
          deposit: formData.deposit ? Number(formData.deposit) : null,
          terms: formData.terms.trim() || null,
          notes: formData.notes.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        customToast.success("สร้างสัญญาเช่าสำเร็จ");
        router.push(`/dashboard/rooms/${roomId}`);
      } else {
        const data = await response.json();
        if (data.errors) {
          setErrors(data.errors);
        } else {
          customToast.error(data.message || "เกิดข้อผิดพลาดในการสร้างสัญญาเช่า");
        }
      }
    } catch {
      customToast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSaving(false);
    }
  };

  // Set default dates (start: today, end: 1 year from today)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split('T')[0];

    setFormData(prev => ({
      ...prev,
      startDate: prev.startDate || today,
      endDate: prev.endDate || nextYearStr,
    }));
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

  if (!room) {
    return null;
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 shadow-sm border-b border-base-300">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/rooms/${roomId}`} className="btn btn-ghost btn-circle">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-base-content flex items-center gap-3">
                <FileText className="w-7 h-7 text-primary" />
                สร้างสัญญาเช่า
              </h1>
              <p className="text-base-content/70 mt-1 flex items-center gap-2">
                <Building className="w-4 h-4" />
                {room.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tenant Information */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl mb-6">
                  <Users className="w-6 h-6 text-primary" />
                  ข้อมูลผู้เช่า
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tenant Name */}
                  <fieldset className="md:col-span-2">
                    <legend className="fieldset-legend font-medium">
                      ชื่อ-นามสกุล <span className="text-error">*</span>
                    </legend>
                    <input
                      type="text"
                      className={`input input-bordered w-full ${errors.tenantName ? 'validator input-error' : 'validator'}`}
                      placeholder="ชื่อและนามสกุลของผู้เช่า"
                      value={formData.tenantName}
                      onChange={(e) => handleInputChange('tenantName', e.target.value)}
                      required
                    />
                    {errors.tenantName && (
                      <label className="validator-hint text-error text-sm mt-1">{errors.tenantName}</label>
                    )}
                  </fieldset>

                  {/* Phone */}
                  <fieldset>
                    <legend className="fieldset-legend font-medium">
                      <Phone className="w-4 h-4 inline mr-1" />
                      เบอร์โทรศัพท์ <span className="text-error">*</span>
                    </legend>
                    <input
                      type="tel"
                      className={`input input-bordered w-full ${errors.tenantPhone ? 'validator input-error' : 'validator'}`}
                      placeholder="0X-XXXX-XXXX"
                      value={formData.tenantPhone}
                      onChange={(e) => handleInputChange('tenantPhone', e.target.value)}
                      required
                    />
                    {errors.tenantPhone && (
                      <label className="validator-hint text-error text-sm mt-1">{errors.tenantPhone}</label>
                    )}
                  </fieldset>

                  {/* Email */}
                  <fieldset>
                    <legend className="fieldset-legend font-medium">
                      <Mail className="w-4 h-4 inline mr-1" />
                      อีเมล <span className="text-error">*</span>
                    </legend>
                    <input
                      type="email"
                      className={`input input-bordered w-full ${errors.tenantEmail ? 'validator input-error' : 'validator'}`}
                      placeholder="example@email.com"
                      value={formData.tenantEmail}
                      onChange={(e) => handleInputChange('tenantEmail', e.target.value)}
                      required
                    />
                    {errors.tenantEmail && (
                      <label className="validator-hint text-error text-sm mt-1">{errors.tenantEmail}</label>
                    )}
                  </fieldset>
                </div>
              </div>
            </div>

            {/* Contract Dates */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl mb-6">
                  <Calendar className="w-6 h-6 text-primary" />
                  ระยะเวลาสัญญา
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Start Date */}
                  <fieldset>
                    <legend className="fieldset-legend font-medium">
                      วันที่เริ่มสัญญา <span className="text-error">*</span>
                    </legend>
                    <input
                      type="date"
                      className={`input input-bordered w-full ${errors.startDate ? 'validator input-error' : 'validator'}`}
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      required
                    />
                    {errors.startDate && (
                      <label className="validator-hint text-error text-sm mt-1">{errors.startDate}</label>
                    )}
                  </fieldset>

                  {/* End Date */}
                  <fieldset>
                    <legend className="fieldset-legend font-medium">
                      วันที่สิ้นสุดสัญญา <span className="text-error">*</span>
                    </legend>
                    <input
                      type="date"
                      className={`input input-bordered w-full ${errors.endDate ? 'validator input-error' : 'validator'}`}
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      required
                    />
                    {errors.endDate && (
                      <label className="validator-hint text-error text-sm mt-1">{errors.endDate}</label>
                    )}
                  </fieldset>
                </div>
              </div>
            </div>

            {/* Financial Terms */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl mb-6">
                  <DollarSign className="w-6 h-6 text-primary" />
                  เงื่อนไขทางการเงิน
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Rent */}
                  <fieldset>
                    <legend className="fieldset-legend font-medium">
                      ค่าเช่าต่อเดือน (บาท) <span className="text-error">*</span>
                    </legend>
                    <input
                      type="number"
                      className={`input input-bordered w-full ${errors.rent ? 'validator input-error' : 'validator'}`}
                      placeholder="0"
                      min="0"
                      value={formData.rent}
                      onChange={(e) => handleInputChange('rent', e.target.value)}
                      required
                    />
                    {errors.rent && (
                      <label className="validator-hint text-error text-sm mt-1">{errors.rent}</label>
                    )}
                  </fieldset>

                  {/* Deposit */}
                  <fieldset>
                    <legend className="fieldset-legend font-medium">เงินมัดจำ (บาท) (optional)</legend>
                    <input
                      type="number"
                      className={`input input-bordered w-full ${errors.deposit ? 'validator input-error' : 'validator'}`}
                      placeholder="0"
                      min="0"
                      value={formData.deposit}
                      onChange={(e) => handleInputChange('deposit', e.target.value)}
                    />
                    {errors.deposit && (
                      <label className="validator-hint text-error text-sm mt-1">{errors.deposit}</label>
                    )}
                  </fieldset>
                </div>
              </div>
            </div>

            {/* Additional Terms */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl mb-6">
                  <FileText className="w-6 h-6 text-primary" />
                  เงื่อนไขเพิ่มเติม
                </h2>

                <div className="space-y-6">
                  {/* Terms */}
                  <fieldset>
                    <legend className="fieldset-legend font-medium">เงื่อนไขสัญญา</legend>
                    <label className="text-xs text-base-content/70 mb-2 block">เงื่อนไขและข้อตกลงของสัญญาเช่า</label>
                    <textarea
                      className="textarea textarea-bordered h-32 w-full validator"
                      placeholder="เงื่อนไขและข้อตกลงในสัญญาเช่า เช่น กฎการใช้งาน, ความรับผิดชอบ, การจ่ายค่าสาธารณูปโภค ฯลฯ"
                      value={formData.terms}
                      onChange={(e) => handleInputChange('terms', e.target.value)}
                    />
                  </fieldset>

                  {/* Notes */}
                  <fieldset>
                    <legend className="fieldset-legend font-medium">หมายเหตุ</legend>
                    <label className="text-xs text-base-content/70 mb-2 block">ข้อมูลเพิ่มเติมสำหรับการอ้างอิง</label>
                    <textarea
                      className="textarea textarea-bordered h-24 w-full validator"
                      placeholder="หมายเหตุเพิ่มเติม"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                    />
                  </fieldset>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <Link
                    href={`/dashboard/rooms/${roomId}`}
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
                    สร้างสัญญาเช่า
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
