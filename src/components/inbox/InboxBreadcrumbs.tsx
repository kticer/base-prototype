type InboxBreadcrumbsProps = {
  path: string[];
  onBreadcrumbClick: (index: number) => void;
};

export default function InboxBreadcrumbs({ path, onBreadcrumbClick }: InboxBreadcrumbsProps) {
  return (
    <div className="text-sm text-gray-600 py-2">
      <span
        onClick={() => onBreadcrumbClick(-1)}
        className="text-blue-600 hover:underline cursor-pointer"
      >
        My Files
      </span>
      {path.map((folder, index) => (
        <span key={index}>
          <span className="mx-1">/</span>
          <span
            onClick={() => onBreadcrumbClick(index)}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            {folder}
          </span>
        </span>
      ))}
    </div>
  );
}