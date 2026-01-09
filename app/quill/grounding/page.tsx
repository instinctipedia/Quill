import { Suspense } from "react";
import GroundingClient from "./GroundingClient";

export default function GroundingPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}>Loading grounding…</div>}>
      <GroundingClient />
    </Suspense>
  );
}