'use client';
import { useLanguage } from '../../contexts/LanguageContext';

const translations = {
  'pt-BR': {
    title: 'Painel Geral',
    welcome: 'Bem-vindo ao Sistema Interno da ExcelisPro.',
    subtitle: 'Selecione uma opção no menu lateral para iniciar as atividades.',
    quickAccess: 'Acesso Rápido',
    commercial: 'Comercial',
    projects: 'Projetos',
    financial: 'Financeiro'
  },
  'en-US': {
    title: 'General Dashboard',
    welcome: 'Welcome to the ExcelisPro Internal System.',
    subtitle: 'Select an option from the sidebar to begin your activities.',
    quickAccess: 'Quick Access',
    commercial: 'Commercial',
    projects: 'Projects',
    financial: 'Financial'
  }
};

export default function DashboardHome() {
  const { lang } = useLanguage();
  const t = translations[lang] || translations['pt-BR'];

  return (
    <div style={{ padding: '40px' }}>
      
      {/* Título e Boas-vindas */}
      <h1 style={{ color: '#2A4365', margin: '0 0 10px 0' }}>{t.title}</h1>
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#1a365d' }}>{t.welcome}</h2>
        <p style={{ color: '#4a5568', margin: 0 }}>{t.subtitle}</p>
      </div>

      {/* Cards de Atalho (Para preencher o espaço e dar utilidade) */}
      <h3 style={{ color: '#2d3748', marginBottom: '20px' }}>{t.quickAccess}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #3182ce', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>{t.commercial}</h4>
          <a href="/dashboard/propostas" style={{ color: '#3182ce', textDecoration: 'none', fontWeight: 'bold' }}>Gerenciar Propostas →</a>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #48bb78', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>{t.projects}</h4>
          <a href="/dashboard/projetos/lista" style={{ color: '#48bb78', textDecoration: 'none', fontWeight: 'bold' }}>Ver Projetos Ativos →</a>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #ecc94b', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>{t.financial}</h4>
          <a href="/dashboard/controladoria/receber" style={{ color: '#ecc94b', textDecoration: 'none', fontWeight: 'bold' }}>Ver Contas a Receber →</a>
        </div>

      </div>
    </div>
  );
}
