import { useState } from "react";
import type { FolderItem, FolderOrDocument } from "../../types";
import { FolderIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

type InboxTableProps = {
  items: FolderOrDocument[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  areAllSelected: boolean;
  onFolderClick: (folder: FolderItem) => void;
  onDocumentClick: (id: string) => void;
};

export default function InboxTable({
  items,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  areAllSelected,
  onFolderClick,
  onDocumentClick,
}: InboxTableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-visible w-full">
      <table className="min-w-full text-sm table-fixed">
        <thead className="bg-gray-100 text-gray-800 text-sm font-medium">
          <tr>
            <th className="w-10 px-4">
              <input
                type="checkbox"
                checked={areAllSelected}
                onChange={onToggleSelectAll}
              />
            </th>
            <th className="text-left py-2.5 px-4 font-semibold w-1/3">Title</th>
            <th className="text-left py-2.5 px-4 font-semibold">Author</th>
            <th className="text-left py-2.5 px-4 font-semibold">Similarity</th>
            <th className="text-left py-2.5 px-4 font-semibold">Date Added</th>
            <th className="w-12 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) =>
            item.type === "folder" ? (
              <FolderRow
                key={item.id}
                folder={item}
                selected={selectedIds.has(item.id)}
                onClick={() => onFolderClick(item)}
                onToggleSelect={() => onToggleSelect(item.id)}
              />
            ) : (
              <DocumentRow
                key={item.id}
                doc={item}
                selected={selectedIds.has(item.id)}
                onClick={() => onDocumentClick(item.id)}
                onToggleSelect={() => onToggleSelect(item.id)}
              />
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

function FolderRow({
  folder,
  selected,
  onClick,
  onToggleSelect,
}: {
  folder: FolderItem;
  selected: boolean;
  onClick: () => void;
  onToggleSelect: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <tr className="hover:bg-gray-100 border-b last:border-0">
      <td className="py-3 px-4 text-gray-800 text-sm">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
        />
      </td>
      <td
        className="py-3 px-4 text-gray-800 text-sm font-medium flex items-center gap-2 cursor-pointer hover:underline"
        onClick={onClick}
      >
        <FolderIcon className="w-5 h-5 text-gray-500" />
        {folder.title}
      </td>
      <td className="py-3 px-4 text-gray-800 text-sm"></td>
      <td className="py-3 px-4 text-gray-800 text-sm"></td>
      <td className="py-3 px-4 text-gray-800 text-sm">{folder.dateAdded}</td>
      <td className="relative py-3 px-4 text-gray-800 text-sm flex items-center justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500"
        >
          ⋯
        </button>
        {menuOpen && (
          <div
            className="absolute right-4 top-full mt-2 w-32 bg-white border border-gray-200 shadow-md rounded z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {["Edit", "Move", "Share", "Delete"].map((action) => (
              <button
                key={action}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {action}
              </button>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}

function DocumentRow({
  doc,
  selected,
  onClick,
  onToggleSelect,
}: {
  doc: Extract<FolderOrDocument, { type: "document" }>;
  selected: boolean;
  onClick: () => void;
  onToggleSelect: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const getSimilarityBadge = (value: number) => {
    let color = "bg-blue-500";
    if (value >= 41) color = "bg-red-500";
    else if (value >= 21) color = "bg-yellow-700";

    return (
      <div className="flex items-center gap-2">
        <span className={`w-4 h-4 rounded-sm ${color}`} />
        <span className="text-sm text-gray-800 font-medium">{value}%</span>
      </div>
    );
  };

  return (
    <tr className="hover:bg-gray-100 border-b last:border-0">
      <td className="py-3 px-4 text-gray-800 text-sm">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
        />
      </td>
      <td
        className="py-3 px-4 text-gray-800 text-sm font-medium flex items-center gap-2 cursor-pointer hover:underline"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <DocumentTextIcon className="w-5 h-5 text-gray-500" />
        {doc.title}
      </td>
      <td className="py-3 px-4 text-gray-800 text-sm">{doc.author}</td>
      <td className="py-3 px-4 text-gray-800 text-sm">{getSimilarityBadge(doc.similarity)}</td>
      <td className="py-3 px-4 text-gray-800 text-sm">{doc.dateAdded}</td>
      <td className="relative py-3 px-4 text-gray-800 text-sm flex items-center justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500"
        >
          ⋯
        </button>
        {menuOpen && (
          <div
            className="absolute right-4 top-full mt-2 w-32 bg-white border border-gray-200 shadow-md rounded z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {["Edit", "Move", "Share", "Delete"].map((action) => (
              <button
                key={action}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {action}
              </button>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}