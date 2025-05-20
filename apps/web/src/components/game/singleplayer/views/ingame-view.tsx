import { Box } from "@mui/material";
import GuessrMobileUI from "@/components/game/guessing-ui-mobile";
import GuessrUI from "@/components/game/guessing-ui";
import StreetViewPano from "@/components/game/street-view-pano";
import { Coords } from "@/types/geo";

interface Props {
  isMobile: boolean;
  targetLocation: Coords;
  guessLocation?: Coords;
  roundFinished: boolean;
  targetVisible?: boolean;
  guessingDisabled?: boolean;
  onMapClick: (pos: Coords) => void;
  onGuess: () => void;
  moveEnabled?: boolean;
  panEnabled?: boolean;
  zoomEnabled?: boolean;
}

const InGameView: React.FC<Props> = ({
  isMobile,
  targetLocation,
  guessLocation,
  roundFinished,
  targetVisible,
  guessingDisabled,
  onMapClick,
  onGuess,
  moveEnabled,
  panEnabled,
  zoomEnabled,
}) => {
  return (
    <>
      <Box sx={{ width: "100%", height: "100%" }}>
        <StreetViewPano
          location={targetLocation}
          moveEnabled={moveEnabled}
          panEnabled={panEnabled}
          zoomEnabled={zoomEnabled}
        />
      </Box>
      {isMobile ? (
        <GuessrMobileUI
          targetLocation={targetLocation}
          targetVisible={targetVisible ?? roundFinished}
          guessLocation={guessLocation}
          guessingDisabled={guessingDisabled ?? roundFinished}
          onMapClick={onMapClick}
          onGuess={onGuess}
        />
      ) : (
        <GuessrUI
          targetLocation={targetLocation}
          targetVisible={targetVisible ?? roundFinished}
          guessingDisabled={guessingDisabled ?? roundFinished}
          guessLocation={guessLocation}
          mapClicksDisabled={roundFinished}
          onMapClick={onMapClick}
          onGuess={onGuess}
          buttonLabel={
            roundFinished ? "DONE" : guessLocation ? "GUESS" : "PLACE YOUR PIN"
          }
        />
      )}
    </>
  );
};

export default InGameView;
