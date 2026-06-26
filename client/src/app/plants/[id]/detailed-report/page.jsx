import DetailedReportPageClient from './DetailedReportPageClient';

export function generateStaticParams() {
  return [{ id: '1' }];
}

export default function Page({ params }) {
  return <DetailedReportPageClient params={params} />;
}