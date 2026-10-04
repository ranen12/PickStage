
import PageHeader from "@/components/layout/page-header";
export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <section>
      <PageHeader title="공연 목록" />
      {children}
    </section>
  );
}