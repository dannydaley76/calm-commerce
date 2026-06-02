import { Suspense } from "react";
import { AnonymousWorkspaceClient } from "./workspace-client";

export default function AnonymousIdeasPage() {
  return (
    <Suspense fallback={null}>
      <AnonymousWorkspaceClient />
    </Suspense>
  );
}
