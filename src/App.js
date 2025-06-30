import './App.css';
import { useState, useEffect } from 'react';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isValidResourcePack, setIsValidResourcePack] = useState(false);
  const [packVersion, setPackVersion] = useState('');
  const [originalPackVersion, setOriginalPackVersion] = useState('');
  const [originalGameLabel, setOriginalGameLabel] = useState('');
  const [selectedGameVersion, setSelectedGameVersion] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStep, setConversionStep] = useState('');
  const [convertedFileBlob, setConvertedFileBlob] = useState(null);
  const [convertedFileName, setConvertedFileName] = useState('');
  // Bulk mode state – allows converting to a range of versions in one go
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkStartVersion, setBulkStartVersion] = useState('');
  const [bulkEndVersion, setBulkEndVersion] = useState('');
  // Smart file naming switch
  const [isSmartNaming, setIsSmartNaming] = useState(false);

  // Dynamically fetched version→pack_format map
  const [gameVersionToPackFormat, setGameVersionToPackFormat] = useState({});
  const [releaseList, setReleaseList] = useState([]); // releases only
  const [snapshotList, setSnapshotList] = useState([]); // dev snapshots
  const [gameVersions, setGameVersions] = useState([]); // currently shown in dropdown
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [latestPackVersion, setLatestPackVersion] = useState(0);
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);

  // Fetch Resource-pack format table from the Minecraft Wiki every time the app loads
  useEffect(() => {
    const fetchPackFormats = async () => {
      setIsLoadingVersions(true);
      try {
        // Fetch only the "List of resource pack formats" section via the MediaWiki API – CORS-friendly
        const apiUrl = 'https://minecraft.wiki/api.php?action=parse&page=Pack_format&prop=text&section=2&formatversion=2&format=json';
        const res = await fetch(apiUrl);
        const data = await res.json();
        const sectionHtml = data.parse?.text || '';

        const parser = new DOMParser();
        const doc = parser.parseFromString(sectionHtml, 'text/html');

        const resourceTable = doc.querySelector('table'); // the first table in section is the formats

        if (!resourceTable) throw new Error('Resource-pack format table not found');

        // Build mapping of display label → pack_format (keep ranges like "1.20.x" intact)
        const mapping = {};
        const releasesTmp = new Set();
        const snapshotsTmp = new Set();
        let maxPackFmt = 0;

        const rows = resourceTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('th, td');
          if (cells.length < 3) return;

          const packFmtVal = parseInt(cells[0].textContent.trim());
          if (isNaN(packFmtVal)) return;

          maxPackFmt = Math.max(maxPackFmt, packFmtVal);

          // Releases column – already human-readable with ranges (e.g. "1.20.x–1.20.1")
          const releasesText = cells[2].textContent.trim().replace(/\u2013|\u2014|–|—/g, '-');

          releasesText.split(',').forEach(segment => {
            const label = segment.trim();
            if (!label || /^[-–—]$/.test(label)) return;
            mapping[label] = packFmtVal;
            releasesTmp.add(label);
          });

          // DEV column processing (snapshot versions)
          const devText = cells[1]?.textContent?.trim() || '';
          if (devText && !/^[-–—]$/.test(devText)) {
            const devClean = devText.replace(/\u2013|\u2014|–|—/g, '-');
            devClean.split(',').forEach(seg => {
              const devLabel = seg.trim();
              if (!devLabel) return;
              mapping[devLabel] = packFmtVal;
              snapshotsTmp.add(devLabel);
            });
          }
        });

        // Sort by pack_format desc then alphabetic
        const sortFn = (a, b) => {
          const diff = mapping[b] - mapping[a];
          if (diff !== 0) return diff;
          return a.localeCompare(b);
        };
        const releaseSorted = Array.from(releasesTmp).sort(sortFn);
        const snapshotSorted = Array.from(snapshotsTmp).sort(sortFn);

        setReleaseList(releaseSorted);
        setSnapshotList(snapshotSorted);

        setGameVersionToPackFormat(mapping);
        setGameVersions(releaseSorted);
        setLatestPackVersion(maxPackFmt);
      } catch (err) {
        console.error('Unable to fetch pack formats:', err);
      } finally {
        setIsLoadingVersions(false);
      }
    };

    fetchPackFormats();
  }, []);

  // When mapping loads, pick default latest version for dropdown convenience
  useEffect(() => {
    // Update dropdown list when toggle changes
    if (!isLoadingVersions) {
      const list = showSnapshots ? [...releaseList, ...snapshotList] : releaseList;
      setGameVersions(list);
    }
  }, [showSnapshots, releaseList, snapshotList, isLoadingVersions]);

  useEffect(() => {
    if (!isLoadingVersions && gameVersions.length) {
      // If previously selected version not in list, reset
      if (!gameVersions.includes(selectedGameVersion)) {
        const latest = gameVersions[0];
        setSelectedGameVersion(latest);
        setPackVersion(gameVersionToPackFormat[latest]?.toString() || '');
      }
    }
  }, [gameVersions, isLoadingVersions]);

  // When we have original pack version and mapping, derive a representative game version label
  useEffect(() => {
    if (originalPackVersion && Object.keys(gameVersionToPackFormat).length) {
      const label = Object.keys(gameVersionToPackFormat).find(
        (k) => gameVersionToPackFormat[k] === parseInt(originalPackVersion)
      );
      setOriginalGameLabel(label || '');
    } else {
      setOriginalGameLabel('');
    }
  }, [originalPackVersion, gameVersionToPackFormat]);

  const MIN_PACK_VERSION = 1;

  const isValidPackVersion = (version) => {
    const num = parseInt(version);
    return !isNaN(num) && num >= MIN_PACK_VERSION && num <= latestPackVersion;
  };

  const canConvert = () => {
    if (!isValidResourcePack || isScanning || isConverting) return false;
    if (isBulkMode) {
      return bulkStartVersion && bulkEndVersion;
    }
    if (isSmartNaming) {
      // If smart naming has more than one detected version string, block convert
      const originalName = selectedFile?.name || '';
      if (detectVersionStrings(originalName).length > 1) return false;
    }
    return packVersion && isValidPackVersion(packVersion);
  };

  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    if (convertedFileBlob && convertedFileName) {
      downloadFile(convertedFileBlob, convertedFileName);
      // Clear the converted file data after download
      setConvertedFileBlob(null);
      setConvertedFileName('');
    }
  };

  const scanZipFile = async (file) => {
    setIsScanning(true);
    setIsValidResourcePack(false);
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(file);
      
      // Check if pack.mcmeta exists in the zip
      const mcmetaFile = zipContents.file('pack.mcmeta');
      const hasPackMcmeta = mcmetaFile !== null;
      setIsValidResourcePack(hasPackMcmeta);

      if (hasPackMcmeta) {
        try {
          const mcmetaStr = await mcmetaFile.async('string');
          const mcmetaJson = JSON.parse(mcmetaStr);
          const fmt = mcmetaJson?.pack?.pack_format;
          if (typeof fmt !== 'undefined') {
            setOriginalPackVersion(fmt.toString());
          } else {
            setOriginalPackVersion('');
          }
        } catch {
          setOriginalPackVersion('');
        }
      } else {
        setOriginalPackVersion('');
      }
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
      setConvertedFileBlob(null);
      setConvertedFileName('');
      scanZipFile(file);
    }
  };





  const handleGameVersionChange = (event) => {
    const selectedVersion = event.target.value;
    setSelectedGameVersion(selectedVersion);
    
    if (selectedVersion && gameVersionToPackFormat[selectedVersion]) {
      setPackVersion(gameVersionToPackFormat[selectedVersion].toString());
    } else {
      setPackVersion('');
    }
  };

  const handlePackVersionChange = (event) => {
    setPackVersion(event.target.value);
    // Clear game version selection if user manually enters pack version
    if (selectedGameVersion) {
      setSelectedGameVersion('');
    }
  };

  // Handlers for bulk mode version range
  const handleBulkStartChange = (event) => {
    setBulkStartVersion(event.target.value);
  };

  const handleBulkEndChange = (event) => {
    setBulkEndVersion(event.target.value);
  };

  // When toggling bulk mode, reset conflicting inputs
  useEffect(() => {
    if (isBulkMode) {
      // Clear single-target selections when entering bulk mode
      setSelectedGameVersion('');
      setPackVersion('');
    } else {
      // Clear bulk selections when exiting bulk mode
      setBulkStartVersion('');
      setBulkEndVersion('');
    }
  }, [isBulkMode]);

  // Add global drag and drop event listeners
  useEffect(() => {
    const handleGlobalDragOver = (event) => {
      event.preventDefault();
      setIsDragOver(true);
    };

    const handleGlobalDragLeave = (event) => {
      // Only hide drag-over state when leaving the entire window
      if (event.clientX === 0 || event.clientY === 0 || 
          event.clientX === window.innerWidth || event.clientY === window.innerHeight) {
        setIsDragOver(false);
      }
    };

    const handleGlobalDrop = (event) => {
      event.preventDefault();
      setIsDragOver(false);
      
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        setSelectedFile(files[0]);
        setConvertedFileBlob(null);
        setConvertedFileName('');
        scanZipFile(files[0]);
      }
    };

    // Add event listeners to document
    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('dragleave', handleGlobalDragLeave);
    document.addEventListener('drop', handleGlobalDrop);

    // Cleanup event listeners on unmount
    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('dragleave', handleGlobalDragLeave);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  const handleConvert = async () => {
    if (!canConvert()) return;

    setIsConverting(true);

    try {
      const JSZip = (await import('jszip')).default;

      // Validate smart naming multiple detections upfront
      if (isSmartNaming) {
        const detected = detectVersionStrings(selectedFile.name);
        if (detected.length > 1) {
          throw new Error('Smart Naming Error: Multiple Minecraft version names detected in filename.');
        }
      }

      if (isBulkMode) {
        setConversionStep('Loading resource pack...');

        // Load original pack once
        const baseZip = new JSZip();
        const originalContents = await baseZip.loadAsync(selectedFile);

        const mcmetaFile = originalContents.file('pack.mcmeta');
        if (!mcmetaFile) throw new Error('pack.mcmeta file not found');
        const mcmetaContent = await mcmetaFile.async('string');
        const packDataOriginal = JSON.parse(mcmetaContent);

        // Determine selected range (inclusive)
        const startIdx = gameVersions.indexOf(bulkStartVersion);
        const endIdx = gameVersions.indexOf(bulkEndVersion);
        if (startIdx === -1 || endIdx === -1) throw new Error('Invalid bulk version range');
        const [from, to] = startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        const range = gameVersions.slice(from, to + 1);

        const bulkZip = new JSZip();
        const originalName = selectedFile.name.replace(/\.zip$/, '');

        const oldestVersionLabel = range[range.length - 1]; // gameVersions sorted newest→oldest

        for (const versionLabel of range) {
          const packFmt = gameVersionToPackFormat[versionLabel];
          if (typeof packFmt === 'undefined') continue;

          setConversionStep(`Converting → ${versionLabel}...`);

          // Deep copy original packData
          const updatedPackData = {
            ...packDataOriginal,
            pack: {
              ...packDataOriginal.pack,
              pack_format: packFmt,
            },
          };

          const updatedMcmeta = JSON.stringify(updatedPackData, null, 2);

          const newZip = new JSZip();

          // Copy files from original pack (excluding pack.mcmeta)
          const copyPromises = [];
          originalContents.forEach((relPath, file) => {
            if (relPath !== 'pack.mcmeta' && !file.dir) {
              copyPromises.push(
                file.async('blob').then((blob) => {
                  newZip.file(relPath, blob);
                })
              );
            } else if (file.dir) {
              newZip.folder(relPath);
            }
          });
          await Promise.all(copyPromises);

          // Add updated pack.mcmeta
          newZip.file('pack.mcmeta', updatedMcmeta);

          const newZipBlob = await newZip.generateAsync({ type: 'blob' });
          let childName;
          if (isSmartNaming) {
            const detected = detectVersionStrings(originalName);
            if (detected.length === 1) {
              const replacement = getBaseVersion(versionLabel);
              childName = `${originalName.replace(detected[0], replacement)}.zip`;
            } else {
              childName = `${originalName}_MC${getBaseVersion(versionLabel)}.zip`;
            }
          } else {
            childName = `${originalName}_MC${getBaseVersion(versionLabel)}.zip`;
          }
          bulkZip.file(childName, newZipBlob);
        }

        setConversionStep('Packaging bulk download...');
        const bulkBlob = await bulkZip.generateAsync({ type: 'blob' });
        const bulkFileName = isSmartNaming && detectVersionStrings(originalName).length === 1
          ? `${originalName.replace(detectVersionStrings(originalName)[0], getBaseVersion(oldestVersionLabel))}_bulk.zip`
          : `${originalName}_bulk.zip`;

        setConversionStep('Conversion complete!');
        setConvertedFileBlob(bulkBlob);
        setConvertedFileName(bulkFileName);

        setTimeout(() => {
          setConversionStep('');
          setIsConverting(false);
        }, 2000);
      } else {
        /* ---------- Single-version convert (existing logic) ---------- */
        setConversionStep('Loading resource pack...');
        const zip = new JSZip();
        const zipContents = await zip.loadAsync(selectedFile);

        setConversionStep('Reading pack.mcmeta file...');
        const packMcmetaFile = zipContents.file('pack.mcmeta');
        if (!packMcmetaFile) {
          throw new Error('pack.mcmeta file not found');
        }

        const packMcmetaContent = await packMcmetaFile.async('string');

        setConversionStep('Updating pack format version...');
        const packData = JSON.parse(packMcmetaContent);
        if (!packData.pack || typeof packData.pack.pack_format === 'undefined') {
          throw new Error('Invalid pack.mcmeta format');
        }

        packData.pack.pack_format = parseInt(packVersion);
        const updatedMcmetaContent = JSON.stringify(packData, null, 2);

        setConversionStep('Creating new resource pack...');
        const newZip = new JSZip();

        const filePromises = [];
        zipContents.forEach((relativePath, file) => {
          if (relativePath !== 'pack.mcmeta' && !file.dir) {
            filePromises.push(
              file.async('blob').then((blob) => {
                newZip.file(relativePath, blob);
              })
            );
          } else if (file.dir) {
            newZip.folder(relativePath);
          }
        });
        await Promise.all(filePromises);
        newZip.file('pack.mcmeta', updatedMcmetaContent);

        setConversionStep('Generating download...');
        const newZipBlob = await newZip.generateAsync({ type: 'blob' });

        const originalName = selectedFile.name.replace(/\.zip$/, '');

        let newFileName;
        if (isSmartNaming) {
          const detected = detectVersionStrings(originalName);
          const replacement = selectedGameVersion ? getBaseVersion(selectedGameVersion) : null;
          if (detected.length === 1 && replacement) {
            newFileName = `${originalName.replace(detected[0], replacement)}.zip`;
          } else {
            const versionSuffix = selectedGameVersion ? `_MC${getBaseVersion(selectedGameVersion)}` : `_v${packVersion}`;
            newFileName = `${originalName}${versionSuffix}.zip`;
          }
        } else {
          const versionSuffix = selectedGameVersion ? `_MC${getBaseVersion(selectedGameVersion)}` : `_v${packVersion}`;
          newFileName = `${originalName}${versionSuffix}.zip`;
        }

        setConversionStep('Conversion complete!');
        setConvertedFileBlob(newZipBlob);
        setConvertedFileName(newFileName);

        setTimeout(() => {
          setConversionStep('');
          setIsConverting(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Conversion error:', error);
      setConversionStep(error.message || 'Error during conversion');
      setTimeout(() => {
        setConversionStep('');
        setIsConverting(false);
      }, 3000);
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

  /* ---------------- Helper for smart naming ---------------- */
  // Detect version strings (1.6 and later) in a filename (without regex false positives like 1.2.3)
  const versionPattern = /1\.(\d{1,2})(?:\.(\d{1,2}))?/g; // matches 1.xx or 1.xx.yy

  const detectVersionStrings = (filename) => {
    const matches = [];
    let m;
    while ((m = versionPattern.exec(filename)) !== null) {
      const minor = parseInt(m[1], 10);
      if (minor >= 6) {
        // Valid 1.6+
        let ver = `1.${m[1]}`;
        if (typeof m[2] !== 'undefined') ver += `.${m[2]}`;
        matches.push(ver);
      }
    }
    return [...new Set(matches)]; // unique
  };

  // Derive the base (oldest) version string from a label (e.g. "1.14 - 1.15" → "1.14")
  const getBaseVersion = (label) => {
    if (!label) return label;
    // Remove whitespace then split on dash
    const cleaned = label.replace(/\s+/g, '');
    return cleaned.split('-')[0];
  };

  return (
    <div className="App">
      {isDragOver && (
        <div className="drag-overlay">
          <div className="drag-overlay-content">
            <svg className="drag-overlay-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="drag-overlay-text">Drop your resource pack anywhere!</p>
          </div>
        </div>
      )}
      <header className="App-header">
        <h1 className="App-title">Resource Pack Converter</h1>
      </header>
      <main className="App-main">
        <div className="upload-section">
          <div 
            className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
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
                  {selectedFile ? selectedFile.name : 'Drop your resource pack anywhere on the page or click to browse'}
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
              <p><strong>Pack:</strong> {originalPackVersion ? `format ${originalPackVersion}, game version ${originalGameLabel || 'Unknown'}` : 'Unknown'}</p>
              
              {getValidationMessage() && (
                <div className={`validation-message ${isScanning ? 'scanning' : isValidResourcePack ? 'valid' : 'invalid'}`}>
                  {getValidationMessage()}
                </div>
              )}
              
              {isConverting && conversionStep && (
                <div className="validation-message converting">
                  🔄 {conversionStep}
                </div>
              )}
              
              {convertedFileBlob && (
                <div className="download-section">
                  <button 
                    className="convert-button enabled"
                    onClick={handleDownload}
                  >
                    <svg className="download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 3v12" />
                    </svg>
                    Download Converted Pack
                  </button>
                </div>
              )}
              
              {isValidResourcePack && (
                <div className="version-input-section">
                  {/* Bulk Mode Switch */}
                  <div className="version-selection-group bulk-mode-toggle">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={isBulkMode}
                        onChange={(e) => setIsBulkMode(e.target.checked)}
                      />
                      <span className="slider" />
                    </label>
                    <span className="switch-label">Bulk Mode</span>
                    <span className="switch-desc">Convert to a range of versions and zip them together</span>
                  </div>

                  {/* Smart naming switch */}
                  <div className="version-selection-group bulk-mode-toggle">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={isSmartNaming}
                        onChange={(e) => setIsSmartNaming(e.target.checked)}
                      />
                      <span className="slider" />
                    </label>
                    <span className="switch-label">Smart File Naming</span>
                    <span className="switch-desc">Rename output files by replacing detected version with target version (ranges use older version)</span>
                  </div>

                  {/* Snapshot toggle remains */}
                  <div className="version-selection-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={showSnapshots}
                        onChange={e => setShowSnapshots(e.target.checked)}
                      />{' '}
                      Include snapshots
                    </label>
                  </div>

                  {/* Single-version Inputs */}
                  {!isBulkMode && (
                    <>
                      <div className="version-selection-group">
                        <label htmlFor="game-version" className="version-label">
                          Target Minecraft Version:
                        </label>
                        <select
                          id="game-version"
                          className="version-dropdown"
                          value={selectedGameVersion}
                          onChange={handleGameVersionChange}
                          disabled={isLoadingVersions}
                        >
                          <option value="">
                            {isLoadingVersions ? 'Loading versions...' : 'Select a Minecraft version'}
                          </option>
                          {gameVersions.map((version) => (
                            <option key={version} value={version}>
                              {version} (Pack Format {gameVersionToPackFormat[version]})
                            </option>
                          ))}
                        </select>
                        {isLoadingVersions && (
                          <p className="loading-text">🔄 Fetching latest pack format data...</p>
                        )}
                      </div>

                      <div className="version-or-divider">
                        <span>OR</span>
                      </div>

                      <div className="version-selection-group">
                        <label htmlFor="pack-version" className="version-label">
                          Manual Pack Format Version:
                        </label>
                        <input
                          type="number"
                          id="pack-version"
                          className={`version-input ${packVersion && !isValidPackVersion(packVersion) ? 'invalid' : ''}`}
                          value={packVersion}
                          onChange={handlePackVersionChange}
                          placeholder={isLoadingVersions ? 'Loading…' : `Enter version (${MIN_PACK_VERSION}-${latestPackVersion})`}
                          min={MIN_PACK_VERSION}
                          max={latestPackVersion}
                          disabled={selectedGameVersion !== '' || isLoadingVersions}
                        />
                        {packVersion && !isValidPackVersion(packVersion) && (
                          <p className="version-error">
                            Please enter a valid pack format version between {MIN_PACK_VERSION} and {latestPackVersion}
                          </p>
                        )}
                      </div>

                      {selectedGameVersion && (
                        <div className="selected-version-info">
                          <p>
                            <strong>Selected:</strong> Minecraft {selectedGameVersion} → Pack Format {packVersion}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Bulk-mode Range Inputs */}
                  {isBulkMode && (
                    <>
                      <div className="version-selection-group">
                        <label htmlFor="bulk-start-version" className="version-label">Start Version:</label>
                        <select
                          id="bulk-start-version"
                          className="version-dropdown"
                          value={bulkStartVersion}
                          onChange={handleBulkStartChange}
                          disabled={isLoadingVersions}
                        >
                          <option value="">
                            {isLoadingVersions ? 'Loading versions...' : 'Select start version'}
                          </option>
                          {gameVersions.map((version) => (
                            <option key={version} value={version}>
                              {version} (Pack Format {gameVersionToPackFormat[version]})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="version-selection-group">
                        <label htmlFor="bulk-end-version" className="version-label">End Version:</label>
                        <select
                          id="bulk-end-version"
                          className="version-dropdown"
                          value={bulkEndVersion}
                          onChange={handleBulkEndChange}
                          disabled={isLoadingVersions}
                        >
                          <option value="">
                            {isLoadingVersions ? 'Loading versions...' : 'Select end version'}
                          </option>
                          {gameVersions.map((version) => (
                            <option key={version} value={version}>
                              {version} (Pack Format {gameVersionToPackFormat[version]})
                            </option>
                          ))}
                        </select>
                      </div>

                      {bulkStartVersion && bulkEndVersion && (
                        <div className="selected-version-info">
                          <p><strong>Range:</strong> {bulkStartVersion} → {bulkEndVersion}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              
                              <button 
                  className={`convert-button ${canConvert() ? 'enabled' : 'disabled'}`}
                  onClick={handleConvert}
                  disabled={!canConvert()}
                >
                  {isScanning ? 'Scanning...' : isConverting ? 'Converting...' : 'Convert Resource Pack'}
                </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
