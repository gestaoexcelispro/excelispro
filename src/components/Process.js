export default function Process() {
  return (
    <section id="process" style={{ padding: '80px 5%', backgroundColor: '#ffffff' }}>
      <h2 style={{ textAlign: 'center', color: '#2A4365', fontSize: '2.5rem', marginBottom: '50px' }}>
        Our Simple 3-Step Process
      </h2>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Passo 1 */}
        <div style={{ flex: '1', minWidth: '250px', textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '4rem', color: '#3182ce', fontWeight: 'bold', marginBottom: '15px' }}>1</div>
          <h3 style={{ color: '#2A4365', fontSize: '1.5rem', marginBottom: '10px' }}>Submit Your Project</h3>
          <p style={{ color: '#4A5568', lineHeight: '1.6' }}>Upload your blueprints, specs, or existing schedules through our secure portal or email.</p>
        </div>

        {/* Passo 2 */}
        <div style={{ flex: '1', minWidth: '250px', textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '4rem', color: '#3182ce', fontWeight: 'bold', marginBottom: '15px' }}>2</div>
          <h3 style={{ color: '#2A4365', fontSize: '1.5rem', marginBottom: '10px' }}>We Process & Optimize</h3>
          <p style={{ color: '#4A5568', lineHeight: '1.6' }}>Our experts perform precise takeoffs and build your lean planning dashboards in Excel.</p>
        </div>

        {/* Passo 3 */}
        <div style={{ flex: '1', minWidth: '250px', textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '4rem', color: '#3182ce', fontWeight: 'bold', marginBottom: '15px' }}>3</div>
          <h3 style={{ color: '#2A4365', fontSize: '1.5rem', marginBottom: '10px' }}>Receive Excel Files</h3>
          <p style={{ color: '#4A5568', lineHeight: '1.6' }}>Get your ready-to-use, fully automated Excel documents delivered on time, ready for action.</p>
        </div>

      </div>
    </section>
  );
}
