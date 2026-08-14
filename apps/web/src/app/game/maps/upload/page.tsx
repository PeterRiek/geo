import { auth } from "@/auth";
import GameFallback from "@/components/game/game-fallback";
import UploadMapForm from "@/components/game/menu/UploadMapForm";

const UploadMapPage = async () => {
  const session = await auth();

  if (!session?.accessToken) {
    return (
      <GameFallback
        variant="error"
        title="You need to be signed in to upload a map."
        description="Please sign in and try again."
      />
    );
  }

  return <UploadMapForm />;
};

export default UploadMapPage;
