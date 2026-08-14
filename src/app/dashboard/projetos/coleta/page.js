'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { supabase } from '../../../../lib/supabase';

export default function ColetaDadosPage() {
  const { lang } = useLanguage();
  
  const [projetosLista, setProjetosLista] = useState([]);
  const [coletasLista, setColetasLista] = useState([]);
  const [setorizacoesLista, setSetorizacoesLista] = useState([]);
  
  const [showModalColeta, setShowModalColeta] = useState(false);
  const [showModalSetorizacao, setShowModalSetorizacao] = useState(false);
  const [showModalNovoServico, setShowModalNovoServico] = useState(false);
  const [showModalRelatorio, setShowModalRelatorio] = useState(false);

  const [filtroTipoAmbiente, setFiltroTipoAmbiente] = useState('');
  const [filtroDivisao, setFiltroDivisao] = useState('');
  const [filtroSubdivisao, setFiltroSubdivisao] = useState('');
  const [ordenacao, setOrdenacao] = useState('divisao_asc');

  const [novoPavimentoInput, setNovoPavimentoInput] = useState('');
  const [novaFaseInput, setNovaFaseInput] = useState('');

  const [editColetaId, setEditColetaId] = useState(null);
  const [editComboKey, setEditComboKey] = useState(null);

  const [formDataColeta, setFormDataColeta] = useState({
    projeto_id: '', pavimentos: '', areaTerreno: '', areaConstruida: '', tipoObra: ''
  });

  const [formDataSetorizacao, setFormDataSetorizacao] = useState({
    projeto_id: '', ambiente: '', tipo_ambiente: 'Interno', pavimento: '', fase: '', servico: '', quantidade: ''
  });

  const [formNovoServicoLinha, setFormNovoServicoLinha] = useState({
    comboKey: '', servico: '', quantidade: ''
  });

  const [opcoesRelatorio, setOpcoesRelatorio] = useState({
    incluirGeral: true,
    incluirSetorizacao: true,
    filtroAmbiente: 'todos'
  });

  // Escuta os eventos globais disparados pelos botões da Header
  useEffect(() => {
    const handleOpenColeta = () => {
      setEditColetaId(null);
      setFormDataColeta({ projeto_id: '', pavimentos: '', areaTerreno: '', areaConstruida: '', tipoObra: '' });
      setShowModalColeta(true);
    };

    const handleOpenSetorizacao = () => {
      setEditComboKey(null);
      setNovoPavimentoInput('');
      setNovaFaseInput('');
      setFormDataSetorizacao({ projeto_id: '', ambiente: '', tipo_ambiente: 'Interno', pavimento: '', fase: '', servico: '', quantidade: '' });
      setShowModalSetorizacao(true);
    };

    window.addEventListener('abrir-modal-coleta', handleOpenColeta);
    window.addEventListener('abrir-modal-setorizacao', handleOpenSetorizacao);

    return () => {
      window.removeEventListener('abrir-modal-coleta', handleOpenColeta);
      window.removeEventListener('abrir-modal-setorizacao', handleOpenSetorizacao);
    };
  }, []);

  const fetchData = async () => {
    const { data: projData } = await supabase.from('projetos').select('id, nome_projeto, cliente');
    if (projData) setProjetosLista(projData);

    const { data: coletaData } = await supabase.from('coleta_dados').select('*').order('id', { ascending: false });
    if (coletaData) setColetasLista(coletaData);

    const { data: setorData } = await supabase.from('setorizacao_obras').select('*').order('id', { ascending: false });
    if (setorData) setSetorizacoesLista(setorData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCellChange = async (amb, tipoAmb, pav, fas, servico, novaQuantidade) => {
    const valorNumerico = novaQuantidade === '' ? null : parseFloat(novaQuantidade);
    const registroExistente = setorizacoesLista.find(
      s => s.ambiente === amb && (s.tipo_ambiente || 'Interno') === tipoAmb && s.pavimento === pav && s.fase === fas && s.servico === servico
    );

    if (registroExistente) {
      if (valorNumerico === null) {
        await supabase.from('setorizacao_obras').delete().eq('id', registroExistente.id);
      } else {
        await supabase.from('setorizacao_obras').update({ quantidade: valorNumerico }).eq('id', registroExistente.id);
      }
    } else if (valorNumerico !== null && !isNaN(valorNumerico)) {
      const projetoRef = setorizacoesLista.find(s => s.ambiente === amb && s.pavimento === pav && s.fase === fas)?.projeto_id || projetosLista[0]?.id || '';
      await supabase.from('setorizacao_obras').insert([{
        projeto_id: projetoRef, ambiente: amb, tipo_ambiente: tipoAmb, pavimento: pav, fase: fas, servico: servico, quantidade: valorNumerico
      }]);
    }
    fetchData();
  };

  const handleSaveColeta = async (e) => {
    e.preventDefault();
    if (editColetaId) {
      await supabase.from('coleta_dados').update({
        projeto_id: formDataColeta.projeto_id,
        pavimentos: formDataColeta.pavimentos,
        area_terreno: formDataColeta.areaTerreno,
        area_construida: formDataColeta.areaConstruida,
        tipo_obra: formDataColeta.tipoObra
      }).eq('id', editColetaId);
    } else {
      await supabase.from('coleta_dados').insert([{
        projeto_id: formDataColeta.projeto_id,
        pavimentos: formDataColeta.pavimentos,
        area_terreno: formDataColeta.areaTerreno,
        area_construida: formDataColeta.areaConstruida,
        tipo_obra: formDataColeta.tipoObra
      }]);
    }
    setShowModalColeta(false);
    setEditColetaId(null);
    setFormDataColeta({ projeto_id: '', pavimentos: '', areaTerreno: '', areaConstruida: '', tipoObra: '' });
    fetchData();
  };

  const handleSaveSetorizacao = async (e) => {
    e.preventDefault();
    const pavimentoFinal = formDataSetorizacao.pavimento === 'OUTRO' ? novoPavimentoInput : formDataSetorizacao.pavimento;
    const faseFinal = formDataSetorizacao.fase === 'OUTRO' ? novaFaseInput : formDataSetorizacao.fase;

    if (editComboKey) {
      const [oldAmb, oldTipo, oldPav, oldFas] = editComboKey.split('___');
      await supabase.from('setorizacao_obras').delete().match({ ambiente: oldAmb, tipo_ambiente: oldTipo, pavimento: oldPav, fase: oldFas });
    }

    await supabase.from('setorizacao_obras').insert([{ ...formDataSetorizacao, pavimento: pavimentoFinal, fase: faseFinal }]);
    setShowModalSetorizacao(false);
    setEditComboKey(null);
    setNovoPavimentoInput('');
    setNovaFaseInput('');
    setFormDataSetorizacao({ projeto_id: '', ambiente: '', tipo_ambiente: 'Interno', pavimento: '', fase: '', servico: '', quantidade: '' });
    fetchData();
  };

  const handleAddServicoNaLinha = async (e) => {
    e.preventDefault();
    const [amb, tipoAmb, pav, fas] = formNovoServicoLinha.comboKey.split('___');
    const projetoRef = setorizacoesLista.find(s => s.ambiente === amb && (s.tipo_ambiente || 'Interno') === tipoAmb && s.pavimento === pav && s.fase === fas)?.projeto_id || projetosLista[0]?.id || '';
    
    await supabase.from('setorizacao_obras').insert([{
      projeto_id: projetoRef,
      ambiente: amb,
      tipo_ambiente: tipoAmb,
      pavimento: pav,
      fase: fas,
      servico: formNovoServicoLinha.servico,
      quantidade: formNovoServicoLinha.quantidade
    }]);

    setShowModalNovoServico(false);
    setFormNovoServicoLinha({ comboKey: '', servico: '', quantidade: '' });
    fetchData();
  };

  const handleEditColeta = (item) => {
    setEditColetaId(item.id);
    setFormDataColeta({
      projeto_id: item.projeto_id || '',
      pavimentos: item.pavimentos || '',
      areaTerreno: item.area_terreno || '',
      areaConstruida: item.area_construida || '',
      tipoObra: item.tipo_obra || ''
    });
    setShowModalColeta(true);
  };

  const handleEditLinhaQuadro = (amb, tipoAmb, pav, fas) => {
    const itens = setorizacoesLista.filter(s => s.ambiente === amb && (s.tipo_ambiente || 'Interno') === tipoAmb && s.pavimento === pav && s.fase === fas);
    if (itens.length > 0) {
      setEditComboKey(`${amb}___${tipoAmb}___${pav}___${fas}`);
      setFormDataSetorizacao({
        projeto_id: itens[0].projeto_id || '',
        ambiente: amb,
        tipo_ambiente: tipoAmb || 'Interno',
        pavimento: pav,
        fase: fas,
        servico: itens[0].servico || '',
        quantidade: itens[0].quantidade || ''
      });
      setShowModalSetorizacao(true);
    }
  };

  const handleDeleteColeta = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta coleta inicial?')) {
      await supabase.from('coleta_dados').delete().eq('id', id);
      fetchData();
    }
  };

  const handleDeleteSetorizacao = async (amb, tipoAmb, pav, fas) => {
    if (window.confirm(`Tem certeza que deseja excluir toda a linha do ambiente "${amb}" (${tipoAmb})?`)) {
      const itens = setorizacoesLista.filter(s => s.ambiente === amb && (s.tipo_ambiente || 'Interno') === tipoAmb && s.pavimento === pav && s.fase === fas);
      for (const item of itens) {
        await supabase.from('setorizacao_obras').delete().eq('id', item.id);
      }
      fetchData();
    }
  };

  const gerarPDF = () => {
    import('html2pdf.js').then((html2pdf) => {
      const elemento = document.getElementById('conteudo-relatorio-pdf');
      const opcoes = {
        margin:       10,
        filename:     `relatorio-obras-${Date.now()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      
      const html2pdfInstance = html2pdf.default ? html2pdf.default : html2pdf;
      html2pdfInstance().from(elemento).set(opcoes).save();
      setShowModalRelatorio(false);
    });
  };

  const pavimentosPadrao = ['PV1', 'PV2', 'PV3', 'PV4', 'PV5', 'Térreo', 'Subsolo'];
  const divisoesExistentes = [...new Set([...pavimentosPadrao, ...setorizacoesLista.map(s => s.pavimento).filter(Boolean)])];

  const fasesPadrao = ['Z1', 'Z2', 'Z3', 'Z4', 'Bloco 1', 'Bloco 2', 'Bloco 3', 'Setor 1', 'Setor 2', 'Setor 3'];
  const subdivisoesExistentes = [...new Set([...fasesPadrao, ...setorizacoesLista.map(s => s.fase).filter(Boolean)])];

  const ambientesFiltradosEOrdenados = [...new Set(
    setorizacoesLista
      .filter(s => {
        const matchTipo = filtroTipoAmbiente ? (s.tipo_ambiente || 'Interno') === filtroTipoAmbiente : true;
        const matchDivisao = filtroDivisao ? s.pavimento === filtroDivisao : true;
        const matchSubdivisao = filtroSubdivisao ? s.fase === filtroSubdivisao : true;
        return matchTipo && matchDivisao && matchSubdivisao;
      })
      .map(s => `${s.ambiente}___${s.tipo_ambiente || 'Interno'}___${s.pavimento}___${s.fase}`)
  )].sort((a, b) => {
    const [ambA, tipoA, pavA, fasA] = a.split('___');
    const [ambB, tipoB, pavB, fasB] = b.split('___');

    if (ordenacao === 'divisao_asc') {
      return pavA.localeCompare(pavB, 'pt', { numeric: true }) || fasA.localeCompare(fasB, 'pt', { numeric: true });
    }
    if (ordenacao === 'divisao_desc') {
      return pavB.localeCompare(pavA, 'pt', { numeric: true }) || fasB.localeCompare(fasA, 'pt', { numeric: true });
    }
    if (ordenacao === 'subdivisao_asc') {
      return fasA.localeCompare(fasB, 'pt', { numeric: true }) || pavA.localeCompare(pavB, 'pt', { numeric: true });
    }
    if (ordenacao === 'subdivisao_desc') {
      return fasB.localeCompare(fasA, 'pt', { numeric: true }) || pavB.localeCompare(pavA, 'pt', { numeric: true });
    }
    if (ordenacao === 'ambiente_asc') {
      return ambA.localeCompare(ambB, 'pt');
    }
    if (ordenacao === 'ambiente_desc') {
      return ambB.localeCompare(ambA, 'pt');
    }
    return 0;
  });

  const servicosUnicos = [...new Set(setorizacoesLista.map(s => s.servico))];
  const divisoesUnicasQuadro2 = [...new Set(setorizacoesLista.map(s => s.pavimento).filter(Boolean))];
  const zonasUnicasQuadro2 = [...new Set(setorizacoesLista.map(s => s.fase).filter(Boolean))].sort();

  const obterCorPorSubdivisao = (fase) => {
    if (!fase) return '#ffffff';
    const f = fase.trim().toUpperCase();
    const cores = {
      'Z1': '#ebf8ff',
      'Z2': '#f0fff4',
      'Z3': '#fffaf0',
      'Z4': '#f5f3ff',
      'Z5': '#fff1f2',
      'BLOCO 1': '#e6fffa',
      'BLOCO 2': '#edf2f7',
      'SETOR 1': '#fefcbf'
    };
    return cores[f] || '#f7fafc';
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        <h1 style={{ color: '#2A4365', margin: 0 }}>
          {lang === 'en-US' ? 'Project Data Collection & Setorization' : 'Coleta, Quantificação e Setorização de Obras'}
        </h1>
        <button 
          onClick={() => setShowModalRelatorio(true)}
          style={{ backgroundColor: '#2f855a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          📊 {lang === 'en-US' ? 'Generate PDF Report' : 'Gerar Relatório PDF'}
        </button>
      </div>

      {/* MODAL COLETA INICIAL */}
      {showModalColeta && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: '#1a365d', marginBottom: '20px' }}>{editColetaId ? 'Editar Coleta Inicial' : 'Coleta de Dados Inicial'}</h2>
            <form onSubmit={handleSaveColeta} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <select required value={formDataColeta.projeto_id} onChange={(e) => setFormDataColeta({...formDataColeta, projeto_id: e.target.value})} style={{ padding: '10px', borderRadius: '6px' }}>
                <option value="">-- Selecione o Projeto --</option>
                {projetosLista.map(p => <option key={p.id} value={p.id}>#{p.id} - {p.nome_projeto}</option>)}
              </select>
              <input type="number" placeholder="Número de Pavimentos" value={formDataColeta.pavimentos} onChange={(e) => setFormDataColeta({...formDataColeta, pavimentos: e.target.value})} style={{ padding: '10px', borderRadius: '6px' }} />
              <input type="number" step="0.01" placeholder="Área do Terreno (m²)" value={formDataColeta.areaTerreno} onChange={(e) => setFormDataColeta({...formDataColeta, areaTerreno: e.target.value})} style={{ padding: '10px', borderRadius: '6px' }} />
              <input type="number" step="0.01" placeholder="Área Construída (m²)" value={formDataColeta.areaConstruida} onChange={(e) => setFormDataColeta({...formDataColeta, areaConstruida: e.target.value})} style={{ padding: '10px', borderRadius: '6px' }} />
              <select value={formDataColeta.tipoObra} onChange={(e) => setFormDataColeta({...formDataColeta, tipoObra: e.target.value})} style={{ padding: '10px', borderRadius: '6px' }}>
                <option value="">Selecione o Tipo de Obra</option>
                <option value="Residencial">Residencial</option>
                <option value="Comercial">Comercial</option>
                <option value="Corporativa">Corporativa</option>
                <option value="Industrial">Industrial</option>
              </select>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModalColeta(false)} style={{ backgroundColor: '#cbd5e0', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer' }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QUANTIFICAÇÃO E SETORIZAÇÃO */}
      {showModalSetorizacao && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: '#1a365d', marginBottom: '20px' }}>{editComboKey ? 'Editar Linha de Setorização' : 'Quantificação e Classificação por Ambiente'}</h2>
            <form onSubmit={handleSaveSetorizacao} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <select required value={formDataSetorizacao.projeto_id} onChange={(e) => setFormDataSetorizacao({...formDataSetorizacao, projeto_id: e.target.value})} style={{ padding: '10px', borderRadius: '6px' }}>
                <option value="">-- Selecione o Projeto --</option>
                {projetosLista.map(p => <option key={p.id} value={p.id}>#{p.id} - {p.nome_projeto}</option>)}
              </select>

              <input type="text" placeholder="Ambiente (Ex: Garagem, Cozinha, Quarto)" required value={formDataSetorizacao.ambiente} onChange={(e) => setFormDataSetorizacao({...formDataSetorizacao, ambiente: e.target.value})} style={{ padding: '10px', borderRadius: '6px' }} />

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>Tipo de Ambiente</label>
                <select 
                  required 
                  value={formDataSetorizacao.tipo_ambiente} 
                  onChange={(e) => setFormDataSetorizacao({...formDataSetorizacao, tipo_ambiente: e.target.value})} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: 'white' }}
                >
                  <option value="Interno">Interno</option>
                  <option value="Externo">Externo</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>Divisão</label>
                <select 
                  required 
                  value={formDataSetorizacao.pavimento} 
                  onChange={(e) => setFormDataSetorizacao({...formDataSetorizacao, pavimento: e.target.value})} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: formDataSetorizacao.pavimento === 'OUTRO' ? '10px' : '0' }}
                >
                  <option value="">-- Selecione a Divisão --</option>
                  {divisoesExistentes.map((div, i) => <option key={i} value={div}>{div}</option>)}
                  <option value="OUTRO">+ Cadastrar nova divisão...</option>
                </select>
                {formDataSetorizacao.pavimento === 'OUTRO' && (
                  <input type="text" placeholder="Digite a nova divisão (ex: PV6)" required value={novoPavimentoInput} onChange={(e) => setNovoPavimentoInput(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #3182ce', boxSizing: 'border-box' }} />
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>Subdivisão</label>
                <select 
                  required 
                  value={formDataSetorizacao.fase} 
                  onChange={(e) => setFormDataSetorizacao({...formDataSetorizacao, fase: e.target.value})} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: formDataSetorizacao.fase === 'OUTRO' ? '10px' : '0' }}
                >
                  <option value="">-- Selecione a Subdivisão --</option>
                  {subdivisoesExistentes.map((fas, i) => <option key={i} value={fas}>{fas}</option>)}
                  <option value="OUTRO">+ Cadastrar nova subdivisão...</option>
                </select>
                {formDataSetorizacao.fase === 'OUTRO' && (
                  <input type="text" placeholder="Digite a nova subdivisão (ex: Z4)" required value={novaFaseInput} onChange={(e) => setNovaFaseInput(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #3182ce', boxSizing: 'border-box' }} />
                )}
              </div>

              <input type="text" placeholder="Serviço (Ex: Piso Porcelanato, Parede, Forro)" required value={formDataSetorizacao.servico} onChange={(e) => setFormDataSetorizacao({...formDataSetorizacao, servico: e.target.value})} style={{ padding: '10px', borderRadius: '6px' }} />
              <input type="number" step="0.01" placeholder="Quantidade Específica" required value={formDataSetorizacao.quantidade} onChange={(e) => setFormDataSetorizacao({...formDataSetorizacao, quantidade: e.target.value})} style={{ padding: '10px', borderRadius: '6px' }} />
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModalSetorizacao(false)} style={{ backgroundColor: '#cbd5e0', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ backgroundColor: '#2b6cb0', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer' }}>Salvar Serviço</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR NOVO SERVIÇO/COLUNA RÁPIDO */}
      {showModalNovoServico && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '500px' }}>
            <h2 style={{ color: '#1a365d', marginBottom: '20px', fontSize: '1.2rem' }}>Inserir Novo Serviço / Coluna</h2>
            <form onSubmit={handleAddServicoNaLinha} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Selecione a Linha (Ambiente)</label>
                <select 
                  required 
                  value={formNovoServicoLinha.comboKey} 
                  onChange={(e) => setFormNovoServicoLinha({...formNovoServicoLinha, comboKey: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px' }}
                >
                  <option value="">-- Escolha o ambiente --</option>
                  {[...new Set(setorizacoesLista.map(s => `${s.ambiente}___${s.tipo_ambiente || 'Interno'}___${s.pavimento}___${s.fase}`))].map((combo, i) => {
                    const [amb, tipoAmb, pav, fas] = combo.split('___');
                    return <option key={i} value={combo}>{amb} ({tipoAmb}) - {pav} / {fas}</option>;
                  })}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Nome do Serviço (Nova Coluna)</label>
                <input 
                  type="text" 
                  placeholder="Ex: Pintura, Rodapés, Esquadrias" 
                  required 
                  value={formNovoServicoLinha.servico} 
                  onChange={(e) => setFormNovoServicoLinha({...formNovoServicoLinha, servico: e.target.value})} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', boxSizing: 'border-box' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Quantidade Específica</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="Ex: 21.01" 
                  required 
                  value={formNovoServicoLinha.quantidade} 
                  onChange={(e) => setFormNovoServicoLinha({...formNovoServicoLinha, quantidade: e.target.value})} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModalNovoServico(false)} style={{ backgroundColor: '#cbd5e0', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ backgroundColor: '#dd6b20', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Adicionar Coluna/Serviço</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIGURAÇÃO DO RELATÓRIO */}
      {showModalRelatorio && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '500px', fontFamily: 'sans-serif' }}>
            <h2 style={{ color: '#1a365d', marginBottom: '20px' }}>Personalizar Relatório em PDF</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500' }}>
                <input 
                  type="checkbox" 
                  checked={opcoesRelatorio.incluirGeral} 
                  onChange={(e) => setOpcoesRelatorio({...opcoesRelatorio, incluirGeral: e.target.checked})}
                />
                Incluir Quadro de Informações Gerais / Coleta Inicial
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500' }}>
                <input 
                  type="checkbox" 
                  checked={opcoesRelatorio.incluirSetorizacao} 
                  onChange={(e) => setOpcoesRelatorio({...opcoesRelatorio, incluirSetorizacao: e.target.checked})}
                />
                Incluir Quadro de Setorização e Quantificação de Serviços
              </label>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>Filtrar por Tipo de Ambiente no Relatório</label>
                <select 
                  value={opcoesRelatorio.filtroAmbiente} 
                  onChange={(e) => setOpcoesRelatorio({...opcoesRelatorio, filtroAmbiente: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                >
                  <option value="todos">Todos (Interno e Externo)</option>
                  <option value="Interno">Apenas Ambientes Internos</option>
                  <option value="Externo">Apenas Ambientes Externos</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => setShowModalRelatorio(false)} 
                style={{ backgroundColor: '#cbd5e0', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={gerarPDF} 
                style={{ backgroundColor: '#2f855a', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Baixar PDF Personalizado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUADRO 1: INFORMAÇÕES GERAIS / COLETA INICIAL */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '40px', padding: '20px' }}>
        <h2 style={{ color: '#2a4365', marginBottom: '15px', fontSize: '1.1rem' }}>INFORMAÇÕES GERAIS / COLETA INICIAL</h2>
        <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#2a4365', color: 'white' }}>
              <tr>
                <th style={{ padding: '12px', borderBottom: '2px solid #1a365d' }}>Projeto</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #1a365d' }}>Pavimentos</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #1a365d' }}>Área do Terreno</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #1a365d' }}>Área Construída</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #1a365d' }}>Tipo de Obra</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #1a365d' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {coletasLista.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '15px', textAlign: 'center', color: '#718096' }}>Nenhuma coleta inicial cadastrada.</td>
                </tr>
              ) : (
                coletasLista.map((item) => {
                  const proj = projetosLista.find(p => String(p.id) === String(item.projeto_id));
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#1a365d' }}>{proj ? `${proj.nome_projeto} (#${proj.id})` : `#${item.projeto_id}`}</td>
                      <td style={{ padding: '12px' }}>{item.pavimentos || '-'}</td>
                      <td style={{ padding: '12px' }}>{item.area_terreno ? `${Number(item.area_terreno).toLocaleString('pt-BR')} m²` : '-'}</td>
                      <td style={{ padding: '12px' }}>{item.area_construida ? `${Number(item.area_construida).toLocaleString('pt-BR')} m²` : '-'}</td>
                      <td style={{ padding: '12px' }}>{item.tipo_obra || '-'}</td>
                      <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEditColeta(item)} style={{ backgroundColor: '#e2e8f0', color: '#2d3748', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Editar</button>
                        <button onClick={() => handleDeleteColeta(item.id)} style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Excluir</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUADRO 2 - QUANTIFICAÇÃO DOS PACOTES POR LOCALIZAÇÃO (NOVO) */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '40px', padding: '20px' }}>
        <h2 style={{ color: '#2a4365', marginBottom: '15px', fontSize: '1.1rem' }}>QUADRO 2 - QUANTIFICAÇÃO DOS PACOTES POR LOCALIZAÇÃO</h2>
        <div style={{ maxHeight: '450px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
            <tbody>
              {divisoesUnicasQuadro2.length === 0 ? (
                <tr>
                  <td style={{ padding: '20px', color: '#718096' }}>Nenhum dado de setorização cadastrado para gerar o Quadro 2.</td>
                </tr>
              ) : (
                divisoesUnicasQuadro2.map((divisao, dIdx) => {
                  const zonasDaDivisao = [...new Set(
                    setorizacoesLista.filter(s => s.pavimento === divisao).map(s => s.fase).filter(Boolean)
                  )].sort();

                  return (
                    <table key={dIdx} style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                      {/* CABEÇALHO DA DIVISÃO (PAVIMENTO) */}
                      <thead>
                        <tr style={{ backgroundColor: '#dd6b20', color: 'white' }}>
                          <th style={{ padding: '10px', border: '1px solid #c05621', width: '35%', textAlign: 'left', fontWeight: 'bold' }}>
                            {divisao}
                          </th>
                          <th colSpan={zonasUnicasQuadro2.length} style={{ padding: '10px', border: '1px solid #c05621', textAlign: 'center', fontWeight: 'bold', letterSpacing: '1px' }}>
                            ZONAS
                          </th>
                        </tr>
                        {/* SUB-CABEÇALHO COM AS ZONAS */}
                        <tr style={{ backgroundColor: '#f6ad55', color: '#1a365d' }}>
                          <th style={{ padding: '8px', border: '1px solid #c05621', textAlign: 'left', fontStyle: 'italic' }}>
                            DESCRIÇÃO
                          </th>
                          {zonasUnicasQuadro2.map((zona, zIdx) => (
                            <th key={zIdx} style={{ padding: '8px', border: '1px solid #c05621', fontWeight: 'bold' }}>
                              {zona}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      {/* LINHAS DOS SERVIÇOS */}
                      <tbody>
                        {servicosUnicos.length === 0 ? (
                          <tr>
                            <td colSpan={zonasUnicasQuadro2.length + 1} style={{ padding: '10px', color: '#718096' }}>Nenhum serviço cadastrado.</td>
                          </tr>
                        ) : (
                          servicosUnicos.map((servico, sIdx) => (
                            <tr key={sIdx} style={{ backgroundColor: sIdx % 2 === 0 ? '#fff' : '#f7fafc', borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '8px 12px', border: '1px solid #cbd5e0', textAlign: 'left', fontWeight: 'bold', color: '#2d3748' }}>
                                {servico.toUpperCase()}
                              </td>
                              {zonasUnicasQuadro2.map((zona, zIdx) => {
                                // Soma as quantidades para essa Divisão + Zona + Servico
                                const somaQuantidades = setorizacoesLista
                                  .filter(s => s.pavimento === divisao && s.fase === zona && s.servico === servico)
                                  .reduce((acc, curr) => acc + (Number(curr.quantidade) || 0), 0);

                                return (
                                  <td key={zIdx} style={{ padding: '8px', border: '1px solid #cbd5e0', color: somaQuantidades > 0 ? '#000' : '#a0aec0' }}>
                                    {somaQuantidades > 0 ? somaQuantidades.toLocaleString('pt-BR') : '0'}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUADRO 3 - SETORIZAÇÃO E QUANTIFICAÇÃO (ANTIGO QUADRO 1) */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ color: '#2a4365', margin: 0, fontSize: '1.1rem' }}>QUADRO 3 - SETORIZAÇÃO E QUANTIFICAÇÃO DE SERVIÇOS</h2>
          
          <button 
            onClick={() => setShowModalNovoServico(true)}
            style={{ backgroundColor: '#dd6b20', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            + Novo Serviço (Coluna)
          </button>
        </div>

        {/* BARRA DE FILTROS E ORDENAÇÃO */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', backgroundColor: '#f7fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
          
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>Filtrar Tipo</label>
            <select 
              value={filtroTipoAmbiente} 
              onChange={(e) => setFiltroTipoAmbiente(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: 'white' }}
            >
              <option value="">Todos (Int/Ext)</option>
              <option value="Interno">Interno</option>
              <option value="Externo">Externo</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>Filtrar Divisão</label>
            <select 
              value={filtroDivisao} 
              onChange={(e) => setFiltroDivisao(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: 'white' }}
            >
              <option value="">Todas as Divisões</option>
              {divisoesExistentes.map((div, i) => <option key={i} value={div}>{div}</option>)}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>Filtrar Subdivisão</label>
            <select 
              value={filtroSubdivisao} 
              onChange={(e) => setFiltroSubdivisao(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: 'white' }}
            >
              <option value="">Todas as Subdivisões</option>
              {subdivisoesExistentes.map((fas, i) => <option key={i} value={fas}>{fas}</option>)}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>Ordenar por</label>
            <select 
              value={ordenacao} 
              onChange={(e) => setOrdenacao(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', backgroundColor: 'white' }}
            >
              <option value="divisao_asc">Divisão (Crescente)</option>
              <option value="divisao_desc">Divisão (Decrescente)</option>
              <option value="subdivisao_asc">Subdivisão / Fase (Crescente)</option>
              <option value="subdivisao_desc">Subdivisão / Fase (Decrescente)</option>
              <option value="ambiente_asc">Localização / Ambiente (A-Z)</option>
              <option value="ambiente_desc">Localização / Ambiente (Z-A)</option>
            </select>
          </div>

          {(filtroTipoAmbiente || filtroDivisao || filtroSubdivisao || ordenacao !== 'divisao_asc') && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                onClick={() => { setFiltroTipoAmbiente(''); setFiltroDivisao(''); setFiltroSubdivisao(''); setOrdenacao('divisao_asc'); }}
                style={{ padding: '8px 12px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', color: '#4a5568' }}
              >
                Resetar Filtros
              </button>
            </div>
          )}
        </div>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ backgroundColor: '#dd6b20', color: 'white' }}>
                <th style={{ padding: '10px', borderBottom: '2px solid #c05621' }}>LOCALIZAÇÃO</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #c05621' }}>TIPO</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #c05621' }}>DIVISÃO</th>
                <th style={{ padding: '10px', borderBottom: '2px solid #c05621' }}>SUBDIVISÃO</th>
                {servicosUnicos.map((serv, idx) => (
                  <th key={idx} style={{ padding: '10px', borderBottom: '2px solid #c05621', width: '110px' }}>{serv.toUpperCase()}</th>
                ))}
                <th style={{ padding: '10px', borderBottom: '2px solid #c05621', width: '130px' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {ambientesFiltradosEOrdenados.length === 0 ? (
                <tr>
                  <td colSpan={5 + servicosUnicos.length} style={{ padding: '20px', color: '#718096' }}>
                    Nenhum registro encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                ambientesFiltradosEOrdenados.map((combo, rowIdx) => {
                  const [amb, tipoAmb, pav, fas] = combo.split('___');
                  const corLinha = obterCorPorSubdivisao(fas);

                  return (
                    <tr key={rowIdx} style={{ backgroundColor: corLinha, borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', border: '1px solid #cbd5e0', fontWeight: 'bold', textAlign: 'left' }}>{amb}</td>
                      <td style={{ padding: '8px', border: '1px solid #cbd5e0' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: tipoAmb === 'Externo' ? '#feebc8' : '#e2e8f0', color: tipoAmb === 'Externo' ? '#9c4221' : '#2d3748' }}>
                          {tipoAmb || 'Interno'}
                        </span>
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #cbd5e0' }}>{pav}</td>
                      <td style={{ padding: '8px', border: '1px solid #cbd5e0', fontWeight: 'bold' }}>{fas}</td>
                      
                      {servicosUnicos.map((serv, colIdx) => {
                        const encontrado = setorizacoesLista.find(
                          s => s.ambiente === amb && (s.tipo_ambiente || 'Interno') === tipoAmb && s.pavimento === pav && s.fase === fas && s.servico === serv
                        );
                        return (
                          <td key={colIdx} style={{ padding: '4px 6px', border: '1px solid #cbd5e0' }}>
                            <input 
                              type="number"
                              step="0.01"
                              defaultValue={encontrado ? encontrado.quantidade : ''}
                              key={encontrado ? `${encontrado.id}-${encontrado.quantidade}` : `${amb}-${tipoAmb}-${serv}-empty`}
                              onBlur={(e) => handleCellChange(amb, tipoAmb, pav, fas, serv, e.target.value)}
                              style={{ 
                                width: '75px', 
                                padding: '5px', 
                                textAlign: 'center', 
                                border: '1px solid #cbd5e0', 
                                backgroundColor: 'white',
                                borderRadius: '4px',
                                outline: 'none',
                                fontWeight: '500',
                                fontSize: '0.85rem',
                                margin: '0 auto',
                                display: 'block'
                              }}
                            />
                          </td>
                        );
                      })}

                      <td style={{ padding: '8px', border: '1px solid #cbd5e0' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => handleEditLinhaQuadro(amb, tipoAmb, pav, fas)}
                            style={{ backgroundColor: '#e2e8f0', color: '#2d3748', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDeleteSetorizacao(amb, tipoAmb, pav, fas)}
                            style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONTEÚDO OCULTO QUE SERÁ CONVERTIDO EM PDF */}
      <div style={{ display: 'none' }}>
        <div id="conteudo-relatorio-pdf" style={{ padding: '20px', fontFamily: 'sans-serif', color: '#000', backgroundColor: '#fff' }}>
          <h1 style={{ color: '#1a365d', borderBottom: '2px solid #1a365d', paddingBottom: '10px', fontSize: '22px' }}>
            Relatório Técnico - Setorização e Planejamento Takt
          </h1>
          <p style={{ fontSize: '12px', color: '#555', marginBottom: '20px' }}>
            Gerado em: {new Date().toLocaleDateString('pt-BR')} | ExcelisPro Consultoria e Gestão
          </p>

          {/* Quadro Geral Condicional */}
          {opcoesRelatorio.incluirGeral && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#2a4365', fontSize: '16px', marginBottom: '10px' }}>1. Informações Gerais / Coleta Inicial</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#2a4365', color: 'white' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Projeto</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Pavimentos</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Área Terreno</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Área Construída</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>Tipo de Obra</th>
                  </tr>
                </thead>
                <tbody>
                  {coletasLista.map((item) => {
                    const proj = projetosLista.find(p => String(p.id) === String(item.projeto_id));
                    return (
                      <tr key={item.id}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{proj ? proj.nome_projeto : item.projeto_id}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.pavimentos}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.area_terreno} m²</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.area_construida} m²</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.tipo_obra}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Quadro de Setorização Condicional */}
          {opcoesRelatorio.incluirSetorizacao && (
            <div>
              <h3 style={{ color: '#2a4365', fontSize: '16px', marginBottom: '10px' }}>2. Setorização e Quantificação de Serviços</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'center' }}>
                <thead>
                  <tr style={{ backgroundColor: '#dd6b20', color: 'white' }}>
                    <th style={{ padding: '6px', border: '1px solid #ddd' }}>Localização</th>
                    <th style={{ padding: '6px', border: '1px solid #ddd' }}>Tipo</th>
                    <th style={{ padding: '6px', border: '1px solid #ddd' }}>Divisão</th>
                    <th style={{ padding: '6px', border: '1px solid #ddd' }}>Subdivisão</th>
                    {servicosUnicos.map((serv, i) => (
                      <th key={i} style={{ padding: '6px', border: '1px solid #ddd' }}>{serv.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ambientesFiltradosEOrdenados
                    .filter(combo => {
                      if (opcoesRelatorio.filtroAmbiente === 'todos') return true;
                      const [, tipoAmb] = combo.split('___');
                      return tipoAmb === opcoesRelatorio.filtroAmbiente;
                    })
                    .map((combo, idx) => {
                      const [amb, tipoAmb, pav, fas] = combo.split('___');
                      return (
                        <tr key={idx}>
                          <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'left', fontWeight: 'bold' }}>{amb}</td>
                          <td style={{ padding: '6px', border: '1px solid #ddd' }}>{tipoAmb}</td>
                          <td style={{ padding: '6px', border: '1px solid #ddd' }}>{pav}</td>
                          <td style={{ padding: '6px', border: '1px solid #ddd' }}>{fas}</td>
                          {servicosUnicos.map((serv, cIdx) => {
                            const encontrado = setorizacoesLista.find(
                              s => s.ambiente === amb && (s.tipo_ambiente || 'Interno') === tipoAmb && s.pavimento === pav && s.fase === fas && s.servico === serv
                            );
                            return (
                              <td key={cIdx} style={{ padding: '6px', border: '1px solid #ddd' }}>
                                {encontrado ? encontrado.quantidade : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
