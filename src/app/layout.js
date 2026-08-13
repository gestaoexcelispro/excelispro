import { LanguageProvider } from '../contexts/LanguageContext';

export const metadata = {
  title: 'ExcelisPro System',
  description: 'Sistema Interno de Gestão e Propostas - ExcelisPro',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0, boxSizing: 'border-box', fontFamily: 'sans-serif' }}>
        
        {/* O provedor de idioma envolve todo o site e liga a rede */}
        <LanguageProvider>
          {children}
        </LanguageProvider>
        
      </body>
    </html>
  );
}
