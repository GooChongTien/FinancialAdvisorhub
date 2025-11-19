import { create } from 'zustand';

type ChatPanelMode = 'hidden' | 'split' | 'full';

interface ChatPanelState {
  mode: ChatPanelMode;
  chatWidthPercent: number;

  // Actions
  setMode: (mode: ChatPanelMode) => void;
  setChatWidth: (percent: number) => void;
  openSplit: () => void;
  openFull: () => void;
  close: () => void;
  toggle: () => void;
}

export const useChatPanelMode = create<ChatPanelState>((set, get) => ({
  mode: 'hidden',
  chatWidthPercent: 30,

  setMode: (mode) => set({ mode }),

  setChatWidth: (chatWidthPercent) => set({ chatWidthPercent }),

  openSplit: () => set({ mode: 'split' }),

  openFull: () => set({ mode: 'full' }),

  close: () => set({ mode: 'hidden' }),

  toggle: () => {
    const { mode } = get();
    if (mode === 'hidden') {
      set({ mode: 'split' });
    } else if (mode === 'split') {
      set({ mode: 'full' });
    } else {
      set({ mode: 'hidden' });
    }
  },
}));
