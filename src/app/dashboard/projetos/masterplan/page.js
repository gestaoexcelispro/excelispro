'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { supabase } from '../../../../lib/supabase';

// Dicionário de serviços e suas cores equivalentes ao padrão visual da imagem
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
  'FER': { label: 'Feriado / FDS', color: '#999999', text: '#fff' },
};

export default function MasterPlanPage() {
  const { lang } = useLanguage();
  
  // Estados para gerenciar o range de datas
  const [dataInicio, setDataInicio] = useState('2026-08-03');
  const [dataFim, setDataFim] = useState('2026-10-31');

  // Estado para ocultar/mostrar finais de semana
  const [ocultarFinaisDeSemana, setOcultarFinaisDeSemana] = useState(false);

  // Estados para o Modal de PDF
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfConfig, setPdfConfig] = useState({
    formato: 'a3', // a4, a3, a2, a1, unica
    orientacao: 'landscape' // landscape, portrait
  });

  const [datasPlanilha, setDatasPlanilha] = useState([]);
  const [dadosCelulas, setDadosCelulas] = useState({});
  const [zonasColeta, setZonasColeta] = useState([]);

  // Listas de linhas editáveis
  const [linhasInternas, setLinhasInternas] = useState([
    { id: 'i1', descricao: 'PV2 ZONA 3' },
    { id: 'i2', descricao: 'PV2 ZONA 2' },
    { id: 'i3', descricao: 'PV2 ZONA 1' },
    { id: 'i4', descricao: 'PV1 ZONA 3' },
    { id: 'i5', descricao: 'PV1 ZONA 2' },
    { id: 'i6', descricao: 'PV1 ZONA 1' },
  ]);

  const [linhasExternas, setLinhasExternas] = useState([
    { id: 'e1', descricao: 'ESQUADRIAS' },
    { id: 'e2', descricao: 'VEDAÇÕES EXTERNAS PV 2' },
    { id: 'e3', descricao: 'VEDAÇÕES EXTERNAS PV 1' },
    { id: 'e4', descricao: 'COBERTURA' },
    { id: 'e5', descricao: 'ESTRUTURA PV2' },
    { id: 'e6', descricao: 'ESTRUTURA PV1' },
    { id: 'e7', descricao: 'PAINELIZAÇÃO AÇO' },
    { id: 'e8', descricao: 'FUNDAÇÃO' },
    { id: 'e9', descricao: 'LIMPEZA FINAL E OUTROS' },
  ]);

  // Busca as Divisões e Subdivisões do banco de dados (Coleta)
  useEffect(() => {
    const fetchZonas = async () => {
      const { data } = await supabase.from('setorizacao_obras').select('pavimento, fase');
      if (data) {
        const unicas = [...new Set(data.map(d => `${d.pavimento || ''} ${d.fase || ''}`.trim()))].filter(Boolean);
        setZonasColeta(unicas);
      }
    };
    fetchZonas();
  }, []);

  // Recalcula e gera as colunas de datas sempre que o Início ou o Término forem alterados
  useEffect(() => {
    const gerarDatas = () => {
      if (!dataInicio || !dataFim) return;

      const inicio = new Date(`${dataInicio}T00:00:00`);
      const fim = new Date(`${dataFim}T00:00:00`);

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
        const diaSemanaIndex = dataClonada.getDay();
        
        datas.push({
          dataCompleta: dataClonada,
          labelData: `${dia}/${mes}`,
          labelSemana: diasSemana[diaSemanaIndex],
          isFimDeSemana: diaSemanaIndex === 0 || diaSemanaIndex === 6
        });
        
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
      setDatasPlanilha(datas);
    };

    gerarDatas();
  }, [dataInicio, dataFim]);

  // Filtra os finais de semana se o botão estiver ativado
  const datasVisiveis = datasPlanilha.filter(d => ocultarFinaisDeSemana ? !d.isFimDeSemana : true);

  const handleCellChange = (linhaId, dataLabel, valor) => {
    setDadosCelulas(prev => ({ ...prev, [`${linhaId}___${dataLabel}`]: valor }));
  };

  const adicionarLinhaInterna = () => setLinhasInternas([...linhasInternas, { id: `int_${Date.now()}`, descricao: '' }]);
  const atualizarLinhaInterna = (id, valor) => setLinhasInternas(linhasInternas.map(l => l.id === id ? { ...l, descricao: valor } : l));
  const removerLinhaInterna = (id) => setLinhasInternas(linhasInternas.filter(l => l.id !== id));

  const adicionarLinhaExterna = () => setLinhasExternas([...linhasExternas, { id: `ext_${Date.now()}`, descricao: '' }]);
  const atualizarLinhaExterna = (id, valor) => setLinhasExternas(linhasExternas.map(l => l.id === id ? { ...l, descricao: valor } : l));
  const removerLinhaExterna = (id) => setLinhasExternas(linhasExternas.filter(l => l.id !== id));

  // Função para gerar o PDF dinâmico
  const gerarPDF = () => {
    import('html2pdf.js').then((html2pdf) => {
      const elemento = document.getElementById('conteudo-masterplan-pdf');
      
      let configuracaoPdf = { 
        unit: 'mm', 
        format: pdfConfig.formato, 
        orientation: pdfConfig.orientacao 
      };

      // Se for "Única", ele ajusta o tamanho da folha do PDF para o tamanho exato da tabela
      if (pdfConfig.formato === 'unica') {
        const rect = elemento.getBoundingClientRect();
        configuracaoPdf = { 
          unit: 'px', 
          format: [rect.height + 40, rect.width + 40], // Altura x Largura (margem de segurança)
          orientation: 'landscape' 
        };
      }

      const opcoes = {
        margin:       10,
        filename:     `master-plan-${Date.now()}.pdf`,
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
      
      <datalist id="lista-zonas-coleta">
        {zonasColeta.map((zona, idx) => <option key={idx} value={zona} />)}
      </datalist>

      {/* CABEÇALHO DA PÁGINA COM SELETORES DE DATA E BOTÕES */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ color: '#2A4365', margin: 0, fontStyle: 'italic', fontSize: '1.5rem' }}>
          {lang === 'en-US' ? 'PHYSICAL SCHEDULE - LINE OF BALANCE' : 'CRONOGRAMA FÍSICO - LINHA DE BALANÇO'}
        </h1>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* BOTÃO OCULTAR FINAIS DE SEMANA */}
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

          {/* BOTÃO ABRIR MODAL DE PDF */}
          <button 
            onClick={() => setShowPdfModal(true)}
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
      </div>

      {/* MODAL CONFIGURAÇÃO DO PDF */}
      {showPdfModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '450px', fontFamily: 'sans-serif' }}>
            <h2 style={{ color: '#1a365d', marginBottom: '20px' }}>Configuração de Impressão (PDF)</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>Tamanho da Folha</label>
                <select 
                  value={pdfConfig.formato} 
                  onChange={(e) => setPdfConfig({...pdfConfig, formato: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                >
                  <option value="a4">A4 (Padrão)</option>
                  <option value="a3">A3 (Recomendado)</option>
                  <option value="a2">A2 (Grande)</option>
                  <option value="a1">A1 (Gigante)</option>
                  <option value="unica">Ajuste Perfeito (Página Única Contínua)</option>
                </select>
                <p style={{ fontSize: '0.7rem', color: '#718096', marginTop: '5px' }}>
                  * A opção "Ajuste Perfeito" evita cortes na tabela, gerando uma folha digital sob medida.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>Orientação</label>
                <select 
                  value={pdfConfig.orientacao} 
                  onChange={(e) => setPdfConfig({...pdfConfig, orientacao: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                  disabled={pdfConfig.formato === 'unica'} // Desabilita se for única
                >
                  <option value="landscape">Paisagem (Horizontal)</option>
                  <option value="portrait">Retrato (Vertical)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => setShowPdfModal(false)} 
                style={{ backgroundColor: '#cbd5e0', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={gerarPDF} 
                style={{ backgroundColor: '#2f855a', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Confirmar e Baixar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTAINER COM SCROLL DUPLO PARA A PLANILHA */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        backgroundColor: 'white', 
        border: '1px solid #cbd5e0', 
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        {/* A div envolve a tabela para a exportação */}
        <div id="conteudo-masterplan-pdf" style={{ minWidth: 'max-content' }}>
          
          <table style={{ borderCollapse: 'collapse', whiteSpace: 'nowrap', width: '100%' }}>
            {/* HEADER DA TABELA */}
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#e2e8f0' }}>
              {/* LINHA DE DATAS */}
              <tr>
                <th rowSpan={2} style={{ position: 'sticky', left: 0, zIndex: 11, backgroundColor: '#2a4365', color: 'white', padding: '8px', borderRight: '1px solid #4a5568', width: '40px' }}>
                  ID
                </th>
                <th rowSpan={2} style={{ position: 'sticky', left: '40px', zIndex: 11, backgroundColor: '#2a4365', color: 'white', padding: '8px 15px', borderRight: '1px solid #cbd5e0', textAlign: 'left', minWidth: '280px' }}>
                  DESCRIÇÃO
                </th>
                {datasVisiveis.map((d, i) => (
                  <th key={`data-${i}`} style={{ backgroundColor: '#edf2f7', borderRight: '1px dotted #cbd5e0', borderBottom: '1px solid #cbd5e0', padding: '4px 2px', fontSize: '0.8rem', color: '#1a365d' }}>
                    {d.labelData}
                  </th>
                ))}
              </tr>
              {/* LINHA DE DIAS DA SEMANA */}
              <tr>
                {datasVisiveis.map((d, i) => (
                  <th key={`sem-${i}`} style={{ backgroundColor: d.isFimDeSemana ? '#cbd5e0' : '#f7fafc', borderRight: '1px dotted #cbd5e0', borderBottom: '1px solid #cbd5e0', padding: '4px 2px', fontSize: '0.75rem', color: '#4a5568', fontWeight: d.isFimDeSemana ? 'bold' : 'normal' }}>
                    {d.labelSemana}
                  </th>
                ))}
              </tr>
            </thead>

            {/* CORPO DA TABELA */}
            <tbody>

              {/* GRUPO 1: SERVIÇOS INTERNOS */}
              <tr style={{ backgroundColor: '#edf2f7' }}>
                <td colSpan={2} style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: '#edf2f7', padding: '6px 15px', fontWeight: 'bold', fontStyle: 'italic', color: '#2a4365', borderBottom: '2px solid #2a4365', borderTop: '2px solid #2a4365' }}>
                  SERVIÇOS INTERNOS
                </td>
                {datasVisiveis.map((d, i) => (
                  <td key={`g1-${i}`} style={{ borderBottom: '2px solid #2a4365', borderTop: '2px solid #2a4365', backgroundColor: d.isFimDeSemana ? '#e2e8f0' : '#edf2f7' }}></td>
                ))}
              </tr>

              {linhasInternas.map((linha) => {
                const currentId = globalIdCounter++;
                return (
                  <tr key={linha.id} style={{ borderBottom: '1px dotted #cbd5e0' }}>
                    <td style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: 'white', padding: '4px', textAlign: 'center', color: '#4a5568', borderRight: '1px solid #e2e8f0' }}>
                      {currentId}
                    </td>
                    <td style={{ position: 'sticky', left: '40px', zIndex: 5, backgroundColor: 'white', padding: '4px 10px', borderRight: '2px solid #cbd5e0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          value={linha.descricao} 
                          onChange={(e) => atualizarLinhaInterna(linha.id, e.target.value)} 
                          list="lista-zonas-coleta"
                          placeholder="Selecione ou digite a etapa..."
                          style={{ width: '90%', border: 'none', outline: 'none', background: 'transparent', color: '#2d3748', fontSize: '0.85rem' }}
                        />
                        <button onClick={() => removerLinhaInterna(linha.id)} title="Excluir linha" style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                      </div>
                    </td>
                    
                    {/* CÉLULAS DE DATAS */}
                    {datasVisiveis.map((d, i) => {
                      const cellKey = `${linha.id}___${d.labelData}`;
                      const valorSalvo = dadosCelulas[cellKey];
                      const valorEfetivo = valorSalvo !== undefined ? valorSalvo : (d.isFimDeSemana ? 'FER' : '');
                      const configCor = SERVICOS_CORES[valorEfetivo] || SERVICOS_CORES[''];

                      return (
                        <td key={cellKey} style={{ borderRight: '1px dotted #cbd5e0', padding: '1px', backgroundColor: configCor.color === 'transparent' && d.isFimDeSemana ? '#e2e8f0' : 'transparent', textAlign: 'center', minWidth: '45px' }}>
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
              
              {/* BOTÃO ADICIONAR LINHA INTERNA */}
              <tr>
                <td colSpan={2} style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: 'white', padding: '5px 15px', borderBottom: '1px solid #cbd5e0' }}>
                  <button onClick={adicionarLinhaInterna} style={btnAdicionarStyle}>+ Adicionar Linha Interna</button>
                </td>
                {datasVisiveis.map((d, i) => (
                  <td key={`add-int-${i}`} style={{ borderBottom: '1px solid #cbd5e0', backgroundColor: d.isFimDeSemana ? '#e2e8f0' : 'white' }}></td>
                ))}
              </tr>

              {/* GRUPO 2: SERVIÇOS EXTERNOS */}
              <tr style={{ backgroundColor: '#edf2f7' }}>
                <td colSpan={2} style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: '#edf2f7', padding: '6px 15px', fontWeight: 'bold', fontStyle: 'italic', color: '#2a4365', borderBottom: '2px solid #2a4365', borderTop: '2px solid #2a4365' }}>
                  SERVIÇOS EXTERNOS
                </td>
                {datasVisiveis.map((d, i) => (
                  <td key={`g2-${i}`} style={{ borderBottom: '2px solid #2a4365', borderTop: '2px solid #2a4365', backgroundColor: d.isFimDeSemana ? '#e2e8f0' : '#edf2f7' }}></td>
                ))}
              </tr>

              {linhasExternas.map((linha) => {
                const currentId = globalIdCounter++;
                return (
                  <tr key={linha.id} style={{ borderBottom: '1px dotted #cbd5e0' }}>
                    <td style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: 'white', padding: '4px', textAlign: 'center', color: '#4a5568', borderRight: '1px solid #e2e8f0' }}>
                      {currentId}
                    </td>
                    <td style={{ position: 'sticky', left: '40px', zIndex: 5, backgroundColor: 'white', padding: '4px 10px', borderRight: '2px solid #cbd5e0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          value={linha.descricao} 
                          onChange={(e) => atualizarLinhaExterna(linha.id, e.target.value)} 
                          placeholder="Digite a etapa externa..."
                          style={{ width: '90%', border: 'none', outline: 'none', background: 'transparent', color: '#2d3748', fontSize: '0.85rem' }}
                        />
                        <button onClick={() => removerLinhaExterna(linha.id)} title="Excluir linha" style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                      </div>
                    </td>
                    
                    {/* CÉLULAS DE DATAS */}
                    {datasVisiveis.map((d, i) => {
                      const cellKey = `${linha.id}___${d.labelData}`;
                      const valorSalvo = dadosCelulas[cellKey];
                      const valorEfetivo = valorSalvo !== undefined ? valorSalvo : (d.isFimDeSemana ? 'FER' : '');
                      const configCor = SERVICOS_CORES[valorEfetivo] || SERVICOS_CORES[''];

                      return (
                        <td key={cellKey} style={{ borderRight: '1px dotted #cbd5e0', padding: '1px', backgroundColor: configCor.color === 'transparent' && d.isFimDeSemana ? '#e2e8f0' : 'transparent', textAlign: 'center', minWidth: '45px' }}>
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

              {/* BOTÃO ADICIONAR LINHA EXTERNA */}
              <tr>
                <td colSpan={2} style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: 'white', padding: '5px 15px', borderBottom: '1px solid #cbd5e0' }}>
                  <button onClick={adicionarLinhaExterna} style={btnAdicionarStyle}>+ Adicionar Linha Externa</button>
                </td>
                {datasVisiveis.map((d, i) => (
                  <td key={`add-ext-${i}`} style={{ borderBottom: '1px solid #cbd5e0', backgroundColor: d.isFimDeSemana ? '#e2e8f0' : 'white' }}></td>
                ))}
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
            <div style={{ width: '12px', height: '12px', backgroundColor: info.color, borderRadius: '2px' }}></div>
            <span><b>{sigla}</b> - {info.label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
