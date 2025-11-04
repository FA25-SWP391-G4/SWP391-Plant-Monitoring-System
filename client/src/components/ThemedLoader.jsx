import { useTheme } from 'next-themes';
import Image from 'next/image';

export default function ThemedLoader({ 
  size = 'md', 
  className = '',
  showText = false,
  text = 'Loading...'
}) {
  const { resolvedTheme } = useTheme();
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  // Use white-plant.gif for dark theme, black-plant.gif for light theme
  const gifSrc = resolvedTheme === 'dark' ? '/white-plant.gif' : '/black-plant.gif';
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        <Image 
          src={gifSrc}
          alt="Loading..."
          width={64}
          height={64}
          className="w-full h-full object-contain"
          unoptimized // Allow GIF animation
        />
      </div>
      {showText && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
}