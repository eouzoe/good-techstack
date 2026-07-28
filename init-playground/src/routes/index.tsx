import { FeatureList } from '@/components/features/feature-list';
import { TechList } from '@/components/features/tech-list';
import { createFileRoute } from '@tanstack/react-router';

import { loadFeatures, loadTechs } from '../server/data';

const HomePage = () => {
  const { features, techs } = Route.useLoaderData();

  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight">gstack</h1>
      <p className="text-muted-foreground mt-4 text-lg">
        Opinionated full-stack template for shipping products on Cloudflare Workers.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Stack</h2>
        <div className="mt-4">
          <FeatureList features={features} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Techs</h2>
        <div className="mt-4">
          <TechList techs={techs} />
        </div>
      </section>
    </>
  );
};

export const Route = createFileRoute('/')({
  component: HomePage,
  loader: async () => {
    const [features, techs] = await Promise.all([loadFeatures(), loadTechs()]);
    return { features, techs };
  },
});
