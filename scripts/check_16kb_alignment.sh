#!/usr/bin/env bash

# Usage:
#   ./scripts/check_16kb_alignment.sh <path-to-apk-or-aab-or-folder> [arch1 arch2 ...]
# Example:
#   ./scripts/check_16kb_alignment.sh ./app-release.aab arm64-v8a x86_64

TARGET="$1"

if [ -z "$TARGET" ]; then
  echo "Usage: $0 <path-to-apk-or-aab-or-folder> [arch1 arch2 ...]"
  echo "Example: $0 ./app-release.aab arm64-v8a x86_64"
  exit 1
fi

if [ ! -e "$TARGET" ]; then
  echo "Error: File or directory not found: $TARGET"
  exit 1
fi

shift || true

ARCHS=("$@")

if [ ${#ARCHS[@]} -eq 0 ]; then
  ARCHS=("arm64-v8a" "armeabi-v7a" "x86" "x86_64")
fi

WORKDIR="$(mktemp -d)"

cleanup() {
  rm -rf "$WORKDIR"
}

trap cleanup EXIT

echo "Working directory: $WORKDIR"

extract_so_files() {
  local src="$1"
  
  # If it is a folder already, copy .so files preserving structure
  if [ -d "$src" ]; then
    find "$src" -type f -name "*.so" | while read -r sofile; do
      relpath="${sofile#$src/}"
      targetdir="$WORKDIR/$(dirname "$relpath")"
      mkdir -p "$targetdir"
      cp "$sofile" "$WORKDIR/$relpath"
    done
    return
  fi
  
  # If it's an AAB or APK, unzip
  unzip -q "$src" -d "$WORKDIR/unzipped" 2>/dev/null || {
    echo "Error: Failed to extract $src"
    exit 1
  }
  
  # If it's an AAB, native libs often under base/lib/...
  # For APK, they're under lib/...
  local base="$WORKDIR/unzipped"
  find "$base" -type f -path "*/lib/*/*.so" | while read -r sofile; do
    # Preserve the lib/arch/libname.so structure
    relpath="${sofile#$base/}"
    targetdir="$WORKDIR/$(dirname "$relpath")"
    mkdir -p "$targetdir"
    cp "$sofile" "$WORKDIR/$relpath"
  done
}

extract_so_files "$TARGET"

if [ ! -d "$WORKDIR" ]; then
  echo "Failed to extract .so files. Exiting."
  exit 1
fi

FAILED=0
TOTAL_CHECKED=0

echo
echo "====== Checking ELF alignment for 16KB (0x4000) ======"
echo

for sofile in $(find "$WORKDIR" -type f -name "*.so" | sort); do
  # detect architecture by path (includes arch dir)
  ok_arch=false
  for arch in "${ARCHS[@]}"; do
    if echo "$sofile" | grep -q "/$arch/"; then
      ok_arch=true
      break
    fi
  done
  
  if ! $ok_arch ; then
    # skip architectures we don't check
    continue
  fi
  
  TOTAL_CHECKED=$((TOTAL_CHECKED + 1))
  LIB_NAME=$(basename "$sofile")
  ARCH_DIR=$(echo "$sofile" | grep -o "/[^/]*/$LIB_NAME" | cut -d'/' -f2)
  
  echo "---- $ARCH_DIR/$LIB_NAME ----"
  
  # Try readelf first, then greadelf (macOS binutils)
  READELF_CMD=""
  if command -v readelf &> /dev/null; then
    READELF_CMD="readelf"
  elif command -v greadelf &> /dev/null; then
    READELF_CMD="greadelf"
  else
    # Try to find greadelf in common Homebrew locations
    GREADELF_PATH=$(find /opt/homebrew /usr/local -name "greadelf" -type f 2>/dev/null | head -1)
    if [ -n "$GREADELF_PATH" ]; then
      READELF_CMD="$GREADELF_PATH"
    fi
  fi
  
  if [ -z "$READELF_CMD" ]; then
    echo "  ⚠️  readelf/greadelf not found - cannot check alignment"
    continue
  fi
  
  # Use readelf to get LOAD segments
  # For 64-bit ELF, the alignment is on the continuation line after "LOAD"
  LIB_FAILED=0
  SEGMENT_COUNT=0
  
  # Read readelf output line by line, tracking when we see a LOAD segment
  # Use process substitution to avoid subshell issues
  IN_LOAD_SEGMENT=false
  while IFS= read -r line; do
    if echo "$line" | grep -q "^  LOAD"; then
      # This is a LOAD line - mark that we're in a LOAD segment
      IN_LOAD_SEGMENT=true
      # Check if alignment is on this line (32-bit ELF) or next line (64-bit ELF)
      if echo "$line" | grep -qE "0x[0-9a-f]+[[:space:]]+0x[0-9a-f]+[[:space:]]+[RWX]+[[:space:]]+0x"; then
        # Alignment is on the same line (32-bit)
        SEGMENT_COUNT=$((SEGMENT_COUNT + 1))
        ALIGN=$(echo "$line" | awk '{print $NF}')
        IN_LOAD_SEGMENT=false
        
        # Process the alignment immediately
        if [ -n "$ALIGN" ]; then
          if [[ "$ALIGN" =~ ^0x ]]; then
            ALIGN_DEC=$((ALIGN))
          else
            ALIGN_DEC=$ALIGN
          fi
          
          if [ "$ALIGN_DEC" -lt 16384 ]; then
            echo "  ✘ BAD: segment alignment = $ALIGN ($ALIGN_DEC bytes, less than 16KB)"
            LIB_FAILED=1
            FAILED=1
          else
            echo "  ✔ OK: segment alignment = $ALIGN ($ALIGN_DEC bytes)"
          fi
        fi
      fi
    elif [ "$IN_LOAD_SEGMENT" = true ]; then
      # This is the continuation line for a LOAD segment (64-bit ELF)
      SEGMENT_COUNT=$((SEGMENT_COUNT + 1))
      # Alignment is the last field on the continuation line
      ALIGN=$(echo "$line" | awk '{print $NF}')
      IN_LOAD_SEGMENT=false
      
      # Process the alignment immediately
      if [ -n "$ALIGN" ]; then
        if [[ "$ALIGN" =~ ^0x ]]; then
          ALIGN_DEC=$((ALIGN))
        else
          ALIGN_DEC=$ALIGN
        fi
        
        if [ "$ALIGN_DEC" -lt 16384 ]; then
          echo "  ✘ BAD: segment alignment = $ALIGN ($ALIGN_DEC bytes, less than 16KB)"
          LIB_FAILED=1
          FAILED=1
        else
          echo "  ✔ OK: segment alignment = $ALIGN ($ALIGN_DEC bytes)"
        fi
      fi
    else
      # Not a LOAD segment, reset flag
      IN_LOAD_SEGMENT=false
    fi
  done < <("$READELF_CMD" -l "$sofile" 2>/dev/null)
  
  if [ "$SEGMENT_COUNT" -eq 0 ]; then
    echo "  ⚠️  No LOAD segments found"
  fi
  
  echo
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

if [ "$TOTAL_CHECKED" -eq 0 ]; then
  echo "⚠️  No libraries found for architectures: ${ARCHS[*]}"
  exit 0
elif [ "$FAILED" -eq 0 ]; then
  echo "✅ RESULT: All checked .so libraries ($TOTAL_CHECKED) are 16 KB-aligned (for archs: ${ARCHS[*]})"
  exit 0
else
  echo "❌ RESULT: Some libraries are NOT 16 KB-aligned — fix or update them before publishing."
  exit 1
fi

