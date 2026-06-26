"use client";

import { useState } from "react";
import cronstrue from "cronstrue";

const defaultFields = {
  minute: "*",
  hour: "*",
  day: "*",
  month: "*",
  weekday: "*",
};

const presets = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every day at midnight", value: "0 0 * * *" },
  { label: "Every Monday at 9am", value: "0 9 * * 1" },
  { label: "Every weekday at 8am", value: "0 8 * * 1-5" },
  { label: "Every Sunday at noon", value: "0 12 * * 0" },
];

function getNextRuns(cronExpr: string, count = 5): string[] {
  try {
    const parts = cronExpr.split(" ");
    if (parts.length !== 5) return [];
    const results: string[] = [];
    const now = new Date();
    let current = new Date(now);
    current.setSeconds(0, 0);
    current.setMinutes(current.getMinutes() + 1);

    const [minute, hour, , month, weekday] = parts;

    let attempts = 0;
    while (results.length < count && attempts < 10000) {
      attempts++;
      const m = current.getMonth() + 1;
      const wd = current.getDay();
      const hr = current.getHours();
      const min = current.getMinutes();

      const matchMonth = month === "*" || parseInt(month) === m;
      const matchWeekday = weekday === "*" || weekday.split(",").includes(String(wd)) || (() => {
        if (weekday.includes("-")) {
          const [start, end] = weekday.split("-").map(Number);
          return wd >= start && wd <= end;
        }
        return false;
      })();
      const matchHour = hour === "*" || parseInt(hour) === hr;
      const matchMinute = minute === "*" || parseInt(minute) === min;

      if (matchMonth && matchWeekday && matchHour && matchMinute) {
        results.push(current.toLocaleString());
      }

      current.setMinutes(current.getMinutes() + 1);
    }
    return results;
  } catch {
    return [];
  }
}

export default function Home() {
  const [fields, setFields] = useState(defaultFields);
  const [copied, setCopied] = useState(false);

  const cronExpr = `${fields.minute} ${fields.hour} ${fields.day} ${fields.month} ${fields.weekday}`;

  let humanReadable = "";
  let isValid = true;
  try {
    humanReadable = cronstrue.toString(cronExpr);
  } catch {
    humanReadable = "Invalid cron expression";
    isValid = false;
  }

  const nextRuns = isValid ? getNextRuns(cronExpr) : [];

  const handleCopy = () => {
    navigator.clipboard.writeText(cronExpr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreset = (value: string) => {
    const parts = value.split(" ");
    setFields({
      minute: parts[0],
      hour: parts[1],
      day: parts[2],
      month: parts[3],
      weekday: parts[4],
    });
  };

  const Field = ({ label, fieldKey, placeholder }: { label: string; fieldKey: keyof typeof fields; placeholder: string }) => (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">{label}</label>
        <input
            type="text"
            value={fields[fieldKey]}
            onChange={(e) => setFields({ ...fields, [fieldKey]: e.target.value })}
            placeholder={placeholder}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-center text-lg font-mono focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>
  );

  return (
      <main className="min-h-screen bg-gray-950 text-white px-4 py-12">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-2">⏰ Cron Wizard</h1>
            <p className="text-gray-400">Build, understand, and preview cron expressions instantly</p>
          </div>

          {/* Presets */}
          <div className="mb-8">
            <p className="text-sm text-gray-400 mb-3">Quick presets:</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                  <button
                      key={p.value}
                      onClick={() => handlePreset(p.value)}
                      className="text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full px-4 py-1.5 transition-colors"
                  >
                    {p.label}
                  </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            <Field label="Minute" fieldKey="minute" placeholder="*" />
            <Field label="Hour" fieldKey="hour" placeholder="*" />
            <Field label="Day" fieldKey="day" placeholder="*" />
            <Field label="Month" fieldKey="month" placeholder="*" />
            <Field label="Weekday" fieldKey="weekday" placeholder="*" />
          </div>

          {/* Expression output */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-4 flex items-center justify-between">
            <span className="font-mono text-2xl text-blue-400">{cronExpr}</span>
            <button
                onClick={handleCopy}
                className="ml-4 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              {copied ? "✓ Copied!" : "Copy"}
            </button>
          </div>

          {/* Human readable */}
          <div className={`rounded-xl p-5 mb-6 ${isValid ? "bg-green-900/30 border border-green-700" : "bg-red-900/30 border border-red-700"}`}>
            <p className="text-sm text-gray-400 mb-1">Means:</p>
            <p className={`text-lg font-medium ${isValid ? "text-green-300" : "text-red-400"}`}>{humanReadable}</p>
          </div>

          {/* Next runs */}
          {nextRuns.length > 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <p className="text-sm text-gray-400 mb-3">Next 5 scheduled runs:</p>
                <ul className="space-y-2">
                  {nextRuns.map((run, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <span className="text-blue-400 font-mono">#{i + 1}</span>
                        <span className="text-gray-200">{run}</span>
                      </li>
                  ))}
                </ul>
              </div>
          )}

        </div>
{/* Footer */}
<div className="text-center mt-10 text-gray-600 text-sm">
  <p>Built with ❤️ and deployed on GKE | v2</p>
</div>
      </main>
  );
}