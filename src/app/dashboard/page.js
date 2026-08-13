'use client';
import { useLanguage } from '../../contexts/LanguageContext';

const translations = {
  'pt-BR': {
    title: 'Painel Geral',
    welcome: 'Bem-vindo ao Sistema Interno da ExcelisPro. Selecione uma opção no menu lateral para iniciar.'
  },
  'en-US': {
    title: 'General Dashboard',
    welcome: 'Welcome to the ExcelisPro Internal System. Select an option from the sidebar to begin.'
  }
};

export default function DashboardHome() {
  const { lang, toggleLanguage } = useLanguage();
  const t = translations[lang];

  return (
    <div style={{ padding: '40px' }}>
      
      {/* Seletor de Idiomas Padrão Landing Page */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <div style={{ 
          backgroundColor: '#111827', // Fundo azul marinho escuro/preto
          padding: '10px 20px', 
          borderRadius: '8px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '15px',
          fontFamily: 'sans-serif',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          
          {/* Opção Inglês */}
          <div 
            onClick={() => lang !== 'en-US' && toggleLanguage()}
            style={{
              cursor: 'pointer',
              color: lang === 'en-US' ? '#ffffff' : '#9ca3af',
              fontWeight: lang === 'en-US' ? 'bold' : 'normal',
              borderBottom: lang === 'en-US' ? '2px solid #d69e2e' : '2px solid transparent',
              paddingBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🇺🇸</span> English
          </div>

          {/* Separador */}
          <span style={{ color: '#4b5563', fontSize: '1.2rem' }}>|</span>

          {/* Opção Português */}
          <div 
            onClick={() => lang !== 'pt-BR' && toggleLanguage()}
            style={{
              cursor: 'pointer',
              color: lang === 'pt-BR' ? '#ffffff' : '#9ca3af',
              fontWeight: lang === 'pt-BR' ? 'bold' : 'normal',
              borderBottom: lang === 'pt-BR' ? '2px solid #d69e2e' : '2px solid transparent',
              paddingBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🇧🇷</span> Português
          </div>

        </div>
      </div>

      <h1 style={{ color: '#2A4365', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '30px' }}>
        {t.title}
      </h1>
      
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <p style={{ color: '#4a5568' }}>{t.welcome}</p>
      </div>
    </div>
  );
}
