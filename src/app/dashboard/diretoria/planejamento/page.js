'use client';
import React, { useState } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';

const STATUS_METAS = {
  'NÃO INICIADO': { bg: '#edf2f7', color: '#4a5568' },
  'EM ANDAMENTO': { bg: '#fefcbf', color: '#975a16' },
  'CONCLUÍDO': { bg: '#c6f6d5', color: '#22543d' },
  'ATRASADO': { bg: '#fed7d7', color: '#9b2c2c' },
};

export default function PlanejamentoEstrategicoPage() {
  const { lang } = useLanguage();
  const [anoVigente, setAnoVigente] = useState(2026);

  const [metas, setMetas] = useState([
    { id: 'm1', objetivo: 'Expansão de projetos residenciais em Steel Framing', responsavel: 'Eduardo Freitas', prazo: '2026-11-30', status: 'EM ANDAMENTO' },
    { id: 'm2', objetivo: 'Implementar fluxo BIM para compatibilização estrutural', responsavel: 'Nicole Pinheiro', prazo: '2026-09-15', status: 'EM ANDAMENTO' },
    { id: 'm3', objetivo: 'Firmar 3 novas parcerias estratégicas (Engenharia/Arquitetura)', responsavel: 'Diretoria', prazo: '2026-12-31', status: 'NÃO INICIADO' }
  ]);

  const [orcamento, setOrcamento] = useState([
    { id: 'o1', categoria: 'Marketing e Captação de Clientes', previsto: 120000, realizado: 45000 },
    { id: 'o2', categoria: 'Tecnologia e Softwares (ERP, BIM, etc.)', previsto: 85000, realizado: 32000 },
    { id: 'o3', categoria: 'Treinamento e Capacitação (PMI, Lean)', previsto: 40000, realizado: 15000 },
    { id: 'o4', categoria: 'Estrutura Administrativa / Escritório', previsto: 150000, realizado: 75000 },
  ]);

  const adicionarMeta = () => setMetas([...metas, { id: `m_${Date.now()}`, objetivo: '', responsavel: '', prazo: '', status: 'NÃO INICIADO' }]);
  const atualizarMeta = (id, campo, valor) => setMetas(metas.map(m => m.id === id ? { ...m, [campo]: valor } : m));
  const removerMeta = (id) => { if (window.confirm('Excluir esta meta?')) setMetas(metas.filter(m => m.id !== id)); };

  const adicionarOrcamento = () => setOrcamento([...orcamento, { id: `o_${Date.now()}`, categoria: '', previsto: 0, realizado: 0 }]);
  const atualizarOrcamento = (id, campo, valor) => setOrcamento(orcamento.map(o => o.id === id ? { ...o, [campo]: campo === 'categoria' ? valor : Number(valor) } : o));
  const removerOrcamento = (id) => { if (window.confirm('Excluir esta linha?')) setOrcamento(orcamento.filter(o => o.id !== id)); };

  const totalPrevisto = orcamento.reduce((acc, curr) => acc + (Number(curr.previsto) || 0), 0);
  const totalRealizado = orcamento.reduce((acc, curr) => acc + (Number(curr.realizado) || 0), 0);
  const saldoGeral = totalPrevisto - totalRealizado;
  const percentualUtilizado = totalPrevisto > 0 ? ((totalRealizado / totalPrevisto) * 100).toFixed(1) : 0;

  const formatarMoeda = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <div>
          <h1 style={{ color: '#1a365d', margin: '0 0 5px 0', fontSize: '1.8rem', fontStyle: 'italic' }}>Planejamento Estratégico</h1>
          <p style={{ color: '#718096', margin: 0, fontSize: '0.95rem' }}>Definição de metas de gestão e orçamento anual.</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4a5568' }}>Ano: </label>
          <input type="number" value={anoVigente} onChange={(e) => setAnoVigente(e.target.value)} style={{ border: 'none', width: '60px', fontWeight: 'bold' }} />
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
        <h2 style={{ color: '#2a4365', marginBottom: '20px' }}>🎯 Metas de Gestão e Expansão</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#1a365d', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>OBJETIVO</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>RESPONSÁVEL</th>
              <th style={{ padding: '12px' }}>PRAZO</th>
              <th style={{ padding: '12px' }}>STATUS</th>
              <th style={{ padding: '12px' }}></th>
            </tr>
          </thead>
          <tbody>
            {metas.map((meta) => (
              <tr key={meta.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '10px' }}><input type="text" value={meta.objetivo} onChange={(e) => atualizarMeta(meta.id, 'objetivo', e.target.value)} style={{ width: '100%', border: 'none' }} /></td>
                <td style={{ padding: '10px' }}><input type="text" value={meta.responsavel} onChange={(e) => atualizarMeta(meta.id, 'responsavel', e.target.value)} style={{ width: '100%', border: 'none' }} /></td>
                <td style={{ padding: '10px', textAlign: 'center' }}><input type="date" value={meta.prazo} onChange={(e) => atualizarMeta(meta.id, 'prazo', e.target.value)} style={{ border: 'none' }} /></td>
                <td style={{ padding: '10px', textAlign: 'center', backgroundColor: STATUS_METAS[meta.status].bg }}>
                  <select value={meta.status} onChange={(e) => atualizarMeta(meta.id, 'status', e.target.value)} style={{ background: 'transparent', border: 'none' }}>
                    {Object.keys(STATUS_METAS).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ textAlign: 'center' }}><button onClick={() => removerMeta(meta.id)} style={{ border: 'none', background: 'none', color: 'red' }}>✖</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={adicionarMeta} style={{ marginTop: '15px', padding: '8px 15px' }}>+ Adicionar Meta</button>
      </div>
      
      {/* (Inserir aqui abaixo a tabela do orçamento igual ao código anterior enviado) */}
    </div>
  );
}
