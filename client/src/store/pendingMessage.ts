let _pending: string | null = null;

export const pendingMessage = {
  set: (msg: string) => {
    _pending = msg;
  },
  take: () => {
    const m = _pending;
    _pending = null;
    return m;
  },
};
