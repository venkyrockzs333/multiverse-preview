#!/usr/bin/env bash
# Fails if the deployable résumé contains a phone number.
set -euo pipefail
f="${1:-dist/assets/Venkateshwarlu_Boda_Resume.pdf}"
t=$(pdftotext "$f" -)
if echo "$t" | grep -qE '\+91|78937|98222|(\+?[0-9][0-9 ()-]{9,}[0-9])'; then echo "FAIL: phone-like number in $f"; exit 1; fi
echo "OK: no phone number in $f"
