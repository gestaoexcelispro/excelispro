'use client';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { supabase } from '../../../../lib/supabase';

// Legenda exata da imagem solicitada
const STATUS_CORES = {
  '': { label: '', color: 'transparent', text: '#000' },
  'C': { label: 'CONCLUÍDO', color: '#38a169', text: '#fff' }, // Verde
  'E': { label: 'EXECUÇÃO', color: '#ecc94b', text: '#000' }, // Amarelo
  'A': { label: 'ATRASADO', color: '#e53e3e', text: '#fff' }, // Vermelho
  'R': { label: 'RESTRIÇÃO', color: '#6b46c1', text: '#fff' }, // Roxo
  'L': { label: 'LIBERADO', color: '#3182ce', text: '#fff' }, // Azul
};

export default function MatrizStatusPage() {
  const { lang } = useLanguage();
  
  const [projetosLista, setProjetosLista] = useState([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState('');
  const [dataStatus, setDataStatus] = useState(new Date().toISOString().split('T')[0]);

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfConfig, setPdfConfig] = useState({ formato: 'a3', orientacao: 'landscape' });

  // Estrutura Base de Colunas (Horizontal)
  const [colunas, setColunas] = useState([
    'FIXAÇÃO DE CADEIRINHAS', 'INSTALAÇÕES ELÉTRICAS', 'INSTALAÇÕES HIDRÁULICAS', 
    'INSTALAÇÕES SANITÁRIAS', 'INSTALAÇÕES PLUVIAIS', 'INSTALAÇÃO DE LÃ MINERAL', 
    'PLAQUEAMENTO DRYWALL PAREDES INTERNAS', 'TRATAMENTO DE JUNTAS PAREDES DRYWALL', 
    'EXECUÇÃO DE ESTRUTURA AUXILIAR DE FORRO', 'PLAQUEAMENTO GESSO ACARTONADO FORRO', 
    'TRATAMENTO DE JUNTAS FORRO', 'PINTURA (PREPARAÇÃO + 1ª DEMÃO)', 'REVESTIMENTOS', 
    'PORTAS INTERNAS', 'PINTURA (2ª DEMÃO E RETOQUES)', 'PISO VINÍLICO', 'RODAPÉS'
  ]);

  // Estrutura Base de Linhas (LBS)
  const [linhas, setLinhas] = useState([
    { id: 'l1', pavimento: 'INTERNOS PV 2', fase: 'ZONA 3', lbs: 'SUÍTE 1' },
    { id: 'l2', pavimento: 'INTERNOS PV 2', fase: 'ZONA 3', lbs: 'SALA ÍNTIMA' },
    { id: 'l3', pavimento: 'INTERNOS PV 2', fase: 'ZONA 3', lbs: 'ESCADA' },
    { id: 'l4', pavimento: 'INTERNOS PV 2', fase: 'ZONA 2', lbs: 'SUÍTE MASTER 2' },
    { id: 'l5', pavimento: 'INTERNOS PV 2', fase: 'ZONA 2', lbs: 'SUÍTE MASTER' },
    { id: 'l6', pavimento: 'INTERNOS PV 2', fase: 'ZONA 1', lbs: 'SACADA 2' },
    { id: 'l7', pavimento: 'INTERNOS PV 2', fase: 'ZONA 1', lbs: 'IS SUÍTE MASTER 2' },
    { id: 'l8', pavimento: 'INTERNOS PV 2', fase: 'ZONA 1', lbs: 'IS MASTER 1' },
    { id: 'l9', pavimento: 'INTERNOS PV 2', fase: 'ZONA 1', lbs: 'CLOSET MASTER' },
    { id: 'l10', pavimento: 'INTERNOS PV 2', fase: 'ZONA 1', lbs: 'SACADA 1' },
    { id: 'l11', pavimento: 'INTERNOS PV 2', fase: 'ZONA 1', lbs: 'IS' },
    { id: 'l12', pavimento: 'INTERNOS PV 1', fase: 'ZONA 3', lbs: 'JANTAR' },
    { id: 'l13', pavimento: 'INTERNOS PV 1', fase: 'ZONA 3', lbs: 'QUARTO' },
    { id: 'l14', pavimento: 'INTERNOS PV 1', fase: 'ZONA 3', lbs: 'COZINHA' },
    { id: 'l15', pavimento: 'INTERNOS PV 1', fase: 'ZONA 2', lbs: 'ESTAR' },
    { id: 'l16', pavimento: 'INTERNOS PV 1', fase: 'ZONA 2', lbs: 'ESCADA' },
    { id: 'l17', pavimento: 'INTERNOS PV 1', fase: 'ZONA 1', lbs: 'SERVIÇO' },
    { id: 'l18', pavimento: 'INTERNOS PV 1', fase: 'ZONA 1', lbs: 'IS' },
    { id: 'l19', pavimento: 'INTERNOS PV 1', fase: 'ZONA 1', lbs: 'GARAGEM' }
  ]);

  const [dadosCelulas, setDadosCelulas] = useState({});

  useEffect(() => {
    const fetchProjetos = async () => {
      const { data } = await supabase.from('projetos').select('id, nome_projeto').order('id', { ascending: false });
      if (data) setProjetosLista(data);
    };
    fetchProjetos();
  }, []);

  const handleCellChange = (linhaId, colIdx, valor) => {
    setDadosCelulas(prev => ({ ...prev, [`${linhaId}___${colIdx}`]: valor }));
  };

  const adicionarLinha = () => {
    setLinhas([...linhas, { id: `l_${Date.now()}`, pavimento: '', fase: '', lbs: '' }]);
  };

  const atualizarLinha = (id, campo, valor) => {
    setLinhas(linhas.map(l => l.id === id ? { ...l, [campo]: valor } : l));
  };

  const removerLinha = (id) => {
    setLinhas(linhas.filter(l => l.id !== id));
  };

  const adicionarColuna = () => {
    const nomeCol = prompt('Digite o nome da nova etapa/serviço:');
    if (nomeCol) setColunas([...colunas, nomeCol.toUpperCase()]);
  };

  const gerarPDF = () => {
    import('html2pdf.js').then((html2pdf) => {
      const elemento = document.getElementById('conteudo-matriz-pdf');
      let configuracaoPdf = { unit: 'mm', format: pdfConfig.formato, orientation: pdfConfig.orientacao };
      if (pdfConfig.formato === 'unica') {
        const rect = elemento.getBoundingClientRect();
        configuracaoPdf = { unit: 'px', format: [rect.height + 40, rect.width + 40], orientation: 'landscape' };
      }
      const opcoes = { margin: 10, filename: `matriz-status-${projetoSelecionado}-${Date.now()}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: configuracaoPdf };
      html2pdf.default().from(elemento).set(opcoes).save();
      setShowPdfModal(false);
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* CABEÇALHO */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ color: '#2A4365', margin: 0, fontStyle: 'italic', fontSize: '1.5rem', marginBottom: '10px' }}>
            MATRIZ DE CONTROLE DE STATUS
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <select
                value={projetoSelecionado}
                onChange={(e) => setProjetoSelecionado(e.target.value)}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e0', minWidth: '300px', fontSize: '0.9rem', outline: 'none' }}
              >
                <option value="">-- Selecione uma Obra --</option>
                {projetosLista.map(p => (
                  <option key={p.id} value={p.id}>#{p.id} - {p.nome_projeto}</option>
                ))}
              </select>
            </div>
            
            {projetoSelecionado && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f7fafc', padding: '5px 15px', borderRadius: '6px', border: '1px solid #cbd5e0' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4a5568' }}>Data Status:</label>
                <input 
                  type="date" 
                  value={dataStatus} 
                  onChange={(e) => setDataStatus(e.target.value)} 
                  style={{ border: 'none', background: 'transparent', outline: 'none', color: '#2d3748', fontWeight: 'bold' }} 
                />
              </div>
            )}
          </div>
        </div>

        {projetoSelecionado && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={adicionarColuna} style={{ backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              + Nova Coluna
            </button>
            <button onClick={() => setShowPdfModal(true)} style={{ backgroundColor: '#2f855a', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              📊 Exportar PDF
            </button>
          </div>
        )}
      </div>

      {!projetoSelecionado ? (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7fafc', borderRadius: '8px', border: '2px dashed #cbd5e0' }}>
          <div style={{ textAlign: 'center', color: '#718096' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🏗️</span>
            <h2>Nenhuma Obra Selecionada</h2>
            <p>Selecione um projeto para abrir a Matriz de Controle de Status.</p>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* TABELA PRINCIPAL */}
          <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'white', border: '1px solid #cbd5e0', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div id="conteudo-matriz-pdf" style={{ minWidth: 'max-content', paddingBottom: '20px' }}>
              <table style={{ borderCollapse: 'collapse', whiteSpace: 'nowrap', width: '100%' }}>
                
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'white' }}>
                  {/* LINHA 1: SENTIDO DE EXECUÇÃO */}
                  <tr>
                    <th colSpan={3} style={{ backgroundColor: 'white', padding: '10px', borderRight: '2px solid #ed8936', borderBottom: '1px solid #cbd5e0', textAlign: 'center', color: '#1a365d' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                        OBRA: {projetosLista.find(p => p.id == projetoSelecionado)?.nome_projeto || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.75rem', marginTop: '5px' }}>
                        DATA DE ATUALIZAÇÃO: {dataStatus.split('-').reverse().join('/')}
                      </div>
                    </th>
                    <th colSpan={colunas.length} style={{ backgroundColor: '#f7fafc', borderBottom: '1px solid #cbd5e0', padding: '6px', textAlign: 'center', fontWeight: 'bold', color: '#4a5568', letterSpacing: '2px', fontSize: '0.85rem' }}>
                      SENTIDO DE EXECUÇÃO ➡️
                    </th>
                  </tr>

                  {/* LINHA 2: CABEÇALHOS GERAIS E COLUNAS NA VERTICAL */}
                  <tr>
                    <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '10px', borderRight: '1px solid #2a4365', width: '120px', borderBottom: '2px solid #2a4365' }}>PAVIMENTO</th>
                    <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '10px', borderRight: '1px solid #2a4365', width: '120px', borderBottom: '2px solid #2a4365' }}>FASE</th>
                    <th style={{ backgroundColor: '#1a365d', color: 'white', padding: '10px', borderRight: '2px solid #ed8936', width: '200px', borderBottom: '2px solid #2a4365' }}>LBS (LOCAL)</th>
                    
                    {colunas.map((col, idx) => (
                      <th key={`col-${idx}`} style={{ 
                        backgroundColor: 'white', 
                        borderRight: '1px dotted #cbd5e0', 
                        borderBottom: '2px solid #1a365d',
                        verticalAlign: 'bottom',
                        padding: '10px 5px',
                        height: '240px', // Altura fixa para os textos em pé
                      }}>
                        <div style={{
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                          textAlign: 'left',
                          fontSize: '0.75rem',
                          color: '#4a5568',
                          margin: '0 auto',
                          maxHeight: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {col}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {linhas.map((linha, index) => {
                    // Lógica visual para mesclar visualmente as linhas repetidas (estilo Excel)
                    const showPavimento = index === 0 || linhas[index - 1].pavimento !== linha.pavimento;
                    const showFase = index === 0 || linhas[index - 1].pavimento !== linha.pavimento || linhas[index - 1].fase !== linha.fase;

                    return (
                      <tr key={linha.id} style={{ borderBottom: '1px dotted #cbd5e0' }}>
                        {/* COLUNA PAVIMENTO */}
                        <td style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: 'white', padding: '4px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'center', fontWeight: showPavimento ? 'bold' : 'normal', color: showPavimento ? '#2d3748' : 'transparent' }}>
                          <input type="text" value={linha.pavimento} onChange={(e) => atualizarLinha(linha.id, 'pavimento', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center', color: showPavimento ? 'inherit' : 'transparent' }} />
                        </td>
                        
                        {/* COLUNA FASE */}
                        <td style={{ position: 'sticky', left: '120px', zIndex: 5, backgroundColor: showFase ? '#ebf8ff' : 'white', padding: '4px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'center', fontWeight: showFase ? 'bold' : 'normal', color: showFase ? '#2b6cb0' : 'transparent' }}>
                          <input type="text" value={linha.fase} onChange={(e) => atualizarLinha(linha.id, 'fase', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center', color: showFase ? 'inherit' : 'transparent' }} />
                        </td>
                        
                        {/* COLUNA LBS */}
                        <td style={{ position: 'sticky', left: '240px', zIndex: 5, backgroundColor: '#f7fafc', padding: '4px 8px', borderRight: '2px solid #ed8936', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <input type="text" value={linha.lbs} onChange={(e) => atualizarLinha(linha.id, 'lbs', e.target.value)} placeholder="Local..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem' }} />
                          <button onClick={() => removerLinha(linha.id)} title="Excluir" style={{ border: 'none', background: 'transparent', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold' }}>✖</button>
                        </td>

                        {/* CÉLULAS DA MATRIZ */}
                        {colunas.map((col, idx) => {
                          const cellKey = `${linha.id}___${idx}`;
                          const val = dadosCelulas[cellKey] || '';
                          const estilo = STATUS_CORES[val] || STATUS_CORES[''];

                          return (
                            <td key={cellKey} style={{ borderRight: '1px dotted #cbd5e0', padding: '1px', backgroundColor: estilo.color, textAlign: 'center', minWidth: '40px', height: '28px' }}>
                              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <select
                                  value={val}
                                  onChange={(e) => handleCellChange(linha.id, idx, e.target.value)}
                                  style={{ width: '100%', height: '100%', backgroundColor: 'transparent', color: estilo.text, border: 'none', outline: 'none', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center', textAlignLast: 'center', appearance: 'none', cursor: 'pointer', padding: '0 4px' }}
                                >
                                  <option value=""></option>
                                  {Object.keys(STATUS_CORES).filter(k => k !== '').map(sigla => (
                                    <option key={sigla} value={sigla}>{sigla}</option>
                                  ))}
                                </select>
                                <div style={{ position: 'absolute', right: '1px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.45rem', color: estilo.text === '#fff' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }}>▼</div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  
                  {/* BOTÃO ADICIONAR LINHA */}
                  <tr>
                    <td colSpan={3} style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: 'white', padding: '10px 15px', borderBottom: '1px solid #cbd5e0', borderRight: '2px solid #ed8936' }}>
                      <button onClick={adicionarLinha} style={{ backgroundColor: '#ebf8ff', color: '#2b6cb0', border: '1px dashed #3182ce', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        + Adicionar LBS (Linha)
                      </button>
                    </td>
                    <td colSpan={colunas.length} style={{ borderBottom: '1px solid #cbd5e0', backgroundColor: 'white' }}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* LEGENDA INFERIOR */}
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e0', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#1a365d', fontSize: '0.85rem' }}>LEGENDA:</span>
            {Object.entries(STATUS_CORES).filter(([sigla]) => sigla !== '').map(([sigla, info]) => (
              <div key={sigla} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f7fafc', padding: '4px 10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: info.color, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: info.text, fontSize: '0.6rem', fontWeight: 'bold' }}>{sigla}</div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#4a5568' }}>{info.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAÇÃO DO PDF */}
      {showPdfModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '450px' }}>
            <h2 style={{ color: '#1a365d', marginBottom: '20px' }}>Exportar Matriz para PDF</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Tamanho da Folha</label>
                <select value={pdfConfig.formato} onChange={(e) => setPdfConfig({...pdfConfig, formato: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }}>
                  <option value="a4">A4 (Padrão)</option>
                  <option value="a3">A3 (Recomendado)</option>
                  <option value="a2">A2 (Grande)</option>
                  <option value="unica">Ajuste Perfeito (Página Única Contínua)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Orientação</label>
                <select value={pdfConfig.orientacao} onChange={(e) => setPdfConfig({...pdfConfig, orientacao: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }} disabled={pdfConfig.formato === 'unica'}>
                  <option value="landscape">Paisagem (Horizontal)</option>
                  <option value="portrait">Retrato (Vertical)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowPdfModal(false)} style={{ backgroundColor: '#cbd5e0', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={gerarPDF} style={{ backgroundColor: '#2f855a', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Confirmar e Baixar PDF</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
