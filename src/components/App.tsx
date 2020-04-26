import React, { useState, useEffect, useRef } from 'react';
import DatePicker from "react-datepicker";
import addDays from "date-fns/addDays";
import subDays from "date-fns/subDays";

import { DATE_MIN,
         fetchCovidTrackingDailyData,
         parseCovidDate } from "../CovidTracking";
import CovidState, { IndexedStates } from "../CovidState";

import PlaybackControls from "./PlaybackControls";
import UsMap from "./UsMap";

import "react-datepicker/dist/react-datepicker.css";
import "../styles/App.css";

type TimeoutId = ReturnType<typeof setTimeout>;

const DELAY_PLAY_MS = 1000;
const FIPS_NY = "36";

const App : React.FC = () => {
    const today = new Date();

    const [date, setDate] = useState<Date>(today);
    const [minDate, _setMinDate] = useState<Date>(DATE_MIN);
    const [maxDate, setMaxDate] = useState<Date>(today);
    const [player, setPlayer] = useState<TimeoutId|null>(null);
    const [states, setStates] = useState<IndexedStates>(CovidState.buildStates({}));

    const dateRef = useRef(date);
    dateRef.current = date;
    const maxDateRef = useRef(maxDate);
    maxDateRef.current = maxDate;

    const playerRef = useRef(player);
    playerRef.current = player;

    const disableDateTextInput = () => {
        const datePicker = document.getElementsByClassName("datepicker")[0];
        datePicker.setAttribute("readOnly", "true");
    };

    const initializeCovidTrackingData = () => {
        fetchCovidTrackingDailyData().then(dailyByFips => {
            const latest = parseCovidDate(dailyByFips[FIPS_NY][0].date);
            setDate(latest);
            setMaxDate(latest);
            setStates(CovidState.buildStates(dailyByFips));
        });
    };

    const cleanUpPlayer = () => {
        if (playerRef.current !== null) {
            clearTimeout(playerRef.current);
        }
    };

    useEffect(() => {
        disableDateTextInput();
        initializeCovidTrackingData();
        return cleanUpPlayer;
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

    function play() {
        if (player !== null) {
            clearTimeout(player);
        }
        if (dateRef.current < maxDateRef.current) {
            stepForwardOneDay();
            setPlayer(setTimeout(play, DELAY_PLAY_MS));
        } else {
            pause();
        }
    };

    const pause = () => {
        if (player !== null) {
            clearTimeout(player);
        }
        setPlayer(null);
    };

    return (
        <>
        <div className="App">
            <div className="dateControls">
                <PlaybackControls
                  className="playback"
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
                    onChange={(date) => (date && setDate(date))}
                    className="datepicker"
                    withPortal
                />
            </div>

            <UsMap states={states} date={date} />
        </div>
        <small className="legend">
            Deaths per million, doubled in: <b>&lt;= 1 week</b>, <i>&gt;= 2 weeks</i><br/>
            Statewide orders: 🛑 = stay-at-home; ⚠️ = closures; 🏁 = lifted
        </small>
        </>
    );
}

export default App;
