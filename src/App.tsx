import { Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import HomePage from './pages/HomePage';
import ExplanationPage from './pages/ExplanationPage';

function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explanation" element={<ExplanationPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
