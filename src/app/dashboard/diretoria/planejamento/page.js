'use client';
import React, { useState } from 'react';
import { useLanguage } from '../../../../../contexts/LanguageContext';

const STATUS_METAS = {
  'NÃO INICIADO': { bg: '#edf2f7', color: '#4a5568' },
  'EM ANDAMENTO': { bg: '#fefcbf', color: '#975a16' },
  'CONCLUÍDO': { bg: '#c6f6d5', color: '#22543d' },
  'ATRASADO': { bg: '#fed7d7', color: '#9b2c2c' },
};

export default function PlanejamentoEstrategicoPage() {
  const { lang } = useLanguage();
  const [anoVigente, setAnoVigente] = useState(2026);

  // --- ESTADO: METAS DE GESTÃO E EXPANSÃO ---
  const [metas, setMetas] = useState([
    { id: 'm1', objetivo: 'Expansão de projetos residenciais em Steel Framing', responsavel: 'Eduardo Freitas', prazo: '2026-11-30', status: 'EM ANDAMENTO' },
    { id: 'm2', objetivo: 'Implementar fluxo BIM para compatibilização estrutural', responsavel: 'Nicole Pinheiro', prazo: '2026-09-15', status: 'EM ANDAMENTO' },
    { id: 'm3', objetivo: 'Firmar 3 novas parcerias estratégicas (Engenharia/Arquitetura)', responsavel: 'Diretoria', prazo: '2026-12-31', status: 'NÃO INICIADO' }
  ]);

  // --- ESTADO: ORÇAMENTO ANUAL (BUDGET) ---
  const [orcamento, setOrcamento] = useState([
    { id: 'o1', categoria: 'Marketing e Captação de Clientes', previsto: 120000, realizado: 45000 },
    { id: 'o2', categoria: 'Tecnologia e Softwares (ERP, BIM, etc.)', previsto: 85000, realizado: 32000 },
    { id: 'o3', categoria: 'Treinamento e Capacitação (PMI, Lean)', previsto: 40000, realizado: 15000 },
    { id: 'o4', categoria: 'Estrutura Administrativa / Escritório', previsto: 150000, realizado: 75000 },
  ]);

  // Funções para Metas
  const adicionarMeta = () => setMetas([...metas, { id: `m_${Date.now()}`, objetivo: '', responsavel: '', prazo: '', status: 'NÃO INICIADO' }]);
  const atualizarMeta = (id, campo, valor) => setMetas(metas.map(m => m.id === id ? { ...m, [campo]: valor } : m));
  const removerMeta = (id) => { if (window.confirm('Excluir esta meta?')) setMetas(metas.filter(m => m.id !== id)); };

  // Funções para Orçamento
  const adicionarOrcamento = () => setOrcamento([...orcamento, { id: `o_${Date.now()}`, categoria: '', previsto: 0, realizado: 0 }]);
  const atualizarOrcamento = (id, campo, valor) => setOrcamento(orcamento.map(o => o.id === id ? { ...o, [campo]: campo === 'categoria' ? valor : Number(valor) } : o));
  const removerOrcamento = (id) => { if (window.confirm('Excluir esta linha de orçamento?')) setOrcamento(orcamento.filter(o => o.id !== id)); };

  // Cálculos do Orçamento
  const totalPrevisto = orcamento.reduce((acc, curr) => acc + (Number(curr.previsto) || 0), 0);
  const totalRealizado = orcamento.reduce((acc, curr) => acc + (Number(curr.realizado) || 0), 0);
  const saldoGeral = totalPrevisto - totalRealizado;
  const percentualUtilizado = totalPrevisto > 0 ? ((totalRealizado / totalPrevisto) * 100).toFixed(1) : 0;

  // Formatação de Moeda
  const formatarMoeda = (valor) => {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      
      {/* CABEÇALHO */}
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <div>
          <h1 style={{ color: '#1a365d', margin: '0 0 5px 0', fontSize: '1.8rem', fontStyle: 'italic' }}>Planejamento Estratégico</h1>
          <p style={{ color: '#718096', margin: 0, fontSize: '0.95rem' }}>Definição de metas de gestão, expansão de negócios e controle de orçamento anual.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4a5568' }}>Exercício (Ano):</label>
          <input 
            type="number" 
            value={anoVigente} 
            onChange={(e) => setAnoVigente(e.target.value)} 
            style={{ border: 'none', background: 'transparent', outline: 'none', color: '#2a4365', fontWeight: '900', fontSize: '1.1rem', width: '70px', textAlign: 'center' }} 
          />
        </div>
      </div>

      {/* SEÇÃO 1: METAS DE GESTÃO E EXPANSÃO */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
        <h2 style={{ color: '#2a4365', margin: '0 0 20px 0', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎯</span> Metas de Gestão e Expansão
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px', textAlign: 'left', borderRadius: '6px 0 0 0' }}>OBJETIVO / INICIATIVA</th>
                <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px', textAlign: 'left', width: '200px' }}>RESPONSÁVEL</th>
                <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px', textAlign: 'center', width: '150px' }}>PRAZO</th>
                <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px', textAlign: 'center', width: '180px' }}>STATUS</th>
                <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px', textAlign: 'center', width: '60px', borderRadius: '0 6px 0 0' }}></th>
              </tr>
            </thead>
            <tbody>
              {metas.map((meta) => (
                <tr key={meta.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px' }}>
                    <input type="text" value={meta.objetivo} onChange={(e) => atualizarMeta(meta.id, 'objetivo', e.target.value)} placeholder="Descreva a meta de expansão..." style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: '#2d3748', fontWeight: '500' }} />
                  </td>
                  <td style={{ padding: '10px', borderLeft: '1px solid #edf2f7' }}>
                    <input type="text" value={meta.responsavel} onChange={(e) => atualizarMeta(meta.id, 'responsavel', e.target.value)} placeholder="Líder..." style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: '#4a5568' }} />
                  </td>
                  <td style={{ padding: '10px', borderLeft: '1px solid #edf2f7', textAlign: 'center' }}>
                    <input type="date" value={meta.prazo} onChange={(e) => atualizarMeta(meta.id, 'prazo', e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: '#4a5568', cursor: 'pointer' }} />
                  </td>
                  <td style={{ padding: '10px', borderLeft: '1px solid #edf2f7', backgroundColor: STATUS_METAS[meta.status].bg }}>
                    <select
                      value={meta.status}
                      onChange={(e) => atualizarMeta(meta.id, 'status', e.target.value)}
                      style={{ width: '100%', backgroundColor: 'transparent', color: STATUS_METAS[meta.status].color, border: 'none', outline: 'none', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center', textAlignLast: 'center', cursor: 'pointer' }}
                    >
                      {Object.keys(STATUS_METAS).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '10px', borderLeft: '1px solid #edf2f7', textAlign: 'center' }}>
                    <button onClick={() => removerMeta(meta.id)} title="Excluir Meta" style={{ background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>✖</button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} style={{ padding: '15px 10px', backgroundColor: '#f7fafc' }}>
                  <button onClick={adicionarMeta} style={{ backgroundColor: '#ebf8ff', color: '#2b6cb0', border: '1px dashed #3182ce', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    + Adicionar Nova Meta
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SEÇÃO 2: ORÇAMENTO ANUAL (BUDGET) */}
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ color: '#2a4365', margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💰</span> Orçamento Anual (Budget {anoVigente})
          </h2>
          
          {/* CARDS RESUMO DO ORÇAMENTO */}
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ backgroundColor: '#f7fafc', padding: '10px 15px', borderRadius: '6px', border: '1px solid #cbd5e0', textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#718096' }}>BUDGET TOTAL (PREVISTO)</span>
              <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#2b6cb0' }}>{formatarMoeda(totalPrevisto)}</span>
            </div>
            <div style={{ backgroundColor: '#f7fafc', padding: '10px 15px', borderRadius: '6px', border: '1px solid #cbd5e0', textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: '#718096' }}>TOTAL REALIZADO ({percentualUtilizado}%)</span>
              <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#dd6b20' }}>{formatarMoeda(totalRealizado)}</span>
            </div>
            <div style={{ backgroundColor: saldoGeral >= 0 ? '#f0fff4' : '#fff5f5', padding: '10px 15px', borderRadius: '6px', border: `1px solid ${saldoGeral >= 0 ? '#9ae6b4' : '#feb2b2'}`, textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: saldoGeral >= 0 ? '#2f855a' : '#c53030' }}>SALDO DISPONÍVEL</span>
              <span style={{ fontSize: '1.2rem', fontWeight: '900', color: saldoGeral >= 0 ? '#38a169' : '#e53e3e' }}>{formatarMoeda(saldoGeral)}</span>
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px', textAlign: 'left', borderRadius: '6px 0 0 0' }}>CATEGORIA DE DESPESA / INVESTIMENTO</th>
                <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px', textAlign: 'right', width: '200px' }}>VALOR PREVISTO (R$)</th>
                <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px', textAlign: 'right', width: '200px' }}>VALOR REALIZADO (R$)</th>
                <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px', textAlign: 'right', width: '200px' }}>SALDO (R$)</th>
                <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px', textAlign: 'center', width: '60px', borderRadius: '0 6px 0 0' }}></th>
              </tr>
            </thead>
            <tbody>
              {orcamento.map((linha) => {
                const saldoLinha = Number(linha.previsto) - Number(linha.realizado);
                return (
                  <tr key={linha.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px' }}>
                      <input type="text" value={linha.categoria} onChange={(e) => atualizarOrcamento(linha.id, 'categoria', e.target.value)} placeholder="Ex: Captação de Clientes..." style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', color: '#2d3748', fontWeight: '500' }} />
                    </td>
                    <td style={{ padding: '10px', borderLeft: '1px solid #edf2f7', textAlign: 'right' }}>
                      <input type="number" value={linha.previsto} onChange={(e) => atualizarOrcamento(linha.id, 'previsto', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.95rem', color: '#2b6cb0', fontWeight: 'bold', textAlign: 'right' }} />
                    </td>
                    <td style={{ padding: '10px', borderLeft: '1px solid #edf2f7', textAlign: 'right' }}>
                      <input type="number" value={linha.realizado} onChange={(e) => atualizarOrcamento(linha.id, 'realizado', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.95rem', color: '#dd6b20', fontWeight: 'bold', textAlign: 'right' }} />
                    </td>
                    <td style={{ padding: '10px', borderLeft: '1px solid #edf2f7', textAlign: 'right', fontWeight: 'bold', color: saldoLinha >= 0 ? '#38a169' : '#e53e3e', backgroundColor: saldoLinha >= 0 ? 'transparent' : '#fff5f5' }}>
                      {formatarMoeda(saldoLinha)}
                    </td>
                    <td style={{ padding: '10px', borderLeft: '1px solid #edf2f7', textAlign: 'center' }}>
                      <button onClick={() => removerOrcamento(linha.id)} title="Excluir Linha" style={{ background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>✖</button>
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={5} style={{ padding: '15px 10px', backgroundColor: '#f7fafc' }}>
                  <button onClick={adicionarOrcamento} style={{ backgroundColor: '#ebf8ff', color: '#2b6cb0', border: '1px dashed #3182ce', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    + Adicionar Linha de Orçamento
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
