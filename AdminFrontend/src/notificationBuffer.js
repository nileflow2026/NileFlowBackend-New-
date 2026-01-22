// In-memory notification state shared across components
let hasNew = false;
let lastSeen = null;
const subscribers = new Set();

export const getHasNew = () => hasNew;
export const setHasNew = (value) => {
  hasNew = !!value;
  subscribers.forEach((s) => s(hasNew));
};

export const getLastSeen = () => lastSeen;
export const setLastSeen = (date) => {
  lastSeen = date || new Date();
};

export const subscribe = (cb) => {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
};

export default { getHasNew, setHasNew, getLastSeen, setLastSeen, subscribe };
