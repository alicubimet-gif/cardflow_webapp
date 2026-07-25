import { Suspense } from "react";
import SubgroupClient from "./subgroup-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <SubgroupClient />
    </Suspense>
  );
}
