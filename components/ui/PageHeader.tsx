interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({
  title,
  description,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">
        {title}
      </h1>

      {description && (
        <p className="mt-2 text-slate-600">
          {description}
        </p>
      )}
    </div>
  );
}
