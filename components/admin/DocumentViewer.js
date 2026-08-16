'use client';

import { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

export default function DocumentViewer({ document, onClose }) {
  const [zoom, setZoom] = useState(1);

  if (!document) return null;

  const { url, title, type } = document;
  const isPdf = type === 'pdf' || url?.toLowerCase().endsWith('.pdf');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = title || 'document';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full h-full max-w-7xl max-h-screen p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 bg-white rounded-t-lg px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center gap-2">
            {!isPdf && (
              <>
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600 min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="bg-white rounded-b-lg overflow-auto" style={{ height: 'calc(100% - 80px)' }}>
          {isPdf ? (
            <iframe
              src={url}
              className="w-full h-full"
              title={title}
            />
          ) : (
            <div className="flex items-center justify-center p-8 h-full overflow-auto">
              <img
                src={url}
                alt={title}
                className="max-w-full h-auto transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
