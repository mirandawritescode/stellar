"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ArchGlyph from "@/components/ArchGlyph";
import type { GeocodeResult } from "@/lib/geocode";
import { isBirthTimeComplete, isValidBirthDate, TIME_WINDOWS } from "@/lib/onboarding";
import { saveBirthData } from "@/lib/storage/birthData";
import type { ApproxWindow, BirthData, TimeAccuracy } from "@/lib/types";

const MIN_PLACE_QUERY_LENGTH = 3;
const PLACE_SEARCH_DEBOUNCE_MS = 500;

const MIN_DATE = "1900-01-01";
const TODAY = new Date().toISOString().slice(0, 10);

export default function OnboardingPage() {
  const router = useRouter();
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
  // The query string the most recently completed search was for, so a "no
  // results" message only shows for the query it actually answers, not a
  // stale one left over while the next search is still debouncing.
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null);

  const dateValid = isValidBirthDate(date, TODAY);
  const timeValid = isBirthTimeComplete(timeAccuracy, time, approxWindow);
  const trimmedQuery = placeQuery.trim();
  const placeQueryLongEnough = trimmedQuery.length >= MIN_PLACE_QUERY_LENGTH;
  const visibleResults = placeQueryLongEnough ? searchResults : [];
  const visibleSearchError = placeQueryLongEnough ? searchError : null;
  const noResultsFound =
    placeQueryLongEnough &&
    !isSearching &&
    !visibleSearchError &&
    searchedQuery === trimmedQuery &&
    visibleResults.length === 0;
  const selectedWindow = TIME_WINDOWS.find((w) => w.key === approxWindow);
  const isComplete = dateValid && timeValid && selectedPlace !== null;

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
        .then((results) => {
          setSearchResults(results);
          setSearchedQuery(query);
        })
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

  function handleSubmit() {
    setTouched(true);
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
    <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center p-6">
      <div className="arch-card flex flex-col gap-6">
        <ArchGlyph />

        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="heading-display text-xl">Let&apos;s chart your sky</h1>
          <p className="text-muted text-sm">Three quick things, then we&apos;ll read your chart.</p>
        </div>

        <div className="field-group flex flex-col gap-2">
          <label htmlFor="birth-date" className="section-label">
            Birth date
          </label>
          <input
            id="birth-date"
            type="date"
            value={date}
            min={MIN_DATE}
            max={TODAY}
            onChange={(e) => setDate(e.target.value)}
            className="field"
          />
          {touched && !dateValid && (
            <p className="text-error text-sm">Enter a date between Jan 1, 1900 and today.</p>
          )}
        </div>

        <div className="field-group flex flex-col gap-2">
          <label className="section-label">Birth time</label>
          <p className="text-muted text-xs">Your birth certificate usually has it.</p>
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Birth time accuracy</legend>
            <label className="flex items-center gap-2 text-sm">
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
                className="field ml-7 max-w-[160px]"
              />
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="timeAccuracy"
                checked={timeAccuracy === "approximate"}
                onChange={() => setTimeAccuracy("approximate")}
              />
              Roughly
            </label>
            {timeAccuracy === "approximate" && (
              <>
                <div className="window-picker">
                  {TIME_WINDOWS.map((w) => (
                    <button
                      key={w.key}
                      type="button"
                      onClick={() => setApproxWindow(w.key)}
                      aria-pressed={approxWindow === w.key}
                      className={`window-pill ${approxWindow === w.key ? "selected" : ""}`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
                {selectedWindow && (
                  <p className="window-range">
                    <strong>{selectedWindow.label}</strong> &middot; {selectedWindow.range}
                  </p>
                )}
              </>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="timeAccuracy"
                checked={timeAccuracy === "unknown"}
                onChange={() => setTimeAccuracy("unknown")}
              />
              I don&apos;t know
            </label>
            {timeAccuracy === "unknown" && (
              <p className="text-muted ml-7 text-xs italic">
                No worries &mdash; we&apos;ll skip your rising sign and houses, and say so.
              </p>
            )}
          </fieldset>
          {touched && !timeValid && (
            <p className="text-error text-sm">
              {timeAccuracy === "exact"
                ? "Enter a time, or choose a different option."
                : "Pick a window, or choose a different option."}
            </p>
          )}
        </div>

        <div className="field-group flex flex-col gap-2">
          <label htmlFor="birth-place" className="section-label">
            Birth place
          </label>

          {selectedPlace ? (
            <div className="glass-card flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span>{selectedPlace.name}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlace(null);
                  setPlaceQuery("");
                }}
                className="text-accent text-sm font-medium underline"
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
                className="field"
              />
              {placeQueryLongEnough && isSearching && <p className="text-muted text-sm">Searching...</p>}
              {visibleSearchError && <p className="text-error text-sm">{visibleSearchError}</p>}
              {noResultsFound && <p className="text-muted text-sm">No places found. Try a different spelling.</p>}
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
                        className="glass-card min-h-[44px] w-full px-3 py-2 text-left text-sm"
                      >
                        {result.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <p className="text-muted text-xs">Search results © OpenStreetMap contributors</p>
          {touched && !selectedPlace && <p className="text-error text-sm">Choose a place from the list.</p>}
        </div>

        <button type="button" onClick={handleSubmit} className="btn btn-primary">
          Reveal my chart
        </button>
      </div>
    </div>
  );
}
