import React, { useMemo } from 'react';
import { Player, ThemeType } from '../types';
import { THEME_CONFIG } from '../constants';

interface BingoCardProps {
  player: Player;
  theme: ThemeType;
  lastCalled?: number;
}

const BingoCard: React.FC<BingoCardProps> = ({ player, theme, lastCalled }) => {
  const currentTheme = THEME_CONFIG[theme];
  const gridSize = player.card.length;

  // Optimized confetti generator with variety
  const renderConfetti = useMemo(() => {
    if (!player.hasWon) return null;
    
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-yellow-400', 
      'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-orange-500', 'bg-cyan-400'
    ];
    
    const shapes = ['rounded-none', 'rounded-full', 'clip-triangle'];
    
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
        {Array.from({ length: 35 }).map((_, i) => {
          const color = colors[i % colors.length];
          const shape = shapes[i % shapes.length];
          const delay = Math.random() * 4;
          const left = Math.random() * 100;
          const duration = 3 + Math.random() * 2;
          const size = 6 + Math.random() * 8;

          return (
            <div
              key={i}
              className={`confetti ${color} ${shape}`}
              style={{
                left: `${left}%`,
                top: `-20px`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                opacity: 0.8,
                clipPath: shape === 'clip-triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined
              }}
            />
          );
        })}
      </div>
    );
  }, [player.hasWon]);

  return (
    <div className={`
      relative ${currentTheme.card} border-2 p-5 rounded-[2.5rem] shadow-xl overflow-hidden transition-all duration-700
      hover:scale-[1.01] hover:shadow-2xl group
      ${player.hasWon ? 'animate-win-card border-amber-400 ring-4 ring-amber-400/20 z-10' : 'opacity-95'}
    `}>
      {/* Victory Effects */}
      {player.hasWon && (
        <>
          <div className="absolute inset-0 victory-bg pointer-events-none z-0" />
          <div className="card-shine" />
          {renderConfetti}
        </>
      )}

      {/* Badge */}
      <div className={`absolute top-0 left-6 px-4 py-1.5 rounded-b-xl text-xs font-bold uppercase tracking-wider z-20 ${player.isComputer ? 'bg-slate-700 text-white' : 'bg-indigo-600 text-white shadow-lg'}`}>
        {player.isComputer ? 'מחשב' : 'שחקן'}
      </div>

      <div className="flex justify-between items-end mb-4 pt-4 relative z-20">
        <h3 className="text-xl font-black transition-transform group-hover:translate-x-1 drop-shadow-sm">{player.name}</h3>
        {player.hasWon && <span className="text-amber-500 font-black text-2xl animate-bounce drop-shadow-md">מנצח! 🏆</span>}
      </div>

      <div 
        className="grid gap-1 md:gap-2 select-none relative z-10"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {player.card.map((row, r) => (
          row.map((cell, c) => {
            const isMarked = player.marked[r][c];
            const isNew = cell === lastCalled;

            return (
              <div 
                key={`${r}-${c}`}
                className={`
                  aspect-square rounded-lg md:rounded-xl flex items-center justify-center text-sm md:text-xl font-black relative transition-all duration-300
                  ${isMarked 
                    ? `shadow-inner ${currentTheme.highlight} scale-95 ${isNew ? 'animate-mark' : ''} ${player.hasWon ? 'ring-2 ring-amber-400 border-amber-300 shadow-amber-500/50' : ''}` 
                    : `bg-slate-200/10 hover:bg-slate-200/20 cursor-default`
                  }
                  ${isNew ? 'ring-4 ring-indigo-500 ring-inset animate-pulse z-20' : ''}
                `}
              >
                <span className="relative z-10">{cell}</span>
                {isNew && (
                  <div className="absolute inset-0 rounded-lg md:rounded-xl bg-white/30 animate-ping pointer-events-none z-0"></div>
                )}
                {isMarked && (
                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden transition-opacity duration-300 ${player.hasWon ? 'opacity-80' : 'opacity-30'}`}>
                    <span className={`font-light transform rotate-12 scale-150 transition-all duration-500 ${player.hasWon ? 'text-amber-600 scale-[2] text-5xl md:text-6xl drop-shadow-lg' : 'text-3xl md:text-5xl'}`}>X</span>
                  </div>
                )}
              </div>
            );
          })
        ))}
      </div>
      
      {/* Progress Footer */}
      <div className="mt-4 flex flex-col gap-2 relative z-20">
        <div className="flex justify-between text-[10px] font-bold opacity-70 px-1">
          <span>התקדמות</span>
          <span>{player.marked.flat().filter(Boolean).length} / {gridSize * gridSize}</span>
        </div>
        <div className="h-2.5 w-full bg-slate-200/20 rounded-full overflow-hidden shadow-inner">
          <div 
            className={`h-full ${player.hasWon ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : currentTheme.accent} transition-all duration-1000 ease-out`} 
            style={{ width: `${(player.marked.flat().filter(Boolean).length / (gridSize * gridSize)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default BingoCard;