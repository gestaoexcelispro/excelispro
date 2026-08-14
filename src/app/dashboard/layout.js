'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
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
    projectsModule: 'MÓDULO PROJETOS (PMBOK)',
    projectList: 'Cadastrar / Listar Projetos',
    coletaDados: 'Coleta de Dados',
    tap: 'Termo de Abertura (TAP)',
    managementPlan: 'Plano de Gerenciamento',
    raci: 'Matriz RACI',
    risks: 'Gerenciamento de Riscos',
    financialModule: 'MÓDULO CONTROLADORIA',
    receivable: 'Contas a Receber',
    payable: 'Contas a Pagar',
    legalModule: 'MÓDULO JURÍDICO',
    contracts: 'Fluxo de Contratos',
    directorateModule: 'MÓDULO DIRETORIA',
    mapDashboard: 'Mapa de Obras & Gestão',
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
    projectsModule: 'PROJECTS MODULE (PMBOK)',
    projectList: 'Register / List Projects',
    coletaDados: 'Data Collection',
    tap: 'Project Charter (TAP)',
    managementPlan: 'Management Plan',
    raci: 'RACI Matrix',
    risks: 'Risk Management',
    financialModule: 'CONTROLLER MODULE',
    receivable: 'Accounts Receivable',
    payable: 'Accounts Payable',
    legalModule: 'LEGAL MODULE',
    contracts: 'Contract Workflows',
    directorateModule: 'DIRECTORATE MODULE',
    mapDashboard: 'Works Map & Management',
    logout: 'Logout'
  }
};

export default function DashboardLayout({ children }) {
  const { lang, setLang, toggleLanguage } = useLanguage();
  const t = translations[lang] || translations['pt-BR'];
  const pathname = usePathname();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDirectorateOpen, setIsDirectorateOpen] = useState(true);
  const [isCommercialOpen, setIsCommercialOpen] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isFinancialOpen, setIsFinancialOpen] = useState(true);
  const [isLegalOpen, setIsLegalOpen] = useState(true);

  const changeLanguage = (targetLang) => {
    if (setLang) setLang(targetLang);
    if (toggleLanguage && lang !== targetLang) toggleLanguage();
  };

  const getBreadcrumb = () => {
    if (pathname.includes('/diretoria/mapa')) return `${t.directorateModule} > ${t.mapDashboard}`;
    if (pathname.includes('/projetos/lista')) return `${t.projectsModule} > ${t.projectList}`;
    if (pathname.includes('/projetos/coleta')) return `${t.projectsModule} > ${t.coletaDados}`;
    if (pathname.includes('/projetos/tap')) return `${t.projectsModule} > ${t.tap}`;
    if (pathname.includes('/projetos/plano')) return `${t.projectsModule} > ${t.managementPlan}`;
    if (pathname.includes('/projetos/raci')) return `${t.projectsModule} > ${t.raci}`;
    if (pathname.includes('/projetos/riscos')) return `${t.projectsModule} > ${t.risks}`;
    if (pathname.includes('/orcamentos')) return `${t.commercialModule} > ${t.budgets}`;
    if (pathname.includes('/propostas')) return `${t.commercialModule} > ${t.proposals}`;
    if (pathname.includes('/modelos')) return `${t.commercialModule} > ${t.templates}`;
    if (pathname.includes('/servicos')) return `${t.commercialModule} > ${t.services}`;
    if (pathname.includes('/controladoria/receber')) return `${t.financialModule} > ${t.receivable}`;
    if (pathname.includes('/controladoria/pagar')) return `${t.financialModule} > ${t.payable}`;
    if (pathname.includes('/juridico/contratos')) return `${t.legalModule} > ${t.contracts}`;
    return `${t.commercialModule} > ${t.dashboard}`;
  };

  const isColetaPage = pathname === '/dashboard/projetos/coleta';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      
      {/* HEADER FIXA NO TOPO */}
      <header style={{ 
        flexShrink: 0,
        backgroundColor: '#1a365d', color: 'white', 
        padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)', zIndex: 1200
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ backgroundColor: '#2b6cb0', color: 'white', border: 'none', borderRadius: '6px', width: '36px', height: '36px', cursor: 'pointer', fontWeight: 'bold' }}
            title={isSidebarOpen ? 'Ocultar Menu' : 'Mostrar Menu'}
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ backgroundColor: '#3182ce', color: 'white', fontWeight: 'bold', width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              EP
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>{t.company}</h2>
              <span style={{ fontSize: '0.65rem', color: '#90cdf4' }}>{t.subtitle}</span>
            </div>
          </div>

          {!isSidebarOpen && (
            <div style={{ marginLeft: '15px', paddingLeft: '15px', borderLeft: '1px solid #2a4365', color: '#e2e8f0', fontSize: '0.85rem', fontWeight: '500' }}>
              {getBreadcrumb()}
            </div>
          )}
        </div>

        {/* LADO DIREITO DA HEADER: BOTÕES DA PÁGINA DE COLETA + IDIOMA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {isColetaPage && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('abrir-modal-coleta'))}
                style={{ backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
              >
                {lang === 'en-US' ? '+ Initial Collection' : '+ Cadastrar Coleta Inicial'}
              </button>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('abrir-modal-setorizacao'))}
                style={{ backgroundColor: '#2b6cb0', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
              >
                {lang === 'en-US' ? '+ Quantification' : '+ Nova Quantificação e Classificação'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', backgroundColor: '#102a43', padding: '3px', borderRadius: '8px', gap: '3px', border: '1px solid #2a4365' }}>
            <button onClick={() => changeLanguage('pt-BR')} style={{ background: lang === 'pt-BR' ? '#3182ce' : 'transparent', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>🇧🇷 PT</button>
            <button onClick={() => changeLanguage('en-US')} style={{ background: lang === 'en-US' ? '#3182ce' : 'transparent', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>🇺🇸 EN</button>
          </div>

        </div>
      </header>

      {/* CORPO DO DASHBOARD */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        <aside style={{ 
          width: isSidebarOpen ? '260px' : '0px', 
          backgroundColor: '#ffffff', 
          borderRight: isSidebarOpen ? '1px solid #e2e8f0' : 'none', 
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          overflowY: 'auto', transition: 'width 0.3s ease', flexShrink: 0,
          whiteSpace: 'nowrap'
        }}>
          <div style={{ width: '260px' }}>
            <div style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1a365d', fontWeight: 'bold', backgroundColor: '#ebf8ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span>📊</span> <span style={{ fontSize: '0.75rem' }}>{t.directorateModule}</span></div>
              <button onClick={() => setIsDirectorateOpen(!isDirectorateOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a365d', fontSize: '0.75rem' }}>{isDirectorateOpen ? '▲' : '▼'}</button>
            </div>
            {isDirectorateOpen && (
              <nav style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '3px', borderBottom: '1px solid #e2e8f0' }}>
                <a href="/dashboard/diretoria/mapa" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>🗺️</span> {t.mapDashboard}</a>
              </nav>
            )}

            <div style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1a365d', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span>🏢</span> <span style={{ fontSize: '0.75rem' }}>{t.commercialModule}</span></div>
              <button onClick={() => setIsCommercialOpen(!isCommercialOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a365d', fontSize: '0.75rem' }}>{isCommercialOpen ? '▲' : '▼'}</button>
            </div>
            {isCommercialOpen && (
              <nav style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '3px', borderBottom: '1px solid #e2e8f0' }}>
                <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>⊞</span> {t.dashboard}</a>
                <a href="/dashboard/orcamentos" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>📊</span> {t.budgets}</a>
                <a href="/dashboard/propostas" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>📄</span> {t.proposals}</a>
                <a href="/dashboard/modelos" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>📚</span> {t.templates}</a>
                <a href="/dashboard/servicos" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>🏷️</span> {t.services}</a>
              </nav>
            )}

            <div style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1a365d', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span>📋</span> <span style={{ fontSize: '0.75rem' }}>{t.projectsModule}</span></div>
              <button onClick={() => setIsProjectsOpen(!isProjectsOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a365d', fontSize: '0.75rem' }}>{isProjectsOpen ? '▲' : '▼'}</button>
            </div>
            {isProjectsOpen && (
              <nav style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '3px', borderBottom: '1px solid #e2e8f0' }}>
                <a href="/dashboard/projetos/lista" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>📁</span> {t.projectList}</a>
                <a href="/dashboard/projetos/coleta" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>✏️</span> {t.coletaDados}</a>
                <a href="/dashboard/projetos/tap" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>📜</span> {t.tap}</a>
                <a href="/dashboard/projetos/plano" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>📑</span> {t.managementPlan}</a>
                <a href="/dashboard/projetos/raci" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>👥</span> {t.raci}</a>
                <a href="/dashboard/projetos/riscos" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>⚠️</span> {t.risks}</a>
              </nav>
            )}

            <div style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1a365d', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span>💰</span> <span style={{ fontSize: '0.75rem' }}>{t.financialModule}</span></div>
              <button onClick={() => setIsFinancialOpen(!isFinancialOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a365d', fontSize: '0.75rem' }}>{isFinancialOpen ? '▲' : '▼'}</button>
            </div>
            {isFinancialOpen && (
              <nav style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '3px', borderBottom: '1px solid #e2e8f0' }}>
                <a href="/dashboard/controladoria/receber" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>📥</span> {t.receivable}</a>
                <a href="/dashboard/controladoria/pagar" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>📤</span> {t.payable}</a>
              </nav>
            )}

            <div style={{ padding: '12px 15px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1a365d', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span>⚖️</span> <span style={{ fontSize: '0.75rem' }}>{t.legalModule}</span></div>
              <button onClick={() => setIsLegalOpen(!isLegalOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a365d', fontSize: '0.75rem' }}>{isLegalOpen ? '▲' : '▼'}</button>
            </div>
            {isLegalOpen && (
              <nav style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '3px', borderBottom: '1px solid #e2e8f0' }}>
                <a href="/dashboard/juridico/contratos" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#4a5568', borderRadius: '6px', fontSize: '0.85rem' }}><span>📝</span> {t.contracts}</a>
              </nav>
            )}
          </div>

          <div style={{ padding: '12px 10px', borderTop: '1px solid #e2e8f0', backgroundColor: 'white', width: '260px' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', textDecoration: 'none', color: '#e53e3e', borderRadius: '6px', fontWeight: 'bold', backgroundColor: '#fff5f5', fontSize: '0.85rem' }}>
              <span>🚪</span> {t.logout}
            </a>
          </div>
        </aside>

        <main style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {children}
        </main>
      </div>

    </div>
  );
}
