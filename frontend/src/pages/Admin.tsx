import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { fetchFeedback, fetchFeedbackStats } from '../lib/api';
import type { Feedback, Sentiment } from '../lib/types';

const columnHelper = createColumnHelper<Feedback>();

const columns = [
  columnHelper.accessor('id', {
    header: 'ID',
    cell: info => info.getValue()
  }),
  columnHelper.accessor('text', {
    header: 'Feedback',
    cell: info => (
      <div className="max-w-md truncate" title={info.getValue()}>
        {info.getValue()}
      </div>
    )
  }),
  columnHelper.accessor('sentiment', {
    header: 'Sentiment',
    cell: info => {
      const sentiment = info.getValue();
      const colors = {
        GOOD: 'bg-green-100 text-green-800',
        BAD: 'bg-red-100 text-red-800',
        NEUTRAL: 'bg-yellow-100 text-yellow-800'
      };
      return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[sentiment]}`}>{sentiment}</span>;
    }
  }),
  columnHelper.accessor('confidenceScore', {
    header: 'Confidence',
    cell: info => `${(parseFloat(info.getValue()) * 100).toFixed(1)}%`
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: info => new Date(info.getValue()).toLocaleString()
  })
];

export default function Admin() {
  const [page, setPage] = useState(0);
  const [sentimentFilter, setSentimentFilter] = useState<Sentiment | undefined>();
  const pageSize = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['feedback', page, sentimentFilter],
    queryFn: () =>
      fetchFeedback({
        limit: pageSize,
        offset: page * pageSize,
        sentiment: sentimentFilter
      })
  });

  const { data: stats } = useQuery({
    queryKey: ['feedbackStats'],
    queryFn: fetchFeedbackStats
  });

  // TanStack React Table v8 is fully compatible with React 19
  // The ESLint rule hasn't been updated yet - this is a false positive
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data?.feedback ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data ? Math.ceil(data.total / pageSize) : 0
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">View and analyze customer feedback</p>
          <a href="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mt-2 inline-block">
            ← Back to Feedback Form
          </a>
        </div>

        {stats && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Feedback</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">{stats.good}</p>
                <p className="text-sm text-gray-600">Good</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">{stats.bad}</p>
                <p className="text-sm text-gray-600">Bad</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-600">{stats.neutral}</p>
                <p className="text-sm text-gray-600">Neutral</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSentimentFilter(undefined);
                setPage(0);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sentimentFilter === undefined
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setSentimentFilter('GOOD');
                setPage(0);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sentimentFilter === 'GOOD' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Good
            </button>
            <button
              onClick={() => {
                setSentimentFilter('BAD');
                setPage(0);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sentimentFilter === 'BAD' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Bad
            </button>
            <button
              onClick={() => {
                setSentimentFilter('NEUTRAL');
                setPage(0);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sentimentFilter === 'NEUTRAL'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Neutral
            </button>
          </div>
        </div>

        {isLoading && <div className="text-center py-8">Loading feedback...</div>}
        {error && <div className="text-red-600 text-center py-8">Error loading feedback</div>}

        {data && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, data.total)} of {data.total} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="px-4 py-2 text-sm text-gray-700">
                  Page {page + 1} of {totalPages || 1}
                </div>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
