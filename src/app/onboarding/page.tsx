"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { GeocodeResult } from "@/lib/geocode";
import { isBirthTimeComplete, isValidBirthDate, TIME_WINDOWS } from "@/lib/onboarding";
import { saveBirthData } from "@/lib/storage/birthData";
import type { ApproxWindow, BirthData, TimeAccuracy } from "@/lib/types";

const MIN_PLACE_QUERY_LENGTH = 3;
const PLACE_SEARCH_DEBOUNCE_MS = 500;

const MIN_DATE = "1900-01-01";
const TODAY = new Date().toISOString().slice(0, 10);

const buttonClass =
  "min-h-[44px] rounded-md border border-black/[.12] px-4 py-2 text-sm font-medium dark:border-white/[.18]";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);

  const [date, setDate] = useState("");
  const [timeAccuracy, setTimeAccuracy] = useState<TimeAccuracy>("unknown");
  const [time, setTime] = useState("");
  const [approxWindow, setApproxWindow] = useState<ApproxWindow | undefined>(undefined);
  const [placeQuery, setPlaceQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<GeocodeResult | null>(null);
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const dateValid = isValidBirthDate(date, TODAY);
  const timeValid = isBirthTimeComplete(timeAccuracy, time, approxWindow);
  const placeQueryLongEnough = placeQuery.trim().length >= MIN_PLACE_QUERY_LENGTH;
  const visibleResults = placeQueryLongEnough ? searchResults : [];
  const visibleSearchError = placeQueryLongEnough ? searchError : null;

  useEffect(() => {
    const query = placeQuery.trim();
    if (query.length < MIN_PLACE_QUERY_LENGTH) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      setSearchError(null);
      fetch(`/api/geocode?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error("search failed");
          return res.json() as Promise<GeocodeResult[]>;
        })
        .then((results) => setSearchResults(results))
        .catch((err: unknown) => {
          if (err instanceof Error && err.name !== "AbortError") {
            setSearchError("Couldn't search right now. Try again.");
          }
        })
        .finally(() => setIsSearching(false));
    }, PLACE_SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [placeQuery]);

  function goNext() {
    setTouched(true);
    if (step === 0 && !dateValid) return;
    if (step === 1 && !timeValid) return;
    setTouched(false);
    setStep((s) => Math.min(s + 1, 2));
  }

  function goBack() {
    setTouched(false);
    setStep((s) => Math.max(s - 1, 0));
  }

  const isComplete = dateValid && timeValid && selectedPlace !== null;

  function handleFinish() {
    if (!isComplete || !selectedPlace) return;

    const birthData: BirthData = {
      version: 1,
      date,
      timeAccuracy,
      ...(timeAccuracy === "exact" ? { time } : {}),
      ...(timeAccuracy === "approximate" ? { approxWindow } : {}),
      place: selectedPlace,
    };

    saveBirthData(birthData);
    router.push("/chart?first=1");
  }

  return (
    <div className="mx-auto flex max-w-[480px] flex-1 flex-col gap-6 p-6">
      {step === 0 && (
        <section className="flex flex-col gap-2">
          <label htmlFor="birth-date" className="text-lg font-semibold">
            Birth date
          </label>
          <input
            id="birth-date"
            type="date"
            value={date}
            min={MIN_DATE}
            max={TODAY}
            onChange={(e) => setDate(e.target.value)}
            className="min-h-[44px] rounded-md border border-black/[.12] px-3 dark:border-white/[.18]"
          />
          {touched && !dateValid && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Enter a date between Jan 1, 1900 and today.
            </p>
          )}
        </section>
      )}

      {step === 1 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Birth time</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Your birth certificate usually has it.
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="timeAccuracy"
                checked={timeAccuracy === "exact"}
                onChange={() => setTimeAccuracy("exact")}
              />
              Exact time
            </label>
            {timeAccuracy === "exact" && (
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="min-h-[44px] rounded-md border border-black/[.12] px-3 dark:border-white/[.18]"
              />
            )}

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="timeAccuracy"
                checked={timeAccuracy === "approximate"}
                onChange={() => setTimeAccuracy("approximate")}
              />
              Roughly
            </label>
            {timeAccuracy === "approximate" && (
              <div className="flex flex-wrap gap-2">
                {TIME_WINDOWS.map((w) => (
                  <button
                    key={w.key}
                    type="button"
                    onClick={() => setApproxWindow(w.key)}
                    className={`${buttonClass} ${
                      approxWindow === w.key ? "bg-black text-white dark:bg-white dark:text-black" : ""
                    }`}
                  >
                    {w.label} ({w.range})
                  </button>
                ))}
              </div>
            )}

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="timeAccuracy"
                checked={timeAccuracy === "unknown"}
                onChange={() => setTimeAccuracy("unknown")}
              />
              I don&apos;t know
            </label>
          </div>
          {touched && !timeValid && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {timeAccuracy === "exact"
                ? "Enter a time, or choose a different option."
                : "Pick a window, or choose a different option."}
            </p>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-2">
          <label htmlFor="birth-place" className="text-lg font-semibold">
            Birth place
          </label>

          {selectedPlace ? (
            <div className="flex items-center justify-between gap-2 rounded-md border border-black/[.12] px-3 py-2 dark:border-white/[.18]">
              <span>{selectedPlace.name}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlace(null);
                  setPlaceQuery("");
                }}
                className="text-sm font-medium underline"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <input
                id="birth-place"
                type="text"
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                placeholder="Start typing a city..."
                className="min-h-[44px] rounded-md border border-black/[.12] px-3 dark:border-white/[.18]"
              />
              {placeQueryLongEnough && isSearching && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Searching...</p>
              )}
              {visibleSearchError && (
                <p className="text-sm text-red-600 dark:text-red-400">{visibleSearchError}</p>
              )}
              {visibleResults.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {visibleResults.map((result) => (
                    <li key={`${result.lat},${result.lon}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlace(result);
                          setSearchResults([]);
                        }}
                        className="min-h-[44px] w-full rounded-md border border-black/[.12] px-3 py-2 text-left text-sm dark:border-white/[.18]"
                      >
                        {result.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Search results © OpenStreetMap contributors
          </p>
        </section>
      )}

      <div className="mt-auto flex justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className={`${buttonClass} disabled:opacity-40`}
        >
          Back
        </button>
        {step < 2 ? (
          <button type="button" onClick={goNext} className={buttonClass}>
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={!isComplete}
            className={`${buttonClass} disabled:opacity-40`}
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
}
