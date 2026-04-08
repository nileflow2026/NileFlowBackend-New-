let accessToken = null;
let user = null;

export const tokenBuffer = {
  set({ accessToken: at, user: u }) {
    if (at) accessToken = at;
    if (u) user = u;
  },

  getAccessToken() {
    return accessToken;
  },

  clear() {
    accessToken = null;
    user = null;
  },

  getUser() {
    return user;
  },
};
