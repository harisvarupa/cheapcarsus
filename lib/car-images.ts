const commonsFile = (fileName: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=1200`;

const vehicleImages = {
  camry: [
    commonsFile("TOYOTA CAMRY (XV70) China.jpg"),
    commonsFile("TOYOTA CAMRY (XV70) China (2).jpg"),
  ],
  civic: [
    commonsFile("HONDA CIVIC SEDAN (FC,FK) China.jpg"),
    commonsFile("HONDA CIVIC SEDAN (FC,FK) China (2).jpg"),
  ],
  f150: [
    commonsFile("Ford F-150 XLT V8 SuperCrew 4x4 2014 (15396770522).jpg"),
    commonsFile("'13-'14 Ford F-150 Vermeer Canada Crew Cab.jpg"),
  ],
  malibu: [
    commonsFile("2017 Chevrolet Malibu (E2XX) front 3.25.18.jpg"),
    commonsFile("Chevrolet Malibu 2017 Interior.jpg"),
  ],
  altima: [
    commonsFile("2015 Nissan Altima 2.5 S USDM (52986603675).jpg"),
    commonsFile("2015 nissan altima back.jpg"),
  ],
  elantra: [
    commonsFile("2019 Hyundai Elantra facelift front 1.21.19.jpg"),
    commonsFile("2019 Hyundai Elantra facelift rear 1.21.19.jpg"),
  ],
  soul: [
    commonsFile("2018 Kia Soul front 5.23.18.jpg"),
    commonsFile("2018 Kia Soul rear 5.23.18.jpg"),
  ],
  crv: [
    commonsFile("2019 Honda CR-V EX i-VTEC 1.5.jpg"),
    commonsFile("Honda CR-V, GIMS 2019, Le Grand-Saconnex (GIMS0705).jpg"),
  ],
  leaf: [
    commonsFile("2021 Nissan Leaf Tekna +.jpg"),
    commonsFile("Nissan Leaf CRI 04 2021 8250.jpg"),
  ],
  accord: [
    commonsFile("2012 Honda Accord (MY12) V6 Luxury sedan (2015-07-03) 01.jpg"),
    commonsFile("2012 Honda Accord (MY12) V6 Luxury sedan (2015-07-03) 02.jpg"),
  ],
  silverado: [
    commonsFile("2013 Chevrolet Silverado 1500 LT FlexFuel Z71 4X4.jpg"),
    commonsFile("Chevrolet Silverado 1500 Hudson (Auto classique Hudson '13).JPG"),
  ],
  focus: [
    commonsFile("'15-'18 Ford Focus Hatchback Keolis.jpg"),
    commonsFile("2017 Ford Focus (LZ) RS hatchback (2018-08-31) 01.jpg"),
  ],
} satisfies Record<string, string[]>;

const heroImage = (id: string, width = 1200, height = 1100) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;

export const DEFAULT_CAR_IMAGE = vehicleImages.camry[0];
export const HERO_DEALERSHIP_IMAGE = heroImage("photo-1492144534655-ae79c964c9d7");

export function carImage(query: string, variant = 0) {
  const normalized = normalizeVehicleQuery(query);
  const match = Object.entries(vehicleImages).find(([key]) => normalized.includes(key));
  const images = match?.[1] ?? vehicleImages.camry;

  return images[variant % images.length];
}

export function resolveCarImages(images: string[] | null | undefined, fallbackQuery: string) {
  const resolved = (images ?? [])
    .filter(Boolean)
    .map((image, index) => (isLegacyUnsplashSource(image) ? carImage(fallbackQuery, index) : image));

  return resolved.length ? resolved : [carImage(fallbackQuery)];
}

function isLegacyUnsplashSource(image: string) {
  return image.includes("source.unsplash.com");
}

function normalizeVehicleQuery(query: string) {
  return query
    .toLowerCase()
    .replace(/f[-\s]?150/g, "f150")
    .replace(/cr[-\s]?v/g, "crv");
}
