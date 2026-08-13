'use client';
import { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

const translations = {
  'pt-BR': {
    title: 'Modelos de Propostas (Templates)',
    description: 'Gerencie os templates de escopo e condições gerais utilizados na geração de orçamentos e propostas.',
    tableHeaders: ['Código do Modelo', 'Nome do Template', 'Descrição Padrão', 'Ações', 'Visualizar'],
    btnNew: '+ Novo Template',
    btnEdit: 'Editar',
    btnView: 'Ver Modelo'
  },
  'en-US': {
    title: 'Proposal Templates',
    description: 'Manage scope and general conditions templates used in drafting budgets and proposals.',
    tableHeaders: ['Template Code', 'Template Name', 'Default Description', 'Actions', 'Preview'],
    btnNew: '+ New Template',
    btnEdit: 'Edit',
    btnView: 'View Template'
  }
};

export default function ModelosPage() {
  const { lang } = useLanguage();
  const t = translations[lang] || translations['pt-BR'];

  const [templates] = useState([
    {
      id: 'TMP-ENG-01',
      nome: 'Projetos de Engenharia (Elétrico, Hidrossanitário e Estrutural)',
      descricao: 'Template padrão contemplando dimensionamento em CAD/BIM, ART/RRT e listas estimativas.'
    },
    {
      id: 'TMP-GES-02',
      nome: 'Gestão de Obra e Acompanhamento Técnico',
      descricao: 'Template para fiscalização de execução, relatórios periódicos de andamento e suporte técnico.'
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
          onClick={() => alert('Funcionalidade de criação de novo template em breve.')}
          style={{ 
            backgroundColor: '#1d4ed8', color: 'white', border: 'none', padding: '12px 20px', 
            borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {t.btnNew}
        </button>
      </div>

      {/* Tabela de Templates */}
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
            {templates.map((tpl) => (
              <tr key={tpl.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '15px 20px', color: '#1a365d', fontWeight: 'bold' }}>{tpl.id}</td>
                <td style={{ padding: '15px 20px', color: '#2d3748', fontWeight: 'bold' }}>{tpl.nome}</td>
                <td style={{ padding: '15px 20px', color: '#718096', fontSize: '0.9rem' }}>{tpl.descricao}</td>
                <td style={{ padding: '15px 20px' }}>
                  <button 
                    onClick={() => alert('Editando template: ' + tpl.id)}
                    style={{ backgroundColor: '#edf2f7', color: '#2d3748', border: '1px solid #cbd5e0', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    {t.btnEdit}
                  </button>
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <button 
                    onClick={() => alert('Visualizando estrutura do template.')}
                    style={{ backgroundColor: '#ebf8ff', color: '#2b6cb0', border: '1px solid #bee3f8', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
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
