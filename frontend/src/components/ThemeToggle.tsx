import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = ({ theme, onToggle }: { theme: 'light' | 'dark', onToggle: () => void }) => (
  <button 
    onClick={onToggle}
    className="fixed top-8 right-8 p-4 rounded-full neu-button text-accent z-50 hover:scale-105 active:scale-95 transition-all"
    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
  >
    {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
  </button>
);
