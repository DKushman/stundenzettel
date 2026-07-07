/** @type {import('next').NextConfig} */
const nextConfig = {
  // Native/serverseitige Pakete nicht bundeln (pg für Neon, PGlite lokal)
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
};
export default nextConfig;
