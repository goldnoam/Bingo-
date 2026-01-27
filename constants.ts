
export const BINGO_MIN = 1;
export const BINGO_MAX = 75;
export const GRID_SIZE = 5;

export const THEME_CONFIG = {
  LIGHT: {
    bg: 'bg-slate-50',
    text: 'text-slate-900',
    card: 'bg-white border-slate-200',
    accent: 'bg-indigo-600',
    button: 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100',
    highlight: 'bg-indigo-100 text-indigo-700'
  },
  DARK: {
    bg: 'bg-slate-950',
    text: 'text-slate-100',
    card: 'bg-slate-900 border-slate-800',
    accent: 'bg-purple-600',
    button: 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700',
    highlight: 'bg-purple-900/40 text-purple-300'
  },
  COLORFUL: {
    bg: 'bg-gradient-to-br from-pink-500 via-orange-400 to-yellow-300',
    text: 'text-slate-900',
    card: 'bg-white/80 backdrop-blur-md border-white/50',
    accent: 'bg-blue-600',
    button: 'bg-white text-blue-600 border-transparent hover:bg-white/90 shadow-lg',
    highlight: 'bg-yellow-400 text-slate-900'
  }
};
