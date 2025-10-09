import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { RIGOBOT_HOST } from "../utils/lib";

interface CompletionJobStatus {
  status: "PENDING" |  "SUCCESS" | "ERROR";
  data?: any;
  error?: string;
}

interface UseCompletionJobStatusOptions {
  completionId: string | null;
  token: string | null;
  pollingInterval?: number;
  enabled?: boolean;
}

export const useCompletionJobStatus = ({
  completionId,
  token,
  pollingInterval = 2000,
  enabled = true,
}: UseCompletionJobStatusOptions) => {
  const [status, setStatus] = useState<CompletionJobStatus>({
    status: "PENDING",
  });
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const pollCompletionStatus = async () => {
    if (!completionId || !token || !enabled) return;

    try {
      console.log(`Polling completion status for ID: ${completionId}`);
      
      const response = await axios.get(
        `${RIGOBOT_HOST}/v1/prompting/completion/${completionId}/`,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("RigoBot completion response:", response.data);

      const responseData = response.data;
      
      if (responseData.status === "SUCCESS") {
        setStatus({
          status: "SUCCESS",
          data: responseData,
        });
        setIsPolling(false);
        
        // Clear the interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (responseData.status === "ERROR") {
        setStatus({
          status: "ERROR",
          data: responseData,
          error: responseData.error || "Completion failed",
        });
        setIsPolling(false);
        
        // Clear the interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Still pending
        setStatus({
          status: "PENDING",
          data: responseData,
        });
      }
    } catch (error) {
      console.error("Error polling completion status:", error);
      setStatus({
        status: "ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      setIsPolling(false);
      
      // Clear the interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const startPolling = () => {
    if (!completionId || !token || isPolling) return;

    console.log(`Starting polling for completion ID: ${completionId}`);
    setIsPolling(true);
    setStatus({ status: "PENDING" });

    // Poll immediately
    pollCompletionStatus();

    // Then poll at intervals
    intervalRef.current = setInterval(pollCompletionStatus, pollingInterval);
  };

  const stopPolling = () => {
    console.log("Stopping polling");
    setIsPolling(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Start polling when completionId or token changes
  useEffect(() => {
    if (completionId && token && enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [completionId, token, enabled]);

    // Cleanup
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    status: status.status,
    data: status.data,
    error: status.error,
    isPolling,
    startPolling,
    stopPolling,
  };
};
