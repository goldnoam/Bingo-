
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, ThemeType, Player, GameSettings, GameStats } from './types';
import { THEME_CONFIG } from './constants';
import { generateBingoCard, shuffleArray } from './utils';
import BingoCard from './components/BingoCard';
import ThemeSwitcher from './components/ThemeSwitcher';

const App: React.FC = () => {
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

  // Persist stats
  useEffect(() => {
    localStorage.setItem('bingo_stats', JSON.stringify(stats));
  }, [stats]);

  // Initialize Game
  const startGame = () => {
    const newPlayers: Player[] = [];
    
    // Human players
    for (let i = 0; i < settings.playerCount; i++) {
      newPlayers.push({
        id: `p-${i}`,
        name: `שחקן ${i + 1}`,
        isComputer: false,
        card: generateBingoCard(settings.gridSize, settings.maxNumber),
        marked: Array(settings.gridSize).fill(null).map(() => Array(settings.gridSize).fill(false)),
        hasWon: false
      });
    }

    // Computer players
    for (let i = 0; i < settings.computerCount; i++) {
      newPlayers.push({
        id: `c-${i}`,
        name: `מחשב ${i + 1}`,
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
    const newCalled = [next, ...calledNumbers];
    
    setCalledNumbers(newCalled);
    setRemainingNumbers(rest);

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
        
        // Update Stats
        const duration = Date.now() - gameStartTimeRef.current;
        const winnerData = gameWonBy as Player;
        setStats(prev => ({
          totalGames: prev.totalGames + 1,
          humanWins: winnerData.isComputer ? prev.humanWins : prev.humanWins + 1,
          computerWins: winnerData.isComputer ? prev.computerWins + 1 : prev.computerWins,
          totalDurationMs: prev.totalDurationMs + duration,
          recentWinners: [{ 
            name: winnerData.name, 
            date: new Date().toLocaleDateString('he-IL') 
          }, ...prev.recentWinners].slice(0, 5)
        }));
      }

      return updatedPlayers;
    });
  }, [remainingNumbers, calledNumbers, status]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      timerRef.current = setInterval(() => {
        drawNextNumber();
      }, settings.speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, drawNextNumber, settings.speed]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const averageDuration = stats.totalGames > 0 ? formatDuration(stats.totalDurationMs / stats.totalGames) : "0:00";

  const handleShare = async () => {
    const shareText = `ניצחתי במשחק 'איקסים בריבוע'! 🏆 

סטטיסטיקות גלובליות שלי:
• סה"כ משחקים: ${stats.totalGames}
• ניצחונות שחקן: ${stats.humanWins}
• משך ממוצע: ${averageDuration}

בואו לשחק גם בבינגו המהיר והצבעוני! ${window.location.origin}${window.location.pathname}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'איקסים בריבוע - Bingo Challenge',
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
      } catch (err) {
        console.error('Error copying to clipboard:', err);
      }
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${currentTheme.bg} ${currentTheme.text} p-4 md:p-8 overflow-x-hidden`}>
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        <header className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-right">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">איקסים בריבוע</h1>
            <p className="opacity-70 text-lg">בינגו מהיר, צבעוני וממכר</p>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeSwitcher current={theme} onSelect={setTheme} />
          </div>
        </header>

        {status === GameStatus.SETUP ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-10 animate-pop">
            {/* Settings Card */}
            <div className={`lg:col-span-2 ${currentTheme.card} border-2 p-8 rounded-3xl shadow-2xl flex flex-col gap-6`}>
              <h2 className="text-2xl font-bold text-center border-b border-slate-200/20 pb-4">הגדרות משחק</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block mb-2 font-semibold">שחקנים אנושיים: {settings.playerCount}</label>
                    <input 
                      type="range" min="1" max="4" 
                      value={settings.playerCount}
                      onChange={(e) => setSettings({...settings, playerCount: parseInt(e.target.value)})}
                      className="w-full accent-indigo-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 font-semibold">יריבי מחשב: {settings.computerCount}</label>
                    <input 
                      type="range" min="0" max="4" 
                      value={settings.computerCount}
                      onChange={(e) => setSettings({...settings, computerCount: parseInt(e.target.value)})}
                      className="w-full accent-indigo-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold">מהירות קריאה: {settings.speed / 1000} שניות</label>
                    <input 
                      type="range" min="300" max="3000" step="100"
                      value={settings.speed}
                      onChange={(e) => setSettings({...settings, speed: parseInt(e.target.value)})}
                      className="w-full accent-indigo-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block mb-2 font-semibold">מספר מקסימלי: {settings.maxNumber}</label>
                    <input 
                      type="range" min="20" max="100" step="5"
                      value={settings.maxNumber}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSettings({...settings, maxNumber: Math.max(val, settings.gridSize * 2)});
                      }}
                      className="w-full accent-indigo-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold">גודל הלוח: {settings.gridSize}x{settings.gridSize}</label>
                    <input 
                      type="range" min="3" max="7" 
                      value={settings.gridSize}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSettings({
                          ...settings, 
                          gridSize: val,
                          maxNumber: Math.max(settings.maxNumber, val * 2)
                        });
                      }}
                      className="w-full accent-indigo-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={startGame}
                className="mt-4 w-full py-5 rounded-2xl font-black text-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-500/30"
              >
                בואו נשחק!
              </button>
            </div>

            {/* Statistics Card */}
            <div className={`${currentTheme.card} border-2 p-8 rounded-3xl shadow-xl flex flex-col gap-6`}>
              <h2 className="text-xl font-bold border-b border-slate-200/20 pb-4">סטטיסטיקה</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-500/10 text-center">
                  <div className="text-2xl font-black">{stats.totalGames}</div>
                  <div className="text-xs opacity-60 font-bold uppercase">משחקים</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-500/10 text-center">
                  <div className="text-2xl font-black">{averageDuration}</div>
                  <div className="text-xs opacity-60 font-bold uppercase">משך ממוצע</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-indigo-500/10 rounded-xl">
                  <span className="font-bold">ניצחונות שחקן:</span>
                  <span className="text-xl font-black text-indigo-500">{stats.humanWins}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-xl">
                  <span className="font-bold">ניצחונות מחשב:</span>
                  <span className="text-xl font-black text-purple-500">{stats.computerWins}</span>
                </div>
              </div>

              {stats.recentWinners.length > 0 && (
                <div className="mt-2">
                  <h3 className="text-sm font-bold opacity-40 mb-3 px-1">מנצחים אחרונים:</h3>
                  <div className="space-y-2">
                    {stats.recentWinners.map((w, idx) => (
                      <div key={idx} className="flex justify-between text-sm p-2 bg-slate-200/5 rounded-lg">
                        <span className="font-semibold">{w.name}</span>
                        <span className="opacity-50 text-xs">{w.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={() => {
                  if(confirm('האם אתה בטוח שברצונך לאפס את כל הסטטיסטיקות?')) {
                    setStats({
                      totalGames: 0,
                      humanWins: 0,
                      computerWins: 0,
                      totalDurationMs: 0,
                      recentWinners: []
                    });
                  }
                }}
                className="mt-auto text-xs opacity-40 hover:opacity-100 hover:text-red-500 transition-all font-bold"
              >
                איפוס נתונים
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              <div className="lg:col-span-1 space-y-6">
                <div className={`${currentTheme.card} border-2 p-6 rounded-3xl shadow-xl flex flex-col items-center gap-4`}>
                  <h3 className="text-lg font-bold opacity-60">המספר האחרון</h3>
                  <div className={`w-32 h-32 rounded-full ${currentTheme.accent} text-white flex items-center justify-center text-6xl font-black shadow-inner animate-pop ring-8 ring-white/10`}>
                    {calledNumbers[0] || '...'}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={togglePause}
                      disabled={status === GameStatus.WON}
                      className={`px-4 py-2 rounded-lg font-bold border transition-all ${currentTheme.button}`}
                    >
                      {status === GameStatus.PAUSED ? 'המשך' : 'השהה'}
                    </button>
                    <button 
                      onClick={restart}
                      className={`px-4 py-2 rounded-lg font-bold border transition-all ${currentTheme.button}`}
                    >
                      התחל מחדש
                    </button>
                  </div>
                </div>

                <div className={`${currentTheme.card} border-2 p-4 rounded-3xl shadow-xl`}>
                  <h3 className="text-sm font-bold opacity-60 mb-3 px-2">מספרים שנקראו ({calledNumbers.length}/{settings.maxNumber})</h3>
                  <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-48 scrollbar-thin">
                    {Array.from({ length: settings.maxNumber }, (_, i) => i + 1).map(n => (
                      <div 
                        key={n} 
                        className={`w-7 h-7 text-[10px] flex items-center justify-center rounded-md font-bold transition-all duration-300 ${calledNumbers.includes(n) ? currentTheme.accent + ' text-white scale-110 shadow-lg' : 'bg-slate-200/20 text-slate-400 opacity-30'}`}
                      >
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {players.map(player => (
                    <BingoCard 
                      key={player.id} 
                      player={player} 
                      theme={theme}
                      lastCalled={calledNumbers[0]}
                    />
                  ))}
                </div>
              </div>

            </div>
          </>
        )}

        {status === GameStatus.WON && winner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop">
            <div className={`${currentTheme.card} border-4 border-yellow-400 p-10 rounded-[40px] shadow-2xl text-center max-w-lg w-full relative overflow-hidden`}>
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-5 left-10 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                <div className="absolute top-20 right-20 w-3 h-3 bg-blue-500 rounded-full animate-ping delay-75"></div>
                <div className="absolute bottom-10 left-20 w-5 h-5 bg-yellow-500 rounded-full animate-ping delay-150"></div>
              </div>

              <h2 className="text-5xl font-black mb-4 text-yellow-500">בינגו!</h2>
              <div className="text-2xl mb-6">
                <span className="font-bold underline">{winner.name}</span> ניצח את המשחק!
              </div>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleShare}
                  className="bg-emerald-600 text-white py-4 px-8 rounded-2xl font-black text-xl hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2"
                >
                  {shareFeedback ? 'הועתק! ✅' : 'שתף ניצחון 🚀'}
                </button>
                <button 
                  onClick={restart}
                  className="bg-indigo-600 text-white py-4 px-8 rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-500/30"
                >
                  חזרה לתפריט
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
