import Link from "next/link";
import { Network } from "lucide-react";

const tools = [
  {
    id: "material-mapper",
    name: "Material Mapper",
    description: "Describe a building strategy and discover the materials, flows, and ecosystem service connections.",
    href: "/dashboard/tools/material-mapper",
    status: "available" as const,
  },
];

export default function ToolsPage() {
  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-10">
        <h1 className="text-xl font-mono text-gray-800 mb-2">Tools</h1>
        <p className="text-sm font-mono text-gray-500">
          Ecosystem services exploration tools.
        </p>
      </header>

      <div className="grid gap-4">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            className="block p-5 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-500 transition-colors">
                <Network size={20} strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="font-mono text-gray-800 mb-1">{tool.name}</h3>
                <p className="text-sm font-mono text-gray-500">
                  {tool.description}
                </p>
              </div>
              <span className="text-xs font-mono text-gray-400 px-2 py-1 bg-gray-100 rounded">
                {tool.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
