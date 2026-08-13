'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { supabase } from '../../../../lib/supabase';

export default function ColetaDadosPage() {
  const { lang } = useLanguage();
  
  const [projetosLista, setProjetosLista] = useState([]);
  const [coletasLista, setColetasLista] = useState([]);
  const [formData, setFormData] = useState({
    projeto_id: '',
    pavimentos: '',
    areaTerreno: '',
    areaConstruida: '',
    tipoObra: ''
  });

  // Carregar lista de projetos e histórico de coletas do Supabase
  const fetchData = async () => {
    // Buscar projetos para o select
    const { data: projData } = await supabase.from('projetos').select('id, nome_projeto, cliente');
    if (projData) setProjetosLista(projData);

    // Buscar coletas cadastradas
    const { data: coletaData } = await supabase.from('coleta_dados').select('*').order('id', { ascending: false });
    if (coletaData) setColetasLista(coletaData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.projeto_id) {
      alert(lang === 'en-US' ? 'Please select a project.' : 'Por favor, selecione um projeto.');
      return;
    }

    const { error } = await supabase.from('coleta_dados').insert([
      {
        projeto_id: formData.projeto_id,
        pavimentos: formData.pavimentos,
        area_terreno: formData.areaTerreno,
        area_construida: formData.areaConstruida,
        tipo_obra: formData.tipoObra
      }
    ]);

    if (error) {
      alert(lang === 'en-US' ? 'Error saving data: ' + error.message : 'Erro ao salvar dados: ' + error.message);
    } else {
      alert(lang === 'en-US' ? 'Data saved successfully!' : 'Dados salvos com sucesso!');
      setFormData({ projeto_id: '', pavimentos: '', areaTerreno: '', areaConstruida: '', tipoObra: '' });
      fetchData(); // Atualiza a tabela na tela
    }
  };

  // Excluir registro de coleta do Supabase
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      lang === 'en-US' 
        ? 'Are you sure you want to delete this record?' 
        : 'Tem certeza que deseja excluir este registro de coleta?'
    );

    if (!confirmDelete) return;

    const { error } = await supabase.from('coleta_dados').delete().eq('id', id);

    if (error) {
      alert(lang === 'en-US' ? 'Error deleting record: ' + error.message : 'Erro ao excluir registro: ' + error.message);
    } else {
      alert(lang === 'en-US' ? 'Record deleted successfully!' : 'Registro excluído com sucesso!');
      fetchData();
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px' }}>
      <h1 style={{ color: '#2A4365', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        {lang === 'en-US' ? 'Project Data Collection' : 'Coleta de Dados do Projeto'}
      </h1>
      
      {/* FORMULÁRIO DE CADASTRO */}
      <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            {lang === 'en-US' ? 'Select Project' : 'Selecione o Projeto'}
          </label>
          <select 
            required 
            value={formData.projeto_id} 
            onChange={(e) => setFormData({...formData, projeto_id: e.target.value})} 
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', backgroundColor: 'white' }}
          >
            <option value="">{lang === 'en-US' ? '-- Select a project --' : '-- Escolha um projeto cadastrado --'}</option>
            {projetosLista.map((proj) => (
              <option key={proj.id} value={proj.id}>
                #{proj.id} - {proj.nome_projeto} ({proj.cliente})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Number of Floors' : 'Número de Pavimentos'}</label>
            <input type="number" value={formData.pavimentos} onChange={(e) => setFormData({...formData, pavimentos: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Land Area (m²)' : 'Área do Terreno (m²)'}</label>
            <input type="number" step="0.01" value={formData.areaTerreno} onChange={(e) => setFormData({...formData, areaTerreno: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Built Area (m²)' : 'Área Construída (m²)'}</label>
            <input type="number" step="0.01" value={formData.areaConstruida} onChange={(e) => setFormData({...formData, areaConstruida: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Type of Work' : 'Tipo de Obra'}</label>
            <select
              value={formData.tipoObra}
              onChange={(e) => setFormData({...formData, tipoObra: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', backgroundColor: 'white' }}
            >
              <option value="">{lang === 'en-US' ? '-- Select Type --' : '-- Selecione o Tipo --'}</option>
              <option value="Residencial">{lang === 'en-US' ? 'Residential' : 'Residencial'}</option>
              <option value="Comercial">{lang === 'en-US' ? 'Commercial' : 'Comercial'}</option>
              <option value="Corporativa">{lang === 'en-US' ? 'Corporate' : 'Corporativa'}</option>
              <option value="Industrial">{lang === 'en-US' ? 'Industrial' : 'Industrial'}</option>
            </select>
          </div>

        </div>

        <button type="submit" style={{ marginTop: '30px', backgroundColor: '#3182ce', color: 'white', padding: '12px 25px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
          {lang === 'en-US' ? 'Save Project Data' : 'Salvar Dados do Projeto'}
        </button>
      </form>

      {/* TABELA DE REGISTROS SALVOS */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <h2 style={{ padding: '20px 20px 10px 20px', margin: 0, color: '#1a365d', fontSize: '1.2rem' }}>
          {lang === 'en-US' ? 'Collected Data History' : 'Histórico de Dados Coletados'}
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Project' : 'Projeto'}</th>
              <th style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Floors' : 'Pavimentos'}</th>
              <th style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Land Area' : 'Área Terreno'}</th>
              <th style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Built Area' : 'Área Construída'}</th>
              <th style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Type' : 'Tipo de Obra'}</th>
              <th style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Actions' : 'Ações'}</th>
            </tr>
          </thead>
          <tbody>
            {coletasLista.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#718096' }}>
                  {lang === 'en-US' ? 'No records found.' : 'Nenhum dado coletado até o momento.'}
                </td>
              </tr>
            ) : (
              coletasLista.map((item) => {
                const proj = projetosLista.find((p) => String(p.id) === String(item.projeto_id));
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '15px 20px', color: '#1a365d', fontWeight: 'bold' }}>
                      {proj ? `${proj.nome_projeto} (#${proj.id})` : `#${item.projeto_id}`}
                    </td>
                    <td style={{ padding: '15px 20px', color: '#4a5568' }}>{item.pavimentos || '-'}</td>
                    <td style={{ padding: '15px 20px', color: '#4a5568' }}>{item.area_terreno ? `${Number(item.area_terreno).toLocaleString('pt-BR')} m²` : '-'}</td>
                    <td style={{ padding: '15px 20px', color: '#4a5568' }}>{item.area_construida ? `${Number(item.area_construida).toLocaleString('pt-BR')} m²` : '-'}</td>
                    <td style={{ padding: '15px 20px', color: '#2b6cb0', fontWeight: 'bold' }}>{item.tipo_obra || '-'}</td>
                    <td style={{ padding: '15px 20px' }}>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                      >
                        {lang === 'en-US' ? 'Delete' : 'Excluir'}
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
