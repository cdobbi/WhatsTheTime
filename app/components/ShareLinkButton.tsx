"use client";

import { useEffect, useRef, useState } from "react";
import { toShareParams } from "@/lib/time/share-params";
import type { ClassTimeInput } from "@/lib/time/types";

const CONFIRMATION_MS = 3000;

export default function ShareLinkButton({ input }: { input: ClassTimeInput }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [failedUrl, setFailedUrl] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?${toShareParams(input)}`;
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus("idle"), CONFIRMATION_MS);
    } catch {
      setFailedUrl(url);
      setStatus("failed");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copyLink}
          className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:bg-blue-400 dark:text-black dark:hover:bg-blue-300 dark:focus-visible:outline-blue-400"
        >
          Copy link
        </button>
        <span aria-live="polite" className="text-sm font-medium text-green-800 dark:text-green-300">
          {status === "copied" ? "Link copied" : ""}
        </span>
      </div>
      {status === "failed" && (
        <label className="flex flex-col gap-1 text-sm">
          Couldn&apos;t copy automatically. Copy this link:
          <input
            type="text"
            readOnly
            value={failedUrl}
            ref={(element) => element?.select()}
            onFocus={(event) => event.target.select()}
            className="w-full rounded-md border border-zinc-500 bg-white px-3 py-2 text-base text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </label>
      )}
    </div>
  );
}
