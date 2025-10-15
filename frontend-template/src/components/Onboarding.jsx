import React, { useEffect, useState } from "react";
//import './Onboarding.css';
import '../Onboarding.css' 

const Onboarding = ({ onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete();
    }, 7000); // 7-second animation
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className="onboarding__wrapper">
    <div className="onboarding__content">
      <h1 className="onboarding__title">🧠 AutoTestMate</h1>
      <p className="onboarding__subtitle">AI-powered test case generator</p>
      <div className="onboarding__dots">
        <div className="onboarding__dot" />
        <div className="onboarding__dot" />
        <div className="onboarding__dot" />
      </div>
      <button
        className="mt-6 bg-white text-indigo-700 px-6 py-2 rounded-lg shadow hover:bg-indigo-100 transition"
        onClick={() => { setShow(false); onComplete(); }}
      >
        Skip →
      </button>
    </div>
  </div>
  );
};

export default Onboarding;