export default function ExhibitTestPage() {
  return (
    <div style={{ background: 'black', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video
        src="https://res.cloudinary.com/dwkuqttoe/video/upload/v1773216047/phone2_aadiaf.mp4"
        autoPlay
        muted
        loop
        playsInline
        controls
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  )
}
