"use client";

import type { FormState } from "@/app/components/useItemForm";

const inputClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400";

const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

const checkboxFields: { name: keyof FormState; label: string }[] = [
  { name: "openWindow", label: "Open window" },
  { name: "bigWing", label: "Big wing" },
  { name: "frontBoltPositionOnEdge", label: "Front bolt position on edge" },
  { name: "backBoltPositionOnEdge", label: "Back bolt position on edge" },
];

export default function ItemFormFields({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <label htmlFor="modelName" className={labelClass}>
          Model name
        </label>
        <input
          id="modelName"
          type="text"
          name="modelName"
          value={form.modelName}
          onChange={onChange}
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="carBrand" className={labelClass}>
          Car brand
        </label>
        <input
          id="carBrand"
          type="text"
          name="carBrand"
          value={form.carBrand}
          onChange={onChange}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="carModel" className={labelClass}>
          Car model
        </label>
        <input
          id="carModel"
          type="text"
          name="carModel"
          value={form.carModel}
          onChange={onChange}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="carProductionYear" className={labelClass}>
          Year of production of the car
        </label>
        <input
          id="carProductionYear"
          type="number"
          name="carProductionYear"
          value={form.carProductionYear ?? ""}
          onChange={onChange}
          min={1880}
          max={2030}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="releaseYear" className={labelClass}>
          Release year
        </label>
        <input
          id="releaseYear"
          type="number"
          name="releaseYear"
          value={form.releaseYear}
          onChange={onChange}
          required
          min={1968}
          max={2100}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="yearOnChassis" className={labelClass}>
          Year on chassis
        </label>
        <input
          id="yearOnChassis"
          type="number"
          name="yearOnChassis"
          value={form.yearOnChassis ?? ""}
          onChange={onChange}
          min={1968}
          max={2100}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="series" className={labelClass}>
          Series
        </label>
        <input
          id="series"
          type="text"
          name="series"
          value={form.series}
          onChange={onChange}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="color" className={labelClass}>
          Color
        </label>
        <input
          id="color"
          type="text"
          name="color"
          value={form.color}
          onChange={onChange}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="modelNumber" className={labelClass}>
          Model number
        </label>
        <input
          id="modelNumber"
          type="text"
          name="modelNumber"
          value={form.modelNumber}
          onChange={onChange}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="priceRange" className={labelClass}>
          Price range
        </label>
        <input
          id="priceRange"
          type="text"
          name="priceRange"
          value={form.priceRange}
          onChange={onChange}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-3">
        {checkboxFields.map(({ name, label }) => (
          <label key={name} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name={name}
              checked={form[name] as boolean}
              onChange={onChange}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 dark:accent-zinc-100"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
          </label>
        ))}
      </div>
    </>
  );
}
