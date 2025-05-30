import { useEffect, useRef, useState } from "react";
import {
  Cardinality,
  darkBgTheme,
  ObjectType,
  Tab,
} from "../../data/constants";
import { calcPath } from "../../utils/calcPath";
import { useDiagram, useSettings, useLayout, useSelect } from "../../hooks";
import { useTranslation } from "react-i18next";
import { SideSheet } from "@douyinfe/semi-ui";
import RelationshipInfo from "../EditorSidePanel/RelationshipsTab/RelationshipInfo";

const labelFontSize = 16;

export default function Relationship({ data }) {
  const { settings } = useSettings();
  const { tables } = useDiagram();
  const { layout } = useLayout();
  const { selectedElement, setSelectedElement } = useSelect();
  const { t } = useTranslation();
  
  const [pathValues, setPathValues] = useState(null);
  
  useEffect(() => {
    const startTable = tables.find((t) => t.id === data.startTableId);
    const endTable = tables.find((t) => t.id === data.endTableId);

    if (!startTable || !endTable) return null;
    
    setPathValues({
      startFieldIndex: startTable.fields.findIndex(
        (f) => f.id === data.startFieldId,
      ),
      endFieldIndex: endTable.fields.findIndex((f) => f.id === data.endFieldId),
      startTable: { x: startTable.x, y: startTable.y },
      endTable: { x: endTable.x, y: endTable.y },
      startTableData: startTable,
      endTableData: endTable,
    })
  }, [tables, data, settings.showComments]);

  const theme = localStorage.getItem("theme");

  const pathRef = useRef();
  const labelRef = useRef();

  let cardinalityStart = "1";
  let cardinalityEnd = "1";

  switch (data.cardinality) {
    // the translated values are to ensure backwards compatibility
    case t(Cardinality.MANY_TO_ONE):
    case Cardinality.MANY_TO_ONE:
      cardinalityStart = "n";
      cardinalityEnd = "1";
      break;
    case t(Cardinality.ONE_TO_MANY):
    case Cardinality.ONE_TO_MANY:
      cardinalityStart = "1";
      cardinalityEnd = "n";
      break;
    case t(Cardinality.ONE_TO_ONE):
    case Cardinality.ONE_TO_ONE:
      cardinalityStart = "1";
      cardinalityEnd = "1";
      break;
    default:
      break;
  }

  let labelWidth = labelRef.current?.getBBox().width ?? 0;
  let labelHeight = labelRef.current?.getBBox().height ?? 0;

  const cardinalityOffset = 28;

  const [cardinalityStarts, setCardinalityStarts] = useState({ x: 0, y: 0 });
  const [cardinalityEnds, setCardinalityEnds] = useState({ x: 0, y: 0 });
  const [labelPoints, setLabelPoints] = useState({ x: 0, y: 0 });
    
  useEffect(() => {
    if (!pathRef.current) return;

    const pathLength = pathRef.current.getTotalLength();
    
    const labelPoint = pathRef.current.getPointAtLength(pathLength / 2);
    setLabelPoints({ x: labelPoint.x - labelWidth / 2, y: labelPoint.y + labelHeight / 2 });

    const point1 = pathRef.current.getPointAtLength(cardinalityOffset);
    const point2 = pathRef.current.getPointAtLength(pathLength - cardinalityOffset);

    setCardinalityStarts({ x: point1.x, y: point1.y });
    setCardinalityEnds({ x: point2.x, y: point2.y });
  }, [pathValues]);
  
  let cardinalityStartX = cardinalityStarts.x;
  let cardinalityEndX = cardinalityEnds.x;
  let cardinalityStartY = cardinalityStarts.y;
  let cardinalityEndY = cardinalityEnds.y;
  let labelX = labelPoints.x;
  let labelY = labelPoints.y;

  const edit = () => {
    if (!layout.sidebar) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.RELATIONSHIP,
        id: data.id,
        open: true,
      }));
    } else {
      setSelectedElement((prev) => ({
        ...prev,
        currentTab: Tab.RELATIONSHIPS,
        element: ObjectType.RELATIONSHIP,
        id: data.id,
        open: true,
      }));
      if (selectedElement.currentTab !== Tab.RELATIONSHIPS) return;
      document
        .getElementById(`scroll_ref_${data.id}`)
        .scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <g className="select-none group" onDoubleClick={edit}>
        {pathValues && (
        <path
          ref={pathRef}
          d={calcPath(pathValues, settings.tableWidth)}
          stroke="gray"
          className="group-hover:stroke-sky-700"
          fill="none"
          strokeWidth={2}
          cursor="pointer"
        />
        )}
        {settings.showRelationshipLabels && pathValues && (
          <>
            <rect
              x={labelX - 2}
              y={labelY - labelFontSize}
              fill={theme === "dark" ? darkBgTheme : "white"}
              width={labelWidth + 4}
              height={labelHeight}
            />
            <text
              x={labelX}
              y={labelY}
              fill={theme === "dark" ? "lightgrey" : "#333"}
              fontSize={labelFontSize}
              fontWeight={500}
              ref={labelRef}
              className="group-hover:fill-sky-700"
            >
              {data.name}
            </text>
          </>
        )}
        {pathRef.current && settings.showCardinality && pathValues && (
          <>
            <circle
              cx={cardinalityStartX}
              cy={cardinalityStartY}
              r="12"
              fill="grey"
              className="group-hover:fill-sky-700"
            />
            <text
              x={cardinalityStartX}
              y={cardinalityStartY}
              fill="white"
              strokeWidth="0.5"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {cardinalityStart}
            </text>
            <circle
              cx={cardinalityEndX}
              cy={cardinalityEndY}
              r="12"
              fill="grey"
              className="group-hover:fill-sky-700"
            />
            <text
              x={cardinalityEndX}
              y={cardinalityEndY}
              fill="white"
              strokeWidth="0.5"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {cardinalityEnd}
            </text>
          </>
        )}
      </g>
      <SideSheet
        title={t("edit")}
        size="small"
        visible={
          selectedElement.element === ObjectType.RELATIONSHIP &&
          selectedElement.id === data.id &&
          selectedElement.open &&
          !layout.sidebar
        }
        onCancel={() => {
          setSelectedElement((prev) => ({
            ...prev,
            open: false,
          }));
        }}
        style={{ paddingBottom: "16px" }}
      >
        <div className="sidesheet-theme">
          <RelationshipInfo data={data} />
        </div>
      </SideSheet>
    </>
  );
}
