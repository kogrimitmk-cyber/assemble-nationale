// Logo officiel — sceau de l'Assemblée Nationale du Tchad (médaillon rond).
export default function Logo({ size = 44, alt = 'Assemblée Nationale du Tchad' }) {
  return (
    <img
      src="/logo-assemble.jpg"
      width={size}
      height={size}
      alt={alt}
      style={{
        borderRadius: '50%',
        objectFit: 'cover',
        display: 'block',
        background: '#fff',
        boxShadow: '0 0 0 2px rgba(212,168,67,0.55)', // liseré or (charte)
      }}
    />
  );
}
