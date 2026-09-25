/** @type {import('next').NextConfig} */
const nextConfig={
 async headers(){
  const securityHeaders=[
   {key:"X-Content-Type-Options",value:"nosniff"},
   {key:"X-Frame-Options",value:"DENY"},
   {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
   {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=(), payment=(), usb=()"},
   {key:"Strict-Transport-Security",value:"max-age=31536000; includeSubDomains"},
   {key:"Content-Security-Policy",value:"default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https://*.supabase.co; media-src 'self' blob: https://*.supabase.co; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; upgrade-insecure-requests"}
  ];
  return [{source:"/:path*",headers:securityHeaders}];
 }
};
export default nextConfig;
