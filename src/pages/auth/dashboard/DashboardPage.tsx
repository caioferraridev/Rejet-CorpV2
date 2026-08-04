import { useEffect, useState } from "react";

import styles from "./DashboardPage.module.css";

import DashboardLayout from "../../../components/layout/DashboardLayout/DashboardLayout";

const IMAGES = [
  "https://picsum.photos/id/1015/1200/500",
  "https://picsum.photos/id/1016/1200/500",
  "https://picsum.photos/id/1018/1200/500",
];

export default function DashboardPage() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % IMAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [paused]);

  function goToSlide(slide: number) {
    setIndex(((slide % IMAGES.length) + IMAGES.length) % IMAGES.length);
  }

  return (
    <DashboardLayout active="inicio">
      <section
        className={styles.hero}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className={styles.carousel}>
          {IMAGES.map((image, i) => (
            <img
              key={image}
              src={image}
              alt={`Banner ${i + 1}`}
              className={i === index ? styles.active : ""}
            />
          ))}

          <button
            type="button"
            className={`${styles.btn} ${styles.prev}`}
            onClick={() => goToSlide(index - 1)}
          >
            ❮
          </button>

          <button
            type="button"
            className={`${styles.btn} ${styles.next}`}
            onClick={() => goToSlide(index + 1)}
          >
            ❯
          </button>

          <div className={styles.dots}>
            {IMAGES.map((_, i) => (
              <span
                key={i}
                className={i === index ? styles.dotActive : styles.dot}
                onClick={() => goToSlide(i)}
              />
            ))}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
