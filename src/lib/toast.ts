import toast from "react-hot-toast";

export const customToast = {
  success: (message: string, options?: any) => {
    return toast.success(message, {
      icon: '✅',
      style: {
        background: '#ffffff',
        color: '#16a34a',
        border: '1px solid #22c55e',
        borderRadius: '12px',
        fontWeight: '500',
        fontSize: '14px',
        padding: '16px 20px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        backdropFilter: 'blur(8px)',
        maxWidth: '400px',
      },
      duration: 4000,
      ...options,
    });
  },

  error: (message: string, options?: any) => {
    return toast.error(message, {
      icon: '❌',
      style: {
        background: '#ffffff',
        color: '#dc2626',
        border: '1px solid #ef4444',
        borderRadius: '12px',
        fontWeight: '500',
        fontSize: '14px',
        padding: '16px 20px',
        boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.1), 0 4px 6px -2px rgba(220, 38, 38, 0.05)',
        backdropFilter: 'blur(8px)',
        maxWidth: '400px',
      },
      duration: 5000,
      ...options,
    });
  },

  loading: (message: string, options?: any) => {
    return toast.loading(message, {
      icon: '⏳',
      style: {
        background: '#ffffff',
        color: '#0ea5e9',
        border: '1px solid #38bdf8',
        borderRadius: '12px',
        fontWeight: '500',
        fontSize: '14px',
        padding: '16px 20px',
        boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.1), 0 4px 6px -2px rgba(14, 165, 233, 0.05)',
        backdropFilter: 'blur(8px)',
        maxWidth: '400px',
      },
      ...options,
    });
  },

  info: (message: string, options?: any) => {
    return toast(message, {
      icon: 'ℹ️',
      style: {
        background: '#ffffff',
        color: '#0369a1',
        border: '1px solid #0ea5e9',
        borderRadius: '12px',
        fontWeight: '500',
        fontSize: '14px',
        padding: '16px 20px',
        boxShadow: '0 10px 25px -5px rgba(3, 105, 161, 0.1), 0 4px 6px -2px rgba(3, 105, 161, 0.05)',
        backdropFilter: 'blur(8px)',
        maxWidth: '400px',
      },
      duration: 4000,
      ...options,
    });
  },

  warning: (message: string, options?: any) => {
    return toast(message, {
      icon: '⚠️',
      style: {
        background: '#ffffff',
        color: '#d97706',
        border: '1px solid #f59e0b',
        borderRadius: '12px',
        fontWeight: '500',
        fontSize: '14px',
        padding: '16px 20px',
        boxShadow: '0 10px 25px -5px rgba(217, 119, 6, 0.1), 0 4px 6px -2px rgba(217, 119, 6, 0.05)',
        backdropFilter: 'blur(8px)',
        maxWidth: '400px',
      },
      duration: 4500,
      ...options,
    });
  },

  // Action-specific toasts
  saved: (item: string = "ข้อมูล") => {
    return customToast.success(`บันทึก${item}เรียบร้อยแล้ว`, {
      icon: '💾',
      duration: 3000,
    });
  },

  uploaded: (item: string = "ไฟล์") => {
    return customToast.success(`อัปโหลด${item}สำเร็จ`, {
      icon: '📤',
      duration: 3000,
    });
  },

  deleted: (item: string = "รายการ") => {
    return customToast.success(`ลบ${item}เรียบร้อยแล้ว`, {
      icon: '🗑️',
      duration: 3000,
    });
  },

  loginSuccess: () => {
    return customToast.success("เข้าสู่ระบบสำเร็จ", {
      icon: '🔓',
      duration: 2000,
    });
  },

  logoutSuccess: () => {
    return customToast.info("ออกจากระบบเรียบร้อยแล้ว", {
      icon: '👋',
      duration: 2000,
    });
  },

  passwordChanged: () => {
    return customToast.success("เปลี่ยนรหัสผ่านสำเร็จ", {
      icon: '🔐',
      duration: 3000,
    });
  },

  profileUpdated: () => {
    return customToast.success("อัปเดตโปรไฟล์สำเร็จ", {
      icon: '👤',
      duration: 3000,
    });
  },

  // Promise-based toast for async operations
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: any
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        style: {
          borderRadius: '12px',
          fontWeight: '500',
          fontSize: '14px',
          padding: '16px 20px',
          backdropFilter: 'blur(8px)',
          maxWidth: '400px',
        },
        success: {
          style: {
            background: '#ffffff',
            color: '#16a34a',
            border: '1px solid #22c55e',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          icon: '✅',
          duration: 4000,
        },
        error: {
          style: {
            background: '#ffffff',
            color: '#dc2626',
            border: '1px solid #ef4444',
            boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.1), 0 4px 6px -2px rgba(220, 38, 38, 0.05)',
          },
          icon: '❌',
          duration: 5000,
        },
        loading: {
          style: {
            background: '#ffffff',
            color: '#0ea5e9',
            border: '1px solid #38bdf8',
            boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.1), 0 4px 6px -2px rgba(14, 165, 233, 0.05)',
          },
          icon: '⏳',
        },
        ...options,
      }
    );
  },

  // Dismiss specific toast
  dismiss: (toastId?: string) => {
    return toast.dismiss(toastId);
  },

  // Dismiss all toasts
  dismissAll: () => {
    return toast.dismiss();
  },
};

// Export default toast for basic usage
export default customToast;
