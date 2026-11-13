import React from 'react';
import { Sparkles } from 'lucide-react';

interface NutriLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  light?: boolean;
}

export const NutriLogo: React.FC<NutriLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  light = false,
}) => {
  const iconSizes = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-14 h-14 rounded-2xl',
    xl: 'w-16 h-16 rounded-3xl',
  };

  const titleSizes = {
    sm: 'text-sm font-black',
    md: 'text-base font-black',
    lg: 'text-2xl font-black',
    xl: 'text-3xl font-black',
  };

  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
  };

  return (
    <div className="flex items-center gap-3 select-none group cursor-pointer">
      {/* Símbolo Animado do Logotipo: Folha/Broto da Nutrição + Pulso de Vitalidade com Brilhos */}
      <div className="relative">
        {/* Glow de fundo animado */}
        <div
          className={`absolute inset-0 bg-gradient-to-tr from-emerald-400 via-teal-300 to-amber-300 rounded-2xl blur-md opacity-40 group-hover:opacity-75 transition duration-500 animate-pulse`}
        />

        <div
          className={`relative ${iconSizes[size]} bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 border border-white/30 transform group-hover:scale-105 group-hover:rotate-3 transition duration-300 ease-out`}
        >
          {/* SVG Customizado: Folha Dinâmica + Curva de Energia Vital */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3/5 h-3/5 text-white transition-transform duration-500 group-hover:scale-110"
          >
            {/* Folha Orgânica */}
            <path
              d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
              fill="rgba(255, 255, 255, 0.2)"
              className="animate-pulse"
            />
            {/* Nervura da folha / Batimento cardíaco suave */}
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.5 12 13 14 8" stroke="currentColor" />
          </svg>

          {/* Partícula / Sparkle com animação de flutuação */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-300 text-amber-900 rounded-full flex items-center justify-center shadow-xs animate-bounce">
            <Sparkles className="w-2.5 h-2.5 text-amber-900" />
          </div>
        </div>
      </div>

      {/* Tipografia da Marca: Nutri Motta com gradiente alegre */}
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span
            className={`${titleSizes[size]} tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent`}
          >
            Nutri Motta
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
        </div>
        {showSubtitle && (
          <span
            className={`${subtitleSizes[size]} font-semibold tracking-wide block ${
              light ? 'text-emerald-100' : 'text-slate-400'
            }`}
          >
            Nutrição • Saúde • Vida
          </span>
        )}
      </div>
    </div>
  );
};

