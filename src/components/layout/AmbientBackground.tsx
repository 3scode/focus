"use client"

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[1400px] rounded-full opacity-25 animate-float"
        style={{
          background: "radial-gradient(circle, rgba(94,106,210,0.3) 0%, transparent 70%)",
          filter: "blur(150px)",
        }}
      />
      <div
        className="absolute top-[30%] -left-[10%] w-[600px] h-[800px] rounded-full opacity-15 animate-float-delayed"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)",
          filter: "blur(120px)",
        }}
      />
      <div
        className="absolute top-[50%] -right-[10%] w-[500px] h-[700px] rounded-full opacity-12"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
          filter: "blur(100px)",
          animation: "float 9s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-10 animate-pulse-glow"
        style={{
          background: "radial-gradient(circle, rgba(94,106,210,0.15) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />
    </div>
  )
}
