// Shared OTP store for both registration and password reset
// Using global to persist across requests in development
if (!global.otpStore) {
  global.otpStore = new Map();
}
const otpStore = global.otpStore;

// Generate a random 6-digit OTP
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP with expiration
export function storeOTP(email, otp, data = {}) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  otpStore.set(email, {
    otp,
    expiresAt,
    attempts: 0,
    ...data
  });
}

// Get OTP data
export function getOTP(email) {
  return otpStore.get(email);
}

// Verify OTP
export function verifyOTP(email, otp) {
  const storedData = otpStore.get(email);
  
  if (!storedData) {
    return { success: false, error: "OTP not found or expired" };
  }

  // Check if OTP is expired
  if (new Date() > storedData.expiresAt) {
    otpStore.delete(email);
    return { success: false, error: "OTP has expired" };
  }

  // Check attempts
  if (storedData.attempts >= 3) {
    otpStore.delete(email);
    return { success: false, error: "Too many failed attempts" };
  }

  // Verify OTP
  if (storedData.otp !== otp) {
    storedData.attempts++;
    return { success: false, error: "Invalid OTP" };
  }

  return { success: true, data: storedData };
}

// Remove OTP after successful verification
export function removeOTP(email) {
  otpStore.delete(email);
}

// Clean up expired OTPs
export function cleanupExpiredOTPs() {
  const now = new Date();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(email);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);
