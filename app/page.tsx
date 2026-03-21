export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-green-50 dark:bg-[#020402]">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold mb-4 text-green-900 dark:text-green-100">
          AuditIA 🚀
        </h1>
        <p className="text-xl text-green-700 dark:text-green-300 mb-8 max-w-2xl">
          Tu AI Product Manager para análisis automático de UX, Performance, Accesibilidad y SEO
        </p>
        <div className="space-y-4">
          <p className="text-lg text-green-600 dark:text-green-400">
            Introduce una URL y deja que la IA te ayude a mejorar tu web
          </p>
          <button className="px-8 py-3 bg-green-600 dark:bg-green-500 text-white rounded-lg font-semibold hover:bg-green-700 dark:hover:bg-green-600 transition-colors">
            Comenzar Análisis
          </button>
        </div>
      </div>
    </main>
  );
}
