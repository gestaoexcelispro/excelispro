'use client';
import { useLanguage } from '../../contexts/LanguageContext';

const translations = {
  'pt-BR': {
    module: 'MÓDULO COMERCIAL',
    dashboard: 'Painel Geral',
    clients: 'Clientes',
    budgets: 'Orçamentos',
    proposals: 'Propostas Comerciais',
    templates: 'Modelos (Templates)',
    services: 'Serviços e Tabela M²'
  },
  'en-US': {
    module: 'COMMERCIAL MODULE',
    dashboard: 'General Dashboard',
    clients: 'Clients',
    budgets: 'Budgets',
    proposals: 'Commercial Proposals',
    templates: 'Templates',
    services: 'Services & M² Table'
  }
};

export default function DashboardLayout({ children }) {
  const { lang } = useLanguage();
  const t = translations[lang] || translations['pt-BR'];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      
      {/* Menu Lateral (Sidebar) */}
      <aside style={{ width: '280px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        
        {/* Cabeçalho do Menu */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1a365d', fontWeight: 'bold' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🏢</span> {t.module}
          </div>
          <span style={{ fontSize: '0.8rem' }}>▲</span>
        </div>

        {/* Itens de Navegação */}
        <nav style={{ padding: '15px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          
          <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', textDecoration: 'none', color: '#4a5568', borderRadius: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>⊞</span> {t.dashboard}
          </a>

          <a href="#clientes" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', textDecoration: 'none', color: '#4a5568', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '1.2rem' }}>👥</span> {t.clients}
            </div>
            <span style={{ backgroundColor: '#e2e8f0', color: '#1a365d', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>1</span>
          </a>

          {/* Nova etapa do fluxo: Orçamentos */}
          <a href="/dashboard/orcamentos" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', textDecoration: 'none', color: '#4a5568', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '1.2rem' }}>📊</span> {t.budgets}
            </div>
          </a>

          <a href="/dashboard/propostas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', textDecoration: 'none', color: '#4a5568', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '1.2rem' }}>📄</span> {t.proposals}
            </div>
            <span style={{ backgroundColor: '#e2e8f0', color: '#1a365d', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>1</span>
          </a>

          <a href="#modelos" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', textDecoration: 'none', color: '#4a5568', borderRadius: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>📚</span> {t.templates}
          </a>

          <a href="/dashboard/servicos" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', textDecoration: 'none', color: '#4a5568', borderRadius: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🏷️</span> {t.services}
          </a>
        </nav>
      </aside>

      {/* Área Principal de Conteúdo */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
