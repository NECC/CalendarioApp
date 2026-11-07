"use client";
// Reminders switch at the top of the filters. Reminders turn on by themselves
// when a test is starred; this is where they can be turned off.
import type { PushControls } from "@/hooks/usePushNotifications";

interface Props {
  push: PushControls;
}

function BellIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function NotificationSettings({ push }: Props) {
  const { status, busy, message, syncError, enable, disable } = push;

  let description: React.ReactNode;
  switch (status) {
    case "ios-not-installed":
      description = (
        <>
          On iPhone, install the app first: tap <b>Share</b>, then <b>Add to Home Screen</b>, and open it from the icon.
        </>
      );
      break;
    case "unsupported":
      description = "This browser does not support notifications. Try Chrome, Edge or Firefox.";
      break;
    case "denied":
      description = "You blocked notifications. To allow them, change the permission in your browser or phone settings.";
      break;
    case "on":
      description = (
        <>
          You get a reminder <b>every day at 10:00</b> for starred tests, from one week before
          until the day of the test.
        </>
      );
      break;
    default:
      description =
        "Off. Turn them on to get a reminder every day at 10:00 for starred tests, from one week before.";
  }

  const canToggle = status === "on" || status === "off";

  return (
    <div className="mb-4 shrink-0 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className={status === "on" ? "text-accent" : "text-muted-foreground"}>
          <BellIcon />
        </span>
        <span className="flex-1 font-bold text-foreground">Test reminders</span>

        {canToggle && (
          <button
            role="switch"
            aria-checked={status === "on"}
            aria-label="Test reminders"
            disabled={busy}
            onClick={status === "on" ? disable : enable}
            className={`relative w-11 h-6 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              status === "on" ? "bg-accent" : "bg-foreground/20"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                status === "on" ? "translate-x-5" : ""
              }`}
            />
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{description}</p>

      {(syncError || message) && (
        <p role="status" className="mt-2 text-xs font-medium text-foreground">
          {syncError || message}
        </p>
      )}
    </div>
  );
}
