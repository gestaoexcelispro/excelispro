'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

const LanguageContext = createContext(null)

const DEFAULT_LANGUAGE = 'en-US'
const STORAGE_KEY = 'ritsuflow-language'
const SUPPORTED_LANGUAGES = ['en-US', 'pt-BR']

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(DEFAULT_LANGUAGE)

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(
      STORAGE_KEY
    )

    if (SUPPORTED_LANGUAGES.includes(savedLanguage)) {
      setLang(savedLanguage)
    }
  }, [])

  function changeLanguage(language) {
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return
    }

    setLang(language)
    window.localStorage.setItem(STORAGE_KEY, language)
  }

  function toggleLanguage() {
    const nextLanguage =
      lang === 'en-US' ? 'pt-BR' : 'en-US'

    changeLanguage(nextLanguage)
  }

  return (
    <LanguageContext.Provider
      value={{
        lang,
        changeLanguage,
        toggleLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider'
    )
  }

  return context
}
