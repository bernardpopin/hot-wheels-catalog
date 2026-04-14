"use client";

import { useRef } from "react";

export default function RemoveButton({
  action,
}: {
  action: () => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-full border border-red-200 px-4 py-1.5 text-sm font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:border-red-700 dark:hover:bg-red-950"
      >
        Remove
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-lg backdrop:bg-black/40 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Are you sure you want to remove this car?
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
          <form action={action}>
            <button
              type="submit"
              className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
            >
              Remove
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
