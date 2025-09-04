interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses: Record<NonNullable<LogoProps['size']>, string> = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  }

  return (
    <div
      className={`font-sans font-bold ${sizeClasses[size]} flex items-center ${className}`}
    >
      <span className="text-gray-400">My</span>
      <span className="text-black">CrediBro</span>
    </div>
  )
}
