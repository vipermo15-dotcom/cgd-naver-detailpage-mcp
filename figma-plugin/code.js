figma.showUI(__html__, { width: 420, height: 660 });

const FONT_REGULAR = { family: "Inter", style: "Regular" };
const FONT_BOLD = { family: "Inter", style: "Bold" };

function hexToRgb(hex) {
  if (!hex) return { r: 0, g: 0, b: 0 };
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const bigint = parseInt(full, 16);
  return {
    r: ((bigint >> 16) & 255) / 255,
    g: ((bigint >> 8) & 255) / 255,
    b: (bigint & 255) / 255
  };
}

function applyFill(node, hex) {
  if (!hex) return;
  node.fills = [{ type: 'SOLID', color: hexToRgb(hex) }];
}

async function fontForWeight(weight) {
  const font = weight && weight >= 700 ? FONT_BOLD : FONT_REGULAR;
  await figma.loadFontAsync(font);
  return font;
}

async function createTextNode(spec) {
  const node = figma.createText();
  node.fontName = await fontForWeight(spec.fontWeight);
  node.characters = spec.content || spec.text || '';
  node.fontSize = spec.fontSize || 16;
  if (spec.color) applyFill(node, spec.color);
  if (spec.textAlign) node.textAlignHorizontal = spec.textAlign;
  node.name = spec.name || 'TEXT';
  return node;
}

async function createButtonNode(spec) {
  const frame = figma.createFrame();
  frame.name = spec.name || 'BUTTON';
  frame.layoutMode = 'HORIZONTAL';
  frame.primaryAxisAlignItems = 'CENTER';
  frame.counterAxisAlignItems = 'CENTER';
  frame.primaryAxisSizingMode = 'FIXED';
  frame.counterAxisSizingMode = 'FIXED';
  frame.resize(spec.width || 240, spec.height || 60);
  frame.cornerRadius = spec.cornerRadius != null ? spec.cornerRadius : 12;
  applyFill(frame, spec.background || '#111111');

  const label = figma.createText();
  label.fontName = await fontForWeight(spec.fontWeight || 700);
  label.characters = spec.text || spec.content || '버튼';
  label.fontSize = spec.fontSize || 20;
  applyFill(label, spec.color || '#FFFFFF');
  frame.appendChild(label);
  return frame;
}

function createImageAreaNode(spec) {
  const rect = figma.createRectangle();
  rect.name = spec.name || 'IMAGE_AREA';
  rect.resize(spec.width || 400, spec.height || 400);
  applyFill(rect, spec.background || '#D9D9D9');
  // 이미지 생성 프롬프트를 노드에 보관 — 나중에 실제 이미지로 교체할 때 참고용
  if (spec.prompt || spec.label) {
    rect.setPluginData('imagePrompt', spec.prompt || spec.label || '');
  }
  return rect;
}

async function createSectionNode(spec) {
  const frame = figma.createFrame();
  frame.name = spec.name || 'SECTION';
  frame.layoutMode = 'VERTICAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = spec.width ? 'FIXED' : 'AUTO';
  frame.primaryAxisAlignItems = 'CENTER';
  frame.counterAxisAlignItems = 'CENTER';
  frame.paddingTop = frame.paddingBottom = spec.paddingY != null ? spec.paddingY : 80;
  frame.paddingLeft = frame.paddingRight = spec.paddingX != null ? spec.paddingX : 60;
  frame.itemSpacing = spec.gap != null ? spec.gap : 24;
  applyFill(frame, spec.background || '#FFFFFF');
  if (spec.width) frame.resize(spec.width, 100);

  for (const child of spec.children || []) {
    const node = await createNode(child);
    if (node) frame.appendChild(node);
  }
  return frame;
}

async function createNode(spec) {
  switch (spec.type) {
    case 'SECTION':
      return createSectionNode(spec);
    case 'TEXT':
      return createTextNode(spec);
    case 'BUTTON':
      return createButtonNode(spec);
    case 'IMAGE_AREA':
      return createImageAreaNode(spec);
    default:
      console.warn('알 수 없는 type을 건너뜀: ' + spec.type);
      return null;
  }
}

function normalizeInput(data) {
  if (Array.isArray(data)) return data;
  if (data.sections) return data.sections;
  if (data.type) return [data];
  throw new Error('인식할 수 없는 JSON 구조입니다. "sections" 배열이나 type 필드가 있는 객체가 필요합니다.');
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'cancel') {
    figma.closePlugin();
    return;
  }
  if (msg.type !== 'generate') return;

  try {
    const data = JSON.parse(msg.json);
    const sections = normalizeInput(data);

    const root = figma.createFrame();
    root.name = data.label || data.name || '상세페이지 생성 결과';
    root.layoutMode = 'VERTICAL';
    root.primaryAxisSizingMode = 'AUTO';
    root.counterAxisSizingMode = 'AUTO';
    root.itemSpacing = 0;

    for (const sectionSpec of sections) {
      const node = await createNode(sectionSpec);
      if (node) root.appendChild(node);
    }

    figma.currentPage.appendChild(root);
    figma.viewport.scrollAndZoomIntoView([root]);
    figma.currentPage.selection = [root];

    figma.ui.postMessage({ type: 'result', ok: true, message: '레이아웃이 성공적으로 생성되었습니다! 캔버스에서 확인하세요.' });
  } catch (err) {
    figma.ui.postMessage({ type: 'result', ok: false, message: '오류: ' + err.message });
  }
};
