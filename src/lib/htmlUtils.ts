/**
 * HTML 태그 제거 유틸리티
 * Canvas API에서 받은 HTML 형식의 설명을 plain text로 변환
 */

/**
 * HTML 태그와 스타일을 제거하고 plain text로 변환
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) {
    return '';
  }

  // 1. HTML 태그 제거
  let text = html.replace(/<[^>]*>/g, '');

  // 2. HTML 엔티티 디코딩
  text = decodeHtmlEntities(text);

  // 3. 연속된 공백을 하나로
  text = text.replace(/\s+/g, ' ');

  // 4. 앞뒤 공백 제거
  text = text.trim();

  return text;
}

/**
 * HTML 엔티티를 실제 문자로 디코딩
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}
