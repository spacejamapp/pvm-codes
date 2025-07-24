import { OpcodeTable } from "@/components/OpcodeTable";
import { VersionProvider } from "@/contexts/VersionContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <VersionProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 sm:pt-20 px-4 py-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <OpcodeTable />
          </div>
        </main>
        <Footer />
      </div>
    </VersionProvider>
  );
}
