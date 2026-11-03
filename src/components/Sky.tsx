interface Particle {
  top: string;
  left: string;
  size: number;
  delay: string;
  violet?: boolean;
}

const STARS: Particle[] = [
  { top: "6%", left: "10%", size: 3, delay: "0s" },
  { top: "4%", left: "24%", size: 2.5, delay: ".4s" },
  { top: "14%", left: "38%", size: 3.5, delay: ".8s", violet: true },
  { top: "4%", left: "52%", size: 2.5, delay: "1.2s" },
  { top: "18%", left: "64%", size: 3, delay: ".2s" },
  { top: "7%", left: "76%", size: 3, delay: "1.5s", violet: true },
  { top: "12%", left: "88%", size: 3.5, delay: "1.9s" },
  { top: "22%", left: "6%", size: 2.5, delay: ".6s" },
  { top: "28%", left: "46%", size: 3, delay: "1.7s", violet: true },
  { top: "33%", left: "82%", size: 2.5, delay: ".9s" },
  { top: "2%", left: "92%", size: 2.5, delay: "1.1s" },
  { top: "38%", left: "18%", size: 2.5, delay: "1.4s" },
];

interface Cloud {
  top: string;
  left: string;
  width: number;
  height: number;
  delay: string;
}

const CLOUDS: Cloud[] = [
  { top: "10%", left: "8%", width: 46, height: 16, delay: "0s" },
  { top: "7%", left: "30%", width: 32, height: 12, delay: "2s" },
  { top: "16%", left: "54%", width: 56, height: 18, delay: "4s" },
  { top: "6%", left: "76%", width: 34, height: 13, delay: "6s" },
  { top: "20%", left: "18%", width: 26, height: 10, delay: "1s" },
  { top: "24%", left: "68%", width: 40, height: 14, delay: "3s" },
];

export default function Sky() {
  return (
    <div className="sky" aria-hidden="true">
      <div className="sky-stars">
        {STARS.map((star, i) => (
          <span
            key={i}
            className={`star${star.violet ? " violet" : ""}`}
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>
      <div className="sky-clouds">
        {CLOUDS.map((cloud, i) => (
          <span
            key={i}
            className="cloud"
            style={{
              top: cloud.top,
              left: cloud.left,
              width: cloud.width,
              height: cloud.height,
              animationDelay: cloud.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
}
