import { BrowserRouter, Routes, Route } from "react-router-dom";

export function AppRoutes() {
    return (
        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={<h1>Login</h1>}
                />

            </Routes>

        </BrowserRouter>
    );
}