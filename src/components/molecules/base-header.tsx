"use client"

import { ReactNode } from "react"
import Image from "next/image"

export interface BaseHeaderProps {
  logoSrc?: string
  logoAlt?: string
  brandName?: string
  leftContent?: ReactNode
  rightContent?: ReactNode
  onLogoClick?: () => void
  className?: string
}

export default function BaseHeader({
  logoSrc,
  logoAlt,
  brandName,
  leftContent,
  rightContent,
  className = "",
}: BaseHeaderProps) {
  return (
    <header
      className={`fixed top-0 z-50 w-full bg-card border-b border-border ${className}`}
    >
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-8">
          {(logoSrc || brandName) && (
            <a href={"/"} className="flex items-center">
              {logoSrc && (
                <Image
                  src={logoSrc}
                  alt={logoAlt || "Logo"}
                  width={40}
                  height={40}
                  unoptimized
                />
              )}
              {brandName && (
                <span className="hidden md:inline font-semibold text-xl text-gray-900 dark:text-white">
                  {brandName}
                </span>
              )}
            </a>
          )}
        </div>
        {leftContent && <div className="flex items-center">{leftContent}</div>}
        {rightContent && (
          <div className="flex items-center space-x-3">{rightContent}</div>
        )}
      </div>
    </header>
  )
}
