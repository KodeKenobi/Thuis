import React from "react";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Container } from "./container";
import { Button } from "./button";
import Ionicons from "@expo/vector-icons/Ionicons";
import Label from "./label";
import { useCorporateBranding } from "@/contexts/corporate-branding-context";
import Avatar from "./avatar";
import { useTextStyles, ThemedText } from "./themed-text";

export interface FileAsset {
  name: string;
  size?: number;
  uri: string;
  mimeType?: string;
}

interface FileUploaderProps {
  value: FileAsset[];
  onChange: (files: FileAsset[]) => void;
  multiple?: boolean;
  maxSize?: number; // bytes, per file
  accept?: string | string[]; // MIME types
  label?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

function formatBytes(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  value,
  onChange,
  multiple = false,
  maxSize,
  accept = "*/*",
  label,
  error,
  required,
  placeholder = "Kies een bestand...",
  disabled,
}) => {
  const textStyles = useTextStyles();
  const { colors: { background, grayishColor, primary, text } } = useCorporateBranding();
  const [internalError, setInternalError] = React.useState<string | null>(null);

  const pickFiles = async () => {
    setInternalError(null);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: accept,
        multiple,
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      let assets = res.assets || [];
      // Filter by max size
      if (maxSize) {
        const tooLarge = assets.find((a) => a.size && a.size > maxSize);
        if (tooLarge) {
          setInternalError(
            `Bestand '${tooLarge.name}' is te groot. Maximaal ${formatBytes(
              maxSize
            )} per bestand.`
          );
          return;
        }
      }
      // Merge with existing if multi, else replace
      let newFiles = multiple ? [...value, ...assets] : assets;
      // Remove duplicates by uri
      newFiles = newFiles.filter(
        (file, idx, arr) => arr.findIndex((f) => f.uri === file.uri) === idx
      );
      onChange(newFiles);
      setInternalError(null);
    } catch (e) {
      setInternalError(
        "Er is iets misgegaan bij het selecteren van bestanden."
      );
    }
  };

  // Camera support if images are accepted
  const acceptImages = React.useMemo(() => {
    if (!accept) return false;
    if (typeof accept === "string")
      return accept.includes("image") || accept === "*/*";
    return accept.some((a) => a.includes("image") || a === "*/*");
  }, [accept]);

  const takePhoto = async () => {
    setInternalError(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setInternalError("Camera toegang geweigerd.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });
      if (result.canceled) return;
      const photo = result.assets?.[0];
      if (!photo) return;
      // Optionally check maxSize
      if (maxSize && photo.fileSize && photo.fileSize > maxSize) {
        setInternalError(
          `Foto is te groot. Maximaal ${formatBytes(maxSize)} per bestand.`
        );
        return;
      }
      const fileAsset = {
        name: photo.fileName || `photo_${Date.now()}.jpg`,
        size: photo.fileSize,
        uri: photo.uri,
        mimeType: photo.type || "image/jpeg",
      };
      let newFiles = multiple ? [...value, fileAsset] : [fileAsset];
      // Remove duplicates by uri
      newFiles = newFiles.filter(
        (file, idx, arr) => arr.findIndex((f) => f.uri === file.uri) === idx
      );
      onChange(newFiles);
      setInternalError(null);
    } catch (e) {
      setInternalError("Er is iets misgegaan bij het nemen van een foto.");
    }
  };

  const pickFromLibrary = async () => {
    setInternalError(null);
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setInternalError("Fotobibliotheek toegang geweigerd.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
        allowsMultipleSelection: multiple,
      });
      if (result.canceled) return;
      const photos = result.assets || [];
      if (photos.length === 0) return;

      // Filter by max size
      if (maxSize) {
        const tooLarge = photos.find((p) => p.fileSize && p.fileSize > maxSize);
        if (tooLarge) {
          setInternalError(
            `Foto is te groot. Maximaal ${formatBytes(maxSize)} per bestand.`
          );
          return;
        }
      }

      const selectedPhotos = multiple ? photos : [photos[0]];
      const fileAssets = selectedPhotos.map((photo, index) => ({
        name: photo.fileName || `photo_${Date.now()}_${index}.jpg`,
        size: photo.fileSize,
        uri: photo.uri,
        mimeType: photo.type || "image/jpeg",
      }));

      let newFiles = multiple ? [...value, ...fileAssets] : fileAssets;
      // Remove duplicates by uri
      newFiles = newFiles.filter(
        (file, idx, arr) => arr.findIndex((f) => f.uri === file.uri) === idx
      );
      onChange(newFiles);
      setInternalError(null);
    } catch (e) {
      setInternalError("Er is iets misgegaan bij het selecteren van foto's.");
    }
  };

  const removeFile = (uri: string) => {
    onChange(value.filter((f) => f.uri !== uri));
    setInternalError(null);
  };

  // Instructions for accepted types and max size
  let instructions = [];
  if (accept && accept !== "*/*") {
    if (Array.isArray(accept)) {
      instructions.push(`Toegestane types: ${accept.join(", ")}`);
    } else {
      instructions.push(`Toegestane types: ${accept}`);
    }
  }
  if (maxSize) {
    instructions.push(`Max. grootte: ${formatBytes(maxSize)} per bestand`);
  }
  if (multiple) {
    instructions.push("Meerdere bestanden toegestaan");
  }

  return (
    <Container gap={8}>
      {label && <Label required={required}>{label}</Label>}
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: background,
            borderColor: grayishColor,
          },
          (error || internalError) && styles.cardError,
          disabled && { opacity: 0.6 },
        ]}
        onPress={pickFiles}
        activeOpacity={0.85}
        disabled={disabled}
      >
        <Container align="center" gap={8}>
          <Avatar
            icon={
              <Ionicons name="cloud-upload-outline" size={32} color={primary} />
            }
            size={56}
            style={{
              marginBottom: 4,
            }}
            color={primary}
          />
          {/* <Avatar /> */}
          <ThemedText {...textStyles.gray} style={styles.cardTitle}>
            {multiple ? "Bestanden uploaden" : "Bestand uploaden"}
          </ThemedText>
          <ThemedText style={styles.cardDesc}>{placeholder}</ThemedText>
          {instructions.length > 0 && (
            <ThemedText style={styles.instructions}>
              {instructions.join("  •  ")}
            </ThemedText>
          )}
          {acceptImages && (
            <>
              <View style={styles.cardButton}>
                <Button
                  title="Maak foto"
                  icon={<Ionicons name="camera" size={18} color={text} />}
                  variant="link"
                  onPress={takePhoto}
                  disabled={disabled}
                />
              </View>
              <View style={styles.cardButton}>
                <Button
                  title={multiple ? "Foto's kiezen" : "Foto kiezen"}
                  icon={<Ionicons name="images" size={18} color={text} />}
                  variant="link"
                  onPress={pickFromLibrary}
                  disabled={disabled}
                />
              </View>
            </>
          )}
          <View style={styles.cardButton}>
            <Button
              title={multiple ? "Bestanden kiezen" : "Bestand kiezen"}
              icon={<Ionicons name="attach" size={18} color="#fff" />}
              variant="primary"
              onPress={pickFiles}
              disabled={disabled}
            />
          </View>
        </Container>
      </TouchableOpacity>
      {value.length > 0 && (
        <Container gap={8} style={styles.fileList}>
          {value.map((file) => (
            <Container
              key={file.uri}
              direction="horizontal"
              align="center"
              style={[
                styles.fileItem,
                {
                  backgroundColor: background,
                },
              ]}
              gap={8}
            >
              <Ionicons name="document" size={20} color={primary} />
              <View style={{ flex: 1 }}>
                <ThemedText numberOfLines={1} style={styles.fileName}>
                  {file.name}
                </ThemedText>
                {file.size !== undefined && (
                  <ThemedText style={styles.fileSize}>{formatBytes(file.size)}</ThemedText>
                )}
              </View>
              <TouchableOpacity
                onPress={() => removeFile(file.uri)}
                style={styles.removeBtn}
              >
                <Ionicons name="close-circle" size={20} color="#ff4444" />
              </TouchableOpacity>
            </Container>
          ))}
        </Container>
      )}
      {(error || internalError) && (
        <ThemedText style={styles.errorText}>{error || internalError}</ThemedText>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 24,
    alignItems: "center",
    marginBottom: 4,
  },
  cardError: {
    borderColor: "#ff0000",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
  },
  cardDesc: {
    color: "#666",
    fontSize: 14,
    marginTop: 2,
    marginBottom: 2,
    textAlign: "center",
  },
  instructions: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
    marginBottom: 2,
    textAlign: "center",
  },
  cardButton: {
    marginTop: 8,
    alignSelf: "center",
    minWidth: 140,
  },
  fileList: {
    marginTop: 8,
  },
  fileItem: {
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  fileName: {
    fontSize: 15,
  },
  fileSize: {
    fontSize: 12,
    color: "#888",
  },
  removeBtn: {
    marginLeft: 8,
    padding: 4,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: "#ff0000",
  },
});
