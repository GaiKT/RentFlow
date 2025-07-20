import toast from "react-hot-toast";
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  XCircle,
  Upload,
  Download,
  Save,
  Trash2,
  User,
  Lock,
  Mail
} from "lucide-react";

// Custom toast styles that work with DaisyUI
export const customToast = {
  success: (message: string, options?: any) => {
    return toast.success(message, {
      icon: '✅',
      style: {
        background: 'bg-white',
        color: 'hsl(var(--suc))',
        border: '1px solid hsl(var(--su))',
        borderRadius: '0.5rem',
        fontWeight: '500',
      },
      ...options,
    });
  },

  error: (message: string, options?: any) => {
    return toast.error(message, {
      icon: '❌',
      style: {
        background: 'hsl(var(--er))',
        color: 'hsl(var(--erc))',
        border: '1px solid hsl(var(--er))',
        borderRadius: '0.5rem',
        fontWeight: '500',
      },
      ...options,
    });
  },

  loading: (message: string, options?: any) => {
    return toast.loading(message, {
      icon: '⏳',
      style: {
        background: 'hsl(var(--in))',
        color: 'hsl(var(--inc))',
        border: '1px solid hsl(var(--in))',
        borderRadius: '0.5rem',
        fontWeight: '500',
      },
      ...options,
    });
  },

  info: (message: string, options?: any) => {
    return toast(message, {
      icon: 'ℹ️',
      style: {
        background: 'hsl(var(--in))',
        color: 'hsl(var(--inc))',
        border: '1px solid hsl(var(--in))',
        borderRadius: '0.5rem',
        fontWeight: '500',
      },
      ...options,
    });
  },

  warning: (message: string, options?: any) => {
    return toast(message, {
      icon: '⚠️',
      style: {
        background: 'hsl(var(--wa))',
        color: 'hsl(var(--wac))',
        border: '1px solid hsl(var(--wa))',
        borderRadius: '0.5rem',
        fontWeight: '500',
      },
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
          borderRadius: '0.5rem',
          fontWeight: '500',
        },
        success: {
          style: {
            background: 'hsl(var(--su))',
            color: 'hsl(var(--suc))',
            border: '1px solid hsl(var(--su))',
          },
          icon: '✅',
        },
        error: {
          style: {
            background: 'hsl(var(--er))',
            color: 'hsl(var(--erc))',
            border: '1px solid hsl(var(--er))',
          },
          icon: '❌',
        },
        loading: {
          style: {
            background: 'hsl(var(--in))',
            color: 'hsl(var(--inc))',
            border: '1px solid hsl(var(--in))',
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
