export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-black/[.08] dark:border-white/[.12] mt-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 text-xs text-black/60 dark:text-white/60 flex items-center justify-between">
        <span>IdeaDock</span>
        <span>© {year}</span>
      </div>
    </footer>
  );
}
