import { useState, useEffect } from "react";
import styles from "./TwilioInfo.module.css";

interface TwilioAccount {
  friendlyName: string;
  status: string;
  type: string;
  phoneNumber: string;
  remainingBalance: number | null;
}

export function TwilioInfo() {
  const [accountInfo, setAccountInfo] = useState<TwilioAccount | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchTwilioInfo = async () => {
      try {
        const response = await fetch(
          "https://dialerbackend-f07ad367d080.herokuapp.com/api/twilio-info"
        );
        if (!response.ok)
          throw new Error("Failed to fetch Twilio account info");
        const data = await response.json();
        setAccountInfo(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to fetch Twilio info"
        );
      }
    };

    fetchTwilioInfo();
  }, []);

  if (error) return <div className={styles.error}>{error}</div>;
  if (!accountInfo) return <div>Loading Twilio information...</div>;

  return (
    <div className={styles.container}>
      <h2>Twilio Account Information</h2>
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <label>Account Name:</label>
          <span>{accountInfo.friendlyName}</span>
        </div>
        <div className={styles.infoItem}>
          <label>Status:</label>
          <span className={styles[accountInfo.status.toLowerCase()]}>
            {accountInfo.status}
          </span>
        </div>
        <div className={styles.infoItem}>
          <label>Account Type:</label>
          <span>{accountInfo.type}</span>
        </div>
        <div className={styles.infoItem}>
          <label>Phone Number:</label>
          <span>{accountInfo.phoneNumber}</span>
        </div>
        <div className={styles.infoItem}>
          <label>Balance:</label>
          <span>
            {accountInfo.remainingBalance !== null
              ? `$${accountInfo.remainingBalance.toFixed(2)}`
              : "Not available"}
          </span>
        </div>
      </div>
    </div>
  );
}
