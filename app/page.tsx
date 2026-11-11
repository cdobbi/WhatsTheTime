import { Suspense } from "react";
import ClassTimeConverter from "./components/ClassTimeConverter";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-10 font-sans text-zinc-900 sm:py-16 dark:bg-black dark:text-zinc-50">
      <header className="w-full max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Whats the Time
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-zinc-700 dark:text-zinc-300">
          Enter your Religion class time in your teacher&apos;s time zone to see when it
          happens where you live, including daylight saving changes.
        </p>
      </header>
      <main className="mt-8 w-full max-w-3xl">
        <Suspense fallback={<p>Loading converter…</p>}>
          <ClassTimeConverter />
        </Suspense>
      </main>
    </div>
  );
}
