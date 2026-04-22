import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ItemFormFields from "@/app/components/ItemFormFields";
import type { FormState } from "@/app/components/useItemForm";
import type React from "react";

type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => void;

const noop: ChangeHandler = () => {};

const defaultForm: FormState = {
  modelName: "",
  carBrand: "",
  carModel: "",
  carProductionYear: null,
  releaseYear: 2024,
  yearOnChassis: null,
  series: "",
  color: "",
  modelNumber: "",
  priceAverage: "",
  openWindow: false,
  bigWing: false,
  frontBoltPositionOnEdge: false,
  backBoltPositionOnEdge: false,
};

let onChange: ChangeHandler;

beforeEach(() => {
  onChange = vi.fn() as ChangeHandler;
});

describe("ItemFormFields", () => {
  it("renders all text and number inputs", () => {
    render(<ItemFormFields form={defaultForm} onChange={noop} />);
    expect(screen.getByLabelText("Model name")).toBeInTheDocument();
    expect(screen.getByLabelText("Car brand")).toBeInTheDocument();
    expect(screen.getByLabelText("Car model")).toBeInTheDocument();
    expect(screen.getByLabelText("Year of production of the car")).toBeInTheDocument();
    expect(screen.getByLabelText("Release year")).toBeInTheDocument();
    expect(screen.getByLabelText("Year on chassis")).toBeInTheDocument();
    expect(screen.getByLabelText("Series")).toBeInTheDocument();
    expect(screen.getByLabelText("Color")).toBeInTheDocument();
    expect(screen.getByLabelText("Model number")).toBeInTheDocument();
    expect(screen.getByLabelText("Price average")).toBeInTheDocument();
  });

  it("renders all four boolean checkboxes", () => {
    render(<ItemFormFields form={defaultForm} onChange={noop} />);
    expect(screen.getByLabelText("Open window")).toBeInTheDocument();
    expect(screen.getByLabelText("Big wing")).toBeInTheDocument();
    expect(screen.getByLabelText("Front bolt position on edge")).toBeInTheDocument();
    expect(screen.getByLabelText("Back bolt position on edge")).toBeInTheDocument();
  });

  it("displays form values in text inputs", () => {
    const form: FormState = {
      ...defaultForm,
      modelName: "Datsun 240Z Custom",
      carBrand: "Nissan",
      carModel: "240Z",
      series: "Nightburnerz",
      color: "Blue",
      modelNumber: "043/250",
      priceAverage: "Premium",
    };
    render(<ItemFormFields form={form} onChange={noop} />);
    expect(screen.getByLabelText("Model name")).toHaveValue("Datsun 240Z Custom");
    expect(screen.getByLabelText("Car brand")).toHaveValue("Nissan");
    expect(screen.getByLabelText("Car model")).toHaveValue("240Z");
    expect(screen.getByLabelText("Series")).toHaveValue("Nightburnerz");
    expect(screen.getByLabelText("Color")).toHaveValue("Blue");
    expect(screen.getByLabelText("Model number")).toHaveValue("043/250");
    expect(screen.getByLabelText("Price average")).toHaveValue("Premium");
  });

  it("displays numeric year values", () => {
    const form: FormState = {
      ...defaultForm,
      carProductionYear: 1969,
      releaseYear: 2021,
      yearOnChassis: 2020,
    };
    render(<ItemFormFields form={form} onChange={noop} />);
    expect(screen.getByLabelText("Year of production of the car")).toHaveValue(1969);
    expect(screen.getByLabelText("Release year")).toHaveValue(2021);
    expect(screen.getByLabelText("Year on chassis")).toHaveValue(2020);
  });

  it("shows empty number input when carProductionYear is null", () => {
    render(<ItemFormFields form={{ ...defaultForm, carProductionYear: null }} onChange={noop} />);
    expect(screen.getByLabelText("Year of production of the car")).toHaveValue(null);
  });

  it("shows empty number input when yearOnChassis is null", () => {
    render(<ItemFormFields form={{ ...defaultForm, yearOnChassis: null }} onChange={noop} />);
    expect(screen.getByLabelText("Year on chassis")).toHaveValue(null);
  });

  it("reflects checkbox checked state from form prop", () => {
    const form: FormState = {
      ...defaultForm,
      openWindow: true,
      bigWing: false,
      frontBoltPositionOnEdge: true,
      backBoltPositionOnEdge: false,
    };
    render(<ItemFormFields form={form} onChange={noop} />);
    expect(screen.getByLabelText("Open window")).toBeChecked();
    expect(screen.getByLabelText("Big wing")).not.toBeChecked();
    expect(screen.getByLabelText("Front bolt position on edge")).toBeChecked();
    expect(screen.getByLabelText("Back bolt position on edge")).not.toBeChecked();
  });

  it("reflects all checkboxes unchecked when all booleans are false", () => {
    render(<ItemFormFields form={defaultForm} onChange={noop} />);
    expect(screen.getByLabelText("Open window")).not.toBeChecked();
    expect(screen.getByLabelText("Big wing")).not.toBeChecked();
    expect(screen.getByLabelText("Front bolt position on edge")).not.toBeChecked();
    expect(screen.getByLabelText("Back bolt position on edge")).not.toBeChecked();
  });

  it("calls onChange when a text input changes", async () => {
    render(<ItemFormFields form={defaultForm} onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Model name"), "a");
    expect(onChange).toHaveBeenCalled();
  });

  it("calls onChange when a number input changes", async () => {
    render(<ItemFormFields form={defaultForm} onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Release year"), "0");
    expect(onChange).toHaveBeenCalled();
  });

  it("calls onChange when a checkbox is clicked", async () => {
    render(<ItemFormFields form={defaultForm} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText("Big wing"));
    expect(onChange).toHaveBeenCalled();
  });

  it("modelName and releaseYear inputs are required", () => {
    render(<ItemFormFields form={defaultForm} onChange={noop} />);
    expect(screen.getByLabelText("Model name")).toBeRequired();
    expect(screen.getByLabelText("Release year")).toBeRequired();
  });

  it("optional text fields are not required", () => {
    render(<ItemFormFields form={defaultForm} onChange={noop} />);
    expect(screen.getByLabelText("Car brand")).not.toBeRequired();
    expect(screen.getByLabelText("Car model")).not.toBeRequired();
    expect(screen.getByLabelText("Series")).not.toBeRequired();
    expect(screen.getByLabelText("Color")).not.toBeRequired();
    expect(screen.getByLabelText("Model number")).not.toBeRequired();
    expect(screen.getByLabelText("Price average")).not.toBeRequired();
  });

  it("nullable year fields are not required", () => {
    render(<ItemFormFields form={defaultForm} onChange={noop} />);
    expect(screen.getByLabelText("Year of production of the car")).not.toBeRequired();
    expect(screen.getByLabelText("Year on chassis")).not.toBeRequired();
  });
});
