'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { supabase } from '../../../../lib/supabase';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false });

export default function MapaDiretoriaPage() {
  const { lang } = useLanguage();
  const [projetosComCoordenadas, setProjetosComCoordenadas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarProjetosNoMapa() {
      const { data, error } = await supabase.from('projetos').select('*');
      if (error || !data) {
        setLoading(false);
        return;
      }

      const projetosMapeados = [];
      for (let p of data) {
        if (p.cidade) {
          try {
            const query = encodeURIComponent(`${p.cidade}, ${p.estado || ''}, ${p.pais || 'Brasil'}`);
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
            const geoData = await res.json();
            
            if (geoData && geoData.length > 0) {
              projetosMapeados.push({
                ...p,
                lat: parseFloat(geoData[0].lat),
                lon: parseFloat(geoData[0].lon)
              });
            } else {
              projetosMapeados.push({ ...p, lat: -25.0916, lon: -50.1578 });
            }
          } catch (e) {
            console.error("Erro ao geocodificar projeto:", e);
          }
        }
      }

      setProjetosComCoordenadas(projetosMapeados);
      setLoading(false);
    }

    carregarProjetosNoMapa();
  }, []);

  // Limites para evitar a repetição infinita do globo
  const bounds = [
    [-85, -180], // Sudoeste
    [85, 180]    // Nordeste
  ];

  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ color: '#2A4365', margin: '0 0 10px 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        {lang === 'en-US' ? 'Executive Works Map' : 'Mapa Executivo de Obras e Projetos'}
      </h1>
      <p style={{ color: '#4a5568', marginBottom: '30px' }}>
        {lang === 'en-US' ? 'Geographic distribution of all registered active projects.' : 'Distribuição geográfica de todos os projetos ativos cadastrados no sistema.'}
      </p>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', height: '600px', position: 'relative' }}>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#4a5568', fontWeight: 'bold' }}>
            {lang === 'en-US' ? 'Loading map and projects...' : 'Carregando mapa e localizando projetos...'}
          </div>
        ) : (
          <MapContainer 
            center={[-14.2350, -51.9253]} 
            zoom={4} 
            minZoom={3}
            maxBounds={bounds}
            maxBoundsViscosity={1.0}
            style={{ height: '100%', width: '100%', borderRadius: '6px', zIndex: 1 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              noWrap={true}
            />
            {projetosComCoordenadas.map((proj) => (
              <Marker key={proj.id} position={[proj.lat, proj.lon]}>
                <Popup>
                  <div style={{ fontFamily: 'sans-serif' }}>
                    <strong style={{ color: '#1a365d', fontSize: '1rem' }}>{proj.nome_projeto}</strong><br />
                    <span><strong>Cliente:</strong> {proj.cliente}</span><br />
                    <span><strong>Local:</strong> {proj.cidade} / {proj.estado}</span><br />
                    <span><strong>Contrato:</strong> R$ {Number(proj.valor_contrato).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

      </div>
    </div>
  );
}
