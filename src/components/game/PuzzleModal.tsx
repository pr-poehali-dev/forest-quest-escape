import { useState } from 'react';
import { Puzzle } from '@/lib/gameData';

interface PuzzleModalProps {
  puzzle: Puzzle;
  onSolve: (optionIndex: number) => void;
  onClose: () => void;
}

const PuzzleModal = ({ puzzle, onSolve, onClose }: PuzzleModalProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    setCorrect(puzzle.options[idx].correct);
    setTimeout(() => {
      onSolve(idx);
      if (puzzle.options[idx].correct) onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="horror-border rounded-lg p-6 max-w-md w-full mx-4 bg-[#080808] animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-yellow-600 text-xl">🔒</span>
          <p className="text-yellow-600 text-xs font-mono uppercase tracking-widest">Загадка</p>
          <button onClick={onClose} className="ml-auto text-gray-600 hover:text-gray-300 text-xs font-mono">
            [✕]
          </button>
        </div>

        <p className="text-gray-200 text-sm font-mono leading-relaxed mb-6 border-l-2 border-yellow-900 pl-3">
          {puzzle.question}
        </p>

        <div className="space-y-2">
          {puzzle.options.map((opt, idx) => {
            let cls = 'location-btn w-full text-left p-3 rounded border border-gray-800 text-sm font-mono text-gray-300 bg-black/50 transition-all duration-200 hover:border-yellow-800';
            if (answered && selected === idx) {
              cls += correct
                ? ' border-green-700 bg-green-950/50 text-green-400'
                : ' border-red-900 bg-red-950/50 text-red-400 animate-bear-shake';
            }
            return (
              <button key={idx} className={cls} onClick={() => handleAnswer(idx)} disabled={answered}>
                <span className="text-gray-600 mr-2">{String.fromCharCode(65 + idx)}.</span>
                {opt.text}
              </button>
            );
          })}
        </div>

        {answered && (
          <p className={`mt-4 text-xs font-mono ${correct ? 'text-green-500' : 'text-red-500'}`}>
            {puzzle.options[selected!].response}
          </p>
        )}
      </div>
    </div>
  );
};

export default PuzzleModal;
