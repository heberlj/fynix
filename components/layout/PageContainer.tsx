export function PageContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-6 p-4 sm:gap-8 sm:p-6 lg:p-8 ${className}`}
    >
      {children}
    </div>
  );
}
