import Link from 'next/link';
import { Fragment } from 'react';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface PageHeaderProps {
  title: string;
  items?: {
    title: string;
  }[];
}

export default function PageHeader({ title, items }: PageHeaderProps) {
  return (
    <div className="px-4 py-6 border-b-1 border-b-gray-200">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<a href="#">Home</a>} />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {items &&
            items.map((item, index) => (
              <Fragment key={index}>
                <BreadcrumbItem>
                  <BreadcrumbPage>{item.title}</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </Fragment>
            ))}
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
