import { auth } from "@/auth";
import GameFallback from "@/components/game/game-fallback";
import UploadMapForm from "@/components/game/menu/UploadMapForm";

interface UserMe {
  permissions?: string[];
}

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

  let canManageMaps = false;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    });
    if (res.ok) {
      const me: UserMe = await res.json();
      canManageMaps = me.permissions?.includes("MANAGE_MAPS") ?? false;
    }
  } catch {
    canManageMaps = false;
  }

  if (!canManageMaps) {
    return (
      <GameFallback
        variant="error"
        title="You don't have permission to upload maps."
        description="Ask an admin to grant you the MANAGE_MAPS permission."
      />
    );
  }

  return <UploadMapForm />;
};

export default UploadMapPage;
