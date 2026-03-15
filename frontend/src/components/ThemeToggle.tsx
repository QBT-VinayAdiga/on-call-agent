import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = ({ theme, onToggle }: { theme: 'light' | 'dark', onToggle: () => void }) => (
  <button 
    onClick={onToggle}
    className="fixed top-8 right-8 p-3 rounded-full bg-secondary-container text-on-secondary-container shadow-elevation-1 hover:shadow-elevation-2 active:scale-95 transition-all z-50 cursor-pointer"
    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
  >
    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
  </button>
);
