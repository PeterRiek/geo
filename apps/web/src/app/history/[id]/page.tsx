import { auth } from "@/auth";
import GameFallback from "@/components/game/game-fallback";
import HistoryDetail from "@/components/game/history/history-detail";

const HistoryDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const session = await auth();

  if (!session?.accessToken || !session.user?.name) {
    return (
      <GameFallback
        variant="error"
        title="You need to be signed in to view this game."
        description="Please sign in and try again."
      />
    );
  }

  return <HistoryDetail id={id} username={session.user.name} />;
};

export default HistoryDetailPage;
