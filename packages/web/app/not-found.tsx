import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tightest uppercase">404</h1>
      <p className="mt-3 text-[13px] tracking-widish uppercase text-muted-foreground">
        Page not found.
      </p>
      <Link href="/" className="mt-8 text-[12px] tracking-widish uppercase underline">
        ← Home
      </Link>
    </main>
  );
}
