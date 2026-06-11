import { useState, useRef } from 'react';

export default function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | compressing | done | error
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadName, setDownloadName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (!selected) return;
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFile(selected);
    setStatus('idle');
    setDownloadUrl(null);
    setErrorMsg('');
  }

  async function handleCompress() {
    if (!file) return;
    setStatus('compressing');
    setDownloadUrl(null);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/compress', { method: 'POST', body: formData });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Server error');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(file.name.replace(/\.[^.]+$/, '') + '.zip');
      setStatus('done');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  }

  return (
    <div className="container">
      <h1>File Compressor</h1>
      <p className="subtitle">ZIP compression &mdash; up to 100 MB</p>

      <div className="drop-zone" onClick={() => inputRef.current.click()}>
        {file ? (
          <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
        ) : (
          <span>Click to select a file</span>
        )}
        <input
          ref={inputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <button
        className="compress-btn"
        onClick={handleCompress}
        disabled={!file || status === 'compressing'}
      >
        {status === 'compressing' ? 'Compressing...' : 'Compress'}
      </button>

      {status === 'done' && (
        <a className="download-link" href={downloadUrl} download={downloadName}>
          Download {downloadName}
        </a>
      )}

      {status === 'error' && (
        <p className="error">{errorMsg}</p>
      )}
    </div>
  );
}
