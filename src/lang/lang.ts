import base from "./base";

// English is in the first load. The other languages load when they are chosen (see store/lang.ts).
export default {
  // shipped: offered in the language picker for 7.0. The others are kept, and hidden until they are complete (F6).
  en: {
    label: "English",
    shipped: true,
    lang: base,
  },
  it: {
    label: "Italian",
    shipped: true,
    load: () => import("./it"),
  },
  de: {
    label: "German",
    shipped: false,
    load: () => import("./de"),
  },
  nl: {
    label: "Dutch",
    shipped: true,
    load: () => import("./nl"),
  },
  zhcn: {
    label: "Simplified Chinese",
    shipped: false,
    load: () => import("./zh-cn"),
  },
  test: {
    label: "Tester",
    shipped: false,
    load: () => import("./test"),
  },
};
