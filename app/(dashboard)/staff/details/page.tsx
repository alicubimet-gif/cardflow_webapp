import { Suspense } from "react";
import StaffDetailsClient from "./details-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <StaffDetailsClient />
    </Suspense>
  );
}
