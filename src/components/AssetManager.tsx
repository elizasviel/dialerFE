import { useState, useEffect } from "react";
import styles from "./AssetManager.module.css";

interface Asset {
  sid: string;
  friendlyName: string;
  dateCreated: string;
}

export function AssetManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleDelete = async (assetSid: string) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/assets/${assetSid}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete asset");

      // Remove the deleted asset from the list
      setAssets(assets.filter((asset) => asset.sid !== assetSid));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete asset"
      );
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
      <h2>Twilio Assets</h2>
      {assets.length === 0 ? (
        <p>No assets found</p>
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
              <tr key={asset.sid}>
                <td>{asset.friendlyName}</td>
                <td>{new Date(asset.dateCreated).toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => handleDelete(asset.sid)}
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
