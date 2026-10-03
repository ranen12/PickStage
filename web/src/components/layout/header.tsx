import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
        >
          PickStage
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <Link
            href="/stages"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            공연
          </Link>

          <Link
            href="/reservations"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            예매 내역 조회
          </Link>
        </nav>
      </div>
    </header>
  );
}
