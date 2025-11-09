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
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;