"use client";

import { useState } from "react";
import Image from "next/image";
import { thingCategories, things, type ThingCategory } from "@/content/things";
import { DeskObject } from "./DeskObject";
import styles from "@/app/things/things.module.css";

export function ThingsGallery() {
  const [category, setCategory] = useState<ThingCategory | "All">("All");
  const visibleThings = category === "All" ? things : things.filter((thing) => thing.category === category);

  return (
    <section aria-label="The collection">
      <div className={styles.collectionBar}>
        <div className={styles.filters} role="group" aria-label="Filter the collection">
          {(["All", ...thingCategories] as const).map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={category === name}
              aria-controls="things-grid"
              onClick={() => setCategory(name)}
              className={styles.filter}
            >
              {name}
              <span className={styles.filterCount}>
                <span className="sr-only">: </span>{name === "All" ? things.length : things.filter((thing) => thing.category === name).length}
              </span>
            </button>
          ))}
        </div>
        <span className={styles.collectionLabel} aria-hidden="true">Collected, not ranked</span>
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Showing {visibleThings.length} {category === "All" ? "things" : category.toLowerCase() + " items"}.
      </p>

      <ul id="things-grid" className={styles.grid}>
        {visibleThings.map((thing) => (
          <li key={thing.id} className={styles.item}>
            <figure>
              <div className={styles.object} data-kind={thing.illustration ?? "photo"} data-object={thing.id}>
                {thing.image !== undefined ? (
                  <Image
                    src={thing.image}
                    alt=""
                    fill
                    sizes="(max-width: 600px) 44vw, (max-width: 1000px) 29vw, 270px"
                    className={styles.photo}
                  />
                ) : (
                  <DeskObject kind={thing.illustration} />
                )}
              </div>
              <figcaption className={styles.caption}>
                <h2>{thing.name}</h2>
                <p>{thing.detail}</p>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
