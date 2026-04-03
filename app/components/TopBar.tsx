import Link from "next/link";

export default function TopBar() {
  return (
    <header className="w-full border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Hot Wheels Catalog
        </span>
        <Link
          href="/"
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-900"
        >
          Add model
        </Link>
      </div>
    </header>
  );
}
