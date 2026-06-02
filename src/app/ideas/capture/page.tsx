import { CaptureIdeaClient } from "./capture-idea-client";

export default async function CaptureIdeaPage({
  searchParams,
}: {
  searchParams: Promise<{
    payload?: string;
    workspaceToken?: string;
    anonymousId?: string;
    extensionId?: string;
  }>;
}) {
  const { payload, workspaceToken, anonymousId, extensionId } = await searchParams;

  return (
    <main className="min-h-screen bg-surface-canvas px-6 py-12 text-ink-900 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <CaptureIdeaClient
          anonymousIdParam={anonymousId}
          extensionIdParam={extensionId}
          payloadParam={payload}
          workspaceTokenParam={workspaceToken}
        />
      </div>
    </main>
  );
}
