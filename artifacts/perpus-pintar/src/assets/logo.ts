/**
 * Vireon logo URL — statically referenced from /public so the path is
 * known at build time and can be preloaded via <link rel="preload"> in index.html.
 * Import this constant instead of writing the string inline so editors and
 * bundlers can track every usage.
 */
const VIREON_LOGO = "/vireon-logo.webp" as const;
export default VIREON_LOGO;
