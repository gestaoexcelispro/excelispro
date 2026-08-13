'use client';
import { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

const translations = {
  'pt-BR': {
    title: 'Propostas Comerciais',
    description: 'Central de propostas oficiais geradas e aprovadas para apresentação ao cliente.',
    tableHeaders: ['Número', 'Cliente', 'Data de Emissão', 'Valor Total', 'Status', 'Ações'],
    btnView: 'Visualizar',
    status: {
      sent: 'Enviada',
      signed: 'Assinada'
    }
  },
  'en-US': {
    title: 'Commercial Proposals',
    description: 'Central for official proposals generated and approved for presentation to the client.',
    tableHeaders: ['Number', 'Client', 'Issue Date', 'Total Value', 'Status', 'Actions'],
    btnView: 'View',
    status: {
      sent: 'Sent',
      signed: 'Signed'
    }
  }
};

export default function PropostasPage() {
  const { lang } = useLanguage();
  const t = translations[lang] || translations['pt-BR'];

  // Dados das propostas já aprovadas vindas do fluxo de orçamentos
  const [propostas] = useState([
    {
      id: 'PROP-2026-002',
      cliente: 'Bianca, Luciano e João Lucas',
      data: '13/08/2026',
      valor: 'R$ 2.475,00',
      status: 'sent'
    }
  ]);

  return (
    <div style={{ padding: '40px' }}>
      
      {/* Cabeçalho */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#2A4365', margin: '0 0 10px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
          {t.title}
        </h1>
        <p style={{ color: '#4a5568', margin: 0 }}>{t.description}</p>
      </div>

      {/* Tabela de Propostas */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              {t.tableHeaders.map((header, index) => (
                <th key={index} style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {propostas.map((prop) => (
              <tr key={prop.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '15px 20px', color: '#1a365d', fontWeight: 'bold' }}>{prop.id}</td>
                <td style={{ padding: '15px 20px', color: '#2d3748' }}>{prop.cliente}</td>
                <td style={{ padding: '15px 20px', color: '#718096' }}>{prop.data}</td>
                <td style={{ padding: '15px 20px', color: '#1a365d', fontWeight: 'bold' }}>{prop.valor}</td>
                <td style={{ padding: '15px 20px' }}>
                  <span style={{ 
                    backgroundColor: '#e6fffa', color: '#285e61', padding: '4px 10px', 
                    borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #b2f5ea' 
                  }}>
                    {t.status[prop.status]}
                  </span>
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <button 
                    onClick={() => alert('Abrindo PDF da proposta oficial: ' + prop.id)}
                    style={{ 
                      backgroundColor: '#edf2f7', color: '#2d3748', border: '1px solid #cbd5e0', 
                      padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' 
                    }}
                  >
                    {t.btnView}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
