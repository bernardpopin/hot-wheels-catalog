import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useItemForm } from "@/app/components/useItemForm";
import type { FormState } from "@/app/components/useItemForm";

const initialForm: FormState = {
  modelName: "Datsun 240Z Custom",
  carBrand: "Nissan",
  carModel: "240Z",
  carProductionYear: 1970,
  releaseYear: 2021,
  yearOnChassis: null,
  series: "Car Culture",
  color: "Orange",
  modelNumber: "HNT20",
  quantity: 1,
  priceAverage: [],
  openWindow: false,
  bigWing: false,
  frontBoltPositionOnEdge: false,
  backBoltPositionOnEdge: false,
};

function makeEvent(
  name: string,
  value: string,
  type: string,
  checked = false
): React.ChangeEvent<HTMLInputElement> {
  return {
    target: { name, value, type, checked },
  } as unknown as React.ChangeEvent<HTMLInputElement>;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe("initial state", () => {
  it("returns the provided initial form values", () => {
    const { result } = renderHook(() => useItemForm(initialForm));
    expect(result.current.form).toEqual(initialForm);
  });

  it("exposes handleChange and setForm", () => {
    const { result } = renderHook(() => useItemForm(initialForm));
    expect(typeof result.current.handleChange).toBe("function");
    expect(typeof result.current.setForm).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// handleChange — text inputs
// ---------------------------------------------------------------------------

describe("handleChange — text inputs", () => {
  it("updates a text field with the input value", () => {
    const { result } = renderHook(() => useItemForm(initialForm));

    act(() => {
      result.current.handleChange(makeEvent("modelName", "Custom Camaro", "text"));
    });

    expect(result.current.form.modelName).toBe("Custom Camaro");
  });

  it("does not mutate other fields when updating one text field", () => {
    const { result } = renderHook(() => useItemForm(initialForm));

    act(() => {
      result.current.handleChange(makeEvent("color", "Blue", "text"));
    });

    expect(result.current.form.color).toBe("Blue");
    expect(result.current.form.modelName).toBe(initialForm.modelName);
    expect(result.current.form.carBrand).toBe(initialForm.carBrand);
  });

  it("sets the value to an empty string when the field is cleared", () => {
    const { result } = renderHook(() => useItemForm(initialForm));

    act(() => {
      result.current.handleChange(makeEvent("series", "", "text"));
    });

    expect(result.current.form.series).toBe("");
  });
});

// ---------------------------------------------------------------------------
// handleChange — number inputs
// ---------------------------------------------------------------------------

describe("handleChange — number inputs", () => {
  it("converts a numeric string to a Number", () => {
    const { result } = renderHook(() => useItemForm(initialForm));

    act(() => {
      result.current.handleChange(makeEvent("releaseYear", "2024", "number"));
    });

    expect(result.current.form.releaseYear).toBe(2024);
  });

  it("converts a decimal numeric string to a Number", () => {
    const { result } = renderHook(() => useItemForm(initialForm));

    act(() => {
      result.current.handleChange(makeEvent("carProductionYear", "1969", "number"));
    });

    expect(result.current.form.carProductionYear).toBe(1969);
  });

  it("produces null when the number field is cleared (empty string)", () => {
    const { result } = renderHook(() => useItemForm(initialForm));

    act(() => {
      result.current.handleChange(makeEvent("carProductionYear", "", "number"));
    });

    expect(result.current.form.carProductionYear).toBeNull();
  });

  it("produces null for yearOnChassis when cleared", () => {
    const formWithChassis: FormState = { ...initialForm, yearOnChassis: 2005 };
    const { result } = renderHook(() => useItemForm(formWithChassis));

    act(() => {
      result.current.handleChange(makeEvent("yearOnChassis", "", "number"));
    });

    expect(result.current.form.yearOnChassis).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// handleChange — checkbox inputs
// ---------------------------------------------------------------------------

describe("handleChange — checkbox inputs", () => {
  it("sets a boolean field to true when checkbox is checked", () => {
    const { result } = renderHook(() => useItemForm(initialForm));

    act(() => {
      result.current.handleChange(makeEvent("openWindow", "", "checkbox", true));
    });

    expect(result.current.form.openWindow).toBe(true);
  });

  it("sets a boolean field to false when checkbox is unchecked", () => {
    const formWithChecked: FormState = { ...initialForm, bigWing: true };
    const { result } = renderHook(() => useItemForm(formWithChecked));

    act(() => {
      result.current.handleChange(makeEvent("bigWing", "", "checkbox", false));
    });

    expect(result.current.form.bigWing).toBe(false);
  });

  it("uses checked — not value — for checkbox fields", () => {
    const { result } = renderHook(() => useItemForm(initialForm));

    // value is "true" string, but type is checkbox — should use checked=true
    act(() => {
      result.current.handleChange(
        makeEvent("frontBoltPositionOnEdge", "true", "checkbox", true)
      );
    });

    expect(result.current.form.frontBoltPositionOnEdge).toBe(true);
  });

  it("toggles all four casting boolean flags independently", () => {
    const { result } = renderHook(() => useItemForm(initialForm));

    act(() => {
      result.current.handleChange(makeEvent("openWindow", "", "checkbox", true));
      result.current.handleChange(makeEvent("bigWing", "", "checkbox", true));
      result.current.handleChange(makeEvent("frontBoltPositionOnEdge", "", "checkbox", true));
      result.current.handleChange(makeEvent("backBoltPositionOnEdge", "", "checkbox", true));
    });

    expect(result.current.form.openWindow).toBe(true);
    expect(result.current.form.bigWing).toBe(true);
    expect(result.current.form.frontBoltPositionOnEdge).toBe(true);
    expect(result.current.form.backBoltPositionOnEdge).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// setForm — direct state replacement
// ---------------------------------------------------------------------------

describe("setForm", () => {
  it("replaces the entire form state", () => {
    const { result } = renderHook(() => useItemForm(initialForm));
    const newForm: FormState = { ...initialForm, modelName: "Ferrari F40", color: "Red" };

    act(() => {
      result.current.setForm(newForm);
    });

    expect(result.current.form).toEqual(newForm);
  });

  it("accepts a updater function", () => {
    const { result } = renderHook(() => useItemForm(initialForm));

    act(() => {
      result.current.setForm((prev) => ({ ...prev, quantity: prev.quantity + 1 }));
    });

    expect(result.current.form.quantity).toBe(initialForm.quantity + 1);
  });
});
