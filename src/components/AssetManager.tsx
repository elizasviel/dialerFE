import { useState, useEffect } from "react";
import styles from "./AssetManager.module.css";

interface Asset {
  key: string;
  url: string;
  lastModified: string;
  filename: string;
}

interface Status {
  message: string;
  type: "success" | "error";
}

export function AssetManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/assets");
      if (!response.ok) throw new Error("Failed to fetch assets");
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch assets"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!window.confirm("Are you sure you want to delete this recording?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/assets/${encodeURIComponent(key)}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete recording");

      // Remove the deleted asset from the list
      setAssets(assets.filter((asset) => asset.key !== key));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete recording"
      );
    }
  };

  const handleSetActive = async (key: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/assets/set-active/${encodeURIComponent(
          key
        )}`,
        {
          method: "POST",
        }
      );
      if (!response.ok) throw new Error("Failed to set active recording");

      setActiveKey(key);
      setStatus({ message: "Active recording updated", type: "success" });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to set active recording"
      );
      setStatus({ message: "Failed to set active recording", type: "error" });
    }
  };

  useEffect(() => {
    fetchAssets();

    // Add event listener for asset uploads
    const handleAssetUpload = () => {
      fetchAssets();
    };

    window.addEventListener("assetUploaded", handleAssetUpload);

    // Cleanup
    return () => {
      window.removeEventListener("assetUploaded", handleAssetUpload);
    };
  }, []);

  if (isLoading) return <div>Loading assets...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <h2>Recordings</h2>
      {status && (
        <div className={`${styles.status} ${styles[status.type]}`}>
          {status.message}
        </div>
      )}
      {assets.length === 0 ? (
        <p>No recordings found</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr
                key={asset.key}
                className={asset.key === activeKey ? styles.active : ""}
              >
                <td>{asset.filename}</td>
                <td>{new Date(asset.lastModified).toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => handleSetActive(asset.key)}
                    className={styles.setActiveButton}
                  >
                    Set Active
                  </button>
                  <button
                    onClick={() => handleDelete(asset.key)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
