'use client';
import { useLanguage } from '../../../../contexts/LanguageContext';

export default function ContasPagarPage() {
  const { lang } = useLanguage();

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ color: '#2A4365', margin: '0 0 10px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        {lang === 'en-US' ? 'Accounts Payable' : 'Contas a Pagar'}
      </h1>
      <p style={{ color: '#4a5568' }}>
        {lang === 'en-US' 
          ? 'Manage operational expenses, bills, and outgoing payments.' 
          : 'Gerencie as despesas operacionais, contas e obrigações financeiras da empresa.'}
      </p>
    </div>
  );
}
