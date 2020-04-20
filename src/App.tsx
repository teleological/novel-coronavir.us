import React from 'react';

import "react-datepicker/dist/react-datepicker.css";
import './App.css';

import DatePicker from "react-datepicker";

import { DATE_MIN,
         IndexedStateData,
         fetchCovidTrackingDailyData,
         parseDate } from "./CovidTracking";
import UsMapChart from "./MapChartUs";
import PlaybackControls from "./PlaybackControls";

interface AppState {
    date: Date;
    minDate: Date;
    maxDate: Date;
    stateData: IndexedStateData;
    player: null | ReturnType<typeof setInterval>;
}

class App extends React.Component<any,AppState> {

    constructor(props:any) {
        super(props)
        const today = new Date();
        this.state = {
            date: today,
            minDate: DATE_MIN,
            maxDate: today,
            stateData: {},
            player: null
        };
        this.onDateChange = this.onDateChange.bind(this);
    }

    onDateChange(date:Date) {
        this.setState({ date: date });
    }

    rewind() {
        this.setState({ date: this.state.minDate });
    }

    stepBackOneDay() {
        const previousDay = new Date(this.state.date);
        previousDay.setDate(this.state.date.getDate() - 1);
        if (previousDay >= this.state.minDate) {
            this.setState({ date: previousDay });
        }
    }

    stepForwardOneDay() {
        const nextDay = new Date(this.state.date);
        nextDay.setDate(this.state.date.getDate() + 1);
        if (nextDay <= this.state.maxDate) {
            this.setState({ date: nextDay });
        }
    }

    fastForward() {
        this.setState({ date: this.state.maxDate });
    }

    componentDidMount() {
        fetchCovidTrackingDailyData().then(dataByFips => {
            let latest = parseDate(dataByFips["36"][0].date);
            this.setState({
                date: latest,
                maxDate: latest,
                stateData : dataByFips
            });
        });
    }

    play() {
        if (this.state.player === null) {
            this.setState({ player: setInterval(() => {
                if (this.state.date < this.state.maxDate) {
                    this.stepForwardOneDay();
                } else {
                    this.pause();
                }
            }, 1000) });
        }
    }

    pause() {
        if (this.state.player) {
            clearInterval(this.state.player);
            this.setState({ player: null });
        }
    }

    render() {
        return (
            <>
            <div className="App">
				<PlaybackControls
                  className="controls"
				  isPlaying={this.state.player !== null}
                  onPlaybackChange={
                      isPlaying => isPlaying ? this.pause() : this.play()
                  }
				  hasPrevious={() => this.state.date > this.state.minDate}
				  hasNext={() => this.state.date < this.state.maxDate}
				  onPrevious={() => this.stepBackOneDay()}
				  onNext={() => this.stepForwardOneDay()}
				  onRewind={() => this.rewind()}
				  onFastForward={() => this.fastForward()}
				/>
                <DatePicker
                    minDate={this.state.minDate}
                    maxDate={this.state.maxDate}
                    selected={this.state.date}
                    onChange={this.onDateChange} />

                <hgroup>
                    <h1>COVID-19 Deaths per Million</h1>
                </hgroup>

                <UsMapChart
                    stateData={this.state.stateData}
                    date={this.state.date} />
            </div>
            <small className="legend">
                Deaths doubled in: <b>&lt;= 1 week</b>, <i>&gt;= 2 weeks</i><br/>
                🛑 = statewide stay-at-home; ⚠️ = partial closure
            </small>
            </>
        );
    }
}

export default App;
