import { useRef } from 'react';
import Magnet from './Magnet';
import ClickSpark from './ClickSpark';
import { sounds } from '../../utils/sound';

/**
 * CreativeButton: A tactile, high-craft button component.
 * Integrates:
 * - Magnetic spring attraction towards the cursor
 * - Dynamic particle starburst on click (ClickSpark)
 * - Shimmering light sweep on hover
 * - 3D press feedback (translate-y, micro-scale)
 * - Optional audio feedback
 */
export default function CreativeButton({
  children,
  onClick,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
  size = 'md', // 'sm' | 'md' | 'lg' | 'icon'
  magnetic = true,
  magneticStrength = 3.2,
  spark = true,
  sparkColor = '#967aa1',
  sound = false,
  soundType = 'newOrder',
  className = '',
  disabled = false,
  type = 'button',
  icon: Icon,
  iconPosition = 'left',
  ...props
}) {
  const buttonRef = useRef(null);

  // Variant styling mapped to our 5 luxury palette colors:
  // space_indigo (#192a51), dusty_mauve (#967aa1), lilac_ash (#aaa1c8), thistle (#d5c6e0), lavender_blush (#f5e6e8)
  const variantStyles = {
    primary:
      'bg-gradient-to-r from-space_indigo via-dusty_mauve to-space_indigo bg-[length:200%_auto] hover:bg-[position:right_center] text-white shadow-lg shadow-space_indigo/25 border border-dusty_mauve/40 hover:border-dusty_mauve',
    secondary:
      'bg-thistle-800/80 hover:bg-thistle-700/80 text-space_indigo border border-thistle-600/60 shadow-xs hover:border-dusty_mauve',
    ghost:
      'bg-transparent hover:bg-space_indigo/10 text-space_indigo border border-transparent hover:border-space_indigo/20',
    outline:
      'bg-transparent hover:bg-dusty_mauve/10 text-space_indigo border border-space_indigo/30 hover:border-dusty_mauve shadow-xs',
    danger:
      'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-600/25 border border-rose-500/50',
    success:
      'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-lg shadow-emerald-600/25 border border-emerald-500/50',
  };

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 rounded-xl gap-1.5',
    md: 'text-xs sm:text-sm px-5 py-2.5 rounded-2xl gap-2 font-bold',
    lg: 'text-sm sm:text-base px-7 py-3.5 rounded-2xl gap-2.5 font-bold tracking-wide',
    icon: 'p-2.5 rounded-2xl aspect-square flex items-center justify-center',
  };

  const handleClick = (e) => {
    if (disabled) return;
    if (sound && sounds[soundType]) {
      try {
        sounds[soundType]();
      } catch {
        // Audio policy fallback
      }
    }
    if (onClick) onClick(e);
  };

  const buttonElement = (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={`relative group inline-flex items-center justify-center font-futura transition-all duration-300 ease-out select-none cursor-pointer overflow-hidden active:scale-95 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${
        variantStyles[variant] || variantStyles.primary
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {/* Specular glare shine sweep animation on hover */}
      <span
        aria-hidden="true"
        className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none"
      />

      {/* Button content with optional icons */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {Icon && iconPosition === 'left' && (
          <Icon className="w-4 h-4 transition-transform group-hover:scale-110 duration-200" />
        )}
        <span>{children}</span>
        {Icon && iconPosition === 'right' && (
          <Icon className="w-4 h-4 transition-transform group-hover:translate-x-0.5 duration-200" />
        )}
      </span>
    </button>
  );

  // Wrap in ClickSpark if enabled
  const sparkWrapped = spark ? (
    <ClickSpark sparkColor={sparkColor} sparkCount={7} sparkRadius={26} duration={400}>
      {buttonElement}
    </ClickSpark>
  ) : (
    buttonElement
  );

  // Wrap in Magnet if enabled
  if (magnetic && !disabled) {
    const wrapperWidth = className.split(/\s+/).includes('w-full') ? 'w-full' : '';
    return (
      <Magnet magnetStrength={magneticStrength} padding={45} className={wrapperWidth} innerClassName={wrapperWidth}>
        {sparkWrapped}
      </Magnet>
    );
  }

  return sparkWrapped;
}
