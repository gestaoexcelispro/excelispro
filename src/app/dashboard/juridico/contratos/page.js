'use client';
import { useLanguage } from '../../../../contexts/LanguageContext';

export default function ContratosPage() {
  const { lang } = useLanguage();

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ color: '#2A4365', margin: '0 0 10px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        {lang === 'en-US' ? 'Contract Workflows' : 'Fluxo de Contratos'}
      </h1>
      <p style={{ color: '#4a5568' }}>
        {lang === 'en-US' 
          ? 'Manage legal review, drafting, and signing workflows for contracts.' 
          : 'Gerencie a elaboração, revisão jurídica e o fluxo de assinatura dos contratos.'}
      </p>
    </div>
  );
}
