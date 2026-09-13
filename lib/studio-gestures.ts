type Actions = {
  isHolding: () => boolean;
  select: (id: string) => void;
  pick: (id: string) => void;
  throw: () => void;
};

export function createStudioGestures(actions: Actions) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: string | null = null;
  let holding = false;
  function cancel() {
    clearTimeout(timer);
    timer = undefined;
    pending = null;
  }
  return {
    cancel,
    click(id: string | null, touch = false) {
      const held = actions.isHolding();
      if (touch) {
        cancel();
        if (!held && id) actions.select(id);
        return;
      }
      if (timer !== undefined && holding === held && (held || pending === id)) {
        cancel();
        if (held) actions.throw();
        else if (id) actions.pick(id);
        return;
      }
      cancel();
      holding = held;
      pending = id;
      timer = setTimeout(() => {
        cancel();
        if (!held && !actions.isHolding() && id) actions.select(id);
      }, 400);
    },
  };
}
