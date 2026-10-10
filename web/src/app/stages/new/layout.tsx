
import PageHeader from "@/components/layout/page-header";
export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <>
      <PageHeader title="공연 등록" />
      {children}
    </>
  );
}