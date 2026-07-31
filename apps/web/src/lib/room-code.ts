const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_CODE_LENGTH = 6;

export const generateRoomCode = (): string =>
  Array.from(
    { length: ROOM_CODE_LENGTH },
    () => ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
  ).join("");
