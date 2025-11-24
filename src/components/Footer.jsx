// src/components/Footer.jsx
import { useEffect, useState } from "react";

export default function Footer() {
  // const [timeLeft, setTimeLeft] = useState(getRemainingTime());

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setTimeLeft(getRemainingTime());
  //   }, 1000);
  //   return () => clearInterval(interval);
  // }, []);

  return (
    <footer>
      <div style={{ width: "100%"}}>
        <span className="footer-session">Session time left:</span>
      </div>
    </footer>
  );
}
