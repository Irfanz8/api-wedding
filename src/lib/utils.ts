/**
 * Get initials from name
 * Example: "John Doe" -> "JD"
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

/**
 * Generate unique invitation code
 * Format: [Groom Initial][Bride Initial][DDMMYY][Random]
 * Example: JD251223123 where:
 * - JD = John & Doe's initials
 * - 251223 = 25th Dec 2023
 * - 123 = random numbers
 */
export function generateInvitationCode(groomName: string, brideName: string, ceremonyDate: string): string {
  // Get first letter of each word for groom
  const groomInitial = groomName.split(' ')[0][0].toUpperCase();
  
  // Get first letter of each word for bride
  const brideInitial = brideName.split(' ')[0][0].toUpperCase();
  
  const date = new Date(ceremonyDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  return `${groomInitial}${brideInitial}${day}${month}${year}`;
}

/**
 * Validate invitation code format
 */
export function validateInvitationCode(code: string): boolean {
  const pattern = /^DI\d{6}\d{4}$/;
  return pattern.test(code);
}

/**
 * Generate random string for unique identifiers
 */
export function generateRandomString(length: number = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Hash password using PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Convert password to buffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Create key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Derive key using PBKDF2
  const key = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  // Combine salt and derived key
  const result = new Uint8Array(salt.length + new Uint8Array(key).length);
  result.set(salt);
  result.set(new Uint8Array(key), salt.length);
  
  // Convert to hex string
  return Array.from(result)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify password
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    // Convert hash string to buffer
    const hashBuffer = new Uint8Array(
      hash.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    );
    
    // Extract salt (first 16 bytes)
    const salt = hashBuffer.slice(0, 16);
    
    // Create key material
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    // Derive key using same parameters
    const key = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    
    // Compare derived key with stored key
    const storedKey = hashBuffer.slice(16);
    const newKey = new Uint8Array(key);
    
    return storedKey.length === newKey.length &&
      storedKey.every((value, index) => value === newKey[index]);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
