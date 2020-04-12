import React from 'react';

import './App.css';
import "react-datepicker/dist/react-datepicker.css";

import DatePicker from "react-datepicker";

import { DATE_MIN, IndexedStateData, fetchCovidTrackingDailyData, parseDate } from "./CovidTracking";
import UsMapChart from "./MapChartUs";

interface AppState {
    date: Date;
    minDate: Date;
    maxDate: Date;
    stateData: IndexedStateData;
}

class App extends React.Component<any,AppState> {

    constructor(props:any) {
        super(props)
        const today = new Date();
        this.state = {
            date: today,
            minDate: DATE_MIN,
            maxDate: today,
            stateData: {}
        };
        this.onDateChange = this.onDateChange.bind(this);
    }

    onDateChange(date:Date) {
        this.setState({ date: date });
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

    render() {
        return (
            <>
            <div className="App">
                <DatePicker
                    minDate={this.state.minDate}
                    maxDate={this.state.maxDate}
                    selected={this.state.date}
                    onChange={this.onDateChange} />
                <h1>COVID-19 Deaths per Million</h1>
                <UsMapChart
                    stateData={this.state.stateData}
                    date={this.state.date} />
            </div>
            </>
        );
    }
}

export default App;
