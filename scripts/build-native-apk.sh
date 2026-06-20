#!/bin/bash

# Build production APK for eNkamba.
# Usage:
#   ./scripts/build-native-apk.sh [versionName] [versionCode]

set -euo pipefail
export LC_ALL=C
export LANG=C

VERSION_NAME="${1:-1.3.0}"
VERSION_CODE="${2:-6}"
APK_NAME="enkamba-v${VERSION_NAME}-production.apk"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_DIR="${ROOT_DIR}/android"
GRADLE_FILE="${ANDROID_DIR}/app/build.gradle"
OUTPUT_APK="${ANDROID_DIR}/app/build/outputs/apk/release/app-release.apk"
DEST_APK="${ROOT_DIR}/${APK_NAME}"

if [ ! -d "${ANDROID_DIR}" ]; then
  echo "Android project not found. Run: npx cap add android"
  exit 1
fi

echo "Building eNkamba production APK ${VERSION_NAME} (${VERSION_CODE})"

echo "Updating Android version metadata..."
VERSION_NAME="${VERSION_NAME}" VERSION_CODE="${VERSION_CODE}" perl -0pi -e '
  s/versionCode\s+\d+/versionCode $ENV{VERSION_CODE}/;
  s/versionName\s+"[^"]+"/versionName "$ENV{VERSION_NAME}"/;
' "${GRADLE_FILE}"

echo "Running Next.js production build..."
cd "${ROOT_DIR}"
npm run build

echo "Synchronizing Capacitor Android..."
npx cap sync android
npx cap copy android

echo "Generating release APK..."
cd "${ANDROID_DIR}"
./gradlew assembleRelease

if [ ! -f "${OUTPUT_APK}" ]; then
  echo "Release APK not found at ${OUTPUT_APK}"
  exit 1
fi

cp "${OUTPUT_APK}" "${DEST_APK}"

echo "APK generated: ${DEST_APK}"
ls -lh "${DEST_APK}"
if command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "${DEST_APK}"
fi
