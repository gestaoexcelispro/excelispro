import ActionButtons from '../components/ActionButtons';

export default function Home() {
  return (
    <main style={{ padding: '60px 20px', fontFamily: 'sans-serif', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#2A4365', fontSize: '3rem', marginBottom: '10px' }}>
        ExcelisPro
      </h1>
      <p style={{ color: '#4A5568', fontSize: '1.2rem', marginBottom: '40px' }}>
        Pro-Grade Construction Takeoff & Lean Planning Solutions for North America.
      </p>
      
      <ActionButtons />
    </main>
  );
}
