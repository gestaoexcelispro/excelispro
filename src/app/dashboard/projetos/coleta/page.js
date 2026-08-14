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

  const [novoPavimentoInput, setNovoPavimentoInput] = useState('');
  const [novaFaseInput, setNovaFaseInput] = useState('');

  const [editColetaId, setEditColetaId] = useState(null);
  const [editComboKey, setEditComboKey] = useState(null);

  const [formDataColeta, setFormDataColeta] = useState({
    projeto_id: '', pavimentos: '', areaTerreno: '', areaConstruida: '', tipoObra: ''
  });

  const [formDataSetorizacao, setFormDataSetorizacao] = useState({
    projeto_id: '', ambiente: '', pavimento: '', fase: '', servico: '', quantidade: ''
  });

  const [formNovoServicoLinha, setFormNovoServicoLinha] = useState({
    comboKey: '', servico: '', quantidade: ''
  });

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

  const handleCellChange = async (amb, pav, fas, servico, novaQuantidade) => {
    const valorNumerico = novaQuantidade === '' ? null : parseFloat(novaQuantidade);
    const registroExistente = setorizacoesLista.find(
      s => s.ambiente === amb && s.pavimento === pav && s.fase === fas && s.servico === servico
    );

    if (registroExistente) {
      if (valorNumerico === null) {
        await supabase.from('setorizacao_obras').delete().eq('id', registroExistente.id);
      } else {
        await supabase.from('setorizacao_obras').update({ quantidade: valorNumerico }).eq('id', registroExistente.id);
      }
    } else if (valorNumerico !== null && !isNaN(valorNumerico)) {
      const projetoRef = setorizacoesLista.find(s => s.ambiente === amb && s.pavimento === pav && s.fase === fas)?.projeto_id || '';
      await supabase.from('setorizacao_obras').insert([{
        projeto_id: projetoRef, ambiente: amb, pavimento: pav, fase: fas, servico: servico, quantidade: valorNumerico
      }]);
    }
    fetchData();
  };

  const handleSaveColeta = async (e) => {
    e.preventDefault();
    if (editColetaId) {
      await supabase.from('coleta_dados').update(formDataColeta).eq('id', editColetaId);
    } else {
      await supabase.from('coleta_dados').insert([formDataColeta]);
    }
    setShowModalColeta(false);
    fetchData();
  };

  const handleSaveSetorizacao = async (e) => {
    e.preventDefault();
    const pavimentoFinal = formDataSetorizacao.pavimento === 'OUTRO' ? novoPavimentoInput : formDataSetorizacao.pavimento;
    const faseFinal = formDataSetorizacao.fase === 'OUTRO' ? novaFaseInput : formDataSetorizacao.fase;

    if (editComboKey) {
      const [oldAmb, oldPav, oldFas] = editComboKey.split('___');
      await supabase.from('setorizacao_obras').delete().match({ ambiente: oldAmb, pavimento: oldPav, fase: oldFas });
    }

    await supabase.from('setorizacao_obras').insert([{ ...formDataSetorizacao, pavimento: pavimentoFinal, fase: faseFinal }]);
    setShowModalSetorizacao(false);
    fetchData();
  };

  const handleAddServicoNaLinha = async (e) => {
    e.preventDefault();
    const [amb, pav, fas] = formNovoServicoLinha.comboKey.split('___');
    const projetoRef = setorizacoesLista.find(s => s.ambiente === amb && s.pavimento === pav && s.fase === fas)?.projeto_id;
    await supabase.from('setorizacao_obras').insert([{ projeto_id: projetoRef, ambiente: amb, pavimento: pav, fase: fas, servico: formNovoServicoLinha.servico, quantidade: formNovoServicoLinha.quantidade }]);
    setShowModalNovoServico(false);
    fetchData();
  };

  const handleEditColeta = (item) => {
    setEditColetaId(item.id);
    setFormDataColeta({ projeto_id: item.projeto_id, pavimentos: item.pavimentos, areaTerreno: item.area_terreno, areaConstruida: item.area_construida, tipoObra: item.tipo_obra });
    setShowModalColeta(true);
  };

  const handleEditLinhaQuadro = (amb, pav, fas) => {
    const itens = setorizacoesLista.filter(s => s.ambiente === amb && s.pavimento === pav && s.fase === fas);
    if (itens.length > 0) {
      setEditComboKey(`${amb}___${pav}___${fas}`);
      setFormDataSetorizacao({ ...itens[0], ambiente: amb, pavimento: pav, fase: fas });
      setShowModalSetorizacao(true);
    }
  };

  const handleDeleteColeta = async (id) => { if(window.confirm('Excluir?')) { await supabase.from('coleta_dados').delete().eq('id', id); fetchData(); } };
  const handleDeleteSetorizacao = async (id) => { if(window.confirm('Excluir linha?')) { await supabase.from('setorizacao_obras').delete().eq('id', id); fetchData(); } };

  const divisoesExistentes = [...new Set(['PV1', 'PV2', 'PV3', 'PV4', ...setorizacoesLista.map(s => s.pavimento).filter(Boolean)])];
  const subdivisoesExistentes = [...new Set(['Z1', 'Z2', 'Z3', 'Z4', 'Bloco 1', 'Setor 1', ...setorizacoesLista.map(s => s.fase).filter(Boolean)])];
  const ambientesUnicos = [...new Set(setorizacoesLista.map(s => `${s.ambiente}___${s.pavimento}___${s.fase}`))];
  const servicosUnicos = [...new Set(setorizacoesLista.map(s => s.servico))];

  const obterCor = (fase) => {
    const cores = { 'Z1': '#ebf8ff', 'Z2': '#f0fff4', 'Z3': '#fffaf0', 'BLOCO 1': '#e6fffa', 'SETOR 1': '#fefcbf' };
    return cores[fase?.toUpperCase()] || '#ffffff';
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', fontFamily: 'sans-serif' }}>
      <h1>{lang === 'en-US' ? 'Data Collection & Setorization' : 'Coleta, Quantificação e Setorização de Obras'}</h1>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <button onClick={() => setShowModalColeta(true)} style={{ padding: '12px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '8px' }}>+ Cadastrar Coleta Inicial</button>
        <button onClick={() => setShowModalSetorizacao(true)} style={{ padding: '12px', backgroundColor: '#2b6cb0', color: 'white', border: 'none', borderRadius: '8px' }}>+ Nova Quantificação e Classificação</button>
      </div>

      {/* MODAIS AQUI (Manter lógica conforme anterior) */}
      
      {/* TABELAS COM HEADER STICKY E ROLAGEM INTERNA */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '40px', maxHeight: '400px', overflowY: 'auto' }}>
        <h2 style={{ color: '#2a4365', fontSize: '1.1rem' }}>INFORMAÇÕES GERAIS</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#2a4365', color: 'white' }}>
            <tr><th>Projeto</th><th>Pavimentos</th><th>Área Terreno</th><th>Área Construída</th><th>Tipo</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {coletasLista.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td>{item.projeto_id}</td>
                <td>{item.pavimentos}</td>
                <td>{item.area_terreno}</td>
                <td>{item.area_construida}</td>
                <td>{item.tipo_obra}</td>
                <td><button onClick={() => handleEditColeta(item)}>Editar</button><button onClick={() => handleDeleteColeta(item.id)}>Excluir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* QUADRO 1 - EDITÁVEL */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxHeight: '500px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>QUADRO 1 - SETORIZAÇÃO</h2>
          <button onClick={() => setShowModalNovoServico(true)} style={{ backgroundColor: '#dd6b20', color: 'white', padding: '8px', border: 'none' }}>+ Novo Serviço</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#dd6b20', color: 'white' }}>
            <tr>
              <th>LOCAL</th><th>DIVISÃO</th><th>SUBDIVISÃO</th>
              {servicosUnicos.map(s => <th key={s}>{s.toUpperCase()}</th>)}
              <th>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {ambientesUnicos.map((combo, i) => {
              const [amb, pav, fas] = combo.split('___');
              return (
                <tr key={i} style={{ backgroundColor: obterCor(fas) }}>
                  <td>{amb}</td><td>{pav}</td><td>{fas}</td>
                  {servicosUnicos.map(serv => {
                    const item = setorizacoesLista.find(s => s.ambiente === amb && s.pavimento === pav && s.fase === fas && s.servico === serv);
                    return (
                      <td key={serv}>
                        <input type="number" defaultValue={item?.quantidade || ''} onBlur={(e) => handleCellChange(amb, pav, fas, serv, e.target.value)} style={{ width: '60px', textAlign: 'center' }} />
                      </td>
                    );
                  })}
                  <td><button onClick={() => handleEditLinhaQuadro(amb, pav, fas)}>Editar</button><button onClick={() => {const del = setorizacoesLista.filter(s => s.ambiente === amb && s.pavimento === pav && s.fase === fas); del.forEach(d => handleDeleteSetorizacao(d.id))}}>Excluir</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
