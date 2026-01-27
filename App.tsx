
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, ThemeType, Player, GameSettings, GameStats } from './types';
import { THEME_CONFIG } from './constants';
import { generateBingoCard, shuffleArray } from './utils';
import { TRANSLATIONS, LanguageCode } from './translations';
import BingoCard from './components/BingoCard';
import ThemeSwitcher from './components/ThemeSwitcher';

const App: React.FC = () => {
  // Localization and Display Settings
  const [lang, setLang] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('bingo_lang');
    return (saved as LanguageCode) || 'he';
  });
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    const saved = localStorage.getItem('bingo_font_size');
    return (saved as any) || 'medium';
  });

  // Game State
  const [status, setStatus] = useState<GameStatus>(GameStatus.SETUP);
  const [theme, setTheme] = useState<ThemeType>(ThemeType.DARK);
  const [players, setPlayers] = useState<Player[]>([]);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [remainingNumbers, setRemainingNumbers] = useState<number[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    playerCount: 1,
    computerCount: 1,
    speed: 1500,
    maxNumber: 75,
    gridSize: 5
  });
  const [winner, setWinner] = useState<Player | null>(null);
  const [shareFeedback, setShareFeedback] = useState(false);

  // Statistics State
  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem('bingo_stats');
    return saved ? JSON.parse(saved) : {
      totalGames: 0,
      humanWins: 0,
      computerWins: 0,
      totalDurationMs: 0,
      recentWinners: []
    };
  });

  const timerRef = useRef<any>(null);
  const gameStartTimeRef = useRef<number>(0);
  const currentTheme = THEME_CONFIG[theme];
  const t = TRANSLATIONS[lang];

  // Persist settings
  useEffect(() => {
    localStorage.setItem('bingo_lang', lang);
    localStorage.setItem('bingo_font_size', fontSize);
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, fontSize]);

  useEffect(() => {
    localStorage.setItem('bingo_stats', JSON.stringify(stats));
  }, [stats]);

  // Native Browser TTS
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'zh' ? 'zh-CN' : lang === 'hi' ? 'hi-IN' : lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startGame = () => {
    const newPlayers: Player[] = [];
    for (let i = 0; i < settings.playerCount; i++) {
      newPlayers.push({
        id: `p-${i}`,
        name: `${t.humanPlayers.slice(0, -1)} ${i + 1}`,
        isComputer: false,
        card: generateBingoCard(settings.gridSize, settings.maxNumber),
        marked: Array(settings.gridSize).fill(null).map(() => Array(settings.gridSize).fill(false)),
        hasWon: false
      });
    }
    for (let i = 0; i < settings.computerCount; i++) {
      newPlayers.push({
        id: `c-${i}`,
        name: `${t.compPlayers.slice(0, -1)} ${i + 1}`,
        isComputer: true,
        card: generateBingoCard(settings.gridSize, settings.maxNumber),
        marked: Array(settings.gridSize).fill(null).map(() => Array(settings.gridSize).fill(false)),
        hasWon: false
      });
    }
    setPlayers(newPlayers);
    setCalledNumbers([]);
    const pool = Array.from({ length: settings.maxNumber }, (_, i) => i + 1);
    setRemainingNumbers(shuffleArray(pool));
    setWinner(null);
    gameStartTimeRef.current = Date.now();
    setStatus(GameStatus.PLAYING);
  };

  const restart = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus(GameStatus.SETUP);
  };

  const togglePause = () => {
    setStatus(prev => prev === GameStatus.PLAYING ? GameStatus.PAUSED : GameStatus.PLAYING);
  };

  const drawNextNumber = useCallback(() => {
    if (remainingNumbers.length === 0 || status !== GameStatus.PLAYING) return;
    const [next, ...rest] = remainingNumbers;
    setCalledNumbers([next, ...calledNumbers]);
    setRemainingNumbers(rest);
    speak(next.toString());

    setPlayers(prevPlayers => {
      let gameWonBy: Player | null = null;
      const updatedPlayers = prevPlayers.map(player => {
        const newMarked = player.marked.map((row, r) => 
          row.map((cell, c) => cell || player.card[r][c] === next)
        );
        const isWinner = newMarked.every(row => row.every(m => m));
        const updatedPlayer = { ...player, marked: newMarked, hasWon: isWinner };
        if (isWinner && !gameWonBy) gameWonBy = updatedPlayer;
        return updatedPlayer;
      });
      if (gameWonBy) {
        setWinner(gameWonBy);
        setStatus(GameStatus.WON);
        const duration = Date.now() - gameStartTimeRef.current;
        setStats(prev => ({
          totalGames: prev.totalGames + 1,
          humanWins: gameWonBy?.isComputer ? prev.humanWins : prev.humanWins + 1,
          computerWins: gameWonBy?.isComputer ? prev.computerWins + 1 : prev.computerWins,
          totalDurationMs: prev.totalDurationMs + duration,
          recentWinners: [{ name: gameWonBy!.name, date: new Date().toLocaleDateString(lang) }, ...prev.recentWinners].slice(0, 5)
        }));
        speak(`${gameWonBy?.name} ${t.winMsg}`);
      }
      return updatedPlayers;
    });
  }, [remainingNumbers, calledNumbers, status, lang, t.winMsg]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      timerRef.current = setInterval(drawNextNumber, settings.speed);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status, drawNextNumber, settings.speed]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleShare = async () => {
    const shareText = `${t.winTitle} ${winner?.name} ${t.winMsg}\n${t.stats}:\n- ${t.games}: ${stats.totalGames}\n- ${t.humanWins}: ${stats.humanWins}\n- ${t.avgDur}: ${formatDuration(stats.totalDurationMs / stats.totalGames)}`;
    if (navigator.share) {
      try { await navigator.share({ title: t.title, text: shareText, url: window.location.href }); } catch {}
    } else {
      await navigator.clipboard.writeText(shareText);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    }
  };

  const getFontClass = () => `text-size-${fontSize}`;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${currentTheme.bg} ${currentTheme.text} p-4 md:p-8 overflow-x-hidden ${getFontClass()} ${lang === 'zh' ? 'font-chinese' : lang === 'hi' ? 'font-hindi' : 'font-heebo'}`}>
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        <header className="flex flex-col md:flex-row justify-between items-center gap-6" role="banner">
          <div className="text-center md:text-right">
            <h1 className={`font-black tracking-tighter ${getFontClass()}`}>{t.title}</h1>
            <p className="opacity-70">{t.subtitle}</p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <ThemeSwitcher current={theme} onSelect={setTheme} />
            
            {/* Language Switcher */}
            <div className="flex bg-white/10 p-1 rounded-xl gap-1">
              {(['he', 'en', 'zh', 'hi', 'de', 'es', 'fr'] as LanguageCode[]).map(l => (
                <button key={l} onClick={() => setLang(l)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${lang === l ? 'bg-white text-slate-900 shadow-md' : 'hover:bg-white/10'}`} aria-label={`Switch to ${l}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Font Size Switcher */}
            <div className="flex bg-white/10 p-1 rounded-xl gap-1">
              {(['small', 'medium', 'large'] as const).map(f => (
                <button key={f} onClick={() => setFontSize(f)} className={`px-2 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${fontSize === f ? 'bg-white text-slate-900 shadow-md' : 'hover:bg-white/10'}`} aria-label={`Set font size to ${f}`}>
                  {f.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </header>

        {status === GameStatus.SETUP ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-10 animate-pop">
            <main className={`lg:col-span-2 ${currentTheme.card} border-2 p-8 rounded-3xl shadow-2xl flex flex-col gap-6`}>
              <h2 className="text-2xl font-bold text-center border-b border-slate-200/20 pb-4">{t.settings}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block mb-2 font-semibold">{t.humanPlayers}: {settings.playerCount}</label>
                    <input type="range" min="1" max="4" value={settings.playerCount} onChange={(e) => setSettings({...settings, playerCount: parseInt(e.target.value)})} className="w-full accent-indigo-600 cursor-pointer" />
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold">{t.compPlayers}: {settings.computerCount}</label>
                    <input type="range" min="0" max="4" value={settings.computerCount} onChange={(e) => setSettings({...settings, computerCount: parseInt(e.target.value)})} className="w-full accent-indigo-600 cursor-pointer" />
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold">{t.speed}: {settings.speed / 1000} {t.sec}</label>
                    <input type="range" min="300" max="3000" step="100" value={settings.speed} onChange={(e) => setSettings({...settings, speed: parseInt(e.target.value)})} className="w-full accent-indigo-600 cursor-pointer" />
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block mb-2 font-semibold">{t.maxNum}: {settings.maxNumber}</label>
                    <input type="range" min="20" max="100" step="5" value={settings.maxNumber} onChange={(e) => setSettings({...settings, maxNumber: Math.max(parseInt(e.target.value), settings.gridSize * 2)})} className="w-full accent-indigo-600 cursor-pointer" />
                  </div>
                  <div>
                    <label className="block mb-2 font-semibold">{t.gridSize}: {settings.gridSize}x{settings.gridSize}</label>
                    <input type="range" min="3" max="7" value={settings.gridSize} onChange={(e) => setSettings({...settings, gridSize: parseInt(e.target.value), maxNumber: Math.max(settings.maxNumber, parseInt(e.target.value) * 2)})} className="w-full accent-indigo-600 cursor-pointer" />
                  </div>
                </div>
              </div>
              <button onClick={() => { speak(t.play); startGame(); }} className="mt-4 w-full py-5 rounded-2xl font-black text-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xl">{t.play}</button>
            </main>

            <aside className={`${currentTheme.card} border-2 p-8 rounded-3xl shadow-xl flex flex-col gap-6`}>
              <h2 className="text-xl font-bold border-b border-slate-200/20 pb-4">{t.stats}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-500/10 text-center">
                  <div className="text-2xl font-black">{stats.totalGames}</div>
                  <div className="text-xs opacity-60 font-bold uppercase">{t.games}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-500/10 text-center">
                  <div className="text-2xl font-black">{stats.totalGames > 0 ? formatDuration(stats.totalDurationMs / stats.totalGames) : "0:00"}</div>
                  <div className="text-xs opacity-60 font-bold uppercase">{t.avgDur}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-indigo-500/10 rounded-xl">
                  <span className="font-bold">{t.humanWins}:</span>
                  <span className="text-xl font-black text-indigo-500">{stats.humanWins}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-xl">
                  <span className="font-bold">{t.compWins}:</span>
                  <span className="text-xl font-black text-purple-500">{stats.computerWins}</span>
                </div>
              </div>
              <button onClick={() => confirm(t.reset + '?') && setStats({totalGames:0, humanWins:0, computerWins:0, totalDurationMs:0, recentWinners:[]})} className="mt-auto text-xs opacity-40 hover:opacity-100 hover:text-red-500 transition-all font-bold">{t.reset}</button>
            </aside>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <aside className="lg:col-span-1 space-y-6">
              <div className={`${currentTheme.card} border-2 p-6 rounded-3xl shadow-xl flex flex-col items-center gap-4`}>
                <h3 className="text-lg font-bold opacity-60">{t.lastNum}</h3>
                <div className={`w-32 h-32 rounded-full ${currentTheme.accent} text-white flex items-center justify-center text-6xl font-black shadow-inner animate-pop ring-8 ring-white/10`} aria-live="assertive">
                  {calledNumbers[0] || '...'}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={togglePause} disabled={status === GameStatus.WON} className={`px-4 py-2 rounded-lg font-bold border transition-all ${currentTheme.button}`}>
                    {status === GameStatus.PAUSED ? t.resume : t.pause}
                  </button>
                  <button onClick={restart} className={`px-4 py-2 rounded-lg font-bold border transition-all ${currentTheme.button}`}>{t.restart}</button>
                </div>
              </div>
              <div className={`${currentTheme.card} border-2 p-4 rounded-3xl shadow-xl`}>
                <h3 className="text-sm font-bold opacity-60 mb-3 px-2">{t.calledNums} ({calledNumbers.length}/{settings.maxNumber})</h3>
                <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-48">
                  {Array.from({ length: settings.maxNumber }, (_, i) => i + 1).map(n => (
                    <div key={n} className={`w-7 h-7 text-[10px] flex items-center justify-center rounded-md font-bold transition-all ${calledNumbers.includes(n) ? currentTheme.accent + ' text-white scale-110 shadow-lg' : 'bg-slate-200/20 text-slate-400 opacity-30'}`}>{n}</div>
                  ))}
                </div>
              </div>
            </aside>
            <main className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {players.map(p => <BingoCard key={p.id} player={p} theme={theme} lastCalled={calledNumbers[0]} />)}
              </div>
            </main>
          </div>
        )}

        {status === GameStatus.WON && winner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop" role="dialog" aria-modal="true">
            <div className={`${currentTheme.card} border-4 border-yellow-400 p-10 rounded-[40px] shadow-2xl text-center max-w-lg w-full relative`}>
              <h2 className="text-5xl font-black mb-4 text-yellow-500">{t.winTitle}</h2>
              <div className="text-2xl mb-6"><span className="font-bold underline">{winner.name}</span> {t.winMsg}</div>
              <div className="flex flex-col gap-4">
                <button onClick={handleShare} className="bg-emerald-600 text-white py-4 px-8 rounded-2xl font-black text-xl hover:bg-emerald-700 transition-all shadow-xl">{shareFeedback ? t.copied : t.share}</button>
                <button onClick={restart} className="bg-indigo-600 text-white py-4 px-8 rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl">{t.backMenu}</button>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-auto py-8 text-center opacity-40 text-sm">
          <p>© Noam Gold AI 2026 | <a href="mailto:goldnoamai@gmail.com" className="hover:underline">Send Feedback</a></p>
        </footer>
      </div>
    </div>
  );
};

export default App;
