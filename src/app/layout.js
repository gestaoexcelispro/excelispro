import { LanguageProvider } from '../contexts/LanguageContext';

export const metadata = {
  title: 'ExcelisPro System',
  description: 'Sistema Interno de Gestão e Propostas - ExcelisPro',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Importação oficial do CSS do Leaflet para alinhar os blocos do mapa */}
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
          crossOrigin="" 
        />
      </head>
      <body style={{ margin: 0, padding: 0, boxSizing: 'border-box', fontFamily: 'sans-serif' }}>
        
        {/* O provedor de idioma envolve todo o site e liga a rede */}
        <LanguageProvider>
          {children}
        </LanguageProvider>
        
      </body>
    </html>
  );
}
