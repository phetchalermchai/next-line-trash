import { Suspense } from "react";
import { TableSkeleton } from "./skeleton";
import ManageComplaintsPage from "@/components/complaint/ManageComplaintsPage";

export default function Page() {
  return (
    <Suspense fallback={<TableSkeleton columns={7} />}>
      <ManageComplaintsPage />
    </Suspense>
  );
}
