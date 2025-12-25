
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
    primary: 'bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white shadow-lg shadow-pink-500/20',
    secondary: 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm',
    outline: 'border border-white/20 hover:border-pink-500/50 text-white',
    danger: 'bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500/20'
  };

  return (
    <button 
      className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <i className="fas fa-spinner fa-spin"></i>
      ) : null}
      {children}
    </button>
  );
};

export default Button;
