import { Folder } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-10">
        <h1 className="text-xl font-mono text-gray-800 mb-2">Projects</h1>
        <p className="text-sm font-mono text-gray-500">
          Save and organize your explorations.
        </p>
      </header>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Folder size={28} className="text-gray-400" strokeWidth={1.5} />
        </div>
        <p className="font-mono text-gray-500 mb-2">No projects yet</p>
        <p className="text-sm font-mono text-gray-400">
          Projects will appear here when you save your work.
        </p>
      </div>
    </div>
  );
}
