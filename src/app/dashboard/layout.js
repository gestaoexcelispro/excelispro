'use client';
import { useState } from 'react';
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

  // Estados para controlar o recolhimento (collapse)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModuleOpen, setIsModuleOpen] = useState(true);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* Botão flutuante para expandir/ocultar a Sidebar inteira */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          left: isSidebarOpen ? '260px' : '15px',
          zIndex: 1100,
          backgroundColor: '#1d4ed8',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          cursor: 'pointer',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          transition: 'left 0.3s ease'
        }}
        title={isSidebarOpen ? 'Ocultar Menu' : 'Mostrar Menu'}
      >
        {isSidebarOpen ? '◀' : '▶'}
      </button>

      {/* Menu Lateral (Sidebar) */}
      <aside style={{ 
        width: isSidebarOpen ? '280px' : '0px', 
        backgroundColor: '#ffffff', 
        borderRight: isSidebarOpen ? '1px solid #e2e8f0' : 'none', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.3s ease, border 0.3s ease',
        whiteSpace: 'nowrap',
        zIndex: 1000
      }}>
        
        {/* Cabeçalho do Módulo Comercial com botão de recolher itens do módulo */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1a365d', fontWeight: 'bold' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <span>🏢</span> <span style={{ fontSize: '0.9rem', textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.module}</span>
          </div>
          <button 
            onClick={() => setIsModuleOpen(!isModuleOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a365d', fontWeight: 'bold', fontSize: '0.8rem' }}
            title={isModuleOpen ? 'Recolher Módulo' : 'Expandir Módulo'}
          >
            {isModuleOpen ? '▲' : '▼'}
          </button>
        </div>

        {/* Itens de Navegação do Módulo (Ocultam se isModuleOpen for falso) */}
        {isModuleOpen && (
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

            <a href="/dashboard/modelos" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', textDecoration: 'none', color: '#4a5568', borderRadius: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>📚</span> {t.templates}
            </a>

            <a href="/dashboard/servicos" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', textDecoration: 'none', color: '#4a5568', borderRadius: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🏷️</span> {t.services}
            </a>
          </nav>
        )}
      </aside>

      {/* Área Principal de Conteúdo */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
