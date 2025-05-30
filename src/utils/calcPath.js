import { tableFieldHeight, tableHeaderHeight } from "../data/constants";
import { useDiagram } from "../hooks";
import { dbToTypes } from "../data/datatypes";

export function getTableWidth(tableData, tableWidth) {
  const { database } = useDiagram();
  
  const fieldDescLengths = tableData.fields.map((e, i) => {
    const nameSize = e.name.length * 12;

    const typeSize =
      `${
        e.type +
        ((dbToTypes[database][e.type].isSized ||
          dbToTypes[database][e.type].hasPrecision) &&
        e.size &&
        e.size !== ""
          ? "(" + e.size + ")"
          : "")
      }`.length * 13;
    
    return nameSize + typeSize;
  });
  const maxFieldDescLength = Math.max(...fieldDescLengths);
  const maxWidth = Math.max(tableData.name.length, maxFieldDescLength);
  const width = Math.max(Math.min(tableWidth, maxWidth), 180);
  
  return width
}

export function getSvgBoundingBox(element) {
  const svg = document.getElementById("diagram");
  
  if (!element || !svg) return null;

  const rect = element.getBoundingClientRect();
  const ctm = svg.getScreenCTM()?.inverse();
  if (!ctm) return null;

  const point = svg.createSVGPoint();

  point.x = rect.x;
  point.y = rect.y;
  const topLeft = point.matrixTransform(ctm);

  point.x = rect.x + rect.width;
  point.y = rect.y + rect.height;
  const bottomRight = point.matrixTransform(ctm);

  return {
    y: topLeft.y,
    height: bottomRight.y - topLeft.y,
  };
}

/**
 * Generates an SVG path string to visually represent a relationship between two fields.
 *
 * @param {{
 *   startTable: { x: number, y: number },
 *   endTable: { x: number, y: number },
 *   startFieldIndex: number,
 *   endFieldIndex: number,
 *   startTableData: Object,
 *   endTableData: Object,
 * }} r - Relationship data.
 * @param {number} tableWidth - Width of each table (used to calculate horizontal offsets).
 * @param {number} zoom - Zoom level (used to scale vertical spacing).
 * @returns {string} SVG path "d" attribute string.
 */
export function calcPath(r, tableWidth = 200, zoom = 1) {
  if (!r) {
    return "";
  }
  
  const startTableWidth = getTableWidth(r.startTableData, tableWidth) * zoom;
  const endTableWidth = getTableWidth(r.endTableData, tableWidth) * zoom;
  
  const startEl = document.getElementById(r.startTableData.fields[r.startFieldIndex].id);
  const endEl = document.getElementById(r.endTableData.fields[r.endFieldIndex].id);
  
  const starTableFieldDiv = getSvgBoundingBox(startEl);
  const endTableFieldDiv = getSvgBoundingBox(endEl);
  
  const minwidth = Math.min(startTableWidth, endTableWidth);
  
  let x1 = r.startTable.x;
  let y1 = (starTableFieldDiv) ? (starTableFieldDiv.y + (starTableFieldDiv.height / 2)) : (r.startTable.y + r.startFieldIndex * tableFieldHeight + tableHeaderHeight + tableFieldHeight / 2);
  
  let x2 = r.endTable.x;
  let y2 = (endTableFieldDiv) ? (endTableFieldDiv.y + (endTableFieldDiv.height / 2)) : (r.endTable.y + r.endFieldIndex * tableFieldHeight + tableHeaderHeight + tableFieldHeight / 2);

  let radius = 10 * zoom;
  
  const startmidX = (x2 + x1 + startTableWidth) / 2;
  const endmidX = (x2 + x1 + endTableWidth) / 2;
  const minmidX = (x2 + x1 + minwidth) / 2;

  const endX = x2 + endTableWidth < x1 ? x2 + endTableWidth : x2;
  
  const maxendX = Math.max(x1 + startTableWidth, x2 + endTableWidth);

  if (Math.abs(y1 - y2) <= 36 * zoom) {
    radius = Math.abs(y2 - y1) / 3;
    if (radius <= 2) {
      if (x1 + startTableWidth <= x2) return `M ${x1 + startTableWidth} ${y1} L ${x2} ${y2 + 0.1}`;
      else if (x2 + endTableWidth < x1)
        return `M ${x1} ${y1} L ${x2 + endTableWidth} ${y2 + 0.1}`;
    }
  }
  
  if (y1 <= y2) {
    if (x1 + startTableWidth <= x2) {
      const midX = (startTableWidth <= endTableWidth ? minmidX : startmidX);
      return `M ${x1 + startTableWidth} ${y1} L ${midX - radius} ${y1} A ${radius} ${radius} 0 0 1 ${midX} ${y1 + radius} L ${midX} ${y2 - radius} A ${radius} ${radius} 0 0 0 ${midX + radius} ${y2} L ${endX} ${y2}`;

    } else if (x1 <= x2 && x1 + startTableWidth >= x2) {
	  return `M ${x1} ${y1} L ${x1 - radius} ${y1} A ${radius} ${radius} 0 0 0 ${x1 - radius - radius} ${y1 + radius} L ${x1 - radius - radius} ${y2 - radius} A ${radius} ${radius} 0 0 0 ${x1 - radius} ${y2} L ${x2} ${y2}`;

    } else if (x1 >= x2 && x1 <= x2 + endTableWidth) {
	  return `M ${x1 + startTableWidth} ${y1} L ${maxendX + radius} ${y1} A ${radius} ${radius} 0 0 1 ${maxendX + radius + radius} ${y1 + radius} L ${maxendX + radius + radius} ${y2 - radius} A ${radius} ${radius} 0 0 1 ${maxendX + radius} ${y2} L ${x2 + endTableWidth} ${y2}`;

    } else {
      const midX = (startTableWidth >= endTableWidth ? minmidX : endmidX);
      return `M ${x1} ${y1} L ${midX + radius} ${y1} A ${radius} ${radius} 0 0 0 ${midX} ${y1 + radius} L ${midX} ${y2 - radius} A ${radius} ${radius} 0 0 1 ${midX - radius} ${y2} L ${endX} ${y2}`;
    }
  } else {
    if (x1 + startTableWidth <= x2) {
      const midX = (startTableWidth <= endTableWidth ? minmidX : startmidX);
      return `M ${x1 + startTableWidth} ${y1} L ${midX - radius} ${y1} A ${radius} ${radius} 0 0 0 ${midX} ${y1 - radius} L ${midX} ${y2 + radius} A ${radius} ${radius} 0 0 1 ${midX + radius} ${y2} L ${endX} ${y2}`;
    
    } else if (x1 <= x2 && x1 + startTableWidth >= x2) {
      return `M ${x1} ${y1} L ${x1 - radius - radius} ${y1} A ${radius} ${radius} 0 0 1 ${x1 - radius - radius - radius} ${y1 - radius} L ${x1 - radius - radius - radius} ${y2 + radius} A ${radius} ${radius} 0 0 1 ${x1 - radius - radius} ${y2} L ${endX} ${y2}`;
      
    } else if (x1 >= x2 && x1 <= x2 + endTableWidth) {
      return `M ${x1 + startTableWidth} ${y1} L ${maxendX + radius} ${y1} A ${radius} ${radius} 0 0 0 ${maxendX + radius + radius} ${y1 - radius} L ${maxendX + radius + radius} ${y2 + radius} A ${radius} ${radius} 0 0 0 ${maxendX + radius} ${y2} L ${x2 + endTableWidth} ${y2}`;

    } else {
      const midX = (startTableWidth >= endTableWidth ? minmidX : endmidX);
      return `M ${x1} ${y1} L ${midX + radius} ${y1} A ${radius} ${radius} 0 0 1 ${midX} ${y1 - radius} L ${midX} ${y2 + radius} A ${radius} ${radius} 0 0 0 ${midX - radius} ${y2} L ${endX} ${y2}`;
    }
  }
}
