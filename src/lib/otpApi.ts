// Frontend API for OTP requests and verification

// Request OTP for email or phone
export async function requestOtp(identifier: string, isPhone = false) {
  // Use custom backend for both email and phone to unify OTP flow
  const res = await fetch('http://localhost:4000/api/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(isPhone ? { phone: identifier } : { email: identifier }),
  });
  return res.json();
}

// Verify OTP for email or phone
export async function verifyOtp(identifier: string, otp: string, isPhone = false) {
  // Use custom backend for both email and phone to unify OTP flow
  const res = await fetch('http://localhost:4000/api/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, otp }),
  });
  return res.json();
}
