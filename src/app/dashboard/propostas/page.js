'use client';

export default function PropostaTemplate() {
  return (
    <div style={{ padding: '40px', backgroundColor: '#f4f7f6', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      
      {/* Contêiner simulando uma folha A4 */}
      <div style={{ 
        backgroundColor: 'white', 
        width: '210mm', 
        minHeight: '297mm', 
        padding: '20mm', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        fontFamily: 'sans-serif',
        color: '#333'
      }}>
        
        {/* Cabeçalho */}
        <header style={{ borderBottom: '2px solid #2A4365', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ color: '#2A4365', margin: '0 0 5px 0', fontSize: '24px' }}>ExcelisPro</h1>
            <p style={{ margin: 0, fontSize: '12px' }}>ExcelisPro Consultoria e Gestão de Obras Ltda.<br/>CNPJ: 65.406.791/0001-08<br/>gestao.excelispro@gmail.com | (42) 98406-6238</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#4A5568' }}>PROPOSTA COMERCIAL</h2>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>PROP-2026-002</p>
            <p style={{ margin: 0, fontSize: '12px' }}>Data de Emissão: 13/08/2026<br/>Validade: 30 dias</p>
          </div>
        </header>

        {/* Dados do Cliente e Objeto */}
        <section style={{ marginBottom: '30px' }}>
          <div style={{ backgroundColor: '#edf2f7', padding: '10px', marginBottom: '15px' }}>
            <strong>DADOS DO CLIENTE CONTRATANTE</strong><br/>
            Nome / Razão Social: Bianca, Luciano e João Lucas
          </div>
          <div style={{ backgroundColor: '#edf2f7', padding: '10px' }}>
            <strong>OBJETO DA PROPOSTA COMERCIAL</strong><br/>
            Projetos de Engenharia - Bianca, Luciano e João Lucas<br/>
            <span style={{ fontSize: '12px' }}>Modelo Aplicado: Projetos de Engenharia</span>
          </div>
        </section>

        {/* 1. Escopo */}
        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#2A4365', borderBottom: '1px solid #cbd5e0', paddingBottom: '5px' }}>1. ESCOPO SELECIONADO DA BASE DE DADOS</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>ITEM DO ESCOPO #1</strong><br/>
            Elaboração de Projeto de Instalações Elétricas Residenciais<br/>
            165 m² x R$ 5,00/m² - <strong>Subtotal: R$ 825,00</strong>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>ITEM DO ESCOPO #2</strong><br/>
            Elaboração de Projeto de Instalações Hidrossanitárias<br/>
            165 m² x R$ 10,00/m² - <strong>Subtotal: R$ 1.650,00</strong>
          </div>

          <div style={{ fontSize: '13px', lineHeight: '1.6', marginTop: '20px', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
            O escopo técnico contemplará a execução rigorosa de todos os levantamentos, dimensionamentos, especificações técnicas e memoriais descritivos alinhados às normas técnicas vigentes (ABNT/NBR).<br/>
            • Dimensionamento e detalhamento executivo em ambiente CAD/BIM.<br/>
            • Entrega de Lista estimativa de materiais de construção.<br/>
            • Emissão de Anotação de Responsabilidade Técnica (ART/RRT) inclusa.<br/>
            • Acompanhamento técnico para sanar dúvidas durante a fase de execução.
          </div>
        </section>

        {/* 2. Exclusões */}
        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#2A4365', borderBottom: '1px solid #cbd5e0', paddingBottom: '5px' }}>2. ITENS NÃO INCLUSOS NESTA PROPOSTA (EXCLUSÕES)</h3>
          <p style={{ fontSize: '13px' }}>Para fins de alinhamento prévio e clareza contratual, os serviços e atividades abaixo NÃO fazem parte do escopo desta proposta:</p>
          <ul style={{ fontSize: '13px', listStyleType: 'none', padding: 0 }}>
            <li>☒ Visitas técnicas</li>
            <li>☒ Projeto de Estrutura e Fundações</li>
            <li>☒ Gestão de Obra</li>
            <li>☒ Compatibilização entre disciplinas</li>
          </ul>
        </section>

        {/* 3. Memória de Cálculo e Valoração */}
        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#2A4365', borderBottom: '1px solid #cbd5e0', paddingBottom: '5px' }}>3. MEMÓRIA DE CÁLCULO E VALORAÇÃO</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#edf2f7', textAlign: 'left' }}>
                <th style={{ padding: '8px', border: '1px solid #cbd5e0' }}>Descrição do Item</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e0' }}>Área/Qtd</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e0' }}>Valor Unit.</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e0' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px', border: '1px solid #cbd5e0' }}>Elaboração de Proj. Elétricas</td>
                <td style={{ padding: '8px', border: '1px solid #cbd5e0' }}>165 m²</td>
                <td style={{ padding: '8px', border: '1px solid #cbd5e0' }}>R$ 5,00/m²</td>
                <td style={{ padding: '8px', border: '1px solid #cbd5e0' }}>R$ 825,00</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', border: '1px solid #cbd5e0' }}>Elaboração de Proj. Hidrossanitárias</td>
                <td style={{ padding: '8px', border: '1px solid #cbd5e0' }}>165 m²</td>
                <td style={{ padding: '8px', border: '1px solid #cbd5e0' }}>R$ 10,00/m²</td>
                <td style={{ padding: '8px', border: '1px solid #cbd5e0' }}>R$ 1.650,00</td>
              </tr>
            </tbody>
          </table>
          <div style={{ textAlign: 'right', fontSize: '16px' }}>
            <strong>VALOR TOTAL DA PROPOSTA: R$ 2.475,00</strong><br/>
            <span style={{ fontSize: '11px', color: '#718096' }}>Impostos inclusos na nota fiscal de serviços</span>
          </div>
        </section>

        {/* 4. Condições de Pagamento */}
        <section style={{ marginBottom: '40px' }}>
          <h3 style={{ color: '#2A4365', borderBottom: '1px solid #cbd5e0', paddingBottom: '5px' }}>4. CONDIÇÕES DE PAGAMENTO E CLÁUSULAS CONTRATUAIS</h3>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
            <div style={{ flex: 1, backgroundColor: '#f7fafc', padding: '10px', border: '1px solid #e2e8f0' }}>
              <strong>1ª PARCELA (ENTRADA):</strong> 50% - R$ 1.237,50
            </div>
            <div style={{ flex: 1, backgroundColor: '#f7fafc', padding: '10px', border: '1px solid #e2e8f0' }}>
              <strong>2ª PARCELA (ENTREGA):</strong> 50% - R$ 1.237,50
            </div>
          </div>
          <div style={{ fontSize: '12px', fontStyle: 'italic', backgroundColor: '#fffaf0', padding: '10px', borderLeft: '4px solid #ed8936' }}>
            <strong>Cláusula Especial de Reajuste por Área Construída:</strong> "Ajustes na área construída efetivamente apurada no projeto executivo implicarão em reajuste proporcional do valor da última parcela, utilizando a taxa unitária de R$ 15,00/m²."
          </div>
        </section>

        {/* Assinaturas */}
        <section style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', textAlign: 'center', fontSize: '13px' }}>
          <div style={{ width: '45%' }}>
            <div style={{ borderBottom: '1px solid #333', marginBottom: '5px', paddingBottom: '20px' }}>[Assinado Eletronicamente]</div>
            <strong>ExcelisPro Consultoria e Gestão</strong><br/>
            CNPJ: 65.406.791/0001-08<br/>
            CONTRATADA
          </div>
          <div style={{ width: '45%' }}>
            <div style={{ borderBottom: '1px solid #333', marginBottom: '5px', paddingBottom: '20px', color: '#a0aec0' }}>[Aguardando Assinatura]</div>
            <strong>Bianca, Luciano e João Lucas</strong><br/>
            CNPJ / CPF<br/>
            CONTRATANTE
          </div>
        </section>

      </div>
    </div>
  );
}
