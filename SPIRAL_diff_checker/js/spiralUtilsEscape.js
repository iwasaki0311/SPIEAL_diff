/* Spiral viewer &#8212; split from spiral_viewer.html */

// esc, escAttr, truncate

function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escAttr(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function truncate(s, len = 120) {
  s = String(s);
  return s.length > len ? s.substring(0, len) + '...' : s;
}
