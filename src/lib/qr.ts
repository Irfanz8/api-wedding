/**
 * Generate base64 encoded string for QR code data
 */
export async function generateQRCodeDataUrl(data: string): Promise<string> {
  try {
    return `data:text/plain;base64,${btoa(data)}`;
  } catch (error) {
    console.error("Error encoding QR data:", error);
    return data; // Return plain text as fallback
  }
}

// Remove generateQRCodeBuffer since we're not using it anymore
