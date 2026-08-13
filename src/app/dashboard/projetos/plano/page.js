'use client';
import { useLanguage } from '../../../../contexts/LanguageContext';

export default function PlanoPage() {
  const { lang } = useLanguage();

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ color: '#2A4365', margin: '0 0 10px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        {lang === 'en-US' ? 'Project Management Plan' : 'Plano de Gerenciamento do Projeto'}
      </h1>
      <p style={{ color: '#4a5568', marginBottom: '30px' }}>
        {lang === 'en-US' ? 'Defines how the project is executed, monitored, controlled, and closed.' : 'Define como o projeto é executado, monitorado, controlado e encerado.'}
      </p>

      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#2d3748' }}>{lang === 'en-US' ? 'Scope Management Strategy' : 'Estratégia de Gerenciamento de Escopo'}</label>
          <textarea rows="3" placeholder="Como o escopo será validado e controlado..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box', fontFamily: 'sans-serif' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#2d3748' }}>{lang === 'en-US' ? 'Schedule Baseline' : 'Linha de Base do Cronograma'}</label>
          <textarea rows="3" placeholder="Marcos principais e prazos de entrega..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box', fontFamily: 'sans-serif' }} />
        </div>
        <button onClick={() => alert('Plano atualizado com sucesso!')} style={{ backgroundColor: '#1d4ed8', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          {lang === 'en-US' ? 'Save Management Plan' : 'Salvar Plano de Gerenciamento'}
        </button>
      </div>
    </div>
  );
}
