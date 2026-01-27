
import React from 'react';
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

  // Simple confetti generator
  const renderConfetti = () => {
    if (!player.hasWon) return null;
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'];
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={`confetti ${colors[i % colors.length]}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`
      relative ${currentTheme.card} border-2 p-5 rounded-[2.5rem] shadow-xl overflow-hidden transition-all duration-700
      ${player.hasWon ? 'animate-win-card border-yellow-400 scale-[1.05] z-10' : 'opacity-90'}
    `}>
      {/* Victory Shimmer Effect */}
      {player.hasWon && <div className="absolute inset-0 victory-bg pointer-events-none" />}
      
      {/* Confetti Particles */}
      {renderConfetti()}

      {/* Badge */}
      <div className={`absolute top-0 left-6 px-4 py-1.5 rounded-b-xl text-xs font-bold uppercase tracking-wider z-20 ${player.isComputer ? 'bg-slate-700 text-white' : 'bg-indigo-600 text-white'}`}>
        {player.isComputer ? 'מחשב' : 'שחקן'}
      </div>

      <div className="flex justify-between items-end mb-4 pt-4 relative z-20">
        <h3 className="text-xl font-black">{player.name}</h3>
        {player.hasWon && <span className="text-yellow-500 font-black text-2xl animate-bounce">מנצח! 🏆</span>}
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
                    ? `shadow-inner ${currentTheme.highlight} scale-95 ${isNew ? 'animate-mark' : ''} ${player.hasWon ? 'ring-2 ring-yellow-400 border-yellow-300' : ''}` 
                    : `bg-slate-200/10 hover:bg-slate-200/20 cursor-default`
                  }
                  ${isNew ? 'ring-4 ring-indigo-500 ring-inset animate-pulse z-20' : ''}
                `}
              >
                {cell}
                {isMarked && (
                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden transition-opacity duration-300 ${player.hasWon ? 'opacity-60' : 'opacity-30'}`}>
                    <span className={`font-light transform rotate-12 scale-150 transition-all duration-500 ${player.hasWon ? 'text-yellow-600 scale-[1.8] text-5xl md:text-6xl' : 'text-3xl md:text-5xl'}`}>X</span>
                  </div>
                )}
              </div>
            );
          })
        ))}
      </div>
      
      {/* Progress Footer */}
      <div className="mt-4 flex flex-col gap-2 relative z-20">
        <div className="flex justify-between text-[10px] font-bold opacity-50 px-1">
          <span>התקדמות</span>
          <span>{player.marked.flat().filter(Boolean).length} / {gridSize * gridSize}</span>
        </div>
        <div className="h-2 w-full bg-slate-200/10 rounded-full overflow-hidden">
          <div 
            className={`h-full ${player.hasWon ? 'bg-yellow-400' : currentTheme.accent} transition-all duration-1000 ease-out`} 
            style={{ width: `${(player.marked.flat().filter(Boolean).length / (gridSize * gridSize)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default BingoCard;
