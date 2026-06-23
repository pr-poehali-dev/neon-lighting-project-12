import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Featured from "@/components/Featured";
import Promo from "@/components/Promo";
import Footer from "@/components/Footer";
import ProfileForm from "@/components/ProfileForm";

const Index = () => {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <main className="min-h-screen">
      <Header />
      <Hero onOpenForm={() => setFormOpen(true)} />
      <Featured />
      <Promo />
      <Footer />
      {formOpen && <ProfileForm onClose={() => setFormOpen(false)} />}
    </main>
  );
};

export default Index;
