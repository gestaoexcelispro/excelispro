export default function ActionButtons() {
  return (
    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
      <a 
        href="#sample" 
        style={{ 
          padding: '12px 24px', 
          border: '2px solid #2A4365', 
          color: '#2A4365', 
          textDecoration: 'none', 
          borderRadius: '6px', 
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Read a Sample
      </a>
      
      <a 
        href="#buy" 
        style={{ 
          padding: '12px 24px', 
          backgroundColor: '#2A4365', 
          color: '#ffffff', 
          textDecoration: 'none', 
          borderRadius: '6px', 
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Purchase Directly
      </a>
    </div>
  );
}
