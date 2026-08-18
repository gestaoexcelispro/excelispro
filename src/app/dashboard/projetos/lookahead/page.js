'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { supabase } from '../../../../lib/supabase';

// 1. LISTA DE CORES
const DEFAULT_SERVICOS_CORES = {
  '': { labelPt: '', labelEn: '', color: 'transparent', text: '#000' },
  'FUN': { labelPt: 'Fundação', labelEn: 'Foundation', color: '#ff00ff', text: '#fff' },
  'PNS': { labelPt: 'Painelização LSF', labelEn: 'LSF Paneling', color: '#8a2be2', text: '#fff' },
  'VTS': { labelPt: 'Verticalização LSF', labelEn: 'LSF Verticalization', color: '#0000ff', text: '#fff' },
  'VEX': { labelPt: 'Vedações Externas', labelEn: 'Exterior Enclosures', color: '#00ffff', text: '#000' },
  'LMI': { labelPt: 'Lã Mineral', labelEn: 'Mineral Wool', color: '#00ff00', text: '#000' },
  'VIN': { labelPt: 'Vedações Internas', labelEn: 'Interior Enclosures', color: '#ff9900', text: '#fff' },
  'PIS': { labelPt: 'Pisos', labelEn: 'Flooring', color: '#8b0000', text: '#fff' },
  'FOR': { labelPt: 'Forros', labelEn: 'Ceilings', color: '#556b2f', text: '#fff' },
  'COB': { labelPt: 'Calhas, Rufos e Cobertura', labelEn: 'Gutters, Flashings & Roof', color: '#b05070', text: '#fff' },
  'INS': { labelPt: 'Instalações', labelEn: 'Installations', color: '#4682b4', text: '#fff' },
  'BUF': { labelPt: 'Buffer', labelEn: 'Buffer', color: '#000000', text: '#fff' },
  'PIN': { labelPt: 'Pintura', labelEn: 'Painting', color: '#daa520', text: '#fff' },
  'ESQ': { labelPt: 'Esquadrias', labelEn: 'Frames / Windows', color: '#f0e68c', text: '#000' },
  'REV': { labelPt: 'Outros Revestimentos', labelEn: 'Other Coatings', color: '#d2691e', text: '#fff' },
  'SUP': { labelPt: 'Ação para Suprimentos', labelEn: 'Supply Action', color: '#ff0000', text: '#fff' },
  'OFF': { labelPt: 'Fim de Semana', labelEn: 'Weekend', color: '#a0aec0', text: '#fff' },
  'FER': { labelPt: 'Feriado', labelEn: 'Holiday', color: '#e53e3e', text: '#fff' },
};

const ISHIKAWA_CATS = ['Mão de Obra', 'Máquina', 'Material', 'Método', 'Meio Ambiente', 'Medida'];

const getContrastYIQ = (hexcolor) => {
  const hex = hexcolor.replace("#", "");
  const r = parseInt(hex.substr(0,2),16);
  const g = parseInt(hex.substr(2,2),16);
  const b = parseInt(hex.substr(4,2),16);
  const yiq = ((r*299)+(g*587)+(b*114))/1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
};

const KOSKELA_KEYS = ['PROJETOS', 'MATERIAIS', 'MAO_DE_OBRA', 'EQUIPAMENTOS', 'ESPACO', 'PREDECESSORA', 'CONDICOES_EXTERNAS'];

export default function LookaheadPage() {
  const { lang } = useLanguage();
  const isEn = lang === 'en-US';

  const KOSKELA_LABELS = {
    'PROJETOS': isEn ? 'PROJECTS' : 'PROJETOS',
    'MATERIAIS': isEn ? 'MATERIALS' : 'MATERIAIS',
    'MAO_DE_OBRA': isEn ? 'LABOR' : 'MÃO DE OBRA',
    'EQUIPAMENTOS': isEn ? 'EQUIPMENT' : 'EQUIPAMENTOS',
    'ESPACO': isEn ? 'SPACE' : 'ESPAÇO',
    'PREDECESSORA': isEn ? 'PREDECESSOR' : 'PREDECESSORA',
    'CONDICOES_EXTERNAS': isEn ? 'EXTERNAL COND.' : 'CONDIÇÕES EXTERNAS'
  };

  const statusMap = {
    'EM ANDAMENTO': isEn ? 'IN PROGRESS' : 'EM ANDAMENTO',
    'NÃO RESOLVIDO': isEn ? 'UNRESOLVED' : 'NÃO RESOLVIDO',
    'RESOLVIDO': isEn ? 'RESOLVED' : 'RESOLVIDO'
  };

  const t = {
    title: isEn ? 'LOOKAHEAD (MEDIUM TERM) & KOSKELA MATRIX' : 'LOOKAHEAD (MÉDIO PRAZO) & MATRIZ DE KOSKELA',
    selectProject: isEn ? '-- Select a Project --' : '-- Selecione uma Obra --',
    scenarioLabel: isEn ? 'Scenario / Version (Lookahead)' : 'Cenário / Versão (Lookahead)',
    unsavedEdit: isEn ? '* Unsaved edit...' : '* Edição não salva...',
    newBlank: isEn ? 'New Blank Scenario' : 'Novo Cenário em Branco',
    saveScenario: isEn ? '💾 Save' : '💾 Salvar',
    updateScenario: isEn ? '💾 Update' : '💾 Atualizar',
    duplicateScenario: isEn ? '📑 Duplicate' : '📑 Duplicar',
    promptDuplicate: isEn ? 'Enter a name for the copied Scenario:' : 'Digite um nome para a cópia do Cenário:',
    scenarioUpdated: isEn ? 'Scenario updated successfully!' : 'Cenário atualizado com sucesso!',
    
    insertPackage: isEn ? '⚡ Insert Package' : '⚡ Inserir Pacote',
    undoBtn: isEn ? 'Undo' : 'Desfazer',
    showWeekends: isEn ? 'Show Weekends' : 'Mostrar Finais de Semana',
    hideWeekends: isEn ? 'Hide Weekends' : 'Ocultar Finais de Semana',
    holidaysBtn: isEn ? '📅 Holidays' : '📅 Feriados',
    startWeek1: isEn ? 'Start of Week 1' : 'Início da Semana 1',
    horizonLabel: isEn ? 'Horizon' : 'Horizonte (Semanas)',
    noProject: isEn ? 'No Project Selected' : 'Nenhuma Obra Selecionada',
    noProjectDesc: isEn ? 'Select a project from the menu above to open the Lookahead.' : 'Selecione um projeto no menu acima para abrir o Lookahead.',
    
    tabPlanilha: isEn ? '📅 Lookahead & Koskela Sheet' : '📅 Planilha Lookahead e Koskela',
    tabRestricoes: isEn ? '⚠️ Constraints Details' : '⚠️ Detalhamento das Restrições',
    
    descHeader: isEn ? 'DESCRIPTION' : 'DESCRIÇÃO',
    addRow: isEn ? '+ Add New Row' : '+ Adicionar Nova Linha',
    legendK: isEn ? 'LEGEND (KOSKELA):' : 'LEGENDA (KOSKELA):',
    legendS: isEn ? 'LEGEND (SERVICES):' : 'LEGENDA (SERVIÇOS):',
    selectOrType: isEn ? 'Select from Master Plan or type...' : 'Selecione do Master Plan ou digite...',
    
    kYes: isEn ? 'Yes' : 'Sim',
    kNo: isEn ? 'No' : 'Não',
    kYesStatus: isEn ? 'Yes - Cleared' : 'Sim - Liberado',
    kNoStatus: isEn ? 'No - Active Constraint' : 'Não - Restrição Ativa',
    
    restHeader: isEn ? 'CONSTRAINTS DETAILS' : 'DETALHAMENTO DAS RESTRIÇÕES',
    rTask: isEn ? 'TASK' : 'TAREFA',
    rCode: isEn ? 'TASK CODE' : 'CÓDIGO DA TAREFA',
    rConst: isEn ? 'CONSTRAINT' : 'RESTRIÇÃO',
    rReason: isEn ? 'REASON' : 'MOTIVO INICIAL',
    rAction: isEn ? 'ACTION' : 'AÇÃO',
    rResp: isEn ? 'RESPONSIBLE' : 'RESPONSÁVEL',
    rActionDate: isEn ? 'ACTION DATE' : 'DATA AÇÃO',
    rResDate: isEn ? 'RESOLUTION DATE' : 'DATA RESOLUÇÃO',
    rStatus: isEn ? 'STATUS' : 'STATUS',
    rManage: isEn ? 'Manage' : 'Gerenciar',
    rEmpty: isEn ? '🎉 No active constraints at the moment. May the Continuous Flow be with you!' : '🎉 Nenhuma restrição ativa no momento. Que a força do Fluxo Contínuo esteja com você!',
    rAddBtn: isEn ? '+ Add Manual Constraint' : '+ Adicionar Restrição Manual',

    // GESTÃO DE RESTRIÇÕES E KAIZEN (RCA)
    mGerTitle: isEn ? 'Manage Constraint' : 'Gerenciar Restrição',
    mGerCurStatus: isEn ? 'Current Status:' : 'Status Atual:',
    mGerTypeTitle: isEn ? 'Complexity (Triaging)' : 'Complexidade da Restrição (Triagem)',
    mGerTypeSimple: isEn ? '🟢 Simple / Operational' : '🟢 Simples / Operacional',
    mGerTypeComplex: isEn ? '🧠 Systemic (Root Cause Analysis)' : '🧠 Sistêmico (Análise de Causa Raiz)',
    mGerNewStatus: isEn ? 'Update Status' : 'Atualizar Status',
    mGerNewDate: isEn ? 'New Target Resolution Date' : 'Nova Data Alvo de Resolução',
    mGerReason: isEn ? 'Reason for Impediment / Delay' : 'Motivo do Impedimento / Atraso',
    mGerDelay: isEn ? 'Calculated Delay:' : 'Atraso Calculado:',
    mGerDays: isEn ? 'days' : 'dias',
    mGerHist: isEn ? 'Action & Delay History' : 'Diário de Bordo (Lições Aprendidas)',
    mGerSave: isEn ? 'Save Log' : 'Salvar Registro',
    mGerNoHist: isEn ? 'No logs registered yet.' : 'Nenhum registro no diário ainda.',
    
    // 5 WHYS & ISHIKAWA
    mGerIshikawa: isEn ? 'Root Cause Category (Ishikawa)' : 'Categoria da Causa Raiz (Ishikawa)',
    mGerWhy1: isEn ? 'Why? (1)' : 'Por que? (1)',
    mGerWhy2: isEn ? 'Why? (2)' : 'Por que? (2)',
    mGerWhy3: isEn ? 'Why? (3)' : 'Por que? (3)',
    mGerWhy4: isEn ? 'Why? (4)' : 'Por que? (4)',
    mGerWhy5: isEn ? 'Why? (5) - Root Cause' : 'Por que? (5) - Causa Raiz',

    mPkgTitle: isEn ? 'Insert Work Package' : 'Inserir Pacote de Trabalho',
    mPkgService: isEn ? 'Service / Activity' : 'Serviço / Atividade',
    mPkgSelect: isEn ? '-- Select --' : '-- Selecione --',
    mPkgZone: isEn ? 'Row' : 'Linha',
    mPkgRadioDate: isEn ? '📅 Start on Specific Date' : '📅 Iniciar em Data Específica',
    mPkgRadioPred: isEn ? '🔗 Start after Predecessor' : '🔗 Iniciar após Predecessora',
    mPkgStartDate: isEn ? 'Start Date' : 'Data de Início',
    mPkgLinkPred: isEn ? 'Link to Finish of:' : 'Vincular ao Término de:',
    mPkgSelectPred: isEn ? '-- Select Completed Package --' : '-- Selecione o Pacote Concluído --',
    mPkgNoPred: isEn ? 'No package added yet.' : 'Nenhum pacote lançado ainda.',
    mPkgDuration: isEn ? 'Duration (Working Days)' : 'Duração (Dias Úteis)',
    mPkgCancel: isEn ? 'Cancel' : 'Cancelar',
    mPkgAddGrid: isEn ? 'Add to Grid' : 'Lançar na Grade',
    
    newActBtn: isEn ? '+ New Service' : '+ Novo Serviço',
    newActTitle: isEn ? 'Register Custom Activity' : 'Cadastrar Nova Atividade',
    newActAcronym: isEn ? 'Acronym (max 3 letters)' : 'Sigla (máx 3 letras)',
    newActName: isEn ? 'Activity Name' : 'Nome da Atividade',
    newActColor: isEn ? 'Fill Color' : 'Cor de Preenchimento',
    
    mHolTitle: isEn ? 'Register Holidays' : 'Cadastrar Feriados',
    mHolDescPlace: isEn ? 'Description' : 'Descrição',
    mHolAdd: isEn ? 'Add' : 'Adicionar',
    mHolDateCol: isEn ? 'Date' : 'Data',
    mHolDescCol: isEn ? 'Description' : 'Descrição',
    mHolActionCol: isEn ? 'Action' : 'Ação',
    mHolEmpty: isEn ? 'No holidays registered.' : 'Nenhum feriado cadastrado.',
    mHolDel: isEn ? 'Delete' : 'Excluir',
    mHolDone: isEn ? 'Done' : 'Concluir',
  };

  const [projetosLista, setProjetosLista] = useState([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('planilha');

  // CONFIGURAÇÕES DA GRADE
  const [dataInicio, setDataInicio] = useState('2026-08-10');
  const [horizonteSemanas, setHorizonteSemanas] = useState(6);
  const [ocultarFinaisDeSemana, setOcultarFinaisDeSemana] = useState(true);
  
  const [servicosCustomizados, setServicosCustomizados] = useState({});
  const servicosCores = { ...DEFAULT_SERVICOS_CORES, ...servicosCustomizados };

  // MODAIS
  const [showNovaAtivModal, setShowNovaAtivModal] = useState(false);
  const [novaAtivSigla, setNovaAtivSigla] = useState('');
  const [novaAtivNome, setNovaAtivNome] = useState('');
  const [novaAtivCor, setNovaAtivCor] = useState('#3182ce');

  const [showFeriadosModal, setShowFeriadosModal] = useState(false);
  const [feriados, setFeriados] = useState([]);
  const [novoFeriadoData, setNovoFeriadoData] = useState('');
  const [novoFeriadoDesc, setNovoFeriadoDesc] = useState('');

  // VERSÕES (LAST PLANNER)
  const [versoes, setVersoes] = useState([]);
  const [versaoAtivaId, setVersaoAtivaId] = useState(null);

  // MOTOR DE AGENDAMENTO
  const [pacotesLancados, setPacotesLancados] = useState([]); 
  const [showPacoteModal, setShowPacoteModal] = useState(false);
  const [tipoInicio, setTipoInicio] = useState('data'); 
  const [pacotePredecessora, setPacotePredecessora] = useState('');
  const [pacoteAtividade, setPacoteAtividade] = useState('');
  const [pacoteLinhaId, setPacoteLinhaId] = useState('');
  const [pacoteDataInicio, setPacoteDataInicio] = useState('');
  const [pacoteDuracao, setPacoteDuracao] = useState(1);

  const [semanasPlanilha, setSemanasPlanilha] = useState([]);
  const [dadosCelulas, setDadosCelulas] = useState({});
  const [dadosKoskela, setDadosKoskela] = useState({});
  const [restricoes, setRestricoes] = useState([]);
  const [masterPlanTarefas, setMasterPlanTarefas] = useState([]);

  const [linhas, setLinhas] = useState([
    { id: 'l1', descricao: '' }
  ]);

  // HISTÓRICO (UNDO)
  const [historico, setHistorico] = useState([]);
  const isUndoRef = useRef(false);

  const salvarHistorico = () => {
    setHistorico(prev => [...prev, {
      pacotes: JSON.stringify(pacotesLancados),
      celulas: JSON.stringify(dadosCelulas),
      koskela: JSON.stringify(dadosKoskela),
      restricoes: JSON.stringify(restricoes),
      feriados: JSON.stringify(feriados),
      linhas: JSON.stringify(linhas),
      horizonte: horizonteSemanas
    }]);
  };

  const handleDesfazer = () => {
    if (historico.length === 0) return;
    isUndoRef.current = true;
    const novoHistorico = [...historico];
    const snapshot = novoHistorico.pop();
    setHistorico(novoHistorico);

    setPacotesLancados(JSON.parse(snapshot.pacotes));
    setDadosCelulas(JSON.parse(snapshot.celulas));
    setDadosKoskela(JSON.parse(snapshot.koskela));
    setRestricoes(JSON.parse(snapshot.restricoes));
    setFeriados(JSON.parse(snapshot.feriados));
    setLinhas(JSON.parse(snapshot.linhas));
    if (snapshot.horizonte) setHorizonteSemanas(snapshot.horizonte);
    setVersaoAtivaId(null);
  };

  // ----------------------------------------------------
  // ESTADOS DO MODAL DE GESTÃO DE RESTRIÇÕES (RCA / KAIZEN)
  // ----------------------------------------------------
  const [showGerenciarModal, setShowGerenciarModal] = useState(false);
  const [restricaoAtivaId, setRestricaoAtivaId] = useState(null);
  const [gerStatus, setGerStatus] = useState('');
  const [gerDataResolucao, setGerDataResolucao] = useState('');
  const [gerMotivo, setGerMotivo] = useState('');
  
  // Novos campos de Triagem (Lean Construction)
  const [gerComplexidade, setGerComplexidade] = useState('simples'); // 'simples' ou 'complexo'
  const [gerIshikawa, setGerIshikawa] = useState('');
  const [gerPorques, setGerPorques] = useState(['', '', '', '', '']);

  const abrirGerenciarModal = (id) => {
    const rest = restricoes.find(r => r.id === id);
    if (!rest) return;
    setRestricaoAtivaId(id);
    setGerStatus(rest.status);
    setGerDataResolucao(rest.dataResolucao || '');
    setGerMotivo('');
    setGerComplexidade('simples');
    setGerIshikawa('');
    setGerPorques(['', '', '', '', '']);
    setShowGerenciarModal(true);
  };

  const calcularAtrasoRestricao = (dataAntiga, dataNova) => {
    if (!dataAntiga || !dataNova) return 0;
    const d1 = new Date(dataAntiga);
    const d2 = new Date(dataNova);
    const diffTime = d2 - d1;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleUpdatePorque = (index, value) => {
    const novos = [...gerPorques];
    novos[index] = value;
    setGerPorques(novos);
  };

  const salvarGerenciamentoRestricao = (e) => {
    e.preventDefault();
    salvarHistorico();

    setRestricoes(prev => prev.map(r => {
      if (r.id === restricaoAtivaId) {
        
        let newDataResolucao = gerDataResolucao;
        if (gerStatus === 'RESOLVIDO') {
          newDataResolucao = r.dataResolucao || new Date().toISOString().split('T')[0];
        }

        const atrasoDias = calcularAtrasoRestricao(r.dataResolucao, newDataResolucao);

        // Montando o Log Híbrido (Simples vs RCA)
        const novoLog = {
          idLog: `log_${Date.now()}`,
          dataRegistro: new Date().toISOString().split('T')[0],
          statusAnterior: r.status,
          statusNovo: gerStatus,
          dataAnterior: r.dataResolucao,
          dataNova: newDataResolucao,
          motivo: gerMotivo,
          atraso: atrasoDias,
          tipo: gerComplexidade, // 'simples' ou 'complexo'
          ishikawa: gerComplexidade === 'complexo' ? gerIshikawa : null,
          cincoPorques: gerComplexidade === 'complexo' ? [...gerPorques] : null
        };

        const historicoAtualizado = r.historico ? [...r.historico, novoLog] : [novoLog];
        const isAcrRealizada = r.acrRealizada || gerComplexidade === 'complexo';

        return {
          ...r,
          status: gerStatus,
          dataResolucao: newDataResolucao,
          historico: historicoAtualizado,
          acrRealizada: isAcrRealizada // Flag para colocar o 🧠 na tabela
        };
      }
      return r;
    }));

    setShowGerenciarModal(false);
  };
  // ----------------------------------------------------

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
        setServicosCustomizados({});
        setHistorico([]);
        return; 
      }
      
      const savedCustomServices = localStorage.getItem(`custom_services_${projetoSelecionado}`);
      if (savedCustomServices) {
        setServicosCustomizados(JSON.parse(savedCustomServices));
      } else {
        setServicosCustomizados({});
      }
      setHistorico([]);

      const { data: mpData } = await supabase.from('projetos_masterplan').select('dados_linhas, dados_celulas').eq('projeto_id', projetoSelecionado).single();

      if (mpData && mpData.dados_linhas) {
        const tarefasMapeadas = mpData.dados_linhas.flatMap(secao => 
          secao.linhas.map(linha => {
            const celulasDaLinha = {};
            if (mpData.dados_celulas) {
              Object.keys(mpData.dados_celulas).forEach(key => {
                if (key.startsWith(`${linha.id}___`)) {
                  const dataIso = key.split('___')[1];
                  celulasDaLinha[dataIso] = mpData.dados_celulas[key];
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
      const diasSemanaPt = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
      const diasSemanaEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const diasSemana = isEn ? diasSemanaEn : diasSemanaPt;

      for (let w = 1; w <= horizonteSemanas; w++) {
        const diasDaSemana = [];
        for (let d = 0; d < 7; d++) {
          const dataClonada = new Date(dataAtual);
          const dd = String(dataClonada.getDate()).padStart(2, '0');
          const mm = String(dataClonada.getMonth() + 1).padStart(2, '0');
          const aaaa = dataClonada.getFullYear();
          const diaSemanaIndex = dataClonada.getDay();
          
          const dataIso = `${aaaa}-${mm}-${dd}`;
          const isFeriado = feriados.some(f => f.data === dataIso);

          diasDaSemana.push({
            dataCompleta: dataClonada,
            labelData: isEn ? `${mm}/${dd}` : `${dd}/${mm}`,
            labelSemana: diasSemana[diaSemanaIndex],
            isFimDeSemana: diaSemanaIndex === 0 || diaSemanaIndex === 6,
            isFeriado: isFeriado,
            dataIso: dataIso
          });
          dataAtual.setDate(dataAtual.getDate() + 1);
        }
        semanasTemp.push({ numero: w, dias: diasDaSemana });
      }
      setSemanasPlanilha(semanasTemp);
    };
    gerarSemanas();
  }, [dataInicio, feriados, isEn, horizonteSemanas]);

  // MOTOR DE RECÁLCULO AUTOMÁTICO
  useEffect(() => {
    if (semanasPlanilha.length === 0) return;
    if (isUndoRef.current) { isUndoRef.current = false; return; }

    let novaGrade = {};
    let trackerFimPacote = {}; 
    const todosDias = semanasPlanilha.flatMap(s => s.dias);

    pacotesLancados.forEach(pacote => {
      let startIndex = -1;
      if (pacote.tipoInicio === 'data') {
        startIndex = todosDias.findIndex(d => d.dataIso === pacote.dataInicio);
      } else if (pacote.tipoInicio === 'predecessora') {
        const indexFimPredecessora = trackerFimPacote[pacote.predecessoraId];
        if (indexFimPredecessora !== undefined) startIndex = indexFimPredecessora + 1; 
      }

      if (startIndex !== -1) {
        let diasAlocados = 0;
        let lastIndex = startIndex;

        for (let i = startIndex; i < todosDias.length && diasAlocados < pacote.duracao; i++) {
          const dia = todosDias[i];
          if (!dia.isFimDeSemana && !dia.isFeriado) {
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
  }, [pacotesLancados, semanasPlanilha]);

  const handleCellChange = (linhaId, dataIso, valor) => {
    salvarHistorico();
    setDadosCelulas(prev => ({ ...prev, [`${linhaId}___${dataIso}`]: valor }));
  };

  const handleKoskelaChange = (linhaId, koskelaKey, valor) => {
    salvarHistorico();
    setDadosKoskela(prev => ({ ...prev, [`${linhaId}___${koskelaKey}`]: valor }));

    if (valor === 'Não') {
      setRestricoes(prev => {
        const jaExiste = prev.find(r => r.linhaId === linhaId && r.restricao === koskelaKey);
        if (jaExiste) return prev;

        const linhaReferencia = linhas.find(l => l.id === linhaId);
        const rowIndex = linhas.findIndex(l => l.id === linhaId);
        const descRef = (linhaReferencia && linhaReferencia.descricao) ? linhaReferencia.descricao : (isEn ? `Row ${rowIndex + 1}` : `Linha ${rowIndex + 1}`);
        
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
          tarefa: descRef,
          codigoTarefa: codigoSugerido,
          restricao: koskelaKey,
          motivo: '',
          acao: '',
          responsavel: '',
          dataAcao: '',
          dataResolucao: '',
          status: 'EM ANDAMENTO',
          historico: [],
          acrRealizada: false
        };

        return [...prev, novaRestricao];
      });
    }
  };

  const atualizarLinha = (id, valorDigitado) => {
    salvarHistorico();
    setLinhas(linhas.map(l => l.id === id ? { ...l, descricao: valorDigitado } : l));

    const tarefaMPEncontrada = masterPlanTarefas.find(t => t.descricao === valorDigitado);
    if (tarefaMPEncontrada) {
      setDadosCelulas(prev => {
        const novosDados = { ...prev };
        Object.keys(tarefaMPEncontrada.celulas).forEach(dataIso => {
          if (tarefaMPEncontrada.celulas[dataIso]) {
            novosDados[`${id}___${dataIso}`] = tarefaMPEncontrada.celulas[dataIso];
          }
        });
        return novosDados;
      });
    }
  };

  const adicionarLinha = () => { salvarHistorico(); setLinhas([...linhas, { id: `l_${Date.now()}`, descricao: '' }]); };
  const removerLinha = (id) => { salvarHistorico(); setLinhas(linhas.filter(l => l.id !== id)); };

  const atualizarRestricao = (id, campo, valor) => { 
    salvarHistorico(); 
    setRestricoes(prev => prev.map(r => r.id === id ? { ...r, [campo]: valor } : r)); 
  };
  
  const removerRestricao = (id) => { 
    if (window.confirm('Excluir?')) { 
      salvarHistorico(); 
      setRestricoes(prev => prev.filter(r => r.id !== id)); 
    } 
  };

  // AÇÕES DE CENÁRIO
  const handleSalvarVersao = () => {
    const nomeCenario = prompt(t.promptScenario);
    if (!nomeCenario) return;
    const dataFormatada = new Date().toLocaleDateString(isEn ? 'en-US' : 'pt-BR', { hour: '2-digit', minute: '2-digit' });
    const novaVersao = {
      id: `v_${Date.now()}`, nome: nomeCenario, data: dataFormatada,
      pacotes: [...pacotesLancados], linhasSalvas: [...linhas], dadosKoskelaSalvos: { ...dadosKoskela }, restricoesSalvas: [...restricoes], feriadosSalvos: [...feriados],
      servicosCustomizadosSalvos: { ...servicosCustomizados }, horizonteSalvo: horizonteSemanas
    };
    setVersoes([...versoes, novaVersao]); setVersaoAtivaId(novaVersao.id); alert(t.scenarioSaved);
  };

  const handleAtualizarVersao = () => {
    if (!versaoAtivaId) return;
    const dataFormatada = new Date().toLocaleDateString(isEn ? 'en-US' : 'pt-BR', { hour: '2-digit', minute: '2-digit' });
    setVersoes(versoes.map(v => v.id === versaoAtivaId ? {
      ...v, data: dataFormatada, pacotes: [...pacotesLancados], linhasSalvas: [...linhas], dadosKoskelaSalvos: { ...dadosKoskela }, restricoesSalvas: [...restricoes], feriadosSalvos: [...feriados], servicosCustomizadosSalvos: { ...servicosCustomizados }, horizonteSalvo: horizonteSemanas
    } : v));
    alert(t.scenarioUpdated);
  };

  const handleDuplicarVersao = () => {
    const nomeCopia = prompt(t.promptDuplicate);
    if (!nomeCopia) return;
    const dataFormatada = new Date().toLocaleDateString(isEn ? 'en-US' : 'pt-BR', { hour: '2-digit', minute: '2-digit' });
    const novaVersao = {
      id: `v_${Date.now()}`, nome: nomeCopia, data: dataFormatada,
      pacotes: [...pacotesLancados], linhasSalvas: [...linhas], dadosKoskelaSalvos: { ...dadosKoskela }, restricoesSalvas: [...restricoes], feriadosSalvos: [...feriados], servicosCustomizadosSalvos: { ...servicosCustomizados }, horizonteSalvo: horizonteSemanas
    };
    setVersoes([...versoes, novaVersao]); setVersaoAtivaId(novaVersao.id); alert(t.scenarioSaved);
  };

  const handleCarregarVersao = (versaoId) => {
    salvarHistorico();
    if (!versaoId) {
      if (window.confirm(t.confirmClear)) {
        setPacotesLancados([]); setLinhas([{ id: 'l1', descricao: '' }]); setDadosKoskela({}); setRestricoes([]); setVersaoAtivaId(null);
      }
      return;
    }
    if (window.confirm(t.confirmLoad)) {
      const versao = versoes.find(v => v.id === versaoId);
      if (versao) {
        setPacotesLancados(versao.pacotes); setLinhas(versao.linhasSalvas); setDadosKoskela(versao.dadosKoskelaSalvos); setRestricoes(versao.restricoesSalvas); setFeriados(versao.feriadosSalvos); setServicosCustomizados(versao.servicosCustomizadosSalvos || {}); 
        if (versao.horizonteSalvo) setHorizonteSemanas(versao.horizonteSalvo);
        setVersaoAtivaId(versao.id);
      }
    }
  };

  const handleSalvarNovaAtividade = (e) => {
    e.preventDefault();
    const siglaUpper = novaAtivSigla.toUpperCase().trim().substring(0, 3);
    if (!siglaUpper || !novaAtivNome) return;
    const textColor = getContrastYIQ(novaAtivCor);
    const novoServico = { labelPt: novaAtivNome, labelEn: novaAtivNome, color: novaAtivCor, text: textColor };
    const novosServicosCustomizados = { ...servicosCustomizados, [siglaUpper]: novoServico };
    setServicosCustomizados(novosServicosCustomizados);
    if (projetoSelecionado) localStorage.setItem(`custom_services_${projetoSelecionado}`, JSON.stringify(novosServicosCustomizados));
    setNovaAtivSigla(''); setNovaAtivNome(''); setNovaAtivCor('#3182ce'); setShowNovaAtivModal(false);
  };

  const pacotesExistentes = pacotesLancados.map(p => {
    const rowIndex = linhas.findIndex(l => l.id === p.linhaId);
    const lDesc = (rowIndex !== -1 && linhas[rowIndex].descricao) ? linhas[rowIndex].descricao : (isEn ? `Row ${rowIndex + 1}` : `Linha ${rowIndex + 1}`);
    const sName = isEn ? (servicosCores[p.atividade]?.labelEn || p.atividade) : (servicosCores[p.atividade]?.labelPt || p.atividade);
    return { id: p.id, label: `${lDesc} - ${sName}` };
  });

  const handleInserirPacoteAutomacao = (e) => {
    e.preventDefault();
    if (!pacoteAtividade || !pacoteLinhaId || pacoteDuracao < 1) return alert(t.errFillFields);
    if (tipoInicio === 'data' && !pacoteDataInicio) return alert(t.errSelectDate);
    if (tipoInicio === 'predecessora' && !pacotePredecessora) return alert(t.errSelectPred);

    salvarHistorico();
    const novoPacote = { id: `pct_${Date.now()}`, atividade: pacoteAtividade, linhaId: pacoteLinhaId, tipoInicio: tipoInicio, dataInicio: pacoteDataInicio, predecessoraId: pacotePredecessora, duracao: pacoteDuracao };
    setPacotesLancados([...pacotesLancados, novoPacote]);
    setShowPacoteModal(false); setPacoteDataInicio(''); setPacotePredecessora(''); setPacoteDuracao(1); setVersaoAtivaId(null); 
  };

  const handleAdicionarFeriado = (e) => {
    e.preventDefault();
    if (novoFeriadoData && novoFeriadoDesc) {
      if (feriados.find(f => f.data === novoFeriadoData)) return alert(t.errHolidayExists);
      salvarHistorico();
      setFeriados([...feriados, { data: novoFeriadoData, descricao: novoFeriadoDesc }]);
      setNovoFeriadoData(''); setNovoFeriadoDesc('');
    }
  };

  const semanasRenderizadas = semanasPlanilha.map(semana => ({
    ...semana, diasVisiveis: semana.dias.filter(d => ocultarFinaisDeSemana ? !d.isFimDeSemana : true)
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

  const restricaoEmFoco = restricoes.find(r => r.id === restricaoAtivaId);
  const diffDiasCalculado = (restricaoEmFoco && gerDataResolucao) ? calcularAtrasoRestricao(restricaoEmFoco.dataResolucao, gerDataResolucao) : 0;

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
            {t.title}
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <select value={projetoSelecionado} onChange={(e) => setProjetoSelecionado(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', minWidth: '300px', fontSize: '0.9rem', outline: 'none' }}>
                <option value="">{t.selectProject}</option>
                {projetosLista.map(p => <option key={p.id} value={p.id}>#{p.id} - {p.nome_projeto}</option>)}
              </select>
            </div>

            {projetoSelecionado && (
              <>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', borderLeft: '2px solid #e2e8f0', paddingLeft: '15px', borderRight: '2px solid #e2e8f0', paddingRight: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#718096', marginBottom: '2px', textTransform: 'uppercase' }}>{t.scenarioLabel}</label>
                    <select value={versaoAtivaId || ''} onChange={(e) => handleCarregarVersao(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '0.85rem', outline: 'none', minWidth: '200px', backgroundColor: versaoAtivaId ? '#ebf8ff' : '#fff' }}>
                      <option value="">{versaoAtivaId === null && pacotesLancados.length > 0 ? t.unsavedEdit : t.newBlank}</option>
                      {versoes.map(v => <option key={v.id} value={v.id}>{v.nome} ({v.data})</option>)}
                    </select>
                  </div>

                  {versaoAtivaId === null ? (
                    <button onClick={handleSalvarVersao} disabled={pacotesLancados.length === 0 && linhas.length === 1 && !linhas[0].descricao} style={{ backgroundColor: '#4a5568', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: (pacotesLancados.length === 0 && linhas.length === 1 && !linhas[0].descricao) ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.8rem', opacity: (pacotesLancados.length === 0 && linhas.length === 1 && !linhas[0].descricao) ? 0.5 : 1, marginTop: '14px' }}>
                      {t.saveScenario}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '5px', marginTop: '14px' }}>
                      <button onClick={handleAtualizarVersao} style={{ backgroundColor: '#2f855a', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>{t.updateScenario}</button>
                      <button onClick={handleDuplicarVersao} style={{ backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>{t.duplicateScenario}</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {projetoSelecionado && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setShowPacoteModal(true)} style={{ backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              {t.insertPackage}
            </button>
            <button onClick={handleDesfazer} disabled={historico.length === 0} style={{ backgroundColor: historico.length === 0 ? '#e2e8f0' : '#e53e3e', color: historico.length === 0 ? '#a0aec0' : 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: historico.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              ↩ {t.undoBtn}
            </button>
            <button onClick={() => setOcultarFinaisDeSemana(!ocultarFinaisDeSemana)} style={{ backgroundColor: ocultarFinaisDeSemana ? '#2a4365' : '#edf2f7', color: ocultarFinaisDeSemana ? 'white' : '#4a5568', border: '1px solid #cbd5e0', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              {ocultarFinaisDeSemana ? t.showWeekends : t.hideWeekends}
            </button>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#f7fafc', padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#4a5568', marginBottom: '2px' }}>{t.startWeek1}</label>
                <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e0', outline: 'none', color: '#2d3748', cursor: 'pointer', fontSize: '0.85rem' }} />
              </div>
              <div style={{ width: '1px', height: '30px', backgroundColor: '#cbd5e0', margin: '0 5px' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#4a5568', marginBottom: '2px' }}>{t.horizonLabel}</label>
                <select value={horizonteSemanas} onChange={(e) => setHorizonteSemanas(Number(e.target.value))} style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e0', outline: 'none', color: '#2d3748', cursor: 'pointer', fontSize: '0.85rem' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                    <option key={n} value={n}>{n} {isEn ? 'Weeks' : 'Semanas'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {!projetoSelecionado ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7fafc', borderRadius: '8px', border: '2px dashed #cbd5e0' }}>
          <div style={{ textAlign: 'center', color: '#718096' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🏗️</span>
            <h2>{t.noProject}</h2>
            <p>{t.noProjectDesc}</p>
          </div>
        </div>
      ) : (
        <>
          {/* NAVEGAÇÃO DE ABAS */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button onClick={() => setAbaAtiva('planilha')} style={{ padding: '10px 20px', borderRadius: '6px 6px 0 0', fontWeight: 'bold', border: '1px solid #cbd5e0', borderBottom: abaAtiva === 'planilha' ? 'none' : '1px solid #cbd5e0', backgroundColor: abaAtiva === 'planilha' ? 'white' : '#edf2f7', color: abaAtiva === 'planilha' ? '#2a4365' : '#718096', cursor: 'pointer', zIndex: abaAtiva === 'planilha' ? 2 : 1, transform: abaAtiva === 'planilha' ? 'translateY(1px)' : 'none' }}>
              {t.tabPlanilha}
            </button>
            <button onClick={() => setAbaAtiva('restricoes')} style={{ padding: '10px 20px', borderRadius: '6px 6px 0 0', fontWeight: 'bold', border: '1px solid #cbd5e0', borderBottom: abaAtiva === 'restricoes' ? 'none' : '1px solid #cbd5e0', backgroundColor: abaAtiva === 'restricoes' ? 'white' : '#edf2f7', color: abaAtiva === 'restricoes' ? '#e53e3e' : '#718096', cursor: 'pointer', zIndex: abaAtiva === 'restricoes' ? 2 : 1, transform: abaAtiva === 'restricoes' ? 'translateY(1px)' : 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {t.tabRestricoes}
              {restricoes.length > 0 && (
                <span style={{ backgroundColor: '#e53e3e', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem' }}>{restricoes.length}</span>
              )}
            </button>
          </div>

          {/* ABA 1: PLANILHA LOOKAHEAD E KOSKELA */}
          {abaAtiva === 'planilha' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                            {isEn ? 'WEEK ' : 'SEMANA '} {semana.numero}
                          </th>
                        )
                      ))}
                      <th colSpan={KOSKELA_KEYS.length} style={{ backgroundColor: '#2a4365', color: 'white', borderBottom: '1px solid #1a365d', borderLeft: '2px solid #fff', padding: '4px 0', fontSize: '0.85rem', fontStyle: 'italic', letterSpacing: '1px' }}>
                        {isEn ? 'KOSKELA FLOW MATRIX' : 'MATRIZ DE FLUXO DE KOSKELA'}
                      </th>
                    </tr>
                    <tr>
                      <th rowSpan={2} style={{ position: 'sticky', left: 0, zIndex: 11, backgroundColor: '#1a365d', color: 'white', padding: '8px', borderRight: '1px solid #2a4365', width: '40px' }}>ID</th>
                      <th rowSpan={2} style={{ position: 'sticky', left: '40px', zIndex: 11, backgroundColor: '#1a365d', color: 'white', padding: '8px 15px', borderRight: '1px solid #2a4365', textAlign: 'left', minWidth: '280px' }}>{t.descHeader}</th>
                      {semanasRenderizadas.map(s => s.diasVisiveis.map((d, i) => (
                        <th key={`data-${s.numero}-${i}`} style={{ backgroundColor: '#1a365d', borderRight: i === s.diasVisiveis.length - 1 ? '2px solid #2a4365' : '1px solid #2a4365', borderBottom: '1px solid #2a4365', padding: '4px 2px', fontSize: '0.8rem', color: 'white', textAlign: 'center' }}>
                          {d.labelData}
                        </th>
                      )))}
                      {KOSKELA_KEYS.map((key) => (
                        <th key={key} rowSpan={2} style={{ backgroundColor: '#3182ce', color: 'white', borderRight: '1px solid #2b6cb0', borderTop: '1px solid #2b6cb0', padding: '4px 10px', fontSize: '0.7rem', width: '100px', whiteSpace: 'normal', lineHeight: '1.2' }}>
                          {KOSKELA_LABELS[key]}
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
                                placeholder={t.selectOrType}
                                style={{ width: '90%', border: 'none', outline: 'none', background: 'transparent', color: '#2d3748', fontSize: '0.85rem' }}
                              />
                              <button onClick={() => removerLinha(linha.id)} title="Excluir linha" style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                            </div>
                          </td>
                          
                          {semanasRenderizadas.map(s => s.diasVisiveis.map((d, i) => {
                            const cellKey = `${linha.id}___${d.dataIso}`;
                            const valorSalvo = dadosCelulas[cellKey];
                            const valorEfetivo = valorSalvo !== undefined ? valorSalvo : (d.isFimDeSemana ? 'OFF' : '');
                            const configCor = servicosCores[valorEfetivo] || servicosCores[''];
                            
                            // IDENTIFICADOR VISUAL DE DATA DE AÇÃO PLANEJADA PARA RESTRIÇÃO
                            const hasRestricaoNaData = restricoes.some(r => r.linhaId === linha.id && r.dataAcao === d.dataIso && r.status !== 'RESOLVIDO');

                            let bgColor = 'transparent';
                            if (configCor.color !== 'transparent') bgColor = configCor.color;
                            else if (d.isFeriado && !d.isFimDeSemana) bgColor = '#fed7d7';
                            else if (d.isFimDeSemana) bgColor = '#e2e8f0';

                            return (
                              <td key={cellKey} style={{ borderRight: i === s.diasVisiveis.length - 1 ? '2px solid #2a4365' : '1px dotted #cbd5e0', padding: '1px', backgroundColor: bgColor, textAlign: 'center', minWidth: '45px', height: '26px' }}>
                                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {hasRestricaoNaData && (
                                    <div style={{ position: 'absolute', top: '-2px', left: '0px', fontSize: '0.55rem', zIndex: 10 }} title="Ação de Restrição Planejada">🚩</div>
                                  )}
                                  <select
                                    value={valorEfetivo}
                                    onChange={(e) => handleCellChange(linha.id, d.dataIso, e.target.value)}
                                    style={{ width: '100%', height: '100%', backgroundColor: configCor.color, color: configCor.text, border: 'none', outline: 'none', fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center', textAlignLast: 'center', appearance: 'none', cursor: 'pointer', borderRadius: '2px', padding: '0 4px' }}
                                  >
                                    <option value=""></option>
                                    {Object.keys(servicosCores).filter(k => k !== '').map(sigla => (
                                      <option key={sigla} value={sigla}>{sigla}</option>
                                    ))}
                                  </select>
                                  <div style={{ position: 'absolute', right: '2px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.45rem', color: configCor.text === '#fff' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}>▼</div>
                                </div>
                              </td>
                            );
                          }))}

                          {KOSKELA_KEYS.map((colKey, idx) => {
                            const koskelaKey = `${linha.id}___${colKey}`;
                            const val = dadosKoskela[koskelaKey] || '';
                            let bgColor = 'transparent'; let textColor = '#2d3748';
                            if (val === 'Sim') { bgColor = '#c6f6d5'; textColor = '#22543d'; }
                            if (val === 'Não') { bgColor = '#fed7d7'; textColor = '#742a2a'; }

                            return (
                              <td key={koskelaKey} style={{ borderRight: '1px dotted #cbd5e0', padding: '1px', backgroundColor: bgColor, textAlign: 'center', minWidth: '100px', height: '26px' }}>
                                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <select
                                    value={val}
                                    onChange={(e) => handleKoskelaChange(linha.id, colKey, e.target.value)}
                                    style={{ width: '100%', height: '100%', backgroundColor: 'transparent', color: textColor, border: 'none', outline: 'none', fontSize: '0.75rem', fontWeight: val ? 'bold' : 'normal', textAlign: 'center', textAlignLast: 'center', appearance: 'none', cursor: 'pointer', padding: '0 4px' }}
                                  >
                                    <option value=""></option>
                                    <option value="Sim">{t.kYes}</option>
                                    <option value="Não">{t.kNo}</option>
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
                          {t.addRow}
                        </button>
                      </td>
                      <td colSpan={totalDiasVisiveis + KOSKELA_KEYS.length} style={{ borderBottom: '1px solid #cbd5e0', backgroundColor: 'white' }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e0', display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                <span style={{ fontWeight: 'bold', color: '#1a365d' }}>{t.legendK}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '12px', height: '12px', backgroundColor: '#c6f6d5', borderRadius: '2px', border: '1px solid #22543d' }}></div><span style={{ color: '#22543d' }}><b>{t.kYes}</b> - {t.kYesStatus.split('-')[1]}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '12px', height: '12px', backgroundColor: '#fed7d7', borderRadius: '2px', border: '1px solid #742a2a' }}></div><span style={{ color: '#742a2a' }}><b>{t.kNo}</b> - {t.kNoStatus.split('-')[1]}</span></div>
                <div style={{ width: '1px', height: '15px', backgroundColor: '#cbd5e0', margin: '0 5px' }}></div>
                <span style={{ fontWeight: 'bold', color: '#1a365d' }}>{t.legendS}</span>
                {Object.entries(servicosCores).filter(([sigla]) => sigla !== '').map(([sigla, info]) => (
                  <div key={sigla} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: info.color, borderRadius: '2px', border: '1px solid #cbd5e0' }}></div>
                    <span><b>{sigla}</b> - {isEn ? info.labelEn : info.labelPt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 2: DETALHAMENTO DAS RESTRIÇÕES COM NOVO MOTOR (RCA / KAIZEN) */}
          {abaAtiva === 'restricoes' && (
             <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'white', border: '1px solid #cbd5e0', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <table style={{ borderCollapse: 'collapse', whiteSpace: 'nowrap', width: '100%', minWidth: '1200px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th colSpan={11} style={{ backgroundColor: 'white', padding: '10px 15px', textAlign: 'left', fontStyle: 'italic', color: '#1a365d', borderBottom: '2px solid #2a4365', fontSize: '1.2rem' }}>
                      {t.restHeader}
                    </th>
                  </tr>
                  <tr>
                    <th style={{ backgroundColor: '#2a4365', color: 'white', padding: '10px', width: '40px', borderRight: '1px solid #fff' }}>ID</th>
                    <th style={{ backgroundColor: '#2a4365', color: 'white', padding: '10px', textAlign: 'left', borderRight: '1px solid #fff', minWidth: '250px' }}>{t.rTask}</th>
                    <th style={{ backgroundColor: '#2a4365', color: 'white', padding: '10px', borderRight: '1px solid #fff', width: '100px', lineHeight: '1.2' }}>{t.rCode}</th>
                    <th style={{ backgroundColor: '#2a4365', color: 'white', padding: '10px', textAlign: 'left', borderRight: '1px solid #fff', width: '130px' }}>{t.rConst}</th>
                    <th style={{ backgroundColor: '#2a4365', color: 'white', padding: '10px', textAlign: 'left', borderRight: '1px solid #fff', minWidth: '200px' }}>{t.rReason}</th>
                    <th style={{ backgroundColor: '#2a4365', color: 'white', padding: '10px', textAlign: 'left', borderRight: '1px solid #fff', minWidth: '200px' }}>{t.rAction}</th>
                    <th style={{ backgroundColor: '#2a4365', color: 'white', padding: '10px', textAlign: 'left', borderRight: '1px solid #fff', width: '150px' }}>{t.rResp}</th>
                    <th style={{ backgroundColor: '#2a4365', color: 'white', padding: '10px', borderRight: '1px solid #fff', width: '120px' }}>{t.rActionDate}</th>
                    <th style={{ backgroundColor: '#2a4365', color: 'white', padding: '10px', borderRight: '1px solid #fff', width: '120px' }}>{t.rResDate}</th>
                    <th style={{ backgroundColor: '#2a4365', color: 'white', padding: '10px', width: '140px', borderRight: '1px solid #fff' }}>{t.rStatus}</th>
                    <th style={{ backgroundColor: '#2a4365', color: 'white', padding: '10px', width: '120px' }}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {restricoes.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: '#a0aec0', fontSize: '1.1rem' }}>
                        {t.rEmpty}
                      </td>
                    </tr>
                  ) : (
                    restricoes.map((rest) => {
                      const idNum = restricaoIdCounter++;
                      const corCodigo = servicosCores[rest.codigoTarefa] || servicosCores[''];
                      const statusStyle = getStatusStyle(rest.status);

                      return (
                        <tr key={rest.id} style={{ borderBottom: '1px dotted #cbd5e0', backgroundColor: rest.status === 'RESOLVIDO' ? '#f0fff4' : 'white' }}>
                          <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e2e8f0', color: '#4a5568', fontWeight: 'bold' }}>{idNum}</td>
                          <td style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <input 
                                type="text" 
                                value={rest.tarefa} 
                                onChange={(e) => atualizarRestricao(rest.id, 'tarefa', e.target.value)}
                                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: '#2d3748', fontSize: '0.85rem' }}
                              />
                              {/* SELO DE ANÁLISE DE CAUSA RAIZ */}
                              {rest.acrRealizada && (
                                <span title="Análise de Causa Raiz Realizada" style={{ fontSize: '1.2rem' }}>🧠</span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '2px', borderRight: '1px solid #e2e8f0', backgroundColor: corCodigo.color }}>
                            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
                              <select
                                value={rest.codigoTarefa}
                                onChange={(e) => atualizarRestricao(rest.id, 'codigoTarefa', e.target.value)}
                                style={{ width: '100%', padding: '6px', backgroundColor: 'transparent', color: corCodigo.text, border: 'none', outline: 'none', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', textAlignLast: 'center', appearance: 'none', cursor: 'pointer' }}
                              >
                                <option value=""></option>
                                {Object.keys(servicosCores).filter(k => k !== '').map(sigla => <option key={sigla} value={sigla}>{sigla}</option>)}
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
                                {KOSKELA_KEYS.map(k => <option key={k} value={k}>{KOSKELA_LABELS[k]}</option>)}
                              </select>
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0' }}>
                            <input type="text" value={rest.motivo} onChange={(e) => atualizarRestricao(rest.id, 'motivo', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: '#2d3748', fontSize: '0.85rem' }} />
                          </td>
                          <td style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0' }}>
                            <input type="text" value={rest.acao} onChange={(e) => atualizarRestricao(rest.id, 'acao', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: '#2d3748', fontSize: '0.85rem' }} />
                          </td>
                          <td style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0' }}>
                            <input type="text" value={rest.responsavel} onChange={(e) => atualizarRestricao(rest.id, 'responsavel', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: '#2d3748', fontSize: '0.85rem', textAlign: 'center' }} />
                          </td>
                          <td style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <input 
                              type="date" 
                              value={rest.dataAcao} 
                              onChange={(e) => {
                                const newDate = e.target.value;
                                salvarHistorico();
                                setRestricoes(prev => prev.map(r => r.id === rest.id ? { ...r, dataAcao: newDate } : r));
                                if (newDate && rest.linhaId) {
                                  setDadosCelulas(prev => ({ ...prev, [`${rest.linhaId}___${newDate}`]: 'SUP' }));
                                }
                              }} 
                              style={{ border: 'none', outline: 'none', background: 'transparent', color: '#2d3748', fontSize: '0.85rem', cursor: 'pointer' }} 
                            />
                          </td>

                          {/* DADOS TRAVADOS PARA OBRIGAR O USO DO GERENCIAR */}
                          <td style={{ padding: '8px 10px', borderRight: '1px solid #e2e8f0', textAlign: 'center', color: '#4a5568', fontSize: '0.85rem' }}>
                            {rest.dataResolucao ? rest.dataResolucao.split('-').reverse().join('/') : '-'}
                          </td>
                          <td style={{ padding: '2px', borderRight: '1px solid #e2e8f0', backgroundColor: statusStyle.backgroundColor, textAlign: 'center', fontWeight: 'bold', color: statusStyle.color, fontSize: '0.8rem' }}>
                            {statusMap[rest.status] || rest.status}
                          </td>
                          
                          <td style={{ padding: '8px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '5px' }}>
                            <button onClick={() => abrirGerenciarModal(rest.id)} title="Gerenciar Diário e Status" style={{ backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}>
                              ⚙️ {t.rManage}
                            </button>
                            <button onClick={() => removerRestricao(rest.id)} title="Excluir Restrição" style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>✖</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  <tr>
                    <td colSpan={11} style={{ padding: '15px', backgroundColor: '#f7fafc', textAlign: 'left', borderTop: '1px solid #cbd5e0' }}>
                      <button 
                        onClick={() => { salvarHistorico(); setRestricoes([...restricoes, { id: `rest_${Date.now()}`, linhaId: null, tarefa: '', codigoTarefa: '', restricao: '', motivo: '', acao: '', responsavel: '', dataAcao: '', dataResolucao: '', status: 'EM ANDAMENTO', historico: [], acrRealizada: false }])}} 
                        style={{ backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                      >
                        {t.rAddBtn}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
             </div>
          )}

          {/* NOVO MODAL: DIÁRIO DE BORDO E KAIZEN (GERENCIAR RESTRIÇÃO) */}
          {showGerenciarModal && restricaoAtivaId && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3005 }}>
              <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '650px', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'sans-serif' }}>
                <h2 style={{ color: '#1a365d', marginBottom: '15px' }}>⚙️ {t.mGerTitle}</h2>
                
                <div style={{ backgroundColor: '#ebf8ff', padding: '15px', borderRadius: '8px', border: '1px solid #90cdf4', marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#2a4365' }}><strong>{t.rTask}:</strong> {restricoes.find(r=>r.id===restricaoAtivaId)?.tarefa}</p>
                  <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#2a4365' }}><strong>{t.rConst}:</strong> {KOSKELA_LABELS[restricoes.find(r=>r.id===restricaoAtivaId)?.restricao] || restricoes.find(r=>r.id===restricaoAtivaId)?.restricao}</p>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: '#2a4365' }}><strong>{t.mGerCurStatus}</strong> <span style={{ fontWeight: 'bold', color: getStatusStyle(restricoes.find(r=>r.id===restricaoAtivaId)?.status).color }}>{statusMap[restricoes.find(r=>r.id===restricaoAtivaId)?.status]}</span></p>
                </div>

                <form onSubmit={salvarGerenciamentoRestricao} style={{ display: 'flex', flexDirection: 'column', gap: '15px', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '20px' }}>
                  
                  {/* SELETOR DE TRIAGEM */}
                  <div style={{ backgroundColor: '#f7fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '10px', color: '#4a5568' }}>{t.mGerTypeTitle}</label>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: '#2d3748', cursor: 'pointer', fontWeight: 'bold' }}>
                        <input type="radio" value="simples" checked={gerComplexidade === 'simples'} onChange={() => setGerComplexidade('simples')} />
                        {t.mGerTypeSimple}
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: '#2d3748', cursor: 'pointer', fontWeight: 'bold' }}>
                        <input type="radio" value="complexo" checked={gerComplexidade === 'complexo'} onChange={() => setGerComplexidade('complexo')} />
                        {t.mGerTypeComplex}
                      </label>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.mGerNewStatus}</label>
                    <select value={gerStatus} onChange={(e) => setGerStatus(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none' }}>
                      <option value="EM ANDAMENTO">{statusMap['EM ANDAMENTO']}</option>
                      <option value="NÃO RESOLVIDO">{statusMap['NÃO RESOLVIDO']}</option>
                      <option value="RESOLVIDO">{statusMap['RESOLVIDO']}</option>
                    </select>
                  </div>

                  {gerStatus === 'NÃO RESOLVIDO' && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.mGerNewDate}</label>
                        <input type="date" required value={gerDataResolucao} onChange={(e) => setGerDataResolucao(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none' }} />
                        {diffDiasCalculado > 0 && (
                          <p style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '5px', fontWeight: 'bold' }}>⚠️ {t.mGerDelay} +{diffDiasCalculado} {t.mGerDays}</p>
                        )}
                      </div>

                      {gerComplexidade === 'simples' ? (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.mGerReason}</label>
                          <textarea required value={gerMotivo} onChange={(e) => setGerMotivo(e.target.value)} placeholder="Ex: Pneu do caminhão furou, reagendado..." rows="2" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none', resize: 'vertical' }} />
                        </div>
                      ) : (
                        <div style={{ backgroundColor: '#fffff0', padding: '15px', borderRadius: '8px', border: '1px solid #c6f6d5', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <h4 style={{ margin: '0 0 5px 0', color: '#22543d', fontSize: '0.9rem' }}>🧠 RCA (Root Cause Analysis)</h4>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '3px', color: '#276749' }}>{t.mGerIshikawa}</label>
                            <select required value={gerIshikawa} onChange={(e) => setGerIshikawa(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #9ae6b4', outline: 'none' }}>
                              <option value="">-- Selecione Categoria --</option>
                              {ISHIKAWA_CATS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                          </div>
                          <div><input type="text" required placeholder={t.mGerWhy1} value={gerPorques[0]} onChange={(e) => handleUpdatePorque(0, e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #9ae6b4', marginBottom: '4px', outline: 'none', fontSize: '0.8rem' }}/></div>
                          <div><input type="text" placeholder={t.mGerWhy2} value={gerPorques[1]} onChange={(e) => handleUpdatePorque(1, e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #9ae6b4', marginBottom: '4px', outline: 'none', fontSize: '0.8rem' }}/></div>
                          <div><input type="text" placeholder={t.mGerWhy3} value={gerPorques[2]} onChange={(e) => handleUpdatePorque(2, e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #9ae6b4', marginBottom: '4px', outline: 'none', fontSize: '0.8rem' }}/></div>
                          <div><input type="text" placeholder={t.mGerWhy4} value={gerPorques[3]} onChange={(e) => handleUpdatePorque(3, e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #9ae6b4', marginBottom: '4px', outline: 'none', fontSize: '0.8rem' }}/></div>
                          <div><input type="text" required placeholder={t.mGerWhy5} value={gerPorques[4]} onChange={(e) => handleUpdatePorque(4, e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '2px solid #48bb78', outline: 'none', fontSize: '0.8rem', fontWeight: 'bold' }}/></div>
                        </div>
                      )}
                    </>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '5px' }}>
                    <button type="button" onClick={() => setShowGerenciarModal(false)} style={{ backgroundColor: '#cbd5e0', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', color: '#4a5568', fontWeight: 'bold' }}>{t.mPkgCancel}</button>
                    <button type="submit" style={{ backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t.mGerSave}</button>
                  </div>
                </form>

                <div>
                  <h3 style={{ color: '#2a4365', fontSize: '1rem', marginBottom: '15px' }}>📋 {t.mGerHist}</h3>
                  {(!restricoes.find(r=>r.id===restricaoAtivaId)?.historico || restricoes.find(r=>r.id===restricaoAtivaId).historico.length === 0) ? (
                    <p style={{ fontSize: '0.85rem', color: '#a0aec0', fontStyle: 'italic' }}>{t.mGerNoHist}</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {restricoes.find(r=>r.id===restricaoAtivaId).historico.map((log) => (
                        <div key={log.idLog} style={{ backgroundColor: log.tipo === 'complexo' ? '#fffff0' : '#f7fafc', padding: '10px', borderRadius: '6px', borderLeft: log.tipo === 'complexo' ? '4px solid #48bb78' : '4px solid #3182ce', fontSize: '0.8rem', color: '#4a5568' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontWeight: 'bold' }}>{log.dataRegistro.split('-').reverse().join('/')}</span>
                            <span style={{ backgroundColor: getStatusStyle(log.statusNovo).backgroundColor, color: getStatusStyle(log.statusNovo).color, padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.7rem' }}>
                              {statusMap[log.statusNovo]}
                            </span>
                          </div>
                          
                          {log.tipo === 'simples' && log.motivo && <p style={{ margin: '5px 0' }}><strong>Motivo:</strong> {log.motivo}</p>}
                          
                          {log.tipo === 'complexo' && (
                            <div style={{ marginTop: '8px' }}>
                              <span style={{ backgroundColor: '#c6f6d5', color: '#22543d', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.65rem' }}>🧠 Causa Raiz: {log.ishikawa}</span>
                              <ul style={{ paddingLeft: '15px', marginTop: '5px', marginBottom: '5px' }}>
                                {log.cincoPorques?.map((pq, i) => pq && <li key={i}><em>{pq}</em></li>)}
                              </ul>
                            </div>
                          )}

                          {log.atraso > 0 && <p style={{ margin: '5px 0 0 0', color: '#e53e3e' }}><strong>Atraso Registrado:</strong> +{log.atraso} dias</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* MODAL: NOVA ATIVIDADE CUSTOMIZADA */}
          {showNovaAtivModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3001 }}>
              <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '10px', width: '400px', fontFamily: 'sans-serif' }}>
                <h2 style={{ color: '#1a365d', marginBottom: '20px' }}>{t.newActTitle}</h2>
                <form onSubmit={handleSalvarNovaAtividade} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.newActAcronym}</label>
                    <input type="text" maxLength="3" required value={novaAtivSigla} onChange={(e) => setNovaAtivSigla(e.target.value.toUpperCase())} placeholder="Ex: DRY" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none', textTransform: 'uppercase' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.newActName}</label>
                    <input type="text" required value={novaAtivNome} onChange={(e) => setNovaAtivNome(e.target.value)} placeholder="Ex: Parede Drywall" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.newActColor}</label>
                    <input type="color" value={novaAtivCor} onChange={(e) => setNovaAtivCor(e.target.value)} style={{ width: '100%', height: '40px', padding: '2px', borderRadius: '6px', border: '1px solid #cbd5e0', cursor: 'pointer' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button type="button" onClick={() => setShowNovaAtivModal(false)} style={{ backgroundColor: '#cbd5e0', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', color: '#4a5568', fontWeight: 'bold' }}>{t.mPkgCancel}</button>
                    <button type="submit" style={{ backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{t.saveScenario}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: INSERIR PACOTE DE TRABALHO AUTOMÁTICO */}
          {showPacoteModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
              <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '550px', fontFamily: 'sans-serif' }}>
                <h2 style={{ color: '#1a365d', marginBottom: '20px' }}>{t.mPkgTitle}</h2>
                
                <form onSubmit={handleInserirPacoteAutomacao} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.mPkgService}</label>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <select required value={pacoteAtividade} onChange={(e) => setPacoteAtividade(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none' }}>
                          <option value="">{t.mPkgSelect}</option>
                          {Object.entries(servicosCores).filter(([sigla]) => sigla !== '' && sigla !== 'OFF' && sigla !== 'FER').map(([sigla, info]) => (
                              <option key={sigla} value={sigla}>{isEn ? info.labelEn : info.labelPt} ({sigla})</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => setShowNovaAtivModal(true)} style={{ backgroundColor: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '6px', padding: '0 10px', cursor: 'pointer', fontWeight: 'bold', color: '#2b6cb0', fontSize: '0.75rem' }} title="Criar nova atividade">
                          {t.newActBtn}
                        </button>
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.mPkgZone}</label>
                      <select required value={pacoteLinhaId} onChange={(e) => setPacoteLinhaId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', outline: 'none' }}>
                        <option value="">{t.mPkgSelect}</option>
                        {linhas.map((linha, index) => (
                          <option key={linha.id} value={linha.id}>
                            {linha.descricao || (isEn ? `Row ${index + 1}` : `Linha ${index + 1}`)}
                          </option>
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

          {/* MODAL FERIADOS */}
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
        </>
      )}

    </div>
  );
}
