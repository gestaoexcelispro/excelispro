export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#2A4365', color: '#ffffff', padding: '40px 5%', textAlign: 'center' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.8rem', margin: '0 0 10px 0' }}>ExcelisPro</h2>
        <p style={{ color: '#cbd5e0', margin: 0 }}>Pro-Grade Solutions for USA, Canada & Brazil Businesses.</p>
      </div>
      
      <div style={{ borderTop: '1px solid #4A5568', paddingTop: '20px', color: '#a0aec0', fontSize: '0.9rem', marginTop: '30px' }}>
        &copy; {new Date().getFullYear()} ExcelisPro. All rights reserved.
      </div>
    </footer>
  );
}
