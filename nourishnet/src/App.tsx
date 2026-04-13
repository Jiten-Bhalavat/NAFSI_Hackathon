import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Consumer from "./pages/Consumer";
import Donor from "./pages/Donor";
import Planner from "./pages/Planner";
import About from "./pages/About";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="find-food" element={<Consumer />} />
        <Route path="donate" element={<Donor />} />
        <Route path="volunteer" element={<Planner />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>
  );
}
