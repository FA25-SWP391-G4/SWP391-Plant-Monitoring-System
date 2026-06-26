import PlantDetailPageClient from './PlantDetailPageClient';

export function generateStaticParams() {
  return [{ id: [] }];
}

export default function Page({ params }) {
  return <PlantDetailPageClient params={params} />;
}
