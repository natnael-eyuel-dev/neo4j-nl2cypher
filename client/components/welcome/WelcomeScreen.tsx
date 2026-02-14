'use client';

import React from 'react';
import { DatabaseSelector } from '@/components/database/DatabaseSelector';

export const WelcomeScreen: React.FC = () => {
  return (
    <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Natural Language → Neo4j Cypher
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Pick a database, ask a question in plain English, and get a Cypher query plus results.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Start by selecting a database:
            </div>
            <DatabaseSelector />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                Try questions like
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
                <li>“Show movies directed by Christopher Nolan”</li>
                <li>“Find actors who acted in more than 5 movies”</li>
                <li>“Show departments by employee count”</li>
              </ul>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                What you’ll see
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
                <li>Generated Cypher query</li>
                <li>Table + graph visualization</li>
                <li>Short explanation of the result</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};


