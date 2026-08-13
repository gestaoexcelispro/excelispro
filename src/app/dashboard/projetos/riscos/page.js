'use client';
import { useLanguage } from '../../../../contexts/LanguageContext';

export default function RiscosPage() {
  const { lang } = useLanguage();

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ color: '#2A4365', margin: '0 0 10px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        {lang === 'en-US' ? 'Risk Management' : 'Gerenciamento de Riscos'}
      </h1>
      <p style={{ color: '#4a5568', marginBottom: '20px' }}>
        {lang === 'en-US' ? 'Identify, analyze, and plan responses to project risks.' : 'Identifique, analise e planeje respostas para os riscos do projeto.'}
      </p>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '15px 20px', color: '#4a5568' }}>{lang === 'en-US' ? 'Risk Description' : 'Descrição do Risco'}</th>
              <th style={{ padding: '15px 20px', color: '#4a5568' }}>{lang === 'en-US' ? 'Impact' : 'Impacto'}</th>
              <th style={{ padding: '15px 20px', color: '#4a5568' }}>{lang === 'en-US' ? 'Probability' : 'Probabilidade'}</th>
              <th style={{ padding: '15px 20px', color: '#4a5568' }}>{lang === 'en-US' ? 'Mitigation Action' : 'Ação de Mitigação'}</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#1a365d' }}>Atraso na liberação de concessionária (Ex: Copel/Sanepar)</td>
              <td style={{ padding: '15px 20px', color: '#e53e3e', fontWeight: 'bold' }}>Alto</td>
              <td style={{ padding: '15px 20px', color: '#d69e2e', fontWeight: 'bold' }}>Médio</td>
              <td style={{ padding: '15px 20px', color: '#2d3748' }}>Protocolo antecipado de projetos na fase inicial.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
