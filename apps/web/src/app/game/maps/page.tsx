import { auth } from "@/auth";
import GameFallback from "@/components/game/game-fallback";
import MapsLibrary from "@/components/game/menu/MapsLibrary";

const MapsPage = async () => {
  const session = await auth();

  if (!session?.accessToken) {
    return (
      <GameFallback
        variant="error"
        title="You need to be signed in to view maps."
        description="Please sign in and try again."
      />
    );
  }

  return <MapsLibrary />;
};

export default MapsPage;
