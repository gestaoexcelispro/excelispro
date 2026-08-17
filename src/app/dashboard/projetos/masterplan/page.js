'use client';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { supabase } from '../../../../lib/supabase';

// Cores e Labels com suporte a 2 idiomas
const SERVICOS_CORES = {
  '': { labelPt: '', labelEn: '', color: 'transparent', text: '#000' },
  'FUN': { labelPt: 'Fundação', labelEn: 'Foundation', color: '#ff00ff', text: '#fff' },
  'PNS': { labelPt: 'Painelização Aço', labelEn: 'Steel Paneling', color: '#9900cc', text: '#fff' },
  'VTS': { labelPt: 'Estrutura', labelEn: 'Structure', color: '#0000ff', text: '#fff' },
  'BUF': { labelPt: 'Buffer', labelEn: 'Buffer', color: '#000000', text: '#fff' },
  'VEX': { labelPt: 'Vedações Externas', labelEn: 'Exterior Enclosures', color: '#00ffff', text: '#000' },
  'COB': { labelPt: 'Cobertura', labelEn: 'Roofing', color: '#993333', text: '#fff' },
  'INS': { labelPt: 'Instalações', labelEn: 'Installations', color: '#3366cc', text: '#fff' },
  'LMI': { labelPt: 'Limpeza e Miudezas', labelEn: 'Cleaning & Misc', color: '#00cc00', text: '#fff' },
  'VIN': { labelPt: 'Piso Vinílico', labelEn: 'Vinyl Flooring', color: '#ff9900', text: '#fff' },
  'FOR': { labelPt: 'Forro', labelEn: 'Ceiling', color: '#336600', text: '#fff' },
  'PIN': { labelPt: 'Pintura', labelEn: 'Painting', color: '#808000', text: '#fff' },
  'OFF': { labelPt: 'Fim de Semana', labelEn: 'Weekend', color: '#a0aec0', text: '#fff' },
  'FER': { labelPt: 'Feriado', labelEn: 'Holiday', color: '#e53e3e', text: '#fff' },
};

export default function MasterPlanPage() {
  const { lang } = useLanguage();
  const isEn = lang === 'en-US';

  // Dicionário Completo de Tradução Dinâmica
  const t = {
    title: isEn ? 'PHYSICAL SCHEDULE - LINE OF BALANCE' : 'CRONOGRAMA FÍSICO - LINHA DE BALANÇO',
    selectProject: isEn ? '-- Select a Project --' : '-- Selecione uma Obra --',
    scenarioLabel: isEn ? 'Scenario / Version (Last Planner)' : 'Cenário / Versão (Last Planner)',
    unsavedEdit: isEn ? '* Unsaved edit...' : '* Edição não salva...',
    newBlank: isEn ? 'New Blank Scenario' : 'Novo Cenário em Branco',
    saveScenario: isEn ? '💾 Save Scenario' : '💾 Salvar Cenário',
    freezeBase: isEn ? '🔒 Freeze Baseline' : '🔒 Congelar Linha de Base',
    editBase: isEn ? '🔓 Edit Baseline' : '🔓 Editar Base',
    planning: isEn ? '📋 Planning' : '📋 Planejamento',
    control: isEn ? '⚙️ Control (Actual)' : '⚙️ Controle (Realizado)',
    insertPackage: isEn ? '⚡ Insert Package' : '⚡ Inserir Pacote',
    showWeekends: isEn ? 'Show Weekends' : 'Mostrar Finais de Semana',
    hideWeekends: isEn ? 'Hide Weekends' : 'Ocultar Finais de Semana',
    holidaysBtn: isEn ? '📅 Holidays' : '📅 Feriados',
    exportPdf: isEn ? '📊 Export PDF' : '📊 Exportar PDF',
    startPrev: isEn ? 'Expected Start' : 'Início Previsto',
    endPrev: isEn ? 'Expected Finish' : 'Término Previsto',
    noProject: isEn ? 'No Project Selected' : 'Nenhuma Obra Selecionada',
    noProjectDesc: isEn ? 'Select a project from the menu above to create or view the Master Plan.' : 'Selecione um projeto no menu acima para criar ou visualizar o Master Plan.',
    descHeader: isEn ? 'DESCRIPTION' : 'DESCRIÇÃO',
    plannedBadge: isEn ? 'PLANNED' : 'PREVISTO',
    actualBadge: isEn ? 'ACTUAL' : 'REALIZADO',
    addRow: isEn ? '+ Add Row' : '+ Adicionar Linha',
    addSection: isEn ? '+ Add New Schedule Section' : '+ Adicionar Nova Seção de Cronograma',
    newSecTitle: isEn ? 'NEW WORK SECTION' : 'NOVA SEÇÃO DE SERVIÇOS',
    intWork: isEn ? 'INTERIOR WORK PACKAGES' : 'SERVIÇOS INTERNOS',
    extWork: isEn ? 'EXTERIOR WORK PACKAGES' : 'SERVIÇOS EXTERNOS',
    legend: isEn ? 'LEGEND:' : 'LEGENDA:',
    selectOrType: isEn ? 'Select or type the step...' : 'Selecione ou digite a etapa...',
    
    // Alertas e Confirmações
    confirmFreeze: isEn ? 'Are you sure you want to freeze the current schedule? This will create the official project Baseline.' : 'Tem certeza que deseja congelar o planejamento atual? Isso criará a Linha de Base oficial do projeto.',
    confirmUnfreeze: isEn ? 'WARNING: Unfreezing the baseline will allow changes to the Planned schedule. Do you want to continue?' : 'ATENÇÃO: Descongelar a linha de base permitirá alterações no Previsto. Deseja continuar?',
    promptScenario: isEn ? 'Enter a name for this Scenario/Version (e.g., Scenario A - Fast Track):' : 'Digite um nome para este Cenário/Versão (ex: Cenário A - Aceleração Fachada):',
    scenarioSaved: isEn ? 'Scenario saved successfully! You can switch between scenarios in the top menu.' : 'Cenário salvo com sucesso! Você pode alternar entre os cenários no menu superior.',
    confirmClear: isEn ? 'Do you want to clear the current schedule to create a blank scenario?' : 'Deseja limpar o planejamento atual para criar um cenário em branco?',
    confirmLoad: isEn ? 'This will load the selected scenario and replace the current grid. Do you want to continue?' : 'Isso carregará o cenário selecionado e substituirá a grade atual. Deseja continuar?',
    errHolidayExists: isEn ? 'A holiday is already registered for this date!' : 'Já existe um feriado cadastrado para esta data!',
    confirmDelSection: isEn ? 'Do you want to delete this section?' : 'Deseja excluir a seção?',
    errFillFields: isEn ? 'Fill in Activity, Location, and Duration.' : 'Preencha Atividade, Linha e Duração.',
    errSelectDate: isEn ? 'Select the start date.' : 'Selecione a data de início.',
    errSelectPred: isEn ? 'Select a predecessor package.' : 'Selecione um pacote predecessor.',
    errOutOfRange: isEn ? 'The chosen date is outside the schedule range.' : 'A data escolhida está fora do intervalo do cronograma.',
    warnEndEarly: (dias, dur) => isEn ? `Warning: The schedule ended before all days were allocated. ${dias} of ${dur} working days were allocated.` : `Atenção: O cronograma acabou antes de alocar todos os dias. Foram alocados ${dias} de ${dur} dias úteis.`,
    
    // Textos dos Modais
    mPkgTitle: isEn ? 'Insert Work Package' : 'Inserir Pacote de Trabalho',
    mPkgService: isEn ? 'Service / Activity' : 'Serviço / Atividade',
    mPkgSelect: isEn ? '-- Select --' : '-- Selecione --',
    mPkgZone: isEn ? 'Location / Zone' : 'Localização / Zona',
    mPkgRadioDate: isEn ? '📅 Start on Specific Date' : '📅 Iniciar em Data Específica',
    mPkgRadioPred: isEn ? '🔗 Start after Predecessor' : '🔗 Iniciar após Predecessora',
    mPkgStartDate: isEn ? 'Start Date' : 'Data de Início',
    mPkgLinkPred: isEn ? 'Link to Finish of:' : 'Vincular ao Término de:',
    mPkgSelectPred: isEn ? '-- Select Completed Package --' : '-- Selecione o Pacote Concluído --',
    mPkgNoPred: isEn ? 'No package added yet. Use Specific Date first.' : 'Nenhum pacote lançado ainda. Use a Data Específica primeiro.',
    mPkgDuration: isEn ? 'Duration (Working Days)' : 'Duração (Dias Úteis)',
    mPkgCancel: isEn ? 'Cancel' : 'Cancelar',
    mPkgAddGrid: isEn ? 'Add to Grid' : 'Lançar na Grade',
    
    mHolTitle: isEn ? 'Register Holidays (Local/State/Federal)' : 'Cadastrar Feriados (Mun/Est/Fed)',
    mHolDescPlace: isEn ? 'Description (e.g., National Holiday)' : 'Descrição (ex: Padroeira)',
    mHolAdd: isEn ? 'Add' : 'Adicionar',
    mHolDateCol: isEn ? 'Date' : 'Data',
    mHolDescCol: isEn ? 'Description' : 'Descrição',
    mHolActionCol: isEn ? 'Action' : 'Ação',
    mHolEmpty: isEn ? 'No holidays registered.' : 'Nenhum feriado cadastrado.',
    mHolDel: isEn ? 'Delete' : 'Excluir',
    mHolDone: isEn ? 'Done' : 'Concluir',
    
    mPdfTitle: isEn ? 'Print Configuration (PDF)' : 'Configuração de Impressão (PDF)',
    mPdfSugest: isEn ? 'System Suggestion:' : 'Sugestão do Sistema:',
    mPdfSugestText: (len) => isEn ? `Based on your current schedule width (${len} columns), we recommend using paper size` : `Com base na largura atual do seu cronograma (${len} colunas), recomendamos utilizar o papel`,
    mPdfSize: isEn ? 'Paper Size' : 'Tamanho da Folha',
    mPdf_a4: isEn ? 'A4 (Standard)' : 'A4 (Padrão)',
    mPdf_a3: isEn ? 'A3 (Recommended)' : 'A3 (Recomendado)',
    mPdf_a2: isEn ? 'A2 (Large)' : 'A2 (Grande)',
    mPdf_a1: isEn ? 'A1 (Giant)' : 'A1 (Gigante)',
    mPdf_a0: isEn ? 'A0 (Extreme)' : 'A0 (Extremo)',
    mPdf_unica: isEn ? 'Perfect Fit (Single Continuous Page)' : 'Ajuste Perfeito (Página Única Contínua)',
    mPdfOrient: isEn ? 'Orientation' : 'Orientação',
    mPdfLand: isEn ? 'Landscape (Horizontal)' : 'Paisagem (Horizontal)',
    mPdfPort: isEn ? 'Portrait (Vertical)' : 'Retrato (Vertical)',
    mPdfConfirm: isEn ? 'Confirm and Download PDF' : 'Confirmar e Baixar PDF',
  };

  const [projetosLista, setProjetosLista] = useState([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState('');

  const [linhaDeBaseCongelada, setLinhaDeBaseCongelada] = useState(false);
  const [modoControle, setModoControle] = useState(false);

  const [dataInicio, setDataInicio] = useState('2026-08-03');
  const [dataFim, setDataFim] = useState('2026-10-31');
  const [ocultarFinaisDeSemana, setOcultarFinaisDeSemana] = useState(false);

  const [showFeriadosModal, setShowFeriadosModal] = useState(false);
  const [feriados, setFeriados] = useState([]);
  const [novoFeriadoData, setNovoFeriadoData] = useState('');
  const [novoFeriadoDesc, setNovoFeriadoDesc] = useState('');

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfConfig, setPdfConfig] = useState({ formato: 'a3', orientacao: 'landscape' });

  // SISTEMA DE VERSÕES (LAST PLANNER)
  const [versoes, setVersoes] = useState([]);
  const [versaoAtivaId, setVersaoAtivaId] = useState(null);

  // MOTOR DE AGENDAMENTO (SCHEDULING ENGINE)
  const [pacotesLancados, setPacotesLancados] = useState([]); 
  const [showPacoteModal, setShowPacoteModal] = useState(false);
  const [tipoInicio, setTipoInicio] = useState('data'); 
  const [pacotePredecessora, setPacotePredecessora] = useState('');
  const [pacoteAtividade, setPacoteAtividade] = useState('');
  const [pacoteLinhaId, setPacoteLinhaId] = useState('');
  const [pacoteDataInicio, setPacoteDataInicio] = useState('');
  const [pacoteDuracao, setPacoteDuracao] = useState(1);

  const [datasPlanilha, setDatasPlanilha] = useState([]);
  const [dadosCelulas, setDadosCelulas] = useState({});
  const [dadosRealizado, setDadosRealizado] = useState({});
  const [zonasColeta, setZonasColeta] = useState([]);

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

  useEffect(() => {
    const fetchProjetos = async () => {
      const { data } = await supabase.from('projetos').select('id, nome_projeto').order('id', { ascending: false });
      if (data) setProjetosLista(data);
    };
    fetchProjetos();
  }, []);

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

  // GERAÇÃO DO CALENDÁRIO COM DATAS INTERNACIONAIS
  useEffect(() => {
    const gerarDatas = () => {
      if (!dataInicio || !dataFim || !projetoSelecionado) return;

      const parseDataSemFuso = (dataStr) => {
        const [ano, mes, dia] = dataStr.split('-');
        return new Date(ano, mes - 1, dia);
      };

      const inicio = parseDataSemFuso(dataInicio);
      const fim = parseDataSemFuso(dataFim);

      if (fim < inicio) { setDatasPlanilha([]); return; }

      const datas = [];
      let dataAtual = new Date(inicio);
      
      const diasSemanaPt = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
      const diasSemanaEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const diasSemana = isEn ? diasSemanaEn : diasSemanaPt;

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
          labelData: isEn ? `${mes}/${dia}` : `${dia}/${mes}`, // MM/DD ou DD/MM para Visualização
          labelSemana: diasSemana[diaSemanaIndex],
          isFimDeSemana: diaSemanaIndex === 0 || diaSemanaIndex === 6,
          isFeriado: isFeriado,
          dataIso: dataIso // CHAVE INVARIANTE USADA NO BANCO DE DADOS/MEMÓRIA
        });
        
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
      setDatasPlanilha(datas);
    };
    gerarDatas();
  }, [dataInicio, dataFim, feriados, projetoSelecionado, isEn]);

  const datasVisiveis = datasPlanilha.filter(d => ocultarFinaisDeSemana ? !d.isFimDeSemana : true);

  // MOTOR DE RECÁLCULO AUTOMÁTICO (Utiliza dataIso para nunca quebrar na tradução)
  useEffect(() => {
    if (datasPlanilha.length === 0) return;

    let novaGrade = {};
    let trackerFimPacote = {}; 

    pacotesLancados.forEach(pacote => {
      let startIndex = -1;

      if (pacote.tipoInicio === 'data') {
        startIndex = datasPlanilha.findIndex(d => d.dataIso === pacote.dataInicio);
      } else if (pacote.tipoInicio === 'predecessora') {
        const indexFimPredecessora = trackerFimPacote[pacote.predecessoraId];
        if (indexFimPredecessora !== undefined) {
          startIndex = indexFimPredecessora + 1; 
        }
      }

      if (startIndex !== -1) {
        let diasAlocados = 0;
        let lastIndex = startIndex;

        for (let i = startIndex; i < datasPlanilha.length && diasAlocados < pacote.duracao; i++) {
          const dia = datasPlanilha[i];
          if (!dia.isFimDeSemana && !dia.isFeriado) {
            // Usa dataIso como chave oficial da célula
            const cellKey = `${pacote.linhaId}___${dia.dataIso}`;
            novaGrade[cellKey] = pacote.atividade;
            diasAlocados++;
            lastIndex = i;
          }
        }
        trackerFimPacote[pacote.id] = lastIndex; 
      }
    });

    setDadosCelulas(novaGrade);
  }, [pacotesLancados, datasPlanilha]);

  const calcularPapelSugerido = () => {
    const colunasDeData = datasVisiveis.length;
    const larguraEstimadaPx = 320 + (colunasDeData * 45);

    if (larguraEstimadaPx <= 1047) return 'a4';
    if (larguraEstimadaPx <= 1512) return 'a3';
    if (larguraEstimadaPx <= 2170) return 'a2';
    if (larguraEstimadaPx <= 3103) return 'a1';
    if (larguraEstimadaPx <= 4418) return 'a0';
    return 'unica';
  };
  
  const formatoIdealCode = calcularPapelSugerido();

  const handleCellChange = (linhaId, dataIso, valor) => {
    setDadosCelulas(prev => ({ ...prev, [`${linhaId}___${dataIso}`]: valor }));
  };

  const handleCellRealizadoChange = (linhaId, dataIso, valor) => {
    setDadosRealizado(prev => ({ ...prev, [`${linhaId}___${dataIso}`]: valor }));
  };

  const handleCongelarLinhaDeBase = () => {
    if (window.confirm(t.confirmFreeze)) {
      setLinhaDeBaseCongelada(true);
      setModoControle(true);
    }
  };

  const handleDescongelar = () => {
    if (window.confirm(t.confirmUnfreeze)) {
      setLinhaDeBaseCongelada(false);
      setModoControle(false);
    }
  };

  // FUNÇÕES DE GERENCIAMENTO DE VERSÕES
  const handleSalvarVersao = () => {
    const nomeCenario = prompt(t.promptScenario);
    if (!nomeCenario) return;

    const dataFormatada = new Date().toLocaleDateString(isEn ? 'en-US' : 'pt-BR', { hour: '2-digit', minute: '2-digit' });
    const novaVersao = {
      id: `v_${Date.now()}`,
      nome: nomeCenario,
      data: dataFormatada,
      pacotes: [...pacotesLancados],
      feriadosSalvos: [...feriados]
    };

    setVersoes([...versoes, novaVersao]);
    setVersaoAtivaId(novaVersao.id);
    alert(t.scenarioSaved);
  };

  const handleCarregarVersao = (versaoId) => {
    if (!versaoId) {
      if (window.confirm(t.confirmClear)) {
        setPacotesLancados([]);
        setVersaoAtivaId(null);
      }
      return;
    }

    if (window.confirm(t.confirmLoad)) {
      const versao = versoes.find(v => v.id === versaoId);
      if (versao) {
        setPacotesLancados(versao.pacotes);
        setFeriados(versao.feriadosSalvos);
        setVersaoAtivaId(versao.id);
      }
    }
  };

  const handleAdicionarFeriado = (e) => {
    e.preventDefault();
    if (novoFeriadoData && novoFeriadoDesc) {
      if (feriados.find(f => f.data === novoFeriadoData)) return alert(t.errHolidayExists);
      setFeriados([...feriados, { data: novoFeriadoData, descricao: novoFeriadoDesc }]);
      setNovoFeriadoData(''); 
      setNovoFeriadoDesc('');
    }
  };
  
  const handleRemoverFeriado = (data) => setFeriados(feriados.filter(f => f.data !== data));

  const handleAdicionarSecao = () => setSecoes([...secoes, { id: `sec_${Date.now()}`, titulo: t.newSecTitle, linhas: [] }]);
  const handleAtualizarTituloSecao = (secId, novoTitulo) => setSecoes(secoes.map(s => s.id === secId ? { ...s, titulo: novoTitulo } : s));
  const handleRemoverSecao = (secId) => { if(window.confirm(t.confirmDelSection)) setSecoes(secoes.filter(s => s.id !== secId)); };
  
  const handleAdicionarLinha = (secId) => setSecoes(secoes.map(s => s.id === secId ? { ...s, linhas: [...s.linhas, { id: `l_${Date.now()}`, descricao: '' }] } : s));
  const handleAtualizarLinha = (secId, linhaId, valor) => setSecoes(secoes.map(s => s.id === secId ? { ...s, linhas: s.linhas.map(l => l.id === linhaId ? { ...l, descricao: valor } : l) } : s));
  const handleRemoverLinha = (secId, linhaId) => setSecoes(secoes.map(s => s.id === secId ? { ...s, linhas: s.linhas.filter(l => l.id !== linhaId) } : s));

  const pacotesExistentes = pacotesLancados.map(p => {
    let desc = p.linhaId;
    secoes.forEach(sec => sec.linhas.forEach(l => { if(l.id === p.linhaId) desc = l.descricao; }));
    const sName = isEn ? (SERVICOS_CORES[p.atividade]?.labelEn || p.atividade) : (SERVICOS_CORES[p.atividade]?.labelPt || p.atividade);
    return {
      id: p.id,
      label: `${desc} - ${sName}`
    };
  });

  const handleInserirPacoteAutomacao = (e) => {
    e.preventDefault();
    if (!pacoteAtividade || !pacoteLinhaId || pacoteDuracao < 1) {
      alert(t.errFillFields);
      return;
    }

    if (tipoInicio === 'data' && !pacoteDataInicio) return alert(t.errSelectDate);
    if (tipoInicio === 'predecessora' && !pacotePredecessora) return alert(t.errSelectPred);

    const novoPacote = {
      id: `pct_${Date.now()}`,
      atividade: pacoteAtividade,
      linhaId: pacoteLinhaId,
      tipoInicio: tipoInicio,
      dataInicio: pacoteDataInicio,
      predecessoraId: pacotePredecessora,
      duracao: pacoteDuracao
    };

    setPacotesLancados([...pacotesLancados, novoPacote]);

    setShowPacoteModal(false);
    setPacoteDataInicio('');
    setPacotePredecessora('');
    setPacoteDuracao(1);
    
    setVersaoAtivaId(null); 
  };

  const gerarPDF = () => {
    import('html2pdf.js').then((html2pdf) => {
      const elemento = document.getElementById('conteudo-masterplan-pdf');
      let configuracaoPdf = { unit: 'mm', format: pdfConfig.formato, orientation: pdfConfig.orientacao };
      if (pdfConfig.formato === 'unica') {
        const rect = elemento.getBoundingClientRect();
        configuracaoPdf = { unit: 'px', format: [rect.height + 40, rect.width + 40], orientation: 'landscape' };
      }
      const opcoes = { margin: 10, filename: `master-plan-${projetoSelecionado}-${Date.now()}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: configuracaoPdf };
      html2pdf.default().from(elemento).set(opcoes).save();
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

      {/* CABEÇALHO SUPERIOR */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ color: '#2A4365', margin: 0, fontStyle: 'italic', fontSize: '1.5rem', marginBottom: '10px' }}>
            {t.title}
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <select
                value={projetoSelecionado}
                onChange={(e) => setProjetoSelecionado(e.target.value)}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', minWidth: '300px', fontSize: '0.9rem', outline: 'none' }}
              >
                <option value="">{t.selectProject}</option>
                {projetosLista.map(p => (
                  <option key={p.id} value={p.id}>#{p.id} - {p.nome_projeto}</option>
                ))}
              </select>
            </div>

            {projetoSelecionado && (
              <>
                {/* BLOCO DE GERENCIAMENTO DE VERSÕES (CENÁRIOS) */}
                {!linhaDeBaseCongelada && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', borderLeft: '2px solid #e2e8f0', paddingLeft: '15px', borderRight: '2px solid #e2e8f0', paddingRight: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#718096', marginBottom: '2px', textTransform: 'uppercase' }}>{t.scenarioLabel}</label>
                      <select
                        value={versaoAtivaId || ''}
                        onChange={(e) => handleCarregarVersao(e.target.value)}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '0.85rem', outline: 'none', minWidth: '200px', backgroundColor: versaoAtivaId ? '#ebf8ff' : '#fff' }}
                      >
                        <option value="">{versaoAtivaId === null && pacotesLancados.length > 0 ? t.unsavedEdit : t.newBlank}</option>
                        {versoes.map(v => <option key={v.id} value={v.id}>{v.nome} ({v.data})</option>)}
                      </select>
                    </div>
                    <button 
                      onClick={handleSalvarVersao} 
                      disabled={pacotesLancados.length === 0}
                      style={{ backgroundColor: '#4a5568', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: pacotesLancados.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.8rem', opacity: pacotesLancados.length === 0 ? 0.5 : 1, marginTop: '14px' }}
                    >
                      {t.saveScenario}
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {!linhaDeBaseCongelada ? (
                    <button onClick={handleCongelarLinhaDeBase} style={{ backgroundColor: '#1a365d', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', marginTop: '14px' }}>
                      {t.freezeBase}
                    </button>
                  ) : (
                    <>
                      <button onClick={handleDescongelar} style={{ backgroundColor: '#e2e8f0', color: '#4a5568', border: '1px solid #cbd5e0', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        {t.editBase}
                      </button>
                      <div style={{ display: 'flex', backgroundColor: '#edf2f7', borderRadius: '6px', border: '1px solid #cbd5e0', overflow: 'hidden' }}>
                        <button 
                          onClick={() => setModoControle(false)} 
                          style={{ backgroundColor: !modoControle ? '#3182ce' : 'transparent', color: !modoControle ? 'white' : '#4a5568', border: 'none', padding: '8px 15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                        >
                          {t.planning}
                        </button>
                        <button 
                          onClick={() => setModoControle(true)} 
                          style={{ backgroundColor: modoControle ? '#dd6b20' : 'transparent', color: modoControle ? 'white' : '#4a5568', border: 'none', padding: '8px 15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                        >
                          {t.control}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {projetoSelecionado && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowPacoteModal(true)} disabled={linhaDeBaseCongelada} style={{ backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: linhaDeBaseCongelada ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.85rem', opacity: linhaDeBaseCongelada ? 0.6 : 1 }}>
              {t.insertPackage}
            </button>
            <button onClick={() => setOcultarFinaisDeSemana(!ocultarFinaisDeSemana)} style={{ backgroundColor: ocultarFinaisDeSemana ? '#2a4365' : '#edf2f7', color: ocultarFinaisDeSemana ? 'white' : '#4a5568', border: '1px solid #cbd5e0', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              {ocultarFinaisDeSemana ? t.showWeekends : t.hideWeekends}
            </button>
            <button onClick={() => setShowFeriadosModal(true)} style={{ backgroundColor: '#dd6b20', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              {t.holidaysBtn}
            </button>
            <button onClick={() => { setPdfConfig(prev => ({ ...prev, formato: formatoIdealCode })); setShowPdfModal(true); }} style={{ backgroundColor: '#2f855a', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              {t.exportPdf}
            </button>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#f7fafc', padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#4a5568', marginBottom: '2px' }}>{t.startPrev}</label>
                <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} disabled={linhaDeBaseCongelada} style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e0', outline: 'none', color: '#2d3748', cursor: linhaDeBaseCongelada ? 'not-allowed' : 'pointer', fontSize: '0.85rem', opacity: linhaDeBaseCongelada ? 0.7 : 1 }} />
              </div>
              <span style={{ color: '#a0aec0', fontWeight: 'bold', marginTop: '12px' }}>➞</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#4a5568', marginBottom: '2px' }}>{t.endPrev}</label>
                <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} disabled={linhaDeBaseCongelada} style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e0', outline: 'none', color: '#2d3748', cursor: linhaDeBaseCongelada ? 'not-allowed' : 'pointer', fontSize: '0.85rem', opacity: linhaDeBaseCongelada ? 0.7 : 1 }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {!projetoSelecionado && (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7fafc', borderRadius: '8px', border: '2px dashed #cbd5e0' }}>
          <div style={{ textAlign: 'center', color: '#718096' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🏗️</span>
            <h2>{t.noProject}</h2>
            <p>{t.noProjectDesc}</p>
          </div>
        </div>
      )}

      {showPacoteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '550px', fontFamily: 'sans-serif' }}>
            <h2 style={{ color: '#1a365d', marginBottom: '20px' }}>{t.mPkgTitle}</h2>
            
            <form onSubmit={handleInserirPacoteAutomacao} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.mPkgService}</label>
                  <select required value={pacoteAtividade} onChange={(e) => setPacoteAtividade(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none' }}>
                    <option value="">{t.mPkgSelect}</option>
                    {Object.entries(SERVICOS_CORES)
                      .filter(([sigla]) => sigla !== '' && sigla !== 'OFF' && sigla !== 'FER')
                      .map(([sigla, info]) => (
                        <option key={sigla} value={sigla}>{isEn ? info.labelEn : info.labelPt} ({sigla})</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.mPkgZone}</label>
                  <select required value={pacoteLinhaId} onChange={(e) => setPacoteLinhaId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none' }}>
                    <option value="">{t.mPkgSelect}</option>
                    {secoes.map(sec => (
                      <optgroup key={sec.id} label={sec.titulo === 'SERVIÇOS INTERNOS' && isEn ? t.intWork : (sec.titulo === 'SERVIÇOS EXTERNOS' && isEn ? t.extWork : sec.titulo)}>
                        {sec.linhas.map(linha => (
                          <option key={linha.id} value={linha.id}>{linha.descricao || `Linha ID: ${linha.id}`}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ backgroundColor: '#f7fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', color: '#2d3748', cursor: 'pointer', fontWeight: 'bold' }}>
                    <input type="radio" name="tipoInicio" value="data" checked={tipoInicio === 'data'} onChange={() => setTipoInicio('data')} />
                    {t.mPkgRadioDate}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', color: '#2d3748', cursor: 'pointer', fontWeight: 'bold' }}>
                    <input type="radio" name="tipoInicio" value="predecessora" checked={tipoInicio === 'predecessora'} onChange={() => setTipoInicio('predecessora')} />
                    {t.mPkgRadioPred}
                  </label>
                </div>

                {tipoInicio === 'data' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.mPkgStartDate}</label>
                    <input type="date" required={tipoInicio === 'data'} value={pacoteDataInicio} onChange={(e) => setPacoteDataInicio(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none' }} />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.mPkgLinkPred}</label>
                    <select required={tipoInicio === 'predecessora'} value={pacotePredecessora} onChange={(e) => setPacotePredecessora(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none' }}>
                      <option value="">{t.mPkgSelectPred}</option>
                      {pacotesExistentes.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                    {pacotesExistentes.length === 0 && (
                      <p style={{ fontSize: '0.75rem', color: '#e53e3e', marginTop: '5px' }}>{t.mPkgNoPred}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.mPkgDuration}</label>
                <input type="number" required min="1" value={pacoteDuracao} onChange={(e) => setPacoteDuracao(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                <button type="button" onClick={() => setShowPacoteModal(false)} style={{ backgroundColor: '#cbd5e0', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', color: '#4a5568', fontWeight: 'bold' }}>{t.mPkgCancel}</button>
                <button type="submit" style={{ backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t.mPkgAddGrid}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFeriadosModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '500px', fontFamily: 'sans-serif' }}>
            <h2 style={{ color: '#1a365d', marginBottom: '20px' }}>{t.mHolTitle}</h2>
            
            <form onSubmit={handleAdicionarFeriado} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input type="date" required value={novoFeriadoData} onChange={(e) => setNovoFeriadoData(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', outline: 'none' }} />
              <input type="text" required placeholder={t.mHolDescPlace} value={novoFeriadoDesc} onChange={(e) => setNovoFeriadoDesc(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', outline: 'none' }} />
              <button type="submit" style={{ backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{t.mHolAdd}</button>
            </form>

            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f7fafc' }}>
                  <tr>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>{t.mHolDateCol}</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>{t.mHolDescCol}</th>
                    <th style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}>{t.mHolActionCol}</th>
                  </tr>
                </thead>
                <tbody>
                  {feriados.length === 0 ? (
                    <tr><td colSpan={3} style={{ padding: '15px', textAlign: 'center', color: '#a0aec0' }}>{t.mHolEmpty}</td></tr>
                  ) : (
                    feriados.sort((a, b) => new Date(a.data) - new Date(b.data)).map((f, i) => {
                      const parts = f.data.split('-');
                      const displayDate = isEn ? `${parts[1]}/${parts[2]}/${parts[0]}` : `${parts[2]}/${parts[1]}/${parts[0]}`;
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #edf2f7' }}>
                          <td style={{ padding: '8px' }}>{displayDate}</td>
                          <td style={{ padding: '8px', fontWeight: 'bold', color: '#2d3748' }}>{f.descricao}</td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <button onClick={() => handleRemoverFeriado(f.data)} style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold' }}>{t.mHolDel}</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowFeriadosModal(false)} style={{ backgroundColor: '#2f855a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t.mHolDone}</button>
            </div>
          </div>
        </div>
      )}

      {showPdfModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '480px', fontFamily: 'sans-serif' }}>
            <h2 style={{ color: '#1a365d', marginBottom: '20px' }}>{t.mPdfTitle}</h2>
            
            <div style={{ backgroundColor: '#ebf8ff', padding: '12px', borderRadius: '6px', border: '1px solid #90cdf4', marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#2b6cb0', lineHeight: '1.4' }}>
                💡 <strong>{t.mPdfSugest}</strong> {t.mPdfSugestText(datasVisiveis.length)} <strong>{formatoIdealCode.toUpperCase()}</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.mPdfSize}</label>
                <select value={pdfConfig.formato} onChange={(e) => setPdfConfig({...pdfConfig, formato: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none' }}>
                  <option value="a4">{t.mPdf_a4}</option>
                  <option value="a3">{t.mPdf_a3}</option>
                  <option value="a2">{t.mPdf_a2}</option>
                  <option value="a1">{t.mPdf_a1}</option>
                  <option value="a0">{t.mPdf_a0}</option>
                  <option value="unica">{t.mPdf_unica}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.mPdfOrient}</label>
                <select value={pdfConfig.orientacao} onChange={(e) => setPdfConfig({...pdfConfig, orientacao: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none' }} disabled={pdfConfig.formato === 'unica'}>
                  <option value="landscape">{t.mPdfLand}</option>
                  <option value="portrait">{t.mPdfPort}</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowPdfModal(false)} style={{ backgroundColor: '#cbd5e0', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer' }}>{t.mPkgCancel}</button>
              <button onClick={gerarPDF} style={{ backgroundColor: '#2f855a', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t.mPdfConfirm}</button>
            </div>
          </div>
        </div>
      )}

      {projetoSelecionado && (
        <>
          <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'white', border: '1px solid #cbd5e0', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div id="conteudo-masterplan-pdf" style={{ minWidth: 'max-content', paddingBottom: '20px' }}>
              
              <table style={{ borderCollapse: 'collapse', whiteSpace: 'nowrap', width: '100%' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1a365d' }}>
                  <tr>
                    <th rowSpan={2} style={{ position: 'sticky', left: 0, zIndex: 11, backgroundColor: '#1a365d', color: 'white', padding: '8px', borderRight: '1px solid #2a4365', width: '40px' }}>ID</th>
                    <th rowSpan={2} style={{ position: 'sticky', left: '40px', zIndex: 11, backgroundColor: '#1a365d', color: 'white', padding: '8px 15px', borderRight: '1px solid #2a4365', textAlign: 'left', minWidth: '320px' }}>{t.descHeader}</th>
                    {datasVisiveis.map((d, i) => (
                      <th key={`data-${i}`} style={{ backgroundColor: '#1a365d', borderRight: '1px solid #2a4365', borderBottom: '1px solid #2a4365', padding: '4px 2px', fontSize: '0.8rem', color: 'white', textAlign: 'center' }}>
                        {d.labelData}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {datasVisiveis.map((d, i) => (
                      <th key={`sem-${i}`} style={{ backgroundColor: d.isFeriado ? '#c53030' : (d.isFimDeSemana ? '#718096' : '#edf2f7'), borderRight: '1px solid #cbd5e0', borderBottom: '1px solid #cbd5e0', padding: '4px 2px', fontSize: '0.75rem', color: (d.isFeriado || d.isFimDeSemana) ? 'white' : '#1a365d', fontWeight: 'bold', textAlign: 'center' }}>
                        {d.labelSemana}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {secoes.map((secao) => {
                    const displayTitle = secao.titulo === 'SERVIÇOS INTERNOS' && isEn ? t.intWork : (secao.titulo === 'SERVIÇOS EXTERNOS' && isEn ? t.extWork : secao.titulo);
                    return (
                    <React.Fragment key={secao.id}>
                      <tr style={{ backgroundColor: '#edf2f7' }}>
                        <td colSpan={2} style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: '#edf2f7', padding: '6px 15px', borderBottom: '2px solid #2a4365', borderTop: '2px solid #2a4365' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <input 
                              type="text"
                              value={displayTitle}
                              onChange={(e) => handleAtualizarTituloSecao(secao.id, e.target.value)}
                              disabled={linhaDeBaseCongelada}
                              style={{ fontWeight: 'bold', fontStyle: 'italic', color: '#2a4365', background: 'transparent', border: 'none', outline: 'none', width: '85%', fontSize: '0.9rem' }}
                            />
                            {!linhaDeBaseCongelada && (
                              <button onClick={() => handleRemoverSecao(secao.id)} style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                            )}
                          </div>
                        </td>
                        {datasVisiveis.map((d, i) => (
                          <td key={`g-${secao.id}-${i}`} style={{ borderBottom: '2px solid #2a4365', borderTop: '2px solid #2a4365', backgroundColor: d.isFeriado ? '#fed7d7' : (d.isFimDeSemana ? '#e2e8f0' : '#edf2f7'), minWidth: '45px' }}></td>
                        ))}
                      </tr>

                      {secao.linhas.map((linha) => {
                        const currentId = globalIdCounter++;
                        
                        const renderizarCelulas = (isRealizado) => {
                          return datasVisiveis.map((d) => {
                            // AQUI USAMOS A CHAVE INVARIANTE dataIso!
                            const cellKey = `${linha.id}___${d.dataIso}`;
                            const baseDados = isRealizado ? dadosRealizado : dadosCelulas;
                            const valorSalvo = baseDados[cellKey];
                            
                            let defaultValor = '';
                            if (d.isFeriado) defaultValor = 'FER';
                            else if (d.isFimDeSemana) defaultValor = 'OFF';

                            const valorEfetivo = valorSalvo !== undefined ? valorSalvo : (isRealizado ? '' : defaultValor);
                            const configCor = SERVICOS_CORES[valorEfetivo] || SERVICOS_CORES[''];

                            let bgColor = 'transparent';
                            if (configCor.color !== 'transparent') bgColor = configCor.color;
                            else if (!isRealizado && d.isFeriado) bgColor = '#fed7d7';
                            else if (!isRealizado && d.isFimDeSemana) bgColor = '#e2e8f0';

                            const inputBloqueado = isRealizado ? false : linhaDeBaseCongelada;

                            return (
                              <td key={cellKey} style={{ borderRight: '1px dotted #cbd5e0', padding: '1px', backgroundColor: bgColor, textAlign: 'center', minWidth: '45px', height: '26px' }}>
                                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <select
                                    value={valorEfetivo}
                                    onChange={(e) => isRealizado ? handleCellRealizadoChange(linha.id, d.dataIso, e.target.value) : handleCellChange(linha.id, d.dataIso, e.target.value)}
                                    disabled={inputBloqueado}
                                    style={{ width: '100%', height: '100%', backgroundColor: configCor.color, color: configCor.text, border: 'none', outline: 'none', fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center', textAlignLast: 'center', appearance: 'none', cursor: inputBloqueado ? 'default' : 'pointer', borderRadius: '2px', opacity: (modoControle && !isRealizado && valorEfetivo) ? 0.6 : 1, padding: '0 4px' }}
                                  >
                                    <option value=""></option>
                                    {Object.keys(SERVICOS_CORES).filter(k => k !== '').map(sigla => (
                                      <option key={sigla} value={sigla}>{sigla}</option>
                                    ))}
                                  </select>
                                  {!inputBloqueado && (
                                    <div style={{ position: 'absolute', right: '2px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.45rem', color: configCor.text === '#fff' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}>▼</div>
                                  )}
                                </div>
                              </td>
                            );
                          });
                        };

                        return (
                          <React.Fragment key={linha.id}>
                            <tr style={{ borderBottom: modoControle ? 'none' : '1px dotted #cbd5e0', backgroundColor: modoControle ? '#f7fafc' : 'white' }}>
                              <td style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: modoControle ? '#f7fafc' : 'white', padding: '4px', textAlign: 'center', color: '#4a5568', borderRight: '1px solid #e2e8f0', fontWeight: '500' }}>
                                {currentId}
                              </td>
                              <td style={{ position: 'sticky', left: '40px', zIndex: 5, backgroundColor: modoControle ? '#f7fafc' : 'white', padding: '4px 10px', borderRight: '2px solid #cbd5e0', minWidth: '320px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '90%' }}>
                                    <input 
                                      type="text" 
                                      value={linha.descricao} 
                                      onChange={(e) => handleAtualizarLinha(secao.id, linha.id, e.target.value)} 
                                      disabled={linhaDeBaseCongelada}
                                      list="lista-zonas-coleta"
                                      placeholder={t.selectOrType}
                                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: '#2d3748', fontSize: '0.85rem' }}
                                    />
                                    {modoControle && <span style={{ fontSize: '0.65rem', backgroundColor: '#cbd5e0', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', color: '#4a5568' }}>{t.plannedBadge}</span>}
                                  </div>
                                  {!linhaDeBaseCongelada && (
                                    <button onClick={() => handleRemoverLinha(secao.id, linha.id)} style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                                  )}
                                </div>
                              </td>
                              {renderizarCelulas(false)}
                            </tr>

                            {modoControle && (
                              <tr style={{ borderBottom: '1px dotted #cbd5e0', backgroundColor: 'white' }}>
                                <td style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: 'white', padding: '4px', borderRight: '1px solid #e2e8f0', color: 'transparent' }}>
                                  {currentId}
                                </td>
                                <td style={{ position: 'sticky', left: '40px', zIndex: 5, backgroundColor: 'white', padding: '4px 10px', borderRight: '2px solid #cbd5e0', minWidth: '320px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '90%' }}>
                                      <span style={{ flex: 1, color: '#a0aec0', fontSize: '0.85rem', paddingLeft: '2px' }}>↳ {linha.descricao}</span>
                                      <span style={{ fontSize: '0.65rem', backgroundColor: '#3182ce', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', color: 'white' }}>{t.actualBadge}</span>
                                    </div>
                                  </div>
                                </td>
                                {renderizarCelulas(true)}
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      
                      {!linhaDeBaseCongelada && (
                        <tr>
                          <td colSpan={2} style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: 'white', padding: '5px 15px', borderBottom: '1px solid #cbd5e0' }}>
                            <button onClick={() => handleAdicionarLinha(secao.id)} style={btnAdicionarStyle}>{t.addRow}</button>
                          </td>
                          {datasVisiveis.map((d, i) => (
                            <td key={`add-${secao.id}-${i}`} style={{ borderBottom: '1px solid #cbd5e0', backgroundColor: d.isFeriado ? '#fed7d7' : (d.isFimDeSemana ? '#e2e8f0' : 'white') }}></td>
                          ))}
                        </tr>
                      )}
                    </React.Fragment>
                    )
                  })}

                  {!linhaDeBaseCongelada && (
                    <tr>
                      <td colSpan={2 + datasVisiveis.length} style={{ padding: '20px', backgroundColor: '#f4f7f6', textAlign: 'left' }}>
                        <button onClick={handleAdicionarSecao} style={{ backgroundColor: '#2a4365', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          {t.addSection}
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e0', display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
            <span style={{ fontWeight: 'bold', color: '#1a365d' }}>{t.legend}</span>
            {Object.entries(SERVICOS_CORES).filter(([sigla]) => sigla !== '').map(([sigla, info]) => (
              <div key={sigla} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: info.color, borderRadius: '2px', border: '1px solid #cbd5e0' }}></div>
                <span><b>{sigla}</b> - {isEn ? info.labelEn : info.labelPt}</span>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}
