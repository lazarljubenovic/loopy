export function el<K extends keyof SVGElementTagNameMap>(tagName: K): SVGElementTagNameMap[K] {
  return document.createElementNS('http://www.w3.org/2000/svg', tagName)
}

export function svg (): SVGSVGElement {
  return el('svg')
}

export function g (...svgElements: SVGElement[]): SVGGElement {
  const element = el('g')
  element.append(...svgElements)
  return element
}

export function circle (cx: number, cy: number, r: number): SVGCircleElement {
  const element = el('circle')
  element.setAttribute('cx', cx.toString(10))
  element.setAttribute('cy', cy.toString(10))
  element.setAttribute('r', r.toString(10))
  return element
}

export function path (d: string): SVGPathElement {
  const element = el('path')
  element.setAttribute('d', d)
  return element
}

export function rect (width: number, height: number): SVGRectElement {
  const element= el('rect')
  element.setAttribute('width', width.toString(10))
  element.setAttribute('height', height.toString(10))
  return element
}
