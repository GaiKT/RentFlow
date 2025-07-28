import toast, { ToastOptions } from "react-hot-toast";

export const customToast = {
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: 4000,
      ...options,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: 6000,
      ...options,
    });
  },

  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...options,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    return toast(message, {
      duration: 4500,
      ...options,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    return toast(message, {
      duration: 5000,
      ...options,
    });
  },

  // Predefined success messages
  saved: (item: string = "ข้อมูล") => {
    return customToast.success(`บันทึก${item}เรียบร้อยแล้ว`);
  },

  uploaded: (item: string = "ไฟล์") => {
    return customToast.success(`อัปโหลด${item}เรียบร้อยแล้ว`);
  },

  deleted: (item: string = "รายการ") => {
    return customToast.success(`ลบ${item}เรียบร้อยแล้ว`);
  },

  loginSuccess: () => {
    return customToast.success("เข้าสู่ระบบสำเร็จ");
  },

  logoutSuccess: () => {
    return customToast.success("ออกจากระบบเรียบร้อย");
  },

  passwordChanged: () => {
    return customToast.success("เปลี่ยนรหัสผ่านสำเร็จ");
  },

  profileUpdated: () => {
    return customToast.success("อัปเดตโปรไฟล์เรียบร้อย");
  },

  // Promise-based toast for async operations
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success: (data) => typeof success === 'function' ? success(data) : success,
      error: (err) => typeof error === 'function' ? error(err) : error,
    });
  },

  // Custom toast with progress
  withProgress: (message: string, duration: number = 5000) => {
    return toast(message, {
      duration,
      style: {
        '--toast-duration': `${duration}ms`,
      } as React.CSSProperties,
    });
  },

  // Dismissal functions
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  dismissAll: () => {
    toast.dismiss();
  },
};
