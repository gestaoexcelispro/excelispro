'use client';
import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const translations = {
  'pt-BR': {
    company: 'ExcelisPro',
    subtitle: 'Consultoria e Gestão de Obras',
    module: 'MÓDULO COMERCIAL',
    dashboard: 'Painel Geral',
    clients: 'Clientes',
    budgets: 'Orçamentos',
    proposals: 'Propostas Comerciais',
    templates: 'Modelos (Templates)',
    services: 'Serviços e Tabela M²',
    logout: 'Sair'
  },
  'en-US': {
    company: 'ExcelisPro',
    subtitle: 'Consulting & Construction Management',
    module: 'COMMERCIAL MODULE',
    dashboard: 'General Dashboard',
    clients: 'Clients',
    budgets: 'Budgets',
    proposals: 'Commercial Proposals',
    templates: 'Templates',
    services: 'Services & M² Table',
    logout: 'Logout'
  }
};

export default function DashboardLayout({ children }) {
  const { lang, setLang } = useLanguage();
  const t = translations[lang] || translations['pt-BR'];

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModuleOpen, setIsModuleOpen] = useState(true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      
      {/* HEADER FIXA NO TOPO COM A LOGO DA EMPRESA */}
      <header style={{ 
        position: 'sticky', top: 0, zIndex: 1200, 
        backgroundColor: '#1a365d', color: 'white', 
        padding: '12px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Botão para recolher/expandir sidebar */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              backgroundColor: '#2b6cb0', color: 'white', border: 'none',
              borderRadius: '6px', width: '32px', height: '32px',
              cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title={isSidebarOpen ? 'Ocultar Menu' : 'Mostrar Menu'}
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>

          {/* Logo e Nome da Empresa */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#3182ce', color: 'white', fontWeight: 'bold', width: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              EP
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '0.5px' }}>{t.company}</h2>
              <span style={{ fontSize: '0.7rem', color: '#90cdf4' }}>{t.subtitle}</span>
            </div>
          </div>
        </div>

        {/* Seletor de Idioma na Header */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#2a4365', padding: '4px', borderRadius: '6px' }}>
          <button 
            onClick={() => setLang('pt-BR')} 
            style={{ 
              background: lang === 'pt-BR' ? '#3182ce' : 'transparent', 
              color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' 
            }}
          >
            PT
          </button>
          <button 
            onClick={() => setLang('en-US')} 
            style={{ 
              background: lang === 'en-US' ? '#3182ce' : 'transparent', 
              color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' 
            }}
          >
            EN
          </button>
        </div>
      </header>

      {/* CORPO DO DASHBOARD (SIDEBAR + CONTEÚDO) */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        
        {/* Menu Lateral (Sidebar) */}
        <aside style={{ 
          width: isSidebarOpen ? '280px' : '0px', 
          backgroundColor: '#ffffff', 
          borderRight: isSidebarOpen ? '1px solid #e2e8f0' : 'none', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          transition: 'width 0.3s ease, border 0.3s ease',
          whiteSpace: 'nowrap',
          zIndex: 1000
        }}>
          
          <div>
            {/* Cabeçalho do Módulo Comercial */}
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1a365d', fontWeight: 'bold' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <span>🏢</span> <span style={{ fontSize: '0.85rem', textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.module}</span>
              </div>
              <button 
                onClick={() => setIsModuleOpen(!isModuleOpen)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a365d', fontWeight: 'bold', fontSize: '0.8rem' }}
                title={isModuleOpen ? 'Recolher Módulo' : 'Expandir Módulo'}
              >
                {isModuleOpen ? '▲' : '▼'}
              </button>
            </div>

            {/* Itens de Navegação */}
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
          </div>

          {/* Botão Sair no Rodapé */}
          <div style={{ padding: '15px 10px', borderTop: '1px solid #e2e8f0' }}>
            <a 
              href="/" 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', 
                textDecoration: 'none', color: '#e53e3e', borderRadius: '8px', fontWeight: 'bold',
                backgroundColor: '#fff5f5'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>🚪</span> {t.logout}
            </a>
          </div>

        </aside>

        {/* Área Principal de Conteúdo */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>

    </div>
  );
}
