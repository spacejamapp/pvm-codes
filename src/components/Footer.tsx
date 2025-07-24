export function Footer() {
  return (
    <footer className="mt-16 border-t bg-background">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>© 2024 PVM Codes</span>
            <span>•</span>
            <span>PolkaVM Instruction Set Reference</span>
          </div>

          <div className="text-sm text-muted-foreground">
            <a
              href="https://github.com/koute/polkavm"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline"
            >
              PolkaVM Project
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
