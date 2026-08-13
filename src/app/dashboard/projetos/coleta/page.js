'use client';
import { useState } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';

export default function ColetaDadosPage() {
  const { lang } = useLanguage();
  
  const [formData, setFormData] = useState({
    pavimentos: '',
    areaTerreno: '',
    areaConstruida: '',
    tipoObra: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Dados salvos:", formData);
    alert(lang === 'en-US' ? 'Data saved successfully!' : 'Dados salvos com sucesso!');
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px' }}>
      <h1 style={{ color: '#2A4365', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        {lang === 'en-US' ? 'Project Data Collection' : 'Coleta de Dados do Projeto'}
      </h1>
      
      <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Number of Floors' : 'Número de Pavimentos'}</label>
            <input type="number" onChange={(e) => setFormData({...formData, pavimentos: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Land Area (m²)' : 'Área do Terreno (m²)'}</label>
            <input type="number" onChange={(e) => setFormData({...formData, areaTerreno: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Built Area (m²)' : 'Área Construída (m²)'}</label>
            <input type="number" onChange={(e) => setFormData({...formData, areaConstruida: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Type of Work' : 'Tipo de Obra'}</label>
            <input type="text" onChange={(e) => setFormData({...formData, tipoObra: e.target.value})} placeholder="Ex: Residencial" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} />
          </div>

        </div>

        <button type="submit" style={{ marginTop: '30px', backgroundColor: '#3182ce', color: 'white', padding: '12px 25px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
          {lang === 'en-US' ? 'Save Project Data' : 'Salvar Dados do Projeto'}
        </button>
      </form>
    </div>
  );
}
