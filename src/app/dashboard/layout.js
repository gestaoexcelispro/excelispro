'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const translations = {
  'pt-BR': {
    company: 'ExcelisPro',
    subtitle: 'Consultoria e Gestão',
    commercialModule: 'MÓDULO COMERCIAL',
    dashboard: 'Painel Geral',
    clients: 'Clientes',
    budgets: 'Orçamentos',
    proposals: 'Propostas Comerciais',
    templates: 'Modelos (Templates)',
    services: 'Serviços e Tabela M²',
    financialModule: 'MÓDULO CONTROLADORIA',
    receivable: 'Contas a Receber',
    payable: 'Contas a Pagar',
    legalModule: 'MÓDULO JURÍDICO',
    contracts: 'Fluxo de Contratos',
    logout: 'Sair'
  },
  'en-US': {
    company: 'ExcelisPro',
    subtitle: 'Consulting & Management',
    commercialModule: 'COMMERCIAL MODULE',
    dashboard: 'General Dashboard',
    clients: 'Clients',
    budgets: 'Budgets',
    proposals: 'Commercial Proposals',
    templates: 'Templates',
    services: 'Services & M² Table',
    financialModule: 'CONTROLLER MODULE',
    receivable: 'Accounts Receivable',
    payable: 'Accounts Payable',
    legalModule: 'LEGAL MODULE',
    contracts: 'Contract Workflows',
    logout: 'Logout'
  }
};

export default function DashboardLayout({ children }) {
  const { lang, setLang } = useLanguage();
  const t = translations[lang] || translations['pt-BR'];

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCommercialOpen, setIsCommercialOpen] = useState(true);
  const [isFinancialOpen, setIsFinancialOpen] = useState(true);
  const [isLegalOpen, setIsLegalOpen] = useState(true);

  // Detecta se é tela de celular ao carregar para recolher o menu automaticamente
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      
      {/* HEADER FIXA NO TOPO */}
      <header style={{ 
        position: 'sticky', top: 0, zIndex: 1200, 
        backgroundColor: '#1a365d', color: 'white', 
        padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)', flexWrap: 'wrap', gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              backgroundColor: '#2b6cb0', color: 'white', border: 'none',
              borderRadius: '6px', width: '36px', height: '36px',
              cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem'
            }}
            title={isSidebarOpen ? 'Ocultar Menu' : 'Mostrar Menu'}
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ backgroundColor: '#3182ce', color: 'white', fontWeight: 'bold', width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
              EP
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', letterSpacing: '0.5px' }}>{t.company}</h2>
              <span style={{ fontSize: '0.65rem', color: '#90cdf4', display: 'block' }}>{t.subtitle}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#2a4365', padding: '3px', borderRadius: '6px' }}>
          <button 
            onClick={() => setLang('pt-BR')} 
            style={{ background: lang === 'pt-BR' ? '#3182ce' : 'transparent', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
          >
            PT
          </button>
          <button 
            onClick={() => setLang('en-US')} 
            style={{ background: lang === 'en-US' ? '#3182ce' : 'transparent', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
          >
            EN
          </button>
        </div>
      </header>

      {/* CORPO DO DASHBOARD */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', width: '100%', overflowX: 'hidden' }}>
        
        {/* SIDEBAR RESPONSIVA */}
        <aside style={{ 
          width: isSidebarOpen ? '260px' : '0px', 
          backgroundColor: '#ffffff', 
          borderRight: isSidebarOpen ? '1px solid #e2e8f0' : 'none', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
          transition: 'width 0.3s ease, border 0.3s ease',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          position: window.innerWidth < 768 ? 'absolute' : 'relative',
          height: 'calc(100vh - 60px)'
        }}>
          
          <div style={{ overflowY: 'auto', flex: 1, width: '260px' }}>
            
            {/* 1. MÓDULO COMERCIAL */}
            <div style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1a365d', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span>🏢</span> <span style={{ fontSize: '0.75rem', textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.commercialModule}</span>
              </div>
              <button onClick={() => setIsCommercialOpen(!isCommercialOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a365d', fontWeight: 'bold', fontSize: '0.75rem' }}>
                {isCommercialOpen ? '▲' : '▼'}
              </button>
            </div>

            {isCommercialOpen && (
              <nav style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '3px', borderBottom: '1px solid #e2e8f0' }}>
                <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>⊞</span> {t.dashboard}</a>
                <a href="#clientes" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span>👥</span> {t.clients}</div>
                  <span style={{ backgroundColor: '#e2e8f0', color: '#1a365d', padding: '2px 5px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>1</span>
                </a>
                <a href="/dashboard/orcamentos" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span>📊</span> {t.budgets}</div>
                </a>
                <a href="/dashboard/propostas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span>📄</span> {t.proposals}</div>
                  <span style={{ backgroundColor: '#e2e8f0', color: '#1a365d', padding: '2px 5px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>1</span>
                </a>
                <a href="/dashboard/modelos" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>📚</span> {t.templates}</a>
                <a href="/dashboard/servicos" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>🏷️</span> {t.services}</a>
              </nav>
            )}

            {/* 2. MÓDULO CONTROLADORIA */}
            <div style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1a365d', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span>💰</span> <span style={{ fontSize: '0.75rem', textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.financialModule}</span>
              </div>
              <button onClick={() => setIsFinancialOpen(!isFinancialOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a365d', fontWeight: 'bold', fontSize: '0.75rem' }}>
                {isFinancialOpen ? '▲' : '▼'}
              </button>
            </div>

            {isFinancialOpen && (
              <nav style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '3px', borderBottom: '1px solid #e2e8f0' }}>
                <a href="/dashboard/controladoria/receber" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>📥</span> {t.receivable}</a>
                <a href="/dashboard/controladoria/pagar" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>📤</span> {t.payable}</a>
              </nav>
            )}

            {/* 3. MÓDULO JURÍDICO */}
            <div style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1a365d', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span>⚖️</span> <span style={{ fontSize: '0.75rem', textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.legalModule}</span>
              </div>
              <button onClick={() => setIsLegalOpen(!isLegalOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a365d', fontWeight: 'bold', fontSize: '0.75rem' }}>
                {isLegalOpen ? '▲' : '▼'}
              </button>
            </div>

            {isLegalOpen && (
              <nav style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '3px', borderBottom: '1px solid #e2e8f0' }}>
                <a href="/dashboard/juridico/contratos" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>📝</span> {t.contracts}</a>
              </nav>
            )}

          </div>

          {/* Botão Sair no Rodapé */}
          <div style={{ padding: '12px 10px', borderTop: '1px solid #e2e8f0', width: '260px', backgroundColor: 'white' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#e53e3e', borderRadius: '6px', fontWeight: 'bold', backgroundColor: '#fff5f5', fontSize: '0.85rem' }}>
              <span>🚪</span> {t.logout}
            </a>
          </div>

        </aside>

        {/* ÁREA PRINCIPAL DE CONTEÚDO COM SUPORTE A SCROLL HORIZONTAIS PARA TABELAS */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: '15px' }}>
          <div style={{ minWidth: '320px' }}>
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
