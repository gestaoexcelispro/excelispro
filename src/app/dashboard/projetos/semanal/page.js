'use client';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { supabase } from '../../../../lib/supabase';

const CAUSAS_NAO_CUMPRIMENTO = [
  'Projeto (Erro/Atraso)',
  'Materiais (Falta/Defeito)',
  'Mão de Obra (Falta/Baixa Produtividade)',
  'Equipamentos (Quebra/Falta)',
  'Espaço/Frente de Trabalho',
  'Predecessora Atrasada',
  'Condições Externas (Chuva/Clima)',
  'Planejamento Irrealista',
  'Outros'
];

export default function PlanejamentoSemanalPage() {
  const { lang } = useLanguage();
  
  // Estados Gerais
  const [projetosLista, setProjetosLista] = useState([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState('');
  const [zonasColeta, setZonasColeta] = useState([]);

  // Estados do Semanal
  const [semanaAtual, setSemanaAtual] = useState(1);
  const [metaPpc, setMetaPpc] = useState(85); // 85% padrão

  // Linhas da Planilha Semanal
  const [tarefas, setTarefas] = useState([
    {
      id: `t_${Date.now()}_1`,
      dataPlanejamento: new Date().toISOString().split('T')[0],
      local: '',
      numSemana: 1,
      responsavel: '',
      atividade: '',
      concluida: '', // SIM, NAO
      unidade: '',
      qtdProgramada: '',
      qtdExecutada: '',
      causaNaoCumprimento: '',
      observacoes: ''
    }
  ]);

  // Busca Projetos
  useEffect(() => {
    const fetchProjetos = async () => {
      const { data } = await supabase.from('projetos').select('id, nome_projeto').order('id', { ascending: false });
      if (data) setProjetosLista(data);
    };
    fetchProjetos();
  }, []);

  // Busca Zonas para autocompletar "Local"
  useEffect(() => {
    const fetchZonasDoProjeto = async () => {
      if (!projetoSelecionado) { setZonasColeta([]); return; }
      const { data } = await supabase.from('setorizacao_obras').select('pavimento, fase').eq('projeto_id', projetoSelecionado);
      if (data) {
        const unicas = [...new Set(data.map(d => `${d.pavimento || ''} ${d.fase || ''}`.trim()))].filter(Boolean);
        setZonasColeta(unicas);
      }
    };
    fetchZonasDoProjeto();
  }, [projetoSelecionado]);

  // Funções de manipulação da tabela
  const adicionarTarefa = () => {
    setTarefas([...tarefas, {
      id: `t_${Date.now()}`,
      dataPlanejamento: new Date().toISOString().split('T')[0],
      local: '',
      numSemana: semanaAtual,
      responsavel: '',
      atividade: '',
      concluida: '',
      unidade: '',
      qtdProgramada: '',
      qtdExecutada: '',
      causaNaoCumprimento: '',
      observacoes: ''
    }]);
  };

  const atualizarTarefa = (id, campo, valor) => {
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, [campo]: valor } : t));
  };

  const removerTarefa = (id) => {
    if(window.confirm('Excluir esta tarefa?')) setTarefas(tarefas.filter(t => t.id !== id));
  };

  // --- CÁLCULOS DOS INDICADORES DE PPC ---
  const tarefasDaSemana = tarefas.filter(t => parseInt(t.numSemana) === parseInt(semanaAtual) && t.atividade.trim() !== '');
  const totalProgramadas = tarefasDaSemana.length;
  const totalConcluidas = tarefasDaSemana.filter(t => t.concluida === 'SIM').length;
  const ppcSemana = totalProgramadas > 0 ? (totalConcluidas / totalProgramadas) * 100 : 0;

  // PPC Acumulado (Todas as semanas válidas)
  const tarefasValidasTotais = tarefas.filter(t => t.atividade.trim() !== '');
  const concluidasTotais = tarefasValidasTotais.filter(t => t.concluida === 'SIM').length;
  const ppcAcumulado = tarefasValidasTotais.length > 0 ? (concluidasTotais / tarefasValidasTotais.length) * 100 : 0;

  let globalIdCounter = 1;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      
      <datalist id="lista-locais">
        {zonasColeta.map((zona, idx) => <option key={idx} value={zona} />)}
      </datalist>

      <datalist id="lista-causas">
        {CAUSAS_NAO_CUMPRIMENTO.map((causa, idx) => <option key={idx} value={causa} />)}
      </datalist>

      {/* CABEÇALHO */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ color: '#2A4365', margin: 0, fontStyle: 'italic', fontSize: '1.5rem', marginBottom: '10px' }}>
            PLANEJAMENTO SEMANAL (CURTO PRAZO)
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <select
                value={projetoSelecionado}
                onChange={(e) => setProjetoSelecionado(e.target.value)}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', minWidth: '300px', fontSize: '0.9rem', outline: 'none' }}
              >
                <option value="">-- Selecione uma Obra --</option>
                {projetosLista.map(p => (
                  <option key={p.id} value={p.id}>#{p.id} - {p.nome_projeto}</option>
                ))}
              </select>
            </div>
            
            {projetoSelecionado && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f7fafc', padding: '5px 15px', borderRadius: '6px', border: '1px solid #cbd5e0' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4a5568' }}>Exibindo Semana:</label>
                <input 
                  type="number" 
                  min="1" 
                  value={semanaAtual} 
                  onChange={(e) => setSemanaAtual(e.target.value)} 
                  style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e0', textAlign: 'center' }} 
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {!projetoSelecionado ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7fafc', borderRadius: '8px', border: '2px dashed #cbd5e0' }}>
          <div style={{ textAlign: 'center', color: '#718096' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🏗️</span>
            <h2>Nenhuma Obra Selecionada</h2>
            <p>Selecione um projeto no menu acima para gerenciar as metas da semana.</p>
          </div>
        </div>
      ) : (
        <>
          {/* DASHBOARD DE MÉTRICAS (PPC) */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {/* Bloco 1: Quantidades */}
            <div style={{ display: 'flex', gap: '15px', flex: 1, minWidth: '250px' }}>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#718096', display: 'block', marginBottom: '5px' }}>PROGRAMADAS (SEM. {semanaAtual})</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#2a4365' }}>{totalProgramadas}</span>
              </div>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#718096', display: 'block', marginBottom: '5px' }}>CONCLUÍDAS (SEM. {semanaAtual})</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#38a169' }}>{totalConcluidas}</span>
              </div>
            </div>

            {/* Bloco 2: PPC */}
            <div style={{ display: 'flex', gap: '15px', flex: 2, minWidth: '400px' }}>
              <div style={{ flex: 1, backgroundColor: ppcSemana >= metaPpc ? '#f0fff4' : '#fff5f5', padding: '15px', borderRadius: '8px', border: `1px solid ${ppcSemana >= metaPpc ? '#9ae6b4' : '#feb2b2'}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: ppcSemana >= metaPpc ? '#22543d' : '#742a2a', display: 'block', marginBottom: '5px' }}>PPC DA SEMANA</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '900', color: ppcSemana >= metaPpc ? '#38a169' : '#e53e3e' }}>{ppcSemana.toFixed(2)}%</span>
              </div>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#718096', display: 'block', marginBottom: '5px' }}>PPC ACUMULADO</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#2b6cb0' }}>{ppcAcumulado.toFixed(2)}%</span>
              </div>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#718096', display: 'block', marginBottom: '5px' }}>META PPC (%)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="number" value={metaPpc} onChange={(e) => setMetaPpc(e.target.value)} style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e0', fontWeight: 'bold', color: '#2b6cb0' }} />
                  <span style={{ fontWeight: 'bold', color: '#4a5568' }}>%</span>
                </div>
              </div>
            </div>
          </div>

          {/* TABELA DE PLANEJAMENTO SEMANAL */}
          <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'white', border: '1px solid #cbd5e0', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <table style={{ borderCollapse: 'collapse', whiteSpace: 'nowrap', width: '100%', minWidth: '1600px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px 8px', borderRight: '1px solid #2a4365', width: '40px' }}>ID</th>
                  <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px 8px', borderRight: '1px solid #2a4365', width: '130px' }}>DATA DO<br/>PLANEJAMENTO</th>
                  <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px 8px', borderRight: '1px solid #2a4365', minWidth: '150px' }}>LOCAL</th>
                  <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px 8px', borderRight: '1px solid #2a4365', width: '90px' }}>Nº SEMANA</th>
                  <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px 8px', borderRight: '1px solid #2a4365', width: '180px' }}>RESPONSÁVEL</th>
                  <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px 8px', borderRight: '1px solid #2a4365', minWidth: '350px' }}>ATIVIDADE</th>
                  <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px 8px', borderRight: '1px solid #2a4365', width: '100px' }}>CONCLUÍDA?</th>
                  <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px 8px', borderRight: '1px solid #2a4365', width: '80px' }}>UNID.</th>
                  <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px 8px', borderRight: '1px solid #2a4365', width: '120px' }}>QTD.<br/>PROGRAMADA</th>
                  <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px 8px', borderRight: '1px solid #2a4365', width: '120px' }}>QTD.<br/>EXECUTADA</th>
                  <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px 8px', borderRight: '1px solid #2a4365', width: '100px' }}>% FÍSICO</th>
                  <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px 8px', borderRight: '1px solid #2a4365', minWidth: '250px' }}>CAUSA DO NÃO<br/>CUMPRIMENTO</th>
                  <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '12px 8px', minWidth: '250px' }}>OBSERVAÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {tarefas.filter(t => t.numSemana == semanaAtual).map((tarefa) => {
                  const idNum = globalIdCounter++;
                  
                  // Cálculo do % Físico
                  let percentualFisico = 0;
                  const qP = parseFloat(tarefa.qtdProgramada?.replace(',', '.') || 0);
                  const qE = parseFloat(tarefa.qtdExecutada?.replace(',', '.') || 0);
                  if (qP > 0) percentualFisico = (qE / qP) * 100;
                  
                  // Estilo da Célula Concluída
                  let concluidaStyle = { backgroundColor: 'transparent', color: '#2d3748' };
                  if (tarefa.concluida === 'SIM') concluidaStyle = { backgroundColor: '#38a169', color: 'white', fontWeight: 'bold' };
                  if (tarefa.concluida === 'NÃO') concluidaStyle = { backgroundColor: '#e53e3e', color: 'white', fontWeight: 'bold' };

                  return (
                    <tr key={tarefa.id} style={{ borderBottom: '1px dotted #cbd5e0', backgroundColor: tarefa.concluida === 'SIM' ? '#f0fff4' : 'white' }}>
                      <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e2e8f0', color: '#4a5568', fontWeight: '500' }}>{idNum}</td>
                      <td style={{ padding: '4px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <input type="date" value={tarefa.dataPlanejamento} onChange={(e) => atualizarTarefa(tarefa.id, 'dataPlanejamento', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.8rem', textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0' }}>
                        <input type="text" value={tarefa.local} onChange={(e) => atualizarTarefa(tarefa.id, 'local', e.target.value)} list="lista-locais" placeholder="Ex: PV2 ZONA 1" style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem' }} />
                      </td>
                      <td style={{ padding: '4px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <input type="number" value={tarefa.numSemana} onChange={(e) => atualizarTarefa(tarefa.id, 'numSemana', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0' }}>
                        <input type="text" value={tarefa.responsavel} onChange={(e) => atualizarTarefa(tarefa.id, 'responsavel', e.target.value)} placeholder="Engenheiro/Mestre" style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem' }} />
                      </td>
                      <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0' }}>
                        <input type="text" value={tarefa.atividade} onChange={(e) => atualizarTarefa(tarefa.id, 'atividade', e.target.value)} placeholder="Descreva a atividade..." style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 'bold', color: '#2a4365' }} />
                      </td>
                      
                      {/* STATUS CONCLUÍDA */}
                      <td style={{ padding: '2px', borderRight: '1px solid #e2e8f0', backgroundColor: concluidaStyle.backgroundColor }}>
                        <select
                          value={tarefa.concluida}
                          onChange={(e) => atualizarTarefa(tarefa.id, 'concluida', e.target.value)}
                          style={{ width: '100%', height: '100%', padding: '6px', backgroundColor: 'transparent', color: concluidaStyle.color, border: 'none', outline: 'none', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', textAlignLast: 'center', appearance: 'none', cursor: 'pointer' }}
                        >
                          <option value=""></option>
                          <option value="SIM">SIM</option>
                          <option value="NÃO">NÃO</option>
                        </select>
                      </td>

                      <td style={{ padding: '4px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <input type="text" value={tarefa.unidade} onChange={(e) => atualizarTarefa(tarefa.id, 'unidade', e.target.value)} placeholder="M² / UN" style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '4px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <input type="text" value={tarefa.qtdProgramada} onChange={(e) => atualizarTarefa(tarefa.id, 'qtdProgramada', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '4px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <input type="text" value={tarefa.qtdExecutada} onChange={(e) => atualizarTarefa(tarefa.id, 'qtdExecutada', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '4px', borderRight: '1px solid #e2e8f0', textAlign: 'center', backgroundColor: percentualFisico < 100 ? '#fed7d7' : 'transparent', fontWeight: 'bold', color: percentualFisico < 100 ? '#c53030' : '#2d3748' }}>
                        {percentualFisico.toFixed(2)}%
                      </td>
                      
                      <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0' }}>
                        <input type="text" value={tarefa.causaNaoCumprimento} onChange={(e) => atualizarTarefa(tarefa.id, 'causaNaoCumprimento', e.target.value)} list="lista-causas" placeholder="Se NÃO, por quê?" disabled={tarefa.concluida === 'SIM'} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', opacity: tarefa.concluida === 'SIM' ? 0.3 : 1 }} />
                      </td>
                      <td style={{ padding: '4px 8px', borderRight: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <input type="text" value={tarefa.observacoes} onChange={(e) => atualizarTarefa(tarefa.id, 'observacoes', e.target.value)} placeholder="..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem' }} />
                        <button onClick={() => removerTarefa(tarefa.id)} title="Excluir Tarefa" style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                      </td>
                    </tr>
                  );
                })}
                
                <tr>
                  <td colSpan={13} style={{ padding: '15px', backgroundColor: '#f7fafc', textAlign: 'left', borderTop: '1px solid #cbd5e0' }}>
                    <button 
                      onClick={adicionarTarefa} 
                      style={{ backgroundColor: '#2a4365', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                    >
                      + Adicionar Tarefa na Semana {semanaAtual}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
