import React from "react";
import "./index.css"
import {
    BrowserRouter,
    Routes,
    Route,
} from "react-router-dom";
import Home from "./components/Home";
import Authorisation from "./components/Authorisation";
import QRScan from "./components/QRScan";
import Item from "./components/Item";
import History from "./components/History";
import Utilization from "./components/Utilization";
import Report from "./components/ReportPDF/report";
import Compliance from "./components/Compliance";
import DBtemp from "./components/DBtemp";



function App() {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={<Home />}
                    />
                    <Route
                        path="/auth"
                        element={<Authorisation />}
                    />
                    <Route
                        path="/item"
                        element={<Item />}
                    />
                    <Route
                        path="/qrscan"
                        element={<QRScan />}
                    />
                    <Route
                        path="/history"
                        element={<History />}
                    />
                    <Route
                        path="/utillog"
                        element={<Utilization />}
                    />
                    <Route
                        path="/report"
                        element={<Report />}
                    />
                    <Route
                        path="/compliance"
                        element={<Compliance />}
                    />
                    <Route
                        path="/dbtemp"
                        element={<DBtemp />}
                    />
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;