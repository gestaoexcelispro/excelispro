'use client';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { supabase } from '../../../../lib/supabase';

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
  'SUP': { label: 'Restrição / Suprimido', color: '#ff0000', text: '#fff' },
  'OFF': { label: 'Fim de Semana', color: '#a0aec0', text: '#fff' },
  'FER': { label: 'Feriado', color: '#e53e3e', text: '#fff' },
};

const COLUNAS_KOSKELA = [
  'PROJETOS', 'MATERIAIS', 'MÃO DE OBRA', 'EQUIPAMENTOS', 'ESPAÇO', 'PREDECESSORA', 'CONDIÇÕES EXTERNAS'
];

export default function LookaheadPage() {
  const { lang } = useLanguage();
  
  const [projetosLista, setProjetosLista] = useState([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('planilha');

  const [dataInicio, setDataInicio] = useState('2026-08-10');
  const [ocultarFinaisDeSemana, setOcultarFinaisDeSemana] = useState(true);
  
  const [semanasPlanilha, setSemanasPlanilha] = useState([]);
  const [dadosCelulas, setDadosCelulas] = useState({});
  const [dadosKoskela, setDadosKoskela] = useState({});
  const [restricoes, setRestricoes] = useState([]);

  const [masterPlanTarefas, setMasterPlanTarefas] = useState([]);

  const [linhas, setLinhas] = useState([
    { id: 'l1', descricao: '' }
  ]);

  useEffect(() => {
    const fetchProjetos = async () => {
      const { data } = await supabase.from('projetos').select('id, nome_projeto').order('id', { ascending: false });
      if (data) setProjetosLista(data);
    };
    fetchProjetos();
  }, []);

  useEffect(() => {
    const fetchDadosDoProjeto = async () => {
      if (!projetoSelecionado) { 
        setMasterPlanTarefas([]);
        return; 
      }
      
      const { data: mpData, error } = await supabase
        .from('projetos_masterplan')
        .select('dados_linhas, dados_celulas')
        .eq('projeto_id', projetoSelecionado)
        .single();

      if (mpData && mpData.dados_linhas) {
        const tarefasMapeadas = mpData.dados_linhas.flatMap(secao => 
          secao.linhas.map(linha => {
            const celulasDaLinha = {};
            if (mpData.dados_celulas) {
              Object.keys(mpData.dados_celulas).forEach(key => {
                if (key.startsWith(`${linha.id}___`)) {
                  const dataLabel = key.split('___')[1];
                  celulasDaLinha[dataLabel] = mpData.dados_celulas[key];
                }
              });
            }
            return { id: linha.id, descricao: linha.descricao, celulas: celulasDaLinha };
          })
        );
        setMasterPlanTarefas(tarefasMapeadas);
      }
    };
    fetchDadosDoProjeto();
  }, [projetoSelecionado]);

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

  const handleCellChange = (linhaId, dataLabel, valor) => {
    setDadosCelulas(prev => ({ ...prev, [`${linhaId}___${dataLabel}`]: valor }));
  };

  const handleKoskelaChange = (linhaId, colunaKoskela, valor) => {
    setDadosKoskela(prev => ({ ...prev, [`${linhaId}___${colunaKoskela}`]: valor }));

    if (valor === 'Não') {
      setRestricoes(prev => {
        const jaExiste = prev.find(r => r.linhaId === linhaId && r.restricao === colunaKoskela);
        if (jaExiste) return prev;

        const linhaReferencia = linhas.find(l => l.id === linhaId);
        
        let codigoSugerido = '';
        for (const key in dadosCelulas) {
          if (key.startsWith(`${linhaId}___`) && dadosCelulas[key] && !['OFF', 'FER', 'SUP'].includes(dadosCelulas[key])) {
            codigoSugerido = dadosCelulas[key];
            break;
          }
        }

        const novaRestricao = {
          id: `rest_${Date.now()}`,
          linhaId: linhaId,
          tarefa: linhaReferencia ? linhaReferencia.descricao : '',
          codigoTarefa: codigoSugerido,
          restricao: colunaKoskela,
          motivo: '',
          acao: '',
          responsavel: '',
          dataStatus: new Date().toISOString().split('T')[0],
          status: 'NÃO RESOLVIDO'
        };

        return [...prev, novaRestricao];
      });
    }
  };

  const atualizarLinha = (id, valorDigitado) => {
    setLinhas(linhas.map(l => l.id === id ? { ...l, descricao: valorDigitado } : l));

    const tarefaMPEncontrada = masterPlanTarefas.find(t => t.descricao === valorDigitado);
    if (tarefaMPEncontrada) {
      setDadosCelulas(prev => {
        const novosDados = { ...prev };
        Object.keys(tarefaMPEncontrada.celulas).forEach(dataLabel => {
          if (tarefaMPEncontrada.celulas[dataLabel]) {
            novosDados[`${id}___${dataLabel}`] = tarefaMPEncontrada.celulas[dataLabel];
          }
        });
        return novosDados;
      });
    }
  };

  const adicionarLinha = () => setLinhas([...linhas, { id: `l_${Date.now()}`, descricao: '' }]);
  const removerLinha = (id) => setLinhas(linhas.filter(l => l.id !== id));

  const atualizarRestricao = (id, campo, valor) => setRestricoes(prev => prev.map(r => r.id === id ? { ...r, [campo]: valor } : r));
  const removerRestricao = (id) => { if (window.confirm('Tem certeza que deseja remover esta restrição?')) setRestricoes(prev => prev.filter(r => r.id !== id)); };

  const semanasRenderizadas = semanasPlanilha.map(semana => ({
    ...semana,
    diasVisiveis: semana.dias.filter(d => ocultarFinaisDeSemana ? !d.isFimDeSemana : true)
  }));
  const totalDiasVisiveis = semanasRenderizadas.reduce((total, semana) => total + semana.diasVisiveis.length, 0);

  let globalIdCounter = 1;
  let restricaoIdCounter = 1;

  const getStatusStyle = (status) => {
    if (status === 'EM ANDAMENTO') return { backgroundColor: '#fefcbf', color: '#975a16' };
    if (status === 'NÃO RESOLVIDO') return { backgroundColor: '#9b2c2c', color: '#fff' };
    if (status === 'RESOLVIDO') return { backgroundColor: '#c6f6d5', color: '#22543d' };
    return { backgroundColor: 'white', color: '#000' };
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      
      <datalist id="lista-zonas-lookahead">
        {masterPlanTarefas.length > 0 && (
          masterPlanTarefas.map((t, idx) => <option key={`mp-${idx}`} value={t.descricao} />)
        )}
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
            
            {projetoSelecionado && masterPlanTarefas.length > 0 && (
              <span style={{ fontSize: '0.75rem', backgroundColor: '#ebf8ff', color: '#2b6cb0', padding: '6px 10px', borderRadius: '4px', border: '1px solid #90cdf4', fontWeight: 'bold' }}>
                🔗 Integração com Master Plan Ativa
              </span>
            )}
          </div>
        </div>

        {projetoSelecionado && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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
          {/* NAVEGAÇÃO DE ABAS */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button 
              onClick={() => setAbaAtiva('planilha')}
              style={{ padding: '10px 20px', borderRadius: '6px 6px 0 0', fontWeight: 'bold', border: '1px solid #cbd5e0', borderBottom: abaAtiva === 'planilha' ? 'none' : '1px solid #cbd5e0', backgroundColor: abaAtiva === 'planilha' ? 'white' : '#edf2f7', color: abaAtiva === 'planilha' ? '#2a4365' : '#718096', cursor: 'pointer', zIndex: abaAtiva === 'planilha' ? 2 : 1, transform: abaAtiva === 'planilha' ? 'translateY(1px)' : 'none' }}
            >
              📅 Planilha Lookahead e Koskela
            </button>
            <button 
              onClick={() => setAbaAtiva('restricoes')}
              style={{ padding: '10px 20px', borderRadius: '6px 6px 0 0', fontWeight: 'bold', border: '1px solid #cbd5e0', borderBottom: abaAtiva === 'restricoes' ? 'none' : '1px solid #cbd5e0', backgroundColor: abaAtiva === 'restricoes' ? 'white' : '#edf2f7', color: abaAtiva === 'restricoes' ? '#e53e3e' : '#718096', cursor: 'pointer', zIndex: abaAtiva === 'restricoes' ? 2 : 1, transform: abaAtiva === 'restricoes' ? 'translateY(1px)' : 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              ⚠️ Detalhamento das Restrições
              {restricoes.length > 0 && (
                <span style={{ backgroundColor: '#e53e3e', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem' }}>{restricoes.length}</span>
              )}
            </button>
          </div>

          {/* ABA 1: PLANILHA LOOKAHEAD E KOSKELA */}
          {abaAtiva === 'planilha' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setOcultarFinaisDeSemana(!ocultarFinaisDeSemana)} style={{ backgroundColor: ocultarFinaisDeSemana ? '#2a4365' : '#edf2f7', color: ocultarFinaisDeSemana ? 'white' : '#4a5568', border: '1px solid #cbd5e0', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                  {ocultarFinaisDeSemana ? 'Mostrar Finais de Semana' : 'Ocultar Finais de Semana'}
                </button>
              </div>

              <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'white', border: '1px solid #cbd5e0', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <table style={{ borderCollapse: 'collapse', whiteSpace: 'nowrap', width: '100%' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#e2e8f0' }}>
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
                    <tr>
                      <th rowSpan={2} style={{ position: 'sticky', left: 0, zIndex: 11, backgroundColor: '#1a365d', color: 'white', padding: '8px', borderRight: '1px solid #2a4365', width: '40px' }}>ID</th>
                      <th rowSpan={2} style={{ position: 'sticky', left: '40px', zIndex: 11, backgroundColor: '#1a365d', color: 'white', padding: '8px 15px', borderRight: '1px solid #2a4365', textAlign: 'left', minWidth: '280px' }}>DESCRIÇÃO</th>
                      {semanasRenderizadas.map(s => s.diasVisiveis.map((d, i) => (
                        <th key={`data-${s.numero}-${i}`} style={{ backgroundColor: '#1a365d', borderRight: i === s.diasVisiveis.length - 1 ? '2px solid #2a4365' : '1px solid #2a4365', borderBottom: '1px solid #2a4365', padding: '4px 2px', fontSize: '0.8rem', color: 'white', textAlign: 'center' }}>
                          {d.labelData}
                        </th>
                      )))}
                      {COLUNAS_KOSKELA.map((col, idx) => (
                        <th key={`k-${idx}`} rowSpan={2} style={{ backgroundColor: '#f6ad55', color: '#1a365d', borderRight: '1px solid #dd6b20', borderTop: '1px solid #dd6b20', padding: '4px 10px', fontSize: '0.7rem', width: '100px', whiteSpace: 'normal', lineHeight: '1.2' }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {semanasRenderizadas.map(s => s.diasVisiveis.map((d, i) => (
                        <th key={`sem-${s.numero}-${i}`} style={{ backgroundColor: d.isFimDeSemana ? '#718096' : '#edf2f7', borderRight: i === s.diasVisiveis.length - 1 ? '2px solid #2a4365' : '1px solid #cbd5e0', borderBottom: '1px solid #cbd5e0', padding: '4px 2px', fontSize: '0.75rem', color: d.isFimDeSemana ? 'white' : '#1a365d', fontWeight: 'bold', textAlign: 'center' }}>
                          {d.labelSemana}
                        </th>
                      )))}
                    </tr>
                  </thead>

                  <tbody>
                    {linhas.map((linha) => {
                      const currentId = globalIdCounter++;
                      return (
                        <tr key={linha.id} style={{ borderBottom: '1px dotted #cbd5e0' }}>
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
                                placeholder="Selecione do Master Plan ou digite..."
                                style={{ width: '90%', border: 'none', outline: 'none', background: 'transparent', color: '#2d3748', fontSize: '0.85rem' }}
                              />
                              <button onClick={() => removerLinha(linha.id)} title="Excluir linha" style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                            </div>
                          </td>
                          
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

                          {COLUNAS_KOSKELA.map((col, idx) => {
                            const koskelaKey = `${linha.id}___${col}`;
                            const val = dadosKoskela[koskelaKey] || '';
                            let bgColor = 'transparent'; let textColor = '#2d3748';
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
                    
                    <tr>
                      <td colSpan={2} style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: 'white', padding: '10px 15px', borderBottom: '1px solid #cbd5e0' }}>
                        <button onClick={adicionarLinha} style={{ backgroundColor: '#ebf8ff', color: '#2b6cb0', border: '1px dashed #3182ce', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                          + Adicionar Nova Linha
                        </button>
                      </td>
                      <td colSpan={totalDiasVisiveis + COLUNAS_KOSKELA.length} style={{ borderBottom: '1px solid #cbd5e0', backgroundColor: 'white' }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
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
            </div>
          )}

          {/* ABA 2: DETALHAMENTO DAS RESTRIÇÕES */}
          {abaAtiva === 'restricoes' && (
             <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'white', border: '1px solid #cbd5e0', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <table style={{ borderCollapse: 'collapse', whiteSpace: 'nowrap', width: '100%', minWidth: '1200px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th colSpan={10} style={{ backgroundColor: 'white', padding: '10px 15px', textAlign: 'left', fontStyle: 'italic', color: '#1a365d', borderBottom: '2px solid #ed8936', fontSize: '1.2rem' }}>
                      DETALHAMENTO DAS RESTRIÇÕES
                    </th>
                  </tr>
                  <tr>
                    <th style={{ backgroundColor: '#ed8936', color: 'white', padding: '10px', width: '40px', borderRight: '1px solid #fff' }}>ID</th>
                    <th style={{ backgroundColor: '#ed8936', color: 'white', padding: '10px', textAlign: 'left', borderRight: '1px solid #fff', minWidth: '250px' }}>TAREFA</th>
                    <th style={{ backgroundColor: '#ed8936', color: 'white', padding: '10px', borderRight: '1px solid #fff', width: '120px', lineHeight: '1.2' }}>CÓDIGO DA<br/>TAREFA</th>
                    <th style={{ backgroundColor: '#ed8936', color: 'white', padding: '10px', textAlign: 'left', borderRight: '1px solid #fff', width: '150px' }}>RESTRIÇÃO</th>
                    <th style={{ backgroundColor: '#ed8936', color: 'white', padding: '10px', textAlign: 'left', borderRight: '1px solid #fff', minWidth: '200px' }}>MOTIVO</th>
                    <th style={{ backgroundColor: '#ed8936', color: 'white', padding: '10px', textAlign: 'left', borderRight: '1px solid #fff', minWidth: '200px' }}>AÇÃO</th>
                    <th style={{ backgroundColor: '#ed8936', color: 'white', padding: '10px', textAlign: 'left', borderRight: '1px solid #fff', width: '150px' }}>RESPONSÁVEL</th>
                    <th style={{ backgroundColor: '#ed8936', color: 'white', padding: '10px', borderRight: '1px solid #fff', width: '120px' }}>DATA DE STATUS</th>
                    <th style={{ backgroundColor: '#ed8936', color: 'white', padding: '10px', width: '140px', borderRight: '1px solid #fff' }}>STATUS</th>
                    <th style={{ backgroundColor: '#ed8936', color: 'white', padding: '10px', width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {restricoes.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#a0aec0', fontSize: '1.1rem' }}>
                        🎉 Nenhuma restrição ativa no momento. Que a força do Fluxo Contínuo esteja com você!
                      </td>
                    </tr>
                  ) : (
                    restricoes.map((rest) => {
                      const idNum = restricaoIdCounter++;
                      const corCodigo = SERVICOS_CORES[rest.codigoTarefa] || SERVICOS_CORES[''];
                      const statusStyle = getStatusStyle(rest.status);

                      return (
                        <tr key={rest.id} style={{ borderBottom: '1px dotted #cbd5e0', backgroundColor: rest.status === 'RESOLVIDO' ? '#f0fff4' : 'white' }}>
                          <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e2e8f0', color: '#4a5568', fontWeight: 'bold' }}>{idNum}</td>
                          <td style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0' }}>
                            <input 
                              type="text" 
                              value={rest.tarefa} 
                              onChange={(e) => atualizarRestricao(rest.id, 'tarefa', e.target.value)}
                              style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: '#2d3748', fontSize: '0.85rem' }}
                            />
                          </td>
                          <td style={{ padding: '2px', borderRight: '1px solid #e2e8f0', backgroundColor: corCodigo.color }}>
                            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
                              <select
                                value={rest.codigoTarefa}
                                onChange={(e) => atualizarRestricao(rest.id, 'codigoTarefa', e.target.value)}
                                style={{ width: '100%', padding: '6px', backgroundColor: 'transparent', color: corCodigo.text, border: 'none', outline: 'none', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', textAlignLast: 'center', appearance: 'none', cursor: 'pointer' }}
                              >
                                <option value=""></option>
                                {Object.keys(SERVICOS_CORES).filter(k => k !== '').map(sigla => <option key={sigla} value={sigla}>{sigla}</option>)}
                              </select>
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0' }}>
                            <div style={{ position: 'relative', width: '100%' }}>
                              <select
                                value={rest.restricao}
                                onChange={(e) => atualizarRestricao(rest.id, 'restricao', e.target.value)}
                                style={{ width: '100%', padding: '6px', backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: '0.85rem', color: '#2d3748', appearance: 'none', cursor: 'pointer' }}
                              >
                                <option value=""></option>
                                {COLUNAS_KOSKELA.map(k => <option key={k} value={k}>{k}</option>)}
                              </select>
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0' }}>
                            <input type="text" value={rest.motivo} onChange={(e) => atualizarRestricao(rest.id, 'motivo', e.target.value)} placeholder="Ex: Fundação não concluída" style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: '#2d3748', fontSize: '0.85rem' }} />
                          </td>
                          <td style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0' }}>
                            <input type="text" value={rest.acao} onChange={(e) => atualizarRestricao(rest.id, 'acao', e.target.value)} placeholder="Ex: Concluir predecessoras" style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: '#2d3748', fontSize: '0.85rem' }} />
                          </td>
                          <td style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0' }}>
                            <input type="text" value={rest.responsavel} onChange={(e) => atualizarRestricao(rest.id, 'responsavel', e.target.value)} placeholder="Ex: Engenheiro" style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: '#2d3748', fontSize: '0.85rem', textAlign: 'center' }} />
                          </td>
                          <td style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <input type="date" value={rest.dataStatus} onChange={(e) => atualizarRestricao(rest.id, 'dataStatus', e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', color: '#2d3748', fontSize: '0.85rem', cursor: 'pointer' }} />
                          </td>
                          <td style={{ padding: '2px', borderRight: '1px solid #e2e8f0', backgroundColor: statusStyle.backgroundColor }}>
                            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
                              <select
                                value={rest.status}
                                onChange={(e) => atualizarRestricao(rest.id, 'status', e.target.value)}
                                style={{ width: '100%', padding: '8px 4px', backgroundColor: 'transparent', color: statusStyle.color, border: 'none', outline: 'none', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', textAlignLast: 'center', appearance: 'none', cursor: 'pointer' }}
                              >
                                <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                                <option value="NÃO RESOLVIDO">NÃO RESOLVIDO</option>
                                <option value="RESOLVIDO">RESOLVIDO</option>
                              </select>
                            </div>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <button onClick={() => removerRestricao(rest.id)} title="Excluir Restrição" style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>✖</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  <tr>
                    <td colSpan={10} style={{ padding: '15px', backgroundColor: '#f7fafc', textAlign: 'left', borderTop: '1px solid #cbd5e0' }}>
                      <button 
                        onClick={() => setRestricoes([...restricoes, { id: `rest_${Date.now()}`, linhaId: null, tarefa: '', codigoTarefa: '', restricao: '', motivo: '', acao: '', responsavel: '', dataStatus: new Date().toISOString().split('T')[0], status: 'EM ANDAMENTO' }])} 
                        style={{ backgroundColor: '#ed8936', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                      >
                        + Adicionar Restrição Manual
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
             </div>
          )}
        </>
      )}

    </div>
  );
}
