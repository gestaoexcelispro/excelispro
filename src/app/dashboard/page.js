'use client';
import { useLanguage } from '../contexts/LanguageContext';

const translations = {
  'pt-BR': {
    welcome: 'Bem-vindo ao Sistema Interno da ExcelisPro.',
    subtitle: 'Selecione uma opção no menu lateral para iniciar as atividades.',
    quickAccess: 'Acesso Rápido',
    commercial: 'Comercial',
    manageProposals: 'Gerenciar Propostas →',
    projects: 'Projetos',
    viewProjects: 'Ver Projetos Ativos →',
    financial: 'Financeiro',
    viewReceivable: 'Ver Contas a Receber →'
  },
  'en-US': {
    welcome: 'Welcome to ExcelisPro Internal System.',
    subtitle: 'Select an option from the sidebar to start activities.',
    quickAccess: 'Quick Access',
    commercial: 'Commercial',
    manageProposals: 'Manage Proposals →',
    projects: 'Projects',
    viewProjects: 'View Active Projects →',
    financial: 'Financial',
    viewReceivable: 'View Accounts Receivable →'
  }
};

export default function DashboardHome() {
  const { lang } = useLanguage();
  const t = translations[lang] || translations['pt-BR'];

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2A4365', marginBottom: '20px' }}>Painel Geral</h1>
      
      {/* CARD DE BOAS-VINDAS */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '30px', borderLeft: '5px solid #3182ce' }}>
        <h3 style={{ color: '#1a365d', margin: '0 0 10px 0', fontSize: '1.2rem' }}>{t.welcome}</h3>
        <p style={{ color: '#4a5568', margin: 0, fontSize: '0.95rem' }}>{t.subtitle}</p>
      </div>

      {/* SEÇÃO DE ACESSO RÁPIDO */}
      <h2 style={{ color: '#2A4365', fontSize: '1.1rem', marginBottom: '15px' }}>{t.quickAccess}</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* CARD COMERCIAL */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderTop: '4px solid #3182ce' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>{t.commercial}</h4>
          <a href="/dashboard/propostas" style={{ color: '#3182ce', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>{t.manageProposals}</a>
        </div>

        {/* CARD PROJETOS */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderTop: '4px solid #38a169' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>{t.projects}</h4>
          <a href="/dashboard/projetos/lista" style={{ color: '#38a169', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>{t.viewProjects}</a>
        </div>

        {/* CARD FINANCEIRO */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderTop: '4px solid #d69e2e' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>{t.financial}</h4>
          <a href="/dashboard/controladoria/receber" style={{ color: '#d69e2e', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>{t.viewReceivable}</a>
        </div>

      </div>
    </div>
  );
}
