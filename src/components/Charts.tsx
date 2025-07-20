"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement
);

interface RevenueChartProps {
  data: {
    labels: string[];
    revenue: number[];
  };
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: "รายได้รายเดือน",
        data: data.revenue,
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            family: "Inter, sans-serif",
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: "รายได้รายเดือน",
        font: {
          family: "Inter, sans-serif",
          size: 16,
          weight: "bold" as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          callback: function (value: string | number) {
            return "฿" + Number(value).toLocaleString();
          },
          font: {
            family: "Inter, sans-serif",
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: "Inter, sans-serif",
            size: 11,
          },
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
}

interface RoomStatusChartProps {
  data: {
    available: number;
    occupied: number;
    maintenance: number;
    unavailable: number;
  };
}

export function RoomStatusChart({ data }: RoomStatusChartProps) {
  const chartData = {
    labels: ["ว่าง", "มีผู้เช่า", "ซ่อมแซม", "ไม่พร้อมใช้"],
    datasets: [
      {
        data: [data.available, data.occupied, data.maintenance, data.unavailable],
        backgroundColor: [
          "rgba(16, 185, 129, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderColor: [
          "rgba(16, 185, 129, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(239, 68, 68, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          font: {
            family: "Inter, sans-serif",
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: "สถานะห้องพัก",
        font: {
          family: "Inter, sans-serif",
          size: 16,
          weight: "bold" as const,
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

interface PaymentTrendChartProps {
  data: {
    labels: string[];
    paid: number[];
    pending: number[];
  };
}

export function PaymentTrendChart({ data }: PaymentTrendChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: "ชำระแล้ว",
        data: data.paid,
        borderColor: "rgba(16, 185, 129, 1)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
      {
        label: "รอชำระ",
        data: data.pending,
        borderColor: "rgba(245, 158, 11, 1)",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            family: "Inter, sans-serif",
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: "แนวโน้มการชำระเงิน",
        font: {
          family: "Inter, sans-serif",
          size: 16,
          weight: "bold" as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          font: {
            family: "Inter, sans-serif",
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: "Inter, sans-serif",
            size: 11,
          },
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Line data={chartData} options={options} />
    </div>
  );
}
