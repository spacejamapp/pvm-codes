export function Footer() {
  return (
    <footer className="mt-16 border-t bg-background">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-2 sm:space-x-4 text-sm text-muted-foreground min-w-0 flex-1">
          <span>© 2024 PVM Codes</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">
            PolkaVM Instruction Set Reference
          </span>
        </div>

        <div className="flex items-center space-x-4 text-sm text-muted-foreground min-w-0 flex-1 justify-end">
          <a
            href="https://github.com/koute/polkavm"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            PolkaVM
          </a>
        </div>
      </div>
    </footer>
  );
}
