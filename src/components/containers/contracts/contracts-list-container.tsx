import AvatarCardTemplate from "@/components/templates/avatar-card-template";
import AvatarCardTemplateSkeleton from "@/components/templates/avatar-card-template-skeleton";
import { Container } from "@/components/ui/container";
import { EmptyData } from "@/components/ui/empty-data";
import { useTextStyles, ThemedText } from "@/components/ui/themed-text";
import { useFetchContracts } from "@/service/contracts";
import {
  formatErrorMessage,
  getContractAddress,
  getContractType,
} from "@/utils";
import { router } from "expo-router";
import React, { useState, useMemo, useCallback } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

type ContractsListContainerProps = {
  searchQuery?: string;
  subset?: TContractsSubset;
  hideIfEmpty?: boolean;
  n?: number;
  avatarCardVariant?: "default" | "background" | "outline" | "list" | "grayish";
};

// Static styles moved outside component
const contractItemStyle = StyleSheet.create({
  touchable: { marginVertical: 8 },
});

// Static avatar props to avoid recreation - use string for icon
const contractAvatarProps = {
  icon: "document" as const,
  size: 48,
};

// Memoized ContractItem component
interface ContractItemProps {
  contract: IContract;
  contractType: string;
  contractAddress: string | null;
  avatarCardVariant: "default" | "background" | "outline" | "list" | "grayish";
  onPress: (contractId: string) => void;
}

const ContractItem = React.memo<ContractItemProps>(
  ({ contract, contractType, contractAddress, avatarCardVariant, onPress }) => {
    const textStyles = useTextStyles();
    return (
      <TouchableOpacity
        style={contractItemStyle.touchable}
        onPress={() => onPress(contract.id)}
      >
        <AvatarCardTemplate
          variant={avatarCardVariant}
          avatar={contractAvatarProps}
        >
          <Container gap={4}>
            <ThemedText
              weight="semiBold"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {contractType}
            </ThemedText>
            {contractAddress ? (
              <ThemedText
                {...textStyles.gray}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {contractAddress}
              </ThemedText>
            ) : null}
          </Container>
        </AvatarCardTemplate>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render), false if different (re-render)
    return (
      prevProps.contract.id === nextProps.contract.id &&
      prevProps.contractType === nextProps.contractType &&
      prevProps.contractAddress === nextProps.contractAddress &&
      prevProps.avatarCardVariant === nextProps.avatarCardVariant
    );
  }
);

ContractItem.displayName = "ContractItem";

const ContractsListContainer = ({
  searchQuery,
  subset = "ALL",
  hideIfEmpty,
  n = 4,
  avatarCardVariant = "background",
}: ContractsListContainerProps) => {
  const { contracts, contractsError, contractsLoading, contractsRefetch } =
    useFetchContracts({ params: { subset: subset } });
  const [loading, setLoading] = useState(false);

  // Memoize filtered contracts - optimize search filtering
  const contractsDataToDisplay = useMemo(() => {
    if (!contracts || contracts.length === 0) return [];

    if (!searchQuery) {
      return n ? contracts.slice(0, n) : contracts;
    }

    const searchTerm = searchQuery.toLowerCase();
    const filtered = contracts.filter((contract) => {
      const address = contract.eenheden?.[0]?.adres;
      if (!address) return false;

      // Build search text more efficiently
      const parts = [
        address.straatnaam,
        address.huisnummer,
        address.woonplaats,
      ].filter(Boolean);

      return parts.join(" ").toLowerCase().includes(searchTerm);
    });

    return n ? filtered.slice(0, n) : filtered;
  }, [contracts, searchQuery, n]);

  // Pre-compute contract type and address for all items
  const contractsWithComputedData = useMemo(() => {
    return contractsDataToDisplay.map((contract) => ({
      contract,
      contractType: getContractType(contract),
      contractAddress: getContractAddress(contract),
    }));
  }, [contractsDataToDisplay]);

  const handleContractPress = useCallback((contractId: string) => {
    router.push({
      pathname: "/contracts/[id]",
      params: {
        id: contractId,
      },
    });
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    contractsRefetch().finally(() => {
      setLoading(false);
    });
  }, [contractsRefetch]);

  const isLoading = loading || contractsLoading;

  if (isLoading) {
    return (
      <Container>
        {Array.from({ length: n }).map((_, index) => (
          <AvatarCardTemplateSkeleton
            key={index}
            variant={avatarCardVariant}
            style={{
              marginVertical: 8,
            }}
          />
        ))}
      </Container>
    );
  }

  if (contractsError || !contractsDataToDisplay?.length) {
    if (hideIfEmpty) return null;
    return (
      <Container>
        <EmptyData
          {...(contractsError
            ? {
                description: formatErrorMessage(contractsError),
                variant: "red",
              }
            : {})}
          actionPress={handleRetry}
        />
      </Container>
    );
  }

  return (
    <Container>
      {contractsWithComputedData.map(
        ({ contract, contractType, contractAddress }) => (
          <ContractItem
            key={contract.id}
            contract={contract}
            contractType={contractType}
            contractAddress={contractAddress}
            avatarCardVariant={avatarCardVariant}
            onPress={handleContractPress}
          />
        )
      )}
    </Container>
  );
};

export default ContractsListContainer;
