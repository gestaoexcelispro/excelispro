'use client';
import { useLanguage } from '../../../../contexts/LanguageContext';

export default function ContasReceberPage() {
  const { lang } = useLanguage();

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ color: '#2A4365', margin: '0 0 10px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        {lang === 'en-US' ? 'Accounts Receivable' : 'Contas a Receber'}
      </h1>
      <p style={{ color: '#4a5568' }}>
        {lang === 'en-US' 
          ? 'Manage incoming payments and receivables from commercial proposals.' 
          : 'Gerencie os recebimentos e entradas financeiras oriundas das propostas comerciais.'}
      </p>
    </div>
  );
}
