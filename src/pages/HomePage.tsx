import HeroBanner from "@/components/store/home/HeroBanner";
import CategoryStrip from "@/components/store/home/CategoryStrip";
import FeaturedGrid from "@/components/store/home/FeaturedGrid";
import PillarsBar from "@/components/store/home/PillarsBar";
import EditorialBlock from "@/components/store/home/EditorialBlock";
import NewsletterBlock from "@/components/store/home/NewsletterBlock";

const HomePage = () => {
  return (
    <>
      <HeroBanner />
      <CategoryStrip />
      <FeaturedGrid
        eyebrow="Mais desejadas"
        title="Selecionadas pra você"
        subtitle="As peças que mais saem da casa este mês — escolhidas a dedo pela curadoria."
        featuredOnly
        limit={8}
      />
      <PillarsBar />
      <EditorialBlock />
      <FeaturedGrid
        eyebrow="Acabou de chegar"
        title="Novidades"
        featuredOnly={false}
        limit={4}
        showSeeAll={false}
      />
      <NewsletterBlock />
    </>
  );
};

export default HomePage;
