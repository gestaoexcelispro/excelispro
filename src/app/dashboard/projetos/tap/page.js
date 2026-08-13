'use client';
import { useLanguage } from '../../../../contexts/LanguageContext';

export default function TapPage() {
  const { lang } = useLanguage();

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ color: '#2A4365', margin: '0 0 10px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        {lang === 'en-US' ? 'Project Charter (TAP)' : 'Termo de Abertura do Projeto (TAP)'}
      </h1>
      <p style={{ color: '#4a5568', marginBottom: '30px' }}>
        {lang === 'en-US' ? 'PMBOK Document formalizing the existence of the project and granting authority to the manager.' : 'Documento PMBOK que formaliza a existência do projeto e confere autoridade ao gerente.'}
      </p>

      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#2d3748' }}>{lang === 'en-US' ? 'Project Title' : 'Título do Projeto'}</label>
          <input type="text" placeholder="Ex: Projeto Residencial Unifamiliar" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#2d3748' }}>{lang === 'en-US' ? 'Main Objective' : 'Objetivo Principal'}</label>
          <textarea rows="3" placeholder="Descreva o escopo macro..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box', fontFamily: 'sans-serif' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#2d3748' }}>{lang === 'en-US' ? 'High-Level Requirements' : 'Requisitos de Alto Nível'}</label>
          <textarea rows="3" placeholder="Normas ABNT, prazos, entregas..." style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box', fontFamily: 'sans-serif' }} />
        </div>
        <button onClick={() => alert('TAP salvo com sucesso!')} style={{ backgroundColor: '#1d4ed8', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          {lang === 'en-US' ? 'Save Project Charter' : 'Salvar Termo de Abertura'}
        </button>
      </div>
    </div>
  );
}
