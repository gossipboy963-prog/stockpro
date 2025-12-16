import React, { ReactNode } from 'react';

export interface CardProps {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-2xl shadow-sm p-5 border border-stone-100 ${className}`}>
    {children}
  </div>
);

export interface ButtonProps {
  children?: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  className?: string;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
  const baseStyle = "px-4 py-3 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    primary: "bg-stone-800 text-stone-50 hover:bg-stone-700",
    secondary: "bg-stone-200 text-stone-700 hover:bg-stone-300",
    danger: "bg-stone-100 text-red-700 hover:bg-red-50",
    outline: "border border-stone-300 text-stone-600 hover:bg-stone-50"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export const Input = ({ label, value, onChange, type = "text", placeholder = "", className = "" }: any) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder-stone-300"
    />
  </div>
);

export interface BadgeProps {
  children?: ReactNode;
  color?: 'stone' | 'green' | 'red' | 'blue' | 'yellow';
}

export const Badge: React.FC<BadgeProps> = ({ children, color = 'stone' }) => {
  const colors = {
    stone: "bg-stone-100 text-stone-600",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700",
    blue: "bg-sky-50 text-sky-700",
    yellow: "bg-amber-50 text-amber-700",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-md font-medium ${colors[color]}`}>
      {children}
    </span>
  );
};