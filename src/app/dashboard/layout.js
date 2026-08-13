export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      
      {/* Menu Lateral (Sidebar) baseado no print */}
      <aside style={{ width: '280px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        
        {/* Cabeçalho do Menu */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1a365d', fontWeight: 'bold' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🏢</span> MÓDULO COMERCIAL
          </div>
          <span style={{ fontSize: '0.8rem' }}>▲</span>
        </div>

        {/* Itens de Navegação */}
        <nav style={{ padding: '15px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          
          <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', textDecoration: 'none', color: '#4a5568', borderRadius: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>⊞</span> Painel Geral
          </a>

          <a href="#clientes" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', textDecoration: 'none', color: '#4a5568', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '1.2rem' }}>👥</span> Clientes
            </div>
            <span style={{ backgroundColor: '#e2e8f0', color: '#1a365d', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>1</span>
          </a>

          <a href="#propostas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', textDecoration: 'none', color: '#4a5568', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '1.2rem' }}>📄</span> Propostas Comerciais
            </div>
            <span style={{ backgroundColor: '#e2e8f0', color: '#1a365d', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>1</span>
          </a>

          <a href="#modelos" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', textDecoration: 'none', color: '#4a5568', borderRadius: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>📚</span> Modelos (Templates)
          </a>

          {/* Item Ativo (Azul) */}
          <a href="#servicos" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', textDecoration: 'none', color: '#ffffff', backgroundColor: '#1d4ed8', borderRadius: '8px', fontWeight: 'bold' }}>
            <span style={{ fontSize: '1.2rem' }}>🏷️</span> Serviços e Tabela M²
          </a>
        </nav>
      </aside>

      {/* Área Principal de Conteúdo onde as telas vão aparecer */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
