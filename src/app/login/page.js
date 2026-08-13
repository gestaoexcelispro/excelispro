export default function Login() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ color: '#2A4365', textAlign: 'center', marginBottom: '30px' }}>ExcelisPro System</h1>
        
        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#4A5568', fontWeight: 'bold', fontSize: '0.9rem' }}>E-mail</label>
            <input type="email" placeholder="admin@excelispro.com" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#4A5568', fontWeight: 'bold', fontSize: '0.9rem' }}>Senha</label>
            <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem' }} />
          </div>
          
          <button type="button" style={{ padding: '14px', backgroundColor: '#2A4365', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
