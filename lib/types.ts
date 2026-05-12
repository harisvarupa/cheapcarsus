export type FuelType = "Gasoline" | "Hybrid" | "Electric" | "Diesel" | "Plug-in Hybrid";

export type CarCondition =
  | "Excellent"
  | "Good"
  | "Fair"
  | "Project"
  | "Mechanic Special";

export type Car = {
  id: string;
  slug: string;
  title: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  price: number;
  mileage: number;
  location: string;
  transmission: string;
  drivetrain: string;
  fuelType: FuelType;
  bodyType: string;
  exteriorColor: string;
  interiorColor: string;
  vin: string;
  condition: CarCondition;
  engine: string;
  mpg: string;
  images: string[];
  pills: string[];
  features: string[];
  description: string;
  sold: boolean;
  createdAt: string;
};

export type CarFilters = {
  query: string;
  make: string;
  model: string;
  fuelType: string;
  bodyType: string;
  condition: string;
  minYear: string;
  maxYear: string;
  maxPrice: string;
  maxMileage: string;
  includeSold: boolean;
};

export type GeminiCarSuggestion = Partial<
  Pick<
    Car,
    | "title"
    | "year"
    | "make"
    | "model"
    | "trim"
    | "price"
    | "mileage"
    | "transmission"
    | "drivetrain"
    | "fuelType"
    | "bodyType"
    | "exteriorColor"
    | "interiorColor"
    | "vin"
    | "condition"
    | "engine"
    | "mpg"
    | "pills"
    | "features"
    | "description"
  >
>;
