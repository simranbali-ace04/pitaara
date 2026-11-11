import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9F6F0] p-6 text-center text-[#201A16] dark:bg-[#13100E] dark:text-[#ECE4D8]">
      <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">404</h1>
      <p className="mt-3 text-sm text-[#6A5F56] dark:text-[#A69B8D]">
        This keepsake or page could not be found.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl border border-[#C6A664] bg-[#FAF8F4] px-4 py-2 text-xs font-semibold text-[#201A16] shadow-sm hover:bg-[#F4EFEA] dark:border-[#B89352] dark:bg-[#1C1815] dark:text-[#ECE4D8] dark:hover:bg-[#26211C]"
      >
        Return to Pitaara
      </Link>
    </div>
  );
}

