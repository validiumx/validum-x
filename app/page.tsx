import { PresaleContainer } from "@/components/presale-container"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center p-4 md:p-8">
        <PresaleContainer />
      </div>
      <Footer />
    </main>
  )
}
