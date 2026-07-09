export function parseMarkdown(text: string) {
  if (!text) return "";
  
  // Basic markdown parsing
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  // Handle lists (simple implementation)
  html = html.replace(/- (.*?)<br\/>/g, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>)/g, '<ul class="list-disc pl-5 my-2">$1</ul>');
  html = html.replace(/<\/ul><ul class="list-disc pl-5 my-2">/g, ''); // merge adjacent lists

  // Handle headers
  html = html.replace(/### (.*?)(?:<br\/>|<\/p>)/g, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
  html = html.replace(/## (.*?)(?:<br\/>|<\/p>)/g, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>');
  html = html.replace(/# (.*?)(?:<br\/>|<\/p>)/g, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');

  return `<p>${html}</p>`;
}
