import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, Sparkles, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import api from '../utils/api';

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

export default function OCRUpload() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Editable extracted fields
  const [fields, setFields] = useState({
    vendor_name: '', invoice_number: '', date: '', total: '', description: ''
  });

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const runOCR = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('document', file);
      const { data } = await api.post('/ocr/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000 // OCR can take a while
      });

      setResult(data.extracted);
      setFields({
        vendor_name: data.extracted.vendor_name || '',
        invoice_number: data.extracted.invoice_number || '',
        date: data.extracted.date || '',
        total: data.extracted.total || '',
        description: data.extracted.description || ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'OCR processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    setFields({ vendor_name: '', invoice_number: '', date: '', total: '', description: '' });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="text-primary" size={24} />
          OCR Document Scanner
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Upload a vendor bill or invoice — PDFs extract instantly, images are scanned with OCR</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Zone */}
        <div className="space-y-4">
          <div
            className={clsx(
              'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
              dragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-gray-200 bg-white hover:border-primary/40 hover:bg-slate-50'
            )}
            onClick={() => fileRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
          >
            <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf" onChange={e => handleFile(e.target.files[0])} />

            {file ? (
              <div className="space-y-3">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                  <FileText size={28} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mx-auto">
                  <Upload size={28} className="text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-700">Drop a document here</p>
                  <p className="text-xs text-slate-400 mt-1">or click to browse · JPG, PNG, PDF up to 10 MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <img src={preview} alt="Preview" className="w-full max-h-60 object-contain bg-slate-50" />
              <button onClick={clear} className="absolute top-2 right-2 p-1 bg-white rounded-full shadow border border-gray-200 hover:bg-red-50 transition-colors">
                <X size={14} className="text-slate-500" />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={runOCR}
              disabled={!file || loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <><Loader size={16} className="animate-spin" /> Scanning document...</>
              ) : (
                <><Sparkles size={16} /> Extract Data</>
              )}
            </button>
            {file && (
              <button onClick={clear} className="px-4 py-2.5 border border-gray-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                Clear
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-lg">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Supported formats info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-xs text-amber-700 font-medium mb-1">💡 Tips for best results</p>
            <ul className="text-xs text-amber-600 space-y-0.5">
              <li>• <strong>PDF bills</strong> — text extracted instantly, no OCR needed</li>
              <li>• <strong>Image bills</strong> — use clear, high-res photos (300+ DPI)</li>
              <li>• Ensure text is horizontal and well-lit</li>
              <li>• You can always edit the extracted fields before creating a bill</li>
            </ul>
          </div>
        </div>

        {/* Extracted Data */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              {result ? (
                <CheckCircle size={18} className="text-green-500" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
              )}
              <h2 className="font-semibold text-slate-800">
                {result ? 'Extracted Data' : 'Waiting for scan...'}
              </h2>
              {result && <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">Review & Edit</span>}
            </div>

            {result ? (
              <div className="space-y-3">
                <Field label="Vendor Name">
                  <input value={fields.vendor_name} onChange={e => setFields({ ...fields, vendor_name: e.target.value })} className={inputCls} placeholder="Vendor not detected" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Invoice / Reference No.">
                    <input value={fields.invoice_number} onChange={e => setFields({ ...fields, invoice_number: e.target.value })} className={inputCls} placeholder="INV-XXXX" />
                  </Field>
                  <Field label="Date">
                    <input value={fields.date} onChange={e => setFields({ ...fields, date: e.target.value })} className={inputCls} placeholder="DD/MM/YYYY" />
                  </Field>
                </div>
                <Field label="Total Amount">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input type="number" step="0.01" value={fields.total} onChange={e => setFields({ ...fields, total: e.target.value })} className={clsx(inputCls, 'pl-7')} placeholder="0.00" />
                  </div>
                </Field>
                <Field label="Description">
                  <textarea value={fields.description} onChange={e => setFields({ ...fields, description: e.target.value })} className={clsx(inputCls, 'resize-none')} rows={2} placeholder="Extracted description..." />
                </Field>

                {/* Raw text collapsible */}
                <details className="group">
                  <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 list-none flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                    Show raw OCR text
                  </summary>
                  <div className="mt-2 bg-slate-50 rounded-lg p-3 text-xs text-slate-500 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto border border-gray-200">
                    {result.raw_text || 'No text extracted'}
                  </div>
                </details>

                <div className="pt-2 border-t border-gray-100">
                  <button
                    onClick={() => navigate('/purchases', { state: { prefill: fields } })}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary/90 transition-colors"
                  >
                    Create Vendor Bill with this data
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {['Vendor Name', 'Invoice No.', 'Date', 'Total Amount', 'Description'].map(label => (
                  <div key={label} className="space-y-1">
                    <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                    <div className="h-9 bg-slate-50 border border-gray-100 rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
