import ActionButtons from '../components/ActionButtons';
import Header from '../components/Header';

export default function Home() {
  return (
    <div style={{ fontFamily: 'sans-serif', margin: 0, padding: 0 }}>
      <Header />
      
      <main style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#2A4365', fontSize: '3rem', marginBottom: '10px' }}>
          UNLOCK THE FULL POTENTIAL OF YOUR EXCEL DATA
        </h1>
        <p style={{ color: '#4A5568', fontSize: '1.2rem', marginBottom: '40px', lineHeight: '1.6' }}>
          Pro-Grade Construction Takeoff & Lean Planning Solutions for North and South American Efficiency.
        </p>
        
        <ActionButtons />
      </main>
    </div>
  );
}
