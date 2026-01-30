
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
    primary: 'bg-white text-black hover:bg-gray-200 border border-transparent shadow-[0_0_20px_rgba(255,255,255,0.15)]',
    secondary: 'bg-neutral-900 text-white border border-neutral-800 hover:border-neutral-600',
    outline: 'bg-transparent border border-white/30 text-white hover:border-white hover:bg-white/5',
    danger: 'bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20'
  };

  return (
    <button 
      className={`px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
