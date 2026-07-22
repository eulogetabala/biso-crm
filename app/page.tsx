import { redirect } from "next/navigation";
import { ROUTES } from "@/src/constants";

export default function DashboardPage() {
  redirect(ROUTES.private.dashboard);
}
