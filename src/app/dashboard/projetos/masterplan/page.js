'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';

// Dicionário de serviços e suas cores equivalentes ao padrão visual da imagem
const SERVICOS_CORES = {
  '': { label: '', color: 'transparent', text: '#000' },
  'FUN': { label: 'Fundação', color: '#ff00ff', text: '#fff' },
  'PNS': { label: 'Painelização Aço', color: '#9900cc', text: '#fff' },
  'VTS': { label: 'Estrutura', color: '#0000ff', text: '#fff' },
  'BUF': { label: 'Buffer', color: '#000000', text: '#fff' },
  'VEX': { label: 'Vedações Externas', color: '#00ffff', text: '#000' },
  'COB': { label: 'Cobertura', color: '#993333', text: '#fff' },
  'INS': { label: 'Instalações', color: '#3366cc', text: '#fff' },
  'LMI': { label: 'Limpeza e Miudezas', color: '#00cc00', text: '#fff' },
  'VIN': { label: 'Piso Vinílico', color: '#ff9900', text: '#fff' },
  'FOR': { label: 'Forro', color: '#336600', text: '#fff' },
  'PIN': { label: 'Pintura', color: '#808000', text: '#fff' },
  'FER': { label: 'Feriado / FDS', color: '#999999', text: '#fff' },
};

// Estrutura inicial das linhas simulando a imagem
const LINHAS_INICIAIS = [
  { id: 'g1', tipo: 'grupo', descricao: 'SERVIÇOS INTERNOS' },
  { id: 1, tipo: 'linha', descricao: 'PV2 ZONA 3' },
  { id: 2, tipo: 'linha', descricao: 'PV2 ZONA 2' },
  { id: 3, tipo: 'linha', descricao: 'PV2 ZONA 1' },
  { id: 4, tipo: 'linha', descricao: 'PV1 ZONA 3' },
  { id: 5, tipo: 'linha', descricao: 'PV1 ZONA 2' },
  { id: 6, tipo: 'linha', descricao: 'PV1 ZONA 1' },
  { id: 'g2', tipo: 'grupo', descricao: 'SERVIÇOS EXTERNOS' },
  { id: 7, tipo: 'linha', descricao: 'ESQUADRIAS' },
  { id: 8, tipo: 'linha', descricao: 'VEDAÇÕES EXTERNAS PV 2' },
  { id: 9, tipo: 'linha', descricao: 'VEDAÇÕES EXTERNAS PV 1' },
  { id: 10, tipo: 'linha', descricao: 'COBERTURA' },
  { id: 11, tipo: 'linha', descricao: 'ESTRUTURA PV2' },
  { id: 12, tipo: 'linha', descricao: 'ESTRUTURA PV1' },
  { id: 13, tipo: 'linha', descricao: 'PAINELIZAÇÃO AÇO' },
  { id: 14, tipo: 'linha', descricao: 'FUNDAÇÃO' },
  { id: 15, tipo: 'linha', descricao: 'LIMPEZA FINAL E OUTROS' },
];

export default function MasterPlanPage() {
  const { lang } = useLanguage();
  
  const [datasPlanilha, setDatasPlanilha] = useState([]);
  const [dadosCelulas, setDadosCelulas] = useState({});

  // Gerar colunas de datas a partir de uma data inicial (ex: 10/08/2026)
  useEffect(() => {
    const gerarDatas = () => {
      const datas = [];
      let dataAtual = new Date(2026, 7, 10); // 10 de Agosto de 2026 (Mês 7 no JS)
      
      const diasSemana = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];

      for (let i = 0; i < 60; i++) {
        const dataClonada = new Date(dataAtual);
        const dia = String(dataClonada.getDate()).padStart(2, '0');
        const mes = String(dataClonada.getMonth() + 1).padStart(2, '0');
        const diaSemanaIndex = dataClonada.getDay();
        
        datas.push({
          dataCompleta: dataClonada,
          labelData: `${dia}/${mes}`,
          labelSemana: diasSemana[diaSemanaIndex],
          isFimDeSemana: diaSemanaIndex === 0 || diaSemanaIndex === 6
        });
        
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
      setDatasPlanilha(datas);
    };

    gerarDatas();
  }, []);

  const handleCellChange = (linhaId, dataLabel, valor) => {
    setDadosCelulas(prev => ({
      ...prev,
      [`${linhaId}___${dataLabel}`]: valor
    }));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* CABEÇALHO DA PÁGINA */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        <h1 style={{ color: '#2A4365', margin: 0, fontStyle: 'italic' }}>
          {lang === 'en-US' ? 'PHYSICAL SCHEDULE - LINE OF BALANCE' : 'CRONOGRAMA FÍSICO - LINHA DE BALANÇO'}
        </h1>
      </div>

      {/* CONTAINER COM SCROLL DUPLO (Horizontal e Vertical) */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        backgroundColor: 'white', 
        border: '1px solid #cbd5e0', 
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <table style={{ borderCollapse: 'collapse', whiteSpace: 'nowrap', minWidth: '100%' }}>
          
          {/* HEADER DA TABELA */}
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#e2e8f0' }}>
            {/* LINHA DE DATAS */}
            <tr>
              <th rowSpan={2} style={{ position: 'sticky', left: 0, zIndex: 11, backgroundColor: '#ff6600', color: 'white', padding: '8px', borderRight: '1px solid #fff', width: '40px' }}>
                ID
              </th>
              <th rowSpan={2} style={{ position: 'sticky', left: '40px', zIndex: 11, backgroundColor: '#ff6600', color: 'white', padding: '8px 15px', borderRight: '1px solid #ccc', textAlign: 'left', minWidth: '250px' }}>
                DESCRIÇÃO
              </th>
              {datasPlanilha.map((d, i) => (
                <th key={`data-${i}`} style={{ backgroundColor: '#e2e8f0', borderRight: '1px dotted #cbd5e0', borderBottom: '1px solid #cbd5e0', padding: '4px 2px', fontSize: '0.8rem', color: '#1a365d' }}>
                  {d.labelData}
                </th>
              ))}
            </tr>
            {/* LINHA DE DIAS DA SEMANA */}
            <tr>
              {datasPlanilha.map((d, i) => (
                <th key={`sem-${i}`} style={{ backgroundColor: d.isFimDeSemana ? '#cbd5e0' : '#f7fafc', borderRight: '1px dotted #cbd5e0', borderBottom: '1px solid #cbd5e0', padding: '4px 2px', fontSize: '0.75rem', color: '#4a5568', fontWeight: d.isFimDeSemana ? 'bold' : 'normal' }}>
                  {d.labelSemana}
                </th>
              ))}
            </tr>
          </thead>

          {/* CORPO DA TABELA */}
          <tbody>
            {LINHAS_INICIAIS.map((linha, idx) => {
              if (linha.tipo === 'grupo') {
                return (
                  <tr key={linha.id} style={{ backgroundColor: '#f7fafc' }}>
                    <td colSpan={2} style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: '#f7fafc', padding: '6px 15px', fontWeight: 'bold', fontStyle: 'italic', borderBottom: '1px solid #ff6600', borderTop: '1px solid #ff6600' }}>
                      {linha.descricao}
                    </td>
                    {datasPlanilha.map((d, i) => (
                      <td key={`g-${i}`} style={{ borderBottom: '1px solid #ff6600', borderTop: '1px solid #ff6600', backgroundColor: d.isFimDeSemana ? '#e2e8f0' : '#f7fafc' }}></td>
                    ))}
                  </tr>
                );
              }

              return (
                <tr key={linha.id} style={{ borderBottom: '1px dotted #cbd5e0' }}>
                  <td style={{ position: 'sticky', left: 0, zIndex: 5, backgroundColor: 'white', padding: '4px', textAlign: 'center', color: '#4a5568', borderRight: '1px solid #e2e8f0' }}>
                    {linha.id}
                  </td>
                  <td style={{ position: 'sticky', left: '40px', zIndex: 5, backgroundColor: 'white', padding: '4px 15px', color: '#2d3748', borderRight: '2px solid #cbd5e0' }}>
                    {linha.descricao}
                  </td>
                  
                  {/* CÉLULAS DE DATAS (Linha de Balanço) */}
                  {datasPlanilha.map((d, i) => {
                    const cellKey = `${linha.id}___${d.labelData}`;
                    // Se for fim de semana e não tiver valor, pré-prenchê visualmente como FER
                    const valorSalvo = dadosCelulas[cellKey];
                    const valorEfetivo = valorSalvo !== undefined ? valorSalvo : (d.isFimDeSemana ? 'FER' : '');
                    const configCor = SERVICOS_CORES[valorEfetivo] || SERVICOS_CORES[''];

                    return (
                      <td 
                        key={cellKey} 
                        style={{ 
                          borderRight: '1px dotted #cbd5e0', 
                          padding: '1px',
                          backgroundColor: configCor.color === 'transparent' && d.isFimDeSemana ? '#e2e8f0' : 'transparent',
                          textAlign: 'center',
                          minWidth: '45px'
                        }}
                      >
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <select
                            value={valorEfetivo}
                            onChange={(e) => handleCellChange(linha.id, d.labelData, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '2px 0px',
                              backgroundColor: configCor.color,
                              color: configCor.text,
                              border: 'none',
                              outline: 'none',
                              fontSize: '0.65rem',
                              fontWeight: 'bold',
                              textAlign: 'center',
                              appearance: 'none', // Remove a seta nativa
                              cursor: 'pointer',
                              borderRadius: '2px'
                            }}
                          >
                            <option value=""></option>
                            {Object.keys(SERVICOS_CORES).filter(k => k !== '').map(sigla => (
                              <option key={sigla} value={sigla}>{sigla}</option>
                            ))}
                          </select>
                          
                          {/* Seta customizada indicando o dropdown, igual à imagem */}
                          <div style={{ 
                            position: 'absolute', 
                            right: '2px', 
                            top: '50%', 
                            transform: 'translateY(-50%)', 
                            pointerEvents: 'none',
                            fontSize: '0.5rem',
                            color: configCor.text === '#fff' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'
                          }}>
                            ▼
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* LEGENDA FLUTUANTE INFERIOR */}
      <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e0', display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
        <span style={{ fontWeight: 'bold', color: '#1a365d' }}>LEGENDA:</span>
        {Object.entries(SERVICOS_CORES).filter(([sigla]) => sigla !== '').map(([sigla, info]) => (
          <div key={sigla} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: info.color, borderRadius: '2px' }}></div>
            <span><b>{sigla}</b> - {info.label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
