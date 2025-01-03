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
  const [status, setStatus] = useState<Status | null>(null);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "https://dialerbackend-f07ad367d080.herokuapp.com/api/assets"
      );
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
        `https://dialerbackend-f07ad367d080.herokuapp.com/api/assets/${encodeURIComponent(
          key
        )}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete recording");

      setAssets(assets.filter((asset) => asset.key !== key));
      setStatus({ message: "Recording deleted successfully", type: "success" });
    } catch (error) {
      setStatus({
        message:
          error instanceof Error ? error.message : "Failed to delete recording",
        type: "error",
      });
    }
  };

  useEffect(() => {
    fetchAssets();

    const handleAssetUpload = () => {
      fetchAssets();
    };

    window.addEventListener("assetUploaded", handleAssetUpload);

    return () => {
      window.removeEventListener("assetUploaded", handleAssetUpload);
    };
  }, []);

  if (isLoading) return <div>Loading assets...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <h2>Voice Recordings</h2>
      {status && (
        <div className={`${styles.status} ${styles[status.type]}`}>
          {status.message}
        </div>
      )}
      <button
        onClick={async () => {
          try {
            setIsLoading(true);
            const response = await fetch(
              "https://dialerbackend-f07ad367d080.herokuapp.com/api/generate-recordings",
              {
                method: "POST",
              }
            );
            if (!response.ok) throw new Error("Failed to generate recordings");

            setStatus({
              message: "Standard recordings generated successfully",
              type: "success",
            });
            fetchAssets();
          } catch (error) {
            setStatus({
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to generate recordings",
              type: "error",
            });
          } finally {
            setIsLoading(false);
          }
        }}
        className={styles.generateButton}
        disabled={isLoading}
      >
        Generate Standard Recordings
      </button>
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
              <tr key={asset.key}>
                <td>{asset.filename}</td>
                <td>{new Date(asset.lastModified).toLocaleString()}</td>
                <td>
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
