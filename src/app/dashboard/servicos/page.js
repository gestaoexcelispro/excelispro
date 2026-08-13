'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { supabase } from '../../../lib/supabase';

const translations = {
  'pt-BR': {
    title: 'Serviços e Tabela M²',
    description: 'Gerencie a base de preços para cálculo automatizado das propostas comerciais.',
    tableHeaders: ['Código', 'Descrição do Serviço', 'Unidade', 'Valor Unitário'],
    btnAdd: '+ Novo Serviço',
    loading: 'Carregando serviços...',
    empty: 'Nenhum serviço cadastrado ainda.',
    modalTitle: 'Cadastrar Novo Serviço',
    formCode: 'Código (Ex: PRJ-ELE)',
    formDescPt: 'Descrição (Português)',
    formDescEn: 'Descrição (Inglês)',
    formUnit: 'Unidade de Medida',
    formPrice: 'Valor Unitário (R$)',
    btnCancel: 'Cancelar',
    btnSave: 'Salvar Serviço',
    saving: 'Salvando...'
  },
  'en-US': {
    title: 'Services & M² Table',
    description: 'Manage the pricing base for automated calculation of commercial proposals.',
    tableHeaders: ['Code', 'Service Description', 'Unit', 'Unit Price'],
    btnAdd: '+ New Service',
    loading: 'Loading services...',
    empty: 'No services registered yet.',
    modalTitle: 'Register New Service',
    formCode: 'Code (e.g., PRJ-ELE)',
    formDescPt: 'Description (Portuguese)',
    formDescEn: 'Description (English)',
    formUnit: 'Unit of Measurement',
    formPrice: 'Unit Price (R$)',
    btnCancel: 'Cancel',
    btnSave: 'Save Service',
    saving: 'Saving...'
  }
};

export default function ServicosPage() {
  const { lang } = useLanguage();
  const t = translations[lang] || translations['pt-BR'];

  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Controles da Janela (Modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Campos do Formulário
  const [formData, setFormData] = useState({
    codigo: '',
    descricao_pt: '',
    descricao_en: '',
    unidade: 'm²', // m² já vem selecionado por padrão
    preco: ''
  });

  // 1. Busca os serviços no Supabase ao carregar a página
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .order('codigo', { ascending: true });

    if (!error && data) {
      setServices(data);
    }
    setIsLoading(false);
  };

  // 2. Salva o novo serviço no Supabase
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const formatPrice = parseFloat(formData.preco.replace(',', '.'));

    const { error } = await supabase
      .from('servicos')
      .insert([
        {
          codigo: formData.codigo,
          descricao_pt: formData.descricao_pt,
          descricao_en: formData.descricao_en,
          unidade: formData.unidade,
          preco: formatPrice
        }
      ]);

    setIsSaving(false);

    if (!error) {
      setIsModalOpen(false);
      setFormData({ codigo: '', descricao_pt: '', descricao_en: '', unidade: 'm²', preco: '' });
      fetchServices(); // Recarrega a tabela atualizada
    } else {
      alert('Erro ao salvar: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '40px', position: 'relative' }}>
      
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ color: '#2A4365', margin: '0 0 10px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
            {t.title}
          </h1>
          <p style={{ color: '#4a5568', margin: 0 }}>{t.description}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ 
            backgroundColor: '#1d4ed8', color: 'white', border: 'none', padding: '12px 20px', 
            borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {t.btnAdd}
        </button>
      </div>

      {/* Tabela de Preços */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              {t.tableHeaders.map((header, index) => (
                <th key={index} style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>{t.loading}</td></tr>
            ) : services.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>{t.empty}</td></tr>
            ) : (
              services.map((svc) => (
                <tr key={svc.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '15px 20px', color: '#718096', fontWeight: 'bold' }}>{svc.codigo}</td>
                  <td style={{ padding: '15px 20px', color: '#2d3748' }}>
                    {lang === 'en-US' ? svc.descricao_en : svc.descricao_pt}
                  </td>
                  <td style={{ padding: '15px 20px', color: '#718096' }}>{svc.unidade}</td>
                  <td style={{ padding: '15px 20px', color: '#1a365d', fontWeight: 'bold' }}>
                    R$ {Number(svc.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* JANELA MODAL (Formulário) */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginTop: 0, color: '#2A4365', marginBottom: '20px' }}>{t.modalTitle}</h2>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.formCode}</label>
                <input required type="text" value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.formDescPt}</label>
                <input required type="text" value={formData.descricao_pt} onChange={(e) => setFormData({...formData, descricao_pt: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.formDescEn}</label>
                <input required type="text" value={formData.descricao_en} onChange={(e) => setFormData({...formData, descricao_en: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.formUnit}</label>
                  {/* AQUI ESTÁ O DROPBOX / SELECT */}
                  <select 
                    value={formData.unidade} 
                    onChange={(e) => setFormData({...formData, unidade: e.target.value})} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', backgroundColor: 'white', boxSizing: 'border-box' }}
                  >
                    <option value="m²">m² (Metro Quadrado)</option>
                    <option value="m³">m³ (Metro Cúbico)</option>
                    <option value="m">m (Metro Linear)</option>
                    <option value="un">un (Unidade)</option>
                    <option value="h">h (Hora)</option>
                    <option value="vb">vb (Verba)</option>
                    <option value="km">km (Quilômetro)</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px', color: '#4a5568' }}>{t.formPrice}</label>
                  <input required type="number" step="0.01" min="0" placeholder="0.00" value={formData.preco} onChange={(e) => setFormData({...formData, preco: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 15px', borderRadius: '6px', border: '1px solid #cbd5e0', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                  {t.btnCancel}
                </button>
                <button type="submit" disabled={isSaving} style={{ padding: '10px 15px', borderRadius: '6px', border: 'none', backgroundColor: '#1d4ed8', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                  {isSaving ? t.saving : t.btnSave}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
