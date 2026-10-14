// vCard 3.0 rather than 4.0: it is the newest version iOS and Android both
// import without complaint, from a file or straight out of a camera scan
export const VERSION = '3.0';

// RFC 2425 requires CRLF; some importers reject a card with bare LF
export const LINE_BREAK = '\r\n';

export const MIME_TYPE = 'text/vcard';

export const EXTENSION = '.vcf';
