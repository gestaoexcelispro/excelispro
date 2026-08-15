'use client';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { supabase } from '../../../../lib/supabase';

// Dicionário de serviços e cores (adicionado SUP para restrições/suprimidos)
const SERVICOS_CORES = {
  '': { label: '', color: 'transparent', text: '#000' },
  'FUN': { label: 'Fundação', color: '#ff00ff', text: '#fff' },
  'PNS': { label: 'Painelização Aço', color: '#9900cc', text: '#fff' },
  'VTS': { label: 'Estrutura', color: '#0000ff', text: '#fff' },
  'BUF': { label: 'Buffer', color: '#000000', text: '#fff' },
  'VEX': { label: 'Vedações Externas', color: '#00ffff', text: '#000' },
  'COB': { label: 'Cobertura', color: '#993333', text: '#fff' },
  'INS': { label: 'Instalações', color: '#3366cc', text: '#fff' },
  'LMI': { label: 'Limpeza e Miudezas', color: '#00cc00', text: '#fff' },
  'VIN': { label: 'Piso Vinílico', color: '#ff9900', text: '#fff' },
  'FOR': { label: 'Forro', color: '#336600', text: '#fff' },
  'PIN': { label: 'Pintura', color: '#808000', text: '#fff' },
  'SUP': { label: 'Restrição / Suprimido', color: '#ff0000', text: '#fff' }, // NOVO: SUPRIMIDO
  'OFF': { label: 'Fim de Semana', color: '#a0aec0', text: '#fff' },
  'FER': { label: 'Feriado', color: '#e53e3e', text: '#fff' },
};

const COLUNAS_KOSKELA = [
  'PROJETOS', 'MATERIAIS', 'MÃO DE OBRA', 'EQUIPAMENTOS', 'ESPAÇO', 'PREDECESSORA', 'CONDIÇÕES EXTERNAS'
];

export default function LookaheadPage() {
  const { lang } = useLanguage();
  
  // --- ESTADOS DE PROJETO ---
  const [projetosLista, setProjetosLista] = useState([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState('');

  // --- ESTADOS DO LOOKAHEAD ---
  const [dataInicio, setDataInicio] = useState('2026-08-10'); // Data base para a Semana 1
  const [ocultarFinaisDeSemana, setOcultarFinaisDeSemana] = useState(true); // Finais de semana ocultos por padrão
  
  const [semanasPlanilha, setSemanasPlanilha] = useState([]);
  const [dadosCelulas, setDadosCelulas] = useState({});
  const [dadosKoskela, setDadosKoskela] = useState({});
  const [zonasColeta, setZonasColeta] = useState([]);

  // Linhas do Lookahead (Planas, conforme a imagem)
  const [linhas, setLinhas] = useState([
    { id: 'l1', descricao: 'FUNDAÇÃO' },
    { id: 'l2', descricao: 'PAINELIZAÇÃO AÇO' },
    { id: 'l3', descricao: 'ESTRUTURA PV1' },
    { id: 'l4', descricao: 'ESTRUTURA PV2' },
    { id: 'l5', descricao: 'COBERTURA' },
    { id: 'l6', descricao: 'VEDAÇÕES EXTERNAS PV 2' },
    { id: 'l7', descricao: 'VEDAÇÕES EXTERNAS PV 1' },
    { id: 'l8', descricao: 'PV2 ZONA 1' },
    { id: 'l9', descricao: 'PV2 ZONA 2' },
    { id: 'l10', descricao: 'PV2 ZONA 3' },
  ]);

  // Busca os projetos cadastrados
  useEffect(() => {
    const fetchProjetos = async () => {
      const { data } = await supabase.from('projetos').select('id, nome_projeto').order('id', { ascending: false });
      if (data) setProjetosLista(data);
    };
    fetchProjetos();
  }, []);

  // Busca as Zonas do projeto selecionado para o Datalist
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

  // Gerador de Semanas (Sempre gera exatamente 6 semanas a partir da data de início)
  useEffect(() => {
    const gerarSemanas = () => {
      if (!dataInicio) return;

      const [ano, mes, dia] = dataInicio.split('-');
      let dataAtual = new Date(ano, mes - 1, dia);

      const semanasTemp = [];
      const diasSemanaNomes = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

      for (let w = 1; w <= 6; w++) {
        const diasDaSemana = [];
        for (let d = 0; d < 7; d++) {
          const dataClonada = new Date(dataAtual);
          const dd = String(dataClonada.getDate()).padStart(2, '0');
          const mm = String(dataClonada.getMonth() + 1).padStart(2, '0');
          const diaSemanaIndex = dataClonada.getDay();
          
          diasDaSemana.push({
            dataCompleta: dataClonada,
            labelData: `${dd}/${mm}`,
            labelSemana: diasSemanaNomes[diaSemanaIndex],
            isFimDeSemana: diaSemanaIndex === 0 || diaSemanaIndex === 6
          });
          
          dataAtual.setDate(dataAtual.getDate() + 1);
        }
        semanasTemp.push({ numero: w, dias: diasDaSemana });
      }
      setSemanasPlanilha(semanasTemp);
    };
    gerarSemanas();
  }, [dataInicio]);

  // Função para apontamento de datas
  const handleCellChange = (linhaId, dataLabel, valor) => {
    setDadosCelulas(prev => ({ ...prev, [`${linhaId}___${dataLabel}`]: valor }));
  };

  // Função para apontamento da Matriz de Koskela
  const handleKoskelaChange = (linhaId, colunaKoskela, valor) => {
    setDadosKoskela(prev => ({ ...prev, [`${linhaId}___${colunaKoskela}`]: valor }));
  };

  // Funções de manipulação de linhas
  const adicionarLinha = () => {
    setLinhas([...linhas, { id: `l_${Date.now()}`, descricao: '' }]);
  };

  const atualizarLinha = (id, valor) => {
    setLinhas(linhas.map(l => l.id === id ? { ...l, descricao: valor } : l));
  };

  const removerLinha = (id) => {
    setLinhas(linhas.filter(l => l.id !== id));
  };

  // Renderiza as semanas filtrando finais de semana se necessário
  const semanasRenderizadas = semanasPlanilha.map(semana => {
    return {
      ...semana,
      diasVisiveis: semana.dias.filter(d => ocultarFinaisDeSemana ? !d.isFimDeSemana : true)
    };
  });

  // CORREÇÃO: Calcula o total exato de colunas de dias para preencher a linha final da tabela sem quebrar
  const totalDiasVisiveis = semanasRenderizadas.reduce((total, semana) => total + semana.diasVisiveis.length, 0);

  let globalIdCounter = 1;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      
      <datalist id="lista-zonas-lookahead">
        {zonasColeta.map((zona, idx) => <option key={idx} value={zona} />)}
      </datalist>

      {/* CABEÇALHO DA PÁGINA */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ color: '#2A4365', margin: 0, fontStyle: 'italic', fontSize: '1.5rem', marginBottom: '10px' }}>
            LOOKAHEAD (MÉDIO PRAZO) & MATRIZ DE KOSKELA
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
          </div>
        </div>

        {projetoSelecionado && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setOcultarFinaisDeSemana(!ocultarFinaisDeSemana)}
              style={{ backgroundColor: ocultarFinaisDeSemana ? '#2a4365' : '#edf2f7', color: ocultarFinaisDeSemana ? 'white' : '#4a5568', border: '1px solid #cbd5e0', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
            >
              {ocultarFinaisDeSemana ? 'Mostrar Finais de Semana' : 'Ocultar Finais de Semana'}
            </button>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#f7fafc', padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#4a5568', marginBottom: '2px' }}>Início da Semana 1</label>
                <input 
                  type="date" 
                  value={dataInicio} 
                  onChange={(e) => setDataInicio(e.target.value)} 
                  style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e0', outline: 'none', color: '#2d3748', cursor: 'pointer', fontSize: '0.85rem' }} 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {!projetoSelecionado ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7fafc', borderRadius: '8px', border: '2px dashed #cbd5e0' }}>
          <div style={{ textAlign: 'center', color: '#718096' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🏗️</span>
            <h2>Nenhuma Obra Selecionada</h2>
            <p>Selecione um projeto no menu acima para abrir o Lookahead.</p>
          </div>
        </div>
      ) : (
        <>
          {/* CONTAINER DA PLANILHA */}
          <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'white', border: '1px solid #cbd5e0', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <table style={{ borderCollapse: 'collapse', whiteSpace: 'nowrap', width: '100%' }}>
              
              {/* HEADER DA TABELA */}
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#e2e8f0' }}>
                
                {/* LINHA 1: TÍTULOS GERAIS (SEMANAS E KOSKELA) */}
                <tr>
                  <th colSpan={2} style={{ position: 'sticky', left: 0, zIndex: 11, backgroundColor: 'white', borderRight: '1px solid #cbd5e0', padding: '4px', textAlign: 'left', fontStyle: 'italic', color: '#1a365d' }}>
                    LOOKAHEAD
                  </th>
                  {semanasRenderizadas.map((semana) => (
                    semana.diasVisiveis.length > 0 && (
                      <th key={`sem-${semana.numero}`} colSpan={semana.diasVisiveis.length} style={{ backgroundColor: 'white', borderRight: '2px solid #2a4365', padding: '4px 0', fontSize: '0.8rem', color: '#2d3748', textAlign: 'center' }}>
                        SEMANA {semana.numero}
                      </th>
                    )
                  ))}
                  <th colSpan={COLUNAS_KOSKELA.length} style={{ backgroundColor: '#ed8936', color: 'white', borderBottom: '1px solid #dd6b20', padding: '4px 0', fontSize: '0.85rem', fontStyle: 'italic', letterSpacing: '1px' }}>
                    MATRIZ DE FLUXO DE KOSKELA
                  </th>
                </tr>

                {/* LINHA 2: ID, DESCRIÇÃO, DATAS e COLUNAS KOSKELA */}
                <tr>
                  <th rowSpan={2} style={{ position: 'sticky', left: 0, zIndex: 11, backgroundColor: '#ff6600', color: 'white', padding: '8px', borderRight: '1px solid #fff', borderTop: '2px solid #fff', width: '40px' }}>ID</th>
                  <th rowSpan={2} style={{ position: 'sticky', left: '40px', zIndex: 11, backgroundColor: '#ff6600', color: 'white', padding: '8px 15px', borderRight: '1px solid #cbd5e0', borderTop: '2px solid #fff', textAlign: 'left', minWidth: '280px' }}>DESCRIÇÃO</th>
                  
                  {/* DATAS */}
                  {semanasRenderizadas.map(s => s.diasVisiveis.map((d, i) => (
                    <th key={`data-${s.numero}-${i}`} style={{ backgroundColor: '#edf2f7', borderRight: i === s.diasVisiveis.length - 1 ? '2px solid #2a4365' : '1px dotted #cbd5e0', borderBottom: '1px solid #cbd5e0', borderTop: '1px solid #cbd5e0', padding: '4px 2px', fontSize: '0.8rem', color: '#1a365d', textAlign: 'center' }}>
                      {d.labelData}
                    </th>
                  )))}

                  {/* COLUNAS KOSKELA */}
                  {COLUNAS_KOSKELA.map((col, idx) => (
                    <th key={`k-${idx}`} rowSpan={2} style={{ backgroundColor: '#f6ad55', color: '#1a365d', borderRight: '1px solid #dd6b20', borderTop: '1px solid #dd6b20', padding: '4px 10px', fontSize: '0.7rem', width: '100px', whiteSpace: 'normal', lineHeight: '1.2' }}>
                      {col}
                    </th>
                  ))}
                </tr>

                {/* LINHA 3: DIAS DA SEMANA */}
                <tr>
                  {semanasRenderizadas.map(s => s.diasVisiveis.map((d, i) => (
                    <th key={`sem-${s.numero}-${i}`} style={{ backgroundColor: d.isFimDeSemana ? '#cbd5e0' : '#f7fafc', borderRight: i === s.diasVisiveis.length - 1 ? '2px solid #2a4365' : '1px dotted #cbd5e0', borderBottom: '1px solid #cbd5e0', padding: '4px 2px', fontSize: '0.75rem', color: '#4a5568', fontWeight: d.isFimDeSemana ? 'bold' : 'normal', textAlign: 'center' }}>
                      {d.labelSemana}
                    </th>
                  )))}
                </tr>
              </thead>

              {/* CORPO DA TABELA */}
              <tbody>
                {linhas.map((linha) => {
                  const currentId = globalIdCounter++;
                  return (
                    <tr key={linha.id} style={{ borderBottom: '1px dotted #cbd5e0' }}>
                      
                      {/* ID e DESCRIÇÃO */}
                      <td style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: 'white', padding: '4px', textAlign: 'center', color: '#4a5568', borderRight: '1px solid #e2e8f0', fontWeight: '500' }}>
                        {currentId}
                      </td>
                      <td style={{ position: 'sticky', left: '40px', zIndex: 5, backgroundColor: 'white', padding: '4px 10px', borderRight: '2px solid #cbd5e0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            value={linha.descricao} 
                            onChange={(e) => atualizarLinha(linha.id, e.target.value)} 
                            list="lista-zonas-lookahead"
                            placeholder="Selecione ou digite a etapa..."
                            style={{ width: '90%', border: 'none', outline: 'none', background: 'transparent', color: '#2d3748', fontSize: '0.85rem' }}
                          />
                          <button onClick={() => removerLinha(linha.id)} title="Excluir linha" style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                        </div>
                      </td>
                      
                      {/* CÉLULAS DE DATAS (Lookahead) */}
                      {semanasRenderizadas.map(s => s.diasVisiveis.map((d, i) => {
                        const cellKey = `${linha.id}___${d.labelData}`;
                        const valorSalvo = dadosCelulas[cellKey];
                        
                        const valorEfetivo = valorSalvo !== undefined ? valorSalvo : (d.isFimDeSemana ? 'OFF' : '');
                        const configCor = SERVICOS_CORES[valorEfetivo] || SERVICOS_CORES[''];

                        let bgColor = 'transparent';
                        if (configCor.color !== 'transparent') bgColor = configCor.color;
                        else if (d.isFimDeSemana) bgColor = '#e2e8f0';

                        return (
                          <td key={cellKey} style={{ borderRight: i === s.diasVisiveis.length - 1 ? '2px solid #2a4365' : '1px dotted #cbd5e0', padding: '1px', backgroundColor: bgColor, textAlign: 'center', minWidth: '45px', height: '26px' }}>
                            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <select
                                value={valorEfetivo}
                                onChange={(e) => handleCellChange(linha.id, d.labelData, e.target.value)}
                                style={{ width: '100%', height: '100%', backgroundColor: configCor.color, color: configCor.text, border: 'none', outline: 'none', fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center', textAlignLast: 'center', appearance: 'none', cursor: 'pointer', borderRadius: '2px', padding: '0 4px' }}
                              >
                                <option value=""></option>
                                {Object.keys(SERVICOS_CORES).filter(k => k !== '').map(sigla => (
                                  <option key={sigla} value={sigla}>{sigla}</option>
                                ))}
                              </select>
                              <div style={{ position: 'absolute', right: '2px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.45rem', color: configCor.text === '#fff' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}>▼</div>
                            </div>
                          </td>
                        );
                      }))}

                      {/* CÉLULAS DA MATRIZ DE KOSKELA */}
                      {COLUNAS_KOSKELA.map((col, idx) => {
                        const koskelaKey = `${linha.id}___${col}`;
                        const val = dadosKoskela[koskelaKey] || '';
                        
                        let bgColor = 'transparent';
                        let textColor = '#2d3748';
                        if (val === 'Sim') { bgColor = '#c6f6d5'; textColor = '#22543d'; }
                        if (val === 'Não') { bgColor = '#fed7d7'; textColor = '#742a2a'; }

                        return (
                          <td key={koskelaKey} style={{ borderRight: '1px dotted #cbd5e0', padding: '1px', backgroundColor: bgColor, textAlign: 'center', minWidth: '100px', height: '26px' }}>
                            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <select
                                value={val}
                                onChange={(e) => handleKoskelaChange(linha.id, col, e.target.value)}
                                style={{ width: '100%', height: '100%', backgroundColor: 'transparent', color: textColor, border: 'none', outline: 'none', fontSize: '0.75rem', fontWeight: val ? 'bold' : 'normal', textAlign: 'center', textAlignLast: 'center', appearance: 'none', cursor: 'pointer', padding: '0 4px' }}
                              >
                                <option value=""></option>
                                <option value="Sim">Sim</option>
                                <option value="Não">Não</option>
                              </select>
                              <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.5rem', color: val ? textColor : 'rgba(0,0,0,0.3)' }}>▼</div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                
                {/* BOTÃO ADICIONAR LINHA */}
                <tr>
                  <td colSpan={2} style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: 'white', padding: '10px 15px', borderBottom: '1px solid #cbd5e0' }}>
                    <button onClick={adicionarLinha} style={{ backgroundColor: '#ebf8ff', color: '#2b6cb0', border: '1px dashed #3182ce', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                      + Adicionar Nova Linha
                    </button>
                  </td>
                  {/* CORREÇÃO DO COLSPAN AQUI: Usando totalDiasVisiveis */}
                  <td colSpan={totalDiasVisiveis + COLUNAS_KOSKELA.length} style={{ borderBottom: '1px solid #cbd5e0', backgroundColor: 'white' }}></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* LEGENDA */}
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e0', display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            <span style={{ fontWeight: 'bold', color: '#1a365d' }}>LEGENDA (KOSKELA):</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '12px', height: '12px', backgroundColor: '#c6f6d5', borderRadius: '2px', border: '1px solid #22543d' }}></div><span style={{ color: '#22543d' }}><b>Sim</b> - Liberado</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '12px', height: '12px', backgroundColor: '#fed7d7', borderRadius: '2px', border: '1px solid #742a2a' }}></div><span style={{ color: '#742a2a' }}><b>Não</b> - Restrição Ativa</span></div>
            
            <div style={{ width: '1px', height: '15px', backgroundColor: '#cbd5e0', margin: '0 5px' }}></div>
            
            <span style={{ fontWeight: 'bold', color: '#1a365d' }}>LEGENDA (SERVIÇOS):</span>
            {Object.entries(SERVICOS_CORES).filter(([sigla]) => sigla !== '').map(([sigla, info]) => (
              <div key={sigla} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: info.color, borderRadius: '2px', border: '1px solid #cbd5e0' }}></div>
                <span><b>{sigla}</b> - {info.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}
