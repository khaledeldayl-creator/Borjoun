// Mock fraud service for VPN / Proxy checking
// In production, integrate with Proxycheck.io or IPQualityScore API

const checkIpRisk = async (ipAddress) => {
  // Mock logic: 
  // For local testing, allow it.
  if (ipAddress === '127.0.0.1' || ipAddress === '::1') return { isVpn: false, riskScore: 0 };
  
  // Real implementation would fetch from an API
  // const res = await fetch(`https://proxycheck.io/v2/${ipAddress}?vpn=1&asn=1`);
  // const data = await res.json();
  // return { isVpn: data[ipAddress]?.proxy === 'yes', riskScore: data[ipAddress]?.risk || 0 };
  
  return { isVpn: false, riskScore: 0 };
};

module.exports = { checkIpRisk };
