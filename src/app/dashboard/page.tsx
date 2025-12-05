import Link from "next/link";
import { Wrench } from "lucide-react";

const tools = [
  {
    id: "material-mapper",
    name: "Material Mapper",
    description: "Map building strategies to material flows and ecosystem services",
    href: "/dashboard/tools/material-mapper",
    status: "available" as const,
  },
  // Future tools can be added here
];

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-10">
        <h1 className="text-xl font-mono text-gray-800 mb-2">Welcome</h1>
        <p className="text-sm font-mono text-gray-500">
          Select a tool to begin exploring ecosystem services.
        </p>
      </header>

      <section>
        <h2 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-4">
          Available Tools
        </h2>

        <div className="grid gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="block p-5 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-500 transition-colors">
                  <Wrench size={20} strokeWidth={1.5} />
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
      </section>
    </div>
  );
}
