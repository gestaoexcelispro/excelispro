'use client';
import { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

const translations = {
  'pt-BR': {
    title: 'Gestão de Orçamentos',
    description: 'Elabore demandas, envie para avaliação do gestor e acompanhe a aprovação antes de gerar a proposta.',
    tableHeaders: ['Código', 'Cliente', 'Valor Estimado', 'Status da Avaliação', 'Ações'],
    btnNew: '+ Novo Orçamento',
    statusReview: 'Aguardando Avaliação do Gestor',
    statusApproved: 'Orçamento Aprovado',
    statusAdjust: 'Ajustes Solicitados',
    btnAction: 'Gerenciar'
  },
  'en-US': {
    title: 'Budget Management',
    description: 'Draft demands, submit for manager review, and track approval before generating the proposal.',
    tableHeaders: ['Code', 'Client', 'Estimated Value', 'Review Status', 'Actions'],
    btnNew: '+ New Budget',
    statusReview: 'Pending Manager Review',
    statusApproved: 'Budget Approved',
    statusAdjust: 'Adjustments Requested',
    btnAction: 'Manage'
  }
};

export default function OrcamentosPage() {
  const { lang } = useLanguage();
  const t = translations[lang] || translations['pt-BR'];

  const [orcamentos] = useState([
    {
      id: 'ORC-2026-001',
      cliente: 'Bianca, Luciano e João Lucas',
      valor: 'R$ 2.475,00',
      status: 'review'
    }
  ]);

  return (
    <div style={{ padding: '40px' }}>
      
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ color: '#2A4365', margin: '0 0 10px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
            {t.title}
          </h1>
          <p style={{ color: '#4a5568', margin: 0 }}>{t.description}</p>
        </div>
        <button 
          onClick={() => alert('Módulo de criação de orçamento integrado à Tabela M² em desenvolvimento.')}
          style={{ 
            backgroundColor: '#1d4ed8', color: 'white', border: 'none', padding: '12px 20px', 
            borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {t.btnNew}
        </button>
      </div>

      {/* Tabela */}
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
            {orcamentos.map((orc) => (
              <tr key={orc.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '15px 20px', color: '#1a365d', fontWeight: 'bold' }}>{orc.id}</td>
                <td style={{ padding: '15px 20px', color: '#2d3748' }}>{orc.cliente}</td>
                <td style={{ padding: '15px 20px', color: '#1a365d', fontWeight: 'bold' }}>{orc.valor}</td>
                <td style={{ padding: '15px 20px' }}>
                  <span style={{ 
                    backgroundColor: '#fffaf0', color: '#c05621', 
                    padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold',
                    border: '1px solid #fbd38d'
                  }}>
                    {t.statusReview}
                  </span>
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <button 
                    onClick={() => alert('Abrindo detalhes do orçamento para avaliação.')}
                    style={{ 
                      backgroundColor: '#edf2f7', color: '#2d3748', border: '1px solid #cbd5e0', 
                      padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer'
                    }}
                  >
                    {t.btnAction}
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
