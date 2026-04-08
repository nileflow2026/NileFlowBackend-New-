// sessionService.js — in-memory session helpers (wrap tokenBuffer)
import { tokenBuffer } from "./tokenBuffer";

export const saveSession = (token, refreshToken) => {
  tokenBuffer.set({ accessToken: token, refreshToken });
};

export const getToken = () => tokenBuffer.getAccessToken();
export const getRefreshToken = () => tokenBuffer.getRefreshToken();

export const clearSession = () => {
  tokenBuffer.clear();
};
