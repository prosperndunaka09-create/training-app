"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { ThemeProviderProps } from "next-themes/dist/types"

type Theme = "dark" | "light" | "system"

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({
  children,
  defaultTheme = "light",
  value: _value,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Only access localStorage on client side
    if (typeof window !== "undefined") {
      try {
        const savedTheme = localStorage.getItem("theme")
        return (savedTheme && (savedTheme === "dark" || savedTheme === "light" || savedTheme === "system")
          ? savedTheme
          : defaultTheme) as Theme
      } catch (error) {
        console.warn('Error reading theme from localStorage:', error);
      }
    }
    return defaultTheme as Theme
  })

  useEffect(() => {
    // Only run on client side with comprehensive safety checks
    if (typeof window === "undefined") return
    
    // Use setTimeout to ensure DOM is fully ready
    const timer = setTimeout(() => {
      try {
        const document = window.document;
        if (!document) {
          console.warn('Document not available');
          return;
        }
        
        const root = document.documentElement;
        if (!root) {
          console.warn('Root element not available');
          return;
        }
        
        const classList = root.classList;
        if (!classList) {
          console.warn('classList not available');
          return;
        }
        
        if (typeof classList.remove !== 'function') {
          console.warn('classList.remove is not a function');
          return;
        }
        
        // Safely remove classes
        try {
          classList.remove("light", "dark");
        } catch (error) {
          console.warn('Error removing theme classes:', error);
        }

        if (theme === "system") {
          try {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
              .matches
              ? "dark"
              : "light"
            
            if (classList && typeof classList.add === 'function') {
              classList.add(systemTheme);
            }
          } catch (error) {
            console.warn('Error setting system theme:', error);
          }
          return
        }

        try {
          if (classList && typeof classList.add === 'function') {
            classList.add(theme);
          }
        } catch (error) {
          console.warn('Error adding theme class:', error);
        }
      } catch (error) {
        console.error('Critical error in theme provider:', error);
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, [theme])

  const value: ThemeContextType = {
    theme,
    setTheme: (theme: Theme) => {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("theme", theme)
        }
        setTheme(theme)
      } catch (error) {
        console.warn('Error setting theme:', error);
      }
    },
  }

  return (
    <ThemeContext.Provider value={value} {...props}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
