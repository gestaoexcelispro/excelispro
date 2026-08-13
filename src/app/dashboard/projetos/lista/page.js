'use client';
import { useState } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';

export default function ProjetosListaPage() {
  const { lang } = useLanguage();

  const [projetos] = useState([
    { id: 'PRJ-2026-001', nome: 'Residência Bianca & Luciano', cliente: 'Bianca, Luciano e João Lucas', status: 'Em Andamento', gerente: 'Eng. Responsável' }
  ]);

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ color: '#2A4365', margin: '0 0 10px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
            {lang === 'en-US' ? 'Projects Portfolio' : 'Portfólio de Projetos'}
          </h1>
          <p style={{ color: '#4a5568', margin: 0 }}>
            {lang === 'en-US' ? 'Manage and monitor all active engineering projects.' : 'Gerencie e acompanhe todos os projetos de engenharia ativos.'}
          </p>
        </div>
        <button 
          onClick={() => alert(lang === 'en-US' ? 'New project registration modal.' : 'Abrir cadastro de novo projeto.')}
          style={{ backgroundColor: '#1d4ed8', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {lang === 'en-US' ? '+ New Project' : '+ Novo Projeto'}
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold' }}>ID</th>
              <th style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Project Name' : 'Nome do Projeto'}</th>
              <th style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Client' : 'Cliente'}</th>
              <th style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold' }}>Status</th>
              <th style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projetos.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '15px 20px', color: '#1a365d', fontWeight: 'bold' }}>{p.id}</td>
                <td style={{ padding: '15px 20px', color: '#2d3748', fontWeight: 'bold' }}>{p.nome}</td>
                <td style={{ padding: '15px 20px', color: '#718096' }}>{p.cliente}</td>
                <td style={{ padding: '15px 20px' }}>
                  <span style={{ backgroundColor: '#e6fffa', color: '#285e61', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: '15px 20px' }}>
                  <button onClick={() => alert('Visualizar projeto: ' + p.id)} style={{ backgroundColor: '#edf2f7', border: '1px solid #cbd5e0', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {lang === 'en-US' ? 'View' : 'Visualizar'}
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
