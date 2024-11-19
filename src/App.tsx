import { useState, useRef, useEffect } from "react";
import styles from "./App.module.css";
import { VoiceRecorder } from "./components/VoiceRecorder";
import { AssetManager } from "./components/AssetManager";

interface Business {
  id: string;
  name: string;
  phone: string;
  hasDiscount: boolean;
}

interface PreviewData {
  name: string;
  phone: string;
  hasDiscount: string;
}

function App() {
  const [status, setStatus] = useState<{
    message: string;
    type: "success" | "error" | "";
  }>({
    message: "",
    type: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewData[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateCSV = (file: File): boolean => {
    if (!file.name.endsWith(".csv")) {
      setStatus({ message: "Please upload a CSV file", type: "error" });
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus({ message: "File size must be less than 5MB", type: "error" });
      return false;
    }
    return true;
  };

  const fetchBusinesses = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/businesses");
      if (!response.ok) throw new Error("Failed to fetch businesses");
      const data = await response.json();
      setBusinesses(data);
    } catch (error) {
      setStatus({ message: "Failed to load businesses", type: "error" });
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !validateCSV(file)) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:3000/api/upload-csv", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setStatus({ message: "Upload successful!", type: "success" });
      fetchBusinesses(); // Refresh the list after upload
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : "Upload failed",
        type: "error",
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm("Are you sure you want to clear all businesses?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/clear-database", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear database");
      }

      setStatus({ message: "Database cleared successfully!", type: "success" });
      setBusinesses([]); // Clear the local state
    } catch (error) {
      setStatus({
        message:
          error instanceof Error ? error.message : "Failed to clear database",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/export-csv");
      if (!response.ok) throw new Error("Export failed");

      // Get the blob from the response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "businesses.csv";

      // Trigger the download
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : "Export failed",
        type: "error",
      });
    }
  };

  const handleCallAll = async () => {
    if (!window.confirm("Are you sure you want to call all businesses?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/call-all", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to initiate calls");
      }

      const data = await response.json();
      setStatus({ message: data.message, type: "success" });
    } catch (error) {
      setStatus({
        message:
          error instanceof Error ? error.message : "Failed to initiate calls",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Business Call Manager</h1>
        </header>

        <div className={styles.mainContent}>
          <div className={styles.leftColumn}>
            <div className={styles.uploadSection}>
              <h2>Upload Business Data</h2>
              <div className={styles.uploadControls}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  disabled={isLoading}
                />
                <button
                  onClick={handleExport}
                  disabled={isLoading || businesses.length === 0}
                  className={styles.exportButton}
                >
                  Export CSV
                </button>
                <button
                  onClick={handleClearDatabase}
                  disabled={isLoading}
                  className={styles.clearButton}
                >
                  Clear Database
                </button>
                <button
                  onClick={handleCallAll}
                  disabled={isLoading || businesses.length === 0}
                  className={styles.callButton}
                >
                  Call All Businesses
                </button>
              </div>
              {isLoading && <div>Processing...</div>}
              {status.message && (
                <div className={`${styles.status} ${styles[status.type]}`}>
                  {status.message}
                </div>
              )}
            </div>

            <div className={styles.businessList}>
              <h2>Businesses</h2>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Has Discount</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((business) => (
                    <tr key={business.id}>
                      <td>{business.name}</td>
                      <td>{business.phone}</td>
                      <td>{business.hasDiscount ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.rightColumn}>
            <h2>Voice Message Settings</h2>
            <VoiceRecorder
              onRecordingComplete={(blob) => {
                console.log("Recording saved:", blob);
              }}
              onUploadSuccess={() => {
                const event = new Event("assetUploaded");
                window.dispatchEvent(event);
              }}
            />
            <AssetManager />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
