#!/bin/bash

# Script to check 16 KB page size support in Android APK/AAB
# Usage: ./scripts/check-16kb-support.sh <path-to-apk-or-aab>

set -e

APK_OR_AAB="$1"

if [ -z "$APK_OR_AAB" ]; then
    echo "Usage: $0 <path-to-apk-or-aab>"
    echo "Example: $0 app-release.aab"
    exit 1
fi

if [ ! -f "$APK_OR_AAB" ]; then
    echo "Error: File not found: $APK_OR_AAB"
    exit 1
fi

echo "🔍 Checking 16 KB page size support for: $APK_OR_AAB"
echo ""

# Check if we have required tools
if ! command -v unzip &> /dev/null; then
    echo "❌ Error: 'unzip' is required but not installed"
    exit 1
fi

# Create temp directory for extraction
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Check if file is AAB or APK
if [[ "$APK_OR_AAB" == *.aab ]]; then
    echo "📦 Detected AAB file. Extracting..."
    
    # Extract AAB (it's a zip file)
    unzip -q "$APK_OR_AAB" -d "$TEMP_DIR" 2>/dev/null || {
        echo "❌ Error: Could not extract AAB. Make sure 'unzip' is installed."
        exit 1
    }
    
    # AAB structure: base/lib/<abi>/*.so
    # Check if base directory exists
    if [ ! -d "$TEMP_DIR/base" ]; then
        echo "❌ Error: Could not find 'base' directory in AAB"
        echo "   AAB structure may be different than expected"
        exit 1
    fi
    
    # Use base/lib directory directly (AAB structure)
    LIB_DIR="$TEMP_DIR/base/lib"
    
    if [ ! -d "$LIB_DIR" ]; then
        echo "⚠️  Warning: No 'lib' folder found in AAB base directory."
        echo "   This might mean:"
        echo "   - The app has no native libraries (unlikely for React Native)"
        echo "   - Native libraries are in a different location"
        echo ""
        echo "✅ If your app truly has no native code, this is OK"
        exit 0
    fi
    
    echo "📱 Analyzing AAB: $APK_OR_AAB"
    echo "   (Checking native libraries in base/lib/)"
    echo ""
    
elif [[ "$APK_OR_AAB" == *.apk ]]; then
    echo "📱 Analyzing APK: $APK_OR_AAB"
    echo ""
    
    # Extract lib folder from APK
    unzip -q "$APK_OR_AAB" -d "$TEMP_DIR" 2>/dev/null || {
        echo "❌ Error: Could not extract APK"
        exit 1
    }
    
    LIB_DIR="$TEMP_DIR/lib"
else
    echo "❌ Error: File must be .apk or .aab"
    exit 1
fi
# This check is now handled above for both AAB and APK

echo "📚 Found native libraries. Checking alignment..."
echo ""

# Check each .so file for 16 KB alignment
ISSUES_FOUND=0
TOTAL_LIBS=0

for ABI_DIR in "$LIB_DIR"/*; do
    if [ ! -d "$ABI_DIR" ]; then
        continue
    fi
    
    ABI=$(basename "$ABI_DIR")
    echo "  Checking ABI: $ABI"
    
    for SO_FILE in "$ABI_DIR"/*.so; do
        if [ ! -f "$SO_FILE" ]; then
            continue
        fi
        
        TOTAL_LIBS=$((TOTAL_LIBS + 1))
        LIB_NAME=$(basename "$SO_FILE")
        
        # Try to check alignment using available tools
        ALIGNMENT_CHECKED=false
        
        # Method 1: Try readelf (Linux, or binutils on macOS)
        if command -v readelf &> /dev/null; then
            # Check LOAD segment alignment (last column of LOAD line)
            ALIGNMENT=$(readelf -l "$SO_FILE" 2>/dev/null | grep -i "^  LOAD" | head -1 | awk '{print $NF}' || echo "unknown")
            
            if [ "$ALIGNMENT" != "unknown" ] && [ "$ALIGNMENT" != "" ]; then
                # Convert hex to decimal if needed
                if [[ "$ALIGNMENT" == 0x* ]]; then
                    ALIGNMENT_DEC=$((ALIGNMENT))
                else
                    ALIGNMENT_DEC=$ALIGNMENT
                fi
                
                if [ "$ALIGNMENT_DEC" -lt 16384 ]; then
                    echo "    ❌ $LIB_NAME: Alignment is $ALIGNMENT_DEC bytes (needs 16384 for 16 KB support)"
                    ISSUES_FOUND=$((ISSUES_FOUND + 1))
                else
                    echo "    ✅ $LIB_NAME: Alignment is $ALIGNMENT_DEC bytes (OK)"
                fi
                ALIGNMENT_CHECKED=true
            fi
        fi
        
        # Method 2: Try greadelf (binutils on macOS via Homebrew)
        # Check common Homebrew locations if not in PATH
        if [ "$ALIGNMENT_CHECKED" = false ]; then
            GREADELF_CMD=""
            if command -v greadelf &> /dev/null; then
                GREADELF_CMD="greadelf"
            else
                # Try to find greadelf in Homebrew locations
                GREADELF_CMD=$(find /opt/homebrew /usr/local -name "greadelf" -type f 2>/dev/null | head -1)
            fi
            
            if [ -n "$GREADELF_CMD" ]; then
                # Check LOAD segment alignment (last column of LOAD line)
                ALIGNMENT=$("$GREADELF_CMD" -l "$SO_FILE" 2>/dev/null | grep -i "^  LOAD" | head -1 | awk '{print $NF}' || echo "unknown")
                
                if [ "$ALIGNMENT" != "unknown" ] && [ "$ALIGNMENT" != "" ]; then
                    if [[ "$ALIGNMENT" == 0x* ]]; then
                        ALIGNMENT_DEC=$((ALIGNMENT))
                    else
                        ALIGNMENT_DEC=$ALIGNMENT
                    fi
                    
                    if [ "$ALIGNMENT_DEC" -lt 16384 ]; then
                        echo "    ❌ $LIB_NAME: Alignment is $ALIGNMENT_DEC bytes (needs 16384 for 16 KB support)"
                        ISSUES_FOUND=$((ISSUES_FOUND + 1))
                    else
                        echo "    ✅ $LIB_NAME: Alignment is $ALIGNMENT_DEC bytes (OK)"
                    fi
                    ALIGNMENT_CHECKED=true
                fi
            fi
        fi
        
        # Method 3: Try otool on macOS (checks segment alignment)
        if [ "$ALIGNMENT_CHECKED" = false ] && command -v otool &> /dev/null && [[ "$OSTYPE" == "darwin"* ]]; then
            # otool -l shows load commands with alignment info
            # For ELF files, we need to check differently, but let's try
            SEGMENT_INFO=$(otool -l "$SO_FILE" 2>/dev/null | grep -A 5 "LC_SEGMENT" | grep "vmaddr\|vmsize" | head -1)
            
            if [ -n "$SEGMENT_INFO" ]; then
                # For ELF files on macOS, otool might not work well
                # But we can at least verify the file is valid
                echo "    ℹ️  $LIB_NAME: Found (ELF file - use readelf/greadelf for alignment)"
            else
                echo "    ℹ️  $LIB_NAME: Found (install 'binutils' for alignment check)"
            fi
        fi
        
        # Fallback if no tool available
        if [ "$ALIGNMENT_CHECKED" = false ] && ! command -v otool &> /dev/null; then
            echo "    ℹ️  $LIB_NAME: Found (install 'binutils' for alignment check)"
        fi
    done
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $TOTAL_LIBS -eq 0 ]; then
    echo "⚠️  No native libraries found. This is unusual for React Native apps."
    echo "   Make sure native libraries are not being stripped or excluded."
elif [ $ISSUES_FOUND -eq 0 ]; then
    if command -v readelf &> /dev/null || command -v greadelf &> /dev/null; then
        echo "✅ All native libraries appear to be aligned for 16 KB page size support!"
    else
        echo "⚠️  Could not verify alignment (readelf/greadelf not found)"
        echo ""
        echo "   To enable alignment checking:"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "   On macOS: brew install binutils"
            echo "   Then use: greadelf (note the 'g' prefix)"
        else
            echo "   On Linux: sudo apt-get install binutils"
        fi
        echo ""
        echo "   Note: The script found all libraries, but alignment verification"
        echo "   requires readelf/greadelf to check ELF segment alignment."
    fi
else
    echo "❌ Found $ISSUES_FOUND library/ies with alignment issues"
    echo "   These need to be rebuilt with NDK r28+ and proper alignment"
fi

echo ""
echo "💡 Additional checks:"
echo "   1. Verify build.gradle has: useLegacyPackaging = false"
echo "   2. Ensure NDK r28+ is used (EAS Build 'latest' image includes this)"
echo "   3. Test on Android 15 emulator with 16 KB page size"
echo ""

exit $ISSUES_FOUND

