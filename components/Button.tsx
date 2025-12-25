
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const variants = {
    primary: 'bg-gradient-to-br from-[#FF9933] via-[#FF007F] to-[#4B0082] hover:scale-[1.02] active:scale-[0.98] text-white shadow-[0_0_30px_rgba(255,0,127,0.3)] border border-white/10',
    secondary: 'bg-white/5 hover:bg-white/10 text-white backdrop-blur-md border border-white/10 hover:border-white/20',
    outline: 'border-2 border-pink-500/30 hover:border-pink-500 text-pink-500 hover:bg-pink-500/5',
    danger: 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
  };

  return (
    <button 
      className={`px-8 py-4 rounded-[1.25rem] font-black uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
