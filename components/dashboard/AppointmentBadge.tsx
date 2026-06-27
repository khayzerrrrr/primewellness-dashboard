import { Badge } from "@/components/ui/badge";
import { APPOINTMENT_STATUS_COLORS } from "@/lib/constants";
import type { AppointmentStatus } from "@/types";

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  checked_in: "Check In",
  in_progress: "Sedang Terapi",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  no_show: "Tidak Hadir",
};

interface AppointmentBadgeProps {
  status: AppointmentStatus;
}

export function AppointmentBadge({ status }: AppointmentBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${APPOINTMENT_STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
