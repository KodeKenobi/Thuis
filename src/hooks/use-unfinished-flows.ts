import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";

export const useUnfinishedFlows = () => {
  const [loading, setLoading] = useState(false);

  const saveUnfinishedFlow = useCallback(
    async (flowData: IUnfinishedFlow): Promise<void> => {
      try {
        setLoading(true);
        const existingFlows = await getUnfinishedFlows();

        // Remove existing flow with same ID if it exists
        const filteredFlows = existingFlows.filter(
          (flow) => flow.id !== flowData.id
        );

        // Add the new/updated flow
        const updatedFlows = [...filteredFlows, flowData];

        await AsyncStorage.setItem(
          STORAGE_KEYS.UNFINISHED_FLOWS,
          JSON.stringify(updatedFlows)
        );
      } catch (error) {
        console.error("Error saving unfinished flow:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getUnfinishedFlows =
    useCallback(async (): Promise<TUnfinishedFlows> => {
      try {
        const stored = await AsyncStorage.getItem(
          STORAGE_KEYS.UNFINISHED_FLOWS
        );
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error("Error getting unfinished flows:", error);
        return [];
      }
    }, []);

  const removeUnfinishedFlow = useCallback(
    async (flowId: string): Promise<void> => {
      try {
        setLoading(true);
        const existingFlows = await getUnfinishedFlows();
        const filteredFlows = existingFlows.filter(
          (flow) => flow.id !== flowId
        );

        await AsyncStorage.setItem(
          STORAGE_KEYS.UNFINISHED_FLOWS,
          JSON.stringify(filteredFlows)
        );
      } catch (error) {
        console.error("Error removing unfinished flow:", error);
      } finally {
        setLoading(false);
      }
    },
    [getUnfinishedFlows]
  );

  const clearAllUnfinishedFlows = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem(STORAGE_KEYS.UNFINISHED_FLOWS);
    } catch (error) {
      console.error("Error clearing unfinished flows:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getUnfinishedFlowById = useCallback(
    async (flowId: string): Promise<IUnfinishedFlow | null> => {
      try {
        const flows = await getUnfinishedFlows();
        return flows.find((flow) => flow.id === flowId) || null;
      } catch (error) {
        console.error("Error getting unfinished flow by ID:", error);
        return null;
      }
    },
    [getUnfinishedFlows]
  );

  return {
    loading,
    saveUnfinishedFlow,
    getUnfinishedFlows,
    removeUnfinishedFlow,
    clearAllUnfinishedFlows,
    getUnfinishedFlowById,
  };
};
