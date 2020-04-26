import React from "react";
import { Annotation, Point } from "react-simple-maps";

import CovidState from "../CovidState";
import { labelFontClass } from "../utils";

interface StateAnnoProps {
    centroid: Point;
    state: CovidState;
    date: Date;
}

const OFFSET_ID_X = 4;
const OFFSET_STATS_X = 16;
const OFFSET_STATS_Y = 16;

const FONT_SIZE_ID = 12;
const FONT_SIZE_STATS = 9;

const StateAnnotation : React.FC<StateAnnoProps> = ({ centroid, state, date }) => {

    const fontClass = labelFontClass(state.doubledInDays(date));

    return (
        <g>
            <Annotation
                subject={centroid}
                dx={(state.offset as Point)[0]}
                dy={(state.offset as Point)[1]}
                connectorProps={{}}
            >

                <text x={OFFSET_ID_X}
                    fontSize={FONT_SIZE_ID}
                    alignmentBaseline="middle"
                    className={fontClass}>
                    {state.label}
                    {state.ordersForDate(date)}
                </text>

                <text x={OFFSET_STATS_X} y={OFFSET_STATS_Y}
                    fontSize={FONT_SIZE_STATS}
                    textAnchor="middle"
                    className={fontClass}>
                    {state.displayDeaths(date)}
                </text>

            </Annotation>
        </g>
    );

};

export default StateAnnotation;
