'use client';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { supabase } from '../../../../lib/supabase';

// Dicionário de serviços e suas cores equivalentes ao padrão visual
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
  'OFF': { label: 'Fim de Semana', color: '#a0aec0', text: '#fff' },
  'FER': { label: 'Feriado', color: '#e53e3e', text: '#fff' },
};

export default function MasterPlanPage() {
  const { lang } = useLanguage();
  
  // --- ESTADOS DE PROJETO ---
  const [projetosLista, setProjetosLista] = useState([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState('');

  // Estados para gerenciar o range de datas
  const [dataInicio, setDataInicio] = useState('2026-08-03');
  const [dataFim, setDataFim] = useState('2026-10-31');

  // Estado para ocultar/mostrar finais de semana
  const [ocultarFinaisDeSemana, setOcultarFinaisDeSemana] = useState(false);

  // Estados para o Modal de Feriados
  const [showFeriadosModal, setShowFeriadosModal] = useState(false);
  const [feriados, setFeriados] = useState([]);
  const [novoFeriadoData, setNovoFeriadoData] = useState('');
  const [novoFeriadoDesc, setNovoFeriadoDesc] = useState('');

  // Estados para o Modal de PDF
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfConfig, setPdfConfig] = useState({
    formato: 'a3',
    orientacao: 'landscape'
  });

  const [datasPlanilha, setDatasPlanilha] = useState([]);
  const [dadosCelulas, setDadosCelulas] = useState({});
  const [zonasColeta, setZonasColeta] = useState([]);

  // Estrutura Dinâmica de Seções
  const [secoes, setSecoes] = useState([
    {
      id: 'sec_1',
      titulo: 'SERVIÇOS INTERNOS',
      linhas: [
        { id: 'i1', descricao: 'PV2 ZONA 3' },
        { id: 'i2', descricao: 'PV2 ZONA 2' },
        { id: 'i3', descricao: 'PV2 ZONA 1' },
        { id: 'i4', descricao: 'PV1 ZONA 3' },
        { id: 'i5', descricao: 'PV1 ZONA 2' },
        { id: 'i6', descricao: 'PV1 ZONA 1' },
      ]
    },
    {
      id: 'sec_2',
      titulo: 'SERVIÇOS EXTERNOS',
      linhas: [
        { id: 'e1', descricao: 'ESQUADRIAS' },
        { id: 'e2', descricao: 'VEDAÇÕES EXTERNAS PV 2' },
        { id: 'e3', descricao: 'VEDAÇÕES EXTERNAS PV 1' },
        { id: 'e4', descricao: 'COBERTURA' },
        { id: 'e5', descricao: 'ESTRUTURA PV2' },
        { id: 'e6', descricao: 'ESTRUTURA PV1' },
        { id: 'e7', descricao: 'PAINELIZAÇÃO AÇO' },
        { id: 'e8', descricao: 'FUNDAÇÃO' },
        { id: 'e9', descricao: 'LIMPEZA FINAL E OUTROS' },
      ]
    }
  ]);

  // Busca os projetos cadastrados ao carregar a página
  useEffect(() => {
    const fetchProjetos = async () => {
      const { data } = await supabase.from('projetos').select('id, nome_projeto').order('id', { ascending: false });
      if (data) setProjetosLista(data);
    };
    fetchProjetos();
  }, []);

  // Busca as Divisões e Subdivisões EXCLUSIVAS do projeto selecionado para o Datalist
  useEffect(() => {
    const fetchZonasDoProjeto = async () => {
      if (!projetoSelecionado) {
        setZonasColeta([]);
        return;
      }
      const { data } = await supabase.from('setorizacao_obras')
        .select('pavimento, fase')
        .eq('projeto_id', projetoSelecionado);
        
      if (data) {
        const unicas = [...new Set(data.map(d => `${d.pavimento || ''} ${d.fase || ''}`.trim()))].filter(Boolean);
        setZonasColeta(unicas);
      }
    };
    fetchZonasDoProjeto();
  }, [projetoSelecionado]);

  // Recalcula e gera as colunas de datas com controle exato de timezone
  useEffect(() => {
    const gerarDatas = () => {
      if (!dataInicio || !dataFim || !projetoSelecionado) return;

      const parseDataSemFuso = (dataStr) => {
        const [ano, mes, dia] = dataStr.split('-');
        return new Date(ano, mes - 1, dia); // Mês no JS começa em 0
      };

      const inicio = parseDataSemFuso(dataInicio);
      const fim = parseDataSemFuso(dataFim);

      if (fim < inicio) {
        setDatasPlanilha([]); 
        return;
      }

      const datas = [];
      let dataAtual = new Date(inicio);
      const diasSemana = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

      while (dataAtual <= fim) {
        const dataClonada = new Date(dataAtual);
        const dia = String(dataClonada.getDate()).padStart(2, '0');
        const mes = String(dataClonada.getMonth() + 1).padStart(2, '0');
        const ano = dataClonada.getFullYear();
        const diaSemanaIndex = dataClonada.getDay();
        
        const dataIso = `${ano}-${mes}-${dia}`;
        const isFeriado = feriados.some(f => f.data === dataIso);

        datas.push({
          dataCompleta: dataClonada,
          labelData: `${dia}/${mes}`,
          labelSemana: diasSemana[diaSemanaIndex],
          isFimDeSemana: diaSemanaIndex === 0 || diaSemanaIndex === 6,
          isFeriado: isFeriado,
          dataIso: dataIso
        });
        
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
      setDatasPlanilha(datas);
    };

    gerarDatas();
  }, [dataInicio, dataFim, feriados, projetoSelecionado]);

  const datasVisiveis = datasPlanilha.filter(d => ocultarFinaisDeSemana ? !d.isFimDeSemana : true);

  // --- INTELIGÊNCIA: CÁLCULO DE TAMANHO DE PAPEL IDEAL ---
  const calcularPapelSugerido = () => {
    const colunasDeData = datasVisiveis.length;
    const larguraEstimadaPx = 320 + (colunasDeData * 45);

    if (larguraEstimadaPx <= 1047) return 'A4';
    if (larguraEstimadaPx <= 1512) return 'A3';
    if (larguraEstimadaPx <= 2170) return 'A2';
    if (larguraEstimadaPx <= 3103) return 'A1';
    if (larguraEstimadaPx <= 4418) return 'A0';
    return 'Ajuste Perfeito (Contínua)';
  };

  const papelIdeal = calcularPapelSugerido();

  const handleCellChange = (linhaId, dataLabel, valor) => {
    setDadosCelulas(prev => ({ ...prev, [`${linhaId}___${dataLabel}`]: valor }));
  };

  // --- FUNÇÕES DE FERIADOS ---
  const handleAdicionarFeriado = (e) => {
    e.preventDefault();
    if (novoFeriadoData && novoFeriadoDesc) {
      if (feriados.find(f => f.data === novoFeriadoData)) {
        alert('Já existe um feriado cadastrado para esta data!');
        return;
      }
      setFeriados([...feriados, { data: novoFeriadoData, descricao: novoFeriadoDesc }]);
      setNovoFeriadoData('');
      setNovoFeriadoDesc('');
    }
  };

  const handleRemoverFeriado = (data) => {
    setFeriados(feriados.filter(f => f.data !== data));
  };

  // --- FUNÇÕES DE MANIPULAÇÃO DAS SEÇÕES E LINHAS ---
  const handleAdicionarSecao = () => {
    setSecoes([...secoes, { id: `sec_${Date.now()}`, titulo: 'NOVA SEÇÃO DE SERVIÇOS', linhas: [] }]);
  };

  const handleAtualizarTituloSecao = (secId, novoTitulo) => {
    setSecoes(secoes.map(s => s.id === secId ? { ...s, titulo: novoTitulo } : s));
  };

  const handleRemoverSecao = (secId) => {
    if(window.confirm('Tem certeza que deseja excluir esta seção inteira e todas as suas linhas?')) {
      setSecoes(secoes.filter(s => s.id !== secId));
    }
  };

  const handleAdicionarLinha = (secId) => {
    setSecoes(secoes.map(s => {
      if (s.id === secId) return { ...s, linhas: [...s.linhas, { id: `l_${Date.now()}`, descricao: '' }] };
      return s;
    }));
  };

  const handleAtualizarLinha = (secId, linhaId, valor) => {
    setSecoes(secoes.map(s => {
      if (s.id === secId) {
        return { ...s, linhas: s.linhas.map(l => l.id === linhaId ? { ...l, descricao: valor } : l) };
      }
      return s;
    }));
  };

  const handleRemoverLinha = (secId, linhaId) => {
    setSecoes(secoes.map(s => {
      if (s.id === secId) return { ...s, linhas: s.linhas.filter(l => l.id !== linhaId) };
      return s;
    }));
  };

  // --- FUNÇÃO DE GERAÇÃO DE PDF ---
  const gerarPDF = () => {
    import('html2pdf.js').then((html2pdf) => {
      const elemento = document.getElementById('conteudo-masterplan-pdf');
      
      let configuracaoPdf = { 
        unit: 'mm', 
        format: pdfConfig.formato, 
        orientation: pdfConfig.orientacao 
      };

      if (pdfConfig.formato === 'unica') {
        const rect = elemento.getBoundingClientRect();
        configuracaoPdf = { 
          unit: 'px', 
          format: [rect.height + 40, rect.width + 40],
          orientation: 'landscape' 
        };
      }

      const opcoes = {
        margin:       10,
        filename:     `master-plan-${projetoSelecionado}-${Date.now()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        configuracaoPdf
      };
      
      const html2pdfInstance = html2pdf.default ? html2pdf.default : html2pdf;
      html2pdfInstance().from(elemento).set(opcoes).save();
      setShowPdfModal(false);
    });
  };

  let globalIdCounter = 1;

  const btnAdicionarStyle = {
    backgroundColor: '#ebf8ff', color: '#2b6cb0', border: '1px dashed #3182ce',
    padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
    fontSize: '0.75rem', display: 'inline-block', marginTop: '5px'
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* DATALIST INVISÍVEL */}
      <datalist id="lista-zonas-coleta">
        {zonasColeta.map((zona, idx) => <option key={idx} value={zona} />)}
      </datalist>

      {/* CABEÇALHO DA PÁGINA COM SELETOR DE PROJETO */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ color: '#2A4365', margin: 0, fontStyle: 'italic', fontSize: '1.5rem', marginBottom: '10px' }}>
            {lang === 'en-US' ? 'PHYSICAL SCHEDULE - LINE OF BALANCE' : 'CRONOGRAMA FÍSICO - LINHA DE BALANÇO'}
          </h1>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4a5568' }}>Selecione o Projeto</label>
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

        {/* OS CONTROLES SÓ APARECEM SE UM PROJETO ESTIVER SELECIONADO */}
        {projetoSelecionado && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            
            <button 
              onClick={() => setOcultarFinaisDeSemana(!ocultarFinaisDeSemana)}
              style={{ 
                backgroundColor: ocultarFinaisDeSemana ? '#2a4365' : '#edf2f7', 
                color: ocultarFinaisDeSemana ? 'white' : '#4a5568', 
                border: '1px solid #cbd5e0', 
                padding: '8px 15px', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontWeight: 'bold', 
                fontSize: '0.85rem',
                transition: 'all 0.2s ease'
              }}
            >
              {ocultarFinaisDeSemana ? 'Mostrar Finais de Semana' : 'Ocultar Finais de Semana'}
            </button>

            <button 
              onClick={() => setShowFeriadosModal(true)}
              style={{ backgroundColor: '#dd6b20', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
            >
              📅 Feriados
            </button>

            <button 
              onClick={() => {
                const fmtSugerido = papelIdeal.split(' ')[0].toLowerCase();
                setPdfConfig(prev => ({ ...prev, formato: ['a4','a3','a2','a1','a0'].includes(fmtSugerido) ? fmtSugerido : 'unica' }));
                setShowPdfModal(true);
              }}
              style={{ backgroundColor: '#2f855a', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
            >
              📊 Exportar PDF
            </button>

            {/* INPUTS DE RANGE DE DATAS */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#f7fafc', padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#4a5568', marginBottom: '2px' }}>Início Previsto</label>
                <input 
                  type="date" 
                  value={dataInicio} 
                  onChange={(e) => setDataInicio(e.target.value)} 
                  style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e0', outline: 'none', color: '#2d3748', cursor: 'pointer', fontSize: '0.85rem' }} 
                />
              </div>
              <span style={{ color: '#a0aec0', fontWeight: 'bold', marginTop: '12px' }}>➞</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#4a5568', marginBottom: '2px' }}>Término Previsto</label>
                <input 
                  type="date" 
                  value={dataFim} 
                  onChange={(e) => setDataFim(e.target.value)} 
                  style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e0', outline: 'none', color: '#2d3748', cursor: 'pointer', fontSize: '0.85rem' }} 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TELA DE AVISO QUANDO NENHUM PROJETO ESTÁ SELECIONADO */}
      {!projetoSelecionado && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7fafc', borderRadius: '8px', border: '2px dashed #cbd5e0' }}>
          <div style={{ textAlign: 'center', color: '#718096' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🏗️</span>
            <h2>Nenhuma Obra Selecionada</h2>
            <p>Selecione um projeto no menu acima para criar ou visualizar o Master Plan.</p>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR FERIADOS */}
      {showFeriadosModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '500px', fontFamily: 'sans-serif' }}>
            <h2 style={{ color: '#1a365d', marginBottom: '20px' }}>Cadastrar Feriados (Mun/Est/Fed)</h2>
            
            <form onSubmit={handleAdicionarFeriado} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input 
                type="date" 
                required 
                value={novoFeriadoData}
                onChange={(e) => setNovoFeriadoData(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', outline: 'none' }}
              />
              <input 
                type="text" 
                required 
                placeholder="Descrição (ex: Padroeira)" 
                value={novoFeriadoDesc}
                onChange={(e) => setNovoFeriadoDesc(e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', outline: 'none' }}
              />
              <button type="submit" style={{ backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Adicionar
              </button>
            </form>

            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f7fafc' }}>
                  <tr>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Data</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Descrição</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {feriados.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: '15px', textAlign: 'center', color: '#a0aec0' }}>Nenhum feriado cadastrado.</td>
                    </tr>
                  ) : (
                    feriados.sort((a, b) => new Date(a.data) - new Date(b.data)).map((f, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #edf2f7' }}>
                        <td style={{ padding: '8px' }}>{f.data.split('-').reverse().join('/')}</td>
                        <td style={{ padding: '8px', fontWeight: 'bold', color: '#2d3748' }}>{f.descricao}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button onClick={() => handleRemoverFeriado(f.data)} style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold' }}>Excluir</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowFeriadosModal(false)} 
                style={{ backgroundColor: '#2f855a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAÇÃO DO PDF */}
      {showPdfModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '480px', fontFamily: 'sans-serif' }}>
            <h2 style={{ color: '#1a365d', marginBottom: '20px' }}>Configuração de Impressão (PDF)</h2>
            
            <div style={{ backgroundColor: '#ebf8ff', padding: '12px', borderRadius: '6px', border: '1px solid #90cdf4', marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#2b6cb0', lineHeight: '1.4' }}>
                💡 <strong>Sugestão do Sistema:</strong> Com base na largura atual do seu cronograma ({datasVisiveis.length} colunas), recomendamos utilizar o papel <strong>{papelIdeal.toUpperCase()}</strong>. Isso garante que a fonte seja mantida no tamanho original (12pt) sem distorcer.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>Tamanho da Folha</label>
                <select 
                  value={pdfConfig.formato} 
                  onChange={(e) => setPdfConfig({...pdfConfig, formato: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none' }}
                >
                  <option value="a4">A4 (Padrão)</option>
                  <option value="a3">A3 (Recomendado)</option>
                  <option value="a2">A2 (Grande)</option>
                  <option value="a1">A1 (Gigante)</option>
                  <option value="a0">A0 (Extremo)</option>
                  <option value="unica">Ajuste Perfeito (Página Única Contínua)</option>
                </select>
                <p style={{ fontSize: '0.7rem', color: '#718096', marginTop: '5px' }}>
                  * A opção "Ajuste Perfeito" evita cortes na tabela, gerando uma folha digital de tamanho infinito.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>Orientação</label>
                <select 
                  value={pdfConfig.orientacao} 
                  onChange={(e) => setPdfConfig({...pdfConfig, orientacao: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none' }}
                  disabled={pdfConfig.formato === 'unica'}
                >
                  <option value="landscape">Paisagem (Horizontal)</option>
                  <option value="portrait">Retrato (Vertical)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowPdfModal(false)} style={{ backgroundColor: '#cbd5e0', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={gerarPDF} style={{ backgroundColor: '#2f855a', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Confirmar e Baixar PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* CONTAINER PRINCIPAL DO CRONOGRAMA */}
      {projetoSelecionado && (
        <>
          <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'white', border: '1px solid #cbd5e0', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div id="conteudo-masterplan-pdf" style={{ minWidth: 'max-content', paddingBottom: '20px' }}>
              
              <table style={{ borderCollapse: 'collapse', whiteSpace: 'nowrap', width: '100%' }}>
                
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#e2e8f0' }}>
                  <tr>
                    <th rowSpan={2} style={{ position: 'sticky', left: 0, zIndex: 11, backgroundColor: '#2a4365', color: 'white', padding: '8px', borderRight: '1px solid #4a5568', width: '40px' }}>ID</th>
                    <th rowSpan={2} style={{ position: 'sticky', left: '40px', zIndex: 11, backgroundColor: '#2a4365', color: 'white', padding: '8px 15px', borderRight: '1px solid #cbd5e0', textAlign: 'left', minWidth: '280px' }}>DESCRIÇÃO</th>
                    {datasVisiveis.map((d, i) => (
                      <th key={`data-${i}`} style={{ backgroundColor: '#edf2f7', borderRight: '1px dotted #cbd5e0', borderBottom: '1px solid #cbd5e0', padding: '4px 2px', fontSize: '0.8rem', color: '#1a365d', textAlign: 'center' }}>
                        {d.labelData}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {datasVisiveis.map((d, i) => (
                      <th key={`sem-${i}`} style={{ backgroundColor: d.isFeriado ? '#fed7d7' : (d.isFimDeSemana ? '#cbd5e0' : '#f7fafc'), borderRight: '1px dotted #cbd5e0', borderBottom: '1px solid #cbd5e0', padding: '4px 2px', fontSize: '0.75rem', color: d.isFeriado ? '#c53030' : '#4a5568', fontWeight: (d.isFimDeSemana || d.isFeriado) ? 'bold' : 'normal', textAlign: 'center' }}>
                        {d.labelSemana}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {secoes.map((secao) => (
                    <React.Fragment key={secao.id}>
                      {/* CABEÇALHO DA SEÇÃO */}
                      <tr style={{ backgroundColor: '#edf2f7' }}>
                        <td colSpan={2} style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: '#edf2f7', padding: '6px 15px', borderBottom: '2px solid #2a4365', borderTop: '2px solid #2a4365' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <input 
                              type="text"
                              value={secao.titulo}
                              onChange={(e) => handleAtualizarTituloSecao(secao.id, e.target.value)}
                              style={{ fontWeight: 'bold', fontStyle: 'italic', color: '#2a4365', background: 'transparent', border: 'none', outline: 'none', width: '85%', fontSize: '0.9rem' }}
                            />
                            <button onClick={() => handleRemoverSecao(secao.id)} title="Excluir Seção Inteira" style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                          </div>
                        </td>
                        {datasVisiveis.map((d, i) => (
                          <td key={`g-${secao.id}-${i}`} style={{ borderBottom: '2px solid #2a4365', borderTop: '2px solid #2a4365', backgroundColor: d.isFeriado ? '#fed7d7' : (d.isFimDeSemana ? '#e2e8f0' : '#edf2f7'), minWidth: '45px' }}></td>
                        ))}
                      </tr>

                      {/* LINHAS DENTRO DA SEÇÃO */}
                      {secao.linhas.map((linha) => {
                        const currentId = globalIdCounter++;
                        return (
                          <tr key={linha.id} style={{ borderBottom: '1px dotted #cbd5e0' }}>
                            <td style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: 'white', padding: '4px', textAlign: 'center', color: '#4a5568', borderRight: '1px solid #e2e8f0', fontWeight: '500' }}>
                              {currentId}
                            </td>
                            <td style={{ position: 'sticky', left: '40px', zIndex: 5, backgroundColor: 'white', padding: '4px 10px', borderRight: '2px solid #cbd5e0', minWidth: '280px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <input 
                                  type="text" 
                                  value={linha.descricao} 
                                  onChange={(e) => handleAtualizarLinha(secao.id, linha.id, e.target.value)} 
                                  list="lista-zonas-coleta"
                                  placeholder="Selecione ou digite a etapa..."
                                  style={{ width: '90%', border: 'none', outline: 'none', background: 'transparent', color: '#2d3748', fontSize: '0.85rem' }}
                                />
                                <button onClick={() => handleRemoverLinha(secao.id, linha.id)} title="Excluir linha" style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                              </div>
                            </td>
                            
                            {/* CÉLULAS DE DATAS (O SELECT) */}
                            {datasVisiveis.map((d) => {
                              const cellKey = `${linha.id}___${d.labelData}`;
                              const valorSalvo = dadosCelulas[cellKey];
                              
                              let defaultValor = '';
                              if (d.isFeriado) defaultValor = 'FER';
                              else if (d.isFimDeSemana) defaultValor = 'OFF';

                              const valorEfetivo = valorSalvo !== undefined ? valorSalvo : defaultValor;
                              const configCor = SERVICOS_CORES[valorEfetivo] || SERVICOS_CORES[''];

                              let bgColor = 'transparent';
                              if (configCor.color !== 'transparent') {
                                bgColor = configCor.color;
                              } else if (d.isFeriado) {
                                bgColor = '#fed7d7';
                              } else if (d.isFimDeSemana) {
                                bgColor = '#e2e8f0';
                              }

                              return (
                                <td key={cellKey} style={{ borderRight: '1px dotted #cbd5e0', padding: '1px', backgroundColor: bgColor, textAlign: 'center', minWidth: '45px' }}>
                                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                    <select
                                      value={valorEfetivo}
                                      onChange={(e) => handleCellChange(linha.id, d.labelData, e.target.value)}
                                      style={{ width: '100%', padding: '2px 0px', backgroundColor: configCor.color, color: configCor.text, border: 'none', outline: 'none', fontSize: '0.65rem', fontWeight: 'bold', textAlign: 'center', appearance: 'none', cursor: 'pointer', borderRadius: '2px' }}
                                    >
                                      <option value=""></option>
                                      {Object.keys(SERVICOS_CORES).filter(k => k !== '').map(sigla => (
                                        <option key={sigla} value={sigla}>{sigla}</option>
                                      ))}
                                    </select>
                                    <div style={{ position: 'absolute', right: '2px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.5rem', color: configCor.text === '#fff' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}>▼</div>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      
                      {/* BOTAO DE ADICIONAR LINHA NA SEÇÃO */}
                      <tr>
                        <td colSpan={2} style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: 'white', padding: '5px 15px', borderBottom: '1px solid #cbd5e0' }}>
                          <button onClick={() => handleAdicionarLinha(secao.id)} style={btnAdicionarStyle}>+ Adicionar Linha à Seção</button>
                        </td>
                        {datasVisiveis.map((d, i) => (
                          <td key={`add-${secao.id}-${i}`} style={{ borderBottom: '1px solid #cbd5e0', backgroundColor: d.isFeriado ? '#fed7d7' : (d.isFimDeSemana ? '#e2e8f0' : 'white') }}></td>
                        ))}
                      </tr>
                    </React.Fragment>
                  ))}

                  {/* LINHA FINAL PARA ADICIONAR NOVA SEÇÃO */}
                  <tr>
                    <td colSpan={2 + datasVisiveis.length} style={{ padding: '20px', backgroundColor: '#f4f7f6', textAlign: 'left' }}>
                      <button onClick={handleAdicionarSecao} style={{ backgroundColor: '#2a4365', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        + Adicionar Nova Seção de Cronograma
                      </button>
                    </td>
                  </tr>

                </tbody>
              </table>

            </div>
          </div>
          
          {/* LEGENDA FLUTUANTE INFERIOR */}
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e0', display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            <span style={{ fontWeight: 'bold', color: '#1a365d' }}>LEGENDA:</span>
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
