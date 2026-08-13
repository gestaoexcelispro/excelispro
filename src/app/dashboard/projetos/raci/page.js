'use client';
import { useLanguage } from '../../../../contexts/LanguageContext';

export default function RaciPage() {
  const { lang } = useLanguage();

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ color: '#2A4365', margin: '0 0 10px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        {lang === 'en-US' ? 'RACI Matrix' : 'Matriz RACI (Responsabilidades)'}
      </h1>
      <p style={{ color: '#4a5568', marginBottom: '20px' }}>
        {lang === 'en-US' ? 'Responsible, Accountable, Consulted, and Informed matrix for project stakeholders.' : 'Matriz de papéis e responsabilidades: Responsável, Aprovador, Consultado e Informado.'}
      </p>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '15px 20px', color: '#4a5568' }}>{lang === 'en-US' ? 'Activity / Deliverable' : 'Atividade / Entregável'}</th>
              <th style={{ padding: '15px 20px', color: '#4a5568' }}>{lang === 'en-US' ? 'Project Manager' : 'Gerente de Projetos'}</th>
              <th style={{ padding: '15px 20px', color: '#4a5568' }}>{lang === 'en-US' ? 'Engineer' : 'Engenheiro'}</th>
              <th style={{ padding: '15px 20px', color: '#4a5568' }}>{lang === 'en-US' ? 'Client' : 'Cliente'}</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#1a365d' }}>Elaboração de Projetos</td>
              <td style={{ padding: '15px 20px', color: '#2d3748' }}>A (Accountable)</td>
              <td style={{ padding: '15px 20px', color: '#2d3748' }}>R (Responsible)</td>
              <td style={{ padding: '15px 20px', color: '#2d3748' }}>C (Consulted)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
