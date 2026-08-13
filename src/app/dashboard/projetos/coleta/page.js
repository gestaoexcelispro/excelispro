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

  // Estados para gerenciar a opção de digitar novo valor nos selects dinâmicos
  const [novoPavimentoInput, setNovoPavimentoInput] = useState('');
  const [novaFaseInput, setNovaFaseInput] = useState('');

  // Estados de Edição
  const [editColetaId, setEditColetaId] = useState(null);
  const [editComboKey, setEditComboKey] = useState(null);

  // Formulário da Coleta Inicial
  const [formDataColeta, setFormDataColeta] = useState({
    projeto_id: '', pavimentos: '', areaTerreno: '', areaConstruida: '', tipoObra: ''
  });

  // Formulário de Quantificação e Setorização
  const [formDataSetorizacao, setFormDataSetorizacao] = useState({
    projeto_id: '', ambiente: '', pavimento: '', fase: '', servico: '', quantidade: ''
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

  const handleSaveColeta = async (e) => {
    e.preventDefault();
    
    if (editColetaId) {
      const { error } = await supabase.from('coleta_dados').update({
        projeto_id: formDataColeta.projeto_id,
        pavimentos: formDataColeta.pavimentos,
        area_terreno: formDataColeta.areaTerreno,
        area_construida: formDataColeta.areaConstruida,
        tipo_obra: formDataColeta.tipoObra
      }).eq('id', editColetaId);

      if (error) alert('Erro ao atualizar: ' + error.message);
      else {
        alert('Coleta inicial atualizada com sucesso!');
        setShowModalColeta(false);
        setEditColetaId(null);
        setFormDataColeta({ projeto_id: '', pavimentos: '', areaTerreno: '', areaConstruida: '', tipoObra: '' });
        fetchData();
      }
    } else {
      const { error } = await supabase.from('coleta_dados').insert([{
        projeto_id: formDataColeta.projeto_id,
        pavimentos: formDataColeta.pavimentos,
        area_terreno: formDataColeta.areaTerreno,
        area_construida: formDataColeta.areaConstruida,
        tipo_obra: formDataColeta.tipoObra
      }]);

      if (error) alert('Erro: ' + error.message);
      else {
        alert('Coleta inicial salva com sucesso!');
        setShowModalColeta(false);
        setFormDataColeta({ projeto_id: '', pavimentos: '', areaTerreno: '', areaConstruida: '', tipoObra: '' });
        fetchData();
      }
    }
  };

  const handleSaveSetorizacao = async (e) => {
    e.preventDefault();

    // Se o usuário selecionou a opção de digitar um novo valor, utiliza o input correspondente
    const pavimentoFinal = formDataSetorizacao.pavimento === 'OUTRO' ? novoPavimentoInput : formDataSetorizacao.pavimento;
    const faseFinal = formDataSetorizacao.fase === 'OUTRO' ? novaFaseInput : formDataSetorizacao.fase;

    if (!pavimentoFinal || !faseFinal) {
      alert('Por favor, preencha a Divisão e a Subdivisão.');
      return;
    }

    if (editComboKey) {
      const [oldAmb, oldPav, oldFas] = editComboKey.split('___');
      await supabase.from('setorizacao_obras').delete().match({ ambiente: oldAmb, pavimento: oldPav, fase: oldFas });
    }

    const { error } = await supabase.from('setorizacao_obras').insert([{
      ...formDataSetorizacao,
      pavimento: pavimentoFinal,
      fase: faseFinal
    }]);

    if (error) alert('Erro: ' + error.message);
    else {
      alert('Serviço salvo com sucesso!');
      setShowModalSetorizacao(false);
      setEditComboKey(null);
      setNovoPavimentoInput('');
      setNovaFaseInput('');
      setFormDataSetorizacao({ projeto_id: '', ambiente: '', pavimento: '', fase: '', servico: '', quantidade: '' });
      fetchData();
    }
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

  const handleEditLinhaQuadro = (amb, pav, fas) => {
    const itensDaLinha = setorizacoesLista.filter(s => s.ambiente === amb && s.pavimento === pav && s.fase === fas);
    if (itensDaLinha.length > 0) {
      setEditComboKey(`${amb}___${pav}___${fas}`);
      setFormDataSetorizacao({
        projeto_id: itensDaLinha[0].projeto_id || '',
        ambiente: amb,
        pavimento: pav,
        fase: fas,
        servico: itensDaLinha[0].servico || '',
        quantidade: itensDaLinha[0].quantidade || ''
      });
      setShowModalSetorizacao(true);
    }
  };

  const handleDeleteColeta = async (id) => {
    if (!window.confirm('Deseja excluir esta coleta inicial?')) return;
    const { error } = await supabase.from('coleta_dados').delete().eq('id', id);
    if (error) alert('Erro ao excluir: ' + error.message);
    else fetchData();
  };

  const handleDeleteSetorizacao = async (id) => {
    if (!window.confirm('Deseja excluir este registro de setorização?')) return;
    const { error } = await supabase.from('setorizacao_obras').delete().eq('id', id);
    if (error) alert('Erro ao excluir: ' + error.message);
    else fetchData();
  };

  // Listas dinâmicas baseadas no que já foi salvo na base de dados + padrões recomendados
  const pavimentosPadrao = ['PV1', 'PV2', 'PV3', 'PV4', 'PV5', 'Térreo', 'Subsolo'];
  const divisoesExistentes = [...new Set([...pavimentosPadrao, ...setorizacoesLista.map(s => s.pavimento).filter(Boolean)])];

  const fasesPadrao = ['Z1', 'Z2', 'Z3', 'Z4', 'Bloco 1', 'Bloco 2', 'Bloco 3', 'Setor 1', 'Setor 2', 'Setor 3'];
  const subdivisoesExistentes = [...new Set([...fasesPadrao, ...setorizacoesLista.map(s => s.fase).filter(Boolean)])];

  // Agrupamento para montar a matriz de setorização
  const ambientesUnicos = [...new Set(setorizacoesLista.map(s => `${s.ambiente}___${s.pavimento}___${s.fase}`))];
  const servicosUnicos = [...new Set(setorizacoesLista.map(s => s.servico))];

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
      <h1 style={{ color: '#2A4365', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        {lang === 'en-US' ? 'Project Data Collection & Setorization' : 'Coleta, Quantificação e Setorização de Obras'}
      </h1>

      {/* BOTÕES DE AÇÃO RÁPIDA */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <button 
          onClick={() => {
            setEditColetaId(null);
            setFormDataColeta({ projeto_id: '', pavimentos: '', areaTerreno: '', areaConstruida: '', tipoObra: '' });
            setShowModalColeta(true);
          }}
          style={{ backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {lang === 'en-US' ? '+ Initial Data Collection' : '+ Cadastrar Coleta Inicial'}
        </button>

        <button 
          onClick={() => {
            setEditComboKey(null);
            setNovoPavimentoInput('');
            setNovaFaseInput('');
            setFormDataSetorizacao({ projeto_id: '', ambiente: '', pavimento: '', fase: '', servico: '', quantidade: '' });
            setShowModalSetorizacao(true);
          }}
          style={{ backgroundColor: '#2b6cb0', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {lang === 'en-US' ? '+ Quantification & Setorization' : '+ Nova Quantificação e Classificação'}
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

              {/* CAMPO DIVISÃO COM LISTA + OPÇÃO DE ADICIONAR NOVO */}
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
                  <input 
                    type="text" 
                    placeholder="Digite a nova divisão (ex: PV6)" 
                    required 
                    value={novoPavimentoInput} 
                    onChange={(e) => setNovoPavimentoInput(e.target.value)} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #3182ce', boxSizing: 'border-box' }} 
                  />
                )}
              </div>

              {/* CAMPO SUBDIVISÃO COM LISTA + OPÇÃO DE ADICIONAR NOVO */}
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
                  <input 
                    type="text" 
                    placeholder="Digite a nova subdivisão (ex: Z4 ou Bloco 4)" 
                    required 
                    value={novaFaseInput} 
                    onChange={(e) => setNovaFaseInput(e.target.value)} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #3182ce', boxSizing: 'border-box' }} 
                  />
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

      {/* TABELA 1: INFORMAÇÕES INICIAIS COLETADAS */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '40px', overflow: 'hidden', padding: '20px' }}>
        <h2 style={{ color: '#2a4365', marginBottom: '15px', fontSize: '1.1rem' }}>INFORMAÇÕES GERAIS / COLETA INICIAL</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#2a4365', color: 'white' }}>
              <th style={{ padding: '12px', border: '1px solid #1a365d' }}>Projeto</th>
              <th style={{ padding: '12px', border: '1px solid #1a365d' }}>Pavimentos</th>
              <th style={{ padding: '12px', border: '1px solid #1a365d' }}>Área do Terreno</th>
              <th style={{ padding: '12px', border: '1px solid #1a365d' }}>Área Construída</th>
              <th style={{ padding: '12px', border: '1px solid #1a365d' }}>Tipo de Obra</th>
              <th style={{ padding: '12px', border: '1px solid #1a365d' }}>Ações</th>
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

      {/* QUADRO 1 - SETORIZAÇÃO E QUANTIFICAÇÃO */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflowX: 'auto', padding: '20px' }}>
        <h2 style={{ color: '#2a4365', marginBottom: '15px', fontSize: '1.1rem' }}>QUADRO 1 - SETORIZAÇÃO E QUANTIFICAÇÃO DE SERVIÇOS</h2>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#dd6b20', color: 'white' }}>
              <th style={{ padding: '10px', border: '1px solid #c05621' }}>LOCALIZAÇÃO</th>
              <th style={{ padding: '10px', border: '1px solid #c05621' }}>DIVISÃO</th>
              <th style={{ padding: '10px', border: '1px solid #c05621' }}>SUBDIVISÃO</th>
              {servicosUnicos.map((serv, idx) => (
                <th key={idx} style={{ padding: '10px', border: '1px solid #c05621' }}>{serv.toUpperCase()}</th>
              ))}
              <th style={{ padding: '10px', border: '1px solid #c05621' }}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {ambientesUnicos.length === 0 ? (
              <tr>
                <td colSpan={4 + servicosUnicos.length} style={{ padding: '20px', color: '#718096' }}>
                  Nenhum dado de setorização cadastrado ainda. Clique em "+ Nova Quantificação e Classificação" acima.
                </td>
              </tr>
            ) : (
              ambientesUnicos.map((combo, rowIdx) => {
                const [amb, pav, fas] = combo.split('___');
                const corLinha = obterCorPorSubdivisao(fas);

                return (
                  <tr key={rowIdx} style={{ backgroundColor: corLinha, borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e0', fontWeight: 'bold', textAlign: 'left' }}>{amb}</td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e0' }}>{pav}</td>
                    <td style={{ padding: '8px', border: '1px solid #cbd5e0', fontWeight: 'bold' }}>{fas}</td>
                    {servicosUnicos.map((serv, colIdx) => {
                      const encontrado = setorizacoesLista.find(
                        s => s.ambiente === amb && s.pavimento === pav && s.fase === fas && s.servico === serv
                      );
                      return (
                        <td key={colIdx} style={{ padding: '8px', border: '1px solid #cbd5e0' }}>
                          {encontrado ? Number(encontrado.quantidade).toLocaleString('pt-BR') : ''}
                        </td>
                      );
                    })}
                    <td style={{ padding: '8px', border: '1px solid #cbd5e0', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                      <button 
                        onClick={() => handleEditLinhaQuadro(amb, pav, fas)}
                        style={{ backgroundColor: '#e2e8f0', color: '#2d3748', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => {
                          const itensParaExcluir = setorizacoesLista.filter(s => s.ambiente === amb && s.pavimento === pav && s.fase === fas);
                          if (window.confirm(`Deseja excluir toda a linha do ambiente "${amb}"?`)) {
                            itensParaExcluir.forEach(i => handleDeleteSetorizacao(i.id));
                          }
                        }}
                        style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
