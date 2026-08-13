'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { supabase } from '../../../../lib/supabase';

export default function ProjetosListaPage() {
  const { lang } = useLanguage();
  
  const [projetos, setProjetos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nome_projeto: '',
    cliente: '',
    num_proposta: '',
    num_contrato: '',
    codigo_postal: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    pais: 'Brasil',
    valor_contrato: ''
  });

  // Buscar projetos cadastrados no Supabase
  const fetchProjetos = async () => {
    const { data, error } = await supabase.from('projetos').select('*').order('id', { ascending: false });
    if (!error && data) {
      setProjetos(data);
    }
  };

  useEffect(() => {
    fetchProjetos();
  }, []);

  // Função para buscar o endereço automaticamente pelo CEP (ViaCEP)
  const handleCepBlur = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            endereco: data.logradouro || prev.endereco,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            estado: data.uf || prev.estado
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('projetos').insert([formData]);

    if (error) {
      alert(lang === 'en-US' ? 'Error saving project: ' + error.message : 'Erro ao salvar projeto: ' + error.message);
    } else {
      alert(lang === 'en-US' ? 'Project successfully registered!' : 'Projeto cadastrado com sucesso!');
      setShowModal(false);
      setFormData({
        nome_projeto: '', cliente: '', num_proposta: '', num_contrato: '',
        codigo_postal: '', endereco: '', numero: '', bairro: '', cidade: '', estado: '', pais: 'Brasil', valor_contrato: ''
      });
      fetchProjetos();
    }
  };

  // Função para excluir projeto do Supabase
  const handleDelete = async (id, nome) => {
    const confirmDelete = window.confirm(
      lang === 'en-US' 
        ? `Are you sure you want to delete project "${nome}"?` 
        : `Tem certeza que deseja excluir o projeto "${nome}" do sistema e do Supabase?`
    );

    if (!confirmDelete) return;

    const { error } = await supabase.from('projetos').delete().eq('id', id);

    if (error) {
      alert(lang === 'en-US' ? 'Error deleting project: ' + error.message : 'Erro ao excluir projeto: ' + error.message);
    } else {
      alert(lang === 'en-US' ? 'Project deleted successfully!' : 'Projeto excluído com sucesso!');
      fetchProjetos();
    }
  };

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ color: '#2A4365', margin: '0 0 10px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
            {lang === 'en-US' ? 'Projects Portfolio & Registration' : 'Portfólio e Cadastro de Projetos'}
          </h1>
          <p style={{ color: '#4a5568', margin: 0 }}>
            {lang === 'en-US' ? 'Register and manage engineering projects.' : 'Cadastre e gerencie os projetos de engenharia da empresa.'}
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ backgroundColor: '#1d4ed8', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {lang === 'en-US' ? '+ New Project' : '+ Novo Projeto'}
        </button>
      </div>

      {/* MODAL DE CADASTRO */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: '#1a365d', marginBottom: '20px' }}>{lang === 'en-US' ? 'Register New Project' : 'Cadastrar Novo Projeto'}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>{lang === 'en-US' ? 'Project Name' : 'Nome do projeto'}</label>
                <input type="text" required value={formData.nome_projeto} onChange={(e) => setFormData({...formData, nome_projeto: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>{lang === 'en-US' ? 'Client' : 'Cliente'}</label>
                  <input type="text" required value={formData.cliente} onChange={(e) => setFormData({...formData, cliente: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>{lang === 'en-US' ? 'Contract Value (R$)' : 'Valor do contrato'}</label>
                  <input type="number" step="0.01" required value={formData.valor_contrato} onChange={(e) => setFormData({...formData, valor_contrato: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>{lang === 'en-US' ? 'Proposal Nº' : 'Nº da proposta'}</label>
                  <input type="text" value={formData.num_proposta} onChange={(e) => setFormData({...formData, num_proposta: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>{lang === 'en-US' ? 'Contract Nº' : 'Nº do Contrato'}</label>
                  <input type="text" value={formData.num_contrato} onChange={(e) => setFormData({...formData, num_contrato: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* CEP e Endereço */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
                <div>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>{lang === 'en-US' ? 'Postal Code' : 'Código postal (CEP)'}</label>
                  <input 
                    type="text" 
                    value={formData.codigo_postal} 
                    onChange={(e) => setFormData({...formData, codigo_postal: e.target.value})} 
                    onBlur={handleCepBlur}
                    placeholder="Ex: 84010-000"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} 
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>{lang === 'en-US' ? 'Address' : 'Endereço (Logradouro)'}</label>
                  <input type="text" value={formData.endereco} onChange={(e) => setFormData({...formData, endereco: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Número e Bairro */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
                <div>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>{lang === 'en-US' ? 'Number' : 'Nº'}</label>
                  <input type="number" value={formData.numero} onChange={(e) => setFormData({...formData, numero: e.target.value})} placeholder="Ex: 123" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>{lang === 'en-US' ? 'Neighborhood' : 'Bairro'}</label>
                  <input type="text" value={formData.bairro} onChange={(e) => setFormData({...formData, bairro: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>{lang === 'en-US' ? 'City' : 'Cidade'}</label>
                  <input type="text" value={formData.cidade} onChange={(e) => setFormData({...formData, cidade: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>{lang === 'en-US' ? 'State' : 'Estado'}</label>
                  <input type="text" value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>{lang === 'en-US' ? 'Country' : 'País'}</label>
                  <input type="text" value={formData.pais} onChange={(e) => setFormData({...formData, pais: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ backgroundColor: '#cbd5e0', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {lang === 'en-US' ? 'Cancel' : 'Cancelar'}
                </button>
                <button type="submit" style={{ backgroundColor: '#1d4ed8', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {lang === 'en-US' ? 'Save Project' : 'Salvar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TABELA DE LISTAGEM */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold' }}>ID</th>
              <th style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Project Name' : 'Nome do Projeto'}</th>
              <th style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Client' : 'Cliente'}</th>
              <th style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Contract Value' : 'Valor do Contrato'}</th>
              <th style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold' }}>{lang === 'en-US' ? 'City/State' : 'Cidade/Estado'}</th>
              <th style={{ padding: '15px 20px', color: '#4a5568', fontWeight: 'bold' }}>{lang === 'en-US' ? 'Actions' : 'Ações'}</th>
            </tr>
          </thead>
          <tbody>
            {projetos.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#718096' }}>
                  {lang === 'en-US' ? 'No projects registered yet.' : 'Nenhum projeto cadastrado até o momento.'}
                </td>
              </tr>
            ) : (
              projetos.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '15px 20px', color: '#1a365d', fontWeight: 'bold' }}>#{p.id}</td>
                  <td style={{ padding: '15px 20px', color: '#2d3748', fontWeight: 'bold' }}>{p.nome_projeto}</td>
                  <td style={{ padding: '15px 20px', color: '#4a5568' }}>{p.cliente}</td>
                  <td style={{ padding: '15px 20px', color: '#2b6cb0', fontWeight: 'bold' }}>
                    R$ {Number(p.valor_contrato).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '15px 20px', color: '#718096' }}>{p.cidade} / {p.estado}</td>
                  <td style={{ padding: '15px 20px' }}>
                    <button 
                      onClick={() => handleDelete(p.id, p.nome_projeto)}
                      style={{ backgroundColor: '#fed7d7', color: '#c53030', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                    >
                      {lang === 'en-US' ? 'Delete' : 'Excluir'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
