'use client'

import {
  createContext,
  useContext,
} from 'react'

const LanguageContext = createContext(null)

const PRODUCT_LANGUAGE = 'en-US'

function keepEnglishLanguage() {
  return PRODUCT_LANGUAGE
}

export function LanguageProvider({ children }) {
  return (
    <LanguageContext.Provider
      value={{
        lang: PRODUCT_LANGUAGE,
        changeLanguage: keepEnglishLanguage,
        toggleLanguage: keepEnglishLanguage,
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
