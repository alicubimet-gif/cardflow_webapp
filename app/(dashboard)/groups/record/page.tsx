import { Suspense } from "react";
import RecordClient from "./record-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <RecordClient />
    </Suspense>
  );
}
