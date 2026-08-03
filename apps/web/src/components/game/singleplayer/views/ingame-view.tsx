import { Box } from "@mui/material";
import GuessrMobileUI from "@/components/game/guessing-ui-mobile";
import GuessrUI from "@/components/game/guessing-ui";
import StreetViewPano from "@/components/game/street-view-pano";
import RoundHud from "@/components/game/round-hud";
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
  round?: number;
  totalRounds?: number;
  secondsLeft?: number;
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
  round,
  totalRounds,
  secondsLeft,
}) => {
  const buttonLabel = roundFinished
    ? "DONE"
    : "GUESS";

  return (
    <>
      <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
        {round !== undefined && totalRounds !== undefined && (
          <RoundHud round={round} totalRounds={totalRounds} secondsLeft={secondsLeft} />
        )}
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
          guessingDisabled={guessingDisabled ?? (roundFinished || !guessLocation)}
          mapClicksDisabled={roundFinished}
          onMapClick={onMapClick}
          onGuess={onGuess}
          buttonLabel={buttonLabel}
        />
      ) : (
        <GuessrUI
          targetLocation={targetLocation}
          targetVisible={targetVisible ?? roundFinished}
          guessingDisabled={guessingDisabled ?? (roundFinished || !guessLocation)}
          guessLocation={guessLocation}
          mapClicksDisabled={roundFinished}
          onMapClick={onMapClick}
          onGuess={onGuess}
          buttonLabel={buttonLabel}
        />
      )}
    </>
  );
};

export default InGameView;
