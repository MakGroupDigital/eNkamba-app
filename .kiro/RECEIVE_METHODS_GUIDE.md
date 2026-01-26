# Receive Page (Encaisser) - Methods Quick Guide

## 5 Payment Collection Methods

### 1. 🔗 Link Method
**What it does**: Generates a shareable payment link
- **Icon**: Link icon
- **Best for**: General payments, sharing via email/SMS
- **Features**:
  - Unique payment link
  - QR code generated
  - Share button
  - Copy to clipboard
  - No expiration (30 days)
- **Sharing**: Email, SMS, messaging apps, social media

### 2. 📱 QR Code Method
**What it does**: Generates a scannable QR code
- **Icon**: QR code icon
- **Best for**: Physical displays, printed materials
- **Features**:
  - Large QR code display
  - Download as PNG
  - Print-friendly
  - Easy scanning
- **Use Case**: Stores, restaurants, events

### 3. 📲 Phone Method (Bluetooth)
**What it does**: Proximity-based transfer via Bluetooth
- **Icon**: Bluetooth icon
- **Best for**: Direct person-to-person transfer
- **Features**:
  - Bluetooth Web API
  - Proximity detection
  - Automatic pairing
  - Real-time transfer
- **Requirements**: Bluetooth enabled on both devices
- **Warning**: Shows if Bluetooth not supported

### 4. ⚡ Code Method (6-Digit)
**What it does**: Generates temporary 6-digit code
- **Icon**: Lightning bolt icon
- **Best for**: Quick, one-time payments
- **Features**:
  - Unique 6-digit code
  - **5-minute expiration**
  - Real-time countdown timer
  - Pulsing indicator
  - Copy to clipboard
- **Security**: Time-limited for security
- **Display**: MM:SS countdown format

### 5. 📡 NFC Method
**What it does**: Contactless payment via NFC
- **Icon**: WiFi icon
- **Best for**: Contactless payments, cards
- **Features**:
  - Web NFC API (NDEFReader)
  - Card support
  - Phone support
  - Automatic detection
- **Requirements**: NFC enabled on device
- **Warning**: Shows if NFC not supported

## Method Selection Screen

```
┌─────────────────────────────────────────┐
│  Encaisser un paiement                  │
│  Générez un lien ou code pour recevoir  │
└─────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐
│ 🔗 Lien      │  │ 📱 QR Code   │
│ Partagez     │  │ Scannez      │
└──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐
│ 📲 Téléphone │  │ ⚡ Code      │
│ Bluetooth    │  │ 6 chiffres   │
└──────────────┘  └──────────────┘

┌──────────────┐
│ 📡 NFC       │
│ Sans contact │
└──────────────┘
```

## Technology Support Detection

### NFC Detection
```javascript
if ('NDEFReader' in window) {
  // NFC is supported
}
```

### Bluetooth Detection
```javascript
if ('bluetooth' in navigator) {
  // Bluetooth is supported
}
```

## Code Expiration Timer

- **Duration**: 5 minutes (300 seconds)
- **Format**: MM:SS (e.g., 04:32)
- **Update**: Every second
- **Indicator**: Pulsing white dot
- **Warning**: Amber box explaining temporary nature

## User Flow

```
1. Select Method
   ↓
2. Enter Details (optional)
   - Amount
   - Description
   ↓
3. Generate
   ↓
4. Display & Share
   - Copy
   - Share
   - Download (QR only)
   - Instructions
```

## Each Method's Details Screen

### Link Method
- Amount (optional)
- Description (optional)
- Tip: "Partagez le lien par email, SMS ou messagerie"

### QR Code Method
- Amount (optional)
- Description (optional)
- Tip: "Affichez le code QR pour que les autres le scannent"

### Phone Method (Bluetooth)
- Amount (optional)
- Description (optional)
- Tip: "Utilisez Bluetooth pour transférer les données de paiement"

### Code Method
- Amount (optional)
- Description (optional)
- Tip: "Partagez le code à 6 chiffres (valide 5 minutes)"

### NFC Method
- Amount (optional)
- Description (optional)
- Tip: "Utilisez la technologie NFC pour les paiements rapides sans contact"

## Generated Display

### Link Method Shows
- Success message
- QR code (if selected)
- Payment link URL
- Copy button
- Share button

### QR Code Method Shows
- Success message
- Large QR code
- Download button

### Phone Method Shows
- Success message
- Bluetooth icon
- Instructions:
  - Ensure Bluetooth is enabled
  - Approach payer's phone
  - Devices auto-detect
  - Confirm payment
- Warning if not supported

### Code Method Shows
- Success message
- Large 6-digit code
- Countdown timer (MM:SS)
- Pulsing indicator
- Copy button
- Expiration warning

### NFC Method Shows
- Success message
- NFC icon
- Instructions:
  - Ensure NFC is enabled
  - Approach NFC card/phone
  - Hold for 2-3 seconds
  - Auto-process
- Warning if not supported
- Amount display

## Color Scheme

- **Primary**: #32BB78 (eNkamba Green)
- **Dark**: #2a9d63
- **Darker**: #1f7a4a
- **Success**: Green
- **Warning**: Amber
- **Error**: Red

## Icons Used

- Link: `LinkIcon`
- QR: `QrCode`
- Phone: `Bluetooth`
- Code: `Zap`
- NFC: `Wifi`
- Success: `CheckCircle2`
- Download: `Download`
- Copy: `Copy`
- Share: `Share2`
- Warning: `AlertTriangle`

## Important Notes

✓ Each method is truly different and serves specific use case
✓ Technology detection prevents user errors
✓ Code method has 5-minute expiration for security
✓ Phone method uses Bluetooth for proximity transfer
✓ NFC method uses Web NFC API for contactless payments
✓ All methods integrated with existing payment system
✓ Responsive design for mobile and desktop
✓ Real-time timers for code expiration
✓ Detailed instructions for each method
✓ Support warnings for unsupported technologies

## Troubleshooting

**Bluetooth not detected?**
- Check if browser supports Web Bluetooth API
- Try another method

**NFC not detected?**
- Check if device has NFC hardware
- Check if browser supports Web NFC API
- Try another method

**Code expired?**
- Generate a new code
- 5-minute limit is for security

**QR code not scanning?**
- Ensure good lighting
- Try downloading and printing
- Check QR code size

**Link not working?**
- Check internet connection
- Verify link is complete
- Try copying and pasting manually
