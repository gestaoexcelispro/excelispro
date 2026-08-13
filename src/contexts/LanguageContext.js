'use client';
import { createContext, useState, useContext } from 'react';

// Cria o cofre do idioma
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // Define o Português como padrão
  const [lang, setLang] = useState('pt-BR');

  // Função que inverte o idioma
  const toggleLanguage = () => {
    setLang((prev) => (prev === 'pt-BR' ? 'en-US' : 'pt-BR'));
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Atalho para as páginas usarem
export function useLanguage() {
  return useContext(LanguageContext);
}
