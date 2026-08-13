'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { supabase } from '../../../../lib/supabase';

export default function ColetaDadosPage() {
  const { lang } = useLanguage();
  
  const [projetosLista, setProjetosLista] = useState([]);
  const [formData, setFormData] = useState({
    projeto_id: '',
    pavimentos: '',
    areaTerreno: '',
    areaConstruida: '',
    tipoObra: ''
  });

  // Buscar a lista de projetos cadastrados para preencher o select
  useEffect(() => {
    async function carregarProjetos() {
      const { data, error } = await supabase.from('projetos').select('id, nome_projeto, cliente');
      if (!error && data) {
        setProjetosLista(data);
      }
    }
    carregarProjetos();
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
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px' }}>
      <h1 style={{ color: '#2A4365', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        {lang === 'en-US' ? 'Project Data Collection' : 'Coleta de Dados do Projeto'}
      </h1>
      
      <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        
        {/* Select dinâmico puxando os projetos do Supabase */}
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
            <input type="text" value={formData.tipoObra} onChange={(e) => setFormData({...formData, tipoObra: e.target.value})} placeholder="Ex: Residencial" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} />
          </div>

        </div>

        <button type="submit" style={{ marginTop: '30px', backgroundColor: '#3182ce', color: 'white', padding: '12px 25px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
          {lang === 'en-US' ? 'Save Project Data' : 'Salvar Dados do Projeto'}
        </button>
      </form>
    </div>
  );
}
