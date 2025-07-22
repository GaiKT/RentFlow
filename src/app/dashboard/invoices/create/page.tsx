'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from '@/lib/auth-context';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Home, 
  User, 
  Calendar, 
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Room {
  id: string;
  name: string;
  rent: number;
  status: string;
  contracts: Contract[];
}

interface Contract {
  id: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  rent: number;
  status: string;
  startDate: string;
  endDate: string;
}

export default function CreateInvoicePage() {
  const { data: session } = useSession();
  const authFetch = useAuthFetch();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  
  const [formData, setFormData] = useState({
    roomId: '',
    contractId: '',
    amount: '',
    dueDate: '',
    description: '',
    period: 'monthly'
  });

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch rooms once when component mounts
  useEffect(() => {
    if (!session?.user) return;
    
    let isMounted = true;
    
    const fetchRooms = async () => {
      try {
        setLoadingRooms(true);
        
        // Use fetch directly to avoid authFetch dependency
        const token = localStorage.getItem('token');
        const response = await fetch('/api/rooms?include=contracts', {
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
          
          // API returns { rooms: [...] }
          const roomsArray = data.rooms || [];
          
          // Filter only occupied rooms with active contracts
          const occupiedRooms = roomsArray.filter((room: Room) => 
            room.status === 'OCCUPIED' && 
            room.contracts && room.contracts.some((contract: Contract) => contract.status === 'ACTIVE')
          );
          setRooms(occupiedRooms);
        } else if (isMounted) {
          console.error('Failed to fetch rooms');
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching rooms:', error);
        }
      } finally {
        if (isMounted) {
          setLoadingRooms(false);
        }
      }
    };

    fetchRooms();

    return () => {
      isMounted = false;
    };
  }, [session?.user]); // Only depend on session?.user

  // Update selectedRoom when room ID changes
  useEffect(() => {
    if (!formData.roomId) {
      setSelectedRoom(null);
      setSelectedContract(null);
      return;
    }
    
    const newSelectedRoom = rooms.find(r => r.id === formData.roomId) || null;
    
    // Only update if room actually changed
    if (newSelectedRoom?.id !== selectedRoom?.id) {
      setSelectedRoom(newSelectedRoom);
      
      if (newSelectedRoom) {
        // Reset contract selection when room changes
        setFormData(prev => ({ ...prev, contractId: '', amount: '', description: '' }));
        setSelectedContract(null);
      }
    }
  }, [formData.roomId, rooms.length, selectedRoom?.id]); // Depend on rooms.length instead of rooms array

  // Update selectedContract and auto-fill form when contract ID changes
  useEffect(() => {
    if (!selectedRoom || !formData.contractId) {
      setSelectedContract(null);
      return;
    }
    
    const newSelectedContract = selectedRoom.contracts.find(c => c.id === formData.contractId) || null;
    setSelectedContract(newSelectedContract);
    
    if (newSelectedContract) {
      // Only update if the current values are different to prevent loops
      setFormData(prev => {
        const newAmount = newSelectedContract.rent.toString();
        const newDescription = `ค่าเช่าประจำเดือน - ${selectedRoom.name} (${newSelectedContract.tenantName})`;
        
        // Only update if values actually changed
        if (prev.amount !== newAmount || prev.description !== newDescription) {
          return {
            ...prev,
            amount: newAmount,
            description: newDescription
          };
        }
        return prev;
      });
    }
  }, [formData.contractId, selectedRoom?.id, selectedRoom?.name]); // Only depend on specific properties

  // Auto-set due date to end of current month
  useEffect(() => {
    if (!formData.dueDate) {
      const today = new Date();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setFormData(prev => ({
        ...prev,
        dueDate: lastDayOfMonth.toISOString().split('T')[0]
      }));
    }
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.roomId) {
      newErrors.roomId = 'กรุณาเลือกห้องพัก';
    }

    if (!formData.contractId) {
      newErrors.contractId = 'กรุณาเลือกสัญญาเช่า';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'กรุณากรอกจำนวนเงินที่ถูกต้อง';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'กรุณาเลือกวันครบกำหนดชำระ';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'กรุณากรอกรายละเอียด';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authFetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          roomId: formData.roomId,
          contractId: formData.contractId,
          amount: parseFloat(formData.amount),
          dueDate: formData.dueDate,
          description: formData.description,
        }),
      });

      if (response.ok) {
        const invoice = await response.json();
        router.push(`/dashboard/invoices/${invoice.id}`);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'เกิดข้อผิดพลาดในการสร้างใบแจ้งหนี้' });
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      setErrors({ submit: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setLoading(false);
    }
  }, [authFetch, formData, router]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  if (!session) {
    return null; // ProtectedRoute will handle this
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/invoices" className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Plus className="w-8 h-8 text-primary" />
            ออกใบแจ้งหนี้ใหม่
          </h1>
          <p className="text-base-content/70 mt-2">
            สร้างใบแจ้งหนี้สำหรับห้องพักที่มีการเช่าอยู่
          </p>
        </div>
      </div>

      {/* Loading Rooms */}
      {loadingRooms ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : rooms.length === 0 ? (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body text-center py-16">
            <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">ไม่พบห้องพักที่มีผู้เช่า</h3>
            <p className="text-base-content/60 mb-4">
              ต้องมีห้องพักที่มีสัญญาเช่าที่ใช้งานอยู่จึงจะสามารถออกใบแจ้งหนี้ได้
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard/rooms" className="btn btn-primary">
                <Home className="w-4 h-4" />
                จัดการห้องพัก
              </Link>
              <Link href="/dashboard/contracts" className="btn btn-outline">
                <FileText className="w-4 h-4" />
                จัดการสัญญาเช่า
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Room Selection */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-xl mb-6">
                  <Home className="w-6 h-6 text-primary" />
                  เลือกห้องพัก
                </h2>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">
                    ห้องพัก <span className="text-error">*</span>
                  </legend>
                  <select
                    className={`select select-bordered w-full validator ${errors.roomId ? 'select-error' : ''}`}
                    value={formData.roomId}
                    onChange={(e) => handleInputChange('roomId', e.target.value)}
                  >
                    <option value="">เลือกห้องพัก</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} - {room.contracts.filter(c => c.status === 'ACTIVE').length} สัญญาที่ใช้งาน
                      </option>
                    ))}
                  </select>
                  {errors.roomId && (
                    <div className="mt-1">
                      <span className="text-xs text-error">{errors.roomId}</span>
                    </div>
                  )}
                </fieldset>

                {/* Room Info */}
                {selectedRoom && (
                  <div className="mt-4 p-4 bg-base-200 rounded-lg">
                    <h4 className="font-semibold mb-2">ข้อมูลห้องพัก</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-base-content/60">ชื่อห้อง:</span>
                        <span className="ml-2 font-medium">{selectedRoom.name}</span>
                      </div>
                      <div>
                        <span className="text-base-content/60">ค่าเช่าพื้นฐาน:</span>
                        <span className="ml-2 font-medium">
                          {new Intl.NumberFormat('th-TH', {
                            style: 'currency',
                            currency: 'THB'
                          }).format(selectedRoom.rent)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contract Selection */}
            {selectedRoom && (
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title text-xl mb-6">
                    <FileText className="w-6 h-6 text-primary" />
                    เลือกสัญญาเช่า
                  </h2>

                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">
                      สัญญาเช่า <span className="text-error">*</span>
                    </legend>
                    <select
                      className={`select select-bordered w-full validator ${errors.contractId ? 'select-error' : ''}`}
                      value={formData.contractId}
                      onChange={(e) => handleInputChange('contractId', e.target.value)}
                    >
                      <option value="">เลือกสัญญาเช่า</option>
                      {selectedRoom.contracts
                        .filter(contract => contract.status === 'ACTIVE')
                        .map((contract) => (
                        <option key={contract.id} value={contract.id}>
                          {contract.tenantName} - {new Intl.NumberFormat('th-TH', {
                            style: 'currency',
                            currency: 'THB'
                          }).format(contract.rent)}
                        </option>
                      ))}
                    </select>
                    {errors.contractId && (
                      <div className="mt-1">
                        <span className="text-xs text-error">{errors.contractId}</span>
                      </div>
                    )}
                  </fieldset>

                  {/* Contract Info */}
                  {selectedContract && (
                    <div className="mt-4 p-4 bg-base-200 rounded-lg">
                      <h4 className="font-semibold mb-2">ข้อมูลสัญญาเช่า</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-base-content/60">ผู้เช่า:</span>
                          <span className="ml-2 font-medium">{selectedContract.tenantName}</span>
                        </div>
                        <div>
                          <span className="text-base-content/60">เบอร์โทร:</span>
                          <span className="ml-2 font-medium">{selectedContract.tenantPhone || '-'}</span>
                        </div>
                        <div>
                          <span className="text-base-content/60">อีเมล:</span>
                          <span className="ml-2 font-medium">{selectedContract.tenantEmail || '-'}</span>
                        </div>
                        <div>
                          <span className="text-base-content/60">ค่าเช่า:</span>
                          <span className="ml-2 font-medium">
                            {new Intl.NumberFormat('th-TH', {
                              style: 'currency',
                              currency: 'THB'
                            }).format(selectedContract.rent)}
                          </span>
                        </div>
                        <div>
                          <span className="text-base-content/60">วันเริ่มสัญญา:</span>
                          <span className="ml-2 font-medium">
                            {new Date(selectedContract.startDate).toLocaleDateString('th-TH')}
                          </span>
                        </div>
                        <div>
                          <span className="text-base-content/60">วันสิ้นสุดสัญญา:</span>
                          <span className="ml-2 font-medium">
                            {new Date(selectedContract.endDate).toLocaleDateString('th-TH')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invoice Details */}
            {selectedContract && (
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title text-xl mb-6">
                    <DollarSign className="w-6 h-6 text-primary" />
                    รายละเอียดใบแจ้งหนี้
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Amount */}
                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium">
                        จำนวนเงิน (บาท) <span className="text-error">*</span>
                      </legend>
                      <input
                        type="number"
                        className={`input input-bordered w-full validator ${errors.amount ? 'input-error' : ''}`}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                      />
                      {errors.amount && (
                        <div className="mt-1">
                          <span className="text-xs text-error">{errors.amount}</span>
                        </div>
                      )}
                    </fieldset>

                    {/* Due Date */}
                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium">
                        วันครบกำหนดชำระ <span className="text-error">*</span>
                      </legend>
                      <input
                        type="date"
                        className={`input input-bordered w-full validator ${errors.dueDate ? 'input-error' : ''}`}
                        value={formData.dueDate}
                        onChange={(e) => handleInputChange('dueDate', e.target.value)}
                      />
                      {errors.dueDate && (
                        <div className="mt-1">
                          <span className="text-xs text-error">{errors.dueDate}</span>
                        </div>
                      )}
                    </fieldset>
                  </div>

                  {/* Description */}
                  <fieldset className="space-y-2 mt-6">
                    <legend className="text-sm font-medium">
                      รายละเอียด <span className="text-error">*</span>
                    </legend>
                    <textarea
                      className={`textarea textarea-bordered w-full h-24 validator ${errors.description ? 'textarea-error' : ''}`}
                      placeholder="เช่น ค่าเช่าประจำเดือน มกราคม 2567"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                    {errors.description && (
                      <div className="mt-1">
                        <span className="text-xs text-error">{errors.description}</span>
                      </div>
                    )}
                  </fieldset>

                  {/* Summary */}
                  <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      สรุปใบแจ้งหนี้
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-base-content/60">ห้อง:</span>
                        <span className="ml-2 font-medium">{selectedRoom?.name}</span>
                      </div>
                      <div>
                        <span className="text-base-content/60">ผู้เช่า:</span>
                        <span className="ml-2 font-medium">{selectedContract.tenantName}</span>
                      </div>
                      <div>
                        <span className="text-base-content/60">จำนวนเงิน:</span>
                        <span className="ml-2 font-medium text-lg text-primary">
                          {formData.amount ? new Intl.NumberFormat('th-TH', {
                            style: 'currency',
                            currency: 'THB'
                          }).format(parseFloat(formData.amount)) : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-base-content/60">วันครบกำหนด:</span>
                        <span className="ml-2 font-medium">
                          {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString('th-TH') : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {errors.submit && (
              <div className="alert alert-error">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.submit}</span>
              </div>
            )}

            {/* Actions */}
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  <Link href="/dashboard/invoices" className="btn btn-outline">
                    ยกเลิก
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !selectedContract}
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        กำลังสร้าง...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        ออกใบแจ้งหนี้
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
