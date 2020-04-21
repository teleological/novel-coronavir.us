import React, { useState, useEffect, useRef } from 'react';
import DatePicker from "react-datepicker";
import addDays from "date-fns/addDays";
import subDays from "date-fns/subDays";

import { DATE_MIN,
         IndexedStateData,
         fetchCovidTrackingDailyData,
         parseDate } from "../CovidTracking";

import PlaybackControls from "./PlaybackControls";
import UsMapChart from "./MapChartUs";

import "react-datepicker/dist/react-datepicker.css";
import "../styles/App.css";

interface AppState {
    date: Date;
    minDate: Date;
    maxDate: Date;
    stateData: IndexedStateData;
    player: null | ReturnType<typeof setInterval>;
}

const App : React.FC = () => {
    const today = new Date();

    const [date, setDate] = useState<Date>(today);
    const [minDate, _setMinDate] = useState<Date>(DATE_MIN);
    const [maxDate, setMaxDate] = useState<Date>(today);
    const [player, setPlayer] = useState<ReturnType<typeof setInterval> | null>(null);
    const [indexedStateData, setIndexedStateData] = useState<IndexedStateData>({});

    const dateRef = useRef(date);
    dateRef.current = date;

    const maxDateRef = useRef(maxDate);
    maxDateRef.current = maxDate;

    useEffect(() => {
        fetchCovidTrackingDailyData().then(dataByFips => {
            const latest = parseDate(dataByFips["36"][0].date);
            setDate(latest);
            setMaxDate(latest);
            setIndexedStateData(dataByFips);
        });

        return () => {
            if (player !== null) {
                clearInterval(player);
            }
        };
    }, []);

    const rewind = () => setDate(minDate);
    const fastForward = () => setDate(maxDate);

    const stepBackOneDay = () => {
        const previousDay = subDays(date, 1);
        if (previousDay >= minDate) {
            setDate(previousDay);
        }
    };

    // used in callback: can't directly access state variables
    const stepForwardOneDay = () => {
        const nextDay = addDays(dateRef.current, 1);
        if (nextDay <= maxDateRef.current) {
            setDate(nextDay);
        }
    };

    const play = () => {
        if (player !== null) {
            clearInterval(player);
        }

        setPlayer(setInterval(() => {
            if (dateRef.current < maxDateRef.current) {
                stepForwardOneDay();
            } else {
                pause();
            }
        }, 1000));
    };

    const pause = () => {
        if (player !== null) {
            clearInterval(player);
        }
        setPlayer(null);
    };

    return (
        <>
        <div className="App">
            <PlaybackControls
              className="controls"
              isPlaying={player !== null}
              onPlaybackChange={
                  isPlaying => isPlaying ? pause() : play()
              }
              hasPrevious={() => (date > minDate)}
              hasNext={() => (date < maxDate)}
              onPrevious={stepBackOneDay}
              onNext={stepForwardOneDay}
              onRewind={rewind}
              onFastForward={fastForward}
            />
            <DatePicker
                minDate={minDate}
                maxDate={maxDate}
                selected={date}
                onChange={(date) => (date && setDate(date))} />

            <hgroup>
                <h1>COVID-19 Deaths per Million</h1>
            </hgroup>

            <UsMapChart
                stateData={indexedStateData}
                date={date} />
        </div>
        <small className="legend">
            Deaths doubled in: <b>&lt;= 1 week</b>, <i>&gt;= 2 weeks</i><br/>
            Statewide orders: 🛑 = stay-at-home; ⚠️ = closures; 🏁 = lifted
        </small>
        </>
    );
}

export default App;
