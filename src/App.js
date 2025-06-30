import './App.css';
import { useState } from 'react';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isValidResourcePack, setIsValidResourcePack] = useState(false);

  const scanZipFile = async (file) => {
    setIsScanning(true);
    setIsValidResourcePack(false);
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(file);
      
      // Check if pack.mcmeta exists in the zip
      const hasPackMcmeta = zipContents.file('pack.mcmeta') !== null;
      setIsValidResourcePack(hasPackMcmeta);
    } catch (error) {
      console.error('Error scanning zip file:', error);
      setIsValidResourcePack(false);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      scanZipFile(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      scanZipFile(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleConvert = () => {
    if (selectedFile && isValidResourcePack) {
      alert(`Converting ${selectedFile.name}...`);
      // TODO: Add conversion logic here
    }
  };

  const getValidationMessage = () => {
    if (isScanning) {
      return "Scanning file for pack.mcmeta...";
    }
    if (selectedFile && !isScanning) {
      return isValidResourcePack 
        ? "✅ Valid Java Edition resource pack detected!"
        : "❌ Invalid resource pack - pack.mcmeta not found";
    }
    return "";
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="App-title">Resource Pack Converter</h1>
      </header>
      <main className="App-main">
        <div className="upload-section">
          <div 
            className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              id="file-input"
              className="file-input"
              onChange={handleFileSelect}
              accept=".zip"
            />
            <label htmlFor="file-input" className="upload-label">
              <div className="upload-content">
                <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="upload-text">
                  {selectedFile ? selectedFile.name : 'Drop your resource pack here or click to browse'}
                </p>
                <p className="upload-subtext">
                  Supports .zip files (Java Edition resource packs)
                </p>
              </div>
            </label>
          </div>
          
          {selectedFile && (
            <div className="file-info">
              <h3>Selected File:</h3>
              <p><strong>Name:</strong> {selectedFile.name}</p>
              <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              <p><strong>Type:</strong> {selectedFile.type || 'Unknown'}</p>
              
              {getValidationMessage() && (
                <div className={`validation-message ${isScanning ? 'scanning' : isValidResourcePack ? 'valid' : 'invalid'}`}>
                  {getValidationMessage()}
                </div>
              )}
              
              <button 
                className={`convert-button ${isValidResourcePack && !isScanning ? 'enabled' : 'disabled'}`}
                onClick={handleConvert}
                disabled={!isValidResourcePack || isScanning}
              >
                {isScanning ? 'Scanning...' : 'Convert Resource Pack'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
