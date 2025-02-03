import "./App.css";
import { TimelineScheduler } from "./components/templates";
import { demoSchedulerData } from "./data/demo";

function App() {
  return (
    <div className="w-screen h-screen flex items-center justify-center ">
      <TimelineScheduler config={demoSchedulerData} scrollIntoToday />
    </div>
  );
}

export default App;
