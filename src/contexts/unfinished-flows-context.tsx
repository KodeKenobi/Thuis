import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import { useUnfinishedFlows } from "@/hooks/use-unfinished-flows";

interface UnfinishedFlowsContextType {
  unfinishedFlows: TUnfinishedFlows;
  loading: boolean;
  refresh: () => Promise<void>;
  saveUnfinishedFlow: (flowData: IUnfinishedFlow) => Promise<void>;
  removeUnfinishedFlow: (flowId: string) => Promise<void>;
  clearAllUnfinishedFlows: () => Promise<void>;
  getUnfinishedFlowById: (flowId: string) => Promise<IUnfinishedFlow | null>;
}

const UnfinishedFlowsContext = createContext<
  UnfinishedFlowsContextType | undefined
>(undefined);

export const useUnfinishedFlowsContext = () => {
  const context = useContext(UnfinishedFlowsContext);
  if (!context) {
    throw new Error(
      "useUnfinishedFlowsContext must be used within UnfinishedFlowsProvider"
    );
  }
  return context;
};

interface UnfinishedFlowsProviderProps {
  children: React.ReactNode;
}

export const UnfinishedFlowsProvider: React.FC<
  UnfinishedFlowsProviderProps
> = ({ children }) => {
  const [unfinishedFlows, setUnfinishedFlows] = useState<TUnfinishedFlows>([]);
  const [loading, setLoading] = useState(true);
  const {
    getUnfinishedFlows,
    saveUnfinishedFlow: saveFlow,
    removeUnfinishedFlow: removeFlow,
    clearAllUnfinishedFlows: clearAll,
    getUnfinishedFlowById: getById,
  } = useUnfinishedFlows();

  const loadUnfinishedFlows = useCallback(async () => {
    try {
      setLoading(true);
      const flows = await getUnfinishedFlows();
      const sortedFlows = flows.sort(
        (a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );
      setUnfinishedFlows(sortedFlows);
    } catch (error) {
      console.error("Error loading unfinished flows:", error);
    } finally {
      setLoading(false);
    }
  }, [getUnfinishedFlows]);

  const refresh = useCallback(async () => {
    await loadUnfinishedFlows();
  }, [loadUnfinishedFlows]);

  const saveUnfinishedFlow = useCallback(
    async (flowData: IUnfinishedFlow) => {
      await saveFlow(flowData);
      await loadUnfinishedFlows(); // Refresh after saving
    },
    [saveFlow, loadUnfinishedFlows]
  );

  const removeUnfinishedFlow = useCallback(
    async (flowId: string) => {
      await removeFlow(flowId);
      await loadUnfinishedFlows(); // Refresh after removing
    },
    [removeFlow, loadUnfinishedFlows]
  );

  const clearAllUnfinishedFlows = useCallback(async () => {
    await clearAll();
    await loadUnfinishedFlows(); // Refresh after clearing
  }, [clearAll, loadUnfinishedFlows]);

  const getUnfinishedFlowById = useCallback(
    async (flowId: string) => {
      return await getById(flowId);
    },
    [getById]
  );

  useEffect(() => {
    loadUnfinishedFlows();
  }, [loadUnfinishedFlows]);

  const value: UnfinishedFlowsContextType = {
    unfinishedFlows,
    loading,
    refresh,
    saveUnfinishedFlow,
    removeUnfinishedFlow,
    clearAllUnfinishedFlows,
    getUnfinishedFlowById,
  };

  return (
    <UnfinishedFlowsContext.Provider value={value}>
      {children}
    </UnfinishedFlowsContext.Provider>
  );
};
