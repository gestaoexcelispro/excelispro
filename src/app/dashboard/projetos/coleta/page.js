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
    const { error } = await supabase.from('coleta_dados').insert([{
      projeto_id: formDataColeta.projeto_id,
      pavimentos: formDataColeta.pavimentos,
      area_terreno: formDataColeta.areaTerreno,
      area_construida: formDataColeta.areaConstruida,
      tipo_obra: formDataColeta.tipoObra
    }]);

    if (error) alert('Erro: ' + error.message);
    else {
      alert('Coleta salva com sucesso!');
      setShowModalColeta(false);
      setFormDataColeta({ projeto_id: '', pavimentos: '', areaTerreno: '', areaConstruida: '', tipoObra: '' });
      fetchData();
    }
  };

  const handleSaveSetorizacao = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('setorizacao_obras').insert([formDataSetorizacao]);

    if (error) alert('Erro: ' + error.message);
    else {
      alert('Serviço quantificado e setorizado com sucesso!');
      setShowModalSetorizacao(false);
      setFormDataSetorizacao({ projeto_id: formDataSetorizacao.projeto_id, ambiente: '', pavimento: '', fase: '', servico: '', quantidade: '' });
      fetchData();
    }
  };

  // Agrupamento para montar a matriz visual idêntica à imagem
  const ambientesUnicos = [...new Set(setorizacoesLista.map(s => `${s.ambiente}___${s.pavimento}___${s.fase}`))];
  const servicosUnicos = [...new Set(setorizacoesLista.map(s => s.servico))];

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2A4365', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        {lang === 'en-US' ? 'Project Data Collection & Setorization' : 'Coleta, Quantificação e Setorização de Obras'}
      </h1>

      {/* BOTÕES DE AÇÃO RÁPIDA (COMPACTOS) */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <button 
          onClick={() => setShowModalColeta(true)}
          style={{ backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {lang === 'en-US' ? '+ Initial Data Collection' : '+ Cadastrar Coleta Inicial'}
        </button>

        <button 
          onClick={() => setShowModalSetorizacao(true)}
          style={{ backgroundColor: '#2b6cb0', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {lang === 'en-US' ? '+ Quantification & Setorization' : '+ Nova Quantificação e Classificação'}
        </button>
      </div>

      {/* MODAL COLETA INICIAL */}
      {showModalColeta && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: '#1a365d', marginBottom: '20px' }}>Coleta de Dados Inicial</h2>
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
            <h2 style={{ color: '#1a365d', marginBottom: '20px' }}>Quantificação e Classificação por Ambiente</h2>
            <form onSubmit={handleSaveSetorizacao} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <select required value={formDataSetorizacao.projeto_id} onChange={(e) => setFormDataSetorizacao({...formDataSetorizacao, projeto_id: e.target.value})} style={{ padding: '10px', borderRadius: '6px' }}>
                <option value="">-- Selecione o Projeto --</option>
                {projetosLista.map(p => <option key={p.id} value={p.id}>#{p.id} - {p.nome_projeto}</option>)}
              </select>
              <input type="text" placeholder="Ambiente (Ex: Garagem, Cozinha, Quarto)" required value={formDataSetorizacao.ambiente} onChange={(e) => setFormDataSetorizacao({...formDataSetorizacao, ambiente: e.target.value})} style={{ padding: '10px', borderRadius: '6px' }} />
              <input type="text" placeholder="Pavimento (Ex: PV1, PV2)" required value={formDataSetorizacao.pavimento} onChange={(e) => setFormDataSetorizacao({...formDataSetorizacao, pavimento: e.target.value})} style={{ padding: '10px', borderRadius: '6px' }} />
              <input type="text" placeholder="Fase / Subdivisão (Ex: Z1, Z2)" required value={formDataSetorizacao.fase} onChange={(e) => setFormDataSetorizacao({...formDataSetorizacao, fase: e.target.value})} style={{ padding: '10px', borderRadius: '6px' }} />
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

      {/* QUADRO 1 - SETORIZAÇÃO (MATRIZ DINÂMICA IGUAL À IMAGEM) */}
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
            </tr>
          </thead>
          <tbody>
            {ambientesUnicos.length === 0 ? (
              <tr>
                <td colSpan={3 + servicosUnicos.length} style={{ padding: '20px', color: '#718096' }}>
                  Nenhum dado de setorização cadastrado ainda. Clique em "+ Nova Quantificação e Classificação" acima.
                </td>
              </tr>
            ) : (
              ambientesUnicos.map((combo, rowIdx) => {
                const [amb, pav, fas] = combo.split('___');
                return (
                  <tr key={rowIdx} style={{ backgroundColor: rowIdx % 2 === 0 ? '#fffaf0' : 'white' }}>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: 'bold', textAlign: 'left' }}>{amb}</td>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{pav}</td>
                    <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{fas}</td>
                    {servicosUnicos.map((serv, colIdx) => {
                      const encontrado = setorizacoesLista.find(
                        s => s.ambiente === amb && s.pavimento === pav && s.fase === fas && s.servico === serv
                      );
                      return (
                        <td key={colIdx} style={{ padding: '8px', border: '1px solid #e2e8f0' }}>
                          {encontrado ? Number(encontrado.quantidade).toLocaleString('pt-BR') : ''}
                        </td>
                      );
                    })}
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
