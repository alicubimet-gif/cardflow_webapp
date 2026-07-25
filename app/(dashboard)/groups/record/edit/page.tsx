import { Suspense } from "react";
import EditClient from "./edit-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <EditClient />
    </Suspense>
  );
}
