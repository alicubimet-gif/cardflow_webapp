import { Suspense } from "react";
import GroupDetailsClient from "./details-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <GroupDetailsClient />
    </Suspense>
  );
}
